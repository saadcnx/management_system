import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { User } from '../../models/User';
import { Lab } from '../../models/Lab';
import { Patient } from '../../models/Patient';

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  LAB_ADMIN: 'Lab Admin',
  DOCTOR: 'Doctor',
  RECEPTIONIST: 'Receptionist',
};

const GENDER_LABELS: Record<string, string> = { MALE: 'Male', FEMALE: 'Female', OTHER: 'Other' };

export const getStats = async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user.role;
    const tenantId = req.user.tenantId;

    if (role === 'SUPER_ADMIN') {
      const [totalLabs, activeLabs, totalUsers] = await Promise.all([
        Lab.countDocuments(),
        Lab.countDocuments({ isActive: true }),
        User.countDocuments(),
      ]);

      const months: Date[] = [];
      for (let i = 5; i >= 0; i--) {
        const now = new Date();
        const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
        months.push(d);
      }
      const rawLabs = await Lab.aggregate([
        { $match: { createdAt: { $gte: months[0] } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
      ]);
      const labsMap = new Map<string, number>(rawLabs.map((r: any) => [r._id, r.count]));
      const labsChart = months.map((d) => ({
        label: d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }),
        value: labsMap.get(d.toISOString().slice(0, 7)) || 0,
      }));

      const usersByRole = await User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]);
      const roleBreakdown = usersByRole.map((r: any) => ({
        label: ROLE_LABELS[r._id] || r._id,
        value: r.count,
      }));

      return res.json({
        success: true,
        data: {
          stats: [
            { label: 'Total labs', value: totalLabs },
            { label: 'Active labs', value: activeLabs },
            { label: 'Total users', value: totalUsers },
          ],
          barChart: { title: 'Labs created (last 6 months)', data: labsChart },
          breakdown: { title: 'Users by role', data: roleBreakdown },
          recentPatients: null,
        },
      });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    let stats: { label: string; value: number }[] = [];
    if (role === 'LAB_ADMIN') {
      const [totalPatients, patientsToday, totalStaff] = await Promise.all([
        Patient.countDocuments(),
        Patient.countDocuments({ createdAt: { $gte: todayStart } }),
        User.countDocuments({ role: { $in: ['DOCTOR', 'RECEPTIONIST'] } }),
      ]);
      stats = [
        { label: 'Total patients', value: totalPatients },
        { label: 'Patients today', value: patientsToday },
        { label: 'Total staff', value: totalStaff },
      ];
    } else if (role === 'DOCTOR') {
      const [totalPatients, patientsToday] = await Promise.all([
        Patient.countDocuments({ isActive: true }),
        Patient.countDocuments({ createdAt: { $gte: todayStart }, isActive: true }),
      ]);
      stats = [
        { label: 'Total patients', value: totalPatients },
        { label: 'Patients today', value: patientsToday },
      ];
    } else {
      const [registeredByMeToday, totalPatients] = await Promise.all([
        Patient.countDocuments({ registeredBy: req.user._id, createdAt: { $gte: todayStart } }),
        Patient.countDocuments(),
      ]);
      stats = [
        { label: 'Registered by me today', value: registeredByMeToday },
        { label: 'Total patients', value: totalPatients },
      ];
    }

    const days: Date[] = [];
    for (let i = 6; i >= 0; i--) {
      const now = new Date();
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
      days.push(d);
    }
    const rawRegs = await Patient.aggregate([
      { $match: { tenantId, createdAt: { $gte: days[0] } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
    ]);
    const regsMap = new Map<string, number>(rawRegs.map((r: any) => [r._id, r.count]));
    const regsData = days.map((d) => ({
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
      value: regsMap.get(d.toISOString().slice(0, 10)) || 0,
    }));

    let breakdown: { title: string; data: { label: string; value: number }[] } | null = null;
    if (role === 'LAB_ADMIN' || role === 'DOCTOR') {
      const rawGender = await Patient.aggregate([
        { $match: { tenantId, isActive: true } },
        { $group: { _id: '$gender', count: { $sum: 1 } } },
      ]);
      breakdown = {
        title: 'Gender breakdown',
        data: rawGender.map((r: any) => ({ label: GENDER_LABELS[r._id] || r._id, value: r.count })),
      };
    }

    const recentPatients = await Patient.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('registeredBy', 'name')
      .lean();

    return res.json({
      success: true,
      data: {
        stats,
        barChart: { title: 'Registrations (last 7 days)', data: regsData },
        breakdown,
        recentPatients,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};