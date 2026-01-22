import { z } from 'zod';

// Enums
export const priorityEnum = z.enum(['high', 'medium', 'low']);
export const statusEnum = z.enum(['todo', 'doing', 'done']);

// Request schemas
export const createActionItemSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  description: z.string().optional().nullable(),
  priority: priorityEnum.default('medium'),
  status: statusEnum.default('todo'),
  due_date: z.string().datetime().optional().nullable(),
  meeting_note_id: z.string().uuid().optional().nullable(),
});

export const bulkCreateActionItemsSchema = z.object({
  meeting_note_id: z.string().uuid(),
  items: z.array(
    z.object({
      title: z.string().min(1, 'Title is required').max(500),
      description: z.string().optional().nullable(),
      priority: priorityEnum.default('medium'),
      status: statusEnum.default('todo'),
      due_date: z.string().datetime().optional().nullable(),
    })
  ).min(1, 'At least one item is required'),
});

export const updateActionItemSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().optional().nullable(),
  priority: priorityEnum.optional(),
  status: statusEnum.optional(),
  due_date: z.string().datetime().optional().nullable(),
});

export const updateStatusSchema = z.object({
  status: statusEnum,
});

export const updatePositionSchema = z.object({
  position: z.number().int().min(0),
});

export const listQuerySchema = z.object({
  status: statusEnum.optional(),
  grouped: z.coerce.boolean().default(true),
});

export const idParamSchema = z.object({
  id: z.string().uuid(),
});

// Response schemas
export const actionItemResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  priority: priorityEnum,
  status: statusEnum,
  due_date: z.string().nullable(),
  position: z.number(),
  meeting_note_id: z.string().uuid().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const meetingNoteInfoSchema = z.object({
  id: z.string().uuid(),
  title: z.string().nullable(),
});

export const actionItemWithSourceSchema = actionItemResponseSchema.extend({
  meeting_note: meetingNoteInfoSchema.nullable(),
});

export const groupedActionItemsSchema = z.object({
  todo: z.array(actionItemResponseSchema),
  doing: z.array(actionItemResponseSchema),
  done: z.array(actionItemResponseSchema),
});

// List response schemas (for different modes)
export const actionItemListResponseSchema = z.object({
  data: z.array(actionItemResponseSchema),
});

export const groupedActionItemsResponseSchema = z.object({
  data: groupedActionItemsSchema,
});

// Combined list response schema for typed routes (accepts either format)
export const listActionItemsResponseSchema = z.object({
  data: z.union([z.array(actionItemResponseSchema), groupedActionItemsSchema]),
});

export const singleActionItemResponseSchema = z.object({
  data: actionItemWithSourceSchema,
});

export const createdActionItemResponseSchema = z.object({
  data: actionItemResponseSchema,
});

export const bulkCreateResponseSchema = z.object({
  data: z.object({
    created_count: z.number(),
    items: z.array(actionItemResponseSchema),
  }),
});

// Inferred types
export type Priority = z.infer<typeof priorityEnum>;
export type Status = z.infer<typeof statusEnum>;
export type CreateActionItemInput = z.infer<typeof createActionItemSchema>;
export type BulkCreateActionItemsInput = z.infer<typeof bulkCreateActionItemsSchema>;
export type UpdateActionItemInput = z.infer<typeof updateActionItemSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type UpdatePositionInput = z.infer<typeof updatePositionSchema>;
export type ListQueryInput = z.infer<typeof listQuerySchema>;
export type ActionItemResponse = z.infer<typeof actionItemResponseSchema>;
export type ActionItemWithSource = z.infer<typeof actionItemWithSourceSchema>;
export type GroupedActionItems = z.infer<typeof groupedActionItemsSchema>;
