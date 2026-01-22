import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import Fastify, { FastifyInstance, FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import cookie from '@fastify/cookie';
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';
import authPlugin, { SESSION_COOKIE_NAME } from '../../plugins/auth.js';
import actionItemsRoutes from './action-items.routes.js';
import { prisma } from '../../lib/prisma.js';
import { createSession } from '../../services/session.js';
import { AppError } from '../../utils/errors.js';

// Mock environment variables
vi.mock('../../config/env.js', () => ({
  env: {
    NODE_ENV: 'test',
    PORT: 3000,
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    GOOGLE_CLIENT_ID: 'test-client-id',
    GOOGLE_CLIENT_SECRET: 'test-client-secret',
    GOOGLE_CALLBACK_URL: 'http://localhost:3000/api/v1/auth/google/callback',
    SESSION_SECRET: 'test-session-secret-that-is-at-least-32-chars',
    API_URL: 'http://localhost:3000',
    WEB_URL: 'http://localhost:5173',
  },
}));

describe('Action Items Routes', () => {
  let app: FastifyInstance;
  let testUser: { id: string; email: string };
  let otherUser: { id: string; email: string };
  let testSessionToken: string;
  let testMeetingNote: { id: string };

  beforeAll(async () => {
    app = Fastify({ logger: false });

    // Set Zod compilers for schema validation
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);

    // Global error handler for AppError
    app.setErrorHandler((error: FastifyError, _request: FastifyRequest, reply: FastifyReply) => {
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({
          error: { code: error.code, message: error.message, details: error.details },
        });
      }

      if (error.validation) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: error.message,
        });
      }

      return reply.status(500).send({
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      });
    });

    await app.register(cookie, {
      secret: 'test-session-secret-that-is-at-least-32-chars',
    });
    await app.register(authPlugin);
    await app.register(actionItemsRoutes, { prefix: '/api/v1' });

    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up test data in order (action items first due to foreign keys)
    await prisma.actionItem.deleteMany({});
    await prisma.meetingNote.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.user.deleteMany({});

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        googleId: 'google-123',
      },
    });
    testUser = user;
    testSessionToken = await createSession(user.id);

    // Create another user for authorization tests
    const other = await prisma.user.create({
      data: {
        email: 'other@example.com',
        name: 'Other User',
        googleId: 'google-456',
      },
    });
    otherUser = other;

    // Create a meeting note for testing
    testMeetingNote = await prisma.meetingNote.create({
      data: {
        userId: testUser.id,
        title: 'Test Meeting',
        body: 'Meeting body',
      },
    });
  });

  describe('GET /api/v1/action-items', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/action-items',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return empty grouped response when no items exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/action-items',
        cookies: { [SESSION_COOKIE_NAME]: testSessionToken },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toEqual({ todo: [], doing: [], done: [] });
    });

    it('should return items grouped by status', async () => {
      // Create items in different statuses
      await prisma.actionItem.createMany({
        data: [
          { userId: testUser.id, title: 'Todo 1', status: 'todo', position: 0 },
          { userId: testUser.id, title: 'Todo 2', status: 'todo', position: 1 },
          { userId: testUser.id, title: 'Doing 1', status: 'doing', position: 0 },
          { userId: testUser.id, title: 'Done 1', status: 'done', position: 0 },
        ],
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/action-items',
        cookies: { [SESSION_COOKIE_NAME]: testSessionToken },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.todo.length).toBe(2);
      expect(body.data.doing.length).toBe(1);
      expect(body.data.done.length).toBe(1);
    });

    it('should filter by status when status query param provided', async () => {
      await prisma.actionItem.createMany({
        data: [
          { userId: testUser.id, title: 'Todo 1', status: 'todo', position: 0 },
          { userId: testUser.id, title: 'Doing 1', status: 'doing', position: 0 },
        ],
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/action-items?status=todo',
        cookies: { [SESSION_COOKIE_NAME]: testSessionToken },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      // When filtering by status, returns flat array
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBe(1);
      expect(body.data[0].title).toBe('Todo 1');
    });

    it('should only return items owned by the user', async () => {
      await prisma.actionItem.create({
        data: { userId: testUser.id, title: 'My Item', status: 'todo', position: 0 },
      });
      await prisma.actionItem.create({
        data: { userId: otherUser.id, title: 'Other Item', status: 'todo', position: 0 },
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/action-items',
        cookies: { [SESSION_COOKIE_NAME]: testSessionToken },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.todo.length).toBe(1);
      expect(body.data.todo[0].title).toBe('My Item');
    });
  });

  describe('GET /api/v1/action-items/:id', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/action-items/123e4567-e89b-12d3-a456-426614174000',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 404 for non-existent item', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/action-items/123e4567-e89b-12d3-a456-426614174000',
        cookies: { [SESSION_COOKIE_NAME]: testSessionToken },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('should return 404 for item owned by another user', async () => {
      const item = await prisma.actionItem.create({
        data: { userId: otherUser.id, title: 'Other Item', status: 'todo', position: 0 },
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/action-items/${item.id}`,
        cookies: { [SESSION_COOKIE_NAME]: testSessionToken },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return item with meeting_note info', async () => {
      const item = await prisma.actionItem.create({
        data: {
          userId: testUser.id,
          meetingNoteId: testMeetingNote.id,
          title: 'My Item',
          description: 'Description',
          status: 'todo',
          priority: 'high',
          position: 0,
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/action-items/${item.id}`,
        cookies: { [SESSION_COOKIE_NAME]: testSessionToken },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.id).toBe(item.id);
      expect(body.data.title).toBe('My Item');
      expect(body.data.meeting_note).not.toBeNull();
      expect(body.data.meeting_note.id).toBe(testMeetingNote.id);
      expect(body.data.meeting_note.title).toBe('Test Meeting');
    });

    it('should return item with null meeting_note when not linked', async () => {
      const item = await prisma.actionItem.create({
        data: {
          userId: testUser.id,
          title: 'Standalone Item',
          status: 'todo',
          position: 0,
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/action-items/${item.id}`,
        cookies: { [SESSION_COOKIE_NAME]: testSessionToken },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.meeting_note).toBeNull();
    });

    it('should return 400 for invalid UUID', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/action-items/not-a-uuid',
        cookies: { [SESSION_COOKIE_NAME]: testSessionToken },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('POST /api/v1/action-items', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/action-items',
        payload: { title: 'Test item' },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should create item with title only', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/action-items',
        cookies: { [SESSION_COOKIE_NAME]: testSessionToken },
        payload: { title: 'New action item' },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.data.title).toBe('New action item');
      expect(body.data.status).toBe('todo');
      expect(body.data.priority).toBe('medium');
      expect(body.data.description).toBeNull();
    });

    it('should create item with all fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/action-items',
        cookies: { [SESSION_COOKIE_NAME]: testSessionToken },
        payload: {
          title: 'Full item',
          description: 'Description here',
          priority: 'high',
          status: 'doing',
          due_date: '2025-12-31T00:00:00.000Z',
          meeting_note_id: testMeetingNote.id,
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.data.title).toBe('Full item');
      expect(body.data.description).toBe('Description here');
      expect(body.data.priority).toBe('high');
      expect(body.data.status).toBe('doing');
      expect(body.data.due_date).not.toBeNull();
      expect(body.data.meeting_note_id).toBe(testMeetingNote.id);
    });

    it('should return 400 when title is missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/action-items',
        cookies: { [SESSION_COOKIE_NAME]: testSessionToken },
        payload: { description: 'No title' },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 when title is empty', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/action-items',
        cookies: { [SESSION_COOKIE_NAME]: testSessionToken },
        payload: { title: '' },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for invalid priority', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/action-items',
        cookies: { [SESSION_COOKIE_NAME]: testSessionToken },
        payload: { title: 'Test', priority: 'invalid' },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 404 for non-existent meeting note', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/action-items',
        cookies: { [SESSION_COOKIE_NAME]: testSessionToken },
        payload: {
          title: 'Test',
          meeting_note_id: '123e4567-e89b-12d3-a456-426614174000',
        },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('POST /api/v1/action-items/bulk', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/action-items/bulk',
        payload: {
          meeting_note_id: testMeetingNote.id,
          items: [{ title: 'Item 1' }],
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should bulk create items', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/action-items/bulk',
        cookies: { [SESSION_COOKIE_NAME]: testSessionToken },
        payload: {
          meeting_note_id: testMeetingNote.id,
          items: [
            { title: 'Item 1', priority: 'high' },
            { title: 'Item 2', priority: 'low' },
            { title: 'Item 3' },
          ],
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.data.created_count).toBe(3);
      expect(body.data.items.length).toBe(3);
      expect(body.data.items[0].title).toBe('Item 1');
      expect(body.data.items[0].priority).toBe('high');
      expect(body.data.items[0].meeting_note_id).toBe(testMeetingNote.id);
    });

    it('should return 400 when items array is empty', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/action-items/bulk',
        cookies: { [SESSION_COOKIE_NAME]: testSessionToken },
        payload: {
          meeting_note_id: testMeetingNote.id,
          items: [],
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 404 for non-existent meeting note', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/action-items/bulk',
        cookies: { [SESSION_COOKIE_NAME]: testSessionToken },
        payload: {
          meeting_note_id: '123e4567-e89b-12d3-a456-426614174000',
          items: [{ title: 'Item 1' }],
        },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 404 for meeting note owned by another user', async () => {
      const otherNote = await prisma.meetingNote.create({
        data: { userId: otherUser.id, title: 'Other Note', body: 'Body' },
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/action-items/bulk',
        cookies: { [SESSION_COOKIE_NAME]: testSessionToken },
        payload: {
          meeting_note_id: otherNote.id,
          items: [{ title: 'Item 1' }],
        },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('PUT /api/v1/action-items/:id', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/v1/action-items/123e4567-e89b-12d3-a456-426614174000',
        payload: { title: 'Updated' },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 404 for non-existent item', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/v1/action-items/123e4567-e89b-12d3-a456-426614174000',
        cookies: { [SESSION_COOKIE_NAME]: testSessionToken },
        payload: { title: 'Updated' },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 404 for item owned by another user', async () => {
      const item = await prisma.actionItem.create({
        data: { userId: otherUser.id, title: 'Other Item', status: 'todo', position: 0 },
      });

      const response = await app.inject({
        method: 'PUT',
        url: `/api/v1/action-items/${item.id}`,
        cookies: { [SESSION_COOKIE_NAME]: testSessionToken },
        payload: { title: 'Trying to update' },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should update item title', async () => {
      const item = await prisma.actionItem.create({
        data: { userId: testUser.id, title: 'Original', status: 'todo', position: 0 },
      });

      const response = await app.inject({
        method: 'PUT',
        url: `/api/v1/action-items/${item.id}`,
        cookies: { [SESSION_COOKIE_NAME]: testSessionToken },
        payload: { title: 'Updated' },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.title).toBe('Updated');
    });

    it('should update multiple fields', async () => {
      const item = await prisma.actionItem.create({
        data: {
          userId: testUser.id,
          title: 'Original',
          description: 'Original desc',
          priority: 'low',
          status: 'todo',
          position: 0,
        },
      });

      const response = await app.inject({
        method: 'PUT',
        url: `/api/v1/action-items/${item.id}`,
        cookies: { [SESSION_COOKIE_NAME]: testSessionToken },
        payload: {
          title: 'Updated',
          description: 'Updated desc',
          priority: 'high',
          status: 'doing',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.title).toBe('Updated');
      expect(body.data.description).toBe('Updated desc');
      expect(body.data.priority).toBe('high');
      expect(body.data.status).toBe('doing');
    });

    it('should allow setting description to null', async () => {
      const item = await prisma.actionItem.create({
        data: {
          userId: testUser.id,
          title: 'Item',
          description: 'Has description',
          status: 'todo',
          position: 0,
        },
      });

      const response = await app.inject({
        method: 'PUT',
        url: `/api/v1/action-items/${item.id}`,
        cookies: { [SESSION_COOKIE_NAME]: testSessionToken },
        payload: { description: null },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.description).toBeNull();
    });
  });

  describe('PATCH /api/v1/action-items/:id/status', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/action-items/123e4567-e89b-12d3-a456-426614174000/status',
        payload: { status: 'doing' },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 404 for non-existent item', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/action-items/123e4567-e89b-12d3-a456-426614174000/status',
        cookies: { [SESSION_COOKIE_NAME]: testSessionToken },
        payload: { status: 'doing' },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should update status', async () => {
      const item = await prisma.actionItem.create({
        data: { userId: testUser.id, title: 'Item', status: 'todo', position: 0 },
      });

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/action-items/${item.id}/status`,
        cookies: { [SESSION_COOKIE_NAME]: testSessionToken },
        payload: { status: 'doing' },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.status).toBe('doing');
    });

    it('should return 400 for invalid status', async () => {
      const item = await prisma.actionItem.create({
        data: { userId: testUser.id, title: 'Item', status: 'todo', position: 0 },
      });

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/action-items/${item.id}/status`,
        cookies: { [SESSION_COOKIE_NAME]: testSessionToken },
        payload: { status: 'invalid' },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('PATCH /api/v1/action-items/:id/position', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/action-items/123e4567-e89b-12d3-a456-426614174000/position',
        payload: { position: 1 },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 404 for non-existent item', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/action-items/123e4567-e89b-12d3-a456-426614174000/position',
        cookies: { [SESSION_COOKIE_NAME]: testSessionToken },
        payload: { position: 1 },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should update position', async () => {
      const item = await prisma.actionItem.create({
        data: { userId: testUser.id, title: 'Item', status: 'todo', position: 0 },
      });

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/action-items/${item.id}/position`,
        cookies: { [SESSION_COOKIE_NAME]: testSessionToken },
        payload: { position: 5 },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.position).toBe(5);
    });

    it('should return 400 for negative position', async () => {
      const item = await prisma.actionItem.create({
        data: { userId: testUser.id, title: 'Item', status: 'todo', position: 0 },
      });

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/action-items/${item.id}/position`,
        cookies: { [SESSION_COOKIE_NAME]: testSessionToken },
        payload: { position: -1 },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('DELETE /api/v1/action-items/:id', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/action-items/123e4567-e89b-12d3-a456-426614174000',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 404 for non-existent item', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/action-items/123e4567-e89b-12d3-a456-426614174000',
        cookies: { [SESSION_COOKIE_NAME]: testSessionToken },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 404 for item owned by another user', async () => {
      const item = await prisma.actionItem.create({
        data: { userId: otherUser.id, title: 'Other Item', status: 'todo', position: 0 },
      });

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/action-items/${item.id}`,
        cookies: { [SESSION_COOKIE_NAME]: testSessionToken },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should delete item and return 204', async () => {
      const item = await prisma.actionItem.create({
        data: { userId: testUser.id, title: 'To Delete', status: 'todo', position: 0 },
      });

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/action-items/${item.id}`,
        cookies: { [SESSION_COOKIE_NAME]: testSessionToken },
      });

      expect(response.statusCode).toBe(204);

      // Verify item is deleted
      const deletedItem = await prisma.actionItem.findUnique({
        where: { id: item.id },
      });
      expect(deletedItem).toBeNull();
    });
  });
});
