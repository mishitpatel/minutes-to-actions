# Test Pre-Flight Checklist

> Complete this checklist BEFORE writing any test code

## Purpose

This checklist ensures tests are derived from specifications, not assumptions. It prevents common errors like:
- Using wrong HTTP methods (PATCH vs PUT)
- Testing fields not in current phase scope
- Missing acceptance criteria coverage

---

## Pre-Flight Checklist

### 1. Feature Scope

**Check:** `docs/product/product-spec.md`

- [ ] Is this feature in Phase 1?
- [ ] Fields available in Phase 1: _______________________________________
- [ ] Fields NOT in Phase 1: ___________________________________________

**Phase 1 Action Item Fields Reference:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| title | string | Yes | |
| description | string | No | |
| priority | enum | No | low, medium, high |
| due_date | date | No | |
| status | enum | Yes | todo, doing, done |

**NOT in Phase 1:**
- assignee (Phase 3)
- File attachments
- Comments/threads

---

### 2. User Story Reference

**Check:** `docs/product/user-stories-phase1.md`

- [ ] User story ID: US-____
- [ ] User story title: ________________________________________________

**Acceptance Criteria:**
| # | Criterion | Test Case |
|---|-----------|-----------|
| AC1 | | |
| AC2 | | |
| AC3 | | |
| AC4 | | |
| AC5 | | |

---

### 3. API Contract

**Check:** `docs/engineering/api-spec.md`

- [ ] Endpoint: ________________________________________________________
- [ ] HTTP method: ____________________________________________________
- [ ] Authentication required: [ ] Yes  [ ] No

**Request Schema:**
| Field | Type | Required |
|-------|------|----------|
| | | |
| | | |
| | | |

**Response Schema:**
| Field | Type | Notes |
|-------|------|-------|
| | | |
| | | |
| | | |

**Error Codes:**
| Status | Code | When |
|--------|------|------|
| 400 | | |
| 401 | | |
| 404 | | |
| 422 | | |

---

### 4. Data Model

**Check:** `docs/engineering/database-schema.md`

- [ ] Table name: _____________________________________________________
- [ ] Columns match test data: [ ] Yes  [ ] No

**Column Reference:**
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| | | | |
| | | | |
| | | | |

---

## Quick Reference: HTTP Methods

| Operation | Correct Method | Common Mistake |
|-----------|---------------|----------------|
| Full resource update | PUT | Using PATCH |
| Partial update (single field) | PATCH | Using PUT |
| Create new resource | POST | |
| Delete resource | DELETE | |
| Retrieve resource | GET | |

---

## Verification

Before proceeding with test generation:

- [ ] All sections above are filled out
- [ ] HTTP methods match API spec exactly
- [ ] Only Phase 1 fields are used in tests
- [ ] Every acceptance criterion has a corresponding test case
- [ ] Test file header will include spec references

---

## Template: Test File Header

```typescript
/**
 * Tests for US-X.X: [User Story Title]
 *
 * Acceptance Criteria (from user-stories-phase1.md):
 * - AC1: [criterion]
 * - AC2: [criterion]
 * - AC3: [criterion]
 *
 * Phase 1 Scope (from product-spec.md):
 * - Fields: [list fields]
 * - NOT in Phase 1: [list excluded fields]
 *
 * API Contract (from api-spec.md):
 * - [METHOD] [endpoint]: [description]
 */
```
