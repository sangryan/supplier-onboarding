const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const Supplier = require('../models/Supplier');
const User = require('../models/User');
const Document = require('../models/Document');
const { protect, authorize, supplierAccess } = require('../middleware/auth');
const { createNotification } = require('../utils/notifications');

// @route   POST /api/suppliers/draft
// @desc    Create or update draft supplier application
// @access  Private (Supplier)
router.post('/draft', protect, authorize('supplier'), async (req, res) => {
  try {
    // Map frontend field names to model structure
    const draftData = {
      // Basic Information (required fields with defaults)
      supplierName: req.body.supplierName || 'Draft Application',
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
    // Get supplier document (not lean so we can populate)
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

    // Convert to plain object to include all fields (including those not in schema)
    // This works because we set strict: false in the schema
    const supplierObj = supplier.toObject();

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
        'Limited Company': 'private_company',
        'Public Limited Company': 'public_company',
        'Partnership': 'partnership',
        'Foreign Company': 'foreign_company',
        'Individual': 'individual',
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

// @route   POST /api/suppliers/:id/submit
// @desc    Submit supplier application for review
// @access  Private (Supplier)
router.post('/:id/submit', protect, authorize('supplier'), supplierAccess, async (req, res) => {
  try {
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
        'Limited Company': 'private_company',
        'Public Limited Company': 'public_company',
        'Partnership': 'partnership',
        'Foreign Company': 'foreign_company',
        'Individual': 'individual',
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
          await createNotification({
            recipient: user._id,
            type: 'new_task_assigned',
            title: 'New Supplier Application',
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

