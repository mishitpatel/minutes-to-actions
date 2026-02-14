# Minutes to Actions

Paste meeting notes -> extract action items -> manage on Kanban board -> share read-only link.

## Structure

```
apps/web/          React + Vite + TypeScript (port 5173)
apps/api/          Fastify + Prisma + PostgreSQL (port 3000)
packages/shared/   Shared types/constants
tests/api/         API E2E tests (Vitest + Fastify inject)
tests/e2e/         Browser E2E tests (Playwright)
```

## Commands

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Start frontend + backend |
| `pnpm --filter web typecheck` | TypeScript check |
| `pnpm --filter web build` | Production build |
| `pnpm test:api` | API E2E tests |
| `pnpm test:e2e` | Browser E2E tests |
| `pnpm lint` | Lint check |

## Feature Workflow

```
1. /start-task #XX        -> Read issue, user story, acceptance criteria
2. Plan                   -> Explore codebase, design approach
3. Implement              -> Write code (hooks auto-typecheck on every edit)
   |-- New API module?    -> /new-api-module [name]
   +-- New component?     -> /new-component [name]
4. /verify-changes        -> Multi-agent verification (build + review + tests)
   +-- Fix issues         -> Self-healing loop (auto-fix + re-verify)
5. /api-test-generator    -> Generate API tests (if backend touched)
6. /ship                  -> Commit + PR + changelog
```

### Verification Quick Reference

| Command | Speed | What It Does |
|---------|-------|-------------|
| `/verify-changes --quick` | ~30s | TypeScript + build only |
| `/verify-changes` | ~2min | Build + review + tests (parallel) |
| `/verify-changes --with-security` | ~3min | Full verification + security scan |
| `/review` | ~1min | Code review only |
| `/security-scan` | ~1min | Security scan only |

## Conventions

- **Commits**: `feat:`, `fix:`, `docs:`, `refactor:`, `test:` — reference issue number
- **Branches**: `feature/xyz`, `fix/xyz` — always branch from `main`
- **Data fields**: `snake_case` everywhere (DB -> API -> frontend)
- **Components**: PascalCase files, camelCase hooks/utils
- **API modules**: `[name].schemas.ts` + `[name].handler.ts` + `[name].routes.ts`

## Gotchas

- shadcn `Card` has no `asChild` — wrap with button + card classes
- Native `<select>` over shadcn Select in forms (better form state)
- Google OAuth button: force `bg-white dark:bg-white` for brand
- Shared types: Zod schemas in API modules are source of truth, infer types
- `cn()` utility in `lib/utils.ts` for Tailwind class merging

## Session Continuity

Start every session by reading `docs/project/project-status.md`.

## Reference

| What | Where |
|------|-------|
| User stories | `docs/product/user-stories-phase1.md` |
| API spec | `docs/engineering/api-spec.md` |
| DB schema | `docs/engineering/database-schema.md` |
| Frontend rules | `docs/guidelines/frontend-rules.md` |
| Backend rules | `docs/guidelines/backend-rules.md` |
| Conventions | `docs/guidelines/conventions.md` |
| Project status | `docs/project/project-status.md` |
| Full commands | `docs/devops/commands.md` |
