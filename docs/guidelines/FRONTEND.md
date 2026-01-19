# Frontend Coding Guidelines

> **Last Updated:** YYYY-MM-DD
> **Framework:** React 18 + TypeScript + Vite
> **Style:** Tailwind CSS v4 + shadcn/ui

## Project Structure

```
apps/web/src/
├── components/
│   ├── ui/                    # Base UI components (Button, Input, Modal)
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.test.tsx
│   │   │   └── index.ts
│   │   └── ...
│   └── features/              # Feature-specific components
│       └── [feature]/
│           ├── ComponentName.tsx
│           └── index.ts
├── pages/                     # Route pages/views
│   └── [feature]/
│       └── PageName.tsx
├── hooks/                     # Custom React hooks
│   ├── useAuth.ts
│   └── use[Feature].ts
├── services/                  # API client functions
│   ├── api.ts                 # Base API client
│   └── [feature].service.ts
├── stores/                    # Zustand stores (client state)
│   └── [feature].store.ts
├── utils/                     # Utility functions
├── types/                     # Frontend-specific types
├── constants/                 # Frontend constants
├── App.tsx
└── main.tsx
```

## Naming Conventions

> See `docs/guidelines/NAMING_CONVENTIONS.md` for complete naming standards across all layers.

**Key points for frontend:**
- Data fields: `snake_case` (consistent from database to UI)
- Components: `PascalCase` (e.g., `UserCard`, `Button`)
- Functions/Hooks: `camelCase` (e.g., `handleSubmit`, `useAuth`)
- UI state: `camelCase` (e.g., `isLoading`, `isModalOpen`)

## Component Guidelines

### Functional Components Only
```typescript
// ✅ Use functional components with hooks
export function UserCard({ user, onSelect }: UserCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className="p-4 rounded-lg border">
      <h3>{user.name}</h3>
      {/* ... */}
    </div>
  );
}

// ❌ No class components
class UserCard extends React.Component { }
```

### Component File Structure
```typescript
// 1. Imports (external, then internal)
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui';
import { formatDate } from '@/utils';
import type { User } from '@/types';

// 2. Types/Interfaces
interface UserCardProps {
  user: User;
  onSelect: (user: User) => void;
  className?: string;
}

// 3. Component
export function UserCard({ user, onSelect, className }: UserCardProps) {
  // 3a. Hooks (in consistent order)
  const [isLoading, setIsLoading] = useState(false);
  const { data } = useQuery(/* ... */);
  
  // 3b. Derived state
  const full_name = `${user.first_name} ${user.last_name}`;
  
  // 3c. Callbacks
  const handleClick = useCallback(() => {
    onSelect(user);
  }, [user, onSelect]);
  
  // 3d. Effects
  useEffect(() => {
    // ...
  }, []);
  
  // 3e. Early returns
  if (isLoading) return <Skeleton />;
  
  // 3f. Render
  return (
    <div className={cn('p-4', className)}>
      {/* ... */}
    </div>
  );
}
```

### Props Best Practices
```typescript
// ✅ Destructure props
function Button({ children, onClick, disabled }: ButtonProps) {}

// ✅ Provide default values
function Button({ variant = 'primary', size = 'md' }: ButtonProps) {}

// ✅ Spread only when necessary (for UI primitives)
function Input({ className, ...props }: InputProps) {
  return <input className={cn('base-styles', className)} {...props} />;
}

// ❌ Avoid passing entire objects when only specific fields needed
function UserCard({ user }: { user: User }) {} // OK if using most fields
function UserName({ name }: { name: string }) {} // Better if only using name
```

## State Management

### Server State (TanStack Query)
```typescript
// ✅ Use TanStack Query for server data
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Queries
const { data, isLoading, error } = useQuery({
  queryKey: ['users', user_id],
  queryFn: () => userService.getById(user_id),
});

// Mutations
const queryClient = useQueryClient();
const mutation = useMutation({
  mutationFn: userService.update,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
  },
});
```

### Client State (Zustand)
```typescript
// ✅ Use Zustand for client-only state
// stores/ui.store.ts
import { create } from 'zustand';

interface UIStore {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));

// Usage
const { sidebarOpen, toggleSidebar } = useUIStore();
```

### When to Use What
```
TanStack Query (Server State)    Zustand (Client State)
├── API responses                ├── UI state (modals, sidebars)
├── User data                    ├── Form drafts (unsaved)
├── Lists, search results        ├── User preferences (theme)
└── Anything from the server     └── Ephemeral state
```

## TypeScript Guidelines

### Strict Types
```typescript
// ✅ Enable strict mode in tsconfig.json
// ✅ Avoid `any` - use `unknown` if type is truly unknown

// ❌ Bad
const data: any = await fetchData();

// ✅ Good
const data: unknown = await fetchData();
if (isUser(data)) {
  console.log(data.name); // Type-safe
}
```

### Type Imports
```typescript
// ✅ Use `type` keyword for type-only imports
import type { User, Order } from '@/types';
import { formatDate } from '@/utils';
```

### Utility Types
```typescript
// ✅ Use TypeScript utility types
type UserPreview = Pick<User, 'id' | 'name' | 'avatar'>;
type UserUpdate = Partial<User>;
type RequiredUser = Required<User>;
type UserWithoutPassword = Omit<User, 'password'>;
```

## Styling with Tailwind

### Class Organization
```tsx
// ✅ Order: layout → sizing → spacing → typography → colors → effects
<div className="
  flex flex-col              {/* Layout */}
  w-full max-w-md            {/* Sizing */}
  p-4 mt-2                   {/* Spacing */}
  text-sm font-medium        {/* Typography */}
  bg-card text-card-foreground  {/* Colors - theme aware */}
  rounded-lg shadow-md       {/* Effects */}
">
```

