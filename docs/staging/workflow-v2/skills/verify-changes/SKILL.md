---
name: verify-changes
description: Multi-agent verification with parallel execution and adversarial review. Spawns build-validator, code-reviewer, and verify-app subagents in parallel. Replaces sequential /verify.
allowed-tools: Bash, Read, Glob, Grep, Task
argument-hint: "[--quick | --no-tests | --with-security]"
disable-model-invocation: true
---

# Verify Changes

Multi-agent verification with parallel execution and adversarial review.

## Arguments

User arguments: $ARGUMENTS

- `--quick` — build-validator only (~30s)
- `--no-tests` — skip test execution
- `--with-security` — add security scan

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
- Frontend only — spawn build-validator + code-reviewer
- Backend only — spawn build-validator + verify-app + code-reviewer
- Full-stack — spawn all agents
- `--with-security` — also spawn security scan

### Phase 2: Quick Mode (`--quick`)

If `--quick` flag is set, run ONLY:

```bash
pnpm --filter web typecheck && pnpm --filter web build
```

Report pass/fail in <30 seconds and STOP. Do not spawn subagents.

### Phase 3: Parallel Verification

**CRITICAL: Launch ALL subagents in a SINGLE message for true parallelism.**

Spawn these as parallel Task calls with `run_in_background: true`:

| Agent | What It Checks | Model |
|-------|---------------|-------|
| `build-validator` | TypeScript + production build | sonnet |
| `code-reviewer` | Quality, conventions, security, performance | sonnet |
| `verify-app` | API tests + runtime checks (skip if `--no-tests`) | sonnet |

Each agent runs independently and produces a structured report.

When spawning agents, provide them with the list of changed files and recent commits as context.

### Phase 4: Adversarial Review

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

### Phase 5: Final Report

```
## Verification Report

### Summary: [READY TO SHIP / REVIEW NEEDED / FIX REQUIRED]

### Results by Agent

| Agent | Status | Critical | Warnings | Info |
|-------|--------|----------|----------|------|
| Build Validator | PASS/FAIL | 0 | 0 | 0 |
| Code Reviewer | PASS/WARN | 0 | 2 | 1 |
| App Verification | PASS/FAIL | 0 | 0 | 0 |
| Security Scan | PASS/WARN/SKIPPED | 0 | 1 | 0 |

### Confirmed Issues (after adversarial review)

CRITICAL (must fix before shipping):
1. [issue with file:line and fix]

WARNINGS (should fix):
1. [issue with file:line and fix]

INFO (consider):
1. [observation]

### Dismissed (false positives filtered)
- [issue] — Reason: [why it's OK]

### Files Not Covered
- [any changed files that no agent reviewed]
```

### Phase 6: Self-Healing (if not READY TO SHIP)

If there are critical issues:
1. Fix each critical issue
2. Re-run ONLY the failed agent(s) — not the full pipeline
3. Repeat until all agents pass OR max 3 iterations
4. Report final status with iteration count
