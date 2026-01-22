# UI/UX Guidelines

> **Last Updated:** 2026-01-19
> **Design System:** shadcn/ui
> **CSS Framework:** Tailwind CSS v4

## Design Principles

### 1. Clarity Over Cleverness
- Users should immediately understand what they can do
- Clear visual hierarchy guides attention
- Explicit labels beat ambiguous icons

### 2. Consistency
- Same patterns for same actions throughout the app
- Consistent spacing, colors, and typography
- Predictable component behavior

### 3. Feedback & Responsiveness
- Every action should have visible feedback
- Loading states for async operations
- Error states with clear recovery paths

### 4. Accessibility First
- Design for all users, including those with disabilities
- Sufficient color contrast (WCAG AA minimum)
- Keyboard navigable interfaces
- Screen reader compatible

---

## Color System

shadcn/ui uses HSL color values with CSS custom properties for seamless theme switching.

### Light Mode

```css
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;

  --card: 0 0% 100%;
  --card-foreground: 240 10% 3.9%;

  --popover: 0 0% 100%;
  --popover-foreground: 240 10% 3.9%;

  --primary: 240 5.9% 10%;
  --primary-foreground: 0 0% 98%;

  --secondary: 240 4.8% 95.9%;
  --secondary-foreground: 240 5.9% 10%;

  --muted: 240 4.8% 95.9%;
  --muted-foreground: 240 3.8% 46.1%;

  --accent: 240 4.8% 95.9%;
  --accent-foreground: 240 5.9% 10%;

  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 0 0% 98%;

  --border: 240 5.9% 90%;
  --input: 240 5.9% 90%;
  --ring: 240 5.9% 10%;

  --radius: 0.5rem;
}
```

### Dark Mode

```css
.dark {
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;

  --card: 240 10% 3.9%;
  --card-foreground: 0 0% 98%;

  --popover: 240 10% 3.9%;
  --popover-foreground: 0 0% 98%;

  --primary: 0 0% 98%;
  --primary-foreground: 240 5.9% 10%;

  --secondary: 240 3.7% 15.9%;
  --secondary-foreground: 0 0% 98%;

  --muted: 240 3.7% 15.9%;
  --muted-foreground: 240 5% 64.9%;

  --accent: 240 3.7% 15.9%;
  --accent-foreground: 0 0% 98%;

  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 0 0% 98%;

  --border: 240 3.7% 15.9%;
  --input: 240 3.7% 15.9%;
  --ring: 240 4.9% 83.9%;
}
```

### Semantic Colors

Add these custom semantic colors for status indicators:

```css
:root {
  /* Success */
  --success: 142 76% 36%;
  --success-foreground: 0 0% 98%;

  /* Warning */
  --warning: 38 92% 50%;
  --warning-foreground: 0 0% 9%;

  /* Info */
  --info: 217 91% 60%;
  --info-foreground: 0 0% 98%;
}

.dark {
  --success: 142 69% 58%;
  --success-foreground: 0 0% 9%;

  --warning: 38 92% 50%;
  --warning-foreground: 0 0% 9%;

  --info: 217 91% 60%;
  --info-foreground: 0 0% 9%;
}
```

### globals.css Setup

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground;
  }
}
```

### Using Colors in Components

```tsx
// Background colors
<div className="bg-background" />      // Main background
<div className="bg-card" />            // Card background
<div className="bg-muted" />           // Muted/subtle background
<div className="bg-accent" />          // Accent background (hover states)

// Text colors
<p className="text-foreground" />      // Primary text
<p className="text-muted-foreground" /> // Secondary/muted text

// Border colors
<div className="border border-border" />
<input className="border-input" />

// Semantic colors
<div className="bg-destructive text-destructive-foreground" />
<div className="bg-success text-success-foreground" />
```

### Accessibility Requirements

- **Normal text (14px):** 4.5:1 contrast minimum
- **Large text (18px+):** 3:1 contrast minimum
- **UI components:** 3:1 contrast minimum
- Never use color alone to convey meaning

---

## Typography

### Font Stack

```css
/* UI Text - Inter */
--font-sans: 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;

