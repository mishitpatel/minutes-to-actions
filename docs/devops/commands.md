# Frequently Used Commands

> Quick reference for common development tasks

## Development

### Start Development Environment
```bash
# Start all services (frontend + backend + db)
pnpm dev

# Start frontend only
pnpm --filter web dev

# Start backend only
pnpm --filter api dev

# Start with specific port
PORT=4000 pnpm --filter api dev
```

### Install Dependencies
```bash
# Install all dependencies
pnpm install

# Add dependency to specific workspace
pnpm --filter web add react-hook-form
pnpm --filter api add zod

# Add dev dependency
pnpm --filter web add -D @types/node

# Add to shared package
pnpm --filter shared add zod
```

## Database

### Prisma Commands
```bash
# Generate Prisma Client (after schema changes)
pnpm --filter api prisma generate

# Create migration
pnpm --filter api prisma migrate dev --name add_user_table

# Apply migrations (production)
pnpm --filter api prisma migrate deploy

# Reset database (development only!)
pnpm --filter api prisma migrate reset

# Open Prisma Studio (GUI)
pnpm --filter api prisma studio

# Push schema without migration (prototyping)
pnpm --filter api prisma db push

# Seed database
pnpm --filter api prisma db seed
```

### Database Connection
```bash
# Connect to local PostgreSQL
psql postgresql://user:password@localhost:5432/mydb

# Connect via Docker
docker exec -it postgres psql -U postgres -d mydb
```

## Testing

### Run Tests
```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run specific test file
pnpm test user.service.test.ts

# Run tests with coverage
pnpm test:coverage

# Run tests matching pattern
pnpm test -t "should create user"

# Run E2E tests
pnpm test:e2e

# Run E2E in UI mode (Playwright)
pnpm test:e2e:ui
```

### Test Debugging
```bash
# Run single test in debug mode
pnpm test --inspect-brk user.service.test.ts

# Run with verbose output
pnpm test --reporter=verbose
```

## Linting & Formatting

### Run Linters
```bash
# Run ESLint
pnpm lint

# Fix auto-fixable issues
pnpm lint:fix

# Run on specific workspace
pnpm --filter web lint

# Run type checking
pnpm typecheck
```

### Format Code
```bash
# Format all files with Prettier
pnpm format

# Check formatting without fixing
pnpm format:check
```

## Building

### Build Projects
```bash
# Build all workspaces
pnpm build

# Build specific workspace
pnpm --filter web build
pnpm --filter api build

# Build with source maps
pnpm --filter api build --sourcemap

# Analyze bundle size (frontend)
pnpm --filter web build --analyze
```

### Clean Build Artifacts
```bash
# Clean all build artifacts
pnpm clean

# Clean node_modules
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm install
```

## Docker

### Local Development
```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# Start specific service
docker-compose up postgres redis

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Rebuild containers
docker-compose build --no-cache
docker-compose up
```

### Container Management
```bash
# View logs
docker-compose logs -f api
docker-compose logs -f web

# Execute command in container
docker-compose exec api sh
docker-compose exec postgres psql -U postgres

# View running containers
docker ps

# Restart specific service
docker-compose restart api
```

## Git

### Daily Workflow
```bash
# Create feature branch
git checkout main
git pull origin main
git checkout -b feature/new-feature

# Stage and commit
git add .
git commit -m "feat(scope): description"

# Push branch
git push -u origin feature/new-feature

# Update branch with main
git fetch origin
git rebase origin/main
```

### Useful Git Commands
```bash
# Undo last commit (keep changes)
git reset --soft HEAD~1

# Amend last commit message
git commit --amend -m "new message"

# Stash changes
git stash
git stash pop

# View recent commits
git log --oneline -10

# View all branches
git branch -a

# Delete merged branches
git branch --merged | grep -v main | xargs git branch -d

# Interactive rebase (squash commits)
git rebase -i HEAD~3
```

## Environment Variables

### Managing .env Files
```bash
# Copy example env file
cp .env.example .env

# Verify env vars are loaded
node -e "console.log(process.env.DATABASE_URL)"

# Generate secret key
openssl rand -base64 32
```

## API Documentation

