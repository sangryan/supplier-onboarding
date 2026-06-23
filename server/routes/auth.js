const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { logAction } = require('../utils/auditLogger');
const { createNotification } = require('../utils/notifications');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @route   POST /api/auth/register
// @desc    Register new supplier user
// @access  Public
router.post('/register', [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').optional().trim(),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('phone').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { firstName, lastName, email, password, phone } = req.body;

    // Check if user exists but email not verified (allow re-registration)
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser && existingUser.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    let user;
    if (existingUser && !existingUser.isEmailVerified) {
      existingUser.firstName = firstName;
      existingUser.lastName = lastName;
      existingUser.password = password;
      existingUser.phone = phone;
      existingUser.isEmailVerified = true;
      existingUser.supplierApprovalStatus = 'profile_incomplete';
      await existingUser.save();
      user = existingUser;
    } else {
      user = await User.create({
        firstName,
        lastName,
        email: email.toLowerCase(),
        password,
        phone,
        role: 'supplier',
        isEmailVerified: true,
        supplierApprovalStatus: 'profile_incomplete'
      });
    }

    // Notify procurement of new supplier registration
    try {
      const procurementUsers = await User.find({ role: 'procurement', isActive: true });
      const supplierName = [user.firstName, user.lastName].filter(Boolean).join(' ');
      for (const pu of procurementUsers) {
        await createNotification({
          recipient: pu._id,
          type: 'new_task_assigned',
          title: 'New Supplier Registration',
          message: `${supplierName} (${user.email}) has registered and is pending review.`,
          relatedEntity: { entityType: 'user', entityId: user._id },
          actionUrl: '/dashboard'
        });
      }
    } catch (notifErr) {
      console.error('Failed to notify procurement of new supplier:', notifErr.message);
    }

    // Issue token immediately — TOTP setup on first login completes onboarding
    const token = generateToken(user._id);
    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      token,
      user: user.toPublicJSON()
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user account'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password } = req.body;
    
    console.log('Login attempt:', {
      email,
      emailLength: email?.length,
      passwordLength: password?.length,
      emailLower: email?.toLowerCase(),
    });

    // Find user
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    
    if (!user) {
      console.log('User not found for email:', email.toLowerCase().trim());
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    console.log('User found:', {
      id: user._id,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    });

    // Check if user is active
    if (!user.isActive) {
      console.log('User account is deactivated');
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Check password
    console.log('Comparing password...');
    const isMatch = await user.comparePassword(password);
    console.log('Password match:', isMatch);
    
    if (!isMatch) {
      console.log('Password does not match!');
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // TOTP: if already set up, prompt for code
    if (user.totpEnabled) {
      return res.json({
        success: true,
        requiresTOTP: true,
        email: user.email
      });
    }

    // TOTP: first time — generate secret and QR code
    const speakeasy = require('speakeasy');
    const QRCode = require('qrcode');
    const companyName = process.env.COMPANY_NAME || 'Supplier Portal';
    const secret = speakeasy.generateSecret({
      name: `${companyName} (${user.email})`,
      issuer: companyName,
      length: 20
    });
    user.totpSecret = secret.base32;
    await user.save();

    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    return res.json({
      success: true,
      requiresTOTPSetup: true,
      email: user.email,
      qrCode,
      secret: secret.base32
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('supplier');
    
    res.json({
      success: true,
      user: user.toPublicJSON()
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user data'
    });
  }
});

// @route   PUT /api/auth/update-profile
// @desc    Update user profile
// @access  Private
router.put('/update-profile', protect, [
  body('firstName').optional().trim(),
  body('lastName').optional().trim(),
  body('phone').optional().trim()
], async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;
    
    const updateFields = {};
    if (firstName) updateFields.firstName = firstName;
    if (lastName) updateFields.lastName = lastName;
    if (phone) updateFields.phone = phone;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateFields,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      user: user.toPublicJSON()
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile'
    });
  }
});

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', protect, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');
    
    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    user.mustChangePassword = false;
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password'
    });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Request password reset
