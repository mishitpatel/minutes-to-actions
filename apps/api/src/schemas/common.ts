import { z } from 'zod';

// Error response schema for application errors (401, 404, etc.)
export const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

// Validation error schema for Fastify/Zod validation errors (400)
export const validationErrorSchema = z.object({
  statusCode: z.number(),
  error: z.string(),
  message: z.string(),
});

// Pagination metadata schema
export const paginationSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total_items: z.number(),
  total_pages: z.number(),
  has_next_page: z.boolean(),
  has_prev_page: z.boolean(),
});

// UUID parameter schema
export const uuidParamSchema = z.object({
  id: z.string().uuid(),
});

// Inferred types
export type ErrorResponse = z.infer<typeof errorResponseSchema>;
export type Pagination = z.infer<typeof paginationSchema>;
