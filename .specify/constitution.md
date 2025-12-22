<!--
=== Sync Impact Report ===
Version change: 1.3.0 → 1.4.0 (MINOR)
Modified sections:
  - IV. Architecture Principles: Added "Server Actions Pattern" subsection

Changes to rules:
  - Data mutations: tRPC mutations → Server Actions
  - Cache invalidation: client-side invalidate() → server-side revalidateTag()
  - Tag strategy: entity-based tags only (currency-list, currency-{id})
  - Loading states: tRPC mutation.isPending → useTransition()
  - Added example code demonstrating the pattern

Templates status:
  - .specify/templates/plan-template.md: ✅ UPDATED (Constitution Check gates, project structure)
  - .specify/templates/spec-template.md: ✅ compatible (no changes required)
  - .specify/templates/tasks-template.md: ✅ compatible (no changes required)

Template changes made:
  - plan-template.md: Updated Constitution Check gates for data fetching and mutations
  - plan-template.md: Added Server Actions file structure to project layout
  - plan-template.md: Clarified tRPC routers are for queries, Server Actions for mutations

Follow-up TODOs: None
-->

# Sapphire Constitution

## Core Principles

### I. Project Nature

This application MUST serve three purposes simultaneously:

- **Utility**: Provide concrete value as a practical tool
- **Experimentation**: Function as a testing ground for new technologies
- **Portfolio**: Demonstrate technical competence as a portfolio piece

### II. Technology Stack

This project adopts the following technology stack. Deviations require justification and documentation.

| Category | Technology |
|---|---|
| Framework | T3 Stack (Next.js, tRPC, Drizzle ORM, NextAuth.js) |
| UI Library | Mantine v8 |
| Language | TypeScript (strict mode required) |
| Unit/Integration Testing | Vitest |
| E2E Testing | Playwright |

### III. Language Principles

Language usage MUST follow these rules:

- **UI Text**: All user-facing text MUST be in Japanese
- **Comments/Documentation**: Japanese as default
- **Identifiers (variables, functions)**: English MUST be used

### IV. Architecture Principles

#### Layer Structure

A three-layer architecture leveraging T3 Stack characteristics:

```
┌─────────────────────────────────────┐
│  Presentation Layer                  │
│  - Pages (App Router)                │
│  - React components                  │
│  - tRPC prefetch (server) & calls    │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│  Application Layer                   │
│  - tRPC routers                      │
│  - Business logic (service funcs)    │
│  - Zod input/output validation       │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┘
│  Infrastructure Layer                │
│  - Drizzle ORM (data access)         │
│  - External API integrations         │
└─────────────────────────────────────┘
```

#### Page Component Pattern

Pages MUST follow the Server/Client Component separation pattern:

1. **page.tsx (Server Component)**:
   - MUST be a Server Component (no 'use client' directive)
   - MUST fetch data using tRPC server API (`await api.xxx()`)
   - MUST process/transform data on server as needed
   - MUST pass processed data to Client Component via props
   - MUST wrap client content with `HydrateClient`
   - MUST use `export const dynamic = 'force-dynamic'` for authenticated pages
   - SHOULD NOT contain UI rendering logic

2. **XxxContent.tsx (Client Component)**:
   - MUST be a Client Component ('use client' directive)
   - MUST handle all UI rendering and user interactions
   - MUST receive initial data via props (typed using `RouterOutputs`)
   - SHOULD use props data directly instead of tRPC `useQuery()` to avoid cache conflicts
   - MAY use tRPC React hooks only for client-side filtering/sorting (with `initialData`)
   - MUST use Server Actions for data modifications (NOT tRPC mutations)

