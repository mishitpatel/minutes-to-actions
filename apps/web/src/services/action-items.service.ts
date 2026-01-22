import { api } from './api';

// Types (matching API schemas)
export type Priority = 'high' | 'medium' | 'low';
export type Status = 'todo' | 'doing' | 'done';

export interface ActionItem {
  id: string;
  title: string;
  description: string | null;
  priority: Priority;
  status: Status;
  due_date: string | null;
  position: number;
  meeting_note_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface MeetingNoteInfo {
  id: string;
  title: string | null;
}

export interface ActionItemWithSource extends ActionItem {
  meeting_note: MeetingNoteInfo | null;
}

export interface GroupedActionItems {
  todo: ActionItem[];
  doing: ActionItem[];
  done: ActionItem[];
}

export interface CreateActionItemData {
  title: string;
  description?: string | null;
  priority?: Priority;
  status?: Status;
  due_date?: string | null;
  meeting_note_id?: string | null;
}

export interface UpdateActionItemData {
  title?: string;
  description?: string | null;
  priority?: Priority;
  status?: Status;
  due_date?: string | null;
}

interface GroupedResponse {
  data: GroupedActionItems;
}

interface SingleResponse {
  data: ActionItemWithSource;
}

interface CreatedResponse {
  data: ActionItem;
}

export const actionItemsService = {
  async listGrouped(): Promise<GroupedActionItems> {
    const response = await api.get<GroupedResponse>('/action-items?grouped=true');
    return response.data;
  },

  async get(id: string): Promise<ActionItemWithSource> {
    const response = await api.get<SingleResponse>(`/action-items/${id}`);
    return response.data;
  },

  async create(data: CreateActionItemData): Promise<ActionItem> {
    const response = await api.post<CreatedResponse>('/action-items', data);
    return response.data;
  },

  async update(id: string, data: UpdateActionItemData): Promise<ActionItem> {
    const response = await api.patch<CreatedResponse>(`/action-items/${id}`, data);
    return response.data;
  },

  async updateStatus(id: string, status: Status): Promise<ActionItem> {
    const response = await api.patch<CreatedResponse>(`/action-items/${id}/status`, { status });
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/action-items/${id}`);
  },
};
