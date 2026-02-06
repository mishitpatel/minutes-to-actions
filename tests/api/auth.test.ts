import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  setupApp,
  teardownApp,
  cleanupDatabase,
  createTestContext,
  makeRequest,
  parseBody,
} from './setup.js';

describe('Auth API E2E', () => {
  beforeAll(async () => {
    await setupApp();
  });

  afterAll(async () => {
    await teardownApp();
  });

  beforeEach(async () => {
    await cleanupDatabase();
  });

  // ─── GET /api/v1/auth/me ───────────────────────────────────────────────

  describe('GET /api/v1/auth/me', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await makeRequest({
        method: 'GET',
        url: '/api/v1/auth/me',
      });

      expect(response.statusCode).toBe(401);
      const body = parseBody<{ error: { code: string } }>(response);
      expect(body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return the authenticated user', async () => {
      const { sessionToken } = await createTestContext({
        email: 'user@example.com',
        name: 'Test User',
      });

      const response = await makeRequest({
        method: 'GET',
        url: '/api/v1/auth/me',
        sessionToken,
      });

      expect(response.statusCode).toBe(200);
      const body = parseBody<{
        data: {
          id: string;
          email: string;
          name: string;
          avatar_url: string | null;
          created_at: string;
        };
      }>(response);
      expect(body.data.email).toBe('user@example.com');
      expect(body.data.name).toBe('Test User');
      expect(body.data.id).toBeDefined();
      expect(body.data.avatar_url).toBeNull();
      expect(body.data.created_at).toBeDefined();
    });
  });

  // ─── POST /api/v1/auth/logout ──────────────────────────────────────────

  describe('POST /api/v1/auth/logout', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await makeRequest({
        method: 'POST',
        url: '/api/v1/auth/logout',
      });

      expect(response.statusCode).toBe(401);
      const body = parseBody<{ error: { code: string } }>(response);
      expect(body.error.code).toBe('UNAUTHORIZED');
    });

    it('should log out the user and return 204', async () => {
      const { sessionToken } = await createTestContext();

      const response = await makeRequest({
        method: 'POST',
        url: '/api/v1/auth/logout',
        sessionToken,
      });

      expect(response.statusCode).toBe(204);
    });

    it('should invalidate the session after logout', async () => {
      const { sessionToken } = await createTestContext();

      // Logout
      await makeRequest({
        method: 'POST',
        url: '/api/v1/auth/logout',
        sessionToken,
      });

      // Try to use the same session token
      const meResponse = await makeRequest({
        method: 'GET',
        url: '/api/v1/auth/me',
        sessionToken,
      });

      expect(meResponse.statusCode).toBe(401);
    });
  });

  // ─── POST /api/v1/auth/test-login ──────────────────────────────────────

  describe('POST /api/v1/auth/test-login', () => {
    it('should return 400 for missing required fields', async () => {
      const response = await makeRequest({
        method: 'POST',
        url: '/api/v1/auth/test-login',
        body: {},
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for invalid email', async () => {
      const response = await makeRequest({
        method: 'POST',
        url: '/api/v1/auth/test-login',
        body: { email: 'not-an-email', name: 'Test' },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for empty name', async () => {
      const response = await makeRequest({
        method: 'POST',
        url: '/api/v1/auth/test-login',
        body: { email: 'test@example.com', name: '' },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should create a test user and return user data', async () => {
      const response = await makeRequest({
        method: 'POST',
        url: '/api/v1/auth/test-login',
        body: { email: 'testlogin@example.com', name: 'Test Login User' },
      });

      expect(response.statusCode).toBe(200);
      const body = parseBody<{
        data: {
          id: string;
          email: string;
          name: string;
          avatar_url: string | null;
          created_at: string;
        };
      }>(response);
      expect(body.data.email).toBe('testlogin@example.com');
      expect(body.data.name).toBe('Test Login User');
      expect(body.data.id).toBeDefined();
    });

    it('should set a session cookie on successful login', async () => {
      const response = await makeRequest({
        method: 'POST',
        url: '/api/v1/auth/test-login',
        body: { email: 'cookie@example.com', name: 'Cookie User' },
      });

      expect(response.statusCode).toBe(200);
      // The session cookie should be set in the response headers
      const setCookie = response.headers['set-cookie'];
      expect(setCookie).toBeDefined();
    });

    it('should allow using the session after test-login', async () => {
      const loginResponse = await makeRequest({
        method: 'POST',
        url: '/api/v1/auth/test-login',
        body: { email: 'session@example.com', name: 'Session User' },
      });

      expect(loginResponse.statusCode).toBe(200);

      // Extract session token from set-cookie header
      const setCookie = loginResponse.headers['set-cookie'];
      const cookieStr = Array.isArray(setCookie) ? setCookie[0] : setCookie;
      const match = cookieStr?.match(/session_token=([^;]+)/);
      const sessionToken = match?.[1];
      expect(sessionToken).toBeDefined();

      // Use the session token to access /auth/me
      const meResponse = await makeRequest({
        method: 'GET',
        url: '/api/v1/auth/me',
        sessionToken: sessionToken!,
      });

      expect(meResponse.statusCode).toBe(200);
      const body = parseBody<{ data: { email: string } }>(meResponse);
      expect(body.data.email).toBe('session@example.com');
    });

    it('should update existing user when logging in again', async () => {
      // First login
      await makeRequest({
        method: 'POST',
        url: '/api/v1/auth/test-login',
        body: { email: 'repeat@example.com', name: 'Original Name' },
      });

      // Second login with same email, different name
      const response = await makeRequest({
        method: 'POST',
        url: '/api/v1/auth/test-login',
        body: { email: 'repeat@example.com', name: 'Updated Name' },
      });

      expect(response.statusCode).toBe(200);
      const body = parseBody<{ data: { name: string } }>(response);
      expect(body.data.name).toBe('Updated Name');
    });
  });
});
