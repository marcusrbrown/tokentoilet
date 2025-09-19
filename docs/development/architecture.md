# Token Toilet Architecture Guide

A comprehensive guide to the architecture, patterns, and design decisions that power Token Toilet's Web3 DeFi application.

## Overview

Token Toilet is a modern Web3 DeFi application built with a focus on user experience, type safety, and maintainable code. The architecture emphasizes separation of concerns, comprehensive error handling, and seamless wallet integration across multiple blockchain networks.

## Technology Stack

### Core Framework

- **Next.js 15.5.3**: App Router with Server Components and client boundaries
- **React 19.1.1**: Latest React with enhanced concurrent features
- **TypeScript**: Strict typing with comprehensive type safety
- **Tailwind CSS v4**: CSS-first configuration with design tokens

### Web3 Infrastructure

- **Wagmi v2.14.11**: React hooks for Ethereum development
- **Reown AppKit v1.7.18**: Multi-wallet connection interface (formerly Web3Modal)
- **Viem v2.23.0**: Low-level Ethereum interactions and type safety
- **TanStack Query v5.66.0**: Async state management and caching

### Development Tools

- **Vitest**: Fast unit test runner with jsdom environment
- **Storybook**: Component development and documentation
- **ESLint**: Code quality with Web3-specific patterns
- **Simple Git Hooks**: Pre-commit automation

## Application Architecture

### Web3 Provider Chain

The application follows a structured provider hierarchy that ensures proper Web3 state management:

```text
app/layout.tsx
  ↓
app/providers.tsx (Client Component)
  ↓
Web3Provider (Wagmi + TanStack Query)
  ↓
ThemeSync (Theme Bridge)
  ↓
Application Components
```

#### Provider Responsibilities

1. **layout.tsx**: Root server component with metadata and theme providers
2. **providers.tsx**: Client-side provider setup with 'use client' directive
3. **Web3Provider**: Wagmi configuration with multi-chain support
4. **ThemeSync**: Bridges Next-themes with Reown AppKit theming

### Directory Structure

```text
tokentoilet/
├── app/                          # Next.js 15 App Router
│   ├── layout.tsx               # Root layout with providers
│   ├── page.tsx                 # Home page
│   ├── providers.tsx            # Client-side provider setup
│   └── globals.css              # Tailwind CSS v4 configuration
├── components/
│   ├── ui/                      # Design system components
│   │   ├── button.tsx           # Core button component
│   │   ├── card.tsx             # Glass morphism cards
│   │   └── ...                  # Additional UI components
│   └── web3/                    # Web3-specific components
│       ├── wallet-connector.tsx # Wallet connection interface
│       ├── network-switcher.tsx # Network switching component
│       └── ...                  # Additional Web3 components
├── hooks/
│   ├── use-wallet.ts            # Primary wallet abstraction
│   ├── use-token-discovery.ts   # Token discovery functionality
│   └── ...                      # Additional custom hooks
├── lib/
│   ├── web3/
│   │   ├── config.ts            # Web3 configuration
│   │   ├── networks.ts          # Network definitions
│   │   └── ...                  # Web3 utilities
│   ├── utils.ts                 # General utilities
│   └── env/                     # Environment validation
├── docs/                        # Documentation
├── tests/                       # Test files (co-located)
└── public/                      # Static assets
```

## Web3 Integration Architecture

### Wallet Abstraction Pattern

The application uses a custom `useWallet` hook that abstracts away the complexity of multiple wallet providers and network management:

```tsx
// Primary interface - never use wagmi hooks directly
import { useWallet } from '@/hooks/use-wallet'

const {
  address,
  isConnected,
  connect,
  disconnect,
  networkInfo,
  switchNetwork,
  isConnecting,
  error
} = useWallet()
```

### Multi-Chain Support

Supported networks with automatic switching:

- **Ethereum Mainnet (1)**: Primary network for major tokens
- **Polygon (137)**: Low-cost transactions and scaling
- **Arbitrum One (42161)**: Layer 2 scaling solution

#### Network Configuration

```typescript
// lib/web3/config.ts
export const wagmiAdapter = new WagmiAdapter({
  networks: [mainnet, polygon, arbitrum],
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
})

// Network validation with error classification
export function validateNetwork(chainId: number): NetworkValidationResult {
  // Returns structured errors with user-friendly messages
}
```

