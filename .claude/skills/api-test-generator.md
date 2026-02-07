# API Test Generator

> Skill for generating API E2E tests using Vitest + Fastify `inject()`

> **Source of truth:** Module source code (schemas, routes, handler) — not docs.

## Overview

This skill generates comprehensive API endpoint tests that run against the full application stack (Fastify + PostgreSQL). Tests are located in `tests/api/` and use the shared setup utilities.

## Invocation

```
/api-test-generator [module-name]
/api-test-generator [module-name] --check
```

**Modes:**
- **Default (generate):** Discover existing tests, report gaps, then generate only missing tests (additive)
- **`--check`:** Discover and report gaps only — do not generate any code

**Examples:**
- `/api-test-generator auth` — Generate missing tests for authentication endpoints
- `/api-test-generator action-items` — Generate missing tests for action items CRUD
- `/api-test-generator meeting-notes --check` — Report test coverage gaps for meeting notes

## Workflow

### Step 0: Pre-Generation Discovery (ALWAYS DO FIRST)

Before generating any test code:

1. **Read schemas** → `apps/api/src/modules/[module]/[module].schemas.ts`
   (request/response shapes, defaults, validation constraints, enums)
2. **Read routes** → `apps/api/src/modules/[module]/[module].routes.ts`
   (HTTP methods, URLs, auth requirements, response status codes)
3. **Read handler** → `apps/api/src/modules/[module]/[module].handler.ts`
   (business logic: ownership checks, auto-calc, cascades)
4. **Read patterns** → `docs/guidelines/api_testing_guidelines.md`
   (error shapes, test checklist, code conventions)
5. **Check existing tests** → `tests/api/[module].test.ts`
6. **Identify gaps** — Map each endpoint × test case (401, 400, 404, 200, user isolation, defaults, response shape) and note which are missing

**Report format (show to user before generating):**

```
## Test Coverage Report: [module]

### Existing Tests
- tests/api/[module].test.ts: X describe blocks, Y test cases
  - GET /api/v1/[resource]: 401 ✓, empty list ✓, user isolation ✓
  - POST /api/v1/[resource]: 401 ✓, happy path ✓, validation ✓
  ...

### Missing Tests
- GET /api/v1/[resource]: pagination defaults, ordering
- PUT /api/v1/[resource]/:id: partial update, unchanged fields preserved
- DELETE /api/v1/[resource]/:id: cascade effects
...

Shall I generate the missing tests?
```

If `--check` was specified, stop here. Otherwise, proceed to generation after user confirmation.

### Step 1: Additive Generation (Default Behavior)

- **APPEND** missing tests to existing files — never overwrite existing tests
- Only generate new `describe()` blocks for endpoints that have no tests
- Only add new `it()` blocks for missing test cases within existing `describe()` blocks
- Preserve existing imports, setup hooks, and test structure
- Full regeneration only when the user explicitly requests "regenerate all"

**Re-invocation is safe:** Additive mode fills gaps idempotently. Running `/api-test-generator action-items` multiple times produces the same result as running it once.

## Test Location

All API E2E tests go in: `tests/api/`

## Dependencies

```typescript
// Test utilities (from tests/api/setup.ts)
import {
  setupApp,
  teardownApp,
  getApp,
  cleanupDatabase,
  createTestContext,
  makeRequest,
  parseBody,
  SESSION_COOKIE_NAME,
  prisma,
} from './setup.js';

// Factories (from tests/api/factories.ts)
import {
  createUser,
  createUserWithSession,
  createMeetingNote,
  createActionItem,
  createActionItemsInAllStatuses,
  createManyActionItems,
  buildUser,
  buildMeetingNote,
  buildActionItem,
} from './factories.js';

// Vitest
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
```

## Test File Structure

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  setupApp,
  teardownApp,
  cleanupDatabase,
  createTestContext,
  makeRequest,
  parseBody,
} from './setup.js';
import { createMeetingNote } from './factories.js';

