/**
 * Test Data Factories
 *
 * Generate realistic test data using @faker-js/faker.
 * Factories return plain objects that can be used with Prisma or API requests.
 */

import { faker } from '@faker-js/faker';
import { prisma } from './setup.js';
import { createSession } from '../../apps/api/src/services/session.js';

/**
 * User Factory
 */
export interface UserData {
  email: string;
  name: string;
  googleId: string;
}

export function buildUser(overrides: Partial<UserData> = {}): UserData {
  return {
    email: faker.internet.email(),
    name: faker.person.fullName(),
    googleId: faker.string.uuid(),
    ...overrides,
  };
}

export async function createUser(overrides: Partial<UserData> = {}) {
  const data = buildUser(overrides);
  return prisma.user.create({ data });
}

export async function createUserWithSession(overrides: Partial<UserData> = {}) {
  const user = await createUser(overrides);
  const sessionToken = await createSession(user.id);
  return { user, sessionToken };
}

/**
 * Meeting Note Factory
 */
export interface MeetingNoteData {
  userId: string;
  title: string;
  body: string;
}

export function buildMeetingNote(userId: string, overrides: Partial<Omit<MeetingNoteData, 'userId'>> = {}): MeetingNoteData {
  return {
    userId,
    title: faker.lorem.sentence(),
    body: faker.lorem.paragraphs(3),
    ...overrides,
  };
}

export async function createMeetingNote(userId: string, overrides: Partial<Omit<MeetingNoteData, 'userId'>> = {}) {
  const data = buildMeetingNote(userId, overrides);
  return prisma.meetingNote.create({ data });
}

/**
 * Build meeting note body with realistic action items embedded
 */
export function buildMeetingNoteBodyWithActions(actions: string[]): string {
  const intro = faker.lorem.paragraph();
  const actionLines = actions.map((action) => `- ${action}`).join('\n');
  const closing = faker.lorem.paragraph();

  return `${intro}\n\nAction Items:\n${actionLines}\n\n${closing}`;
}

/**
 * Action Item Factory
 */
export type ActionItemStatus = 'todo' | 'doing' | 'done';

export type ActionItemPriority = 'high' | 'medium' | 'low';

export interface ActionItemData {
  userId: string;
  title: string;
  description: string | null;
  status: ActionItemStatus;
  priority: ActionItemPriority;
  position: number;
  dueDate: Date | null;
  meetingNoteId: string | null;
}

export function buildActionItem(
  userId: string,
  overrides: Partial<Omit<ActionItemData, 'userId'>> = {}
): ActionItemData {
  return {
    userId,
    title: faker.lorem.sentence({ min: 3, max: 8 }),
    description: faker.datatype.boolean() ? faker.lorem.paragraph() : null,
    status: 'todo',
    priority: 'medium',
    position: 0,
    dueDate: faker.datatype.boolean() ? faker.date.future() : null,
    meetingNoteId: null,
    ...overrides,
  };
}

export async function createActionItem(
  userId: string,
  overrides: Partial<Omit<ActionItemData, 'userId'>> = {}
) {
  const data = buildActionItem(userId, overrides);
  return prisma.actionItem.create({ data });
}

/**
 * Create multiple action items across different statuses
 */
export async function createActionItemsInAllStatuses(userId: string) {
  const items = await Promise.all([
    createActionItem(userId, { status: 'todo', position: 0, title: 'Todo Item 1' }),
    createActionItem(userId, { status: 'todo', position: 1, title: 'Todo Item 2' }),
    createActionItem(userId, { status: 'doing', position: 0, title: 'In Progress Item' }),
    createActionItem(userId, { status: 'done', position: 0, title: 'Completed Item' }),
  ]);

  return {
    todo: items.filter((item) => item.status === 'todo'),
    doing: items.filter((item) => item.status === 'doing'),
    done: items.filter((item) => item.status === 'done'),
    all: items,
  };
}

/**
 * Seed helpers for complex test scenarios
 */
export async function seedCompleteUserData() {
  const { user, sessionToken } = await createUserWithSession();

  // Create multiple meeting notes
  const notes = await Promise.all([
    createMeetingNote(user.id, {
      title: 'Sprint Planning',
      body: buildMeetingNoteBodyWithActions([
        'John to update documentation',
        'Sarah to review PR #123',
        'Team to discuss architecture next week',
      ]),
    }),
    createMeetingNote(user.id, {
      title: 'Daily Standup',
      body: 'Quick sync - no blockers reported.',
    }),
  ]);

  // Create action items (some linked to notes)
  const actionItems = await Promise.all([
    createActionItem(user.id, {
      title: 'Update documentation',
      priority: 'high',
      status: 'todo',
      meetingNoteId: notes[0]?.id,
    }),
    createActionItem(user.id, {
      title: 'Review PR #123',
      priority: 'medium',
      status: 'doing',
      meetingNoteId: notes[0]?.id,
    }),
    createActionItem(user.id, {
      title: 'Fix login bug',
      status: 'done',
    }),
  ]);

  return {
    user,
    sessionToken,
    notes,
    actionItems,
  };
}

/**
 * Batch creation utilities
 */
export async function createManyActionItems(
  userId: string,
  count: number,
  overrides: Partial<Omit<ActionItemData, 'userId'>> = {}
) {
  const items = Array.from({ length: count }, (_: unknown, i: number) =>
    buildActionItem(userId, {
      position: i,
      title: `Action Item ${i + 1}`,
      ...overrides,
    })
  );

  return prisma.actionItem.createMany({ data: items });
}

export async function createManyMeetingNotes(
  userId: string,
  count: number,
  overrides: Partial<Omit<MeetingNoteData, 'userId'>> = {}
) {
  const notes = Array.from({ length: count }, (_: unknown, _i: number) => buildMeetingNote(userId, overrides));

  return prisma.meetingNote.createMany({ data: notes });
}
