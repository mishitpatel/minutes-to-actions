import { prisma } from '../../lib/prisma.js';
import { createSession, deleteSession } from '../../services/session.js';
import { GOOGLE_OAUTH } from '../../config/oauth.js';
import { env } from '../../config/env.js';
import { googleTokenSchema, googleUserSchema, type UserResponse, type GoogleUser } from './auth.schemas.js';

// Response transformer
export function toUserResponse(user: {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  createdAt: Date;
}): UserResponse {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar_url: user.avatarUrl,
    created_at: user.createdAt.toISOString(),
  };
}

export function buildGoogleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: env.GOOGLE_CALLBACK_URL,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'offline',
    prompt: 'consent',
  });

  return `${GOOGLE_OAUTH.AUTH_URL}?${params.toString()}`;
}

export type TokenExchangeResult =
  | { success: true; accessToken: string }
  | { success: false; error: string };

export async function exchangeCodeForTokens(code: string): Promise<TokenExchangeResult> {
  const tokenResponse = await fetch(GOOGLE_OAUTH.TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: env.GOOGLE_CALLBACK_URL,
    }),
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    return { success: false, error: errorText };
  }

  const tokensData = await tokenResponse.json();
  const tokens = googleTokenSchema.parse(tokensData);
  return { success: true, accessToken: tokens.access_token };
}

export type UserInfoResult =
  | { success: true; user: GoogleUser }
  | { success: false; error: string };

export async function fetchGoogleUserInfo(accessToken: string): Promise<UserInfoResult> {
  const userResponse = await fetch(GOOGLE_OAUTH.USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!userResponse.ok) {
    const errorText = await userResponse.text();
    return { success: false, error: errorText };
  }

  const user = googleUserSchema.parse(await userResponse.json());
  return { success: true, user };
}

export async function upsertUser(googleUser: GoogleUser) {
  return prisma.user.upsert({
    where: { googleId: googleUser.id },
    update: {
      email: googleUser.email,
      name: googleUser.name,
      avatarUrl: googleUser.picture || null,
    },
    create: {
      googleId: googleUser.id,
      email: googleUser.email,
      name: googleUser.name,
      avatarUrl: googleUser.picture || null,
    },
  });
}

export async function createUserSession(userId: string): Promise<string> {
  return createSession(userId);
}

export async function deleteUserSession(token: string): Promise<void> {
  await deleteSession(token);
}

/**
 * Create or update a test user (development/test only)
 * Uses a deterministic fake googleId to avoid conflicts with real OAuth users
 */
export async function createTestUser(email: string, name: string) {
  const testGoogleId = `test-user-${email}`;

  // First check if user exists by email
  const existingByEmail = await prisma.user.findUnique({
    where: { email },
  });

  if (existingByEmail) {
    // If user exists with this email, update their name and return
    return prisma.user.update({
      where: { email },
      data: { name },
    });
  }

  // Check if test user exists by googleId
  const existingByGoogleId = await prisma.user.findUnique({
    where: { googleId: testGoogleId },
  });

  if (existingByGoogleId) {
    // Update existing test user
    return prisma.user.update({
      where: { googleId: testGoogleId },
      data: { email, name },
    });
  }

  // Create new test user
  return prisma.user.create({
    data: {
      googleId: testGoogleId,
      email,
      name,
      avatarUrl: null,
    },
  });
}
