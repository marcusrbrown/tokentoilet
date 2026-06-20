> **⚠️ ARCHIVED — Superseded post-v1.0 vision.** This document describes the original multi-chain / charity / NFT / Fountain product vision, most of which was intentionally deferred when the MVP was rebaselined to a single-chain (Sepolia) ERC-20 burn-address disposal flow. It is retained for historical reference and future roadmap planning only. For current scope, see [`docs/brainstorms/2026-04-16-mvp-rebaseline-requirements.md`](../../brainstorms/2026-04-16-mvp-rebaseline-requirements.md).

# RFC-001: Project Foundation & Design System

> Establish core infrastructure, design system completion, and development environment

**Status:** Pending  
**Priority:** MUST  
**Phase:** 1 (Weeks 1-2)  
**Complexity:** Medium  
**Estimated Effort:** 3-4 days

---

## Summary

This RFC establishes the foundational infrastructure required for all subsequent development. It focuses on completing the design system, setting up environment validation, implementing security headers, and ensuring the core architecture is production-ready.

## Features Addressed

| Feature ID | Feature Name | Priority |
|------------|--------------|----------|
| F7.4 | Loading States | Must Have |
| F7.5 | Theme Support | Should Have |
| F8.1 | Input Validation | Must Have |
| F8.5 | Content Security Policy | Must Have |
| F8.6 | Rate Limiting | Must Have |
| F9.1 | Page Load Performance | Must Have |
| F9.2 | Bundle Optimization | Should Have |
| F9.4 | Error Monitoring | Must Have |
| F9.5 | Analytics | Should Have |
| F9.6 | Accessibility Compliance | Must Have |
| F9.7 | Browser Support | Must Have |
| F9.8 | Responsive Design | Must Have |

## Dependencies

### Builds Upon
- None (this is the foundation RFC)

### Enables
- RFC-002: Wallet Connection & Multi-Chain Support
- All subsequent RFCs

### External Dependencies
- Tailwind CSS 4.x
- Next.js 16.x
- Zod for validation
- Vitest for testing

---

## Technical Specification

### 1. Design System Completion

#### 1.1 Skeleton Components

Complete the skeleton loading system in `components/ui/skeletons/`:

```typescript
// components/ui/skeletons/index.ts
export { TokenListSkeleton } from './token-list-skeleton'
export { TokenCardSkeleton } from './token-card-skeleton'
export { WalletButtonSkeleton } from './wallet-button-skeleton'
export { TransactionCardSkeleton } from './transaction-card-skeleton'
export { CharitySelectorSkeleton } from './charity-selector-skeleton'
```

**Requirements:**
- Each skeleton must match the dimensions of its corresponding component
- Use `animate-pulse` with `motion-reduce:animate-none`
- Support both light and dark themes
- No layout shift when content loads (CLS < 0.1)

#### 1.2 Toast Notification System

Enhance `components/ui/toast-notifications.tsx`:

```typescript
interface ToastProps {
  variant: 'success' | 'error' | 'warning' | 'info' | 'web3'
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  duration?: number
  dismissible?: boolean
}

// Web3-specific toast variants
const web3ToastVariants = {
  transactionPending: 'Transaction submitted. Waiting for confirmation...',
  transactionSuccess: 'Transaction confirmed!',
  transactionFailed: 'Transaction failed. Please try again.',
  networkSwitch: 'Switching network...',
  walletConnected: 'Wallet connected successfully!',
}
```

#### 1.3 Modal Component

Create `components/ui/modal.tsx`:

```typescript
interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
}
```

**Accessibility Requirements:**
- Focus trap when open
- Return focus to trigger on close
- `role="dialog"` with `aria-modal="true"`
- `aria-labelledby` pointing to title
- Escape key closes modal

### 2. Environment & Security

#### 2.1 Environment Validation

Create `lib/env/validate-build-env.ts`:

