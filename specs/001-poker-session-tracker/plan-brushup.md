# Implementation Plan: MVP Brushup

**Branch**: `001-poker-session-tracker` | **Date**: 2025-12-29 | **Spec**: [spec-brushup.md](./spec-brushup.md)
**Input**: Feature specification from `specs/001-poker-session-tracker/spec-brushup.md`

## Summary

This plan covers the MVP brushup phase focusing on four key areas:
1. **Test Coverage Verification** - Ensure all MVP features have comprehensive test coverage
2. **File Granularity Optimization** - Split large files (>400 lines) into maintainable modules
3. **React Cosmos Introduction** - Set up component development environment with fixtures
4. **UI Brushup** - Ensure consistent spacing, typography, and component styling

## Technical Context

**Language/Version**: TypeScript (strict mode)
**Framework**: T3 Stack (Next.js 15, tRPC v11, Drizzle ORM, NextAuth.js v5)
**UI Library**: Mantine v8
**Storage**: Drizzle ORM with PostgreSQL
**Testing**: Vitest (unit/integration), Playwright (E2E)
**Target Platform**: Web (Next.js App Router)
**Performance Goals**: N/A (refactoring scope)
**Constraints**: File size limit of 400 lines for AI context optimization
**Scale/Scope**: Existing MVP codebase (Phases 1-6 complete)

### Additional Tools for Brushup

**Component Development**: React Cosmos 6.x (Next.js compatible)
**Test Coverage**: Vitest coverage reporter (v8/istanbul)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| Technology Stack | Uses T3 Stack (Next.js, tRPC, Drizzle, NextAuth) + Mantine v8 | ✅ |
| Architecture | Follows 3-layer structure (Presentation → Application → Infrastructure) | ✅ |
| Dependency Direction | Upper layers depend only on lower layers; no reverse dependencies | ✅ |
| Data Fetching | Server Components use tRPC server API; Client Components receive data via props | ✅ |
| Data Mutations | Uses Server Actions with entity-based cache invalidation (revalidateTag) | ✅ |
| Module Independence | Feature is self-contained; external service failures isolated | ✅ |
| TDD Compliance | Tests written first; Red-Green-Refactor cycle planned | ⚠️ |
| Language Rules | UI text in Japanese; identifiers in English | ✅ |
| Data Persistence | User data persists to cloud; multi-device sync supported | ✅ |
| UI/UX | Follows Mantine defaults; no custom design tokens | ✅ |
| Git Workflow | Feature branch from dev; PR required; review mandatory | ✅ |

**Note on TDD Compliance**: This is a refactoring/brushup phase. TDD applies to any new test additions, but the primary focus is verifying existing tests pass and ensuring coverage of existing functionality. File splitting should not require new tests if behavior is unchanged.

## Project Structure

### Documentation (this feature)

```text
specs/001-poker-session-tracker/
├── spec-brushup.md          # Brushup specification
├── plan-brushup.md          # This file
├── research-brushup.md      # Research output
├── quickstart-brushup.md    # Brushup workflow guide
└── checklists/
    └── requirements-brushup.md  # Quality checklist
```

### Files Requiring Refactoring

```text
# Priority 1: Critical (>600 lines)
src/app/(main)/stores/[id]/StoreDetailContent.tsx    # 2406 lines → split into ~6-8 files
src/app/(main)/stores/actions.ts                      # 986 lines → split by entity
src/app/(main)/sessions/[id]/SessionDetailContent.tsx # 789 lines → split into ~3-4 files
src/server/api/routers/currency.ts                    # 689 lines → split queries/mutations
src/app/(main)/currencies/[id]/CurrencyDetailContent.tsx # 598 lines → split into ~3 files

# Priority 2: Above threshold (400-500 lines)
src/server/api/routers/tournament.ts                  # 481 lines → split queries/mutations
src/app/(main)/currencies/actions.ts                  # 416 lines → split by action type
src/app/(main)/sessions/[id]/edit/EditSessionContent.tsx # 401 lines → extract forms
```

### React Cosmos Structure