/* Code - JetBrains Mono */
--font-mono: 'JetBrains Mono', ui-monospace, monospace;
```

### Type Scale

| Name | Class | Size | Weight | Use |
|------|-------|------|--------|-----|
| Display | `text-4xl font-bold` | 2.25rem | 700 | Hero sections |
| H1 | `text-3xl font-semibold` | 1.875rem | 600 | Page titles |
| H2 | `text-2xl font-semibold` | 1.5rem | 600 | Section headers |
| H3 | `text-xl font-medium` | 1.25rem | 500 | Card titles |
| H4 | `text-lg font-medium` | 1.125rem | 500 | Subsections |
| Body | `text-base` | 1rem | 400 | Default text |
| Small | `text-sm` | 0.875rem | 400 | Secondary text |
| Tiny | `text-xs` | 0.75rem | 400 | Labels, captions |

### Typography in Both Themes

```tsx
// Headings - always high contrast
<h1 className="text-3xl font-semibold text-foreground">Page Title</h1>

// Body text
<p className="text-base text-foreground">Primary content</p>

// Secondary text - reduced emphasis
<p className="text-sm text-muted-foreground">Supporting information</p>

// Code
<code className="font-mono text-sm bg-muted px-1.5 py-0.5 rounded">
  npm install
</code>
```

---

## Spacing System

Base unit: **4px**. All spacing should be multiples of 4px.

### Common Spacing Values

| Tailwind | Pixels | Use Case |
|----------|--------|----------|
| `1` | 4px | Icon gaps |
| `2` | 8px | Tight spacing, inline elements |
| `3` | 12px | Compact spacing |
| `4` | 16px | Default spacing |
| `6` | 24px | Section spacing |
| `8` | 32px | Large gaps |
| `12` | 48px | Page sections |
| `16` | 64px | Major sections |

### Component Spacing Guidelines

```tsx
// Buttons
<Button className="px-4 py-2" />        // Default
<Button className="px-3 py-1.5" />      // Small
<Button className="px-6 py-3" />        // Large

// Cards
<Card className="p-6" />                // Standard padding

// Form fields
<div className="space-y-4">             // Gap between fields
  <Input />
  <Input />
</div>

// Sections
<section className="py-12 md:py-16">    // Vertical padding
```

---

## Layout Patterns

### App Shell with Sidebar

```tsx
export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border">
        <div className="p-4 border-b border-border">
          <Logo />
        </div>
        <nav className="flex-1 p-4">
          <NavLinks />
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
```

### Header + Content Layout

```tsx
export function PageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center">
          <Navigation />
        </div>
      </header>

      <main className="container py-6">
        {children}
      </main>
    </div>
  )
}
```

### Centered Content

```tsx
// Narrow content (forms, articles)
<div className="mx-auto max-w-2xl px-4">
  {content}
</div>

// Wide content with sidebar space
<div className="mx-auto max-w-6xl px-4 md:px-8">
  {content}
</div>
```

### Grid Layouts

```tsx
// Responsive card grid
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
  {items.map(item => <Card key={item.id} />)}
</div>

// Two-column layout
<div className="grid gap-8 md:grid-cols-[2fr_1fr]">
  <main>{primaryContent}</main>
  <aside>{secondaryContent}</aside>
</div>
```

---

## Theme Switching

### ThemeProvider Setup (next-themes)

> **Note:** Despite the name, `next-themes` works with any React framework including Vite.
> For Vite projects, wrap your `<App />` in `main.tsx` instead of a layout file.

```tsx
// Next.js: app/providers.tsx
'use client'

import { ThemeProvider } from 'next-themes'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  )
}

// Vite: main.tsx
import { ThemeProvider } from 'next-themes'

