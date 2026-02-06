import { z } from 'zod';
import { paginationSchema } from '../../schemas/index.js';

// Request schemas
export const createMeetingNoteSchema = z.object({
  title: z.string().max(500).optional(),
  body: z.string().min(1, 'Body is required'),
});

export const updateMeetingNoteSchema = z.object({
  title: z.string().max(500).optional().nullable(),
  body: z.string().min(1).optional(),
});

export const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const idParamSchema = z.object({
  id: z.string().uuid(),
});

// Response schemas
export const meetingNoteResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string().nullable(),
  body: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const actionItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  assignee: z.string().nullable(),
  due_date: z.string().nullable(),
  status: z.enum(['todo', 'in_progress', 'done']),
});

export const meetingNoteWithActionsSchema = meetingNoteResponseSchema.extend({
  action_items: z.array(actionItemSchema),
});

export const meetingNoteListResponseSchema = z.object({
  data: z.array(meetingNoteResponseSchema),
  pagination: paginationSchema,
});

export const singleMeetingNoteResponseSchema = z.object({
  data: meetingNoteWithActionsSchema,
});

export const createdMeetingNoteResponseSchema = z.object({
  data: meetingNoteResponseSchema,
});

// Extraction response schemas
export const extractedItemSchema = z.object({
  title: z.string(),
  priority: z.enum(['high', 'medium', 'low']),
  due_date: z.string().nullable(),
  description: z.string().nullable(),
});

export const extractionResultSchema = z.object({
  data: z.object({
    action_items: z.array(extractedItemSchema),
    confidence: z.enum(['high', 'medium', 'low']),
    message: z.string().nullable(),
  }),
});

// Inferred types
export type CreateMeetingNoteInput = z.infer<typeof createMeetingNoteSchema>;
export type UpdateMeetingNoteInput = z.infer<typeof updateMeetingNoteSchema>;
export type ListQueryInput = z.infer<typeof listQuerySchema>;
export type MeetingNoteResponse = z.infer<typeof meetingNoteResponseSchema>;
export type MeetingNoteWithActions = z.infer<typeof meetingNoteWithActionsSchema>;
export type ExtractionResult = z.infer<typeof extractionResultSchema>;
