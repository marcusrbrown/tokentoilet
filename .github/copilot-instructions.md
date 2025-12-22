# Token Toilet - AI Agent Instructions

Token Toilet is a Web3 DeFi application for disposing of unwanted tokens while supporting charitable causes. Built with Next.js 15 App Router + TypeScript + Wagmi v2 + Reown AppKit, featuring a complete design system with violet branding and glass morphism aesthetics.

## Documentation Structure

**Primary Documentation**: All core project documentation is referenced in `llms.txt` at the project root
- **Product Specs**: `docs/prd.md` - comprehensive product requirements (715 lines)
- **Development Plan**: `docs/plan.md` - detailed roadmap and progress tracking (384 lines)
- **Design System**: `docs/design-system/getting-started.md` - complete component library guide (534 lines)
- **Design System Migration**: `docs/design-system/migration-guide.md` - component migration patterns (970 lines)
- **Contributing**: `CONTRIBUTING.md` - development workflow and coding standards (499 lines)

**Always reference `llms.txt` first** when looking for project context - it provides structured links to all relevant documentation.

## Architecture Overview

**Web3 Provider Chain**: `app/layout.tsx` → `app/providers.tsx` → `Web3Provider` (Wagmi + TanStack Query) → `ThemeSync`
- All Web3 state flows through Wagmi's provider system via `WagmiAdapter`
- Reown AppKit (formerly Web3Modal) handles wallet connections with violet theming
- Configuration centralized in `lib/web3/config.ts` with multi-chain support (Ethereum, Polygon, Arbitrum)
- `ThemeSync` component bridges Next-themes with Reown AppKit theming

**Component Organization**:
- `/components/web3/` - Web3-specific components (wallet, transactions) - always use `'use client'`
- `/hooks/` - Custom React hooks (wallet abstraction) - `useWallet` is the primary interface
- `/lib/web3/` - Web3 configuration and utilities
- `/components/ui/` - Design system components with comprehensive test coverage

## Key Patterns

### Web3 Integration
```tsx
// ALWAYS use the custom useWallet hook - never direct wagmi hooks in components
import { useWallet } from '@/hooks/use-wallet'

// Reown AppKit integration via useAppKit from @reown/appkit/react
// Multi-chain support: Ethereum mainnet (1), Polygon (137), Arbitrum (42161)
// Network validation with detailed error classification and auto-switching
```

### Token Approval Workflow
```tsx
// Use useTokenApproval for all ERC-20 approval operations
import { useTokenApproval } from '@/hooks/use-token-approval'

// Provides: approval state tracking, gas estimation, transaction queue integration
const { approvalState, gasEstimate, approve } = useTokenApproval({
  token,
  spender: DISPOSAL_CONTRACT_ADDRESS,
  amount: parseUnits('100', token.decimals),
  useInfiniteApproval: false, // Or true for max uint256
  autoRefresh: true // Auto-refresh allowance after approval
})

// Approval state includes: isApproved, currentAllowance, isPending, error
// Gas estimate includes: gasLimit, totalCost, totalCostFormatted
```

### Critical Web3 Error Handling
```tsx
// NEVER throw on disconnect/connection errors - use console.error + graceful fallbacks
connect().catch(error => {
  console.error('Failed to connect:', error)
  // Show user-friendly error state
})

// Network validation returns structured errors with user messages
const unsupportedNetworkError = getUnsupportedNetworkError()
if (unsupportedNetworkError) {
  // Handle with auto-switch option: handleUnsupportedNetwork(true)
}
```

### Testing Patterns (Vitest + jsdom)
```tsx
// Comprehensive Web3 mocking - REQUIRED for all Web3 components
vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
  useChainId: vi.fn(),
  useDisconnect: vi.fn(),
  useSwitchChain: vi.fn(),
  useReadContract: vi.fn(), // For token allowance checks
  useWriteContract: vi.fn(), // For approval transactions
  useEstimateGas: vi.fn(), // For gas estimation
}))

vi.mock('@reown/appkit/react', () => ({
  useAppKit: vi.fn(() => ({ open: vi.fn() })),
}))

// Mock network imports for consistent testing
vi.mock('@reown/appkit/networks', () => ({
  mainnet: {id: 1},
  polygon: {id: 137},
  arbitrum: {id: 42161},
}))

// Mock token approval hook for component tests
vi.mock('@/hooks/use-token-approval', () => ({
  useTokenApproval: vi.fn(() => ({
    approvalState: { isApproved: false, currentAllowance: 0n, isPending: false },
    gasEstimate: { totalCostFormatted: '0.001 ETH' },
    approve: vi.fn(),
  })),
}))

// CRITICAL: Use computed property names for hook mocks to avoid ESLint warnings
vi.mock('next-themes', () => {
  const hookName = 'useTheme'
  return {
    [hookName]: () => mockUseTheme(),  // No react-hooks-extra/no-unnecessary-use-prefix warning
  }
})

// Test files co-located with source: component.test.ts, component.test.tsx
// E2E workflow tests in: components/web3/__tests__/token-workflows.e2e.test.tsx
// Focus: wallet states, error boundaries, network validation, approval workflows
```

