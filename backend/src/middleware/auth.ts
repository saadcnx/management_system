import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { User } from '../models/User';
import { tenantContext } from '../utils/asyncLocalStorage';

export interface AuthRequest extends Request {
  user?: any;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.accessToken;
    if (!token) return res.status(401).json({ success: false, message: 'Not authorized' });

    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id);
    
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    req.user = user;
    tenantContext.run({ tenantId: user.tenantId ? user.tenantId.toString() : null }, () => {
      next();
    });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Not authorized' });
  }
};