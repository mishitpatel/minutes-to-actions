# Documentation Index

> Quick navigation for all project documentation.

## Reading Order

1. `docs/project/STATUS.md` - **Current state & what to work on next**
2. `CLAUDE.md` (project root) - Quick start & conventions
3. `docs/product/product-spec.md` - What we're building
4. `docs/engineering/architecture.md` - How it's structured

## Design Workflow (Specs → Plan)

```
Product Spec ([product-spec.md](./product/product-spec.md) + phased specs)
   ← Inputs: internal brainstorming meetings + ChatGPT + Claude agents
   |
   v
User Stories ([user-stories-phase1.md](./product/user-stories-phase1.md))
   ← Inputs: Product Spec + STORY_TEMPLATE.md + Claude Code
   → Feedback: human clarifications if unclear
   |
   v
DB Design ([database-schema.md](./engineering/database-schema.md))
   ← Inputs: User Stories + Product Spec + [DB guidelines](./guidelines/database_guidelines.md) + Claude Code
   → Output: ERD / DBML (optional)
   |
   v
Project Plan ([project-plan.md](./project/project-plan.md))
   ← Inputs: Product Spec + User Stories + DB Design
   ← Guidance: [API](./guidelines/api_guidelines.md), [backend](./guidelines/backend_guidelines.md), [frontend](./guidelines/frontend_guidelines.md), [architecture](./guidelines/architecture_guidelines.md) guidelines
   → Output: milestones → tasks → subtasks (GitHub-issue ready)
```

## Implementation Workflow (User ↔ Claude Code)

```
User: "What's the current status and next task?"
   ← Claude reads: STATUS.md + project-plan.md
   → Claude answers: current position + next task options (milestone/task IDs)
            |
            v
User: "Work on Task <X>"
   ← Inputs to Claude: chosen task + relevant specs/guidelines
   → Claude implements: code + tests + migrations (as needed)
   → Claude asks: clarifying questions only if blocked/unclear
            |
            v
Claude updates progress (during work)
   ← Update: project-plan.md (check off subtasks)
   ← Update: STATUS.md (in progress / blockers / decisions)
   ← Update: changelog.md (when a milestone/feature completes)
            |
            v
User: "Wrap up this session"
   ← Claude updates: STATUS.md (next pointer + session log + timestamp)
   ← Claude ensures: project-plan.md reflects reality
            |
            v
Loop
   (User asks status → selects next task → Claude executes → docs updated)
```

## Documentation Map

| Domain                         | Purpose        | Key Documents                                     |
| ------------------------------ | -------------- | ------------------------------------------------- |
| [project/](./project/)         | Project state  | **STATUS.md**, project-plan, changelog            |
| [product/](./product/)         | What to build  | product-spec, user-stories                        |
| [engineering/](./engineering/) | How it's built | architecture, api-spec, database-schema           |
| [guidelines/](./guidelines/)   | How to code    | frontend, backend, testing, security              |
| [devops/](./devops/)           | Operations     | commands, github-workflow, ci-cd, troubleshooting |

## Quick Links

- **Write a story**: `product/stories/_TEMPLATE.md`
- **Record a decision**: `engineering/decisions/_TEMPLATE.md`
- **Run commands**: `devops/commands.md`
- **Fix issues**: `devops/troubleshooting.md`
