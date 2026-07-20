import { z } from 'zod';

export const createSystemItemSchema = z.object({
  body: z.object({
    name: z.string({ message: 'Name is required' }).min(2, 'Name must be at least 2 characters'),
  }),
});

export const updateSystemItemSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string({ message: 'ID is required' }),
  }),
});
