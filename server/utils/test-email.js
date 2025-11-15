/**
 * Test email configuration
 * Run this with: node server/utils/test-email.js
 */

require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('📧 Testing Email Configuration...\n');

// Check environment variables
console.log('Environment Variables:');
console.log('  EMAIL_HOST:', process.env.EMAIL_HOST || 'NOT SET (defaults to smtp.gmail.com)');
console.log('  EMAIL_PORT:', process.env.EMAIL_PORT || 'NOT SET (defaults to 587)');
console.log('  EMAIL_USER:', process.env.EMAIL_USER ? '✅ SET' : '❌ NOT SET');
console.log('  EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✅ SET' : '❌ NOT SET');
console.log('  EMAIL_FROM:', process.env.EMAIL_FROM || process.env.EMAIL_USER || 'NOT SET');
console.log('  CLIENT_URL:', process.env.CLIENT_URL || 'NOT SET\n');

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
  console.error('❌ Email configuration is incomplete!');
  console.error('\nPlease set the following in your .env file:');
  console.error('  EMAIL_USER=your_email@gmail.com');
  console.error('  EMAIL_PASSWORD=your_app_password');
  console.error('\nFor Gmail:');
  console.error('  1. Enable 2-factor authentication');
  console.error('  2. Generate an App Password: https://myaccount.google.com/apppasswords');
  console.error('  3. Use the App Password (not your regular password)');
  process.exit(1);
}

// Create transporter
const transporter = nodemailer.createTransporter({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_PORT === '465',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Test connection
console.log('Testing SMTP connection...\n');

transporter.verify((error, success) => {
  if (error) {
    console.error('❌ SMTP Connection Failed!');
    console.error('Error:', error.message);
    console.error('\nCommon issues:');
    console.error('  1. Wrong email or password');
    console.error('  2. Gmail requires App Password (not regular password)');
    console.error('  3. 2FA must be enabled for Gmail');
    console.error('  4. Check firewall/network settings');
    console.error('  5. Verify SMTP host and port');
    process.exit(1);
  } else {
    console.log('✅ SMTP Connection Successful!\n');
    
    // Try sending a test email
    const testEmail = process.env.EMAIL_USER; // Send to self
    console.log(`Sending test email to ${testEmail}...\n`);
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: testEmail,
      subject: 'Test Email - Supplier Onboarding Portal',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>✅ Email Configuration Test</h2>
          <p>If you received this email, your email configuration is working correctly!</p>
          <p>You can now use the password reset functionality.</p>
        </div>
      `
    };
    
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('❌ Failed to send test email');
        console.error('Error:', error.message);
        console.error('\nTroubleshooting:');
        console.error('  - Check if EMAIL_USER and EMAIL_PASSWORD are correct');
        console.error('  - For Gmail, ensure you\'re using an App Password');
        console.error('  - Check spam folder');
        process.exit(1);
      } else {
        console.log('✅ Test email sent successfully!');
        console.log('   Message ID:', info.messageId);
        console.log('   Check your inbox (and spam folder) for the test email.\n');
        console.log('🎉 Email configuration is working correctly!');
        process.exit(0);
      }
    });
  }
});

