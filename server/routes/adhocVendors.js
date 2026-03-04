const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const AdHocVendor = require('../models/AdHocVendor');
const Supplier = require('../models/Supplier');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { createNotification } = require('../utils/notifications');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads/adhoc'));
    },
    filename: (req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${unique}-${file.originalname}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowed = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF, image, and document files are allowed'));
        }
    }
});

const uploadFields = upload.fields([
    { name: 'nationalIdDocument', maxCount: 1 },
    { name: 'kraPinDocument', maxCount: 1 },
    { name: 'eTimsDocument', maxCount: 1 },
    { name: 'lpoDocument', maxCount: 1 },
]);


// @route   POST /api/adhoc-vendors
// @desc    Create a new ad-hoc vendor
// @access  Private (Procurement)
router.post('/', protect, authorize('procurement', 'super_admin'), uploadFields, async (req, res) => {
    try {
        const {
            supplierName, mobileNumber, department, servicesProvided,
            bankName, accountNumber, branch, creditPeriod, submitForApproval
        } = req.body;

        const files = req.files || {};
        const isSubmit = submitForApproval === 'true';

        const vendorData = {
            supplierName,
            mobileNumber,
            department,
            servicesProvided,
            bankName,
            accountNumber,
            branch,
            creditPeriod: creditPeriod || '',
            createdBy: req.user.id,
            status: isSubmit ? 'submitted' : 'draft',
            submittedAt: isSubmit ? new Date() : undefined,
        };

        // Attach file info
        if (files.nationalIdDocument?.[0]) {
            vendorData.nationalIdDocument = {
                filename: files.nationalIdDocument[0].originalname,
                path: files.nationalIdDocument[0].path,
                mimetype: files.nationalIdDocument[0].mimetype,
            };
        }
        if (files.kraPinDocument?.[0]) {
            vendorData.kraPinDocument = {
                filename: files.kraPinDocument[0].originalname,
                path: files.kraPinDocument[0].path,
                mimetype: files.kraPinDocument[0].mimetype,
            };
        }
        if (files.eTimsDocument?.[0]) {
            vendorData.eTimsDocument = {
                filename: files.eTimsDocument[0].originalname,
                path: files.eTimsDocument[0].path,
                mimetype: files.eTimsDocument[0].mimetype,
            };
        }
        if (files.lpoDocument?.[0]) {
            vendorData.lpoDocument = {
                filename: files.lpoDocument[0].originalname,
                path: files.lpoDocument[0].path,
                mimetype: files.lpoDocument[0].mimetype,
            };
        }

        const vendor = await AdHocVendor.create(vendorData);

        // When submitted, also create a Supplier record with pending_legal status
        let supplierRecord = null;
        if (isSubmit) {
            const vendorNumber = await Supplier.generateVendorNumber('adhoc');

            supplierRecord = await Supplier.create({
                supplierName,
                vendorNumber,
                status: 'pending_legal',
                currentApprovalStage: 'legal',
                legalNature: 'individual',
                entityType: 'individual',
                serviceType: 'other',
                serviceTypeOther: servicesProvided || department || 'Ad-Hoc Services',
                creditPeriod: creditPeriod ? parseInt(creditPeriod) || 30 : 30,
                submittedBy: req.user.id,
                submittedAt: new Date(),
                isProfileOnly: false,
                adHocVendorId: vendor._id,
                authorizedPerson: {
                    name: supplierName,
                    relationship: 'owner',
                    idPassportNumber: 'Ad-Hoc-Pending',
                    phone: mobileNumber || 'N/A',
                    email: `adhoc-${vendorNumber.toLowerCase()}@placeholder.local`,
                },
                bankDetails: {
                    bankName: bankName || '',
                    accountNumber: accountNumber || '',
                    branchName: branch || '',
                },
                approvalHistory: [{
                    approver: req.user.id,
                    action: 'approved',
                    comments: `Ad-hoc vendor created by procurement. Vendor number ${vendorNumber} auto-assigned.`,
                    timestamp: new Date()
                }, {
                    approver: req.user.id,
                    action: 'assigned_vendor_number',
                    comments: `Vendor number ${vendorNumber} auto-assigned for ad-hoc vendor.`,
                    timestamp: new Date()
                }],
            });

            // Notify legal team
            const legalUsers = await User.find({ role: 'legal', isActive: true });
            for (const user of legalUsers) {
                await createNotification({
                    recipient: user._id,
                    type: 'new_task_assigned',
                    title: `[${supplierRecord.applicationNumber}] Ad-Hoc Vendor Ready for Legal Review`,
                    message: `${supplierName} (${vendorNumber}) has been submitted as an ad-hoc vendor and needs legal review.`,
                    relatedEntity: {
                        entityType: 'supplier',
                        entityId: supplierRecord._id
                    },
                    actionUrl: `/suppliers/${supplierRecord._id}`
                });
            }
        }

        res.status(201).json({
            success: true,
            message: isSubmit
                ? `Ad-hoc vendor submitted for approval (Vendor #: ${supplierRecord?.vendorNumber})`
                : 'Ad-hoc vendor saved as draft',
            data: vendor,
            supplier: supplierRecord
        });
    } catch (error) {
        console.error('Create ad-hoc vendor error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error creating ad-hoc vendor'
        });
    }
});

// @route   GET /api/adhoc-vendors
// @desc    Get all ad-hoc vendors
// @access  Private (Procurement, Legal)
router.get('/', protect, authorize('procurement', 'legal', 'super_admin'), async (req, res) => {
    try {
        const vendors = await AdHocVendor.find()
            .populate('createdBy', 'firstName lastName')
            .sort({ createdAt: -1 });

        res.json({ success: true, data: vendors });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching ad-hoc vendors' });
    }
});

module.exports = router;
