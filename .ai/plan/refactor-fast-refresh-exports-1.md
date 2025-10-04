---
goal: Refactor Component Exports for Fast Refresh Compliance
version: 1.0
date_created: 2025-10-01
last_updated: 2025-10-03
owner: marcusrbrown
status: 'In Progress'
tags: ['refactor', 'code-quality', 'fast-refresh', 'developer-experience']
---

# Refactor Component Exports for Fast Refresh Compliance

![Status: In Progress](https://img.shields.io/badge/status-In%20Progress-yellow)

Improve development experience by separating component exports from utility exports to eliminate Fast Refresh warnings. This refactoring will extract variant functions and constants to dedicated files while maintaining backwards compatibility.

## 1. Requirements & Constraints

- **REQ-001**: Extract all non-component exports (variants, constants, utilities) from component files
- **REQ-002**: Maintain 100% backwards compatibility with existing imports
- **REQ-003**: All 914 tests must continue passing after refactoring
- **REQ-004**: Build must succeed without new warnings
- **REQ-005**: No breaking changes to public API
- **SEC-001**: No security implications (refactoring only)
- **CON-001**: Changes must not affect runtime bundle size
- **CON-002**: Must maintain TypeScript type safety throughout
- **GUD-001**: Follow existing naming conventions for new files
- **GUD-002**: Use `-variants.ts` suffix for variant utility files
- **GUD-003**: Update imports in consuming files to use new paths
- **PAT-001**: Export utility from dedicated file

## 2. Implementation Steps

### Phase 1: Extract Badge Variants

- GOAL-001: Separate badgeVariants utility from Badge component

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-001 | Create `components/ui/badge-variants.ts` with badgeVariants export | ✅ | 2025-10-03 |
| TASK-002 | Update `components/ui/badge.tsx` to import and re-export badgeVariants | ✅ | 2025-10-03 |
| TASK-003 | Run tests to verify Badge component functionality | ✅ | 2025-10-03 |
| TASK-004 | Verify lint warning eliminated for badge.tsx:265 | ✅ | 2025-10-03 |

### Phase 2: Extract Button Variants

- GOAL-002: Separate buttonVariants utility from Button component

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-005 | Create `components/ui/button-variants.ts` with buttonVariants export | ✅ | 2025-10-03 |
| TASK-006 | Update `components/ui/button.tsx` to import and re-export buttonVariants | ✅ | 2025-10-03 |
| TASK-007 | Run tests to verify Button component functionality | ✅ | 2025-10-03 |
| TASK-008 | Verify lint warning eliminated for button.tsx:303 | ✅ | 2025-10-03 |

### Phase 3: Extract Input Variants

- GOAL-003: Separate inputVariants utility from Input component

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-009 | Create `components/ui/input-variants.ts` with inputVariants export | ✅ | 2025-10-03 |
| TASK-010 | Update `components/ui/input.tsx` to import inputVariants (no re-export) | ✅ | 2025-10-03 |
| TASK-011 | Run tests to verify Input component functionality | ✅ | 2025-10-03 |
| TASK-012 | Verify lint warning eliminated for input.tsx:518 | ✅ | 2025-10-03 |

### Phase 4: Extract Skeleton Variants

- GOAL-004: Separate skeletonVariants utility from Skeleton component

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-013 | Create `components/ui/skeleton-variants.ts` with skeletonVariants export | | |
| TASK-014 | Update `components/ui/skeleton.tsx` to import and re-export skeletonVariants | | |
| TASK-015 | Run tests to verify Skeleton component functionality | | |
| TASK-016 | Verify lint warning eliminated for skeleton.tsx:306 | | |

### Phase 5: Extract Toast Utilities

- GOAL-005: Separate toast utilities and toastNotifications from Toast component

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-017 | Create `components/ui/toast-notifications.ts` with toastNotifications and toast exports | | |
| TASK-018 | Update `components/ui/toast.tsx` to import and re-export utilities | | |
| TASK-019 | Update consuming files to import toast utilities from new path if needed | | |
| TASK-020 | Run tests to verify Toast component functionality | | |
| TASK-021 | Verify lint warnings eliminated for toast.tsx:238,443,444 | | |

### Phase 6: Verification & Cleanup

- GOAL-006: Comprehensive testing and validation

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-022 | Run full test suite: `pnpm test` - verify 914/914 passing | | |
| TASK-023 | Run build: `pnpm build` - verify success with no new warnings | | |
| TASK-024 | Run lint: `pnpm lint` - verify 7 Fast Refresh warnings eliminated (14 → 7) | | |
| TASK-025 | Verify bundle size unchanged using build output | | |
| TASK-026 | Update CHANGELOG.md with refactoring details | | |

## 3. Alternatives

- **ALT-001**: Keep utilities in component files, suppress lint warnings
  - Rejected: Doesn't improve development experience, Fast Refresh still disrupted
- **ALT-002**: Move all variants to single `lib/ui-variants.ts` file
  - Rejected: Reduces discoverability, makes file structure less intuitive
- **ALT-003**: Use barrel exports with separate files but no re-exports
  - Rejected: Breaking change for existing imports, requires consumer updates

## 4. Dependencies

- **DEP-001**: No new external dependencies required
- **DEP-002**: Existing `class-variance-authority` for variant utilities
- **DEP-003**: TypeScript compiler for type checking
- **DEP-004**: ESLint with Fast Refresh plugin for validation

## 5. Files

- **FILE-001**: `components/ui/badge-variants.ts` - NEW: Badge variant utility exports
- **FILE-002**: `components/ui/badge.tsx` - MODIFIED: Import and re-export variants
- **FILE-003**: `components/ui/button-variants.ts` - NEW: Button variant utility exports
- **FILE-004**: `components/ui/button.tsx` - MODIFIED: Import and re-export variants
- **FILE-005**: `components/ui/input-variants.ts` - NEW: Input variant utility exports
- **FILE-006**: `components/ui/input.tsx` - MODIFIED: Import and re-export variants
- **FILE-007**: `components/ui/skeleton-variants.ts` - NEW: Skeleton variant utility exports
- **FILE-008**: `components/ui/skeleton.tsx` - MODIFIED: Import and re-export variants
- **FILE-009**: `components/ui/toast-notifications.ts` - NEW: Toast utilities and notifications
- **FILE-010**: `components/ui/toast.tsx` - MODIFIED: Import and re-export utilities

## 6. Testing

- **TEST-001**: Verify all Badge tests pass after refactoring
- **TEST-002**: Verify all Button tests pass after refactoring
- **TEST-003**: Verify all Input tests pass after refactoring
- **TEST-004**: Verify all Skeleton tests pass after refactoring
- **TEST-005**: Verify all Toast tests pass after refactoring
- **TEST-006**: Verify full test suite passes (914 tests)
- **TEST-007**: Verify Fast Refresh works correctly in development mode
- **TEST-008**: Manual testing: Hot reload component changes in browser
- **TEST-009**: Verify TypeScript compilation with no errors
- **TEST-010**: Verify bundle size unchanged after refactoring

## 7. Risks & Assumptions

- **RISK-001**: Potential circular dependency if not structured correctly
  - Mitigation: Variants files have no component imports, only utilities
- **RISK-002**: Fast Refresh still not working due to other issues
  - Mitigation: Test in development mode after each phase
- **ASSUMPTION-001**: All consuming code uses documented import paths
- **ASSUMPTION-002**: No direct file path imports from node_modules
- **ASSUMPTION-003**: Fast Refresh warnings are solely due to mixed exports

## 8. Related Specifications / Further Reading

- [React Fast Refresh Documentation](https://nextjs.org/docs/architecture/fast-refresh)
- [ESLint react-refresh/only-export-components Rule](https://github.com/ArnaudBarre/eslint-plugin-react-refresh)
- [Audit Report - Outstanding Issues Section](/.ai/docs/audit-report-2025-10-01.md)
- [Class Variance Authority Documentation](https://cva.style/docs)
