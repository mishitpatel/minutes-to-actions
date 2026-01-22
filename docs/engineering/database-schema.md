# Database Schema — Minutes to Actions

> **Database:** PostgreSQL
> **Last Updated:** 2026-01-19
> **Phase:** 1 (MVP)
>
> This is a living reference document for the database entity structure.
> Actual migrations are managed in the `migrations/` folder.

## Overview

This document defines the database schema for Minutes to Actions, supporting:
- User authentication (Google OAuth)
- Meeting notes management
- Action-items with Kanban board
- Public board sharing

---

## Entity Relationship Diagram

```
┌─────────────┐  1      N  ┌──────────────────┐  1      N  ┌──────────────────┐
│   users     │────────────│  meeting_notes   │────────────│  action_items    │
└─────────────┘            └──────────────────┘            └──────────────────┘
      │ 1                                                         │ N
      │                                                           │
      │ N                                                         │
┌─────────────┐                                                   │
│  sessions   │                                                   │
└─────────────┘                                                   │
      │                                                           │
      │ 1                         1                               │
      └─────────────────┬─────────────────────────────────────────┘
                        │
                 ┌──────────────┐
                 │ board_shares │  (1:1 with users)
                 └──────────────┘
```

### Relationship Summary

| Relationship | Type | Description |
|--------------|------|-------------|
| users → meeting_notes | 1:N | One user has many meeting notes |
| users → action_items | 1:N | One user has many action items |
| users → sessions | 1:N | One user has many sessions |
| users → board_shares | 1:1 | One user has one board share config |
| meeting_notes → action_items | 1:N | One note can have many action items (nullable) |

---

## DBML Schema

```dbml
// ===========================================
// Minutes to Actions - Database Schema (MVP)
// ===========================================

// -----------------------
// Enums
// -----------------------

Enum priority {
  high
  medium
  low
}

Enum status {
  todo
  doing
  done
}

// -----------------------
// Tables
// -----------------------

Table users {
  id uuid [pk, default: `gen_random_uuid()`]
  email varchar(255) [unique, not null]
  name varchar(255) [not null]
  avatar_url text
  google_id varchar(255) [unique, not null]
  created_at timestamptz [not null, default: `now()`]
  updated_at timestamptz [not null, default: `now()`]

  indexes {
    email [unique]
    google_id [unique]
  }

  Note: 'Stores user accounts authenticated via Google OAuth'
}

Table meeting_notes {
  id uuid [pk, default: `gen_random_uuid()`]
  user_id uuid [not null, ref: > users.id]
  title varchar(500)
  body text [not null]
  created_at timestamptz [not null, default: `now()`]
  updated_at timestamptz [not null, default: `now()`]

  indexes {
    user_id
    (user_id, created_at) [name: 'idx_meeting_notes_user_created']
  }

  Note: 'Stores meeting notes. Title is optional, body is required.'
}

Table action_items {
  id uuid [pk, default: `gen_random_uuid()`]
  user_id uuid [not null, ref: > users.id]
  meeting_note_id uuid [ref: > meeting_notes.id]
  title varchar(500) [not null]
  description text
  priority priority [not null, default: 'medium']
  status status [not null, default: 'todo']
  due_date date
  position integer [not null, default: 0]
  created_at timestamptz [not null, default: `now()`]
  updated_at timestamptz [not null, default: `now()`]

  indexes {
    user_id
    meeting_note_id
    (user_id, status) [name: 'idx_action_items_user_status']
    (user_id, status, position) [name: 'idx_action_items_board_order']
  }

  Note: 'Stores action items. meeting_note_id is null for manually created items.'
}

Table board_shares {
  id uuid [pk, default: `gen_random_uuid()`]
  user_id uuid [unique, not null, ref: > users.id]
  share_token varchar(64) [unique, not null]
  is_enabled boolean [not null, default: false]
  created_at timestamptz [not null, default: `now()`]
  updated_at timestamptz [not null, default: `now()`]

  indexes {
    user_id [unique]
    share_token [unique]
  }

  Note: 'Stores board sharing configuration. One share config per user (single board).'
}

Table sessions {
  id uuid [pk, default: `gen_random_uuid()`]
  user_id uuid [not null, ref: > users.id]
  token_hash varchar(255) [unique, not null]
  expires_at timestamptz [not null]
  created_at timestamptz [not null, default: `now()`]

  indexes {
    user_id
    token_hash [unique]
    expires_at
  }

  Note: 'Stores user sessions for authentication persistence.'
}

// -----------------------
// Relationships
// -----------------------
// DBML syntax: > many-to-one, < one-to-many, - one-to-one

// One user has many meeting notes (1:N)
Ref: meeting_notes.user_id > users.id [delete: cascade]

// One user has many action items (1:N)
Ref: action_items.user_id > users.id [delete: cascade]

// One meeting note has many action items (1:N, nullable FK)
Ref: action_items.meeting_note_id > meeting_notes.id [delete: set null]

// One user has one board share config (1:1, enforced by unique constraint)
Ref: board_shares.user_id - users.id [delete: cascade]

// One user has many sessions (1:N)
Ref: sessions.user_id > users.id [delete: cascade]
```

---

## Table Details

### users

