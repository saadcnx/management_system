import { Router } from 'express';
import { createLab, getLabs, updateLab } from './lab.controller';
import { protect } from '../../middleware/auth';
import { restrictTo } from '../../middleware/role';

const router = Router();

router.use(protect, restrictTo('SUPER_ADMIN'));

router.route('/')
  .post(createLab)
  .get(getLabs);

router.route('/:id')
  .patch(updateLab);

export default router;