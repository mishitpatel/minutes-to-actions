# API Specification — Minutes to Actions

> **Last Updated:** 2026-01-19
> **Base URL:** `http://localhost:3000` (development)
> **Phase:** 1 (MVP)
>
> For API design patterns and conventions, see `docs/guidelines/api_guidelines.md`.

## Overview

This document describes the actual API endpoints for Minutes to Actions.

**OpenAPI Specification:** Auto-generated from Zod schemas (no static YAML file)
**Interactive Docs (dev):** `http://localhost:3000/docs`

---

## Authentication

All endpoints except `/auth/*` and `/shared/:token` require authentication via session cookie.

---

## Endpoints Summary

### Auth Module

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/auth/google` | Initiate Google OAuth flow |
| GET | `/auth/google/callback` | Handle OAuth callback |
| GET | `/auth/me` | Get current authenticated user |
| POST | `/auth/logout` | End session and sign out |

### Meeting Notes Module

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/meeting-notes` | List all meeting notes |
| GET | `/meeting-notes/:id` | Get single meeting note with action-items |
| POST | `/meeting-notes` | Create new meeting note |
| PUT | `/meeting-notes/:id` | Update meeting note |
| DELETE | `/meeting-notes/:id` | Delete meeting note |
| POST | `/meeting-notes/:id/extract` | Extract action items using AI |

### Action Items Module

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/action-items` | List all action-items (grouped by status) |
| GET | `/action-items/:id` | Get single action-item |
| POST | `/action-items` | Create action-item (manual) |
| POST | `/action-items/bulk` | Create multiple action-items |
| PUT | `/action-items/:id` | Update action-item |
| PATCH | `/action-items/:id/status` | Update status only |
| PATCH | `/action-items/:id/position` | Update position only |
| DELETE | `/action-items/:id` | Delete action-item |

### Board Share Module

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/board-share` | Get current share config |
| POST | `/board-share/enable` | Enable sharing, generate token |
| POST | `/board-share/disable` | Disable sharing |
| POST | `/board-share/regenerate` | Regenerate share token |

### Public Board (No Auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/shared/:token` | Get public board data |

---

## Endpoint Details

### Auth

#### `GET /auth/google`
Redirects user to Google OAuth consent screen.

**Response:** 302 Redirect to Google

---

#### `GET /auth/google/callback`
Handles OAuth callback from Google.

**Query Parameters:**
- `code` - OAuth authorization code
- `state` - CSRF state token

**Response:** 302 Redirect to app (with session cookie set)

---

#### `GET /auth/me`
Returns current authenticated user.

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "avatar_url": "https://...",
    "created_at": "2026-01-19T10:00:00Z"
  }
}
```

**Response (401):** Unauthorized

---

#### `POST /auth/logout`
Ends current session.

**Response (204):** No content (session cookie cleared)

### Auth Behavior Notes
- OAuth flow: GET /auth/google → redirect → callback → set session cookie
- Session cookie: `session_token`, httpOnly, secure in prod, 30-day expiry
- Upsert on login: Match on googleId, update name/avatar if exists, create if new
- Test login: deterministic `test-user-{email}` googleId, blocked in production
- Logout: Deletes session from DB, clears cookie

---

### Meeting Notes

#### `GET /meeting-notes`
List all meeting notes for current user.

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20, max: 100)

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Weekly Sync",
      "body": "Meeting notes content...",
      "created_at": "2026-01-19T10:00:00Z",
      "updated_at": "2026-01-19T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total_items": 45,
    "total_pages": 3,
    "has_next_page": true,
    "has_prev_page": false
  }
}
```

---

### Action Item Schema

```json
{
  "id": "uuid",
  "title": "string",
  "assignee": "string | null",
  "due_date": "string (ISO 8601) | null",
  "status": "todo | in_progress | done"
}
```

---

