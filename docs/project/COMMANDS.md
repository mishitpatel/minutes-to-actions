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

See `docs/engineering/API_DESIGN.md` for setup instructions.

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

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process on port
kill -9 $(lsof -t -i:3000)

# Or use npx to find and kill
npx kill-port 3000
```

### Node Modules Issues

```bash
# Nuclear option: remove all node_modules and reinstall
rm -rf node_modules apps/*/node_modules packages/*/node_modules pnpm-lock.yaml
pnpm install

# Clear pnpm cache if issues persist
pnpm store prune
```

### Database Issues (Prisma)

```bash
# Reset database (WARNING: destroys all data)
pnpm --filter api prisma migrate reset

# Regenerate Prisma client
pnpm --filter api prisma generate

# Force push schema (skip migrations, development only)
pnpm --filter api prisma db push --force-reset
```

### Redis Connection Failed

```bash
# Check if Redis is running
redis-cli ping

# Start Redis (macOS with Homebrew)
brew services start redis

# Start Redis (Docker)
docker run -d -p 6379:6379 redis:alpine
```

### TypeScript Errors After Pulling

```bash
# Rebuild all packages
pnpm build

# Or just regenerate types
pnpm --filter shared build
pnpm --filter api prisma generate
```

### pnpm Workspace Errors

```bash
# "Cannot find module" in workspace
pnpm install

# Rebuild symlinks
pnpm install --force

# Check workspace configuration
cat pnpm-workspace.yaml
```

### Docker Issues

```bash
# Containers not starting
docker-compose down -v
docker-compose up --build

# Clear all Docker data (WARNING: removes all containers/images)
docker system prune -a --volumes
```

## Related Documents

- GitHub Workflow: `docs/project/GITHUB_WORKFLOW.md`
- Backend Guidelines: `docs/guidelines/BACKEND.md`
- Frontend Guidelines: `docs/guidelines/FRONTEND.md`
