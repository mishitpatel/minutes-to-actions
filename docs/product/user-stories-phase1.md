# User Stories — Phase 1 MVP

## Overview

This document contains user stories for **Minutes to Actions**, a productivity tool that helps users extract action-items from meeting notes and manage them on a Kanban board.

**Product Vision:** Paste meeting notes, extract action-items, manage them on a Kanban board, and share a read-only board link.

**User Types:**
- **User** - Authenticated individual managing their own meeting notes and action-items
- **Visitor** - Unauthenticated person viewing a shared board via public link

---

## 1. Authentication

### US-1.1: Google OAuth Sign Up
**As a** new User
**I want to** sign up using my Google account
**So that** I can quickly create an account without managing another password

**Acceptance Criteria:**
- [ ] "Sign in with Google" button is prominently displayed on the landing/login page
- [ ] Clicking initiates Google OAuth flow
- [ ] If email is new, a new user account is created
- [ ] If email already exists, user is logged into existing account
- [ ] User is redirected to Meeting Notes Inbox after successful authentication
- [ ] User's name and profile photo are pulled from Google account

**Expected Result:** User account is created/accessed and user lands on Meeting Notes Inbox.

---

### US-1.2: Google OAuth Sign In
**As a** returning User
**I want to** sign in using my Google account
**So that** I can access my meeting notes and action-items

**Acceptance Criteria:**
- [ ] "Sign in with Google" button is visible on login page
- [ ] Clicking initiates Google OAuth flow
- [ ] Successful authentication redirects to Meeting Notes Inbox
- [ ] Session persists across browser sessions (remember me by default)
- [ ] Invalid/cancelled OAuth shows appropriate error message

**Expected Result:** User is authenticated and redirected to Meeting Notes Inbox.

---

### US-1.3: Sign Out
**As a** User
**I want to** sign out of my account
**So that** I can securely end my session

**Acceptance Criteria:**
- [ ] Sign out option is accessible from the UI (sidebar or header)
- [ ] Clicking sign out ends the user session
- [ ] User is redirected to login/landing page
- [ ] User cannot access protected pages after signing out

**Expected Result:** User session is terminated and user is redirected to login page.

---

## 2. Meeting Notes Inbox

### US-2.1: View Meeting Notes List
**As a** User
**I want to** view a list of all my meeting notes
**So that** I can see and access my saved notes

**Acceptance Criteria:**
- [ ] Meeting Notes Inbox is the default landing page after sign in
- [ ] Notes are displayed in a list/card format
- [ ] Each note shows: title (or first line if no title), created date, preview snippet
- [ ] Notes are sorted by most recently created/updated first
- [ ] Empty state shown when no notes exist with prompt to create first note
- [ ] List supports pagination or infinite scroll for large numbers of notes

**Expected Result:** User sees all their meeting notes in an organized list.

---

### US-2.2: Create a Meeting Note
**As a** User
**I want to** create a new meeting note
**So that** I can capture and save meeting content

**Acceptance Criteria:**
- [ ] "New Note" button is visible in the Meeting Notes Inbox
- [ ] Clicking opens a note editor (modal, drawer, or new page)
- [ ] Note editor has:
  - Title field (optional)
  - Body field (required, supports multi-line text)
- [ ] "Save" button creates the note
- [ ] Validation: body cannot be empty
- [ ] After saving, user sees the note detail view
- [ ] New note appears in the Meeting Notes Inbox list

**Expected Result:** A new meeting note is created and saved to the user's inbox.

---

### US-2.3: View Meeting Note Detail
**As a** User
**I want to** view the full content of a meeting note
**So that** I can read the complete notes and take actions on them

**Acceptance Criteria:**
- [ ] Clicking a note in the list opens the note detail view
- [ ] Note detail displays:
  - Title (if set)
  - Full body content
  - Created date
  - Last updated date
- [ ] "Extract action-items" button is visible
- [ ] "Edit" button is visible
- [ ] "Delete" button is visible
- [ ] List of action-items extracted from this note is shown (if any exist)

