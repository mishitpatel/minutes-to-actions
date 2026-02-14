import { z } from 'zod';

export const noteEditorSchema = z.object({
  title: z.string().max(255).default(''),
  body: z.string().min(1, 'Meeting notes content is required'),
});

export type NoteEditorFormData = z.infer<typeof noteEditorSchema>;

export const actionItemFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().default(''),
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
  status: z.enum(['todo', 'doing', 'done']).default('todo'),
  dueDate: z.string().default(''),
});

export type ActionItemFormData = z.infer<typeof actionItemFormSchema>;
