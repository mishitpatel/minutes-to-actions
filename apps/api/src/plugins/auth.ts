import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { validateSession } from '../services/session.js';
import { prisma } from '../lib/prisma.js';
import type { User } from '@prisma/client';

declare module 'fastify' {
  interface FastifyRequest {
    user?: User;
    sessionId?: string;
  }
}

export const SESSION_COOKIE_NAME = 'session_token';

async function authPlugin(fastify: FastifyInstance) {
  fastify.decorateRequest('user', undefined);
  fastify.decorateRequest('sessionId', undefined);

  fastify.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
    const token = request.cookies[SESSION_COOKIE_NAME];

    if (!token) {
      return reply.status(401).send({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    const sessionData = await validateSession(token);

    if (!sessionData) {
      reply.clearCookie(SESSION_COOKIE_NAME);
      return reply.status(401).send({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired session',
        },
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionData.userId },
    });

    if (!user) {
      reply.clearCookie(SESSION_COOKIE_NAME);
      return reply.status(401).send({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not found',
        },
      });
    }

    request.user = user;
    request.sessionId = sessionData.sessionId;
  });
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export default fp(authPlugin, {
  name: 'auth',
});
