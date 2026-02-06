import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { errorResponseSchema, validationErrorSchema } from '../../schemas/index.js';
import {
  createActionItemSchema,
  bulkCreateActionItemsSchema,
  updateActionItemSchema,
  updateStatusSchema,
  updatePositionSchema,
  listQuerySchema,
  idParamSchema,
  listActionItemsResponseSchema,
  singleActionItemResponseSchema,
  createdActionItemResponseSchema,
  bulkCreateResponseSchema,
  actionItemResponseSchema,
} from './action-items.schemas.js';
import * as handler from './action-items.handler.js';

export default async function actionItemsRoutes(fastify: FastifyInstance) {
  const f = fastify.withTypeProvider<ZodTypeProvider>();

  // GET /action-items - List all action items (grouped by default)
  f.get(
    '/action-items',
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: 'List all action items, optionally filtered by status. Returns grouped by status by default.',
        tags: ['action-items'],
        querystring: listQuerySchema,
        response: {
          200: listActionItemsResponseSchema,
          401: errorResponseSchema,
        },
      },
    },
    async (request) => {
      const userId = request.user!.id;
      return handler.listActionItems(userId, request.query);
    }
  );

  // GET /action-items/:id - Get single action item with source note info
  f.get(
    '/action-items/:id',
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: 'Get a single action item by ID with its source meeting note info',
        tags: ['action-items'],
        params: idParamSchema,
        response: {
          200: singleActionItemResponseSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request) => {
      const { id } = request.params;
      const userId = request.user!.id;

      const actionItem = await handler.getActionItemById(id, userId);
      return { data: actionItem };
    }
  );

  // POST /action-items - Create new action item
  f.post(
    '/action-items',
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: 'Create a new action item',
        tags: ['action-items'],
        body: createActionItemSchema,
        response: {
          201: createdActionItemResponseSchema,
          400: validationErrorSchema,
          401: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const userId = request.user!.id;

      const actionItem = await handler.createActionItem(request.body, userId);
      return reply.status(201).send({ data: actionItem });
    }
  );

  // POST /action-items/bulk - Bulk create action items from extraction
  f.post(
    '/action-items/bulk',
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: 'Bulk create action items from meeting note extraction',
        tags: ['action-items'],
        body: bulkCreateActionItemsSchema,
        response: {
          201: bulkCreateResponseSchema,
          400: validationErrorSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const userId = request.user!.id;

      const result = await handler.bulkCreateActionItems(request.body, userId);
      return reply.status(201).send({ data: result });
    }
  );

  // PUT /action-items/:id - Full update action item
  f.put(
    '/action-items/:id',
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: 'Update an existing action item',
        tags: ['action-items'],
        params: idParamSchema,
        body: updateActionItemSchema,
        response: {
          200: z.object({ data: actionItemResponseSchema }),
          400: validationErrorSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request) => {
      const { id } = request.params;
      const userId = request.user!.id;

      const actionItem = await handler.updateActionItem(id, request.body, userId);
      return { data: actionItem };
    }
  );

  // PATCH /action-items/:id/status - Update status only (for drag-drop)
  f.patch(
    '/action-items/:id/status',
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: 'Update action item status (for Kanban drag-drop)',
        tags: ['action-items'],
        params: idParamSchema,
        body: updateStatusSchema,
        response: {
          200: z.object({ data: actionItemResponseSchema }),
          400: validationErrorSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request) => {
      const { id } = request.params;
      const userId = request.user!.id;

      const actionItem = await handler.updateActionItemStatus(id, request.body, userId);
      return { data: actionItem };
    }
  );

  // PATCH /action-items/:id/position - Update position only (for reordering)
  f.patch(
    '/action-items/:id/position',
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: 'Update action item position within column (for reordering)',
        tags: ['action-items'],
        params: idParamSchema,
        body: updatePositionSchema,
        response: {
          200: z.object({ data: actionItemResponseSchema }),
          400: validationErrorSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request) => {
      const { id } = request.params;
      const userId = request.user!.id;

      const actionItem = await handler.updateActionItemPosition(id, request.body, userId);
      return { data: actionItem };
    }
  );

  // DELETE /action-items/:id - Delete action item
  f.delete(
    '/action-items/:id',
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: 'Delete an action item',
        tags: ['action-items'],
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

      await handler.deleteActionItem(id, userId);
      return reply.status(204).send(null);
    }
  );
}
