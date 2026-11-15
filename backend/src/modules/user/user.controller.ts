import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { User } from '../../models/User';
import { z } from 'zod';

const createStaffSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['DOCTOR', 'RECEPTIONIST']),
});

export const createStaff = async (req: AuthRequest, res: Response) => {
  try {
    const data = createStaffSchema.parse(req.body);
    const existing = await User.findOne({ email: data.email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already exists' });
    const staff = await User.create({
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role,
      tenantId: req.user.tenantId,
    });
    res.status(201).json({
      success: true,
      data: { id: staff._id, name: staff.name, email: staff.email, role: staff.role, isActive: staff.isActive },
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getStaff = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const role = req.query.role as string;

    const query: any = { role: { $in: ['DOCTOR', 'RECEPTIONIST'] } };
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    if (role && ['DOCTOR', 'RECEPTIONIST'].includes(role)) query.role = role;

    const data = await User.find(query)
      .select('-password')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });
    const total = await User.countDocuments(query);
    res.json({ success: true, data, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateStaff = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;
    const staff = await User.findOneAndUpdate(
      { _id: id, role: { $in: ['DOCTOR', 'RECEPTIONIST'] } },
      { name, email },
      { new: true, runValidators: true }
    ).select('-password');
    if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });
    res.json({ success: true, data: staff });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const resetPassword = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }
    const staff = await User.findOne({ _id: id, role: { $in: ['DOCTOR', 'RECEPTIONIST'] } });
    if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });
    staff.password = password;
    await staff.save();
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const toggleActive = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const staff = await User.findOne({ _id: id, role: { $in: ['DOCTOR', 'RECEPTIONIST'] } });
    if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });
    staff.isActive = !staff.isActive;
    await staff.save();
    res.json({ success: true, data: { isActive: staff.isActive } });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};