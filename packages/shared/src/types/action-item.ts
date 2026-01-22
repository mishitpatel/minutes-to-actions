export type ActionItemStatus = 'todo' | 'in_progress' | 'done';

export interface ActionItem {
  id: string;
  meetingNoteId: string;
  title: string;
  description: string | null;
  assignee: string | null;
  dueDate: Date | null;
  status: ActionItemStatus;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateActionItemInput {
  meetingNoteId: string;
  title: string;
  description?: string;
  assignee?: string;
  dueDate?: Date;
  status?: ActionItemStatus;
}

export interface UpdateActionItemInput {
  title?: string;
  description?: string | null;
  assignee?: string | null;
  dueDate?: Date | null;
  status?: ActionItemStatus;
  order?: number;
}
