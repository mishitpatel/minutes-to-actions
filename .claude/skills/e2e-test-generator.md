# E2E Test Generator

> Skill for generating Browser E2E tests using Playwright

> **WARNING:** Before using this skill, verify your test assumptions against:
> - `docs/product/product-spec.md` (Phase 1 scope)
> - `docs/engineering/api-spec.md` (HTTP methods)

## Overview

This skill generates comprehensive browser-based end-to-end tests that simulate real user interactions. Tests are located in `tests/e2e/` and use Page Object Models for maintainability.

## Invocation

```
/e2e-test-generator [flow-name]
```

Examples:
- `/e2e-test-generator auth` - Generate tests for login/logout flows
- `/e2e-test-generator meeting-notes` - Generate tests for notes CRUD
- `/e2e-test-generator kanban-board` - Generate tests for board interactions
- `/e2e-test-generator extraction` - Generate tests for AI extraction flow

## Test Location

All Browser E2E tests go in: `tests/e2e/`

Page Objects go in: `tests/e2e/fixtures/pages/`

## Dependencies

```typescript
// Playwright test runner
import { test, expect } from '@playwright/test';

// Or with authentication fixture
import { test, expect } from '../fixtures/auth.fixture.js';

// Page Objects
import { LoginPage } from './fixtures/pages/login.page.js';
import { BoardPage } from './fixtures/pages/board.page.js';
import { NotesPage } from './fixtures/pages/notes.page.js';
```

## Test File Structure

```typescript
// tests/e2e/feature-name.spec.ts
import { test, expect } from '@playwright/test';
import { FeaturePage } from './fixtures/pages/feature.page.js';

test.describe('Feature Name', () => {
  let featurePage: FeaturePage;

  test.beforeEach(async ({ page }) => {
    featurePage = new FeaturePage(page);
    await featurePage.goto();
    await featurePage.waitForReady();
  });

  test('should do something', async () => {
    // Arrange
    // ...

    // Act
    await featurePage.performAction();

    // Assert
    await featurePage.expectResult();
  });
});
```

## Page Object Model Pattern

### Base Page Class

All page objects extend `BasePage`:

```typescript
// tests/e2e/fixtures/pages/base.page.ts
import { Page, Locator, expect } from '@playwright/test';

export abstract class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  abstract goto(): Promise<void>;
  abstract waitForReady(): Promise<void>;

  // Common locators
  get header(): Locator { return this.page.locator('header'); }
  get userMenu(): Locator { return this.page.getByTestId('user-menu'); }

  // Common actions
  async logout(): Promise<void> { /* ... */ }

  // Common utilities
  getByTestId(testId: string): Locator { return this.page.getByTestId(testId); }
}
```

### Creating a New Page Object

```typescript
// tests/e2e/fixtures/pages/feature.page.ts
import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page.js';

export class FeaturePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // Navigation
  async goto(): Promise<void> {
    await this.page.goto('/feature');
  }

  async waitForReady(): Promise<void> {
    await expect(this.mainContent).toBeVisible();
  }

  // Locators - prefer this order:
  // 1. data-testid (most stable)
  // 2. role + accessible name
  // 3. text content (least stable)

  get mainContent(): Locator {
    return this.page.getByTestId('feature-content');
  }

  get createButton(): Locator {
    return this.page.getByRole('button', { name: /create/i });
  }

  get itemList(): Locator {
    return this.page.getByTestId('item-list');
  }

  getItemByName(name: string): Locator {
    return this.itemList.locator('[data-testid="item"]').filter({ hasText: name });
  }

  // Actions - encapsulate multi-step interactions
  async createItem(name: string): Promise<void> {
    await this.createButton.click();
    await this.page.getByLabel('Name').fill(name);
    await this.page.getByRole('button', { name: 'Save' }).click();
    await expect(this.page.getByRole('dialog')).toBeHidden();
  }

  // Assertions - use expect inside page object for reusability
  async expectItemVisible(name: string): Promise<void> {
    await expect(this.getItemByName(name)).toBeVisible();
  }

  async expectItemCount(count: number): Promise<void> {
    await expect(this.itemList.locator('[data-testid="item"]')).toHaveCount(count);
  }
}
```

## Selector Strategy

Prefer selectors in this order (most stable to least stable):

### 1. Test IDs (Most Stable)

```typescript
// Add to component: data-testid="submit-button"
page.getByTestId('submit-button')
```

### 2. ARIA Roles + Accessible Names

```typescript
page.getByRole('button', { name: 'Submit' })
page.getByRole('heading', { name: 'Welcome' })
page.getByRole('textbox', { name: 'Email' })
page.getByRole('checkbox', { name: 'Remember me' })
```

### 3. Labels (Forms)

```typescript
page.getByLabel('Email address')
page.getByLabel('Password')
```

### 4. Placeholder Text

```typescript
page.getByPlaceholder('Enter your email')
```

### 5. Text Content (Least Stable)

```typescript
page.getByText('Welcome back')
page.locator('text=Submit')
```

## Test Patterns

### 1. Authentication Flow

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from './fixtures/pages/login.page.js';

