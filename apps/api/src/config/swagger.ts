import { FastifyDynamicSwaggerOptions } from '@fastify/swagger';
import { jsonSchemaTransform } from 'fastify-type-provider-zod';
import { env } from './env.js';

export const swaggerConfig: FastifyDynamicSwaggerOptions = {
  openapi: {
    info: {
      title: 'Minutes to Actions API',
      description: 'API for managing meeting notes and action items',
      version: '1.0.0',
    },
    servers: [{ url: env.API_URL }],
    tags: [
      { name: 'auth', description: 'Authentication endpoints' },
      { name: 'meeting-notes', description: 'Meeting notes CRUD' },
    ],
  },
  transform: jsonSchemaTransform,
};
