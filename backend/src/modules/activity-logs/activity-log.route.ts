import { Router } from 'express';
import { getActivityLogs } from './activity-log.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { Role } from '../users/user.model';

const router = Router();

// Only Super Admin can view activity logs
router.get(
  '/', 
  authenticate, 
  authorize([Role.SUPER_ADMIN]), 
  getActivityLogs
);

export default router;
