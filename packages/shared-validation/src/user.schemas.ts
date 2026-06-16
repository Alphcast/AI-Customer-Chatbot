import { z } from 'zod';
import { UserRole } from '@shared/types';

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().optional(),
  avatarUrl: z.string().url().optional().nullable(),
  preferences: z.object({
    theme: z.enum(['light', 'dark', 'system']).optional(),
    language: z.string().optional(),
    timezone: z.string().optional(),
    notificationsEnabled: z.boolean().optional(),
    emailNotifications: z.boolean().optional(),
    pushNotifications: z.boolean().optional(),
    smsNotifications: z.boolean().optional(),
    soundEnabled: z.boolean().optional(),
  }).optional(),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  role: z.nativeEnum(UserRole),
  phone: z.string().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
