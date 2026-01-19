# Security Guidelines

> Consolidated security standards for the project.

## Authentication

### JWT Strategy
- Access tokens: 15-minute expiry
- Refresh tokens: 7-day expiry, stored in httpOnly cookie
- Token rotation on refresh

### Password Requirements
- Minimum 8 characters
- At least one uppercase, lowercase, number
- Bcrypt hashing with cost factor 12

## Authorization

### Role-Based Access Control
- Roles: `admin`, `user`, `guest`
- Permissions checked at route level
- Resource ownership verified in handlers

## Input Validation

### All Endpoints
- Zod validation on every request body
- Query params validated and typed
- Path params validated against expected format

### Sanitization
- HTML escaped in user-generated content
- SQL injection prevented via Prisma parameterization
- Path traversal blocked in file operations

## Rate Limiting

| Context | Limit |
|---------|-------|
| Authenticated requests | 100/min |
| Unauthenticated requests | 20/min |
| Login attempts | 5/15min per IP |
| Password reset | 3/hour per email |

## Data Protection

### Encryption
- At rest: AES-256 for sensitive fields
- In transit: TLS 1.3 minimum
- Database: Encrypted connections required

### Sensitive Data
- Never log passwords, tokens, or PII
- Mask sensitive fields in error responses
- Use secure environment variable handling

## Headers

Required security headers (via helmet):
- `Strict-Transport-Security`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Content-Security-Policy`

## Secrets Management

- Environment variables for all secrets
- Never commit `.env` files
- Rotate secrets quarterly
- Use separate secrets per environment

## Related Documents

- Constraints & Policies: `docs/project/CONSTRAINTS.md`
- Backend Guidelines: `docs/guidelines/BACKEND.md`
- API Design: `docs/engineering/API_DESIGN.md`