**Expected Result:** User can see the full meeting note content and associated action-items.

---

### US-2.4: Edit a Meeting Note
**As a** User
**I want to** edit an existing meeting note
**So that** I can correct or update the content

**Acceptance Criteria:**
- [ ] "Edit" button is available on note detail view
- [ ] Clicking opens the note in edit mode
- [ ] User can modify title and body
- [ ] "Save" button saves changes
- [ ] "Cancel" button discards changes and returns to detail view
- [ ] Validation: body cannot be empty
- [ ] Last updated date is refreshed after saving

**Expected Result:** Meeting note is updated with new content.

---

### US-2.5: Delete a Meeting Note
**As a** User
**I want to** delete a meeting note
**So that** I can remove notes I no longer need

**Acceptance Criteria:**
- [ ] "Delete" button is available on note detail view
- [ ] Clicking shows a confirmation dialog ("Are you sure? This cannot be undone.")
- [ ] Confirming deletes the note
- [ ] User is redirected to Meeting Notes Inbox
- [ ] Deleted note no longer appears in the list
- [ ] Associated action-items remain on the board (orphaned but not deleted)

**Expected Result:** Meeting note is permanently deleted.

---

## 3. Extract Action-Items

### US-3.1: Extract Action-Items from Meeting Note
**As a** User
**I want to** extract action-items from a meeting note using AI
**So that** I can quickly identify and track follow-up tasks

**Acceptance Criteria:**
- [ ] "Extract action-items" button is visible on note detail view
- [ ] Clicking initiates AI extraction (calls Claude/LLM API)
- [ ] Loading state is shown during extraction
- [ ] Extracted action-items are displayed for review before saving
- [ ] Each extracted item shows:
  - Title (extracted task description)
  - Suggested priority (if detectable, otherwise default to Medium)
  - Suggested due date (if mentioned in notes, otherwise empty)
- [ ] User can edit extracted items before saving
- [ ] User can remove unwanted items before saving
- [ ] "Save action-items" button creates the items on the board
- [ ] Action-items are created with status "To Do"
- [ ] Action-items are linked to the source meeting note
- [ ] Success message shows count of items created

**Expected Result:** AI extracts action-items from the note, user reviews and saves them to the board.

---

### US-3.2: Handle Extraction with No Action-Items
**As a** User
**I want to** be informed when no action-items are found
**So that** I understand the extraction result

**Acceptance Criteria:**
- [ ] If AI finds no action-items, a message is displayed: "No action-items found in this note."
- [ ] User can still manually create action-items if desired
- [ ] No error is shown - this is a valid outcome

**Expected Result:** User is informed that no action-items were detected.

---

### US-3.3: Handle Extraction Errors
**As a** User
**I want to** see a clear error message if extraction fails
**So that** I know something went wrong and can retry

**Acceptance Criteria:**
- [ ] If AI extraction fails (API error, timeout, etc.), error message is shown
- [ ] Error message is user-friendly (not technical jargon)
- [ ] "Retry" button allows user to try again
- [ ] User can still manually create action-items as fallback

**Expected Result:** User is informed of the failure and can retry or proceed manually.

---

### US-3.4: Generate Sample Meeting Notes
**As a** User
**I want to** generate sample meeting notes from a preset template
**So that** I can quickly test the extraction workflow without writing notes myself

**Acceptance Criteria:**
- [ ] "Generate Sample" button with a preset dropdown is visible on the Create Meeting Note page
- [ ] Preset options: **Weekly Standup**, **1:1 Meeting**, **Sprint Retrospective**
- [ ] Selecting a preset calls the AI to generate a realistic meeting title and body
- [ ] Loading state is shown in the editor while generating
- [ ] Generated title and body are filled into the editor fields when ready
- [ ] If the editor already has content, a confirmation dialog warns before overwriting: "This will replace your current content. Continue?"
- [ ] If generation fails, a user-friendly error message is shown with a retry option
- [ ] Generated content is realistic enough to produce meaningful action items when extracted
- [ ] Button is not visible on the note detail/edit page (create page only)

