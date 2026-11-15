import mongoose, { Schema, Document } from 'mongoose';
import { tenantPlugin } from '../middleware/tenantPlugin';

export interface ITest extends Document {
  name: string;
  code: string;
  category?: string;
  sampleType: string;
  unit?: string;
  price: number;
  refMin?: number | null;
  refMax?: number | null;
  refText?: string;
  isActive: boolean;
  tenantId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const testSchema: Schema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true },
  category: { type: String },
  sampleType: { type: String, required: true },
  unit: { type: String },
  price: { type: Number, required: true, min: 0 },
  refMin: { type: Number, default: null },
  refMax: { type: Number, default: null },
  refText: { type: String },
  isActive: { type: Boolean, default: true },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lab', required: true },
}, { timestamps: true });

testSchema.index({ tenantId: 1, code: 1 }, { unique: true });
testSchema.index({ tenantId: 1, name: 1 });

testSchema.plugin(tenantPlugin);

export const Test = mongoose.model<ITest>('Test', testSchema);