test.describe('Authentication', () => {
  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should show login page elements', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.waitForReady();

    await expect(loginPage.googleLoginButton).toBeVisible();
    await expect(loginPage.welcomeHeading).toBeVisible();
  });

  test('should login via test endpoint', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAsTestUser('test@example.com', 'Test User');

    await expect(page).toHaveURL(/\/(dashboard|board|notes)/);
  });
});
```

### 2. CRUD Operations

```typescript
// tests/e2e/meeting-notes.spec.ts
import { test, expect } from './fixtures/auth.fixture.js';
import { NotesPage } from './fixtures/pages/notes.page.js';

test.describe('Meeting Notes CRUD', () => {
  let notesPage: NotesPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    notesPage = new NotesPage(authenticatedPage);
    await notesPage.goto();
    await notesPage.waitForReady();
  });

  test('should create a new note', async () => {
    await notesPage.createNote('Team Standup', 'Daily sync meeting notes');
    await notesPage.expectNoteInList('Team Standup');
  });

  test('should edit an existing note', async () => {
    // Setup
    await notesPage.createNote('Original Title', 'Original body');
    await notesPage.openNote('Original Title');

    // Edit
    await notesPage.editNote('Updated Title', 'Updated body');

    // Verify
    await notesPage.expectNoteDetailVisible('Updated Title');
  });

  test('should delete a note', async () => {
    await notesPage.createNote('To Delete', 'This will be deleted');
    await notesPage.openNote('To Delete');
    await notesPage.deleteNote();

    await notesPage.expectNoteNotInList('To Delete');
  });

  test('should show empty state when no notes exist', async () => {
    // Assuming we start with no notes
    await notesPage.expectEmptyState();
  });
});
```

### 3. Drag and Drop (Kanban Board)

```typescript
// tests/e2e/kanban-board.spec.ts
import { test, expect } from './fixtures/auth.fixture.js';
import { BoardPage } from './fixtures/pages/board.page.js';

test.describe('Kanban Board', () => {
  let boardPage: BoardPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    boardPage = new BoardPage(authenticatedPage);
    await boardPage.goto();
    await boardPage.waitForReady();
  });

  test('should display empty columns', async () => {
    await boardPage.expectBoardToBeEmpty();
  });

  test('should create a new action item', async () => {
    await boardPage.createActionItem({
      title: 'New Task',
      description: 'Task description',
      assignee: 'John',
    });

    await boardPage.expectCardInColumn('New Task', 'todo');
  });

  test('should drag card between columns', async () => {
    // Setup - create a card
    await boardPage.createActionItem({ title: 'Drag Me' });
    await boardPage.expectCardInColumn('Drag Me', 'todo');

    // Drag to "doing" column
    await boardPage.dragCard('Drag Me', 'doing');

    // Verify
    await boardPage.expectCardInColumn('Drag Me', 'doing');
    await boardPage.expectCardNotInColumn('Drag Me', 'todo');
  });

  test('should edit an action item', async () => {
    await boardPage.createActionItem({ title: 'Original' });
    await boardPage.editCard('Original', { title: 'Updated' });
    await boardPage.expectCardInColumn('Updated', 'todo');
  });

  test('should delete an action item', async () => {
    await boardPage.createActionItem({ title: 'To Delete' });
    await boardPage.deleteCard('To Delete');
    await boardPage.expectBoardToBeEmpty();
  });
});
```

### 4. AI Extraction Flow

```typescript
// tests/e2e/extraction.spec.ts
import { test, expect } from './fixtures/auth.fixture.js';
import { NotesPage } from './fixtures/pages/notes.page.js';
import { BoardPage } from './fixtures/pages/board.page.js';