createRoot(document.getElementById('root')!).render(
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <App />
  </ThemeProvider>
)
```

### Theme Toggle Component

```tsx
'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function ThemeToggle() {
  const { setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

### Smooth Theme Transitions

```css
/* Add to globals.css for smooth color transitions */
* {
  @apply transition-colors duration-200;
}

/* Disable during initial load to prevent flash */
html.no-transitions * {
  transition: none !important;
}
```

---

## shadcn/ui Component Patterns

### Button Variants

```tsx
import { Button } from '@/components/ui/button'

// Primary action
<Button>Save Changes</Button>

// Secondary action
<Button variant="secondary">Cancel</Button>

// Subtle/ghost action
<Button variant="ghost">Learn more</Button>

// Outlined
<Button variant="outline">Export</Button>

// Destructive action
<Button variant="destructive">Delete</Button>

// Link style
<Button variant="link">View documentation</Button>

// With icon
<Button>
  <PlusIcon className="mr-2 h-4 w-4" />
  Add Item
</Button>

// Icon only
<Button variant="ghost" size="icon">
  <SettingsIcon className="h-4 w-4" />
  <span className="sr-only">Settings</span>
</Button>

// Loading state
<Button disabled>
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  Saving...
</Button>
```

### Card

```tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description goes here.</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content and main information.</p>
  </CardContent>
  <CardFooter className="flex justify-between">
    <Button variant="ghost">Cancel</Button>
    <Button>Save</Button>
  </CardFooter>
</Card>
```

### Input with States

```tsx
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Basic input
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" placeholder="name@example.com" />
</div>

// With icon
<div className="relative">
  <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
  <Input className="pl-10" placeholder="Search..." />
</div>

// Error state
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input
    id="email"
    type="email"
    aria-invalid="true"
    aria-describedby="email-error"
    className="border-destructive focus-visible:ring-destructive"
  />
  <p id="email-error" className="text-sm text-destructive">
    Please enter a valid email address.
  </p>
</div>

// Disabled
<Input disabled placeholder="Disabled input" />
```

### Select

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

<Select>
  <SelectTrigger className="w-[200px]">
    <SelectValue placeholder="Select a role" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="admin">Admin</SelectItem>
    <SelectItem value="editor">Editor</SelectItem>
    <SelectItem value="viewer">Viewer</SelectItem>
  </SelectContent>
</Select>
```

### Dialog

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent className="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>Edit Profile</DialogTitle>
      <DialogDescription>
        Make changes to your profile here. Click save when you're done.
      </DialogDescription>
    </DialogHeader>
    <div className="py-4">
      {/* Form content */}
    </div>
    <DialogFooter>
      <Button type="submit">Save changes</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Sheet (Slide-out Panel)

```tsx
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

// Mobile navigation
<Sheet>
  <SheetTrigger asChild>
    <Button variant="ghost" size="icon" className="md:hidden">
      <MenuIcon className="h-5 w-5" />
    </Button>
  </SheetTrigger>
  <SheetContent side="left">
    <SheetHeader>
      <SheetTitle>Navigation</SheetTitle>
    </SheetHeader>
    <nav className="mt-6">
      <NavLinks />
    </nav>
  </SheetContent>
</Sheet>
```

### DropdownMenu

```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon">
      <UserIcon className="h-5 w-5" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuLabel>My Account</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem>Profile</DropdownMenuItem>
    <DropdownMenuItem>Settings</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem className="text-destructive">
      Sign out
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### Tooltip

```tsx
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

// Wrap app in TooltipProvider
<TooltipProvider>
  <App />
</TooltipProvider>

// Usage
<Tooltip>
  <TooltipTrigger asChild>
    <Button variant="ghost" size="icon">
      <InfoIcon className="h-4 w-4" />
    </Button>
  </TooltipTrigger>
  <TooltipContent>
    <p>More information</p>
  </TooltipContent>
</Tooltip>
```

### Skeleton

```tsx
import { Skeleton } from '@/components/ui/skeleton'

// Card loading state
<Card>
  <CardHeader>
    <Skeleton className="h-5 w-[200px]" />
    <Skeleton className="h-4 w-[150px]" />
  </CardHeader>
  <CardContent className="space-y-2">
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-2/3" />
  </CardContent>
</Card>

// Avatar loading
<Skeleton className="h-10 w-10 rounded-full" />

// Table row loading
<div className="flex items-center space-x-4">
  <Skeleton className="h-12 w-12 rounded" />
  <div className="space-y-2">
    <Skeleton className="h-4 w-[200px]" />
    <Skeleton className="h-4 w-[150px]" />
  </div>
</div>
```

### Toast (using Sonner)

```tsx
// Install: npx shadcn@latest add sonner
import { toast } from 'sonner'

// Add Toaster to app layout
import { Toaster } from '@/components/ui/sonner'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}

// Usage
toast.success('Changes saved successfully')
toast.error('Failed to save changes')
toast.warning('Your session is about to expire')
toast.info('New updates available')

// With action
toast('Item deleted', {
  action: {
    label: 'Undo',
    onClick: () => undoDelete(),
  },
})

// Promise-based
toast.promise(saveData(), {
  loading: 'Saving...',
  success: 'Saved!',
  error: 'Failed to save',
})
```

---

## Form Patterns

### Form Layout with Validation

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

const formSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
})

