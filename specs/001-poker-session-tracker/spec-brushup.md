# Feature Specification: MVP Brushup

**Feature Branch**: `001-poker-session-tracker`
**Created**: 2025-12-29
**Status**: Draft
**Input**: User description: MVPブラッシュアップ - テスト網羅性確認、ファイル粒度最適化、React Cosmos導入、UIブラッシュアップ

## Overview

This specification defines the brushup phase for the Live Poker Session Tracker MVP. The MVP (Phases 1-6) has been completed, and this phase focuses on quality improvements, maintainability enhancements, and UI polish before proceeding to Phase 7+.

## User Scenarios & Testing *(mandatory)*

### User Story B1 - Test Coverage Verification (Priority: P1)

As a developer, I want to verify that all specifications are covered by tests and that all tests pass, so that I can confidently proceed with future development.

**Why this priority**: Test coverage ensures the MVP is stable and reliable. Without verified tests, future changes risk introducing regressions.

**Independent Test**: Can be fully tested by running the test suite and verifying coverage reports show all requirements are tested.

**Acceptance Scenarios**:

1. **Given** the MVP is complete, **When** I run the full test suite (unit, integration, E2E), **Then** all tests pass without failures
2. **Given** the spec.md defines acceptance scenarios, **When** I review test files, **Then** each acceptance scenario has corresponding test coverage
3. **Given** a test coverage report is generated, **When** I review critical paths (routers, schemas, UI components), **Then** coverage meets minimum thresholds (80% for critical code)

---

### User Story B2 - File Granularity Optimization (Priority: P1)

As a developer working with AI assistants, I want files to be appropriately sized (under 400 lines), so that AI context windows are not overwhelmed and code remains maintainable.

**Why this priority**: Large files (especially StoreDetailContent.tsx at 2406 lines) exceed practical AI context limits and make code review, testing, and maintenance difficult.

**Independent Test**: Can be fully tested by running a file size audit and verifying no file exceeds the threshold.

**Acceptance Scenarios**:

1. **Given** the current codebase has files over 400 lines, **When** files are refactored, **Then** no single file exceeds 400 lines
2. **Given** a large component file, **When** it is split into smaller components, **Then** each component has a single responsibility and clear interface
3. **Given** a large router file, **When** it is split, **Then** related operations remain grouped logically (CRUD operations, queries, mutations)
4. **Given** a large actions file (server actions), **When** it is split, **Then** actions are grouped by entity or feature domain

**Files Requiring Refactoring** (current line counts):
- `src/app/(main)/stores/[id]/StoreDetailContent.tsx` - 2406 lines
- `src/app/(main)/stores/actions.ts` - 986 lines
- `src/app/(main)/sessions/[id]/SessionDetailContent.tsx` - 789 lines
- `src/server/api/routers/currency.ts` - 689 lines
- `src/app/(main)/currencies/[id]/CurrencyDetailContent.tsx` - 598 lines
- `src/server/api/routers/tournament.ts` - 481 lines
- `src/app/(main)/currencies/actions.ts` - 416 lines
- `src/app/(main)/sessions/[id]/edit/EditSessionContent.tsx` - 401 lines

---

### User Story B3 - React Cosmos Introduction (Priority: P2)

As a developer, I want to use React Cosmos for component development and documentation, so that I can develop and test UI components in isolation and maintain a visual component library.

**Why this priority**: React Cosmos enables isolated component development, visual regression testing, and serves as living documentation for the design system.

**Independent Test**: Can be fully tested by starting React Cosmos and verifying all shared components are visible and interactive in the fixture browser.

**Acceptance Scenarios**:

1. **Given** React Cosmos is not installed, **When** I install and configure it, **Then** I can run `bun run cosmos` to start the component browser
2. **Given** React Cosmos is configured, **When** I create fixtures for shared components, **Then** each component in `src/components/` has at least one fixture
3. **Given** component fixtures exist, **When** I browse fixtures in Cosmos, **Then** I can interact with components in all their states (loading, error, empty, populated)
4. **Given** fixtures include Mantine components, **When** I view them in Cosmos, **Then** theme switching (light/dark) works correctly

---

### User Story B4 - UI Brushup (Priority: P2)

As a user, I want a consistent and polished UI experience, so that the application feels professional and is easy to use.

**Why this priority**: UI consistency improves user trust and reduces cognitive load. Polish items accumulated during MVP development need to be addressed.

**Independent Test**: Can be fully tested by reviewing all screens for consistency in spacing, typography, color usage, and interaction patterns.

**Acceptance Scenarios**:

