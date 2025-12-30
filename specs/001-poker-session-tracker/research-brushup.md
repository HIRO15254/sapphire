# Research: MVP Brushup

**Branch**: `001-poker-session-tracker`
**Date**: 2025-12-29
**Related Spec**: [spec-brushup.md](./spec-brushup.md)

## R1: React Cosmos + Next.js 15 Integration

### Decision
Use React Cosmos 6.x/7.x with `react-cosmos-next` package for Next.js App Router integration.

### Rationale
- Official Next.js support via `react-cosmos-next` package
- Works with App Router and dynamic routes
- Supports global decorators for Mantine provider wrapping
- Lightweight compared to Storybook
- Active maintenance with React 19 support in v7

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Storybook | Heavier setup, more complex configuration, slower startup |
| Ladle | Less mature ecosystem, fewer integrations |
| No component browser | Loses isolated development and visual documentation benefits |

### Implementation Details

#### Installation
```bash
bun add -D react-cosmos react-cosmos-next
```

#### Configuration (`cosmos.config.json`)
```json
{
  "rendererUrl": {
    "dev": "http://localhost:3000/cosmos/<fixture>",
    "export": "/cosmos/<fixture>.html"
  },
  "globalImports": [
    "@mantine/core/styles.css"
  ],
  "fixturesDir": "__fixtures__",
  "fixtureFileSuffix": "fixture",
  "port": 5000
}
```

#### Cosmos Renderer Page (`src/app/cosmos/[fixture]/page.tsx`)
```typescript
import { nextCosmosPage, nextCosmosStaticParams } from 'react-cosmos-next';
import * as cosmosImports from '../../../../cosmos.imports';

export const generateStaticParams = nextCosmosStaticParams(cosmosImports);
export default nextCosmosPage(cosmosImports);
```

#### Global Decorator (`src/cosmos.decorator.tsx`)
```typescript
'use client';

import { ReactNode } from 'react';
import { MantineProvider, createTheme, ColorSchemeScript } from '@mantine/core';

const theme = createTheme({
  primaryColor: 'blue',
});

export default function MantineDecorator({ children }: { children: ReactNode }) {
  return (
    <>
      <ColorSchemeScript defaultColorScheme="auto" />
      <MantineProvider theme={theme} defaultColorScheme="auto">
        {children}
      </MantineProvider>
    </>
  );
}
```

#### Package Scripts
```json
{
  "scripts": {
    "cosmos": "cosmos --expose-imports",
    "cosmos-export": "cosmos-export --expose-imports"
  }
}
```

### Known Issues & Workarounds

1. **Client Component Requirement**: Fixtures using hooks must have `'use client'` directive
2. **CSS Import Order**: Use `globalImports` in config, not decorator imports
3. **Auto-generated file**: Add `cosmos.imports.js` to `.gitignore`

---

## R2: File Splitting Patterns for Large Components

### Decision
Split large components by responsibility: forms, tables, modals, sections, and types.

### Rationale
- Maintains single responsibility principle
- Enables parallel development on sub-components
- Improves testability of individual pieces
- Keeps related code discoverable (co-located)

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Single file (status quo) | Exceeds 400-line threshold, overwhelms AI context |
| Feature-based folders | Over-engineering for this codebase size |
| Barrel exports only | Doesn't reduce individual file complexity |

### Implementation Patterns

#### Component Splitting Pattern
```text
src/app/(main)/stores/[id]/
├── StoreDetailContent.tsx      # Main orchestrator (imports sub-components)
├── StoreHeader.tsx             # Store info header section
├── StoreInfo.tsx               # Basic store information display
├── CashGameSection.tsx         # Cash games list and management
├── TournamentSection.tsx       # Tournaments list and management
├── CashGameModal.tsx           # Cash game create/edit modal
├── TournamentModal.tsx         # Tournament create/edit modal
├── types.ts                    # Shared types for store detail
└── hooks.ts                    # Shared hooks (if needed)
```

#### Naming Conventions
| Pattern | Usage |
|---------|-------|
| `XxxForm.tsx` | Form components with validation |
| `XxxTable.tsx` | Data table displays |
| `XxxModal.tsx` | Modal dialogs |
| `XxxSection.tsx` | Page sections/blocks |
| `XxxCard.tsx` | Card-based displays |
| `types.ts` | Shared TypeScript types |
| `hooks.ts` | Shared custom hooks |

---

## R3: Router File Splitting Strategy

### Decision
Split large tRPC routers into sub-modules by operation type (queries vs mutations) and merge using `mergeRouters`.

### Rationale
- tRPC's `mergeRouters` enables clean composition
- Separates read operations from write operations
- Maintains existing API surface (no breaking changes)
- Follows separation of concerns

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Entity sub-routers | Over-fragmentation for current scale |
| Single file | Exceeds 400-line threshold |
| Separate endpoints | Breaking change to existing API |

