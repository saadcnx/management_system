import { Router } from 'express';
import { login, logout, refresh, getMe } from './auth.controller';
import { protect } from '../../middleware/auth';
import { authLimiter } from '../../middleware/rateLimiter';

const router = Router();

router.post('/login', authLimiter, login);
router.post('/logout', logout);
router.post('/refresh', refresh);
router.get('/me', protect, getMe);

export default router;