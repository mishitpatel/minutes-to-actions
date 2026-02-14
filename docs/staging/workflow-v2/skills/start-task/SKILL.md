---
name: start-task
description: Task onboarding — reads GitHub issue, finds user story, builds definition of done with acceptance criteria. Use at the beginning of every task.
allowed-tools: Bash(gh:*), Read, Glob, Grep
argument-hint: "#XX [--bug]"
disable-model-invocation: true
---

# Start Task

Read the issue, find user stories, and build a definition of done.

## Gathered Context

### GitHub Issue
!`gh issue view $ARGUMENTS 2>/dev/null | head -80 || echo "Usage: /start-task #XX"`

## Arguments

User arguments: $ARGUMENTS

Parse arguments:
- First arg should be an issue number (e.g., `#42` or `42`)
- `--bug` flag triggers root cause investigation mode

## Workflow

### Step 1: Read the GitHub Issue

From the gathered context above, extract:
- Title and description
- Referenced user stories (look for "US-X.X" patterns)
- Subtask checklist (if any)
- Labels (frontend, backend, bug, etc.)

### Step 2: Find User Stories

Read `docs/product/user-stories-phase1.md` and find all referenced user stories (US-X.X).

For each user story, extract:
- **As a** / **I want** / **So that**
- **Acceptance criteria** (numbered list)

### Step 3: Identify Layers

Based on the issue and user stories, determine which layers are touched:

| Layer | Signal | Action |
|-------|--------|--------|
| Frontend | UI changes, components, pages | Read `docs/guidelines/frontend-rules.md` |
| Backend | API endpoints, database, services | Read `docs/guidelines/backend-rules.md` |
| Both | Full-stack feature | Read both |

### Step 4: Build Definition of Done

Create a checklist combining:
1. All acceptance criteria from user stories
2. Relevant conventions from the guidelines read in Step 3
3. Subtasks from the GitHub issue

Output format:

```
## Task: [Issue Title] (#XX)

### User Story
**US-X.X**: As a [role], I want [goal], so that [benefit]

### Acceptance Criteria
- [ ] AC-1: [criteria]
- [ ] AC-2: [criteria]
...

### Layers Touched
- [x] Frontend / [ ] Backend (or both)

### Key Rules (from guidelines)
- [2-3 most relevant rules for this specific task]

### Ready to implement?
```

### Step 5 (Bug mode): Root Cause Investigation

If `--bug` flag is used, after reading the issue:
1. Use Explore agent to find the relevant source files
2. Identify the likely root cause
3. Propose a fix approach
4. Add "regression test" to the definition of done

## User Story Quick Reference

| Milestone | User Stories |
|-----------|-------------|
| M1: Auth | US-1.1, US-1.2, US-1.3 |
| M2: Meeting Notes | US-2.1 through US-2.5 |
| M3: Action Board | US-4.1 through US-4.9 |
| M4: AI Extraction | US-3.1, US-3.2, US-3.3 |
| M5: Sharing | US-5.1 through US-5.6 |
| M6: Polish | US-6.1, US-6.2, US-7.1, US-7.2, US-7.3 |
| M7: AI Sample Generation | US-3.4 |

## Session Continuity

After building the definition of done, also read `docs/project/project-status.md` to understand:
- Current project position
- Recent decisions that may affect this task
- Any blockers
