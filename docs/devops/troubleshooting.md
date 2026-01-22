# Troubleshooting

> Common issues and their solutions.

## Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process on port
kill -9 $(lsof -t -i:3000)

# Or use npx to find and kill
npx kill-port 3000
```

## Node Modules Issues

```bash
# Nuclear option: remove all node_modules and reinstall
rm -rf node_modules apps/*/node_modules packages/*/node_modules pnpm-lock.yaml
pnpm install

# Clear pnpm cache if issues persist
pnpm store prune
```

## Database Issues (Prisma)

```bash
# Reset database (WARNING: destroys all data)
pnpm --filter api prisma migrate reset

# Regenerate Prisma client
pnpm --filter api prisma generate

# Force push schema (skip migrations, development only)
pnpm --filter api prisma db push --force-reset
```

## Redis Connection Failed

```bash
# Check if Redis is running
redis-cli ping

# Start Redis (macOS with Homebrew)
brew services start redis

# Start Redis (Docker)
docker run -d -p 6379:6379 redis:alpine
```

## TypeScript Errors After Pulling

```bash
# Rebuild all packages
pnpm build

# Or just regenerate types
pnpm --filter shared build
pnpm --filter api prisma generate
```

## pnpm Workspace Errors

```bash
# "Cannot find module" in workspace
pnpm install

# Rebuild symlinks
pnpm install --force

# Check workspace configuration
cat pnpm-workspace.yaml
```

## Docker Issues

```bash
# Containers not starting
docker-compose down -v
docker-compose up --build

# Clear all Docker data (WARNING: removes all containers/images)
docker system prune -a --volumes
```

## Auth Troubleshooting

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

## Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `EADDRINUSE` | Port already in use | Kill process on port |
| `Cannot find module` | Missing dependency | Run `pnpm install` |
| `P1001: Can't reach database` | DB not running | Start PostgreSQL |
| `ECONNREFUSED 127.0.0.1:6379` | Redis not running | Start Redis |
| `Invalid token` | Expired/bad JWT | Clear cookies, re-login |

## Related Documents

- Commands Reference: `docs/devops/commands.md`
- Backend Guidelines: `docs/guidelines/backend_guidelines.md`
- Frontend Guidelines: `docs/guidelines/frontend_guidelines.md`
