const express = require('express');
const router = express.Router();
const Supplier = require('../models/Supplier');
const Contract = require('../models/Contract');
const User = require('../models/User');
const Document = require('../models/Document');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const role = req.user.role;
    let stats = {};

    if (role === 'supplier') {
      // Supplier dashboard stats
      const supplier = await Supplier.findOne({ submittedBy: req.user.id });

      if (supplier) {
        const documents = await Document.countDocuments({ supplier: supplier._id });

        stats = {
          applicationStatus: supplier.status,
          vendorNumber: supplier.vendorNumber,
          documentsUploaded: documents,
          hasContract: !!supplier.contract,
          applicationDate: supplier.submittedAt,
          approvalProgress: {
            procurement: supplier.approvalHistory.some(h =>
              h.action === 'approved' && h.approver
            ),
            legal: supplier.currentApprovalStage === 'completed'
          }
        };
      }
    } else {
      // Internal user dashboard stats - use unique supplier user account count
      const [
        totalSuppliers,
        pendingApplications,
        approvedSuppliersResult,
        rejectedSuppliersResult,
        activeContracts,
        expiringContracts,
        overdueApplications
      ] = await Promise.all([
        User.countDocuments({ role: 'supplier' }),
        Supplier.countDocuments({
          status: { $in: ['submitted', 'under_review', 'pending_legal', 'pending_procurement'] },
          isProfileOnly: { $ne: true }
        }),
        Supplier.aggregate([
          { $match: { status: 'approved' } },
          { $group: { _id: '$supplierName' } },
          { $count: 'total' }
        ]),
        Supplier.aggregate([
          { $match: { status: 'rejected' } },
          { $group: { _id: '$supplierName' } },
          { $count: 'total' }
        ]),
        Contract.countDocuments({ status: 'active' }),
        Contract.countDocuments({
          status: 'active',
          endDate: {
            $gte: new Date(),
            $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          }
        }),
        Supplier.countDocuments({
          'slaMetrics.isOverdue': true,
          status: { $nin: ['approved', 'rejected'] }
        })
      ]);
      const approvedSuppliers = approvedSuppliersResult.length > 0 ? approvedSuppliersResult[0].total : 0;
      const rejectedSuppliers = rejectedSuppliersResult.length > 0 ? rejectedSuppliersResult[0].total : 0;

      stats = {
        totalSuppliers,
        pendingApplications,
        approvedSuppliers,
        rejectedSuppliers,
        activeContracts,
        expiringContracts,
        overdueApplications
      };

      // Role-specific stats
      if (role === 'procurement') {
        stats.myTasks = await Supplier.countDocuments({ procurementOfficer: req.user._id, isProfileOnly: { $ne: true } });
        stats.allTasks = await Supplier.countDocuments({
          status: { $in: ['submitted', 'pending_procurement', 'more_info_required'] },
          isProfileOnly: { $ne: true },
          $or: [{ assignedTo: null }, { assignedTo: { $exists: false } }]
        });
      } else if (role === 'legal') {
        stats.myTasks = await Supplier.countDocuments({ legalOfficer: req.user._id, isProfileOnly: { $ne: true } });
        stats.allTasks = await Supplier.countDocuments({
          status: 'pending_legal',
          isProfileOnly: { $ne: true },
          $or: [{ assignedTo: null }, { assignedTo: { $exists: false } }]
        });
      }
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics'
    });
  }
});

// @route   GET /api/dashboard/recent-activities
// @desc    Get recent activities
// @access  Private
router.get('/recent-activities', protect, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    let activities = [];

    if (req.user.role === 'supplier') {
      // Get supplier's recent activities
      const supplier = await Supplier.findOne({ submittedBy: req.user.id })
        .populate('approvalHistory.approver', 'firstName lastName role');

      if (supplier) {
        activities = supplier.approvalHistory
          .slice(-limit)
          .reverse()
          .map(h => ({
            type: h.action,
            description: `Application ${h.action} by ${h.approver?.firstName} ${h.approver?.lastName}`,
            timestamp: h.timestamp,
            comments: h.comments
          }));
      }
    } else {
      // Get recent suppliers for internal users
      const recentSuppliers = await Supplier.find()
        .populate('submittedBy', 'firstName lastName')
        .sort({ updatedAt: -1 })
        .limit(limit);

      activities = recentSuppliers.map(s => ({
        type: 'supplier_update',
        supplierId: s._id,
        supplierName: s.supplierName,
        status: s.status,
        description: `${s.supplierName} - ${s.status}`,
        timestamp: s.updatedAt
      }));
    }

    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    console.error('Get recent activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recent activities'
    });
  }
});

