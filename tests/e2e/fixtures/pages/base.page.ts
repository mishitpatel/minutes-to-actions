/**
 * Base Page Object Model
 *
 * Provides common functionality and patterns for all page objects.
 * All page objects should extend this class.
 */

import { Page, Locator, expect } from '@playwright/test';

export abstract class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to this page's URL
   */
  abstract goto(): Promise<void>;

  /**
   * Wait for the page to be fully loaded and ready
   */
  abstract waitForReady(): Promise<void>;

  /**
   * Common navigation elements
   */
  get header(): Locator {
    return this.page.locator('header');
  }

  get userMenu(): Locator {
    return this.page.getByTestId('user-menu');
  }

  get logoutButton(): Locator {
    return this.page.getByTestId('logout-button');
  }

  /**
   * Common actions
   */
  async logout(): Promise<void> {
    await this.userMenu.click();
    await this.logoutButton.click();
    await this.page.waitForURL('**/login**');
  }

  /**
   * Get element by test ID
   */
  getByTestId(testId: string): Locator {
    return this.page.getByTestId(testId);
  }

  /**
   * Get element by role with accessible name
   */
  getByRole(role: Parameters<Page['getByRole']>[0], options?: Parameters<Page['getByRole']>[1]): Locator {
    return this.page.getByRole(role, options);
  }

  /**
   * Get element by text content
   */
  getByText(text: string | RegExp): Locator {
    return this.page.getByText(text);
  }

  /**
   * Wait for a toast notification
   */
  async waitForToast(message: string | RegExp): Promise<void> {
    const toast = this.page.locator('[role="alert"], [data-testid="toast"]').filter({
      hasText: message,
    });
    await expect(toast).toBeVisible();
  }

  /**
   * Wait for loading state to complete
   */
  async waitForLoadingComplete(): Promise<void> {
    // Wait for any loading spinners to disappear
    const spinner = this.page.locator('[data-testid="loading"], [role="progressbar"]');
    await spinner.waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {
      // Spinner might not exist, which is fine
    });
  }

  /**
   * Screenshot helper for debugging
   */
  async screenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `tests/e2e/screenshots/${name}.png` });
  }

  /**
   * Verify page URL matches expected pattern
   */
  async expectUrl(urlPattern: string | RegExp): Promise<void> {
    await expect(this.page).toHaveURL(urlPattern);
  }

  /**
   * Verify page title
   */
  async expectTitle(title: string | RegExp): Promise<void> {
    await expect(this.page).toHaveTitle(title);
  }
}
