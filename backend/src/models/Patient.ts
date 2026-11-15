import mongoose, { Schema, Document } from 'mongoose';
import { tenantPlugin } from '../middleware/tenantPlugin';

export interface IPatient extends Document {
  patientCode: string;
  name: string;
  phone: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dateOfBirth: Date;
  address?: string;
  isActive: boolean;
  tenantId: mongoose.Types.ObjectId;
  registeredBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const patientSchema: Schema = new mongoose.Schema({
  patientCode: { type: String, required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  gender: { type: String, enum: ['MALE', 'FEMALE', 'OTHER'], required: true },
  dateOfBirth: { type: Date, required: true },
  address: { type: String },
  isActive: { type: Boolean, default: true },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lab', required: true },
  registeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

patientSchema.index({ tenantId: 1, patientCode: 1 }, { unique: true });
patientSchema.index({ tenantId: 1, name: 1 });
patientSchema.index({ tenantId: 1, phone: 1 });
patientSchema.index({ tenantId: 1, createdAt: -1 });

patientSchema.plugin(tenantPlugin);

export const Patient = mongoose.model<IPatient>('Patient', patientSchema);