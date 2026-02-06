import { prisma } from '../../lib/prisma.js';
import { NotFoundError } from '../../utils/errors.js';
import { extractActionItems } from '../../services/claude.js';
import type { CreateMeetingNoteInput, UpdateMeetingNoteInput, MeetingNoteResponse, MeetingNoteWithActions } from './meeting-notes.schemas.js';

// Response transformer
function toMeetingNoteResponse(note: {
  id: string;
  title: string | null;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}): MeetingNoteResponse {
  return {
    id: note.id,
    title: note.title,
    body: note.body,
    created_at: note.createdAt.toISOString(),
    updated_at: note.updatedAt.toISOString(),
  };
}

export interface ListMeetingNotesParams {
  userId: string;
  page: number;
  limit: number;
}

export interface ListMeetingNotesResult {
  data: MeetingNoteResponse[];
  pagination: {
    page: number;
    limit: number;
    total_items: number;
    total_pages: number;
    has_next_page: boolean;
    has_prev_page: boolean;
  };
}

export async function listMeetingNotes(params: ListMeetingNotesParams): Promise<ListMeetingNotesResult> {
  const { userId, page, limit } = params;
  const skip = (page - 1) * limit;

  const [notes, totalItems] = await Promise.all([
    prisma.meetingNote.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.meetingNote.count({ where: { userId } }),
  ]);

  const totalPages = Math.ceil(totalItems / limit);

  return {
    data: notes.map(toMeetingNoteResponse),
    pagination: {
      page,
      limit,
      total_items: totalItems,
      total_pages: totalPages,
      has_next_page: page < totalPages,
      has_prev_page: page > 1,
    },
  };
}

export async function getMeetingNoteById(id: string, userId: string): Promise<MeetingNoteWithActions> {
  const note = await prisma.meetingNote.findUnique({
    where: { id },
  });

  if (!note) {
    throw new NotFoundError('Meeting note not found');
  }

  // Authorization check - returns 404 to prevent information disclosure
  if (note.userId !== userId) {
    throw new NotFoundError('Meeting note not found');
  }

  // Note: action_items will be populated once ActionItem model is added (M3)
  return {
    ...toMeetingNoteResponse(note),
    action_items: [],
  };
}

export async function createMeetingNote(input: CreateMeetingNoteInput, userId: string): Promise<MeetingNoteResponse> {
  const note = await prisma.meetingNote.create({
    data: {
      userId,
      title: input.title || null,
      body: input.body,
    },
  });

  return toMeetingNoteResponse(note);
}

export async function updateMeetingNote(
  id: string,
  input: UpdateMeetingNoteInput,
  userId: string
): Promise<MeetingNoteResponse> {
  // Check note exists and user owns it
  const existingNote = await prisma.meetingNote.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!existingNote) {
    throw new NotFoundError('Meeting note not found');
  }

  if (existingNote.userId !== userId) {
    throw new NotFoundError('Meeting note not found');
  }

  // Build update data (only include fields that were provided)
  const updateData: { title?: string | null; body?: string } = {};
  if (input.title !== undefined) updateData.title = input.title;
  if (input.body !== undefined) updateData.body = input.body;

  const note = await prisma.meetingNote.update({
    where: { id },
    data: updateData,
  });

  return toMeetingNoteResponse(note);
}

export async function deleteMeetingNote(id: string, userId: string): Promise<void> {
  // Check note exists and user owns it
  // Note: Returns 404 for both "not found" and "unauthorized" to prevent information disclosure
  const existingNote = await prisma.meetingNote.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!existingNote) {
    throw new NotFoundError('Meeting note not found');
  }

  if (existingNote.userId !== userId) {
    throw new NotFoundError('Meeting note not found');
  }

  // Delete the note (action items become orphaned via SET NULL)
  await prisma.meetingNote.delete({ where: { id } });
}

export async function extractActionItemsFromNote(noteId: string, userId: string) {
  const note = await getMeetingNoteById(noteId, userId);
  const result = await extractActionItems(note.body);

  return {
    action_items: result.action_items,
    confidence: result.confidence,
    message: result.action_items.length === 0
      ? 'No action items found in this meeting note.'
      : null,
  };
}
