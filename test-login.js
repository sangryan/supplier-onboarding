/**
 * Test Login Script
 * Tests if the admin user can log in successfully
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./server/models/User');

const MONGODB_URI = process.env.MONGODB_URI || process.env.PROD_MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not set');
  process.exit(1);
}

const testLogin = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...\n');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected\n');

    const email = 'admin@betika.com';
    const password = 'Admin@123';

    console.log(`🔍 Testing login for: ${email}`);
    console.log(`🔑 Password: ${password}\n`);

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
      console.error('❌ User not found!');
      console.log('\n💡 Run: node seed-production.js\n');
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log('✅ User found:');
    console.log(`   ID: ${user._id}`);
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Active: ${user.isActive}`);
    console.log(`   Password hash: ${user.password.substring(0, 20)}...\n`);

    // Check if active
    if (!user.isActive) {
      console.error('❌ Account is deactivated');
      await mongoose.connection.close();
      process.exit(1);
    }

    // Compare password
    console.log('🔐 Testing password...');
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      console.error('❌ Password does NOT match!');
      console.log('\n🔧 This means the password in the database is different.');
      console.log('   Try resetting it or re-running the seed script.\n');
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log('✅ Password matches!');
    console.log('\n═══════════════════════════════════════');
    console.log('🎉 LOGIN TEST SUCCESSFUL!');
    console.log('═══════════════════════════════════════');
    console.log('\nThe admin user can log in with:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('\n✅ Backend authentication is working correctly.');
    console.log('\n💡 If login still fails in the app, check:');
    console.log('   1. Browser console for errors');
    console.log('   2. Network tab for API response');
    console.log('   3. REACT_APP_API_URL environment variable\n');

    await mongoose.connection.close();
    console.log('✅ Database connection closed\n');
    
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

console.log('════════════════════════════════════════════════════');
console.log('  TEST LOGIN - ADMIN USER');
console.log('════════════════════════════════════════════════════\n');

testLogin();

