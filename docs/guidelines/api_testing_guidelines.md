# API Testing Guidelines

> **Last Updated:** 2026-02-05
> **Scope:** API E2E tests (`tests/api/`) using Vitest + Fastify `inject()`
> **Companion Doc:** `docs/guidelines/testing_guidelines.md` covers all three test layers at a high level. This document is the **specialized API testing reference** for module-specific business rules, error conventions, and Claude Code generation instructions.

---

## 1. API E2E Testing

API tests live in `tests/api/` and use Vitest + Fastify `inject()`. They exercise the
full application stack: HTTP request → authentication → handler → database → response
serialization.

| Location | Runner | Command |
|----------|--------|---------|
| `tests/api/*.test.ts` | Vitest | `pnpm test:api` |
| `tests/api/*.test.ts` | Vitest | `pnpm test:api:report` (with JSON/JUnit output) |
| `tests/api/*.test.ts` | Vitest UI | `pnpm test:api:ui` (interactive browser) |
| `tests/api/*.test.ts` | Vitest | `pnpm test:api:coverage` (with coverage report) |

---

## 2. Shared Infrastructure

### Setup Utilities (`tests/api/setup.ts`)

```typescript
import {
  setupApp,           // Initialize Fastify app (call in beforeAll)
  teardownApp,        // Close app + disconnect DB (call in afterAll)
  cleanupDatabase,    // Delete all test data respecting FK order (call in beforeEach)
  createTestContext,   // Create user + session → { user, sessionToken }
  makeRequest,        // HTTP testing via Fastify inject()
  parseBody,          // JSON.parse with type safety
  SESSION_COOKIE_NAME, // 'session_token'
  prisma,             // Direct DB access for assertions
} from './setup.js';
```

**`makeRequest` Signature:**
```typescript
makeRequest(options: {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  body?: unknown;
  sessionToken?: string;   // Automatically set as session cookie
  headers?: Record<string, string>;
}) → Promise<{ statusCode: number; body: string; headers: object }>
```

**`createTestContext` Signature:**
```typescript
createTestContext(userData?: {
  email?: string;
  name?: string;
}) → Promise<{ user: User; sessionToken: string }>
```

### Factories (`tests/api/factories.ts`)

| Factory | Purpose |
|---------|---------|
| `buildUser()` | Faker-based user object (no DB) |
| `createUser(overrides?)` | Persist user to DB |
| `createUserWithSession(overrides?)` | User + session token |
| `buildMeetingNote(userId, overrides?)` | Faker-based note (no DB) |
| `createMeetingNote(userId, overrides?)` | Persist note to DB |
| `buildMeetingNoteBodyWithActions(actions[])` | Realistic note text with action bullet points |
| `buildActionItem(userId, overrides?)` | Faker-based item (no DB) |
| `createActionItem(userId, overrides?)` | Persist item to DB |
| `createActionItemsInAllStatuses(userId)` | 4 items: 2 todo, 1 doing, 1 done (sequential positions) |
| `createManyActionItems(userId, count, overrides?)` | Batch creation |
| `seedCompleteUserData()` | User + session + 2 notes + 3 items (some linked) |

**When to extend factories:** Add a new factory when a test needs a data shape that doesn't exist yet. Keep factories in `factories.ts`, not inline in test files.

---

## 3. Authentication Testing

Every protected endpoint must include a 401 test:

```typescript
it('should return 401 when not authenticated', async () => {
  const response = await makeRequest({
    method: 'GET',
    url: '/api/v1/protected-resource',
  });

  expect(response.statusCode).toBe(401);
  const body = parseBody<{ error: { code: string } }>(response);
  expect(body.error.code).toBe('UNAUTHORIZED');
});
```

### Authentication Patterns

| Scenario | Expected |
|----------|----------|
| No session cookie | 401 `UNAUTHORIZED` |
| Invalid/expired token | 401 `UNAUTHORIZED` |
| Valid token, own resource | 200/201 |
| Valid token, other user's resource | **404** (not 403 — prevents info leakage) |

### Test Login Endpoint

For API E2E tests, use `createTestContext()` which internally creates a user and session. The `/auth/test-login` endpoint is available in non-production environments but `createTestContext()` is preferred for test isolation.

---

## 4. Error Response Conventions

The API produces **two distinct error shapes**. Tests must assert the correct one.

### Shape 1: Application Errors (AppError)

