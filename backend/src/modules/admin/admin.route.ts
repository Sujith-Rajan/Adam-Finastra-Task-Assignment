import { Router } from 'express';
import { createDoctor, updateDoctor, deleteDoctor, createReceptionist, updateDoctorSchedule, getDoctorSchedule, updateUserPermissions, getDoctors, getReceptionists, updateReceptionist, deleteReceptionist } from './admin.controller';
import { validate } from '../../middlewares/validate.middleware';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { createDoctorSchema, createReceptionistSchema, updateDoctorScheduleSchema, updateUserPermissionsSchema, updateDoctorSchema, deleteDoctorSchema, updateReceptionistSchema, deleteReceptionistSchema } from './admin.validator';
import { Role } from '../users/user.model';

const router = Router();

// Protect all admin routes with authentication
router.use(authenticate);

// Doctors and Receptionists can also view the doctor list
router.get('/doctors', authorize([Role.SUPER_ADMIN, Role.DOCTOR, Role.RECEPTIONIST]), getDoctors);

// Other admin routes are strictly SUPER_ADMIN
router.post('/doctors', authorize([Role.SUPER_ADMIN]), validate(createDoctorSchema), createDoctor);
router.put('/doctors/:doctorId', authorize([Role.SUPER_ADMIN]), validate(updateDoctorSchema), updateDoctor);
router.delete('/doctors/:doctorId', authorize([Role.SUPER_ADMIN]), validate(deleteDoctorSchema), deleteDoctor);
router.get('/doctors/:doctorId/schedule', authorize([Role.SUPER_ADMIN]), getDoctorSchedule);
router.put('/doctors/:doctorId/schedule', authorize([Role.SUPER_ADMIN]), validate(updateDoctorScheduleSchema), updateDoctorSchedule);

router.put('/users/:userId/permissions', authorize([Role.SUPER_ADMIN]), validate(updateUserPermissionsSchema), updateUserPermissions);

router.post('/receptionists', authorize([Role.SUPER_ADMIN]), validate(createReceptionistSchema), createReceptionist);
router.get('/receptionists', authorize([Role.SUPER_ADMIN]), getReceptionists);
router.put('/receptionists/:receptionistId', authorize([Role.SUPER_ADMIN]), validate(updateReceptionistSchema), updateReceptionist);
router.delete('/receptionists/:receptionistId', authorize([Role.SUPER_ADMIN]), validate(deleteReceptionistSchema), deleteReceptionist);

export default router;
