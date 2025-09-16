# Token Toilet - AI Agent Instructions

Token Toilet is a Web3 DeFi application for disposing of unwanted tokens while supporting charitable causes. Built with Next.js 15 App Router + TypeScript + Wagmi v2 + Reown AppKit.

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
- `/lib/design-tokens/` - Legacy design tokens (migrated to CSS @theme blocks)

## Key Patterns

### Web3 Integration
```tsx
// ALWAYS use the custom useWallet hook - never direct wagmi hooks in components
import { useWallet } from '@/hooks/use-wallet'

// Reown AppKit integration via useAppKit from @reown/appkit/react
// Multi-chain support: Ethereum mainnet (1), Polygon (137), Arbitrum (42161)
// Network validation with detailed error classification and auto-switching
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
}))

vi.mock('@reown/appkit/react', () => ({
  useAppKit: vi.fn(() => ({ open: vi.fn() })),
}))

// Test files co-located with source: component.test.ts
// Focus: wallet states, error boundaries, network validation
```

### Component Structure & Address Formatting
```tsx
// Web3 components use 'use client' directive (client-side only)
'use client'

// Consistent address formatting pattern used throughout
const displayAddress = `${address.slice(0, 6)}...${address.slice(-4)}`

// Error boundaries around all Web3 operations with graceful fallbacks
// Network info from NETWORK_INFO mapping in useWallet hook
```

### Configuration Management
- Reown AppKit project ID from `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
- Multi-chain config in `wagmiAdapter` with custom RPC endpoints
- Supported chains via `SUPPORTED_CHAIN_IDS` const assertion
- Theming integrated with Tailwind's violet color scheme via CSS custom properties

## Development Workflow

**Local Development**:
```bash
pnpm bootstrap    # Install dependencies with optimized settings (preferred)
pnpm dev          # Start development server
pnpm build        # Production build
pnpm lint         # ESLint check
pnpm fix          # Auto-fix lint issues
```

**Testing**:
```bash
pnpm test         # Run Vitest test suite
pnpm test:ui      # Run tests with UI
# Test files: component.test.ts co-located with source files
```

**Key Files**:
- `lib/web3/config.ts` - WagmiAdapter with multi-chain RPC endpoints
- `hooks/use-wallet.ts` - Wallet abstraction with NetworkValidationError types
- `vitest.config.ts` - jsdom environment with @ alias resolution
- `app/globals.css` - Complete Tailwind v4 configuration via @theme blocks

## Project-Specific Conventions

### Error Handling
- Web3 operations wrapped in try/catch with console.error logging
- Graceful fallbacks for wallet connection failures
- No throw on disconnect/connection errors

### Testing Patterns
- Web3 components require mocked wallet providers in tests
- Test files use pattern: `component.test.ts` alongside source files
- Comprehensive wallet state testing: connected, connecting, error states
- Mock patterns: `vi.mock('wagmi')` and `vi.mock('@reown/appkit/react')`
- Focus on error boundaries and network validation scenarios

### State Management
- Wagmi handles Web3 state (accounts, chains, connections)
- TanStack Query for async state management
- Next-themes for theme persistence

### Styling Patterns
- **Tailwind CSS v4**: Uses CSS-first approach with `@import "tailwindcss"` in `app/globals.css`
- **Primary Colors**: Violet branding (`bg-violet-500`, `text-violet-600`, `border-violet-300`)
- **Dark Mode**: Support via `dark:` classes and CSS custom properties with custom variant `@custom-variant dark (&:where(.dark, .dark *))`
- **Gradient Backgrounds**: `from-violet-50 to-blue-50`, `from-violet-400 to-blue-600`
- **Glass Morphism**: Complete glass container utilities with backdrop-filter support
- **Centralized Design System**: Complete migration from `/lib/design-tokens/` to CSS `@theme` blocks

#### Tailwind v4 Migration Completed (2025-09-10)
**✅ Configuration Approach**:
- **NO `tailwind.config.ts`** - Fully converted to CSS-first using `@theme` blocks in `app/globals.css`
- **CSS Variables**: All design tokens converted to CSS custom properties (`--color-violet-*`, `--spacing-*`, etc.)
- **Zero @apply**: All 64+ `@apply` directives eliminated - use component classes or utility combinations
- **Single Import**: `@import "tailwindcss"` replaces legacy `@tailwind base; @tailwind components; @tailwind utilities;`

**🎨 Design Token Architecture**:
```css
@theme {
  /* Violet Brand Palette */
  --color-violet-50: #f5f3ff;
  --color-violet-500: #8b5cf6;

  /* Web3 State Colors */
  --color-web3-connected: #10b981;
  --color-web3-pending: #f59e0b;

  /* Glass Morphism Colors */
  --color-glass-light-primary: rgb(255 255 255 / 0.8);
  --color-glass-dark-primary: rgb(17 24 39 / 0.8);

  /* Spacing, Typography, Shadows, Animations */
  --spacing-glass-xs: 0.75rem;
  --font-family-display: ui-serif, Georgia, serif;
  --shadow-glass-subtle: 0 1px 3px rgb(0 0 0 / 0.1);
  --duration-fast: 150ms;
}
```

**🚫 Anti-Patterns (Avoid)**:
- Creating new `tailwind.config.ts` files
- Using `@apply` directives anywhere
- Legacy `@tailwind` directives
- JavaScript-based theme configuration
- Custom CSS that duplicates Tailwind utilities

**✅ Best Practices**:
- Use CSS `@theme` blocks for design tokens
- Component-based CSS classes with standard properties
- CSS custom properties for theme variables
- Utility-first approach with semantic class combinations
- Glass morphism via `.glass-container`, `.glass-card`, `.glass-button` classes

## Reference Documentation
- Product requirements in `.ai/docs/prd.md`
- Development roadmap in `.ai/docs/plan.md`