```text
src/
├── components/
│   ├── layouts/
│   │   ├── AppShell.tsx
│   │   └── __fixtures__/
│   │       └── AppShell.fixture.tsx
│   ├── ui/
│   │   ├── ThemeToggle.tsx
│   │   ├── LoadingOverlay.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── GoogleMapsLink.tsx
│   │   └── __fixtures__/
│   │       ├── ThemeToggle.fixture.tsx
│   │       ├── LoadingOverlay.fixture.tsx
│   │       ├── ErrorBoundary.fixture.tsx
│   │       └── GoogleMapsLink.fixture.tsx
│   └── auth/
│       ├── SignOutButton.tsx
│       └── __fixtures__/
│           └── SignOutButton.fixture.tsx
└── cosmos.decorator.tsx          # Global decorator with Mantine provider
cosmos.config.ts                  # Root config
```

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |

No constitution violations are anticipated for this brushup phase. All work maintains existing architecture patterns.

## Phase 0: Research Summary

### R1: React Cosmos + Next.js 15 Integration

**Decision**: Use React Cosmos 6.x with Next.js plugin
**Rationale**: Official Next.js support, works with App Router, supports Mantine v8
**Alternatives**:
- Storybook (heavier, more complex setup)
- Ladle (less mature ecosystem)

### R2: File Splitting Patterns for Large Components

**Decision**: Extract by responsibility (forms, tables, modals, sections)
**Rationale**: Maintains single responsibility principle, enables parallel development
**Patterns**:
- Forms → `XxxForm.tsx`
- Tables → `XxxTable.tsx`
- Modals → `XxxModal.tsx`
- Sections → `XxxSection.tsx`
- Types → `types.ts` or `XxxContent.types.ts`

### R3: Router File Splitting Strategy

**Decision**: Split by operation type (queries.ts, mutations.ts) or entity sub-group
**Rationale**: tRPC supports `mergeRouters` for composition
**Pattern**:
```text
src/server/api/routers/
├── currency/
│   ├── index.ts        # exports merged router
│   ├── queries.ts      # list, getById, getBalance
│   └── mutations.ts    # create, update, delete, addBonus, addPurchase
```

### R4: Server Actions File Splitting Strategy

**Decision**: Split by entity or action category
**Rationale**: Maintains colocated structure, reduces file size
**Pattern**:
```text
src/app/(main)/stores/
├── actions/
│   ├── index.ts        # re-exports all actions
│   ├── store.ts        # createStore, updateStore, deleteStore
│   ├── cashGame.ts     # createCashGame, updateCashGame, deleteCashGame
│   └── tournament.ts   # createTournament, updateTournament, deleteTournament
```

### R5: Test Coverage Verification Approach

**Decision**: Use Vitest coverage with v8 provider, threshold enforcement
**Configuration**:
```typescript
// vitest.config.ts additions
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html'],
  include: ['src/server/api/routers/**', 'src/server/api/schemas/**'],
  thresholds: {
    lines: 80,
    functions: 80,
    branches: 80,
    statements: 80,
  },
}
```

## Phase 1: Design Artifacts

### No New Data Model Required

This brushup phase does not introduce new entities or modify the existing data model. All changes are structural refactoring and tooling additions.

### No New API Contracts Required

This brushup phase does not introduce new API endpoints. File splitting maintains existing interfaces.

### Quickstart Guide

See `quickstart-brushup.md` for step-by-step brushup workflow.

## Implementation Order

### Phase B1: Test Verification (Before any refactoring)
1. Run full test suite, document any failures
2. Fix failing tests before proceeding
3. Generate coverage report as baseline

### Phase B2: File Splitting (Largest files first)
1. StoreDetailContent.tsx (2406 lines) - highest priority
2. stores/actions.ts (986 lines)
3. SessionDetailContent.tsx (789 lines)
4. currency.ts router (689 lines)
5. CurrencyDetailContent.tsx (598 lines)
6. tournament.ts router (481 lines)
7. currencies/actions.ts (416 lines)
8. EditSessionContent.tsx (401 lines)

### Phase B3: React Cosmos Setup
1. Install react-cosmos and Next.js plugin
2. Create cosmos.config.ts
3. Create global decorator with Mantine provider
4. Create fixtures for all `src/components/` components

### Phase B4: UI Brushup
1. Audit spacing consistency across all pages
2. Standardize form layouts
3. Verify table styling consistency
4. Review empty/loading/error states
5. Ensure consistent button and icon usage

### Phase B5: Final Verification
1. Re-run full test suite
2. Verify coverage thresholds
3. Run file size audit (no file >400 lines)
4. Run build and type checks
5. Run linting
