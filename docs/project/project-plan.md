# Project Plan — Minutes to Actions (Phase 1 MVP)

> **Last Updated:** 2026-01-22
> **Phase:** 1 (MVP)
> **Total User Stories:** 28

## Overview

**Product:** Minutes to Actions
**Vision:** Paste meeting notes, extract action-items, manage them on a Kanban board, and share a read-only board link.

**Source Documents:**
- Product Spec: `docs/product/product-spec.md`
- User Stories: `docs/product/user-stories-phase1.md`
- Database Schema: `docs/engineering/database-schema.md`
- API Spec: `docs/engineering/api-spec.md`

**MVP Success Criteria:**
- User can create a meeting note and extract at least 1 action-item
- User can move action-items across To Do / Doing / Done
- Public link shows the board but cannot edit
- Revoking a link invalidates the old URL immediately

---

## Milestones Summary

| #   | Milestone                           | User Stories                           | Dependencies |
| --- | ----------------------------------- | -------------------------------------- | ------------ |
| 1   | Project Foundation & Authentication | US-1.1, US-1.2, US-1.3                 | None         |
| 2   | Meeting Notes Module                | US-2.1, US-2.2, US-2.3, US-2.4, US-2.5 | M1           |
| 3   | Action Items & Kanban Board         | US-4.1 through US-4.9                  | M1, M2       |
| 4   | AI Action-Item Extraction           | US-3.1, US-3.2, US-3.3                 | M2, M3       |
| 5   | Board Sharing                       | US-5.1 through US-5.6                  | M3           |
| 6   | Navigation, UX & Polish             | US-6.1, US-6.2, US-7.1, US-7.2, US-7.3 | M1-M5        |
|     |                                     |                                        |              |

**Parallelization:** M2 and M3 backend work can proceed in parallel after M1. M4 and M5 can proceed in parallel after M3.

---

## Milestone 1: Project Foundation & Authentication

**Objective:** Set up project infrastructure, database, and Google OAuth authentication flow.

**User Stories Covered:**
- US-1.1: Google OAuth Sign Up
- US-1.2: Google OAuth Sign In
- US-1.3: Sign Out

**Deliverables:**
- Database migrations for `users` and `sessions` tables
- Google OAuth flow working end-to-end
- Session management with persistent login
- Protected route middleware
- Landing/login page with "Sign in with Google" button

---

### Task 1.1: Database Setup & Initial Migrations ✅

**Description:** Initialize Prisma, create database, and run migrations for user authentication tables.

**Subtasks:**
- [x] Configure Prisma with PostgreSQL connection
- [x] Create migration for `users` table (id, email, name, avatar_url, google_id, timestamps)
- [x] Create migration for `sessions` table (id, user_id, token_hash, expires_at, created_at)
- [x] Add unique indexes on `users.email`, `users.google_id`, `sessions.token_hash`
- [ ] Seed script for development (optional)
- [x] Verify migrations run successfully

---

### Task 1.2: Environment Configuration ✅

**Description:** Set up environment variables and validation for auth-related configuration.

