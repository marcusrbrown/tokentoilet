# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- **[React Hooks Best Practices]** Refactored useEffect patterns to follow React best practices and eliminate ESLint warnings about potential stale state issues
  - Fixed direct setState calls in `components/theme-toggle.tsx` (Phase 1, #619)
  - Fixed direct setState calls in `hooks/use-transaction-queue.ts` at lines 86 and 335 (Phase 2, #620)
  - Properly captured ref values in useEffect cleanup functions at lines 233 and 235 (Phase 3, #621)
  - Refactored test mock structure in `components/theme-integration.test.tsx` using computed property names to eliminate ESLint warnings (Phase 4, #622)
  - All 935 tests passing after refactoring
  - Production build successful with no errors
  - Zero ESLint errors - all React hooks warnings resolved
  - Added comprehensive React Hooks best practices documentation to CONTRIBUTING.md

- **[Fast Refresh Compliance]** Refactored component exports to separate variant utilities and constants from component files, eliminating React Fast Refresh warnings and improving development experience
  - Extracted `badgeVariants` from `Badge` component to `badge-variants.ts` (#601)
  - Extracted `buttonVariants` from `Button` component to `button-variants.ts` (#602)
  - Extracted `inputVariants` from `Input` component to `input-variants.ts` (#603)
  - Extracted `skeletonVariants` from `Skeleton` component to `skeleton-variants.ts` (#604)
  - Extracted `toast` utilities and `toastNotifications` from `Toast` component to `toast-notifications.tsx` (#605)
  - All component functionality and public APIs remain unchanged (100% backwards compatible)
  - Eliminated all 7 Fast Refresh ESLint warnings (reduced from 14 total warnings to 7 unrelated warnings)
  - All 935 tests passing after refactoring
  - No impact on bundle size (15.2 kB for main route, 104 kB shared JS)

### Technical Details

The refactoring follows the React Fast Refresh best practice of separating component exports from utility exports. This allows React's Fast Refresh feature to work correctly during development without triggering full page reloads.

**Files Modified:**

- `components/ui/badge.tsx` - Imports and re-exports variants from new file
- `components/ui/button.tsx` - Imports and re-exports variants from new file
- `components/ui/input.tsx` - Imports variants internally (no re-export needed)
- `components/ui/skeleton.tsx` - Imports variants internally (no re-export needed)
- `components/ui/toast.tsx` - Removed utility exports to fix Fast Refresh

**Files Created:**

- `components/ui/badge-variants.ts` - Badge variant utility exports
- `components/ui/button-variants.ts` - Button variant utility exports
- `components/ui/input-variants.ts` - Input variant utility exports
- `components/ui/skeleton-variants.ts` - Skeleton variant utility exports
- `components/ui/toast-notifications.tsx` - Toast utility and notification exports

**Migration Path:**

For consumers using the variant utilities:

- `Badge` and `Button` components still re-export their variants for backwards compatibility
- Direct imports of variants now available: `import { badgeVariants } from '@/components/ui/badge-variants'`
- Toast utilities moved: `import { toast, toastNotifications } from '@/components/ui/toast-notifications'`

## [0.1.0] - 2025-10-04

### Added

- Initial project setup
- Web3 integration with Wagmi v2 and Reown AppKit
- Design system with violet branding and glass morphism aesthetics
- Tailwind CSS v4 with CSS-first configuration
- Comprehensive test suite with 935+ tests
- Storybook integration for component documentation

[unreleased]: https://github.com/marcusrbrown/tokentoilet/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/marcusrbrown/tokentoilet/releases/tag/v0.1.0