### React Hooks Best Practices (Critical)
```tsx
// ALWAYS use functional updates when setting state in useEffect
// ❌ AVOID: Direct state updates (stale closure risk)
useEffect(() => {
  setCount(count + 1)
}, [dependency])

// ✅ CORRECT: Functional updates (always uses latest value)
useEffect(() => {
  setCount(prev => prev + 1)
}, [dependency])

// Exception: Direct updates acceptable when loading external data
useEffect(() => {
  const data = localStorage.getItem('key')
  // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect -- Loading from external source
  setData(() => data)  // Not deriving from previous state
}, [])

// ALWAYS capture ref values at effect execution time for cleanup
// ❌ AVOID: Using ref.current directly in cleanup
useEffect(() => {
  const interval = setInterval(() => queueRef.current.process(), 1000)
  return () => {
    clearInterval(interval)
    queueRef.current.cleanup()  // May be null at cleanup time
  }
}, [])

// ✅ CORRECT: Capture ref value at effect execution
useEffect(() => {
  const queue = queueRef.current  // Capture now
  const interval = setInterval(() => queue.process(), 1000)
  return () => {
    clearInterval(interval)
    queue.cleanup()  // Uses captured value
  }
}, [])
```

### Fast Refresh Compliance
```tsx
// Component exports must be separated from utility exports
// to prevent React Fast Refresh warnings

// ❌ AVOID: Exporting utilities from component files
export const Badge = () => { /* ... */ }
export const badgeVariants = cva(/* ... */)  // Causes Fast Refresh warning

// ✅ CORRECT: Separate files for variants
// components/ui/badge-variants.ts
export const badgeVariants = cva(/* ... */)

// components/ui/badge.tsx
import { badgeVariants } from './badge-variants'
export const Badge = () => { /* ... */ }
export { badgeVariants }  // Re-export for convenience
```

### Component Structure & Address Formatting
```tsx
// Web3 components use 'use client' directive (client-side only)
'use client'

// Consistent address formatting pattern used throughout
const displayAddress = `${address.slice(0, 6)}...${address.slice(-4)}`
// Example: "0x1234...7890"

// Error boundaries around all Web3 operations with graceful fallbacks
// Network info from NETWORK_INFO mapping in useWallet hook
// Component class available: .address-display with monospace font
```

## Development Workflow

**Package Manager**: pnpm@10.18.0 (enforced via packageManager field)

**Local Development**:
```bash
pnpm bootstrap    # Install dependencies with optimized settings (preferred)
pnpm dev          # Start development server
pnpm build        # Production build
pnpm lint         # ESLint check
pnpm fix          # Auto-fix lint issues
```

**Testing & Storybook**:
```bash
pnpm test         # Run Vitest test suite
pnpm test:ui      # Run tests with UI
pnpm storybook    # Start Storybook development server
pnpm build-storybook  # Build static Storybook
# Test files: component.test.ts co-located with source files
```

**Validation & Quality Assurance**:
```bash
pnpm validate     # Run all checks: lint, type-check, test, design system, build
pnpm validate:design-system  # Validate design system completeness
pnpm validate:web3           # Validate Web3 integration patterns
pnpm type-check   # TypeScript type checking without build
```

**Key Environment Setup**:
- Environment variables in `.env.local` (see `.env.example` for template)
- Web3 RPC endpoints configured in `lib/web3/config.ts` with Alchemy fallbacks
- **Critical**: Project uses `env.ts` for validated environment variable access via `@t3-oss/env-nextjs`
  - Custom validation schemas: `rpcUrlSchema` (HTTPS required), `walletConnectProjectIdSchema` (32+ char hex)
  - Access via `import {env} from '@/env'` - NEVER use `process.env` directly
  - Schema validation skipped in CI/test/build, but required for dev/production
