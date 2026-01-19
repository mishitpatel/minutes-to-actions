# Template Cheatsheet

> Quick reference for which template to use and when.

---

## Template Selection Guide

| Situation | Template | Location |
|-----------|----------|----------|
| Planning a new feature | SPEC_TEMPLATE.md | `docs/product/specs/` |
| Breaking down into tasks | STORY_TEMPLATE.md | `docs/product/stories/` |
| Planning a release | MILESTONE_TEMPLATE.md | `docs/project/milestones/` |
| Recording an architecture decision | ADR_TEMPLATE.md | `docs/engineering/decisions/` |
| Documenting a shipped feature | CHANGELOG.md | `docs/project/` |
| Tracking overall progress | PROJECT_STATUS.md | `docs/project/` |

---

## Template Flow

```
Product Vision (PRODUCT_OVERVIEW.md)
         │
         ▼
Feature Spec (SPEC_TEMPLATE.md)
         │
         ├──► Architecture Decision (ADR_TEMPLATE.md)
         │
         ▼
User Stories (STORY_TEMPLATE.md) ──► GitHub Issues
         │
         ▼
Milestone Planning (MILESTONE_TEMPLATE.md)
         │
         ▼
Implementation (guided by guidelines/)
         │
         ▼
Release (CHANGELOG.md)
```

---

## Quick Template Descriptions

### Product Templates

**PRODUCT_OVERVIEW.md**
- High-level vision and goals
- Target users and problems solved
- Feature roadmap and priorities
- Use: Project kickoff, stakeholder alignment

**SPEC_TEMPLATE.md**
- Detailed feature requirements
- User flows and acceptance criteria
- Technical considerations
- Use: Before starting any significant feature

**STORY_TEMPLATE.md**
- Specific, implementable tasks
- Acceptance criteria checklist
- GitHub issue integration
- Use: Task breakdown, milestone planning

### Engineering Templates

**ADR_TEMPLATE.md** (Architecture Decision Record)
- Context and problem statement
- Options considered with trade-offs
- Final decision and rationale
- Use: Any significant technical decision

### Project Templates

**MILESTONE_TEMPLATE.md**
- Release scope and goals
- Feature list with status
- GitHub issue tracking
- Use: Planning releases, tracking progress

**PROJECT_STATUS.md**
- Current phase and overall progress
- Milestone tracking
- Blockers and upcoming work
- Use: Regular status updates

**CHANGELOG.md**
- Version history with categories
- Added, Changed, Fixed, Removed
- Semantic versioning
- Use: Documenting releases

---

## When to Create New Documents

### Create a new Spec when:
- Building a user-facing feature
- Implementing a new API endpoint
- Making significant UX changes

### Create a new Story when:
- A spec has multiple implementation tasks
- Work needs to be tracked separately
- Creating GitHub issues for the work

### Create a new ADR when:
- Choosing between technologies
- Changing architectural patterns
- Making decisions that affect multiple systems

### Create a new Milestone when:
- Planning a release
- Starting a new development phase
- Coordinating multiple features

---

## Related Documents

- Product Overview: `docs/product/PRODUCT_OVERVIEW.md`
- All Guidelines: `docs/guidelines/`
- Commands Reference: `docs/project/COMMANDS.md`
