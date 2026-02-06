import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { SESSION_COOKIE_NAME } from '../../plugins/auth.js';
import { errorResponseSchema } from '../../schemas/index.js';
import {
  callbackQuerySchema,
  meResponseSchema,
  testLoginBodySchema,
  testLoginResponseSchema,
} from './auth.schemas.js';
import * as handler from './auth.handler.js';

export default async function authRoutes(fastify: FastifyInstance) {
  const f = fastify.withTypeProvider<ZodTypeProvider>();

  // GET /auth/google - Redirect to Google OAuth consent screen
  f.get(
    '/auth/google',
    {
      schema: {
        description: 'Redirect to Google OAuth consent screen',
        tags: ['auth'],
      },
    },
    async (_request, reply) => {
      const state = crypto.randomUUID();

      // Store state in cookie for CSRF protection
      reply.setCookie('oauth_state', state, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 10, // 10 minutes
      });

      const authUrl = handler.buildGoogleAuthUrl(state);
      return reply.redirect(authUrl);
    }
  );

  // GET /auth/google/callback - Handle OAuth callback
  f.get(
    '/auth/google/callback',
    {
      schema: {
        description: 'Handle Google OAuth callback and create user session',
        tags: ['auth'],
        querystring: callbackQuerySchema,
      },
    },
    async (request, reply) => {
      const { code, state } = request.query;
      const storedState = request.cookies.oauth_state;

      // Verify CSRF state
      if (!storedState || state !== storedState) {
        reply.clearCookie('oauth_state');
        return reply.redirect(`${env.WEB_URL}/login?error=invalid_state`);
      }

      reply.clearCookie('oauth_state');

      try {
        // Exchange code for tokens
        const tokenResult = await handler.exchangeCodeForTokens(code);
        if (!tokenResult.success) {
          fastify.log.error({ err: tokenResult.error }, 'Token exchange failed');
          return reply.redirect(`${env.WEB_URL}/login?error=token_exchange_failed`);
        }

        // Fetch user info from Google
        const userResult = await handler.fetchGoogleUserInfo(tokenResult.accessToken);
        if (!userResult.success) {
          fastify.log.error({ err: userResult.error }, 'User info fetch failed');
          return reply.redirect(`${env.WEB_URL}/login?error=userinfo_failed`);
        }

        // Create or update user
        const user = await handler.upsertUser(userResult.user);

        // Create session
        const sessionToken = await handler.createUserSession(user.id);

        // Set session cookie
        reply.setCookie(SESSION_COOKIE_NAME, sessionToken, {
          httpOnly: true,
          secure: env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 30, // 30 days
        });

        return reply.redirect(env.WEB_URL);
      } catch (error) {
        fastify.log.error({ err: error }, 'OAuth callback error');
        return reply.redirect(`${env.WEB_URL}/login?error=auth_failed`);
      }
    }
  );

  // GET /auth/me - Get current authenticated user
  f.get(
    '/auth/me',
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: 'Get the currently authenticated user',
        tags: ['auth'],
        response: {
          200: meResponseSchema,
          401: errorResponseSchema,
        },
      },
    },
    async (request) => {
      const user = request.user!;

      return {
        data: handler.toUserResponse(user),
      };
    }
  );

  // POST /auth/logout - End session
  f.post(
    '/auth/logout',
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: 'Log out the current user and end the session',
        tags: ['auth'],
        response: {
          204: z.null().describe('No content'),
          401: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const token = request.cookies[SESSION_COOKIE_NAME];

      if (token) {
        await handler.deleteUserSession(token);
      }

      reply.clearCookie(SESSION_COOKIE_NAME);
      return reply.status(204).send(null);
    }
  );

  // POST /auth/test-login - Development only endpoint for E2E testing
  f.post(
    '/auth/test-login',
    {
      schema: {
        description: 'Test login endpoint for E2E testing (development/test only)',
        tags: ['auth'],
        body: testLoginBodySchema,
        response: {
          200: testLoginResponseSchema,
          403: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      // Block in production
      if (env.NODE_ENV === 'production') {
        return reply.status(403).send({
          error: {
            code: 'FORBIDDEN',
            message: 'Test login is not available in production',
          },
        });
      }

      const { email, name } = request.body;

      // Create or get test user
      const user = await handler.createTestUser(email, name);

      // Create session
      const sessionToken = await handler.createUserSession(user.id);

      // Set session cookie
      reply.setCookie(SESSION_COOKIE_NAME, sessionToken, {
        httpOnly: true,
        secure: false, // Always false for test endpoint
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });

      return { data: handler.toUserResponse(user) };
    }
  );
}
