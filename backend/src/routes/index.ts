import { Router } from 'express';
import authRoutes from '../modules/auth/auth.route';
import adminRoutes from '../modules/admin/admin.route';
import appointmentRoutes from '../modules/appointments/appointment.route';
import systemRoutes from '../modules/system/system.route';
import patientRoutes from '../modules/patients/patient.route';
import activityLogRoutes from '../modules/activity-logs/activity-log.route';

const router = Router();

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/system', systemRoutes);
router.use('/patients', patientRoutes);
router.use('/activity-logs', activityLogRoutes);

export default router;
