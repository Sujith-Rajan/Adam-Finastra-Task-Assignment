import { Router } from 'express';
import { login, signupSuperAdmin, refreshToken, logout } from './auth.controller';
import { validate } from '../../middlewares/validate.middleware';
import { loginSchema, signupSchema, refreshTokenSchema } from './auth.validator';

const router = Router();

router.post('/signup-super-admin', validate(signupSchema), signupSuperAdmin);
router.post('/login', validate(loginSchema), login);
router.post('/refresh-token', validate(refreshTokenSchema), refreshToken);
router.post('/logout', logout);

export default router;
