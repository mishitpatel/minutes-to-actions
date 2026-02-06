/**
 * Kanban Board Page Object Model
 *
 * Handles interactions with the action items Kanban board.
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page.js';

export type ColumnStatus = 'todo' | 'doing' | 'done';

export class BoardPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to the board page
   */
  async goto(): Promise<void> {
    await this.page.goto('/board');
  }

  /**
   * Wait for the board to be fully loaded
   */
  async waitForReady(): Promise<void> {
    await expect(this.board).toBeVisible();
    await this.waitForLoadingComplete();
  }

  /**
   * Board container
   */
  get board(): Locator {
    return this.page.getByTestId('kanban-board').or(this.page.locator('[data-board]'));
  }

  /**
   * Get a specific column by status
   */
  getColumn(status: ColumnStatus): Locator {
    return this.page.getByTestId(`column-${status}`).or(
      this.page.locator(`[data-column="${status}"]`)
    );
  }

  /**
   * Get the column header
   */
  getColumnHeader(status: ColumnStatus): Locator {
    const column = this.getColumn(status);
    return column.locator('h2, h3, [data-testid="column-header"]').first();
  }

  /**
   * Get all cards in a column
   */
  getCards(status: ColumnStatus): Locator {
    return this.getColumn(status).locator('[data-testid="action-item-card"], [data-card]');
  }

  /**
   * Get a specific card by title
   */
  getCardByTitle(title: string): Locator {
    return this.board.locator('[data-testid="action-item-card"], [data-card]').filter({
      hasText: title,
    });
  }

  /**
   * Get the card count for a column
   */
  async getCardCount(status: ColumnStatus): Promise<number> {
    return this.getCards(status).count();
  }

  /**
   * Create new action item button
   */
  get createButton(): Locator {
    // Prefer the specific testid for the main create button
    return this.page.getByTestId('create-action-item');
  }

  /**
   * Create action item form/modal
   */
  get createModal(): Locator {
    return this.page.getByRole('dialog');
  }

  get titleInput(): Locator {
    return this.createModal.getByLabel(/title/i);
  }

  get descriptionInput(): Locator {
    return this.createModal.getByLabel(/description/i);
  }

  get assigneeInput(): Locator {
    return this.createModal.getByLabel(/assignee/i);
  }

  get dueDateInput(): Locator {
    return this.createModal.getByLabel(/due date/i);
  }

  get submitButton(): Locator {
    return this.createModal.getByRole('button', { name: /create/i });
  }

  get cancelButton(): Locator {
    return this.createModal.getByRole('button', { name: /cancel/i });
  }

  /**
   * Actions
   */
  async createActionItem(data: {
    title: string;
    description?: string;
    assignee?: string;
    dueDate?: string;
  }): Promise<void> {
    await this.createButton.click();
    await expect(this.createModal).toBeVisible();

    await this.titleInput.fill(data.title);

    if (data.description) {
      await this.descriptionInput.fill(data.description);
    }

    if (data.assignee) {
      // Only fill if the assignee input exists (field may not be present)
      const assigneeVisible = await this.assigneeInput.isVisible().catch(() => false);
      if (assigneeVisible) {
        await this.assigneeInput.fill(data.assignee);
      }
    }

    if (data.dueDate) {
      await this.dueDateInput.fill(data.dueDate);
    }

    await this.submitButton.click();
    await expect(this.createModal).toBeHidden();
  }

  /**
   * Detail modal - opened when clicking on a card
   */
  get detailModal(): Locator {
    return this.page.getByRole('dialog');
  }

  /**
   * Edit button in the detail modal footer
   */
  get editButton(): Locator {
    return this.detailModal.getByRole('button', { name: /^edit$/i });
  }

  /**
   * Save button in the detail modal (when in edit mode)
   */
  get saveButton(): Locator {
    return this.detailModal.getByRole('button', { name: /save/i });
  }

  /**
   * Delete button in the detail modal footer
   */
  get deleteButton(): Locator {
    return this.detailModal.getByRole('button', { name: /delete/i });
  }

  /**
   * Title input in the detail modal (when in edit mode)
   */
  get detailTitleInput(): Locator {
    return this.detailModal.locator('input[type="text"]').first();
  }

  /**
   * Description textarea in the detail modal (when in edit mode)
   */
  get detailDescriptionInput(): Locator {
    return this.detailModal.locator('textarea');
  }

  /**
   * Edit an action item via the detail modal
   */
  async editCard(title: string, newData: { title?: string; description?: string }): Promise<void> {
    const card = this.getCardByTitle(title);
    await card.click();

    // Wait for detail modal to open
    await expect(this.detailModal).toBeVisible();

    // Click the Edit button to enter edit mode
    await this.editButton.click();

    // Wait for edit mode to be active (save button appears)
    await expect(this.saveButton).toBeVisible();

    // Now fill in the fields
    if (newData.title) {
      await this.detailTitleInput.clear();
      await this.detailTitleInput.fill(newData.title);
    }

    if (newData.description) {
      await this.detailDescriptionInput.clear();
      await this.detailDescriptionInput.fill(newData.description);
    }

    // Click Save button and wait for the API response (uses PUT for full updates)
    await Promise.all([
      this.page.waitForResponse((response) =>
        response.url().includes('/action-items/') && response.request().method() === 'PUT'
      ),
      this.saveButton.click(),
    ]);

    // Wait for edit mode to exit
    await expect(this.saveButton).toBeHidden();

    // Close the modal by clicking close button
    await this.detailModal.getByRole('button', { name: /close/i }).click();
    await expect(this.detailModal).toBeHidden();
  }

  /**
   * Delete an action item via the detail modal
   */
  async deleteCard(title: string): Promise<void> {
    const card = this.getCardByTitle(title);
    await card.click();

    // Wait for detail modal to open
    await expect(this.detailModal).toBeVisible();

    // Click the Delete button in the modal footer
    await this.deleteButton.click();

    // Wait for and click the confirmation dialog's delete button
    // The confirmation dialog has a "Delete" button - use a more specific locator
    const confirmDialog = this.page.getByRole('dialog', { name: /delete action item/i });
    await expect(confirmDialog).toBeVisible();
    const confirmDeleteButton = confirmDialog.getByRole('button', { name: /delete/i });

    // Click confirm delete and wait for the API response
    await Promise.all([
      this.page.waitForResponse((response) =>
        response.url().includes('/action-items/') && response.request().method() === 'DELETE'
      ),
      confirmDeleteButton.click(),
    ]);

    // Wait for dialog to close
    await expect(this.detailModal).toBeHidden();
  }

  /**
   * Drag a card from one column to another
   * Uses Playwright's drag and drop API
   */
  async dragCard(cardTitle: string, targetStatus: ColumnStatus): Promise<void> {
    const card = this.getCardByTitle(cardTitle);
    const targetColumn = this.getColumn(targetStatus);

    await card.dragTo(targetColumn);
  }

  /**
   * Assertions
   */
  async expectCardInColumn(title: string, status: ColumnStatus): Promise<void> {
    const cards = this.getCards(status);
    await expect(cards.filter({ hasText: title })).toBeVisible();
  }

  async expectCardNotInColumn(title: string, status: ColumnStatus): Promise<void> {
    const cards = this.getCards(status);
    await expect(cards.filter({ hasText: title })).toBeHidden();
  }

  async expectColumnCount(status: ColumnStatus, count: number): Promise<void> {
    await expect(this.getCards(status)).toHaveCount(count);
  }

  async expectEmptyColumn(status: ColumnStatus): Promise<void> {
    await this.expectColumnCount(status, 0);
  }

  async expectBoardToBeEmpty(): Promise<void> {
    await this.expectEmptyColumn('todo');
    await this.expectEmptyColumn('doing');
    await this.expectEmptyColumn('done');
  }
}
