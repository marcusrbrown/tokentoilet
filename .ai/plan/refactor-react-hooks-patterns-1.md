---
goal: Enhance React Hooks Best Practices Compliance
version: 1.0
date_created: 2025-10-01
last_updated: 2025-10-06
owner: marcusrbrown
status: 'In Progress'
tags: ['refactor', 'code-quality', 'react-hooks', 'best-practices']
---

# Enhance React Hooks Best Practices Compliance

![Status: In Progress](https://img.shields.io/badge/status-In%20Progress-yellow)

Refactor useEffect setState patterns to follow React best practices and eliminate warnings about potential stale state issues. This includes using functional updates and proper dependency management.

## 1. Requirements & Constraints

- **REQ-001**: Eliminate all direct setState calls in useEffect hooks
- **REQ-002**: Use functional updates `setState(prev => newValue)` where appropriate
- **REQ-003**: Properly manage ref dependencies in useEffect cleanup functions
- **REQ-004**: Maintain existing component behavior with no regressions
- **REQ-005**: All 914 tests must continue passing
- **SEC-001**: No security implications (refactoring only)
- **CON-001**: Changes must not affect runtime performance
- **CON-002**: Must maintain TypeScript type safety
- **CON-003**: No changes to public API or component interfaces
- **GUD-001**: Follow React hooks best practices and patterns
- **GUD-002**: Add explanatory comments for complex effect patterns
- **PAT-001**: Use functional updates for state derived from previous state
- **PAT-002**: Capture ref values at effect execution time for cleanup

## 2. Implementation Steps

### Phase 1: Refactor Theme Toggle setState Pattern

- GOAL-001: Fix direct setState call in theme-toggle.tsx useEffect

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-001 | Analyze current useEffect pattern in `components/theme-toggle.tsx:14` | ✅ | 2025-10-04 |
| TASK-002 | Refactor to use functional update: `setMounted(prev => true)` or ref pattern | ✅ | 2025-10-04 |
| TASK-003 | Add explanatory comment for mount detection pattern | ✅ | 2025-10-04 |
| TASK-004 | Run theme-integration tests to verify behavior | ✅ | 2025-10-04 |
| TASK-005 | Manual testing: Verify theme toggle works in browser | ✅ | 2025-10-06 |
| TASK-006 | Verify lint warning eliminated for theme-toggle.tsx:14 | ✅ | 2025-10-04 |

### Phase 2: Refactor Transaction Queue setState Patterns

- GOAL-002: Fix direct setState calls in use-transaction-queue.ts

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-007 | Analyze useEffect pattern at `hooks/use-transaction-queue.ts:86` | | |
| TASK-008 | Refactor setTransactions to use functional update with localStorage data | | |
| TASK-009 | Analyze useEffect pattern at `hooks/use-transaction-queue.ts:335` | | |
| TASK-010 | Refactor setTransaction to use functional update pattern | | |
| TASK-011 | Run use-transaction-queue tests to verify functionality | | |
| TASK-012 | Verify transaction queue behavior in Web3 integration tests | | |
| TASK-013 | Verify lint warnings eliminated for lines 86 and 335 | | |

### Phase 3: Fix Ref Cleanup Dependencies

- GOAL-003: Properly capture ref values in useEffect cleanup functions

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-014 | Analyze ref usage at `hooks/use-transaction-queue.ts:233` (queueRef) | | |
| TASK-015 | Capture queueRef.current to local variable at effect execution | | |
| TASK-016 | Update cleanup function to use captured value instead of ref.current | | |
| TASK-017 | Analyze ref usage at `hooks/use-transaction-queue.ts:235` (listenersRef) | | |
| TASK-018 | Capture listenersRef.current to local variable at effect execution | | |
| TASK-019 | Update cleanup function to use captured value instead of ref.current | | |
| TASK-020 | Run tests to verify cleanup functions work correctly | | |
| TASK-021 | Verify lint warnings eliminated for lines 233 and 235 | | |

### Phase 4: Refactor Test Helper Naming

- GOAL-004: Remove 'use' prefix from non-hook test helpers

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-022 | Identify test helpers at `components/theme-integration.test.tsx:12,362` | | |
| TASK-023 | Rename test helpers to remove 'use' prefix (e.g., `createMockTheme`) | | |
| TASK-024 | Update all usages of renamed helpers in test file | | |
| TASK-025 | Run theme-integration tests to verify functionality | | |
| TASK-026 | Verify lint warnings eliminated for lines 12 and 362 | | |

### Phase 5: Verification & Documentation

- GOAL-005: Comprehensive testing and pattern documentation

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-027 | Run full test suite: `pnpm test` - verify 914/914 passing | | |
| TASK-028 | Run build: `pnpm build` - verify success with no warnings | | |
| TASK-029 | Run lint: `pnpm lint` - verify 6 React hooks warnings eliminated (14 → 8) | | |
| TASK-030 | Document hook patterns in code comments or contributing guide | | |
| TASK-031 | Update CHANGELOG.md with refactoring details | | |

## 3. Alternatives

- **ALT-001**: Suppress lint warnings with eslint-disable comments
  - Rejected: Doesn't fix underlying code quality issues
- **ALT-002**: Convert all useEffect patterns to useLayoutEffect
  - Rejected: Changes behavior, useLayoutEffect is synchronous and blocks paint
- **ALT-003**: Use external state management library (Zustand, Jotai)
  - Rejected: Over-engineering for simple state updates, adds dependency
- **ALT-004**: Ignore warnings and rely on React strict mode to catch issues
  - Rejected: Warnings indicate potential bugs with stale closures

## 4. Dependencies

- **DEP-001**: No new external dependencies required
- **DEP-002**: React hooks (@types/react for TypeScript types)
- **DEP-003**: ESLint react-hooks plugin for validation
- **DEP-004**: Vitest for test execution

## 5. Files

- **FILE-001**: `components/theme-toggle.tsx` - MODIFIED: Fix setMounted in useEffect
- **FILE-002**: `hooks/use-transaction-queue.ts` - MODIFIED: Fix setState patterns (lines 86, 335)
- **FILE-003**: `hooks/use-transaction-queue.ts` - MODIFIED: Fix ref cleanup (lines 233, 235)
- **FILE-004**: `components/theme-integration.test.tsx` - MODIFIED: Rename test helpers (lines 12, 362)

## 6. Testing

- **TEST-001**: Verify theme toggle component behavior (mount detection, theme switching)
- **TEST-002**: Verify transaction queue state updates correctly from localStorage
- **TEST-003**: Verify transaction queue cleanup functions execute correctly
- **TEST-004**: Verify theme integration tests pass with renamed helpers
- **TEST-005**: Verify no stale state issues in rapid state updates
- **TEST-006**: Verify full test suite passes (914 tests)
- **TEST-007**: Manual testing: Theme toggle in development mode
- **TEST-008**: Manual testing: Transaction queue updates in Web3 flows
- **TEST-009**: Verify no console errors in React strict mode
- **TEST-010**: Test cleanup behavior with component unmounting

## 7. Risks & Assumptions

- **RISK-001**: Functional updates might change subtle timing behavior
  - Mitigation: Comprehensive testing before and after changes
- **RISK-002**: Ref cleanup changes might affect transaction queue behavior
  - Mitigation: Verify transaction cleanup in integration tests
- **RISK-003**: Theme mount detection might flicker on initial load
  - Mitigation: Test in both SSR and CSR environments
- **ASSUMPTION-001**: Current behavior is correct and tests cover edge cases
- **ASSUMPTION-002**: Lint warnings accurately identify stale closure issues
- **ASSUMPTION-003**: React strict mode double-invocation is properly handled

## 8. Related Specifications / Further Reading

- [React Hooks Rules Documentation](https://react.dev/reference/rules/rules-of-hooks)
- [React useEffect Dependencies Guide](https://react.dev/reference/react/useEffect#my-effect-runs-after-every-re-render)
- [ESLint react-hooks/exhaustive-deps Rule](https://github.com/facebook/react/tree/main/packages/eslint-plugin-react-hooks)
- [React Hooks FAQ - Stale Closures](https://react.dev/learn/separating-events-from-effects)
- [Audit Report - Outstanding Issues Section](#)