Stores authenticated user accounts (Google OAuth only for MVP).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User's email from Google |
| name | VARCHAR(255) | NOT NULL | User's display name from Google |
| avatar_url | TEXT | NULLABLE | Profile photo URL from Google |
| google_id | VARCHAR(255) | UNIQUE, NOT NULL | Google's unique user ID |
| created_at | TIMESTAMPTZ | NOT NULL | Account creation time |
| updated_at | TIMESTAMPTZ | NOT NULL | Last update time |

### meeting_notes

Stores meeting notes created by users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | FK → users, NOT NULL | Owner of the note |
| title | VARCHAR(500) | NULLABLE | Optional note title |
| body | TEXT | NOT NULL | Note content (required) |
| created_at | TIMESTAMPTZ | NOT NULL | Creation time |
| updated_at | TIMESTAMPTZ | NOT NULL | Last update time |

**Behavior on user deletion:** CASCADE (notes deleted with user)

### action_items

Stores action items on the Kanban board.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | FK → users, NOT NULL | Owner of the action item |
| meeting_note_id | UUID | FK → meeting_notes, NULLABLE | Source note (null if manual) |
| title | VARCHAR(500) | NOT NULL | Action item title |
| description | TEXT | NULLABLE | Detailed description |
| priority | ENUM | NOT NULL, DEFAULT 'medium' | high / medium / low |
| status | ENUM | NOT NULL, DEFAULT 'todo' | todo / doing / done |
| due_date | DATE | NULLABLE | Optional due date |
| position | INTEGER | NOT NULL, DEFAULT 0 | Order within column |
| created_at | TIMESTAMPTZ | NOT NULL | Creation time |
| updated_at | TIMESTAMPTZ | NOT NULL | Last update time |

**Behavior on user deletion:** CASCADE (action items deleted with user)
**Behavior on note deletion:** SET NULL (action items become orphaned but preserved)

### board_shares

Stores board sharing configuration. One record per user (single board per user in MVP).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | FK → users, UNIQUE, NOT NULL | Board owner |
| share_token | VARCHAR(64) | UNIQUE, NOT NULL | Public URL token |
| is_enabled | BOOLEAN | NOT NULL, DEFAULT FALSE | Sharing enabled flag |
| created_at | TIMESTAMPTZ | NOT NULL | Creation time |
| updated_at | TIMESTAMPTZ | NOT NULL | Last update time |

**Behavior on user deletion:** CASCADE (share config deleted with user)

### sessions

Stores user authentication sessions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | FK → users, NOT NULL | Session owner |
| token_hash | VARCHAR(255) | UNIQUE, NOT NULL | Hashed session token |
| expires_at | TIMESTAMPTZ | NOT NULL | Session expiration |
| created_at | TIMESTAMPTZ | NOT NULL | Session creation time |

**Behavior on user deletion:** CASCADE (sessions deleted with user)

---

## Indexes

### Performance Indexes

| Table | Index | Columns | Purpose |
|-------|-------|---------|---------|
| meeting_notes | idx_meeting_notes_user_id | user_id | Filter notes by user |
| meeting_notes | idx_meeting_notes_user_created | user_id, created_at DESC | List notes sorted by date |
| action_items | idx_action_items_user_id | user_id | Filter items by user |
| action_items | idx_action_items_meeting_note_id | meeting_note_id | Find items by source note |
| action_items | idx_action_items_user_status | user_id, status | Filter by user and column |
| action_items | idx_action_items_board_order | user_id, status, position | Board display ordering |
| sessions | idx_sessions_user_id | user_id | Find user sessions |
| sessions | idx_sessions_expires_at | expires_at | Clean up expired sessions |

### Unique Indexes

| Table | Index | Columns | Purpose |
|-------|-------|---------|---------|
| users | users_email_unique | email | Prevent duplicate emails |
| users | users_google_id_unique | google_id | Prevent duplicate Google accounts |
| board_shares | board_shares_user_id_unique | user_id | One share config per user |
| board_shares | board_shares_token_unique | share_token | Unique public URLs |
| sessions | sessions_token_hash_unique | token_hash | Unique session tokens |

---

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| UUID primary keys | Secure, non-guessable IDs; works well with distributed systems |
| `position` column for ordering | Enables drag-and-drop reordering within Kanban columns |
| `meeting_note_id` nullable | Supports both extracted and manually created action items |
| ON DELETE SET NULL for notes→items | Preserves action items when source note is deleted (per US-2.5) |
| ON DELETE CASCADE for user relations | Clean deletion of all user data |
| `share_token` as VARCHAR(64) | Allows secure random tokens (e.g., 32 bytes hex-encoded) |
| Single `board_shares` per user | MVP supports single board per user |
| Separate `sessions` table | Flexible session management, easy cleanup of expired sessions |
| TIMESTAMPTZ for timestamps | Timezone-aware timestamps for global users |
| Auto-updated `updated_at` | All mutable tables track last modification time |

---

## Future Considerations (Phase 2+)

When extending beyond MVP, consider:

1. **Multiple boards per user**: Remove UNIQUE constraint on `board_shares.user_id`, add `boards` table
2. **Tags**: Add `tags` table and `meeting_note_tags` / `action_item_tags` junction tables
3. **Team collaboration**: Add `teams`, `team_members`, `team_boards` tables
4. **Comments**: Add `comments` table linked to action items
5. **Activity log**: Add `activity_log` table for audit history
6. **Soft deletes**: Add `deleted_at` column for recoverable deletion
