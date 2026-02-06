Also, why did you remove# Testing Guidelines

> **Last Updated:** 2026-02-04
> **Test Runners:** Vitest (unit/API), Playwright (browser E2E)
> **Coverage Target:** 80% for critical paths

## Coverage Requirements

| Type                | Minimum           |
| ------------------- | ----------------- |
| Unit Tests          | 80%               |
| API E2E Tests       | Key flows covered |
| Browser E2E Tests   | Critical paths    |

## Testing Philosophy

### Test Pyramid

```
        ╱╲
       ╱  ╲         Browser E2E Tests (few)
      ╱────╲        - Critical user flows via Playwright
     ╱      ╲       - Full stack: browser → API → database
    ╱────────╲      API E2E Tests (some)
   ╱          ╲     - Vitest + Fastify inject()
  ╱────────────╲    - Full API stack: Fastify → database
 ╱              ╲   Unit Tests (many)
╱────────────────╲  - Functions, components, handlers
```

| Level | Tool | Location | Purpose |
|-------|------|----------|---------|
| Browser E2E | Playwright | `tests/e2e/` | Full user flows in real browser |
| API E2E | Vitest + Fastify inject() | `tests/api/` | API endpoints with real database |
| Unit | Vitest | Co-located with source | Isolated function/component tests |

### What to Test
- ✅ Business logic
- ✅ Critical user flows
- ✅ Edge cases and error handling
- ✅ API contracts
- ✅ Complex state management

### What NOT to Test
- ❌ Implementation details
- ❌ Third-party library internals
- ❌ Simple getters/setters
- ❌ Framework code

## Test Structure

### File Organization

```
tests/
├── api/                           # API E2E tests (Vitest + Fastify inject)
│   ├── setup.ts                   # App setup, helpers, test context
│   ├── factories.ts               # Test data factories
│   ├── auth.test.ts
│   ├── meeting-notes.test.ts
│   └── action-items.test.ts
├── e2e/                           # Browser E2E tests (Playwright)
│   ├── fixtures/
│   │   ├── auth.fixture.ts        # Authentication fixture
│   │   └── pages/                 # Page Object Models
│   │       ├── base.page.ts
│   │       ├── login.page.ts
│   │       ├── board.page.ts
│   │       └── notes.page.ts
│   ├── auth.setup.ts              # Auth state setup
│   ├── auth.spec.ts
│   ├── meeting-notes.spec.ts
│   └── kanban-board.spec.ts
├── vitest.config.ts               # Vitest config for API tests
└── tsconfig.json

apps/
├── api/src/modules/
│   └── [feature]/
│       ├── [feature].handler.ts
│       └── [feature].test.ts      # Unit tests (co-located)
└── web/src/
    └── components/
        ├── Button.tsx
        └── Button.test.tsx         # Unit tests (co-located)
```

### Naming Conventions

```typescript
// API E2E tests (tests/api/)
auth.test.ts
meeting-notes.test.ts
action-items.test.ts

// Browser E2E tests (tests/e2e/)
auth.spec.ts
meeting-notes.spec.ts
kanban-board.spec.ts

// Unit tests (co-located)
Button.test.tsx
user.handler.test.ts

// Test descriptions
describe('UserService', () => {
  describe('create', () => {
    it('creates user with valid data', async () => {});
    it('throws error when email exists', async () => {});
  });
});
```

## Unit Testing

### Structure (AAA Pattern)
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('formatCurrency', () => {
  it('formats USD correctly', () => {
    // Arrange
    const amount = 1234.5;
    
    // Act
    const result = formatCurrency(amount, 'USD');
    
    // Assert
    expect(result).toBe('$1,234.50');
  });
});
```

### Mocking
```typescript
import { vi } from 'vitest';

// Mock module
vi.mock('@/services/api', () => ({
  fetchUser: vi.fn(),
}));

// Mock implementation
import { fetchUser } from '@/services/api';
vi.mocked(fetchUser).mockResolvedValue({ id: '1', name: 'John' });

