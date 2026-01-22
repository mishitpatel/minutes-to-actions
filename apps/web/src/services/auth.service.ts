import { api } from './api';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  created_at: string;
}

interface AuthMeResponse {
  data: User;
}

export const authService = {
  async getMe(): Promise<User> {
    const response = await api.get<AuthMeResponse>('/auth/me');
    return response.data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  getGoogleAuthUrl(): string {
    return api.getGoogleAuthUrl();
  },
};
