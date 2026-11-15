import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User';

dotenv.config();

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set');
    process.exit(1);
  }
  await mongoose.connect(uri);
  const exists = await User.findOne({ role: 'SUPER_ADMIN' });
  if (exists) {
    console.log('Super Admin already exists:', exists.email);
    await mongoose.disconnect();
    return;
  }
  const superAdmin = await User.create({
    name: 'Platform Admin',
    email: process.env.SEED_SUPER_ADMIN_EMAIL || 'superadmin@lms.local',
    password: process.env.SEED_SUPER_ADMIN_PASSWORD || 'ChangeMe123!',
    role: 'SUPER_ADMIN',
    tenantId: null,
  });
  console.log('Super Admin created:', superAdmin.email);
  await mongoose.disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});