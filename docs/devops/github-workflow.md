# GitHub Workflow & Repository Guidelines

> **Last Updated:** YYYY-MM-DD
> **Branch Strategy:** GitHub Flow (trunk-based)
> **Default Branch:** `main`

## Branch Strategy

### GitHub Flow (Recommended for Most Teams)
```
main (protected)
  │
  ├── feature/user-authentication
  ├── feature/payment-integration
  ├── fix/login-validation-error
  └── chore/update-dependencies
```

### Branch Types
| Prefix | Purpose | Example |
|--------|---------|---------|
| `feature/` | New features | `feature/user-dashboard` |
| `fix/` | Bug fixes | `fix/login-error` |
| `hotfix/` | Critical production fixes | `hotfix/security-patch` |
| `chore/` | Maintenance, deps, config | `chore/update-eslint` |
| `docs/` | Documentation only | `docs/api-readme` |
| `refactor/` | Code refactoring | `refactor/auth-module` |

### Branch Naming Rules
```
✅ Good
feature/add-user-authentication
fix/resolve-login-validation-error
chore/upgrade-to-node-20

❌ Bad
Feature/AddUserAuth         # PascalCase
feature/add_user_auth       # underscores
my-branch                   # no prefix
feature/auth                # too vague
```

## Commit Messages

### Conventional Commits
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types
| Type       | Description                  | Example                              |
| ---------- | ---------------------------- | ------------------------------------ |
| `feat`     | New feature                  | `feat(auth): add password reset`     |
| `fix`      | Bug fix                      | `fix(api): handle null response`     |
| `docs`     | Documentation                | `docs: update API readme`            |
| `style`    | Formatting (no code change)  | `style: format with prettier`        |
| `refactor` | Code change (no feature/fix) | `refactor(user): extract validation` |
| `test`     | Adding tests                 | `test(auth): add login tests`        |
| `chore`    | Build, deps, config          | `chore: update dependencies`         |
| `perf`     | Performance improvement      | `perf(query): add index`             |
| `ci`       | CI/CD changes                | `ci: add deploy workflow`            |

### Examples
```bash
# Feature
feat(user): add email verification flow

# Bug fix
fix(cart): calculate tax correctly for EU countries

# With body and footer
feat(api): add pagination to users endpoint

- Add cursor-based pagination
- Limit max page size to 100
- Add sorting options

Closes #123
```

### Commit Rules
- ✅ Use imperative mood: "add feature" not "added feature"
- ✅ Keep subject line under 72 characters
- ✅ Capitalize first letter of subject
- ✅ No period at end of subject
- ✅ Reference issues in footer
- ❌ Don't commit commented-out code
- ❌ Don't commit console.log/debug statements

## Pull Request Workflow

### 1. Create Branch
```bash
# Ensure main is up to date
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/user-authentication
```

### 2. Make Changes & Commit
```bash
# Stage changes
git add .

# Commit with conventional message
git commit -m "feat(auth): implement JWT authentication"

# Push to remote
git push -u origin feature/user-authentication
```

### 3. Create Pull Request

#### PR Title
Use conventional commit format:
```
feat(auth): implement JWT authentication
fix(cart): resolve checkout total calculation
```

#### PR Description Template
```markdown
## Summary
Brief description of what this PR does.

## Changes
- Added JWT authentication middleware
- Created login/logout endpoints
- Added password hashing with bcrypt

## Testing
- [ ] Unit tests added
- [ ] Integration tests passing
- [ ] Manual testing completed

## Screenshots (if UI changes)
[Add screenshots or videos]

## Related Issues
Closes #123
Related to #456

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Tests added for new functionality
- [ ] Documentation updated
- [ ] No console.log or debug code
```

### 4. Code Review

#### As Author
- Keep PRs small (< 400 lines ideally)
- Respond to feedback promptly
- Don't take feedback personally
- Explain your reasoning when needed

#### As Reviewer
- Be constructive and kind
- Explain the "why" behind suggestions
- Approve or request changes promptly
- Focus on:
  - Logic errors
  - Security issues
  - Performance concerns
  - Test coverage
  - Code clarity

