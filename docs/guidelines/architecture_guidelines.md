# Architecture Patterns & Best Practices

> Reusable architecture patterns and guidelines for building full-stack applications.
> For project-specific architecture, see `docs/engineering/architecture.md`.

## System Architecture Patterns

### Three-Tier Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                            CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐    ┌──────────────────┐                       │
│  │   Web App        │    │   Mobile App     │                       │
│  │   (React SPA)    │    │   (React Native) │                       │
│  └────────┬─────────┘    └────────┬─────────┘                       │
└───────────┼───────────────────────┼─────────────────────────────────┘
            │                       │
            ▼                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          API GATEWAY / CDN                          │
│                    (CloudFlare / AWS CloudFront)                    │
└───────────────────────────────────┬─────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          BACKEND SERVICES                           │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐    ┌──────────────────┐    ┌─────────────┐   │
│  │   API Server     │    │   Auth Service   │    │   Workers   │   │
│  │   (Node.js)      │    │   (JWT/OAuth)    │    │   (Jobs)    │   │
│  └────────┬─────────┘    └────────┬─────────┘    └──────┬──────┘   │
└───────────┼───────────────────────┼──────────────────────┼──────────┘
            │                       │                      │
            ▼                       ▼                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           DATA LAYER                                │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐    ┌──────────────────┐    ┌─────────────┐   │
│  │   PostgreSQL     │    │   Redis          │    │   S3/Blob   │   │
│  │   (Primary DB)   │    │   (Cache/Queue)  │    │   (Files)   │   │
│  └──────────────────┘    └──────────────────┘    └─────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Recommended Tech Stack

### Frontend

| Technology      | Purpose      | Recommended Version |
| --------------- | ------------ | ------------------- |
| React           | UI Framework | 18.x                |
| TypeScript      | Type Safety  | 5.x                 |
| Vite            | Build Tool   | 5.x                 |
| TanStack Query  | Server State | 5.x                 |
| Zustand         | Client State | 4.x                 |
| React Router    | Routing      | 6.x                 |
| Tailwind CSS    | Styling      | 3.x                 |
| React Hook Form | Forms        | 7.x                 |
| Zod             | Validation   | 3.x                 |

### Backend

| Technology | Purpose | Recommended Version |
|------------|---------|---------------------|
| Node.js | Runtime | 20.x LTS |
| TypeScript | Type Safety | 5.x |
| Fastify | Web Framework | Latest |
| Prisma/Drizzle | ORM | Latest |
| Zod | Validation | 3.x |
| JWT | Authentication | - |
| BullMQ | Job Queue | 5.x |

### Database

| Technology | Purpose |
|------------|---------|
| PostgreSQL | Primary relational database |
| Redis | Caching, sessions, job queue |

### DevOps

| Technology | Purpose |
|------------|---------|
| Docker | Containerization |
| GitHub Actions | CI/CD |
| Vitest | Testing |
| ESLint + Prettier | Code quality |

---

## Project Structure Pattern

### Monorepo Structure (Recommended)

```
project-root/
├── apps/
│   ├── web/                      # Frontend application
│   │   ├── src/
│   │   │   ├── components/       # Reusable UI components
│   │   │   │   ├── ui/           # Base components (Button, Input)
│   │   │   │   └── features/     # Feature-specific components
│   │   │   ├── pages/            # Route pages/views
│   │   │   ├── hooks/            # Custom React hooks
│   │   │   ├── services/         # API client functions
│   │   │   ├── stores/           # Zustand stores
│   │   │   ├── utils/            # Utility functions
│   │   │   ├── types/            # Frontend-specific types
│   │   │   └── App.tsx
│   │   ├── public/
│   │   └── package.json
│   │
│   └── api/                      # Backend application
│       ├── src/
│       │   ├── modules/          # Feature modules
│       │   │   └── [feature]/
│       │   │       ├── [feature].schemas.ts
│       │   │       ├── [feature].handler.ts
│       │   │       └── [feature].routes.ts
│       │   ├── middleware/       # Fastify plugins
│       │   ├── utils/            # Utility functions
│       │   ├── config/           # Configuration
│       │   └── app.ts
│       ├── prisma/
│       │   └── schema.prisma
│       └── package.json
│
├── packages/
│   └── shared/                   # Shared code
│       ├── src/
│       │   ├── types/            # Shared TypeScript types
│       │   ├── constants/        # Shared constants
│       │   ├── utils/            # Shared utilities
│       │   └── validators/       # Shared Zod schemas
│       └── package.json
│
├── docs/                         # Documentation
├── .github/                      # GitHub Actions
├── docker-compose.yml
├── pnpm-workspace.yaml
└── package.json
```

