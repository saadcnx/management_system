import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../../middleware/auth';
import { Test } from '../../models/Test';

const testSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  category: z.string().optional(),
  sampleType: z.string().min(1),
  unit: z.string().optional(),
  price: z.number().min(0),
  refMin: z.number().nullable().optional(),
  refMax: z.number().nullable().optional(),
  refText: z.string().optional(),
  isActive: z.boolean().optional(),
});

const updateSchema = testSchema.partial();

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const fail = (res: Response, err: any) =>
  res.status(400).json({
    success: false,
    message: err.code === 11000 ? 'Test code already exists' : err.message || 'Error',
  });

export const createTest = async (req: AuthRequest, res: Response) => {
  try {
    const data = testSchema.parse(req.body);
    const test = await Test.create({
      ...data,
      code: data.code.trim().toUpperCase(),
      tenantId: req.user.tenantId,
    });
    res.status(201).json({ success: true, data: test });
  } catch (err: any) {
    fail(res, err);
  }
};

export const getTests = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 200);
    const search = req.query.search as string;

    const query: any = {};
    if (req.user.role !== 'LAB_ADMIN' || req.query.active === 'true') query.isActive = true;
    if (search) {
      const re = { $regex: esc(search), $options: 'i' };
      query.$or = [{ name: re }, { code: re }];
    }

    const data = await Test.find(query)
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(limit);
    const total = await Test.countDocuments(query);
    res.json({ success: true, data, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateTest = async (req: AuthRequest, res: Response) => {
  try {
    const data = updateSchema.parse(req.body);
    if (data.code) data.code = data.code.trim().toUpperCase();
    const test = await Test.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    res.json({ success: true, data: test });
  } catch (err: any) {
    fail(res, err);
  }
};