### Conditional Classes
```tsx
// ✅ Use clsx or cn utility
import { cn } from '@/utils';

<button
  className={cn(
    'px-4 py-2 rounded transition-colors',
    variant === 'primary' && 'bg-primary text-primary-foreground hover:bg-primary/90',
    variant === 'secondary' && 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    disabled && 'opacity-50 cursor-not-allowed'
  )}
/>
```

### Responsive Design
```tsx
// ✅ Mobile-first approach
<div className="
  flex flex-col         {/* Mobile: stack */}
  md:flex-row           {/* Tablet+: row */}
  lg:gap-8              {/* Desktop: more gap */}
">
```

### Theme-Aware Colors
```tsx
// ✅ Use CSS variable classes for theme support
<div className="bg-background text-foreground" />     // Main surfaces
<div className="bg-card text-card-foreground" />      // Cards
<div className="bg-muted text-muted-foreground" />    // Subtle backgrounds
<div className="border-border" />                      // Borders

// ✅ Add transition for smooth theme switching
<div className="transition-colors duration-200" />

// See UI_UX.md for complete color system
```

## Error Handling

### Error Boundaries
```typescript
// ✅ Wrap features in error boundaries
import { ErrorBoundary } from 'react-error-boundary';

<ErrorBoundary
  fallback={<ErrorFallback />}
  onError={(error) => logError(error)}
>
  <UserDashboard />
</ErrorBoundary>
```

### API Error Handling
```typescript
// ✅ Handle errors in TanStack Query
const { data, error, isError } = useQuery({
  queryKey: ['users'],
  queryFn: userService.getAll,
});

if (isError) {
  return <ErrorMessage error={error} />;
}
```

## Performance

### Memoization (Use Sparingly)
```typescript
// ✅ useMemo for expensive computations
const sortedUsers = useMemo(
  () => users.sort((a, b) => a.name.localeCompare(b.name)),
  [users]
);

// ✅ useCallback for callbacks passed to memoized children
const handleClick = useCallback(() => {
  onSelect(user);
}, [user, onSelect]);

// ❌ Don't memoize everything - has overhead
const name = useMemo(() => user.name, [user]); // Unnecessary
```

### Code Splitting
```typescript
// ✅ Lazy load routes/heavy components
const Dashboard = lazy(() => import('./pages/Dashboard'));

<Suspense fallback={<PageSkeleton />}>
  <Dashboard />
</Suspense>
```

## Logging

### Development
```typescript
// ✅ Use console methods appropriately in development
console.log('Debug info');           // General debugging
console.warn('Warning message');     // Potential issues
console.error('Error occurred', err); // Errors

// ✅ Conditional logging
if (process.env.NODE_ENV === 'development') {
  console.log('Debug:', data);
}
```

### Production
```typescript
// ✅ Use error tracking service (Sentry, LogRocket, etc.)
import * as Sentry from '@sentry/react';

// Capture exceptions
try {
  riskyOperation();
} catch (error) {
  Sentry.captureException(error);
}

// Capture custom events
Sentry.captureMessage('User completed checkout', 'info');

// Add context
Sentry.setUser({ id: user_id, email: user_email });
Sentry.setTag('feature', 'checkout');
```

### Best Practices
- Remove `console.log` before committing (use ESLint rule)
- Never log sensitive data (passwords, tokens, PII)
- Use structured logging for production debugging
- Include relevant context (user_id, action, component)

## Accessibility

### Required Practices
```tsx
// ✅ Semantic HTML
<button>Click me</button>  // Not <div onClick={}>
<nav>...</nav>             // Not <div className="nav">

// ✅ ARIA labels when needed
<button aria-label="Close dialog">
  <XIcon />
</button>

// ✅ Keyboard navigation
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
>

// ✅ Focus management
const inputRef = useRef<HTMLInputElement>(null);
useEffect(() => {
  inputRef.current?.focus();
}, []);
```

## Import Organization

```typescript
// 1. React/Next (framework)
import { useState, useEffect } from 'react';

// 2. External packages
import { useQuery } from '@tanstack/react-query';
import { clsx } from 'clsx';

// 3. Internal absolute imports
import { Button } from '@/components/ui';
import { useAuth } from '@/hooks';
import { formatDate } from '@/utils';

// 4. Types (with type keyword)
import type { User } from '@/types';

// 5. Relative imports (same feature)
import { UserAvatar } from './UserAvatar';

// 6. Styles (if any CSS modules)
import styles from './User.module.css';
```

## shadcn/ui Components

### Setup
```bash
# Initialize shadcn/ui in your project
npx shadcn@latest init

# Add components as needed
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add dialog
```

### The `cn` Utility
```typescript
// lib/utils.ts - created by shadcn/ui init
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Usage - merge Tailwind classes safely
<Button className={cn('w-full', isActive && 'bg-primary')} />
```

### Component Usage Patterns
```typescript
// Import from your components/ui folder
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

// Components are fully customizable - edit the source files directly
// Located in: components/ui/*.tsx
```

### Best Practices
- **Customize freely**: shadcn/ui components are copied to your project, not imported from a package
- **Extend variants**: Modify the component files in `components/ui/` to add project-specific variants
- **Keep consistent**: Use the same component for similar UI patterns across the app

## Related Documents

- Architecture: `docs/engineering/ARCHITECTURE.md`
- UI/UX Guidelines: `docs/guidelines/UI_UX.md`
- Testing: `docs/guidelines/TESTING.md`
