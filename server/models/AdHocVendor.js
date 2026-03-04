const mongoose = require('mongoose');

const adHocVendorSchema = new mongoose.Schema({
    // Basic Vendor Information
    supplierName: {
        type: String,
        required: true,
        trim: true
    },
    mobileNumber: {
        type: String,
        trim: true
    },
    nationalIdDocument: {
        filename: String,
        path: String,
        mimetype: String
    },
    kraPinDocument: {
        filename: String,
        path: String,
        mimetype: String
    },
    eTimsDocument: {
        filename: String,
        path: String,
        mimetype: String
    },

    // Service Details
    lpoDocument: {
        filename: String,
        path: String,
        mimetype: String
    },
    department: {
        type: String,
        trim: true
    },
    servicesProvided: {
        type: String,
        trim: true
    },

    // Payment Details
    bankName: {
        type: String,
        trim: true
    },
    accountNumber: {
        type: String,
        trim: true
    },
    branch: {
        type: String,
        trim: true
    },
    creditPeriod: {
        type: String,
        enum: ['14_days', '30_days', '45_days', '60_days', '90_days', ''],
        default: ''
    },

    // Status
    status: {
        type: String,
        enum: ['draft', 'submitted', 'approved', 'rejected'],
        default: 'draft'
    },

    // Meta
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    submittedAt: Date
}, {
    timestamps: true
});

module.exports = mongoose.model('AdHocVendor', adHocVendorSchema);
