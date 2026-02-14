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

export interface ExtractedItem {
  title: string;
  priority: 'high' | 'medium' | 'low';
  due_date: string | null;
  description: string | null;
}

export interface ExtractionResult {
  action_items: ExtractedItem[];
  confidence: 'high' | 'medium' | 'low';
  message: string | null;
}

export interface GenerateSampleData {
  meeting_type: 'weekly-standup' | 'one-on-one' | 'sprint-retro';
}

export interface GeneratedSample {
  title: string;
  body: string;
}

interface SingleNoteResponse {
  data: MeetingNote;
}

interface ExtractionResponse {
  data: ExtractionResult;
}

interface GenerateSampleResponse {
  data: GeneratedSample;
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

  async extractActionItems(id: string): Promise<ExtractionResult> {
    const response = await api.post<ExtractionResponse>(`/meeting-notes/${id}/extract`);
    return response.data;
  },

  async generateSample(data: GenerateSampleData): Promise<GeneratedSample> {
    const response = await api.post<GenerateSampleResponse>('/meeting-notes/generate-sample', data);
    return response.data;
  },
};
