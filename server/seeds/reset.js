/**
 * Full system reset — wipes all data and uploads, then recreates the super admin.
 * Run inside the container:
 *   docker exec -it betika_app node server/seeds/reset.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const UPLOAD_PATH = process.env.UPLOAD_PATH || path.join(__dirname, '../../uploads');
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

const ADMIN = {
  firstName: 'Super',
  lastName: 'Admin',
  email: 'admin@betika.com',
  password: 'Admin@123',
  role: 'super_admin',
  isActive: true,
  isEmailVerified: true,
  totpEnabled: false,
};

async function clearUploads() {
  if (!fs.existsSync(UPLOAD_PATH)) {
    console.log('  uploads directory not found, skipping');
    return;
  }
  const entries = fs.readdirSync(UPLOAD_PATH);
  for (const entry of entries) {
    const full = path.join(UPLOAD_PATH, entry);
    fs.rmSync(full, { recursive: true, force: true });
  }
  console.log(`  ✅ Cleared uploads at ${UPLOAD_PATH}`);
}

async function run() {
  console.log('\n⚠️  BETIKA SYSTEM RESET');
  console.log('──────────────────────────────');

  if (!MONGO_URI) {
    console.error('❌ MONGODB_URI not set in environment');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log('  ✅ Connected to MongoDB');

  // Drop all collections
  const collections = await mongoose.connection.db.collections();
  const names = collections.map(c => c.collectionName);
  console.log(`\n  Dropping ${names.length} collection(s): ${names.join(', ')}`);
  for (const col of collections) {
    await col.drop().catch(() => {}); // ignore if already empty
  }
  console.log('  ✅ All collections dropped');

  // Clear uploads
  console.log('\n  Clearing uploads...');
  await clearUploads();

  // Recreate super admin
  console.log('\n  Creating super admin...');
  const hashedPassword = await bcrypt.hash(ADMIN.password, 10);

  // Re-require User model after dropping collections so indexes are recreated
  const User = require('../models/User');
  await User.create({ ...ADMIN, password: hashedPassword });
  console.log('  ✅ Super admin created');

  console.log('\n──────────────────────────────');
  console.log('  Reset complete.\n');
  console.log('  Login credentials:');
  console.log(`    Email:    ${ADMIN.email}`);
  console.log(`    Password: ${ADMIN.password}`);
  console.log('──────────────────────────────\n');

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error('❌ Reset failed:', err.message);
  process.exit(1);
});
