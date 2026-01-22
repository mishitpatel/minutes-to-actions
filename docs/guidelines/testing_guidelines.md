# Testing Guidelines

> **Last Updated:** YYYY-MM-DD
> **Test Runner:** Vitest
> **Coverage Target:** 80% for critical paths

## Coverage Requirements

| Type | Minimum |
|------|---------|
| Unit Tests | 80% |
| Integration Tests | Key flows covered |
| E2E Tests | Critical paths |

## Testing Philosophy

### Test Pyramid
```
        ╱╲
       ╱  ╲         E2E Tests (few)
      ╱────╲        - Critical user flows
     ╱      ╲       - Smoke tests
    ╱────────╲      Integration Tests (some)
   ╱          ╲     - API endpoints
  ╱────────────╲    - Database operations
 ╱              ╲   Unit Tests (many)
╱────────────────╲  - Functions, components
```

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
apps/
├── web/src/
│   ├── components/
│   │   └── Button/
│   │       ├── Button.tsx
│   │       └── Button.test.tsx     # Co-located tests
│   └── __tests__/
│       └── integration/            # Integration tests
│
└── api/src/
    ├── modules/
    │   └── user/
    │       ├── user.service.ts
    │       ├── user.service.test.ts
    │       └── user.routes.test.ts
    └── __tests__/
        └── e2e/                    # E2E tests
```

### Naming Conventions
```typescript
// Files
Button.test.tsx           // Unit tests
user.service.test.ts
user.routes.test.ts       // Integration tests
auth.e2e.test.ts          // E2E tests

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

## API Integration Testing

### Setup with Supertest
```typescript
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { app } from '@/app';
import { prisma } from '@/config/database';

describe('User API', () => {
  let authToken: string;

  beforeAll(async () => {
    // Setup test database
    await prisma.$connect();
    authToken = await createTestUser();
  });

  afterAll(async () => {
    // Cleanup
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('GET /api/users', () => {
    it('returns 401 without auth', async () => {
      const response = await request(app).get('/api/users');
      expect(response.status).toBe(401);
    });

    it('returns users list', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  describe('POST /api/users', () => {
    it('creates user with valid data', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'new@example.com',
          name: 'New User',
          password: 'password123',
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toMatchObject({
        email: 'new@example.com',
        name: 'New User',
      });
    });

    it('returns 422 for invalid email', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'invalid',
          name: 'Test',
          password: 'password123',
        });

      expect(response.status).toBe(422);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
```

## E2E Testing

### Setup with Playwright
```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('user can login', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('[name="email"]', 'user@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Welcome');
  });

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('[name="email"]', 'wrong@example.com');
    await page.fill('[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('[role="alert"]'))
      .toContainText('Invalid credentials');
  });
});
```

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
pnpm test:coverage

# View HTML report
open coverage/index.html
```

## Testing Commands

```bash
# Run all tests
pnpm test

# Run in watch mode
pnpm test:watch

# Run specific file
pnpm test user.service.test.ts

# Run with coverage
pnpm test:coverage

# Run E2E tests
pnpm test:e2e

# Run E2E in UI mode
pnpm test:e2e:ui
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

## Related Documents

- Frontend Guidelines: `docs/guidelines/frontend_guidelines.md`
- Backend Guidelines: `docs/guidelines/backend_guidelines.md`
- API Design: `docs/engineering/api-spec.md`
