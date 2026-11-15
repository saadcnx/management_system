import { Router } from 'express';
import { createOrder, getOrders, getOrder, collectSample, enterResults, verifyOrder, addPayment } from './order.controller';
import { protect } from '../../middleware/auth';
import { restrictTo } from '../../middleware/role';

const router = Router();

router.use(protect, restrictTo('LAB_ADMIN', 'DOCTOR', 'RECEPTIONIST'));

router.route('/')
  .get(getOrders)
  .post(restrictTo('LAB_ADMIN', 'RECEPTIONIST'), createOrder);

router.get('/:id', getOrder);
router.patch('/:id/collect', restrictTo('LAB_ADMIN', 'RECEPTIONIST'), collectSample);
router.patch('/:id/results', restrictTo('LAB_ADMIN', 'DOCTOR'), enterResults);
router.patch('/:id/verify', restrictTo('LAB_ADMIN', 'DOCTOR'), verifyOrder);
router.post('/:id/payments', restrictTo('LAB_ADMIN', 'RECEPTIONIST'), addPayment);

export default router;