import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  setupApp,
  teardownApp,
  cleanupDatabase,
  createTestContext,
  createTestMeetingNote,
  createTestActionItem,
  makeRequest,
  parseBody,
} from './setup.js';
import {
  createMeetingNote,
  createActionItem,
  createActionItemsInAllStatuses,
} from './factories.js';

describe('Action Items API E2E', () => {
  beforeAll(async () => {
    await setupApp();
  });

  afterAll(async () => {
    await teardownApp();
  });

  beforeEach(async () => {
    await cleanupDatabase();
  });

  // ─── GET /api/v1/action-items ──────────────────────────────────────────

  describe('GET /api/v1/action-items', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await makeRequest({
        method: 'GET',
        url: '/api/v1/action-items',
      });

      expect(response.statusCode).toBe(401);
      const body = parseBody<{ error: { code: string } }>(response);
      expect(body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return grouped empty data when no action items exist', async () => {
      const { sessionToken } = await createTestContext();

      const response = await makeRequest({
        method: 'GET',
        url: '/api/v1/action-items',
        sessionToken,
      });

      expect(response.statusCode).toBe(200);
      const body = parseBody<{
        data: { todo: unknown[]; doing: unknown[]; done: unknown[] };
      }>(response);
      expect(body.data.todo).toEqual([]);
      expect(body.data.doing).toEqual([]);
      expect(body.data.done).toEqual([]);
    });

    it('should return grouped action items by default', async () => {
      const { user, sessionToken } = await createTestContext();
      await createActionItemsInAllStatuses(user.id);

      const response = await makeRequest({
        method: 'GET',
        url: '/api/v1/action-items',
        sessionToken,
      });

      expect(response.statusCode).toBe(200);
      const body = parseBody<{
        data: { todo: unknown[]; doing: unknown[]; done: unknown[] };
      }>(response);
      expect(body.data.todo).toHaveLength(2);
      expect(body.data.doing).toHaveLength(1);
      expect(body.data.done).toHaveLength(1);
    });

    it('should return flat list when filtering by status', async () => {
      const { user, sessionToken } = await createTestContext();
      await createActionItemsInAllStatuses(user.id);

      const response = await makeRequest({
        method: 'GET',
        url: '/api/v1/action-items?status=todo',
        sessionToken,
      });

      expect(response.statusCode).toBe(200);
      const body = parseBody<{ data: unknown[] }>(response);
      // When filtering by status, response is a flat array
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data).toHaveLength(2);
    });

    it('should filter by status', async () => {
      const { user, sessionToken } = await createTestContext();
      await createActionItemsInAllStatuses(user.id);

      const response = await makeRequest({
        method: 'GET',
        url: '/api/v1/action-items?status=todo',
        sessionToken,
      });

      expect(response.statusCode).toBe(200);
      const body = parseBody<{ data: { status: string }[] }>(response);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data).toHaveLength(2);
      expect(body.data.every((item) => item.status === 'todo')).toBe(true);
    });

    it('should return only current user\'s action items', async () => {
      const { user, sessionToken } = await createTestContext({ email: 'usera@test.com' });
      const { user: otherUser } = await createTestContext({ email: 'userb@test.com' });

      await createActionItem(user.id, { title: 'My Item' });
      await createActionItem(otherUser.id, { title: 'Other Item' });

      const response = await makeRequest({
        method: 'GET',
        url: '/api/v1/action-items',
        sessionToken,
      });

      expect(response.statusCode).toBe(200);
      const body = parseBody<{
        data: { todo: { title: string }[]; doing: unknown[]; done: unknown[] };
      }>(response);
      expect(body.data.todo).toHaveLength(1);
      expect(body.data.todo[0].title).toBe('My Item');
    });

    it('should include meeting_note info in response', async () => {
      const { user, sessionToken } = await createTestContext();
      const note = await createMeetingNote(user.id, { title: 'Source Note' });
      await createActionItem(user.id, { meetingNoteId: note.id });

      const response = await makeRequest({
        method: 'GET',
        url: '/api/v1/action-items',
        sessionToken,
      });

      expect(response.statusCode).toBe(200);
      const body = parseBody<{
        data: {
          todo: { meeting_note: { id: string; title: string | null } | null }[];
          doing: unknown[];
          done: unknown[];
        };
      }>(response);
      expect(body.data.todo).toHaveLength(1);
      expect(body.data.todo[0].meeting_note).not.toBeNull();
      expect(body.data.todo[0].meeting_note!.title).toBe('Source Note');
    });
  });

  // ─── GET /api/v1/action-items/:id ──────────────────────────────────────

  describe('GET /api/v1/action-items/:id', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await makeRequest({
        method: 'GET',
        url: '/api/v1/action-items/00000000-0000-0000-0000-000000000000',
      });

      expect(response.statusCode).toBe(401);
      const body = parseBody<{ error: { code: string } }>(response);
      expect(body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 400 for invalid UUID', async () => {
      const { sessionToken } = await createTestContext();

      const response = await makeRequest({
        method: 'GET',
        url: '/api/v1/action-items/not-a-uuid',
        sessionToken,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 404 for non-existent action item', async () => {
      const { sessionToken } = await createTestContext();

      const response = await makeRequest({
        method: 'GET',
        url: '/api/v1/action-items/00000000-0000-0000-0000-000000000000',
        sessionToken,
      });

      expect(response.statusCode).toBe(404);
      const body = parseBody<{ error: { code: string } }>(response);
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('should return 404 when accessing another user\'s action item', async () => {
      const { user: userA } = await createTestContext({ email: 'usera@test.com' });
      const item = await createActionItem(userA.id);

      const { sessionToken: tokenB } = await createTestContext({ email: 'userb@test.com' });

      const response = await makeRequest({
        method: 'GET',
        url: `/api/v1/action-items/${item.id}`,
        sessionToken: tokenB,
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return the action item with meeting_note info', async () => {
      const { user, sessionToken } = await createTestContext();
      const note = await createMeetingNote(user.id, { title: 'Source Note' });
      const item = await createActionItem(user.id, {
        title: 'Test Item',
        description: 'Test description',
        priority: 'high',
        meetingNoteId: note.id,
      });

      const response = await makeRequest({
        method: 'GET',
        url: `/api/v1/action-items/${item.id}`,
        sessionToken,
      });

      expect(response.statusCode).toBe(200);
      const body = parseBody<{
        data: {
          id: string;
          title: string;
          description: string | null;
          priority: string;
          status: string;
          due_date: string | null;
          position: number;
          meeting_note_id: string | null;
          meeting_note: { id: string; title: string | null } | null;
          created_at: string;
          updated_at: string;
        };
      }>(response);
      expect(body.data.id).toBe(item.id);
      expect(body.data.title).toBe('Test Item');
      expect(body.data.description).toBe('Test description');
      expect(body.data.priority).toBe('high');
      expect(body.data.status).toBe('todo');
      expect(body.data.meeting_note).not.toBeNull();
      expect(body.data.meeting_note!.id).toBe(note.id);
    });

    it('should return null meeting_note when item has no source note', async () => {
      const { user, sessionToken } = await createTestContext();
      const item = await createActionItem(user.id);

      const response = await makeRequest({
        method: 'GET',
        url: `/api/v1/action-items/${item.id}`,
        sessionToken,
      });

      expect(response.statusCode).toBe(200);
      const body = parseBody<{
        data: { meeting_note: null };
      }>(response);
      expect(body.data.meeting_note).toBeNull();
    });
  });

  // ─── POST /api/v1/action-items ─────────────────────────────────────────

  describe('POST /api/v1/action-items', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await makeRequest({
        method: 'POST',
        url: '/api/v1/action-items',
        body: { title: 'Test' },
      });

      expect(response.statusCode).toBe(401);
      const body = parseBody<{ error: { code: string } }>(response);
      expect(body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 400 when title is missing', async () => {
      const { sessionToken } = await createTestContext();

      const response = await makeRequest({
        method: 'POST',
        url: '/api/v1/action-items',
        sessionToken,
        body: {},
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 when title is empty string', async () => {
      const { sessionToken } = await createTestContext();

      const response = await makeRequest({
        method: 'POST',
        url: '/api/v1/action-items',
        sessionToken,
        body: { title: '' },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should create an action item with defaults', async () => {
      const { sessionToken } = await createTestContext();

      const response = await makeRequest({
        method: 'POST',
        url: '/api/v1/action-items',
        sessionToken,
        body: { title: 'New Task' },
      });

      expect(response.statusCode).toBe(201);
      const body = parseBody<{
        data: {
          id: string;
          title: string;
          description: string | null;
          priority: string;
          status: string;
          due_date: string | null;
          position: number;
          meeting_note_id: string | null;
          created_at: string;
          updated_at: string;
        };
      }>(response);
      expect(body.data.title).toBe('New Task');
      expect(body.data.priority).toBe('medium');
      expect(body.data.status).toBe('todo');
      expect(body.data.description).toBeNull();
      expect(body.data.due_date).toBeNull();
      expect(body.data.meeting_note_id).toBeNull();
      expect(body.data.position).toBe(0);
    });

    it('should create an action item with all fields', async () => {
      const { user, sessionToken } = await createTestContext();
      const note = await createMeetingNote(user.id);

      const response = await makeRequest({
        method: 'POST',
        url: '/api/v1/action-items',
        sessionToken,
        body: {
          title: 'Full Task',
          description: 'Detailed description',
          priority: 'high',
          status: 'doing',
          due_date: '2026-12-31T00:00:00.000Z',
          meeting_note_id: note.id,
        },
      });

      expect(response.statusCode).toBe(201);
      const body = parseBody<{
        data: {
          title: string;
          description: string;
          priority: string;
          status: string;
          due_date: string;
          meeting_note_id: string;
        };
      }>(response);
      expect(body.data.title).toBe('Full Task');
      expect(body.data.description).toBe('Detailed description');
      expect(body.data.priority).toBe('high');
      expect(body.data.status).toBe('doing');
      expect(body.data.due_date).toBeDefined();
      expect(body.data.meeting_note_id).toBe(note.id);
    });

    it('should auto-calculate position within the status column', async () => {
      const { user, sessionToken } = await createTestContext();

      // Create first item
      const res1 = await makeRequest({
        method: 'POST',
        url: '/api/v1/action-items',
        sessionToken,
        body: { title: 'First' },
      });
      const item1 = parseBody<{ data: { position: number } }>(res1);
      expect(item1.data.position).toBe(0);

      // Create second item in same status
      const res2 = await makeRequest({
        method: 'POST',
        url: '/api/v1/action-items',
        sessionToken,
        body: { title: 'Second' },
      });
      const item2 = parseBody<{ data: { position: number } }>(res2);
      expect(item2.data.position).toBe(1);
    });

    it('should return 404 when meeting_note_id belongs to another user', async () => {
      const { user: otherUser } = await createTestContext({ email: 'other@test.com' });
      const otherNote = await createMeetingNote(otherUser.id);

      const { sessionToken } = await createTestContext({ email: 'me@test.com' });

      const response = await makeRequest({
        method: 'POST',
        url: '/api/v1/action-items',
        sessionToken,
        body: { title: 'Linked Task', meeting_note_id: otherNote.id },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  // ─── POST /api/v1/action-items/bulk ────────────────────────────────────

  describe('POST /api/v1/action-items/bulk', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await makeRequest({
        method: 'POST',
        url: '/api/v1/action-items/bulk',
        body: {
          meeting_note_id: '00000000-0000-0000-0000-000000000000',
          items: [{ title: 'Test' }],
        },
      });

      expect(response.statusCode).toBe(401);
      const body = parseBody<{ error: { code: string } }>(response);
      expect(body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 400 when items array is empty', async () => {
      const { user, sessionToken } = await createTestContext();
      const note = await createMeetingNote(user.id);

      const response = await makeRequest({
        method: 'POST',
        url: '/api/v1/action-items/bulk',
        sessionToken,
        body: { meeting_note_id: note.id, items: [] },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 when meeting_note_id is missing', async () => {
      const { sessionToken } = await createTestContext();

      const response = await makeRequest({
        method: 'POST',
        url: '/api/v1/action-items/bulk',
        sessionToken,
        body: { items: [{ title: 'Test' }] },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 404 when meeting note does not exist', async () => {
      const { sessionToken } = await createTestContext();

      const response = await makeRequest({
        method: 'POST',
        url: '/api/v1/action-items/bulk',
        sessionToken,
        body: {
          meeting_note_id: '00000000-0000-0000-0000-000000000000',
          items: [{ title: 'Test' }],
        },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 404 when meeting note belongs to another user', async () => {
      const { user: otherUser } = await createTestContext({ email: 'other@test.com' });
      const otherNote = await createMeetingNote(otherUser.id);

      const { sessionToken } = await createTestContext({ email: 'me@test.com' });

      const response = await makeRequest({
        method: 'POST',
        url: '/api/v1/action-items/bulk',
        sessionToken,
        body: {
          meeting_note_id: otherNote.id,
          items: [{ title: 'Stolen Item' }],
        },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should bulk create action items with sequential positions', async () => {
      const { user, sessionToken } = await createTestContext();
      const note = await createMeetingNote(user.id);

      const response = await makeRequest({
        method: 'POST',
        url: '/api/v1/action-items/bulk',
        sessionToken,
        body: {
          meeting_note_id: note.id,
          items: [
            { title: 'Item 1' },
            { title: 'Item 2', priority: 'high' },
            { title: 'Item 3', description: 'With description' },
          ],
        },
      });

      expect(response.statusCode).toBe(201);
      const body = parseBody<{
        data: {
          created_count: number;
          items: {
            title: string;
            priority: string;
            status: string;
            position: number;
            meeting_note_id: string;
          }[];
        };
      }>(response);
      expect(body.data.created_count).toBe(3);
      expect(body.data.items).toHaveLength(3);
      expect(body.data.items[0].title).toBe('Item 1');
      expect(body.data.items[0].priority).toBe('medium');
      expect(body.data.items[0].status).toBe('todo');
      expect(body.data.items[0].meeting_note_id).toBe(note.id);
      expect(body.data.items[1].priority).toBe('high');
      // Sequential positions
      expect(body.data.items[0].position).toBe(0);
      expect(body.data.items[1].position).toBe(1);
      expect(body.data.items[2].position).toBe(2);
    });
  });

  // ─── PUT /api/v1/action-items/:id ──────────────────────────────────────

  describe('PUT /api/v1/action-items/:id', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await makeRequest({
        method: 'PUT',
        url: '/api/v1/action-items/00000000-0000-0000-0000-000000000000',
        body: { title: 'Updated' },
      });

      expect(response.statusCode).toBe(401);
      const body = parseBody<{ error: { code: string } }>(response);
      expect(body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 400 for invalid UUID', async () => {
      const { sessionToken } = await createTestContext();

      const response = await makeRequest({
        method: 'PUT',
        url: '/api/v1/action-items/not-a-uuid',
        sessionToken,
        body: { title: 'Updated' },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 404 for non-existent action item', async () => {
      const { sessionToken } = await createTestContext();

      const response = await makeRequest({
        method: 'PUT',
        url: '/api/v1/action-items/00000000-0000-0000-0000-000000000000',
        sessionToken,
        body: { title: 'Updated' },
      });

      expect(response.statusCode).toBe(404);
      const body = parseBody<{ error: { code: string } }>(response);
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('should return 404 when updating another user\'s action item', async () => {
      const { user: userA } = await createTestContext({ email: 'usera@test.com' });
      const item = await createActionItem(userA.id);

      const { sessionToken: tokenB } = await createTestContext({ email: 'userb@test.com' });

      const response = await makeRequest({
        method: 'PUT',
        url: `/api/v1/action-items/${item.id}`,
        sessionToken: tokenB,
        body: { title: 'Stolen' },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should update the title', async () => {
      const { user, sessionToken } = await createTestContext();
      const item = await createActionItem(user.id, { title: 'Original' });

      const response = await makeRequest({
        method: 'PUT',
        url: `/api/v1/action-items/${item.id}`,
        sessionToken,
        body: { title: 'Updated Title' },
      });

      expect(response.statusCode).toBe(200);
      const body = parseBody<{ data: { title: string } }>(response);
      expect(body.data.title).toBe('Updated Title');
    });

    it('should update priority and preserve other fields', async () => {
      const { user, sessionToken } = await createTestContext();
      const item = await createActionItem(user.id, {
        title: 'Keep Me',
        priority: 'low',
        description: 'Keep desc',
      });

      const response = await makeRequest({
        method: 'PUT',
        url: `/api/v1/action-items/${item.id}`,
        sessionToken,
        body: { priority: 'high' },
      });

      expect(response.statusCode).toBe(200);
      const body = parseBody<{
        data: { title: string; priority: string; description: string | null };
      }>(response);
      expect(body.data.priority).toBe('high');
      expect(body.data.title).toBe('Keep Me');
      expect(body.data.description).toBe('Keep desc');
    });

    it('should allow setting description to null', async () => {
      const { user, sessionToken } = await createTestContext();
      const item = await createActionItem(user.id, { description: 'Has description' });

      const response = await makeRequest({
        method: 'PUT',
        url: `/api/v1/action-items/${item.id}`,
        sessionToken,
        body: { description: null },
      });

      expect(response.statusCode).toBe(200);
      const body = parseBody<{ data: { description: string | null } }>(response);
      expect(body.data.description).toBeNull();
    });
  });

  // ─── PATCH /api/v1/action-items/:id/status ─────────────────────────────

  describe('PATCH /api/v1/action-items/:id/status', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await makeRequest({
        method: 'PATCH',
        url: '/api/v1/action-items/00000000-0000-0000-0000-000000000000/status',
        body: { status: 'doing' },
      });

      expect(response.statusCode).toBe(401);
      const body = parseBody<{ error: { code: string } }>(response);
      expect(body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 400 for invalid UUID', async () => {
      const { sessionToken } = await createTestContext();

      const response = await makeRequest({
        method: 'PATCH',
        url: '/api/v1/action-items/not-a-uuid/status',
        sessionToken,
        body: { status: 'doing' },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for invalid status value', async () => {
      const { user, sessionToken } = await createTestContext();
      const item = await createActionItem(user.id);

      const response = await makeRequest({
        method: 'PATCH',
        url: `/api/v1/action-items/${item.id}/status`,
        sessionToken,
        body: { status: 'invalid_status' },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 404 for non-existent action item', async () => {
      const { sessionToken } = await createTestContext();

      const response = await makeRequest({
        method: 'PATCH',
        url: '/api/v1/action-items/00000000-0000-0000-0000-000000000000/status',
        sessionToken,
        body: { status: 'doing' },
      });

      expect(response.statusCode).toBe(404);
      const body = parseBody<{ error: { code: string } }>(response);
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('should return 404 when updating another user\'s action item status', async () => {
      const { user: userA } = await createTestContext({ email: 'usera@test.com' });
      const item = await createActionItem(userA.id);

      const { sessionToken: tokenB } = await createTestContext({ email: 'userb@test.com' });

      const response = await makeRequest({
        method: 'PATCH',
        url: `/api/v1/action-items/${item.id}/status`,
        sessionToken: tokenB,
        body: { status: 'doing' },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should update status and auto-recalculate position', async () => {
      const { user, sessionToken } = await createTestContext();
      const item = await createActionItem(user.id, { status: 'todo', position: 0 });

      // Create an existing item in the target column
      await createActionItem(user.id, { status: 'doing', position: 0 });

      const response = await makeRequest({
        method: 'PATCH',
        url: `/api/v1/action-items/${item.id}/status`,
        sessionToken,
        body: { status: 'doing' },
      });

      expect(response.statusCode).toBe(200);
      const body = parseBody<{
        data: { status: string; position: number };
      }>(response);
      expect(body.data.status).toBe('doing');
      // Should be placed at the end of the new column
      expect(body.data.position).toBe(1);
    });

    it('should keep same position when status is unchanged', async () => {
      const { user, sessionToken } = await createTestContext();
      const item = await createActionItem(user.id, { status: 'todo', position: 5 });

      const response = await makeRequest({
        method: 'PATCH',
        url: `/api/v1/action-items/${item.id}/status`,
        sessionToken,
        body: { status: 'todo' },
      });

      expect(response.statusCode).toBe(200);
      const body = parseBody<{ data: { position: number } }>(response);
      expect(body.data.position).toBe(5);
    });
  });

  // ─── PATCH /api/v1/action-items/:id/position ───────────────────────────

  describe('PATCH /api/v1/action-items/:id/position', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await makeRequest({
        method: 'PATCH',
        url: '/api/v1/action-items/00000000-0000-0000-0000-000000000000/position',
        body: { position: 0 },
      });

      expect(response.statusCode).toBe(401);
      const body = parseBody<{ error: { code: string } }>(response);
      expect(body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 400 for invalid UUID', async () => {
      const { sessionToken } = await createTestContext();

      const response = await makeRequest({
        method: 'PATCH',
        url: '/api/v1/action-items/not-a-uuid/position',
        sessionToken,
        body: { position: 0 },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for negative position', async () => {
      const { user, sessionToken } = await createTestContext();
      const item = await createActionItem(user.id);

      const response = await makeRequest({
        method: 'PATCH',
        url: `/api/v1/action-items/${item.id}/position`,
        sessionToken,
        body: { position: -1 },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 404 for non-existent action item', async () => {
      const { sessionToken } = await createTestContext();

      const response = await makeRequest({
        method: 'PATCH',
        url: '/api/v1/action-items/00000000-0000-0000-0000-000000000000/position',
        sessionToken,
        body: { position: 0 },
      });

      expect(response.statusCode).toBe(404);
      const body = parseBody<{ error: { code: string } }>(response);
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('should return 404 when updating another user\'s action item position', async () => {
      const { user: userA } = await createTestContext({ email: 'usera@test.com' });
      const item = await createActionItem(userA.id);

      const { sessionToken: tokenB } = await createTestContext({ email: 'userb@test.com' });

      const response = await makeRequest({
        method: 'PATCH',
        url: `/api/v1/action-items/${item.id}/position`,
        sessionToken: tokenB,
        body: { position: 5 },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should update the position', async () => {
      const { user, sessionToken } = await createTestContext();
      const item = await createActionItem(user.id, { position: 0 });

      const response = await makeRequest({
        method: 'PATCH',
        url: `/api/v1/action-items/${item.id}/position`,
        sessionToken,
        body: { position: 3 },
      });

      expect(response.statusCode).toBe(200);
      const body = parseBody<{ data: { position: number } }>(response);
      expect(body.data.position).toBe(3);
    });
  });

  // ─── DELETE /api/v1/action-items/:id ───────────────────────────────────

  describe('DELETE /api/v1/action-items/:id', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await makeRequest({
        method: 'DELETE',
        url: '/api/v1/action-items/00000000-0000-0000-0000-000000000000',
      });

      expect(response.statusCode).toBe(401);
      const body = parseBody<{ error: { code: string } }>(response);
      expect(body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 400 for invalid UUID', async () => {
      const { sessionToken } = await createTestContext();

      const response = await makeRequest({
        method: 'DELETE',
        url: '/api/v1/action-items/not-a-uuid',
        sessionToken,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 404 for non-existent action item', async () => {
      const { sessionToken } = await createTestContext();

      const response = await makeRequest({
        method: 'DELETE',
        url: '/api/v1/action-items/00000000-0000-0000-0000-000000000000',
        sessionToken,
      });

      expect(response.statusCode).toBe(404);
      const body = parseBody<{ error: { code: string } }>(response);
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('should return 404 when deleting another user\'s action item', async () => {
      const { user: userA } = await createTestContext({ email: 'del-usera@test.com', googleId: 'del-google-a' });
      const item = await createActionItem(userA.id);

      const { sessionToken: tokenB } = await createTestContext({ email: 'del-userb@test.com', googleId: 'del-google-b' });

      const response = await makeRequest({
        method: 'DELETE',
        url: `/api/v1/action-items/${item.id}`,
        sessionToken: tokenB,
      });

      expect(response.statusCode).toBe(404);
    });

    it('should delete the action item and return 204', async () => {
      const { user, sessionToken } = await createTestContext();
      const item = await createActionItem(user.id);

      const response = await makeRequest({
        method: 'DELETE',
        url: `/api/v1/action-items/${item.id}`,
        sessionToken,
      });

      expect(response.statusCode).toBe(204);

      // Verify deletion
      const getResponse = await makeRequest({
        method: 'GET',
        url: `/api/v1/action-items/${item.id}`,
        sessionToken,
      });
      expect(getResponse.statusCode).toBe(404);
    });
  });
});
