# Backend Coding Guidelines

> **Last Updated:** 2026-01-19
> **Runtime:** Node.js 20+ LTS
> **Framework:** Fastify + TypeScript
> **ORM:** Prisma

## Project Structure

```
apps/api/src/
├── modules/                     # Feature modules (simplified structure)
│   └── [feature]/
│       ├── [feature].schemas.ts # Zod schemas + inferred types
│       ├── [feature].handler.ts # Business logic + data access (functions)
│       ├── [feature].routes.ts  # HTTP wiring
│       └── [feature].test.ts    # Tests
├── plugins/                     # Fastify plugins (not middleware!)
│   ├── auth.ts                  # JWT authentication plugin
│   ├── database.ts              # Prisma client plugin
│   ├── rateLimit.ts             # Rate limiting plugin
│   └── sensible.ts              # Common utilities
├── utils/                       # Utility functions
│   ├── logger.ts
│   ├── errors.ts
│   └── helpers.ts
├── config/                      # Configuration
│   ├── env.ts                   # Environment variables
│   ├── database.ts
│   └── index.ts
├── types/                       # Backend-specific types
├── app.ts                       # App factory setup
└── server.ts                    # Server entry point

prisma/
├── schema.prisma
└── migrations/
```

## Module Architecture

### Simplified 3-File Pattern
```
┌─────────────────────────────────────────┐
│     Routes (HTTP wiring)                │  ← Route definitions, hooks
├─────────────────────────────────────────┤
│     Handler (functions, not classes)    │  ← Business logic + data access
├─────────────────────────────────────────┤
│     Schemas (Zod + inferred types)      │  ← Single source of truth for types
├─────────────────────────────────────────┤
│              Database                   │  ← PostgreSQL (via Prisma)
└─────────────────────────────────────────┘
```

**Why this pattern?**
- Schemas as single source of truth - One place for data definitions
- No class instantiation - Just functions that do work
- No DI boilerplate - Import and call directly
- Fewer files - 3 instead of 5 per feature
- Types inferred from Zod - No duplication
- Route handlers: No try/catch needed - Fastify handles async errors automatically
- Service functions: Use try-catch for better error context and logging

### Schema Organization

Schemas are organized in a **two-tier structure**:

```
apps/api/src/
├── schemas/                    # Common/infrastructure schemas
│   ├── common.ts               # Shared across modules
│   └── index.ts                # Re-exports
└── modules/
    └── [feature]/
        └── [feature].schemas.ts  # Module-specific schemas
```

#### Common Schemas (`src/schemas/common.ts`)

Reusable infrastructure schemas shared across multiple modules:

| Schema | Purpose |
|--------|---------|
| `errorResponseSchema` | Standard error response format |
| `validationErrorSchema` | Fastify/Zod validation error format |
| `paginationSchema` | Pagination metadata for list endpoints |
| `uuidParamSchema` | Common UUID path parameter |

#### Module Schemas (`src/modules/[feature]/[feature].schemas.ts`)

Domain-specific schemas tied to a single feature:
- Request body schemas (create, update inputs)
- Response schemas (entity representations)
- Query/param schemas specific to the module
- Internal validation schemas (e.g., external API response shapes)

#### Decision Guide: Where to Place Schemas

| Criteria | Location |
|----------|----------|
| Used by 3+ modules | `src/schemas/common.ts` |
| Infrastructure concern (errors, pagination) | `src/schemas/common.ts` |
| Specific to one domain/feature | `src/modules/[feature]/[feature].schemas.ts` |
| Request/response for a specific endpoint | `src/modules/[feature]/[feature].schemas.ts` |

**Examples:**
```typescript
// ✅ Common schema - used everywhere
import { errorResponseSchema, paginationSchema } from '@/schemas/common';

// ✅ Module schema - specific to auth
import { userResponseSchema, callbackQuerySchema } from './auth.schemas';
```

#### Frontend Types