// @route   GET /api/dashboard/tasks
// @desc    Get pending tasks based on role with counts and task list
// @access  Private (Procurement, Legal)
router.get('/tasks', protect, authorize('procurement', 'legal', 'super_admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', requestType = '', status = '', sortOrder = 'asc', view = 'all' } = req.query;
    let query = {};
    let allTasks = [];

    if (view === 'mine') {
      // "My Tasks": all applications this user has ever picked up, tracked across all stages
      if (req.user.role === 'procurement') {
        query = { procurementOfficer: req.user._id, isProfileOnly: { $ne: true } };
      } else if (req.user.role === 'legal') {
        query = { legalOfficer: req.user._id, isProfileOnly: { $ne: true } };
      } else {
        query = { assignedTo: req.user._id, isProfileOnly: { $ne: true } };
      }
    } else {
      // "All Tasks": unassigned applications at this role's current stage
      if (req.user.role === 'procurement') {
        query = {
          $and: [
            {
              $or: [
                { status: { $in: ['submitted', 'pending_procurement', 'more_info_required', 'rejected'] }, isProfileOnly: { $ne: true } },
                { 'profileUpdateRequests.status': 'pending' },
                { status: 'approved', vendorNumber: { $exists: false } }
              ]
            },
            { $or: [{ assignedTo: null }, { assignedTo: { $exists: false } }] }
          ]
        };
      } else if (req.user.role === 'legal') {
        query = {
          status: { $in: ['pending_legal', 'approved', 'pending_contract_upload', 'rejected'] },
          isProfileOnly: { $ne: true },
          $or: [{ assignedTo: null }, { assignedTo: { $exists: false } }]
        };
      }
    }

    // Fetch all tasks (we'll process them to categorize)
    const suppliers = await Supplier.find(query)
      .populate('submittedBy', 'firstName lastName email')
      .populate('approvalHistory.approver', 'firstName department')
      .sort({ submittedAt: 1, 'profileUpdateRequests.requestedAt': 1 })
      .lean();

    const getLastApproverInfo = (supplier) => {
      const history = supplier.approvalHistory || [];
      const last = [...history].reverse().find(h => h.approver);
      return {
        lastApprover: last?.approver?.firstName || '-',
        lastApproverDepartment: last?.approver?.department || '-',
      };
    };

    const makeAppTask = (supplier, overrides = {}) => ({
      _id: supplier._id,
      taskId: `APP-${new Date(supplier.submittedAt || supplier.createdAt).getFullYear()}-${supplier._id.toString().slice(-3).toUpperCase()}`,
      supplierName: supplier.supplierName,
      requestType: 'Supplier Application',
      submissionDate: supplier.submittedAt || supplier.createdAt,
      rawStatus: supplier.status,
      assignedTo: supplier.assignedTo || null,
      entityType: supplier.entityType || supplier.legalNature,
      contractId: supplier.contract,
      ...getLastApproverInfo(supplier),
      supplier: supplier,
      ...overrides
    });

    // Process tasks to create unified task list
    if (view === 'mine') {
      // "My Tasks": show all owned applications at every stage
      const statusLabel = {
        submitted: 'Pending Review',
        pending_procurement: 'Pending Review',
        more_info_required: 'More Info Required',
        pending_legal: 'Pending Legal Approval',
        approved: 'Approved',
        pending_contract_upload: 'Pending Contract Upload',
        rejected: 'Rejected',
        completed: 'Completed',
      };
      suppliers.forEach(supplier => {
        if (supplier.isProfileOnly) return;
        allTasks.push(makeAppTask(supplier, {
          requestType: ['submitted', 'pending_procurement', 'more_info_required'].includes(supplier.status)
            ? 'New Supplier Application' : 'Supplier Application',
          status: statusLabel[supplier.status] || supplier.status,
        }));
      });
    } else {
      suppliers.forEach(supplier => {
      // New supplier applications (procurement)
      if (supplier.status && ['submitted', 'pending_procurement', 'more_info_required'].includes(supplier.status) && !supplier.isProfileOnly) {
        allTasks.push(makeAppTask(supplier, {
          requestType: 'New Supplier Application',
          status: supplier.status === 'more_info_required' ? 'More Info Required' : 'Pending Review',
        }));
      }

      // Legal tasks: pending_legal
      if (supplier.status === 'pending_legal' && !supplier.isProfileOnly) {
        allTasks.push(makeAppTask(supplier, { status: 'Pending Approval' }));
      }

      if (supplier.status === 'approved' && !supplier.isProfileOnly) {
        allTasks.push(makeAppTask(supplier, { status: 'Approved' }));
      }

      if (supplier.status === 'pending_contract_upload' && !supplier.isProfileOnly) {
        allTasks.push(makeAppTask(supplier, { status: 'Pending Contract Upload' }));
      }

      // Rejected suppliers
      if (supplier.status === 'rejected' && !supplier.isProfileOnly) {
        allTasks.push(makeAppTask(supplier, { status: 'Rejected' }));
      }

      // Vendor number assignments (approved but no vendor number)
      if (supplier.status === 'approved' && !supplier.vendorNumber && !supplier.isProfileOnly) {
        allTasks.push({
          _id: supplier._id,
          taskId: `VN-${new Date(supplier.approvedAt || supplier.updatedAt).getFullYear()}-${supplier._id.toString().slice(-3).toUpperCase()}`,
          supplierName: supplier.supplierName,
          requestType: 'Vendor Number Assignment',
          submissionDate: supplier.approvedAt || supplier.updatedAt,
          status: 'Pending Vendor Number Assignment',
          rawStatus: supplier.status,
          assignedTo: supplier.assignedTo || null,
          ...getLastApproverInfo(supplier),
          supplier: supplier
        });
      }

      // Profile update requests - check if supplier has pending profile updates
      // Check for contact info updates (profileUpdateComment field exists)
      if (supplier.profileUpdateComment && supplier.status !== 'draft') {
        // Check if there are pending profile update requests related to contact info
        const hasPendingContactUpdates = supplier.profileUpdateRequests &&
          supplier.profileUpdateRequests.some(req =>
            req.status === 'pending' &&
            (req.field === 'authorizedPerson' || req.field === 'additionalContacts')
          );

        if (hasPendingContactUpdates || supplier.profileUpdateComment) {
          allTasks.push({
            _id: `${supplier._id}-contact-update`,
            taskId: `CI-${new Date(supplier.updatedAt).getFullYear()}-${supplier._id.toString().slice(-3).toUpperCase()}`,
            supplierName: supplier.supplierName,
            requestType: 'Contact Info Update',
            submissionDate: supplier.updatedAt,
            status: 'Pending Review',
            supplier: supplier
          });
        }
      }

      // Check for company profile updates (companyUpdateComment field exists)
      if (supplier.companyUpdateComment && supplier.status !== 'draft') {
        // Check if there are pending profile update requests related to company info
        const hasPendingCompanyUpdates = supplier.profileUpdateRequests &&
          supplier.profileUpdateRequests.some(req =>
            req.status === 'pending' &&
            req.field !== 'authorizedPerson' &&
            req.field !== 'additionalContacts'
          );

        if (hasPendingCompanyUpdates || supplier.companyUpdateComment) {
          allTasks.push({
            _id: `${supplier._id}-company-update`,
            taskId: `VN-${new Date(supplier.updatedAt).getFullYear()}-${supplier._id.toString().slice(-3).toUpperCase()}`,
            supplierName: supplier.supplierName,
            requestType: 'Company Profile Update',
            submissionDate: supplier.updatedAt,
            status: 'Pending Review',
            supplier: supplier
          });
        }
      }
    }); // end else (view === 'all')
    } // end if/else view

    // Termination recommendations
    if (req.user.role === 'legal' || req.user.role === 'super_admin') {
      const terminationContracts = await Contract.find({ status: 'termination_recommended' })
        .populate({ path: 'supplier', select: 'supplierName legalOfficer' })
        .populate('terminationRecommendedBy', 'firstName lastName')
        .lean();

      const makeTerminationTask = (contract) => {
        const year = new Date(contract.terminationRecommendedAt || contract.updatedAt).getFullYear();
        const shortId = contract._id.toString().slice(-3).toUpperCase();
        const recommender = contract.terminationRecommendedBy
          ? `${contract.terminationRecommendedBy.firstName} ${contract.terminationRecommendedBy.lastName}`.trim()
          : 'HOD';
        return {
          _id: contract._id,
          taskId: `CTR-${year}-${shortId}`,
          supplierName: contract.supplier?.supplierName || contract.contractNumber,
          requestType: 'Contract Termination Review',
          submissionDate: contract.terminationRecommendedAt || contract.updatedAt,
          status: 'Termination Recommended',
          rawStatus: 'termination_recommended',
          contractId: contract._id,
          lastApprover: recommender,
          lastApproverDepartment: '-',
        };
      };

      const currentUserId = req.user._id.toString();

      terminationContracts.forEach((contract) => {
        const legalOfficerId = contract.supplier?.legalOfficer?.toString();

        if (view === 'mine') {
          // My Tasks: only the legal officer who handled this contract sees it
          if (legalOfficerId === currentUserId) {
            allTasks.push(makeTerminationTask(contract));
          }
        } else {
          // All Tasks: unassigned contracts (no legal officer) + super_admin sees everything
          if (req.user.role === 'super_admin' || !legalOfficerId) {
            allTasks.push(makeTerminationTask(contract));
          }
        }
      });
    }

    // Apply search filter
    if (search) {
      allTasks = allTasks.filter(task =>
        (task.supplierName || '').toLowerCase().includes(search.toLowerCase()) ||
        task.taskId.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply request type filter
    if (requestType) {
      allTasks = allTasks.filter(task => task.requestType === requestType);
    }

    // Apply status filter
    if (status) {
      allTasks = allTasks.filter(task => task.rawStatus === status || task.status === status);
    }

    // Apply sort
    allTasks.sort((a, b) => {
      const dateA = new Date(a.submissionDate || 0);
      const dateB = new Date(b.submissionDate || 0);
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    // Calculate counts (always computed fresh, not affected by current view filter)
    // myTasks = all applications this user has ever owned at their stage
    let myTasksCount;
    if (req.user.role === 'procurement') {
      myTasksCount = await Supplier.countDocuments({ procurementOfficer: req.user._id, isProfileOnly: { $ne: true } });
    } else if (req.user.role === 'legal') {
      myTasksCount = await Supplier.countDocuments({ legalOfficer: req.user._id, isProfileOnly: { $ne: true } });
    } else {
      myTasksCount = await Supplier.countDocuments({ assignedTo: req.user._id, isProfileOnly: { $ne: true } });
    }

    let allTasksCount = 0;
    if (req.user.role === 'procurement') {
      allTasksCount = await Supplier.countDocuments({
        status: { $in: ['submitted', 'pending_procurement', 'more_info_required'] },
        isProfileOnly: { $ne: true },
        $or: [{ assignedTo: null }, { assignedTo: { $exists: false } }]
      });
    } else if (req.user.role === 'legal') {
      allTasksCount = await Supplier.countDocuments({
        status: 'pending_legal',
        isProfileOnly: { $ne: true },
        $or: [{ assignedTo: null }, { assignedTo: { $exists: false } }]
      });
    }

    const counts = {
      myTasks: myTasksCount,
      allTasks: allTasksCount,
      pendingApplications: allTasks.filter(t => t.requestType === 'New Supplier Application').length,
      pendingVendorAssignment: allTasks.filter(t => t.requestType === 'Vendor Number Assignment').length,
      pendingProfileUpdate: allTasks.filter(t => t.requestType === 'Company Profile Update').length,
      pendingContactUpdate: allTasks.filter(t => t.requestType === 'Contact Info Update').length
    };

    // Paginate
    const total = allTasks.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedTasks = allTasks.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedTasks,
      counts,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tasks'
    });
  }
});

