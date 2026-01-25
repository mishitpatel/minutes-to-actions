# Project Status

> Last Updated: 2026-01-23
> Updated By: Claude Code

## Current Position

**Phase:** 1 (MVP)
**Milestone:** M3 - Action Items & Kanban Board
**Task:** 3.7 - Manual Action Item Creation
**Status:** Not Started

→ See `project-plan.md` for full task details and subtasks

## Blockers

| Blocker | Impact | Waiting On | Since |
|---------|--------|------------|-------|
| (none currently) | | | |

## Session Context

### Current Task Reference
- **Location:** `project-plan.md` → Milestone 3 → Task 3.7
- **Files to modify:** `apps/web/src/components/`, `apps/web/src/pages/BoardPage.tsx`
- **Reference docs:** `docs/guidelines/frontend_guidelines.md`, `docs/engineering/api-spec.md`

### Recent Decisions
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-01-20 | Prisma for ORM | Type safety, migrations |
| 2026-01-20 | Google OAuth only | Simpler MVP, no password management |
| 2026-01-20 | devops/ folder | Separate operational from state docs |

### Session Log
**2026-01-23 - Task 3.6 Complete**
- Created `apps/web/src/components/ActionItemDetailModal.tsx`
- View mode: displays title, priority, status, due date, description, source note, timestamps
- Edit mode: form with validation (title required), priority/status dropdowns, date picker
- Delete with confirmation dialog (reuses ConfirmDialog)
- Integrated with BoardPage via card click handler
- PR #3 updated to include Task 3.6
- Next: Start Task 3.7 - Manual Action Item Creation

**2026-01-23 - Task 3.5 Complete**
- Installed @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities
- Created `apps/web/src/components/DraggableActionItemCard.tsx` - Sortable wrapper using useSortable
- Updated `apps/web/src/components/KanbanColumn.tsx` - Added useDroppable and SortableContext
- Updated `apps/web/src/pages/BoardPage.tsx` - DndContext with sensors, drag overlay, and handlers
- Updated `apps/web/src/services/action-items.service.ts` - Added updatePosition and moveItem methods
- Updated `apps/web/src/hooks/useActionItems.ts` - Added useMoveActionItem with optimistic updates
- Features: drag cards between columns, visual feedback (blue highlight on drop zones), drag overlay with rotation
- Optimistic updates with rollback on error
- Keyboard navigation support (tab, space/enter to pick up, arrows to move)
- Next: Start Task 3.6 - Action Item Detail/Edit Modal

**2026-01-23 - Task 3.4 Complete**
- Created `apps/web/src/components/ActionItemCard.tsx` - Full-featured action item card
- Features: title with strikethrough when done, color-coded priority badge, due date with overdue indicator
- Source note link (navigates to note, shows "Note deleted" if source deleted)
- "Mark done" checkbox for quick completion (green checkmark when done)
- "Move to..." dropdown menu for status changes
- Overdue items have red border and background highlight
- Updated `KanbanColumn.tsx` to use new ActionItemCard component
- Wired up `BoardPage.tsx` with status change handler using `useUpdateActionItemStatus`
- Next: Start Task 3.5 - Drag and Drop Functionality

**2026-01-22 - Task 6.1 Complete (moved earlier)**
- Created AppLayout and Sidebar components in `apps/web/src/components/layouts/`
- Implemented nested routing in App.tsx with AppLayout wrapper
- Removed duplicate headers from MeetingNotesPage, NewNotePage, NoteDetailPage, BoardPage
- Added mobile responsive hamburger menu (Task 6.2 partial)
- Navigation: Meeting Notes, Action Board, Share Board (placeholder)
- User section with avatar, name, and logout button
- Next: Start Task 3.4 - Action Item Card Component

**2026-01-22 - Task 3.3 Complete**
- Created `apps/web/src/pages/BoardPage.tsx` - Kanban board with 3 columns
- Created `apps/web/src/components/KanbanColumn.tsx` - Column component with item count
- Created `apps/web/src/services/action-items.service.ts` - API client for action items
- Created `apps/web/src/hooks/useActionItems.ts` - TanStack Query hooks
- Added `/board` route to App.tsx
- Features: 3-column layout (To Do, Doing, Done), empty state placeholders, "Add action-item" button
- Next: Start Task 3.4 - Action Item Card Component

**2026-01-21 - Task 3.2 Complete**
- Created `action-items` module (schemas, handler, routes, tests)
- 8 API endpoints implemented: list, get, create, bulk create, update, status update, position update, delete
- 41 tests passing with full coverage
- Fixed pre-existing helmet import lint issue
- Next: Start Task 3.3 - Kanban Board Layout (Frontend)

