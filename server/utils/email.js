const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Create email transporter
let transporter = null;
let transporterVerified = false;
let transporterError = null;
let transporterVerifying = false;

if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
  try {
    console.log('📧 Initializing email transporter...');
    console.log('   Host:', process.env.EMAIL_HOST || 'smtp.gmail.com');
    console.log('   Port:', process.env.EMAIL_PORT || 587);
    console.log('   User:', process.env.EMAIL_USER);
    
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      tls: {
        rejectUnauthorized: false // Allow self-signed certificates
      },
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000, // 10 seconds
      socketTimeout: 10000, // 10 seconds
      debug: process.env.NODE_ENV === 'development', // Enable debug output in development
      logger: process.env.NODE_ENV === 'development' // Enable logging in development
    });
    
    // Verify transporter configuration asynchronously
    transporterVerifying = true;
    transporter.verify((error, success) => {
      transporterVerifying = false;
      if (error) {
        console.error('❌ Email transporter verification FAILED:', error.message);
        console.error('   Error code:', error.code);
        console.error('   Error command:', error.command);
        console.error('   This means emails will NOT be sent until this is fixed');
        transporterVerified = false;
        transporterError = {
          message: error.message,
          code: error.code,
          command: error.command
        };
      } else {
        console.log('✅ Email transporter verified and ready to send emails');
        transporterVerified = true;
        transporterError = null;
      }
    });
  } catch (error) {
    console.error('❌ Email transporter configuration error:', error.message);
    console.error('   Full error:', error);
    transporterVerified = false;
    transporterError = {
      message: error.message,
      type: 'configuration_error'
    };
  }
} else {
  console.error('❌ Email configuration MISSING:');
  console.error('   EMAIL_USER:', process.env.EMAIL_USER ? '✅ SET' : '❌ NOT SET');
  console.error('   EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✅ SET' : '❌ NOT SET');
  console.error('   Password reset emails will NOT be sent');
  console.error('   Please set EMAIL_USER and EMAIL_PASSWORD in your environment variables');
  transporterVerified = false;
}

/**
 * Send password reset email
 * @param {Object} options - Email options
 * @param {String} options.email - Recipient email
 * @param {String} options.resetToken - Password reset token
 * @param {String} options.userName - User's name
 * @returns {Promise<void>}
 */
