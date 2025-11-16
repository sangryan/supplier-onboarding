const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

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
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
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

    // Generate OTP code (6 alphanumeric characters)
    const { generateOTP, sendOTPEmail } = require('../utils/email');
    const otpCode = generateOTP();
    const otpExpire = Date.now() + 600000; // 10 minutes

    // If user exists but not verified, update with new OTP
    let user;
    if (existingUser && !existingUser.isEmailVerified) {
      existingUser.firstName = firstName;
      existingUser.lastName = lastName;
      existingUser.password = password;
      existingUser.phone = phone;
      existingUser.otpCode = otpCode;
      existingUser.otpExpire = otpExpire;
      await existingUser.save();
      user = existingUser;
    } else {
      // Create new user
      user = await User.create({
        firstName,
        lastName,
        email: email.toLowerCase(),
        password,
        phone,
        role: 'supplier',
        otpCode,
        otpExpire,
        isEmailVerified: false
      });
    }

    // Send OTP email
    try {
      await sendOTPEmail({
        email: user.email,
        otpCode: otpCode,
        userName: `${user.firstName} ${user.lastName}`
      });
      console.log(`✅ OTP email sent to ${user.email}`);
    } catch (emailError) {
      console.error('❌ Failed to send OTP email:', emailError.message);
      // Still return success but log the error
    }

    // Don't generate token yet - user must verify email first
    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your email with the OTP code sent to your email.',
      requiresVerification: true,
      email: user.email
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

    // Check if email is verified - only required for suppliers
    if (user.role === 'supplier' && !user.isEmailVerified) {
      // Generate new OTP and send email
      const { generateOTP, sendOTPEmail } = require('../utils/email');
      const otpCode = generateOTP();
      const otpExpire = Date.now() + 600000; // 10 minutes
      
      user.otpCode = otpCode;
      user.otpExpire = otpExpire;
      await user.save();

      // Send OTP email
      try {
        await sendOTPEmail({
          email: user.email,
          otpCode: otpCode,
          userName: `${user.firstName} ${user.lastName}`
        });
        console.log(`✅ OTP email sent to ${user.email} for login`);
      } catch (emailError) {
        console.error('❌ Failed to send OTP email:', emailError.message);
      }

      return res.status(200).json({
        success: false,
        requiresVerification: true,
        message: 'Please verify your email. An OTP code has been sent to your email.',
        email: user.email
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: user.toPublicJSON()
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
        userName: `${user.firstName} ${user.lastName}`
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

    // Check if already verified
    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified'
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

    // Verify email and clear OTP
    user.isEmailVerified = true;
    user.otpCode = undefined;
    user.otpExpire = undefined;
    await user.save();

    // Generate token now that email is verified
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Email verified successfully',
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

    // Check if already verified
    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified'
      });
    }

    // Generate new OTP
    const { generateOTP, sendOTPEmail } = require('../utils/email');
    const otpCode = generateOTP();
    const otpExpire = Date.now() + 600000; // 10 minutes

    user.otpCode = otpCode;
    user.otpExpire = otpExpire;
    await user.save();

    // Send OTP email
    try {
      await sendOTPEmail({
        email: user.email,
        otpCode: otpCode,
        userName: `${user.firstName} ${user.lastName}`
      });
      console.log(`✅ OTP email resent to ${user.email}`);
    } catch (emailError) {
      console.error('❌ Failed to send OTP email:', emailError.message);
      // Still return success (security best practice)
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

module.exports = router;

