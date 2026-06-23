const Notification = require('../models/Notification');

exports.createNotification = async (notificationData) => {
  try {
    return await Notification.create(notificationData);
  } catch (error) {
    console.error('Create notification error:', error);
    throw error;
  }
};

exports.createBulkNotifications = async (notificationsData) => {
  try {
    return await Notification.insertMany(notificationsData);
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
