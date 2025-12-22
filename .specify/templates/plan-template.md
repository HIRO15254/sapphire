# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  This project uses a fixed T3 Stack. The values below are pre-filled per constitution.
  Only update fields marked [FEATURE-SPECIFIC] based on feature requirements.
-->

**Language/Version**: TypeScript (strict mode)
**Framework**: T3 Stack (Next.js, tRPC, Drizzle ORM, NextAuth.js)
**UI Library**: Mantine v8
**Storage**: Drizzle ORM (cloud persistence required per constitution)
**Testing**: Vitest (unit/integration), Playwright (E2E)
**Target Platform**: Web (Next.js App Router)
**Performance Goals**: [FEATURE-SPECIFIC or N/A]
**Constraints**: [FEATURE-SPECIFIC or N/A]
**Scale/Scope**: [FEATURE-SPECIFIC or N/A]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| Technology Stack | Uses T3 Stack (Next.js, tRPC, Drizzle, NextAuth) + Mantine v8 | ☐ |
| Architecture | Follows 3-layer structure (Presentation → Application → Infrastructure) | ☐ |
| Dependency Direction | Upper layers depend only on lower layers; no reverse dependencies | ☐ |
| Data Fetching | Server Components use tRPC server API; Client Components receive data via props | ☐ |
| Data Mutations | Uses Server Actions with entity-based cache invalidation (revalidateTag) | ☐ |
| Module Independence | Feature is self-contained; external service failures isolated | ☐ |
| TDD Compliance | Tests written first; Red-Green-Refactor cycle planned | ☐ |
| Language Rules | UI text in Japanese; identifiers in English | ☐ |
| Data Persistence | User data persists to cloud; multi-device sync supported | ☐ |
| UI/UX | Follows Mantine defaults; no custom design tokens | ☐ |
| Git Workflow | Feature branch from dev; PR required; review mandatory | ☐ |

**Instructions**: Mark each gate with ✅ (pass), ❌ (fail), or ⚠️ (needs justification).
If any gate fails, document in Complexity Tracking section below with justification.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

<!--
  T3 Stack project structure per constitution.
  Expand with feature-specific paths as needed.
-->

```text
src/
├── app/                    # Next.js App Router (Presentation Layer)
│   ├── (auth)/             # Auth-required routes
│   │   ├── page.tsx        # Server Component (data fetching)
│   │   ├── XxxContent.tsx  # Client Component (UI rendering)
│   │   └── actions.ts      # Server Actions (mutations)
│   ├── api/                # API routes (tRPC adapter)
│   └── _components/        # Page-specific components
├── components/             # Shared React components (Presentation Layer)
├── server/                 # Server-side code (Application + Infrastructure)
│   ├── api/
│   │   ├── routers/        # tRPC routers (Application Layer - data queries)
│   │   └── root.ts         # Root router
│   ├── db/                 # Drizzle schema & queries (Infrastructure Layer)
│   │   ├── schema/
│   │   └── index.ts
│   └── auth.ts             # NextAuth config
├── lib/                    # Shared utilities
├── styles/                 # Global styles (Mantine theme)
└── trpc/                   # tRPC client setup

tests/
├── unit/                   # Vitest unit tests
├── integration/            # Vitest integration tests
└── e2e/                    # Playwright E2E tests
```

**Structure Decision**: T3 Stack monolith with App Router.
Presentation layer in `src/app/` and `src/components/`.
- Server Components (page.tsx) fetch data via tRPC server API
- Client Components (XxxContent.tsx) handle UI and receive data via props
- Server Actions (actions.ts) handle mutations with entity-based cache tags
Application layer in `src/server/api/routers/`.
Infrastructure layer in `src/server/db/`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
