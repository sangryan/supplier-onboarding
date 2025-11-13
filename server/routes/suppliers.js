const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Supplier = require('../models/Supplier');
const User = require('../models/User');
const Document = require('../models/Document');
const { protect, authorize, supplierAccess } = require('../middleware/auth');
const { createNotification } = require('../utils/notifications');

// @route   POST /api/suppliers
// @desc    Create new supplier application
// @access  Private (Supplier)
router.post('/', protect, authorize('supplier'), [
  body('supplierName').trim().notEmpty().withMessage('Supplier name is required'),
  body('legalNature').notEmpty().withMessage('Legal nature is required'),
  body('authorizedPerson.name').notEmpty().withMessage('Authorized person name is required'),
  body('authorizedPerson.email').isEmail().withMessage('Valid email is required'),
  body('serviceType').notEmpty().withMessage('Service type is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Create supplier
    const supplier = await Supplier.create({
      ...req.body,
      submittedBy: req.user.id,
      status: 'draft'
    });

    // Link supplier to user
    await User.findByIdAndUpdate(req.user.id, { supplier: supplier._id });

    res.status(201).json({
      success: true,
      data: supplier
    });
  } catch (error) {
    console.error('Create supplier error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating supplier application'
    });
  }
});

// @route   GET /api/suppliers
// @desc    Get all suppliers (filtered by role)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    
    let query = {};
    
    // Role-based filtering
    if (req.user.role === 'supplier') {
      query.submittedBy = req.user.id;
    }
    
    // Status filter
    if (status) {
      query.status = status;
    }
    
    // Search filter
    if (search) {
      query.$or = [
        { supplierName: { $regex: search, $options: 'i' } },
        { vendorNumber: { $regex: search, $options: 'i' } },
        { 'authorizedPerson.email': { $regex: search, $options: 'i' } }
      ];
    }

    const suppliers = await Supplier.find(query)
      .populate('submittedBy', 'firstName lastName email')
      .populate('approvalHistory.approver', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const count = await Supplier.countDocuments(query);

    res.json({
      success: true,
      data: suppliers,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get suppliers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching suppliers'
    });
  }
});

// @route   GET /api/suppliers/:id
// @desc    Get single supplier
// @access  Private
router.get('/:id', protect, supplierAccess, async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id)
      .populate('submittedBy', 'firstName lastName email')
      .populate('approvalHistory.approver', 'firstName lastName role')
      .populate('contract');

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    // Get documents
    const documents = await Document.find({ supplier: supplier._id })
      .populate('uploadedBy', 'firstName lastName')
      .sort({ uploadedAt: -1 });

    res.json({
      success: true,
      data: {
        ...supplier.toObject(),
        documents
      }
    });
  } catch (error) {
    console.error('Get supplier error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching supplier'
    });
  }
});

// @route   PUT /api/suppliers/:id
// @desc    Update supplier application
// @access  Private
router.put('/:id', protect, supplierAccess, async (req, res) => {
  try {
    let supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    // Check if supplier can be updated
    if (req.user.role === 'supplier' && !supplier.canSubmit()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update supplier at this stage'
      });
    }

    // Update supplier
    supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: supplier
    });
  } catch (error) {
    console.error('Update supplier error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating supplier'
    });
  }
});

// @route   POST /api/suppliers/:id/submit
// @desc    Submit supplier application for review
// @access  Private (Supplier)
router.post('/:id/submit', protect, authorize('supplier'), supplierAccess, async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    if (!supplier.canSubmit()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot submit supplier at this stage'
      });
    }

    // Check if required documents are uploaded
    const documents = await Document.find({ supplier: supplier._id });
    if (documents.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please upload required documents before submitting'
      });
    }

    // Update supplier status
    supplier.status = 'submitted';
    supplier.submittedAt = new Date();
    supplier.currentApprovalStage = 'procurement';
    supplier.slaMetrics = {
      submissionDate: new Date(),
      expectedCompletionDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days
    };
    await supplier.save();

    // Create notifications for procurement team
    const procurementUsers = await User.find({ role: 'procurement', isActive: true });
    for (const user of procurementUsers) {
      await createNotification({
        recipient: user._id,
        type: 'new_task_assigned',
        title: 'New Supplier Application',
        message: `New supplier application from ${supplier.supplierName} requires review`,
        relatedEntity: {
          entityType: 'supplier',
          entityId: supplier._id
        },
        actionUrl: `/suppliers/${supplier._id}`
      });
    }

    res.json({
      success: true,
      message: 'Application submitted successfully',
      data: supplier
    });
  } catch (error) {
    console.error('Submit supplier error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting application'
    });
  }
});

// @route   POST /api/suppliers/:id/profile-update-request
// @desc    Request profile update
// @access  Private (Supplier)
router.post('/:id/profile-update-request', protect, authorize('supplier'), supplierAccess, async (req, res) => {
  try {
    const { field, newValue } = req.body;
    
    const supplier = await Supplier.findById(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    // Add profile update request
    supplier.profileUpdateRequests.push({
      field,
      oldValue: supplier[field],
      newValue,
      status: 'pending',
      requestedAt: new Date()
    });

    await supplier.save();

    // Notify procurement
    const procurementUsers = await User.find({ role: 'procurement', isActive: true });
    for (const user of procurementUsers) {
      await createNotification({
        recipient: user._id,
        type: 'profile_update_requested',
        title: 'Profile Update Request',
        message: `${supplier.supplierName} has requested a profile update`,
        relatedEntity: {
          entityType: 'supplier',
          entityId: supplier._id
        },
        actionUrl: `/suppliers/${supplier._id}`
      });
    }

    res.json({
      success: true,
      message: 'Profile update request submitted',
      data: supplier
    });
  } catch (error) {
    console.error('Profile update request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting profile update request'
    });
  }
});

module.exports = router;