export function ProfileForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      name: '',
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Handle form submission
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormDescription>
                Your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="john@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Save</Button>
      </form>
    </Form>
  )
}
```

### Form Field Patterns

```tsx
// Required field indicator
<FormLabel>
  Email <span className="text-destructive">*</span>
</FormLabel>

// Input group with addon
<div className="flex">
  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
    https://
  </span>
  <Input className="rounded-l-none" placeholder="example.com" />
</div>

// Checkbox group
<FormItem className="flex items-start space-x-3 space-y-0">
  <FormControl>
    <Checkbox />
  </FormControl>
  <div className="space-y-1 leading-none">
    <FormLabel>Accept terms</FormLabel>
    <FormDescription>
      You agree to our Terms of Service.
    </FormDescription>
  </div>
</FormItem>
```

---

## Loading & Feedback States

### Loading Spinner

```tsx
import { Loader2 } from 'lucide-react'

// Inline spinner
<Loader2 className="h-4 w-4 animate-spin" />

// Centered page loader
<div className="flex h-[50vh] items-center justify-center">
  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
</div>
```

### Empty States

```tsx
import { FolderOpen } from 'lucide-react'

<div className="flex flex-col items-center justify-center py-12 text-center">
  <div className="rounded-full bg-muted p-4">
    <FolderOpen className="h-8 w-8 text-muted-foreground" />
  </div>
  <h3 className="mt-4 text-lg font-medium">No projects yet</h3>
  <p className="mt-2 text-sm text-muted-foreground max-w-sm">
    Get started by creating your first project.
  </p>
  <Button className="mt-6">
    <PlusIcon className="mr-2 h-4 w-4" />
    Create Project
  </Button>
</div>
```

### Error States

```tsx
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>
    Failed to load data. Please try again.
  </AlertDescription>
</Alert>
```

---

## Responsive Design

### Breakpoints

| Breakpoint | Width | Target |
|------------|-------|--------|
| `sm` | 640px | Large phones |
| `md` | 768px | Tablets |
| `lg` | 1024px | Laptops |
| `xl` | 1280px | Desktops |
| `2xl` | 1536px | Large screens |

### Mobile-First Approach

```tsx
// Start with mobile, enhance for larger screens
<div className="
  flex flex-col          /* Mobile: stack vertically */
  md:flex-row            /* Tablet+: horizontal */
  gap-4 md:gap-8         /* Larger gap on desktop */
">

// Hide/show based on screen size
<nav className="hidden md:flex">Desktop nav</nav>
<Sheet className="md:hidden">Mobile nav</Sheet>
```

### Responsive Patterns

```tsx
// Sidebar: overlay on mobile, persistent on desktop
<aside className="
  fixed inset-y-0 left-0 z-50 w-64 -translate-x-full   /* Mobile: hidden */
  md:relative md:translate-x-0                          /* Desktop: visible */
">

// Table: cards on mobile, table on desktop
<div className="md:hidden">
  {items.map(item => <MobileCard key={item.id} item={item} />)}