### Implementation Pattern
```text
src/server/api/routers/
├── currency/
│   ├── index.ts           # Merged router export
│   ├── queries.ts         # list, getById, getBalance, etc.
│   └── mutations.ts       # create, update, delete, addBonus, addPurchase
├── tournament/
│   ├── index.ts
│   ├── queries.ts
│   └── mutations.ts
└── [other routers...]
```

#### Example: `currency/index.ts`
```typescript
import { createTRPCRouter, mergeRouters } from '~/server/api/trpc';
import { currencyQueries } from './queries';
import { currencyMutations } from './mutations';

export const currencyRouter = mergeRouters(
  currencyQueries,
  currencyMutations,
);
```

#### Example: `currency/queries.ts`
```typescript
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';
import { listCurrenciesSchema, getCurrencyByIdSchema } from '~/server/api/schemas/currency.schema';

export const currencyQueries = createTRPCRouter({
  list: protectedProcedure
    .input(listCurrenciesSchema)
    .query(async ({ ctx, input }) => {
      // ... implementation
    }),
  getById: protectedProcedure
    .input(getCurrencyByIdSchema)
    .query(async ({ ctx, input }) => {
      // ... implementation
    }),
});
```

---

## R4: Server Actions File Splitting Strategy

### Decision
Split large actions files by entity (store, cashGame, tournament) or by action category.

### Rationale
- Maintains co-location with feature pages
- Groups related mutations together
- Reduces individual file size below threshold

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Single actions.ts | Exceeds 400-line threshold (stores: 986 lines) |
| Move to lib/ | Breaks co-location pattern from constitution |
| tRPC mutations | Constitution mandates Server Actions for mutations |

### Implementation Pattern
```text
src/app/(main)/stores/
├── actions/
│   ├── index.ts           # Re-exports all actions
│   ├── store.ts           # createStore, updateStore, deleteStore
│   ├── cashGame.ts        # createCashGame, updateCashGame, deleteCashGame
│   └── tournament.ts      # createTournament, updateTournament, etc.
├── page.tsx
└── StoresContent.tsx
```

#### Example: `actions/index.ts`
```typescript
'use server';

export * from './store';
export * from './cashGame';
export * from './tournament';
```

#### Example: `actions/store.ts`
```typescript
'use server';

import { revalidateTag } from 'next/cache';
import { auth } from '~/server/auth';
import { db } from '~/server/db';
import { stores } from '~/server/db/schema';
import type { ActionResult } from '~/lib/types';

export async function createStore(input: CreateStoreInput): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: '認証が必要です' };

  // ... implementation

  revalidateTag('store-list');
  return { success: true, data: { id: newStore.id } };
}
```

---

## R5: Test Coverage Verification Approach

### Decision
Use Vitest's built-in coverage with v8 provider and threshold enforcement.

### Rationale
- Already using Vitest for testing
- v8 provider is fast and accurate
- Threshold enforcement catches coverage regressions
- HTML report aids in identifying uncovered code

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Istanbul provider | Slower than v8 for large codebases |
| External coverage tools | Unnecessary complexity |
| No thresholds | Risk of coverage regression |

### Configuration
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/server/api/routers/**/*.ts',
        'src/server/api/schemas/**/*.ts',
        'src/server/db/schema/**/*.ts',
      ],
      exclude: [
        '**/*.test.ts',
        '**/index.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
```

### Coverage Report Commands
```bash
# Run tests with coverage
bun run test --coverage

# View HTML report
open coverage/index.html
```

---

## R6: UI Consistency Audit Approach

### Decision
Create a systematic UI audit checklist based on Mantine component patterns.

### Rationale
- Mantine provides consistent component APIs
- Systematic audit catches inconsistencies
- Checklist ensures completeness

### UI Audit Checklist

#### Spacing
- [ ] All page containers use consistent padding (md or lg)
- [ ] Card components use consistent padding (md)
- [ ] Stack/Group components use consistent gap (md)
- [ ] Form fields use consistent spacing (sm or md)

#### Typography
- [ ] Page titles use Title component with consistent order (1 or 2)
- [ ] Section headings use Title with order 3 or 4
- [ ] Body text uses Text component with default size
- [ ] Muted text uses `c="dimmed"` prop

#### Forms
- [ ] Labels positioned above inputs (default Mantine behavior)
- [ ] Required fields marked with asterisk
- [ ] Error messages use Mantine's built-in error styling
- [ ] Submit buttons positioned consistently (right-aligned or full-width)

#### Tables
- [ ] Use Mantine Table component
- [ ] Column headers use consistent alignment
- [ ] Empty states show helpful message
- [ ] Loading states use Skeleton or LoadingOverlay

#### States
- [ ] Empty states include descriptive text and CTA button
- [ ] Loading states use Skeleton for content areas
- [ ] Error states use Alert component with error color
- [ ] Success feedback uses Notification with green color

#### Buttons
- [ ] Primary actions use filled variant
- [ ] Secondary actions use outline or subtle variant
- [ ] Destructive actions use red color
- [ ] Consistent icon placement (left side)

#### Icons
- [ ] All icons from @tabler/icons-react
- [ ] Consistent icon sizes (default or size prop)
- [ ] Icons have appropriate aria labels where needed
