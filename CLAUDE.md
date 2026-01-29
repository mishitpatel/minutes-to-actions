# Minutes to Actions

> Paste meeting notes, extract action-items, manage them on a Kanban board, and share a read-only board link.

## Core Concepts

| Term | Definition |
|------|------------|
| Meeting Notes | Raw text pasted by user containing discussion points and decisions |
| Action Items | Extracted tasks with assignee, due date, and status |
| Kanban Board | Visual board with columns: To Do, In Progress, Done |
| Share Links | Read-only URLs for external stakeholders to view boards |

## Project Structure

```
apps/
├── web/                  # React frontend (Vite + TypeScript)
└── api/                  # Node.js backend (Fastify)
packages/
└── shared/               # Shared types, utilities, constants
docs/
├── project/              # Status, plan, changelog
├── devops/               # Commands, CI/CD, troubleshooting
├── product/              # Specs, user stories
├── engineering/          # Architecture, API, database
└── guidelines/           # Coding standards
```

## Quick Start

```bash
pnpm install          # Install dependencies
pnpm dev              # Start frontend (5173) + backend (3000)
pnpm test             # Run tests
pnpm build            # Build for production
pnpm lint             # Check code quality
```

### First Time Setup

```bash
docker-compose up -d          # Start PostgreSQL + Redis
cp .env.example .env          # Configure environment (add Google OAuth creds)
pnpm db:migrate               # Run database migrations
pnpm dev                      # Start development
```

See `docs/devops/commands.md` for full command reference.

## Key Constraints

- **No file uploads** in Phase 1 (paste text only)
- **Monorepo** with pnpm workspaces
- **PostgreSQL** primary, Redis for caching
- **Conventional commits**: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`

## Before You Code

```
What are you building?
├── New feature     → docs/product/product-spec.md
├── API endpoint    → docs/engineering/api-spec.md
├── Database change → docs/engineering/database-schema.md
└── Bug fix         → Check relevant guideline first

Which layer?
├── Frontend → docs/guidelines/frontend_guidelines.md
├── Backend  → docs/guidelines/backend_guidelines.md
└── Both     → docs/guidelines/api_guidelines.md
```

## Task Workflow (GitHub Issues)

When working on a task:

1. **Get the issue**: `gh issue view #XX`
2. **Find user stories**: Look for "References: US-X.X" in the issue
3. **Read acceptance criteria**: Open `docs/product/user-stories-phase1.md` and find the user story
4. **Implement to meet ALL acceptance criteria** - not just the subtasks
5. **Verify before done**: Check each acceptance criterion is satisfied

### User Story Quick Reference

| Milestone | User Stories |
|-----------|--------------|
| M1: Auth | US-1.1, US-1.2, US-1.3 |
| M2: Meeting Notes | US-2.1 through US-2.5 |
| M3: Action Board | US-4.1 through US-4.9 |
| M4: AI Extraction | US-3.1, US-3.2, US-3.3 |
| M5: Sharing | US-5.1 through US-5.6 |
| M6: Polish | US-6.1, US-6.2, US-7.1, US-7.2, US-7.3 |

### Git Workflow

**Always branch from main** — see `docs/devops/github-workflow.md#starting-new-work`
```bash
git checkout main && git pull origin main && git checkout -b feature/xyz
```

### Development Patterns

| Pattern | Practice |
|---------|----------|
| API-first | Design OpenAPI spec before implementing |
| Schema-first | Define Zod schemas in modules, types are inferred |
| Test-driven | Write tests alongside features |

### Backend API Patterns

**IMPORTANT:** Read `docs/guidelines/backend_guidelines.md` before creating API endpoints.

**Creating a New Module:**
1. Create folder: `src/modules/[feature]/`
2. Create files (3-file pattern):
   - `[feature].schemas.ts` — Zod schemas + inferred types
   - `[feature].handler.ts` — Business logic (pure functions, no classes)
   - `[feature].routes.ts` — HTTP wiring with `withTypeProvider<ZodTypeProvider>()`
   - `[feature].test.ts` — Co-located tests
3. Import common schemas from `@/schemas/common`
4. Use custom errors from `@/utils/errors`
5. Define Zod schemas for all request/response types
6. Include full `schema` block: `{ description, tags, body/params/querystring, response }`
7. Add response schemas for ALL status codes (201, 400, 401, 404, 422)
8. Register routes in `app.ts` with `/api` prefix
9. Verify endpoint appears at http://localhost:3000/docs

### Error Handling

Use custom errors in handlers (not routes):
```typescript
import { NotFoundError, ConflictError } from '@/utils/errors';

// In handler - throw errors
if (!resource) throw new NotFoundError('Resource not found');

// Global error handler in app.ts converts to HTTP response
```

**Available errors**: `NotFoundError`, `UnauthorizedError`, `BadRequestError`, `ForbiddenError`, `ConflictError`, `ValidationError`

## Documentation Map

| Category    | Key Files                                                              |
| ----------- | ---------------------------------------------------------------------- |
| Project     | `STATUS.md`, `project-plan.md`, `changelog.md`                         |
| DevOps      | `commands.md`, `github-workflow.md`, `troubleshooting.md`              |
| Product     | `product-spec.md`, `user-stories-phase1.md`                            |
| Engineering | `api-spec.md`, `database-schema.md`, `architecture.md`                 |
| Guidelines  | `frontend_guidelines.md`, `backend_guidelines.md`, `api_guidelines.md` |
|             |                                                                        |

All docs in `docs/` directory.

---

## Session Continuity

📍 **Start every session by reading `docs/project/STATUS.md`**

This file contains:
- Current task and position in project plan
- Any blockers
- Session workflow instructions

📋 **For each task, also read the linked user stories in `docs/product/user-stories-phase1.md`**
