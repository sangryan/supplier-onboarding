const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Create email transporter
let transporter = null;
let transporterVerified = false;
let transporterError = null;

if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
  try {
    console.log('📧 Initializing email transporter...');
    console.log('   Host:', process.env.EMAIL_HOST || 'smtp.gmail.com');
    console.log('   Port:', process.env.EMAIL_PORT || 587);
    console.log('   User:', process.env.EMAIL_USER);
    
    transporter = nodemailer.createTransporter({
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
      debug: process.env.NODE_ENV === 'development', // Enable debug output in development
      logger: process.env.NODE_ENV === 'development' // Enable logging in development
    });
    
    // Verify transporter configuration asynchronously
    transporter.verify((error, success) => {
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
    transporterVerified = false;
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

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
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
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent successfully to ${email}`);
    console.log(`   Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    console.error('   Error details:', {
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });
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
 * Get email transporter status
 * @returns {Object} Status information
 */
exports.getEmailStatus = () => {
  return {
    configured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD),
    verified: transporterVerified,
    error: transporterError,
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    user: process.env.EMAIL_USER ? 'SET' : 'NOT SET',
    password: process.env.EMAIL_PASSWORD ? 'SET' : 'NOT SET'
  };
};

module.exports = exports;

