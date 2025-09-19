# Development Setup Guide

A comprehensive guide for setting up your development environment for Token Toilet, a Web3 DeFi application built with Next.js 15 App Router, TypeScript, Wagmi v2, and Reown AppKit.

## Prerequisites

### Required Software

- **Node.js 18.17+**: Use [Node Version Manager (nvm)](https://github.com/nvm-sh/nvm) for easy version management
- **pnpm**: Fast, efficient package manager

  ```bash
  npm install -g pnpm
  ```

- **Git**: Version control
- **Web3 Wallet**: MetaMask, WalletConnect, or Coinbase Wallet for testing

### Optional Tools

- **Visual Studio Code**: Recommended IDE with extensions:
  - ESLint
  - Prettier
  - TypeScript
  - Tailwind CSS IntelliSense
  - Solidity (for future smart contract development)

## Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/marcusrbrown/tokentoilet.git
cd tokentoilet

# Install dependencies with optimized settings
pnpm bootstrap

# Copy environment variables template
cp .env.example .env.local
```

### 2. Configure Environment Variables

Edit `.env.local` with your values:

```dotenv
# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# WalletConnect Project ID (required)
# Get from https://cloud.walletconnect.com
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

See [Environment Setup Guide](environment-setup.md) for detailed configuration options.

### 3. Start Development Server

```bash
# Start the development server
pnpm dev

# Open in browser
open http://localhost:3000
```

## Development Workflow

### Available Scripts

```bash
# Development
pnpm dev                # Start development server
pnpm build              # Build for production
pnpm start              # Start production server

# Code Quality
pnpm lint               # Run ESLint
pnpm fix                # Auto-fix linting issues
pnpm test               # Run test suite
pnpm test:ui            # Run tests with UI

# Component Development
pnpm storybook          # Start Storybook development server
pnpm build-storybook    # Build static Storybook

# Dependencies
pnpm bootstrap          # Install with optimized settings (preferred over pnpm install)
```

### Git Hooks and Code Quality

The project uses automated code quality enforcement:

- **Pre-commit hooks**: Automatically run linting and formatting on staged files
- **ESLint**: Enforces Web3 development patterns and design system usage
- **Prettier**: Automatic code formatting
- **TypeScript**: Strict type checking

```bash
# Check code quality manually
pnpm lint               # ESLint check
pnpm fix                # Auto-fix issues
pnpm test               # Run all tests
```

## Project Structure

```text
tokentoilet/
├── app/                          # Next.js 15 App Router
│   ├── layout.tsx               # Root layout with Web3 providers
│   ├── page.tsx                 # Home page
│   ├── providers.tsx            # Client-side provider setup
│   └── globals.css              # Tailwind CSS v4 configuration
├── components/
│   ├── ui/                      # Design system components
│   └── web3/                    # Web3-specific components ('use client')
├── hooks/
│   └── use-wallet.ts            # Primary wallet abstraction hook
├── lib/
│   ├── web3/                    # Web3 configuration and utilities
│   ├── utils.ts                 # General utilities
│   └── env/                     # Environment variable validation
├── docs/
│   ├── development/             # Development guides
│   ├── design-system/           # Design system documentation
│   └── deployment/              # Deployment guides
└── tests/                       # Test files (co-located with source)
```

## Web3 Development Patterns

### Core Principles

1. **Always use the custom `useWallet` hook** - Never use wagmi hooks directly in components
2. **Web3 components require `'use client'` directive** - Client-side only
3. **Comprehensive error handling** - Never throw on disconnect/connection errors
4. **Network validation** - Support Ethereum, Polygon, Arbitrum with auto-switching

### Example Component

```tsx
'use client'

import { useWallet } from '@/hooks/use-wallet'
import { Button } from '@/components/ui/button'

export function WalletConnector() {
  const { address, isConnected, connect, disconnect, networkInfo } = useWallet()

  const handleConnect = async () => {
    try {
      await connect()
    } catch (error) {
      console.error('Failed to connect:', error)
      // Show user-friendly error state
    }
  }

  if (isConnected && address) {
    const displayAddress = `${address.slice(0, 6)}...${address.slice(-4)}`
    return (
      <div>
        <p>Connected: {displayAddress}</p>
        <p>Network: {networkInfo?.name}</p>
        <Button onClick={disconnect}>Disconnect</Button>
      </div>
    )
  }

  return <Button onClick={handleConnect}>Connect Wallet</Button>
}
```

### Testing Web3 Components

All Web3 components require comprehensive mocking:

```tsx
import { vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Required mocks for Web3 components
vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
  useChainId: vi.fn(),
  useDisconnect: vi.fn(),
  useSwitchChain: vi.fn(),
}))

vi.mock('@reown/appkit/react', () => ({
  useAppKit: vi.fn(() => ({ open: vi.fn() })),
}))

// Test implementation
describe('WalletConnector', () => {
  it('should handle connection states', () => {
    // Test wallet states: connected, connecting, error
  })
})
```

## Design System Integration

### Component Development

- Use design system components from `/components/ui/`
- Follow violet branding and glass morphism aesthetics
- Implement comprehensive test coverage
- Create Storybook stories for component documentation

### Styling Patterns (Tailwind CSS v4)

- **CSS-First Approach**: Uses `@import "tailwindcss"` in `app/globals.css`
- **NO JavaScript Config**: CSS-only configuration
- **Primary Colors**: Violet branding (`bg-violet-500`, `text-violet-600`)
- **Glass Morphism**: `.glass-container`, `.glass-card`, `.glass-button` utilities

```css
/* Example glass morphism component */
.glass-container {
  background-color: var(--color-glass-light-primary);
  backdrop-filter: blur(12px);
  border: 1px solid var(--color-glass-light-border);
}
```

## Testing

### Test Organization

- **Unit tests**: Component behavior and hooks
- **Integration tests**: Web3 components with mock providers
- **E2E tests**: Complete user workflows
- **Visual tests**: Storybook for component documentation

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests with UI
pnpm test:ui

# Run specific test file
pnpm test use-wallet.test.ts

# Run tests in watch mode
pnpm test --watch
```

### Test Patterns

- Test files co-located with source: `component.test.ts`
- Comprehensive Web3 mocking required
- Focus on wallet states, error boundaries, network validation

## Environment Configuration

### Development Environment

```dotenv
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_ENABLE_DEBUG_MODE=true
```

### Production Environment

```dotenv
NEXT_PUBLIC_APP_URL=https://tokentoilet.com
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=production_project_id
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

## Deployment

### Vercel (Recommended)

The project is configured for seamless Vercel deployment:

1. **Connect repository** to Vercel
2. **Configure environment variables** in Vercel dashboard
3. **Deploy** - automatic builds on push to main

See [Vercel Setup Guide](../deployment/vercel-setup.md) for detailed instructions.

### Build Process

```bash
# Build for production
pnpm build

# Test production build locally
pnpm start
```

## Troubleshooting

### Common Issues

#### Wallet Connection Failures

- Verify `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is set correctly
- Check browser wallet extensions are enabled
- Ensure supported networks (Ethereum, Polygon, Arbitrum)

#### Build Errors

- Clear Next.js cache: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && pnpm bootstrap`
- Check TypeScript errors: `pnpm tsc --noEmit`

#### Test Failures

- Ensure Web3 mocks are properly configured
- Check jsdom environment setup in `vitest.config.ts`
- Verify test files follow naming pattern: `*.test.ts`

### Getting Help

1. **Check existing documentation** in `/docs`
2. **Review GitHub issues** for similar problems
3. **Check Discord community** (coming soon)
4. **Create GitHub issue** with detailed reproduction steps

## Next Steps

After completing setup:

1. **Explore the codebase** - Start with `app/page.tsx` and `hooks/use-wallet.ts`
2. **Run Storybook** - See design system components in action
3. **Review documentation** - Check design system and deployment guides
4. **Read contributing guidelines** - Understand coding standards and workflow

For contributing to the project, see [CONTRIBUTING.md](../../CONTRIBUTING.md).
