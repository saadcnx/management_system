import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../../middleware/auth';
import { Order } from '../../models/Order';
import { Patient } from '../../models/Patient';
import { Test } from '../../models/Test';
import { Counter } from '../../models/Counter';

const STATUSES = ['ORDERED', 'SAMPLE_COLLECTED', 'RESULTS_ENTERED', 'VERIFIED'];

const createSchema = z.object({
  patientId: z.string().min(1),
  testIds: z.array(z.string().min(1)).min(1),
  referredBy: z.string().optional(),
  discount: z.number().min(0).optional(),
});

const resultsSchema = z.object({
  results: z.array(z.object({ itemId: z.string().min(1), result: z.string() })).min(1),
});

const paymentSchema = z.object({
  amount: z.number().positive(),
  method: z.enum(['CASH', 'CARD', 'ONLINE']),
});

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const pad = (n: number) => String(n).padStart(4, '0');
const payState = (total: number, paid: number) => (paid >= total ? 'PAID' : paid > 0 ? 'PARTIAL' : 'UNPAID');

const getFlag = (value: string, item: any) => {
  const n = Number(value);
  if (value.trim() === '' || Number.isNaN(n)) return '';
  if (item.refMin != null && n < item.refMin) return 'LOW';
  if (item.refMax != null && n > item.refMax) return 'HIGH';
  if (item.refMin != null || item.refMax != null) return 'NORMAL';
  return '';
};

const fail = (res: Response, err: any) =>
  res.status(400).json({ success: false, message: err.message || 'Error' });

const notFound = (res: Response) => res.status(404).json({ success: false, message: 'Order not found' });

export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const data = createSchema.parse(req.body);
    const patient = await Patient.findById(data.patientId);
    if (!patient || !patient.isActive) return res.status(404).json({ success: false, message: 'Patient not found' });

    const ids = Array.from(new Set(data.testIds));
    const tests = await Test.find({ _id: { $in: ids }, isActive: true });
    if (tests.length !== ids.length) return res.status(400).json({ success: false, message: 'Invalid test selection' });

    const items = tests.map((t) => ({
      test: t._id,
      name: t.name,
      code: t.code,
      price: t.price,
      unit: t.unit,
      refMin: t.refMin,
      refMax: t.refMax,
      refText: t.refText,
    }));
    const subtotal = items.reduce((s, i) => s + i.price, 0);
    const discount = Math.min(data.discount || 0, subtotal);
    const total = subtotal - discount;

    const counter = await Counter.findOneAndUpdate(
      { tenantId: req.user.tenantId, name: 'order' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const order = await Order.create({
      orderNumber: `ORD-${pad(counter.seq)}`,
      invoiceNumber: `INV-${pad(counter.seq)}`,
      patient: patient._id,
      patientName: patient.name,
      patientCode: patient.patientCode,
      referredBy: data.referredBy,
      items,
      subtotal,
      discount,
      total,
      paymentStatus: payState(total, 0),
      tenantId: req.user.tenantId,
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, data: order });
  } catch (err: any) {
    fail(res, err);
  }
};

export const getOrders = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
    const search = req.query.search as string;
    const status = req.query.status as string;

    const query: any = {};
    if (status && STATUSES.includes(status)) query.status = status;
    if (search) {
      const re = { $regex: esc(search), $options: 'i' };
      query.$or = [{ orderNumber: re }, { patientName: re }, { patientCode: re }];
    }

    const data = await Order.find(query)
      .select('orderNumber patientName patientCode status paymentStatus total paid createdAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    const total = await Order.countDocuments(query);
    res.json({ success: true, data, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getOrder = async (req: AuthRequest, res: Response) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('patient', 'patientCode name phone gender dateOfBirth')
      .populate('verifiedBy', 'name');
    if (!order) return notFound(res);
    res.json({ success: true, data: order });
  } catch (err) {
    notFound(res);
  }
};

export const collectSample = async (req: AuthRequest, res: Response) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return notFound(res);
    if (order.status !== 'ORDERED') return res.status(400).json({ success: false, message: 'Sample already collected' });
    order.sample = {
      barcode: `SMP-${order.orderNumber.slice(4)}`,
      collectedAt: new Date(),
      collectedBy: req.user._id,
    };
    order.status = 'SAMPLE_COLLECTED';
    await order.save();
    res.json({ success: true, data: order });
  } catch (err: any) {
    fail(res, err);
  }
};

export const enterResults = async (req: AuthRequest, res: Response) => {
  try {
    const data = resultsSchema.parse(req.body);
    const order = await Order.findById(req.params.id);
    if (!order) return notFound(res);
    if (!['SAMPLE_COLLECTED', 'RESULTS_ENTERED'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Results cannot be entered at this stage' });
    }
    for (const r of data.results) {
      const item = order.items.id(r.itemId);
      if (!item) return res.status(400).json({ success: false, message: 'Invalid test item' });
      item.result = r.result.trim();
      item.flag = getFlag(item.result, item);
      item.enteredBy = req.user._id;
      item.enteredAt = new Date();
    }
    order.status = order.items.every((i: any) => i.result !== '') ? 'RESULTS_ENTERED' : 'SAMPLE_COLLECTED';
    await order.save();
    res.json({ success: true, data: order });
  } catch (err: any) {
    fail(res, err);
  }
};

export const verifyOrder = async (req: AuthRequest, res: Response) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return notFound(res);
    if (order.status !== 'RESULTS_ENTERED') {
      return res.status(400).json({ success: false, message: 'All results must be entered before verification' });
    }
    order.status = 'VERIFIED';
    order.verifiedBy = req.user._id;
    order.verifiedAt = new Date();
    await order.save();
    res.json({ success: true, data: order });
  } catch (err: any) {
    fail(res, err);
  }
};

export const addPayment = async (req: AuthRequest, res: Response) => {
  try {
    const data = paymentSchema.parse(req.body);
    const order = await Order.findById(req.params.id);
    if (!order) return notFound(res);
    if (data.amount > order.total - order.paid + 0.001) {
      return res.status(400).json({ success: false, message: 'Amount exceeds balance due' });
    }
    order.payments.push({ amount: data.amount, method: data.method, paidAt: new Date(), receivedBy: req.user._id });
    order.paid = order.paid + data.amount;
    order.paymentStatus = payState(order.total, order.paid);
    await order.save();
    res.json({ success: true, data: order });
  } catch (err: any) {
    fail(res, err);
  }
};