const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const User = require('../models/User');
const Supplier = require('../models/Supplier');
const AdHocVendor = require('../models/AdHocVendor');
const Contract = require('../models/Contract');
const { protect, authorize } = require('../middleware/auth');
const { sendUserInviteEmail } = require('../utils/email');
const { logAction } = require('../utils/auditLogger');

// @route   GET /api/users
// @desc    Get all users
// @access  Private (Super Admin)
router.get('/', protect, authorize('super_admin'), async (req, res) => {
  try {
    const { role, isActive, search, page = 1, limit = 10 } = req.query;
    
    let query = {};
    
    // Filter by role
    if (role) {
      query.role = role;
    }
    
    // Filter by active status
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    // Search
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .populate('createdBy', 'firstName lastName')
      .populate('supplier', 'authorizedPerson.phone supplierName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Fallback: some supplier users are linked via Supplier.submittedBy but may not have User.supplier set.
    // Resolve a supplier phone by submittedBy and attach it to user.phone when user.phone is empty.
    const userIds = users.map((u) => u._id);
    const suppliers = await Supplier.find(
      { submittedBy: { $in: userIds } },
      { submittedBy: 1, authorizedPerson: 1, supplierName: 1, updatedAt: 1, createdAt: 1 }
    )
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean();

    const supplierPhoneByUserId = new Map();
    suppliers.forEach((supplier) => {
      const submittedBy = supplier.submittedBy?.toString();
      const phone = supplier.authorizedPerson?.phone;
      if (submittedBy && phone && !supplierPhoneByUserId.has(submittedBy)) {
        supplierPhoneByUserId.set(submittedBy, phone);
      }
    });

    const normalizedUsers = users.map((userDoc) => {
      const user = userDoc.toObject ? userDoc.toObject() : userDoc;
      const fallbackPhone = supplierPhoneByUserId.get(user._id.toString()) || null;

      if (!user.phone && fallbackPhone) {
        user.phone = fallbackPhone;
      }

      user.supplierContactPhone = fallbackPhone;
      return user;
    });

    const count = await User.countDocuments(query);

    res.json({
      success: true,
      data: normalizedUsers,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users'
    });
  }
});

// @route   GET /api/users/departments
// @desc    Get distinct departments from supplier applications
// @access  Private (Super Admin)
router.get('/departments', protect, authorize('super_admin'), async (req, res) => {
  try {
    // Management users filter contracts by `contract.department`.
    // So the dropdown must reflect departments already used on contracts.
    const contractDepartments = await Contract.distinct('department', {
      department: { $exists: true, $ne: null, $ne: '' }
    });

    // Also include any departments coming from ad-hoc vendor intake.
    const adHocDepartments = await AdHocVendor.distinct('department', {
      department: { $exists: true, $ne: null, $ne: '' }
    });

    const departmentsSet = new Set([
      ...(contractDepartments || []),
      ...(adHocDepartments || []),
    ]);

    const departments = Array.from(departmentsSet)
      .map((dept) => String(dept || '').trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));

    res.json({
      success: true,
      data: departments
    });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching departments'
    });
  }
});

