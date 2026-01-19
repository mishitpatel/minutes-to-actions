# Project: [PROJECT_NAME]

> **Spec-Driven Development with Progressive Disclosure**
> Keep this file concise (~70 lines). Detailed specs live in `docs/`.

## Quick Start

```bash
# Install dependencies
pnpm install

# Start development (both frontend + backend)
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build
```

## Project Map

```
├── apps/
│   ├── web/              # React frontend (Vite + TypeScript)
│   └── api/              # Node.js backend (Express/Fastify)
├── packages/
│   └── shared/           # Shared types, utilities, constants
├── docs/                 # 📚 Detailed documentation (READ BEFORE CODING)
│   ├── product/          # PRDs, specs, user stories
│   ├── engineering/      # Architecture, API design, database
│   ├── guidelines/       # Coding standards, UI/UX, testing
│   └── project/          # Milestones, workflows, decisions
└── .claude/              # Claude Code configuration
```

## Before You Code

**Read the relevant docs first** — Claude should read these before implementing:

| Task Type | Read First |
|-----------|------------|
| New feature | `docs/product/PRODUCT_OVERVIEW.md` → relevant spec |
| API work | `docs/engineering/API_DESIGN.md` |
| Database changes | `docs/engineering/DATABASE.md` |
| Frontend UI | `docs/guidelines/FRONTEND.md` + `docs/guidelines/UI_UX.md` |
| Backend logic | `docs/guidelines/BACKEND.md` |
| Security | `docs/guidelines/SECURITY.md` |
| Writing tests | `docs/guidelines/TESTING.md` |
| Git workflow | `docs/project/GITHUB_WORKFLOW.md` |
| Architecture decisions | `docs/engineering/decisions/` |

## Key Conventions

- **API-first**: Design OpenAPI spec before implementing
- **Types-first**: Define shared types in `packages/shared` before coding
- **Test-driven**: Write tests alongside features
- **Conventional commits**: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`

## Tech Stack Summary

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, TanStack Query, Tailwind CSS |
| Backend | Node.js, TypeScript, Express/Fastify, Zod |
| Database | PostgreSQL (primary), Redis (cache) |
| Testing | Vitest, React Testing Library, Supertest |
| CI/CD | GitHub Actions |

## Current Focus

> Update this section for each milestone

- Current milestone: See `docs/project/milestones/`
- Active stories: Check `docs/product/stories/`

## Quick Commands

```bash
pnpm dev          # Start development
pnpm test         # Run tests
pnpm build        # Build for production
pnpm lint         # Check code quality
```

See `docs/project/COMMANDS.md` for complete reference.

## Constraints

- No breaking API changes without versioning
- All PRs require tests for new functionality
- Maximum response time: 200ms (p95) for API endpoints
- See `docs/project/CONSTRAINTS.md` for full list
