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

## Dynamic Loading Architecture

### Dynamic Loading Overview

Token Toilet implements a module-level dynamic import strategy to optimize bundle size and improve initial page load performance. This approach splits non-critical Web3 components into separate chunks that load on-demand, reducing the initial JavaScript bundle size while maintaining full functionality.

### Architecture Decision

After comprehensive analysis of bundle optimization options, we selected **Option B: Module-Level Dynamic Imports** over aggressive connector-level splitting due to architectural constraints with Reown AppKit's `WagmiAdapter` (see [issue #641](https://github.com/marcusrbrown/tokentoilet/issues/641) for detailed analysis).

**Key Findings:**

- **AppKit Constraint**: `WagmiAdapter` auto-bundles core wallet connectors (~250-310 KB)
- **Optimization Approach**: Focus on lazy-loading non-critical UI components and utilities
- **Target Reduction**: 50-100 KB (10-18% reduction from 537KB baseline)
- **Actual Reduction**: Achievable when dynamic components are integrated into feature pages

### Dynamic Component Pattern

#### Basic Pattern

Dynamic components use Next.js's `dynamic()` function with Suspense boundaries for loading states:

```tsx
'use client'

import dynamic from 'next/dynamic'
import {Suspense} from 'react'
import {TokenListSkeleton} from '@/components/ui/skeletons'

// Dynamic import with loading skeleton
const TokenListComponent = dynamic(
  async () => import('../token-list').then(mod => mod.TokenList),
  {
    loading: () => <TokenListSkeleton />,
    ssr: false, // Disable SSR for Web3 components
  }
)

// Wrapper with Suspense boundary
export function DynamicTokenList(props: ComponentProps<typeof TokenListComponent>) {
  return (
    <Suspense fallback={<TokenListSkeleton />}>
      <TokenListComponent {...props} />
    </Suspense>
  )
}
```

#### Available Dynamic Components

Located in `components/web3/dynamic/`:

- **Token Management**: `DynamicTokenList`, `DynamicTokenDetail`, `DynamicTokenSelection`, `DynamicTokenApproval`
- **Transactions**: `DynamicTransactionQueue`, `DynamicTransactionStatus`
- **Wallet**: `DynamicWalletDashboard`, `DynamicWalletSwitcher`, `DynamicWalletConnectionModal`, `DynamicWalletErrorHandler`

### When to Use Dynamic Imports

**Use dynamic imports for:**

- ✅ Web3 components not needed on initial page load (token lists, dashboards, transaction queues)
- ✅ Heavy third-party libraries used in specific features
- ✅ Admin or settings panels accessed less frequently
- ✅ Data visualization or chart components
- ✅ Modal dialogs and overlays

**DO NOT use dynamic imports for:**

- ❌ Critical path components (navigation, layout, providers)
- ❌ Wallet connection infrastructure (`WalletButton`, Web3 providers)
- ❌ Core UI components (buttons, inputs, cards)
- ❌ Above-the-fold content
- ❌ Components smaller than 5-10 KB

### Loading State Strategy

#### Skeleton Loaders

Every dynamic component should have a matching skeleton loader that:

1. **Matches component dimensions** to prevent layout shift
2. **Uses glass morphism styling** consistent with design system
3. **Provides visual feedback** during loading
4. **Fails gracefully** if component loading fails

Example skeleton loader:

```tsx
export function TokenListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({length: 3}).map((_, i) => (
        <div key={i} className="glass-container h-24 animate-pulse" />
      ))}
    </div>
  )
}
```

#### Error Boundaries

Dynamic components are wrapped with error boundaries that:

1. **Catch loading failures** and provide retry mechanism
2. **Log errors** for monitoring and debugging
3. **Show fallback UI** with user-friendly error messages
4. **Emit telemetry** for tracking dynamic import failures

### Integration Guidelines

#### Page-Level Integration

When building feature pages, use dynamic components to optimize bundle size:

```tsx
// app/tokens/page.tsx
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

#### Prefetching Strategy

For anticipated user interactions, prefetch components on hover or interaction:

```tsx
import {prefetch} from 'next/dynamic'

// Prefetch on hover
<button
  onMouseEnter={() => prefetch(() => import('@/components/web3/dynamic/token-detail'))}
>
  View Details
</button>
```

### Performance Monitoring

#### Bundle Size Tracking

Use Next.js Bundle Analyzer to monitor bundle size:

```bash
# Generate bundle analysis
NEXT_BUILD_ENV_ANALYZE=true pnpm build

# View reports
open .next/analyze/client.html
```

#### Telemetry Integration

Dynamic component loading is tracked via telemetry system:

```typescript
// Automatic telemetry for dynamic imports
trackDynamicImport({
  component: 'TokenList',
  loadTime: 150, // ms
  success: true,
})
```

### Testing Dynamic Components

#### Unit Testing Pattern

Mock `next/dynamic` in tests to avoid async loading complexity:

```typescript
// vitest.setup.ts
vi.mock('next/dynamic', () => ({
  default: (fn: () => Promise<any>) => {
    const Component = fn().then(mod => mod.default || mod)
    return (props: any) => <Component {...props} />
  },
}))
```

#### Integration Testing

Test dynamic loading behavior in integration tests:

```typescript
it('shows loading skeleton while component loads', async () => {
  render(<DynamicTokenList />)

  // Verify skeleton appears
  expect(screen.getByTestId('token-list-skeleton')).toBeInTheDocument()

  // Wait for component to load
  await waitFor(() => {
    expect(screen.getByRole('list')).toBeInTheDocument()
  })
})
```

### Current Implementation Status

**Infrastructure Status:** ✅ **Complete** (as of 2025-10-11)

- Dynamic component wrappers created for 10+ Web3 components
- Loading skeletons and error boundaries implemented
- Comprehensive test coverage (1000/1012 tests passing)
- Bundle analyzer configured and functional

**Integration Status:** ⏭️ **Awaiting Feature Pages**

- Application currently consists of MVP landing page
- No feature pages (`/tokens`, `/portfolio`, `/dispose`) implemented yet
- Dynamic components ready for immediate use when pages are built

**Expected Impact:** 50-100 KB bundle reduction when dynamic components are integrated into feature pages.

See `.ai/metrics/performance-validation-2025-10-11.md` for detailed performance validation results.

## Best Practices Summary

### Development Guidelines

1. **Type Safety First**: Leverage TypeScript's strict mode
2. **Component Patterns**: Follow established Web3 component patterns
3. **Error Handling**: Never throw on Web3 errors, use graceful fallbacks
4. **Testing**: Comprehensive mocking for Web3 components
5. **Design System**: Use established components and patterns
6. **Dynamic Loading**: Use dynamic imports for non-critical components (see above)

### Performance Guidelines

1. **Lazy Loading**: Dynamic imports for heavy components not needed on initial load
2. **Caching**: TanStack Query for async operations
3. **Bundle Splitting**: Module-level dynamic imports for Web3 components
4. **Asset Optimization**: Optimize images and static assets
5. **Loading States**: Always provide skeleton loaders for dynamic components
6. **Prefetching**: Prefetch components on anticipated user interactions

### Security Guidelines

1. **Environment Validation**: Validate all environment variables
2. **Type Safety**: Strict TypeScript configuration
3. **Network Validation**: Prevent malicious chain interactions
4. **Address Validation**: Verify all Web3 addresses

This architecture guide provides the foundation for understanding and extending Token Toilet's Web3 DeFi application. For specific implementation details, see the corresponding code files and documentation.
