const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

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
  isEmailVerified: Boolean,
  createdAt: Date,
  updatedAt: Date
});

const User = mongoose.model('User', userSchema);

async function createDepartmentLead() {
  try {
    const email = 'management@betika.com';
    const plainPassword = 'Management@123';

    const existingUser = await User.findOne({ email });
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    if (existingUser) {
      existingUser.firstName = 'Mary';
      existingUser.lastName = 'Lead';
      existingUser.role = 'management';
      existingUser.department = 'Procurement';
      existingUser.phone = existingUser.phone || '+254700000003';
      existingUser.isActive = true;
      existingUser.isEmailVerified = true;
      existingUser.password = hashedPassword;
      existingUser.updatedAt = new Date();
      await existingUser.save();

      console.log('✅ Department lead user updated successfully!');
    } else {
      await User.create({
        firstName: 'Mary',
        lastName: 'Lead',
        email,
        password: hashedPassword,
        role: 'management',
        department: 'Procurement',
        phone: '+254700000003',
        isActive: true,
        isEmailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      console.log('✅ Department lead user created successfully!');
    }

    console.log('\n📧 Department Lead Login Credentials:');
    console.log('   Email: management@betika.com');
    console.log('   Password: Management@123');
    console.log('   Department: Procurement\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating department lead user:', error);
    process.exit(1);
  }
}

createDepartmentLead();
