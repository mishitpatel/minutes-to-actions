# Frontend Rules

> Compact rules for React + Vite + TypeScript + shadcn/ui + Tailwind CSS.
> Every line answers: "Would Claude make a mistake without this?"

## Component Structure

| Order | Section | Example |
|-------|---------|---------|
| 1 | Imports | `import { cn } from '@/lib/utils'` |
| 2 | Types | `interface Props { ... }` |
| 3 | Component | `export function Name({ ... }: Props)` |
| 4 | Hooks | `const { data } = useQuery(...)` |
| 5 | Derived state | `const filtered = items.filter(...)` |
| 6 | Callbacks | `const handleClick = useCallback(...)` |
| 7 | Effects | `useEffect(...)` |
| 8 | Early returns | Loading, error, empty states |
| 9 | Render | `return (...)` |

## Component Rules

- Functional components ONLY — no class components
- Always `data-testid` on root element (kebab-case)
- Use `cn()` for conditional classes — never string concatenation
- Use `type` keyword for type imports: `import type { X } from '...'`
- Prefer named exports over default exports

## State Management

| Type | Tool | Example |
|------|------|---------|
| Server state | TanStack Query | `useQuery`, `useMutation` with `queryClient.invalidateQueries` |
| UI state | `useState` | `isModalOpen`, `selectedTab` |
| Form state | React Hook Form or `useState` | Controlled inputs |

- NO Zustand yet in this project
- Mutation hooks in `hooks/` with toast notifications via `sonner`

### Toast Notifications (Sonner)

- Import `toast` from `sonner` — NOT from shadcn
- Use in mutation `onSuccess` / `onError` callbacks
- Patterns: `toast.success("Created!")`, `toast.error("Failed to save")`, `toast.loading("Saving...")`
- Sonner `<Toaster />` is mounted once in the app root — do NOT add additional instances

## Styling

### Color Tokens (use these, not raw colors)

| Token | Usage |
|-------|-------|
| `bg-background` / `text-foreground` | Default surface/text |
| `bg-primary` / `text-primary-foreground` | Primary actions |
| `bg-destructive` / `text-destructive` | Delete, errors |
| `bg-muted` / `text-muted-foreground` | Secondary text, disabled |
| `bg-accent` | Hover states |
| `border-border` | All borders |
| `ring-ring` | Focus rings |
| `bg-success/10` / `text-success` | Success states (custom) |
| `bg-warning/10` / `text-warning` | Warning states (custom) |
| `bg-info/10` / `text-info` | Info states (custom) |

### Spacing

- All spacing is multiples of 4px (Tailwind defaults: `p-1`=4px, `p-2`=8px, etc.)
- No arbitrary values like `p-[7px]`

### Dark Mode

- ThemeProvider uses `attribute="class"` + `enableSystem`
- Toggle component in Sidebar
- Never hardcode colors — always use tokens above
- Google OAuth button exception: `bg-white dark:bg-white`

## Focus & Accessibility

- Focus states: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`
- Motion: add `motion-reduce:transition-none` on animated elements
- Color contrast: 4.5:1 for normal text, 3:1 for large text
- Aria labels on icon-only buttons
- Interactive elements must be keyboard navigable (Tab, Enter, Escape)
- Loading/error states should communicate to screen readers

## shadcn/ui Gotchas

| Issue | Solution |
|-------|----------|
| Card has no `asChild` | Wrap with button + card classes |
| Select in forms | Use native `<select>` (better form state) |
| DropdownMenu in dnd-kit | Portal behavior actually helps (clicks don't propagate) |
| `shadcn init` overwrites files | Always back up `lib/utils.ts`, `tailwind.config.js`, `index.css` |

## File Naming

| Type | Convention | Example |
|------|-----------|---------|
| Component | PascalCase | `ActionItemCard.tsx` |
| Page | PascalCase + Page | `BoardPage.tsx` |
| Hook | camelCase + use | `useActionItems.ts` |
| Utility | camelCase | `formatDate.ts` |
| UI primitive | lowercase | `button.tsx` (shadcn) |

## Import Organization

1. React/external libraries
2. Internal components (`@/components/...`)
3. Hooks (`@/hooks/...`)
4. Utils/services (`@/lib/...`, `@/services/...`)
5. Types (with `type` keyword)

## Selector Strategy (for E2E tests)

1. `data-testid` (most stable)
2. ARIA roles + accessible names
3. Labels
4. Placeholder text
5. Text content (least stable)
