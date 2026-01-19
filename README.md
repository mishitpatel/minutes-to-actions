# Claude Code Template System for Spec-Driven Development

> A comprehensive CLAUDE.md template system designed for fullstack projects using **Progressive Disclosure** to keep Claude Code sessions focused and efficient.

## Overview

This template system implements **Spec-Driven Development** with Claude Code, organizing documentation into a hierarchy that:

1. **Keeps CLAUDE.md concise** (~70 lines) as an entry point
2. **Uses progressive disclosure** - Claude reads detailed docs only when needed
3. **Separates concerns** - Product specs, engineering docs, and guidelines are distinct
4. **Enables efficient AI collaboration** - Claude knows where to find information

## Directory Structure

```
your-project/
├── CLAUDE.md                          # 🎯 Entry point (keep concise!)
│
├── docs/
│   ├── product/                       # 📦 PRODUCT PACK
│   │   ├── PRODUCT_OVERVIEW.md        # Vision, goals, roadmap
│   │   ├── specs/                     # Detailed feature specifications
│   │   │   ├── SPEC_TEMPLATE.md
│   │   │   ├── SPEC_001_[feature].md
│   │   │   └── SPEC_002_[feature].md
│   │   └── stories/                   # User stories for each spec
│   │       ├── STORY_TEMPLATE.md
│   │       ├── STORY_001.md
│   │       └── STORY_002.md
│   │
│   ├── engineering/                   # 🔧 ENGINEERING PACK
│   │   ├── ARCHITECTURE.md            # System design, tech stack
│   │   ├── API_DESIGN.md              # REST API guidelines
│   │   └── DATABASE.md                # Schema, migrations, queries
│   │
│   ├── guidelines/                    # 📐 CODING STANDARDS
│   │   ├── FRONTEND.md                # React/TypeScript conventions
│   │   ├── BACKEND.md                 # Node.js/Express conventions
│   │   ├── UI_UX.md                   # Design system, accessibility
│   │   └── TESTING.md                 # Test patterns, coverage
│   │
│   └── project/                       # 📊 PROJECT MANAGEMENT
│       ├── GITHUB_WORKFLOW.md         # Branching, PRs, CI/CD
│       ├── CONSTRAINTS.md             # Policies, security, SLAs
│       ├── COMMANDS.md                # Frequently used commands
│       ├── milestones/
│       │   ├── MILESTONE_TEMPLATE.md
│       │   └── MILESTONE_001.md
│       └── decisions/
│           └── ADR_TEMPLATE.md        # Architecture Decision Records
│
├── apps/
│   ├── web/                           # Frontend application
│   └── api/                           # Backend application
│
└── packages/
    └── shared/                        # Shared types, utilities
```

## How Progressive Disclosure Works

### Level 1: CLAUDE.md (Always Loaded)
- Project overview and quick start
- Map of documentation structure
- Key conventions and constraints
- Links to detailed docs

### Level 2: Category Documents (Loaded on Demand)
- `PRODUCT_OVERVIEW.md` - When discussing features
- `ARCHITECTURE.md` - When making design decisions
- `API_DESIGN.md` - When working on APIs
- Coding guidelines - When writing code

### Level 3: Detailed Specs (Loaded for Specific Tasks)
- Individual spec files for features
- User story details
- Milestone tracking

## Usage Guide

### Starting a New Project

1. **Copy the template structure** to your project root
2. **Customize CLAUDE.md** with your project details
3. **Fill in PRODUCT_OVERVIEW.md** with your vision
4. **Define your tech stack** in ARCHITECTURE.md
5. **Create your first milestone** and specs

### Working with Claude Code

When you start a session, Claude will:

1. Read `CLAUDE.md` to understand the project
2. Before implementing features, read the relevant spec from `docs/product/specs/`
3. Before writing code, read the appropriate guideline from `docs/guidelines/`
4. Reference `API_DESIGN.md` and `DATABASE.md` for backend work

### Template Relationships

```
PRODUCT_OVERVIEW.md
        │
        ▼
   SPEC_XXX.md ──────► MILESTONE_XXX.md
        │                    │
        ▼                    │
   STORY_XXX.md ◄────────────┘
        │
        ▼
   Implementation
   (guided by guidelines)
```