**Important:** Frontend types are generated from the OpenAPI specification, not shared directly from the backend.

```
┌─────────────────────────────────────────────────────────┐
│  Backend Zod Schemas                                    │
│  (source of truth for validation)                       │
└──────────────────────┬──────────────────────────────────┘
                       │ generates
                       ▼
┌─────────────────────────────────────────────────────────┐
│  OpenAPI Spec (via @fastify/swagger)                    │
│  (contract between frontend and backend)                │
└──────────────────────┬──────────────────────────────────┘
                       │ generates
                       ▼
┌─────────────────────────────────────────────────────────┐
│  Frontend Types (via openapi-typescript)                │
│  (type-safe API client)                                 │
└─────────────────────────────────────────────────────────┘
```

This approach ensures:
- **Single source of truth** — Zod schemas define the contract
- **Type safety** — Frontend types match actual API responses
- **No drift** — Changes to backend schemas automatically update frontend types
- **Decoupling** — Frontend doesn't depend on backend implementation details

### Module Template

**1. Schemas** - Single source of truth for types
```typescript
// modules/users/users.schemas.ts
import { z } from 'zod';

// Request schemas
export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

export const userIdParamSchema = z.object({
  id: z.string().cuid(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Response schemas (for serialization)
export const userResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  created_at: z.date(),
});

// Infer types from schemas (no duplication)
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserResponse = z.infer<typeof userResponseSchema>;
```

**2. Handler** - Business logic + data access in plain functions
```typescript
// modules/users/users.handler.ts
import { prisma } from '@/config/database';
import { CreateUserInput, UpdateUserInput, UserResponse } from './users.schemas';
import { NotFoundError, ConflictError } from '@/utils/errors';
import { hashPassword } from '@/utils/crypto';

export async function listUsers(page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      select: { id: true, email: true, name: true, created_at: true },
    }),
    prisma.user.count(),
  ]);

  return { data, pagination: { page, limit, total_items: total } };
}

export async function getUserById(id: string): Promise<UserResponse> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, created_at: true },
  });

  if (!user) throw new NotFoundError('User not found');
  return user;
}

export async function createUser(input: CreateUserInput): Promise<UserResponse> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new ConflictError('Email already registered');

  const user = await prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      password_hash: await hashPassword(input.password),
    },
    select: { id: true, email: true, name: true, created_at: true },
  });

  return user;
}

export async function updateUser(id: string, input: UpdateUserInput): Promise<UserResponse> {
  const user = await prisma.user.update({
    where: { id },
    data: input,
    select: { id: true, email: true, name: true, created_at: true },
  });
  return user;
}

export async function deleteUser(id: string): Promise<void> {
  await prisma.user.delete({ where: { id } });
}
```

**3. Routes** - Schema-driven validation with type provider
```typescript
// modules/users/users.routes.ts
import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import * as handler from './users.handler';
import {
  createUserSchema,
  updateUserSchema,
  userIdParamSchema,
  paginationSchema,
  userResponseSchema,
} from './users.schemas';
import { z } from 'zod';

export default async function userRoutes(fastify: FastifyInstance) {
  const f = fastify.withTypeProvider<ZodTypeProvider>();

  // List users
  f.get('/', {
    preHandler: [fastify.authenticate],
    schema: {
      querystring: paginationSchema,
      response: {
        200: z.object({
          data: z.array(userResponseSchema),
          pagination: z.object({
            page: z.number(),
            limit: z.number(),
            total_items: z.number(),
          }),
        }),
      },
    },
  }, async (request) => {
    return handler.listUsers(request.query.page, request.query.limit);
  });

  // Get user by ID
  f.get('/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      params: userIdParamSchema,
      response: {
        200: z.object({ data: userResponseSchema }),
      },
    },
  }, async (request) => {
    const user = await handler.getUserById(request.params.id);
    return { data: user };
  });

  // Create user (admin only)
  f.post('/', {
    preHandler: [fastify.authenticate, fastify.authorize('admin')],
    schema: {
      body: createUserSchema,
      response: {
        201: z.object({ data: userResponseSchema }),
      },
    },
  }, async (request, reply) => {
    const user = await handler.createUser(request.body);
    reply.status(201);
    return { data: user };
  });

  // Update user
  f.patch('/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      params: userIdParamSchema,
      body: updateUserSchema,
      response: {
        200: z.object({ data: userResponseSchema }),
      },
    },
  }, async (request) => {
    const user = await handler.updateUser(request.params.id, request.body);
    return { data: user };
  });

  // Delete user (admin only)
  f.delete('/:id', {
    preHandler: [fastify.authenticate, fastify.authorize('admin')],
    schema: {
      params: userIdParamSchema,
    },
  }, async (request, reply) => {
    await handler.deleteUser(request.params.id);
    reply.status(204).send();
  });
}
```