- Multi-chain support requires `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` from [WalletConnect Cloud](https://cloud.walletconnect.com)
- Optional RPC URLs: `NEXT_PUBLIC_ETHEREUM_RPC_URL`, `NEXT_PUBLIC_POLYGON_RPC_URL`, `NEXT_PUBLIC_ARBITRUM_RPC_URL`

**Key Files**:
- `lib/web3/config.ts` - WagmiAdapter with multi-chain RPC endpoints and Reown AppKit theming
- `hooks/use-wallet.ts` - Complete wallet abstraction with NetworkValidationError types (305 lines)
- `hooks/use-token-approval.ts` - Token approval workflow with gas estimation (330 lines)
- `hooks/use-wallet-persistence.ts` - LocalStorage-based wallet connection persistence
- `vitest.config.ts` - jsdom environment with @ alias resolution
- `vitest.setup.ts` - Global test mocks (matchMedia, canvas, React global)
- `app/globals.css` - Complete Tailwind v4 configuration via @theme blocks (1039 lines)
- `docs/design-system/getting-started.md` - Comprehensive design system documentation (534 lines)
- `docs/design-system/migration-guide.md` - Component migration patterns (970 lines)
- `scripts/validate-design-system.ts` - Automated design system validation script
- `scripts/validate-web3-integration.ts` - Automated Web3 integration validation script

## Project-Specific Conventions

### Error Handling
- Web3 operations wrapped in try/catch with console.error logging
- Graceful fallbacks for wallet connection failures
- No throw on disconnect/connection errors
- Structured error classification with NetworkValidationError types

### Testing Patterns
- Web3 components require mocked wallet providers in tests
- Test files use pattern: `component.test.ts` alongside source files
- Comprehensive wallet state testing: connected, connecting, error states
- Mock patterns: `vi.mock('wagmi')` and `vi.mock('@reown/appkit/react')`
- Use computed property names for hook mocks to avoid ESLint warnings
- Focus on error boundaries and network validation scenarios
- Wallet-specific test files: MetaMask, WalletConnect, Coinbase Wallet

### State Management
- Wagmi handles Web3 state (accounts, chains, connections)
- TanStack Query for async state management
- Next-themes for theme persistence

### Styling Patterns - Tailwind CSS v4 (Migration Complete)
- **CSS-First Approach**: Uses `@import "tailwindcss"` in `app/globals.css` - Tailwind v4.1.13
- **NO JavaScript Config**: `tailwind.config.ts` was eliminated - CSS-only configuration
- **Primary Colors**: Violet branding (`bg-violet-500`, `text-violet-600`, `border-violet-300`)
- **Dark Mode**: Support via `@custom-variant dark (&:where(.dark, .dark *))` and CSS custom properties
- **Glass Morphism**: `.glass-container` utility class with backdrop-filter support
- **Design Tokens**: All design tokens are CSS custom properties in `@theme` blocks
  - Colors: `--color-violet-*`, `--color-web3-*`, `--color-glass-*`
  - Spacing: `--spacing-glass-*` (xs through 2xl)
  - Shadows: `--shadow-glass-*`, `--shadow-violet-glow`
  - Blur: `--blur-*` (sm through 3xl)
  - Animation: `--duration-*`, `--timing-*`

#### Critical CSS Patterns
```css
/* NEVER use @apply directives - all 64+ were eliminated in migration */
/* Use component classes with standard CSS properties instead */

.glass-container {
  background-color: var(--color-glass-light-primary);
  backdrop-filter: blur(12px);
  border: 1px solid var(--color-glass-light-border);
}

/* Use CSS custom properties for theming */
@theme {
  --color-violet-500: #8b5cf6;
  --color-glass-light-primary: rgb(255 255 255 / 0.8);
}
```

#### Anti-Patterns (Critical - Avoid)
- **Creating `tailwind.config.ts`** - Project uses CSS-first approach only
- **Using `@apply` directives** - All were removed in v4 migration
- **Legacy `@tailwind` directives** - Use `@import "tailwindcss"` instead
- **JavaScript-based theme configuration** - Use CSS `@theme` blocks

### Component Development
- Design system components in `/components/ui/` with comprehensive test coverage
- Storybook stories for component documentation and testing (Storybook v9.x)
- Co-located tests: `component.test.ts` alongside each component
- Glass morphism aesthetic with `backdrop-filter: blur(var(--blur-md))` pattern
- Consistent violet color scheme with `var(--color-violet-*)` custom properties
- Web3 components ALWAYS require `'use client'` directive and comprehensive mocking in tests

### Address Formatting Pattern
```typescript
// Standard address display format used throughout the app
const displayAddress = `${address.slice(0, 6)}...${address.slice(-4)}`
// Example: "0x1234...7890"

// Component class available: .address-display with monospace font
```

## Reference Documentation
**Always start with `llms.txt`** - it provides structured navigation to:
- Product requirements in `docs/prd.md` (715 lines)
- Development roadmap in `docs/plan.md` (384 lines)
- Design system guide in `docs/design-system/getting-started.md` (507 lines)
- Design system migration guide in `docs/design-system/migration-guide.md` (970 lines)
- Contributing guidelines in `CONTRIBUTING.md` (499 lines)
