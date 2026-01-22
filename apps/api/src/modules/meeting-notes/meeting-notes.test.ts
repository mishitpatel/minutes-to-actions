import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import Fastify, { FastifyInstance, FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import cookie from '@fastify/cookie';
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';
import authPlugin, { SESSION_COOKIE_NAME } from '../../plugins/auth.js';
import meetingNotesRoutes from './meeting-notes.routes.js';
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

describe('Meeting Notes Routes', () => {
  let app: FastifyInstance;
  let testUser: { id: string; email: string };
  let otherUser: { id: string; email: string };
  let testSessionToken: string;

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
    await app.register(meetingNotesRoutes, { prefix: '/api/v1' });

    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up test data
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
  });

  describe('GET /api/v1/meeting-notes', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/meeting-notes',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return empty list when no notes exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/meeting-notes',
        cookies: { [SESSION_COOKIE_NAME]: testSessionToken },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toEqual([]);
      expect(body.pagination.total_items).toBe(0);
    });

    it('should return user notes with pagination', async () => {
      // Create some notes
      await prisma.meetingNote.createMany({
        data: [
          { userId: testUser.id, title: 'Note 1', body: 'Body 1' },
          { userId: testUser.id, title: 'Note 2', body: 'Body 2' },
          { userId: testUser.id, title: 'Note 3', body: 'Body 3' },
        ],
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/meeting-notes?page=1&limit=2',
        cookies: { [SESSION_COOKIE_NAME]: testSessionToken },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.length).toBe(2);
      expect(body.pagination.total_items).toBe(3);
      expect(body.pagination.total_pages).toBe(2);
      expect(body.pagination.has_next_page).toBe(true);
    });

    it('should only return notes owned by the user', async () => {
      await prisma.meetingNote.create({
        data: { userId: testUser.id, title: 'My Note', body: 'My body' },
      });
      await prisma.meetingNote.create({
        data: { userId: otherUser.id, title: 'Other Note', body: 'Other body' },
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/meeting-notes',
        cookies: { [SESSION_COOKIE_NAME]: testSessionToken },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.length).toBe(1);
      expect(body.data[0].title).toBe('My Note');
    });
  });

  describe('GET /api/v1/meeting-notes/:id', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/meeting-notes/123e4567-e89b-12d3-a456-426614174000',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 404 for non-existent note', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/meeting-notes/123e4567-e89b-12d3-a456-426614174000',
        cookies: { [SESSION_COOKIE_NAME]: testSessionToken },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('should return 404 for note owned by another user', async () => {
      const note = await prisma.meetingNote.create({
        data: { userId: otherUser.id, title: 'Other Note', body: 'Other body' },
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/meeting-notes/${note.id}`,
        cookies: { [SESSION_COOKIE_NAME]: testSessionToken },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return note with action_items array', async () => {
      const note = await prisma.meetingNote.create({
        data: { userId: testUser.id, title: 'My Note', body: 'My body' },
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/meeting-notes/${note.id}`,
        cookies: { [SESSION_COOKIE_NAME]: testSessionToken },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.id).toBe(note.id);
      expect(body.data.title).toBe('My Note');
      expect(body.data.body).toBe('My body');
      expect(body.data.action_items).toEqual([]);
    });

    it('should return 400 for invalid UUID', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/meeting-notes/not-a-uuid',
        cookies: { [SESSION_COOKIE_NAME]: testSessionToken },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('POST /api/v1/meeting-notes', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/meeting-notes',
        payload: { body: 'Test body' },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should create note with body only', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/meeting-notes',
        cookies: { [SESSION_COOKIE_NAME]: testSessionToken },
        payload: { body: 'Test body content' },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.data.title).toBeNull();
      expect(body.data.body).toBe('Test body content');
      expect(body.data.id).toBeDefined();
    });

    it('should create note with title and body', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/meeting-notes',
        cookies: { [SESSION_COOKIE_NAME]: testSessionToken },
        payload: { title: 'Test Title', body: 'Test body content' },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.data.title).toBe('Test Title');
      expect(body.data.body).toBe('Test body content');
    });

    it('should return 400 when body is missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/meeting-notes',
        cookies: { [SESSION_COOKIE_NAME]: testSessionToken },
        payload: { title: 'Only title' },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 when body is empty', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/meeting-notes',
        cookies: { [SESSION_COOKIE_NAME]: testSessionToken },
        payload: { body: '' },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('PUT /api/v1/meeting-notes/:id', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/v1/meeting-notes/123e4567-e89b-12d3-a456-426614174000',
        payload: { body: 'Updated body' },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 404 for non-existent note', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/v1/meeting-notes/123e4567-e89b-12d3-a456-426614174000',
        cookies: { [SESSION_COOKIE_NAME]: testSessionToken },
        payload: { body: 'Updated body' },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 404 for note owned by another user', async () => {
      const note = await prisma.meetingNote.create({
        data: { userId: otherUser.id, title: 'Other Note', body: 'Other body' },
      });

      const response = await app.inject({
        method: 'PUT',
        url: `/api/v1/meeting-notes/${note.id}`,
        cookies: { [SESSION_COOKIE_NAME]: testSessionToken },
        payload: { body: 'Trying to update' },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should update note title', async () => {
      const note = await prisma.meetingNote.create({
        data: { userId: testUser.id, title: 'Original Title', body: 'Original body' },
      });

      const response = await app.inject({
        method: 'PUT',
        url: `/api/v1/meeting-notes/${note.id}`,
        cookies: { [SESSION_COOKIE_NAME]: testSessionToken },
        payload: { title: 'Updated Title' },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.title).toBe('Updated Title');
      expect(body.data.body).toBe('Original body');
    });

    it('should update note body', async () => {
      const note = await prisma.meetingNote.create({
        data: { userId: testUser.id, title: 'Original Title', body: 'Original body' },
      });

      const response = await app.inject({
        method: 'PUT',
        url: `/api/v1/meeting-notes/${note.id}`,
        cookies: { [SESSION_COOKIE_NAME]: testSessionToken },
        payload: { body: 'Updated body' },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.title).toBe('Original Title');
      expect(body.data.body).toBe('Updated body');
    });

    it('should allow setting title to null', async () => {
      const note = await prisma.meetingNote.create({
        data: { userId: testUser.id, title: 'Original Title', body: 'Original body' },
      });

      const response = await app.inject({
        method: 'PUT',
        url: `/api/v1/meeting-notes/${note.id}`,
        cookies: { [SESSION_COOKIE_NAME]: testSessionToken },
        payload: { title: null },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.title).toBeNull();
    });
  });

  describe('DELETE /api/v1/meeting-notes/:id', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/meeting-notes/123e4567-e89b-12d3-a456-426614174000',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 404 for non-existent note', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/meeting-notes/123e4567-e89b-12d3-a456-426614174000',
        cookies: { [SESSION_COOKIE_NAME]: testSessionToken },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 404 for note owned by another user', async () => {
      const note = await prisma.meetingNote.create({
        data: { userId: otherUser.id, title: 'Other Note', body: 'Other body' },
      });

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/meeting-notes/${note.id}`,
        cookies: { [SESSION_COOKIE_NAME]: testSessionToken },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should delete note and return 204', async () => {
      const note = await prisma.meetingNote.create({
        data: { userId: testUser.id, title: 'To Delete', body: 'Delete me' },
      });

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/meeting-notes/${note.id}`,
        cookies: { [SESSION_COOKIE_NAME]: testSessionToken },
      });

      expect(response.statusCode).toBe(204);

      // Verify note is deleted
      const deletedNote = await prisma.meetingNote.findUnique({
        where: { id: note.id },
      });
      expect(deletedNote).toBeNull();
    });
  });
});
