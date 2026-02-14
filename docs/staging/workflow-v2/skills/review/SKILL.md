---
name: review
description: Quick code review of staged or recent changes. Spawns code-reviewer agent for quality, convention, and security analysis.
allowed-tools: Bash, Read, Glob, Grep
argument-hint: "[HEAD~N | path/to/file]"
disable-model-invocation: true
---

# Review

Quick code review of staged or recent changes.

## Gathered Context

### Staged Changes
!`git diff --staged --stat 2>/dev/null || echo "Nothing staged"`

### Recent Commits
!`git log --oneline -5`

## Arguments

User arguments: $ARGUMENTS

- No args — review staged changes (`git diff --staged`)
- Commit ref (e.g., `HEAD~3`) — review changes since that ref
- File path — review specific file

## Workflow

### Step 1: Determine Scope

Based on arguments:
- **No args**: Get staged diff with `git diff --staged`
- **Commit ref**: Get diff with `git diff [ref]`
- **File path**: Read the specific file

### Step 2: Review

Apply the code review checklist:

#### Correctness
- Logic handles edge cases (null, empty, boundary)
- Async operations use proper error handling

#### Project Conventions
- Data fields use `snake_case` (DB to API to frontend)
- Components follow file structure order
- `cn()` for class merging
- `data-testid` on component root elements
- Zod schemas as single source of truth
- Route handlers have full schema blocks
- Custom errors in handlers, not routes

#### Security
- No hardcoded secrets
- Input validation on external data
- Other user's resources return 404 (not 403)

#### Performance
- No N+1 queries
- TanStack Query for server state

### Step 3: Present Findings

Organize by severity:
- **CRITICAL** — Must fix before commit
- **WARNING** — Should fix
- **SUGGESTION** — Consider for next iteration
- **GOOD PATTERNS** — Reinforce

For each issue: explain WHY + provide a specific fix.

### Step 4: Offer Fixes

If critical issues found, offer to fix them automatically.
