import mongoose, { Document } from 'mongoose';
import { tenantPlugin } from '../middleware/tenantPlugin';

export interface IOrder extends Document {
  [key: string]: any;
}

const itemSchema = new mongoose.Schema({
  test: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
  name: { type: String, required: true },
  code: { type: String },
  price: { type: Number, required: true },
  unit: { type: String },
  refMin: { type: Number, default: null },
  refMax: { type: Number, default: null },
  refText: { type: String },
  result: { type: String, default: '' },
  flag: { type: String, enum: ['', 'LOW', 'NORMAL', 'HIGH'], default: '' },
  enteredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  enteredAt: { type: Date },
});

const paymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  method: { type: String, enum: ['CASH', 'CARD', 'ONLINE'], required: true },
  paidAt: { type: Date, default: Date.now },
  receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true },
  invoiceNumber: { type: String, required: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  patientName: { type: String, required: true },
  patientCode: { type: String, required: true },
  referredBy: { type: String },
  status: { type: String, enum: ['ORDERED', 'SAMPLE_COLLECTED', 'RESULTS_ENTERED', 'VERIFIED'], default: 'ORDERED' },
  sample: {
    barcode: { type: String },
    collectedAt: { type: Date },
    collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  items: [itemSchema],
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: { type: Date },
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  paid: { type: Number, default: 0 },
  paymentStatus: { type: String, enum: ['UNPAID', 'PARTIAL', 'PAID'], default: 'UNPAID' },
  payments: [paymentSchema],
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lab', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

orderSchema.index({ tenantId: 1, orderNumber: 1 }, { unique: true });
orderSchema.index({ tenantId: 1, createdAt: -1 });
orderSchema.index({ tenantId: 1, status: 1 });

orderSchema.plugin(tenantPlugin);

export const Order = mongoose.model<IOrder>('Order', orderSchema);