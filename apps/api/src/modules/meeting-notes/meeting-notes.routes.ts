import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { errorResponseSchema, validationErrorSchema } from '../../schemas/index.js';
import {
  createMeetingNoteSchema,
  updateMeetingNoteSchema,
  listQuerySchema,
  idParamSchema,
  meetingNoteListResponseSchema,
  singleMeetingNoteResponseSchema,
  createdMeetingNoteResponseSchema,
  meetingNoteResponseSchema,
  extractionResultSchema,
} from './meeting-notes.schemas.js';
import * as handler from './meeting-notes.handler.js';

export default async function meetingNotesRoutes(fastify: FastifyInstance) {
  const f = fastify.withTypeProvider<ZodTypeProvider>();

  // GET /meeting-notes - List all meeting notes with pagination
  f.get(
    '/meeting-notes',
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: 'List all meeting notes with pagination',
        tags: ['meeting-notes'],
        querystring: listQuerySchema,
        response: {
          200: meetingNoteListResponseSchema,
          401: errorResponseSchema,
        },
      },
    },
    async (request) => {
      const { page, limit } = request.query;
      const userId = request.user!.id;

      return handler.listMeetingNotes({ userId, page, limit });
    }
  );

  // GET /meeting-notes/:id - Get single meeting note with action items
  f.get(
    '/meeting-notes/:id',
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: 'Get a single meeting note by ID with its action items',
        tags: ['meeting-notes'],
        params: idParamSchema,
        response: {
          200: singleMeetingNoteResponseSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request) => {
      const { id } = request.params;
      const userId = request.user!.id;

      const meetingNote = await handler.getMeetingNoteById(id, userId);
      return { data: meetingNote };
    }
  );

  // POST /meeting-notes - Create new meeting note
  f.post(
    '/meeting-notes',
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: 'Create a new meeting note',
        tags: ['meeting-notes'],
        body: createMeetingNoteSchema,
        response: {
          201: createdMeetingNoteResponseSchema,
          400: validationErrorSchema,
          401: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const userId = request.user!.id;

      const meetingNote = await handler.createMeetingNote(request.body, userId);
      return reply.status(201).send({ data: meetingNote });
    }
  );

  // PUT /meeting-notes/:id - Update meeting note
  f.put(
    '/meeting-notes/:id',
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: 'Update an existing meeting note',
        tags: ['meeting-notes'],
        params: idParamSchema,
        body: updateMeetingNoteSchema,
        response: {
          200: z.object({ data: meetingNoteResponseSchema }),
          400: validationErrorSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request) => {
      const { id } = request.params;
      const userId = request.user!.id;

      const meetingNote = await handler.updateMeetingNote(id, request.body, userId);
      return { data: meetingNote };
    }
  );

  // DELETE /meeting-notes/:id - Delete meeting note
  f.delete(
    '/meeting-notes/:id',
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: 'Delete a meeting note',
        tags: ['meeting-notes'],
        params: idParamSchema,
        response: {
          204: z.null().describe('No content'),
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const userId = request.user!.id;

      await handler.deleteMeetingNote(id, userId);
      return reply.status(204).send(null);
    }
  );

  // POST /meeting-notes/:id/extract - Extract action items from meeting note
  f.post(
    '/meeting-notes/:id/extract',
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: 'Extract action items from a meeting note using AI',
        tags: ['meeting-notes'],
        params: idParamSchema,
        response: {
          200: extractionResultSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
          429: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    async (request) => {
      const { id } = request.params;
      const userId = request.user!.id;

      const result = await handler.extractActionItemsFromNote(id, userId);
      return { data: result };
    }
  );
}
