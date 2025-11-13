const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema({
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true,
    unique: true
  },
  contractNumber: {
    type: String,
    unique: true,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  contractType: {
    type: String,
    enum: ['services', 'goods', 'consultancy', 'subscription', 'other'],
    required: true
  },
  value: {
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'KES'
    }
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'expired', 'terminated', 'renewed'],
    default: 'draft'
  },
  
  // Contract Documents
  signedContract: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  },
  attachments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  }],
  
  // Payment Terms
  paymentTerms: {
    creditPeriod: {
      type: Number,
      required: true
    },
    paymentSchedule: {
      type: String,
      enum: ['one_time', 'monthly', 'quarterly', 'annually', 'milestone_based']
    },
    milestones: [{
      description: String,
      amount: Number,
      dueDate: Date,
      status: {
        type: String,
        enum: ['pending', 'completed', 'overdue']
      }
    }]
  },
  
  // Renewal Information
  renewalOptions: {
    autoRenew: {
      type: Boolean,
      default: false
    },
    renewalNoticePeriod: {
      type: Number // days
    },
    renewalTerms: String
  },
  
  // Amendment History
  amendments: [{
    amendmentNumber: String,
    description: String,
    effectiveDate: Date,
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document'
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Compliance
  complianceRequirements: [{
    requirement: String,
    status: {
      type: String,
      enum: ['met', 'pending', 'overdue']
    },
    dueDate: Date,
    notes: String
  }],
  
  // Notifications
  notifications: {
    expiryReminder: {
      enabled: {
        type: Boolean,
        default: true
      },
      daysBefore: {
        type: Number,
        default: 30
      },
      sent: {
        type: Boolean,
        default: false
      }
    }
  },
  
  // Metadata
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes
contractSchema.index({ supplier: 1 });
contractSchema.index({ status: 1 });
contractSchema.index({ endDate: 1 });
contractSchema.index({ contractNumber: 1 });

// Virtual to check if contract is expiring soon
contractSchema.virtual('isExpiringSoon').get(function() {
  if (!this.endDate) return false;
  const daysUntilExpiry = Math.ceil((this.endDate - new Date()) / (1000 * 60 * 60 * 24));
  return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
});

// Virtual to check if contract is expired
contractSchema.virtual('isExpired').get(function() {
  return this.endDate && this.endDate < new Date();
});

// Method to generate contract number
contractSchema.statics.generateContractNumber = async function() {
  const currentYear = new Date().getFullYear();
  const prefix = `CTR-${currentYear}-`;
  
  const lastContract = await this.findOne({
    contractNumber: new RegExp(`^${prefix}`)
  }).sort({ contractNumber: -1 });
  
  let nextNumber = 1;
  if (lastContract) {
    const lastNumber = parseInt(lastContract.contractNumber.split('-')[2]);
    nextNumber = lastNumber + 1;
  }
  
  return `${prefix}${String(nextNumber).padStart(4, '0')}`;
};

module.exports = mongoose.model('Contract', contractSchema);

