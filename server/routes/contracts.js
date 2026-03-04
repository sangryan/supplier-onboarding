const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Contract = require('../models/Contract');
const Supplier = require('../models/Supplier');
const Document = require('../models/Document');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { createNotification } = require('../utils/notifications');

// @route   POST /api/contracts
// @desc    Create new contract
// @access  Private (Legal, Procurement)
router.post('/', protect, authorize('legal', 'procurement', 'super_admin'), [
  body('supplier').notEmpty().withMessage('Supplier is required'),
  body('title').notEmpty().withMessage('Contract title is required'),
  body('contractType').notEmpty().withMessage('Contract type is required'),
  body('value.amount').isNumeric().withMessage('Contract value is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Verify supplier exists and is approved
    const supplier = await Supplier.findById(req.body.supplier);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    if (supplier.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Supplier must be approved before creating contract'
      });
    }

    // Generate contract number
    const contractNumber = await Contract.generateContractNumber();

    // Create contract
    const contract = await Contract.create({
      ...req.body,
      contractNumber,
      uploadedBy: req.user.id,
      status: 'draft'
    });

    // Link contract to supplier
    supplier.contract = contract._id;
    await supplier.save();

    res.status(201).json({
      success: true,
      data: contract
    });
  } catch (error) {
    console.error('Create contract error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating contract'
    });
  }
});

// @route   GET /api/contracts/stats
// @desc    Get contract statistics
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const active = await Contract.countDocuments({ status: 'active' });
    const expired = await Contract.countDocuments({ status: 'expired' });

    // Expiring soon: active contracts ending in 30 days
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);
    const expiringSoon = await Contract.countDocuments({
      status: 'active',
      endDate: {
        $gte: new Date(),
        $lte: expiryDate
      }
    });

    // AdHoc Vendors count (includes those with contracts and those pending upload)
    const adHocSuppliersForStats = await Supplier.find({ vendorNumber: /^VND-ADHOC-/ }).select('_id status contract');
    const adHocSupplierIdsForStats = adHocSuppliersForStats.map(s => s._id);

    // Count contracts for adhoc suppliers
    const adHocContractsCount = await Contract.countDocuments({ supplier: { $in: adHocSupplierIdsForStats } });

    // Count adhoc suppliers who are pending_contract_upload but don't have a contract yet
    const pendingAdHocSuppliersCount = adHocSuppliersForStats.filter(s => s.status === 'pending_contract_upload' && !s.contract).length;

    const adHoc = adHocContractsCount + pendingAdHocSuppliersCount;

    res.json({
      success: true,
      data: {
        active,
        expired,
        expiringSoon,
        adHoc
      }
    });
  } catch (error) {
    console.error('Get contract stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching contract statistics'
    });
  }
});

// @route   GET /api/contracts
// @desc    Get all contracts
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10, supplierType } = req.query;

    let query = {};

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Search
    if (search) {
      query.$or = [
        { contractNumber: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by supplier type (Ad-hoc vs Registered)
    if (supplierType) {
      if (supplierType === 'adhoc') {
        const adHocSuppliers = await Supplier.find({ vendorNumber: /^VND-ADHOC-/ }).select('_id');
        query.supplier = { $in: adHocSuppliers.map(s => s._id) };
      } else if (supplierType === 'registered') {
        const registeredSuppliers = await Supplier.find({
          $or: [
            { vendorNumber: { $not: /^VND-ADHOC-/ } },
            { vendorNumber: { $exists: false } }
          ]
        }).select('_id');
        query.supplier = { $in: registeredSuppliers.map(s => s._id) };
      }
    }

    // Fetch contracts and filter by associated supplier status or contact status
    let contracts = await Contract.find(query)
      .populate('supplier', 'supplierName vendorNumber status')
      .populate('uploadedBy', 'firstName lastName')
      .populate('signedContract')
      .lean();

    // FILTER: Only keep if contract is active OR supplier is in 'pending_contract_upload'
    contracts = contracts.filter(c => {
      if (c.status === 'active') return true;
      if (c.supplier && c.supplier.status === 'pending_contract_upload') return true;
      return false;
    });

    // Also find suppliers who are in 'pending_contract_upload' stage but might not have a contract record yet
    let supplierQuery = { status: 'pending_contract_upload' };
    if (search) {
      supplierQuery.supplierName = { $regex: search, $options: 'i' };
    }

    if (supplierType) {
      if (supplierType === 'adhoc') {
        supplierQuery.vendorNumber = /^VND-ADHOC-/;
      } else if (supplierType === 'registered') {
        supplierQuery.$or = [
          { vendorNumber: { $not: /^VND-ADHOC-/ } },
          { vendorNumber: { $exists: false } }
        ];
      }
    }
    const pendingSuppliers = await Supplier.find(supplierQuery).populate('contract').lean();

    // Merge pending suppliers who don't have contracts in the list yet
    pendingSuppliers.forEach(s => {
      const hasContractInList = contracts.some(c => c.supplier && c.supplier._id.toString() === s._id.toString());
      if (!hasContractInList) {
        contracts.push({
          _id: s.contract?._id || s._id,
          supplier: {
            _id: s._id,
            supplierName: s.supplierName,
            vendorNumber: s.vendorNumber,
            status: s.status
          },
          status: 'pending_upload',
          createdAt: s.updatedAt,
          updatedAt: s.updatedAt,
          isPlaceholder: !s.contract
        });
      }
    });

    // Re-sort after merge
    contracts.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));

    const total = contracts.length;
    const paginatedContracts = contracts.slice((page - 1) * limit, page * limit);

    res.json({
      success: true,
      data: paginatedContracts,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get contracts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching contracts'
    });
  }
});