</div>
<Table className="hidden md:table">
  {/* Table content */}
</Table>

// Modal: full-screen on mobile, centered on desktop
<DialogContent className="
  h-full w-full max-h-none max-w-none rounded-none  /* Mobile */
  sm:h-auto sm:max-w-lg sm:rounded-lg               /* Desktop */
">
```

---

## Accessibility

### Focus States

```css
/* shadcn/ui default focus-visible styling */
.focus-visible:outline-none
.focus-visible:ring-2
.focus-visible:ring-ring
.focus-visible:ring-offset-2
```

### Keyboard Navigation

- **Tab**: Move between focusable elements
- **Enter/Space**: Activate buttons and links
- **Escape**: Close modals, dropdowns, popovers
- **Arrow keys**: Navigate within menus, select options

### ARIA Patterns

```tsx
// Icon-only button
<Button variant="ghost" size="icon" aria-label="Close">
  <XIcon className="h-4 w-4" aria-hidden="true" />
</Button>

// Loading state
<Button disabled aria-busy="true">
  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
  <span>Saving...</span>
</Button>

// Form with errors
<Input
  id="email"
  aria-invalid={!!errors.email}
  aria-describedby={errors.email ? 'email-error' : undefined}
/>
{errors.email && (
  <p id="email-error" role="alert" className="text-sm text-destructive">
    {errors.email.message}
  </p>
)}

// Live regions for dynamic content
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {statusMessage}
</div>
```

### Screen Reader Utilities

```tsx
// Visually hidden but accessible
<span className="sr-only">Open menu</span>

// Skip link for keyboard users
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:border"
>
  Skip to main content
</a>
```

---

## Animation Guidelines

### Timing Values

| Duration | Use Case |
|----------|----------|
| 150ms | Micro-interactions (hover, focus) |
| 200ms | Standard transitions |
| 300ms | Larger movements (modals, sheets) |
| 500ms | Complex animations |

### Tailwind Transition Classes

```tsx
// Color transitions (for theme switching)
<div className="transition-colors duration-200" />

// Transform transitions
<div className="transition-transform duration-200 hover:scale-105" />

// All properties
<div className="transition-all duration-200" />

// Specific properties
<div className="transition-opacity duration-150" />
```

### Reduced Motion

```tsx
// Respect user preference
<div className="
  transition-transform duration-200
  motion-reduce:transition-none
  motion-reduce:transform-none
">

// Alternative for reduced motion
<div className="
  animate-bounce
  motion-reduce:animate-none
">
```

### shadcn Animation Utilities

```tsx
// Accordion animation (built-in)
<AccordionContent className="data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">

// Fade in
<div className="animate-in fade-in duration-200" />

// Slide in
<div className="animate-in slide-in-from-bottom-4 duration-300" />

// Combined
<div className="animate-in fade-in slide-in-from-bottom-4 duration-300" />
```

---

## Quick Reference

### Common Component Combinations

```tsx
// Page header with actions
<div className="flex items-center justify-between">
  <div>
    <h1 className="text-2xl font-semibold">Page Title</h1>
    <p className="text-muted-foreground">Page description</p>
  </div>
  <Button>Action</Button>
</div>

// Search with filters
<div className="flex gap-4">
  <div className="relative flex-1">
    <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    <Input className="pl-10" placeholder="Search..." />
  </div>
  <Select>
    <SelectTrigger className="w-[150px]">
      <SelectValue placeholder="Filter" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All</SelectItem>
      <SelectItem value="active">Active</SelectItem>
    </SelectContent>
  </Select>
</div>

// Data table row actions
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon">
      <MoreHorizontalIcon className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem>Edit</DropdownMenuItem>
    <DropdownMenuItem>Duplicate</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

## Related Documents

- Frontend Guidelines: `docs/guidelines/frontend_guidelines.md`
- Backend Guidelines: `docs/guidelines/backend_guidelines.md`
- Testing Guidelines: `docs/guidelines/testing_guidelines.md`
- Architecture: `docs/engineering/architecture.md`
