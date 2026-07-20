import { z } from 'zod';
import { passwordValidation } from '../auth/auth.validator';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const schedulesArraySchema = z.array(
  z.object({
    dayOfWeek: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
    slotDuration: z.number().min(5, 'Slot duration must be at least 5 minutes').default(15),
    sessions: z.array(
      z.object({
        startTime: z.string().regex(timeRegex, 'Start time must be HH:mm'),
        endTime: z.string().regex(timeRegex, 'End time must be HH:mm'),
      })
    ).min(1, 'At least one session is required per scheduled day'),
  })
);

export const createDoctorSchema = z.object({
  body: z.object({
    firstName: z.string({ message: 'First name is required' }).min(2, 'First name must be at least 2 characters'),
    lastName: z.string({ message: 'Last name is required' }).min(2, 'Last name must be at least 2 characters'),
    email: z.string({ message: 'Email is required' }).email('Invalid email format'),
    password: passwordValidation,
    specialization: z.string({ message: 'Specialization is required' }).min(2, 'Specialization is required'),
    experienceYears: z.number({ message: 'Experience years is required' }).min(0, 'Experience must be positive'),
    qualifications: z.array(z.string()).min(1, 'At least one qualification is required'),
    department: z.string({ message: 'Department is required' }),
    consultationFee: z.number().optional(),
    mobile: z.string().optional(),
    schedules: schedulesArraySchema.optional(),
  }),
});

export const createReceptionistSchema = z.object({
  body: z.object({
    firstName: z.string({ message: 'First name is required' }).min(2, 'First name must be at least 2 characters'),
    lastName: z.string({ message: 'Last name is required' }).min(2, 'Last name must be at least 2 characters'),
    email: z.string({ message: 'Email is required' }).email('Invalid email format'),
    password: passwordValidation,
    shiftTimings: z.string({ message: 'Shift timings are required' }).min(2, 'Shift timings are required'),
    languagesSpoken: z.array(z.string()).min(1, 'At least one language is required'),
    deskNumber: z.string().optional(),
    emergencyContact: z.string().optional(),
    mobile: z.string().optional(),
  }),
});

export const updateDoctorScheduleSchema = z.object({
  params: z.object({
    doctorId: z.string().min(1, 'Doctor ID is required'),
  }),
  body: z.object({
    schedules: schedulesArraySchema.min(1, 'At least one schedule is required'),
  }),
});

export const updateUserPermissionsSchema = z.object({
  params: z.object({
    userId: z.string().min(1, 'User ID is required'),
  }),
  body: z.object({
    permissions: z.array(z.string()).optional(),
  }),
});

export const updateDoctorSchema = z.object({
  params: z.object({
    doctorId: z.string().min(1, 'Doctor ID is required'),
  }),
  body: z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters').optional(),
    lastName: z.string().min(2, 'Last name must be at least 2 characters').optional(),
    email: z.string().email('Invalid email format').optional(),
    specialization: z.string().min(2, 'Specialization is required').optional(),
    experienceYears: z.number().min(0, 'Experience must be positive').optional(),
    qualifications: z.array(z.string()).min(1, 'At least one qualification is required').optional(),
    department: z.string().optional(),
    consultationFee: z.number().optional(),
    mobile: z.string().optional(),
    isActive: z.boolean().optional(),
  }).refine(data => Object.keys(data).length > 0, {
    message: "At least one field must be provided to update",
  }),
});

export const deleteDoctorSchema = z.object({
  params: z.object({
    doctorId: z.string().min(1, 'Doctor ID is required'),
  }),
});

export const updateReceptionistSchema = z.object({
  params: z.object({
    receptionistId: z.string().min(1, 'Receptionist ID is required'),
  }),
  body: z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters').optional(),
    lastName: z.string().min(2, 'Last name must be at least 2 characters').optional(),
    email: z.string().email('Invalid email format').optional(),
    mobile: z.string().optional(),
    isActive: z.boolean().optional(),
    shiftTimings: z.string().min(2, 'Shift timings are required').optional(),
    languagesSpoken: z.array(z.string()).min(1, 'At least one language is required').optional(),
    deskNumber: z.string().optional(),
    emergencyContact: z.string().optional(),
  }).refine(data => Object.keys(data).length > 0, {
    message: "At least one field must be provided to update",
  }),
});

export const deleteReceptionistSchema = z.object({
  params: z.object({
    receptionistId: z.string().min(1, 'Receptionist ID is required'),
  }),
});

