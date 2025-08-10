# Token Toilet - AI Agent Instructions

Token Toilet is a Web3 DeFi application for disposing of unwanted tokens while supporting charitable causes. Built with Next.js 15 App Router + TypeScript + Wagmi v2 + Web3Modal.

## Architecture Overview

**Web3 Provider Chain**: `app/layout.tsx` → `app/providers.tsx` → `Web3Provider` (Wagmi + TanStack Query) → `ThemeProvider`
- All Web3 state flows through Wagmi's provider system
- Web3Modal handles wallet connections with project-specific theming
- Configuration centralized in `lib/web3/config.ts`

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

// Web3Modal integration via useWeb3Modal from @web3modal/wagmi/react
// Custom error handling in wallet connection flows
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
- Web3Modal project ID from `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
- Chain configuration supports mainnet + sepolia for development
- Theming integrated with Tailwind's violet color scheme

## Development Workflow

**Local Development**:
```bash
pnpm dev          # Start development server
pnpm build        # Production build
pnpm lint         # ESLint check
pnpm fix          # Auto-fix lint issues
```

**Project Scripts**:
- `pnpm bootstrap` - Install dependencies with optimized settings
- Git hooks with lint-staged automatically format code on commit

**Key Files for Web3 Features**:
- `lib/web3/config.ts` - Chain and wallet configuration
- `hooks/use-wallet.ts` - Wallet connection abstraction
- `components/web3/web3-provider.tsx` - Provider setup
- `components/web3/wallet-button.tsx` - Connection UI component

## Project-Specific Conventions

### Error Handling
- Web3 operations wrapped in try/catch with console.error logging
- Graceful fallbacks for wallet connection failures
- No throw on disconnect/connection errors

### State Management
- Wagmi handles Web3 state (accounts, chains, connections)
- TanStack Query for async state management
- Next-themes for theme persistence

### Styling Patterns
- **Tailwind CSS v4**: Uses CSS-first approach with `@import "tailwindcss"` in `app/globals.css`
- **Primary Colors**: Violet branding (`bg-violet-500`, `text-violet-600`, `border-violet-300`)
- **Dark Mode**: Support via `dark:` classes and CSS custom properties
- **Gradient Backgrounds**: `from-violet-50 to-blue-50`, `from-violet-400 to-blue-600`
- **Glass Morphism**: `bg-white/80 backdrop-blur-md` for glass container effects
- **Centralized Design System**: `/lib/design-tokens/` with semantic color system

#### Tailwind v4 Best Practices
- Use standard Tailwind utilities instead of custom CSS variables when possible
- CSS custom properties defined in `:root` for theme variables
- Avoid `@apply` directives - use component classes or utility combinations
- CSS imports: `@import "tailwindcss"` (not the legacy `@tailwind base;` directives)
- Build process: PostCSS with `@tailwindcss/postcss` plugin

### Smart Contract Integration (Planned)
- Contract interaction patterns will follow Wagmi's `useContract` hooks
- Token disposal functionality in development
- Multi-chain support (Ethereum mainnet/L2s)

## Reference Documentation
- Existing Cursor rules in `.cursor/rules/` for technology-specific guidance
- Product requirements in `.ai/docs/prd.md`
- Development roadmap in `.ai/docs/plan.md`
