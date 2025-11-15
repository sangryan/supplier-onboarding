const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  // Basic Information
  supplierName: {
    type: String,
    required: true,
    trim: true
  },
  vendorNumber: {
    type: String,
    unique: true,
    sparse: true // Only set when approved
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'under_review', 'pending_legal', 'pending_procurement', 'approved', 'rejected', 'more_info_required'],
    default: 'draft'
  },
  
  // Legal Nature of Entity
  legalNature: {
    type: String,
    enum: ['state_owned', 'ngo', 'foundation', 'association', 'company', 'partnership', 'foreign_company', 'individual', 'trust', 'other'],
    required: true
  },
  legalNatureOther: {
    type: String
  },
  
  // Entity Type Details
  entityType: {
    type: String,
    enum: ['private_company', 'public_company', 'partnership', 'foreign_company', 'individual', 'trust', 'other']
  },
  
  // Company Information
  companyRegistrationNumber: {
    type: String,
    trim: true
  },
  companyEmail: {
    type: String,
    lowercase: true,
    trim: true
  },
  companyPhysicalAddress: {
    street: String,
    city: String,
    country: String,
    postalCode: String
  },
  
  // Contact Person/Authorized Representative
  authorizedPerson: {
    name: {
      type: String,
      required: true
    },
    relationship: {
      type: String,
      required: true
    },
    idPassportNumber: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true
    }
  },
  
  // Type of Services
  serviceType: {
    type: String,
    enum: ['professional_services', 'digital_services', 'physical_goods', 'other'],
    required: true
  },
  serviceTypeOther: {
    type: String
  },
  
  // Credit Period
  creditPeriod: {
    type: Number, // in days
    default: 30
  },
  
  // Director Details
  directors: [{
    name: String,
    idPassportNumber: String,
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document'
    }
  }],
  
  // Source of Funds Declaration
  sourceOfFunds: {
    source: {
      type: String,
      enum: ['business_income', 'investment', 'inheritance', 'salary', 'other']
    },
    declarantName: String,
    declarantIdPassport: String,
    declarantCapacity: String,
    declarationDate: Date,
    signatureDocumentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document'
    }
  },
  
  // Data Processing Consent
  dataProcessingConsent: {
    granted: {
      type: Boolean,
      default: false
    },
    consentorName: String,
    consentorIdPassport: String,
    consentorCapacity: String,
    consentDate: Date,
    signatureDocumentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document'
    }
  },
  
  // Approval Workflow
  approvalHistory: [{
    approver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    action: {
      type: String,
      enum: ['approved', 'rejected', 'requested_info', 'assigned_vendor_number']
    },
    comments: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  
  currentApprovalStage: {
    type: String,
    enum: ['procurement', 'legal', 'completed'],
    default: 'procurement'
  },
  
  // Contract Information
  contract: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contract'
  },
  
  // Metadata
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  submittedAt: {
    type: Date
  },
  approvedAt: {
    type: Date
  },
  rejectedAt: {
    type: Date
  },
  rejectionReason: {
    type: String
  },
  
  // Profile Updates
  profileUpdateRequests: [{
    field: String,
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    requestedAt: Date,
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    processedAt: Date
  }],
  
  // SLA Tracking
  slaMetrics: {
    submissionDate: Date,
    expectedCompletionDate: Date,
    actualCompletionDate: Date,
    daysToComplete: Number,
    isOverdue: {
      type: Boolean,
      default: false
    }
  },
  
  // Application Progress Tracking
  currentStep: {
    type: Number,
    default: 0,
    min: 0,
    max: 3
  },
  lastModified: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  strict: false // Allow fields not defined in schema to be saved and retrieved
});

// Indexes
supplierSchema.index({ supplierName: 'text' });
supplierSchema.index({ status: 1 });
supplierSchema.index({ vendorNumber: 1 });
supplierSchema.index({ 'authorizedPerson.email': 1 });

// Virtual for documents
supplierSchema.virtual('documents', {
  ref: 'Document',
  localField: '_id',
  foreignField: 'supplier'
});

// Method to check if supplier can submit
supplierSchema.methods.canSubmit = function() {
  return this.status === 'draft' || this.status === 'more_info_required';
};

// Method to check if supplier is onboarded
supplierSchema.methods.isOnboarded = function() {
  return this.status === 'approved' && this.vendorNumber;
};

module.exports = mongoose.model('Supplier', supplierSchema);

