import mongoose, { Schema, Document } from 'mongoose';

export interface ICounter extends Document {
  tenantId: mongoose.Types.ObjectId;
  name: string;
  seq: number;
}

const counterSchema: Schema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, required: true },
  name: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

counterSchema.index({ tenantId: 1, name: 1 }, { unique: true });

export const Counter = mongoose.model<ICounter>('Counter', counterSchema);