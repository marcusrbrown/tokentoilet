# AGENTS.md

## Project Overview

Token Toilet is a Web3 DeFi application built with Next.js 15 that helps users dispose of unwanted tokens while supporting charitable causes. The application features a modern architecture with Web3 wallet integration, multi-chain support, and a violet-themed glass morphism design system.

**Core Technologies:**

- Next.js 15 with App Router and TypeScript
- Wagmi v2 + Web3Modal (Reown AppKit) for Web3 integration
- Tailwind CSS v4 with CSS-first configuration approach
- Vitest for testing with React Testing Library
- pnpm as package manager

**Architecture:**

- Web3 Provider Chain: `app/layout.tsx` → `app/providers.tsx` → `Web3Provider`
- Component Organization: `/components/web3/` for Web3 components, `/hooks/` for custom hooks
- Configuration: `/lib/web3/` for Web3 config, `/lib/design-tokens/` for design system
- Multi-chain support: Ethereum mainnet, Polygon, Arbitrum

## Setup Commands

```bash
# Install dependencies with optimized settings
pnpm bootstrap

# OR standard install
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## Environment Configuration

Create `.env.local` with required Web3 configuration:

```bash
# Required: Get from https://cloud.walletconnect.com
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

## Development Workflow

**Development Server:**

- Start with `pnpm dev` - runs on <http://localhost:3000>
- Hot reload enabled for all file changes
- Web3 components require client-side rendering (`'use client'` directive)

**Key Development Patterns:**

- Use `useWallet` hook from `@/hooks/use-wallet` for all wallet operations
- Web3Modal integration via `useWeb3Modal` from `@web3modal/wagmi/react`
- Address formatting: `${address.slice(0, 6)}...${address.slice(-4)}`
- Error boundaries around all Web3 operations

**File Organization:**

- `/app/` - Next.js App Router pages and layouts
- `/components/web3/` - Web3-specific components (wallet, transactions)
- `/hooks/` - Custom React hooks (wallet abstraction)
- `/lib/web3/` - Web3 configuration and utilities
- `/lib/design-tokens/` - Centralized design system

## Testing Instructions

**Run Tests:**
```bash
# Run all tests
pnpm test

# Run tests with UI
pnpm test:ui

# Run tests in watch mode (for development)
pnpm vitest

# Run specific test file
pnpm vitest use-wallet.test.ts

# Run tests matching pattern
pnpm vitest -t "wallet connection"
```

**Test Structure:**
- Test files located alongside source files with `.test.ts` suffix
- Vitest configuration in `vitest.config.ts` with jsdom environment
- Setup file `vitest.setup.ts` configures global test environment
- React Testing Library for component testing
- Custom test utilities for Web3 mocking

**Key Testing Patterns:**
- Web3 components require mocked wallet providers
- Use `@testing-library/user-event` for user interactions
- Test files cover: wallet connections, error states, UI components
- Focus areas: `/hooks/use-wallet.*.test.ts`, `/components/theme-*.test.tsx`

## Code Style Guidelines

**ESLint Configuration:**
- Run linting: `pnpm lint`
- Auto-fix issues: `pnpm fix`
- Configuration in `eslint.config.ts` using `@bfra.me/eslint-config`
- Next.js specific rules enabled
- Pre-commit hooks automatically run linting

**TypeScript Conventions:**
- Strict TypeScript configuration in `tsconfig.json`
- Use absolute imports with `@/` prefix
- Web3 types from Wagmi and Viem
- Component props should be explicitly typed

**Styling Patterns (Tailwind CSS v4):**
- **CSS-First Approach**: All configuration in `app/globals.css` using `@theme` blocks
- **NO `tailwind.config.ts`**: Fully migrated to CSS-first configuration
- **Primary Colors**: Violet branding (`bg-violet-500`, `text-violet-600`, `border-violet-300`)
- **Dark Mode**: Use `dark:` classes with custom variant `@custom-variant dark (&:where(.dark, .dark *))`
- **Glass Morphism**: Use `.glass-container`, `.glass-card`, `.glass-button` classes
- **Web3 State Colors**: Available as `--color-web3-connected`, `--color-web3-pending`, etc.

