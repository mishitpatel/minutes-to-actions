# CI/CD Pipeline

> Continuous Integration and Continuous Deployment configuration.

## GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install

      - name: Lint
        run: pnpm lint

      - name: Type check
        run: pnpm typecheck

      - name: Test
        run: pnpm test:coverage

      - name: Build
        run: pnpm build

  deploy:
    needs: build-and-test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest

    steps:
      - name: Deploy to staging
        run: echo "Deploy to staging..."
```

## PR Checks

```yaml
# .github/workflows/pr.yml
name: PR Checks

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  validate-pr:
    runs-on: ubuntu-latest
    steps:
      - name: Validate PR title
        uses: amannn/action-semantic-pull-request@v5
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Actual CI Workflows

The real workflows in `.github/workflows/` are:

### API Tests (`.github/workflows/api-tests.yml`)

- **Triggers:** Pull request to `main`, manual dispatch
- **Runs:** `pnpm test:api:report` (console + JSON/JUnit output)
- **Services:** Starts PostgreSQL + Redis via docker-compose, runs migrations
- **Artifacts:** Uploads `api-test-results/` (always, 7-day retention)

### E2E Tests (`.github/workflows/e2e.yml`)

- **Triggers:** Pull request to `main`, manual dispatch (with browser selection)
- **Runs:** Playwright tests (Chromium by default, or selected browser/all)
- **Services:** Starts PostgreSQL + Redis via docker-compose, runs migrations
- **Artifacts:** Uploads `playwright-report/` (on failure only, 7-day retention)
- **Manual options:** `chromium` (default), `all`, `firefox`, `webkit`, `mobile-chrome`

## Pipeline Overview

```
Push to feature branch
         │
         ▼
    PR Created
         │
         ├──────────────────────────────────┐
         ▼                                  ▼
┌─────────────────────┐    ┌──────────────────────────┐
│   API Tests Job     │    │     E2E Tests Job        │
├─────────────────────┤    ├──────────────────────────┤
│ 1. Checkout code    │    │ 1. Checkout code         │
│ 2. Install deps     │    │ 2. Install deps          │
│ 3. Start services   │    │ 3. Install browsers      │
│ 4. Run migrations   │    │ 4. Start services        │
│ 5. pnpm test:api:   │    │ 5. Run migrations        │
│    report           │    │ 6. Run Playwright tests  │
│ 6. Upload results   │    │ 7. Upload report         │
│    (always)         │    │    (on failure)           │
└─────────────────────┘    └──────────────────────────┘
         │                                  │
         └──────────────┬───────────────────┘
                        ▼
                   PR Approved
                        │
                        ▼
                  Merge to main
                        │
                        ▼
              ┌─────────────────────┐
              │   Deploy Pipeline   │
              ├─────────────────────┤
              │ 1. Deploy to staging│
              │ 2. Run smoke tests  │
              │ 3. Deploy to prod   │
              │    (manual trigger) │
              └─────────────────────┘
```

## Environment Variables

Required secrets in GitHub Actions:

| Secret | Purpose |
|--------|---------|
| `GITHUB_TOKEN` | Auto-provided for PR validation |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `GOOGLE_CLIENT_ID` | OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret |

## Deployment Policies

### Environments

| Environment | Purpose | Deploy |
|-------------|---------|--------|
| Development | Local dev | Manual |
| Staging | Testing | Auto on main merge |
| Production | Live users | Manual approval |

### Deployment Checklist
- [ ] All tests passing
- [ ] No security vulnerabilities
- [ ] Database migrations applied
- [ ] Feature flags configured
- [ ] Monitoring alerts configured
- [ ] Rollback plan ready

### Rollback Criteria

Immediate rollback if:
- Error rate > 1%
- Response time > 2x baseline
- Critical functionality broken
- Security vulnerability discovered

### Feature Flags
- New features behind flags in production
- Gradual rollout (10% → 50% → 100%)
- Kill switch for quick disable

---

## Incident Response

### Severity Levels

| Level | Description | Response Time |
|-------|-------------|---------------|
| P0 | System down | 15 minutes |
| P1 | Major feature broken | 1 hour |
| P2 | Minor feature broken | 4 hours |
| P3 | Cosmetic/minor | Next sprint |

### Incident Process
1. Detect: Monitoring alerts or user report
2. Triage: Assess severity
3. Communicate: Update status page
4. Resolve: Fix or rollback
5. Document: Post-mortem within 48h

## Related Documents

- GitHub Workflow: `docs/devops/github-workflow.md`
- Commands Reference: `docs/devops/commands.md`
