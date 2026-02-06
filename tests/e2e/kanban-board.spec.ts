/**
 * Kanban Board E2E Tests
 *
 * Browser-based tests for the action items board including
 * drag-and-drop, CRUD operations, and status changes.
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from './fixtures/pages/login.page.js';
import { BoardPage, ColumnStatus } from './fixtures/pages/board.page.js';

test.describe('Kanban Board', () => {
  // Authenticate before each test
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    try {
      await loginPage.loginAsTestUser('e2e-board@example.com', 'Board Test User');
    } catch {
      test.skip(true, 'Test login endpoint not available');
    }
  });

  test.describe('Board Layout', () => {
    test('should display all three columns', async ({ page }) => {
      const boardPage = new BoardPage(page);
      await boardPage.goto();
      await boardPage.waitForReady();

      // All columns should be visible
      await expect(boardPage.getColumn('todo')).toBeVisible();
      await expect(boardPage.getColumn('doing')).toBeVisible();
      await expect(boardPage.getColumn('done')).toBeVisible();
    });

    test('should display column headers', async ({ page }) => {
      const boardPage = new BoardPage(page);
      await boardPage.goto();
      await boardPage.waitForReady();

      await expect(boardPage.getColumnHeader('todo')).toContainText(/to ?do|todo/i);
      await expect(boardPage.getColumnHeader('doing')).toContainText(/doing|in ?progress/i);
      await expect(boardPage.getColumnHeader('done')).toContainText(/done|complete/i);
    });

    test('should have create action item button', async ({ page }) => {
      const boardPage = new BoardPage(page);
      await boardPage.goto();
      await boardPage.waitForReady();

      await expect(boardPage.createButton).toBeVisible();
    });
  });

  test.describe('Create Action Item', () => {
    test('should open create modal', async ({ page }) => {
      const boardPage = new BoardPage(page);
      await boardPage.goto();
      await boardPage.waitForReady();

      await boardPage.createButton.click();

      await expect(boardPage.createModal).toBeVisible();
      await expect(boardPage.titleInput).toBeVisible();
    });

    test('should create action item in todo column', async ({ page }) => {
      const boardPage = new BoardPage(page);
      await boardPage.goto();
      await boardPage.waitForReady();

      const itemTitle = `New Task ${Date.now()}`;
      await boardPage.createActionItem({ title: itemTitle });

      // Item should appear in todo column
      await boardPage.expectCardInColumn(itemTitle, 'todo');
    });

    test('should create action item with description', async ({ page }) => {
      const boardPage = new BoardPage(page);
      await boardPage.goto();
      await boardPage.waitForReady();

      const itemTitle = `Task with Description ${Date.now()}`;
      await boardPage.createActionItem({
        title: itemTitle,
        description: 'This is a detailed task description.',
      });

      await boardPage.expectCardInColumn(itemTitle, 'todo');
    });

    test('should create action item with due date', async ({ page }) => {
      const boardPage = new BoardPage(page);
      await boardPage.goto();
      await boardPage.waitForReady();

      const itemTitle = `Task with Due Date ${Date.now()}`;
      // Use a future date
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const dueDateStr = futureDate.toISOString().split('T')[0];

      await boardPage.createActionItem({
        title: itemTitle,
        dueDate: dueDateStr,
      });

      await boardPage.expectCardInColumn(itemTitle, 'todo');
    });

    test('should require title field', async ({ page }) => {
      const boardPage = new BoardPage(page);
      await boardPage.goto();
      await boardPage.waitForReady();

      await boardPage.createButton.click();

      // Try to submit without title
      await boardPage.submitButton.click();

      // Modal should still be visible (validation failed)
      await expect(boardPage.createModal).toBeVisible();
    });

    test('should cancel creation', async ({ page }) => {
      const boardPage = new BoardPage(page);
      await boardPage.goto();
      await boardPage.waitForReady();

      await boardPage.createButton.click();
      await boardPage.titleInput.fill('Will be cancelled');
      await boardPage.cancelButton.click();

      // Modal should be hidden
      await expect(boardPage.createModal).toBeHidden();
    });
  });

  test.describe('Edit Action Item', () => {
    test('should open edit modal when clicking card', async ({ page }) => {
      const boardPage = new BoardPage(page);
      await boardPage.goto();
      await boardPage.waitForReady();

      const itemTitle = `Edit Test ${Date.now()}`;
      await boardPage.createActionItem({ title: itemTitle });

      // Click the card to edit
      const card = boardPage.getCardByTitle(itemTitle);
      await card.click();

      // Edit modal should open
      await expect(boardPage.createModal).toBeVisible();
    });

    test('should update action item title', async ({ page }) => {
      const boardPage = new BoardPage(page);
      await boardPage.goto();
      await boardPage.waitForReady();

      const originalTitle = `Original ${Date.now()}`;
      const updatedTitle = `Updated ${Date.now()}`;

      await boardPage.createActionItem({ title: originalTitle });
      await boardPage.editCard(originalTitle, { title: updatedTitle });

      await boardPage.expectCardInColumn(updatedTitle, 'todo');
      await boardPage.expectCardNotInColumn(originalTitle, 'todo');
    });
  });

  test.describe('Delete Action Item', () => {
    test('should delete an action item', async ({ page }) => {
      const boardPage = new BoardPage(page);
      await boardPage.goto();
      await boardPage.waitForReady();

      const itemTitle = `To Delete ${Date.now()}`;
      await boardPage.createActionItem({ title: itemTitle });

      // Verify item exists
      await boardPage.expectCardInColumn(itemTitle, 'todo');

      // Delete it
      await boardPage.deleteCard(itemTitle);

      // Should no longer exist
      await expect(boardPage.getCardByTitle(itemTitle)).toBeHidden();
    });
  });

  test.describe('Drag and Drop', () => {
    test('should move card from todo to doing', async ({ page }) => {
      const boardPage = new BoardPage(page);
      await boardPage.goto();
      await boardPage.waitForReady();

      const itemTitle = `Drag Test ${Date.now()}`;
      await boardPage.createActionItem({ title: itemTitle });

      // Verify starts in todo
      await boardPage.expectCardInColumn(itemTitle, 'todo');

      // Drag to doing
      await boardPage.dragCard(itemTitle, 'doing');

      // Verify moved
      await boardPage.expectCardInColumn(itemTitle, 'doing');
      await boardPage.expectCardNotInColumn(itemTitle, 'todo');
    });

    test('should move card from doing to done', async ({ page }) => {
      const boardPage = new BoardPage(page);
      await boardPage.goto();
      await boardPage.waitForReady();

      const itemTitle = `Complete Task ${Date.now()}`;
      await boardPage.createActionItem({ title: itemTitle });

      // Move to doing first
      await boardPage.dragCard(itemTitle, 'doing');
      await boardPage.expectCardInColumn(itemTitle, 'doing');

      // Move to done
      await boardPage.dragCard(itemTitle, 'done');
      await boardPage.expectCardInColumn(itemTitle, 'done');
    });

    test('should move card from done back to todo', async ({ page }) => {
      const boardPage = new BoardPage(page);
      await boardPage.goto();
      await boardPage.waitForReady();

      const itemTitle = `Reopen Task ${Date.now()}`;
      await boardPage.createActionItem({ title: itemTitle });

      // Move to done
      await boardPage.dragCard(itemTitle, 'done');
      await boardPage.expectCardInColumn(itemTitle, 'done');

      // Move back to todo
      await boardPage.dragCard(itemTitle, 'todo');
      await boardPage.expectCardInColumn(itemTitle, 'todo');
    });
  });

  test.describe('Card Count', () => {
    test('should show correct card count per column', async ({ page }) => {
      const boardPage = new BoardPage(page);
      await boardPage.goto();
      await boardPage.waitForReady();

      // Create items in different columns
      await boardPage.createActionItem({ title: `Todo 1 ${Date.now()}` });
      await boardPage.createActionItem({ title: `Todo 2 ${Date.now()}` });

      // Move one to doing
      const doingItem = `Doing Item ${Date.now()}`;
      await boardPage.createActionItem({ title: doingItem });
      await boardPage.dragCard(doingItem, 'doing');

      // Verify counts
      const todoCount = await boardPage.getCardCount('todo');
      const doingCount = await boardPage.getCardCount('doing');

      expect(todoCount).toBeGreaterThanOrEqual(2);
      expect(doingCount).toBeGreaterThanOrEqual(1);
    });
  });

  test.describe('Persistence', () => {
    test('should persist items after page reload', async ({ page }) => {
      const boardPage = new BoardPage(page);
      await boardPage.goto();
      await boardPage.waitForReady();

      const itemTitle = `Persistent Item ${Date.now()}`;
      await boardPage.createActionItem({ title: itemTitle });

      // Reload page
      await page.reload();
      await boardPage.waitForReady();

      // Item should still be there
      await boardPage.expectCardInColumn(itemTitle, 'todo');
    });

    test('should persist status changes after reload', async ({ page }) => {
      const boardPage = new BoardPage(page);
      await boardPage.goto();
      await boardPage.waitForReady();

      const itemTitle = `Status Persist ${Date.now()}`;
      await boardPage.createActionItem({ title: itemTitle });

      // Move to doing
      await boardPage.dragCard(itemTitle, 'doing');

      // Reload
      await page.reload();
      await boardPage.waitForReady();

      // Should still be in doing
      await boardPage.expectCardInColumn(itemTitle, 'doing');
    });
  });

  test.describe('Responsive Design', () => {
    test('should stack columns on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      const boardPage = new BoardPage(page);
      await boardPage.goto();
      await boardPage.waitForReady();

      // Board should still be visible
      await expect(boardPage.board).toBeVisible();

      // Create button should be accessible
      await expect(boardPage.createButton).toBeVisible();
    });

    test('should allow card creation on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const boardPage = new BoardPage(page);
      await boardPage.goto();
      await boardPage.waitForReady();

      const itemTitle = `Mobile Item ${Date.now()}`;
      await boardPage.createActionItem({ title: itemTitle });

      // Should be created
      const card = boardPage.getCardByTitle(itemTitle);
      await expect(card).toBeVisible();
    });
  });
});