```typescript
import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(['development', 'test', 'production']),
    ALCHEMY_API_KEY: z.string().min(1),
    INFURA_PROJECT_ID: z.string().min(1).optional(),
    THE_GIVING_BLOCK_API_KEY: z.string().min(1).optional(),
  },
  client: {
    NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: z.string().min(1),
    NEXT_PUBLIC_ALCHEMY_API_KEY: z.string().min(1),
    NEXT_PUBLIC_SUPPORTED_CHAINS: z.string().default('1,137,42161'),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    ALCHEMY_API_KEY: process.env.ALCHEMY_API_KEY,
    INFURA_PROJECT_ID: process.env.INFURA_PROJECT_ID,
    THE_GIVING_BLOCK_API_KEY: process.env.THE_GIVING_BLOCK_API_KEY,
    NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,
    NEXT_PUBLIC_ALCHEMY_API_KEY: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
    NEXT_PUBLIC_SUPPORTED_CHAINS: process.env.NEXT_PUBLIC_SUPPORTED_CHAINS,
  },
})
```

#### 2.2 Content Security Policy

Update `next.config.ts`:

```typescript
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Required for Next.js
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.alchemy.com https://*.infura.io wss://*.walletconnect.com https://*.walletconnect.com",
      "frame-src 'self' https://verify.walletconnect.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
]
```

#### 2.3 Rate Limiting

Create `lib/rate-limit.ts`:

```typescript
import { LRUCache } from 'lru-cache'

interface RateLimitOptions {
  interval: number // milliseconds
  uniqueTokenPerInterval: number
}

export function rateLimit(options: RateLimitOptions) {
  const tokenCache = new LRUCache<string, number[]>({
    max: options.uniqueTokenPerInterval,
    ttl: options.interval,
  })

  return {
    check: (limit: number, token: string): Promise<void> =>
      new Promise((resolve, reject) => {
        const tokenCount = tokenCache.get(token) || [0]
        if (tokenCount[0] === 0) {
          tokenCache.set(token, [1])
        }
        tokenCount[0] += 1

        const currentUsage = tokenCount[0]
        const isRateLimited = currentUsage > limit

        if (isRateLimited) {
          reject(new Error('Rate limit exceeded'))
        } else {
          resolve()
        }
      }),
  }
}

// Default rate limiter: 100 requests per minute per IP
export const defaultRateLimiter = rateLimit({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 500,
})
```

### 3. Input Validation Schemas

Create `lib/validation/schemas.ts`:

```typescript
import { z } from 'zod'

// Ethereum address validation
export const ethereumAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address')

// Token amount validation
export const tokenAmountSchema = z
  .string()
  .regex(/^\d+\.?\d*$/, 'Invalid amount format')
  .refine((val) => parseFloat(val) >= 0, 'Amount must be non-negative')

// Chain ID validation
export const chainIdSchema = z
  .number()
  .refine((id) => [1, 137, 42161].includes(id), 'Unsupported chain')

// Transaction hash validation
export const transactionHashSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid transaction hash')

// Token disposal input validation
export const disposalInputSchema = z.object({
  tokens: z.array(
    z.object({
      address: ethereumAddressSchema,
      amount: tokenAmountSchema,
      type: z.enum(['ERC20', 'ERC721']),
      tokenId: z.string().optional(), // For NFTs
    })
  ).min(1).max(10),
  charityId: z.string().min(1),
})
```

### 4. Error Boundary & Monitoring

Create `components/error-boundary.tsx`:

```typescript
'use client'

import { Component, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to error monitoring service
    console.error('Error caught by boundary:', error, errorInfo)
    // TODO: Send to monitoring service (Sentry, etc.)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <Card variant="default" padding="lg" className="text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              We encountered an unexpected error. Please try again.
            </p>
            <Button
              variant="primary"
              onClick={() => this.setState({ hasError: false })}
            >
              Try Again
            </Button>
          </Card>
        )
      )
    }

    return this.props.children
  }
}

ErrorBoundary.displayName = 'ErrorBoundary'

export { ErrorBoundary }
```

### 5. Performance Optimization

#### 5.1 Bundle Analysis Script

Add to `package.json`:

```json
{
  "scripts": {
    "analyze": "ANALYZE=true next build",
    "bundle-size": "next build && npx @next/bundle-analyzer"
  }
}
```