**Expected Result:** User can generate sample meeting notes with one click, enabling quick demo of the full workflow.

---

## 4. Action Board (Kanban)

### US-4.1: View Action Board
**As a** User
**I want to** view my action board with all action-items
**So that** I can see the status of all my tasks

**Acceptance Criteria:**
- [ ] Action Board is accessible from the sidebar navigation
- [ ] Board displays three columns: **To Do**, **Doing**, **Done**
- [ ] Each column shows action-item cards
- [ ] Each card displays:
  - Title
  - Priority indicator (High/Medium/Low with visual distinction)
  - Due date (if set)
  - Link to source meeting note (if applicable)
- [ ] Cards are sorted within columns (priority first, then due date)
- [ ] Empty columns show placeholder text
- [ ] Column headers show count of items

**Expected Result:** User sees all action-items organized by status in Kanban columns.

---

### US-4.2: Create Action-Item Manually
**As a** User
**I want to** manually create an action-item
**So that** I can add tasks that weren't extracted from notes

**Acceptance Criteria:**
- [ ] "Add action-item" button is visible (in column header or board header)
- [ ] Clicking opens a form/modal with fields:
  - Title (required)
  - Description (optional)
  - Priority (dropdown: High/Medium/Low, default: Medium)
  - Due date (optional date picker)
  - Status (dropdown: To Do/Doing/Done, default: To Do)
- [ ] Manually created items have no linked meeting note
- [ ] "Save" button creates the action-item
- [ ] "Cancel" button closes without saving
- [ ] New item appears in the appropriate column

**Expected Result:** A new action-item is created and added to the board.

---

### US-4.3: View Action-Item Detail
**As a** User
**I want to** view the full details of an action-item
**So that** I can see all information about the task

**Acceptance Criteria:**
- [ ] Clicking an action-item card opens a detail view (modal or drawer)
- [ ] Detail view shows:
  - Title
  - Description (if set)
  - Priority
  - Due date (if set)
  - Current status
  - Source meeting note link (if applicable, clickable to open note)
  - Created date
- [ ] Edit and Delete buttons are visible

**Expected Result:** User can see complete action-item information.

---

### US-4.4: Edit Action-Item
**As a** User
**I want to** edit an action-item
**So that** I can update task details as needed

**Acceptance Criteria:**
- [ ] "Edit" button is available in action-item detail view
- [ ] Clicking opens edit form with current values
- [ ] User can modify: title, description, priority, due date, status
- [ ] "Save" button saves changes
- [ ] "Cancel" button discards changes
- [ ] If status changed, card moves to appropriate column
- [ ] Changes reflect immediately on the board

**Expected Result:** Action-item is updated with new information.

---

### US-4.5: Delete Action-Item
**As a** User
**I want to** delete an action-item
**So that** I can remove tasks I no longer need

**Acceptance Criteria:**
- [ ] "Delete" button is available in action-item detail view
- [ ] Clicking shows confirmation dialog
- [ ] Confirming deletes the action-item permanently
- [ ] Card is removed from the board
- [ ] User returns to board view

**Expected Result:** Action-item is permanently deleted from the board.

---

### US-4.6: Move Action-Item via Drag and Drop
**As a** User
**I want to** drag and drop action-items between columns
**So that** I can quickly update task status

**Acceptance Criteria:**
- [ ] Action-item cards are draggable
- [ ] User can drag a card from one column to another
- [ ] Visual feedback during drag (card follows cursor, drop zones highlighted)
- [ ] Dropping in a new column updates the item's status
- [ ] Change persists (saved to database)
- [ ] Card remains in new column after page refresh

**Expected Result:** Action-item status is updated by dragging between columns.

---

### US-4.7: Move Action-Item via Dropdown
**As a** User
**I want to** move an action-item using a dropdown menu
**So that** I can update status without drag and drop (accessibility/mobile)