## Template Descriptions

### Product Pack

| File | Purpose | When to Use |
|------|---------|-------------|
| `PRODUCT_OVERVIEW.md` | High-level product vision | Starting a project, onboarding |
| `SPEC_TEMPLATE.md` | Feature specification | Planning new features |
| `STORY_TEMPLATE.md` | User story with acceptance criteria | Sprint planning |

### Engineering Pack

| File | Purpose | When to Use |
|------|---------|-------------|
| `ARCHITECTURE.md` | System design, tech stack, data flow | Design decisions |
| `API_DESIGN.md` | REST conventions, endpoints, errors | API development |
| `DATABASE.md` | Schema patterns, migrations, queries | Database work |

### Guidelines Pack

| File | Purpose | When to Use |
|------|---------|-------------|
| `FRONTEND.md` | React/TypeScript conventions | Frontend development |
| `BACKEND.md` | Node.js patterns, structure | Backend development |
| `UI_UX.md` | Design system, accessibility | UI implementation |
| `TESTING.md` | Test patterns, coverage | Writing tests |

### Project Pack

| File | Purpose | When to Use |
|------|---------|-------------|
| `GITHUB_WORKFLOW.md` | Branching, PRs, CI/CD | Git operations |
| `CONSTRAINTS.md` | Policies, SLAs, security | Compliance checks |
| `COMMANDS.md` | Common CLI commands | Daily development |
| `MILESTONE_TEMPLATE.md` | Sprint/release planning | Project management |
| `ADR_TEMPLATE.md` | Architecture decisions | Major tech choices |

## Best Practices

### Keeping CLAUDE.md Effective

```markdown
✅ DO:
- Keep under 100 lines
- Include project map
- List key conventions
- Link to detailed docs
- Update current sprint focus

❌ DON'T:
- Embed full specifications
- Include all API endpoints
- List every command
- Duplicate content from other docs
```

### Writing Good Specs

```markdown
✅ DO:
- Clear problem statement
- Measurable acceptance criteria
- Link to related stories
- Define what's out of scope
- Include error scenarios

❌ DON'T:
- Implementation details
- Vague requirements
- Missing edge cases
- Undefined success metrics
```

### Maintaining Documentation

- **Review quarterly**: Update constraints and policies
- **Update per sprint**: Milestone progress, current focus
- **Update per feature**: Specs, stories, API docs
- **Update as needed**: Commands, guidelines

## Customization

### For Monorepo Projects
```
├── CLAUDE.md                    # Root entry point
├── apps/
│   ├── web/
│   │   └── CLAUDE.md            # Frontend-specific (optional)
│   └── api/
│       └── CLAUDE.md            # Backend-specific (optional)
└── docs/                        # Shared documentation
```

### For Microservices
```
├── CLAUDE.md                    # Service overview
├── docs/
│   ├── engineering/
│   │   ├── API_DESIGN.md        # This service's API
│   │   └── INTEGRATION.md       # Inter-service communication
```

### For Solo Developers
You might simplify to:
```
├── CLAUDE.md
├── docs/
│   ├── SPECS.md                 # All specs in one file
│   └── GUIDELINES.md            # Combined guidelines
```

## Integration with Claude Code

### Suggested Workflow

1. **Session Start**: Claude reads CLAUDE.md
2. **Feature Request**: Claude reads relevant spec
3. **Implementation**: Claude follows guidelines
4. **PR Creation**: Claude follows GitHub workflow
5. **Testing**: Claude follows testing guidelines

### Example Claude Code Prompt

```
@CLAUDE.md I need to implement the user authentication feature.

Before coding:
1. Read docs/product/specs/SPEC_001_authentication.md
2. Read docs/guidelines/BACKEND.md
3. Check docs/engineering/API_DESIGN.md for auth patterns
```

## Contributing

When adding new documentation:

1. Follow the existing template structure
2. Keep files focused on single topics
3. Cross-reference related documents
4. Update CLAUDE.md if adding new categories

## License

MIT - Feel free to use and modify for your projects.
