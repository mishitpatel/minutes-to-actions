# Architecture — Minutes to Actions

> **Last Updated:** 2026-01-19
> **Phase:** 1 (MVP)
> **Status:** Planning
>
> For reusable architecture patterns, see `docs/guidelines/architecture_guidelines.md`.

## System Overview

Minutes to Actions is a productivity tool that extracts action-items from meeting notes and manages them on a Kanban board.

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                            │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    React SPA (Vite)                           │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │  │
│  │  │ Meeting     │  │ Action      │  │ Share Board         │   │  │
│  │  │ Notes Inbox │  │ Board       │  │ (Public View)       │   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────┬─────────────────────────────────┘
                                    │ HTTPS
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         API SERVER (Node.js)                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                        Fastify                               │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐   │   │
│  │  │ Auth     │  │ Meeting  │  │ Action   │  │ Board      │   │   │
│  │  │ Module   │  │ Notes    │  │ Items    │  │ Sharing    │   │   │
│  │  │          │  │ Module   │  │ Module   │  │ Module     │   │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └────────────┘   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                    │                                │
│  ┌─────────────────────────────────┼───────────────────────────┐   │
│  │              External Services  │                            │   │
│  │  ┌──────────────────┐    ┌─────┴────────┐                   │   │
│  │  │ Google OAuth     │    │ Claude API   │                   │   │
│  │  │ (Authentication) │    │ (Extraction) │                   │   │
│  │  └──────────────────┘    └──────────────┘                   │   │
│  └─────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────┬─────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           DATA LAYER                                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                      PostgreSQL                              │   │
│  │  ┌────────┐  ┌───────────────┐  ┌──────────────┐            │   │
│  │  │ users  │  │ meeting_notes │  │ action_items │            │   │
│  │  └────────┘  └───────────────┘  └──────────────┘            │   │
│  │  ┌────────────┐  ┌──────────┐                               │   │
│  │  │ board_     │  │ sessions │                               │   │
│  │  │ shares     │  │          │                               │   │
│  │  └────────────┘  └──────────┘                               │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack (This Project)

### Frontend

| Technology | Purpose |
|------------|---------|
| React 18 | UI Framework |
| TypeScript | Type Safety |
| Vite | Build Tool |
| TanStack Query | Server State & Caching |
| React Router | Client-side Routing |
| Tailwind CSS | Styling |
| dnd-kit | Drag and Drop (Kanban) |
| Zod | Form Validation |

### Backend

| Technology     | Purpose                |
| -------------- | ---------------------- |
| Node.js 20 LTS | Runtime                |
| TypeScript     | Type Safety            |
| Fastify        | Web Framework          |
| Prisma         | Database ORM           |
| Zod            | Request Validation     |
| Anthropic SDK  | Claude API Integration |

### Database

| Technology | Purpose |
|------------|---------|
| PostgreSQL | Primary Database |

### External Services

| Service | Purpose |
|---------|---------|
| Google OAuth | User Authentication |
| Claude API (Anthropic) | Action-item Extraction |

---

## Project Structure

```
minutes-to-actions/
├── apps/
│   ├── web/                          # React Frontend
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── ui/               # Button, Input, Modal, etc.
│   │   │   │   ├── meeting-notes/    # MeetingNoteCard, MeetingNoteEditor
│   │   │   │   ├── action-items/     # ActionItemCard, KanbanColumn
│   │   │   │   ├── board/            # ActionBoard, PublicBoard
│   │   │   │   └── layout/           # AppShell, Sidebar, Header
│   │   │   ├── pages/
│   │   │   │   ├── MeetingNotesInbox.tsx
│   │   │   │   ├── MeetingNoteDetail.tsx
│   │   │   │   ├── ActionBoard.tsx
│   │   │   │   ├── ShareBoard.tsx
│   │   │   │   ├── PublicBoard.tsx   # /shared/:token
│   │   │   │   └── Login.tsx
│   │   │   ├── hooks/
│   │   │   ├── services/             # API client functions
│   │   │   ├── stores/               # Auth state, UI state
│   │   │   └── App.tsx
│   │   └── package.json
│   │
│   └── api/                          # Node.js Backend
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/             # Google OAuth, sessions
│       │   │   ├── meeting-notes/    # CRUD for notes
│       │   │   ├── action-items/     # CRUD + extraction
│       │   │   └── board-share/      # Public sharing
│       │   ├── middleware/
│       │   │   ├── auth.ts           # JWT/session validation
│       │   │   ├── validation.ts     # Zod validation
│       │   │   └── error-handler.ts
│       │   ├── lib/
│       │   │   ├── db.ts             # Database connection
│       │   │   └── claude.ts         # Claude API client
│       │   └── app.ts
│       ├── migrations/               # Database migrations
│       └── package.json
│
├── packages/
│   └── shared/                       # Shared Types
│       └── src/
│           ├── types/
│           │   ├── user.ts
│           │   ├── meeting-note.ts
│           │   ├── action-item.ts
│           │   └── board-share.ts
│           └── validators/           # Shared Zod schemas
│
├── docs/                             # Documentation
├── docker-compose.yml                # Local PostgreSQL
└── pnpm-workspace.yaml
```

