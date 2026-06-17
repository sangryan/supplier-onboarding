const nodemailer = require('nodemailer');
const crypto = require('crypto');
const https = require('https');

// ---------------------------------------------------------------------------
// Transport selection
// Use Resend's HTTP API when EMAIL_PASSWORD is a Resend API key (starts with
// "re_") or EMAIL_HOST is smtp.resend.com. This avoids SMTP port blocking.
// Fall back to generic SMTP (Gmail, etc.) otherwise.
// ---------------------------------------------------------------------------
const RESEND_API_KEY = process.env.EMAIL_PASSWORD || '';
const USE_RESEND = RESEND_API_KEY.startsWith('re_') || process.env.EMAIL_HOST === 'smtp.resend.com';

const FROM_EMAIL = process.env.EMAIL_FROM || process.env.EMAIL_USER || '';
const COMPANY_NAME = process.env.COMPANY_NAME || 'Supplier Onboarding Portal';

// ── Resend HTTP API ────────────────────────────────────────────────────────

const sendViaResend = (mailOptions) => {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      from: mailOptions.from,
      to: Array.isArray(mailOptions.to) ? mailOptions.to : [mailOptions.to],
      subject: mailOptions.subject,
      html: mailOptions.html,
    });

    const req = https.request(
      {
        hostname: 'api.resend.com',
        path: '/emails',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              console.log(`✅ Resend API accepted email — id: ${parsed.id}`);
              resolve({ messageId: parsed.id, response: `${res.statusCode} OK` });
            } else {
              const err = new Error(parsed.message || `Resend API error ${res.statusCode}`);
              err.responseCode = res.statusCode;
              err.response = data;
              if (res.statusCode === 403) {
                console.error('   ⚠️  403 Forbidden: domain not verified in Resend, or invalid API key');
              }
              reject(err);
            }
          } catch (e) {
            reject(new Error(`Failed to parse Resend response: ${data}`));
          }
        });
      }
    );

    req.setTimeout(15000, () => req.destroy(new Error('Resend API request timed out')));
    req.on('error', reject);
    req.write(body);
    req.end();
  });
};

// ── SMTP transporter (non-Resend) ─────────────────────────────────────────

let transporter = null;
let transporterVerified = false;
let transporterError = null;
let transporterVerifying = false;

if (!USE_RESEND) {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    try {
      console.log('📧 Initializing SMTP transporter...');
      console.log('   Host:', process.env.EMAIL_HOST || 'smtp.gmail.com');
      console.log('   Port:', process.env.EMAIL_PORT || 587);
      console.log('   User:', process.env.EMAIL_USER);

      transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_PORT === '465',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
        debug: process.env.NODE_ENV === 'development',
        logger: process.env.NODE_ENV === 'development',
      });

      transporterVerifying = true;
      transporter.verify((error) => {
        transporterVerifying = false;
        if (error) {
          console.error('❌ SMTP transporter verification FAILED:', error.message);
          transporterVerified = false;
          transporterError = { message: error.message, code: error.code };
        } else {
          console.log('✅ SMTP transporter verified and ready');
          transporterVerified = true;
          transporterError = null;
        }
      });
    } catch (error) {
      console.error('❌ SMTP transporter configuration error:', error.message);
      transporterVerified = false;
      transporterError = { message: error.message, type: 'configuration_error' };
    }
  } else {
    console.error('❌ Email configuration MISSING (EMAIL_USER / EMAIL_PASSWORD not set)');
    transporterVerified = false;
  }
} else {
  if (!RESEND_API_KEY) {
    console.error('❌ Resend API key not set (EMAIL_PASSWORD must be a re_... key)');
  } else if (!FROM_EMAIL) {
    console.error('❌ EMAIL_FROM not set — required for Resend sends');
  } else {
    console.log('📧 Email configured via Resend HTTP API');
    console.log('   From:', FROM_EMAIL);
  }
}

// ── Unified send ──────────────────────────────────────────────────────────

const sendEmail = async (mailOptions) => {
  if (USE_RESEND) {
    if (!RESEND_API_KEY) throw new Error('Resend API key not configured (EMAIL_PASSWORD)');
    if (!FROM_EMAIL) throw new Error('EMAIL_FROM must be set for Resend');
    return sendViaResend(mailOptions);
  }

  if (!transporter) throw new Error('Email transporter not configured');
  if (!transporterVerified) {
    console.warn('⚠️  SMTP transporter not yet verified — attempting to send anyway');
  }
  const info = await transporter.sendMail(mailOptions);
  return info;
};

const makeFrom = () => `"${COMPANY_NAME}" <${FROM_EMAIL}>`;

// ── Exported functions ────────────────────────────────────────────────────