// @route   GET /api/contracts/:id
// @desc    Get single contract
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id)
      .populate('supplier')
      .populate('uploadedBy', 'firstName lastName')
      .populate('approvedBy', 'firstName lastName')
      .populate('signedContract')
      .populate('attachments')
      .populate('amendments.createdBy', 'firstName lastName')
      .populate('amendments.documentId');

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found'
      });
    }

    // Get supplier documents
    let supplierDocuments = [];
    if (contract.supplier) {
      supplierDocuments = await Document.find({ supplier: contract.supplier._id })
        .populate('uploadedBy', 'firstName lastName')
        .sort({ uploadedAt: -1 });
    }

    // Convert to plain object to attach documents
    const contractObj = contract.toObject();
    if (contractObj.supplier) {
      contractObj.supplier.documents = supplierDocuments;
    }

    res.json({
      success: true,
      data: contractObj
    });
  } catch (error) {
    console.error('Get contract error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching contract'
    });
  }
});

// @route   PUT /api/contracts/:id
// @desc    Update contract
// @access  Private (Legal, Procurement)
router.put('/:id', protect, authorize('legal', 'procurement', 'super_admin'), async (req, res) => {
  try {
    // If status is being set to active, ensure signedContract exists
    if (req.body.status === 'active') {
      const currentContract = await Contract.findById(req.params.id);
      if (!currentContract.signedContract && !req.body.signedContract) {
        return res.status(400).json({
          success: false,
          message: 'Cannot activate contract without a signed document. Please upload the signed contract first.'
        });
      }
    }

    const contract = await Contract.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found'
      });
    }

    res.json({
      success: true,
      data: contract
    });
  } catch (error) {
    console.error('Update contract error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating contract'
    });
  }
});

// @route   POST /api/contracts/:id/activate
// @desc    Activate contract
// @access  Private (Legal)
router.post('/:id/activate', protect, authorize('legal', 'super_admin'), async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id)
      .populate('supplier');

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found'
      });
    }

    if (!contract.signedContract) {
      return res.status(400).json({
        success: false,
        message: 'Please upload signed contract before activating'
      });
    }

    contract.status = 'active';
    contract.approvedBy = req.user.id;
    contract.approvedAt = new Date();
    await contract.save();

    // Notify supplier
    const supplier = await Supplier.findById(contract.supplier._id).populate('submittedBy');
    if (supplier && supplier.submittedBy) {
      await createNotification({
        recipient: supplier.submittedBy._id,
        type: 'contract_uploaded',
        title: `[${supplier.applicationNumber}] Contract Activated`,
        message: `Your contract ${contract.contractNumber} has been activated`,
        relatedEntity: {
          entityType: 'contract',
          entityId: contract._id
        },
        actionUrl: `/contracts/${contract._id}`
      });
    }

    res.json({
      success: true,
      message: 'Contract activated successfully',
      data: contract
    });
  } catch (error) {
    console.error('Activate contract error:', error);
    res.status(500).json({
      success: false,
      message: 'Error activating contract'
    });
  }
});

