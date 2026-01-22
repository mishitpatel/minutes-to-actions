/**
 * @deprecated These types are for frontend convenience only and may drift from the API.
 *
 * Source of truth: Zod schemas in apps/api/src/modules/
 *
 * TODO: Generate these from OpenAPI spec instead of maintaining manually.
 */

// User types
export type { User, Session, UserPublic } from './types/user.js';

// Meeting note types
export type {
  MeetingNote,
  CreateMeetingNoteInput,
  UpdateMeetingNoteInput,
} from './types/meeting-note.js';

// Action item types
export type {
  ActionItem,
  ActionItemStatus,
  CreateActionItemInput,
  UpdateActionItemInput,
} from './types/action-item.js';

// Board share types
export type {
  BoardShare,
  CreateBoardShareInput,
  BoardSharePublic,
} from './types/board-share.js';