// @access  Public
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Valid email is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });

    // Don't reveal if user exists or not (security best practice)
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // Generate reset token
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Set reset token and expiration (1 hour)
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpire = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send email
    const { sendPasswordResetEmail } = require('../utils/email');
    let emailSent = false;
    try {
      await sendPasswordResetEmail({
        email: user.email,
        resetToken: resetToken,
        userName: [user.firstName, user.lastName].filter(Boolean).join(" ")
      });
      emailSent = true;
      console.log(`✅ Password reset email sent successfully to ${user.email}`);
    } catch (emailError) {
      emailSent = false;
      console.error('❌ FAILED to send password reset email to', user.email);
      console.error('   Error:', emailError.message);
      console.error('   Error code:', emailError.code);
      console.error('   Error command:', emailError.command);
      console.error('   Error response:', emailError.response);
      console.error('   Full error:', JSON.stringify(emailError, null, 2));
      console.error('   This may be due to:');
      console.error('   1. Missing EMAIL_USER or EMAIL_PASSWORD environment variables');
      console.error('   2. Incorrect SMTP credentials');
      console.error('   3. Gmail requires App Password (not regular password)');
      console.error('   4. SMTP server connection issues');
      console.error('   5. Firewall blocking SMTP port');
      // Still return success to user (security best practice - don't reveal if email was sent)
      // But log the error for debugging
    }
    
    // Log summary for monitoring
    if (!emailSent) {
      console.error(`⚠️  WARNING: Password reset requested for ${user.email} but email was NOT sent`);
      console.error('   User will not receive the reset link. Check email configuration.');
    }

    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing password reset request'
    });
  }
});

// @route   POST /api/auth/reset-password/:token
// @desc    Reset password with token
// @access  Public
router.post('/reset-password/:token', [
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { token } = req.params;
    const { password } = req.body;

    // Hash the token to compare with stored hash
    const crypto = require('crypto');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: tokenHash,
      resetPasswordExpire: { $gt: Date.now() }
    }).select('+password');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password'
    });
  }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP code and activate account
// @access  Public
router.post('/verify-otp', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('otpCode').isLength({ min: 6, max: 6 }).withMessage('OTP code must be 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, otpCode } = req.body;

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if OTP exists and not expired
    if (!user.otpCode || !user.otpExpire) {
      return res.status(400).json({
        success: false,
        message: 'No OTP code found. Please request a new one.'
      });
    }

    if (Date.now() > user.otpExpire) {
      return res.status(400).json({
        success: false,
        message: 'OTP code has expired. Please request a new one.'
      });
    }

    // Verify OTP (case-insensitive)
    if (user.otpCode.toUpperCase() !== otpCode.toUpperCase()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP code'
      });
    }

    // Clear OTP; only set email-verified / supplier status on first verification
    const isFirstVerification = !user.isEmailVerified;
    if (isFirstVerification) {
      user.isEmailVerified = true;
      if (user.role === 'supplier') {
        user.supplierApprovalStatus = 'pending';
      }
    }
    user.otpCode = undefined;
    user.otpExpire = undefined;
    user.lastLogin = new Date();
    await user.save();

    // Notify procurement of new supplier registration (non-blocking)
    if (isFirstVerification && user.role === 'supplier') {
      try {
        const procurementUsers = await User.find({ role: 'procurement', isActive: true });
        const supplierName = [user.firstName, user.lastName].filter(Boolean).join(' ');
        for (const pu of procurementUsers) {
          await createNotification({
            recipient: pu._id,
            type: 'new_task_assigned',
            title: 'New Supplier Registration',
            message: `${supplierName} (${user.email}) has registered and is pending review.`,
            relatedEntity: { entityType: 'user', entityId: user._id },
            actionUrl: '/dashboard'
          });
        }
      } catch (notifErr) {
        console.error('Failed to notify procurement of new supplier:', notifErr.message);
      }
    }

    // Generate token after OTP verified
    const token = generateToken(user._id);

    // Audit log
    req.user = user;
    await logAction(req, 'USER_LOGIN', 'User', user._id, [user.firstName, user.lastName].filter(Boolean).join(' '), { role: user.role });
    req.user = null;

    res.json({
      success: true,
      message: 'OTP verified successfully',
      token,
      user: user.toPublicJSON()
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying OTP'
    });
  }
});

