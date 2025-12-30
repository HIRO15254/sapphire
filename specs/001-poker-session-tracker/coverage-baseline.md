# Coverage Baseline: MVP Brushup

**Generated**: 2025-12-30
**Branch**: `001-poker-session-tracker`

## Summary

| Metric     | Current | Threshold | Status |
|------------|---------|-----------|--------|
| Statements | 2.70%   | 80%       | FAIL   |
| Branches   | 0.89%   | 80%       | FAIL   |
| Functions  | 3.76%   | 80%       | FAIL   |
| Lines      | 2.78%   | 80%       | FAIL   |

## Test Results

- **Unit/Integration Tests**: 413 passed, 9 skipped
- **E2E Tests**: 136 passed

## Coverage Analysis

### High Coverage Areas

| File/Directory | Lines | Functions | Notes |
|----------------|-------|-----------|-------|
| `src/lib/google-maps.ts` | 100% | 100% | Fully covered |
| `src/server/db/schema/common.ts` | 66.66% | 60% | Well covered |
| `src/server/db/schema/verificationToken.ts` | 66.66% | 50% | Partially covered |

### Low Coverage Areas (Priority for Future Improvement)

| Category | Files | Issue |
|----------|-------|-------|
| **UI Components** | `src/components/**` | 0% coverage - Client components not tested in unit tests |
| **App Pages** | `src/app/**` | 0% coverage - Page components tested via E2E only |
| **tRPC Routers** | `src/server/api/routers/**` | 0% coverage - Integration tests use mocks |
| **Schemas** | `src/server/api/schemas/**` | 0% statement coverage - Only type definitions tested |
| **Auth** | `src/server/auth/**` | 0% coverage - Auth tested via integration tests |

### DB Schema Coverage

| File | Lines | Branches | Functions |
|------|-------|----------|-----------|
| allInRecord.ts | 33.33% | 100% | 20% |
| bonusTransaction.ts | 33.33% | 100% | 20% |
| cashGame.ts | 28.57% | 100% | 16.66% |
| common.ts | 66.66% | 100% | 60% |
| currency.ts | 40% | 100% | 25% |
| purchaseTransaction.ts | 33.33% | 100% | 20% |
| session.ts | 25% | 100% | 14.28% |
| store.ts | 40% | 100% | 25% |
| tournament.ts | 39.28% | 100% | 22.72% |
| user.ts | 50% | 100% | 33.33% |

## Notes

1. **Current coverage thresholds are aspirational** - The 80% thresholds in vitest.config.ts represent goals, not current reality

2. **E2E tests provide functional coverage** - While unit test coverage is low, 136 E2E tests cover user-facing functionality

3. **Schema tests focus on structure** - DB schema tests verify table structure and relations, not runtime coverage

4. **Client components require different testing approach** - React components are tested via E2E tests with Playwright

## Recommendations for Future Coverage Improvement

1. **Phase 1**: Focus on router unit tests (currently mocked in integration tests)
2. **Phase 2**: Add component unit tests using Vitest + Testing Library
3. **Phase 3**: Increase schema validation tests
4. **Phase 4**: Add Server Action unit tests

## Configuration Reference

```typescript
// vitest.config.ts
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html'],
  include: ['src/**/*.{ts,tsx}'],
  exclude: [
    'src/**/*.d.ts',
    'src/env.js',
    'src/app/api/**/*',
    'node_modules/**/*',
  ],
  thresholds: {
    statements: 80,
    branches: 80,
    functions: 80,
    lines: 80,
  },
}
```
