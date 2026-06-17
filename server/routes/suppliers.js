const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const Supplier = require('../models/Supplier');
const User = require('../models/User');
const Document = require('../models/Document');
const { protect, authorize, supplierAccess } = require('../middleware/auth');
const { createNotification } = require('../utils/notifications');

const isSupplierProfileComplete = (supplier) => {
  if (!supplier) return false;

  const authorizedPerson = supplier.authorizedPerson || {};
  const contactComplete = Boolean(
    authorizedPerson.name &&
    authorizedPerson.relationship &&
    authorizedPerson.idPassportNumber &&
    authorizedPerson.phone &&
    authorizedPerson.email
  );

  const address = supplier.companyPhysicalAddress || {};
  const fullAddress = address
    ? `${address.street || ''}, ${address.city || ''}, ${address.country || ''}${address.postalCode ? `, ${address.postalCode}` : ''}`.replace(/^,\s*|,\s*$/g, '')
    : supplier.physicalAddress || '';

  const companyComplete = Boolean(
    supplier.supplierName &&
    (supplier.registeredCountry || address.country) &&
    supplier.companyRegistrationNumber &&
    supplier.companyEmail &&
    fullAddress
  );

  return contactComplete && companyComplete;
};

const ensureSupplierRegistrationApproved = (req, res) => {
  if (req.user.role !== 'supplier') return true;
  if (req.user.supplierApprovalStatus === 'approved') return true;

  const status = req.user.supplierApprovalStatus || 'pending';
  const statusText = status === 'rejected'
    ? 'rejected'
    : (status === 'profile_incomplete' ? 'incomplete' : 'pending procurement approval');
  const message = status === 'profile_incomplete'
    ? 'Complete your supplier profile details first. Procurement approval starts after profile completion.'
    : `Your supplier registration is ${statusText}. Procurement approval is required before creating applications.`;

  res.status(403).json({
    success: false,
    message,
    supplierApprovalStatus: status
  });
  return false;
};

