import crypto from 'crypto';
import { prisma } from '../lib/prisma.js';

const SESSION_EXPIRY_DAYS = 30;

export interface SessionData {
  userId: string;
  sessionId: string;
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function createSession(userId: string): Promise<string> {
  try {
    const token = generateToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS);

    await prisma.session.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return token;
  } catch (error) {
    console.error('Failed to create session:', error);
    throw new Error('Session creation failed');
  }
}

export async function validateSession(token: string): Promise<SessionData | null> {
  try {
    const tokenHash = hashToken(token);

    const session = await prisma.session.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!session) {
      return null;
    }

    if (session.expiresAt < new Date()) {
      await prisma.session.delete({ where: { id: session.id } });
      return null;
    }

    return {
      userId: session.userId,
      sessionId: session.id,
    };
  } catch (error) {
    console.error('Failed to validate session:', error);
    throw new Error('Session validation failed');
  }
}

export async function deleteSession(token: string): Promise<void> {
  try {
    const tokenHash = hashToken(token);

    await prisma.session.deleteMany({
      where: { tokenHash },
    });
  } catch (error) {
    console.error('Failed to delete session:', error);
    throw new Error('Session deletion failed');
  }
}

export async function deleteAllUserSessions(userId: string): Promise<void> {
  try {
    await prisma.session.deleteMany({
      where: { userId },
    });
  } catch (error) {
    console.error('Failed to delete user sessions:', error);
    throw new Error('User sessions deletion failed');
  }
}

export async function cleanExpiredSessions(): Promise<number> {
  try {
    const result = await prisma.session.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
    return result.count;
  } catch (error) {
    console.error('Failed to clean expired sessions:', error);
    throw new Error('Expired sessions cleanup failed');
  }
}