**2026-01-21 - Task 3.1 Complete**
- Created `Priority` enum (high, medium, low) and `Status` enum (todo, doing, done)
- Added `ActionItem` model to Prisma schema with all required fields
- Migration `20260122040056_add_action_items` created and applied
- All indexes added: user_id, meeting_note_id, user_status composite, board_order composite
- Foreign keys: user_id (CASCADE), meeting_note_id (SET NULL)
- Next: Start Task 3.2 - Action Items API Endpoints

**2026-01-21 - Milestone 2 Complete**
- Created `apps/web/src/pages/NoteDetailPage.tsx` - View/edit note with full CRUD
- Created `apps/web/src/components/ConfirmDialog.tsx` - Reusable confirmation modal
- Updated `apps/web/src/App.tsx` - Replaced placeholder, removed unused PlaceholderPage
- Features: view mode, inline edit mode, delete with confirmation, 404 handling
- Placeholder for "Extract Action Items" button ready for M4
- **Milestone 2 (Meeting Notes Module) is now complete**
- Next: Start M3 Task 3.1 - Action Items Database Migration

**2026-01-21 - Task 2.4 Complete**
- Created `apps/web/src/components/NoteEditor.tsx` - Reusable editor with title/body fields
- Created `apps/web/src/pages/NewNotePage.tsx` - Create note page
- Updated `apps/web/src/App.tsx` - Replaced placeholder with NewNotePage
- Features: validation (body required), create/edit mode support, loading state, navigation on success
- Next: Start Task 2.5 - Note Detail View

**2026-01-21 - Codebase Cleanup**
- Added deprecation note to `packages/shared/src/index.ts`
- Clarified that API module Zod schemas are the source of truth
- `packages/shared` kept as placeholder for future OpenAPI type generation
- Next: Continue Task 2.4 - Note Editor Component

**2026-01-21 - Task 2.3 Complete**
- Created `apps/web/src/services/meeting-notes.service.ts` - API client for CRUD operations
- Created `apps/web/src/hooks/useMeetingNotes.ts` - TanStack Query hooks
- Created `apps/web/src/components/NoteCard.tsx` - Note list item card
- Created `apps/web/src/components/EmptyState.tsx` - Reusable empty state component
- Created `apps/web/src/pages/MeetingNotesPage.tsx` - Main inbox page with pagination
- Updated `apps/web/src/App.tsx` - Added routes for `/notes`, `/notes/new`, `/notes/:id`
- Implemented loading state, error state with retry, empty state
- Next: Start Task 2.4 - Note Editor Component

**2026-01-20 - Task 2.2 Complete**
- Created `apps/api/src/modules/meeting-notes/` with full CRUD endpoints (3-file pattern)
- Endpoints: GET (list w/ pagination), GET /:id, POST, PUT /:id, DELETE /:id
- Zod validation, authorization checks (user owns note)
- 24 tests in `meeting-notes.test.ts` - all passing
- Fixed test parallelism in vitest.config.ts (fileParallelism: false)
- Next: Start Task 2.3 - Meeting Notes Inbox Page (Frontend)

**2026-01-20 - Task 2.1 Complete**
- Added MeetingNote model to Prisma schema
- Created migration `20260120234351_add_meeting_notes`
- Includes: user_id FK with CASCADE, indexes on user_id and (user_id, created_at)
- Next: Start Task 2.2 - Meeting Notes API Endpoints

**2026-01-20 - Documentation Restructure**
- Created devops/ folder with commands, github-workflow, ci-cd, troubleshooting
- Updated all cross-references
- Revised STATUS.md to be a lightweight pointer (no duplicate task lists)
- Next: Start M2 Task 2.1

---

## Quick Links
- Full roadmap: `project-plan.md`
- What shipped: `changelog.md`

---

## Session Workflow

### Starting a Session
1. Read this file (STATUS.md) for current position
2. Find the current task in `project-plan.md`
3. Check blockers before starting
4. Update Active Task status to "In Progress"

### During a Session
- Check off subtasks in `project-plan.md` as you complete them
- Note any blockers immediately in this file
- Add to Recent Decisions if architectural choices are made

### Ending a Session
1. Update `project-plan.md` checkboxes (source of truth)
2. Update this file:
   - Current Position (if task completed, point to next)
   - Add Session Log entry
   - Add any Recent Decisions
   - Clear or update Blockers
3. Update "Last Updated" timestamp at top

### If Blocked
1. Document the blocker in Blockers table with date
2. Set Active Task status to "Blocked"
3. Note what's needed to unblock in "Waiting On" column
4. Either work on a different task or end session

### Session Log Format
```
**[YYYY-MM-DD] - [Brief Focus Area]**
- What was accomplished
- What's next
- Any notes for future sessions
```