#### `GET /meeting-notes/:id`
Get single meeting note with linked action-items.

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "title": "Weekly Sync",
    "body": "Meeting notes content...",
    "created_at": "2026-01-19T10:00:00Z",
    "updated_at": "2026-01-19T10:00:00Z",
    "action_items": [
      {
        "id": "uuid",
        "title": "Follow up with client",
        "status": "todo",
        "priority": "high"
      }
    ]
  }
}
```

**Response (404):** Not found

---

#### `POST /meeting-notes`
Create new meeting note.

**Request Body:**
```json
{
  "title": "Weekly Sync",        // optional
  "body": "Meeting notes..."     // required
}
```

**Response (201):**
```json
{
  "data": {
    "id": "uuid",
    "title": "Weekly Sync",
    "body": "Meeting notes...",
    "created_at": "2026-01-19T10:00:00Z",
    "updated_at": "2026-01-19T10:00:00Z"
  }
}
```

**Response (400):** Validation error

---

#### `PUT /meeting-notes/:id`
Update meeting note.

**Request Body:**
```json
{
  "title": "Updated Title",
  "body": "Updated content..."
}
```

**Response (200):** Updated note

**Response (404):** Not found

---

#### `DELETE /meeting-notes/:id`
Delete meeting note. Linked action-items become orphaned (not deleted).

**Response (204):** No content

**Response (404):** Not found

#### `POST /meeting-notes/:id/extract`
Extract action items from a meeting note using AI. Returns extracted items for review — does NOT save them.

**Response (200):**
```json
{
  "data": {
    "action_items": [
      {
        "title": "Update documentation",
        "priority": "high",
        "due_date": "2026-02-10",
        "description": "John to update by Friday"
      },
      {
        "title": "Review PR #123",
        "priority": "medium",
        "due_date": null,
        "description": null
      }
    ],
    "confidence": "high",
    "message": null
  }
}
```

**Response (200 - no items found):**
```json
{
  "data": {
    "action_items": [],
    "confidence": "high",
    "message": "No action items found in this meeting note."
  }
}
```

**Response (404):** Not found
**Response (429):** Rate limited (AI service temporarily unavailable)
**Response (500):** Extraction failed

---

### Meeting Notes Behavior Notes
- Title defaults to null if not provided
- Body required: must be non-empty string (min 1 char)
- Pagination defaults: page=1, limit=20 (max 100)
- Ordering: createdAt DESC (newest first)
- Delete cascade: Linked action items get meetingNoteId set to NULL
- Ownership: Returns 404 for both missing and other-user resources

---

### Action Items

#### `GET /action-items`
List all action-items for current user.

**Query Parameters:**
- `status` - Filter by status (todo, doing, done)
- `grouped` - If true, group by status (default: true)

**Response (200 - grouped):**
```json
{
  "data": {
    "todo": [
      {
        "id": "uuid",
        "title": "Task 1",
        "description": null,
        "priority": "high",
        "status": "todo",
        "due_date": "2026-01-25",
        "position": 0,
        "meeting_note_id": "uuid",
        "created_at": "2026-01-19T10:00:00Z"
      }
    ],
    "doing": [],
    "done": []
  }
}
```

---

#### `GET /action-items/:id`
Get single action-item with source note info.

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "title": "Follow up with client",
    "description": "Detailed description...",
    "priority": "high",
    "status": "todo",
    "due_date": "2026-01-25",
    "position": 0,
    "meeting_note_id": "uuid",
    "meeting_note": {
      "id": "uuid",
      "title": "Weekly Sync"
    },
    "created_at": "2026-01-19T10:00:00Z",
    "updated_at": "2026-01-19T10:00:00Z"
  }
}
```

---

#### `POST /action-items`
Create single action-item (manual).

**Request Body:**
```json
{
  "title": "New task",                // required
  "description": "Details...",        // optional
  "priority": "medium",               // optional, default: medium
  "status": "todo",                   // optional, default: todo
  "due_date": "2026-01-25"            // optional
}
```

**Response (201):** Created action-item

---

#### `POST /action-items/bulk`
Create multiple action-items (from extraction).

