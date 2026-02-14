# Project Memory: Minutes to Actions

## Architecture
- **Monorepo**: pnpm workspaces — `apps/web` (React/Vite), `apps/api` (Fastify)
- **Design System**: shadcn/ui + Radix UI + Tailwind CSS + CSS variables for theming
- **State**: TanStack Query for server state, local useState for UI state
- **DnD**: @dnd-kit for Kanban board drag-and-drop
- **Auth**: Google OAuth with session cookies

## Workflow (4-Layer Architecture)
- **Layer 0 — Hooks** (automatic): Typecheck on edit, security check on write, stop reminder
- **Layer 1 — CLAUDE.md** (~65 lines): Always loaded. Commands, conventions, workflow, gotchas.
- **Layer 2 — Skills** (on-demand): `/start-task`, `/verify-changes`, `/review`, `/ship`, `/new-api-module`, `/new-component`, `/security-scan`
- **Layer 3 — Guidelines** (on-demand): `frontend-rules.md`, `backend-rules.md`, `conventions.md`
- **Layer 4 — Subagents** (spawned): `build-validator`, `code-reviewer`, `code-simplifier`, `verify-app`
- Old guidelines archived in `docs/guidelines/archive/`

## Verification Loop (Boris's Pattern)
- Give Claude a way to see output -> 2-3x quality
- `/verify-changes` spawns parallel subagents for build, review, tests
- Self-healing loop: fix -> re-verify -> repeat (max 3 attempts)
- Adversarial review filters false positives

## Key Patterns
- `cn()` utility in `lib/utils.ts` for Tailwind class merging (clsx + tailwind-merge)
- Mutation hooks in `hooks/` with toast notifications via `sonner`
- Semantic color tokens: `--success`, `--warning`, `--info` (custom), plus standard shadcn vars
- Dark mode via `next-themes` with `attribute="class"`, toggle in Sidebar
- All data-testid attributes preserved for E2E tests

## Gotchas
- shadcn `Card` doesn't support `asChild` — use button wrapper with card classes
- Native `<select>` used for forms (works better with form state) over shadcn Select
- DropdownMenu portals actually *improve* dnd-kit compatibility (clicks don't propagate)
- shadcn init may overwrite `lib/utils.ts`, `tailwind.config.js`, `index.css` — always back up
- Google OAuth button forced to `bg-white dark:bg-white` for brand compliance

## Commands
- `pnpm --filter web typecheck` — TypeScript check
- `pnpm --filter web build` — Full build
- `pnpm test:api` — API E2E tests
- `pnpm test:e2e` — Browser E2E tests
