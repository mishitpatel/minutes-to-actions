# Minutes to Actions

Paste meeting notes, extract action-items, manage them on a Kanban board, and share a read-only board link.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 20.0.0
- **pnpm** >= 9.0.0
- **Docker** & **Docker Compose**
- **Git**

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/mishitpatel/minutes-to-actions.git
cd minutes-to-actions
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Start database services

```bash
docker-compose up -d
```

This starts:
- PostgreSQL 15 on port 5432
- Redis 7 on port 6379

### 4. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and configure the required variables (see [Environment Variables](#environment-variables) below).

### 5. Run database migrations

```bash
pnpm db:migrate
```

### 6. Start development servers

```bash
pnpm dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/docs

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Works with docker-compose |
| `REDIS_URL` | Redis connection string | Works with docker-compose |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | **Required** - see setup below |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | **Required** - see setup below |
| `GOOGLE_CALLBACK_URL` | OAuth callback URL | `http://localhost:3000/api/v1/auth/google/callback` |
| `SESSION_SECRET` | Session encryption key (min 32 chars) | **Required** - generate random string |
| `API_URL` | Backend API URL | `http://localhost:3000` |
| `WEB_URL` | Frontend URL | `http://localhost:5173` |
| `VITE_API_URL` | API URL for frontend | `http://localhost:3000/api/v1` |
| `NODE_ENV` | Environment mode | `development` |

## Google OAuth Setup

To enable authentication, you need to configure Google OAuth:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Select **Web application** as the application type
6. Add authorized redirect URI: `http://localhost:3000/api/v1/auth/google/callback`
7. Copy the **Client ID** and **Client Secret** to your `.env` file

## Verify Setup

After completing the installation, verify everything is working:

```bash
# Check Docker containers are running
docker-compose ps

# Check database connection
pnpm db:studio

# Run tests
pnpm test

# Check linting
pnpm lint
```

## Common Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start frontend and backend in development mode |
| `pnpm build` | Build for production |
| `pnpm test` | Run all tests |
| `pnpm lint` | Check code quality |
| `pnpm format` | Format code with Prettier |
| `pnpm db:migrate` | Run database migrations |
| `pnpm db:studio` | Open Prisma Studio (database GUI) |
| `pnpm db:generate` | Regenerate Prisma client |

## Project Structure

```
apps/
├── web/                  # React frontend (Vite + TypeScript)
└── api/                  # Node.js backend (Fastify)
packages/
└── shared/               # Shared types, utilities, constants
docs/                     # Documentation
```

## License

Private
