import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { tenantPlugin } from '../middleware/tenantPlugin';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'SUPER_ADMIN' | 'LAB_ADMIN' | 'DOCTOR' | 'RECEPTIONIST';
  tenantId: mongoose.Types.ObjectId | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema: Schema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['SUPER_ADMIN', 'LAB_ADMIN', 'DOCTOR', 'RECEPTIONIST'], required: true },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lab', default: null },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

userSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.plugin(tenantPlugin);

export const User = mongoose.model<IUser>('User', userSchema);