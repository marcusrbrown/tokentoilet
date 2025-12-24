# Token Toilet - Development Rules & Guidelines

> Technical standards and conventions for AI-assisted development

**Version:** 1.0
**Date:** December 23, 2025
**Source:** [PRD v2.0](./prd.md) | [FEATURES.md](./FEATURES.md)
**Status:** Active

---

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Code Organization](#code-organization)
- [Naming Conventions](#naming-conventions)
- [Component Standards](#component-standards)
- [Web3 Integration Rules](#web3-integration-rules)
- [Design System Requirements](#design-system-requirements)
- [Testing Standards](#testing-standards)
- [Performance Requirements](#performance-requirements)
- [Security Guidelines](#security-guidelines)
- [Accessibility Standards](#accessibility-standards)
- [Error Handling](#error-handling)
- [Documentation Standards](#documentation-standards)
- [Implementation Priorities](#implementation-priorities)
- [General Guidelines](#general-guidelines)

---

## Overview

This document establishes technical standards for the Token Toilet Web3 application. These rules ensure consistency, quality, and alignment with project requirements across all development work.

**Key Principles:**
1. Design system components over raw HTML elements
2. Custom hooks over direct library imports
3. Type safety without exceptions
4. Accessibility as a requirement, not an enhancement
5. Security-first Web3 interactions

---

## Technology Stack

### Core Technologies (Required Versions)

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.x | App Router, SSR, API routes |
| React | 19.x | UI framework |
| TypeScript | 5.9+ | Type safety (strict mode required) |
| Tailwind CSS | 4.x | Styling with design tokens |
| Wagmi | 2.x | React hooks for Ethereum |
| Reown AppKit | 1.7+ | Wallet connection |
| Viem | 2.x | TypeScript Ethereum library |
| TanStack Query | 5.x | Server state management |
| Vitest | 4.x | Testing framework |
| Storybook | 10.x | Component documentation |

### Package Manager

- **Use:** pnpm 10.x exclusively
- **Lock file:** Always commit `pnpm-lock.yaml`
- **Workspace:** Monorepo-ready with `pnpm-workspace.yaml`

### Blockchain Networks (MVP)

| Network | Chain ID | Priority |
|---------|----------|----------|
| Ethereum Mainnet | 1 | Primary |
| Polygon PoS | 137 | Secondary |
| Arbitrum One | 42161 | Secondary |

---

## Code Organization

### Folder Structure

```
tokentoilet/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Home page
│   └── providers.tsx      # Client-side providers
├── components/
│   ├── ui/                # Design system components
│   │   ├── *.tsx          # Component implementation
│   │   ├── *-variants.ts  # CVA variant definitions
│   │   ├── *.stories.tsx  # Storybook stories
│   │   └── *.test.tsx     # Component tests
│   └── web3/              # Web3-specific components
│       ├── dynamic/       # Dynamically loaded components
│       └── __tests__/     # Web3 component tests
├── hooks/                 # Custom React hooks
│   ├── use-*.ts           # Hook implementation
│   └── use-*.test.ts      # Hook tests
├── lib/
│   ├── design-tokens/     # Design system tokens
│   ├── web3/              # Web3 utilities and config
│   ├── env/               # Environment validation
│   └── telemetry/         # Performance monitoring
├── docs/                  # Documentation
└── tests/                 # E2E and integration tests
```

### File Responsibilities

| Directory | Responsibility |
|-----------|----------------|
| `app/` | Page components, layouts, route handlers only |
| `components/ui/` | Reusable design system components |
| `components/web3/` | Wallet, network, transaction components |
| `hooks/` | Stateful logic, side effects, data fetching |
| `lib/` | Pure utilities, configuration, types |

---

## Naming Conventions

### File Names

| Type | Convention | Example |
|------|------------|---------|
| Components | kebab-case | `address-display.tsx` |
| Hooks | kebab-case with `use-` prefix | `use-wallet.ts` |
| Utilities | kebab-case | `token-utils.ts` |
| Types | kebab-case with `-types` suffix | `wallet-error-types.ts` |
| Tests | Same as source + `.test.ts(x)` | `use-wallet.test.ts` |
| Stories | Same as component + `.stories.tsx` | `button.stories.tsx` |
| Variants | Same as component + `-variants.ts` | `button-variants.ts` |

### Code Identifiers

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `AddressDisplay` |
| Hooks | camelCase with `use` prefix | `useWallet` |
| Functions | camelCase | `classifyWalletError` |
| Constants | SCREAMING_SNAKE_CASE | `SUPPORTED_CHAIN_IDS` |
| Types/Interfaces | PascalCase | `NetworkValidationError` |
| Enums | PascalCase | `TransactionStatus` |
| CSS classes | kebab-case (via Tailwind) | `bg-violet-600` |

### Component Props

```typescript
// Interface naming: ComponentName + Props
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}
```

---

## Component Standards

### Export Pattern

**ALWAYS use named exports. Never use default exports.**

```typescript
// CORRECT
export {Button}
export type {ButtonProps}

// INCORRECT - DO NOT USE
export default Button
```

### Component Structure

```typescript
'use client' // Required for Web3 components

import type {VariantProps} from 'class-variance-authority'
import {cn} from '@/lib/utils'

// 1. Types and interfaces first
export interface ComponentProps {
  // Props definition
}

// 2. Variant definitions (or import from -variants.ts)
const componentVariants = cva('base-classes', {
  variants: { /* ... */ },
  defaultVariants: { /* ... */ }
})

// 3. Component implementation
/**
 * Component description with JSDoc
 *
 * @example
 * ```tsx
 * <Component variant="primary">Content</Component>
 * ```
 */
const Component = ({prop1, prop2, className, ...props}: ComponentProps) => {
  // Implementation
  return (
    <div className={cn(componentVariants({variant}), className)} {...props}>
      {/* Content */}
    </div>
  )
}

Component.displayName = 'Component'

// 4. Exports at bottom
export {Component}
```

### Variant System (CVA)

Use class-variance-authority for all component variants:

```typescript
// button-variants.ts
import {cva} from 'class-variance-authority'

export const buttonVariants = cva(
  // Base styles
  'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary: 'bg-violet-600 text-white hover:bg-violet-700',
        secondary: 'bg-white/80 backdrop-blur-md border border-violet-200 text-violet-700 hover:bg-white/90',
        ghost: 'text-violet-600 hover:bg-violet-50',
        destructive: 'bg-red-600 text-white hover:bg-red-700',
        web3Connected: 'bg-green-500 text-white',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-base',
        lg: 'h-12 px-6 text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)
```

### Required Component Features

Every UI component MUST include:

- [ ] TypeScript interface for props
- [ ] JSDoc documentation with examples
- [ ] `displayName` property
- [ ] `className` prop merged with `cn()`
- [ ] Keyboard accessibility support
- [ ] ARIA attributes where applicable
- [ ] Loading state (if interactive)
- [ ] Disabled state styling

---

## Web3 Integration Rules

### Wallet Abstraction

**NEVER import wagmi hooks directly in application code.** Use the `useWallet` hook abstraction.

```typescript
// CORRECT - Use abstraction
import {useWallet} from '@/hooks/use-wallet'

const Component = () => {
  const {address, isConnected, connect, disconnect} = useWallet()
}

// INCORRECT - Direct wagmi import
import {useAccount, useConnect} from 'wagmi'
```

**Exceptions:** Only these files may import wagmi directly:
- `hooks/use-wallet.ts`
- `hooks/use-*.ts` (wallet-related hooks)
- `lib/web3/**/*.ts`
- `components/web3/web3-provider.tsx`

### Client Directive

All Web3 components MUST include `'use client'` directive:

```typescript
'use client'

import {useWallet} from '@/hooks/use-wallet'
// ...
```

### Network Validation

Always validate network before transactions:

```typescript
const {isCurrentChainSupported, switchToChain, validateCurrentNetwork} = useWallet()

const handleTransaction = async () => {
  const networkError = validateCurrentNetwork()
  if (networkError) {
    // Handle unsupported network
    return
  }
  // Proceed with transaction
}
```

### Error Handling Pattern

Use wallet-specific error classification:

```typescript
import {classifyWalletError, getWalletErrorRecovery} from '@/lib/web3/wallet-error-detector'

try {
  await performWeb3Action()
} catch (error) {
  const walletError = classifyWalletError(error as Error, {
    action: 'connect',
    chainId,
  })
  const recovery = getWalletErrorRecovery(walletError)
  // Display user-friendly message with recovery actions
}
```

### Transaction Safety

1. **Always simulate** transactions before submission
2. **Add 20% gas buffer** to estimates
3. **Wait for 2 confirmations** before marking complete
4. **Provide speed-up/cancel** options for stuck transactions

---

## Design System Requirements

### Component Usage Rules

**NEVER use raw HTML elements when design system components exist.**

| Instead of | Use |
|------------|-----|
| `<button>` | `<Button>` from `@/components/ui/button` |
| `<input>` | `<Input>` or `<TokenInput>` from `@/components/ui/*` |
| `<div className="bg-white/80 backdrop-blur">` | `<Card>` from `@/components/ui/card` |
| `<span className="bg-* rounded">` | `<Badge>` from `@/components/ui/badge` |
| `<div className="animate-pulse">` | `<Skeleton>` from `@/components/ui/skeleton` |

### Restricted Imports

These external UI libraries are **FORBIDDEN**:

```typescript
// DO NOT IMPORT - Use design system instead
import {Something} from '@headlessui/*'
import {Something} from '@radix-ui/*'
import {Something} from '@mantine/*'
import {Something} from '@chakra-ui/*'
```

### Color System

Use the violet brand palette consistently:

```typescript
// Primary brand colors
'bg-violet-600'  // Primary actions
'bg-violet-700'  // Hover states
'text-violet-50' // Light text on violet

// Web3 semantic colors
'bg-green-500'   // Connected state
'bg-amber-500'   // Pending/connecting
'bg-red-500'     // Error/disconnected

// Glass morphism pattern
'bg-white/80 backdrop-blur-md dark:bg-gray-900/80'
```

### Glass Morphism Pattern

Standard glass container:

```tsx
<div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-white/20 dark:border-gray-600/20 rounded-2xl shadow-lg">
  {children}
</div>
```

### Theme Support

All components MUST support light and dark modes:

```tsx
// Use dark: prefix for dark mode variants
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
```

---

## Testing Standards

### Framework

- **Unit tests:** Vitest with `@testing-library/react`
- **Accessibility:** `vitest-axe` for WCAG compliance
- **Coverage:** Minimum 80% for new code

### Test File Structure

```typescript
import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi, beforeEach} from 'vitest'

describe('ComponentName', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Feature Group', () => {
    it('should do specific thing', () => {
      // Arrange
      // Act
      // Assert
    })
  })
})
```

### Web3 Mocking Pattern

```typescript
// Mock wagmi hooks
vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
  useChainId: vi.fn(),
  useDisconnect: vi.fn(),
  useSwitchChain: vi.fn(),
}))

// Mock Reown AppKit
vi.mock('@reown/appkit/react', () => ({
  useAppKit: vi.fn(() => ({
    open: vi.fn(),
  })),
}))

// Mock network imports
vi.mock('@reown/appkit/networks', () => ({
  mainnet: {id: 1},
  polygon: {id: 137},
  arbitrum: {id: 42161},
}))
```

### Required Test Categories

1. **Component tests:** Rendering, variants, interactions
2. **Hook tests:** State changes, side effects
3. **Accessibility tests:** WCAG compliance with axe-core
4. **Integration tests:** Cross-component workflows
5. **Web3 tests:** Wallet connection, network switching, transactions

---

## Performance Requirements

### Core Web Vitals Targets

| Metric | Target | Priority |
|--------|--------|----------|
| LCP (Largest Contentful Paint) | <2.5s | Must Have |
| FID (First Input Delay) | <100ms | Must Have |
| CLS (Cumulative Layout Shift) | <0.1 | Must Have |
| TTI (Time to Interactive) | <3s | Must Have |

### Bundle Size

- **Total JS bundle:** <500KB gzipped
- **Code splitting:** By route (automatic with App Router)
- **Tree shaking:** Verify effective via bundle analyzer

### Dynamic Imports

Use dynamic imports for heavy components:

```typescript
import dynamic from 'next/dynamic'

const WalletModal = dynamic(
  () => import('@/components/web3/wallet-modal').then(mod => ({default: mod.WalletModal})),
  {
    loading: () => <WalletModalSkeleton />,
    ssr: false,
  }
)
```

### Token Discovery Performance

- **Target:** <5 seconds for wallets with up to 100 tokens
- **Pagination:** Required for wallets with >100 tokens
- **Caching:** Cache token metadata to reduce API calls

---

## Security Guidelines

### Input Validation

Use Zod schemas for ALL user inputs:

```typescript
import {z} from 'zod'

const tokenAmountSchema = z.string()
  .regex(/^\d+\.?\d*$/, 'Invalid amount format')
  .refine(val => parseFloat(val) > 0, 'Amount must be positive')

const addressSchema = z.string()
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address')
```

### Environment Variables

- **Server-side only:** API keys, RPC URLs
- **Validation:** Use `@t3-oss/env-nextjs` for type-safe env vars
- **Never expose:** Private keys, API secrets in client code

### Content Security Policy

Implement strict CSP headers:

```typescript
// next.config.ts
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
  }
]
```

### Forbidden Patterns

```typescript
// NEVER suppress type errors
const value = something as any          // FORBIDDEN
// @ts-ignore                           // FORBIDDEN
// @ts-expect-error                     // FORBIDDEN

// NEVER use empty catch blocks
try { } catch (e) { }                   // FORBIDDEN

// NEVER store sensitive data in localStorage without encryption
localStorage.setItem('privateKey', key) // FORBIDDEN
```

---

## Accessibility Standards

### WCAG 2.1 Level AA Compliance

| Requirement | Implementation |
|-------------|----------------|
| Color contrast | 4.5:1 minimum for text |
| Keyboard navigation | Full support for all interactions |
| Screen reader | Compatible with ARIA attributes |
| Focus indicators | Visible focus ring on all interactive elements |
| Alt text | Required for all images |
| Form labels | Associated labels for all inputs |

### Focus Management

```tsx
// Always include visible focus styles
<button className="focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2">
```

### Reduced Motion

Respect user preferences:

```tsx
<div className="motion-safe:animate-bounce motion-reduce:animate-none">
```

### ARIA Patterns

```tsx
// Loading states
<button aria-busy={isLoading} aria-disabled={isLoading}>
  {isLoading && <span className="sr-only">Loading...</span>}
</button>

// Status indicators
<div role="status" aria-live="polite">
  {statusMessage}
</div>
```

---

## Error Handling

### Console Usage

```typescript
// ALLOWED
console.warn('Non-critical warning')
console.error('Error occurred:', error)

// FORBIDDEN in production code
console.log('Debug message')  // Use proper logging
```

### User-Facing Errors

Always provide:
1. **User-friendly message** (non-technical)
2. **Recovery action** (what to do next)
3. **Technical details** (for debugging, collapsible)

```typescript
interface UserError {
  message: string           // "Unable to connect wallet"
  userFriendlyMessage: string  // "Please check that MetaMask is installed and unlocked"
  recoveryAction?: string   // "Try Again" | "Switch Network" | "Contact Support"
  technicalDetails?: string // Original error stack for debugging
}
```

### Web3 Error Classification

Classify errors by type for appropriate handling:

```typescript
type WalletErrorCode =
  | 'CONNECTION_REJECTED'
  | 'WALLET_NOT_FOUND'
  | 'WALLET_LOCKED'
  | 'UNSUPPORTED_NETWORK'
  | 'NETWORK_SWITCH_FAILED'
  | 'INSUFFICIENT_FUNDS'
  | 'USER_REJECTED_TRANSACTION'
  | 'RPC_ENDPOINT_FAILED'
```

---

## Documentation Standards

### JSDoc Requirements

All exported functions and components MUST have JSDoc:

```typescript
/**
 * Connects to user's Web3 wallet using Reown AppKit.
 *
 * Supports MetaMask, WalletConnect, and Coinbase Wallet.
 * Automatically validates network after connection.
 *
 * @example
 * ```tsx
 * const {connect} = useWallet()
 *
 * const handleConnect = async () => {
 *   try {
 *     await connect()
 *   } catch (error) {
 *     // Handle connection error
 *   }
 * }
 * ```
 *
 * @throws {WalletSpecificError} When connection fails
 * @returns {Promise<void>}
 */
const connect = async (): Promise<void> => {
  // Implementation
}
```

### Storybook Stories

Every UI component MUST have a story:

```typescript
// button.stories.tsx
import type {Meta, StoryObj} from '@storybook/react'
import {Button} from './button'

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost'],
    },
  },
}

export default meta
type Story = StoryObj<typeof Button>

export const Primary: Story = {
  args: {
    children: 'Connect Wallet',
    variant: 'primary',
  },
}
```

---

## Implementation Priorities

### Phase 1: Foundation (Weeks 1-2)
- Wallet connection with Reown AppKit
- Multi-chain support (Ethereum, Polygon, Arbitrum)
- Token discovery and display
- Error handling infrastructure

### Phase 2: Token Management (Weeks 3-4)
- Token selection interface
- Approval workflow
- Transaction monitoring
- Smart contract deployment (testnet)

### Phase 3: Disposal & Animation (Weeks 5-6)
- Token disposal flow
- Flush animation (60fps)
- Testnet deployment
- Integration testing

### Phase 4: Charity & NFT (Weeks 7-8)
- The Giving Block integration
- NFT receipt minting
- UI polish
- Security audit preparation

### Feature Priority (MoSCoW)

| Priority | Focus |
|----------|-------|
| **Must Have** | Wallet connection, token discovery, disposal flow, charity integration |
| **Should Have** | NFT receipts, animations, theme support |
| **Could Have** | Receipt sharing, advanced filtering |
| **Won't Have (MVP)** | Solana support, multiple charities, mobile app |

---

## General Guidelines

### Code Quality

1. **No TODOs in production code** - Create issues instead
2. **No commented-out code** - Delete it, use git history
3. **No placeholder implementations** - Complete or don't commit
4. **No magic numbers** - Use named constants or design tokens

### When Uncertain

1. **Check existing patterns** in similar files
2. **Consult design system** documentation
3. **Ask for clarification** before implementing
4. **Document decisions** in code comments

### Code Review Checklist

Before submitting code:
- [ ] TypeScript strict mode passes (`pnpm type-check`)
- [ ] ESLint passes (`pnpm lint`)
- [ ] Tests pass (`pnpm test`)
- [ ] Storybook builds (`pnpm build-storybook`)
- [ ] No `any` types or error suppressions
- [ ] Accessibility requirements met
- [ ] Design system components used (not raw HTML)
- [ ] Web3 hooks abstracted through `useWallet`

### Commit Standards

Follow conventional commits:

```
feat: add wallet connection button
fix: resolve network switching error on Polygon
docs: update RULES.md with testing standards
refactor: extract token validation to shared hook
test: add unit tests for useWallet hook
```

---

## Summary

These rules ensure Token Toilet maintains:

1. **Consistency** - Unified patterns across all code
2. **Type Safety** - Full TypeScript coverage without exceptions
3. **Accessibility** - WCAG 2.1 AA compliance
4. **Performance** - Core Web Vitals targets met
5. **Security** - Input validation, safe Web3 interactions
6. **Maintainability** - Clear structure, documentation, tests

When in doubt, prioritize:
1. User safety (especially for Web3 interactions)
2. Accessibility
3. Type safety
4. Performance
5. Developer experience

---

*Generated from PRD v2.0 and codebase analysis - December 23, 2025*
