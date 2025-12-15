# Quickstart Guide: Live Poker Session Tracker

**Date**: 2025-12-12 (Updated: 2025-12-15)
**Feature Branch**: `001-poker-session-tracker`

This guide provides step-by-step instructions for setting up the development environment and running the application.

---

## Prerequisites

- **Node.js**: v20.x or later
- **Bun**: v1.x or later (primary package manager)
- **PostgreSQL**: v15.x or later (or Neon/Supabase account)
- **Git**: v2.x

### Installing Bun

```bash
# macOS, Linux, WSL
curl -fsSL https://bun.sh/install | bash

# Windows (PowerShell)
powershell -c "irm bun.sh/install.ps1 | iex"

# Verify installation
bun --version
```

---

## 1. Project Setup

### Clone and Install

```bash
# Clone the repository
git clone <repository-url> sapphire
cd sapphire

# Checkout feature branch
git checkout 001-poker-session-tracker

# Install dependencies with bun
bun install
```

### Environment Configuration

Create `.env` file from template:

```bash
cp .env.example .env
```

Required environment variables:

```env
# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/sapphire?schema=public"

# NextAuth.js
AUTH_SECRET="generate-with-openssl-rand-base64-32"
AUTH_URL="http://localhost:3000"

# OAuth Providers (optional for development)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
DISCORD_CLIENT_ID=""
DISCORD_CLIENT_SECRET=""
```

Generate AUTH_SECRET:

```bash
openssl rand -base64 32
```

---

## 2. Database Setup

### Option A: Local PostgreSQL

```bash
# Create database
createdb sapphire

# Run migrations
bun run db:migrate

# (Optional) Seed development data
bun run db:seed
```

### Option B: Neon (Cloud PostgreSQL)

