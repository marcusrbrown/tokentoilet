---
goal: Migrate Token Toilet from Tailwind CSS v3 to v4 using CSS-first configuration approach
version: 1.0
date_created: 2025-08-08
last_updated: 2025-09-10
owner: Marcus R. Brown
status: 'In Progress'
tags: ['upgrade', 'tailwind', 'css', 'design-system', 'migration']
---

# Tailwind CSS v3 to v4 Migration Implementation Plan

![Status: In Progress](https://img.shields.io/badge/status-In%20Progress-yellow)

This implementation plan details the systematic migration of Token Toilet's Next.js 15 application from Tailwind CSS v3 to v4, transitioning from JavaScript configuration to the new CSS-first approach using @theme blocks while maintaining the existing violet branding, glass morphism effects, and Web3 design system.

## 1. Requirements & Constraints

- **REQ-001**: Replace three @tailwind directives with single @import "tailwindcss" statement
- **REQ-002**: Convert TypeScript tailwind.config.ts to CSS-first @theme blocks in globals.css
- **REQ-003**: Migrate all design tokens (colors, spacing, typography, shadows, animations) to CSS variables
- **REQ-004**: Replace all @apply directives with standard CSS properties
- **REQ-005**: Maintain visual parity with existing violet branding and glass morphism UI
- **REQ-006**: Preserve Web3 wallet components functionality and styling
- **REQ-007**: Ensure theme toggle continues to work correctly
- **REQ-008**: Maintain responsive layout behaviors
- **SEC-001**: Ensure no build warnings or runtime errors during migration
- **SEC-002**: Validate PostCSS configuration compatibility with Tailwind v4
- **CON-001**: Must preserve existing component APIs and class names where possible
- **CON-002**: Cannot introduce breaking changes to Web3 provider functionality
- **GUD-001**: Follow Tailwind v4 best practices for CSS-first configuration
- **GUD-002**: Maintain semantic naming for design tokens
- **PAT-001**: Use CSS custom properties for all theme variables
- **PAT-002**: Organize @theme blocks logically by token category

## 2. Implementation Steps

### Implementation Phase 1: Backup and Preparation

- GOAL-001: Create migration foundation and backup current state

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-001 | Create migration branch `feature/tailwind-v4-migration` | ✅ | 2025-08-10 |
| TASK-002 | Document current Tailwind v3 configuration and custom utilities | ✅ | 2025-08-10 |
| TASK-003 | Create backup of globals.css and tailwind.config.ts | ✅ | 2025-08-10 |
| TASK-004 | Audit all @apply usage throughout CSS files using grep | ✅ | 2025-08-10 |
| TASK-005 | Verify Tailwind v4 packages are correctly installed (v4.1.11) | ✅ | 2025-08-10 |

### Implementation Phase 2: Theme Configuration Migration

- GOAL-003: Convert tailwind.config.ts design tokens to CSS @theme blocks

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-009 | Create @theme block for violet color palette (--color-violet-*) | ✅ | 2025-09-10 |
| TASK-010 | Create @theme block for Web3 state colors (--color-web3-*) | ✅ | 2025-09-10 |
| TASK-011 | Create @theme block for glass morphism colors (--color-glass-*) | ✅ | 2025-09-10 |
| TASK-012 | Create @theme block for semantic colors (--color-success-*, --color-warning-*, etc.) | ✅ | 2025-09-10 |
| TASK-013 | Create @theme block for spacing tokens (--spacing-*, --spacing-glass-*) | ✅ | 2025-09-10 |
| TASK-014 | Create @theme block for typography tokens (--font-family-*, --font-size-*, --font-weight-*) | ✅ | 2025-09-10 |
| TASK-015 | Create @theme block for shadow tokens (--shadow-*, --shadow-glass-*, --shadow-violet-*) | ✅ | 2025-09-10 |
| TASK-016 | Create @theme block for border radius tokens (--radius-*) | ✅ | 2025-09-10 |
| TASK-017 | Create @theme block for z-index scale (--z-*) | ✅ | 2025-09-10 |
| TASK-018 | Create @theme block for animation durations and timing functions (--duration-*, --timing-*) | ✅ | 2025-09-10 |
| TASK-019 | Create @theme block for backdrop blur values (--blur-*) | ✅ | 2025-09-10 |

### Implementation Phase 3: Component Style Conversion

- GOAL-004: Replace all @apply directives with standard CSS properties

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-020 | Convert .glass-container utility to standard CSS properties using backdrop-filter | ✅ | 2025-09-10 |
| TASK-021 | Convert .btn-primary styles from @apply to standard CSS properties | ✅ | 2025-09-10 |
| TASK-022 | Convert .btn-secondary styles from @apply to standard CSS properties | ✅ | 2025-09-10 |
| TASK-023 | Convert .btn-ghost styles from @apply to standard CSS properties | ✅ | 2025-09-10 |
| TASK-024 | Convert .card component styles from @apply to standard CSS properties | ✅ | 2025-09-10 |
| TASK-025 | Convert form component styles (.form-input, .form-label, .form-error) from @apply | ✅ | 2025-09-10 |
| TASK-026 | Convert navigation styles (.nav-link) from @apply to standard CSS properties | ✅ | 2025-09-10 |
| TASK-027 | Convert Web3 status indicators (.status-*) from @apply to standard CSS properties | ✅ | 2025-09-10 |
| TASK-028 | Convert address display styles (.address-display) from @apply to standard CSS properties | ✅ | 2025-09-10 |
| TASK-029 | Convert loading states (.loading-spinner, .loading-skeleton) from @apply | ✅ | 2025-09-10 |
| TASK-030 | Convert gradient text utilities (.text-gradient) from @apply to standard CSS | ✅ | 2025-09-10 |
| TASK-031 | Convert base styles (body, focus styles) from @apply to standard CSS properties | ✅ | 2025-09-10 |

### Implementation Phase 4: Animation and Keyframe Migration

- GOAL-005: Migrate custom animations and keyframes to CSS-first approach

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-032 | Create CSS keyframes for Web3 animations (wallet-connect, transaction-*, token-flush) | ✅ | 2025-09-10 |
| TASK-033 | Create CSS keyframes for design system animations (fade-in, scale-in, slide-in-*) | ✅ | 2025-09-10 |
| TASK-034 | Create CSS keyframes for loading animations (pulse-subtle, spin-slow, bounce-gentle) | ✅ | 2025-09-10 |
| TASK-035 | Convert animation utilities to use new keyframes and timing functions | ✅ | 2025-09-10 |

### Implementation Phase 5: Testing and Validation

- GOAL-006: Validate migration maintains visual and functional parity

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-036 | Test Web3 wallet button component renders correctly | |  |
| TASK-037 | Test theme toggle switches between light and dark modes correctly | |  |
| TASK-038 | Test glass morphism effects render correctly in both themes | |  |
| TASK-039 | Test gradient backgrounds and violet branding appear correctly | |  |
| TASK-040 | Test responsive layout behaviors on mobile and desktop | |  |
| TASK-041 | Test form components maintain styling and focus states | |  |
| TASK-042 | Test Web3 connection state indicators display correctly | |  |
| TASK-043 | Test card components maintain hover effects and shadows | |  |
| TASK-044 | Verify no build warnings in development and production builds | |  |
| TASK-045 | Verify no console errors in browser during theme switching | |  |

### Implementation Phase 6: Cleanup and Documentation

- GOAL-007: Remove legacy configuration and update documentation

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-046 | Remove tailwind.config.ts file after confirming migration success | |  |
| TASK-047 | Update .gitignore if needed to exclude any new build artifacts | |  |
| TASK-048 | Update Copilot instructions with Tailwind v4 patterns | |  |
| TASK-049 | Create migration documentation for future reference | |  |
| TASK-050 | Update package.json scripts if needed for v4 build process | |  |

## 3. Alternatives

- **ALT-001**: Keep tailwind.config.ts and use hybrid approach - Rejected because it doesn't leverage v4's CSS-first benefits
- **ALT-002**: Gradual migration over multiple releases - Rejected because it would create inconsistent styling approaches
- **ALT-003**: Complete UI redesign during migration - Rejected because it increases scope and risk significantly

## 4. Dependencies

- **DEP-001**: Tailwind CSS v4.1.11 (already installed)
- **DEP-002**: @tailwindcss/postcss v4.1.11 (already installed)
- **DEP-003**: PostCSS v8.5.6 (already installed)
- **DEP-004**: Next.js 15.4.5 compatibility with Tailwind v4
- **DEP-005**: Design token files in lib/design-tokens/ for reference during migration

## 5. Files

- **FILE-001**: app/globals.css - Primary file for CSS import and @theme blocks
- **FILE-002**: tailwind.config.ts - Will be converted to CSS @theme blocks and eventually removed
- **FILE-003**: postcss.config.js - May need updates for v4 compatibility
- **FILE-004**: lib/design-tokens/*.ts - Reference files for token values
- **FILE-005**: components/web3/*.tsx - Web3 components for testing styling
- **FILE-006**: components/theme-toggle.tsx - Theme toggle for testing dark mode
- **FILE-007**: app/layout.tsx - Root layout for testing theme provider integration

## 6. Testing

- **TEST-001**: Visual regression testing for all UI components
- **TEST-002**: Theme switching functionality testing in light and dark modes
- **TEST-003**: Web3 wallet connection flow testing with styling verification
- **TEST-004**: Responsive layout testing on mobile, tablet, and desktop viewports
- **TEST-005**: Glass morphism effect testing with backdrop-filter support
- **TEST-006**: Build process testing for development and production modes
- **TEST-007**: Performance testing to ensure CSS bundle size doesn't increase significantly
- **TEST-008**: Cross-browser testing for CSS custom property support

## 7. Risks & Assumptions

- **RISK-001**: Breaking changes in Tailwind v4 that affect existing utilities
- **RISK-002**: CSS custom property browser compatibility issues
- **RISK-003**: Performance impact from CSS-first approach vs JavaScript configuration
- **RISK-004**: Backdrop-filter browser support for glass morphism effects
- **ASSUMPTION-001**: All existing component class names will continue to work with v4
- **ASSUMPTION-002**: Next.js 15 fully supports Tailwind CSS v4
- **ASSUMPTION-003**: Design token values can be directly converted to CSS custom properties
- **ASSUMPTION-004**: Web3Modal and Wagmi components are compatible with Tailwind v4

## 8. Related Specifications / Further Reading

- [Tailwind CSS v4.0 Official Documentation](https://tailwindcss.com/blog/tailwindcss-v4)
- [Tailwind CSS v4 Theme Configuration Guide](https://tailwindcss.com/docs/theme)
- [Next.js 15 with Tailwind CSS v4 Integration](https://nextjs.org/docs/app/building-your-application/styling/tailwind-css)
- [Token Toilet Copilot Instructions](../.github/copilot-instructions.md)
- [Token Toilet Design System](../lib/design-tokens/index.ts)
