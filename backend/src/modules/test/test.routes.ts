import { Router } from 'express';
import { createTest, getTests, updateTest } from './test.controller';
import { protect } from '../../middleware/auth';
import { restrictTo } from '../../middleware/role';

const router = Router();

router.use(protect, restrictTo('LAB_ADMIN', 'DOCTOR', 'RECEPTIONIST'));

router.route('/')
  .get(getTests)
  .post(restrictTo('LAB_ADMIN'), createTest);

router.patch('/:id', restrictTo('LAB_ADMIN'), updateTest);

export default router;