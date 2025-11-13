/**
 * Seed Admin User to Production Database
 * 
 * This script connects to your production MongoDB and creates the initial admin user.
 * Run this ONCE after deploying to Render.
 * 
 * Usage:
 *   node seed-production.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import User model
const User = require('./server/models/User');

// Get MongoDB URI from environment or prompt
const MONGODB_URI = process.env.MONGODB_URI || process.env.PROD_MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI not found!');
  console.log('\n📝 Set your production MongoDB URI in one of these ways:\n');
  console.log('1. Create a .env file with:');
  console.log('   MONGODB_URI=mongodb+srv://...\n');
  console.log('2. Or run with environment variable:');
  console.log('   MONGODB_URI="mongodb+srv://..." node seed-production.js\n');
  process.exit(1);
}

const seedAdmin = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    console.log(`📍 Database: ${MONGODB_URI.split('@')[1]?.split('?')[0] || 'hidden'}\n`);
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Admin user data
    const adminData = {
      name: 'System Administrator',
      email: 'admin@betika.com',
      password: 'Admin@123',
      role: 'admin',
      isActive: true
    };

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminData.email });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log(`📧 Email: ${existingAdmin.email}`);
      console.log(`👤 Role: ${existingAdmin.role}`);
      console.log(`✅ Active: ${existingAdmin.isActive}`);
      console.log('\n💡 You can login with:');
      console.log(`   Email: ${adminData.email}`);
      console.log(`   Password: ${adminData.password}`);
      console.log('\n⚠️  IMPORTANT: Change this password after first login!\n');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Hash password
    console.log('🔐 Hashing password...');
    const salt = await bcrypt.genSalt(10);
    adminData.password = await bcrypt.hash(adminData.password, salt);

    // Create admin user
    console.log('👤 Creating admin user...');
    const admin = await User.create(adminData);

    console.log('\n✅ Admin user created successfully!\n');
    console.log('═══════════════════════════════════════');
    console.log('📋 ADMIN CREDENTIALS');
    console.log('═══════════════════════════════════════');
    console.log(`📧 Email:    admin@betika.com`);
    console.log(`🔑 Password: Admin@123`);
    console.log(`👤 Role:     ${admin.role}`);
    console.log(`🆔 User ID:  ${admin._id}`);
    console.log('═══════════════════════════════════════\n');
    
    console.log('⚠️  IMPORTANT: Change this password after first login!\n');
    console.log('🎉 You can now login at:');
    console.log('   https://supplier-onboarding-portal.onrender.com\n');

    // Create sample users (optional)
    console.log('📝 Do you want to create sample users? (Skip for now)');
    console.log('   You can create more users from the admin panel after login.\n');

    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    console.log('🚀 Setup complete!\n');
    
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error seeding admin user:', error.message);
    
    if (error.name === 'MongooseServerSelectionError') {
      console.log('\n💡 MongoDB Connection Failed. Check:');
      console.log('   1. MongoDB URI is correct');
      console.log('   2. Network Access allows your IP (0.0.0.0/0)');
      console.log('   3. Database user has correct permissions');
      console.log('   4. Password is URL-encoded if it has special characters\n');
    }
    
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the seed function
console.log('════════════════════════════════════════════════════');
console.log('  SEED PRODUCTION DATABASE - ADMIN USER');
console.log('════════════════════════════════════════════════════\n');

seedAdmin();

