/**
 * Authentication Fixture for Playwright E2E Tests
 *
 * Provides authenticated test contexts by managing login state.
 * Uses Playwright's storage state feature to persist auth across tests.
 */

import { test as base, Page, BrowserContext } from '@playwright/test';

// Extend base test with authentication fixtures
export interface AuthFixtures {
  /** Page already logged in as test user */
  authenticatedPage: Page;
  /** Get a fresh authenticated context */
  authenticatedContext: BrowserContext;
}

/**
 * Path to store authentication state
 */
export const AUTH_STATE_PATH = 'tests/e2e/.auth/user.json';

/**
 * Test user credentials
 * In a real app, these would be test accounts set up in your OAuth provider
 */
export const TEST_USER = {
  email: 'e2e-test@example.com',
  name: 'E2E Test User',
};

/**
 * Extended test with authentication
 */
export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ browser }, use) => {
    // Create context with stored auth state
    const context = await browser.newContext({
      storageState: AUTH_STATE_PATH,
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  authenticatedContext: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: AUTH_STATE_PATH,
    });
    await use(context);
    await context.close();
  },
});

export { expect } from '@playwright/test';

/**
 * Helper to wait for the app to be fully loaded
 */
export async function waitForAppReady(page: Page): Promise<void> {
  // Wait for the main app container to be visible
  await page.waitForSelector('[data-testid="app-container"], main', {
    state: 'visible',
    timeout: 10000,
  });
}

// API URL for direct API calls (bypasses frontend proxy)
const API_URL = process.env.API_URL || 'http://localhost:3000';

/**
 * Helper to bypass OAuth in development/test environments
 * This creates a session directly via API for testing purposes
 */
export async function loginViaAPI(page: Page, request: typeof page.request): Promise<void> {
  // Use the dev-only test login endpoint if available
  // This bypasses OAuth for testing purposes
  const response = await request.post(`${API_URL}/api/v1/auth/test-login`, {
    data: {
      email: TEST_USER.email,
      name: TEST_USER.name,
    },
  });

  if (!response.ok()) {
    throw new Error(`Test login failed: ${response.status()}`);
  }

  // Refresh page to pick up the session cookie
  await page.reload();
}

/**
 * Setup function for the global setup to create auth state
 * Called from tests/e2e/auth.setup.ts
 */
export async function setupAuthState(page: Page): Promise<void> {
  // Navigate to the app
  await page.goto('/');

  // For development: Use a test login endpoint
  // For production testing: Implement actual OAuth flow with test credentials
  await loginViaAPI(page, page.request);

  // Verify we're logged in by checking for authenticated UI elements
  await page.waitForSelector('[data-testid="user-menu"], [data-testid="logout-button"]', {
    state: 'visible',
    timeout: 10000,
  });

  // Save the storage state
  await page.context().storageState({ path: AUTH_STATE_PATH });
}
