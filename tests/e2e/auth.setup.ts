/**
 * Authentication Setup for Playwright E2E Tests
 *
 * This setup file creates an authenticated session that can be reused
 * across all browser tests. It runs before other tests in the 'setup' project.
 */

import { test as setup, expect } from '@playwright/test';
import { AUTH_STATE_PATH, TEST_USER } from './fixtures/auth.fixture.js';

// API URL for direct API calls (bypasses frontend proxy)
const API_URL = process.env.API_URL || 'http://localhost:3000';

setup('authenticate', async ({ page }) => {
  // Navigate to the login page
  await page.goto('/login');

  // Use the test login endpoint (development only)
  // In production, you would implement actual OAuth flow with test credentials
  const response = await page.request.post(`${API_URL}/api/v1/auth/test-login`, {
    data: {
      email: TEST_USER.email,
      name: TEST_USER.name,
    },
  });

  // If test login endpoint doesn't exist, skip saving state
  // Tests will need to handle authentication differently
  if (response.ok()) {
    // Reload to pick up session
    await page.goto('/');

    // Wait for authenticated state indicator
    await expect(
      page.getByTestId('user-menu')
    ).toBeVisible({ timeout: 10000 });

    // Save the authenticated state
    await page.context().storageState({ path: AUTH_STATE_PATH });
  } else {
    console.warn('Test login endpoint not available. Skipping auth state setup.');
    console.warn('Tests will run unauthenticated unless they handle login themselves.');
  }
});
