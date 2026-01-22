import { api } from './api';

export interface MeetingNote {
  id: string;
  title: string | null;
  body: string;
  created_at: string;
  updated_at: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

export interface CreateNoteData {
  title?: string;
  body: string;
}

export interface UpdateNoteData {
  title?: string;
  body?: string;
}

interface SingleNoteResponse {
  data: MeetingNote;
}

export const meetingNotesService = {
  async list(page = 1, limit = 10): Promise<PaginatedResponse<MeetingNote>> {
    return api.get<PaginatedResponse<MeetingNote>>(
      `/meeting-notes?page=${page}&limit=${limit}`
    );
  },

  async get(id: string): Promise<MeetingNote> {
    const response = await api.get<SingleNoteResponse>(`/meeting-notes/${id}`);
    return response.data;
  },

  async create(data: CreateNoteData): Promise<MeetingNote> {
    const response = await api.post<SingleNoteResponse>('/meeting-notes', data);
    return response.data;
  },

  async update(id: string, data: UpdateNoteData): Promise<MeetingNote> {
    const response = await api.patch<SingleNoteResponse>(`/meeting-notes/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/meeting-notes/${id}`);
  },
};
