---
name: e2e-test-generator
description: Generate Browser E2E tests using Playwright. Focuses on critical user flows, page object pattern, and cross-referencing user stories for acceptance criteria coverage.
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
argument-hint: "[flow-name]"
disable-model-invocation: true
---

# E2E Test Generator

Generate Browser E2E tests using Playwright.

> **WARNING:** Before using this skill, verify your test assumptions against:
> - `docs/product/product-spec.md` (Phase 1 scope)
> - `docs/engineering/api-spec.md` (HTTP methods)

## Arguments

User arguments: $ARGUMENTS

Examples:
- `auth` — Login/logout flows
- `meeting-notes` — Notes CRUD
- `kanban-board` — Board interactions
- `extraction` — AI extraction flow

## Workflow

### Step 0: Identify Critical User Flows

Focus on user flows that span multiple pages/interactions, NOT individual component tests.

A "critical flow" is an end-to-end path a user takes:
- Login -> Create note -> Extract action items -> View on board
- Login -> Create action item manually -> Drag to "Done"
- Login -> Share board -> View shared link (unauthenticated)

### Step 1: Read Context

1. Read `docs/product/user-stories-phase1.md` for the relevant user stories
2. Read `docs/product/product-spec.md` to verify Phase 1 scope
3. Check existing page objects in `tests/e2e/fixtures/pages/`
4. Check existing specs in `tests/e2e/`

### Step 2: Create/Update Page Objects

All locators and actions go in page objects, NOT in test files.

Location: `tests/e2e/fixtures/pages/[feature].page.ts`

```typescript
import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page.js';

export class FeaturePage extends BasePage {
  constructor(page: Page) { super(page); }

  async goto(): Promise<void> { await this.page.goto('/feature'); }
  async waitForReady(): Promise<void> { await expect(this.mainContent).toBeVisible(); }

  // Locators — prefer: data-testid > ARIA role > label > text
  get mainContent(): Locator { return this.page.getByTestId('feature-content'); }
  get createButton(): Locator { return this.page.getByRole('button', { name: /create/i }); }

  // Actions — encapsulate multi-step interactions
  async createItem(name: string): Promise<void> { ... }

  // Assertions — reusable
  async expectItemVisible(name: string): Promise<void> { ... }
}
```

### Step 3: Write Test Specs

Location: `tests/e2e/[flow-name].spec.ts`

```typescript
import { test, expect } from '../fixtures/auth.fixture.js';
import { FeaturePage } from './fixtures/pages/feature.page.js';

test.describe('Feature Flow', () => {
  let featurePage: FeaturePage;

  test.beforeEach(async ({ authenticatedPage }) => {
    featurePage = new FeaturePage(authenticatedPage);
    await featurePage.goto();
    await featurePage.waitForReady();
  });

  test('should complete the happy path', async () => { ... });
  test('should show empty state', async () => { ... });
  test('should handle errors gracefully', async () => { ... });
});
```

### Step 4: Spec Cross-Reference (REQUIRED)

| What | File | Check |
|------|------|-------|
| User story | `docs/product/user-stories-phase1.md` | Each AC maps to a test |
| Phase scope | `docs/product/product-spec.md` | Don't test Phase 2/3 features |
| HTTP methods | `docs/engineering/api-spec.md` | PUT vs PATCH in waitForResponse |

### Quick Reference: Action Item Fields

**Phase 1 (test these):** title, description, priority, due_date, status
**NOT Phase 1 (skip):** assignee (Phase 3)

### Quick Reference: HTTP Methods

| Operation | Method | Endpoint |
|-----------|--------|----------|
| Full update | PUT | `/api/v1/action-items/:id` |
| Status only | PATCH | `/api/v1/action-items/:id/status` |

## Selector Priority

1. `data-testid` (most stable)
2. ARIA roles + accessible names
3. Labels (forms)
4. Placeholder text
5. Text content (least stable)

## Running Tests

```bash
pnpm test:e2e                       # All tests
pnpm test:e2e:ui                    # Interactive UI mode
pnpm test:e2e:headed                # See browser
pnpm test:e2e tests/e2e/X.spec.ts   # Specific file
```

## Checklist

For each user flow:
- [ ] Happy path end-to-end
- [ ] Empty states
- [ ] Error states (API failures)
- [ ] Loading states
- [ ] Authentication (protected routes redirect)
- [ ] Keyboard navigation (Tab, Enter, Escape)
