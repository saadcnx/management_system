import { User } from '../models/User';
import { Lab } from '../models/Lab';
import { signAccessToken } from '../utils/jwt';

export const createSuperAdmin = async () => {
  return User.create({
    name: 'Super Admin',
    email: 'super@test.com',
    password: 'password123',
    role: 'SUPER_ADMIN',
    tenantId: null,
  });
};

export const createLabWithAdmin = async (suffix = '') => {
  const lab = await Lab.create({
    name: `Lab ${suffix}`,
    contactEmail: `lab${suffix}@test.com`,
    contactPhone: '1234567890',
  });
  const admin = await User.create({
    name: `Admin ${suffix}`,
    email: `admin${suffix}@test.com`,
    password: 'password123',
    role: 'LAB_ADMIN',
    tenantId: lab._id,
  });
  return { lab, admin };
};

export const authCookie = (userId: string) => `accessToken=${signAccessToken(userId)}`;