---

## Key Architecture Decisions

### ADR Pattern: Monorepo with pnpm Workspaces
- **Decision:** Use monorepo structure
- **Rationale:** Shared types, atomic changes, simplified dependency management
- **Consequences:** Requires workspace-aware tooling

### ADR Pattern: API-First Development
- **Decision:** Design OpenAPI specs before implementation
- **Rationale:** Contract-first ensures frontend/backend alignment
- **Consequences:** Requires upfront API design effort

### ADR Pattern: Feature-Based Module Structure
- **Decision:** Organize backend by feature, not layer
- **Rationale:** Better colocation, easier to understand domain
- **Consequences:** May have some code duplication

---

## Data Flow Patterns

### Request Lifecycle

```
1. Client Request
   ↓
2. API Gateway (rate limiting, CORS)
   ↓
3. Authentication Middleware (JWT validation)
   ↓
4. Request Validation (Zod schemas)
   ↓
5. Routes (HTTP wiring with catchAsync)
   ↓
6. Handler (business logic + data access)
   ↓
7. Database (via ORM)
   ↓
8. Response serialization
   ↓
9. Client Response
```

### State Management (Frontend)

```
Server State (TanStack Query)     Client State (Zustand)
├── API responses                 ├── UI state (modals, sidebars)
├── Caching                       ├── Form drafts
├── Optimistic updates            └── User preferences
└── Background refetching
```

---

## Security Patterns

### Authentication Flow
1. User submits credentials
2. Server validates and issues JWT (access + refresh tokens)
3. Access token stored in memory (not localStorage)
4. Refresh token stored in httpOnly cookie
5. Token refresh handled automatically

### Security Checklist Template
- [ ] HTTPS everywhere
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (ORM/parameterized queries)
- [ ] XSS prevention (React escaping + CSP)
- [ ] CSRF protection
- [ ] Secrets in environment variables

---

## Performance Targets

| Metric | Target |
|--------|--------|
| API response time (p95) | < 200ms |
| Time to First Byte (TTFB) | < 100ms |
| Largest Contentful Paint (LCP) | < 2.5s |
| First Input Delay (FID) | < 100ms |
| Database query time (p95) | < 50ms |

---

## Scalability Patterns

### Horizontal Scaling
- Stateless API servers behind load balancer
- Database read replicas for read-heavy workloads
- Redis for session/cache distribution

### Caching Strategy

```
Browser Cache → CDN → Redis → Database
     ↑            ↑       ↑
  Static       API      Query
  Assets    Responses  Results
```

### Cache Invalidation Rules
1. **Time-based:** Set TTL based on data volatility
2. **Event-based:** Invalidate on write operations
3. **Manual:** Admin-triggered cache clear

### Scalability Requirements

| Metric | Target |
|--------|--------|
| Concurrent Users | 1,000+ |
| Requests per Second | 500+ |
| Database Connections | 20-50 pool |
| File Upload Size | 10MB max |

### Availability Requirements

| Environment | Target Uptime |
|-------------|---------------|
| Production | 99.9% |
| Staging | 99% |

---

## Documentation Requirements

### Code Documentation
- Public functions have JSDoc comments
- Complex logic has inline comments
- README in each major directory
- API endpoints documented in OpenAPI

### Change Documentation
- CHANGELOG updated for releases
- ADRs for significant decisions
- Runbook for operations tasks

---

## Dependency Policies

### Adding Dependencies
- Security audit (npm audit, Snyk)
- License compatible (MIT, Apache 2.0 preferred)
- Actively maintained (commits in last 6 months)
- Reasonable size (bundle impact)
- Justified need (not trivially reimplementable)

### Updating Dependencies
- Security updates: Within 7 days
- Minor updates: Monthly
- Major updates: Quarterly (with testing)

### Prohibited Dependencies
- Known vulnerable packages
- Abandoned packages (no updates in 2 years)
- Packages with incompatible licenses
- Packages with excessive transitive dependencies

---

## Related Documents

- API Design Patterns: `docs/guidelines/api_guidelines.md`
- Database Patterns: `docs/guidelines/database_guidelines.md`
- Frontend Guidelines: `docs/guidelines/frontend_guidelines.md`
- Backend Guidelines: `docs/guidelines/backend_guidelines.md`
- Security Guidelines: `docs/guidelines/security_guidelines.md`