## Plugin Architecture

Fastify uses **plugins** instead of middleware. Key differences from Express:
- Plugins are **encapsulated** (isolated context by default)
- Use `fastify-plugin` wrapper to share decorators across contexts
- Use `@fastify/autoload` for automatic plugin registration

### Creating a Plugin

```typescript
// plugins/database.ts
import fp from 'fastify-plugin';
import { PrismaClient } from '@prisma/client';

export default fp(async (fastify) => {
  const prisma = new PrismaClient();

  // Decorate fastify instance with prisma client
  fastify.decorate('prisma', prisma);

  // Clean up on shutdown
  fastify.addHook('onClose', async () => {
    await prisma.$disconnect();
  });
}, { name: 'prisma-plugin' });

// Type augmentation for TypeScript
declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}
```

### Plugin vs Non-Plugin

```typescript
// ❌ Without fastify-plugin - decorators stay in local context
async function localPlugin(fastify) {
  fastify.decorate('myUtil', () => 'local only');
}

// ✅ With fastify-plugin - decorators shared across app
import fp from 'fastify-plugin';
export default fp(async (fastify) => {
  fastify.decorate('myUtil', () => 'shared everywhere');
}, { name: 'my-plugin' });
```

## Hooks Lifecycle

Fastify provides hooks at each stage of the request lifecycle:

| Hook | Use Case | Runs Before |
|------|----------|-------------|
| `onRequest` | Early security checks, CORS | Body parsing |
| `preParsing` | Rate limiting, early rejection | Content parsing |
| `preValidation` | Custom validation logic | Schema validation |
| `preHandler` | Auth, data preparation | Route handler |
| `preSerialization` | Transform response data | Serialization |
| `onSend` | Final response modifications | Sending response |
| `onResponse` | Logging, cleanup | (After response sent) |
| `onError` | Custom error handling | (On any error) |

### Hook Strategy

```typescript
// Rate limiting - use preParsing (save resources by rejecting before parsing)
fastify.addHook('preParsing', async (request, reply) => {
  if (await isRateLimited(request.ip)) {
    reply.status(429).send({ error: 'Too many requests' });
  }
});

// Authentication - use preHandler (may need parsed body)
fastify.addHook('preHandler', async (request, reply) => {
  await request.jwtVerify();
});

// Logging - use onResponse (after response sent)
fastify.addHook('onResponse', async (request, reply) => {
  request.log.info({
    method: request.method,
    url: request.url,
    statusCode: reply.statusCode,
    responseTime: reply.elapsedTime,
  });
});
```

## Response Serialization

Always define response schemas for:
- **Performance**: 100-400% throughput improvement via `fast-json-stringify`
- **Security**: Only whitelisted fields are sent (prevents data leaks)
- **Contract**: Ensures responses match API spec

```typescript
// In route definition
{
  schema: {
    response: {
      200: z.object({
        data: userResponseSchema,
      }),
      404: z.object({
        error: z.object({
          code: z.string(),
          message: z.string(),
        }),
      }),
    },
  },
}
```

