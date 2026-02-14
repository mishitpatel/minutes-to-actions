# Workflow Optimization: Complete Implementation Guide

> Created: 2026-02-08
> Purpose: Single reference document with all file contents, analysis, and implementation details for the 3-layer Claude Code workflow optimization.

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Architecture Overview](#architecture-overview)
3. [Current State Analysis](#current-state-analysis)
4. [LAYER 1: CLAUDE.md Rewrite](#layer-1-claudemd-rewrite)
5. [LAYER 2: Skills](#layer-2-skills)
   - [/start-task](#skill-start-task)
   - [/verify](#skill-verify)
   - [/new-api-module](#skill-new-api-module)
   - [/new-component](#skill-new-component)
   - [/ship](#skill-ship)
   - [/api-test-generator (enhanced)](#skill-api-test-generator-enhanced)
   - [/e2e-test-generator (enhanced)](#skill-e2e-test-generator-enhanced)
6. [LAYER 3: Compact Guidelines](#layer-3-compact-guidelines)
   - [frontend-rules.md](#frontend-rulesmd)
   - [backend-rules.md](#backend-rulesmd)
   - [conventions.md](#conventionsmd)
7. [Old Files to Archive](#old-files-to-archive)
8. [Hooks Configuration](#hooks-configuration)
9. [MEMORY.md Update](#memorymd-update)
10. [Implementation Checklist](#implementation-checklist)

---

## Problem Statement

| Problem                     | Evidence                                                              |
| --------------------------- | --------------------------------------------------------------------- |
| Guidelines ignored          | 10,300 lines across 11 files; ~40% tutorial/filler content            |
| CLAUDE.md too long          | 227 lines (best practice is <60)                                      |
| User stories not referenced | CLAUDE.md says "read them" but doesn't enforce                        |
| Swagger docs missing        | Backend guideline says to create, but it's a suggestion not a default |
| Tests written ad-hoc        | No clear test strategy or checkpoints                                 |
| UI/UX guidelines skipped    | 1,173 lines — too long to read every session                          |

### Current File Inventory

| File                            | Lines      | Category          |
| ------------------------------- | ---------- | ----------------- |
| `CLAUDE.md`                     | 227        | Root instructions |
| `frontend_guidelines.md`        | 472        | Guidelines        |
| `ui_ux_guidelines.md`           | 1,174      | Guidelines        |
| `backend_guidelines.md`         | 1,059      | Guidelines        |
| `api_guidelines.md`             | 341        | Guidelines        |
| `database_guidelines.md`        | 357        | Guidelines        |
| `testing_guidelines.md`         | 877        | Guidelines        |
| `api_testing_guidelines.md`     | 257        | Guidelines        |
| `naming_guidelines.md`          | 174        | Guidelines        |
| `architecture_guidelines.md`    | 321        | Guidelines        |
| `security_guidelines.md`        | 76         | Guidelines        |
| `api-test-generator.md` (skill) | 480        | Skill             |
| `e2e-test-generator.md` (skill) | 631        | Skill             |
| **TOTAL**                       | **~6,446** |                   |

---

## Architecture Overview

```
Layer 1: CLAUDE.md (~55 lines)        → Always loaded. The constitution.
Layer 2: Skills (~100-200 lines each)  → Loaded on-demand via /skill-name.
Layer 3: Reference docs (~200 lines)   → Read when skills point to them.
```

### After optimization:

| Layer             | Files  | Total Lines |
| ----------------- | ------ | ----------- |
| 1: CLAUDE.md      | 1      | ~55         |
| 2: Skills         | 7      | ~900        |
| 3: Reference docs | 3      | ~500        |
| **TOTAL**         | **11** | **~1,455**  |

**Reduction: ~6,446 → ~1,455 lines (77% reduction)**

---

## Current State Analysis

### Content Breakdown by Type

| Content Type | % of Total | Lines | Action |
|-------------|-----------|-------|--------|
| Unique actionable rules | 40% | ~2,580 | **KEEP** — compress into Layer 3 |
| Code examples/patterns | 35% | ~2,256 | **MOVE** — into skill files |
| Tutorial/explanation | 20% | ~1,289 | **DELETE** — Claude doesn't need tutorials |
| Duplicate content | 5% | ~322 | **DELETE** — consolidate into one place |

### Key Duplications Found

| Topic               | Duplicated In                     | Keep In             |
| ------------------- | --------------------------------- | ------------------- |
| Naming conventions  | ALL files                         | `conventions.md`    |
| Rate limiting       | api_guidelines, backend, security | `backend-rules.md`  |
| Error codes/classes | backend, api_testing              | `backend-rules.md`  |
| Response format     | api_guidelines, backend           | `backend-rules.md`  |
| Module structure    | backend, architecture             | `backend-rules.md`  |
| Authentication      | backend, security                 | `backend-rules.md`  |
| Selector strategy   | testing, ui_ux                    | `frontend-rules.md` |

### Critical Rules Extracted (Things Claude Would Mess Up Without)

**Frontend:**
- Functional components ONLY, file structure order (imports → types → component → hooks → derived → callbacks → effects → early returns → render)
- `cn()` for class merging, never raw string concatenation
- TanStack Query for server state, useState for UI — no Zustand used yet
- shadcn Card has no `asChild`, native `<select>` over shadcn Select in forms
- Semantic color tokens (success, warning, info), spacing is 4px multiples
- Focus states: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`
- Respect `prefers-reduced-motion` with `motion-reduce:transition-none`
- `data-testid` on every component root element

**Backend:**
- 3-file module pattern: schemas → handler → routes (NO separate type files)
- Zod schemas are SINGLE source of truth — infer types, never define separately
- NO try-catch in route handlers (Fastify auto-handles async errors)
- Service/handler functions MUST use try-catch for Prisma/external calls
- `withTypeProvider<ZodTypeProvider>()` on all routes
- Response schemas MANDATORY for ALL status codes (prevents data leaks, required for OpenAPI)
- Custom errors only: NotFoundError, BadRequestError, UnauthorizedError, ForbiddenError, ConflictError, ValidationError
- Always use `select` or `include` in Prisma — never select all fields
- Every route: description, tags, full schema block with response for all status codes
- DELETE returns 204, POST returns 201
- Never `console.log` — use `request.log` or `app.log` (Pino)
- Other user's resource returns 404 (not 403) to prevent info leakage

**Naming (universal):**
- Data fields: `snake_case` EVERYWHERE (DB → API → frontend) — no transformation layer
- Components: PascalCase files, PascalCase names
- Hooks/utils: camelCase files, camelCase names
- Constants: UPPER_SNAKE_CASE
- URL paths: kebab-case, plural nouns
- Query params: snake_case
- UI-only state: camelCase (`isLoading`, `isModalOpen`)

**Testing:**
- API E2E: `createTestContext()` + `makeRequest()` + `parseBody()` — NOT `app.inject()` directly
- Factories in `tests/api/factories.ts` — never inline Prisma in tests
- Two error shapes: AppError `{ error: { code, message } }` vs Validation `{ statusCode, error, message }`
- Every endpoint tests: 401, 400, 404, 404 (other user), 200/201, defaults, response shape
- APPEND tests to existing files — never overwrite

---

## LAYER 1: CLAUDE.md Rewrite

**File:** `CLAUDE.md`
**Target:** ~55 lines

```markdown
# Minutes to Actions

Paste meeting notes → extract action items → manage on Kanban board → share read-only link.

## Structure

\```
apps/web/          React + Vite + TypeScript (port 5173)
apps/api/          Fastify + Prisma + PostgreSQL (port 3000)
packages/shared/   Shared types/constants
tests/api/         API E2E tests (Vitest + Fastify inject)
tests/e2e/         Browser E2E tests (Playwright)
\```

## Commands

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Start frontend + backend |
| `pnpm --filter web typecheck` | TypeScript check |
| `pnpm --filter web build` | Production build |
| `pnpm test:api` | API E2E tests |
| `pnpm test:e2e` | Browser E2E tests |
| `pnpm lint` | Lint check |

## Feature Workflow

\```
1. /start-task #XX        → Read issue, user story, acceptance criteria
2. Plan                   → Explore codebase, design approach
3. Implement              → Write code + unit tests
   ├── New API module?    → /new-api-module [name]
   └── New component?     → /new-component [name]
4. /verify                → Typecheck + build + tests
5. /api-test-generator    → Generate API tests (if backend touched)
6. /ship                  → Commit + PR + changelog
\```

## Conventions

- **Commits**: `feat:`, `fix:`, `docs:`, `refactor:`, `test:` — reference issue number
- **Branches**: `feature/xyz`, `fix/xyz` — always branch from `main`
- **Data fields**: `snake_case` everywhere (DB → API → frontend)
- **Components**: PascalCase files, camelCase hooks/utils
- **API modules**: `[name].schemas.ts` + `[name].handler.ts` + `[name].routes.ts`

## Gotchas

- shadcn `Card` has no `asChild` — wrap with button + card classes
- Native `<select>` over shadcn Select in forms (better form state)
- Google OAuth button: force `bg-white dark:bg-white` for brand
- Shared types: Zod schemas in API modules are source of truth, infer types
- `cn()` utility in `lib/utils.ts` for Tailwind class merging

## Reference

| What | Where |
|------|-------|
| User stories | `docs/product/user-stories-phase1.md` |
| API spec | `docs/engineering/api-spec.md` |
| DB schema | `docs/engineering/database-schema.md` |
| Frontend rules | `docs/guidelines/frontend-rules.md` |
| Backend rules | `docs/guidelines/backend-rules.md` |
| Conventions | `docs/guidelines/conventions.md` |
| Project status | `docs/project/project-status.md` |
| Full commands | `docs/devops/commands.md` |
```

---

## LAYER 2: Skills

### Skill: `/start-task`

**File:** `.claude/skills/start-task.md`

```markdown
# Start Task

> Task onboarding skill — reads issue, finds user story, builds definition of done.

## Invocation

\```
/start-task #XX
/start-task #XX --bug
\```

## Workflow

### Step 1: Read the GitHub Issue

\```bash
gh issue view #XX
\```

Extract:
- Title and description
- Referenced user stories (look for "US-X.X" patterns)
- Subtask checklist (if any)
- Labels (frontend, backend, bug, etc.)

### Step 2: Find User Stories

Read `docs/product/user-stories-phase1.md` and find all referenced user stories (US-X.X).

For each user story, extract:
- **As a** / **I want** / **So that**
- **Acceptance criteria** (numbered list)

### Step 3: Identify Layers

Based on the issue and user stories, determine which layers are touched:

| Layer | Signal | Action |
|-------|--------|--------|
| Frontend | UI changes, components, pages | Read `docs/guidelines/frontend-rules.md` |
| Backend | API endpoints, database, services | Read `docs/guidelines/backend-rules.md` |
| Both | Full-stack feature | Read both |

### Step 4: Build Definition of Done

Create a checklist combining:
1. All acceptance criteria from user stories
2. Relevant conventions from the guidelines read in Step 3
3. Subtasks from the GitHub issue

Output format:

\```
## Task: [Issue Title] (#XX)

### User Story
**US-X.X**: As a [role], I want [goal], so that [benefit]

### Acceptance Criteria
- [ ] AC-1: [criteria]
- [ ] AC-2: [criteria]
...

### Layers Touched
- [x] Frontend / [ ] Backend (or both)

### Key Rules (from guidelines)
- [2-3 most relevant rules for this specific task]

### Ready to implement?
\```

### Step 5 (Bug mode): Root Cause Investigation

If `--bug` flag is used, after reading the issue:
1. Use Explore agent to find the relevant source files
2. Identify the likely root cause
3. Propose a fix approach
4. Add "regression test" to the definition of done

## User Story Quick Reference

| Milestone | User Stories |
|-----------|-------------|
| M1: Auth | US-1.1, US-1.2, US-1.3 |
| M2: Meeting Notes | US-2.1 through US-2.5 |
| M3: Action Board | US-4.1 through US-4.9 |
| M4: AI Extraction | US-3.1, US-3.2, US-3.3 |
| M5: Sharing | US-5.1 through US-5.6 |
| M6: Polish | US-6.1, US-6.2, US-7.1, US-7.2, US-7.3 |
| M7: AI Sample Generation | US-3.4 |

## Session Continuity

After building the definition of done, also read `docs/project/project-status.md` to understand:
- Current project position
- Recent decisions that may affect this task
- Any blockers
```

---

### Skill: `/verify`

**File:** `.claude/skills/verify.md`

```markdown
# Verify

> Pre-commit verification skill — runs typecheck, build, and tests sequentially.

## Invocation

\```
/verify
/verify --skip-tests
\```

## Workflow

Run each step sequentially. Stop and report on first failure.

### Step 1: TypeScript Check

\```bash
pnpm --filter web typecheck
\```

### Step 2: Production Build

\```bash
pnpm --filter web build
\```

### Step 3: API Tests (skip with `--skip-tests`)

\```bash
pnpm test:api
\```

### Report Format

\```
## Verification Results

| Step | Status | Details |
|------|--------|---------|
| TypeScript | PASS / FAIL | [error count or "clean"] |
| Build | PASS / FAIL | [error details if failed] |
| API Tests | PASS / FAIL / SKIPPED | [X passed, Y failed] |

**Overall: READY TO COMMIT / FIX REQUIRED**
\```

### On Failure

If any step fails:
1. Report the exact error
2. Suggest a fix
3. After fixing, re-run `/verify` from the failed step

### Important

- Do NOT skip steps or run them in parallel — later steps depend on earlier ones
- TypeScript errors must be fixed before attempting a build
- Build must succeed before running tests
- If `--skip-tests` is used, only run steps 1 and 2
```

---

### Skill: `/new-api-module`

**File:** `.claude/skills/new-api-module.md`

```markdown
# New API Module

> Scaffolds a complete Fastify API module with schemas, handler, routes, and tests.

## Invocation

\```
/new-api-module [module-name]
\```

Example: `/new-api-module sharing`

## Workflow

### Step 1: Read Context

1. Read `docs/engineering/api-spec.md` for the endpoint specification
2. Read `docs/engineering/database-schema.md` for relevant models
3. Read `docs/guidelines/backend-rules.md` for conventions

### Step 2: Create Module Files

Create `apps/api/src/modules/[name]/` with these files:

#### `[name].schemas.ts`

\```typescript
import { z } from 'zod';

// Request schemas
export const create[Name]BodySchema = z.object({ ... });

// Response schemas (include ALL status codes)
export const [name]ResponseSchema = z.object({ ... });

// Infer types from schemas
export type Create[Name]Body = z.infer<typeof create[Name]BodySchema>;
\```

Rules:
- Zod schemas are the SINGLE source of truth for types
- Define response schemas for ALL status codes (200, 201, 400, 401, 404)
- Import common schemas from `@/schemas/common` when available
- Use `snake_case` for all data fields

#### `[name].handler.ts`

\```typescript
import { NotFoundError } from '@/utils/errors';
import { prisma } from '@/lib/prisma';

export async function create[Name](...) { ... }
\```

Rules:
- Pure functions, no classes
- Throw custom errors (`NotFoundError`, `BadRequestError`, etc.) — NOT HTTP responses
- Use `select` or `include` in every Prisma query — never select all
- Use try-catch for Prisma/external operations

#### `[name].routes.ts`

\```typescript
import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function [name]Routes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.post('/[url-path]', {
    schema: {
      description: '...',
      tags: ['[Name]'],
      body: create[Name]BodySchema,
      response: {
        201: [name]ResponseSchema,
        400: errorResponseSchema,
        401: errorResponseSchema,
      },
    },
    preHandler: [app.authenticate],
    handler: async (request, reply) => { ... },
  });
}
\```

Rules:
- EVERY route MUST have: `description`, `tags`, full `schema` block with `response` for all status codes
- Use `app.authenticate` preHandler for protected routes
- URL paths in kebab-case, plural nouns for collections
- DELETE returns 204, POST returns 201, GET/PUT returns 200

### Step 3: Register Routes

Add to `apps/api/src/app.ts`:
\```typescript
import { [name]Routes } from './modules/[name]/[name].routes.js';
app.register([name]Routes, { prefix: '/api/v1' });
\```

### Step 4: Verify Swagger

After registration, the endpoint should appear at `http://localhost:3000/docs`.

Remind user: "Start the dev server with `pnpm dev` and verify your endpoint appears in Swagger at http://localhost:3000/docs"

### Step 5: Suggest Tests

After the module is working:
\```
The module is scaffolded. Would you like me to generate API E2E tests?
→ /api-test-generator [name]
\```
```

---

### Skill: `/new-component`

**File:** `.claude/skills/new-component.md`

```markdown
# New Component

> Scaffolds a React component following project conventions.

## Invocation

\```
/new-component [ComponentName]
/new-component [ComponentName] --page
\```

Example: `/new-component ShareDialog`, `/new-component SharePage --page`

## Workflow

### Step 1: Read Context

1. Read `docs/guidelines/frontend-rules.md` for conventions
2. Check existing similar components in `apps/web/src/components/` for patterns
3. If `--page`, check `apps/web/src/pages/` instead

### Step 2: Determine Location

| Type | Location | Naming |
|------|----------|--------|
| Component | `apps/web/src/components/[Name].tsx` | PascalCase |
| Page | `apps/web/src/pages/[Name]Page.tsx` | PascalCase + "Page" suffix |
| UI primitive | `apps/web/src/components/ui/[name].tsx` | lowercase (shadcn convention) |

### Step 3: Create Component

Follow this file structure order:

\```typescript
// 1. Imports
import { cn } from '@/lib/utils';

// 2. Types
interface [Name]Props {
  // ...
}

// 3. Component
export function [Name]({ ...props }: [Name]Props) {
  // 4. Hooks
  // 5. Derived state
  // 6. Callbacks
  // 7. Effects
  // 8. Early returns (loading, error, empty)
  // 9. Render
  return (
    <div data-testid="[kebab-case-name]">
      {/* ... */}
    </div>
  );
}
\```

Rules:
- Functional components ONLY — no class components
- Always include `data-testid` on root element
- Use `cn()` for conditional Tailwind classes
- Use semantic color tokens (`text-destructive`, `bg-success/10`, etc.)
- Support dark mode — no hardcoded colors
- Use shadcn/ui primitives from `components/ui/` when available
- TanStack Query for server state, `useState` for UI state
- Focus states: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`

### Step 4: Wire Up (Pages only)

If `--page` was used:
1. Add route in `apps/web/src/App.tsx` (or router file)
2. Add navigation link in Sidebar if needed

### Step 5: Accessibility Checklist

Verify:
- [ ] Interactive elements are focusable
- [ ] Color contrast meets 4.5:1 for text
- [ ] Aria labels on icon-only buttons
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Loading/error states communicate to screen readers
```

---

### Skill: `/ship`

**File:** `.claude/skills/ship.md`

```markdown
# Ship

> Commit, PR, and changelog workflow — runs verification first.

## Invocation

\```
/ship
/ship --no-pr
\```

## Workflow

### Step 1: Run Verification

Execute the `/verify` skill first. If any check fails, stop and fix before shipping.

### Step 2: Stage and Commit

1. Run `git status` and `git diff` to review changes
2. Stage relevant files (avoid `.env`, credentials, large binaries)
3. Create commit with conventional format:

\```
feat: [description] (#XX)

- [bullet point of key change]
- [bullet point of key change]

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
\```

Prefix rules:
| Change Type | Prefix |
|-------------|--------|
| New feature | `feat:` |
| Bug fix | `fix:` |
| Documentation | `docs:` |
| Refactoring | `refactor:` |
| Tests | `test:` |
| Build/CI | `chore:` |

### Step 3: Create PR (skip with `--no-pr`)

1. Push branch to remote: `git push -u origin [branch-name]`
2. Create PR using `gh pr create`:

\```
## Summary
- [1-3 bullet points of what changed]

## User Story
Closes #XX
Acceptance criteria:
- [x] AC-1
- [x] AC-2

## Test Plan
- [ ] TypeScript compiles clean
- [ ] Build succeeds
- [ ] API tests pass
- [ ] Manual verification of [specific thing]

Generated with Claude Code
\```

### Step 4: Update Changelog

Add entry to `docs/project/changelog.md` with:
- Date
- What changed (user-facing summary)
- Issue/PR reference

### Important

- NEVER force push
- NEVER skip pre-commit hooks
- ALWAYS run `/verify` before committing
- Ask user to confirm the commit message before creating it
```

---

### Skill: `/api-test-generator` (Enhanced)

**File:** `.claude/skills/api-test-generator.md` (REPLACE existing)

**Changes from current version:**
1. Auto-detect endpoints from route files (no manual specification)
2. Generate tests for ALL status codes in schema (not just happy path)
3. Include auth/unauth test pairs automatically
4. Reference `backend-rules.md` instead of deleted `api_testing_guidelines.md`

```markdown
# API Test Generator

> Skill for generating API E2E tests using Vitest + Fastify `inject()`

> **Source of truth:** Module source code (schemas, routes, handler) — not docs.

## Invocation

\```
/api-test-generator [module-name]
/api-test-generator [module-name] --check
\```

**Modes:**
- **Default (generate):** Discover existing tests, report gaps, then generate only missing tests (additive)
- **`--check`:** Discover and report gaps only — do not generate any code

## Workflow

### Step 0: Pre-Generation Discovery (ALWAYS DO FIRST)

Before generating any test code:

1. **Read schemas** → `apps/api/src/modules/[module]/[module].schemas.ts`
   (request/response shapes, defaults, validation constraints, enums)
2. **Read routes** → `apps/api/src/modules/[module]/[module].routes.ts`
   (HTTP methods, URLs, auth requirements, response status codes)
3. **Read handler** → `apps/api/src/modules/[module]/[module].handler.ts`
   (business logic: ownership checks, auto-calc, cascades)
4. **Read conventions** → `docs/guidelines/backend-rules.md` (error shapes, conventions)
5. **Check existing tests** → `tests/api/[module].test.ts`
6. **Auto-detect endpoints** — Parse the routes file to extract ALL endpoints:
   - HTTP method + URL pattern
   - Schema response status codes (these define what to test)
   - Auth requirements (preHandler)

**Report format (show to user before generating):**

\```
## Test Coverage Report: [module]

### Endpoints Detected (from routes file)
- POST /api/v1/[resource] → 201, 400, 401
- GET /api/v1/[resource] → 200, 401
- GET /api/v1/[resource]/:id → 200, 401, 404
- PUT /api/v1/[resource]/:id → 200, 400, 401, 404
- DELETE /api/v1/[resource]/:id → 204, 401, 404

### Existing Tests
- tests/api/[module].test.ts: X describe blocks, Y test cases
  - POST /api/v1/[resource]: 401 ✓, 201 ✓, 400 ✓
  ...

### Missing Tests
- GET /api/v1/[resource]: pagination defaults, user isolation
- PUT /api/v1/[resource]/:id: partial update, 404 other user
...

Shall I generate the missing tests?
\```

If `--check` was specified, stop here. Otherwise, proceed after user confirmation.

### Step 1: Additive Generation

- **APPEND** missing tests to existing files — never overwrite
- Only generate new `describe()` blocks for endpoints that have no tests
- Only add new `it()` blocks for missing test cases within existing `describe()` blocks
- Preserve existing imports, setup hooks, and test structure

### Step 2: Standard Test Pairs (auto-generate for each endpoint)

For every authenticated endpoint, ALWAYS generate:

| Test | What it verifies |
|------|-----------------|
| 401 Unauthorized | No session token → `{ error: { code: "UNAUTHORIZED" } }` |
| 400 Bad Request | Invalid/missing required fields |
| 404 Not Found | Non-existent resource (valid UUID format) |
| 404 User Isolation | Other user's resource → 404 (NOT 403) |
| 200/201 Success | Happy path with correct response shape |
| Defaults | Omitted optional fields have correct defaults |
| Response shape | All expected fields present and typed correctly |

## Test Infrastructure

\```typescript
// Always import from setup and factories
import { setupApp, teardownApp, cleanupDatabase, createTestContext, makeRequest, parseBody } from './setup.js';
import { createUser, createUserWithSession, createMeetingNote, createActionItem } from './factories.js';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
\```

## Error Response Shapes

Two shapes to test against:

**AppError (handler-thrown):**
\```typescript
{ error: { code: string; message: string } }
// Codes: NOT_FOUND, UNAUTHORIZED, BAD_REQUEST, FORBIDDEN, CONFLICT, EXTRACTION_FAILED, RATE_LIMITED
\```

**Validation error (Fastify/Zod):**
\```typescript
{ statusCode: 400, error: "Bad Request", message: "body/fieldName Required" }
\```

## Running Tests

\```bash
pnpm test:api                    # Run all
pnpm test:api tests/api/X.test.ts  # Run specific file
pnpm test:api:report             # JSON + JUnit reports
pnpm test:api:html               # Interactive HTML report
\```

## Checklist

For each endpoint, ensure tests cover:
- [ ] 401 Unauthorized (no session token)
- [ ] 400 Bad Request (invalid/missing fields)
- [ ] 404 Not Found (non-existent resource)
- [ ] 404 User isolation (other user's data)
- [ ] 200/201 Success (happy path + response shape)
- [ ] Defaults (optional fields)
- [ ] Edge cases (empty lists, pagination boundaries)
```

---

### Skill: `/e2e-test-generator` (Enhanced)

**File:** `.claude/skills/e2e-test-generator.md` (REPLACE existing)

**Changes from current version:**
1. Focus on critical user flows, not individual components
2. Emphasize page object pattern from existing fixtures
3. Reference `frontend-rules.md` instead of deleted guidelines
4. Add milestone-level thinking

```markdown
# E2E Test Generator

> Skill for generating Browser E2E tests using Playwright

> **WARNING:** Before using this skill, verify your test assumptions against:
> - `docs/product/product-spec.md` (Phase 1 scope)
> - `docs/engineering/api-spec.md` (HTTP methods)

## Invocation

\```
/e2e-test-generator [flow-name]
\```

Examples:
- `/e2e-test-generator auth` — Login/logout flows
- `/e2e-test-generator meeting-notes` — Notes CRUD
- `/e2e-test-generator kanban-board` — Board interactions
- `/e2e-test-generator extraction` — AI extraction flow

## Workflow

### Step 0: Identify Critical User Flows

Focus on user flows that span multiple pages/interactions, NOT individual component tests.

A "critical flow" is an end-to-end path a user takes:
- Login → Create note → Extract action items → View on board
- Login → Create action item manually → Drag to "Done"
- Login → Share board → View shared link (unauthenticated)

### Step 1: Read Context

1. Read `docs/product/user-stories-phase1.md` for the relevant user stories
2. Read `docs/product/product-spec.md` to verify Phase 1 scope
3. Check existing page objects in `tests/e2e/fixtures/pages/`
4. Check existing specs in `tests/e2e/`

### Step 2: Create/Update Page Objects

All locators and actions go in page objects, NOT in test files.

Location: `tests/e2e/fixtures/pages/[feature].page.ts`

\```typescript
import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page.js';

export class FeaturePage extends BasePage {
  constructor(page: Page) { super(page); }

  async goto(): Promise<void> { await this.page.goto('/feature'); }
  async waitForReady(): Promise<void> { await expect(this.mainContent).toBeVisible(); }

  // Locators — prefer: data-testid > ARIA role > label > text
  get mainContent(): Locator { return this.page.getByTestId('feature-content'); }
  get createButton(): Locator { return this.page.getByRole('button', { name: /create/i }); }

  // Actions — encapsulate multi-step interactions
  async createItem(name: string): Promise<void> { ... }

  // Assertions — reusable
  async expectItemVisible(name: string): Promise<void> { ... }
}
\```

### Step 3: Write Test Specs

Location: `tests/e2e/[flow-name].spec.ts`

\```typescript
import { test, expect } from '../fixtures/auth.fixture.js';
import { FeaturePage } from './fixtures/pages/feature.page.js';

test.describe('Feature Flow', () => {
  let featurePage: FeaturePage;

  test.beforeEach(async ({ authenticatedPage }) => {
    featurePage = new FeaturePage(authenticatedPage);
    await featurePage.goto();
    await featurePage.waitForReady();
  });

  test('should complete the happy path', async () => { ... });
  test('should show empty state', async () => { ... });
  test('should handle errors gracefully', async () => { ... });
});
\```

### Step 4: Spec Cross-Reference (REQUIRED)

| What | File | Check |
|------|------|-------|
| User story | `docs/product/user-stories-phase1.md` | Each AC maps to a test |
| Phase scope | `docs/product/product-spec.md` | Don't test Phase 2/3 features |
| HTTP methods | `docs/engineering/api-spec.md` | PUT vs PATCH in waitForResponse |

### Quick Reference: Action Item Fields

**Phase 1 (test these):** title, description, priority, due_date, status
**NOT Phase 1 (skip):** assignee (Phase 3)

### Quick Reference: HTTP Methods

| Operation | Method | Endpoint |
|-----------|--------|----------|
| Full update | PUT | `/api/v1/action-items/:id` |
| Status only | PATCH | `/api/v1/action-items/:id/status` |

## Selector Priority

1. `data-testid` (most stable)
2. ARIA roles + accessible names
3. Labels (forms)
4. Placeholder text
5. Text content (least stable)

## Running Tests

\```bash
pnpm test:e2e                    # All tests
pnpm test:e2e:ui                 # Interactive UI mode
pnpm test:e2e:headed             # See browser
pnpm test:e2e tests/e2e/X.spec.ts  # Specific file
\```

## Checklist

For each user flow:
- [ ] Happy path end-to-end
- [ ] Empty states
- [ ] Error states (API failures)
- [ ] Loading states
- [ ] Authentication (protected routes redirect)
- [ ] Keyboard navigation (Tab, Enter, Escape)
```

---

## LAYER 3: Compact Guidelines

### `frontend-rules.md`

**File:** `docs/guidelines/frontend-rules.md`
**Target:** ≤200 lines
**Replaces:** `frontend_guidelines.md` (472 lines) + `ui_ux_guidelines.md` (1,174 lines)

```markdown
# Frontend Rules

> Compact rules for React + Vite + TypeScript + shadcn/ui + Tailwind CSS.
> Every line answers: "Would Claude make a mistake without this?"

## Component Structure

| Order | Section | Example |
|-------|---------|---------|
| 1 | Imports | `import { cn } from '@/lib/utils'` |
| 2 | Types | `interface Props { ... }` |
| 3 | Component | `export function Name({ ... }: Props)` |
| 4 | Hooks | `const { data } = useQuery(...)` |
| 5 | Derived state | `const filtered = items.filter(...)` |
| 6 | Callbacks | `const handleClick = useCallback(...)` |
| 7 | Effects | `useEffect(...)` |
| 8 | Early returns | Loading, error, empty states |
| 9 | Render | `return (...)` |

## Component Rules

- Functional components ONLY — no class components
- Always `data-testid` on root element (kebab-case)
- Use `cn()` for conditional classes — never string concatenation
- Use `type` keyword for type imports: `import type { X } from '...'`
- Prefer named exports over default exports

## State Management

| Type | Tool | Example |
|------|------|---------|
| Server state | TanStack Query | `useQuery`, `useMutation` with `queryClient.invalidateQueries` |
| UI state | `useState` | `isModalOpen`, `selectedTab` |
| Form state | React Hook Form or `useState` | Controlled inputs |

- NO Zustand yet in this project
- Mutation hooks in `hooks/` with toast notifications via `sonner`

## Styling

### Color Tokens (use these, not raw colors)

| Token | Usage |
|-------|-------|
| `bg-background` / `text-foreground` | Default surface/text |
| `bg-primary` / `text-primary-foreground` | Primary actions |
| `bg-destructive` / `text-destructive` | Delete, errors |
| `bg-muted` / `text-muted-foreground` | Secondary text, disabled |
| `bg-accent` | Hover states |
| `border-border` | All borders |
| `ring-ring` | Focus rings |
| `bg-success/10` / `text-success` | Success states (custom) |
| `bg-warning/10` / `text-warning` | Warning states (custom) |
| `bg-info/10` / `text-info` | Info states (custom) |

### Spacing

- All spacing is multiples of 4px (Tailwind defaults: `p-1`=4px, `p-2`=8px, etc.)
- No arbitrary values like `p-[7px]`

### Dark Mode

- ThemeProvider uses `attribute="class"` + `enableSystem`
- Toggle component in Sidebar
- Never hardcode colors — always use tokens above
- Google OAuth button exception: `bg-white dark:bg-white`

## Focus & Accessibility

- Focus states: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`
- Motion: add `motion-reduce:transition-none` on animated elements
- Color contrast: 4.5:1 for normal text, 3:1 for large text
- Aria labels on icon-only buttons
- Interactive elements must be keyboard navigable (Tab, Enter, Escape)
- Loading/error states should communicate to screen readers

## shadcn/ui Gotchas

| Issue | Solution |
|-------|----------|
| Card has no `asChild` | Wrap with button + card classes |
| Select in forms | Use native `<select>` (better form state) |
| DropdownMenu in dnd-kit | Portal behavior actually helps (clicks don't propagate) |
| `shadcn init` overwrites files | Always back up `lib/utils.ts`, `tailwind.config.js`, `index.css` |

## File Naming

| Type | Convention | Example |
|------|-----------|---------|
| Component | PascalCase | `ActionItemCard.tsx` |
| Page | PascalCase + Page | `BoardPage.tsx` |
| Hook | camelCase + use | `useActionItems.ts` |
| Utility | camelCase | `formatDate.ts` |
| UI primitive | lowercase | `button.tsx` (shadcn) |

## Import Organization

1. React/external libraries
2. Internal components (`@/components/...`)
3. Hooks (`@/hooks/...`)
4. Utils/services (`@/lib/...`, `@/services/...`)
5. Types (with `type` keyword)

## Selector Strategy (for E2E tests)

1. `data-testid` (most stable)
2. ARIA roles + accessible names
3. Labels
4. Placeholder text
5. Text content (least stable)
```

---

### `backend-rules.md`

**File:** `docs/guidelines/backend-rules.md`
**Target:** ≤200 lines
**Replaces:** `backend_guidelines.md` (1,059) + `api_guidelines.md` (341) + `database_guidelines.md` (357) + `api_testing_guidelines.md` (257) + `security_guidelines.md` (76)

```markdown
# Backend Rules

> Compact rules for Fastify + Prisma + Zod + PostgreSQL.
> Every line answers: "Would Claude make a mistake without this?"

## Module Structure

Every API feature is a 3-file module in `apps/api/src/modules/[name]/`:

| File | Purpose | Rules |
|------|---------|-------|
| `[name].schemas.ts` | Zod schemas + inferred types | Single source of truth. NO separate type files. |
| `[name].handler.ts` | Business logic | Pure functions, no classes. Throw custom errors. |
| `[name].routes.ts` | HTTP wiring | `withTypeProvider<ZodTypeProvider>()`. Full schema block. |

## Schema Rules

- Zod schemas define ALL types — never create separate TypeScript interfaces
- Response schemas for EVERY status code (200, 201, 400, 401, 404, 422)
- Import common schemas from `@/schemas/common`
- All data fields: `snake_case` (DB → API → frontend, no transformation)

## Handler Rules

- Pure functions — no classes, no HTTP concerns
- Throw custom errors: `NotFoundError`, `BadRequestError`, `UnauthorizedError`, `ForbiddenError`, `ConflictError`, `ValidationError`
- Use try-catch for Prisma and external service calls
- Always `select` or `include` in Prisma queries — never return all fields
- Other user's resource → throw `NotFoundError` (not Forbidden, prevents info leak)

## Route Rules

- EVERY route MUST have: `description`, `tags`, `schema` block with `response` for all status codes
- Use `app.authenticate` preHandler for protected routes
- NO try-catch in route handlers — Fastify handles async errors automatically
- Use `withTypeProvider<ZodTypeProvider>()` on the Fastify instance

## URL Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Paths | kebab-case, plural nouns | `/api/v1/action-items` |
| Max nesting | 3 levels | `/users/:id/orders/:order_id` |
| Data fields | snake_case | `{ user_id, created_at }` |
| Query params | snake_case | `?sort_by=created_at` |

## HTTP Methods & Status Codes

| Method | Success Code | Use For |
|--------|-------------|---------|
| GET | 200 | Read resource(s) |
| POST | 201 | Create resource |
| PUT | 200 | Full update |
| PATCH | 200 | Partial/single-field update |
| DELETE | 204 (no body) | Delete resource |

## Response Format

**Success:** `{ data: { ... } }` or `{ data: [...], pagination: { ... } }`

**Pagination fields:** `page`, `limit`, `total_items`, `total_pages`, `has_next_page`, `has_prev_page`

**Application error:** `{ error: { code: "NOT_FOUND", message: "..." } }`

**Validation error (Fastify/Zod):** `{ statusCode: 400, error: "Bad Request", message: "body/field Required" }`

## Error Classes

| Error | Status | Code | When |
|-------|--------|------|------|
| `NotFoundError` | 404 | `NOT_FOUND` | Resource doesn't exist or belongs to other user |
| `BadRequestError` | 400 | `BAD_REQUEST` | Invalid input beyond Zod validation |
| `UnauthorizedError` | 401 | `UNAUTHORIZED` | No/invalid auth token |
| `ForbiddenError` | 403 | `FORBIDDEN` | Valid auth but insufficient permissions |
| `ConflictError` | 409 | `CONFLICT` | Duplicate resource |
| `ValidationError` | 422 | `VALIDATION_ERROR` | Complex validation failures |

Import from `@/utils/errors`. Throw in handlers, NOT in routes.

## Database (Prisma)

- Models: PascalCase in Prisma, snake_case tables via `@@map()`
- Every table: `id String @id @default(cuid())`, `created_at DateTime @default(now())`, `updated_at DateTime @updatedAt`
- Foreign keys: `[relation]_id` pattern with `@@index`
- Index naming: `idx_[table]_[columns]`
- Composite indexes for common query patterns: `@@index([user_id, created_at(sort: Desc)])`
- Transactions: `prisma.$transaction()` for multi-step operations
- Soft deletes: `deleted_at DateTime?` with index

## Swagger / OpenAPI

- Generated automatically from Zod schemas via `@fastify/swagger`
- Interactive docs at `http://localhost:3000/docs` (Scalar)
- After adding endpoint, VERIFY it appears in Swagger
- Schema checklist: `withTypeProvider<ZodTypeProvider>()`, `description`, `tags`, all request/response schemas

## Logging

- NEVER `console.log` — use `request.log` (in handlers) or `app.log` (startup/shutdown)
- Log levels: error, warn, info, debug
- NEVER log passwords, tokens, API keys, or PII

## Security Quick Reference

| Area | Rule |
|------|------|
| Auth | Google OAuth with session cookies (httpOnly) |
| Validation | Zod on every request body, params, query |
| Rate limits | Auth: 100/min, Unauth: 20/min, Login: 5/15min/IP |
| Injection | Prisma parameterized queries (no raw SQL) |
| Headers | Helmet: HSTS, X-Content-Type-Options, X-Frame-Options, CSP |
| Secrets | Environment variables only, never commit `.env` |

## Route Registration

Register in `apps/api/src/app.ts` with `/api` prefix:
\```typescript
app.register([name]Routes, { prefix: '/api/v1' });
\```
```

---

### `conventions.md`

**File:** `docs/guidelines/conventions.md`
**Target:** ≤100 lines
**Replaces:** `naming_guidelines.md` (174) + `architecture_guidelines.md` (321) + `testing_guidelines.md` (877) — conventions extracted

```markdown
# Conventions

> Cross-cutting conventions for naming, git, testing, and architecture.

## Naming

| Context | Convention | Example |
|---------|-----------|---------|
| Data fields (ALL layers) | snake_case | `user_id`, `created_at`, `is_active` |
| UI-only state | camelCase | `isLoading`, `isModalOpen` |
| Components | PascalCase | `ActionItemCard`, `BoardPage` |
| Functions/hooks | camelCase | `getUserById()`, `useAuth()` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRIES`, `SESSION_COOKIE_NAME` |
| URL paths | kebab-case, plural | `/api/v1/action-items` |
| Query params | snake_case | `?sort_by=created_at&page=1` |
| Prisma models | PascalCase | `MeetingNote` (maps to `meeting_notes` table) |
| DB columns | snake_case | `meeting_note_id`, `board_order` |
| Indexes | idx_table_columns | `idx_action_items_user_id` |

### File Naming

| Type | Convention | Example |
|------|-----------|---------|
| React components | PascalCase | `ActionItemCard.tsx` |
| Pages | PascalCase + Page | `BoardPage.tsx` |
| Hooks | camelCase + use | `useActionItems.ts` |
| Utils | camelCase | `formatDate.ts` |
| Backend modules | kebab-case | `meeting-notes.handler.ts` |
| UI primitives | lowercase | `button.tsx` (shadcn) |

### Anti-Patterns

- `userId` in API response → use `user_id`
- `createdAt` in database → use `created_at`
- `UserCard.ts` (missing `.tsx`) → use `.tsx` for JSX

## Git Conventions

### Branches
- `feature/[description]` — new features
- `fix/[description]` — bug fixes
- Always branch from `main`: `git checkout main && git pull && git checkout -b feature/xyz`

### Commits (Conventional)
- `feat: add board sharing (#XX)` — new feature
- `fix: correct due date parsing (#XX)` — bug fix
- `docs: update API spec` — documentation
- `refactor: extract card component` — no behavior change
- `test: add auth E2E tests` — tests only
- `chore: update dependencies` — tooling/build

### PRs
- Short title (<70 chars), body has Summary + User Story + Test Plan
- Reference issue number in title or body
- Include acceptance criteria checklist

## Testing Strategy

| Type | When to Write | When to Run | Location |
|------|--------------|-------------|----------|
| Unit tests | During implementation | Every `/verify` | `apps/*/src/**/*.test.ts` (co-located) |
| API E2E | After endpoint works in Swagger | Before PR | `tests/api/*.test.ts` |
| Browser E2E | At milestone completion | Before merge to main | `tests/e2e/*.spec.ts` |

### Test Pyramid
- Unit tests: MOST (cheap, fast, test business logic)
- API E2E: SOME (test contracts, auth, validation)
- Browser E2E: FEW (test critical user flows only)

### Test Infrastructure
- `createTestContext()` → creates user + session token
- `makeRequest()` → HTTP calls (NOT `app.inject()` directly)
- `parseBody<T>()` → typed response parsing
- Factories in `tests/api/factories.ts` → never inline Prisma in tests

## Architecture Patterns

| Pattern | Rule |
|---------|------|
| API-first | Design OpenAPI spec before implementing |
| Schema-first | Zod schemas define types, never separate interfaces |
| Feature-based | Modules by feature (`modules/auth/`), not by layer |
| No file uploads | Phase 1 is paste text only |
| Monorepo | pnpm workspaces, atomic cross-package changes |
```

---

## Old Files to Archive

These files should be moved to `docs/guidelines/archive/` (or deleted if you prefer):

| File                         | Lines     | Replaced By                    |
| ---------------------------- | --------- | ------------------------------ |
| `frontend_guidelines.md`     | 472       | `frontend-rules.md`            |
| `ui_ux_guidelines.md`        | 1,174     | `frontend-rules.md`            |
| `backend_guidelines.md`      | 1,059     | `backend-rules.md`             |
| `api_guidelines.md`          | 341       | `backend-rules.md`             |
| `database_guidelines.md`     | 357       | `backend-rules.md`             |
| `testing_guidelines.md`      | 877       | `conventions.md` + test skills |
| `api_testing_guidelines.md`  | 257       | `api-test-generator.md` skill  |
| `naming_guidelines.md`       | 174       | `conventions.md`               |
| `architecture_guidelines.md` | 321       | `conventions.md`               |
| `security_guidelines.md`     | 76        | `backend-rules.md`             |
| **TOTAL removed**            | **5,108** |                                |

### Archive Command

```bash
mkdir -p docs/guidelines/archive
mv docs/guidelines/frontend_guidelines.md docs/guidelines/archive/
mv docs/guidelines/ui_ux_guidelines.md docs/guidelines/archive/
mv docs/guidelines/backend_guidelines.md docs/guidelines/archive/
mv docs/guidelines/api_guidelines.md docs/guidelines/archive/
mv docs/guidelines/database_guidelines.md docs/guidelines/archive/
mv docs/guidelines/testing_guidelines.md docs/guidelines/archive/
mv docs/guidelines/api_testing_guidelines.md docs/guidelines/archive/
mv docs/guidelines/naming_guidelines.md docs/guidelines/archive/
mv docs/guidelines/architecture_guidelines.md docs/guidelines/archive/
mv docs/guidelines/security_guidelines.md docs/guidelines/archive/
```

---

## Hooks Configuration

Add to `.claude/settings.local.json` (or project settings):

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit",
        "hooks": [
          {
            "type": "command",
            "command": "pnpm --filter web typecheck 2>&1 | tail -5"
          }
        ]
      }
    ]
  }
}
```

**What this does:** After every file edit, runs TypeScript check and shows last 5 lines. Catches type errors immediately rather than at commit time.

**Trade-off:** Adds ~2-3 seconds per edit. Worth it for catching type errors early. Can be disabled if it becomes annoying during rapid iteration.

---

## MEMORY.md Update

Update `/Users/mishit/.claude/projects/-Users-mishit-Documents-code-minutes-to-actions/memory/MEMORY.md`:

```markdown
# Project Memory: Minutes to Actions

## Architecture
- **Monorepo**: pnpm workspaces — `apps/web` (React/Vite), `apps/api` (Fastify)
- **Design System**: shadcn/ui + Radix UI + Tailwind CSS + CSS variables for theming
- **State**: TanStack Query for server state, local useState for UI state
- **DnD**: @dnd-kit for Kanban board drag-and-drop
- **Auth**: Google OAuth with session cookies

## Workflow (3-Layer Architecture)
- **CLAUDE.md** (~55 lines): Always loaded. Commands, conventions, gotchas, reference links.
- **Skills** (on-demand): `/start-task`, `/verify`, `/new-api-module`, `/new-component`, `/ship`
- **Guidelines** (on-demand): `frontend-rules.md`, `backend-rules.md`, `conventions.md`
- Old guidelines archived in `docs/guidelines/archive/`

## Key Patterns
- `cn()` utility in `lib/utils.ts` for Tailwind class merging (clsx + tailwind-merge)
- Mutation hooks in `hooks/` with toast notifications via `sonner`
- Semantic color tokens: `--success`, `--warning`, `--info` (custom), plus standard shadcn vars
- Dark mode via `next-themes` with `attribute="class"`, toggle in Sidebar
- All data-testid attributes preserved for E2E tests

## Gotchas
- shadcn `Card` doesn't support `asChild` — use button wrapper with card classes instead
- Native `<select>` used for forms (works better with form state) over shadcn Select
- DropdownMenu portals actually *improve* dnd-kit compatibility (clicks don't propagate)
- shadcn init may overwrite `lib/utils.ts`, `tailwind.config.js`, `index.css` — always back up
- Google OAuth button forced to `bg-white dark:bg-white` for brand compliance

## Commands
- `pnpm --filter web typecheck` — TypeScript check
- `pnpm --filter web build` — Full build
- `pnpm test:api` — API E2E tests
- `pnpm test:e2e` — Browser E2E tests
```

---

## Implementation Checklist

### Phase 1: Foundation
- [ ] Rewrite `CLAUDE.md` (~55 lines) — content provided above
- [ ] Create `.claude/skills/start-task.md` — content provided above
- [ ] Create `.claude/skills/verify.md` — content provided above
- [ ] Create `docs/guidelines/conventions.md` (≤100 lines) — content provided above

### Phase 2: Scaffolding Skills
- [ ] Create `.claude/skills/new-api-module.md` — content provided above
- [ ] Create `.claude/skills/new-component.md` — content provided above
- [ ] Create `.claude/skills/ship.md` — content provided above

### Phase 3: Guideline Compression
- [ ] Create `docs/guidelines/frontend-rules.md` (≤200 lines) — content provided above
- [ ] Create `docs/guidelines/backend-rules.md` (≤200 lines) — content provided above
- [ ] Archive old guideline files (move to `docs/guidelines/archive/`)

### Phase 4: Test Skill Enhancement
- [ ] Replace `.claude/skills/api-test-generator.md` — content provided above
- [ ] Replace `.claude/skills/e2e-test-generator.md` — content provided above

### Phase 5: Cleanup
- [ ] Update MEMORY.md — content provided above
- [ ] Set up post-edit typecheck hook — config provided above
- [ ] Update `docs/project/project-status.md` with new workflow
- [ ] Verify all skill invocations work (`/start-task`, `/verify`, etc.)
- [ ] Delete `docs/guidelines/archive/` after confirming nothing is lost

---

## What's NOT Changing

These files remain as-is:
- `docs/project/*` — Project status, plan, changelog (working well)
- `docs/product/*` — Product spec, user stories (source of truth)
- `docs/engineering/*` — API spec, DB schema, architecture (reference docs)
- `docs/devops/*` — Commands, CI/CD, troubleshooting (operational reference)
