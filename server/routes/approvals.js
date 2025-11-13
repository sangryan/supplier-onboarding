const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Supplier = require('../models/Supplier');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { createNotification } = require('../utils/notifications');

// @route   POST /api/approvals/:supplierId/approve
// @desc    Approve supplier application
// @access  Private (Procurement, Legal)
router.post('/:supplierId/approve', protect, authorize('procurement', 'legal'), [
  body('comments').optional().trim()
], async (req, res) => {
  try {
    const { comments } = req.body;
    const supplier = await Supplier.findById(req.params.supplierId)
      .populate('submittedBy');

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    // Add approval to history
    supplier.approvalHistory.push({
      approver: req.user.id,
      action: 'approved',
      comments,
      timestamp: new Date()
    });

    // Update status based on approval stage
    if (req.user.role === 'procurement' && supplier.currentApprovalStage === 'procurement') {
      supplier.currentApprovalStage = 'legal';
      supplier.status = 'pending_legal';
      
      // Notify legal team
      const legalUsers = await User.find({ role: 'legal', isActive: true });
      for (const user of legalUsers) {
        await createNotification({
          recipient: user._id,
          type: 'new_task_assigned',
          title: 'Supplier Application Ready for Legal Review',
          message: `${supplier.supplierName} has been approved by procurement and requires legal review`,
          relatedEntity: {
            entityType: 'supplier',
            entityId: supplier._id
          },
          actionUrl: `/suppliers/${supplier._id}`
        });
      }
    } else if (req.user.role === 'legal' && supplier.currentApprovalStage === 'legal') {
      supplier.currentApprovalStage = 'completed';
      supplier.status = 'approved';
      supplier.approvedAt = new Date();
      
      // Calculate SLA metrics
      if (supplier.slaMetrics && supplier.slaMetrics.submissionDate) {
        const daysToComplete = Math.ceil(
          (new Date() - supplier.slaMetrics.submissionDate) / (1000 * 60 * 60 * 24)
        );
        supplier.slaMetrics.actualCompletionDate = new Date();
        supplier.slaMetrics.daysToComplete = daysToComplete;
        supplier.slaMetrics.isOverdue = daysToComplete > 14; // Assuming 14 days SLA
      }
    }

    await supplier.save();

    // Notify supplier
    if (supplier.submittedBy) {
      await createNotification({
        recipient: supplier.submittedBy._id,
        type: 'application_approved',
        title: `Application Approved by ${req.user.role === 'procurement' ? 'Procurement' : 'Legal'}`,
        message: supplier.status === 'approved' 
          ? 'Your application has been fully approved! Awaiting vendor number assignment.'
          : 'Your application has been approved by procurement and is now under legal review.',
        relatedEntity: {
          entityType: 'supplier',
          entityId: supplier._id
        },
        actionUrl: `/applications/${supplier._id}`
      });
    }

    res.json({
      success: true,
      message: 'Supplier approved successfully',
      data: supplier
    });
  } catch (error) {
    console.error('Approve supplier error:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving supplier'
    });
  }
});

// @route   POST /api/approvals/:supplierId/reject
// @desc    Reject supplier application
// @access  Private (Procurement, Legal)
router.post('/:supplierId/reject', protect, authorize('procurement', 'legal'), [
  body('comments').notEmpty().withMessage('Rejection reason is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { comments } = req.body;
    const supplier = await Supplier.findById(req.params.supplierId)
      .populate('submittedBy');

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    // Add rejection to history
    supplier.approvalHistory.push({
      approver: req.user.id,
      action: 'rejected',
      comments,
      timestamp: new Date()
    });

    supplier.status = 'rejected';
    supplier.rejectedAt = new Date();
    supplier.rejectionReason = comments;

    await supplier.save();

    // Notify supplier
    if (supplier.submittedBy) {
      await createNotification({
        recipient: supplier.submittedBy._id,
        type: 'application_rejected',
        title: 'Application Rejected',
        message: `Your application has been rejected. Reason: ${comments}`,
        relatedEntity: {
          entityType: 'supplier',
          entityId: supplier._id
        },
        actionUrl: `/applications/${supplier._id}`,
        priority: 'high'
      });
    }

    res.json({
      success: true,
      message: 'Supplier rejected',
      data: supplier
    });
  } catch (error) {
    console.error('Reject supplier error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting supplier'
    });
  }
});

