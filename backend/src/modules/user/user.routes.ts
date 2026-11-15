import { Router } from 'express';
import { createStaff, getStaff, updateStaff, resetPassword, toggleActive } from './user.controller';
import { protect } from '../../middleware/auth';
import { restrictTo } from '../../middleware/role';

const router = Router();

router.use(protect, restrictTo('LAB_ADMIN'));

router.route('/staff')
  .post(createStaff)
  .get(getStaff);

router.route('/staff/:id')
  .patch(updateStaff);

router.post('/staff/:id/reset-password', resetPassword);
router.patch('/staff/:id/toggle-active', toggleActive);

export default router;