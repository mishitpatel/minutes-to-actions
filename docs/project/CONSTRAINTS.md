# Constraints & Policies

> **Last Updated:** YYYY-MM-DD
> **Review Cycle:** Quarterly

## Technical Constraints

### Performance Requirements
| Metric | Target | Measurement |
|--------|--------|-------------|
| API Response Time (p95) | < 200ms | New Relic/Datadog |
| API Response Time (p99) | < 500ms | New Relic/Datadog |
| Database Query Time (p95) | < 50ms | Prisma metrics |
| Frontend LCP | < 2.5s | Lighthouse |
| Frontend FID | < 100ms | Lighthouse |
| Frontend CLS | < 0.1 | Lighthouse |

### Scalability Requirements
| Metric | Target |
|--------|--------|
| Concurrent Users | 1,000+ |
| Requests per Second | 500+ |
| Database Connections | 20-50 pool |
| File Upload Size | 10MB max |

### Availability Requirements
| Environment | Target Uptime |
|-------------|---------------|
| Production | 99.9% |
| Staging | 99% |

## Security Policies

> See `docs/guidelines/SECURITY.md` for detailed security requirements including authentication, authorization, encryption, and rate limiting standards.

## Code Quality Standards

### Required for All PRs
- [ ] Passes all CI checks (lint, test, build)
- [ ] No TypeScript `any` types (unless justified)
- [ ] No console.log or debug statements
- [ ] No commented-out code
- [ ] New features have tests
- [ ] At least 1 code review approval

### Coverage Requirements
| Type | Minimum |
|------|---------|
| Unit Tests | 80% |
| Integration Tests | Key flows covered |
| E2E Tests | Critical paths |

### Code Style
- ESLint + Prettier for formatting
- Conventional commits required
- Max function length: 50 lines (guideline)
- Max file length: 300 lines (guideline)

## API Policies

### Versioning
- API versions in URL path: `/v1/`, `/v2/`
- No breaking changes without new version
- Deprecated versions supported for 6 months
- Deprecation notice in response headers

### Breaking Changes (Require New Version)
- Removing endpoints
- Removing required fields
- Changing field types
- Changing authentication method
- Changing error response format

### Non-Breaking Changes (OK in Same Version)
- Adding new endpoints
- Adding optional fields
- Adding new enum values (with default handling)
- Performance improvements

### Rate Limits
| Tier | Limit |
|------|-------|
| Anonymous | 20 req/min |
| Authenticated | 100 req/min |
| Admin | 500 req/min |

## Database Policies

### Schema Changes
- [ ] All changes via migrations (no manual changes)
- [ ] Migrations tested on staging first
- [ ] Backward-compatible when possible
- [ ] Rollback plan documented for breaking changes
- [ ] Index changes reviewed for performance impact

### Data Retention
| Data Type | Retention |
|-----------|-----------|
| User data | Until account deletion |
| Session data | 30 days |
| Audit logs | 1 year |
| Error logs | 90 days |
| Analytics | 2 years |

### Backup Policy
- Full backup: Daily
- Incremental backup: Hourly
- Retention: 30 days
- Test restore: Monthly

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

## Documentation Requirements

### Code Documentation
- [ ] Public functions have JSDoc comments
- [ ] Complex logic has inline comments
- [ ] README in each major directory
- [ ] API endpoints documented in OpenAPI

### Change Documentation
- [ ] CHANGELOG updated for releases
- [ ] ADRs for significant decisions
- [ ] Runbook for operations tasks

## Dependency Policies

### Adding Dependencies
- [ ] Security audit (npm audit, Snyk)
- [ ] License compatible (MIT, Apache 2.0 preferred)
- [ ] Actively maintained (commits in last 6 months)
- [ ] Reasonable size (bundle impact)
- [ ] Justified need (not trivially reimplementable)

### Updating Dependencies
- Security updates: Within 7 days
- Minor updates: Monthly
- Major updates: Quarterly (with testing)

### Prohibited Dependencies
- Known vulnerable packages
- Abandoned packages (no updates in 2 years)
- Packages with incompatible licenses
- Packages with excessive transitive dependencies

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

## Review & Updates

This document should be reviewed quarterly and updated when:
- New compliance requirements
- Technology changes
- Post-incident learnings
- Team feedback

## Related Documents

- Architecture: `docs/engineering/ARCHITECTURE.md`
- Security: Contact security team
- GitHub Workflow: `docs/project/GITHUB_WORKFLOW.md`