**Subtasks:**
- [x] Add env variables: `DATABASE_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, `SESSION_SECRET`
- [x] Create Zod schema for environment validation in `config/env.ts`
- [x] Add `.env.example` with required variables documented
- [x] Configure CORS for frontend origin

---

### Task 1.3: Google OAuth Backend Implementation ✅

**Description:** Implement Google OAuth endpoints using `@fastify/oauth2` or manual OAuth flow.

**Subtasks:**
- [x] Create `auth` plugin with JWT/session management
- [x] Implement `GET /auth/google` - redirect to Google consent screen
- [x] Implement `GET /auth/google/callback` - handle OAuth code exchange
- [x] Create or update user record on successful auth
- [x] Generate session token and set HTTP-only cookie
- [x] Implement `GET /auth/me` - return current user
- [x] Implement `POST /auth/logout` - clear session
- [x] Add `authenticate` preHandler hook for protected routes
- [x] Write tests for auth endpoints

---

### Task 1.4: Landing & Login Page (Frontend) ✅

**Description:** Create the landing/login page with Google sign-in button.

**Subtasks:**
- [x] Create `/login` route/page
- [x] Add "Sign in with Google" button with Google branding
- [x] Handle OAuth redirect flow
- [x] Show error message for failed/cancelled OAuth
- [x] Redirect authenticated users to Meeting Notes Inbox
- [x] Create auth context/store for user state
- [x] Add route guards for protected pages

---

### Task 1.5: Sign Out Functionality ✅

**Description:** Implement sign out UI and ensure session is properly terminated.

**Subtasks:**
- [x] Add sign out button/link (accessible from sidebar or header)
- [x] Call `POST /auth/logout` on click
- [x] Clear client-side auth state
- [x] Redirect to login page
- [x] Verify protected pages are inaccessible after sign out

---

## Milestone 2: Meeting Notes Module

**Objective:** Build full CRUD functionality for meeting notes with inbox and detail views.

**User Stories Covered:**
- US-2.1: View Meeting Notes List
- US-2.2: Create a Meeting Note
- US-2.3: View Meeting Note Detail
- US-2.4: Edit a Meeting Note
- US-2.5: Delete a Meeting Note

**Deliverables:**
- Database migration for `meeting_notes` table
- API endpoints for meeting notes CRUD
- Meeting Notes Inbox page with list view
- Note editor (create/edit)
- Note detail view with action buttons

---

### Task 2.1: Meeting Notes Database Migration ✅

**Description:** Create migration for `meeting_notes` table.

**Subtasks:**
- [x] Create migration for `meeting_notes` table (id, user_id, title, body, timestamps)
- [x] Add foreign key to `users` with CASCADE delete
- [x] Add index on `user_id` and composite index on `(user_id, created_at)`
- [x] Verify migration runs successfully

---

### Task 2.2: Meeting Notes API Endpoints ✅

**Description:** Implement backend routes for meeting notes CRUD operations.

**Subtasks:**
- [x] Create `meeting-notes` module structure (schemas, handler, routes)
- [x] Define Zod schemas for create/update requests and responses
- [x] Implement `GET /meeting-notes` - list with pagination
- [x] Implement `GET /meeting-notes/:id` - single note with action-items
- [x] Implement `POST /meeting-notes` - create note (body required, title optional)
- [x] Implement `PUT /meeting-notes/:id` - update note
- [x] Implement `DELETE /meeting-notes/:id` - delete note (action-items become orphaned)
- [x] Add authorization checks (user owns the note)
- [x] Write tests for all endpoints

---

### Task 2.3: Meeting Notes Inbox Page (Frontend) ✅

**Description:** Create the inbox page showing all meeting notes.

**Subtasks:**
- [x] Create `/notes` or `/inbox` route as default landing page
- [x] Fetch notes list from API with pagination
- [x] Display notes in list/card format (title, created date, preview snippet)
- [x] Sort by most recently created/updated
- [x] Show empty state with prompt when no notes exist
- [x] Implement pagination or infinite scroll
- [x] Add "New Note" button

---

### Task 2.4: Note Editor Component ✅

**Description:** Build the note editor for creating and editing notes.

**Subtasks:**
- [x] Create note editor component (modal, drawer, or page)
- [x] Add title field (optional) and body field (required, multiline)
- [x] Implement "Save" and "Cancel" buttons
- [x] Add validation: body cannot be empty
- [x] Handle create mode vs edit mode
- [x] Show loading state during save
- [x] Navigate to note detail after successful create

---

### Task 2.5: Note Detail View ✅

**Description:** Create the detail view for a single meeting note.

**Subtasks:**
- [x] Create `/notes/:id` route/page
- [x] Display title (if set), full body, created/updated dates
- [x] Add "Edit" button (opens editor in edit mode)
- [x] Add "Delete" button with confirmation dialog
- [x] Add "Extract action-items" button (placeholder for M4)
- [x] Show list of linked action-items (placeholder for M3)
- [x] Handle 404 for non-existent notes

---

### Task 2.6: Delete Note with Confirmation ✅

**Description:** Implement delete functionality with confirmation dialog.

**Subtasks:**
- [x] Create confirmation modal component
- [x] Show warning: "Are you sure? This cannot be undone."
- [x] Call DELETE endpoint on confirm
- [x] Redirect to inbox after deletion
- [ ] Show success toast/notification (deferred to M6 Task 6.4)

---

## Milestone 3: Action Items & Kanban Board

**Objective:** Build the Kanban board with action item management (CRUD, drag-drop, status updates).

**User Stories Covered:**
- US-4.1: View Action Board
- US-4.2: Create Action-Item Manually
- US-4.3: View Action-Item Detail
- US-4.4: Edit Action-Item
- US-4.5: Delete Action-Item
- US-4.6: Move Action-Item via Drag and Drop
- US-4.7: Move Action-Item via Dropdown
- US-4.8: Mark Action-Item as Done
- US-4.9: Navigate to Source Meeting Note

**Deliverables:**
- Database migration for `action_items` table
- API endpoints for action items CRUD
- Kanban board with 3 columns (To Do / Doing / Done)
- Drag-and-drop functionality
- Action item detail/edit modal
- Source note navigation

---

### Task 3.1: Action Items Database Migration ✅

**Description:** Create migration for `action_items` table with all fields and indexes.

**Subtasks:**
- [x] Create migration for `action_items` table
- [x] Add fields: id, user_id, meeting_note_id (nullable), title, description, priority (enum), status (enum), due_date, position, timestamps
- [x] Create `priority` enum (high, medium, low)
- [x] Create `status` enum (todo, doing, done)
- [x] Add foreign keys: user_id (CASCADE), meeting_note_id (SET NULL)
- [x] Add indexes for user_id, meeting_note_id, (user_id, status), (user_id, status, position)
- [x] Verify migration runs successfully

---

### Task 3.2: Action Items API Endpoints ✅

**Description:** Implement backend routes for action items CRUD.

**Subtasks:**
- [x] Create `action-items` module structure
- [x] Define Zod schemas for all request/response types
- [x] Implement `GET /action-items` - list grouped by status
- [x] Implement `GET /action-items/:id` - single item with source note info
- [x] Implement `POST /action-items` - create manual item
- [x] Implement `POST /action-items/bulk` - create multiple (for extraction)
- [x] Implement `PUT /action-items/:id` - full update
- [x] Implement `PATCH /action-items/:id/status` - status only
- [x] Implement `PATCH /action-items/:id/position` - reorder within column
- [x] Implement `DELETE /action-items/:id` - delete item
- [x] Add authorization checks
- [x] Write tests for all endpoints

---

### Task 3.3: Kanban Board Layout (Frontend) ✅

**Description:** Build the main Kanban board with three columns.

**Subtasks:**
- [x] Create `/board` route/page
- [x] Create board layout with 3 columns: To Do, Doing, Done
- [x] Fetch action items from API (grouped by status)
- [x] Display column headers with item counts
- [x] Show empty state placeholder in empty columns
- [x] Add "Add action-item" button

---

### Task 3.4: Action Item Card Component

**Description:** Build the card component for displaying action items.

**Subtasks:**
- [ ] Create action item card component
- [ ] Display: title, priority badge (color-coded), due date, source note link
- [ ] Make card clickable to open detail view
- [ ] Add "Mark done" checkbox/button for quick completion
- [ ] Add "Move to..." dropdown menu
- [ ] Show visual distinction for overdue items (optional)

---

### Task 3.5: Drag and Drop Functionality

**Description:** Implement drag-and-drop to move items between columns.

**Subtasks:**
- [ ] Install drag-drop library (e.g., @dnd-kit, react-beautiful-dnd)
- [ ] Make action item cards draggable
- [ ] Add drop zones for each column
- [ ] Show visual feedback during drag (card follows cursor, zones highlighted)
- [ ] Call PATCH status endpoint on drop
- [ ] Handle optimistic updates with rollback on error
- [ ] Persist reordering within columns (position field)

---

### Task 3.6: Action Item Detail/Edit Modal

**Description:** Create modal for viewing and editing action item details.

**Subtasks:**
- [ ] Create detail modal/drawer component
- [ ] Display all fields: title, description, priority, due date, status, source note, dates
- [ ] Add "Edit" button to enter edit mode
- [ ] Edit form with all editable fields
- [ ] Priority dropdown (High/Medium/Low)
- [ ] Status dropdown (To Do/Doing/Done)
- [ ] Due date picker
- [ ] "Save" and "Cancel" buttons
- [ ] "Delete" button with confirmation

---

### Task 3.7: Manual Action Item Creation

**Description:** Allow users to create action items without extraction.

**Subtasks:**
- [ ] Create "Add action item" modal/form
- [ ] Fields: title (required), description, priority, due date, status
- [ ] Default priority to Medium, status to To Do
- [ ] Call POST endpoint on save
- [ ] Add new item to appropriate column
- [ ] Show success feedback

---

### Task 3.8: Source Note Navigation

**Description:** Allow navigation from action item to its source meeting note.

**Subtasks:**
- [ ] Display "Source note" link on action items with meeting_note_id
- [ ] Make link clickable, navigate to `/notes/:id`
- [ ] Show "Note deleted" label (non-clickable) if source note was deleted
- [ ] Hide source link for manually created items

---

## Milestone 4: AI Action-Item Extraction

**Objective:** Integrate Claude API to extract action items from meeting notes.

**User Stories Covered:**
- US-3.1: Extract Action-Items from Meeting Note
- US-3.2: Handle Extraction with No Action-Items
- US-3.3: Handle Extraction Errors

**Deliverables:**
- Claude API integration
- Extraction endpoint
- Review/preview UI before saving
- Error handling and retry functionality

---

### Task 4.1: Claude API Integration

**Description:** Set up Claude/Anthropic API client for action item extraction.

**Subtasks:**
- [ ] Add `ANTHROPIC_API_KEY` environment variable
- [ ] Install Anthropic SDK (`@anthropic-ai/sdk`)
- [ ] Create Claude service/utility module
- [ ] Design prompt for action item extraction
- [ ] Test prompt with various meeting note samples
- [ ] Handle API rate limits and errors

---

### Task 4.2: Extraction Endpoint Implementation

**Description:** Implement the extraction API endpoint.

**Subtasks:**
- [ ] Implement `POST /meeting-notes/:id/extract`
- [ ] Fetch meeting note body
- [ ] Call Claude API with extraction prompt
- [ ] Parse response into structured action items
- [ ] Return extracted items with suggested priority/due date
- [ ] Handle empty results gracefully (return empty array with message)
- [ ] Handle API errors with user-friendly messages
- [ ] Add timeout handling
- [ ] Write tests (mock Claude API)

---

### Task 4.3: Extraction Review UI

**Description:** Build the UI for reviewing extracted items before saving.

**Subtasks:**
- [ ] Add "Extract action-items" button on note detail page
- [ ] Show loading state during extraction
- [ ] Display extracted items in a review list
- [ ] Show title, suggested priority, suggested due date for each
- [ ] Allow inline editing of extracted items
- [ ] Allow removing unwanted items (checkbox or X button)
- [ ] "Save action-items" button to create all items
- [ ] "Cancel" button to discard

---

### Task 4.4: Handle No Results and Errors

**Description:** Proper handling of edge cases in extraction.

**Subtasks:**
- [ ] Show friendly message when no action items found
- [ ] Allow user to manually create items as fallback
- [ ] Show user-friendly error message on extraction failure
- [ ] Add "Retry" button for failed extractions
- [ ] Log errors for debugging (not exposed to user)

---

### Task 4.5: Save Extracted Items

**Description:** Save reviewed items to the board.

**Subtasks:**
- [ ] Call `POST /action-items/bulk` with edited items
- [ ] Link items to source meeting note
- [ ] Set default status to "To Do"
- [ ] Show success message with count of created items
- [ ] Navigate to board or stay on note detail (user preference)
- [ ] Update note detail to show newly linked action items

---

## Milestone 5: Board Sharing

**Objective:** Enable public read-only sharing of the action board.

**User Stories Covered:**
- US-5.1: Enable Board Sharing
- US-5.2: Copy Share Link
- US-5.3: Disable Board Sharing
- US-5.4: Regenerate Share Link
- US-5.5: View Shared Board (Public Visitor)
- US-5.6: Handle Invalid Share Link

**Deliverables:**
- Database migration for `board_shares` table
- Share management API endpoints
- Share settings page
- Public board view (read-only, no auth)
- Invalid link handling

---

### Task 5.1: Board Shares Database Migration

**Description:** Create migration for `board_shares` table.

**Subtasks:**
- [ ] Create migration for `board_shares` table (id, user_id, share_token, is_enabled, timestamps)
- [ ] Add unique constraint on user_id (one share config per user)
- [ ] Add unique index on share_token
- [ ] Foreign key to users with CASCADE delete
- [ ] Verify migration runs successfully

---

### Task 5.2: Board Share API Endpoints

**Description:** Implement backend routes for share management.

**Subtasks:**
- [ ] Create `board-share` module structure
- [ ] Implement `GET /board-share` - get current config
- [ ] Implement `POST /board-share/enable` - enable and generate token
- [ ] Implement `POST /board-share/disable` - disable sharing
- [ ] Implement `POST /board-share/regenerate` - new token, invalidate old
- [ ] Generate secure random tokens (32 bytes, hex-encoded)
- [ ] Write tests for all endpoints

---

### Task 5.3: Public Board Endpoint

**Description:** Implement the public endpoint for viewing shared boards.

**Subtasks:**
- [ ] Implement `GET /shared/:token` - no auth required
- [ ] Validate token exists and sharing is enabled
- [ ] Return action items grouped by status (limited fields)
- [ ] Exclude sensitive data (descriptions optional, no source note links)
- [ ] Return 404 for invalid/disabled tokens
- [ ] Write tests for public endpoint

---

### Task 5.4: Share Board Settings Page (Frontend)

**Description:** Build the share settings page for managing board sharing.

**Subtasks:**
- [ ] Create `/share` route/page
- [ ] Add toggle switch: "Enable public sharing"
- [ ] Show share URL when enabled
- [ ] Add "Copy" button with clipboard functionality
- [ ] Show "Copied!" feedback on copy
- [ ] Add "Regenerate link" button with confirmation
- [ ] Add "Disable sharing" option with confirmation

---

### Task 5.5: Public Board View (Frontend)

**Description:** Create the read-only public board view for visitors.

**Subtasks:**
- [ ] Create `/shared/:token` route (public, no auth required)
- [ ] Fetch board data from public endpoint
- [ ] Display Kanban board with 3 columns
- [ ] Show action items: title, priority, due date
- [ ] Remove all edit controls (no drag, no edit, no delete)
- [ ] Add "Shared Board" label in header
- [ ] Hide source note links (privacy)
- [ ] Style to indicate read-only mode

---

### Task 5.6: Invalid Share Link Page

**Description:** Handle invalid or revoked share links gracefully.

**Subtasks:**
- [ ] Create error page for invalid share links
- [ ] Show friendly message: "This board is no longer shared or the link is invalid."
- [ ] Add link to homepage or sign in page
- [ ] Don't reveal any sensitive information

---

## Milestone 6: Navigation, UX & Polish

**Objective:** Complete navigation, responsive layout, loading states, and error handling.

**User Stories Covered:**
- US-6.1: Sidebar Navigation
- US-6.2: Responsive Layout
- US-7.1: Data Persistence
- US-7.2: Loading States
- US-7.3: Error Handling

**Deliverables:**
- Consistent sidebar navigation
- Responsive design for all screen sizes
- Loading indicators throughout app
- Error handling and user feedback
- Final polish and QA

---

### Task 6.1: Sidebar Navigation Component ✅

**Description:** Build the main sidebar navigation.

**Subtasks:**
- [x] Create sidebar component
- [x] Add navigation links: Meeting Notes Inbox, Action Board, Share Board
- [x] Highlight current/active section
- [x] Add user profile section (name, avatar)
- [x] Add sign out option
- [x] Show on all authenticated pages

---

### Task 6.2: Responsive Layout

**Description:** Make the app responsive across devices.

**Subtasks:**
- [ ] Implement responsive breakpoints (desktop, tablet, mobile)
- [x] Collapse sidebar to hamburger menu on mobile
- [ ] Stack Kanban columns vertically on small screens
- [ ] Ensure all interactive elements are touch-friendly
- [ ] Test drag-and-drop on touch devices (or provide dropdown fallback)
- [ ] Verify modals/drawers work on mobile

---

### Task 6.3: Loading States

**Description:** Add loading indicators throughout the application.

**Subtasks:**
- [ ] Create reusable loading spinner/skeleton components
- [ ] Add loading state when fetching notes list
- [ ] Add loading state when fetching action board
- [ ] Add loading state during AI extraction
- [ ] Add loading state when saving/updating data
- [ ] Disable buttons during async operations

---

### Task 6.4: Error Handling

**Description:** Implement consistent error handling and user feedback.

**Subtasks:**
- [ ] Create toast/notification system for feedback
- [ ] Show user-friendly messages for network errors
- [ ] Add retry option for failed requests
- [ ] Show field-level validation errors on forms
- [ ] Handle 401 errors (redirect to login)
- [ ] Handle 404 errors (show not found page)
- [ ] Ensure errors don't crash the app (error boundaries)

---

### Task 6.5: Data Persistence Verification

**Description:** Ensure all data operations persist correctly.

**Subtasks:**
- [ ] Verify meeting notes persist across sessions
- [ ] Verify action items persist across sessions
- [ ] Verify board sharing config persists
- [ ] Test data isolation between users
- [ ] Warn users about unsaved changes (optional)

---

### Task 6.6: End-to-End Testing

**Description:** Write E2E tests covering the main user flows.

**Subtasks:**
- [ ] Set up E2E testing framework (Playwright or Cypress)
- [ ] Test Flow 1: Sign in → lands on inbox
- [ ] Test Flow 2: Create note → extract items → items on board
- [ ] Test Flow 3: Move items across columns
- [ ] Test Flow 4: Enable sharing → view public board
- [ ] Test Flow 5: Revoke sharing → public link returns 404

---

### Task 6.7: Final QA & Bug Fixes

**Description:** Final quality assurance pass before MVP launch.

**Subtasks:**
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Mobile testing (iOS Safari, Android Chrome)
- [ ] Accessibility audit (keyboard navigation, screen readers)
- [ ] Performance check (no obvious bottlenecks)
- [ ] Security review (auth, data isolation)
- [ ] Fix any bugs found during QA

---

## Verification Checklist

Before marking MVP complete, verify:

- [ ] **US-1**: User can sign in with Google and sign out
- [ ] **US-2**: User can create, view, edit, and delete meeting notes
- [ ] **US-3**: User can extract action items from a note (including no-result and error cases)
- [ ] **US-4**: User can manage action items on Kanban board (create, edit, delete, move)
- [ ] **US-5**: User can enable/disable sharing, visitors see read-only board
- [ ] **US-6**: Navigation works, app is responsive
- [ ] **US-7**: Data persists, loading states shown, errors handled gracefully

**MVP Success Criteria (from Product Spec):**
- [ ] User can create a meeting note and extract at least 1 action-item
- [ ] User can move action-items across To Do / Doing / Done
- [ ] Public link shows the board but cannot edit
- [ ] Revoking a link invalidates the old URL immediately

---

## Related Documents

- Product Spec: `docs/product/product-spec.md`
- User Stories: `docs/product/user-stories-phase1.md`
- Database Schema: `docs/engineering/database-schema.md`
- API Spec: `docs/engineering/api-spec.md`
- Architecture: `docs/engineering/architecture.md`
