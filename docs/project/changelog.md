# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Google OAuth authentication (sign in, sign out, session management)
- Database setup with Prisma (users, sessions tables with indexes)
- Frontend login page with Google OAuth flow
- Protected route guards and auth context
- Shared types package for User, Session, ActionItem, MeetingNote, BoardShare
- API client with error handling
- React Query integration for data fetching
- Docker Compose for PostgreSQL and Redis
- Environment validation with Zod
- Auth endpoint tests with Vitest
- Meeting Notes database migration with indexes
- Meeting Notes API endpoints (CRUD with pagination)
- Meeting Notes service (`meeting-notes.service.ts`) for API calls
- Meeting Notes TanStack Query hooks (`useMeetingNotes.ts`)
- Meeting Notes Inbox page with pagination controls
- NoteCard component for note list items
- EmptyState reusable component
- Routes for `/notes`, `/notes/new`, `/notes/:id`
- Action Items database migration (Priority/Status enums, indexes)
- Action Items API endpoints (list, get, create, bulk create, update, status update, position update, delete)
- Action Items module with Zod schemas, handler, routes, and 41 tests
- NoteEditor component for create/edit notes
- NoteDetailPage with view/edit modes and delete confirmation
- ConfirmDialog reusable component
- Kanban Board page with 3 columns (To Do, Doing, Done)
- KanbanColumn component with item count headers
- Action Items service (`action-items.service.ts`) for API calls
- Action Items TanStack Query hooks (`useActionItems.ts`)
- Route for `/board` Kanban board page
- AppLayout component for authenticated pages
- Sidebar navigation component with responsive mobile menu
- ActionItemDetailModal component with view/edit modes and delete confirmation
- Action item click-to-open integration in BoardPage
- ActionItemCreateModal component for manual action item creation
- Drag-and-drop action items between Kanban columns with @dnd-kit
- DraggableActionItemCard wrapper component
- Optimistic updates for drag-and-drop with rollback on error
- Keyboard navigation support for drag-and-drop
- Source note navigation from action items (Task 3.8) - links to source note, "Note deleted" for orphaned items, hidden for manual items
- Claude API integration for action item extraction (Task 4.1) - claude.ts service with extractActionItems()
- ExtractionError and RateLimitError custom error classes
- Extraction endpoint `POST /meeting-notes/:id/extract` (Task 4.2) with schema validation and error handling
- Extraction Review UI (Task 4.3) - ExtractionReviewPanel component with extract, review, edit, and save workflow
- `extractActionItems()` method in meeting-notes service
- `bulkCreate()` method in action-items service
- `useExtractActionItems()` and `useBulkCreateActionItems()` React Query hooks
- AI sample meeting notes generation service `generateSampleMeetingNotes()` in claude.ts (Task 7.1)
- `POST /meeting-notes/generate-sample` endpoint with Zod-validated request/response schemas (Task 7.1)
- Meeting type prompts for weekly-standup, one-on-one, and sprint-retro generation
- "Generate Sample" dropdown button on NewNotePage with 3 meeting type options (Task 7.2)
- Overwrite confirmation dialog when generating sample over existing editor content
- Loading overlay with spinner on NoteEditor during AI generation
- `useGenerateSample()` React Query mutation hook
- `generateSample()` method in meeting-notes frontend service
- Unit tests for `generateSampleMeetingNotes()` (5 tests: happy path, code-block handling, rate limit, invalid JSON, invalid structure)
- API E2E tests for generate-sample endpoint (7 tests: auth, all 3 meeting types, invalid type, rate limit, generation failure)
- HTTP interaction metadata tracking in test setup for HTML reporter
- `test:api:html` script for interactive HTML test reports
- Custom HTML test reporter (`tests/reporters/http-html-reporter.ts`)

### Changed
- Reformatted CLAUDE.md "First Time Setup" section for consistency
- Added deprecation note to `packages/shared` - API module Zod schemas are source of truth
- NoteEditor now accepts `externalData`, `onChange`, and `isGenerating` props for AI generation integration

### Fixed
- Fixed `due_date` format in ExtractionReviewPanel — appends `T00:00:00.000Z` to date-only strings for valid ISO timestamps

### Removed
-

---

## [0.1.0] - YYYY-MM-DD

### Added
- Initial project setup
- Basic project structure
- CLAUDE.md and documentation templates
- [Feature 1]
- [Feature 2]

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 0.1.0 | YYYY-MM-DD | Initial MVP release |

---

## How to Update This Changelog

When making changes:

1. Add entries under `[Unreleased]` section
2. Use the appropriate category:
   - **Added** - New features
   - **Changed** - Changes in existing functionality
   - **Deprecated** - Soon-to-be removed features
   - **Removed** - Removed features
   - **Fixed** - Bug fixes
   - **Security** - Vulnerability fixes

3. When releasing, move unreleased items to a new version section

### Entry Format

```markdown
- Brief description of change ([#PR-number] or commit)
- Another change that was made
```

### Example Entries

```markdown
### Added
- User authentication with JWT tokens (#15)
- Dark mode support for the dashboard (#22)

### Changed
- Improved API response time by 40% (#18)
- Updated dependencies to latest versions

### Fixed
- Fixed login redirect loop on Safari (#21)
- Resolved memory leak in WebSocket connection (#19)
```

## Related Documents

- Project Status: `docs/project/project-status.md`
- Milestones: `docs/project/milestones/`
- GitHub Workflow: `docs/devops/github-workflow.md`