exports.sendPasswordResetEmail = async ({ email, resetToken, userName }) => {
  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

  console.log(`📧 Sending password reset email to ${email}...`);
  const info = await sendEmail({
    from: makeFrom(),
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
          <p>If you did not request a password reset, please ignore this email.</p>
          <p>Best regards,<br>${COMPANY_NAME} Team</p>
        </div>
        <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px; text-align: center;">
          This is an automated message. Please do not reply to this email.
        </p>
      </div>
    `,
  });

  console.log(`✅ Password reset email sent to ${email}`);
  return info;
};

exports.generateResetToken = () => crypto.randomBytes(32).toString('hex');

exports.generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

exports.sendOTPEmail = async ({ email, otpCode, userName }) => {
  console.log(`📧 Sending OTP email to ${email}...`);
  const info = await sendEmail({
    from: makeFrom(),
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
          <p>Best regards,<br>${COMPANY_NAME} Team</p>
        </div>
        <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px; text-align: center;">
          This is an automated message. Please do not reply to this email.
        </p>
      </div>
    `,
  });

  console.log(`✅ OTP email sent to ${email}`);
  return info;
};

exports.sendUserInviteEmail = async ({ email, tempPassword, userName, role }) => {
  console.log(`📧 Sending invite email to ${email}...`);
  await sendEmail({
    from: makeFrom(),
    to: email,
    subject: 'You have been invited - Supplier Onboarding Portal',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #333; margin: 0;">Account Invitation</h2>
        </div>
        <div style="color: #666; font-size: 16px; line-height: 1.6;">
          <p>Hello ${userName || 'User'},</p>
          <p>You have been added as <strong>${role}</strong> on the Supplier Onboarding Portal.</p>
          <p>Use the temporary login password below:</p>
          <div style="text-align: center; margin: 24px 0;">
            <div style="display: inline-block; padding: 12px 24px; background-color: #f0f0f0; border-radius: 8px; border: 1px solid #d0d0d0;">
              <div style="font-size: 24px; font-weight: 700; letter-spacing: 1px; color: #111827; font-family: 'Courier New', monospace;">
                ${tempPassword}
              </div>
            </div>
          </div>
          <p style="color: #d32f2f; font-weight: 600;">Please change this password immediately after first login.</p>
          <p>Best regards,<br>${COMPANY_NAME} Team</p>
        </div>
      </div>
    `,
  });
};

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const buildActionUrl = (actionUrl) => {
  if (!actionUrl) return null;
  if (/^https?:\/\//i.test(actionUrl)) return actionUrl;
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  return `${clientUrl.replace(/\/$/, '')}/${String(actionUrl).replace(/^\//, '')}`;
};

exports.sendNotificationEmail = async ({ email, title, message, actionUrl }) => {
  const fullActionUrl = buildActionUrl(actionUrl);
  const safeTitle = escapeHtml(title);
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br>');
  const safeCompany = escapeHtml(COMPANY_NAME);

  return sendEmail({
    from: makeFrom(),
    to: email,
    subject: title,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #333; margin: 0;">${safeTitle}</h2>
        </div>
        <div style="color: #666; font-size: 16px; line-height: 1.6;">
          <p>${safeMessage}</p>
          ${fullActionUrl ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${escapeHtml(fullActionUrl)}"
                 style="display: inline-block; padding: 14px 28px; background-color: #578A18;
                        color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;
                        font-size: 16px;">
                View Details
              </a>
            </div>
          ` : ''}
        </div>
        <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px; text-align: center;">
          This is an automated message from ${safeCompany}. Please do not reply.
        </p>
      </div>
    `,
  });
};

exports.getEmailStatus = () => {
  if (USE_RESEND) {
    const ready = !!(RESEND_API_KEY && FROM_EMAIL);
    return {
      configured: ready,
      verified: ready,
      status: ready ? 'resend_api' : 'not_configured',
      error: ready ? null : 'Resend API key or EMAIL_FROM missing',
      host: 'api.resend.com (HTTP)',
      port: 443,
      user: 'resend',
      password: RESEND_API_KEY ? 'SET' : 'NOT SET',
      transporterExists: true,
    };
  }

  const isConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD);
  let status = 'unknown';
  if (!isConfigured) status = 'not_configured';
  else if (!transporter) status = 'creation_failed';
  else if (transporterVerifying) status = 'verifying';
  else if (transporterVerified) status = 'verified';
  else if (transporterError) status = 'failed';
  else status = 'pending';

  return {
    configured: isConfigured,
    verified: transporterVerified,
    status,
    error: transporterError,
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    user: process.env.EMAIL_USER ? 'SET' : 'NOT SET',
    password: process.env.EMAIL_PASSWORD ? 'SET' : 'NOT SET',
    transporterExists: !!transporter,
  };
};

module.exports = exports;
