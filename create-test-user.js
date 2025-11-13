/**
 * Create Test User
 * Creates a simple test user with known credentials
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./server/models/User');

const MONGODB_URI = process.env.MONGODB_URI || process.env.PROD_MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not set');
  process.exit(1);
}

const createTestUser = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...\n');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected\n');

    const testUser = {
      firstName: 'Test',
      lastName: 'Admin',
      email: 'test@betika.com',
      password: 'Test1234',
      role: 'super_admin',
      department: 'IT',
      isActive: true
    };

    // Check if test user already exists
    const existing = await User.findOne({ email: testUser.email });
    if (existing) {
      console.log('⚠️  Test user already exists!');
      console.log(`📧 Email: ${existing.email}`);
      console.log('\nDeleting existing test user...');
      await User.deleteOne({ email: testUser.email });
      console.log('✅ Deleted\n');
    }

    // Create test user
    console.log('👤 Creating test user...');
    const user = await User.create(testUser);

    console.log('\n✅ Test user created successfully!\n');
    console.log('═══════════════════════════════════════');
    console.log('📋 TEST USER CREDENTIALS');
    console.log('═══════════════════════════════════════');
    console.log(`📧 Email:    test@betika.com`);
    console.log(`🔑 Password: Test1234`);
    console.log(`👤 Role:     ${user.role}`);
    console.log(`🆔 User ID:  ${user._id}`);
    console.log('═══════════════════════════════════════\n');
    
    console.log('🧪 Try logging in with this test user.');
    console.log('   If it works, the issue is with the admin@betika.com user.\n');

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
console.log('  CREATE TEST USER');
console.log('════════════════════════════════════════════════════\n');

createTestUser();

