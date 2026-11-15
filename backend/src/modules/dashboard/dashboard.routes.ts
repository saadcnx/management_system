import { Router } from 'express';
import { getStats } from './dashboard.controller';
import { protect } from '../../middleware/auth';

const router = Router();

router.use(protect);

router.get('/stats', getStats);

export default router;