1. **Given** multiple pages exist, **When** I review them side by side, **Then** spacing (margins, padding, gaps) is consistent across all pages
2. **Given** forms exist across features, **When** I review form layouts, **Then** label placement, input sizing, and button positioning follow the same pattern
3. **Given** tables and lists exist, **When** I review them, **Then** column widths, cell padding, and row heights are consistent
4. **Given** empty states exist, **When** no data is available, **Then** helpful empty state messages and call-to-action buttons are shown
5. **Given** loading states exist, **When** data is being fetched, **Then** loading indicators are consistent (using Mantine Skeleton or LoadingOverlay)
6. **Given** error states exist, **When** an error occurs, **Then** error messages are displayed consistently with appropriate styling

---

### Edge Cases

- What happens when file splitting breaks existing imports?
  - All imports must be updated, and tests must pass after refactoring
- What happens when React Cosmos conflicts with Next.js configuration?
  - Use Next.js-compatible Cosmos configuration with proper webpack/turbopack handling
- What happens when UI changes affect responsive behavior?
  - Mobile viewport testing must be included in UI review

## Requirements *(mandatory)*

### Functional Requirements

#### Test Coverage (B1)

- **FR-B001**: All unit tests MUST pass when running `bun run test`
- **FR-B002**: All integration tests MUST pass when running `bun run test`
- **FR-B003**: All E2E tests MUST pass when running `bun run test:e2e`
- **FR-B004**: Test coverage for routers MUST be at least 80%
- **FR-B005**: Test coverage for Zod schemas MUST be at least 90%
- **FR-B006**: Each acceptance scenario in spec.md MUST have corresponding test(s)

#### File Granularity (B2)

- **FR-B010**: No TypeScript/TSX file SHOULD exceed 400 lines of code
- **FR-B011**: Large components MUST be split into smaller, focused sub-components
- **FR-B012**: Large routers MUST be split into logical modules (queries, mutations, or by entity)
- **FR-B013**: Server actions MUST be grouped by feature domain in separate files
- **FR-B014**: Shared utilities and helpers MUST be extracted to dedicated files in `src/lib/`
- **FR-B015**: Component props and types MUST be exported from dedicated type files when shared

#### React Cosmos (B3)

- **FR-B020**: React Cosmos MUST be installed and configured for the project
- **FR-B021**: A `cosmos.config.json` or `cosmos.config.ts` file MUST exist at project root
- **FR-B022**: Package.json MUST include a `cosmos` script to start the Cosmos server
- **FR-B023**: All shared components in `src/components/` MUST have at least one fixture
- **FR-B024**: Fixtures MUST be located in `__fixtures__` directories adjacent to components
- **FR-B025**: Fixtures MUST demonstrate multiple component states (default, loading, error, empty)
- **FR-B026**: Cosmos MUST work with Mantine theme provider and color scheme switching

#### UI Brushup (B4)

- **FR-B030**: Spacing MUST follow Mantine's spacing scale consistently (xs, sm, md, lg, xl)
- **FR-B031**: Typography MUST use Mantine's text components with consistent size variants
- **FR-B032**: Form layouts MUST follow a consistent pattern (label above input, consistent gap)
- **FR-B033**: Tables MUST use Mantine Table component with consistent column alignment
- **FR-B034**: Empty states MUST include descriptive text and a primary action button
- **FR-B035**: Loading states MUST use Skeleton components for content placeholders
- **FR-B036**: Error messages MUST use Mantine Alert or Notification with error color
- **FR-B037**: Button styles MUST be consistent (primary actions use filled variant, secondary use outline)
- **FR-B038**: Icons MUST be from a single icon library (Tabler Icons via @tabler/icons-react)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-B001**: All tests pass (0 failures in unit, integration, and E2E test suites)
- **SC-B002**: No file in `src/` exceeds 400 lines (verified by automated check)
- **SC-B003**: React Cosmos starts successfully and displays all shared components
- **SC-B004**: UI review checklist passes (spacing, typography, forms, tables, states)
- **SC-B005**: Build completes without errors (`bun run build` succeeds)
- **SC-B006**: Type checking passes without errors (`bun run typecheck` succeeds)
- **SC-B007**: Linting passes without errors (`bun run lint` succeeds)

## Assumptions

- React Cosmos 6.x is compatible with Next.js 15 and Mantine v8
- File size threshold of 400 lines is appropriate for AI context optimization
- Existing component structure supports logical splitting without major architectural changes
- UI brushup does not require design mockups - existing Mantine defaults are the design standard

## Out of Scope

- New feature development (covered in Phase 7+)
- Performance optimization beyond what file splitting provides
- Accessibility audit (separate effort)
- Internationalization (spec states Japanese only)
- Mobile-first responsive redesign (existing responsive behavior is retained)
