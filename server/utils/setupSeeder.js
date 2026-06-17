const SetupConfig = require('../models/SetupConfig');

// Documents mandatory for ALL entity types
const UNIVERSAL_DOCS = [
  { field: 'businessPermit',     label: 'Business Permit / Trading Licence', uploadType: 'single',   required: true },
  { field: 'bankReferenceLetter',label: 'Bank Reference Letter',              uploadType: 'single',   required: true },
];

const SEED_DATA = {
  roles: [
    { name: 'Procurement', description: 'Procurement Approver' },
    { name: 'Legal',       description: 'Legal Approver' },
    { name: 'Management',  description: 'Management Approver' },
    { name: 'Super Admin', description: 'System Administrator' },
  ],
  entity_types: [
    {
      name: 'Private/Public Company',
      description: '',
      documents: [
        ...UNIVERSAL_DOCS,
        { field: 'certificateOfIncorporation', label: 'Certificate of Incorporation or Registration', uploadType: 'single',   required: true },
        { field: 'kraPinCertificate',          label: 'PIN Certificate of Entity',                   uploadType: 'single',   required: true },
        { field: 'etimsProof',                 label: 'Proof of Registration on e-TIMS',              uploadType: 'single',   required: true },
        { field: 'financialStatements',        label: 'Current Annual Audited Financial Statements',  uploadType: 'single',   required: true },
        { field: 'cr12',                       label: 'Valid CR12 (not more than 30 days old)',        uploadType: 'single',   required: true },
        { field: 'companyProfile',             label: 'Firm Company Profile',                         uploadType: 'single',   required: true },
        { field: 'directorsIds',               label: "Directors' IDs / Copies of Passports",         uploadType: 'multiple', required: true },
      ],
    },
    {
      name: 'Partnerships',
      description: '',
      documents: [
        ...UNIVERSAL_DOCS,
        { field: 'partnershipDeed',        label: 'Partnership Deed',                                         uploadType: 'single',   required: true },
        { field: 'partnersPinCertificate', label: "Partners' PIN Certificate",                                uploadType: 'single',   required: true },
        { field: 'partnersTaxCompliance',  label: 'Valid Tax Compliance Certificate for Each Partner',         uploadType: 'single',   required: true },
        { field: 'partnerIds',             label: "Partners' IDs / Copies of Passports",                      uploadType: 'multiple', required: true },
        { field: 'companyProfile',         label: 'Firm Company Profile',                                     uploadType: 'single',   required: true },
        { field: 'financialStatements',    label: 'Current Annual Audited Financial Statements',               uploadType: 'single',   required: true },
        { field: 'etimsProof',             label: 'Proof of Registration on e-TIMS',                           uploadType: 'single',   required: true },
      ],
    },
    {
      name: 'Foreign Company',
      description: '',
      documents: [
        ...UNIVERSAL_DOCS,
        { field: 'certificateOfIncorporation', label: 'Certificate of Incorporation or Registration',  uploadType: 'single',   required: true },
        { field: 'shareCertificate',           label: 'Valid Share Certificate',                       uploadType: 'single',   required: false },
        { field: 'registryExtract',            label: 'Valid Registry Extract',                        uploadType: 'single',   required: false },
        { field: 'taxComplianceCertificate',   label: 'Valid Tax Compliance Certificate',              uploadType: 'single',   required: true },
        { field: 'directorsNationalIds',       label: "Directors' National Identification Documents",  uploadType: 'multiple', required: false },
        { field: 'directorsPassports',         label: "Directors' Passports",                          uploadType: 'multiple', required: false },
        { field: 'companyProfile',             label: 'Firm Company Profile',                         uploadType: 'single',   required: true },
        { field: 'financialStatements',        label: 'Current Annual Audited Financial Statements',  uploadType: 'single',   required: true },
      ],
    },
    {
      name: 'Individual/Sole Proprietor',
      description: '',
      documents: [
        ...UNIVERSAL_DOCS,
        { field: 'nationalId',       label: 'National Identification Card',       uploadType: 'single', required: false },
        { field: 'passportDocument', label: 'Passport',                           uploadType: 'single', required: false },
        { field: 'workPermit',       label: 'Work Permit (for foreigners)',        uploadType: 'single', required: false },
        { field: 'policeClearance',  label: 'Police Clearance Certificate',        uploadType: 'single', required: true },
        { field: 'kraPinCertificate',label: 'PIN Certificate',                    uploadType: 'single', required: true },
        { field: 'resume',           label: 'Resume (Curriculum Vitae)',           uploadType: 'single', required: true },
        { field: 'etimsProof',       label: 'Proof of Registration on e-TIMS',    uploadType: 'single', required: true },
      ],
    },
    {
      name: 'Trust',
      description: '',
      documents: [
        ...UNIVERSAL_DOCS,
        { field: 'trustDeed',        label: 'Trust Deed',                          uploadType: 'single',   required: true },
        { field: 'founderPin',       label: "Founders' PIN Certificate",            uploadType: 'single',   required: true },
        { field: 'foundersIds',      label: "Founders' IDs / Copies of Passports", uploadType: 'multiple', required: true },
        { field: 'beneficiariesIds', label: "Beneficiaries' IDs / Copies of Passports", uploadType: 'multiple', required: true },
        { field: 'financialStatements', label: 'Current Annual Audited Financial Statements', uploadType: 'single', required: true },
      ],
    },
  ],
  currencies: [
    { name: 'KES', description: 'Kenyan Shilling' },
    { name: 'USD', description: 'US Dollar' },
    { name: 'EUR', description: 'Euro' },
    { name: 'GBP', description: 'British Pound' },
  ],
  wealth_sources: [
    { name: 'Salary',          description: '' },
    { name: 'Business Income', description: '' },
    { name: 'Investment',      description: '' },
    { name: 'Inheritance',     description: '' },
    { name: 'Loan',            description: '' },
    { name: 'Other',           description: '' },
  ],
  service_types: [
    { name: 'Goods Supply',         description: '' },
    { name: 'Services',             description: '' },
    { name: 'Consultancy',          description: '' },
    { name: 'Construction',         description: '' },
    { name: 'IT Services',          description: '' },
    { name: 'Professional Services',description: '' },
    { name: 'Maintenance & Repair', description: '' },
    { name: 'Other',                description: '' },
  ],
  bank_names: [
    { name: 'Equity Bank',                    description: '' },
    { name: 'KCB Bank',                       description: '' },
    { name: 'Cooperative Bank of Kenya',      description: '' },
    { name: 'Absa Bank Kenya',                description: '' },
    { name: 'Standard Chartered Bank',        description: '' },
    { name: 'I&M Bank',                       description: '' },
    { name: 'NCBA Bank',                      description: '' },
    { name: 'Diamond Trust Bank (DTB)',        description: '' },
    { name: 'Stanbic Bank Kenya',             description: '' },
    { name: 'Family Bank',                    description: '' },
    { name: 'Prime Bank',                     description: '' },
    { name: 'SBM Bank Kenya',                 description: '' },
    { name: 'Sidian Bank',                    description: '' },
    { name: 'HFC Bank',                       description: '' },
    { name: 'Other',                          description: '' },
  ],
};