Thrown by handler code via custom error classes.

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Action item not found"
  }
}
```

**Error Codes Reference:**

| Error Class | Status | Code | When |
|-------------|--------|------|------|
| `NotFoundError` | 404 | `NOT_FOUND` | Resource missing or belongs to another user |
| `UnauthorizedError` | 401 | `UNAUTHORIZED` | No/invalid session |
| `BadRequestError` | 400 | `BAD_REQUEST` | Semantic validation failure |
| `ForbiddenError` | 403 | `FORBIDDEN` | Action not allowed (e.g., test-login in prod) |
| `ConflictError` | 409 | `CONFLICT` | Duplicate resource |
| `ExtractionError` | 500 | `EXTRACTION_FAILED` | AI extraction failure |
| `RateLimitError` | 429 | `RATE_LIMITED` | Too many requests |

### Shape 2: Validation Errors (Fastify/Zod)

Thrown automatically when request body/params/query fail Zod schema validation.

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "body/title must be a string..."
}
```

### Asserting Errors in Tests

```typescript
// AppError (handler-thrown)
const body = parseBody<{ error: { code: string; message: string } }>(response);
expect(body.error.code).toBe('NOT_FOUND');

// Validation error (Zod/Fastify)
const body = parseBody<{ statusCode: number; error: string; message: string }>(response);
expect(body.statusCode).toBe(400);
```

---

## 5. Module Business Rules

For module-specific behavior rules (defaults, cascades, auto-calculated fields),
see `docs/engineering/api-spec.md` — each module has a "Behavior Notes" subsection.

---

## 6. Standard Test Checklist

For **every** endpoint, verify:

- [ ] **401** — Request without session token
- [ ] **400** — Missing/invalid required fields (Zod validation)
- [ ] **404** — Non-existent resource ID
- [ ] **404** — Another user's resource (not 403)
- [ ] **200/201** — Happy path with correct response shape
- [ ] **Defaults** — Omitted optional fields have correct default values
- [ ] **User isolation** — List endpoints return only current user's data
- [ ] **Response shape** — Field names match schema (snake_case), types are correct

### Additional Checks per Type

| Endpoint Type | Extra Checks |
|---------------|-------------|
| List (GET collection) | Empty array, pagination fields, ordering |
| Create (POST) | Defaults applied, auto-calculated fields (position) |
| Update (PUT) | Partial update works, unchanged fields preserved |
| Status change (PATCH) | Position auto-recalculated |
| Delete (DELETE) | 204 response, subsequent GET returns 404, cascade effects |
| Bulk create (POST) | `created_count` matches, sequential positions |

---

## 7. Response Shapes

Response shapes are defined in Zod schemas (`apps/api/src/modules/[mod]/[mod].schemas.ts`).
The test generator reads these directly.

For human-readable examples, see `docs/engineering/api-spec.md` or the interactive
docs at `http://localhost:3000/docs`.

---

## 8. Claude Code Generation Rules

These rules apply when Claude Code generates or modifies API tests, whether invoked via `/api-test-generator` or manually.

### Pre-Generation (Always Do First)

1. **Read this document** — `docs/guidelines/api_testing_guidelines.md`
2. **Read the module's schemas** — `apps/api/src/modules/[mod]/[mod].schemas.ts`
3. **Read the module's routes** — `apps/api/src/modules/[mod]/[mod].routes.ts`
4. **Read the module's handler** — `apps/api/src/modules/[mod]/[mod].handler.ts`
5. **Check existing tests** — `tests/api/[mod].test.ts`
6. **Identify coverage gaps** — Which endpoints/scenarios are untested?

### Additive Mode (Default Behavior)

- **APPEND** missing tests to existing files — never overwrite
- Only generate new `describe()` blocks for endpoints that have no tests
- Only add new `it()` blocks for missing test cases within existing `describe()` blocks
- Full regeneration only when the user explicitly requests it
- Re-invocation is safe: filling gaps is idempotent

### Code Conventions

- Use `makeRequest()` for all HTTP calls (not `app.inject()` directly)
- Use `parseBody<T>()` for response parsing
- Use `createTestContext()` for authenticated requests
- Use factories for test data — don't create raw Prisma records in tests
- Follow the existing `describe`/`it` naming structure in the file
- Match the import style of the existing test file

### What NOT to Do

- Do not generate tests for Phase 2/3 features (e.g., assignee field)
- Do not use `Supertest` — the project uses Fastify `inject()` via `makeRequest()`
- Do not add tests that duplicate existing coverage
- Do not modify tests that are already passing
- Do not generate empty test shells (`it.todo()`) unless the user requests them

---

## Related Documents

- `docs/guidelines/testing_guidelines.md` — High-level testing strategy across all layers
- `.claude/skills/api-test-generator.md` — Module-based API test generation skill
- `docs/engineering/api-spec.md` — API contract reference
- `docs/product/user-stories-phase1.md` — Acceptance criteria