// @route   POST /api/approvals/:supplierId/request-info
// @desc    Request more information from supplier
// @access  Private (Procurement, Legal)
router.post('/:supplierId/request-info', protect, authorize('procurement', 'legal'), [
  body('comments').notEmpty().withMessage('Please specify what information is needed')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { comments } = req.body;
    const supplier = await Supplier.findById(req.params.supplierId)
      .populate('submittedBy');

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    // Add request to history
    supplier.approvalHistory.push({
      approver: req.user.id,
      action: 'requested_info',
      comments,
      timestamp: new Date()
    });

    supplier.status = 'more_info_required';

    await supplier.save();

    // Notify supplier
    if (supplier.submittedBy) {
      await createNotification({
        recipient: supplier.submittedBy._id,
        type: 'more_info_required',
        title: 'Additional Information Required',
        message: `Please provide additional information: ${comments}`,
        relatedEntity: {
          entityType: 'supplier',
          entityId: supplier._id
        },
        actionUrl: `/applications/${supplier._id}`,
        priority: 'high'
      });
    }

    res.json({
      success: true,
      message: 'Information request sent',
      data: supplier
    });
  } catch (error) {
    console.error('Request info error:', error);
    res.status(500).json({
      success: false,
      message: 'Error requesting information'
    });
  }
});

// @route   POST /api/approvals/:supplierId/assign-vendor-number
// @desc    Assign vendor number to approved supplier
// @access  Private (Procurement)
router.post('/:supplierId/assign-vendor-number', protect, authorize('procurement'), [
  body('vendorNumber').notEmpty().withMessage('Vendor number is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { vendorNumber } = req.body;
    const supplier = await Supplier.findById(req.params.supplierId)
      .populate('submittedBy');

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    if (supplier.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Supplier must be approved before assigning vendor number'
      });
    }

    // Check if vendor number already exists
    const existingVendor = await Supplier.findOne({ vendorNumber });
    if (existingVendor) {
      return res.status(400).json({
        success: false,
        message: 'Vendor number already exists'
      });
    }

    // Assign vendor number
    supplier.vendorNumber = vendorNumber;
    supplier.approvalHistory.push({
      approver: req.user.id,
      action: 'assigned_vendor_number',
      comments: `Vendor number ${vendorNumber} assigned`,
      timestamp: new Date()
    });

    await supplier.save();

    // Notify supplier
    if (supplier.submittedBy) {
      await createNotification({
        recipient: supplier.submittedBy._id,
        type: 'vendor_number_assigned',
        title: 'Vendor Number Assigned',
        message: `Your vendor number is: ${vendorNumber}. You are now fully onboarded!`,
        relatedEntity: {
          entityType: 'supplier',
          entityId: supplier._id
        },
        actionUrl: `/applications/${supplier._id}`,
        priority: 'high'
      });
    }

    res.json({
      success: true,
      message: 'Vendor number assigned successfully',
      data: supplier
    });
  } catch (error) {
    console.error('Assign vendor number error:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning vendor number'
    });
  }
});

// @route   POST /api/approvals/profile-updates/:requestId/approve
// @desc    Approve profile update request
// @access  Private (Procurement)
router.post('/profile-updates/:requestId/approve', protect, authorize('procurement'), async (req, res) => {
  try {
    const { supplierId } = req.body;
    
    const supplier = await Supplier.findById(supplierId)
      .populate('submittedBy');

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    // Find and approve the request
    const request = supplier.profileUpdateRequests.id(req.params.requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Profile update request not found'
      });
    }

    // Apply the update
    supplier[request.field] = request.newValue;
    request.status = 'approved';
    request.processedBy = req.user.id;
    request.processedAt = new Date();

    await supplier.save();

    // Notify supplier
    if (supplier.submittedBy) {
      await createNotification({
        recipient: supplier.submittedBy._id,
        type: 'profile_update_approved',
        title: 'Profile Update Approved',
        message: `Your request to update ${request.field} has been approved`,
        relatedEntity: {
          entityType: 'supplier',
          entityId: supplier._id
        },
        actionUrl: `/profile`
      });
    }

    res.json({
      success: true,
      message: 'Profile update approved',
      data: supplier
    });
  } catch (error) {
    console.error('Approve profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving profile update'
    });
  }
});

module.exports = router;