// @route   GET /api/dashboard/all-tasks
// @desc    Get all supplier onboarding tasks (all statuses)
// @access  Private (Procurement, Legal, Super Admin)
router.get('/all-tasks', protect, authorize('procurement', 'legal', 'super_admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '', sortOrder = 'desc' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    let query = { isProfileOnly: { $ne: true } };

    if (search) {
      query.$or = [
        { supplierName: { $regex: search, $options: 'i' } },
        { vendorNumber: { $regex: search, $options: 'i' } },
      ];
    }

    if (status) {
      query.status = status;
    }

    const sortDir = sortOrder === 'asc' ? 1 : -1;

    const total = await Supplier.countDocuments(query);
    const suppliers = await Supplier.find(query)
      .populate('submittedBy', 'firstName lastName email')
      .populate('approvalHistory.approver', 'firstName department')
      .sort({ submittedAt: sortDir, createdAt: sortDir })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    const statusMap = {
      draft: 'Draft',
      submitted: 'Pending Review',
      pending_procurement: 'Pending Review',
      under_review: 'Under Review',
      pending_legal: 'Pending Legal Approval',
      pending_contract_upload: 'Pending Contract Upload',
      approved: 'Approved',
      completed: 'Completed',
      rejected: 'Rejected',
      more_info_required: 'More Info Required',
    };

    const tasks = suppliers.map(supplier => {
      const history = supplier.approvalHistory || [];
      const lastEntry = [...history].reverse().find(h => h.approver);
      return {
        _id: supplier._id,
        contractId: supplier.status === 'pending_contract_upload' ? supplier.contract : undefined,
        taskId: `APP-${new Date(supplier.submittedAt || supplier.createdAt).getFullYear()}-${supplier._id.toString().slice(-3).toUpperCase()}`,
        supplierName: supplier.supplierName,
        entityType: supplier.entityType
          ? supplier.entityType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
          : supplier.legalNature
            ? supplier.legalNature.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
            : '-',
        lastApprover: lastEntry?.approver?.firstName || '-',
        lastApproverDepartment: lastEntry?.approver?.department || '-',
        submissionDate: supplier.submittedAt || supplier.createdAt,
        status: statusMap[supplier.status] || supplier.status,
        rawStatus: supplier.status,
      };
    });

    res.json({
      success: true,
      data: tasks,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum
      }
    });
  } catch (error) {
    console.error('Get all tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching all tasks'
    });
  }
});

