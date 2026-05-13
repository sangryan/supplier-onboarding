const Notification = require('../models/Notification');
const { sendNotificationEmail } = require('./email');

/**
 * Create a notification
 * @param {Object} notificationData - Notification data
 * @returns {Promise<Notification>}
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
 * Send email notification
 * @param {Notification} notification - Notification object
 */
const sendEmailNotification = async (notification) => {
  try {
    const recipient = await notification.populate('recipient');

    if (!recipient || !recipient.recipient.email) {
      return;
    }

    await sendNotificationEmail({
      email: recipient.recipient.email,
      title: notification.title,
      message: notification.message,
      actionUrl: notification.actionUrl
    });
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

    await Promise.all(notifications.map(n => sendEmailNotification(n)));

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
