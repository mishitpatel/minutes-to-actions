import 'dotenv/config';
import Fastify, { FastifyInstance, FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import scalarApiReference from '@scalar/fastify-api-reference';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { env } from './config/env.js';
import { swaggerConfig } from './config/swagger.js';
import authPlugin from './plugins/auth.js';
import { AppError } from './utils/errors.js';

// Import from modules
import authRoutes from './modules/auth/auth.routes.js';
import meetingNotesRoutes from './modules/meeting-notes/meeting-notes.routes.js';
import actionItemsRoutes from './modules/action-items/action-items.routes.js';

export interface AppOptions {
  logger?: boolean | object;
}

export async function createApp(options: AppOptions = {}): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: options.logger ?? true,
  });

  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);

  // Global error handler for AppError
  fastify.setErrorHandler((error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    request.log.error({ err: error, url: request.url });

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

    if (error.code?.startsWith('FST_ERR_CTP_')) {
      return reply.status(400).send({
        error: { code: 'BAD_REQUEST', message: 'Invalid request body' },
      });
    }

    return reply.status(500).send({
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    });
  });

  await fastify.register(swagger, swaggerConfig);
  await fastify.register(cors, { origin: env.WEB_URL, credentials: true });

  /*** Disable for PoC 
   * 
  // Security headers
  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  });
  *
  ***/

  // Rate limiting
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  await fastify.register(cookie, { secret: env.SESSION_SECRET });
  await fastify.register(authPlugin);

  // Register routes with API version prefix
  await fastify.register(authRoutes, { prefix: '/api/v1' });
  await fastify.register(meetingNotesRoutes, { prefix: '/api/v1' });
  await fastify.register(actionItemsRoutes, { prefix: '/api/v1' });

  await fastify.register(scalarApiReference, {
    routePrefix: '/docs',
    configuration: { theme: 'default' },
  });

  fastify.get('/health', async () => ({ status: 'ok' }));

  return fastify;
}
