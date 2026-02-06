# API Design Guidelines

> **Last Updated:** 2026-01-19
> **Base URL:** `https://api.example.com/v1`
> **API Style:** RESTful JSON

## Design Principles

1. **Resource-Oriented:** URLs represent resources, not actions
2. **Predictable:** Consistent patterns across all endpoints
3. **Stateless:** Each request contains all necessary information
4. **Versioned:** API version in URL path (`/v1/`)

## Naming Conventions

> See `docs/guidelines/naming_guidelines.md` for complete naming standards.

**Key points for API:**
- Data fields in JSON: `snake_case` (e.g., `user_id`, `created_at`)
- URL paths: `kebab-case` (e.g., `/order-items`, `/user-profiles`)
- Query params: `snake_case` (e.g., `?sort_by=created_at`)

## URL Conventions

### Resource Naming

```
✅ Good                           ❌ Bad
/users                            /getUsers
/users/123                        /user/123
/users/123/orders                 /getUserOrders
/users/123/orders/456             /orders?user_id=123
```

### Rules
- Use **plural nouns** for collections: `/users`, `/orders`
- Use **kebab-case** for multi-word resources: `/order-items`
- Use **path parameters** for identification: `/users/:id`
- Use **query parameters** for filtering/sorting: `/users?status=active`
- Maximum **3 levels** of nesting: `/users/:id/orders/:order_id`

## HTTP Methods

| Method | Purpose | Request Body | Response |
|--------|---------|--------------|----------|
| GET | Retrieve resource(s) | ❌ | 200 + data |
| POST | Create new resource | ✅ | 201 + created resource |
| PUT | Replace entire resource | ✅ | 200 + updated resource |
| PATCH | Partial update | ✅ | 200 + updated resource |
| DELETE | Remove resource | ❌ | 204 (no content) |

### Idempotency
- GET, PUT, DELETE: **Idempotent** (same result on repeated calls)
- POST, PATCH: **Not idempotent**

## Request Format

### Headers (Required)
```http
Content-Type: application/json
Authorization: Bearer <jwt_token>
Accept: application/json
```

### Request Body Example
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user"
}
```

## Response Format

### Success Response
```json
{
  "data": {
    "id": "123",
    "name": "John Doe",
    "email": "john@example.com",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

### Collection Response (with Pagination)
```json
{
  "data": [
    { "id": "1", "name": "Item 1" },
    { "id": "2", "name": "Item 2" }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total_items": 150,
    "total_pages": 8,
    "has_next_page": true,
    "has_prev_page": false
  }
}
```

### Error Response (Application Errors)
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

### Validation Error Response (400)

Fastify+Zod validation errors return this format:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "body/fieldName Required"
}
```

This differs from application errors which use `{ error: { code, message } }`.

## Status Codes

### Success Codes
| Code | Meaning | When to Use |
|------|---------|-------------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST (resource created) |
| 204 | No Content | Successful DELETE |

### Client Error Codes
| Code | Meaning | When to Use |
|------|---------|-------------|
| 400 | Bad Request | Validation errors, invalid request body/params |
| 401 | Unauthorized | Missing or invalid auth token |
| 403 | Forbidden | Valid auth but insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource conflict (e.g., duplicate) |
| 429 | Too Many Requests | Rate limit exceeded |

### Server Error Codes
| Code | Meaning | When to Use |
|------|---------|-------------|
| 500 | Internal Server Error | Unexpected server error |
| 502 | Bad Gateway | Upstream service error |
| 503 | Service Unavailable | Server maintenance/overload |

## Pagination

### Query Parameters
```
GET /users?page=2&limit=20&sort_by=created_at&order=desc
```

| Parameter | Default | Max | Description |
|-----------|---------|-----|-------------|
| page | 1 | - | Page number |
| limit | 20 | 100 | Items per page |
| sort_by | created_at | - | Sort field |
| order | desc | - | Sort order (asc/desc) |

### Cursor-Based (for large datasets)
```
GET /users?cursor=abc123&limit=20
```

## Filtering

### Simple Filters
```
GET /users?status=active&role=admin
```

### Range Filters
```
GET /orders?created_at[gte]=2024-01-01&created_at[lte]=2024-12-31
GET /products?price[gte]=10&price[lte]=100
```

### Search
```
GET /users?search=john
```

## Authentication

### JWT Token Structure
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Payload
```json
{
  "sub": "user_123",
  "email": "user@example.com",
  "role": "user",
  "iat": 1704067200,
  "exp": 1704153600
}
```

### Token Refresh
```http
POST /auth/refresh
Cookie: refreshToken=<token>
```

## Versioning Strategy

### URL Path Versioning (Recommended)
```
/v1/users
/v2/users
```

### Version Lifecycle
1. **Current:** Active development and support
2. **Deprecated:** 6-month warning period
3. **Sunset:** No longer available

### Breaking vs Non-Breaking Changes

**Breaking Changes (Require New Version)**
- Removing endpoints
- Removing required fields
- Changing field types
- Changing authentication method
- Changing error response format

**Non-Breaking Changes (OK in Same Version)**
- Adding new endpoints
- Adding optional fields
- Adding new enum values (with default handling)
- Performance improvements

## Rate Limiting

### Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704153600
```

### Limits
| Endpoint Type | Rate Limit  |
| ------------- | ----------- |
| Public        | 100 req/min |
| Authenticated | 100 req/min |
| Admin         | 500 req/min |

## API Reference

For actual endpoints, request/response schemas, and behavior rules, see:
- `docs/engineering/api-spec.md` — Full endpoint documentation
- `http://localhost:3000/docs` — Interactive API explorer (Scalar)
- `apps/api/src/modules/[mod]/[mod].schemas.ts` — Zod schema source of truth

## Interactive API Documentation

### Development Setup (Scalar)

We use [Scalar](https://scalar.com) for interactive API documentation - a modern, beautiful OpenAPI viewer.

**Installation:**
```bash
pnpm add @scalar/fastify-api-reference
```

**Setup in Fastify:**
```typescript
// app.ts
import fastifySwagger from '@fastify/swagger';
import scalarApiReference from '@scalar/fastify-api-reference';

// Register Swagger plugin (generates OpenAPI spec from Zod schemas)
await fastify.register(fastifySwagger, {
  openapi: {
    info: { title: 'Minutes to Actions API', version: '1.0.0' },
  },
});

// Register Scalar plugin (serves interactive docs)
await fastify.register(scalarApiReference, {
  routePrefix: '/docs',
});
```

**Access during development:**
```
http://localhost:3000/docs
```

### Features
- **Try it out**: Test API endpoints directly in the browser
- **Authentication**: Set Bearer tokens for authenticated requests
- **Code samples**: Auto-generated examples in multiple languages
- **Dark mode**: Automatic theme support

## Validation Rules

### Input Validation (Zod)
```typescript
// Always validate at route level (see docs/guidelines/backend_guidelines.md for module structure)
const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  password: z.string().min(8).max(128),
});
```

### Common Validations
| Field | Rules |
|-------|-------|
| email | Valid email format |
| password | 8-128 chars, 1 uppercase, 1 number |
| name | 1-100 chars |
| id | Valid UUID or cuid |
| date | ISO 8601 format |

## Related Documents

- Architecture: `docs/engineering/architecture.md`
- Database: `docs/engineering/database-schema.md`
- Backend Guidelines: `docs/guidelines/backend_guidelines.md`