// @route   GET /api/dashboard/sla-report
// @desc    Get SLA performance report
// @access  Private (Management, Super Admin)
router.get('/sla-report', protect, authorize('management', 'super_admin'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let query = {
      status: 'approved',
      'slaMetrics.submissionDate': { $exists: true }
    };

    if (startDate && endDate) {
      query['slaMetrics.submissionDate'] = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const suppliers = await Supplier.find(query)
      .select('supplierName slaMetrics approvedAt submittedAt')
      .lean();

    // Calculate metrics
    const totalApplications = suppliers.length;
    const onTimeApplications = suppliers.filter(s => !s.slaMetrics.isOverdue).length;
    const overdueApplications = suppliers.filter(s => s.slaMetrics.isOverdue).length;
    const averageDays = suppliers.reduce((acc, s) => acc + (s.slaMetrics.daysToComplete || 0), 0) / totalApplications;

    const report = {
      totalApplications,
      onTimeApplications,
      overdueApplications,
      onTimePercentage: ((onTimeApplications / totalApplications) * 100).toFixed(2),
      averageProcessingDays: averageDays.toFixed(2),
      details: suppliers
    };

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Get SLA report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching SLA report'
    });
  }
});

// @route   GET /api/dashboard/contract-summary
// @desc    Get contract summary
// @access  Private (Management, Legal, Procurement)
router.get('/contract-summary', protect, authorize('management', 'legal', 'procurement', 'super_admin'), async (req, res) => {
  try {
    const [
      totalContracts,
      activeContracts,
      expiredContracts,
      expiringIn30Days,
      expiringIn60Days,
      totalValue
    ] = await Promise.all([
      Contract.countDocuments(),
      Contract.countDocuments({ status: 'active' }),
      Contract.countDocuments({ status: 'expired' }),
      Contract.countDocuments({
        status: 'active',
        endDate: {
          $gte: new Date(),
          $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      }),
      Contract.countDocuments({
        status: 'active',
        endDate: {
          $gte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          $lte: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
        }
      }),
      Contract.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: null, total: { $sum: '$value.amount' } } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        totalContracts,
        activeContracts,
        expiredContracts,
        expiringIn30Days,
        expiringIn60Days,
        totalActiveValue: totalValue[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Get contract summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching contract summary'
    });
  }
});

module.exports = router;
