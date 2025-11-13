const Notification = require('../models/Notification');
const nodemailer = require('nodemailer');

// Create email transporter
let transporter = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
  try {
    transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  } catch (error) {
    console.warn('Email transporter not configured');
  }
}

/**
 * Create a notification
 * @param {Object} notificationData - Notification data
 * @returns {Promise<Notification>}
 */
exports.createNotification = async (notificationData) => {
  try {
    const notification = await Notification.create(notificationData);
    
    // Send email notification if configured
    if (transporter) {
      await sendEmailNotification(notification);
    }
    
    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    throw error;
  }
};

/**
 * Send email notification
 * @param {Notification} notification - Notification object
 */
const sendEmailNotification = async (notification) => {
  // Skip email if transporter is not configured
  if (!transporter) {
    return;
  }
  
  try {
    const recipient = await notification.populate('recipient');
    
    if (!recipient || !recipient.recipient.email) {
      return;
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: recipient.recipient.email,
      subject: notification.title,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">${notification.title}</h2>
          <p style="color: #666; font-size: 16px;">${notification.message}</p>
          ${notification.actionUrl ? `
            <a href="${process.env.CLIENT_URL}${notification.actionUrl}" 
               style="display: inline-block; padding: 12px 24px; background-color: #007bff; 
                      color: white; text-decoration: none; border-radius: 4px; margin-top: 20px;">
              View Details
            </a>
          ` : ''}
          <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px;">
            This is an automated message from ${process.env.COMPANY_NAME || 'Supplier Onboarding System'}. 
            Please do not reply to this email.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Send email notification error:', error);
    // Don't throw error - email failure shouldn't break the app
  }
};

/**
 * Create bulk notifications
 * @param {Array<Object>} notificationsData - Array of notification data
 * @returns {Promise<Array<Notification>>}
 */
exports.createBulkNotifications = async (notificationsData) => {
  try {
    const notifications = await Notification.insertMany(notificationsData);
    
    // Send emails in parallel
    if (transporter) {
      await Promise.all(notifications.map(n => sendEmailNotification(n)));
    }
    
    return notifications;
  } catch (error) {
    console.error('Create bulk notifications error:', error);
    throw error;
  }
};

/**
 * Delete old notifications
 * @param {Number} daysOld - Delete notifications older than this many days
 */
exports.cleanupOldNotifications = async (daysOld = 90) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const result = await Notification.deleteMany({
      createdAt: { $lt: cutoffDate },
      isRead: true
    });
    
    console.log(`Deleted ${result.deletedCount} old notifications`);
    return result;
  } catch (error) {
    console.error('Cleanup notifications error:', error);
    throw error;
  }
};