**Acceptance Criteria:**
- [ ] Each action-item card has a "Move to..." option (button or menu)
- [ ] Clicking shows options: To Do, Doing, Done
- [ ] Selecting an option moves the item to that column
- [ ] Current status is indicated/disabled in the menu
- [ ] Change persists immediately

**Expected Result:** Action-item status is updated via dropdown selection.

---

### US-4.8: Mark Action-Item as Done
**As a** User
**I want to** quickly mark an action-item as done
**So that** I can complete tasks efficiently

**Acceptance Criteria:**
- [ ] Each action-item card has a "Mark done" checkbox or button
- [ ] Clicking moves the item to the Done column
- [ ] Visual feedback confirms the action (checkmark, animation)
- [ ] Item can be moved back to other columns if marked done by mistake

**Expected Result:** Action-item is moved to Done column with one click.

---

### US-4.9: Navigate to Source Meeting Note
**As a** User
**I want to** click on the source note link in an action-item
**So that** I can view the original context of the task

**Acceptance Criteria:**
- [ ] Action-items extracted from notes show a "Source note" link
- [ ] Clicking the link navigates to the meeting note detail view
- [ ] If source note was deleted, link shows "Note deleted" (non-clickable)
- [ ] Manually created items show no source link

**Expected Result:** User can navigate from action-item to its source meeting note.

---

## 5. Share Board

### US-5.1: Enable Board Sharing
**As a** User
**I want to** enable sharing for my board
**So that** I can share my action-items with others via a public link

**Acceptance Criteria:**
- [ ] "Share Board" is accessible from the sidebar navigation
- [ ] Share page shows toggle: "Enable public sharing"
- [ ] When toggled on:
  - A unique public URL is generated
  - URL is displayed with "Copy" button
  - Success message confirms sharing is enabled
- [ ] Sharing is disabled by default for new users
- [ ] Public URL format: `{domain}/shared/{unique-token}`

**Expected Result:** A unique public link is generated for the user's board.

---

### US-5.2: Copy Share Link
**As a** User
**I want to** copy the share link to my clipboard
**So that** I can easily share it with others

**Acceptance Criteria:**
- [ ] "Copy" button is visible next to the share URL
- [ ] Clicking copies the URL to clipboard
- [ ] Visual feedback: "Copied!" message or button state change
- [ ] Works across browsers

**Expected Result:** Share link is copied to clipboard for easy sharing.

---

### US-5.3: Disable Board Sharing
**As a** User
**I want to** disable sharing for my board
**So that** the public link no longer works

**Acceptance Criteria:**
- [ ] When sharing is enabled, toggle can be turned off
- [ ] Toggling off shows confirmation: "This will disable the current link. Anyone with the link will no longer be able to view your board."
- [ ] Confirming disables sharing
- [ ] Previous public link immediately stops working
- [ ] Share page shows sharing is disabled

**Expected Result:** Public link is revoked and no longer accessible.

---

### US-5.4: Regenerate Share Link
**As a** User
**I want to** regenerate my share link
**So that** I can invalidate the old link and create a new one

**Acceptance Criteria:**
- [ ] "Regenerate link" button is visible when sharing is enabled
- [ ] Clicking shows confirmation: "This will invalidate the current link. Anyone with the old link will no longer have access."
- [ ] Confirming generates a new unique URL
- [ ] Old URL immediately stops working
- [ ] New URL is displayed

**Expected Result:** New share link is created and old link is invalidated.

---

### US-5.5: View Shared Board (Public Visitor)
**As a** Visitor
**I want to** view a shared board via public link
**So that** I can see someone's action-items without needing an account

**Acceptance Criteria:**
- [ ] Visiting a valid share link shows the board in read-only mode
- [ ] Board displays all three columns: To Do, Doing, Done
- [ ] Each action-item card shows: title, priority, due date
- [ ] No edit controls are visible (no drag, no edit buttons, no delete)
- [ ] No sign-in required to view
- [ ] Board header shows it's a shared view (e.g., "Shared Board" label)
- [ ] Source meeting note links are not visible to visitors (privacy)

