<!--
=== Sync Impact Report ===
Version change: 1.0.0 → 1.1.0 (MINOR)
Modified sections:
  - VI. Git Workflow Principles: Added "Multi-Phase Implementation Rule" subsection

New rules added:
  - Sub-branch requirement for multi-phase implementations
  - Phase-by-phase PR workflow with user approval gates
  - Sub-branch naming convention: <feature-branch>/phase-<N>

Templates status:
  - .specify/templates/plan-template.md: ✅ compatible (no changes required)
  - .specify/templates/spec-template.md: ✅ compatible (no changes required)
  - .specify/templates/tasks-template.md: ✅ compatible (phase structure already defined)
  - .specify/templates/commands/*.md: N/A (no command files found)

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
│  - React components                  │
│  - Pages (App Router)                │
│  - tRPC client calls                 │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│  Application Layer                   │
│  - tRPC routers                      │
│  - Business logic (service funcs)    │
│  - Zod input/output validation       │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│  Infrastructure Layer                │
│  - Drizzle ORM (data access)         │
│  - External API integrations         │
└─────────────────────────────────────┘
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

**Version**: 1.1.0 | **Ratified**: 2025-12-11 | **Last Amended**: 2025-12-15
