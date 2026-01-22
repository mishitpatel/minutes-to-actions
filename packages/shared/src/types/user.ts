export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  googleId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
}

export type UserPublic = Omit<User, 'googleId'>;