// @route   POST /api/users
// @desc    Create new internal user
// @access  Private (Super Admin)
router.post('/', protect, authorize('super_admin'), [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('role').isIn(['super_admin', 'procurement', 'legal', 'management']).withMessage('Valid role is required'),
  body('department')
    .custom((value, { req }) => {
      if (req.body.role === 'management' && (!value || !String(value).trim())) {
        throw new Error('Department is required for management users');
      }
      return true;
    })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { firstName, lastName, email, role, department, phone } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Generate temporary password (sent via email)
    const tempPassword = crypto.randomBytes(6).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);

    // Create user
    // Internal users (non-suppliers) don't need email verification
    const user = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password: tempPassword,
      role,
      department,
      phone,
      createdBy: req.user.id,
      isActive: true,
      isEmailVerified: true, // Internal users don't need email verification
      mustChangePassword: role === 'legal' || role === 'procurement'
    });

    // Send invite email with temporary password (non-blocking)
    try {
      await sendUserInviteEmail({
        email: user.email,
        tempPassword,
        userName: `${user.firstName} ${user.lastName}`,
        role: role.replace('_', ' ')
      });
    } catch (emailError) {
      console.error('Failed to send user invite email:', emailError.message);
    }

    await logAction(req, 'USER_CREATED', 'User', user._id, `${user.firstName} ${user.lastName}`, { role, email: user.email });

    res.status(201).json({
      success: true,
      data: user.toPublicJSON(),
      message: 'User created successfully. Temporary password has been sent by email.'
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user'
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get single user
// @access  Private (Super Admin)
router.get('/:id', protect, authorize('super_admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('createdBy', 'firstName lastName');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user'
    });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private (Super Admin)
router.put('/:id', protect, authorize('super_admin'), async (req, res) => {
  try {
    const { firstName, lastName, role, department, phone, isActive } = req.body;

    const existingUser = await User.findById(req.params.id).select('role department');
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const updateFields = {};
    if (firstName) updateFields.firstName = firstName;
    if (lastName) updateFields.lastName = lastName;
    if (role) updateFields.role = role;
    if (department !== undefined) updateFields.department = department;
    if (phone !== undefined) updateFields.phone = phone;
    if (isActive !== undefined) updateFields.isActive = isActive;

    const effectiveRole = updateFields.role || existingUser.role;
    const effectiveDepartment = updateFields.department !== undefined
      ? updateFields.department
      : existingUser.department;

    if (effectiveRole === 'management' && (!effectiveDepartment || !String(effectiveDepartment).trim())) {
      return res.status(400).json({
        success: false,
        message: 'Department is required for management users'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    ).select('-password');

    // Determine the specific action for suspend/activate vs general update
    let action = 'USER_UPDATED';
    if (isActive !== undefined && Object.keys(updateFields).length === 1) {
      action = isActive ? 'USER_ACTIVATED' : 'USER_SUSPENDED';
    } else if (isActive === false) {
      action = 'USER_SUSPENDED';
    } else if (isActive === true) {
      action = 'USER_ACTIVATED';
    }
    await logAction(req, action, 'User', user._id, `${user.firstName} ${user.lastName}`, { changes: updateFields });

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user'
    });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (soft delete by deactivating)
// @access  Private (Super Admin)
router.delete('/:id', protect, authorize('super_admin'), async (req, res) => {
  try {
    // Prevent self-deletion
    if (req.params.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await logAction(req, 'USER_DELETED', 'User', user._id, `${user.firstName} ${user.lastName}`, { email: user.email });

    res.json({
      success: true,
      message: 'User deleted successfully',
      data: user
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user'
    });
  }
});

// @route   POST /api/users/:id/reset-password
// @desc    Reset user password
// @access  Private (Super Admin)
router.post('/:id/reset-password', protect, authorize('super_admin'), [
  body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { newPassword } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password'
    });
  }
});

// @route   PUT /api/users/:id/supplier-approval
// @desc    Approve or reject supplier registration
// @access  Private (Procurement, Super Admin)
router.put('/:id/supplier-approval', protect, authorize('procurement', 'super_admin'), [
  body('status').isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected'),
  body('comment').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { status, comment } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role !== 'supplier') {
      return res.status(400).json({
        success: false,
        message: 'Approval is only available for supplier accounts'
      });
    }

    if (user.supplierApprovalStatus === 'profile_incomplete') {
      return res.status(400).json({
        success: false,
        message: 'Supplier profile is incomplete. Approval can only be done after profile details are completed.'
      });
    }

    user.supplierApprovalStatus = status;
    user.supplierApprovalReviewedBy = req.user.id;
    user.supplierApprovalReviewedAt = new Date();
    user.supplierApprovalComment = comment || '';
    await user.save();

    return res.json({
      success: true,
      message: `Supplier registration ${status} successfully`,
      data: user.toPublicJSON()
    });
  } catch (error) {
    console.error('Supplier registration approval error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error processing supplier registration approval'
    });
  }
});

module.exports = router;