**Why response schemas matter:**
```typescript
// ❌ Without response schema - all fields sent (potential data leak)
return await prisma.user.findUnique({ where: { id } });
// Might expose: password_hash, internal_notes, etc.

// ✅ With response schema - only whitelisted fields
// Response schema filters to: { id, email, name, created_at }
```

## Validation with Zod Type Provider

Use `fastify-type-provider-zod` for native Zod integration:

```typescript
// app.ts - Setup type provider
import Fastify from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from 'fastify-type-provider-zod';

const fastify = Fastify({ logger: true });
fastify.setValidatorCompiler(validatorCompiler);
fastify.setSerializerCompiler(serializerCompiler);

// Routes automatically validate and type request/response
fastify.withTypeProvider<ZodTypeProvider>().post('/users', {
  schema: {
    body: createUserSchema,
    response: { 201: userResponseSchema },
  },
}, async (request, reply) => {
  // request.body is already validated and typed!
  const user = await handler.createUser(request.body);
  return { data: user };
});
```

### Schema Patterns

```typescript
// ✅ Reusable schemas
const idParamSchema = z.object({
  id: z.string().cuid(),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ✅ Compose schemas
const getUsersQuerySchema = paginationSchema.extend({
  status: z.enum(['active', 'inactive']).optional(),
  search: z.string().optional(),
});
```

## Utilities

### Async Error Handling
Fastify handles async errors automatically - no wrapper needed!

```typescript
// Note: Fastify handles async errors automatically - no wrapper needed!
// Just use async handlers directly and throw errors as needed.

// Example: Errors thrown in async handlers are caught automatically
fastify.get('/users/:id', async (request, reply) => {
  const user = await getUserById(request.params.id);
  if (!user) {
    throw new NotFoundError('User not found'); // Automatically caught by error handler
  }
  return { data: user };
});
```

### Service Layer Error Handling

While route handlers rely on Fastify's automatic error handling, service functions
should wrap Prisma/external operations in try-catch for better error context:

```typescript
export async function createSession(userId: string): Promise<string> {
  try {
    // Prisma operations
    return token;
  } catch (error) {
    console.error('Failed to create session:', error);
    throw new Error('Session creation failed');
  }
}
```

This provides:
- Meaningful error messages for debugging
- Consistent logging of failures
- Clean error propagation to route handlers

## Naming Conventions

> See `docs/guidelines/naming_guidelines.md` for complete naming standards across all layers.

**Key points for backend:**
- Data fields: `snake_case` (consistent from database to API)
- Functions: `camelCase` (e.g., `getUserById`, `createUser`)
- Files: `camelCase` (e.g., `users.handler.ts`, `auth.ts`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_RETRIES`, `JWT_EXPIRY`)

## Error Handling

### Custom Error Classes
```typescript
// utils/errors.ts
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request', details?: unknown) {
    super(message, 400, 'BAD_REQUEST', details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
  }
}

export class ValidationError extends AppError {
  constructor(details: unknown) {
    super('Validation failed', 422, 'VALIDATION_ERROR', details);
  }
}
```

### Global Error Handler
```typescript
// app.ts - Register error handler
import { FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { AppError } from '@/utils/errors';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

fastify.setErrorHandler((error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
  // Log error
  request.log.error({
    message: error.message,
    stack: error.stack,
    path: request.url,
    method: request.method,
  });

  // Handle known errors
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    });
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return reply.status(422).send({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      },
    });
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return reply.status(409).send({
        error: {
          code: 'CONFLICT',
          message: 'Resource already exists',
        },
      });
    }
    if (error.code === 'P2025') {
      return reply.status(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'Resource not found',
        },
      });
    }
  }

  // Unknown error - don't expose details in production
  reply.status(500).send({
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : error.message,
    },
  });
});
```

## Authentication & Authorization

### JWT with @fastify/jwt

```typescript
// plugins/auth.ts
import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
import { FastifyRequest, FastifyReply } from 'fastify';
import { UnauthorizedError, ForbiddenError } from '@/utils/errors';