---

## Feature Modules

### Auth Module
- Google OAuth flow (redirect, callback)
- Session creation and validation
- Session token management
- Sign out

### Meeting Notes Module
- Create meeting note (title optional, body required)
- List notes (paginated, sorted by date)
- Get note detail with linked action-items
- Update note
- Delete note

### Action Items Module
- List action-items by status (grouped for Kanban)
- Create action-item (manual)
- Create action-items (bulk, from extraction)
- Update action-item
- Update status (for drag-drop)
- Update position (for reordering)
- Delete action-item
- **Extract action-items** (Claude API integration)

### Board Share Module
- Get share config
- Enable sharing (generate token)
- Disable sharing
- Regenerate token
- Get public board data (by token)

---

## Data Flow

### Authentication Flow

```
User clicks "Sign in with Google"
         │
         ▼
┌─────────────────────────┐
│ Redirect to Google OAuth │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Google authenticates    │
│ user and redirects back │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ API: /auth/google/callback │
│ - Validate OAuth code    │
│ - Create/update user     │
│ - Create session         │
│ - Set httpOnly cookie    │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Redirect to app         │
│ (Meeting Notes Inbox)   │
└─────────────────────────┘
```

### Extraction Flow

```
User clicks "Extract action-items"
         │
         ▼
┌─────────────────────────┐
│ API: POST /meeting-notes/:id/extract │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Fetch meeting note body │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Call Claude API with    │
│ extraction prompt       │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Parse structured output │
│ (title, priority, date) │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Return extracted items  │
│ (not yet saved)         │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ User reviews/edits      │
│ in preview modal        │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ User clicks "Save"      │
│ API: POST /action-items/bulk │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Action items saved to   │
│ database with note link │
└─────────────────────────┘
```

---

## Server Lifecycle

### Startup

1. Load environment configuration
2. Initialize database connection
3. Register plugins and routes
4. Start HTTP server

### Shutdown (SIGTERM/SIGINT)

1. Stop accepting new connections
2. Wait for active requests to complete
3. Close database connections (via onClose hooks)
4. Exit process

---

## Security Considerations

### Authentication
- Google OAuth only (no password storage)
- Session tokens hashed before storage
- httpOnly, secure, sameSite cookies
- Session expiration and cleanup

### Authorization
- All API endpoints require authentication (except public board)
- Users can only access their own data
- Public board: read-only, no source note links

### Data Protection
- Input validation on all endpoints (Zod)
- SQL injection prevention (ORM)
- XSS prevention (React escaping)

---

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/minutes_to_actions

# Google OAuth
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# Claude API
ANTHROPIC_API_KEY=xxx

# Session
SESSION_SECRET=xxx

# App
API_URL=http://localhost:3001      # Base URL for API (used in Swagger/OpenAPI docs)
WEB_URL=http://localhost:3000      # Frontend URL for CORS and redirects
NODE_ENV=development
```

---

## Related Documents

- Product Spec: `docs/product/product-spec.md`
- User Stories: `docs/product/user-stories-phase1.md`
- Database Schema: `docs/engineering/database-schema.md`
- API Spec: `docs/engineering/api-spec.md`
- Project Plan: `docs/project/project-plan.md`
- Architecture Patterns: `docs/guidelines/architecture_guidelines.md`
