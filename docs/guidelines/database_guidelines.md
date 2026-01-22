# Database Design Guidelines

> **Last Updated:** YYYY-MM-DD
> **Database:** PostgreSQL 15+
> **ORM:** Prisma 5.x

## Naming Conventions

> See `docs/guidelines/naming_guidelines.md` for complete naming standards across all layers.

**Key points for database:**
- Columns: `snake_case` (e.g., `user_id`, `created_at`)
- Prisma models: `PascalCase` (e.g., `User`, `Order`)
- Database tables: `snake_case` via `@@map` (e.g., `users`, `orders`)
- Indexes: `idx_[table]_[columns]` (e.g., `idx_user_email`)

### Tables
- **Singular** form: `User`, `Order`, `Product` (Prisma convention)
- **PascalCase** for model names in Prisma schema
- **snake_case** in actual database table names (via `@@map`)

### Columns
- **snake_case** everywhere (Prisma schema, database, API, frontend)
- Primary keys: `id`
- Foreign keys: `[relation]_id` (e.g., `user_id`, `order_id`)
- Timestamps: `created_at`, `updated_at`, `deleted_at`

### Indexes
- Format: `idx_[table]_[columns]`
- Example: `idx_user_email`, `idx_order_user_created`

## Common Patterns

### Base Model Fields
Every table should include:

```prisma
model BaseEntity {
  id         String   @id @default(cuid())
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt
}
```

### Soft Deletes (when needed)
```prisma
model SoftDeleteEntity {
  // ... other fields
  deleted_at DateTime?

  @@index([deleted_at])
}
```

### Enums
```prisma
enum UserRole {
  USER
  ADMIN
  MODERATOR
}

enum OrderStatus {
  PENDING
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}
```

## Schema Examples

### User Model
```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password_hash String
  name          String
  role          UserRole  @default(USER)
  avatar_url    String?
  is_verified   Boolean   @default(false)
  last_login_at DateTime?
  created_at    DateTime  @default(now())
  updated_at    DateTime  @updatedAt

  // Relations
  sessions     Session[]
  orders       Order[]

  @@map("users")
  @@index([email])
  @@index([created_at])
}
```

### One-to-Many Relationship
```prisma
model Order {
  id         String      @id @default(cuid())
  user_id    String
  status     OrderStatus @default(PENDING)
  total      Decimal     @db.Decimal(10, 2)
  created_at DateTime    @default(now())
  updated_at DateTime    @updatedAt

  // Relations
  user       User        @relation(fields: [user_id], references: [id])
  items      OrderItem[]

  @@map("orders")
  @@index([user_id])
  @@index([status])
  @@index([created_at])
}
```

### Many-to-Many Relationship
```prisma
model Product {
  id         String   @id @default(cuid())
  name       String
  // ...
  categories ProductCategory[]
  
  @@map("products")
}

model Category {
  id       String   @id @default(cuid())
  name     String   @unique
  // ...
  products ProductCategory[]
  
  @@map("categories")
}

// Explicit join table for additional fields
model ProductCategory {
  product_id  String
  category_id String
  is_primary  Boolean  @default(false)

  product     Product  @relation(fields: [product_id], references: [id])
  category    Category @relation(fields: [category_id], references: [id])

  @@id([product_id, category_id])
  @@map("product_categories")
}
```

## Data Types

### Prisma to PostgreSQL Mapping
| Prisma Type | PostgreSQL | Use Case |
|-------------|------------|----------|
| String | VARCHAR(191) | Short text |
| String @db.Text | TEXT | Long text |
| Int | INTEGER | Whole numbers |
| BigInt | BIGINT | Large numbers |
| Float | DOUBLE PRECISION | Decimals |
| Decimal | DECIMAL(p,s) | Money/precise |
| Boolean | BOOLEAN | True/false |
| DateTime | TIMESTAMP(3) | Timestamps |
| Json | JSONB | JSON data |
| Bytes | BYTEA | Binary data |

### ID Strategy
```prisma
// ✅ Recommended: CUID (sortable, no collisions)
id String @id @default(cuid())

// Alternative: UUID
id String @id @default(uuid()) @db.Uuid

// For specific cases: Auto-increment
id Int @id @default(autoincrement())
```

## Indexing Strategy

### When to Create Indexes
- ✅ Foreign keys (automatic in some DBs, explicit in others)
- ✅ Fields used in WHERE clauses
- ✅ Fields used in ORDER BY
- ✅ Fields used in JOIN conditions
- ✅ Unique constraints

### When NOT to Create Indexes
- ❌ Rarely queried fields
- ❌ Fields with low cardinality (few unique values)
- ❌ Frequently updated fields (high write cost)
- ❌ Small tables (< 1000 rows)

### Composite Indexes
```prisma
model Order {
  // ...

  // For queries like: WHERE user_id = ? ORDER BY created_at DESC
  @@index([user_id, created_at(sort: Desc)])

  // For queries like: WHERE status = ? AND created_at > ?
  @@index([status, created_at])
}
```

## Query Patterns

### Efficient Pagination
```typescript
// ✅ Cursor-based (efficient for large datasets)
const orders = await prisma.order.findMany({
  take: 20,
  skip: 1, // Skip the cursor
  cursor: { id: last_order_id },
  orderBy: { created_at: 'desc' },
});

// ⚠️ Offset-based (slower for large offsets)
const orders = await prisma.order.findMany({
  take: 20,
  skip: (page - 1) * 20,
});
```

### Selecting Only Needed Fields
```typescript
// ✅ Select specific fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    email: true,
  },
});

// ❌ Avoid selecting everything when not needed
const users = await prisma.user.findMany(); // Returns all fields
```

### Including Relations
```typescript
// ✅ Include only needed relations
const order = await prisma.order.findUnique({
  where: { id: order_id },
  include: {
    user: {
      select: { id: true, name: true }, // Only needed user fields
    },
    items: true,
  },
});
```

### Transactions
```typescript
// For operations that must succeed or fail together
const result = await prisma.$transaction(async (tx) => {
  const order = await tx.order.create({ data: order_data });

  await tx.orderItem.createMany({
    data: items.map(item => ({
      order_id: order.id,
      ...item,
    })),
  });

  await tx.inventory.updateMany({
    // Update inventory...
  });

  return order;
});
```

## Performance Optimization

### Query Optimization
- Use `EXPLAIN ANALYZE` to understand query plans
- Add missing indexes based on slow query log
- Avoid N+1 queries (use `include` or batch queries)

### Connection Pooling
```typescript
// In prisma client setup
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pool settings via URL params
});

// DATABASE_URL should include:
// ?connection_limit=20&pool_timeout=10
```

### Caching Strategy
```
1. Query Redis cache first
2. If miss, query database
3. Store result in Redis with TTL
4. Invalidate cache on writes
```

## Security

### Data Encryption
- Passwords: bcrypt/argon2 hashed (never plain text)
- Sensitive data: Encrypt at application level
- SSL/TLS: Always enabled for connections

### Access Control
```typescript
// Always filter by user context
const orders = await prisma.order.findMany({
  where: {
    user_id: current_user.id, // ✅ Always scope to user
    // ...other filters
  },
});
```

## Database Policies

### Schema Changes
- All changes via migrations (no manual changes)
- Migrations tested on staging first
- Backward-compatible when possible
- Rollback plan documented for breaking changes
- Index changes reviewed for performance impact

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

## Related Documents

- Architecture: `docs/engineering/architecture.md`
- API Design: `docs/engineering/api-spec.md`
- Backend Guidelines: `docs/guidelines/backend_guidelines.md`