// @route   POST /api/auth/resend-otp
// @desc    Resend OTP code
// @access  Public
router.post('/resend-otp', [
  body('email').isEmail().withMessage('Valid email is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email } = req.body;

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      // Don't reveal if user exists (security best practice)
      return res.json({
        success: true,
        message: 'If an account with that email exists, an OTP code has been sent.'
      });
    }

    res.json({
      success: true,
      message: 'If an account with that email exists, an OTP code has been sent.'
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resending OTP'
    });
  }
});

// @route   POST /api/auth/setup-totp
// @desc    Confirm first TOTP code, enable TOTP, return backup codes + token
// @access  Public
router.post('/setup-totp', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('totpCode').isLength({ min: 6, max: 6 }).withMessage('Code must be 6 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, totpCode } = req.body;
    const speakeasy = require('speakeasy');
    const bcrypt = require('bcryptjs');
    const crypto = require('crypto');

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.totpSecret) {
      return res.status(400).json({ success: false, message: 'Setup session expired. Please log in again.' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.totpSecret,
      encoding: 'base32',
      token: totpCode,
      window: 1
    });

    if (!verified) {
      return res.status(400).json({ success: false, message: 'Invalid code. Make sure your device time is correct.' });
    }

    // Generate 8 backup codes
    const backupCodes = Array.from({ length: 8 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );
    const hashedCodes = await Promise.all(backupCodes.map(c => bcrypt.hash(c, 10)));

    user.totpEnabled = true;
    user.totpBackupCodes = hashedCodes;
    user.lastLogin = new Date();

    // First verification also marks email as verified (for suppliers)
    if (!user.isEmailVerified) {
      user.isEmailVerified = true;
      if (user.role === 'supplier') user.supplierApprovalStatus = 'pending';
    }
    await user.save();

    const token = generateToken(user._id);
    req.user = user;
    await logAction(req, 'USER_LOGIN', 'User', user._id, [user.firstName, user.lastName].filter(Boolean).join(' '), { role: user.role, method: 'totp_setup' });
    req.user = null;

    res.json({
      success: true,
      token,
      user: user.toPublicJSON(),
      backupCodes
    });
  } catch (error) {
    console.error('Setup TOTP error:', error);
    res.status(500).json({ success: false, message: 'Error setting up authenticator' });
  }
});

// @route   POST /api/auth/verify-totp
// @desc    Verify TOTP code (or backup code) and issue token
// @access  Public
router.post('/verify-totp', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('totpCode').notEmpty().withMessage('Code is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, totpCode } = req.body;
    const speakeasy = require('speakeasy');
    const bcrypt = require('bcryptjs');

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.totpEnabled) {
      return res.status(400).json({ success: false, message: 'Authenticator not set up for this account.' });
    }

    // Try TOTP code first
    let verified = speakeasy.totp.verify({
      secret: user.totpSecret,
      encoding: 'base32',
      token: totpCode,
      window: 1
    });

    // Fall back to backup codes
    if (!verified && user.totpBackupCodes?.length) {
      for (let i = 0; i < user.totpBackupCodes.length; i++) {
        const match = await bcrypt.compare(totpCode.toUpperCase(), user.totpBackupCodes[i]);
        if (match) {
          user.totpBackupCodes.splice(i, 1); // each backup code is single-use
          verified = true;
          break;
        }
      }
    }

    if (!verified) {
      return res.status(400).json({ success: false, message: 'Invalid code.' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);
    req.user = user;
    await logAction(req, 'USER_LOGIN', 'User', user._id, [user.firstName, user.lastName].filter(Boolean).join(' '), { role: user.role, method: 'totp' });
    req.user = null;

    res.json({ success: true, token, user: user.toPublicJSON() });
  } catch (error) {
    console.error('Verify TOTP error:', error);
    res.status(500).json({ success: false, message: 'Error verifying code' });
  }
});

module.exports = router;
