import { z } from 'zod';

// Google OAuth schemas
export const googleUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  picture: z.string().url().optional(),
});

export const googleTokenSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  expires_in: z.number().optional(),
  refresh_token: z.string().optional(),
  scope: z.string().optional(),
});

// Request schemas
export const callbackQuerySchema = z.object({
  code: z.string(),
  state: z.string().optional(),
});

// Response schemas
export const userResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  avatar_url: z.string().nullable(),
  created_at: z.string(),
});

export const meResponseSchema = z.object({
  data: userResponseSchema,
});

// Test login schemas (development/test only)
export const testLoginBodySchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
});

export const testLoginResponseSchema = z.object({
  data: userResponseSchema,
});

// Inferred types
export type GoogleUser = z.infer<typeof googleUserSchema>;
export type GoogleToken = z.infer<typeof googleTokenSchema>;
export type CallbackQuery = z.infer<typeof callbackQuerySchema>;
export type UserResponse = z.infer<typeof userResponseSchema>;
export type TestLoginBody = z.infer<typeof testLoginBodySchema>;
