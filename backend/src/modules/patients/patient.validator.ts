import { z } from 'zod';

export const createPatientSchema = z.object({
  body: z.object({
    firstName: z.string().min(2, 'First name is required').trim(),
    lastName: z.string().min(2, 'Last name is required').trim(),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
    phoneNumber: z.string().min(10, 'Valid phone number is required').trim(),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'DOB must be in YYYY-MM-DD format'),
    bloodGroup: z.string().optional(),
    maritalStatus: z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED']).optional(),
    emergencyContact: z.object({
      name: z.string().optional(),
      relationship: z.string().optional(),
      phoneNumber: z.string().optional()
    }).optional(),
    address: z.object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      pinCode: z.string().optional()
    }).optional(),
    allergies: z.array(z.string()).optional(),
    medicalHistory: z.array(z.string()).optional()
  })
});

export const updatePatientSchema = z.object({
  body: z.object({
    firstName: z.string().min(2).trim().optional(),
    lastName: z.string().min(2).trim().optional(),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
    phoneNumber: z.string().min(10).trim().optional(),
    email: z.string().email().optional().or(z.literal('')),
    dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    bloodGroup: z.string().optional(),
    maritalStatus: z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED']).optional(),
    emergencyContact: z.object({
      name: z.string().optional(),
      relationship: z.string().optional(),
      phoneNumber: z.string().optional()
    }).optional(),
    address: z.object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      pinCode: z.string().optional()
    }).optional(),
    allergies: z.array(z.string()).optional(),
    medicalHistory: z.array(z.string()).optional()
  })
});