### 5. Merge

#### Merge Strategies
| Strategy | Use When |
|----------|----------|
| Squash and merge | Default - clean history |
| Rebase and merge | Need individual commits |
| Merge commit | Preserving branch history |

#### Before Merging
- [ ] All CI checks passing
- [ ] At least 1 approval
- [ ] No unresolved conversations
- [ ] Branch up to date with main

## Branch Protection Rules

### Main Branch
```yaml
Protection rules:
  - Require pull request before merging
  - Require at least 1 approval
  - Dismiss stale approvals on new commits
  - Require status checks:
    - build
    - test
    - lint
  - Require branches to be up to date
  - Require linear history (squash merge)
  - Do not allow force pushes
  - Do not allow deletions
```

## CI/CD Pipeline

> See `docs/devops/ci-cd.md` for GitHub Actions workflow configuration and deployment pipeline details.

## Repository Structure

### Essential Files
```
.
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   └── deploy.yml
│   ├── PULL_REQUEST_TEMPLATE.md
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   └── CODEOWNERS
├── .gitignore
├── README.md
├── CONTRIBUTING.md
├── LICENSE
└── changelog.md
```

### CODEOWNERS
```
# .github/CODEOWNERS

# Default owners
* @team-lead

# Frontend
/apps/web/ @frontend-team

# Backend
/apps/api/ @backend-team

# Database
/prisma/ @backend-team @dba

# Infrastructure
/.github/ @devops
/docker/ @devops
```

### .gitignore Essentials
```gitignore
# Dependencies
node_modules/
.pnpm-store/

# Build
dist/
build/
.next/

# Environment
.env
.env.local
.env.*.local

# IDE
.idea/
.vscode/
*.swp

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Testing
coverage/
.nyc_output/

# Cache
.cache/
.turbo/
```

## Issue Management

### Issue Templates

#### Bug Report
```markdown
---
name: Bug Report
about: Report a bug
labels: bug
---

## Description
Clear description of the bug.

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. See error

## Expected Behavior
What should happen.

## Actual Behavior
What actually happens.

## Environment
- Browser: Chrome 120
- OS: macOS 14
- App version: 1.2.3
```

#### Feature Request
```markdown
---
name: Feature Request
about: Suggest a feature
labels: enhancement
---

## Problem
What problem does this solve?

## Proposed Solution
How should it work?

## Alternatives Considered
Other options you've thought about.

## Additional Context
Any other relevant information.
```

### Labels
| Label | Color | Purpose |
|-------|-------|---------|
| `bug` | #d73a4a | Bug reports |
| `enhancement` | #a2eeef | New features |
| `documentation` | #0075ca | Docs changes |
| `good first issue` | #7057ff | Beginner friendly |
| `help wanted` | #008672 | Extra attention needed |
| `priority: high` | #b60205 | High priority |
| `priority: medium` | #fbca04 | Medium priority |
| `priority: low` | #0e8a16 | Low priority |

## Git Commands Reference

> See `docs/devops/commands.md` for complete git command reference including daily workflow, undo commands, and advanced operations.

## Release Process

### Semantic Versioning
```
MAJOR.MINOR.PATCH

1.0.0 → 1.0.1  (patch: bug fix)
1.0.1 → 1.1.0  (minor: new feature)
1.1.0 → 2.0.0  (major: breaking change)
```

### Creating Release
```bash
# Create version tag
git tag -a v1.2.0 -m "Release v1.2.0"
git push origin v1.2.0

# Generate changelog
# (Use conventional-changelog or similar)
```

## PR Requirements

### Required for All PRs
- [ ] Passes all CI checks (lint, test, build)
- [ ] No TypeScript `any` types (unless justified)
- [ ] No console.log or debug statements
- [ ] No commented-out code
- [ ] New features have tests
- [ ] At least 1 code review approval

## Related Documents

- CI/CD Pipeline: `docs/devops/ci-cd.md`
- Commands Reference: `docs/devops/commands.md`
- Architecture: `docs/engineering/architecture.md`