exports.sendPasswordResetEmail = async ({ email, resetToken, userName }) => {
  if (!transporter) {
    const errorMsg = 'Email transporter not configured. Password reset email not sent.';
    console.error('❌', errorMsg);
    console.error('   EMAIL_USER:', process.env.EMAIL_USER ? 'SET' : 'NOT SET');
    console.error('   EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? 'SET' : 'NOT SET');
    console.error('   Please set EMAIL_USER and EMAIL_PASSWORD environment variables');
    throw new Error(errorMsg);
  }
  
  // Warn if transporter hasn't been verified yet
  if (!transporterVerified) {
    console.warn('⚠️  Email transporter not yet verified. Attempting to send anyway...');
  }

  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

  // SendGrid requires a verified sender email
  const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  if (!fromEmail) {
    throw new Error('EMAIL_FROM or EMAIL_USER must be set for SendGrid');
  }

  const mailOptions = {
    from: `"${process.env.COMPANY_NAME || 'Supplier Onboarding Portal'}" <${fromEmail}>`,
    to: email,
    subject: 'Password Reset Request - Supplier Onboarding Portal',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #333; margin: 0 0 10px 0;">Password Reset Request</h2>
        </div>
        
        <div style="color: #666; font-size: 16px; line-height: 1.6;">
          <p>Hello ${userName || 'User'},</p>
          
          <p>We received a request to reset your password for your Supplier Onboarding Portal account.</p>
          
          <p>Click the button below to reset your password:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="display: inline-block; padding: 14px 28px; background-color: #578A18; 
                      color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;
                      font-size: 16px;">
              Reset Password
            </a>
          </div>
          
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #1976d2; background-color: #f5f5f5; padding: 10px; border-radius: 4px;">
            ${resetUrl}
          </p>
          
          <p style="color: #d32f2f; font-weight: 600;">This link will expire in 1 hour.</p>
          
          <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
          
          <p>Best regards,<br>
          ${process.env.COMPANY_NAME || 'Supplier Onboarding Portal'} Team</p>
        </div>
        
        <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px; text-align: center;">
          This is an automated message. Please do not reply to this email.
        </p>
      </div>
    `
  };

  try {
    console.log(`📧 Attempting to send password reset email...`);
    console.log(`   From: ${fromEmail}`);
    console.log(`   To: ${email}`);
    console.log(`   Subject: Password Reset Request`);
    
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent successfully to ${email}`);
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Response: ${info.response || 'No response'}`);
    return info;
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    console.error('   Error message:', error.message);
    console.error('   Error code:', error.code);
    console.error('   Error command:', error.command);
    console.error('   Error response:', error.response);
    console.error('   Error responseCode:', error.responseCode);
    console.error('   Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    // Check for SendGrid-specific errors
    if (error.response) {
      console.error('   SendGrid response:', error.response);
    }
    if (error.responseCode) {
      console.error(`   HTTP Status: ${error.responseCode}`);
      if (error.responseCode === 403) {
        console.error('   ⚠️  403 Forbidden: Check if sender email is verified in SendGrid');
      }
      if (error.responseCode === 401) {
        console.error('   ⚠️  401 Unauthorized: Check API key is correct');
      }
    }
    
    throw error;
  }
};

/**
 * Generate password reset token
 * @returns {String} - Reset token
 */
exports.generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Generate 6-character alphanumeric OTP code
 * @returns {String} - OTP code (6 characters, mix of numbers and letters)
 */
exports.generateOTP = () => {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let otp = '';
  for (let i = 0; i < 6; i++) {
    otp += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return otp;
};

/**
 * Send OTP verification email
 * @param {Object} options - Email options
 * @param {String} options.email - Recipient email
 * @param {String} options.otpCode - OTP verification code
 * @param {String} options.userName - User's name
 * @returns {Promise<void>}
 */
exports.sendOTPEmail = async ({ email, otpCode, userName }) => {
  if (!transporter) {
    const errorMsg = 'Email transporter not configured. OTP email not sent.';
    console.error('❌', errorMsg);
    console.error('   EMAIL_USER:', process.env.EMAIL_USER ? 'SET' : 'NOT SET');
    console.error('   EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? 'SET' : 'NOT SET');
    console.error('   Please set EMAIL_USER and EMAIL_PASSWORD environment variables');
    throw new Error(errorMsg);
  }
  
  // Warn if transporter hasn't been verified yet
  if (!transporterVerified) {
    console.warn('⚠️  Email transporter not yet verified. Attempting to send anyway...');
  }

  // SendGrid requires a verified sender email
  const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  if (!fromEmail) {
    throw new Error('EMAIL_FROM or EMAIL_USER must be set for SendGrid');
  }

  const mailOptions = {
    from: `"${process.env.COMPANY_NAME || 'Supplier Onboarding Portal'}" <${fromEmail}>`,
    to: email,
    subject: 'Email Verification Code - Supplier Onboarding Portal',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #333; margin: 0 0 10px 0;">Email Verification</h2>
        </div>
        
        <div style="color: #666; font-size: 16px; line-height: 1.6;">
          <p>Hello ${userName || 'User'},</p>
          
          <p>Thank you for registering with the Supplier Onboarding Portal. To complete your registration, please verify your email address using the code below:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="display: inline-block; padding: 20px 40px; background-color: #f0f0f0; 
                        border-radius: 8px; border: 2px dashed #578A18;">
              <div style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #578A18; font-family: 'Courier New', monospace;">
                ${otpCode}
              </div>
            </div>
          </div>
          
          <p style="color: #d32f2f; font-weight: 600;">This code will expire in 10 minutes.</p>
          
          <p>If you did not create an account, please ignore this email.</p>
          
          <p>Best regards,<br>
          ${process.env.COMPANY_NAME || 'Supplier Onboarding Portal'} Team</p>
        </div>
        
        <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px; text-align: center;">
          This is an automated message. Please do not reply to this email.
        </p>
      </div>
    `
  };

  try {
    console.log(`📧 Attempting to send OTP email...`);
    console.log(`   From: ${fromEmail}`);
    console.log(`   To: ${email}`);
    console.log(`   OTP Code: ${otpCode}`);
    
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent successfully to ${email}`);
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Response: ${info.response || 'No response'}`);
    return info;
  } catch (error) {
    console.error('❌ Error sending OTP email:', error);
    console.error('   Error message:', error.message);
    console.error('   Error code:', error.code);
    console.error('   Error command:', error.command);
    console.error('   Error response:', error.response);
    console.error('   Error responseCode:', error.responseCode);
    throw error;
  }
};

/**
 * Get email transporter status
 * @returns {Object} Status information
 */
exports.getEmailStatus = () => {
  const isConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD);
  
  let status = 'unknown';
  if (!isConfigured) {
    status = 'not_configured';
  } else if (!transporter) {
    status = 'creation_failed';
  } else if (transporterVerifying) {
    status = 'verifying';
  } else if (transporterVerified) {
    status = 'verified';
  } else if (transporterError) {
    status = 'failed';
  } else {
    status = 'pending';
  }

  return {
    configured: isConfigured,
    verified: transporterVerified,
    status: status,
    error: transporterError,
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    user: process.env.EMAIL_USER ? 'SET' : 'NOT SET',
    password: process.env.EMAIL_PASSWORD ? 'SET' : 'NOT SET',
    transporterExists: !!transporter
  };
};

module.exports = exports;