### Wallet Provider Support

- **MetaMask**: Browser extension wallet
- **WalletConnect**: QR code and deep linking
- **Coinbase Wallet**: Mobile and web wallet

### Error Handling Strategy

#### Structured Error Classification

```typescript
interface NetworkValidationError {
  type: 'unsupported_network' | 'connection_failed' | 'user_rejected'
  message: string
  userMessage: string
  canAutoSwitch: boolean
}
```

#### Error Handling Patterns

```tsx
// ✅ CORRECT: Never throw on Web3 errors
const handleConnect = async () => {
  try {
    await connect()
  } catch (error) {
    console.error('Connection failed:', error)
    // Show user-friendly error state
  }
}

// ❌ INCORRECT: Don't throw on connection errors
if (!isConnected) {
  throw new Error('Wallet not connected')
}
```

## Component Architecture

### Design System Pattern

All UI components follow a consistent design system pattern:

```tsx
// Base component with comprehensive props
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, ...props }, ref) => {
    // Implementation with violet branding and glass morphism
  }
)
```

### Web3 Component Pattern

All Web3 components follow strict patterns for consistency:

```tsx
'use client'

import { useWallet } from '@/hooks/use-wallet'

export function WalletComponent() {
  const { address, isConnected, networkInfo } = useWallet()

  // Address formatting pattern (consistent across app)
  const displayAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null

  return (
    // Component implementation
  )
}
```

### Component Organization Rules

1. **`/components/ui/`**: Design system components (framework-agnostic)
2. **`/components/web3/`**: Web3-specific components (always `'use client'`)
3. **Co-located tests**: `component.test.tsx` alongside source files
4. **Storybook stories**: `component.stories.tsx` for documentation

## State Management

### Wagmi State Management

All Web3 state flows through Wagmi's provider system:

```tsx
// Wagmi handles:
// - Account connections and disconnections
// - Network switching and validation
// - Transaction state management
// - Cache invalidation and updates
```

### TanStack Query Integration

For async operations and caching:

```tsx
// Used for:
// - Token metadata fetching
// - Balance queries with automatic refetching
// - Transaction status monitoring
// - Cross-chain data synchronization
```

### Theme State Management

```tsx
// Next-themes integration:
// - System preference detection
// - Persistent theme storage
// - Automatic dark/light mode switching
// - Reown AppKit theme synchronization
```

## Testing Architecture

### Testing Strategy

1. **Unit Tests**: Component behavior and hooks
2. **Integration Tests**: Web3 components with mocked providers
3. **Visual Tests**: Storybook for component documentation
4. **E2E Tests**: Critical user workflows (future)

### Web3 Testing Patterns

Comprehensive mocking is required for all Web3 components:

```tsx
// test-setup.ts
vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
  useChainId: vi.fn(),
  useDisconnect: vi.fn(),
  useSwitchChain: vi.fn(),
}))

vi.mock('@reown/appkit/react', () => ({
  useAppKit: vi.fn(() => ({ open: vi.fn() })),
}))
```

### Test File Organization

- **Co-located**: `component.test.ts` next to source files
- **Wallet-specific**: Separate test files for each wallet provider
- **Error scenarios**: Comprehensive error boundary testing
- **Network validation**: Multi-chain testing scenarios

## Design System Architecture

### Tailwind CSS v4 Configuration

Token Toilet uses Tailwind CSS v4's CSS-first approach:

```css
/* app/globals.css */
@import "tailwindcss";

@theme {
  --color-violet-500: #8b5cf6;
  --color-glass-light-primary: rgb(255 255 255 / 0.8);
  --spacing-container: 1rem;
}

/* Component classes */
.glass-container {
  background-color: var(--color-glass-light-primary);
  backdrop-filter: blur(12px);
  border: 1px solid var(--color-glass-light-border);
}
```

### Design Token System

```css
/* Color System */
--color-violet-50: #f5f3ff;
--color-violet-500: #8b5cf6;
--color-violet-900: #312e81;

/* Glass Morphism */
--color-glass-light-primary: rgb(255 255 255 / 0.8);
--color-glass-dark-primary: rgb(0 0 0 / 0.8);

/* Spacing */
--spacing-xs: 0.25rem;
--spacing-container: 1rem;
```

