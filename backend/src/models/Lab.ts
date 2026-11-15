import mongoose, { Schema, Document } from 'mongoose';

export interface ILab extends Document {
  name: string;
  contactEmail: string;
  contactPhone: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const labSchema: Schema = new mongoose.Schema({
  name: { type: String, required: true },
  contactEmail: { type: String, required: true },
  contactPhone: { type: String, required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const Lab = mongoose.model<ILab>('Lab', labSchema);