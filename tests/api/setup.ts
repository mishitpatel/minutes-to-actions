/**
 * API E2E Test Setup
 *
 * Provides utilities for testing API endpoints with a real server and database.
 * Uses the same database as development - tests should be independent and not
 * rely on existing data.
 */

import { createApp, type AppOptions } from '../../apps/api/src/app.js';
import { createSession } from '../../apps/api/src/services/session.js';
import { prisma as prismaClient } from '../../apps/api/src/lib/prisma.js';

// Type for the Fastify app instance (inferred from createApp return type)
type FastifyInstance = Awaited<ReturnType<typeof createApp>>;

// Type aliases for Prisma models (inferred from prisma client)
type User = Awaited<ReturnType<typeof prismaClient.user.create>>;
type MeetingNote = Awaited<ReturnType<typeof prismaClient.meetingNote.create>>;
type ActionItem = Awaited<ReturnType<typeof prismaClient.actionItem.create>>;

export const SESSION_COOKIE_NAME = 'session_token';

// Re-export Prisma client for direct database access in tests
export const prisma = prismaClient;

// Shared app instance for tests
let app: FastifyInstance | null = null;

/**
 * Initialize the Fastify application for testing.
 * Should be called in beforeAll().
 */
export async function setupApp(): Promise<FastifyInstance> {
  if (app) {
    return app;
  }

  app = await createApp({ logger: false });
  await app.ready();
  return app;
}

/**
 * Close the Fastify application.
 * Should be called in afterAll().
 */
export async function teardownApp(): Promise<void> {
  if (app) {
    await app.close();
    app = null;
  }
  await prisma.$disconnect();
}

/**
 * Get the current app instance.
 * Throws if app hasn't been initialized.
 */
export function getApp(): FastifyInstance {
  if (!app) {
    throw new Error('App not initialized. Call setupApp() in beforeAll()');
  }
  return app;
}

/**
 * Clean up all test data from the database.
 * Should be called in beforeEach() for test isolation.
 *
 * Order matters due to foreign key constraints:
 * 1. ActionItem (references MeetingNote and User)
 * 2. MeetingNote (references User)
 * 3. Session (references User)
 * 4. User
 */
export async function cleanupDatabase(): Promise<void> {
  await prisma.actionItem.deleteMany({});
  await prisma.meetingNote.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.user.deleteMany({});
}

/**
 * Create an authenticated test context with a user and session.
 * Returns the user and a session token for making authenticated requests.
 */
export interface TestContext {
  user: User;
  sessionToken: string;
}

export async function createTestContext(
  userData: Partial<Pick<User, 'email' | 'name' | 'googleId'>> = {}
): Promise<TestContext> {
  const user = await prisma.user.create({
    data: {
      email: userData.email || `test-${Date.now()}@example.com`,
      name: userData.name || 'Test User',
      googleId: userData.googleId || `google-${Date.now()}`,
    },
  });

  const sessionToken = await createSession(user.id);

  return { user, sessionToken };
}

/**
 * Create a meeting note for testing.
 */
export async function createTestMeetingNote(
  userId: string,
  data: Partial<Pick<MeetingNote, 'title' | 'body'>> = {}
): Promise<MeetingNote> {
  return prisma.meetingNote.create({
    data: {
      userId,
      title: data.title || 'Test Meeting Note',
      body: data.body || 'Test meeting note body content',
    },
  });
}

/**
 * Create an action item for testing.
 */
export async function createTestActionItem(
  userId: string,
  data: Partial<
    Pick<ActionItem, 'title' | 'description' | 'status' | 'position' | 'priority' | 'dueDate' | 'meetingNoteId'>
  > = {}
): Promise<ActionItem> {
  return prisma.actionItem.create({
    data: {
      userId,
      title: data.title || 'Test Action Item',
      description: data.description,
      status: data.status || 'todo',
      priority: data.priority || 'medium',
      position: data.position ?? 0,
      dueDate: data.dueDate,
      meetingNoteId: data.meetingNoteId,
    },
  });
}

/**
 * Make an authenticated request helper.
 * Automatically includes the session cookie.
 */
export interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  body?: unknown;
  sessionToken?: string;
  headers?: Record<string, string>;
}

export interface TestResponse {
  statusCode: number;
  body: string;
  headers: Record<string, string | string[] | undefined>;
}

export async function makeRequest(options: RequestOptions): Promise<TestResponse> {
  const app = getApp();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response = await (app as any).inject({
    method: options.method,
    url: options.url,
    payload: options.body,
    cookies: options.sessionToken ? { [SESSION_COOKIE_NAME]: options.sessionToken } : undefined,
    headers: options.headers,
  });
  return response as TestResponse;
}

/**
 * Parse JSON response body with type safety.
 */
export function parseBody<T>(response: { body: string }): T {
  return JSON.parse(response.body) as T;
}
