/**
 * Login Page Object Model
 *
 * Handles interactions with the login/authentication page.
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page.js';

// API URL for direct API calls (bypasses frontend proxy)
const API_URL = process.env.API_URL || 'http://localhost:3000';

export class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to the login page
   */
  async goto(): Promise<void> {
    await this.page.goto('/login');
  }

  /**
   * Wait for the login page to be ready
   */
  async waitForReady(): Promise<void> {
    await expect(this.googleLoginButton).toBeVisible();
  }

  /**
   * Locators
   */
  get googleLoginButton(): Locator {
    return this.page.getByRole('button', { name: /sign in with google|continue with google/i });
  }

  get welcomeHeading(): Locator {
    return this.page.getByRole('heading', { name: /minutes to actions|welcome|sign in|login/i });
  }

  get errorMessage(): Locator {
    return this.page.getByRole('alert').or(this.page.getByTestId('error-message'));
  }

  /**
   * Actions
   */
  async clickGoogleLogin(): Promise<void> {
    await this.googleLoginButton.click();
  }

  /**
   * For test environments: Login via test endpoint
   * This bypasses OAuth for automated testing
   */
  async loginAsTestUser(email: string, name: string): Promise<void> {
    const response = await this.page.request.post(`${API_URL}/api/v1/auth/test-login`, {
      data: { email, name },
    });

    if (!response.ok()) {
      throw new Error(`Test login failed: ${response.status()}`);
    }

    // Navigate to the home page after login
    await this.page.goto('/');
  }

  /**
   * Assertions
   */
  async expectToBeOnLoginPage(): Promise<void> {
    await this.expectUrl(/\/(login|auth)/);
    await expect(this.googleLoginButton).toBeVisible();
  }

  async expectErrorMessage(message: string | RegExp): Promise<void> {
    await expect(this.errorMessage).toContainText(message);
  }
}