#### 5.2 Image Optimization

Configure in `next.config.ts`:

```typescript
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.coingecko.com',
      },
      {
        protocol: 'https',
        hostname: '*.ipfs.io',
      },
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
}
```

---

## File Structure

```
lib/
├── env/
│   ├── index.ts
│   ├── flags.ts
│   └── validate-build-env.ts (update)
├── validation/
│   └── schemas.ts (new)
├── rate-limit.ts (new)
└── utils.ts (existing)

components/
├── ui/
│   ├── skeletons/
│   │   ├── index.ts
│   │   ├── token-list-skeleton.tsx
│   │   ├── token-card-skeleton.tsx
│   │   ├── wallet-button-skeleton.tsx
│   │   └── transaction-card-skeleton.tsx
│   ├── modal.tsx (new)
│   ├── modal.stories.tsx (new)
│   └── toast-notifications.tsx (update)
└── error-boundary.tsx (new)

app/
├── layout.tsx (update with ErrorBoundary)
└── globals.css (verify design tokens)
```

---

## Acceptance Criteria

### Design System
- [ ] All skeleton components render without layout shift
- [ ] Toast notifications support all variants including Web3-specific
- [ ] Modal component is fully accessible (focus trap, ARIA)
- [ ] Theme toggle works correctly (light/dark)
- [ ] All components have Storybook stories

### Security
- [ ] CSP headers block unauthorized scripts/resources
- [ ] Rate limiting prevents >100 requests/minute per IP
- [ ] Environment variables validated at build time
- [ ] No sensitive data exposed to client

### Performance
- [ ] LCP < 2.5 seconds on 3G connection
- [ ] Bundle size < 500KB gzipped
- [ ] No unused dependencies in bundle
- [ ] Images use next/image with optimization

### Accessibility
- [ ] All interactive elements keyboard accessible
- [ ] Focus indicators visible (violet-500 ring)
- [ ] Color contrast meets 4.5:1 minimum
- [ ] Screen reader tested with VoiceOver/NVDA

### Testing
- [ ] Unit tests for all validation schemas
- [ ] Component tests for ErrorBoundary
- [ ] Accessibility tests pass (vitest-axe)
- [ ] Build completes without warnings

---

## Testing Strategy

### Unit Tests

```typescript
// lib/validation/schemas.test.ts
import { describe, expect, it } from 'vitest'
import { ethereumAddressSchema, tokenAmountSchema } from './schemas'

describe('ethereumAddressSchema', () => {
  it('should accept valid addresses', () => {
    expect(() => 
      ethereumAddressSchema.parse('0x742d35Cc6634C0532925a3b844Bc9e7595f5bB98')
    ).not.toThrow()
  })

  it('should reject invalid addresses', () => {
    expect(() => ethereumAddressSchema.parse('invalid')).toThrow()
    expect(() => ethereumAddressSchema.parse('0x123')).toThrow()
  })
})
```

### Accessibility Tests

```typescript
// components/ui/modal.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { Modal } from './modal'

describe('Modal accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(
      <Modal open onOpenChange={() => {}} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('should trap focus within modal', async () => {
    // Test focus management
  })
})
```

---

## Implementation Notes

1. **Priority Order:**
   - Environment validation (blocks everything)
   - Security headers (deploy requirement)
   - Skeleton components (UX foundation)
   - Input validation schemas (used everywhere)
   - Error boundary (safety net)

2. **Existing Code:**
   - Design tokens exist in `lib/design-tokens/` - verify completeness
   - Some skeleton components may exist - audit before creating
   - `utils.ts` has `cn()` function - use consistently

3. **Testing:**
   - Run `pnpm test` after each component
   - Run `pnpm build` to verify no type errors
   - Run `pnpm storybook` to verify component rendering

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Build Success | 100% | CI/CD pipeline |
| Type Errors | 0 | `pnpm type-check` |
| Test Coverage | >80% | Vitest coverage |
| Accessibility Issues | 0 | vitest-axe |
| Bundle Size | <200KB | This RFC only |

---

*RFC-001 - Last Updated: December 23, 2025*
