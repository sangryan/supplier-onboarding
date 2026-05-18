const AuditLog = require('../models/AuditLog');

const logAction = async (req, action, targetType, targetId, targetName, details = {}) => {
  try {
    const performedBy = req.user?._id || req.user?.id;
    const performedByName = req.user
      ? `${req.user.firstName} ${req.user.lastName}`
      : 'System';
    const performedByEmail = req.user?.email;
    const forwarded = req.headers['x-forwarded-for'];
    const ipAddress = forwarded ? forwarded.split(',')[0].trim() : req.ip;

    await AuditLog.create({
      action,
      performedBy,
      performedByName,
      performedByEmail,
      targetType,
      targetId: targetId?.toString(),
      targetName,
      details,
      ipAddress,
    });
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
};

module.exports = { logAction };