/**
 * Seeds setup config categories that are empty.
 * Safe to call on every startup — skips categories that already have data.
 * Also patches existing entity_type entries that have no documents defined.
 */
const seedSetupConfig = async () => {
  try {
    for (const [category, items] of Object.entries(SEED_DATA)) {
      const count = await SetupConfig.countDocuments({ category });
      if (count > 0) continue;

      await SetupConfig.insertMany(
        items.map((item) => ({ category, ...item }))
      );
      console.log(`✅ Seeded ${items.length} items for setup category: ${category}`);
    }

    // Ensure every entity type has all its seed documents — add any that are missing
    for (const entityData of SEED_DATA.entity_types) {
      const existing = await SetupConfig.findOne({ category: 'entity_types', name: entityData.name });
      if (!existing) continue;

      const existingFields = new Set((existing.documents || []).map((d) => d.field));
      const missingDocs = entityData.documents.filter((d) => !existingFields.has(d.field));

      if (missingDocs.length > 0) {
        await SetupConfig.findByIdAndUpdate(existing._id, {
          documents: [...(existing.documents || []), ...missingDocs],
        });
        console.log(`✅ Added ${missingDocs.length} missing doc(s) to entity type: ${entityData.name}`);
      }
    }
  } catch (err) {
    console.error('❌ Setup config seeding error:', err.message);
  }
};

module.exports = seedSetupConfig;
