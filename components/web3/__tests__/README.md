# Web3 Component Accessibility Tests

## Overview

Automated accessibility testing infrastructure using `vitest-axe` to ensure all token-related Web3 components meet WCAG accessibility standards.

## Setup

The accessibility testing infrastructure is configured in:

- **Test Setup**: `vitest.setup.ts` - Extends Vitest's expect with axe-core matchers
- **Test Suite**: `accessibility.test.tsx` - Comprehensive accessibility tests for all Phase 4 token components
- **Type Declarations**: `accessibility.d.ts` - TypeScript module augmentation for vitest-axe matchers

## Running Tests

```bash
# Run all accessibility tests
pnpm test components/web3/__tests__/accessibility.test.tsx

# Run specific accessibility test
pnpm test accessibility.test.tsx -t "TokenList"
```

## Test Coverage

The test suite validates accessibility for:

### TokenList Component

- Empty state display
- Populated token list rendering
- Compact and grid layout variants
- Loading and error states

### TokenDetail Component

- Modal and inline display variants
- Low and high-risk token indicators
- Metadata loading and error states

### TokenSelection Component

- Default and compact selection UI
- Pre-selected token handling
- Empty list and loading states

### TokenApproval Component

- Default, compact, and modal variants
- Approval workflow states (pending, approved, etc.)
- Gas estimation display
- Advanced controls UI

### Cross-Component Integration

- Combined selection + approval workflows
- Complete disposal workflow UI

## Current Status (2025-10-01)

**Testing Infrastructure**: ✅ **COMPLETE AND OPERATIONAL**

The accessibility testing setup is fully functional and successfully detecting accessibility violations in components.

**Test Results**: 28 tests total - 7 passing, 21 failing

- ✅ **7 Passing Tests**: Infrastructure working correctly - these components/states have no accessibility violations
  - TokenList: Empty state, compact variant, loading state
  - TokenSelection: Loading state
  - Cross-component integration tests work when components are accessible

- ❌ **21 Failing Tests**: Real accessibility violations detected by working test infrastructure
  - All failures are **button-name** violations (buttons without accessible labels)
  - Affects: TokenSelection (4 tests), TokenApproval (11 tests), TokenDetail (6 tests), Cross-component integration (2 tests)
  - These are **component implementation issues**, not testing infrastructure problems

**Quality Gates**: ✅ All passing for test infrastructure

- ✅ Linting: 0 errors
- ✅ Type checking: 0 errors
- ✅ Build: Successful
- ✅ Test execution: All 28 tests run successfully (detecting real violations as intended)

## Next Steps

The automated accessibility testing infrastructure (TASK-030) is **complete**. The following work should be tracked separately:

1. **Fix Button Accessibility Violations** (New Task - Component Fixes):
   - Add proper aria-labels to all interactive buttons in TokenSelection
   - Add proper aria-labels to all interactive buttons in TokenApproval
   - Add proper aria-labels to all interactive buttons in TokenDetail
   - Ensure all controls have discernible text for screen readers
   - Target: 28/28 tests passing with zero accessibility violations

2. **Component-Specific Accessibility Improvements**:
   - Review all icon-only buttons and add descriptive labels
   - Ensure filter and sort controls are keyboard accessible
   - Verify screen reader announcements for state changes
   - Test with actual assistive technology

3. **Validation After Fixes**:
   - Re-run accessibility tests after component fixes
   - Target: 100% test pass rate (28/28 tests passing)
   - Document any intentional exceptions with justification
   - Add accessibility testing to CI/CD pipeline

## Configuration

### axe-core Rules

The tests use axe-core's default ruleset which includes:

- WCAG 2.0 Level A & AA
- WCAG 2.1 Level A & AA
- Section 508 guidelines
- Best practices for web accessibility

### jsdom Environment Mocks

Required mocks for testing in jsdom:

- `HTMLCanvasElement.prototype.getContext` - For axe-core color contrast checks
- `window.getComputedStyle` - For pseudo-element style calculations
- `window.matchMedia` - For responsive design tests

These mocks are configured in `vitest.setup.ts` and automatically applied to all tests.

## Troubleshooting

### Common Issues

**"Invalid Chai property: toHaveNoViolations"**

- Ensure `vitest.setup.ts` imports and extends matchers correctly
- Check that `accessibility.d.ts` type declarations are in place

**"Cannot read properties of undefined"**

- Verify all mocks in test file return complete data structures
- Check component prop requirements match mock configurations

**"Not implemented: HTMLCanvasElement.prototype.getContext"**

- Verify `vitest.setup.ts` includes canvas context mock
- This is required for axe-core color contrast checking

### Debugging Tips

Use `screen.debug()` from `@testing-library/react` to see rendered HTML when tests fail.

Check axe-core violation details - they include:

- Specific HTML element selector
- WCAG rule violated
- Suggestions for fixes
- Link to detailed documentation
