# Product Spec — Minutes to Actions

## 1) Overview

**Product:** Minutes to Actions
**One-liner:** Paste meeting notes, extract action-items, manage them on a Kanban board, and share a read-only board link.

### Problem
People paste meeting notes in random places and lose track of action-items.

### Target users
- **Phase 1–2 (Primary):** Individual user managing their own meetings.
- **Future (Out of scope for now):** Teams / shared boards / assignments.

---

## 2) Guiding Principles

- **Fast capture → fast actions:** Meeting notes should be easy to paste and convert.
- **Action-items are first-class:** Board is the "home" for follow-through.
- **Sharing is safe by default:** Public links are read-only and revocable.
- **Simple > perfect:** Extraction accuracy should be "good enough" for MVP.

---

## 3) Product Phases

## Phase 1 — MVP (Single user, core value)
**Goal:** Prove the end-to-end loop: meeting notes → action-item extraction → Kanban tracking → share link.

### Key features
#### A) Authentication
- **Google OAuth only** (no email/password for MVP)
- User signs in with Google and lands on **Meeting Notes Inbox**

#### B) Meeting Notes Inbox (CRUD)
User can:
- Create a meeting note (**body required**, title optional)
- View list of meeting notes
- Open meeting note detail (shows linked action-items)
- Edit / delete meeting notes

#### C) Extract Action-Items (Claude/LLM)
From a meeting note detail page:
- Button: **"Extract action-items"**
- System calls Claude to extract action-items from note body
- User previews extracted items before saving (can edit/remove)
- Creates 1+ action-items **linked to the source meeting note**
- Default status: **To Do**

#### D) Action Board (Kanban)
- **Single board per user** (no multiple boards in MVP)
- Columns: **To Do / Doing / Done**

**Action-item fields:**
- Title (required)
- Description (optional)
- Priority: **High / Medium / Low** (default: Medium)
- Due date (optional)
- Source meeting note link (for extracted items)

User can:
- **Manually create** action-items (in addition to extraction)
- Edit / delete action-items
- Move action-items across columns (drag/drop or "Move to…" dropdown)
- Mark done
- Navigate to source meeting note from action-item

#### E) Share Board (Public read-only link)
- User can enable sharing to generate a public URL
- Anyone with the link can view the board (read-only)
- No editing allowed; source note links hidden from visitors
- User can **revoke** and **regenerate** the link

#### F) Generate Sample Meeting Notes (AI)
- On the **Create Meeting Note** page, user can generate realistic sample notes
- User picks a **meeting type preset**: Weekly Standup, 1:1 Meeting, or Sprint Retrospective
- System calls Claude to generate a title and body matching the chosen type
- Loading state shown during generation; fields populated when ready
- If the editor already has content, a confirmation dialog warns before overwriting
- Purpose: quick testing and demo of the extract → board workflow

### MVP success criteria (Acceptance)
- User can create a meeting note and extract **at least 1** action-item
- User can move action-items across **To Do / Doing / Done**
- Public link shows the board but **cannot edit**
- Revoking a link invalidates the old URL immediately

---

## Phase 2 — Polishing & Productivity
**Goal:** Make it delightful and reliable for daily use.

### Enhancements
- Better extraction UX:
  - Deduplicate obvious repeats
  - Smarter priority/due date detection
- Board usability:
  - Search and filters (status, priority, tag)
  - Bulk actions (select multiple → mark done)
  - Keyboard shortcuts (optional)
- Meeting notes quality-of-life:
  - Templates ("Weekly sync", "1:1", "Retro")
  - Tag meeting notes and action-items
- Sharing improvements:
  - Optional "unlisted" label and expiry (optional)
  - Simple "Copied!" UX and QR code (optional)

**Exit criteria:** Users can reliably run the workflow daily with minimal friction.

---

## Phase 3 — Collaboration (Future / Post-MVP)
**Goal:** Turn it from personal productivity into a lightweight team workflow.

### Future features
- Multiple boards per user
- Team boards / multiple users per board
- Assign action-items to other users
- Comments on action-items
- File uploads
- Calendar integrations / reminders / notifications
- Activity feed & audit history
- Real-time collaboration

---

## 4) Core User Flows (Phase 1)

### Flow 1: Sign in → Meeting Notes Inbox
1. User clicks "Sign in with Google"
2. Completes Google OAuth
3. Lands on Meeting Notes Inbox

### Flow 2: Create meeting note → Extract action-items
1. User clicks **New Meeting Note**
2. Pastes meeting notes (or clicks **Generate Sample** and picks a preset) and saves
3. Clicks **Extract action-items**
4. Previews extracted items, edits if needed
5. Saves action-items to board

### Flow 3: Track action-items on Kanban
1. User opens **Action Board**
2. Moves items from To Do → Doing → Done
3. Edits titles/descriptions/priority/due dates as needed
4. Optionally creates manual action-items

### Flow 4: Publish read-only board
1. User opens **Share Board**
2. Enables sharing → gets URL
3. Shares link
4. Optionally revokes/regenerates link

---

## 5) UI Structure (Phase 1)

**Layout:** Left sidebar + main content
**Sidebar items:** Meeting Notes Inbox / Action Board / Share Board

### Meeting Notes Inbox
- Meeting notes list (sorted by recent)
- **New Meeting Note** button
- Note editor (title optional, body required)
- **Generate Sample** button with preset dropdown (Weekly Standup, 1:1 Meeting, Sprint Retro) on create page
- Note detail view with **Extract action-items** button
- List of linked action-items on note detail

### Action Board
- 3 columns (To Do / Doing / Done)
- Action-item cards showing: title, priority badge, due date, source note link
- **Add action-item** button for manual creation
- Edit modal/drawer for action-item details
- Move between columns (drag/drop or dropdown)

### Share Board
- Toggle share on/off
- Show link when enabled with **Copy** button
- Button: **Regenerate link**
- Button: **Revoke link**

### Public share page
- Same board view but read-only
- No edit controls
- Source note links hidden

---

## 6) Non-goals (for Phases 1–2)

- Perfect NLP extraction accuracy
- Real-time collaboration
- Multi-user assignments and permissions
- Multiple boards per user
- Deep workflow automation (reminders, calendars) in MVP
- Email/password authentication (Google OAuth only for MVP)

---

## 7) Key Decisions (Phase 1)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Authentication | Google OAuth only | Simpler MVP, no password management |
| Board structure | Single board per user | Reduces complexity for MVP |
| Action-item creation | Extract + Manual | Flexibility for users |
| Action-item fields | Title, description, priority, due date | Balance of utility and simplicity |
| Priority levels | High / Medium / Low | Simple three-tier system |
| Terminology | "meeting-notes" and "action-items" | Consistent naming throughout |
| Note-action linking | Action-items link to source note | Provides context and traceability |
| Sample generation presets | 3 types (standup, 1:1, retro) | Minimal set covering common meetings |
| Sample generation placement | Create page only | Keep scope small, avoid cluttering detail view |

---

## 8) Related Documents

- User Stories (Phase 1): `docs/product/user-stories-phase1.md`
- Stories directory: `docs/product/stories/`