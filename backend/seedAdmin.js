const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
require('dotenv').config();

// ─── Inline Admin model (avoids import issues with your main models) ──────────
const adminSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  email:     { type: String, required: true, unique: true, lowercase: true },
  password:  { type: String, required: true },
  role:      { type: String, default: 'admin' },
  isActive:  { type: Boolean, default: true },
}, { timestamps: true });

const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

// ─── Config — change these before running ────────────────────────────────────
const ADMIN_CREDS = {
  name:     'Super Admin',
  email:    'admin@cmr.com',
  password: 'Admin@123',
};

// ─── Seed ─────────────────────────────────────────────────────────────────────
async function seedAdmin() {
  try {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!uri) {
      console.error('❌ No MONGODB_URI found in .env');
      process.exit(1);
    }

    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('✅ Connected');

    // Check if admin already exists
    const existing = await Admin.findOne({ email: ADMIN_CREDS.email });
    if (existing) {
      console.log(`⚠️  Admin already exists: ${existing.email}`);
      console.log('   Delete them first or change the email in this script.');
      await mongoose.disconnect();
      return;
    }

    // Hash password
    const hashed = await bcrypt.hash(ADMIN_CREDS.password, 12);

    // Create admin
    const admin = await Admin.create({
      name:     ADMIN_CREDS.name,
      email:    ADMIN_CREDS.email,
      password: hashed,
      role:     'admin',
      isActive: true,
    });

    console.log('');
    console.log('🎉 Admin created successfully!');
    console.log('─────────────────────────────');
    console.log(`   Name:     ${admin.name}`);
    console.log(`   Email:    ${admin.email}`);
    console.log(`   Password: ${ADMIN_CREDS.password}`);
    console.log(`   Role:     ${admin.role}`);
    console.log(`   ID:       ${admin._id}`);
    console.log('─────────────────────────────');
    console.log('⚠️  Change the password after first login!');
    console.log('');

    await mongoose.disconnect();
    console.log('🔌 Disconnected. Done!');
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedAdmin();
