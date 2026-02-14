# Conventions

> Cross-cutting conventions for naming, git, testing, and architecture.

## Naming

| Context | Convention | Example |
|---------|-----------|---------|
| Data fields (ALL layers) | snake_case | `user_id`, `created_at`, `is_active` |
| UI-only state | camelCase | `isLoading`, `isModalOpen` |
| Components | PascalCase | `ActionItemCard`, `BoardPage` |
| Functions/hooks | camelCase | `getUserById()`, `useAuth()` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRIES`, `SESSION_COOKIE_NAME` |
| URL paths | kebab-case, plural | `/api/v1/action-items` |
| Query params | snake_case | `?sort_by=created_at&page=1` |
| Prisma models | PascalCase | `MeetingNote` (maps to `meeting_notes` table) |
| DB columns | snake_case | `meeting_note_id`, `board_order` |
| Indexes | idx_table_columns | `idx_action_items_user_id` |

### File Naming

| Type | Convention | Example |
|------|-----------|---------|
| React components | PascalCase | `ActionItemCard.tsx` |
| Pages | PascalCase + Page | `BoardPage.tsx` |
| Hooks | camelCase + use | `useActionItems.ts` |
| Utils | camelCase | `formatDate.ts` |
| Backend modules | kebab-case | `meeting-notes.handler.ts` |
| UI primitives | lowercase | `button.tsx` (shadcn) |

### Anti-Patterns

- `userId` in API response — use `user_id`
- `createdAt` in database — use `created_at`
- `UserCard.ts` (missing `.tsx`) — use `.tsx` for JSX

## Git Conventions

### Branches
- `feature/[description]` — new features
- `fix/[description]` — bug fixes
- Always branch from `main`: `git checkout main && git pull && git checkout -b feature/xyz`

### Commits (Conventional)
- `feat: add board sharing (#XX)` — new feature
- `fix: correct due date parsing (#XX)` — bug fix
- `docs: update API spec` — documentation
- `refactor: extract card component` — no behavior change
- `test: add auth E2E tests` — tests only
- `chore: update dependencies` — tooling/build

### PRs
- Short title (<70 chars), body has Summary + User Story + Test Plan
- Reference issue number in title or body
- Include acceptance criteria checklist

## Testing Strategy

| Type | When to Write | When to Run | Location |
|------|--------------|-------------|----------|
| Unit tests | During implementation | Every `/verify-changes` | `apps/*/src/**/*.test.ts` (co-located) |
| API E2E | After endpoint works in Swagger | Before PR | `tests/api/*.test.ts` |
| Browser E2E | At milestone completion | Before merge to main | `tests/e2e/*.spec.ts` |

### Test Pyramid
- Unit tests: MOST (cheap, fast, test business logic)
- API E2E: SOME (test contracts, auth, validation)
- Browser E2E: FEW (test critical user flows only)

### Test Infrastructure
- `createTestContext()` — creates user + session token
- `makeRequest()` — HTTP calls (NOT `app.inject()` directly)
- `parseBody<T>()` — typed response parsing
- Factories in `tests/api/factories.ts` — never inline Prisma in tests

### Toast Notifications
- Use `sonner` for all user-facing notifications
- Pattern: `toast.success("Created!")`, `toast.error("Failed")`
- Mutation hooks in `hooks/` handle toast display automatically

## Architecture Patterns

| Pattern | Rule |
|---------|------|
| API-first | Design OpenAPI spec before implementing |
| Schema-first | Zod schemas define types, never separate interfaces |
| Feature-based | Modules by feature (`modules/auth/`), not by layer |
| No file uploads | Phase 1 is paste text only |
| Monorepo | pnpm workspaces, atomic cross-package changes |
