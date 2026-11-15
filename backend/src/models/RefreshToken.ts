import mongoose, { Schema, Document } from 'mongoose';

export interface IRefreshToken extends Document {
  token: string;
  user: mongoose.Types.ObjectId;
  expiresAt: Date;
}

const refreshTokenSchema: Schema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshToken = mongoose.model<IRefreshToken>('RefreshToken', refreshTokenSchema);