**Request Body:**
```json
{
  "meeting_note_id": "uuid",
  "items": [
    {
      "title": "Task 1",
      "priority": "high",
      "due_date": "2026-01-25"
    },
    {
      "title": "Task 2",
      "priority": "medium"
    }
  ]
}
```

**Response (201):**
```json
{
  "data": {
    "created_count": 2,
    "items": [...]
  }
}
```

---

#### `PUT /action-items/:id`
Update action-item.

**Request Body:**
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "priority": "low",
  "status": "doing",
  "due_date": "2026-02-01"
}
```

**Response (200):** Updated action-item

---

#### `PATCH /action-items/:id/status`
Update status only (for drag-drop).

**Request Body:**
```json
{
  "status": "doing"
}
```

**Response (200):** Updated action-item

---

#### `PATCH /action-items/:id/position`
Update position within column (for reordering).

**Request Body:**
```json
{
  "position": 2
}
```

**Response (200):** Updated action-item

---

#### `DELETE /action-items/:id`
Delete action-item.

**Response (204):** No content

### Action Items Behavior Notes
- Status defaults to 'todo', priority defaults to 'medium'
- Position auto-calc: max(position in same status) + 1
- Status change auto-repositions to end of new status column
- Grouped response: Default when grouped=true AND no status filter
- Meeting note linking: Verifies note exists and belongs to user
- UUID validation: :id params must be valid UUIDs
- PUT is partial: All fields optional in update body
- Ordering: status ASC → position ASC → createdAt DESC

---

### Board Share

#### `GET /board-share`
Get current user's share configuration.

**Response (200):**
```json
{
  "data": {
    "is_enabled": true,
    "share_token": "abc123...",
    "share_url": "https://app.example.com/shared/abc123..."
  }
}
```

**Response (200 - not configured):**
```json
{
  "data": {
    "is_enabled": false,
    "share_token": null,
    "share_url": null
  }
}
```

---

#### `POST /board-share/enable`
Enable sharing and generate token.

**Response (200):**
```json
{
  "data": {
    "is_enabled": true,
    "share_token": "abc123...",
    "share_url": "https://app.example.com/shared/abc123..."
  }
}
```

---

#### `POST /board-share/disable`
Disable sharing (revokes current token).

**Response (200):**
```json
{
  "data": {
    "is_enabled": false,
    "share_token": null,
    "share_url": null
  }
}
```

---

#### `POST /board-share/regenerate`
Regenerate share token (invalidates old link).

**Response (200):**
```json
{
  "data": {
    "is_enabled": true,
    "share_token": "new-token...",
    "share_url": "https://app.example.com/shared/new-token..."
  }
}
```

---

### Public Board

#### `GET /shared/:token`
Get public board data (no authentication required).

**Response (200):**
```json
{
  "data": {
    "todo": [
      {
        "id": "uuid",
        "title": "Task 1",
        "priority": "high",
        "due_date": "2026-01-25"
      }
    ],
    "doing": [],
    "done": []
  }
}
```

**Response (404):**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "This board is no longer shared or the link is invalid."
  }
}
```

---

## Error Responses

### Application Errors (401, 403, 404, 409, 500)

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": []  // optional, for validation errors
  }
}
```

### Validation Errors (400)

Fastify+Zod validation errors return this format:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "body/fieldName Required"
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `BAD_REQUEST` | 400 | Validation errors, invalid request data |
| `UNAUTHORIZED` | 401 | Not authenticated |
| `FORBIDDEN` | 403 | Not authorized |
| `NOT_FOUND` | 404 | Resource not found |
| `EXTRACTION_FAILED` | 500 | AI extraction failed |
| `RATE_LIMITED` | 429 | AI service rate limit exceeded |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Related Documents

- API Design Patterns: `docs/guidelines/api_guidelines.md`
- Database Schema: `docs/engineering/database-schema.md`
- Architecture: `docs/engineering/architecture.md`
- User Stories: `docs/product/user-stories-phase1.md`
