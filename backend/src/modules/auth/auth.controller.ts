import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../../models/User';
import { RefreshToken } from '../../models/RefreshToken';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { AuthRequest } from '../../middleware/auth';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid credentials or inactive account' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const accessToken = signAccessToken(user._id.toString());
    const refreshToken = signRefreshToken(user._id.toString());

    await RefreshToken.create({
      token: refreshToken,
      user: user._id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    res.cookie('accessToken', accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.json({
      success: true,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.cookies;
    if (refreshToken) {
      await RefreshToken.deleteOne({ token: refreshToken });
    }
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Logged out' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'No refresh token' });
    }

    const decoded = verifyRefreshToken(refreshToken);
    const storedToken = await RefreshToken.findOne({ token: refreshToken, user: decoded.id });

    if (!storedToken) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    await RefreshToken.deleteOne({ _id: storedToken._id });

    const newAccessToken = signAccessToken(decoded.id);
    const newRefreshToken = signRefreshToken(decoded.id);

    await RefreshToken.create({
      token: newRefreshToken,
      user: decoded.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    res.cookie('accessToken', newAccessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', newRefreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.json({ success: true });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  res.json({ success: true, user: req.user });
};