### Access Interactive Docs
```bash
# Start dev server and open API docs in browser
pnpm dev
open http://localhost:3000/docs
```

See `docs/engineering/api-spec.md` for setup instructions.

## API Testing

### cURL Commands
```bash
# GET request
curl http://localhost:3000/api/users

# POST request with JSON
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "name": "Test"}'

# With auth header
curl http://localhost:3000/api/users \
  -H "Authorization: Bearer <token>"

# Pretty print JSON response
curl http://localhost:3000/api/users | jq
```

### HTTPie (alternative to cURL)
```bash
# GET
http :3000/api/users

# POST
http POST :3000/api/users email=test@example.com name=Test

# With auth
http :3000/api/users Authorization:"Bearer <token>"
```

## Authentication

### First Time Setup
```bash
# 1. Start PostgreSQL and Redis
docker-compose up -d

# 2. Setup environment
cp .env.example .env
# Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET

# 3. Run database migrations
pnpm db:migrate

# 4. Start dev servers
pnpm dev
```

### Test Auth Endpoints
```bash
# Health check
curl http://localhost:3000/health

# Get current user (returns 401 without session)
curl http://localhost:3000/auth/me

# Google OAuth URL (redirects to Google)
# Open in browser: http://localhost:3000/auth/google
```

### Browser Testing Flow
1. Open http://localhost:5173
2. Should redirect to /login
3. Click "Sign in with Google"
4. Complete Google auth
5. Should land on dashboard
6. Click "Sign out" to test logout

### Auth Troubleshooting

```bash
# Check if session cookie is set
curl -v http://localhost:3000/auth/me 2>&1 | grep -i cookie

# Verify Google OAuth callback URL is configured
# Must match: http://localhost:3000/auth/google/callback

# Check Redis session store
redis-cli KEYS "sess:*"

# Clear all sessions (development only)
redis-cli FLUSHDB
```

## Debugging

### Node.js Debugging
```bash
# Start with debugger
node --inspect-brk dist/server.js

# Then open: chrome://inspect

# Debug with VS Code
# Add breakpoint, press F5 with launch.json configured
```

### React DevTools
```
# Install browser extension
# React DevTools for Chrome/Firefox
# Then press F12 and navigate to React/Components tab
```

## Performance

### Profiling
```bash
# Node.js CPU profile
node --prof dist/server.js
node --prof-process isolate-*.log > profile.txt

# Memory usage
node --expose-gc --inspect dist/server.js
```

### Bundle Analysis
```bash
# Vite bundle analyzer
pnpm --filter web build --analyze

# Webpack (if using)
npx webpack-bundle-analyzer dist/stats.json
```

## Misc Utilities

### Generate UUIDs
```bash
# macOS/Linux
uuidgen

# Node.js
node -e "console.log(crypto.randomUUID())"
```

### Port Management
```bash
# Find process using port
lsof -i :3000

# Kill process on port
kill -9 $(lsof -t -i:3000)
```

### System Info
```bash
# Node version
node -v

# pnpm version
pnpm -v

# Check all installed versions
pnpm list --depth=0
```

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│                    DAILY COMMANDS                           │
├─────────────────────────────────────────────────────────────┤
│  pnpm dev              Start development                    │
│  pnpm test             Run tests                            │
│  pnpm lint             Check code quality                   │
│  pnpm build            Build for production                 │
├─────────────────────────────────────────────────────────────┤
│                    DATABASE                                 │
├─────────────────────────────────────────────────────────────┤
│  prisma generate       Generate client                      │
│  prisma migrate dev    Create migration                     │
│  prisma studio         Open GUI                             │
├─────────────────────────────────────────────────────────────┤
│                    GIT                                      │
├─────────────────────────────────────────────────────────────┤
│  git checkout -b       Create branch                        │
│  git rebase origin/main  Update branch                      │
│  git reset --soft HEAD~1  Undo commit                       │
└─────────────────────────────────────────────────────────────┘
```

## Related Documents

- Troubleshooting: `docs/devops/troubleshooting.md`
- GitHub Workflow: `docs/devops/github-workflow.md`
- Backend Guidelines: `docs/guidelines/backend_guidelines.md`
- Frontend Guidelines: `docs/guidelines/frontend_guidelines.md`
