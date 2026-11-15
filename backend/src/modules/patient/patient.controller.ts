import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { Patient } from '../../models/Patient';
import { Counter } from '../../models/Counter';
import { z } from 'zod';

const createPatientSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  dateOfBirth: z.coerce.date(),
  address: z.string().optional(),
});

const updatePatientSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  dateOfBirth: z.coerce.date().optional(),
  address: z.string().optional(),
});

export const createPatient = async (req: AuthRequest, res: Response) => {
  try {
    const data = createPatientSchema.parse(req.body);
    const counter = await Counter.findOneAndUpdate(
      { tenantId: req.user.tenantId, name: 'patient' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const patientCode = `PT-${String(counter.seq).padStart(4, '0')}`;
    const patient = await Patient.create({
      ...data,
      patientCode,
      tenantId: req.user.tenantId,
      registeredBy: req.user._id,
    });
    res.status(201).json({ success: true, data: patient });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getPatients = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const gender = req.query.gender as string;
    const sortBy = (req.query.sortBy as string) || 'createdAt';

    const query: any = {};
    if (req.user.role !== 'LAB_ADMIN') {
      query.isActive = true;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }
    if (gender && ['MALE', 'FEMALE', 'OTHER'].includes(gender)) query.gender = gender;

    const allowedSorts: Record<string, string> = { createdAt: 'createdAt', name: 'name' };
    const sortField = allowedSorts[sortBy] || 'createdAt';
    const sort: any = { [sortField]: sortBy === 'name' ? 1 : -1 };

    const data = await Patient.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort(sort);
    const total = await Patient.countDocuments({ ...query, tenantId: req.user.tenantId });
    res.json({ success: true, data, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getPatient = async (req: AuthRequest, res: Response) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
    res.json({ success: true, data: patient });
  } catch (err) {
    res.status(404).json({ success: false, message: 'Patient not found' });
  }
};

export const updatePatient = async (req: AuthRequest, res: Response) => {
  try {
    const data = updatePatientSchema.parse(req.body);
    const patient = await Patient.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
    res.json({ success: true, data: patient });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const deactivatePatient = async (req: AuthRequest, res: Response) => {
  try {
    const patient = await Patient.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Server error' });
  }
};