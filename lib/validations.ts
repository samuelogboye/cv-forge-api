import { z } from 'zod';

// Auth validation schemas
export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// CV validation schemas
export const createCVSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  content: z.string().min(1, 'Content is required'),
  template: z.enum(['modern', 'classic', 'minimal', 'professional']).default('modern'),
});

export const updateCVSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  template: z.enum(['modern', 'classic', 'minimal', 'professional']).optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
});

// User settings validation schemas
export const updateSettingsSchema = z.object({
  emailNotifications: z.boolean().optional(),
  weeklyDigest: z.boolean().optional(),
  theme: z.enum(['light', 'dark']).optional(),
  language: z.string().min(2).max(5).optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

// AI optimization validation schema
export const optimizeSchema = z.object({
  content: z.string().min(1, 'CV content is required'),
  jobDescription: z.string().min(1, 'Job description is required'),
});

// Import validation schemas
export const parseTextSchema = z.object({
  text: z.string().min(1, 'Text content is required'),
});

export const linkedinSchema = z.object({
  linkedinUrl: z.string().url('Invalid LinkedIn URL').refine(
    url => url.includes('linkedin.com'),
    'Must be a LinkedIn URL'
  ),
});

// Billing validation schema
export const upgradeSchema = z.object({
  planId: z.enum(['free', 'pro', 'enterprise'], {
    errorMap: () => ({ message: 'Invalid plan ID' }),
  }),
});

// Type exports for TypeScript
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateCVInput = z.infer<typeof createCVSchema>;
export type UpdateCVInput = z.infer<typeof updateCVSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type OptimizeInput = z.infer<typeof optimizeSchema>;
export type ParseTextInput = z.infer<typeof parseTextSchema>;
export type LinkedInInput = z.infer<typeof linkedinSchema>;
export type UpgradeInput = z.infer<typeof upgradeSchema>;
