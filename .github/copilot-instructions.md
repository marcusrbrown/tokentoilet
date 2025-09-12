# Token Toilet - AI Agent Instructions

Token Toilet is a Web3 DeFi application for disposing of unwanted tokens while supporting charitable causes. Built with Next.js 15 App Router + TypeScript + Wagmi v2 + Reown AppKit.

## Architecture Overview

**Web3 Provider Chain**: `app/layout.tsx` → `app/providers.tsx` → `Web3Provider` (Wagmi + TanStack Query) → `ThemeSync`
- All Web3 state flows through Wagmi's provider system via `WagmiAdapter`
- Reown AppKit (formerly Web3Modal) handles wallet connections with violet theming
- Configuration centralized in `lib/web3/config.ts` with multi-chain support

**Component Organization**:
- `/components/web3/` - Web3-specific components (wallet, transactions)
- `/hooks/` - Custom React hooks (wallet abstraction)
- `/lib/web3/` - Web3 configuration and utilities
- `/lib/design-tokens/` - Centralized design system with violet branding

## Key Patterns

### Web3 Integration
```tsx
// Always use the custom useWallet hook for wallet operations
import { useWallet } from '@/hooks/use-wallet'

// Reown AppKit integration via useAppKit from @reown/appkit/react
// Multi-chain support: Ethereum mainnet, Polygon, Arbitrum
// Custom error handling with network validation
```

### Testing Patterns
```tsx
// Web3 components require comprehensive mocking
vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
  useChainId: vi.fn(),
  useDisconnect: vi.fn(),
  useSwitchChain: vi.fn(),
}))

// Test different wallet states and error conditions
// Example: hooks/use-wallet.test.ts, hooks/use-wallet.connection-errors.test.ts
```

### Design Tokens System
```tsx
// Import centralized design tokens for consistent theming
import {violetPalette, semanticColors, glassMorphism} from '@/lib/design-tokens'

// Use semantic color system for Web3 states
import {web3States} from '@/lib/design-tokens/colors'
```

### Component Structure
- Web3 components use `'use client'` directive (client-side only)
- Consistent error boundaries around Web3 operations
- Address formatting: `${address.slice(0, 6)}...${address.slice(-4)}`

### Configuration Management
- Reown AppKit project ID from `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
- Multi-chain configuration: Ethereum mainnet, Polygon, Arbitrum
- Custom RPC endpoints defined in `wagmiAdapter` transports
- Theming integrated with Tailwind's violet color scheme

## Development Workflow

**Local Development**:
```bash
pnpm dev          # Start development server
pnpm build        # Production build
pnpm lint         # ESLint check
pnpm fix          # Auto-fix lint issues
```

**Testing:**
```bash
pnpm test         # Run Vitest test suite
pnpm test:ui      # Run tests with UI
```

**Project Scripts**:
- `pnpm bootstrap` - Install dependencies with optimized settings
- Git hooks with lint-staged automatically format code on commit

**Key Files for Web3 Features**:
- `lib/web3/config.ts` - Multi-chain configuration with WagmiAdapter
- `hooks/use-wallet.ts` - Wallet connection abstraction with error handling
- `components/web3/web3-provider.tsx` - Provider setup with TanStack Query
- `components/web3/wallet-button.tsx` - Connection UI component

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

### Smart Contract Integration (Planned)
- Contract interaction patterns will follow Wagmi's `useContract` hooks
- Token disposal functionality in development
- Multi-chain support (Ethereum mainnet/L2s)

## Reference Documentation
- Existing Cursor rules in `.cursor/rules/` for technology-specific guidance
- Product requirements in `.ai/docs/prd.md`
- Development roadmap in `.ai/docs/plan.md`
