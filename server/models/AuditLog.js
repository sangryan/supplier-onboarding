const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      'USER_LOGIN',
      'USER_CREATED', 'USER_UPDATED', 'USER_DELETED',
      'USER_SUSPENDED', 'USER_ACTIVATED',
      'MAINTENANCE_ENABLED', 'MAINTENANCE_DISABLED',
      'APPLICATION_STATUS_CHANGED',
      'CONTRACT_TERMINATED', 'CONTRACT_COMPLETED',
    ]
  },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  performedByName: String,
  performedByEmail: String,
  targetType: String,
  targetId: String,
  targetName: String,
  details: mongoose.Schema.Types.Mixed,
  ipAddress: String,
}, {
  timestamps: true,
  collection: 'auditlogs'
});

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ action: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
