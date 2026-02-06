/**
 * Meeting Notes Page Object Model
 *
 * Handles interactions with the meeting notes list and detail views.
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page.js';

export class NotesPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to the meeting notes list
   */
  async goto(): Promise<void> {
    await this.page.goto('/notes');
  }

  /**
   * Wait for the page to be ready
   */
  async waitForReady(): Promise<void> {
    // Either the notes list or empty state should be visible
    await this.page.waitForSelector(
      '[data-testid="notes-list"], [data-testid="empty-state"]',
      { state: 'visible' }
    );
    await this.waitForLoadingComplete();
  }

  /**
   * Locators - Notes List
   */
  get notesList(): Locator {
    return this.page.getByTestId('notes-list').or(this.page.locator('[data-notes-list]'));
  }

  get emptyState(): Locator {
    return this.page.getByTestId('empty-state');
  }

  get createNoteButton(): Locator {
    return this.page.getByRole('button', { name: /create|add|new/i }).or(
      this.page.getByTestId('create-note-button')
    );
  }

  /**
   * Get all note cards in the list
   */
  get noteCards(): Locator {
    return this.notesList.locator('[data-testid="note-card"], [data-note]');
  }

  /**
   * Get a specific note by title
   */
  getNoteByTitle(title: string): Locator {
    return this.noteCards.filter({ hasText: title });
  }

  /**
   * Create/Edit Note Form
   */
  get noteForm(): Locator {
    return this.page.getByRole('dialog').or(this.page.getByTestId('note-form'));
  }

  get titleInput(): Locator {
    return this.page.getByLabel(/title/i).or(this.page.getByTestId('note-title-input'));
  }

  get bodyInput(): Locator {
    return this.page.getByLabel(/body|content|notes/i).or(
      this.page.getByTestId('note-body-input')
    );
  }

  get saveButton(): Locator {
    return this.page.getByRole('button', { name: /save|create|submit/i });
  }

  get cancelButton(): Locator {
    return this.page.getByRole('button', { name: /cancel/i });
  }

  /**
   * Note Detail View
   */
  get noteDetail(): Locator {
    return this.page.getByTestId('note-detail').or(this.page.locator('[data-note-detail]'));
  }

  get noteTitle(): Locator {
    return this.noteDetail.locator('h1, h2, [data-testid="note-title"]').first();
  }

  get noteBody(): Locator {
    return this.noteDetail.getByTestId('note-body').or(
      this.noteDetail.locator('[data-note-body]')
    );
  }

  get editButton(): Locator {
    return this.noteDetail.getByRole('button', { name: /edit/i }).or(
      this.noteDetail.getByTestId('edit-button')
    );
  }

  get deleteButton(): Locator {
    return this.noteDetail.getByRole('button', { name: /delete/i }).or(
      this.noteDetail.getByTestId('delete-button')
    );
  }

  get extractActionsButton(): Locator {
    return this.noteDetail.getByRole('button', { name: /extract|ai|actions/i }).or(
      this.noteDetail.getByTestId('extract-actions-button')
    );
  }

  /**
   * Extraction Results
   */
  get extractionResults(): Locator {
    return this.page.getByTestId('extraction-results').or(
      this.page.locator('[data-extraction-results]')
    );
  }

  get extractedItems(): Locator {
    return this.extractionResults.locator('[data-testid="extracted-item"]');
  }

  get acceptAllButton(): Locator {
    return this.extractionResults.getByRole('button', { name: /accept all/i });
  }

  get rejectAllButton(): Locator {
    return this.extractionResults.getByRole('button', { name: /reject all|dismiss/i });
  }

  /**
   * Actions
   */
  async createNote(title: string, body: string): Promise<void> {
    await this.createNoteButton.click();

    // Wait for form to be visible (could be modal or inline)
    await expect(this.titleInput).toBeVisible();

    await this.titleInput.fill(title);
    await this.bodyInput.fill(body);
    await this.saveButton.click();

    // Wait for save to complete
    await this.waitForLoadingComplete();
  }

  async openNote(title: string): Promise<void> {
    await this.getNoteByTitle(title).click();
    await expect(this.noteDetail).toBeVisible();
  }

  async editNote(newTitle?: string, newBody?: string): Promise<void> {
    await this.editButton.click();

    if (newTitle) {
      await this.titleInput.clear();
      await this.titleInput.fill(newTitle);
    }

    if (newBody) {
      await this.bodyInput.clear();
      await this.bodyInput.fill(newBody);
    }

    await this.saveButton.click();
    await this.waitForLoadingComplete();
  }

  async deleteNote(): Promise<void> {
    await this.deleteButton.click();

    // Confirm deletion
    const confirmButton = this.page.getByRole('button', { name: /confirm|yes|delete/i });
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }

    await this.waitForLoadingComplete();
  }

  async extractActionItems(): Promise<void> {
    await this.extractActionsButton.click();
    await expect(this.extractionResults).toBeVisible({ timeout: 30000 });
  }

  async acceptExtractedItem(index: number): Promise<void> {
    const item = this.extractedItems.nth(index);
    const acceptButton = item.getByRole('button', { name: /accept|add/i });
    await acceptButton.click();
  }

  async rejectExtractedItem(index: number): Promise<void> {
    const item = this.extractedItems.nth(index);
    const rejectButton = item.getByRole('button', { name: /reject|skip/i });
    await rejectButton.click();
  }

  /**
   * Assertions
   */
  async expectNoteInList(title: string): Promise<void> {
    await expect(this.getNoteByTitle(title)).toBeVisible();
  }

  async expectNoteNotInList(title: string): Promise<void> {
    await expect(this.getNoteByTitle(title)).toBeHidden();
  }

  async expectNoteCount(count: number): Promise<void> {
    await expect(this.noteCards).toHaveCount(count);
  }

  async expectEmptyState(): Promise<void> {
    await expect(this.emptyState).toBeVisible();
  }

  async expectNoteDetailVisible(title: string): Promise<void> {
    await expect(this.noteDetail).toBeVisible();
    await expect(this.noteTitle).toContainText(title);
  }

  async expectExtractedItemsCount(count: number): Promise<void> {
    await expect(this.extractedItems).toHaveCount(count);
  }
}