**Expected Result:** Visitor can view the board but cannot make any changes.

---

### US-5.6: Handle Invalid Share Link
**As a** Visitor
**I want to** see a clear message when a share link is invalid
**So that** I understand the link doesn't work

**Acceptance Criteria:**
- [ ] Invalid/expired/revoked links show a friendly error page
- [ ] Message: "This board is no longer shared or the link is invalid."
- [ ] No sensitive information is revealed
- [ ] Option to sign in or go to homepage

**Expected Result:** Visitor sees a clear error message for invalid links.

---

## 6. Navigation & Layout

### US-6.1: Sidebar Navigation
**As a** User
**I want to** navigate between sections using a sidebar
**So that** I can easily access different parts of the app

**Acceptance Criteria:**
- [ ] Left sidebar is visible on all authenticated pages
- [ ] Sidebar contains links to:
  - Meeting Notes Inbox
  - Action Board
  - Share Board
- [ ] Current section is highlighted/active
- [ ] Clicking a link navigates to that section
- [ ] User profile/sign out option is accessible from sidebar or header

**Expected Result:** User can navigate the app using the sidebar.

---

### US-6.2: Responsive Layout
**As a** User
**I want to** use the app on different screen sizes
**So that** I can access it from desktop or mobile devices

**Acceptance Criteria:**
- [ ] Layout adapts to desktop, tablet, and mobile screen sizes
- [ ] Sidebar collapses to hamburger menu on mobile
- [ ] Kanban columns stack vertically on small screens
- [ ] All features remain accessible on mobile
- [ ] Touch interactions work (drag and drop or dropdown fallback)

**Expected Result:** App is usable across different devices and screen sizes.

---

## 7. Data & State

### US-7.1: Data Persistence
**As a** User
**I want to** have my data saved reliably
**So that** I don't lose my meeting notes or action-items

**Acceptance Criteria:**
- [ ] All meeting notes are saved to the database
- [ ] All action-items are saved to the database
- [ ] Changes persist across sessions
- [ ] Data is associated with the user's account
- [ ] Page refresh does not lose unsaved data (or user is warned)

**Expected Result:** User data is reliably persisted and retrieved.

---

### US-7.2: Loading States
**As a** User
**I want to** see loading indicators when data is being fetched
**So that** I know the app is working

**Acceptance Criteria:**
- [ ] Loading spinner/skeleton shown when fetching notes list
- [ ] Loading spinner/skeleton shown when fetching action board
- [ ] Loading indicator shown during AI extraction
- [ ] Loading indicator shown when saving/updating data

**Expected Result:** User sees visual feedback during async operations.

---

### US-7.3: Error Handling
**As a** User
**I want to** see clear error messages when something goes wrong
**So that** I understand what happened and what to do

**Acceptance Criteria:**
- [ ] Network errors show user-friendly message with retry option
- [ ] Validation errors show specific field-level feedback
- [ ] Server errors show generic message without technical details
- [ ] Errors don't crash the app (graceful degradation)

**Expected Result:** User is informed of errors in a helpful way.

---

## Summary

### Feature Coverage

| Feature Area | User Stories |
|--------------|--------------|
| Authentication | US-1.1, US-1.2, US-1.3 |
| Meeting Notes Inbox | US-2.1, US-2.2, US-2.3, US-2.4, US-2.5 |
| Extract Action-Items | US-3.1, US-3.2, US-3.3, US-3.4 |
| Action Board (Kanban) | US-4.1 through US-4.9 |
| Share Board | US-5.1 through US-5.6 |
| Navigation & Layout | US-6.1, US-6.2 |
| Data & State | US-7.1, US-7.2, US-7.3 |

**Total User Stories:** 29

### MVP Success Criteria (from Product Spec)

- [ ] User can create a meeting note and extract at least 1 action-item
- [ ] User can move action-items across To Do / Doing / Done
- [ ] Public link shows the board but cannot edit
- [ ] Revoking a link invalidates the old URL immediately
