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
- All data fields: `snake_case` (DB to API to frontend, no transformation)

## Handler Rules

- Pure functions — no classes, no HTTP concerns
- Throw custom errors: `NotFoundError`, `BadRequestError`, `UnauthorizedError`, `ForbiddenError`, `ConflictError`, `ValidationError`
- Use try-catch for Prisma and external service calls
- Always `select` or `include` in Prisma queries — never return all fields
- Other user's resource — throw `NotFoundError` (not Forbidden, prevents info leak)

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
```typescript
app.register([name]Routes, { prefix: '/api/v1' });
```
