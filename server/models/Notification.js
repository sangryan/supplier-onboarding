const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'application_submitted',
      'application_approved',
      'application_rejected',
      'more_info_required',
      'vendor_number_assigned',
      'contract_uploaded',
      'contract_expiring',
      'profile_update_requested',
      'profile_update_approved',
      'new_task_assigned',
      'sla_warning'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  relatedEntity: {
    entityType: {
      type: String,
      enum: ['supplier', 'contract', 'document', 'user']
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId
    }
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  actionUrl: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Notification', notificationSchema);

