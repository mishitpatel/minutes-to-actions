---
name: ship
description: Full shipping workflow — runs verification, commits with conventional format, creates PR with test plan, and updates changelog.
allowed-tools: Bash(git:*), Bash(gh:*), Read, Edit, Write, Glob, Grep
argument-hint: "[--no-pr]"
disable-model-invocation: true
---

# Ship

Commit, PR, and changelog workflow — runs verification first.

## Gathered Context

### Current Branch
!`git branch --show-current`

### Working Tree Status
!`git status --short`

### Staged Changes
!`git diff --cached --stat`

### Unstaged Changes
!`git diff --stat`

### Recent Commits (style reference)
!`git log --oneline -5`

### Existing PR
!`gh pr view --json number,title,url,state 2>/dev/null || echo "No existing PR"`

## Arguments

User arguments: $ARGUMENTS

- `--no-pr` — Skip PR creation (commit and push only)

## Workflow

### Step 1: Run Verification

Run typecheck and build first. If any check fails, stop and fix before shipping.

```bash
pnpm --filter web typecheck 2>&1
pnpm --filter web build 2>&1
```

If verification fails, report errors and STOP.

### Step 2: Stage and Commit

1. Review changes from gathered context
2. Stage relevant files (avoid `.env`, credentials, large binaries)
3. Show the commit message to the user for approval
4. Create commit with conventional format:

```
<type>(<scope>): <description> (#XX)

- [bullet point of key change]
- [bullet point of key change]

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

Prefix rules:
| Change Type | Prefix |
|-------------|--------|
| New feature | `feat:` |
| Bug fix | `fix:` |
| Documentation | `docs:` |
| Refactoring | `refactor:` |
| Tests | `test:` |
| Build/CI | `chore:` |

### Step 3: Create PR (skip with `--no-pr`)

1. Push branch to remote: `git push -u origin [branch-name]`
2. Create PR using `gh pr create`:

```
## Summary
- [1-3 bullet points of what changed]

## User Story
Closes #XX
Acceptance criteria:
- [x] AC-1
- [x] AC-2

## Test Plan
- [ ] TypeScript compiles clean
- [ ] Build succeeds
- [ ] API tests pass
- [ ] Manual verification of [specific thing]

---
Generated with [Claude Code](https://claude.com/claude-code)
```

### Step 4: Update Changelog

Add entry to `docs/project/changelog.md` with:
- Date
- What changed (user-facing summary)
- Issue/PR reference

## Safety Rules

- NEVER force push
- NEVER skip pre-commit hooks
- NEVER commit to main/master directly
- ALWAYS run verification before committing
- ALWAYS show commit message for user approval before creating it
- If pre-commit hook fails, fix and create a NEW commit (never amend)
