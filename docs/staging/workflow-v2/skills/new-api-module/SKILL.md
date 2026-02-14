---
name: new-api-module
description: Scaffolds a complete Fastify API module with schemas, handler, routes, and tests following project conventions.
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
argument-hint: "[module-name]"
disable-model-invocation: true
---

# New API Module

Scaffold a complete Fastify API module with schemas, handler, and routes.

## Arguments

User arguments: $ARGUMENTS

The argument should be a module name (e.g., `sharing`, `notifications`).

## Workflow

### Step 1: Read Context

1. Read `docs/engineering/api-spec.md` for the endpoint specification
2. Read `docs/engineering/database-schema.md` for relevant models
3. Read `docs/guidelines/backend-rules.md` for conventions

### Step 2: Create Module Files

Create `apps/api/src/modules/[name]/` with these files:

#### `[name].schemas.ts`

```typescript
import { z } from 'zod';

// Request schemas
export const create[Name]BodySchema = z.object({ ... });

// Response schemas (include ALL status codes)
export const [name]ResponseSchema = z.object({ ... });

// Infer types from schemas
export type Create[Name]Body = z.infer<typeof create[Name]BodySchema>;
```

Rules:
- Zod schemas are the SINGLE source of truth for types
- Define response schemas for ALL status codes (200, 201, 400, 401, 404)
- Import common schemas from `@/schemas/common` when available
- Use `snake_case` for all data fields

#### `[name].handler.ts`

```typescript
import { NotFoundError } from '@/utils/errors';
import { prisma } from '@/lib/prisma';

export async function create[Name](...) { ... }
```

Rules:
- Pure functions, no classes
- Throw custom errors (`NotFoundError`, `BadRequestError`, etc.) — NOT HTTP responses
- Use `select` or `include` in every Prisma query — never select all
- Use try-catch for Prisma/external operations

#### `[name].routes.ts`

```typescript
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
```

Rules:
- EVERY route MUST have: `description`, `tags`, full `schema` block with `response` for all status codes
- Use `app.authenticate` preHandler for protected routes
- URL paths in kebab-case, plural nouns for collections
- DELETE returns 204, POST returns 201, GET/PUT returns 200

### Step 3: Register Routes

Add to `apps/api/src/app.ts`:
```typescript
import { [name]Routes } from './modules/[name]/[name].routes.js';
app.register([name]Routes, { prefix: '/api/v1' });
```

### Step 4: Verify Swagger

After registration, the endpoint should appear at `http://localhost:3000/docs`.

Remind user: "Start the dev server with `pnpm dev` and verify your endpoint appears in Swagger at http://localhost:3000/docs"

### Step 5: Suggest Tests

After the module is scaffolded:
```
The module is scaffolded. Would you like me to generate API E2E tests?
> /api-test-generator [name]
```
