import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { Role } from '../users/user.model';
import { createSystemItemSchema, updateSystemItemSchema } from './system.validator';
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getSpecializations,
  createSpecialization,
  updateSpecialization,
  deleteSpecialization
} from './system.controller';

const router = Router();

// Publicly readable endpoints (or at least accessible to authenticated users like Receptionists and Doctors)
router.use(authenticate);

router.get('/departments', getDepartments);
router.get('/specializations', getSpecializations);

// Protect CRUD operations with SUPER_ADMIN
const requireAdmin = authorize([Role.SUPER_ADMIN]);

// Department CRUD
router.post('/departments', requireAdmin, validate(createSystemItemSchema), createDepartment);
router.put('/departments/:id', requireAdmin, validate(updateSystemItemSchema), updateDepartment);
router.delete('/departments/:id', requireAdmin, deleteDepartment);

// Specialization CRUD
router.post('/specializations', requireAdmin, validate(createSystemItemSchema), createSpecialization);
router.put('/specializations/:id', requireAdmin, validate(updateSystemItemSchema), updateSpecialization);
router.delete('/specializations/:id', requireAdmin, deleteSpecialization);

export default router;