// @route   POST /api/suppliers/draft
// @desc    Create or update draft supplier application
// @access  Private (Supplier)
router.post('/draft', protect, authorize('supplier'), async (req, res) => {
  try {
    const isProfileOnlyDraft = req.body.isProfileOnly === true;
    if (!isProfileOnlyDraft && !ensureSupplierRegistrationApproved(req, res)) return;

    // Map frontend field names to model structure
    const draftData = {
      // Basic Information (required fields with defaults)
      supplierName: req.body.supplierName || (isProfileOnlyDraft ? '' : 'Draft Application'),
      legalNature: req.body.legalNature || 'company',
      serviceType: req.body.serviceTypes || req.body.serviceType || 'professional_services',

      // Company Information
      companyRegistrationNumber: req.body.companyRegistrationNumber,
      companyEmail: req.body.companyEmail,
      companyPhysicalAddress: req.body.physicalAddress ? { street: req.body.physicalAddress } : undefined,

      // Contact Person (map to authorizedPerson - required fields with defaults)
      authorizedPerson: {
        name: req.body.contactFullName || req.body.authorizedPerson?.name || (req.user.firstName && req.user.lastName ? `${req.user.firstName} ${req.user.lastName}` : 'Draft'),
        relationship: req.body.contactRelationship || req.body.authorizedPerson?.relationship || '',
        idPassportNumber: req.body.contactIdPassport || req.body.authorizedPerson?.idPassportNumber || '',
        phone: req.body.contactPhone || req.body.authorizedPerson?.phone || '',
        email: req.body.contactEmail || req.body.authorizedPerson?.email || req.user.email || ''
      },

      // Credit Period - extract number from string if needed
      creditPeriod: req.body.creditPeriod ? (() => {
        const value = req.body.creditPeriod;
        if (typeof value === 'string') {
          const numMatch = value.match(/\d+/);
          return numMatch ? parseInt(numMatch[0], 10) : undefined;
        }
        return parseInt(value, 10);
      })() : undefined,

      // Source of Funds (map declarations)
      sourceOfFunds: req.body.sourceOfWealth ? {
        source: req.body.sourceOfWealth,
        declarantName: req.body.declarantFullName,
        declarantCapacity: req.body.declarantCapacity,
        declarantIdPassport: req.body.declarantIdPassport,
        declarationDate: req.body.declarationDate ? new Date(req.body.declarationDate) : undefined
      } : undefined,

      // Data Processing Consent
      dataProcessingConsent: req.body.consentToProcessing !== undefined ? {
        granted: req.body.consentToProcessing
      } : undefined,

      // Progress tracking
      currentStep: req.body.currentStep !== undefined ? parseInt(req.body.currentStep) : 0,
      lastModified: req.body.lastModified ? new Date(req.body.lastModified) : new Date(),

      // Metadata
      submittedBy: req.user.id,
      status: 'draft'
    };

    // Store all additional fields that don't match model schema (Mongoose will store them)
    // This allows us to save all form data even if not in schema
    Object.keys(req.body).forEach(key => {
      if (!draftData.hasOwnProperty(key) &&
        !['supplierName', 'legalNature', 'serviceType', 'serviceTypes',
          'contactFullName', 'contactRelationship', 'contactIdPassport', 'contactPhone', 'contactEmail',
          'sourceOfWealth', 'declarantFullName', 'declarantCapacity', 'declarantIdPassport', 'declarationDate',
          'consentToProcessing', 'currentStep', 'lastModified'].includes(key)) {
        draftData[key] = req.body[key];
      }
    });

    // Create supplier draft using new and save to skip validation
    const supplier = new Supplier(draftData);
    await supplier.save({ validateBeforeSave: false });

    res.status(201).json({
      success: true,
      data: supplier
    });
  } catch (error) {
    console.error('Create draft error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating draft application',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/suppliers/create-complete
// @desc    Create a complete application for testing/demo
// @access  Private (Supplier)
router.post('/create-complete', protect, authorize('supplier'), async (req, res) => {
  try {
    if (!ensureSupplierRegistrationApproved(req, res)) return;

    const completeData = {
      supplierName: 'Complete Supplier Application',
      legalNature: 'company',
      entityType: 'private_company',
      companyRegistrationNumber: 'C.123456',
      companyEmail: 'supplier@example.com',
      companyWebsite: 'https://supplier.example.com',
      registeredCountry: 'Kenya',
      companyPhysicalAddress: {
        street: '123 Business Street',
        city: 'Nairobi',
        country: 'Kenya',
        postalCode: '00100'
      },
      authorizedPerson: {
        name: req.user.firstName && req.user.lastName ? `${req.user.firstName} ${req.user.lastName}` : 'John Doe',
        relationship: 'CEO',
        idPassportNumber: '12345678',
        phone: '+254712345678',
        email: req.user.email || 'supplier@example.com'
      },
      serviceType: 'professional_services',
      serviceTypes: 'professional_services',
      servicesDescription: 'Complete professional services',
      bankName: 'Equity Bank',
      accountNumber: '1234567890',
      branch: 'Nairobi Branch',
      currency: 'KES',
      creditPeriod: 30,
      sourceOfFunds: {
        source: 'business_income',
        declarantName: req.user.firstName && req.user.lastName ? `${req.user.firstName} ${req.user.lastName}` : 'John Doe',
        declarantCapacity: 'CEO',
        declarantIdPassport: '12345678',
        declarationDate: new Date()
      },
      dataProcessingConsent: {
        granted: true,
        consentorName: req.user.firstName && req.user.lastName ? `${req.user.firstName} ${req.user.lastName}` : 'John Doe',
        consentDate: new Date()
      },
      currentStep: 3,
      status: 'pending_procurement', // Set to pending so it appears in ongoing applications
      submittedBy: req.user.id,
      submittedAt: new Date(),
      lastModified: new Date()
    };

    const supplier = new Supplier(completeData);
    await supplier.save({ validateBeforeSave: false });

    res.status(201).json({
      success: true,
      message: 'Complete application created successfully',
      data: supplier.toObject()
    });
  } catch (error) {
    console.error('Create complete application error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating complete application',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/suppliers/my-applications
// @desc    Get current user's applications (exclude profile-only records)
// @access  Private (Supplier)
router.get('/my-applications', protect, authorize('supplier'), async (req, res) => {
  try {
    // Get all suppliers, but exclude profile-only records
    // Profile-only records are those marked with isProfileOnly: true
    const suppliers = await Supplier.find({
      submittedBy: req.user.id,
      isProfileOnly: { $ne: true } // Exclude records marked as profile-only (includes records where field doesn't exist)
    })
      .sort({ lastModified: -1, updatedAt: -1, createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: suppliers
    });
  } catch (error) {
    console.error('Get my applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching applications'
    });
  }
});

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
    if (!ensureSupplierRegistrationApproved(req, res)) return;

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
    const { status, search, page = 1, limit = 10, groupBy, source, sortOrder = 'desc', approvedRegistrationOnly } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    let query = {};

    // Role-based filtering
    if (req.user.role === 'supplier') {
      query.submittedBy = new mongoose.Types.ObjectId(req.user.id);
    }

    // Filter to only suppliers whose registration was approved or rejected
    if (approvedRegistrationOnly === 'true' && req.user.role !== 'supplier') {
      const approvedUserIds = await User.find(
        { role: 'supplier', supplierApprovalStatus: { $in: ['approved', 'rejected'] } },
        '_id'
      ).lean().then(users => users.map(u => u._id));
      query.submittedBy = { $in: approvedUserIds };
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

    let suppliers;
    let count;

    if (source === 'users') {
      // Find all supplier users and join with their applications
      const userQuery = { role: 'supplier' };
      if (search) {
        userQuery.$or = [
          { firstName: { $regex: search, $options: 'i' }, },
          { lastName: { $regex: search, $options: 'i' }, },
          { email: { $regex: search, $options: 'i' }, },
        ];
      }

      // 1. Get all supplier users
      const supplierUsers = await User.find(userQuery).lean();

      // 2. Get all real applications related to these users.
      // Exclude profile-only records so registration approval placeholders still show up.
      const userIds = supplierUsers.map(u => u._id);
      const userApplications = await Supplier.find({
        submittedBy: { $in: userIds },
        isProfileOnly: { $ne: true }
      })
        .populate('submittedBy', 'firstName lastName email supplierApprovalStatus supplierApprovalReviewedAt')
        .lean();

      // 2b. Fetch profile-only records to get company names for users without real applications
      const profileOnlyRecords = await Supplier.find({
        submittedBy: { $in: userIds },
        isProfileOnly: true
      }).select('submittedBy supplierName').lean();
      const profileNameByUserId = new Map(
        profileOnlyRecords
          .filter(r => r.supplierName)
          .map(r => [r.submittedBy?.toString(), r.supplierName])
      );

      // 3. Combine records
      const allRecords = [...userApplications];

      // Add users who have NO applications as placeholders
      supplierUsers.forEach(u => {
        const hasApp = userApplications.some(a => a.submittedBy?._id?.toString() === u._id.toString());
        if (!hasApp) {
          // Only show users pending account approval — skip incomplete/unverified profiles
          if (u.supplierApprovalStatus !== 'pending') return;

          const registrationStatus = u.isEmailVerified === false
            ? 'pending_verification'
            : (u.supplierApprovalStatus === 'approved'
              ? 'registration_approved'
              : (u.supplierApprovalStatus === 'rejected'
                ? 'registration_rejected'
                : (u.supplierApprovalStatus === 'pending'
                  ? 'pending_registration_approval'
                  : 'registration_profile_incomplete')));

          allRecords.push({
            _id: `user-${u._id}`,
            userId: u._id,
            supplierName: profileNameByUserId.get(u._id.toString()) || '',
            status: registrationStatus,
            registrationReviewedAt: u.supplierApprovalReviewedAt || null,
            submittedBy: {
              _id: u._id,
              firstName: u.firstName,
              lastName: u.lastName,
              email: u.email,
              supplierApprovalStatus: u.supplierApprovalStatus,
              supplierApprovalReviewedAt: u.supplierApprovalReviewedAt
            },
            createdAt: u.createdAt,
            updatedAt: u.updatedAt,
            isPlaceholder: true
          });
        }
      });

      // Status priority map for choosing the "best" record
      const statusPriority = {
        'pending_contract_upload': 100,
        'approved': 90,
        'completed': 80,
        'pending_legal': 70,
        'pending_procurement': 60,
        'under_review': 50,
        'submitted': 40,
        'more_info_required': 30,
        'rejected': 20,
        'draft': 10,
        'registration_approved': 5,
        'pending_registration_approval': 4,
        'registration_rejected': 3,
        'registration_profile_incomplete': 2,
        'pending_verification': 1,
        'not_approved': 0
      };

      // Grouping logic
      const groupedEntities = new Map();

      allRecords.forEach(record => {
        // Primary key: vendorNumber. Secondary: supplierName (normalized)
        const vNum = record.vendorNumber;
        const sName = (record.supplierName || '').trim().toLowerCase();

        // Placeholder records (users with no application yet) get a unique key by userId
        if (record.isPlaceholder) {
          groupedEntities.set(`USER_${record.userId}`, record);
          return;
        }

        // Find if we already have a group for this vendor or name
        let key = vNum ? `VENDOR_${vNum}` : (sName ? `NAME_${sName}` : `ID_${record._id}`);

        // If it's a placeholder name match with a vendor record, we should merge them
        if (!vNum && sName) {
          // Check if any existing group with a vendor has this name
          for (let [existingKey, existingRecord] of groupedEntities.entries()) {
            if (existingRecord.supplierName?.trim().toLowerCase() === sName) {
              key = existingKey;
              break;
            }
          }
        }

        const existing = groupedEntities.get(key);
        if (!existing) {
          groupedEntities.set(key, record);
        } else {
          // Keep the one with higher status priority
          const currentPrio = statusPriority[record.status] || 0;
          const existingPrio = statusPriority[existing.status] || 0;

          if (currentPrio > existingPrio) {
            groupedEntities.set(key, record);
          } else if (currentPrio === existingPrio) {
            // If same priority, keep the more recent one
            const currentDate = new Date(record.updatedAt || record.createdAt);
            const existingDate = new Date(existing.updatedAt || existing.createdAt);
            if (currentDate > existingDate) {
              groupedEntities.set(key, record);
            }
          }
        }
      });

      let finalSuppliers = Array.from(groupedEntities.values());

      // Filter by status if requested (after grouping)
      if (status) {
        finalSuppliers = finalSuppliers.filter(s => s.status === status);
      }

      // Sort by recency
      finalSuppliers.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));

      count = finalSuppliers.length;
      suppliers = finalSuppliers.slice(skip, skip + limitNum);
    } else if (groupBy === 'name') {
      // Aggregate to show unique suppliers (latest record for each supplierName)
      const pipeline = [
        { $match: query },
        { $sort: { updatedAt: -1 } },                      // most recent first, so $first picks latest
        {
          $group: {
            _id: '$supplierName',
            latestRecord: { $first: '$$ROOT' }
          }
        },
        { $replaceRoot: { newRoot: '$latestRecord' } },
        { $sort: { updatedAt: sortOrder === 'asc' ? 1 : -1 } }
      ];

      // Get count for pagination
      const totalResults = await Supplier.aggregate([...pipeline, { $count: 'total' }]);
      count = totalResults.length > 0 ? totalResults[0].total : 0;

      // Get paginated results
      suppliers = await Supplier.aggregate([
        ...pipeline,
        { $skip: skip },
        { $limit: limitNum }
      ]);

      // Manually populate since aggregate doesn't do it automatically
      suppliers = await Supplier.populate(suppliers, [
        { path: 'submittedBy', select: 'firstName lastName email supplierApprovalStatus supplierApprovalReviewedAt' },
        { path: 'approvalHistory.approver', select: 'firstName lastName' }
      ]);
    } else {
      suppliers = await Supplier.find(query)
        .populate('submittedBy', 'firstName lastName email supplierApprovalStatus supplierApprovalReviewedAt')
        .populate('approvalHistory.approver', 'firstName lastName')
        .sort({ createdAt: sortOrder === 'asc' ? 1 : -1 })
        .limit(limitNum)
        .skip(skip)
        .lean();

      count = await Supplier.countDocuments(query);
    }

    res.json({
      success: true,
      data: suppliers,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limitNum)
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
    // Get supplier document (not lean so we can populate)
    const supplier = await Supplier.findById(req.params.id)
      .populate('submittedBy', 'firstName lastName email')
      .populate('approvalHistory.approver', 'firstName lastName role department')
      .populate({
        path: 'contract',
        populate: { path: 'signedContract' }
      });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    const supplierObj = supplier.toObject();

    // Strip approver names for supplier role — expose department only
    if (req.user.role === 'supplier' && supplierObj.approvalHistory) {
      supplierObj.approvalHistory = supplierObj.approvalHistory.map(h => ({
        ...h,
        approver: h.approver ? { department: h.approver.department } : undefined,
      }));
    }

    // Get documents
    const documents = await Document.find({ supplier: supplier._id })
      .populate('uploadedBy', 'firstName lastName')
      .sort({ uploadedAt: -1 });

    res.json({
      success: true,
      data: {
        ...supplierObj,
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
    // Use lean() to avoid Mongoose validation when loading the supplier
    // This prevents validation errors if the document has unmapped enum values
    let supplier = await Supplier.findById(req.params.id).lean();

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    // Allow updates for drafts, more_info_required, or if user is admin/procurement/legal
    const isDraft = supplier.status === 'draft';
    const isMoreInfoRequired = supplier.status === 'more_info_required';
    const canUpdate = isDraft || isMoreInfoRequired; // Same logic as canSubmit() method
    const isAdmin = ['super_admin', 'procurement', 'legal', 'management'].includes(req.user.role);

    // Profile-related fields that can always be updated (even when application is submitted/approved)
    const profileFields = ['additionalContacts', 'authorizedPerson', 'companyEmail', 'companyWebsite', 'companyPhysicalAddress', 'physicalAddress'];
    const isProfileUpdate = Object.keys(req.body).some(key => profileFields.includes(key));

    // Allow profile updates regardless of status, or allow all updates if draft/more_info_required/admin
    if (req.user.role === 'supplier' && !canUpdate && !isAdmin && !isProfileUpdate) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update supplier at this stage'
      });
    }

    // Update supplier (skip validation for drafts)
    // Use $set to ensure all fields are updated, including those not in schema
    // Build update object with all fields from req.body
    const updateData = {};

    // Mapping functions to convert frontend display values to backend enum values
    const mapLegalNature = (value) => {
      const mapping = {
        'Private Limited Company': 'company',
        'Public Limited Company': 'company',
        'Partnership': 'partnership',
        'Sole Proprietorship': 'individual',
        'State Owned': 'state_owned',
        'NGO': 'ngo',
        'Foundation': 'foundation',
        'Association': 'association',
        'Foreign Company': 'foreign_company',
        'Trust': 'trust',
        'Other': 'other'
      };
      return mapping[value] || value; // Return mapped value or original if not found
    };

    const mapEntityType = (value) => {
      const mapping = {
        'Public/Private Company': 'private_company',
        'Private/Public Company': 'private_company',
        'Limited Company': 'private_company',
        'Public Limited Company': 'public_company',
        'Partnership': 'partnership',
        'Partnerships': 'partnership',
        'Foreign Company': 'foreign_company',
        'Individual': 'individual',
        'Sole Proprietorship': 'individual',
        'Individual/Sole Proprietor': 'individual',
        'Trust': 'trust',
        'Other': 'other'
      };
      return mapping[value] || value; // Return mapped value or original if not found
    };

    // Copy all fields from req.body to updateData, excluding internal MongoDB fields
    Object.keys(req.body).forEach(key => {
      // Skip internal MongoDB fields and read-only fields
      if (key !== '_id' && key !== '__v' && key !== 'createdAt' && key !== 'updatedAt' &&
        key !== 'submittedBy' && key !== 'documents' && key !== 'approvalHistory' &&
        key !== 'profileUpdateRequests' && key !== 'slaMetrics' && key !== 'vendorNumber') {
        // Handle null/undefined values - convert undefined to null for consistency
        let value = req.body[key];

        // Map legalNature from frontend display value to backend enum
        if (key === 'legalNature' && typeof value === 'string' && value.trim() !== '') {
          value = mapLegalNature(value);
        }

        // Map entityType from frontend display value to backend enum
        if (key === 'entityType' && typeof value === 'string' && value.trim() !== '') {
          value = mapEntityType(value);
        }

        // Special handling for creditPeriod - extract number from string if needed
        if (key === 'creditPeriod' && typeof value === 'string') {
          // Extract number from string like "7 Days" or "30"
          const numMatch = value.match(/\d+/);
          if (numMatch) {
            value = parseInt(numMatch[0], 10);
          } else {
            value = undefined; // Skip if no number found
          }
        }

        if (value !== undefined) {
          updateData[key] = value;
        }
      }
    });

    // Map physicalAddress (plain string) to companyPhysicalAddress schema field
    if (req.body.physicalAddress) {
      updateData.companyPhysicalAddress = {
        ...(supplier.companyPhysicalAddress || {}),
        street: req.body.physicalAddress,
      };
    }

    // Map flat contact fields to authorizedPerson structure
    if (req.body.contactFullName || req.body.contactRelationship || req.body.contactIdPassport || req.body.contactPhone || req.body.contactEmail) {
      if (!updateData.authorizedPerson) {
        // Load current authorizedPerson to preserve existing fields if not all are sent
        updateData.authorizedPerson = { ...(supplier.authorizedPerson || {}) };
      }

      if (req.body.contactFullName) updateData.authorizedPerson.name = req.body.contactFullName;
      if (req.body.contactRelationship) updateData.authorizedPerson.relationship = req.body.contactRelationship;
      if (req.body.contactIdPassport) updateData.authorizedPerson.idPassportNumber = req.body.contactIdPassport;
      if (req.body.contactPhone) updateData.authorizedPerson.phone = req.body.contactPhone;
      if (req.body.contactEmail) updateData.authorizedPerson.email = req.body.contactEmail;
    }

    // Always update lastModified
    updateData.lastModified = new Date();

    // Store the original submittedBy before update (needed for user email update)
    const originalSubmittedBy = supplier.submittedBy || req.user.id;

    console.log('Updating supplier with data keys:', Object.keys(updateData));
    console.log('Update data sample (first 5 keys):', Object.keys(updateData).slice(0, 5).reduce((obj, key) => {
      obj[key] = updateData[key];
      return obj;
    }, {}));

    const updateOptions = {
      new: true,
      runValidators: false, // Always skip validators since we're using strict: false
      setDefaultsOnInsert: false
    };

    console.log('Is draft:', isDraft);
    console.log('Update options:', updateOptions);
    console.log('Number of fields to update:', Object.keys(updateData).length);

    try {
      // Use findByIdAndUpdate with $set to preserve all fields
      // With strict: false, all fields will be saved
      supplier = await Supplier.findByIdAndUpdate(
        req.params.id,
        { $set: updateData },
        updateOptions
      );

      if (!supplier) {
        return res.status(404).json({
          success: false,
          message: 'Supplier not found after update'
        });
      }

      // If authorizedPerson.email was updated, also update the User's email
      if (updateData.authorizedPerson && updateData.authorizedPerson.email) {
        try {
          // Get the user ID from the original supplier's submittedBy field (before update)
          const userId = originalSubmittedBy.toString ? originalSubmittedBy.toString() : originalSubmittedBy;

          // Check if email is actually different to avoid unnecessary updates
          const user = await User.findById(userId);
          if (user && user.email !== updateData.authorizedPerson.email.toLowerCase().trim()) {
            // Update the user's email
            await User.findByIdAndUpdate(
              userId,
              { email: updateData.authorizedPerson.email.toLowerCase().trim() },
              { new: true, runValidators: true }
            );

            console.log('User email updated from', user.email, 'to', updateData.authorizedPerson.email);
          }
        } catch (userUpdateError) {
          console.error('Error updating user email:', userUpdateError);
          // Don't fail the entire request if user email update fails
          // Log it but continue with the supplier update
        }
      }

      // Transition supplier registration to procurement queue only after profile is complete
      if (req.user.role === 'supplier') {
        const profileComplete = isSupplierProfileComplete(supplier);
        if (profileComplete) {
          const supplierUser = await User.findById(originalSubmittedBy);
          if (
            supplierUser &&
            ['profile_incomplete', 'rejected'].includes(supplierUser.supplierApprovalStatus || 'profile_incomplete')
          ) {
            supplierUser.supplierApprovalStatus = 'pending';
            supplierUser.supplierApprovalReviewedBy = undefined;
            supplierUser.supplierApprovalReviewedAt = undefined;
            supplierUser.supplierApprovalComment = '';
            await supplierUser.save();

            const procurementUsers = await User.find({ role: 'procurement', isActive: true });
            for (const procurementUser of procurementUsers) {
              await createNotification({
                recipient: procurementUser._id,
                type: 'new_task_assigned',
                title: 'Supplier Registration Ready For Approval',
                message: `${supplierUser.firstName} ${supplierUser.lastName} (${supplierUser.email}) completed profile details and is ready for procurement approval.`,
                relatedEntity: {
                  entityType: 'user',
                  entityId: supplierUser._id
                },
                actionUrl: '/suppliers'
              });
            }
          }
        }
      }

      // Convert to plain object to include all fields (including those not in schema)
      // Use lean() alternative - convert to object safely
      const supplierObj = supplier.toObject ? supplier.toObject() : supplier;

      res.json({
        success: true,
        data: supplierObj
      });
    } catch (updateError) {
      console.error('Update operation failed:', updateError);
      throw updateError;
    }

  } catch (error) {
    console.error('Update supplier error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code
    });
    res.status(500).json({
      success: false,
      message: 'Error updating supplier',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   DELETE /api/suppliers/:id
// @desc    Delete supplier application (preserve profile information)
// @access  Private (Supplier - only for drafts)
router.delete('/:id', protect, authorize('supplier'), supplierAccess, async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    // Only allow deletion of drafts
    if (supplier.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Can only delete draft applications'
      });
    }

    // Preserve profile information before deletion
    // Profile fields to preserve: authorizedPerson, additionalContacts, companyEmail, companyWebsite, companyPhysicalAddress
    const profileData = {
      authorizedPerson: supplier.authorizedPerson,
      additionalContacts: supplier.additionalContacts || [],
      companyEmail: supplier.companyEmail,
      companyWebsite: supplier.companyWebsite,
      companyPhysicalAddress: supplier.companyPhysicalAddress,
      physicalAddress: supplier.physicalAddress,
      supplierName: supplier.supplierName,
      registeredCountry: supplier.registeredCountry,
      companyRegistrationNumber: supplier.companyRegistrationNumber,
      legalNature: supplier.legalNature,
    };

    // Check if there are other supplier records for this user
    const otherSuppliers = await Supplier.find({
      submittedBy: supplier.submittedBy,
      _id: { $ne: supplier._id }
    });

    if (otherSuppliers.length > 0) {
      // If other suppliers exist, preserve profile data in the first one
      const targetSupplier = otherSuppliers[0];
      await Supplier.findByIdAndUpdate(targetSupplier._id, {
        $set: {
          authorizedPerson: profileData.authorizedPerson,
          additionalContacts: profileData.additionalContacts,
          companyEmail: profileData.companyEmail,
          companyWebsite: profileData.companyWebsite,
          companyPhysicalAddress: profileData.companyPhysicalAddress,
          physicalAddress: profileData.physicalAddress,
          supplierName: profileData.supplierName || targetSupplier.supplierName,
          registeredCountry: profileData.registeredCountry || targetSupplier.registeredCountry,
          companyRegistrationNumber: profileData.companyRegistrationNumber || targetSupplier.companyRegistrationNumber,
          legalNature: profileData.legalNature || targetSupplier.legalNature,
        }
      });
    } else {
      // If no other suppliers exist, create a minimal profile record to preserve the data
      // This ensures profile information is not lost
      // Mark it as profile-only so it doesn't show up in applications list
      await Supplier.create({
        supplierName: profileData.supplierName || 'Profile',
        legalNature: profileData.legalNature || 'company',
        serviceType: 'professional_services',
        status: 'draft',
        isProfileOnly: true, // Mark as profile-only, not an application
        authorizedPerson: profileData.authorizedPerson || {
          name: req.user.firstName && req.user.lastName ? `${req.user.firstName} ${req.user.lastName}` : 'Profile',
          relationship: '',
          idPassportNumber: '',
          phone: '',
          email: req.user.email || ''
        },
        additionalContacts: profileData.additionalContacts,
        companyEmail: profileData.companyEmail,
        companyWebsite: profileData.companyWebsite,
        companyPhysicalAddress: profileData.companyPhysicalAddress,
        physicalAddress: profileData.physicalAddress,
        registeredCountry: profileData.registeredCountry,
        companyRegistrationNumber: profileData.companyRegistrationNumber,
        submittedBy: supplier.submittedBy,
      });
    }

    // Now delete the application
    await Supplier.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Application deleted successfully. Profile information has been preserved.'
    });
  } catch (error) {
    console.error('Delete supplier error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting application'
    });
  }
});

// @route   POST /api/suppliers/:id/assign
// @desc    Assign a task to the current procurement/legal user
// @access  Private (Procurement, Legal, Super Admin)
router.post('/:id/assign', protect, authorize('procurement', 'legal', 'super_admin'), async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // Validate the task is at the right stage for the user's role
    const procurementStatuses = ['submitted', 'pending_procurement', 'more_info_required'];
    const legalStatuses = ['pending_legal'];
    if (req.user.role === 'procurement' && !procurementStatuses.includes(supplier.status)) {
      return res.status(400).json({ success: false, message: 'This application is not at the procurement stage' });
    }
    if (req.user.role === 'legal' && !legalStatuses.includes(supplier.status)) {
      return res.status(400).json({ success: false, message: 'This application is not at the legal stage' });
    }

    supplier.assignedTo = req.user.id;
    supplier.assignedAt = new Date();
    // Permanently record which officer owns this stage
    if (req.user.role === 'procurement') supplier.procurementOfficer = req.user.id;
    if (req.user.role === 'legal') supplier.legalOfficer = req.user.id;
    await supplier.save();

    res.json({ success: true, message: 'Task assigned successfully', data: { assignedTo: req.user.id } });
  } catch (err) {
    console.error('Assign task error:', err);
    res.status(500).json({ success: false, message: 'Error assigning task' });
  }
});

