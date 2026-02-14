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
| API Tests | PASS/FAIL | [X passed, Y failed] |
| API Health | PASS/FAIL/SKIPPED | [response or "server not running"] |
| Runtime Check | PASS/FAIL | [issues found or "clean"] |
| E2E Tests | PASS/FAIL/SKIPPED | [X passed, Y failed, or "skipped"] |
| Swagger | PASS/FAIL/SKIPPED | [complete or "missing schemas"] |

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
