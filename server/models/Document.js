const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
  },
  documentType: {
    type: String,
    required: true,
    enum: [
      // Company Documents
      'certificate_of_incorporation',
      'cr12',
      'pin_certificate',
      'directors_id',
      'company_profile',
      'bank_reference',
      'audited_financials',
      'etims_registration',
      
      // Partnership Documents
      'partnership_deed',
      'partner_pin',
      'partner_tax_compliance',
      'partner_id',
      
      // Foreign Company
      'share_certificate',
      'registry_extract',
      'tax_compliance',
      
      // Individual/Sole Proprietor
      'national_id',
      'passport',
      'work_permit',
      'police_clearance',
      'resume',
      
      // Trust
      'trust_deed',
      'founder_pin',
      'founder_id',
      'beneficiary_id',
      
      // Professional Services
      'practicing_certificate',
      'member_resume',
      
      // Source of Funds
      'source_funds_declaration',
      'data_processing_consent',
      
      // Other
      'other'
    ]
  },
  fileName: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending_review', 'approved', 'rejected', 'expired'],
    default: 'pending_review'
  },
  expiryDate: {
    type: Date
  },
  notes: {
    type: String
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  version: {
    type: Number,
    default: 1
  },
  replacedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  }
}, {
  timestamps: true
});

// Indexes
documentSchema.index({ supplier: 1, documentType: 1 });
documentSchema.index({ status: 1 });

module.exports = mongoose.model('Document', documentSchema);

