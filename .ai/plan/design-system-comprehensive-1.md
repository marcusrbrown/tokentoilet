---
goal: Create Comprehensive Design System for Token Toilet Web3 DeFi Application
version: 1.0
date_created: 2025-08-08
last_updated: 2025-09-12
owner: marcusrbrown
status: 'In Progress'
tags: ['design', 'feature', 'ui', 'design-system', 'web3', 'tailwindcss', 'components']
---

# Create Comprehensive Design System for Token Toilet Web3 DeFi Application

![Status: In Progress](https://img.shields.io/badge/status-In%20Progress-yellow)

This implementation plan establishes a comprehensive design system for Token Toilet that codifies existing styling patterns into reusable components and design tokens. The system supports the Web3 DeFi application's violet brand identity while maintaining consistency across wallet connections, transaction flows, and charitable token disposal features.

## 1. Requirements & Constraints

- **REQ-001**: Establish violet-based color palette (`violet-50` to `violet-900`) as primary brand color with semantic Web3 state tokens
- **REQ-002**: Create spacing scale compatible with glass morphism and backdrop blur effects
- **REQ-003**: Set up typography scale optimized for DeFi interfaces and wallet address display
- **REQ-004**: Define elevation/shadow tokens for layered UI components
- **REQ-005**: Build component library on existing glass morphism patterns (`bg-white/80 backdrop-blur-md`)
- **REQ-006**: Maintain gradient backgrounds (`from-violet-50 to-blue-50`) for hero sections
- **REQ-007**: Preserve address formatting utilities (`${address.slice(0, 6)}...${address.slice(-4)}`)
- **REQ-008**: Ensure comprehensive dark mode support with `dark:` variant classes
- **REQ-009**: Create systematic components for WalletButton, Modal/Dialog, Cards, Forms, Navigation, and Feedback
- **REQ-010**: Extend TailwindCSS configuration with semantic naming and custom utilities

- **SEC-001**: Ensure design tokens don't expose sensitive Web3 configuration data
- **SEC-002**: Validate accessibility compliance for wallet connection flows

- **CON-001**: Must maintain compatibility with Next.js 14 App Router patterns and `'use client'` components
- **CON-002**: Must integrate seamlessly with next-themes v0.4.4 for dark mode persistence
- **CON-003**: Must preserve Web3Modal project-specific theming integration
- **CON-004**: Must follow existing provider chain: `layout.tsx` → `providers.tsx` → `Web3Provider` → `ThemeProvider`
- **CON-005**: Must work with existing TailwindCSS 4.1.11, ESLint 9.32.0, and Prettier 3.6.2 setup
- **CON-006**: Must use pnpm package manager for dependency management

- **GUD-001**: Follow atomic design principles for component hierarchy
- **GUD-002**: Implement design tokens using CSS custom properties for runtime theme switching
- **GUD-003**: Use TypeScript for all component APIs with comprehensive prop typing
- **GUD-004**: Follow Web Content Accessibility Guidelines (WCAG) 2.1 AA standards

- **PAT-001**: Maintain glass morphism pattern: `bg-white/80 backdrop-blur-md` with hover states
- **PAT-002**: Continue using lucide-react icon library for consistency
- **PAT-003**: Preserve existing component structure with `'use client'` directives for interactive components
- **PAT-004**: Follow established naming convention for Web3-specific components in `/components/web3/`

## 2. Implementation Steps

### Implementation Phase 1: Design Token Foundation & TailwindCSS Configuration

- GOAL-001: Establish comprehensive design token system and extend TailwindCSS configuration

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-001 | Create `lib/design-tokens/colors.ts` with violet palette and Web3 semantic tokens | ✅ | 2025-08-08 |
| TASK-002 | Create `lib/design-tokens/spacing.ts` with spacing scale for glass morphism layouts | ✅ | 2025-08-08 |
| TASK-003 | Create `lib/design-tokens/typography.ts` with DeFi-optimized font scales and address formatting | ✅ | 2025-08-08 |
| TASK-004 | Create `lib/design-tokens/shadows.ts` with elevation tokens for layered components | ✅ | 2025-08-08 |
| TASK-005 | Create `lib/design-tokens/animations.ts` with wallet connection flow presets | ✅ | 2025-08-08 |
| TASK-006 | Update `tailwind.config.js` to extend theme with all design tokens and custom utilities | ✅ | 2025-08-08 |
| TASK-007 | Update `app/globals.css` with CSS custom properties for design tokens | ✅ | 2025-08-08 |
| TASK-008 | Create `lib/design-tokens/index.ts` as centralized export for all design tokens | ✅ | 2025-08-08 |

### Implementation Phase 2: Core UI Component Library

- GOAL-002: Build foundational UI components using design token system

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-009 | Create `components/ui/button.tsx` with variant system and Web3 states | ✅ | 2025-09-12 |
| TASK-010 | Create `components/ui/card.tsx` with glass morphism effects and elevation levels | | |
| TASK-011 | Create `components/ui/modal.tsx` with backdrop blur and Web3Modal theming integration | | |
| TASK-012 | Create `components/ui/input.tsx` with Web3 address validation and formatting | | |
| TASK-013 | Create `components/ui/badge.tsx` for connection states and network indicators | | |
| TASK-014 | Create `components/ui/toast.tsx` for transaction notifications and error handling | | |
| TASK-015 | Create `components/ui/skeleton.tsx` for loading states during wallet operations | | |
| TASK-016 | Create `lib/utils.ts` with className merging utilities and design token helpers | ✅ | 2025-09-12 |

### Implementation Phase 3: Web3-Specific Components

- GOAL-003: Develop specialized components for Web3 DeFi functionality

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-017 | Refactor `components/web3/wallet-button.tsx` to use design system button component | | |
| TASK-018 | Create `components/ui/address-display.tsx` with formatting utilities and copy functionality | | |
| TASK-019 | Create `components/ui/network-badge.tsx` for chain identification and switching | | |
| TASK-020 | Create `components/ui/token-input.tsx` for amount entry with validation | | |
| TASK-021 | Create `components/ui/transaction-card.tsx` for history and status display | | |
| TASK-022 | Create `components/ui/charity-selector.tsx` for token disposal targeting | | |
| TASK-023 | Create `components/ui/connection-status.tsx` for wallet state visualization | | |
| TASK-024 | Update `components/theme-toggle.tsx` to use design system button variants | | |

### Implementation Phase 4: Documentation & Tooling Setup

- GOAL-004: Establish comprehensive documentation and development tooling

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-025 | Install and configure Storybook 8.x for component development and documentation | | |
| TASK-026 | Create `docs/design-system/getting-started.md` with installation and usage guide | | |
| TASK-027 | Create `docs/design-system/design-tokens.md` with token reference and usage examples | | |
| TASK-028 | Create `docs/design-system/components.md` with component API documentation | | |
| TASK-029 | Create `.storybook/main.ts` configuration with TailwindCSS and design token support | | |
| TASK-030 | Create story files for all UI components with Web3-specific examples | | |
| TASK-031 | Set up ESLint rules in `.eslintrc.js` to enforce design system component usage | | |
| TASK-032 | Create `docs/design-system/accessibility.md` with WCAG compliance guidelines | | |

### Implementation Phase 5: Migration & Integration

- GOAL-005: Migrate existing components and establish design system integration

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-033 | Create migration script to update existing component imports to design system | | |
| TASK-034 | Update `app/page.tsx` to use design system components instead of inline Tailwind | | |
| TASK-035 | Migrate navigation bar in `app/page.tsx` to use design system card and button components | | |
| TASK-036 | Create `docs/design-system/migration-guide.md` for converting ad-hoc styles | | |
| TASK-037 | Add design system validation to `package.json` scripts for CI/CD integration | | |
| TASK-038 | Update `README.md` with design system documentation links and usage examples | | |
| TASK-039 | Create design system changelog in `docs/design-system/CHANGELOG.md` | | |
| TASK-040 | Validate all components work with Web3Modal and wagmi integration | | |

## 3. Alternatives

- **ALT-001**: Adopt existing design system like Chakra UI or Mantine - Rejected due to Web3-specific requirements and existing glass morphism aesthetic
- **ALT-002**: Use shadcn/ui component library - Rejected due to need for custom Web3 components and brand-specific violet theming
- **ALT-003**: Continue with ad-hoc Tailwind classes - Rejected due to lack of consistency and maintainability concerns
- **ALT-004**: Build CSS-in-JS solution with styled-components - Rejected due to bundle size and existing TailwindCSS investment
- **ALT-005**: Use Headless UI with custom styling - Considered but rejected due to additional complexity and limited Web3-specific features

## 4. Dependencies

- **DEP-001**: `@storybook/react` v8.x - Component development and documentation platform
- **DEP-002**: `@storybook/nextjs` v8.x - Next.js integration for Storybook
- **DEP-003**: `class-variance-authority` v0.7.x - Type-safe component variant system
- **DEP-004**: `clsx` v2.x - Conditional className utility
- **DEP-005**: `tailwind-merge` v2.x - TailwindCSS class merging utility
- **DEP-006**: `@tailwindcss/forms` v0.5.x - Form styling utilities
- **DEP-007**: `@tailwindcss/typography` v0.5.x - Typography utilities for documentation
- **DEP-008**: `react-hot-toast` v2.x - Toast notification system
- **DEP-009**: `framer-motion` v11.x - Animation library for component transitions

## 5. Files

- **FILE-001**: `lib/design-tokens/` - Design token definitions (colors, spacing, typography, shadows, animations)
- **FILE-002**: `components/ui/` - Core design system component library
- **FILE-003**: `tailwind.config.js` - Extended TailwindCSS configuration with design tokens
- **FILE-004**: `app/globals.css` - Updated global styles with CSS custom properties
- **FILE-005**: `docs/design-system/` - Comprehensive design system documentation
- **FILE-006**: `.storybook/` - Storybook configuration and setup files
- **FILE-007**: `lib/utils.ts` - Utility functions for className merging and design token helpers
- **FILE-008**: `components/web3/wallet-button.tsx` - Refactored to use design system
- **FILE-009**: `components/theme-toggle.tsx` - Updated to use design system button variants
- **FILE-010**: `app/page.tsx` - Migrated to use design system components
- **FILE-011**: `package.json` - Updated with design system dependencies and scripts

## 6. Testing

- **TEST-001**: Visual regression tests for all UI components in light and dark modes
- **TEST-002**: Component unit tests with Jest and React Testing Library for prop validation
- **TEST-003**: Accessibility tests using @testing-library/jest-dom and axe-core
- **TEST-004**: Integration tests for Web3 components with mock wallet providers
- **TEST-005**: Storybook interaction tests for component behavior validation
- **TEST-006**: Design token validation tests to ensure CSS custom property consistency
- **TEST-007**: Performance tests for component bundle size and render optimization
- **TEST-008**: Cross-browser compatibility tests for glass morphism effects

## 7. Risks & Assumptions

- **RISK-001**: TailwindCSS 4.x compatibility issues with design token CSS custom properties - Mitigation: Test thoroughly and use fallback values
- **RISK-002**: Bundle size increase from additional dependencies - Mitigation: Use tree-shaking and analyze bundle impact
- **RISK-003**: Glass morphism effects may not work consistently across browsers - Mitigation: Implement progressive enhancement with fallbacks
- **RISK-004**: Complex component prop APIs may reduce developer experience - Mitigation: Provide comprehensive documentation and TypeScript support
- **RISK-005**: Migration complexity for existing components - Mitigation: Create automated migration scripts and comprehensive guides

- **ASSUMPTION-001**: TailwindCSS 4.1.11 will remain stable during development period
- **ASSUMPTION-002**: Next.js 15.4.5 App Router patterns will continue to work with design system
- **ASSUMPTION-003**: Existing Web3Modal theming integration will be compatible with new design tokens
- **ASSUMPTION-004**: Development team will adopt Storybook for component development workflow
- **ASSUMPTION-005**: ESLint rules enforcement will be acceptable to development workflow
- **ASSUMPTION-006**: Glass morphism aesthetic will remain core to brand identity

## 8. Related Specifications / Further Reading

- [TailwindCSS Configuration Documentation](https://tailwindcss.com/docs/configuration)
- [Storybook for Next.js Setup Guide](https://storybook.js.org/docs/get-started/nextjs)
- [Design Tokens Community Group Specification](https://design-tokens.github.io/community-group/)
- [Web Content Accessibility Guidelines (WCAG) 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- [Atomic Design Principles by Brad Frost](https://bradfrost.com/blog/post/atomic-web-design/)
- [CSS Custom Properties for Design Systems](https://web.dev/at-property/)
- [Class Variance Authority Documentation](https://cva.style/docs)
- [Token Toilet Copilot Instructions](../../.github/copilot-instructions.md)
- [Web3Modal v3 Upgrade Plan](./upgrade-web3modal-reown-appkit-1.md)