describe('Module Name API E2E', () => {
  beforeAll(async () => {
    await setupApp();
  });

  afterAll(async () => {
    await teardownApp();
  });

  beforeEach(async () => {
    await cleanupDatabase();
  });

  describe('GET /api/v1/resource', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await makeRequest({
        method: 'GET',
        url: '/api/v1/resource',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return resources for authenticated user', async () => {
      const { sessionToken } = await createTestContext();

      const response = await makeRequest({
        method: 'GET',
        url: '/api/v1/resource',
        sessionToken,
      });

      expect(response.statusCode).toBe(200);
      const body = parseBody<{ data: unknown[] }>(response);
      expect(body.data).toBeDefined();
    });
  });
});
```

## Test Patterns

### 1. Authentication Tests (401)

Every protected endpoint needs an unauthenticated test:

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

### 2. Happy Path Tests (200, 201)

```typescript
it('should create a resource', async () => {
  const { sessionToken } = await createTestContext();

  const response = await makeRequest({
    method: 'POST',
    url: '/api/v1/resources',
    sessionToken,
    body: {
      title: 'New Resource',
      description: 'Description here',
    },
  });

  expect(response.statusCode).toBe(201);
  const body = parseBody<{ data: { id: string; title: string } }>(response);
  expect(body.data.title).toBe('New Resource');
  expect(body.data.id).toBeDefined();
});
```

### 3. Validation Tests (400)

```typescript
it('should return 400 for invalid body', async () => {
  const { sessionToken } = await createTestContext();

  const response = await makeRequest({
    method: 'POST',
    url: '/api/v1/resources',
    sessionToken,
    body: {
      // Missing required 'title' field
      description: 'No title provided',
    },
  });

  expect(response.statusCode).toBe(400);
});
```

### 4. Not Found Tests (404)

```typescript
it('should return 404 for non-existent resource', async () => {
  const { sessionToken } = await createTestContext();

  const response = await makeRequest({
    method: 'GET',
    url: '/api/v1/resources/00000000-0000-0000-0000-000000000000',
    sessionToken,
  });

  expect(response.statusCode).toBe(404);
  const body = parseBody<{ error: { code: string } }>(response);
  expect(body.error.code).toBe('NOT_FOUND');
});
```

### 5. User Isolation Tests (404 not 403)

Test that users cannot access other users' resources:

```typescript
it('should return 404 when accessing another user\'s resource', async () => {
  // Create resource with user A
  const { user: userA } = await createTestContext({ email: 'usera@test.com' });
  const resource = await createResource(userA.id);

  // Try to access with user B
  const { sessionToken: tokenB } = await createTestContext({ email: 'userb@test.com' });

  const response = await makeRequest({
    method: 'GET',
    url: `/api/v1/resources/${resource.id}`,
    sessionToken: tokenB,
  });

  // Returns 404 (not 403) to avoid leaking existence
  expect(response.statusCode).toBe(404);
});
```

### 6. List/Pagination Tests

```typescript
describe('GET /api/v1/resources (list)', () => {
  it('should return empty array when no resources exist', async () => {
    const { sessionToken } = await createTestContext();

    const response = await makeRequest({
      method: 'GET',
      url: '/api/v1/resources',
      sessionToken,
    });

    expect(response.statusCode).toBe(200);
    const body = parseBody<{ data: unknown[] }>(response);
    expect(body.data).toEqual([]);
  });

  it('should return only current user\'s resources', async () => {
    const { user, sessionToken } = await createTestContext();
    const { user: otherUser } = await createTestContext({ email: 'other@test.com' });

    await createResource(user.id, { title: 'My Resource' });
    await createResource(otherUser.id, { title: 'Other Resource' });

    const response = await makeRequest({
      method: 'GET',
      url: '/api/v1/resources',
      sessionToken,
    });

    const body = parseBody<{ data: { title: string }[] }>(response);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].title).toBe('My Resource');
  });

  it('should support pagination', async () => {
    const { user, sessionToken } = await createTestContext();

    for (let i = 0; i < 25; i++) {
      await createResource(user.id, { title: `Resource ${i}` });
    }

    const response = await makeRequest({
      method: 'GET',
      url: '/api/v1/resources?page=1&limit=10',
      sessionToken,
    });

    const body = parseBody<{
      data: unknown[];
      pagination: {
        page: number;
        limit: number;
        total_items: number;
        total_pages: number;
        has_next_page: boolean;
        has_prev_page: boolean;
      };
    }>(response);
    expect(body.data).toHaveLength(10);
    expect(body.pagination.total_items).toBe(25);
    expect(body.pagination.total_pages).toBe(3);
    expect(body.pagination.has_next_page).toBe(true);
    expect(body.pagination.has_prev_page).toBe(false);
  });
});
```

### 7. Update Tests (PUT)

```typescript
describe('PUT /api/v1/resources/:id', () => {
  it('should update provided fields', async () => {
    const { user, sessionToken } = await createTestContext();
    const resource = await createResource(user.id, { title: 'Original' });

    const response = await makeRequest({
      method: 'PUT',
      url: `/api/v1/resources/${resource.id}`,
      sessionToken,
      body: {
        title: 'Updated Title',
      },
    });

    expect(response.statusCode).toBe(200);
    const body = parseBody<{ data: { title: string } }>(response);
    expect(body.data.title).toBe('Updated Title');
  });
});
```

### 8. Delete Tests

```typescript
describe('DELETE /api/v1/resources/:id', () => {
  it('should delete the resource', async () => {
    const { user, sessionToken } = await createTestContext();
    const resource = await createResource(user.id);

    const response = await makeRequest({
      method: 'DELETE',
      url: `/api/v1/resources/${resource.id}`,
      sessionToken,
    });

    expect(response.statusCode).toBe(204);

    // Verify deletion
    const getResponse = await makeRequest({
      method: 'GET',
      url: `/api/v1/resources/${resource.id}`,
      sessionToken,
    });
    expect(getResponse.statusCode).toBe(404);
  });

  it('should return 404 when deleting non-existent resource', async () => {
    const { sessionToken } = await createTestContext();

    const response = await makeRequest({
      method: 'DELETE',
      url: '/api/v1/resources/00000000-0000-0000-0000-000000000000',
      sessionToken,
    });

    expect(response.statusCode).toBe(404);
  });
});
```

## Response Type Patterns

Derive response types from the module's `*.schemas.ts` file. The two cross-cutting
error shapes are:

```typescript
// AppError response (handler-thrown)
interface ErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

