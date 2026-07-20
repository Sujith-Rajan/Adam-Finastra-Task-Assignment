import { Router } from 'express';
import { searchPatients, createPatient, getPatients, getPatientById, updatePatient, deletePatient } from './patient.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createPatientSchema, updatePatientSchema } from './patient.validator';
import { Role } from '../users/user.model';

const router = Router();

// GET /api/v1/patients/search?q=123
// Accessible by Receptionists, Super Admins, and Doctors
router.get(
  '/search',
  authenticate,
  authorize([Role.RECEPTIONIST, Role.SUPER_ADMIN, Role.DOCTOR]),
  searchPatients
);

// GET /api/v1/patients
router.get(
  '/',
  authenticate,
  authorize([Role.RECEPTIONIST, Role.SUPER_ADMIN, Role.DOCTOR]),
  getPatients
);

// GET /api/v1/patients/:id
router.get(
  '/:id',
  authenticate,
  authorize([Role.RECEPTIONIST, Role.SUPER_ADMIN, Role.DOCTOR]),
  getPatientById
);

// POST /api/v1/patients
router.post(
  '/',
  authenticate,
  authorize([Role.RECEPTIONIST, Role.SUPER_ADMIN]),
  validate(createPatientSchema),
  createPatient
);

// PATCH /api/v1/patients/:id
router.patch(
  '/:id',
  authenticate,
  authorize([Role.RECEPTIONIST, Role.SUPER_ADMIN]),
  validate(updatePatientSchema),
  updatePatient
);

// DELETE /api/v1/patients/:id
router.delete(
  '/:id',
  authenticate,
  authorize([Role.SUPER_ADMIN]),
  deletePatient
);

export default router;
