import { Request, Response } from 'express';
import { Lab } from '../../models/Lab';
import { User } from '../../models/User';
import { z } from 'zod';

const createLabSchema = z.object({
  labName: z.string().min(1),
  contactEmail: z.string().email(),
  contactPhone: z.string().min(1),
  adminName: z.string().min(1),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(6),
});

export const createLab = async (req: Request, res: Response) => {
  try {
    const data = createLabSchema.parse(req.body);
    
    const existingUser = await User.findOne({ email: data.adminEmail });
    if (existingUser) return res.status(400).json({ success: false, message: 'Email already exists' });

    const lab = await Lab.create({
      name: data.labName,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
    });

    try {
      const admin = await User.create({
        name: data.adminName,
        email: data.adminEmail,
        password: data.adminPassword,
        role: 'LAB_ADMIN',
        tenantId: lab._id,
      });
      res.status(201).json({ success: true, lab, admin: { id: admin._id, email: admin.email } });
    } catch (userError) {
      await Lab.findByIdAndDelete(lab._id);
      throw userError;
    }
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Error creating lab' });
  }
};

export const getLabs = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const status = req.query.status as string;

    const query: any = {};
    if (search) query.name = { $regex: search, $options: 'i' };
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;

    const labs = await Lab.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Lab.countDocuments(query);

    res.json({ success: true, data: labs, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateLab = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, contactEmail, contactPhone, isActive } = req.body;
    
    const lab = await Lab.findByIdAndUpdate(id, { name, contactEmail, contactPhone, isActive }, { new: true });
    if (!lab) return res.status(404).json({ success: false, message: 'Lab not found' });

    res.json({ success: true, lab });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};