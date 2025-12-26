---
name: project-checker
description: Validate and fix code by running tsc, linting, and tests sequentially.
---

# Project Checker

Validate the entire project and fix any errors found.

## Instructions

Run the following commands in order, fixing any errors before proceeding:

### 1. TypeScript Type Check

```bash
tsc --noEmit
```

If type errors occur:
- Read the affected files
- Fix type definition issues
- Re-run to verify the fix

### 2. Code Quality Check

```bash
bun run check:unsafe
```

If lint/format errors occur:
- Review ESLint/Prettier errors
- Fix code style issues
- Re-run to verify the fix

### 3. Run Tests

```bash
bun run test
```

If tests fail:
- Identify the failing test cases
- Analyze whether the test or implementation is incorrect
- Apply the appropriate fix
- Re-run to verify the fix

## Important

- Continue fixing until each step passes without errors
- Always re-verify after making fixes
- Do not mark as complete until all checks pass
- Report all fixes made to the user
