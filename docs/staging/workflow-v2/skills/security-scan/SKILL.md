---
name: security-scan
description: Security-focused code scan for Fastify + React + Prisma stack. Checks for secrets, vulnerable dependencies, auth bypass, and common vulnerabilities.
allowed-tools: Bash, Read, Glob, Grep
argument-hint: "[--deps-only]"
disable-model-invocation: true
---

# Security Scan

Security-focused code scan for Minutes to Actions (Fastify + React + Prisma).

## Arguments

User arguments: $ARGUMENTS

- `--deps-only` — dependency audit only (skip code analysis)

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

Skip this phase if `--deps-only` was specified.

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
