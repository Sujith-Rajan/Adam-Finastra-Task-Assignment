import { z } from 'zod';

// Regex for HH:mm format
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const getAvailableSlotsSchema = z.object({
  params: z.object({
    doctorId: z.string().min(1, 'Doctor ID is required'),
  }),
  query: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  }),
});

export const bookAppointmentSchema = z.object({
  body: z.object({
    doctorId: z.string().min(1, 'Doctor ID is required'),
    appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    slotStartTime: z.string().regex(timeRegex, 'Start time must be in HH:mm format'),
    
    // If patientId is present, we don't strictly need these, but we can make them optional
    patientId: z.string().optional(),
    
    // Patient details
    firstName: z.string().min(2, 'First name is required').optional(),
    lastName: z.string().min(2, 'Last name is required').optional(),
    phoneNumber: z.string().min(10, 'Valid phone number is required').optional(),
    dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'DOB must be in YYYY-MM-DD format').optional(),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
    
    // Optional Patient details
    email: z.string().email().optional(),
    bloodGroup: z.string().optional(),
    maritalStatus: z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED']).optional(),
    allergies: z.array(z.string()).optional(),
    medicalHistory: z.array(z.string()).optional(),
    
    emergencyContact: z.object({
      name: z.string(),
      relationship: z.string(),
      phoneNumber: z.string()
    }).optional(),

    address: z.object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      pinCode: z.string().optional()
    }).optional()
  }),
});

export const updateAppointmentSchema = z.object({
  body: z.object({
    status: z.enum(['SCHEDULED', 'ARRIVED', 'COMPLETED', 'CANCELLED']).optional(),
    purpose: z.string().optional(),
    notes: z.string().optional(),
    prescription: z.object({
      otherAdvices: z.string().optional(),
      medications: z.array(z.object({
        name: z.string(),
        dosage: z.string(),
        frequency: z.string()
      })).optional(),
      investigations: z.string().optional()
    }).optional()
  })
});
