import { Router } from 'express';
import { getAvailableSlots, bookAppointment, getAppointments, updateAppointment, getAppointmentById } from './appointment.controller';
import { validate } from '../../middlewares/validate.middleware';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { getAvailableSlotsSchema, bookAppointmentSchema, updateAppointmentSchema } from './appointment.validator';
import { Role } from '../users/user.model';

const router = Router();

// GET /api/v1/appointments
// Accessible by Receptionists, Super Admins, and Doctors
router.get(
  '/',
  authenticate,
  authorize([Role.RECEPTIONIST, Role.SUPER_ADMIN, Role.DOCTOR]),
  getAppointments
);

// PATCH /api/v1/appointments/:id
router.patch(
  '/:id',
  authenticate,
  authorize([Role.RECEPTIONIST, Role.SUPER_ADMIN, Role.DOCTOR]),
  validate(updateAppointmentSchema),
  updateAppointment
);

// GET /api/v1/appointments/:id
router.get(
  '/:id',
  authenticate,
  authorize([Role.RECEPTIONIST, Role.SUPER_ADMIN, Role.DOCTOR]),
  getAppointmentById
);

// GET /api/v1/appointments/doctors/:doctorId/slots?date=YYYY-MM-DD
// Accessible by Receptionists and Super Admins
router.get(
  '/doctors/:doctorId/slots',
  authenticate,
  authorize([Role.RECEPTIONIST, Role.SUPER_ADMIN]),
  validate(getAvailableSlotsSchema),
  getAvailableSlots
);

// POST /api/v1/appointments
// Accessible by Receptionists and Super Admins
router.post(
  '/',
  authenticate,
  authorize([Role.RECEPTIONIST, Role.SUPER_ADMIN]),
  validate(bookAppointmentSchema),
  bookAppointment
);

export default router;