// Spy on method
const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

// Clear mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});
```

### Testing Async Code
```typescript
describe('UserService', () => {
  it('fetches user successfully', async () => {
    const user = await userService.findById('1');
    expect(user).toEqual({ id: '1', name: 'John' });
  });

  it('throws NotFoundError for invalid ID', async () => {
    await expect(userService.findById('invalid'))
      .rejects.toThrow(NotFoundError);
  });
});
```

## React Component Testing

### Setup
```typescript
// test/setup.ts
import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
```

### Component Tests
```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    
    render(<Button onClick={onClick}>Click</Button>);
    
    await user.click(screen.getByRole('button'));
    
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### Testing with TanStack Query
```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
}

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

describe('UserList', () => {
  it('displays users after loading', async () => {
    server.use(
      http.get('/api/users', () => {
        return HttpResponse.json([{ id: '1', name: 'John' }]);
      })
    );

    renderWithQuery(<UserList />);

    // Loading state
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    // Loaded state
    await waitFor(() => {
      expect(screen.getByText('John')).toBeInTheDocument();
    });
  });
});
```

### Testing Hooks
```typescript
import { renderHook, waitFor } from '@testing-library/react';

describe('useUser', () => {
  it('returns user data', async () => {
    const { result } = renderHook(() => useUser('1'), {
      wrapper: QueryWrapper,
    });

    await waitFor(() => {
      expect(result.current.data).toEqual({ id: '1', name: 'John' });
    });
  });
});
```

### Testing Zustand Stores
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { useUIStore } from '@/stores/ui.store';

describe('useUIStore', () => {
  // Reset store state before each test
  beforeEach(() => {
    useUIStore.setState({ sidebarOpen: false, theme: 'light' });
  });

  it('toggles sidebar', () => {
    const { toggleSidebar } = useUIStore.getState();

    expect(useUIStore.getState().sidebarOpen).toBe(false);

    act(() => {
      toggleSidebar();
    });

    expect(useUIStore.getState().sidebarOpen).toBe(true);
  });

  it('sets theme', () => {
    const { setTheme } = useUIStore.getState();

    act(() => {
      setTheme('dark');
    });

    expect(useUIStore.getState().theme).toBe('dark');
  });
});
```

### Testing Components with Zustand
```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useUIStore } from '@/stores/ui.store';
import { Sidebar } from './Sidebar';

describe('Sidebar', () => {
  beforeEach(() => {
    // Reset to known state
    useUIStore.setState({ sidebarOpen: true });
  });

  it('closes when close button clicked', async () => {
    const user = userEvent.setup();
    render(<Sidebar />);

    await user.click(screen.getByRole('button', { name: /close/i }));

    expect(useUIStore.getState().sidebarOpen).toBe(false);
  });
});
```

## API E2E Testing

API E2E tests run against the full Fastify + PostgreSQL stack using Vitest and Fastify's inject method.

**Location:** `tests/api/`

### Setup Utilities

All API tests use shared utilities from `tests/api/setup.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  setupApp,
  teardownApp,
  cleanupDatabase,
  createTestContext,
  makeRequest,
  parseBody,
} from './setup.js';