export default fp(async (fastify) => {
  // Register JWT plugin
  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET!,
    sign: { expiresIn: '15m' },
  });

  // Authentication decorator
  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      throw new UnauthorizedError('Invalid or expired token');
    }
  });

  // Authorization decorator factory
  fastify.decorate('authorize', (...roles: string[]) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user as { role: string };
      if (!roles.includes(user.role)) {
        throw new ForbiddenError('Insufficient permissions');
      }
    };
  });
}, { name: 'auth-plugin' });

// Type augmentation
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    authorize: (...roles: string[]) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string; email: string; role: string };
    user: { sub: string; email: string; role: string };
  }
}
```

### Token Operations

```typescript
// In auth handler
export async function login(email: string, password: string, fastify: FastifyInstance) {
  const user = await verifyCredentials(email, password);

  // Sign access token
  const accessToken = fastify.jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    { expiresIn: '15m' }
  );

  // Sign refresh token (longer expiry)
  const refreshToken = fastify.jwt.sign(
    { sub: user.id, type: 'refresh' },
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
}

// Usage in routes
fastify.get('/protected', {
  preHandler: [fastify.authenticate],
}, async (request) => {
  // request.user is typed and available
  return { userId: request.user.sub };
});

fastify.get('/admin-only', {
  preHandler: [fastify.authenticate, fastify.authorize('admin')],
}, async (request) => {
  return { admin: true };
});
```

## Recommended Plugins

| Plugin | Purpose | Install |
|--------|---------|---------|
| `@fastify/jwt` | JWT authentication | `pnpm add @fastify/jwt` |
| `@fastify/cors` | CORS handling | `pnpm add @fastify/cors` |
| `@fastify/helmet` | Security headers | `pnpm add @fastify/helmet` |
| `@fastify/rate-limit` | Rate limiting | `pnpm add @fastify/rate-limit` |
| `@fastify/cookie` | Cookie parsing | `pnpm add @fastify/cookie` |
| `@fastify/sensible` | Common utilities | `pnpm add @fastify/sensible` |
| `@fastify/autoload` | Auto-register plugins | `pnpm add @fastify/autoload` |
| `fastify-type-provider-zod` | Zod integration | `pnpm add fastify-type-provider-zod` |

## Logging

### Golden Rule
**Never use `console.log` in production code.** Always use Fastify's built-in Pino logger.

### Logger Types

| Logger | Use When | Example |
|--------|----------|---------|
| `app.log` | App-level events (startup, shutdown) | `app.log.info('Server started')` |
| `request.log` | Request-scoped logging (inside handlers/hooks) | `request.log.error({ err })` |

### Basic Setup
Fastify has built-in Pino logger - just enable it:

```typescript
// app.ts
const fastify = Fastify({
  logger: options.logger ?? true,  // Enable by default
});
```

### Usage Patterns

**App-level logging (server.ts, plugins):**
```typescript
// Startup
app.log.info(`Server running at http://localhost:${port}`);

// Errors outside request context
app.log.error(err);
```

**Request-scoped logging (handlers, hooks):**
```typescript
// In route handlers
fastify.get('/users/:id', async (request) => {
  request.log.info({ userId: request.params.id }, 'Fetching user');
  // ...
});

// In error handler
fastify.setErrorHandler((error, request, reply) => {
  request.log.error({ err: error, url: request.url });
  // ...
});
```

### Log Levels
Use appropriate levels:
- `error` - Errors that need attention
- `warn` - Unexpected but handled situations
- `info` - Notable events (startup, key operations)
- `debug` - Development troubleshooting (disabled in production)

### Security
- Never log passwords, tokens, API keys, or PII
- Sanitize user input before logging
- See [security_guidelines.md](./security_guidelines.md) for details

## Configuration

### Environment Variables
```typescript
// config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string().optional(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRY: z.string().default('15m'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
```

## App Factory Pattern

```typescript
// app.ts
import Fastify, { FastifyInstance } from 'fastify';
import autoload from '@fastify/autoload';
import { join } from 'path';
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';
import { env } from './config/env';

