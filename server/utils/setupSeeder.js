const SetupConfig = require('../models/SetupConfig');

const SEED_DATA = {
  roles: [
    { name: 'Procurement', description: 'Procurement Approver' },
    { name: 'Legal', description: 'Legal Approver' },
    { name: 'Management', description: 'Management Approver' },
    { name: 'Super Admin', description: 'System Administrator' },
  ],
  entity_types: [
    { name: 'Private/Public Company', description: '' },
    { name: 'Partnerships', description: '' },
    { name: 'Foreign Company', description: '' },
    { name: 'Individual/Sole Proprietor', description: '' },
    { name: 'Trust', description: '' },
  ],
  currencies: [
    { name: 'KES', description: 'Kenyan Shilling' },
    { name: 'USD', description: 'US Dollar' },
    { name: 'EUR', description: 'Euro' },
    { name: 'GBP', description: 'British Pound' },
  ],
  wealth_sources: [
    { name: 'Salary', description: '' },
    { name: 'Business Income', description: '' },
    { name: 'Investment', description: '' },
    { name: 'Inheritance', description: '' },
    { name: 'Loan', description: '' },
    { name: 'Other', description: '' },
  ],
  service_types: [
    { name: 'Goods Supply', description: '' },
    { name: 'Services', description: '' },
    { name: 'Consultancy', description: '' },
    { name: 'Construction', description: '' },
    { name: 'IT Services', description: '' },
    { name: 'Professional Services', description: '' },
    { name: 'Maintenance & Repair', description: '' },
    { name: 'Other', description: '' },
  ],
};

/**
 * Seeds setup config categories that are empty.
 * Safe to call on every startup — skips categories that already have data.
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
  } catch (err) {
    console.error('❌ Setup config seeding error:', err.message);
  }
};

module.exports = seedSetupConfig;
