---
goal: Fix critical Tailwind CSS v4 rendering issues causing completely unstyled website
version: 1.0
date_created: 2025-08-08
last_updated: 2025-08-09
owner: Marcus R. Brown
status: 'In Progress'
tags: ['bug', 'urgent', 'tailwind', 'css', 'styling', 'configuration']
---

# Tailwind CSS v4 Rendering Issues - Critical Fix

![Status: In Progress](https://img.shields.io/badge/status-In%20Progress-yellow)

This implementation plan addresses the critical issue where Tailwind CSS styling is completely broken, causing the Token Toilet website to render completely unstyled with no background colors, layouts, or component styling. The root cause is a configuration mismatch between Tailwind CSS v4 and legacy v3 directives.

## 1. Requirements & Constraints

- **REQ-001**: Restore immediate CSS styling functionality to make website usable
- **REQ-002**: Fix Tailwind v4 PostCSS integration with Next.js 15
- **REQ-003**: Replace legacy @tailwind directives with @import "tailwindcss"
- **REQ-004**: Resolve "unknown utility class bg-background" error
- **REQ-005**: Ensure basic Tailwind utilities (bg-red-500, text-white, etc.) work correctly
- **REQ-006**: Validate CSS compilation works without errors
- **REQ-007**: Maintain existing component functionality during fixes
- **SEC-001**: Ensure no build failures or runtime errors during fixes
- **SEC-002**: Preserve existing Web3 functionality and theme toggle
- **CON-001**: Must fix styling issues without breaking existing component APIs
- **CON-002**: Cannot introduce new dependencies or major architectural changes
- **CON-003**: Must work with current Next.js 15 and Tailwind v4.1.11 versions
- **GUD-001**: Follow Tailwind v4 best practices for CSS import and configuration
- **GUD-002**: Use minimal changes to fix immediate issues before full migration
- **PAT-001**: Prefer incremental fixes over complete rewrites
- **PAT-002**: Test each fix stage independently to isolate issues

## 2. Implementation Steps

### Implementation Phase 1: Immediate CSS Fix

- GOAL-001: Restore basic Tailwind CSS functionality to fix unstyled website

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-001 | Replace @tailwind directives with @import "tailwindcss" in app/globals.css | ✅ | 2025-08-09 |
| TASK-002 | Remove or comment problematic CSS custom properties causing utility conflicts | ✅ | 2025-08-09 |
| TASK-003 | Test basic Tailwind utilities (bg-red-500, text-white, p-4) in layout.tsx | ✅ | 2025-08-09 |
| TASK-004 | Verify build process completes without Tailwind-related errors | ✅ | 2025-08-09 |
| TASK-005 | Confirm website renders with basic styling in development mode | ✅ | 2025-08-09 |

### Implementation Phase 2: Configuration Validation

- GOAL-002: Validate and fix PostCSS and Next.js integration issues

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-006 | Verify postcss.config.js uses correct @tailwindcss/postcss plugin configuration | ✅ | 2025-08-09 |
| TASK-007 | Check if postcss.config.mjs is needed instead of .js for Next.js 15 | ✅ | 2025-08-09 |
| TASK-008 | Validate app/globals.css is correctly imported in app/layout.tsx | ✅ | 2025-08-09 |
| TASK-009 | Test build process generates proper CSS output with Tailwind utilities | ✅ | 2025-08-09 |
| TASK-010 | Confirm autoprefixer is working correctly with Tailwind CSS | ✅ | 2025-08-09 |

### Implementation Phase 3: CSS Variable Migration

- GOAL-003: Fix custom CSS variables to work with Tailwind v4 - ✅ **COMPLETED**

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-011 | Convert problematic --background and --foreground variables to @theme blocks | ✅ | 2025-08-09 |
| TASK-012 | Fix bg-background and text-foreground utility classes to use standard Tailwind classes | ✅ | 2025-08-09 |
| TASK-013 | Update layout.tsx to use standard Tailwind classes instead of custom variables | ✅ | 2025-08-09 |
| TASK-014 | Test that custom CSS variables don't conflict with Tailwind utilities | ✅ | 2025-08-09 |
| TASK-015 | Validate dark mode functionality still works with updated variables | ✅ | 2025-08-09 |

### Implementation Phase 4: Component Styling Verification

- GOAL-004: Ensure all existing components render correctly with restored CSS

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-016 | Test Web3 wallet button component displays correctly | |  |
| TASK-017 | Verify theme toggle component functions and styles properly | |  |
| TASK-018 | Check that glass morphism effects render correctly | |  |
| TASK-019 | Validate form components maintain proper styling | |  |
| TASK-020 | Confirm responsive layout works on mobile and desktop | |  |

### Implementation Phase 5: Build and Production Testing

- GOAL-005: Validate fixes work in both development and production builds

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-021 | Run development build (pnpm dev) and verify styling loads correctly | |  |
| TASK-022 | Run production build (pnpm build) without CSS compilation errors | |  |
| TASK-023 | Test production preview (pnpm start) shows correct styling | |  |
| TASK-024 | Verify CSS bundle size is reasonable and assets load properly | |  |
| TASK-025 | Check browser console for any CSS-related warnings or errors | |  |

### Implementation Phase 6: Documentation and Next Steps

- GOAL-006: Document fixes and prepare for full Tailwind v4 migration

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-026 | Document the root cause and applied fixes in issue resolution notes | |  |
| TASK-027 | Update Copilot instructions with Tailwind v4 patterns if needed | |  |
| TASK-028 | Identify remaining @apply directives that need future migration | |  |
| TASK-029 | Plan timeline for completing full Tailwind v4 migration using existing plan | |  |
| TASK-030 | Create regression testing checklist for future styling changes | |  |

## 3. Alternatives

- **ALT-001**: Downgrade to Tailwind CSS v3 - Rejected because v4 is already installed and provides better features
- **ALT-002**: Complete full migration in one step - Rejected due to high risk and need for immediate fix
- **ALT-003**: Use inline styles temporarily - Rejected because it doesn't address root configuration issue
- **ALT-004**: Switch to different CSS framework - Rejected due to extensive existing Tailwind usage

## 4. Dependencies

- **DEP-001**: Tailwind CSS v4.1.11 (already installed)
- **DEP-002**: @tailwindcss/postcss v4.1.11 (already installed)
- **DEP-003**: PostCSS v8.5.6 (already installed)
- **DEP-004**: Next.js 15.4.5 (already installed)
- **DEP-005**: autoprefixer 10.4.21 (already installed)

## 5. Files

- **FILE-001**: app/globals.css - Primary CSS file needing @import directive fix
- **FILE-002**: app/layout.tsx - Layout file with problematic CSS classes to update
- **FILE-003**: postcss.config.js - PostCSS configuration to validate
- **FILE-004**: package.json - Dependency versions for reference
- **FILE-005**: tailwind.config.ts - Current config file that may be causing conflicts
- **FILE-006**: components/web3/wallet-button.tsx - Component for styling verification
- **FILE-007**: components/theme-toggle.tsx - Component for theme testing

## 6. Testing

- **TEST-001**: Visual verification that website renders with proper styling
- **TEST-002**: Build process testing (development and production)
- **TEST-003**: Basic Tailwind utility testing (colors, spacing, typography)
- **TEST-004**: Component functionality testing (Web3, theme toggle)
- **TEST-005**: Responsive design testing on different screen sizes
- **TEST-006**: Dark mode theme switching testing
- **TEST-007**: Browser compatibility testing for CSS features
- **TEST-008**: Performance testing to ensure CSS bundle size is acceptable

## 7. Risks & Assumptions

- **RISK-001**: Additional configuration issues may emerge after initial fix
- **RISK-002**: Custom CSS variables may have broader compatibility issues
- **RISK-003**: PostCSS plugin compatibility issues with Next.js 15
- **RISK-004**: Breaking changes in Tailwind v4 that affect existing components
- **ASSUMPTION-001**: Current PostCSS setup is fundamentally correct for v4
- **ASSUMPTION-002**: Next.js 15 fully supports Tailwind CSS v4 with proper configuration
- **ASSUMPTION-003**: Existing component markup is compatible with Tailwind v4
- **ASSUMPTION-004**: CSS custom properties can coexist with Tailwind utilities once properly configured

## 8. Related Specifications / Further Reading

- [Tailwind CSS v4 Installation Guide](https://tailwindcss.com/docs/installation)
- [Next.js with Tailwind CSS Setup](https://nextjs.org/docs/app/building-your-application/styling/tailwind-css)
- [Tailwind CSS v4 Migration from v3](https://tailwindcss.com/docs/upgrade-guide)
- [PostCSS Configuration with Tailwind v4](https://tailwindcss.com/docs/installation/using-postcss)
- [Token Toilet Tailwind v4 Migration Plan](./upgrade-tailwind-v4-1.md)