// @route   POST /api/suppliers/:id/unassign
// @desc    Release a picked-up task back to the pool
// @access  Private (Procurement, Legal)
router.post('/:id/unassign', protect, authorize('procurement', 'legal', 'super_admin'), async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const assignedId = supplier.assignedTo ? supplier.assignedTo.toString() : null;
    if (assignedId && assignedId !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only release tasks assigned to you' });
    }

    const procurementStatuses = ['submitted', 'pending_procurement', 'more_info_required'];
    const legalStatuses = ['pending_legal'];

    supplier.assignedTo = null;
    supplier.assignedAt = null;
    if (procurementStatuses.includes(supplier.status)) {
      supplier.procurementOfficer = null;
    } else if (legalStatuses.includes(supplier.status)) {
      supplier.legalOfficer = null;
    }
    await supplier.save();

    res.json({ success: true, message: 'Task released back to the pool' });
  } catch (err) {
    console.error('Unassign task error:', err);
    res.status(500).json({ success: false, message: 'Error releasing task' });
  }
});

// @route   POST /api/suppliers/:id/submit
// @desc    Submit supplier application for review
// @access  Private (Supplier)
router.post('/:id/submit', protect, authorize('supplier'), supplierAccess, async (req, res) => {
  try {
    if (!ensureSupplierRegistrationApproved(req, res)) return;

    // Use MongoDB collection directly to load supplier and bypass Mongoose validation
    // This prevents validation errors if the document has unmapped enum values
    const collection = Supplier.collection;
    const supplierId = new mongoose.Types.ObjectId(req.params.id);

    let supplier = await collection.findOne({ _id: supplierId });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    // Convert MongoDB _id to string for consistency
    supplier._id = supplier._id.toString();

    // First, ensure the supplier is in a submittable state (draft or more_info_required)
    // If not, set it to draft so it can be submitted
    // Use direct MongoDB update to avoid validation issues
    if (supplier.status !== 'draft' && supplier.status !== 'more_info_required') {
      const collection = Supplier.collection;
      const supplierId = new mongoose.Types.ObjectId(req.params.id);

      await collection.updateOne(
        { _id: supplierId },
        { $set: { status: 'draft' } }
      );

      // Reload supplier using collection directly to avoid validation
      supplier = await collection.findOne({ _id: supplierId });
      if (supplier) {
        supplier._id = supplier._id.toString();
        supplier.status = 'draft'; // Update local object
      }
    }

    // Now check if supplier can submit (should always be true after above check)
    // Since supplier is a plain object (lean), we need to check status directly
    const canSubmit = supplier.status === 'draft' || supplier.status === 'more_info_required';
    if (!canSubmit) {
      return res.status(400).json({
        success: false,
        message: 'Cannot submit supplier at this stage'
      });
    }

    // Mapping functions to convert frontend display values to backend enum values
    // Define at function scope so they're accessible throughout
    const mapLegalNature = (value) => {
      const mapping = {
        'Private Limited Company': 'company',
        'Public Limited Company': 'company',
        'Partnership': 'partnership',
        'Sole Proprietorship': 'individual',
        'State Owned': 'state_owned',
        'NGO': 'ngo',
        'Foundation': 'foundation',
        'Association': 'association',
        'Foreign Company': 'foreign_company',
        'Trust': 'trust',
        'Other': 'other'
      };
      return mapping[value] || value; // Return mapped value or original if not found
    };

    const mapEntityType = (value) => {
      const mapping = {
        'Public/Private Company': 'private_company',
        'Private/Public Company': 'private_company',
        'Limited Company': 'private_company',
        'Public Limited Company': 'public_company',
        'Partnership': 'partnership',
        'Partnerships': 'partnership',
        'Foreign Company': 'foreign_company',
        'Individual': 'individual',
        'Sole Proprietorship': 'individual',
        'Individual/Sole Proprietor': 'individual',
        'Trust': 'trust',
        'Other': 'other'
      };
      return mapping[value] || value; // Return mapped value or original if not found
    };

    // Build a single comprehensive update with ALL form data + status change
    // Map enum values and combine everything into one operation to avoid validation issues
    const comprehensiveUpdate = {
      // Status and submission metadata
      status: 'pending_procurement',
      submittedAt: new Date(),
      currentApprovalStage: 'procurement',
      slaMetrics: {
        submissionDate: new Date(),
        expectedCompletionDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days
      },
      lastModified: new Date()
    };

    // CRITICAL: Always map enum values from supplier object if they exist
    // Map ANY value that doesn't match the backend enum values exactly
    const validLegalNatureValues = ['state_owned', 'ngo', 'foundation', 'association', 'company', 'partnership', 'foreign_company', 'individual', 'trust', 'other'];
    const validEntityTypeValues = ['private_company', 'public_company', 'partnership', 'foreign_company', 'individual', 'trust', 'other'];

    if (supplier.legalNature) {
      const currentValue = String(supplier.legalNature);
      // If it's not a valid enum value, map it
      if (!validLegalNatureValues.includes(currentValue)) {
        const mappedValue = mapLegalNature(currentValue);
        comprehensiveUpdate.legalNature = mappedValue;
        console.log(`[SUBMIT] Mapped existing legalNature from supplier: "${currentValue}" -> "${mappedValue}"`);
      } else {
        // Already a valid enum value, keep it
        comprehensiveUpdate.legalNature = supplier.legalNature;
      }
    }

    if (supplier.entityType) {
      const currentValue = String(supplier.entityType);
      // If it's not a valid enum value, map it
      if (!validEntityTypeValues.includes(currentValue)) {
        const mappedValue = mapEntityType(currentValue);
        comprehensiveUpdate.entityType = mappedValue;
        console.log(`[SUBMIT] Mapped existing entityType from supplier: "${currentValue}" -> "${mappedValue}"`);
      } else {
        // Already a valid enum value, keep it
        comprehensiveUpdate.entityType = supplier.entityType;
      }
    }

    // Process all form data from req.body and map enum values
    // This will overwrite the values from supplier if provided
    if (req.body && Object.keys(req.body).length > 0) {
      Object.keys(req.body).forEach(key => {
        // Skip internal MongoDB fields and read-only fields
        if (key !== '_id' && key !== '__v' && key !== 'createdAt' && key !== 'updatedAt' &&
          key !== 'submittedBy' && key !== 'documents' && key !== 'approvalHistory' &&
          key !== 'profileUpdateRequests' && key !== 'slaMetrics' && key !== 'vendorNumber' &&
          key !== 'submittedAt' && key !== 'status') {
          let value = req.body[key];

          // Map legalNature from frontend display value to backend enum
          if (key === 'legalNature' && value) {
            const originalValue = value;
            value = mapLegalNature(String(value));
            console.log(`[SUBMIT] Mapped legalNature from req.body: "${originalValue}" -> "${value}"`);
            comprehensiveUpdate.legalNature = value; // Always overwrite with mapped value
          }

          // Map entityType from frontend display value to backend enum
          if (key === 'entityType' && value) {
            const originalValue = value;
            value = mapEntityType(String(value));
            console.log(`[SUBMIT] Mapped entityType from req.body: "${originalValue}" -> "${value}"`);
            comprehensiveUpdate.entityType = value; // Always overwrite with mapped value
          }

          // Special handling for creditPeriod - extract number from string if needed
          if (key === 'creditPeriod' && typeof value === 'string') {
            const numMatch = value.match(/\d+/);
            if (numMatch) {
              value = parseInt(numMatch[0], 10);
            } else {
              value = undefined;
            }
          }

          // Add to comprehensive update (only if value is defined and not an enum field we already handled)
          if (value !== undefined && value !== null && key !== 'legalNature' && key !== 'entityType') {
            comprehensiveUpdate[key] = value;
          }
        }
      });
    }

    // Map physicalAddress (plain string) to companyPhysicalAddress schema field
    if (comprehensiveUpdate.physicalAddress) {
      comprehensiveUpdate.companyPhysicalAddress = {
        ...(supplier.companyPhysicalAddress || {}),
        street: comprehensiveUpdate.physicalAddress,
      };
    }

    // CRITICAL: Ensure enum values are ALWAYS set in the update, even if not in req.body
    // This prevents leaving unmapped values in the database
    if (!comprehensiveUpdate.legalNature && supplier.legalNature) {
      const currentValue = String(supplier.legalNature);
      if (!validLegalNatureValues.includes(currentValue)) {
        comprehensiveUpdate.legalNature = mapLegalNature(currentValue);
        console.log(`[SUBMIT] Added legalNature to update (from supplier): "${currentValue}" -> "${comprehensiveUpdate.legalNature}"`);
      } else {
        comprehensiveUpdate.legalNature = supplier.legalNature;
      }
    }

    if (!comprehensiveUpdate.entityType && supplier.entityType) {
      const currentValue = String(supplier.entityType);
      if (!validEntityTypeValues.includes(currentValue)) {
        comprehensiveUpdate.entityType = mapEntityType(currentValue);
        console.log(`[SUBMIT] Added entityType to update (from supplier): "${currentValue}" -> "${comprehensiveUpdate.entityType}"`);
      } else {
        comprehensiveUpdate.entityType = supplier.entityType;
      }
    }

    // FINAL CHECK: Ensure enum values are definitely mapped before update
    // Double-check and force mapping if needed
    if (comprehensiveUpdate.legalNature) {
      const checkValue = String(comprehensiveUpdate.legalNature);
      if (!validLegalNatureValues.includes(checkValue)) {
        comprehensiveUpdate.legalNature = mapLegalNature(checkValue);
        console.log(`[SUBMIT] FINAL CHECK - Remapped legalNature: "${checkValue}" -> "${comprehensiveUpdate.legalNature}"`);
      }
    }

    if (comprehensiveUpdate.entityType) {
      const checkValue = String(comprehensiveUpdate.entityType);
      if (!validEntityTypeValues.includes(checkValue)) {
        comprehensiveUpdate.entityType = mapEntityType(checkValue);
        console.log(`[SUBMIT] FINAL CHECK - Remapped entityType: "${checkValue}" -> "${comprehensiveUpdate.entityType}"`);
      }
    }

    // Validate required documents based on entityType before allowing submission.
    // This duplicates the client-side validation so submissions can't be bypassed via API calls.
    const isSinglePresent = (v) => {
      if (v === undefined || v === null) return false;
      if (typeof v === 'string') return v.trim() !== '';
      return true;
    };
    const isArrayPresent = (v) => Array.isArray(v) && v.length > 0;

    const missing = [];
    const entityType = String(comprehensiveUpdate.entityType || '');

    const requireSingle = (present, label) => {
      if (!present) missing.push(label);
    };
    const requireArray = (present, label) => {
      if (!present) missing.push(label);
    };

    const companyLike = ['private_company', 'public_company', 'other'].includes(entityType);

    if (companyLike) {
      requireSingle(isSinglePresent(comprehensiveUpdate.certificateOfIncorporation), 'Certificate of incorporation or registration');
      requireSingle(isSinglePresent(comprehensiveUpdate.kraPinCertificate), 'PIN Certificate of entity');
      requireSingle(isSinglePresent(comprehensiveUpdate.etimsProof), 'Proof of registration on e-TIMS');
      requireSingle(isSinglePresent(comprehensiveUpdate.financialStatements), 'Current annual audited financial statements');
      requireSingle(isSinglePresent(comprehensiveUpdate.cr12), 'Valid CR12 (not more than 30 days old)');
      requireSingle(isSinglePresent(comprehensiveUpdate.companyProfile), 'Firm Company Profile');
      requireSingle(isSinglePresent(comprehensiveUpdate.bankReferenceLetter), 'Bank reference letter');
      requireArray(isArrayPresent(comprehensiveUpdate.directorsIds), "Directors' IDs/Copies of Passports");
    } else if (entityType === 'partnership') {
      requireSingle(isSinglePresent(comprehensiveUpdate.partnershipDeed), 'Partnership Deed');
      requireSingle(isSinglePresent(comprehensiveUpdate.partnersPinCertificate), 'PIN Certificate of partners');
      requireSingle(isSinglePresent(comprehensiveUpdate.partnersTaxCompliance), 'Valid tax compliance certificate for each partner');
      requireArray(isArrayPresent(comprehensiveUpdate.partnerIds), "Partners' IDs/Copies of Passports");
      requireSingle(isSinglePresent(comprehensiveUpdate.companyProfile), 'Firm Company Profile');
      requireSingle(isSinglePresent(comprehensiveUpdate.bankReferenceLetter), 'Bank reference letter');
      requireSingle(isSinglePresent(comprehensiveUpdate.financialStatements), 'Current annual audited financial statements');
      requireSingle(isSinglePresent(comprehensiveUpdate.etimsProof), 'Proof of registration on e-TIMS');
    } else if (entityType === 'foreign_company') {
      requireSingle(isSinglePresent(comprehensiveUpdate.certificateOfIncorporation), 'Certificate of incorporation or registration');

      const hasShare = isSinglePresent(comprehensiveUpdate.shareCertificate);
      const hasRegistry = isSinglePresent(comprehensiveUpdate.registryExtract);
      if (!hasShare && !hasRegistry) missing.push('Valid share certificate or registry extract');

      requireSingle(isSinglePresent(comprehensiveUpdate.taxComplianceCertificate), 'Valid tax compliance certificate');

      const hasNationalIds = isArrayPresent(comprehensiveUpdate.directorsNationalIds);
      const hasPassports = isArrayPresent(comprehensiveUpdate.directorsPassports);
      if (!hasNationalIds && !hasPassports) missing.push("Directors' National Identification documents or passport");

      requireSingle(isSinglePresent(comprehensiveUpdate.companyProfile), 'Firm profile');
      requireSingle(isSinglePresent(comprehensiveUpdate.financialStatements), 'Current annual audited financial statements');
      requireSingle(isSinglePresent(comprehensiveUpdate.bankReferenceLetter), 'Bank reference letter');
    } else if (entityType === 'individual') {
      const hasNationalId = isSinglePresent(comprehensiveUpdate.nationalId);
      const hasPassport = isSinglePresent(comprehensiveUpdate.passportDocument);
      if (!hasNationalId && !hasPassport) missing.push('National Identification Card/ Passport');

      requireSingle(isSinglePresent(comprehensiveUpdate.workPermit), 'Work permit (for foreigners)');
      requireSingle(isSinglePresent(comprehensiveUpdate.policeClearance), 'Police clearance certificate');
      requireSingle(isSinglePresent(comprehensiveUpdate.kraPinCertificate), 'PIN Certificate');
      requireSingle(isSinglePresent(comprehensiveUpdate.resume), 'Resume (Curriculum vitae)');
      requireSingle(isSinglePresent(comprehensiveUpdate.bankReferenceLetter), 'Bank reference letter');
      requireSingle(isSinglePresent(comprehensiveUpdate.etimsProof), 'Proof of registration on e-TIMS');
    } else if (entityType === 'trust') {
      requireSingle(isSinglePresent(comprehensiveUpdate.trustDeed), 'Trust Deed');
      requireSingle(isSinglePresent(comprehensiveUpdate.founderPin), 'PIN Certificate of Founders');
      requireArray(isArrayPresent(comprehensiveUpdate.foundersIds), "Founders' IDs/Copies of Passports");
      requireArray(isArrayPresent(comprehensiveUpdate.beneficiariesIds), 'Beneficaries IDs/Copies of Passport');
      requireSingle(isSinglePresent(comprehensiveUpdate.bankReferenceLetter), 'Bank reference letter');
      requireSingle(isSinglePresent(comprehensiveUpdate.financialStatements), 'Current annual audited financial statements');
    }

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required documents',
        missing
      });
    }

    console.log('[SUBMIT] Comprehensive update object (FINAL - VERIFIED):', {
      legalNature: comprehensiveUpdate.legalNature,
      entityType: comprehensiveUpdate.entityType,
      status: comprehensiveUpdate.status,
      keys: Object.keys(comprehensiveUpdate).length,
      hasLegalNature: !!comprehensiveUpdate.legalNature,
      hasEntityType: !!comprehensiveUpdate.entityType,
      legalNatureIsValid: comprehensiveUpdate.legalNature ? validLegalNatureValues.includes(String(comprehensiveUpdate.legalNature)) : false,
      entityTypeIsValid: comprehensiveUpdate.entityType ? validEntityTypeValues.includes(String(comprehensiveUpdate.entityType)) : false
    });

    // Perform a SINGLE update operation with all data including mapped enum values
    // Use MongoDB collection directly to completely bypass Mongoose validation
    try {
      // collection and supplierId are already defined at the top of the function

      // Use MongoDB's native updateOne to completely bypass Mongoose validation
      const updateResult = await collection.updateOne(
        { _id: supplierId },
        { $set: comprehensiveUpdate }
      );

      // Map flat contact fields to authorizedPerson structure if present in req.body
      if (req.body.contactFullName || req.body.contactRelationship || req.body.contactIdPassport || req.body.contactPhone || req.body.contactEmail) {
        const authPerson = supplier.authorizedPerson || {};
        const updatedAuthPerson = {
          ...authPerson,
          name: req.body.contactFullName || authPerson.name,
          relationship: req.body.contactRelationship || authPerson.relationship,
          idPassportNumber: req.body.contactIdPassport || authPerson.idPassportNumber,
          phone: req.body.contactPhone || authPerson.phone,
          email: req.body.contactEmail || authPerson.email
        };

        await collection.updateOne(
          { _id: supplierId },
          { $set: { authorizedPerson: updatedAuthPerson } }
        );
      }

      console.log('[SUBMIT] MongoDB update result:', {
        matchedCount: updateResult.matchedCount,
        modifiedCount: updateResult.modifiedCount
      });

      if (updateResult.matchedCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Supplier not found'
        });
      }

      // Don't reload supplier - just use the comprehensiveUpdate data we just saved
      // This avoids any Mongoose validation that might happen during findById
      // Create a response object from what we know was saved
      const updatedSupplier = {
        ...supplier, // Start with original supplier data
        ...comprehensiveUpdate // Overwrite with what we just updated
      };

      console.log('[SUBMIT] Supplier data after update (constructed):', {
        legalNature: updatedSupplier.legalNature,
        entityType: updatedSupplier.entityType,
        status: updatedSupplier.status
      });

      // Use the constructed object for the response
      supplier = updatedSupplier;
    } catch (updateError) {
      console.error('[SUBMIT] Error in comprehensive update:', updateError);
      console.error('[SUBMIT] Update data that failed:', {
        legalNature: comprehensiveUpdate.legalNature,
        entityType: comprehensiveUpdate.entityType,
        status: comprehensiveUpdate.status
      });
      throw updateError;
    }

    // Create notifications for procurement team (non-blocking - don't fail submission if notifications fail)
    try {
      const procurementUsers = await User.find({ role: 'procurement', isActive: true });
      for (const user of procurementUsers) {
        try {
          // Format application number manually since we're using a plain object
          const year = supplier.createdAt ? new Date(supplier.createdAt).getFullYear() : new Date().getFullYear();
          const appId = `APP-${year}-${supplier._id.toString().slice(-3).padStart(3, '0')}`;

          await createNotification({
            recipient: user._id,
            type: 'new_task_assigned',
            title: `[${appId}] New Supplier Application`,
            message: `New supplier application from ${supplier.supplierName || 'Unknown Supplier'} requires review`,
            relatedEntity: {
              entityType: 'supplier',
              entityId: supplier._id
            },
            actionUrl: `/suppliers/${supplier._id}`
          });
        } catch (notifError) {
          console.error('Error creating notification for user:', user._id, notifError);
          // Continue with other users even if one fails
        }
      }
    } catch (notifError) {
      console.error('Error in notification creation process:', notifError);
      // Don't fail submission if notifications fail
    }

    // Notify super_admin users when a supplier submits an "Other" value for any dropdown (non-blocking)
    try {
      const otherSuggestions = [
        {
          condition: comprehensiveUpdate.bankName === 'Other' && comprehensiveUpdate.bankNameOther?.trim(),
          title: 'New Bank Name Suggestion',
          message: `Supplier "${supplier.supplierName || 'Unknown'}" suggested a new bank: "${comprehensiveUpdate.bankNameOther}". Consider adding it to the Bank Names setup.`,
        },
        {
          condition: comprehensiveUpdate.serviceTypes === 'Other' && comprehensiveUpdate.serviceTypesOther?.trim(),
          title: 'New Service Type Suggestion',
          message: `Supplier "${supplier.supplierName || 'Unknown'}" suggested a new service type: "${comprehensiveUpdate.serviceTypesOther}". Consider adding it to the Service Types setup.`,
        },
        {
          condition: comprehensiveUpdate.sourceOfWealth === 'Other' && comprehensiveUpdate.sourceOfWealthOther?.trim(),
          title: 'New Source of Wealth Suggestion',
          message: `Supplier "${supplier.supplierName || 'Unknown'}" suggested a new source of wealth: "${comprehensiveUpdate.sourceOfWealthOther}". Consider adding it to the Wealth Sources setup.`,
        },
      ].filter((s) => s.condition);

      console.log(`[SUBMIT] Other suggestions detected: ${otherSuggestions.length}`, otherSuggestions.map(s => s.title));

      if (otherSuggestions.length > 0) {
        // Use $ne: false so users without the isActive field are included
        const superAdminUsers = await User.find({ role: 'super_admin', isActive: { $ne: false } });
        console.log(`[SUBMIT] Super admin users found for notification: ${superAdminUsers.length}`);

        for (const suggestion of otherSuggestions) {
          for (const user of superAdminUsers) {
            try {
              await createNotification({
                recipient: user._id,
                type: 'system_alert',
                title: suggestion.title,
                message: suggestion.message,
                relatedEntity: { entityType: 'supplier', entityId: supplier._id },
                actionUrl: `/setups`,
              });
              console.log(`[SUBMIT] Notification sent to super_admin ${user.email}: "${suggestion.title}"`);
            } catch (notifError) {
              console.error(`[SUBMIT] Error creating notification "${suggestion.title}" for ${user.email}:`, notifError.message);
            }
          }
        }
      }
    } catch (notifError) {
      console.error('[SUBMIT] Error in suggestion notification process:', notifError);
      // Don't fail submission if notifications fail
    }

    res.json({
      success: true,
      message: 'Application submitted successfully',
      data: supplier
    });
  } catch (error) {
    console.error('Submit supplier error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code,
      supplierId: req.params.id
    });
    res.status(500).json({
      success: false,
      message: 'Error submitting application',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
        title: `[${supplier.applicationNumber}] Profile Update Request`,
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
