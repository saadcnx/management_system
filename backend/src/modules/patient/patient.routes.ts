import { Router } from 'express';
import { createPatient, getPatients, getPatient, updatePatient, deactivatePatient } from './patient.controller';
import { protect } from '../../middleware/auth';
import { restrictTo } from '../../middleware/role';

const router = Router();

router.use(protect, restrictTo('LAB_ADMIN', 'DOCTOR', 'RECEPTIONIST'));

router.route('/')
  .post(restrictTo('LAB_ADMIN', 'RECEPTIONIST'), createPatient)
  .get(getPatients);

router.route('/:id')
  .get(getPatient)
  .patch(restrictTo('LAB_ADMIN', 'RECEPTIONIST'), updatePatient);

router.patch('/:id/deactivate', restrictTo('LAB_ADMIN'), deactivatePatient);

export default router;