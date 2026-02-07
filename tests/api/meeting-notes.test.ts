import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import {
  setupApp,
  teardownApp,
  cleanupDatabase,
  createTestContext,
  makeRequest,
  parseBody,
} from './setup.js';
import { createMeetingNote, createManyMeetingNotes } from './factories.js';
import { ExtractionError, RateLimitError } from '../../apps/api/src/utils/errors.js';

// Mock the Claude service - vi.hoisted ensures the fn is available when vi.mock is hoisted
const { mockExtractActionItems, mockGenerateSampleMeetingNotes } = vi.hoisted(() => ({
  mockExtractActionItems: vi.fn(),
  mockGenerateSampleMeetingNotes: vi.fn(),
}));
vi.mock('../../apps/api/src/services/claude.js', () => ({
  extractActionItems: mockExtractActionItems,
  generateSampleMeetingNotes: mockGenerateSampleMeetingNotes,
}));

describe('Meeting Notes API E2E', () => {
  beforeAll(async () => {
    await setupApp();
  });

  afterAll(async () => {
    await teardownApp();
  });

  beforeEach(async () => {
    await cleanupDatabase();
  });

  // ─── GET /api/v1/meeting-notes ─────────────────────────────────────────

  describe('GET /api/v1/meeting-notes', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await makeRequest({
        method: 'GET',
        url: '/api/v1/meeting-notes',
      });

      expect(response.statusCode).toBe(401);
      const body = parseBody<{ error: { code: string } }>(response);
      expect(body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return empty array when no meeting notes exist', async () => {
      const { sessionToken } = await createTestContext();

      const response = await makeRequest({
        method: 'GET',
        url: '/api/v1/meeting-notes',
        sessionToken,
      });

      expect(response.statusCode).toBe(200);
      const body = parseBody<{
        data: unknown[];
        pagination: { total_items: number };
      }>(response);
      expect(body.data).toEqual([]);
      expect(body.pagination.total_items).toBe(0);
    });

    it('should return only current user\'s meeting notes', async () => {
      const { user, sessionToken } = await createTestContext({ email: 'usera@test.com' });
      const { user: otherUser } = await createTestContext({ email: 'userb@test.com' });

      await createMeetingNote(user.id, { title: 'My Note' });
      await createMeetingNote(otherUser.id, { title: 'Other Note' });

      const response = await makeRequest({
        method: 'GET',
        url: '/api/v1/meeting-notes',
        sessionToken,
      });

      expect(response.statusCode).toBe(200);
      const body = parseBody<{ data: { title: string | null }[] }>(response);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].title).toBe('My Note');
    });

    it('should return correct pagination defaults', async () => {
      const { sessionToken } = await createTestContext();

      const response = await makeRequest({
        method: 'GET',
        url: '/api/v1/meeting-notes',
        sessionToken,
      });

      expect(response.statusCode).toBe(200);
      const body = parseBody<{
        pagination: {
          page: number;
          limit: number;
          total_items: number;
          total_pages: number;
          has_next_page: boolean;
          has_prev_page: boolean;
        };
      }>(response);
      expect(body.pagination.page).toBe(1);
      expect(body.pagination.limit).toBe(20);
      expect(body.pagination.has_next_page).toBe(false);
      expect(body.pagination.has_prev_page).toBe(false);
    });

    it('should support pagination', async () => {
      const { user, sessionToken } = await createTestContext();
      await createManyMeetingNotes(user.id, 25);

      const response = await makeRequest({
        method: 'GET',
        url: '/api/v1/meeting-notes?page=1&limit=10',
        sessionToken,
      });

      expect(response.statusCode).toBe(200);
      const body = parseBody<{
        data: unknown[];
        pagination: {
          page: number;
          limit: number;
          total_items: number;
          total_pages: number;
          has_next_page: boolean;
          has_prev_page: boolean;
        };
      }>(response);
      expect(body.data).toHaveLength(10);
      expect(body.pagination.total_items).toBe(25);
      expect(body.pagination.total_pages).toBe(3);
      expect(body.pagination.has_next_page).toBe(true);
      expect(body.pagination.has_prev_page).toBe(false);
    });

    it('should return correct response shape', async () => {
      const { user, sessionToken } = await createTestContext();
      await createMeetingNote(user.id, { title: 'Shape Test', body: 'Test body' });

      const response = await makeRequest({
        method: 'GET',
        url: '/api/v1/meeting-notes',
        sessionToken,
      });

      expect(response.statusCode).toBe(200);
      const body = parseBody<{
        data: {
          id: string;
          title: string | null;
          body: string;
          created_at: string;
          updated_at: string;
        }[];
      }>(response);
      const note = body.data[0];
      expect(note.id).toBeDefined();
      expect(note.title).toBe('Shape Test');
      expect(note.body).toBe('Test body');
      expect(note.created_at).toBeDefined();
      expect(note.updated_at).toBeDefined();
    });
  });

  // ─── GET /api/v1/meeting-notes/:id ─────────────────────────────────────

  describe('GET /api/v1/meeting-notes/:id', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await makeRequest({
        method: 'GET',
        url: '/api/v1/meeting-notes/00000000-0000-0000-0000-000000000000',
      });

      expect(response.statusCode).toBe(401);
      const body = parseBody<{ error: { code: string } }>(response);
      expect(body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 400 for invalid UUID', async () => {
      const { sessionToken } = await createTestContext();

      const response = await makeRequest({
        method: 'GET',
        url: '/api/v1/meeting-notes/not-a-uuid',
        sessionToken,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 404 for non-existent meeting note', async () => {
      const { sessionToken } = await createTestContext();

      const response = await makeRequest({
        method: 'GET',
        url: '/api/v1/meeting-notes/00000000-0000-0000-0000-000000000000',
        sessionToken,
      });

      expect(response.statusCode).toBe(404);
      const body = parseBody<{ error: { code: string } }>(response);
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('should return 404 when accessing another user\'s meeting note', async () => {
      const { user: userA } = await createTestContext({ email: 'usera@test.com' });
      const note = await createMeetingNote(userA.id);

      const { sessionToken: tokenB } = await createTestContext({ email: 'userb@test.com' });

      const response = await makeRequest({
        method: 'GET',
        url: `/api/v1/meeting-notes/${note.id}`,
        sessionToken: tokenB,
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return the meeting note with action_items array', async () => {
      const { user, sessionToken } = await createTestContext();
      const note = await createMeetingNote(user.id, { title: 'Test Note', body: 'Note body' });

      const response = await makeRequest({
        method: 'GET',
        url: `/api/v1/meeting-notes/${note.id}`,
        sessionToken,
      });

      expect(response.statusCode).toBe(200);
      const body = parseBody<{
        data: {
          id: string;
          title: string | null;
          body: string;
          created_at: string;
          updated_at: string;
          action_items: unknown[];
        };
      }>(response);
      expect(body.data.id).toBe(note.id);
      expect(body.data.title).toBe('Test Note');
      expect(body.data.body).toBe('Note body');
      expect(body.data.action_items).toBeDefined();
      expect(Array.isArray(body.data.action_items)).toBe(true);
    });
  });

  // ─── POST /api/v1/meeting-notes ────────────────────────────────────────

  describe('POST /api/v1/meeting-notes', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await makeRequest({
        method: 'POST',
        url: '/api/v1/meeting-notes',
        body: { body: 'Test body' },
      });

      expect(response.statusCode).toBe(401);
      const body = parseBody<{ error: { code: string } }>(response);
      expect(body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 400 when body is missing', async () => {
      const { sessionToken } = await createTestContext();

      const response = await makeRequest({
        method: 'POST',
        url: '/api/v1/meeting-notes',
        sessionToken,
        body: {},
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 when body is empty string', async () => {
      const { sessionToken } = await createTestContext();

      const response = await makeRequest({
        method: 'POST',
        url: '/api/v1/meeting-notes',
        sessionToken,
        body: { body: '' },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should create a meeting note with title', async () => {
      const { sessionToken } = await createTestContext();

      const response = await makeRequest({
        method: 'POST',
        url: '/api/v1/meeting-notes',
        sessionToken,
        body: { title: 'Sprint Planning', body: 'Discussion about sprint goals' },
      });

      expect(response.statusCode).toBe(201);
      const body = parseBody<{
        data: {
          id: string;
          title: string | null;
          body: string;
          created_at: string;
          updated_at: string;
        };
      }>(response);
      expect(body.data.id).toBeDefined();
      expect(body.data.title).toBe('Sprint Planning');
      expect(body.data.body).toBe('Discussion about sprint goals');
    });

    it('should create a meeting note without title (defaults to null)', async () => {
      const { sessionToken } = await createTestContext();

      const response = await makeRequest({
        method: 'POST',
        url: '/api/v1/meeting-notes',
        sessionToken,
        body: { body: 'No title meeting notes' },
      });

      expect(response.statusCode).toBe(201);
      const body = parseBody<{ data: { title: string | null } }>(response);
      expect(body.data.title).toBeNull();
    });
  });

  // ─── PUT /api/v1/meeting-notes/:id ─────────────────────────────────────

  describe('PUT /api/v1/meeting-notes/:id', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await makeRequest({
        method: 'PUT',
        url: '/api/v1/meeting-notes/00000000-0000-0000-0000-000000000000',
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
        url: '/api/v1/meeting-notes/not-a-uuid',
        sessionToken,
        body: { title: 'Updated' },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 404 for non-existent meeting note', async () => {
      const { sessionToken } = await createTestContext();

      const response = await makeRequest({
        method: 'PUT',
        url: '/api/v1/meeting-notes/00000000-0000-0000-0000-000000000000',
        sessionToken,
        body: { title: 'Updated' },
      });

      expect(response.statusCode).toBe(404);
      const body = parseBody<{ error: { code: string } }>(response);
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('should return 404 when updating another user\'s meeting note', async () => {
      const { user: userA } = await createTestContext({ email: 'usera@test.com' });
      const note = await createMeetingNote(userA.id);

      const { sessionToken: tokenB } = await createTestContext({ email: 'userb@test.com' });

      const response = await makeRequest({
        method: 'PUT',
        url: `/api/v1/meeting-notes/${note.id}`,
        sessionToken: tokenB,
        body: { title: 'Stolen Note' },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should update the title', async () => {
      const { user, sessionToken } = await createTestContext();
      const note = await createMeetingNote(user.id, { title: 'Original Title', body: 'Body text' });

      const response = await makeRequest({
        method: 'PUT',
        url: `/api/v1/meeting-notes/${note.id}`,
        sessionToken,
        body: { title: 'Updated Title' },
      });

      expect(response.statusCode).toBe(200);
      const body = parseBody<{ data: { title: string | null; body: string } }>(response);
      expect(body.data.title).toBe('Updated Title');
      expect(body.data.body).toBe('Body text');
    });

    it('should update the body', async () => {
      const { user, sessionToken } = await createTestContext();
      const note = await createMeetingNote(user.id, { title: 'Keep Title', body: 'Original body' });

      const response = await makeRequest({
        method: 'PUT',
        url: `/api/v1/meeting-notes/${note.id}`,
        sessionToken,
        body: { body: 'Updated body' },
      });

      expect(response.statusCode).toBe(200);
      const body = parseBody<{ data: { title: string | null; body: string } }>(response);
      expect(body.data.title).toBe('Keep Title');
      expect(body.data.body).toBe('Updated body');
    });

    it('should allow setting title to null', async () => {
      const { user, sessionToken } = await createTestContext();
      const note = await createMeetingNote(user.id, { title: 'Has Title' });

      const response = await makeRequest({
        method: 'PUT',
        url: `/api/v1/meeting-notes/${note.id}`,
        sessionToken,
        body: { title: null },
      });

      expect(response.statusCode).toBe(200);
      const body = parseBody<{ data: { title: string | null } }>(response);
      expect(body.data.title).toBeNull();
    });
  });

  // ─── DELETE /api/v1/meeting-notes/:id ──────────────────────────────────

  describe('DELETE /api/v1/meeting-notes/:id', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await makeRequest({
        method: 'DELETE',
        url: '/api/v1/meeting-notes/00000000-0000-0000-0000-000000000000',
      });

      expect(response.statusCode).toBe(401);
      const body = parseBody<{ error: { code: string } }>(response);
      expect(body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 400 for invalid UUID', async () => {
      const { sessionToken } = await createTestContext();

      const response = await makeRequest({
        method: 'DELETE',
        url: '/api/v1/meeting-notes/not-a-uuid',
        sessionToken,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 404 for non-existent meeting note', async () => {
      const { sessionToken } = await createTestContext();

      const response = await makeRequest({
        method: 'DELETE',
        url: '/api/v1/meeting-notes/00000000-0000-0000-0000-000000000000',
        sessionToken,
      });

      expect(response.statusCode).toBe(404);
      const body = parseBody<{ error: { code: string } }>(response);
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('should return 404 when deleting another user\'s meeting note', async () => {
      const { user: userA } = await createTestContext({ email: 'usera@test.com' });
      const note = await createMeetingNote(userA.id);

      const { sessionToken: tokenB } = await createTestContext({ email: 'userb@test.com' });

      const response = await makeRequest({
        method: 'DELETE',
        url: `/api/v1/meeting-notes/${note.id}`,
        sessionToken: tokenB,
      });

      expect(response.statusCode).toBe(404);
    });

    it('should delete the meeting note and return 204', async () => {
      const { user, sessionToken } = await createTestContext();
      const note = await createMeetingNote(user.id);

      const response = await makeRequest({
        method: 'DELETE',
        url: `/api/v1/meeting-notes/${note.id}`,
        sessionToken,
      });

      expect(response.statusCode).toBe(204);

      // Verify deletion
      const getResponse = await makeRequest({
        method: 'GET',
        url: `/api/v1/meeting-notes/${note.id}`,
        sessionToken,
      });
      expect(getResponse.statusCode).toBe(404);
    });
  });

  // ─── POST /api/v1/meeting-notes/:id/extract ──────────────────────────

  describe('POST /api/v1/meeting-notes/:id/extract', () => {
    beforeEach(() => {
      mockExtractActionItems.mockReset();
    });

    it('should return 401 when not authenticated', async () => {
      const response = await makeRequest({
        method: 'POST',
        url: '/api/v1/meeting-notes/00000000-0000-0000-0000-000000000000/extract',
      });

      expect(response.statusCode).toBe(401);
      const body = parseBody<{ error: { code: string } }>(response);
      expect(body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 400 for invalid UUID', async () => {
      const { sessionToken } = await createTestContext();

      const response = await makeRequest({
        method: 'POST',
        url: '/api/v1/meeting-notes/not-a-uuid/extract',
        sessionToken,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 404 for non-existent meeting note', async () => {
      const { sessionToken } = await createTestContext();

      const response = await makeRequest({
        method: 'POST',
        url: '/api/v1/meeting-notes/00000000-0000-0000-0000-000000000000/extract',
        sessionToken,
      });

      expect(response.statusCode).toBe(404);
      const body = parseBody<{ error: { code: string } }>(response);
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('should return 404 when extracting from another user\'s note', async () => {
      const { user: userA } = await createTestContext({ email: 'usera@test.com' });
      const note = await createMeetingNote(userA.id);

      const { sessionToken: tokenB } = await createTestContext({ email: 'userb@test.com' });

      const response = await makeRequest({
        method: 'POST',
        url: `/api/v1/meeting-notes/${note.id}/extract`,
        sessionToken: tokenB,
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return extracted action items on success', async () => {
      const { user, sessionToken } = await createTestContext();
      const note = await createMeetingNote(user.id, {
        title: 'Sprint Planning',
        body: 'John to update docs by Friday. Sarah to review PR.',
      });

      mockExtractActionItems.mockResolvedValueOnce({
        action_items: [
          { title: 'Update docs', priority: 'high', due_date: '2026-02-10', description: 'John to update' },
          { title: 'Review PR', priority: 'medium', due_date: null, description: null },
        ],
        confidence: 'high',
      });

      const response = await makeRequest({
        method: 'POST',
        url: `/api/v1/meeting-notes/${note.id}/extract`,
        sessionToken,
      });

      expect(response.statusCode).toBe(200);
      const body = parseBody<{
        data: {
          action_items: { title: string; priority: string; due_date: string | null; description: string | null }[];
          confidence: string;
          message: string | null;
        };
      }>(response);
      expect(body.data.action_items).toHaveLength(2);
      expect(body.data.action_items[0].title).toBe('Update docs');
      expect(body.data.action_items[0].priority).toBe('high');
      expect(body.data.confidence).toBe('high');
      expect(body.data.message).toBeNull();
    });

    it('should return message when no action items found', async () => {
      const { user, sessionToken } = await createTestContext();
      const note = await createMeetingNote(user.id, {
        body: 'General discussion, no action items.',
      });

      mockExtractActionItems.mockResolvedValueOnce({
        action_items: [],
        confidence: 'high',
      });

      const response = await makeRequest({
        method: 'POST',
        url: `/api/v1/meeting-notes/${note.id}/extract`,
        sessionToken,
      });

      expect(response.statusCode).toBe(200);
      const body = parseBody<{
        data: {
          action_items: unknown[];
          confidence: string;
          message: string | null;
        };
      }>(response);
      expect(body.data.action_items).toHaveLength(0);
      expect(body.data.message).toBe('No action items found in this meeting note.');
    });

    it('should return 500 when extraction fails', async () => {
      const { user, sessionToken } = await createTestContext();
      const note = await createMeetingNote(user.id, { body: 'Some meeting content' });

      mockExtractActionItems.mockRejectedValueOnce(new ExtractionError('AI service error'));

      const response = await makeRequest({
        method: 'POST',
        url: `/api/v1/meeting-notes/${note.id}/extract`,
        sessionToken,
      });

      expect(response.statusCode).toBe(500);
      const body = parseBody<{ error: { code: string } }>(response);
      expect(body.error.code).toBe('EXTRACTION_FAILED');
    });

    it('should return 429 when rate limited', async () => {
      const { user, sessionToken } = await createTestContext();
      const note = await createMeetingNote(user.id, { body: 'Some meeting content' });

      mockExtractActionItems.mockRejectedValueOnce(new RateLimitError('Too many requests'));

      const response = await makeRequest({
        method: 'POST',
        url: `/api/v1/meeting-notes/${note.id}/extract`,
        sessionToken,
      });

      expect(response.statusCode).toBe(429);
      const body = parseBody<{ error: { code: string } }>(response);
      expect(body.error.code).toBe('RATE_LIMITED');
    });

    it('should pass note body to the extraction service', async () => {
      const { user, sessionToken } = await createTestContext();
      const noteBody = 'Specific meeting content for extraction test';
      const note = await createMeetingNote(user.id, { body: noteBody });

      mockExtractActionItems.mockResolvedValueOnce({
        action_items: [],
        confidence: 'low',
      });

      await makeRequest({
        method: 'POST',
        url: `/api/v1/meeting-notes/${note.id}/extract`,
        sessionToken,
      });

      expect(mockExtractActionItems).toHaveBeenCalledOnce();
      expect(mockExtractActionItems).toHaveBeenCalledWith(noteBody);
    });
  });

  // ─── POST /api/v1/meeting-notes/generate-sample ──────────────────────

  describe('POST /api/v1/meeting-notes/generate-sample', () => {
    beforeEach(() => {
      mockGenerateSampleMeetingNotes.mockReset();
    });

    it('should return 401 when not authenticated', async () => {
      const response = await makeRequest({
        method: 'POST',
        url: '/api/v1/meeting-notes/generate-sample',
        body: { meeting_type: 'weekly-standup' },
      });

      expect(response.statusCode).toBe(401);
      const body = parseBody<{ error: { code: string } }>(response);
      expect(body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 200 with title and body for weekly-standup', async () => {
      const { sessionToken } = await createTestContext();

      mockGenerateSampleMeetingNotes.mockResolvedValueOnce({
        title: 'Weekly Team Standup - Feb 7',
        body: 'Team discussed progress on Q1 roadmap...',
      });

      const response = await makeRequest({
        method: 'POST',
        url: '/api/v1/meeting-notes/generate-sample',
        sessionToken,
        body: { meeting_type: 'weekly-standup' },
      });

      expect(response.statusCode).toBe(200);
      const body = parseBody<{
        data: { title: string; body: string };
      }>(response);
      expect(body.data.title).toBe('Weekly Team Standup - Feb 7');
      expect(body.data.body).toBe('Team discussed progress on Q1 roadmap...');
      expect(mockGenerateSampleMeetingNotes).toHaveBeenCalledWith('weekly-standup');
    });

    it('should return 200 with title and body for one-on-one', async () => {
      const { sessionToken } = await createTestContext();

      mockGenerateSampleMeetingNotes.mockResolvedValueOnce({
        title: '1:1 Meeting - Manager & Report',
        body: 'Discussed career growth and project status...',
      });

      const response = await makeRequest({
        method: 'POST',
        url: '/api/v1/meeting-notes/generate-sample',
        sessionToken,
        body: { meeting_type: 'one-on-one' },
      });

      expect(response.statusCode).toBe(200);
      const body = parseBody<{
        data: { title: string; body: string };
      }>(response);
      expect(body.data.title).toBe('1:1 Meeting - Manager & Report');
      expect(mockGenerateSampleMeetingNotes).toHaveBeenCalledWith('one-on-one');
    });

    it('should return 200 with title and body for sprint-retro', async () => {
      const { sessionToken } = await createTestContext();

      mockGenerateSampleMeetingNotes.mockResolvedValueOnce({
        title: 'Sprint 12 Retrospective',
        body: 'What went well: deployment pipeline improvements...',
      });

      const response = await makeRequest({
        method: 'POST',
        url: '/api/v1/meeting-notes/generate-sample',
        sessionToken,
        body: { meeting_type: 'sprint-retro' },
      });

      expect(response.statusCode).toBe(200);
      const body = parseBody<{
        data: { title: string; body: string };
      }>(response);
      expect(body.data.title).toBe('Sprint 12 Retrospective');
      expect(mockGenerateSampleMeetingNotes).toHaveBeenCalledWith('sprint-retro');
    });

    it('should return 400 for invalid meeting type', async () => {
      const { sessionToken } = await createTestContext();

      const response = await makeRequest({
        method: 'POST',
        url: '/api/v1/meeting-notes/generate-sample',
        sessionToken,
        body: { meeting_type: 'invalid-type' },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 429 when rate limited', async () => {
      const { sessionToken } = await createTestContext();

      mockGenerateSampleMeetingNotes.mockRejectedValueOnce(
        new RateLimitError('Too many requests')
      );

      const response = await makeRequest({
        method: 'POST',
        url: '/api/v1/meeting-notes/generate-sample',
        sessionToken,
        body: { meeting_type: 'weekly-standup' },
      });

      expect(response.statusCode).toBe(429);
      const body = parseBody<{ error: { code: string } }>(response);
      expect(body.error.code).toBe('RATE_LIMITED');
    });

    it('should return 500 on generation failure', async () => {
      const { sessionToken } = await createTestContext();

      mockGenerateSampleMeetingNotes.mockRejectedValueOnce(
        new ExtractionError('AI service error')
      );

      const response = await makeRequest({
        method: 'POST',
        url: '/api/v1/meeting-notes/generate-sample',
        sessionToken,
        body: { meeting_type: 'weekly-standup' },
      });

      expect(response.statusCode).toBe(500);
      const body = parseBody<{ error: { code: string } }>(response);
      expect(body.error.code).toBe('EXTRACTION_FAILED');
    });
  });
});