export async function createApp(): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: {
      level: env.LOG_LEVEL || 'info',
      transport: env.NODE_ENV === 'development'
        ? { target: 'pino-pretty' }
        : undefined,
    },
  });

  // Zod type provider
  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);

  // Core plugins
  await fastify.register(import('@fastify/cors'), {
    origin: env.CORS_ORIGIN,
  });
  await fastify.register(import('@fastify/helmet'));
  await fastify.register(import('@fastify/sensible'));
  await fastify.register(import('@fastify/rate-limit'), {
    max: 100,
    timeWindow: '1 minute',
  });

  // Auto-load custom plugins
  await fastify.register(autoload, {
    dir: join(__dirname, 'plugins'),
  });

  // Auto-load routes
  await fastify.register(autoload, {
    dir: join(__dirname, 'modules'),
    options: { prefix: '/api' },
  });

  return fastify;
}

// server.ts
import { createApp } from './app';
import { env } from './config/env';

async function start() {
  const app = await createApp();

  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
```

### Graceful Shutdown

Handle process termination signals for clean shutdown in containers:

```typescript
const shutdown = async () => {
  await fastify.close();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
```

This ensures:
- Active requests complete before shutdown
- Database connections are properly closed (via Fastify's onClose hooks)
- Clean exit in Docker/Kubernetes environments

## Security Checklist

- [ ] Schema validation on all routes (via Zod type provider)
- [ ] Response schemas defined (prevents data leaks)
- [ ] Authentication via `@fastify/jwt`
- [ ] Authorization checks for role-based access
- [ ] Rate limiting via `@fastify/rate-limit`
- [ ] CORS via `@fastify/cors`
- [ ] Security headers via `@fastify/helmet`
- [ ] SQL injection prevention (Prisma parameterized queries)
- [ ] No sensitive data in logs
- [ ] Environment variables for secrets
- [ ] HTTPS in production

## API Documentation

### Setup
The API uses `@fastify/swagger` with `@scalar/fastify-api-reference` for auto-generated interactive documentation. OpenAPI specs are automatically generated from Zod schemas.

### Quick Access
```bash
# Start dev server and open API docs
pnpm dev
# Visit: http://localhost:3000/docs
```

### Route Schema Requirements

Every route MUST include a `schema` property with Zod schemas for automatic OpenAPI generation:

```typescript
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { errorResponseSchema } from '../schemas/common.js';

export default async function routes(fastify: FastifyInstance) {
  const f = fastify.withTypeProvider<ZodTypeProvider>();

  f.post('/items', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Create a new item',
      tags: ['items'],
      body: createItemSchema,
      response: {
        201: z.object({ data: itemResponseSchema }),
        401: errorResponseSchema,
        422: errorResponseSchema,
      },
    },
  }, async (request, reply) => {
    // request.body is typed from createItemSchema
    // ...
  });
}
```

### Schema Checklist
- [ ] Use `withTypeProvider<ZodTypeProvider>()` for typed routes
- [ ] Include `description` for endpoint documentation
- [ ] Include `tags` for grouping in docs UI
- [ ] Define all request schemas (`body`, `querystring`, `params`)
- [ ] Define all response schemas with status codes (200, 201, 401, 404, 422)
- [ ] Import common schemas from `src/schemas/common.ts`

### Verifying Documentation
After adding a new endpoint:
1. Start dev server: `pnpm dev`
2. Visit: `http://localhost:3000/docs`
3. Verify endpoint appears with correct description, tags, and schemas

See `docs/engineering/api-spec.md` for full API specification.

## Related Documents

- Architecture: `docs/engineering/architecture.md`
- API Design: `docs/engineering/api-spec.md`
- Database: `docs/engineering/database-schema.md`
- Testing: `docs/guidelines/testing_guidelines.md`