// @route   POST /api/contracts/:id/upload-signed
// @desc    Upload signed contract document
// @access  Private (Legal)
router.post('/:id/upload-signed', protect, authorize('legal', 'super_admin'), upload.single('contract'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found'
      });
    }

    // Create document record
    const document = await Document.create({
      supplier: contract.supplier,
      documentType: 'other',
      fileName: req.file.filename,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      filePath: req.file.path,
      uploadedBy: req.user.id,
      notes: `Signed contract for ${contract.contractNumber}`,
      status: 'approved'
    });

    // Link document to contract
    contract.signedContract = document._id;
    contract.status = 'active';

    // Update additional fields from request body
    if (req.body.validityMonths) contract.validityMonths = Number(req.body.validityMonths);
    if (req.body.noticePeriodMonths) contract.noticePeriodMonths = Number(req.body.noticePeriodMonths);
    if (req.body.department) contract.department = req.body.department;
    if (req.body.comment) contract.notes = req.body.comment;

    await contract.save();

    res.json({
      success: true,
      data: contract
    });
  } catch (error) {
    console.error('Upload signed contract error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading signed contract'
    });
  }
});

// @route   POST /api/contracts/:id/amendments
// @desc    Add contract amendment
// @access  Private (Legal)
router.post('/:id/amendments', protect, authorize('legal', 'super_admin'), upload.single('amendment'), [
  body('description').notEmpty().withMessage('Amendment description is required'),
  body('effectiveDate').isISO8601().withMessage('Valid effective date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found'
      });
    }

    let documentId = null;
    if (req.file) {
      const document = await Document.create({
        supplier: contract.supplier,
        documentType: 'other',
        fileName: req.file.filename,
        originalName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        filePath: req.file.path,
        uploadedBy: req.user.id,
        notes: `Amendment for contract ${contract.contractNumber}`,
        status: 'approved'
      });
      documentId = document._id;
    }

    // Generate amendment number
    const amendmentNumber = `${contract.contractNumber}-AMD-${contract.amendments.length + 1}`;

    contract.amendments.push({
      amendmentNumber,
      description: req.body.description,
      effectiveDate: req.body.effectiveDate,
      documentId,
      createdBy: req.user.id
    });

    await contract.save();

    res.json({
      success: true,
      data: contract
    });
  } catch (error) {
    console.error('Add amendment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding amendment'
    });
  }
});

// @route   GET /api/contracts/expiring
// @desc    Get contracts expiring soon
// @access  Private (Management, Procurement, Legal)
router.get('/reports/expiring', protect, authorize('management', 'procurement', 'legal', 'super_admin'), async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + parseInt(days));

    const contracts = await Contract.find({
      status: 'active',
      endDate: {
        $gte: new Date(),
        $lte: expiryDate
      }
    })
      .populate('supplier', 'supplierName vendorNumber')
      .sort({ endDate: 1 });

    res.json({
      success: true,
      data: contracts
    });
  } catch (error) {
    console.error('Get expiring contracts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching expiring contracts'
    });
  }
});

// @route   POST /api/contracts/:id/terminate
// @desc    Terminate contract
// @access  Private (Legal)
router.post('/:id/terminate', protect, authorize('legal', 'super_admin'), async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id)
      .populate('supplier');

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found'
      });
    }

    if (contract.status === 'terminated') {
      return res.status(400).json({
        success: false,
        message: 'Contract is already terminated'
      });
    }

    contract.status = 'terminated';
    contract.terminatedAt = new Date();
    contract.terminatedBy = req.user.id;
    await contract.save();

    // Notify supplier
    const supplier = await Supplier.findById(contract.supplier._id).populate('submittedBy');
    if (supplier && supplier.submittedBy) {
      await createNotification({
        recipient: supplier.submittedBy._id,
        type: 'contract_terminated',
        title: `[${supplier.applicationNumber}] Contract Terminated`,
        message: `Your contract ${contract.contractNumber} has been terminated.`,
        relatedEntity: {
          entityType: 'contract',
          entityId: contract._id
        },
        actionUrl: `/contracts/${contract._id}`,
        priority: 'high'
      });
    }

    res.json({
      success: true,
      message: 'Contract terminated successfully',
      data: contract
    });
  } catch (error) {
    console.error('Terminate contract error:', error);
    res.status(500).json({
      success: false,
      message: 'Error terminating contract'
    });
  }
});

module.exports = router;

