import { prisma } from '../../lib/prisma.js';
import { NotFoundError } from '../../utils/errors.js';
import { Priority, Status } from '@prisma/client';
import type {
  CreateActionItemInput,
  BulkCreateActionItemsInput,
  UpdateActionItemInput,
  UpdateStatusInput,
  UpdatePositionInput,
  ListQueryInput,
  ActionItemResponse,
  ActionItemWithSource,
  GroupedActionItems,
  Status as StatusType,
} from './action-items.schemas.js';

// Response transformer
function toActionItemResponse(item: {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  dueDate: Date | null;
  position: number;
  meetingNoteId: string | null;
  createdAt: Date;
  updatedAt: Date;
}): ActionItemResponse {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    priority: item.priority as ActionItemResponse['priority'],
    status: item.status as ActionItemResponse['status'],
    due_date: item.dueDate ? item.dueDate.toISOString() : null,
    position: item.position,
    meeting_note_id: item.meetingNoteId,
    created_at: item.createdAt.toISOString(),
    updated_at: item.updatedAt.toISOString(),
  };
}

// Helper to verify ownership (returns 404 to prevent info disclosure)
async function verifyOwnership(id: string, userId: string): Promise<{
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  dueDate: Date | null;
  position: number;
  meetingNoteId: string | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}> {
  const item = await prisma.actionItem.findUnique({
    where: { id },
  });

  if (!item) {
    throw new NotFoundError('Action item not found');
  }

  if (item.userId !== userId) {
    throw new NotFoundError('Action item not found');
  }

  return item;
}

export interface ListActionItemsResult {
  data: ActionItemWithSource[] | GroupedActionItems;
}

