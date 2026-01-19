# Engineering Architecture

> **Last Updated:** YYYY-MM-DD
> **Status:** Draft | Approved
> **Tech Lead:** [Name]

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                            CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐    ┌──────────────────┐                       │
│  │   Web App        │    │   Mobile App     │                       │
│  │   (React SPA)    │    │   (React Native) │                       │
│  └────────┬─────────┘    └────────┬─────────┘                       │
│           │                       │                                 │
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
│           │                       │                      │          │
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

## Tech Stack

### Frontend

| Technology | Purpose | Version |
|------------|---------|---------|
| React | UI Framework | 18.x |
| TypeScript | Type Safety | 5.x |
| Vite | Build Tool | 5.x |
| TanStack Query | Server State | 5.x |
| Zustand | Client State | 4.x |
| React Router | Routing | 6.x |
| Tailwind CSS | Styling | 3.x |
| React Hook Form | Forms | 7.x |
| Zod | Validation | 3.x |

### Backend

| Technology | Purpose | Version |
|------------|---------|---------|
| Node.js | Runtime | 20.x LTS |
| TypeScript | Type Safety | 5.x |
| Express/Fastify | Web Framework | - |
| Prisma | ORM | 5.x |
| Zod | Validation | 3.x |
| JWT | Authentication | - |
| BullMQ | Job Queue | 5.x |

### Database

| Technology | Purpose |
|------------|---------|
| PostgreSQL | Primary database |
| Redis | Caching, sessions, queue |

### DevOps

| Technology | Purpose |
|------------|---------|
| Docker | Containerization |
| GitHub Actions | CI/CD |
| Vitest | Testing |
| ESLint + Prettier | Code quality |

## Project Structure

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
│       │   ├── middleware/       # Express middleware
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

## Key Architecture Decisions

### ADR-001: Monorepo with pnpm Workspaces
- **Decision:** Use monorepo structure
- **Rationale:** Shared types, atomic changes, simplified dependency management
- **Consequences:** Requires workspace-aware tooling

### ADR-002: API-First Development
- **Decision:** Design OpenAPI specs before implementation
- **Rationale:** Contract-first ensures frontend/backend alignment
- **Consequences:** Requires upfront API design effort

### ADR-003: Feature-Based Module Structure
- **Decision:** Organize backend by feature, not layer
- **Rationale:** Better colocation, easier to understand domain
- **Consequences:** May have some code duplication

## Data Flow

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
7. Database (via Prisma)
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

## Security Considerations

### Authentication Flow
1. User submits credentials
2. Server validates and issues JWT (access + refresh tokens)
3. Access token stored in memory (not localStorage)
4. Refresh token stored in httpOnly cookie
5. Token refresh handled automatically

### Security Checklist
- [ ] HTTPS everywhere
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (Prisma)
- [ ] XSS prevention (React escaping + CSP)
- [ ] CSRF protection
- [ ] Secrets in environment variables

## Performance Targets

| Metric | Target |
|--------|--------|
| API response time (p95) | < 200ms |
| Time to First Byte (TTFB) | < 100ms |
| Largest Contentful Paint (LCP) | < 2.5s |
| First Input Delay (FID) | < 100ms |
| Database query time (p95) | < 50ms |

## Scalability Considerations

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

## Related Documents

- API Design: `docs/engineering/API_DESIGN.md`
- Database Schema: `docs/engineering/DATABASE.md`
- Frontend Guidelines: `docs/guidelines/FRONTEND.md`
- Backend Guidelines: `docs/guidelines/BACKEND.md`
