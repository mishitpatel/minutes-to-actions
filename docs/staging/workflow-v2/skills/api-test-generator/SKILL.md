---
name: api-test-generator
description: Generate API E2E tests using Vitest + Fastify inject. Auto-detects endpoints from route files, reports coverage gaps, and generates only missing tests (additive).
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
argument-hint: "[module-name] [--check]"
disable-model-invocation: true
---

# API Test Generator

Generate API E2E tests using Vitest + Fastify `inject()`.

> **Source of truth:** Module source code (schemas, routes, handler) — not docs.

## Arguments

User arguments: $ARGUMENTS

**Modes:**
- **Default (generate):** Discover existing tests, report gaps, then generate only missing tests (additive)
- **`--check`:** Discover and report gaps only — do not generate any code

## Workflow

### Step 0: Pre-Generation Discovery (ALWAYS DO FIRST)

Before generating any test code:

1. **Read schemas** — `apps/api/src/modules/[module]/[module].schemas.ts`
   (request/response shapes, defaults, validation constraints, enums)
2. **Read routes** — `apps/api/src/modules/[module]/[module].routes.ts`
   (HTTP methods, URLs, auth requirements, response status codes)
3. **Read handler** — `apps/api/src/modules/[module]/[module].handler.ts`
   (business logic: ownership checks, auto-calc, cascades)
4. **Read conventions** — `docs/guidelines/backend-rules.md` (error shapes, conventions)
5. **Check existing tests** — `tests/api/[module].test.ts`
6. **Auto-detect endpoints** — Parse the routes file to extract ALL endpoints:
   - HTTP method + URL pattern
   - Schema response status codes (these define what to test)
   - Auth requirements (preHandler)

**Report format (show to user before generating):**

```
## Test Coverage Report: [module]

### Endpoints Detected (from routes file)
- POST /api/v1/[resource] -> 201, 400, 401
- GET /api/v1/[resource] -> 200, 401
- GET /api/v1/[resource]/:id -> 200, 401, 404
- PUT /api/v1/[resource]/:id -> 200, 400, 401, 404
- DELETE /api/v1/[resource]/:id -> 204, 401, 404

### Existing Tests
- tests/api/[module].test.ts: X describe blocks, Y test cases
  - POST /api/v1/[resource]: 401, 201, 400
  ...

### Missing Tests
- GET /api/v1/[resource]: pagination defaults, user isolation
- PUT /api/v1/[resource]/:id: partial update, 404 other user
...

Shall I generate the missing tests?
```

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
| 401 Unauthorized | No session token — `{ error: { code: "UNAUTHORIZED" } }` |
| 400 Bad Request | Invalid/missing required fields |
| 404 Not Found | Non-existent resource (valid UUID format) |
| 404 User Isolation | Other user's resource — 404 (NOT 403) |
| 200/201 Success | Happy path with correct response shape |
| Defaults | Omitted optional fields have correct defaults |
| Response shape | All expected fields present and typed correctly |

## Test Infrastructure

```typescript
// Always import from setup and factories
import { setupApp, teardownApp, cleanupDatabase, createTestContext, makeRequest, parseBody } from './setup.js';
import { createUser, createUserWithSession, createMeetingNote, createActionItem } from './factories.js';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
```

## Error Response Shapes

Two shapes to test against:

**AppError (handler-thrown):**
```typescript
{ error: { code: string; message: string } }
// Codes: NOT_FOUND, UNAUTHORIZED, BAD_REQUEST, FORBIDDEN, CONFLICT, EXTRACTION_FAILED, RATE_LIMITED
```

**Validation error (Fastify/Zod):**
```typescript
{ statusCode: 400, error: "Bad Request", message: "body/fieldName Required" }
```

## Vitest Mock Patterns

When testing modules that depend on external services (e.g., AI extraction):

```typescript
// Mock at module level
vi.mock('@/lib/openai', () => ({
  extractActionItems: vi.fn().mockResolvedValue([...])
}));

// Reset between tests
beforeEach(() => { vi.clearAllMocks(); });

// Assert mock was called
expect(extractActionItems).toHaveBeenCalledWith(expect.objectContaining({ ... }));
```

## Running Tests

```bash
pnpm test:api                       # Run all
pnpm test:api tests/api/X.test.ts   # Run specific file
pnpm test:api:report                # JSON + JUnit reports
pnpm test:api:html                  # Interactive HTML report
```

## Preflight Checklist

For each endpoint, ensure tests cover:
- [ ] 401 Unauthorized (no session token)
- [ ] 400 Bad Request (invalid/missing fields)
- [ ] 404 Not Found (non-existent resource)
- [ ] 404 User isolation (other user's data)
- [ ] 200/201 Success (happy path + response shape)
- [ ] Defaults (optional fields)
- [ ] Edge cases (empty lists, pagination boundaries)