**Anti-Patterns to Avoid:**
- Creating `tailwind.config.ts` files
- Using `@apply` directives anywhere
- Legacy `@tailwind` directives
- JavaScript-based theme configuration

**Naming Conventions:**
- Components: PascalCase (`WalletButton.tsx`)
- Hooks: camelCase with `use` prefix (`useWallet.ts`)
- Files: kebab-case for multi-word files (`wallet-button.tsx`)
- Constants: SCREAMING_SNAKE_CASE

## Build and Deployment

**Build Process:**
```bash
# Production build
pnpm build

# Build outputs to `.next/` directory
# Static assets in `.next/static/`
# Server-side code in `.next/server/`
```

**Environment-Specific Builds:**
- Development: `pnpm dev` (hot reload, source maps)
- Production: `pnpm build && pnpm start` (optimized bundle)
- Static export: Not recommended due to Web3 requirements

**Deployment Requirements:**
- Node.js 18+ runtime environment
- Environment variables: `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
- HTTPS required for Web3 wallet connections
- Support for WebSockets (for wallet connections)

## Pull Request Guidelines

**Title Format:** `[component] Brief description`

**Required Checks Before Committing:**
```bash
# Always run before committing
pnpm lint
pnpm test
pnpm build
```

**Pre-commit Automation:**
- Git hooks automatically run `lint-staged` on commit
- Auto-fixes ESLint issues and formats code
- Sorts `package.json` automatically

**Review Requirements:**
- All tests must pass in CI
- ESLint checks must pass
- Build must succeed
- Web3 functionality should be tested with wallet connections

## Web3 Development Guidelines

**Wallet Integration:**
- Use `useWallet` hook for all wallet operations
- Handle connection errors gracefully (no throw on disconnect)
- Support multiple wallet types (MetaMask, WalletConnect, Coinbase)
- Test with different wallet states (connected, connecting, disconnected)

**Multi-Chain Support:**
- Configuration in `lib/web3/config.ts`
- Supported chains: Ethereum mainnet, Polygon, Arbitrum
- Chain switching handled by Web3Modal
- RPC endpoints configurable per chain

**Error Handling Patterns:**

```typescript
// Web3 operations wrapped in try/catch
try {
  const result = await walletClient.writeContract({
    // contract parameters
  })
  console.log('Transaction successful:', result)
} catch (error) {
  console.error('Transaction failed:', error)
  // Graceful fallback UI
}
```

## Security Considerations

**Environment Variables:**

- Never commit private keys or sensitive data
- Use `NEXT_PUBLIC_` prefix only for client-safe variables
- WalletConnect Project ID is safe to expose publicly

**Web3 Security:**

- Always validate contract addresses
- Implement proper error boundaries for Web3 operations
- Use established libraries (Wagmi, Viem) for crypto operations
- Never store private keys in application code

## Debugging and Troubleshooting

**Common Issues:**

1. **Wallet Connection Failures:**
   - Check `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` environment variable
   - Ensure HTTPS in production
   - Verify Web3Modal configuration

2. **Build Errors:**
   - Run `pnpm build` to check for TypeScript errors
   - Check Next.js console for specific error messages
   - Verify all imports use absolute paths with `@/` prefix

3. **Test Failures:**
   - Check Vitest setup in `vitest.setup.ts`
   - Ensure jsdom environment is configured
   - Mock Web3 providers for component tests

**Debug Configuration:**

- Next.js dev server provides detailed error messages
- Browser console shows Web3 connection status
- Vitest UI available with `pnpm test:ui`

**Performance Monitoring:**

- Web3 operations can be slow on congested networks
- Implement loading states for all blockchain interactions
- Use React Suspense for async components

## Additional Notes

**Package Manager:**

- This project uses pnpm with workspace configuration
- Lock file: `pnpm-lock.yaml` should be committed
- Package manager version specified in `package.json`

**Git Workflow:**

- Main branch: `main`
- Pre-commit hooks handle formatting and linting
- CI runs on all PRs and pushes to main

**Design System:**

- Violet brand colors defined in CSS custom properties
- Glass morphism components available as utility classes
- Dark mode support via CSS custom variants
- All design tokens centralized in `app/globals.css`

**Future Considerations:**

- Smart contract integration planned for token disposal
- Multi-chain expansion beyond current supported networks
- Advanced DeFi features for charitable giving mechanisms
