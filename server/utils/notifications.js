const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendNotificationEmail } = require('./email');

/**
 * Send an email copy of a notification — only for supplier recipients.
 * Uses a direct User lookup instead of .populate() so it works safely
 * on both create() and insertMany() results.
 */
const sendEmailNotification = async (notification) => {
  try {
    const recipientId = notification.recipient?._id || notification.recipient;
    if (!recipientId) return;

    const user = await User.findById(recipientId).select('email firstName lastName role');
    if (!user || !user.email) return;

    // Only email supplier recipients — internal staff get in-app only
    if (user.role !== 'supplier') return;

    await sendNotificationEmail({
      email: user.email,
      title: notification.title,
      message: notification.message,
      actionUrl: notification.actionUrl,
    });

    console.log(`📧 Notification email sent to supplier ${user.email}: "${notification.title}"`);
  } catch (error) {
    console.error('Send email notification error:', error);
    // Don't throw — email failure must never break the in-app notification
  }
};

/**
 * Create a single notification and email the supplier recipient.
 */
exports.createNotification = async (notificationData) => {
  try {
    const notification = await Notification.create(notificationData);
    await sendEmailNotification(notification);
    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    throw error;
  }
};

/**
 * Create multiple notifications and email any supplier recipients.
 */
exports.createBulkNotifications = async (notificationsData) => {
  try {
    const notifications = await Notification.insertMany(notificationsData);
    await Promise.all(notifications.map((n) => sendEmailNotification(n)));
    return notifications;
  } catch (error) {
    console.error('Create bulk notifications error:', error);
    throw error;
  }
};

/**
 * Delete read notifications older than `daysOld` days.
 */
exports.cleanupOldNotifications = async (daysOld = 90) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await Notification.deleteMany({
      createdAt: { $lt: cutoffDate },
      isRead: true,
    });

    console.log(`Deleted ${result.deletedCount} old notifications`);
    return result;
  } catch (error) {
    console.error('Cleanup notifications error:', error);
    throw error;
  }
};