export async function listActionItems(
  userId: string,
  params: ListQueryInput
): Promise<ListActionItemsResult> {
  const { status, grouped } = params;

  const where: { userId: string; status?: StatusType } = { userId };
  if (status) {
    where.status = status;
  }

  const items = await prisma.actionItem.findMany({
    where,
    orderBy: [{ status: 'asc' }, { position: 'asc' }, { createdAt: 'desc' }],
    include: {
      meetingNote: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  const transformedItems: ActionItemWithSource[] = items.map((item) => ({
    ...toActionItemResponse(item),
    meeting_note: item.meetingNote
      ? { id: item.meetingNote.id, title: item.meetingNote.title }
      : null,
  }));

  if (grouped && !status) {
    // Group by status
    const groupedItems: GroupedActionItems = {
      todo: transformedItems.filter((item) => item.status === 'todo'),
      doing: transformedItems.filter((item) => item.status === 'doing'),
      done: transformedItems.filter((item) => item.status === 'done'),
    };
    return { data: groupedItems };
  }

  return { data: transformedItems };
}

export async function getActionItemById(
  id: string,
  userId: string
): Promise<ActionItemWithSource> {
  const item = await prisma.actionItem.findUnique({
    where: { id },
    include: {
      meetingNote: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  if (!item) {
    throw new NotFoundError('Action item not found');
  }

  if (item.userId !== userId) {
    throw new NotFoundError('Action item not found');
  }

  return {
    ...toActionItemResponse(item),
    meeting_note: item.meetingNote
      ? {
          id: item.meetingNote.id,
          title: item.meetingNote.title,
        }
      : null,
  };
}

export async function createActionItem(
  input: CreateActionItemInput,
  userId: string
): Promise<ActionItemResponse> {
  // If meeting_note_id is provided, verify it exists and belongs to user
  if (input.meeting_note_id) {
    const meetingNote = await prisma.meetingNote.findUnique({
      where: { id: input.meeting_note_id },
      select: { userId: true },
    });

    if (!meetingNote || meetingNote.userId !== userId) {
      throw new NotFoundError('Meeting note not found');
    }
  }

  // Get max position for the status column
  const maxPositionResult = await prisma.actionItem.aggregate({
    where: { userId, status: input.status || 'todo' },
    _max: { position: true },
  });
  const nextPosition = (maxPositionResult._max.position ?? -1) + 1;

  const item = await prisma.actionItem.create({
    data: {
      userId,
      meetingNoteId: input.meeting_note_id || null,
      title: input.title,
      description: input.description || null,
      priority: input.priority || 'medium',
      status: input.status || 'todo',
      dueDate: input.due_date ? new Date(input.due_date) : null,
      position: nextPosition,
    },
  });

  return toActionItemResponse(item);
}

export interface BulkCreateResult {
  created_count: number;
  items: ActionItemResponse[];
}

export async function bulkCreateActionItems(
  input: BulkCreateActionItemsInput,
  userId: string
): Promise<BulkCreateResult> {
  // Verify meeting note exists and belongs to user
  const meetingNote = await prisma.meetingNote.findUnique({
    where: { id: input.meeting_note_id },
    select: { userId: true },
  });

  if (!meetingNote || meetingNote.userId !== userId) {
    throw new NotFoundError('Meeting note not found');
  }

  // Get max position for todo status
  const maxPositionResult = await prisma.actionItem.aggregate({
    where: { userId, status: 'todo' },
    _max: { position: true },
  });
  let nextPosition = (maxPositionResult._max.position ?? -1) + 1;

  // Create items
  const createdItems: ActionItemResponse[] = [];

  for (const itemInput of input.items) {
    const item = await prisma.actionItem.create({
      data: {
        userId,
        meetingNoteId: input.meeting_note_id,
        title: itemInput.title,
        description: itemInput.description || null,
        priority: itemInput.priority || 'medium',
        status: itemInput.status || 'todo',
        dueDate: itemInput.due_date ? new Date(itemInput.due_date) : null,
        position: nextPosition++,
      },
    });
    createdItems.push(toActionItemResponse(item));
  }

  return {
    created_count: createdItems.length,
    items: createdItems,
  };
}

export async function updateActionItem(
  id: string,
  input: UpdateActionItemInput,
  userId: string
): Promise<ActionItemResponse> {
  await verifyOwnership(id, userId);

  // Build update data (only include fields that were provided)
  const updateData: {
    title?: string;
    description?: string | null;
    priority?: Priority;
    status?: Status;
    dueDate?: Date | null;
  } = {};

  if (input.title !== undefined) updateData.title = input.title;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.priority !== undefined) updateData.priority = input.priority as Priority;
  if (input.status !== undefined) updateData.status = input.status as Status;
  if (input.due_date !== undefined) {
    updateData.dueDate = input.due_date ? new Date(input.due_date) : null;
  }

  const item = await prisma.actionItem.update({
    where: { id },
    data: updateData,
  });

  return toActionItemResponse(item);
}

export async function updateActionItemStatus(
  id: string,
  input: UpdateStatusInput,
  userId: string
): Promise<ActionItemResponse> {
  const existingItem = await verifyOwnership(id, userId);

  // If status is changing, update position to end of new column
  let newPosition = existingItem.position;
  if (existingItem.status !== input.status) {
    const maxPositionResult = await prisma.actionItem.aggregate({
      where: { userId, status: input.status },
      _max: { position: true },
    });
    newPosition = (maxPositionResult._max.position ?? -1) + 1;
  }

  const item = await prisma.actionItem.update({
    where: { id },
    data: {
      status: input.status,
      position: newPosition,
    },
  });

  return toActionItemResponse(item);
}

export async function updateActionItemPosition(
  id: string,
  input: UpdatePositionInput,
  userId: string
): Promise<ActionItemResponse> {
  await verifyOwnership(id, userId);

  const item = await prisma.actionItem.update({
    where: { id },
    data: {
      position: input.position,
    },
  });

  return toActionItemResponse(item);
}

export async function deleteActionItem(id: string, userId: string): Promise<void> {
  await verifyOwnership(id, userId);

  await prisma.actionItem.delete({ where: { id } });
}
