const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Create email transporter
let transporter = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
  try {
    transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  } catch (error) {
    console.warn('Email transporter not configured:', error.message);
  }
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
    console.warn('Email transporter not configured. Password reset email not sent.');
    return;
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
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
  } catch (error) {
    console.error('Error sending password reset email:', error);
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

module.exports = exports;

