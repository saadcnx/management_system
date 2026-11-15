import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';
import { User } from '../../models/User';
import { Lab } from '../../models/Lab';
import { RefreshToken } from '../../models/RefreshToken';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { AuthRequest } from '../../middleware/auth';

const WEEK = 7 * 24 * 60 * 60 * 1000;

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const cookieOptions = () => ({
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.COOKIE_SECURE === 'true',
  path: '/',
});

const hash = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

const publicUser = (u: any) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  tenantId: u.tenantId,
});

const clearCookies = (res: Response) => {
  res.clearCookie('accessToken', cookieOptions());
  res.clearCookie('refreshToken', cookieOptions());
};

const issueTokens = async (res: Response, userId: string) => {
  const refreshToken = signRefreshToken(userId);
  await RefreshToken.create({
    token: hash(refreshToken),
    user: userId,
    expiresAt: new Date(Date.now() + WEEK),
  });
  res.cookie('accessToken', signAccessToken(userId), { ...cookieOptions(), maxAge: WEEK });
  res.cookie('refreshToken', refreshToken, { ...cookieOptions(), maxAge: WEEK });
};

const canSignIn = async (user: any) => {
  if (!user || !user.isActive) return false;
  if (!user.tenantId) return true;
  const lab = await Lab.findById(user.tenantId);
  return !!lab && lab.isActive;
};

export const login = async (req: Request, res: Response) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }
    const { email, password } = parsed.data;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password)) || !(await canSignIn(user))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    await issueTokens(res, String(user._id));
    res.json({ success: true, user: publicUser(user) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) throw new Error('missing');
    const decoded = verifyRefreshToken(token);
    const stored = await RefreshToken.findOneAndDelete({ token: hash(token) });
    if (!stored) {
      await RefreshToken.deleteMany({ user: decoded.id });
      throw new Error('reuse');
    }
    const user = await User.findById(decoded.id);
    if (!(await canSignIn(user))) throw new Error('inactive');
    await issueTokens(res, String(user!._id));
    res.json({ success: true });
  } catch (error) {
    clearCookies(res);
    res.status(401).json({ success: false, message: 'Not authorized' });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.refreshToken;
    if (token) await RefreshToken.deleteOne({ token: hash(token) });
  } catch (error) {
    // ignore, cookies are cleared below
  }
  clearCookies(res);
  res.json({ success: true });
};

export const getMe = async (req: AuthRequest, res: Response) => {
  res.json({ success: true, user: publicUser(req.user) });
};