// Validation error response (Fastify/Zod)
interface ValidationErrorResponse {
  statusCode: number;
  error: string;
  message: string;
}
```

For all other response shapes (single item, paginated list, grouped, bulk create),
read the Zod schemas in `apps/api/src/modules/[mod]/[mod].schemas.ts`.

## Spec Cross-Reference

Before generating tests, verify against these specifications:

1. **Module source code** (primary) — schemas, routes, handler in `apps/api/src/modules/[mod]/`
2. **User stories** — `docs/product/user-stories-phase1.md` (acceptance criteria → test cases)
3. **Product spec** — `docs/product/product-spec.md` (Phase 1 scope — do NOT test Phase 2/3 features)
4. **API spec** — `docs/engineering/api-spec.md` (endpoint docs + behavior notes)
5. **Testing patterns** — `docs/guidelines/api_testing_guidelines.md` (error shapes, test checklist)

---

## Running Tests

```bash
# Run all API E2E tests
pnpm test:api

# Run in watch mode
pnpm test:api:watch

# Generate test reports (JSON + JUnit XML)
pnpm test:api:report

# Interactive Vitest UI (browser-based, watch mode)
pnpm test:api:ui

# Coverage report (text + HTML)
pnpm test:api:coverage

# Run specific test file
pnpm test:api tests/api/auth.test.ts
```

## Checklist for Complete Test Coverage

For each endpoint, ensure you have tests for:

- [ ] **401 Unauthorized** — No session token
- [ ] **400 Bad Request** — Invalid/missing required fields
- [ ] **404 Not Found** — Non-existent resource (use valid UUID format)
- [ ] **404 User isolation** — Cannot access other users' data
- [ ] **200/201 Success** — Happy path with correct response shape
- [ ] **Defaults** — Omitted optional fields have correct defaults
- [ ] **Edge cases** — Empty lists, pagination boundaries

## Examples

Refer to existing test files in `tests/api/` for real examples of complete test suites.
