# Backend Coding Guidelines

> **Last Updated:** YYYY-MM-DD
> **Runtime:** Node.js 20+ LTS
> **Framework:** Express/Fastify + TypeScript
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
├── middleware/                  # Express/Fastify middleware
│   ├── auth.middleware.ts
│   ├── error.middleware.ts
│   ├── validation.middleware.ts
│   └── rateLimit.middleware.ts
├── utils/                       # Utility functions
│   ├── logger.ts
│   ├── errors.ts
│   ├── catchAsync.ts
│   └── helpers.ts
├── config/                      # Configuration
│   ├── env.ts                   # Environment variables
│   ├── database.ts
│   └── index.ts
├── types/                       # Backend-specific types
├── app.ts                       # App setup
└── server.ts                    # Server entry point

prisma/
├── schema.prisma
└── migrations/
```

## Module Architecture

### Simplified 3-File Pattern
```
┌─────────────────────────────────────────┐
│     Routes (HTTP wiring + catchAsync)   │  ← Route definitions, middleware
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
- No try/catch boilerplate - catchAsync handles errors automatically

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

// Infer types from schemas (no duplication)
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

// Response type (what we return)
export type UserResponse = {
  id: string;
  email: string;
  name: string;
  created_at: Date;
};
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

**3. Routes** - HTTP wiring with catchAsync wrapper
```typescript
// modules/users/users.routes.ts
import { Router } from 'express';
import * as handler from './users.handler';
import { createUserSchema, updateUserSchema, userIdParamSchema, CreateUserInput } from './users.schemas';
import { validate, ValidatedRequest } from '@/middleware/validation';
import { authenticate, authorize } from '@/middleware/auth';
import { catchAsync } from '@/utils/catchAsync';

const router = Router();

router.get('/', authenticate, catchAsync(async (req, res) => {
  const { page, limit } = req.query;
  const result = await handler.listUsers(Number(page) || 1, Number(limit) || 20);
  res.json(result);
}));

router.get('/:id', authenticate, validate(userIdParamSchema, 'params'), catchAsync(async (req, res) => {
  const user = await handler.getUserById(req.params.id);
  res.json({ data: user });
}));

router.post('/', authenticate, authorize('admin'), validate(createUserSchema), catchAsync(async (req: ValidatedRequest<CreateUserInput>, res) => {
  const user = await handler.createUser(req.body); // req.body is typed as CreateUserInput
  res.status(201).json({ data: user });
}));

router.patch('/:id', authenticate, validate(updateUserSchema), catchAsync(async (req, res) => {
  const user = await handler.updateUser(req.params.id, req.body);
  res.json({ data: user });
}));

router.delete('/:id', authenticate, authorize('admin'), catchAsync(async (req, res) => {
  await handler.deleteUser(req.params.id);
  res.status(204).send();
}));

export default router;
```

## Utilities

### catchAsync Wrapper
Eliminates try/catch boilerplate by forwarding errors to Express error handler:

```typescript
// utils/catchAsync.ts
import { Request, Response, NextFunction } from 'express';

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

export const catchAsync = (fn: AsyncHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};
```

### Typed Validation Middleware
Returns typed request after validation:

```typescript
// middleware/validation.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';

// Type helper for routes that use validation
export type ValidatedRequest<T> = Request & { body: T };

export const validate = (schema: AnyZodObject, source: 'body' | 'query' | 'params' = 'body') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req[source] = await schema.parseAsync(req[source]);
      next();
    } catch (error) {
      next(error);
    }
  };
};
```

## Naming Conventions

> See `docs/guidelines/NAMING_CONVENTIONS.md` for complete naming standards across all layers.

**Key points for backend:**
- Data fields: `snake_case` (consistent from database to API)
- Functions: `camelCase` (e.g., `getUserById`, `createUser`)
- Files: `camelCase` (e.g., `users.handler.ts`, `auth.middleware.ts`)
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
// middleware/error.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/utils/errors';
import { logger } from '@/utils/logger';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log error
  logger.error({
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });

  // Handle known errors
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    });
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return res.status(422).json({
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
      return res.status(409).json({
        error: {
          code: 'CONFLICT',
          message: 'Resource already exists',
        },
      });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Resource not found',
        },
      });
    }
  }

  // Unknown error - don't expose details in production
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : error.message,
    },
  });
}
```

## Schema Patterns
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

## Authentication & Authorization

### JWT Middleware
```typescript
// middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError } from '@/utils/errors';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing authorization token');
    }

    const token = authHeader.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    req.user = payload;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Invalid token'));
    } else {
      next(error);
    }
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('Insufficient permissions'));
    }
    next();
  };
};
```

## Logging

### Logger Setup
```typescript
// utils/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: { colorize: true },
        }
      : undefined,
});

// Usage
logger.info({ user_id: '123' }, 'User created');
logger.error({ error, order_id: '456' }, 'Order processing failed');
```

### Request Logging Middleware
```typescript
// middleware/logging.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      path: req.path,
      status_code: res.statusCode,
      duration: `${duration}ms`,
      user_id: req.user?.sub,
    });
  });

  next();
};
```

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

## Security Checklist

- [ ] Input validation on all endpoints (Zod)
- [ ] Authentication required for protected routes
- [ ] Authorization checks for role-based access
- [ ] Rate limiting on sensitive endpoints
- [ ] CORS properly configured
- [ ] Helmet middleware for security headers
- [ ] SQL injection prevention (Prisma parameterized queries)
- [ ] No sensitive data in logs
- [ ] Environment variables for secrets
- [ ] HTTPS in production

## API Documentation

### Setup Checklist
- [ ] OpenAPI spec (`openapi.yaml`) kept in sync with routes
- [ ] Interactive docs available at `/docs` endpoint
- [ ] Docs disabled in production (optional, based on security requirements)

### Quick Access
```bash
# Start dev server and open API docs
pnpm dev
# Visit: http://localhost:3000/docs
```

See `docs/engineering/API_DESIGN.md` for full setup instructions.

## Related Documents

- Architecture: `docs/engineering/ARCHITECTURE.md`
- API Design: `docs/engineering/API_DESIGN.md`
- Database: `docs/engineering/DATABASE.md`
- Testing: `docs/guidelines/TESTING.md`