test.describe('AI Action Item Extraction', () => {
  test('should extract action items from meeting notes', async ({ authenticatedPage }) => {
    const notesPage = new NotesPage(authenticatedPage);
    const boardPage = new BoardPage(authenticatedPage);

    // Create a note with action items embedded
    await notesPage.goto();
    await notesPage.createNote(
      'Sprint Planning',
      `
      Meeting notes from sprint planning.

      Action Items:
      - John to update documentation by Friday
      - Sarah to review PR #123
      - Team to discuss architecture next week
      `
    );

    await notesPage.openNote('Sprint Planning');

    // Trigger extraction
    await notesPage.extractActionItems();

    // Should show extracted items for review
    await notesPage.expectExtractedItemsCount(3);

    // Accept all items
    await notesPage.acceptAllButton.click();

    // Verify items appear on board
    await boardPage.goto();
    await boardPage.expectCardInColumn('Update documentation', 'todo');
  });

  test('should allow rejecting extracted items', async ({ authenticatedPage }) => {
    const notesPage = new NotesPage(authenticatedPage);

    await notesPage.goto();
    await notesPage.createNote('Quick Sync', 'John to fix the bug');
    await notesPage.openNote('Quick Sync');
    await notesPage.extractActionItems();

    // Reject the extracted item
    await notesPage.rejectExtractedItem(0);

    // Should show empty after rejection
    await notesPage.expectExtractedItemsCount(0);
  });
});
```

### 5. Error States

```typescript
// tests/e2e/errors.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Error Handling', () => {
  test('should show 404 page for non-existent routes', async ({ page }) => {
    await page.goto('/this-does-not-exist');
    await expect(page.getByText(/404|not found/i)).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Intercept API to return error
    await page.route('**/api/v1/meeting-notes', (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: { message: 'Server error' } }),
      });
    });

    await page.goto('/notes');
    await expect(page.getByText(/error|something went wrong/i)).toBeVisible();
  });

  test('should handle network failures', async ({ page }) => {
    // Simulate offline mode
    await page.route('**/api/**', (route) => route.abort());

    await page.goto('/notes');
    await expect(page.getByText(/offline|connection|network/i)).toBeVisible();
  });
});
```

### 6. Network Interception for Testing Edge Cases

```typescript
test('should show loading state while fetching', async ({ page }) => {
  // Delay the API response
  await page.route('**/api/v1/action-items', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await route.continue();
  });

  await page.goto('/board');
  await expect(page.getByTestId('loading-spinner')).toBeVisible();
  await expect(page.getByTestId('kanban-board')).toBeVisible();
});
```

## Spec Cross-Reference (REQUIRED)

Before generating tests, read and verify against these specifications:

### 1. User Stories
**File:** `docs/product/user-stories-phase1.md`
- Find the relevant user story (US-X.X)
- Extract all acceptance criteria
- Each criterion should map to a test case

### 2. Product Spec
**File:** `docs/product/product-spec.md`
- Verify the feature is in Phase 1
- Check which fields are available
- Do NOT test Phase 2/3 features (e.g., assignee is Phase 3)

### 3. API Spec
**File:** `docs/engineering/api-spec.md`
- Use correct HTTP methods in `waitForResponse` assertions
- PUT for full updates, PATCH for single-field updates
- Verify request/response schemas match test data

### Quick Reference: Action Item Fields

**Phase 1 (test these):**
- title, description, priority, due_date, status

**NOT in Phase 1 (do NOT test):**
- assignee (Phase 3)

### Quick Reference: HTTP Methods

| Operation | Method | Endpoint |
|-----------|--------|----------|
| Full update | PUT | `/api/v1/action-items/:id` |
| Status only | PATCH | `/api/v1/action-items/:id/status` |

---

## Running Tests

```bash
# Run all E2E tests
pnpm test:e2e

# Run with UI mode (great for debugging)
pnpm test:e2e:ui

# Run headed (see browser)
pnpm test:e2e:headed

# Run specific test file
pnpm test:e2e tests/e2e/auth.spec.ts

# Run specific test
pnpm test:e2e -g "should login"
```

## Debugging Tips

### 1. Use UI Mode

```bash
pnpm test:e2e:ui
```

### 2. Pause Test Execution

```typescript
test('debugging test', async ({ page }) => {
  await page.goto('/');
  await page.pause(); // Opens Playwright Inspector
});
```

### 3. Screenshots

```typescript
await page.screenshot({ path: 'debug.png' });
await page.screenshot({ path: 'full.png', fullPage: true });
```

### 4. Trace Viewer

```bash
# View trace from failed test
npx playwright show-trace test-results/feature-name-chromium/trace.zip
```

## Checklist for Complete E2E Coverage

For each user flow, ensure you have tests for:

- [ ] **Happy path** - Main flow works end-to-end
- [ ] **Empty states** - How it looks with no data
- [ ] **Error states** - API failures, validation errors
- [ ] **Loading states** - Spinners, skeletons appear correctly
- [ ] **Authentication** - Protected routes redirect
- [ ] **Mobile viewport** - Responsive behavior
- [ ] **Keyboard navigation** - Tab order, enter/escape keys

## Example: Complete Auth Spec File

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from './fixtures/pages/login.page.js';
import { BoardPage } from './fixtures/pages/board.page.js';

test.describe('Authentication Flow', () => {
  test.describe('Unauthenticated user', () => {
    test('should redirect to login from protected routes', async ({ page }) => {
      await page.goto('/board');
      await expect(page).toHaveURL(/\/login/);
    });

    test('should show login page with Google button', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.waitForReady();

      await expect(loginPage.googleLoginButton).toBeVisible();
    });
  });

  test.describe('Authentication', () => {
    test('should login successfully via test endpoint', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.loginAsTestUser('e2e@test.com', 'E2E User');

      // Should redirect to main app
      await expect(page).toHaveURL(/\/(board|notes|dashboard)/);
    });
  });

  test.describe('Authenticated user', () => {
    test('should show user menu when logged in', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.loginAsTestUser('e2e@test.com', 'E2E User');

      const boardPage = new BoardPage(page);
      await expect(boardPage.userMenu).toBeVisible();
    });

    test('should logout successfully', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.loginAsTestUser('e2e@test.com', 'E2E User');

      const boardPage = new BoardPage(page);
      await boardPage.goto();
      await boardPage.logout();

      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Session persistence', () => {
    test('should maintain session across page reloads', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.loginAsTestUser('e2e@test.com', 'E2E User');

      await page.reload();

      // Should still be logged in
      await expect(page).not.toHaveURL(/\/login/);
    });
  });
});
```
