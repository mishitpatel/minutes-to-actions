# Naming Conventions

> **Last Updated:** YYYY-MM-DD
> Single source of truth for naming across all layers.

## Core Principle

**Data fields use snake_case consistently across all layers** - no transformation needed:

```
Database  →  Backend  →  API  →  Frontend
user_id      user_id     user_id   user_id
created_at   created_at  created_at created_at
```

## Casing Summary

| Context | Convention | Example |
|---------|------------|---------|
| Data fields (all layers) | snake_case | `user_id`, `created_at`, `is_active` |
| Components (React) | PascalCase | `UserProfile`, `Button`, `OrderCard` |
| Classes/Models | PascalCase | `User`, `OrderService`, `UserCard` |
| Functions/Hooks | camelCase | `getUserById()`, `handleSubmit()`, `useAuth()` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRIES`, `API_URL`, `JWT_EXPIRY` |
| URL paths | kebab-case | `/order-items`, `/user-profiles` |
| Query params | snake_case | `?sort_by=created_at&user_id=123` |

## By Context

### Data Fields (snake_case)

Used everywhere data is represented - database, backend, API responses, frontend state:

```typescript
// All layers use the same names
const user = {
  user_id: '123',
  first_name: 'John',
  created_at: '2024-01-15T10:30:00Z',
  is_active: true,
  total_items: 150
};
```

### UI State vs Data Fields

```typescript
// snake_case for data from API/database
const user_id = '123';
const created_at = new Date();
const is_verified = true;

// camelCase for UI-only state (not persisted)
const isLoading = true;       // UI loading state
const isModalOpen = false;    // UI visibility
const hasError = true;        // UI error state
```

### Components (PascalCase)

```typescript
// React components
export function UserProfile() {}
export const UserCard = () => {}
export function OrderItemList() {}

// Component files
UserProfile.tsx
UserCard.tsx
OrderItemList.tsx
```

### Props & Types (PascalCase)

```typescript
// Interface names
interface UserCardProps {}
interface OrderResponse {}
type UserRole = 'admin' | 'user';

// Use ComponentName + Props suffix
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  onClick: () => void;
}
```

### Functions & Hooks (camelCase)

```typescript
// Functions
function getUserById() {}
async function createOrder() {}
function handleSubmit() {}
function formatCurrency() {}

// Hooks (use prefix)
function useAuth() {}
function useUserData() {}
function useOrderStatus() {}
```

### Constants (UPPER_SNAKE_CASE)

```typescript
const MAX_RETRIES = 3;
const API_BASE_URL = '/api/v1';
const JWT_EXPIRY_SECONDS = 3600;
const DEFAULT_PAGE_SIZE = 20;
```

### Files & Folders

| Type | Convention | Example |
|------|------------|---------|
| React components | PascalCase | `UserCard.tsx`, `Button.tsx` |
| Hooks | camelCase | `useAuth.ts`, `useUser.ts` |
| Utils/helpers | camelCase | `formatDate.ts`, `helpers.ts` |
| Services | camelCase | `user.service.ts`, `api.ts` |
| Backend modules | camelCase | `users.handler.ts`, `users.routes.ts` |
| Types | camelCase | `user.ts`, `order.ts` |
| Tests | Match source + `.test` | `Button.test.tsx`, `users.handler.test.ts` |

### URL Paths (kebab-case)

```
/users
/users/123
/order-items
/user-profiles
/api/v1/shopping-cart
```

### Database

| Element | Convention | Example |
|---------|------------|---------|
| Tables (Prisma model) | PascalCase | `User`, `Order`, `OrderItem` |
| Tables (database) | snake_case | `users`, `orders`, `order_items` |
| Columns | snake_case | `user_id`, `created_at`, `is_active` |
| Foreign keys | snake_case | `user_id`, `order_id` |
| Indexes | snake_case | `idx_user_email`, `idx_order_created` |

## Anti-Patterns

```typescript
// Data fields
user_id = '123';         // snake_case
userId = '123';          // Don't use camelCase for data
UserID = '123';          // Don't use PascalCase for data

// Components
UserCard                  // PascalCase
userCard                  // Don't use camelCase
user_card                 // Don't use snake_case

// Functions
getUserById()             // camelCase
GetUserById()             // Don't use PascalCase
get_user_by_id()          // Don't use snake_case

// Files
UserCard.tsx              // PascalCase for components
userCard.tsx              // Not this
user-card.tsx             // Not this
```

## Related Documents

- Frontend Guidelines: `docs/guidelines/FRONTEND.md`
- Backend Guidelines: `docs/guidelines/BACKEND.md`
- API Design: `docs/engineering/API_DESIGN.md`
- Database Design: `docs/engineering/DATABASE.md`
