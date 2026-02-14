# Workflow Optimization v2: Verification Loops & Autonomous Agents

> Created: 2026-02-08
> Builds on: `workflow-optimization-implementation.md` (v1 — 3-layer architecture)
> Inspired by: [CloudAI-X/claude-workflow-v2](https://github.com/CloudAI-X/claude-workflow-v2), Boris Cherny's verification loop philosophy
> Purpose: Add autonomous verification, feedback loops, and multi-agent quality gates on top of the v1 information architecture.

---

## Table of Contents

1. [What v1 Solved vs What v2 Adds](#what-v1-solved-vs-what-v2-adds)
2. [Boris's Verification Loop Philosophy](#boriss-verification-loop-philosophy)
3. [Architecture Overview](#architecture-overview)
4. [LAYER 4: Subagents](#layer-4-subagents)
   - [build-validator](#subagent-build-validator)
   - [code-reviewer](#subagent-code-reviewer)
   - [code-simplifier](#subagent-code-simplifier)
   - [verify-app](#subagent-verify-app)
5. [Enhanced Skills](#enhanced-skills)
   - [/verify-changes (replaces /verify)](#skill-verify-changes)
   - [/security-scan (new)](#skill-security-scan)
   - [/review (new)](#skill-review)
6. [Enhanced Hooks](#enhanced-hooks)
7. [Updated CLAUDE.md Workflow](#updated-claudemd-workflow)
8. [Updated MEMORY.md](#updated-memorymd)
9. [Implementation Checklist](#implementation-checklist)
10. [Migration from v1](#migration-from-v1)

---

## What v1 Solved vs What v2 Adds

| Dimension | v1 (Information Architecture) | v2 (Verification Loops) |
|-----------|------------------------------|------------------------|
| Problem | Claude ignores 6,000+ lines of guidelines | Claude operates blind — no feedback on output |
| Solution | 3-layer hierarchy: CLAUDE.md → Skills → Guidelines | Subagents that verify Claude's work autonomously |
| Metric | 6,446 → 1,455 lines (77% reduction) | 0 → 4 subagents, 3 new skills, 6 hooks |
| Philosophy | "Tell Claude what matters" | "Give Claude a way to see its output" |
| Quality impact | Claude reads the right rules | Claude iterates until the output is correct (2-3x quality) |

**v2 does NOT replace v1.** It adds Layer 4 (subagents) and enhances Layer 2 (skills) and Layer 0 (hooks). The 3-layer information architecture from v1 remains the foundation.

---

## Boris's Verification Loop Philosophy

> "Give Claude a way to verify its work. If Claude has that feedback loop, it will 2-3x the quality of the final result."
> — Boris Cherny, creator of Claude Code

### The Core Principle

```
Give Claude a tool to see the output
  + Tell Claude about the tool
  = Claude figures out the rest
```

### Why It Works

Without feedback, Claude operates blind:
```
Write code → Hope it works → Ship
```

With verification loops:
```
Write code → Verify it works → Fix issues → Re-verify → Ship (when green)
```

### Boris's Actual Setup

He uses subagents in `.claude/agents/`:
- `build-validator.md` — Ensures builds pass
- `code-architect.md` — Architecture reviews
- `code-simplifier.md` — Cleans up code after implementation
- `verify-app.md` — End-to-end verification (opens browser, tests UI, iterates)

### CloudAI-X's Enhancement: Adversarial Review

CloudAI-X's `verify-changes` adds a third phase after parallel verification:

```
Phase 1: Gather context (git diff, changed files)
Phase 2: Parallel verification (5 subagents in parallel)
Phase 3: Adversarial review (3 reviewers challenge Phase 2 findings)
Phase 4: Synthesized report (confirmed issues only)
```

The adversarial review eliminates false positives and catches issues that individual verifiers miss. This is the pattern we'll adapt.

---

## Architecture Overview

```
Layer 0: Hooks (automated)           → Run on every edit/commit. Zero friction.
Layer 1: CLAUDE.md (~60 lines)       → Always loaded. The constitution.
Layer 2: Skills (~100-200 lines)     → Loaded on-demand via /skill-name.
Layer 3: Reference docs (~200 lines) → Read when skills point to them.
Layer 4: Subagents (~50-100 lines)   → Autonomous specialists. Spawned by skills or directly.
```

### After v2 optimization:

| Layer | Files | Total Lines | Trigger |
|-------|-------|-------------|---------|
| 0: Hooks | 1 config + 3 scripts | ~100 | Automatic (every edit, commit, session) |
| 1: CLAUDE.md | 1 | ~60 | Always loaded |
| 2: Skills | 10 | ~1,200 | On-demand (`/skill-name`) |
| 3: Reference docs | 3 | ~500 | Read by skills |
| 4: Subagents | 4 | ~300 | Spawned by `/verify-changes`, `/review`, or directly |
| **TOTAL** | **22** | **~2,160** | |

### How the layers interact:

```
Developer runs /start-task #42
  └── Skill reads issue, user stories, builds definition of done

Developer implements the feature
  └── Hooks run typecheck after every edit (Layer 0)
  └── Claude reads frontend-rules.md / backend-rules.md as needed (Layer 3)

Developer runs /verify-changes
  └── Skill spawns 4 subagents in parallel (Layer 4):
      ├── build-validator   → typecheck + build
      ├── code-reviewer     → quality + patterns
      ├── verify-app        → tests + runtime verification
      └── (optional) security-scan
  └── Skill synthesizes results into pass/fail report
  └── If FAIL: Claude fixes issues and re-runs failed checks
  └── If PASS: Ready to ship

Developer runs /ship
  └── Skill commits, pushes, creates PR with verification report
```

---

## LAYER 4: Subagents

Subagents live in `.claude/agents/` and are autonomous specialists. They can be spawned by skills (e.g., `/verify-changes`) or directly by name.

### Subagent: `build-validator`

**File:** `.claude/agents/build-validator.md`

```markdown
---
name: build-validator
description: Validates TypeScript compilation and production build. Use PROACTIVELY after code changes to catch build failures early.
tools: Bash, Read, Glob
model: sonnet
---

# Build Validator

You are validating that the project compiles and builds correctly.

## Steps

### 1. TypeScript Check

```bash
pnpm --filter web typecheck 2>&1
```

Parse output for:
- Error count
- File:line locations
- Error messages

### 2. Production Build

Only if TypeScript passes:

```bash
pnpm --filter web build 2>&1
```

Parse output for:
- Build success/failure
- Bundle size warnings
- Missing imports or modules

### 3. API Build Check (if backend changed)

```bash
cd apps/api && npx tsc --noEmit 2>&1
```

## Output Format

```
## Build Validation: [PASS/FAIL]

| Check | Status | Details |
|-------|--------|---------|
| TypeScript (web) | ✅/❌ | [error count or "clean"] |
| Production Build | ✅/❌ | [error details] |
| TypeScript (api) | ✅/❌/⏭️ | [error count or "skipped"] |

### Errors (if any)
1. `file:line` — [error message]
   **Fix:** [suggested fix]
```

## Self-Healing Loop

If build fails:
1. Report the exact errors with file:line locations
2. Attempt to fix each error
3. Re-run the failed check
4. Repeat until green OR max 3 attempts
5. Report final status
```

---

### Subagent: `code-reviewer`

**File:** `.claude/agents/code-reviewer.md`

```markdown
---
name: code-reviewer
description: Expert code review specialist. Use PROACTIVELY after writing or modifying code, before commits. Focuses on quality, security, performance, and project conventions.
tools: Read, Grep, Glob, Bash
model: sonnet
---

# Code Reviewer

You are a senior code reviewer for the Minutes to Actions project (React + Fastify + Prisma).

## Review Process

### 1. Gather Context

```bash
git diff --staged 2>/dev/null || git diff HEAD
git log -3 --oneline
```

Read all modified files completely. Understand the intent.

### 2. Apply Review Checklist

#### Correctness
- [ ] Logic handles edge cases (null, empty, boundary)
- [ ] Async operations use proper error handling
- [ ] No off-by-one errors

#### Project Conventions
- [ ] Data fields use `snake_case` (DB → API → frontend)
- [ ] Components follow file structure order (imports → types → component → hooks → derived → callbacks → effects → early returns → render)
- [ ] `cn()` for class merging, never string concatenation
- [ ] `data-testid` on component root elements
- [ ] Zod schemas are single source of truth (no separate type files)
- [ ] Route handlers have full schema blocks with all status codes
- [ ] Custom errors thrown in handlers, not routes
- [ ] Prisma queries use `select` or `include`

#### Security
- [ ] No hardcoded secrets or credentials
- [ ] Input validation on all external data
- [ ] Other user's resources return 404 (not 403)
- [ ] No `console.log` in API code (use `request.log`)

#### Performance
- [ ] No N+1 queries
- [ ] TanStack Query for server state (not manual fetch)
- [ ] Proper query invalidation after mutations

### 3. Output

Organize findings by severity:

**🔴 Critical (Must Fix):** Bugs, security issues, data loss risk
**🟡 Warning (Should Fix):** Convention violations, potential problems
**🔵 Suggestion (Consider):** Readability, performance improvements
**✅ Good Patterns:** Worth highlighting

For each issue: explain WHY it's a problem + provide a specific fix.
```

---

### Subagent: `code-simplifier`

**File:** `.claude/agents/code-simplifier.md`

```markdown
---
name: code-simplifier
description: Simplifies and cleans up code after implementation. Focuses on recently modified files. Use after feature completion, before shipping.
tools: Read, Edit, Glob, Grep, Bash
model: sonnet
---

# Code Simplifier

You simplify code for clarity, consistency, and maintainability while preserving ALL functionality.

## Philosophy

- Simpler is better. Less code = fewer bugs.
- NEVER change behavior. Every simplification must be behavior-preserving.
- Run tests after every change.

## Process

### 1. Identify Recent Changes

```bash
git diff --name-only HEAD~3
git diff --stat HEAD~3
```

Focus on files modified in the last few commits. Do NOT touch unrelated code.

### 2. Look for Simplification Patterns

| Pattern | Example | Fix |
|---------|---------|-----|
| Duplicate logic | Same null check in 3 places | Extract helper (only if 3+ uses) |
| Over-engineering | Abstraction used once | Inline it |
| Dead code | Unused imports, variables, functions | Remove |
| Complex conditionals | Nested ternaries, 4+ conditions | Simplify or extract |
| Unnecessary wrappers | `useCallback` on stable functions | Remove wrapper |
| Verbose patterns | Manual array building | Use `.map()`, `.filter()` |

### 3. Apply Changes

- One change at a time (atomic)
- Run tests after each change
- If tests fail, revert the change immediately

### 4. Report

```
## Simplification Report

### Files Analyzed: [count]
### Changes Made: [count]

| File | Change | Type | Lines Saved |
|------|--------|------|-------------|
| `path` | [description] | [dead-code/duplication/...] | [N] |

### Tests: [PASS after all changes]
### Net Line Change: [before → after]
```

## Safety Rules

- NEVER alter external behavior or API contracts
- NEVER simplify test files (tests should be explicit)
- NEVER remove `data-testid` attributes
- Run `pnpm --filter web typecheck` after changes
- If unsure, don't simplify — clarity beats cleverness
```

---

### Subagent: `verify-app`

**File:** `.claude/agents/verify-app.md`

```markdown
---
name: verify-app
description: End-to-end application verification. Runs tests, checks runtime behavior, verifies API responses. Use after changes to verify the app actually works.
tools: Bash, Read, Grep, Glob
model: sonnet
---

# Verify App

You verify that the Minutes to Actions application works correctly end-to-end.

## Steps

### 1. Run API Tests

```bash
pnpm test:api 2>&1
```

Parse results for:
- Total tests, passed, failed
- Failure details with file:line

### 2. Check API Health (if dev server running)

```bash
curl -s http://localhost:3000/api/health 2>/dev/null
curl -s http://localhost:3000/docs 2>/dev/null | head -5
```

### 3. Check for Runtime Errors

```bash
# Look for common runtime issues in recent changes
git diff --name-only HEAD~1 | head -20
```

For each changed file, verify:
- Imports resolve correctly
- No circular dependencies
- Environment variables referenced are defined in `.env.example`

### 4. Run E2E Tests (if available and requested)

```bash
pnpm test:e2e 2>&1
```

### 5. Swagger Verification (if backend changed)

If any `*.routes.ts` files were modified:
- Verify endpoints appear in Swagger docs
- Check schema completeness (all status codes)

## Output Format

```
## App Verification: [PASS/FAIL]

| Check | Status | Details |
|-------|--------|---------|
| API Tests | ✅/❌ | [X passed, Y failed] |
| API Health | ✅/❌/⏭️ | [response or "server not running"] |
| Runtime Check | ✅/❌ | [issues found or "clean"] |
| E2E Tests | ✅/❌/⏭️ | [X passed, Y failed, or "skipped"] |
| Swagger | ✅/❌/⏭️ | [complete or "missing schemas"] |

### Failures (if any)
1. [Test/check name] — [error details]
   **Likely cause:** [analysis]
   **Suggested fix:** [fix]
```

## Self-Healing Loop

If tests fail:
1. Analyze failure (is it a code bug or test bug?)
2. Fix the CODE, not the test (unless the test is wrong)
3. Re-run failed tests only
4. Repeat until green OR max 3 attempts
5. Report final status with iteration count
```

---

## Enhanced Skills

### Skill: `/verify-changes`

**File:** `.claude/skills/verify-changes.md`
**Replaces:** `/verify` from v1

This is the crown jewel — a multi-agent verification skill inspired by CloudAI-X's adversarial review pattern and Boris's feedback loop philosophy.

```markdown
# Verify Changes

> Multi-agent verification with parallel execution and adversarial review.
> Replaces the sequential `/verify` skill from v1.

## Invocation

```
/verify-changes
/verify-changes --quick          (build-validator only)
/verify-changes --no-tests       (skip test execution)
/verify-changes --with-security  (add security scan)
```

## Philosophy

> "Give Claude a way to verify its work. If Claude has that feedback loop, it will 2-3x the quality of the final result." — Boris Cherny

## Workflow

### Phase 1: Context Gathering

```bash
git diff --name-only HEAD          # Changed files (unstaged)
git diff --cached --name-only      # Changed files (staged)
git log -5 --oneline               # Recent commits
```

Classify changes:
- Frontend only → spawn build-validator + code-reviewer
- Backend only → spawn build-validator + verify-app + code-reviewer
- Full-stack → spawn all agents
- `--with-security` → also spawn security scan

### Phase 2: Parallel Verification

**CRITICAL: Launch ALL subagents in a SINGLE message for true parallelism.**

Spawn these as parallel Task calls with `run_in_background: true`:

| Agent | What It Checks | Model |
|-------|---------------|-------|
| `build-validator` | TypeScript + production build | sonnet |
| `code-reviewer` | Quality, conventions, security, performance | sonnet |
| `verify-app` | API tests + runtime checks | sonnet |
| (optional) security-scan | Secrets, vulnerabilities, dangerous patterns | sonnet |

Each agent runs independently and produces a structured report.

### Phase 3: Adversarial Review

After all agents complete, synthesize their findings:

1. **False Positive Filter** — Are any reported issues actually fine for this project?
   - Example: "unused import" might be a type-only import needed for JSX
   - Example: "hardcoded string" might be a test fixture, not a secret

2. **Missing Issues Finder** — Did agents miss anything?
   - Cross-reference changed files against agent reports
   - Check if any modified files were NOT reviewed
   - Verify test coverage for new code paths

3. **Context Validator** — Do findings align with project conventions?
   - Check against `docs/guidelines/backend-rules.md` and `frontend-rules.md`
   - Dismiss issues that contradict project conventions

### Phase 4: Final Report

```
## Verification Report

### Summary: [✅ READY TO SHIP / ⚠️ REVIEW NEEDED / ❌ FIX REQUIRED]

### Results by Agent

| Agent | Status | Critical | Warnings | Info |
|-------|--------|----------|----------|------|
| Build Validator | ✅/❌ | 0 | 0 | 0 |
| Code Reviewer | ✅/⚠️ | 0 | 2 | 1 |
| App Verification | ✅/❌ | 0 | 0 | 0 |
| Security Scan | ✅/⚠️/⏭️ | 0 | 1 | 0 |

### Confirmed Issues (after adversarial review)

🔴 **Critical (must fix before shipping):**
1. [issue with file:line and fix]

🟡 **Warnings (should fix):**
1. [issue with file:line and fix]

🔵 **Info (consider):**
1. [observation]

### Dismissed (false positives filtered)
- [issue] — Reason: [why it's OK]

### Files Not Covered
- [any changed files that no agent reviewed]
```

### Phase 5: Self-Healing (if not READY TO SHIP)

If there are critical issues:
1. Fix each critical issue
2. Re-run ONLY the failed agent(s) — not the full pipeline
3. Repeat until all agents pass OR max 3 iterations
4. Report final status with iteration count

## Quick Mode (`--quick`)

Only runs `build-validator`. For rapid iteration during development:
```bash
pnpm --filter web typecheck && pnpm --filter web build
```

Reports pass/fail in <30 seconds.
```

---

### Skill: `/security-scan`

**File:** `.claude/skills/security-scan.md`

Adapted from CloudAI-X's security-scan for our specific stack.

```markdown
# Security Scan

> Security-focused code scan for Minutes to Actions (Fastify + React + Prisma).

## Invocation

```
/security-scan
/security-scan --deps-only   (dependency audit only)
```

## Workflow

### Phase 1: Secret Detection

Scan for hardcoded credentials in changed files:

```bash
git diff --name-only HEAD~5
```

For each changed file, check for:
- `password`, `secret`, `token`, `api_key` assignments with string literals
- AWS keys (`AKIA...`)
- Private keys (`.pem`, `.key` files)
- `.env` file committed to git

### Phase 2: Dependency Audit

```bash
cd apps/web && pnpm audit --json 2>/dev/null | head -100
cd apps/api && pnpm audit --json 2>/dev/null | head -100
```

Flag: Critical and High severity only (Medium/Low are informational).

### Phase 3: Code Pattern Analysis (Project-Specific)

| Vulnerability | What to Check | Where |
|--------------|---------------|-------|
| SQL Injection | Raw SQL in Prisma (`$queryRaw`, `$executeRaw`) | `apps/api/src/**/*.ts` |
| XSS | `dangerouslySetInnerHTML`, unescaped user input | `apps/web/src/**/*.tsx` |
| Auth bypass | Routes missing `app.authenticate` preHandler | `*.routes.ts` |
| Info leakage | 403 instead of 404 for other user's resources | `*.handler.ts` |
| Logging PII | `console.log` with user data, `request.log` with passwords | `apps/api/src/**/*.ts` |
| Missing validation | Route without Zod body/params schema | `*.routes.ts` |
| Broad Prisma select | Prisma queries without `select` or `include` | `*.handler.ts` |

### Phase 4: Configuration Check

- [ ] CORS configuration doesn't allow `*` in production
- [ ] Session cookies are `httpOnly` and `secure`
- [ ] Rate limiting is configured on auth endpoints
- [ ] Helmet headers are enabled

### Output Format

```
## Security Scan: [PASS / WARNINGS / FAIL]

### Secrets: [count]
### Vulnerable Dependencies: [critical/high count]
### Code Vulnerabilities: [count]
### Configuration Issues: [count]

### Details
[findings organized by severity]

### NEVER COMMIT IF:
- Secrets detected (rotate and remove first)
- Critical CVEs in dependencies
- Auth bypass vulnerabilities
```
```

---

### Skill: `/review`

**File:** `.claude/skills/review.md`

A lightweight code review skill that spawns the `code-reviewer` subagent.

```markdown
# Review

> Quick code review of staged or recent changes.

## Invocation

```
/review              (review staged changes)
/review HEAD~3       (review last 3 commits)
/review path/to/file (review specific file)
```

## Workflow

1. Determine scope:
   - No args → `git diff --staged`
   - Commit ref → `git diff [ref]`
   - File path → Read the specific file

2. Spawn the `code-reviewer` agent with the relevant context

3. Present findings organized by severity:
   - 🔴 Critical → Must fix before commit
   - 🟡 Warning → Should fix
   - 🔵 Suggestion → Consider for next iteration
   - ✅ Good patterns → Reinforce

4. If critical issues found, offer to fix them automatically
```

---

## Enhanced Hooks

Hooks provide zero-friction automation. They run automatically on specific events without any user action.

**File:** `.claude/settings.local.json`

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "pnpm --filter web typecheck 2>&1 | tail -5"
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "python3 .claude/hooks/security-check.py"
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "echo '💡 Remember: /verify-changes before shipping'"
          }
        ]
      }
    ]
  }
}
```

### Hook Descriptions

| Event | Matcher | Action | Purpose |
|-------|---------|--------|---------|
| PostToolUse | Edit\|Write | `pnpm typecheck \| tail -5` | Catch type errors immediately after edits |
| PreToolUse | Edit\|Write | `security-check.py` | Block writes to protected files (.env, credentials) |
| Stop | (all) | Reminder message | Nudge to run verification before shipping |

### Security Check Hook Script

**File:** `.claude/hooks/security-check.py`

```python
#!/usr/bin/env python3
"""Block edits to sensitive files and flag potential secrets."""
import json
import sys

PROTECTED_FILES = {'.env', '.env.local', '.env.production', 'credentials.json'}
PROTECTED_PATTERNS = ['id_rsa', '.pem', '.key']

def main():
    try:
        input_data = json.load(sys.stdin)
        file_path = input_data.get('tool_input', {}).get('file_path', '')

        # Check protected files
        filename = file_path.split('/')[-1] if file_path else ''
        if filename in PROTECTED_FILES:
            print(f"⚠️ BLOCKED: Cannot edit protected file: {filename}")
            sys.exit(2)  # Exit code 2 = block

        # Check protected patterns
        for pattern in PROTECTED_PATTERNS:
            if pattern in file_path:
                print(f"⚠️ BLOCKED: Cannot edit file matching pattern: {pattern}")
                sys.exit(2)

        sys.exit(0)  # Allow
    except Exception:
        sys.exit(0)  # Don't block on errors

if __name__ == '__main__':
    main()
```

### Future Hooks (Phase 2)

| Event | Action | Purpose |
|-------|--------|---------|
| SessionStart | Validate `.env` has required keys | Prevent "missing env var" errors mid-session |
| PostToolUse (Bash) | Log commands to `.claude/command-log.txt` | Audit trail for debugging |
| UserPromptSubmit | Detect ambiguous prompts, suggest clarification | Improve prompt quality |

---

## Updated CLAUDE.md Workflow

The feature workflow in CLAUDE.md (Layer 1) gets updated to include verification loops:

```markdown
## Feature Workflow

```
1. /start-task #XX        → Read issue, user story, acceptance criteria
2. Plan                   → Explore codebase, design approach
3. Implement              → Write code (hooks auto-typecheck on every edit)
   ├── New API module?    → /new-api-module [name]
   └── New component?     → /new-component [name]
4. /verify-changes        → Multi-agent verification (build + review + tests)
   └── Fix issues         → Self-healing loop (auto-fix + re-verify)
5. /review                → Code review (conventions, security, performance)
6. /api-test-generator    → Generate API tests (if backend touched)
7. /ship                  → Commit + PR + changelog
```

### Verification Quick Reference

| Command | Speed | What It Does |
|---------|-------|-------------|
| `/verify-changes --quick` | ~30s | TypeScript + build only |
| `/verify-changes` | ~2min | Build + review + tests (parallel) |
| `/verify-changes --with-security` | ~3min | Full verification + security scan |
| `/review` | ~1min | Code review only |
| `/security-scan` | ~1min | Security scan only |
```

---

## Updated MEMORY.md

```markdown
# Project Memory: Minutes to Actions

## Architecture
- **Monorepo**: pnpm workspaces — `apps/web` (React/Vite), `apps/api` (Fastify)
- **Design System**: shadcn/ui + Radix UI + Tailwind CSS + CSS variables for theming
- **State**: TanStack Query for server state, local useState for UI state
- **DnD**: @dnd-kit for Kanban board drag-and-drop
- **Auth**: Google OAuth with session cookies

## Workflow (4-Layer Architecture)
- **Layer 0 — Hooks** (automatic): Typecheck on edit, security check on write, stop reminder
- **Layer 1 — CLAUDE.md** (~60 lines): Always loaded. Commands, conventions, workflow, gotchas.
- **Layer 2 — Skills** (on-demand): `/start-task`, `/verify-changes`, `/review`, `/ship`, `/new-api-module`, `/new-component`, `/security-scan`
- **Layer 3 — Guidelines** (on-demand): `frontend-rules.md`, `backend-rules.md`, `conventions.md`
- **Layer 4 — Subagents** (spawned): `build-validator`, `code-reviewer`, `code-simplifier`, `verify-app`
- Old guidelines archived in `docs/guidelines/archive/`

## Verification Loop (Boris's Pattern)
- Give Claude a way to see output → 2-3x quality
- `/verify-changes` spawns parallel subagents for build, review, tests
- Self-healing loop: fix → re-verify → repeat (max 3 attempts)
- Adversarial review filters false positives

## Key Patterns
- `cn()` utility in `lib/utils.ts` for Tailwind class merging (clsx + tailwind-merge)
- Mutation hooks in `hooks/` with toast notifications via `sonner`
- Semantic color tokens: `--success`, `--warning`, `--info` (custom), plus standard shadcn vars
- Dark mode via `next-themes` with `attribute="class"`, toggle in Sidebar
- All data-testid attributes preserved for E2E tests

## Gotchas
- shadcn `Card` doesn't support `asChild` — use button wrapper with card classes
- Native `<select>` used for forms (works better with form state) over shadcn Select
- DropdownMenu portals actually *improve* dnd-kit compatibility (clicks don't propagate)
- shadcn init may overwrite `lib/utils.ts`, `tailwind.config.js`, `index.css` — always back up
- Google OAuth button forced to `bg-white dark:bg-white` for brand compliance

## Commands
- `pnpm --filter web typecheck` — TypeScript check
- `pnpm --filter web build` — Full build
- `pnpm test:api` — API E2E tests
- `pnpm test:e2e` — Browser E2E tests
```

---

## Implementation Checklist

### Phase 1: Subagents (Foundation)
- [ ] Create `.claude/agents/build-validator.md`
- [ ] Create `.claude/agents/code-reviewer.md`
- [ ] Create `.claude/agents/code-simplifier.md`
- [ ] Create `.claude/agents/verify-app.md`

### Phase 2: Enhanced Skills
- [ ] Create `.claude/skills/verify-changes.md` (replaces `/verify` from v1)
- [ ] Create `.claude/skills/security-scan.md`
- [ ] Create `.claude/skills/review.md`

### Phase 3: Hooks
- [ ] Create `.claude/hooks/security-check.py`
- [ ] Update `.claude/settings.local.json` with hook configuration
- [ ] Test hooks: verify typecheck runs after edit, security check blocks `.env` edits

### Phase 4: Integration
- [ ] Update CLAUDE.md workflow section (add verification loop)
- [ ] Update MEMORY.md (add Layer 4, verification loop notes)
- [ ] Verify `/verify-changes` correctly spawns parallel subagents
- [ ] Verify self-healing loop works (introduce a type error, watch it auto-fix)
- [ ] Verify adversarial review filters false positives

### Phase 5: v1 Remaining Items
- [ ] Complete all v1 checklist items that haven't been done yet
- [ ] Archive old guideline files
- [ ] Verify all skills work end-to-end

---

## Migration from v1

v2 is **additive** — it doesn't change any v1 files. Here's what's new vs modified:

### New Files (v2)
| File | Purpose |
|------|---------|
| `.claude/agents/build-validator.md` | Build verification subagent |
| `.claude/agents/code-reviewer.md` | Code review subagent |
| `.claude/agents/code-simplifier.md` | Post-implementation cleanup subagent |
| `.claude/agents/verify-app.md` | Runtime verification subagent |
| `.claude/skills/verify-changes.md` | Multi-agent verification skill |
| `.claude/skills/security-scan.md` | Security scanning skill |
| `.claude/skills/review.md` | Code review skill |
| `.claude/hooks/security-check.py` | File protection hook script |

### Modified Files (from v1)
| File | Change |
|------|--------|
| `.claude/settings.local.json` | Add hook configuration |
| `CLAUDE.md` | Update workflow section to include verification loop |
| `MEMORY.md` | Add Layer 4, verification loop, subagent references |

### Removed Files
| File | Replaced By |
|------|-------------|
| `.claude/skills/verify.md` (v1) | `.claude/skills/verify-changes.md` (v2) |

### Execution Order

1. **Do v1 first** — The 3-layer architecture is the foundation
2. **Then add v2** — Subagents and enhanced skills build on top
3. **Test incrementally** — Start with `build-validator` alone, then add agents one at a time

---

## What's NOT Changing (Same as v1)

These files remain as-is:
- `docs/project/*` — Project status, plan, changelog
- `docs/product/*` — Product spec, user stories
- `docs/engineering/*` — API spec, DB schema, architecture
- `docs/devops/*` — Commands, CI/CD, troubleshooting
- v1 skills that aren't being replaced: `/start-task`, `/new-api-module`, `/new-component`, `/ship`
- v1 Layer 3 guidelines: `frontend-rules.md`, `backend-rules.md`, `conventions.md`
