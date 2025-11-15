const mongoose = require('mongoose');
require('dotenv').config();

const Supplier = require('./server/models/Supplier');

// Sample additional contacts data
const sampleContacts = [
  {
    name: 'Jane Doe',
    email: 'jane.doe@abclimited.com',
    phone: '+254764567326',
    idPassport: 'PAS789012',
    relationship: 'Operations Manager'
  },
  {
    name: 'Robert Smith',
    email: 'robert.smith@abclimited.com',
    phone: '+254712345678',
    idPassport: 'ID345678',
    relationship: 'Finance Director'
  },
  {
    name: 'Sarah Johnson',
    email: 'sarah.johnson@abclimited.com',
    phone: '+254723456789',
    idPassport: 'PAS456789',
    relationship: 'HR Manager'
  }
];

async function addSampleContacts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/supplier-onboarding', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Find all suppliers
    const suppliers = await Supplier.find({});
    console.log(`Found ${suppliers.length} suppliers`);

    if (suppliers.length === 0) {
      console.log('No suppliers found. Please create a supplier first.');
      process.exit(0);
    }

    // Add sample contacts to each supplier
    for (const supplier of suppliers) {
      // Check if supplier already has additionalContacts
      if (supplier.additionalContacts && supplier.additionalContacts.length > 0) {
        console.log(`Supplier ${supplier.supplierName} already has ${supplier.additionalContacts.length} contacts. Skipping...`);
        continue;
      }

      // Add sample contacts
      await Supplier.findByIdAndUpdate(
        supplier._id,
        { 
          $set: { 
            additionalContacts: sampleContacts,
            lastModified: new Date()
          } 
        },
        { new: true, runValidators: false }
      );

      console.log(`Added ${sampleContacts.length} sample contacts to supplier: ${supplier.supplierName}`);
    }

    console.log('\n✅ Sample contacts added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error adding sample contacts:', error);
    process.exit(1);
  }
}

// Run the script
addSampleContacts();

