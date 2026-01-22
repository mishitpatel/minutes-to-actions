import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import cookie from '@fastify/cookie';
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';
import authPlugin, { SESSION_COOKIE_NAME } from '../../plugins/auth.js';
import authRoutes from './auth.routes.js';
import { prisma } from '../../lib/prisma.js';
import { createSession } from '../../services/session.js';

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

describe('Auth Routes', () => {
  let app: FastifyInstance;
  let testUser: { id: string; email: string };
  let testSessionToken: string;

  beforeAll(async () => {
    app = Fastify({ logger: false });

    // Set Zod compilers for schema validation
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);

    await app.register(cookie, {
      secret: 'test-session-secret-that-is-at-least-32-chars',
    });
    await app.register(authPlugin);
    await app.register(authRoutes, { prefix: '/api/v1' });

    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up test data
    await prisma.session.deleteMany({});
    await prisma.user.deleteMany({});

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        googleId: 'google-123',
        avatarUrl: 'https://example.com/avatar.jpg',
      },
    });
    testUser = user;

    // Create session for test user
    testSessionToken = await createSession(user.id);
  });

  describe('GET /api/v1/auth/google', () => {
    it('should redirect to Google OAuth', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/google',
      });

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toContain('accounts.google.com');
      expect(response.headers.location).toContain('client_id=test-client-id');
    });

    it('should set oauth_state cookie', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/google',
      });

      const cookies = response.cookies;
      const stateCookie = cookies.find((c) => c.name === 'oauth_state');
      expect(stateCookie).toBeDefined();
      expect(stateCookie?.httpOnly).toBe(true);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return user data when authenticated', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
        cookies: {
          [SESSION_COOKIE_NAME]: testSessionToken,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.id).toBe(testUser.id);
      expect(body.data.email).toBe('test@example.com');
      expect(body.data.name).toBe('Test User');
      expect(body.data.avatar_url).toBe('https://example.com/avatar.jpg');
    });

    it('should return 401 with invalid session token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
        cookies: {
          [SESSION_COOKIE_NAME]: 'invalid-token',
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/logout',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should clear session and return 204', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/logout',
        cookies: {
          [SESSION_COOKIE_NAME]: testSessionToken,
        },
      });

      expect(response.statusCode).toBe(204);

      // Verify session was deleted
      const meResponse = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
        cookies: {
          [SESSION_COOKIE_NAME]: testSessionToken,
        },
      });
      expect(meResponse.statusCode).toBe(401);
    });
  });
});