1. Create account at [neon.tech](https://neon.tech)
2. Create new project
3. Copy connection string to `DATABASE_URL`
4. Run migrations:

```bash
bun run db:migrate
```

### Database Commands

```bash
# Generate migration from schema changes
bun run db:generate

# Apply migrations
bun run db:migrate

# Push schema directly (dev only)
bun run db:push

# Open Drizzle Studio (database GUI)
bun run db:studio

# Reset database (WARNING: destructive)
bun run db:reset
```

---

## 3. Running the Application

### Development Mode

```bash
# Start development server
bun run dev
```

Application will be available at: `http://localhost:3000`

### Production Build

```bash
# Build for production
bun run build

# Start production server
bun run start
```

---

## 4. PWA Setup

This project uses the **Next.js official PWA approach** (no third-party packages).

### Key Files

- `app/manifest.ts` - Web app manifest configuration
- `public/sw.js` - Service worker for caching
- `app/components/ServiceWorkerRegistration.tsx` - SW registration

### Testing PWA

1. Build for production: `bun run build`
2. Start production server: `bun run start`
3. Open Chrome DevTools → Application → Service Workers
4. Verify service worker is registered
5. Test "Add to Home Screen" functionality

---

## 5. Testing

### Unit & Integration Tests (Vitest)

```bash
# Run all tests
bun run test

# Run tests in watch mode
bun run test:watch

# Run tests with coverage
bun run test:coverage

# Run specific test file
bun run test src/server/api/routers/session.test.ts
```

### E2E Tests (Playwright)

```bash
# Install browsers (first time only)
bunx playwright install

# Run E2E tests
bun run test:e2e

# Run E2E tests with UI
bun run test:e2e:ui

# Generate E2E test from recording
bunx playwright codegen localhost:3000
```

### Test Structure

```
tests/
├── unit/                    # Unit tests
│   └── server/
│       └── api/
│           └── routers/     # tRPC router tests
├── integration/             # Integration tests
│   └── db/                  # Database tests
└── e2e/                     # End-to-end tests
    ├── auth.spec.ts         # Authentication flows
    ├── session.spec.ts      # Session recording flows
    └── ...
```

---

## 6. Project Structure

```
sapphire/
├── .env                     # Environment variables (not committed)
├── .env.example             # Environment template
├── drizzle/                 # Database migrations
│   └── migrations/
├── public/                  # Static assets
│   ├── sw.js                # Service worker (PWA)
│   └── icons/               # App icons
├── specs/                   # Feature specifications
│   └── 001-poker-session-tracker/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── manifest.ts      # PWA manifest
│   │   ├── (auth)/          # Auth-required routes
│   │   │   ├── dashboard/
│   │   │   ├── sessions/
│   │   │   ├── currencies/
│   │   │   ├── stores/
│   │   │   └── players/
│   │   ├── api/             # API routes
│   │   │   ├── auth/        # NextAuth handlers
│   │   │   └── trpc/        # tRPC handler
│   │   ├── auth/            # Auth pages (public)
│   │   │   ├── signin/
│   │   │   └── signup/
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Landing page
│   ├── components/          # Shared React components
│   │   ├── ui/              # Base UI components
│   │   ├── forms/           # Form components
│   │   └── layouts/         # Layout components
│   ├── lib/                 # Shared utilities
│   │   ├── utils.ts
│   │   └── google-maps.ts   # Google Maps URL generation
│   ├── server/              # Server-side code
│   │   ├── api/
│   │   │   ├── routers/     # tRPC routers
│   │   │   ├── schemas/     # Zod schemas
│   │   │   ├── root.ts      # Root router
│   │   │   └── trpc.ts      # tRPC setup
│   │   ├── auth.ts          # NextAuth config
│   │   └── db/
│   │       ├── index.ts     # Drizzle client
│   │       └── schema/      # Drizzle schemas
│   ├── styles/              # Global styles
│   └── trpc/                # tRPC client
│       ├── react.tsx        # React Query setup
│       └── server.ts        # Server-side caller
└── tests/                   # Test files
```

---

## 7. Development Workflow

### TDD Workflow (Required by Constitution)

1. **Write test first** (Red)
   ```bash
   # Create test file
   touch tests/unit/server/api/routers/currency.test.ts

   # Run test (should fail)
   bun run test tests/unit/server/api/routers/currency.test.ts
   ```

2. **Implement minimum code** (Green)
   ```typescript
   // Implement just enough to pass the test
   ```

3. **Refactor** (Refactor)
   ```bash
   # Ensure tests still pass
   bun run test
   ```

### Git Workflow

```bash
# Create feature branch from dev
git checkout dev
git pull
git checkout -b feature/add-session-notes

# Make changes, commit frequently
git add .
git commit -m "feat(session): add notes field to session form"

# Push and create PR
git push -u origin feature/add-session-notes
# Create PR targeting dev branch
```

### Commit Message Format

```
<type>(<scope>): <description>

Types: feat, fix, docs, style, refactor, test, chore
Scope: session, currency, store, player, auth, ui, db
```

---

## 8. Key Technologies

| Technology | Purpose | Documentation |
|------------|---------|---------------|
| Next.js 15 | React framework | [nextjs.org/docs](https://nextjs.org/docs) |
| tRPC v11 | Type-safe API | [trpc.io/docs](https://trpc.io/docs) |
| Drizzle ORM | Database ORM | [orm.drizzle.team](https://orm.drizzle.team) |
| NextAuth.js v5 | Authentication | [authjs.dev](https://authjs.dev) |
| Mantine v8 | UI components | [mantine.dev](https://mantine.dev) |
| Vitest | Unit testing | [vitest.dev](https://vitest.dev) |
| Playwright | E2E testing | [playwright.dev](https://playwright.dev) |
| Bun | Package manager & runtime | [bun.sh](https://bun.sh) |

---

## 9. Common Tasks

### Add New tRPC Router

1. Create schema: `src/server/api/schemas/newEntity.schema.ts`
2. Create router: `src/server/api/routers/newEntity.ts`
3. Add to root: `src/server/api/root.ts`
4. Write tests: `tests/unit/server/api/routers/newEntity.test.ts`

### Add New Database Table

1. Define schema: `src/server/db/schema/newEntity.ts`
2. Export from index: `src/server/db/schema/index.ts`
3. Generate migration: `bun run db:generate`
4. Apply migration: `bun run db:migrate`

### Add New Page

1. Create route: `src/app/(auth)/new-page/page.tsx`
2. Create components: `src/components/new-page/`
3. Add navigation link
4. Write E2E test: `tests/e2e/new-page.spec.ts`

### Add Session Event Type

The session event system is extensible. To add a new event type:

1. Add type to `SessionEventType` in schema
2. Define `eventData` structure
3. Add mutation in `sessionEvent` router
4. Update UI to record/display the event

---

## 10. Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
pg_isready

# Verify connection string
psql $DATABASE_URL -c "SELECT 1"
```

### Migration Errors

```bash
# Reset and re-run migrations (dev only)
bun run db:reset

# Check migration status
bun run db:studio
```

### Type Errors After Schema Changes

```bash
# Regenerate types
bun run db:generate
```

### PWA Not Installing

- Ensure HTTPS (or localhost)
- Check `app/manifest.ts` is valid
- Verify icons exist at specified paths in `public/`
- Check service worker registration in DevTools

### Bun Issues

```bash
# Clear bun cache
bun pm cache rm

# Reinstall dependencies
rm -rf node_modules bun.lockb
bun install
```

---

## 11. Useful Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "biome lint .",
    "format": "biome format --write .",
    "check": "biome check --write .",
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "test:watch": "vitest watch",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "bun run scripts/migrate.ts",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "db:seed": "bun run scripts/seed.ts",
    "db:reset": "bun run scripts/reset.ts"
  }
}
```

---

## Next Steps

1. Set up environment variables
2. Initialize database
3. Run development server
4. Create test user account
5. Start implementing features following TDD workflow
