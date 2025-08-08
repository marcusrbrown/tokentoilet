# Token Toilet - AI Agent Instructions

Token Toilet is a Web3 DeFi application for disposing of unwanted tokens while supporting charitable causes. Built with Next.js 14 App Router + TypeScript + Wagmi + Web3Modal.

## Architecture Overview

**Web3 Provider Chain**: `app/layout.tsx` → `app/providers.tsx` → `Web3Provider` (Wagmi + TanStack Query) → `ThemeProvider`
- All Web3 state flows through Wagmi's provider system
- Web3Modal handles wallet connections with project-specific theming
- Configuration centralized in `lib/web3/config.ts`

**Component Organization**:
- `/components/web3/` - Web3-specific components (wallet, transactions)
- `/hooks/` - Custom React hooks (wallet abstraction)
- `/lib/web3/` - Web3 configuration and utilities

## Key Patterns

### Web3 Integration
```tsx
// Always use the custom useWallet hook for wallet operations
import { useWallet } from '@/hooks/use-wallet'

// Web3Modal integration via useWeb3Modal from @web3modal/wagmi/react
// Custom error handling in wallet connection flows
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
pnpm format       # Prettier formatting
```

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
- Tailwind with violet primary color (`bg-violet-500`, `text-violet-600`)
- Dark mode support via `dark:` classes
- Gradient backgrounds: `from-violet-50 to-blue-50`
- Glass morphism: `bg-white/80 backdrop-blur-md`

### Smart Contract Integration (Planned)
- Contract interaction patterns will follow Wagmi's `useContract` hooks
- Token disposal functionality in development
- Multi-chain support (Ethereum mainnet/L2s)

## Reference Documentation
- Existing Cursor rules in `.cursor/rules/` for technology-specific guidance
- Product requirements in `.ai/docs/prd.md`
- Development roadmap in `.ai/docs/plan.md`