Example structure:
```typescript
// page.tsx (Server Component)
export default async function CurrenciesPage() {
  const { currencies } = await api.currency.list({ includeArchived: false })
  return (
    <HydrateClient>
      <CurrenciesContent initialCurrencies={currencies} />
    </HydrateClient>
  )
}

// CurrencyDetailContent.tsx (Client Component)
'use client'
import type { RouterOutputs } from '~/trpc/react'
type Currency = RouterOutputs['currency']['getById']

interface Props {
  initialCurrency: Currency
}

export function CurrencyDetailContent({ initialCurrency }: Props) {
  // Use props data directly (refreshed via router.refresh())
  const currency = initialCurrency

  // ... UI rendering with currency data
}
```

#### Server Actions Pattern

Data mutations MUST use Next.js Server Actions instead of tRPC mutations:

1. **Server Actions File (`actions.ts`)**:
   - MUST be colocated with the feature's page components
   - MUST have `'use server'` directive at the top
   - MUST validate inputs using shared Zod schemas
   - MUST verify authentication and authorization
   - MUST use entity-based cache tags for revalidation
   - MUST return `ActionResult<T>` type for consistent error handling
   - MAY use `redirect()` for navigation after successful mutations

2. **Cache Invalidation Strategy**:
   - MUST use entity-based tags only (e.g., `currency-list`, `currency-{id}`)
   - MUST NOT use page-specific tags (e.g., `dashboard-stats`, `analytics-page`)
   - MUST call `revalidateTag()` for all affected entity tags
   - Entity tags automatically invalidate all pages that depend on that data

3. **Client Component Usage**:
   - MUST use `useTransition()` for loading states during Server Action calls
   - MUST handle `ActionResult<T>` return values
   - MUST show user feedback (notifications) based on success/error
   - MUST call `router.refresh()` after successful mutations to update Server Component data
   - SHOULD use props data directly instead of tRPC `useQuery()` to avoid cache conflicts
   - MUST NOT use tRPC `invalidate()` calls (handled by `revalidateTag()` + `router.refresh()`)

Example structure:
```typescript
// actions.ts (Server Actions file)
'use server'

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

export async function updateCurrency(
  input: UpdateCurrencyInput,
): Promise<ActionResult> {
  // 1. Authenticate
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: '認証が必要です' }

  // 2. Validate
  const validated = updateCurrencySchema.parse(input)

  // 3. Verify ownership
  const existing = await db.query.currencies.findFirst({...})
  if (!existing) return { success: false, error: '通貨が見つかりません' }

  // 4. Perform DB operation
  await db.update(currencies).set(updateData).where(...)

  // 5. Revalidate entity-based tags
  revalidateTag(`currency-${validated.id}`)  // Specific entity
  revalidateTag('currency-list')              // List entity

  return { success: true, data: undefined }
}

// XxxContent.tsx (Client Component)
'use client'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { updateCurrency } from './actions'

export function CurrencyDetailContent({ initialCurrency }: Props) {
  const router = useRouter()
  const [isUpdating, startUpdateTransition] = useTransition()

  // Use props data directly (NOT useQuery)
  const currency = initialCurrency

  const handleUpdate = (values) => {
    startUpdateTransition(async () => {
      const result = await updateCurrency(values)
      if (result.success) {
        notifications.show({ message: '更新しました', color: 'green' })
        router.refresh() // Refresh Server Component → new props → UI updates
      } else {
        notifications.show({ message: result.error, color: 'red' })
      }
    })
  }

  return (
    <div>
      <Text>{currency.name}</Text>
      <Button loading={isUpdating} onClick={handleUpdate}>保存</Button>
    </div>
  )
}
```

#### Dependency Rules

- Upper layers MUST only depend on lower layers (reverse dependencies prohibited)
- Infrastructure layer details MUST be hidden from Application layer
- Presentation layer MUST communicate with Application layer only via tRPC

#### Module Independence

- Features MUST be implemented as independent modules
- External service failures MUST be isolated to affected functionality only
- Core features MUST operate independently without external service dependencies

### V. Testing Principles (NON-NEGOTIABLE)

#### TDD Enforcement

Test-driven development is MANDATORY for all feature implementations:

1. Write tests first
2. Verify tests fail (Red)
3. Implement minimum code to pass tests (Green)
4. Refactor code (Refactor)

#### Test Coverage Matrix

| Layer | Test Type | Target |
|---|---|---|
| Presentation | Component tests | All React components |
| Application | Unit tests | tRPC routers, service functions |
| Infrastructure | Integration tests | Data access, external API integrations |
| End-to-End | E2E tests | Primary user flows |

#### Centralized Specification Management

- Specifications MUST be managed centrally via spec-kit
- Specification changes MUST be accompanied by test updates
- Tests function as executable specifications

### VI. Git Workflow Principles

#### Branch Strategy

```
main (production)
  ↑
dev (development integration)
  ↑
feature/, fix/, etc. (feature branches)
```

#### Branch Operation Rules

- Feature branches MUST be created from dev
- Feature branches MUST only merge into dev
- dev to main merges occur only at release time
- Direct commits to main are PROHIBITED

#### PR Operations

- All changes MUST go through pull requests (PRs)
- Direct commits to dev are also PROHIBITED
- PRs MUST be created at the smallest trackable unit of change
- One PR corresponds to one logical change
- Large features MUST be split into multiple PRs

#### Multi-Phase Implementation Rule

For implementations spanning multiple phases (as defined in tasks.md):

- Each phase MUST have its own sub-branch created from the feature branch
- Sub-branch naming: `<feature-branch>/phase-<N>` (e.g., `001-poker-session-tracker/phase-1`)
- Each phase MUST be submitted as a separate PR targeting the feature branch
- User approval MUST be obtained for each phase PR before proceeding to the next phase
- The feature branch aggregates all phase PRs before final merge to dev

```
dev
  ↑
feature/xxx (feature branch)
  ↑
feature/xxx/phase-1 → PR to feature/xxx → User approval required
feature/xxx/phase-2 → PR to feature/xxx → User approval required
feature/xxx/phase-N → PR to feature/xxx → User approval required
```

#### Mandatory Review

All PRs require review, verifying:

- Alignment with specifications
- Test coverage
- Compliance with architecture principles

## Additional Constraints

### Data Principles

#### Persistence

- User data MUST be persisted to the cloud
- Multi-device synchronization MUST be supported

#### Schema Management

- Database schemas MUST be managed via Drizzle migrations
- Schema changes MUST consider backward compatibility

### UI/UX Principles

#### Mantine Compliance

- Follow Mantine default styles
- Do NOT define custom design tokens
- Custom components MUST adhere to Mantine design philosophy

#### Consistency

- Apply similar UI patterns to similar operations
- Unify operation flows across entities

## Quality Standards

### Error Handling

- All errors MUST be appropriately caught
- Users MUST receive meaningful feedback in Japanese
- External service errors MUST be handled with graceful degradation

### Logging

- Important operations and errors MUST be logged
- Include information necessary for debugging
- Sensitive information (credentials, personal data) MUST NOT be logged

### Extensibility

- Maintain design where new features do not require large-scale changes to existing code
- Feature additions MUST be possible at the module level
- Common processing MUST be appropriately abstracted for reusability

## Governance

### Constitution Precedence

This constitution is the highest normative document in the project. When conflicts arise
with other documents or practices, this constitution takes precedence.

### Amendment Procedure

Constitution amendments require:

1. Documentation of the proposed amendment
2. Impact analysis on existing code
3. Migration plan formulation (if necessary)
4. Review and approval

### Compliance Verification

- All PRs MUST verify compliance with this constitution
- Adding complexity requires justification
- Refer to CLAUDE.md for development guidance

### Versioning Policy

- MAJOR: Removal of principles or backward-incompatible redefinitions
- MINOR: Addition of new principles/sections or substantial expansion
- PATCH: Clarifications, wording fixes, non-semantic improvements

**Version**: 1.4.0 | **Ratified**: 2025-12-11 | **Last Amended**: 2025-12-22
