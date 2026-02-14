---
name: new-component
description: Scaffolds a React component or page following project conventions (file structure, styling, accessibility).
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
argument-hint: "[ComponentName] [--page]"
disable-model-invocation: true
---

# New Component

Scaffold a React component following project conventions.

## Arguments

User arguments: $ARGUMENTS

- First argument: ComponentName (PascalCase)
- `--page` flag: create a page component instead of a regular component

## Workflow

### Step 1: Read Context

1. Read `docs/guidelines/frontend-rules.md` for conventions
2. Check existing similar components in `apps/web/src/components/` for patterns
3. If `--page`, check `apps/web/src/pages/` instead

### Step 2: Determine Location

| Type | Location | Naming |
|------|----------|--------|
| Component | `apps/web/src/components/[Name].tsx` | PascalCase |
| Page | `apps/web/src/pages/[Name]Page.tsx` | PascalCase + "Page" suffix |
| UI primitive | `apps/web/src/components/ui/[name].tsx` | lowercase (shadcn convention) |

### Step 3: Create Component

Follow this file structure order:

```typescript
// 1. Imports
import { cn } from '@/lib/utils';

// 2. Types
interface [Name]Props {
  // ...
}

// 3. Component
export function [Name]({ ...props }: [Name]Props) {
  // 4. Hooks
  // 5. Derived state
  // 6. Callbacks
  // 7. Effects
  // 8. Early returns (loading, error, empty)
  // 9. Render
  return (
    <div data-testid="[kebab-case-name]">
      {/* ... */}
    </div>
  );
}
```

Rules:
- Functional components ONLY — no class components
- Always include `data-testid` on root element
- Use `cn()` for conditional Tailwind classes
- Use semantic color tokens (`text-destructive`, `bg-success/10`, etc.)
- Support dark mode — no hardcoded colors
- Use shadcn/ui primitives from `components/ui/` when available
- TanStack Query for server state, `useState` for UI state
- Focus states: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`

### Step 4: Wire Up (Pages only)

If `--page` was used:
1. Add route in `apps/web/src/App.tsx` (or router file)
2. Add navigation link in Sidebar if needed

### Step 5: Accessibility Checklist

Verify:
- [ ] Interactive elements are focusable
- [ ] Color contrast meets 4.5:1 for text
- [ ] Aria labels on icon-only buttons
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Loading/error states communicate to screen readers
