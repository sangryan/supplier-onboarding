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
      // Internal user dashboard stats
      const [
        totalSuppliers,
        pendingApplications,
        approvedSuppliers,
        rejectedSuppliers,
        activeContracts,
        expiringContracts,
        overdueApplications
      ] = await Promise.all([
        Supplier.countDocuments(),
        Supplier.countDocuments({ 
          status: { $in: ['submitted', 'under_review', 'pending_legal', 'pending_procurement'] }
        }),
        Supplier.countDocuments({ status: 'approved' }),
        Supplier.countDocuments({ status: 'rejected' }),
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
        const myTasks = await Supplier.countDocuments({
          status: { $in: ['submitted', 'pending_procurement', 'more_info_required'] }
        });
        stats.myTasks = myTasks;
      } else if (role === 'legal') {
        const myTasks = await Supplier.countDocuments({
          status: 'pending_legal'
        });
        stats.myTasks = myTasks;
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
    const { page = 1, limit = 10, search = '', requestType = '' } = req.query;
    let query = {};
    let allTasks = [];

    if (req.user.role === 'procurement') {
      // Get all suppliers that need procurement attention
      query = {
        $or: [
          { status: { $in: ['submitted', 'pending_procurement', 'more_info_required'] }, isProfileOnly: { $ne: true } },
          { 'profileUpdateRequests.status': 'pending' },
          { status: 'approved', vendorNumber: { $exists: false } }
        ]
      };
    } else if (req.user.role === 'legal') {
      query = { status: 'pending_legal', isProfileOnly: { $ne: true } };
    }

    // Fetch all tasks (we'll process them to categorize)
    const suppliers = await Supplier.find(query)
      .populate('submittedBy', 'firstName lastName email')
      .sort({ submittedAt: 1, 'profileUpdateRequests.requestedAt': 1 })
      .lean();

    // Process tasks to create unified task list
    suppliers.forEach(supplier => {
      // New supplier applications
      if (supplier.status && ['submitted', 'pending_procurement', 'more_info_required'].includes(supplier.status) && !supplier.isProfileOnly) {
        allTasks.push({
          _id: supplier._id,
          taskId: `APP-${new Date(supplier.submittedAt || supplier.createdAt).getFullYear()}-${supplier._id.toString().slice(-3).toUpperCase()}`,
          supplierName: supplier.supplierName,
          requestType: 'New Supplier Application',
          submissionDate: supplier.submittedAt || supplier.createdAt,
          status: supplier.status === 'submitted' ? 'Pending Review' : 
                 supplier.status === 'pending_procurement' ? 'Pending Review' : 
                 supplier.status === 'more_info_required' ? 'More Info Required' : 'Pending Review',
          supplier: supplier
        });
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
    });

    // Apply search filter
    if (search) {
      allTasks = allTasks.filter(task => 
        task.supplierName.toLowerCase().includes(search.toLowerCase()) ||
        task.taskId.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply request type filter
    if (requestType) {
      allTasks = allTasks.filter(task => task.requestType === requestType);
    }

    // Calculate counts
    const counts = {
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