describe('Feature API E2E', () => {
  beforeAll(async () => {
    await setupApp();  // Initialize Fastify app
  });

  afterAll(async () => {
    await teardownApp();  // Close app and disconnect DB
  });

  beforeEach(async () => {
    await cleanupDatabase();  // Clear all test data
  });

  it('should return 401 when not authenticated', async () => {
    const response = await makeRequest({
      method: 'GET',
      url: '/api/v1/protected-resource',
    });

    expect(response.statusCode).toBe(401);
    const body = parseBody<{ error: { code: string } }>(response);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('should return resources for authenticated user', async () => {
    const { sessionToken } = await createTestContext();

    const response = await makeRequest({
      method: 'GET',
      url: '/api/v1/resources',
      sessionToken,
    });

    expect(response.statusCode).toBe(200);
    const body = parseBody<{ data: unknown[] }>(response);
    expect(body.data).toBeDefined();
  });
});
```

### Test Factories

Use factories from `tests/api/factories.ts` for creating test data:

```typescript
import { createUser, createMeetingNote, createActionItem } from './factories.js';

// Create user with session
const { user, sessionToken } = await createTestContext();

// Create related data
const note = await createMeetingNote(user.id, { title: 'Test Note' });
const item = await createActionItem(user.id, { status: 'todo' });
```

### Required Test Cases

For each API endpoint, include tests for:

- **401 Unauthorized** - Request without session token
- **400 Bad Request** - Missing/invalid required fields
- **404 Not Found** - Non-existent resource
- **200/201 Success** - Happy path
- **User isolation** - Cannot access other users' data

> **Detailed Reference:** For error conventions, test patterns, and Claude Code
> generation instructions, see `docs/guidelines/api_testing_guidelines.md`.

## Browser E2E Testing

Browser E2E tests use Playwright to test full user flows in a real browser.

**Location:** `tests/e2e/`

### Page Object Model

All E2E tests use Page Objects for maintainability. Page Objects are located in `tests/e2e/fixtures/pages/`.

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

  // Locators (prefer data-testid > role > text)
  get mainContent(): Locator {
    return this.page.getByTestId('feature-content');
  }

  get createButton(): Locator {
    return this.page.getByRole('button', { name: /create/i });
  }

  // Actions
  async createItem(name: string): Promise<void> {
    await this.createButton.click();
    await this.page.getByLabel('Name').fill(name);
    await this.page.getByRole('button', { name: 'Save' }).click();
  }

  // Assertions
  async expectItemVisible(name: string): Promise<void> {
    await expect(this.getItemByName(name)).toBeVisible();
  }
}
```

### Test Structure

```typescript
// tests/e2e/feature.spec.ts
import { test, expect } from './fixtures/auth.fixture.js';
import { FeaturePage } from './fixtures/pages/feature.page.js';

test.describe('Feature Name', () => {
  let featurePage: FeaturePage;

  test.beforeEach(async ({ authenticatedPage }) => {
    featurePage = new FeaturePage(authenticatedPage);
    await featurePage.goto();
    await featurePage.waitForReady();
  });

  test('should create an item', async () => {
    await featurePage.createItem('New Item');
    await featurePage.expectItemVisible('New Item');
  });
});
```

### Authentication Fixture

Use the auth fixture for tests that require a logged-in user:

```typescript
// Unauthenticated test
import { test, expect } from '@playwright/test';

// Authenticated test
import { test, expect } from './fixtures/auth.fixture.js';

test('should show user menu', async ({ authenticatedPage }) => {
  // authenticatedPage is already logged in
});
```

### Selector Strategy

Prefer selectors in this order (most stable to least):

1. **Test IDs**: `page.getByTestId('submit-button')`
2. **ARIA Roles**: `page.getByRole('button', { name: 'Submit' })`
3. **Labels**: `page.getByLabel('Email')`
4. **Placeholder**: `page.getByPlaceholder('Enter email')`
5. **Text**: `page.getByText('Welcome')` (least stable)

## Mock Service Worker (MSW)

### Setup
```typescript
// mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/users', () => {
    return HttpResponse.json([
      { id: '1', name: 'John' },
      { id: '2', name: 'Jane' },
    ]);
  }),

  http.post('/api/users', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(
      { id: '3', ...body },
      { status: 201 }
    );
  }),

  http.get('/api/users/:id', ({ params }) => {
    if (params.id === '404') {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }
    return HttpResponse.json({ id: params.id, name: 'User' });
  }),
];

// mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

### Usage in Tests
```typescript
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('handles server error', async () => {
  server.use(
    http.get('/api/users', () => {
      return HttpResponse.json(
        { error: { message: 'Server error' } },
        { status: 500 }
      );
    })
  );

  render(<UserList />);

  await waitFor(() => {
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });
});
```

## Test Data Factories

```typescript
// test/factories/user.factory.ts
import { faker } from '@faker-js/faker';

export function createUser(overrides = {}) {
  return {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.fullName(),
    created_at: faker.date.past(),
    ...overrides,
  };
}

export function createUsers(count: number) {
  return Array.from({ length: count }, () => createUser());
}

// Usage
const user = createUser({ name: 'Custom Name' });
const users = createUsers(10);
```

## Code Coverage

### Configuration
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules',
        'test',
        '**/*.d.ts',
        '**/*.config.*',
      ],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
  },
});
```

### Running Coverage
```bash
# Generate coverage report
pnpm test:api:coverage

# View HTML report
open coverage/index.html
```

## Testing Commands

```bash
# Unit tests (all packages)
pnpm test                     # Run all unit tests
pnpm test:watch               # Watch mode

# API E2E tests (tests/api/)
pnpm test:api                 # Run API E2E tests
pnpm test:api:watch           # Watch mode
pnpm test:api:report          # Console + JSON/JUnit reports in api-test-results/
pnpm test:api:ui              # Interactive Vitest UI in browser
pnpm test:api:coverage        # Coverage report (text + HTML in coverage/)

# Browser E2E tests (tests/e2e/)
pnpm test:e2e                 # Chromium only (default, fast)
pnpm test:e2e:all             # All browsers + mobile
pnpm test:e2e:firefox         # Firefox only
pnpm test:e2e:webkit          # Safari/WebKit only
pnpm test:e2e:mobile          # Mobile Chrome only
pnpm test:e2e:ui              # Chromium in UI mode (great for debugging)
pnpm test:e2e:headed          # Chromium with visible browser

# Custom browser combinations
npx playwright test --project=chromium --project=firefox

# Coverage
pnpm test:api:coverage        # Generate coverage report
```

### Browser Testing Strategy

| Command | Browsers | Use Case |
|---------|----------|----------|
| `pnpm test:e2e` | Chromium | Default for fast development feedback |
| `pnpm test:e2e:all` | All (5 projects) | Pre-release cross-browser verification |
| `pnpm test:e2e:firefox` | Firefox | Firefox-specific debugging |
| `pnpm test:e2e:webkit` | WebKit/Safari | Safari-specific debugging |
| `pnpm test:e2e:mobile` | Mobile Chrome | Mobile viewport testing |

**CI/CD behavior:**
- PR builds run Chromium only for fast feedback
- Manual workflow dispatch allows selecting specific browsers
- Pre-release testing should use `test:e2e:all`

### Running Specific Tests

```bash
# Specific API test file
pnpm test:api tests/api/auth.test.ts

# Specific E2E test file
pnpm test:e2e tests/e2e/auth.spec.ts

# Specific test by name
pnpm test:e2e -g "should login"
```

## Best Practices Checklist

- [ ] Tests are independent (no shared state)
- [ ] Tests are deterministic (same result every run)
- [ ] Tests are fast (< 100ms for unit tests)
- [ ] Test names describe behavior, not implementation
- [ ] One assertion per test (when possible)
- [ ] Test edge cases and error paths
- [ ] Avoid testing implementation details
- [ ] Clean up after tests (database, mocks)
- [ ] Use meaningful test data

## Manual Testing Checklist

Before marking a feature complete, verify:

### Functionality
- [ ] Feature works as expected (happy path)
- [ ] Edge cases handled (empty input, max length, special characters)
- [ ] Error states display correctly
- [ ] Loading states display correctly

### Cross-Browser/Device
- [ ] Works on mobile viewport (320px - 768px)
- [ ] Works on tablet viewport (768px - 1024px)
- [ ] Works on desktop (1024px+)
- [ ] Tested in Chrome, Firefox, Safari (if applicable)

### Quality
- [ ] No console errors or warnings
- [ ] No TypeScript errors
- [ ] Accessibility: keyboard navigable, screen reader friendly

### Integration
- [ ] API returns expected responses
- [ ] Database changes are correct
- [ ] Related features still work (regression check)

### Security (if applicable)
- [ ] No sensitive data exposed in console/network
- [ ] Auth/permissions work correctly
- [ ] Input validation prevents malicious data

## Test Generation with Claude Skills

Claude can assist with generating tests using specialized skills. Tests should be **suggested**, not auto-generated.

### Available Skills

| Skill | Command | Purpose |
|-------|---------|---------|
| API Test Generator | `/api-test-generator [module]` | Generate Vitest + Fastify inject tests for API endpoints |
| E2E Test Generator | `/e2e-test-generator [flow]` | Generate Playwright tests for user flows |

### When to Generate Tests

- After creating/modifying API endpoints → Suggest API E2E tests
- After creating/modifying UI features → Suggest Browser E2E tests
- After fixing bugs → Suggest regression tests

### Example Workflow

```
User: "I just finished the action items API"

Claude: "I've completed the action items API. Would you like me to generate:
- API E2E tests for the action-items endpoints?"

User: "Yes"

Claude: /api-test-generator action-items
```

### Skill Documentation

For detailed patterns and examples, see:
- `.claude/skills/api-test-generator.md` - API test patterns
- `.claude/skills/e2e-test-generator.md` - E2E test patterns

## Spec-Driven Test Development

### Contract-First Testing

Tests MUST be derived from specifications, not assumptions. This prevents common errors like:
- Using wrong HTTP methods (PATCH vs PUT)
- Testing fields not in current phase scope (e.g., assignee in Phase 1)
- Missing acceptance criteria coverage

### Workflow

Before writing any test:

1. **User Story First**: Identify the user story (US-X.X)
2. **Scope Check**: Verify features are in Phase 1
3. **API Contract**: Use HTTP methods from api-spec.md
4. **Data Model**: Use only fields from database-schema.md

### Quick Reference

| Spec | What to Check |
|------|---------------|
| `docs/product/product-spec.md` | Is this feature in Phase 1? |
| `docs/product/user-stories-phase1.md` | What are the acceptance criteria? |
| `docs/engineering/api-spec.md` | What HTTP method? PUT or PATCH? |
| `docs/engineering/database-schema.md` | What columns exist? |

### Phase 1 Scope Reference

**Action Item Fields (Phase 1):**
- title, description, priority, due_date, status

**NOT in Phase 1:**
- assignee (Phase 3)
- File attachments
- Comments/threads

### HTTP Methods Reference

| Operation | Method | Common Mistake |
|-----------|--------|----------------|
| Full resource update | PUT | Using PATCH |
| Single field update | PATCH | Using PUT |
| Create new resource | POST | |
| Delete resource | DELETE | |

### Anti-Patterns

Avoid these common mistakes:

| Anti-Pattern | Problem | Solution |
|--------------|---------|----------|
| Assumption-based tests | Tests fail due to incorrect assumptions | Read specs first |
| Testing future features | Tests include Phase 2/3 fields | Check product-spec.md |
| Wrong HTTP methods | Using PATCH for full updates | Check api-spec.md |
| Missing acceptance criteria | Incomplete test coverage | Map all AC to test cases |

### Test File Header Template

Every test file should include a header documenting spec sources:

```typescript
/**
 * Tests for US-X.X: [User Story Title]
 *
 * Acceptance Criteria (from user-stories-phase1.md):
 * - AC1: [criterion]
 * - AC2: [criterion]
 *
 * Phase 1 Scope (from product-spec.md):
 * - Fields: [available fields]
 * - NOT in Phase 1: [excluded fields]
 *
 * API Contract (from api-spec.md):
 * - [METHOD] [endpoint]: [description]
 */
```

## Related Documents

- Frontend Guidelines: `docs/guidelines/frontend_guidelines.md`
- Backend Guidelines: `docs/guidelines/backend_guidelines.md`
- API Design: `docs/engineering/api-spec.md`
- Test Generation (CLAUDE.md): `CLAUDE.md#test-generation-suggested-mode`
