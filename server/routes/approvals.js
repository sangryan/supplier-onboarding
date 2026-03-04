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
      // Logic for vendor number reuse
      let existingVendorNumber = supplier.vendorNumber;

      // If not on current record, check other applications from the same user
      if (!existingVendorNumber && supplier.submittedBy) {
        const otherApp = await Supplier.findOne({
          submittedBy: supplier.submittedBy._id,
          vendorNumber: { $exists: true, $ne: null }
        }).select('vendorNumber').lean();
        if (otherApp) existingVendorNumber = otherApp.vendorNumber;
      }

      if (existingVendorNumber) {
        // AUTOMATED FLOW: Reuse vendor number
        supplier.vendorNumber = existingVendorNumber;
        supplier.status = 'pending_legal';
        supplier.currentApprovalStage = 'legal';
        supplier.approvedAt = new Date();
        supplier.approvalHistory.push({
          approver: req.user.id,
          action: 'assigned_vendor_number',
          comments: `System automatically reused existing vendor number ${existingVendorNumber}. Proceeding to legal review.`,
          timestamp: new Date()
        });
      } else {
        // AUTOMATED FLOW: Generate NEW vendor number
        const newVendorNumber = await Supplier.generateVendorNumber('standard');
        supplier.vendorNumber = newVendorNumber;
        supplier.status = 'pending_legal';
        supplier.currentApprovalStage = 'legal';
        supplier.approvedAt = new Date();
        supplier.approvalHistory.push({
          approver: req.user.id,
          action: 'approved',
          comments: comments || 'Approved by procurement.',
          timestamp: new Date()
        }, {
          approver: req.user.id,
          action: 'assigned_vendor_number',
          comments: `System automatically assigned new vendor number ${newVendorNumber}. Proceeding to legal review.`,
          timestamp: new Date()
        });
      }

      // Notify legal team (consolidated notification)
      const legalUsers = await User.find({ role: 'legal', isActive: true });
      for (const user of legalUsers) {
        await createNotification({
          recipient: user._id,
          type: 'new_task_assigned',
          title: `[${supplier.applicationNumber}] Supplier Ready for Legal Review`,
          message: `${supplier.supplierName} (Vendor #: ${supplier.vendorNumber}) has been approved by procurement and is ready for legal review.`,
          relatedEntity: { entityType: 'supplier', entityId: supplier._id },
          actionUrl: `/suppliers/${supplier._id}`
        });
      }
    } else if (req.user.role === 'legal' && supplier.currentApprovalStage === 'legal') {
      supplier.currentApprovalStage = 'contract_upload';
      supplier.status = 'pending_contract_upload';

      // Create a draft contract record if it doesn't exist
      const Contract = require('../models/Contract');
      let contract = await Contract.findOne({ supplier: supplier._id });
      if (!contract) {
        const contractNumber = await Contract.generateContractNumber();
        contract = await Contract.create({
          supplier: supplier._id,
          contractNumber,
          title: `Contract for ${supplier.supplierName}`,
          contractType: 'services', // Default type
          value: { amount: 0, currency: 'KES' },
          startDate: new Date(),
          endDate: new Date(),
          status: 'draft',
          uploadedBy: req.user.id
        });
        supplier.contract = contract._id;
      }

      // Calculate SLA metrics
      if (supplier.slaMetrics && supplier.slaMetrics.submissionDate) {
        const daysToComplete = Math.ceil(
          (new Date() - supplier.slaMetrics.submissionDate) / (1000 * 60 * 60 * 24)
        );
        supplier.slaMetrics.actualCompletionDate = new Date();
        supplier.slaMetrics.daysToComplete = daysToComplete;
        supplier.slaMetrics.isOverdue = daysToComplete > 14;
      }
    }


    await supplier.save();

    // Notify supplier
    if (supplier.submittedBy) {
      let message = '';
      if (supplier.status === 'approved') {
        message = 'Your application has been fully approved! Awaiting vendor number assignment.';
      } else if (supplier.status === 'pending_legal') {
        message = 'Your application has been approved by procurement and is now under legal review.';
      } else if (supplier.status === 'pending_contract_upload') {
        message = 'Your application has been approved by legal and is now pending contract upload.';
      } else if (supplier.status === 'completed') {
        message = 'Your onboarding is complete. Your contract has been processed.';
      } else {
        message = `Your application status has been updated to ${supplier.status.replace(/_/g, ' ')}.`;
      }

      await createNotification({
        recipient: supplier.submittedBy._id,
        type: 'application_approved',
        title: `[${supplier.applicationNumber}] Application Status: ${supplier.status.replace(/_/g, ' ').toUpperCase()}`,
        message,
        relatedEntity: {
          entityType: 'supplier',
          entityId: supplier._id
        },
        actionUrl: `/application/status`
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
        title: `[${supplier.applicationNumber}] Application Rejected`,
        message: `Your application has been rejected. Reason: ${comments}`,
        relatedEntity: {
          entityType: 'supplier',
          entityId: supplier._id
        },
        actionUrl: `/application/${supplier._id}`,
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
        title: `[${supplier.applicationNumber}] Requested More Info`,
        message: `Please provide the following requested information: ${comments}`,
        relatedEntity: {
          entityType: 'supplier',
          entityId: supplier._id
        },
        actionUrl: `/application/${supplier._id}`,
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
  body('vendorNumber').notEmpty().withMessage('Vendor number is required'),
  body('comments').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { vendorNumber, comments } = req.body;
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

    // Assign vendor number and move to legal stage
    supplier.vendorNumber = vendorNumber;
    supplier.status = 'pending_legal';
    supplier.currentApprovalStage = 'legal';
    supplier.approvalHistory.push({
      approver: req.user.id,
      action: 'assigned_vendor_number',
      comments: comments || `Vendor number ${vendorNumber} assigned. Proceeding to legal review.`,
      timestamp: new Date()
    });

    await supplier.save();

    // Sync vendor number across all other applications for the same user
    if (supplier.submittedBy) {
      await Supplier.updateMany(
        {
          submittedBy: supplier.submittedBy._id,
          _id: { $ne: supplier._id } // Don't update the current one again
        },
        {
          $set: { vendorNumber: vendorNumber }
        }
      );
    }

    // Notify legal team
    const legalUsers = await User.find({ role: 'legal', isActive: true });
    for (const user of legalUsers) {
      await createNotification({
        recipient: user._id,
        type: 'new_task_assigned',
        title: `[${supplier.applicationNumber}] Supplier Ready for Legal Review`,
        message: `${supplier.supplierName} has been assigned vendor number ${vendorNumber} and is ready for legal review`,
        relatedEntity: {
          entityType: 'supplier',
          entityId: supplier._id
        },
        actionUrl: `/suppliers/${supplier._id}`
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
        title: `[${supplier.applicationNumber}] Profile Update Approved`,
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

// @route   POST /api/approvals/:supplierId/complete-contract
// @desc    Mark contract as uploaded/completed
// @access  Private (Procurement)
router.post('/:supplierId/complete-contract', protect, authorize('procurement'), [
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

    if (supplier.status !== 'pending_contract_upload') {
      return res.status(400).json({
        success: false,
        message: 'Supplier must be in pending contract upload status'
      });
    }

    supplier.approvalHistory.push({
      approver: req.user.id,
      action: 'contract_uploaded',
      comments: comments || 'Contract uploaded and onboarding completed.',
      timestamp: new Date()
    });

    supplier.status = 'completed';
    supplier.currentApprovalStage = 'completed';
    supplier.approvedAt = new Date();

    await supplier.save();

    // Notify supplier
    if (supplier.submittedBy) {
      await createNotification({
        recipient: supplier.submittedBy._id,
        type: 'application_approved',
        title: `[${supplier.applicationNumber}] Onboarding Complete`,
        message: 'Your supplier onboarding is complete. Contract has been uploaded.',
        relatedEntity: {
          entityType: 'supplier',
          entityId: supplier._id
        },
        actionUrl: `/applications/${supplier._id}`
      });
    }

    res.json({
      success: true,
      message: 'Contract uploaded and onboarding completed',
      data: supplier
    });
  } catch (error) {
    console.error('Complete contract error:', error);
    res.status(500).json({
      success: false,
      message: 'Error completing contract upload'
    });
  }
});

module.exports = router;

