const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/supplier_onboarding', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  password: String,
  role: String,
  department: String,
  phone: String,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
});

const User = mongoose.model('User', userSchema);

async function createAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@betika.com' });
    
    if (existingAdmin) {
      console.log('❌ Admin user already exists!');
      console.log('Email: admin@betika.com');
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Admin@123', salt);

    // Create admin user (no email verification required for internal users)
    const admin = await User.create({
      firstName: 'Super',
      lastName: 'Admin',
      email: 'admin@betika.com',
      password: hashedPassword,
      role: 'super_admin',
      department: 'Administration',
      phone: '+254700000000',
      isActive: true,
      isEmailVerified: true, // Internal users don't need email verification
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('✅ Super Admin user created successfully!');
    console.log('\n📧 Login Credentials:');
    console.log('   Email: admin@betika.com');
    console.log('   Password: Admin@123');
    console.log('\n⚠️  IMPORTANT: Change this password immediately after first login!\n');

    // Create sample procurement user (no email verification required for internal users)
    const procurementPassword = await bcrypt.hash('Procurement@123', salt);
    await User.create({
      firstName: 'John',
      lastName: 'Doe',
      email: 'procurement@betika.com',
      password: procurementPassword,
      role: 'procurement',
      department: 'Procurement',
      phone: '+254700000001',
      isActive: true,
      isEmailVerified: true, // Internal users don't need email verification
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('✅ Sample Procurement user created!');
    console.log('   Email: procurement@betika.com');
    console.log('   Password: Procurement@123\n');

    // Create sample legal user (no email verification required for internal users)
    const legalPassword = await bcrypt.hash('Legal@123', salt);
    await User.create({
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'legal@betika.com',
      password: legalPassword,
      role: 'legal',
      department: 'Legal',
      phone: '+254700000002',
      isActive: true,
      isEmailVerified: true, // Internal users don't need email verification
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('✅ Sample Legal user created!');
    console.log('   Email: legal@betika.com');
    console.log('   Password: Legal@123\n');

    // Create sample department lead user (management role)
    const managementPassword = await bcrypt.hash('Management@123', salt);
    await User.create({
      firstName: 'Mary',
      lastName: 'Lead',
      email: 'management@betika.com',
      password: managementPassword,
      role: 'management',
      department: 'Procurement',
      phone: '+254700000003',
      isActive: true,
      isEmailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('✅ Sample Department Lead user created!');
    console.log('   Email: management@betika.com');
    console.log('   Password: Management@123');
    console.log('   Department: Procurement\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

createAdmin();