### Component Styling Patterns

```tsx
// ✅ CORRECT: Use design system classes
<Card className="glass-card p-container">
  <Button variant="primary" size="lg">
    Connect Wallet
  </Button>
</Card>

// ❌ INCORRECT: Don't use external UI libraries
import { Button } from '@headlessui/react'
```

## Performance Considerations

### Code Splitting

- **Route-based splitting**: Automatic with Next.js App Router
- **Component splitting**: Lazy loading for heavy components
- **Web3 provider splitting**: Separate bundles for wallet providers

### Caching Strategy

```tsx
// TanStack Query configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30,   // 30 minutes
    },
  },
})
```

### Bundle Optimization

- **Tree shaking**: Eliminate unused Web3 utilities
- **Dynamic imports**: Load wallet providers on demand
- **Asset optimization**: Optimize images and icons

## Security Architecture

### Environment Variable Validation

```typescript
// lib/env/validation.ts
const envSchema = z.object({
  NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: z.string().min(32),
  NEXT_PUBLIC_APP_URL: z.string().url(),
})

export const env = envSchema.parse(process.env)
```

### Web3 Security Patterns

1. **Network validation**: Prevent malicious chain interactions
2. **Address validation**: Verify address formats and checksums
3. **Transaction validation**: Validate transaction parameters
4. **RPC validation**: Validate responses from RPC providers

### Type Safety

```typescript
// Strict TypeScript configuration
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUncheckedIndexedAccess": true
  }
}
```

## Deployment Architecture

### Vercel Integration

- **Automatic deployments**: On push to main branch
- **Preview deployments**: For pull requests
- **Environment variables**: Secure configuration management
- **Edge functions**: For API routes and middleware

### Build Process

```bash
# Production build
pnpm build

# Includes:
# - Next.js optimization
# - TypeScript compilation
# - Tailwind CSS generation
# - Asset optimization
```

### Environment Configuration

- **Development**: `.env.local` with local settings
- **Staging**: Preview deployments with staging config
- **Production**: Secure environment variables in Vercel

## Monitoring and Debugging

### Development Workflow Tools

```bash
# Code quality
pnpm lint               # ESLint with Web3 patterns
pnpm test               # Vitest test runner
pnpm build              # Production build verification

# Component development
pnpm storybook          # Component documentation
```

### Error Monitoring

- **Console logging**: Structured error logging for Web3 operations
- **Type safety**: Compile-time error prevention
- **Test coverage**: Comprehensive test suites for critical paths

## Extension Points

### Adding New Wallet Providers

```typescript
// 1. Add provider to Reown AppKit configuration
// 2. Create provider-specific test scenarios
// 3. Update useWallet hook integration
// 4. Add provider-specific error handling
```

### Adding New Networks

```typescript
// 1. Add network configuration to wagmiAdapter
// 2. Update network validation logic
// 3. Add network-specific RPC configuration
// 4. Update test scenarios for new network
```

### Adding New Components

```typescript
// 1. Create component in appropriate directory
// 2. Add comprehensive TypeScript types
// 3. Create co-located test file
// 4. Add Storybook story for documentation
// 5. Follow design system patterns
```

## Best Practices Summary

### Development Guidelines

1. **Type Safety First**: Leverage TypeScript's strict mode
2. **Component Patterns**: Follow established Web3 component patterns
3. **Error Handling**: Never throw on Web3 errors, use graceful fallbacks
4. **Testing**: Comprehensive mocking for Web3 components
5. **Design System**: Use established components and patterns

### Performance Guidelines

1. **Lazy Loading**: Dynamic imports for heavy components
2. **Caching**: TanStack Query for async operations
3. **Bundle Splitting**: Separate Web3 provider bundles
4. **Asset Optimization**: Optimize images and static assets

### Security Guidelines

1. **Environment Validation**: Validate all environment variables
2. **Type Safety**: Strict TypeScript configuration
3. **Network Validation**: Prevent malicious chain interactions
4. **Address Validation**: Verify all Web3 addresses

This architecture guide provides the foundation for understanding and extending Token Toilet's Web3 DeFi application. For specific implementation details, see the corresponding code files and documentation.
