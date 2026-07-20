import { z } from 'zod';
import { Role } from '../users/user.model';

export const passwordValidation = z
  .string({ message: 'Password is required' })
  .min(6, 'Password must be at least 6 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const loginSchema = z.object({
  body: z.object({
    email: z.string({ message: 'Email is required' }).email('Invalid email format'),
    password: passwordValidation,
  }),
});

export const signupSchema = z.object({
  body: z.object({
    firstName: z.string({ message: 'First name is required' }).min(2, 'First name must be at least 2 characters'),
    lastName: z.string({ message: 'Last name is required' }).min(2, 'Last name must be at least 2 characters'),
    email: z.string({ message: 'Email is required' }).email('Invalid email format'),
    password: passwordValidation,
    role: z.nativeEnum(Role).optional(),
  }),
});

export const refreshTokenSchema = z.object({
  cookies: z.object({
    refreshToken: z.string({ message: 'Refresh token is required in cookies' }),
  }),
});
