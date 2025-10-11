# Contributing to Token Toilet

Thank you for your interest in contributing to Token Toilet! This guide will help you understand our development process, coding standards, and how to submit quality contributions.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Environme```text
feat(scope): description

[optional body]

[optional footer]
```velopment-environment)
- [Code Standards](#code-standards)
- [Web3 Development Patterns](#web3-development-patterns)
- [Testing Requirements](#testing-requirements)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Project Architecture](#project-architecture)
- [Design System Guidelines](#design-system-guidelines)

## Getting Started

### Quick Setup

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:

   ```bash
   git clone https://github.com/your-username/tokentoilet.git
   cd tokentoilet
   ```

3. **Set up development environment**:

   ```bash
   pnpm bootstrap
   cp .env.example .env.local
   # Edit .env.local with your values
   ```

4. **Start the development server**:

   ```bash
   pnpm dev
   ```

See [Development Setup Guide](docs/development/setup.md) for detailed instructions.

### Before Contributing

- Review our [Project Documentation](docs/development/setup.md)
- Check existing [Issues](https://github.com/marcusrbrown/tokentoilet/issues) and [Pull Requests](https://github.com/marcusrbrown/tokentoilet/pulls)
- Join our Discord community (coming soon) for discussions

## Development Environment

### Required Tools

- **Node.js 18.17+**
- **pnpm** (preferred package manager)
- **Git**
- **Web3 Wallet** (MetaMask, WalletConnect, or Coinbase Wallet)

### Recommended IDE Setup

**Visual Studio Code** with extensions:

- ESLint
- Prettier
- TypeScript
- Tailwind CSS IntelliSense
- Solidity (for future smart contract development)

### Environment Variables

Configure your `.env.local` file:

```dotenv
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

## Code Standards

### Language and Framework Requirements

- **TypeScript**: Strict mode enabled, all code must be typed
- **Next.js 15**: App Router pattern, server and client components
- **React 19**: Functional components with hooks
- **Tailwind CSS v4**: CSS-first approach, no JavaScript config

### Code Quality Tools

Our automated tools enforce consistent code quality:

```bash
# Check code quality
pnpm lint                      # ESLint with Web3 patterns
pnpm fix                       # Auto-fix linting issues
pnpm test                      # Run full test suite
pnpm type-check                # TypeScript type checking
pnpm validate:design-system    # Validate design system completeness
pnpm validate                  # Run all checks (CI/CD ready)
```

### Coding Conventions

#### General Principles

1. **Self-explanatory code** - Write code that speaks for itself
2. **Minimal comments** - Comment WHY, not WHAT
3. **Production-ready code** - No TODOs, placeholders, or incomplete implementations
4. **Type safety** - Leverage TypeScript's type system fully

#### File Organization

```text
```text
src/
├── app/                    # Next.js App Router
├── components/
│   ├── ui/                # Design system components
│   └── web3/              # Web3-specific components ('use client')
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities and configurations
└── tests/                 # Test files (co-located)
```

#### Naming Conventions

- **Files**: `kebab-case.tsx`, `PascalCase.tsx` for components
- **Functions**: `camelCase`
- **Components**: `PascalCase`
- **Constants**: `UPPER_CASE`
- **Types/Interfaces**: `PascalCase`

#### Import Organization

```tsx
import { Button } from '@/components/ui/button'
// 3. Internal imports (absolute paths with @)
import { useWallet } from '@/hooks/use-wallet'

import { useRouter } from 'next/navigation'

// 1. React and Next.js imports
import { useState } from 'react'
// 2. Third-party libraries
// eslint-disable-next-line no-restricted-imports
import { useAccount } from 'wagmi'

// 4. Type-only imports (separate)
// import type { FC } from 'react'
// import type { Address } from 'viem'
```

## Web3 Development Patterns

### Critical Requirements

1. **Always use the custom `useWallet` hook** - Never use wagmi hooks directly in components
2. **'use client' directive** - Required for all Web3 interactive components
3. **Comprehensive error handling** - Never throw on disconnect/connection errors
4. **Network validation** - Support Ethereum, Polygon, Arbitrum with auto-switching

### Wallet Integration Pattern

```tsx
'use client'

import { Button } from '@/components/ui/button'
import { useWallet } from '@/hooks/use-wallet'

export function WalletComponent() {
  const { address, isConnected, connect, disconnect, networkInfo } = useWallet()

  const handleConnect = async () => {
    try {
      await connect()
    } catch (error) {
      console.error('Failed to connect:', error)
      // Show user-friendly error state - never throw
    }
  }

  // Address formatting pattern
  const displayAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null

  return (
    <div>
      {isConnected ? (
        <div>
          <p>Connected: {displayAddress}</p>
          <p>Network: {networkInfo?.name}</p>
          <Button onClick={disconnect}>Disconnect</Button>
        </div>
      ) : (
        <Button onClick={handleConnect}>Connect Wallet</Button>
      )}
    </div>
  )
}
```

### Error Handling Standards

```tsx
// ✅ CORRECT: Never throw on Web3 errors
connect().catch(error => {
  console.error('Failed to connect:', error)
  // Show user-friendly error state
})

// ❌ INCORRECT: Don't throw on connection errors
if (!isConnected) {
  throw new Error('Wallet not connected')
}
```

### Component Organization

- **`/components/web3/`** - Web3-specific components (always use `'use client'`)
- **`/hooks/`** - Custom React hooks (wallet abstraction)
- **`/lib/web3/`** - Web3 configuration and utilities

### Multi-Chain Support

- Support Ethereum mainnet (1), Polygon (137), Arbitrum (42161)
- Use network validation with auto-switching
- Handle network-specific RPC configurations

### Dynamic Imports for Bundle Optimization

Token Toilet implements module-level dynamic imports to optimize bundle size and improve performance. When building features, follow these guidelines to determine when to use dynamic imports.

#### When to Use Dynamic Imports

**Use dynamic imports for components that are:**

- ✅ Not needed on initial page load (token lists, dashboards, transaction queues)
- ✅ Heavy third-party libraries (>10 KB) used in specific features
- ✅ Admin panels or settings accessed less frequently
- ✅ Modal dialogs and overlays triggered by user interaction
- ✅ Data visualization or chart components

**DO NOT use dynamic imports for:**

- ❌ Critical path components (navigation, layout, header, footer)
- ❌ Wallet connection infrastructure (`WalletButton`, Web3 providers)
- ❌ Core UI components (buttons, inputs, cards used everywhere)
- ❌ Above-the-fold content
- ❌ Small components (<5 KB) where overhead exceeds benefit

#### Decision Tree

```text
Is the component needed on initial page load?
├─ YES → Use static import
└─ NO → Is the component larger than 5-10 KB?
    ├─ YES → Use dynamic import
    └─ NO → Use static import (overhead not worth it)
```

#### Using Existing Dynamic Components

Token Toilet provides pre-built dynamic wrappers for Web3 components in `components/web3/dynamic/`:

```tsx
// Use the dynamic wrapper, not the original component
import {DynamicTokenList} from '@/components/web3/dynamic'

export default function TokensPage() {
  return (
    <div>
      <h1>Your Tokens</h1>
      {/* Component loads on-demand, reducing initial bundle */}
      <DynamicTokenList onSelectToken={handleTokenSelect} />
    </div>
  )
}
```

**Available Dynamic Components:**

- `DynamicTokenList` - Token management interface (~10-15 KB)
- `DynamicTokenDetail` - Token detail view (~8-12 KB)
- `DynamicTokenSelection` - Token selection UI (~8-12 KB)
- `DynamicTokenApproval` - Token approval workflow (~6-10 KB)
- `DynamicTransactionQueue` - Transaction management (~5-8 KB)
- `DynamicTransactionStatusCard` - Transaction status display (~4-6 KB)
- `DynamicWalletDashboard` - Wallet overview (~12-18 KB)
- `DynamicWalletSwitcher` - Wallet switching interface (~4-6 KB)
- `DynamicWalletConnectionModal` - Connection modal (~7-10 KB)
- `DynamicWalletErrorHandler` - Error handling UI (~3-5 KB)

#### Creating New Dynamic Components

When creating new heavy components, follow this pattern:

```tsx
/**
 * components/web3/dynamic/my-component.tsx
 */
'use client'

import type {ComponentProps} from 'react'
import dynamic from 'next/dynamic'
import {Suspense} from 'react'
import {GenericSkeleton} from '@/components/ui/skeletons'

// Dynamic import with loading skeleton
const MyComponentImpl = dynamic(
  async () => import('../my-component').then(mod => mod.MyComponent),
  {
    loading: () => <GenericSkeleton height="h-64" />,
    ssr: false, // Disable SSR for Web3 components
  }
)

// Wrapper with Suspense boundary
export function DynamicMyComponent(props: ComponentProps<typeof MyComponentImpl>) {
  return (
    <Suspense fallback={<GenericSkeleton height="h-64" />}>
      <MyComponentImpl {...props} />
    </Suspense>
  )
}
```

#### Loading States

Every dynamic component should have a matching skeleton loader:

- **Matches dimensions**: Prevents layout shift during loading
- **Glass morphism styling**: Consistent with design system
- **Visual feedback**: Shows loading progress to users

Create specific skeletons in `components/ui/skeletons/` or use `GenericSkeleton` for simple cases.

#### Prefetching Strategy

For anticipated user interactions, prefetch components on hover:

```tsx
import {prefetch} from 'next/dynamic'

<button
  onMouseEnter={() => prefetch(() => import('@/components/web3/dynamic/token-detail'))}
  onClick={handleViewDetails}
>
  View Details
</button>
```

#### Testing Dynamic Components

Dynamic imports are automatically mocked in the test environment. Test the wrapper as you would any component:

```tsx
import {render, screen, waitFor} from '@testing-library/react'
import {DynamicTokenList} from './token-list'

it('renders token list after loading', async () => {
  render(<DynamicTokenList onSelectToken={mockHandler} />)

  // Wait for dynamic component to load
  await waitFor(() => {
    expect(screen.getByRole('list')).toBeInTheDocument()
  })
})
```

For more details, see [Dynamic Loading Architecture](docs/development/architecture.md#dynamic-loading-architecture).

### React Hooks Best Practices

Follow these patterns to avoid common pitfalls and maintain clean, bug-free hooks:

#### UseEffect State Updates

**Always use functional updates** when setting state in `useEffect` that depends on previous state:

```tsx
// ❌ AVOID: Direct state updates in useEffect
useEffect(() => {
  setCount(count + 1)  // Stale closure risk
}, [dependency])

// ✅ PREFER: Functional updates
useEffect(() => {
  setCount(prev => prev + 1)  // Always uses latest value
}, [dependency])
```

**Exception**: Direct updates are acceptable when loading external data that doesn't derive from previous state:

```tsx
// ✅ ACCEPTABLE: Loading from external source
useEffect(() => {
  const data = localStorage.getItem('key')
  setData(data)  // Not deriving from previous state
}, [])
```

#### Ref Cleanup in Effects

**Capture ref values at effect execution time** for use in cleanup functions:

```tsx
// ❌ AVOID: Using ref.current directly in cleanup
useEffect(() => {
  const interval = setInterval(() => {
    queueRef.current.process()
  }, 1000)

  return () => {
    clearInterval(interval)
    queueRef.current.cleanup()  // May be null at cleanup time
  }
}, [])

// ✅ PREFER: Capture ref value at effect execution
useEffect(() => {
  const queue = queueRef.current  // Capture now
  const interval = setInterval(() => {
    queue.process()
  }, 1000)

  return () => {
    clearInterval(interval)
    queue.cleanup()  // Uses captured value
  }
}, [])
```

#### Test Mocking with React Hooks

When mocking hooks in tests, **use computed property names** to avoid ESLint warnings:

```tsx
// ❌ AVOID: Direct property names trigger react-hooks-extra/no-unnecessary-use-prefix
vi.mock('next-themes', () => ({
  useTheme: () => mockUseTheme(),  // Lint warning!
}))

// ✅ PREFER: Computed property names
vi.mock('next-themes', () => {
  const hookName = 'useTheme'
  return {
    [hookName]: () => mockUseTheme(),  // No warning
  }
})
```

## Testing Requirements

### Test Coverage Standards

- **Unit tests**: All hooks and utility functions
- **Integration tests**: Web3 components with mock providers
- **Component tests**: UI components with various states
- **E2E tests**: Critical user workflows

### Testing Patterns

#### Web3 Component Testing

All Web3 components require comprehensive mocking:

```tsx
import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'

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

describe('WalletComponent', () => {
  it('should handle connection states correctly', () => {
    // Test implementation
  })
})
```

#### Test File Organization

- **Co-located tests**: `component.test.ts` alongside source files
- **Wallet-specific tests**: MetaMask, WalletConnect, Coinbase Wallet scenarios
- **Error boundary tests**: Network validation, connection failures

#### Running Tests

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test use-wallet.test.ts

# Run tests with UI
pnpm test:ui

# Run tests in watch mode
pnpm test --watch
```

### Test Requirements for PRs

- **All tests must pass** - Zero failures allowed
- **New features require tests** - Comprehensive coverage
- **Web3 components need mocked providers** - No real wallet connections in tests
- **Accessibility tests** - For all UI components

## Commit Guidelines

### Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

### Examples

```bash
feat(wallet): add multi-chain network switching
fix(ui): resolve button styling inconsistency
docs(setup): update development environment guide
test(hooks): add comprehensive useWallet tests
```

### Pre-commit Hooks

Automated quality checks run on every commit:

- **ESLint**: Code quality and pattern enforcement
- **Prettier**: Code formatting
- **TypeScript**: Type checking
- **Tests**: Related test files

## Pull Request Process

### Before Submitting

1. **Create feature branch** from `main`:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Follow code standards** and test requirements

3. **Run quality checks**:

   ```bash
   pnpm lint               # Must pass
   pnpm test               # Must pass
   pnpm build              # Must succeed
   ```

4. **Update documentation** if needed

### PR Requirements

- **Clear title and description** - Explain what and why
- **Link related issues** - Use `Closes #123` syntax
- **All tests passing** - CI must be green
- **No linting errors** - Code quality gates must pass
- **Up-to-date with main** - Rebase if needed

### Review Process

1. **Automated checks** must pass (CI/CD)
2. **Code review** by maintainers
3. **Manual testing** for Web3 functionality
4. **Documentation review** for user-facing changes

### After Approval

- **Squash and merge** - Keep clean commit history
- **Delete feature branch** - Keep repository clean

## Project Architecture

### Web3 Provider Chain

```text
app/layout.tsx → app/providers.tsx → Web3Provider (Wagmi + TanStack Query) → ThemeSync
```

- **All Web3 state** flows through Wagmi's provider system via `WagmiAdapter`
- **Reown AppKit** handles wallet connections with violet theming
- **Configuration** centralized in `lib/web3/config.ts`
- **Multi-chain support**: Ethereum, Polygon, Arbitrum

### Key Components

- **`useWallet` hook** - Primary wallet abstraction interface
- **Reown AppKit integration** - Wallet connection management
- **Network validation** - Multi-chain support with auto-switching
- **Error classification** - Structured error handling patterns

### State Management

- **Wagmi**: Web3 state (accounts, chains, connections)
- **TanStack Query**: Async state management and caching
- **Next-themes**: Theme persistence and synchronization

## Design System Guidelines

### Styling Approach (Tailwind CSS v4)

- **CSS-First Configuration**: Uses `@import "tailwindcss"` in `app/globals.css`
- **NO JavaScript Config**: Eliminated `tailwind.config.ts` - CSS-only
- **Design Tokens**: CSS custom properties (`--color-violet-*`, `--spacing-*`)

### Branding Standards

- **Primary Colors**: Violet branding (`bg-violet-500`, `text-violet-600`)
- **Glass Morphism**: `.glass-container`, `.glass-card`, `.glass-button` utilities
- **Dark Mode Support**: Via `dark:` classes and CSS custom properties

### Component Development

```tsx
// ✅ CORRECT: Use design system components
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

// ❌ INCORRECT: Don't use external UI libraries
// import { Button } from '@headlessui/react'
```

### Critical Anti-Patterns

**DO NOT:**

- Create `tailwind.config.ts` files (CSS-first approach only)
- Use `@apply` directives (all removed in v4 migration)
- Use legacy `@tailwind` directives (use `@import "tailwindcss"`)
- Configure themes in JavaScript (use CSS `@theme` blocks)

### Component Standards

- **Design system components** in `/components/ui/`
- **Comprehensive test coverage** required
- **Storybook stories** for documentation
- **Accessibility compliance** (WCAG 2.1 AA)

## Getting Help

### Resources

- **Documentation**: Check `/docs` directory first
- **Design System**: See `docs/design-system/getting-started.md`
- **Setup Guide**: `docs/development/setup.md`
- **Architecture**: `.github/copilot-instructions.md`

### Community

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Questions and community help
- **Discord**: Real-time community chat (coming soon)

### Reporting Issues

When reporting bugs, please include:

1. **Clear description** of the issue
2. **Steps to reproduce** the problem
3. **Expected vs actual behavior**
4. **Environment details** (OS, browser, wallet)
5. **Console errors** if applicable

### Feature Requests

For new features:

1. **Check existing issues** to avoid duplicates
2. **Provide clear use case** and rationale
3. **Consider implementation approach**
4. **Be open to feedback** and discussion

## Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors. Please be respectful and professional in all interactions.

## License

By contributing to Token Toilet, you agree that your contributions will be licensed under the same MIT License that covers the project.

---

Thank you for contributing to Token Toilet! Your help makes the DeFi ecosystem more accessible and fun for everyone. 🚽✨
