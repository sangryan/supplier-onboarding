require('dotenv').config();
const mongoose = require('mongoose');

const User = require('../server/models/User');
const Supplier = require('../server/models/Supplier');

const MONGODB_URI = process.env.MONGODB_URI || process.env.PROD_MONGODB_URI || 'mongodb://localhost:27017/supplier_onboarding';

const procurementPendingStatuses = ['submitted', 'under_review', 'pending_procurement', 'more_info_required'];

const getReviewer = async () => {
  return User.findOne({
    role: { $in: ['procurement', 'super_admin'] },
    isActive: { $ne: false }
  }).sort({ role: 1, createdAt: 1 });
};

const getExistingVendorNumber = async (supplier) => {
  if (supplier.vendorNumber) return supplier.vendorNumber;

  if (!supplier.submittedBy) return null;

  const existingSupplier = await Supplier.findOne({
    submittedBy: supplier.submittedBy,
    vendorNumber: { $exists: true, $ne: null, $ne: '' }
  }).select('vendorNumber').lean();

  return existingSupplier?.vendorNumber || null;
};

const approveSupplierApplications = async (reviewer) => {
  const suppliers = await Supplier.find({
    isProfileOnly: { $ne: true },
    status: { $in: procurementPendingStatuses }
  });

  let updated = 0;

  for (const supplier of suppliers) {
    const vendorNumber = await getExistingVendorNumber(supplier) || await Supplier.generateVendorNumber('standard');

    supplier.vendorNumber = vendorNumber;
    supplier.status = 'pending_legal';
    supplier.currentApprovalStage = 'legal';
    supplier.approvedAt = supplier.approvedAt || new Date();

    const hasProcurementApproval = supplier.approvalHistory.some((entry) =>
      entry.action === 'approved' &&
      String(entry.approver || '') === String(reviewer?._id || '')
    );

    if (!hasProcurementApproval) {
      supplier.approvalHistory.push({
        approver: reviewer?._id,
        action: 'approved',
        comments: 'Existing supplier marked as approved by procurement.',
        timestamp: new Date()
      });
    }

    const hasVendorAssignment = supplier.approvalHistory.some((entry) =>
      entry.action === 'assigned_vendor_number' &&
      String(entry.comments || '').includes(vendorNumber)
    );

    if (!hasVendorAssignment) {
      supplier.approvalHistory.push({
        approver: reviewer?._id,
        action: 'assigned_vendor_number',
        comments: `Vendor number ${vendorNumber} assigned. Proceeding to legal review.`,
        timestamp: new Date()
      });
    }

    await supplier.save();
    updated += 1;
  }

  return updated;
};

const approveSupplierUsers = async (reviewer) => {
  const result = await User.updateMany(
    {
      role: 'supplier',
      supplierApprovalStatus: { $ne: 'approved' }
    },
    {
      $set: {
        supplierApprovalStatus: 'approved',
        supplierApprovalReviewedBy: reviewer?._id,
        supplierApprovalReviewedAt: new Date(),
        supplierApprovalComment: 'Existing supplier marked as approved by procurement.'
      }
    }
  );

  return result.modifiedCount || 0;
};

const run = async () => {
  await mongoose.connect(MONGODB_URI);

  const reviewer = await getReviewer();
  if (!reviewer) {
    console.warn('No active procurement or super admin user found. Updates will still be applied without reviewer metadata.');
  }

  const usersUpdated = await approveSupplierUsers(reviewer);
  const applicationsUpdated = await approveSupplierApplications(reviewer);

  console.log(`Supplier users approved by procurement: ${usersUpdated}`);
  console.log(`Supplier applications moved to legal review: ${applicationsUpdated}`);

  await mongoose.connection.close();
};

run().catch(async (error) => {
  console.error('Failed to approve existing suppliers:', error.message);
  await mongoose.connection.close();
  process.exit(1);
});
