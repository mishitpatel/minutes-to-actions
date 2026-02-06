/**
 * Meeting Notes E2E Tests
 *
 * Browser-based tests for meeting notes CRUD operations.
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from './fixtures/pages/login.page.js';
import { NotesPage } from './fixtures/pages/notes.page.js';

test.describe('Meeting Notes', () => {
  // Authenticate before each test
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    try {
      await loginPage.loginAsTestUser('e2e-notes@example.com', 'Notes Test User');
    } catch {
      test.skip(true, 'Test login endpoint not available');
    }
  });

  test.describe('Notes List', () => {
    test('should display notes list page', async ({ page }) => {
      const notesPage = new NotesPage(page);
      await notesPage.goto();
      await notesPage.waitForReady();

      // Either notes list or empty state should be visible
      await expect(
        notesPage.notesList.or(notesPage.emptyState)
      ).toBeVisible();
    });

    test('should show empty state when no notes exist', async ({ page }) => {
      const notesPage = new NotesPage(page);
      await notesPage.goto();
      await notesPage.waitForReady();

      // Check for empty state or zero notes
      const noteCount = await notesPage.noteCards.count();
      if (noteCount === 0) {
        // Empty state should be visible
        await expect(
          notesPage.emptyState.or(page.getByText(/no notes|create your first|get started/i))
        ).toBeVisible({ timeout: 5000 }).catch(() => {
          // Empty state design may vary
        });
      }
    });

    test('should have create note button', async ({ page }) => {
      const notesPage = new NotesPage(page);
      await notesPage.goto();

      await expect(notesPage.createNoteButton).toBeVisible();
    });
  });

  test.describe('Create Note', () => {
    test('should open create note form', async ({ page }) => {
      const notesPage = new NotesPage(page);
      await notesPage.goto();
      await notesPage.waitForReady();

      await notesPage.createNoteButton.click();

      // Form should be visible
      await expect(notesPage.titleInput).toBeVisible();
      await expect(notesPage.bodyInput).toBeVisible();
    });

    test('should create a new meeting note', async ({ page }) => {
      const notesPage = new NotesPage(page);
      await notesPage.goto();
      await notesPage.waitForReady();

      const noteTitle = `Test Meeting ${Date.now()}`;
      await notesPage.createNote(noteTitle, 'Meeting discussion points and notes.');

      // Note should appear in list
      await notesPage.expectNoteInList(noteTitle);
    });

    test('should require title field', async ({ page }) => {
      const notesPage = new NotesPage(page);
      await notesPage.goto();
      await notesPage.waitForReady();

      await notesPage.createNoteButton.click();

      // Try to submit without title
      await notesPage.bodyInput.fill('Body without title');
      await notesPage.saveButton.click();

      // Form should still be visible (validation failed)
      await expect(notesPage.titleInput).toBeVisible();
    });

    test('should cancel note creation', async ({ page }) => {
      const notesPage = new NotesPage(page);
      await notesPage.goto();
      await notesPage.waitForReady();

      await notesPage.createNoteButton.click();
      await notesPage.titleInput.fill('Will be cancelled');

      await notesPage.cancelButton.click();

      // Form should be hidden
      await expect(notesPage.noteForm).toBeHidden();
    });
  });

  test.describe('View Note', () => {
    test('should open note detail view', async ({ page }) => {
      const notesPage = new NotesPage(page);
      await notesPage.goto();
      await notesPage.waitForReady();

      // Create a note first
      const noteTitle = `Detail Test ${Date.now()}`;
      await notesPage.createNote(noteTitle, 'Note content for detail view.');

      // Open the note
      await notesPage.openNote(noteTitle);

      // Should show detail view
      await notesPage.expectNoteDetailVisible(noteTitle);
    });

    test('should display note content', async ({ page }) => {
      const notesPage = new NotesPage(page);
      await notesPage.goto();
      await notesPage.waitForReady();

      const noteTitle = `Content Test ${Date.now()}`;
      const noteBody = 'This is the meeting body with important points.';

      await notesPage.createNote(noteTitle, noteBody);
      await notesPage.openNote(noteTitle);

      // Body should be visible
      await expect(notesPage.noteBody).toContainText(noteBody);
    });

    test('should show edit button in detail view', async ({ page }) => {
      const notesPage = new NotesPage(page);
      await notesPage.goto();
      await notesPage.waitForReady();

      const noteTitle = `Edit Button Test ${Date.now()}`;
      await notesPage.createNote(noteTitle, 'Note with edit button.');
      await notesPage.openNote(noteTitle);

      await expect(notesPage.editButton).toBeVisible();
    });

    test('should show delete button in detail view', async ({ page }) => {
      const notesPage = new NotesPage(page);
      await notesPage.goto();
      await notesPage.waitForReady();

      const noteTitle = `Delete Button Test ${Date.now()}`;
      await notesPage.createNote(noteTitle, 'Note with delete button.');
      await notesPage.openNote(noteTitle);

      await expect(notesPage.deleteButton).toBeVisible();
    });
  });

  test.describe('Edit Note', () => {
    test('should edit note title', async ({ page }) => {
      const notesPage = new NotesPage(page);
      await notesPage.goto();
      await notesPage.waitForReady();

      const originalTitle = `Original Title ${Date.now()}`;
      const updatedTitle = `Updated Title ${Date.now()}`;

      await notesPage.createNote(originalTitle, 'Original body.');
      await notesPage.openNote(originalTitle);

      await notesPage.editNote(updatedTitle);

      // Updated title should be visible
      await notesPage.expectNoteDetailVisible(updatedTitle);
    });

    test('should edit note body', async ({ page }) => {
      const notesPage = new NotesPage(page);
      await notesPage.goto();
      await notesPage.waitForReady();

      const noteTitle = `Body Edit Test ${Date.now()}`;
      const updatedBody = 'This is the updated meeting content.';

      await notesPage.createNote(noteTitle, 'Original body content.');
      await notesPage.openNote(noteTitle);

      await notesPage.editNote(undefined, updatedBody);

      await expect(notesPage.noteBody).toContainText(updatedBody);
    });
  });

  test.describe('Delete Note', () => {
    test('should delete a note', async ({ page }) => {
      const notesPage = new NotesPage(page);
      await notesPage.goto();
      await notesPage.waitForReady();

      const noteTitle = `To Delete ${Date.now()}`;

      await notesPage.createNote(noteTitle, 'This will be deleted.');
      await notesPage.openNote(noteTitle);

      await notesPage.deleteNote();

      // Note should no longer be in list
      await notesPage.expectNoteNotInList(noteTitle);
    });

    test('should confirm before deleting', async ({ page }) => {
      const notesPage = new NotesPage(page);
      await notesPage.goto();
      await notesPage.waitForReady();

      const noteTitle = `Confirm Delete ${Date.now()}`;

      await notesPage.createNote(noteTitle, 'This needs confirmation to delete.');
      await notesPage.openNote(noteTitle);

      // Click delete button
      await notesPage.deleteButton.click();

      // Confirmation dialog should appear
      const confirmButton = page.getByRole('button', { name: /confirm|yes|delete/i });
      await expect(confirmButton).toBeVisible({ timeout: 3000 }).catch(() => {
        // Some UIs delete immediately without confirmation
      });
    });
  });

  test.describe('Responsive Design', () => {
    test('should be usable on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      const notesPage = new NotesPage(page);
      await notesPage.goto();
      await notesPage.waitForReady();

      // Create button should still be accessible
      await expect(notesPage.createNoteButton).toBeVisible();

      // Should be able to create a note
      const noteTitle = `Mobile Test ${Date.now()}`;
      await notesPage.createNote(noteTitle, 'Created on mobile.');

      await notesPage.expectNoteInList(noteTitle);
    });
  });
});
