> **⚠️ ARCHIVED — Superseded post-v1.0 vision.** This document describes the original multi-chain / charity / NFT / Fountain product vision, most of which was intentionally deferred when the MVP was rebaselined to a single-chain (Sepolia) ERC-20 burn-address disposal flow. It is retained for historical reference and future roadmap planning only. For current scope, see [`docs/brainstorms/2026-04-16-mvp-rebaseline-requirements.md`](../../brainstorms/2026-04-16-mvp-rebaseline-requirements.md).

# RFC-002: Wallet Connection & Multi-Chain Support

> Complete and polish wallet connection with comprehensive error handling and chain management

**Status:** Pending  
**Priority:** MUST  
**Phase:** 1 (Weeks 1-2)  
**Complexity:** Medium  
**Estimated Effort:** 2-3 days

---

## Summary

This RFC completes the wallet connection infrastructure, ensuring robust multi-chain support, comprehensive error handling, and seamless user experience across MetaMask, WalletConnect, and Coinbase Wallet. The foundation exists - this RFC focuses on hardening and polish.

## Features Addressed

| Feature ID | Feature Name | Priority | Current Status |
|------------|--------------|----------|----------------|
| F1.1 | Multi-Wallet Connection | Must Have | In Progress |
| F1.2 | Session Persistence | Must Have | In Progress |
| F1.3 | Multi-Chain Support | Must Have | In Progress |
| F1.4 | Chain Switching | Must Have | Not Started |
| F1.5 | Connection Error Handling | Must Have | In Progress |
| F1.6 | Wallet Disconnect | Must Have | Not Started |

## Dependencies

### Builds Upon
- RFC-001: Project Foundation & Design System

### Enables
- RFC-003: Token Discovery & Display
- All subsequent RFCs requiring wallet connection

### External Dependencies
- Reown AppKit 1.7+
- Wagmi 2.x
- Viem 2.x

---

## Technical Specification

### 1. useWallet Hook Enhancement

The `hooks/use-wallet.ts` hook exists. Enhance it to ensure complete functionality:

```typescript
// hooks/use-wallet.ts
'use client'

import { useCallback, useMemo } from 'react'
import { useAccount, useChainId, useDisconnect, useSwitchChain } from 'wagmi'
import { useAppKit } from '@reown/appkit/react'
import { 
  classifyWalletError, 
  getWalletErrorRecovery,
  type WalletSpecificError 
} from '@/lib/web3/wallet-error-detector'

export interface UseWalletReturn {
  // Connection state
  address: `0x${string}` | undefined
  isConnected: boolean
  isConnecting: boolean
  isReconnecting: boolean
  
  // Chain state
  chainId: number | undefined
  isCurrentChainSupported: boolean
  supportedChainIds: readonly number[]
  
  // Actions
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  switchToChain: (chainId: number) => Promise<void>
  
  // Validation
  validateCurrentNetwork: () => WalletSpecificError | null
  
  // Error state
  error: WalletSpecificError | null
  clearError: () => void
}

export const SUPPORTED_CHAIN_IDS = [1, 137, 42161] as const
export type SupportedChainId = (typeof SUPPORTED_CHAIN_IDS)[number]

export function useWallet(): UseWalletReturn {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount()
  const chainId = useChainId()
  const { disconnect: wagmiDisconnect } = useDisconnect()
  const { switchChain } = useSwitchChain()
  const { open } = useAppKit()
  
  const [error, setError] = useState<WalletSpecificError | null>(null)

  const isCurrentChainSupported = useMemo(
    () => chainId !== undefined && SUPPORTED_CHAIN_IDS.includes(chainId as SupportedChainId),
    [chainId]
  )

  const connect = useCallback(async () => {
    try {
      setError(null)
      await open()
    } catch (err) {
      const walletError = classifyWalletError(err as Error, {
        action: 'connect',
        chainId,
      })
      setError(walletError)
      throw walletError
    }
  }, [open, chainId])

  const disconnect = useCallback(async () => {
    try {
      setError(null)
      wagmiDisconnect()
    } catch (err) {
      const walletError = classifyWalletError(err as Error, {
        action: 'disconnect',
        chainId,
      })
      setError(walletError)
      throw walletError
    }
  }, [wagmiDisconnect, chainId])

  const switchToChain = useCallback(async (targetChainId: number) => {
    if (!SUPPORTED_CHAIN_IDS.includes(targetChainId as SupportedChainId)) {
      const error: WalletSpecificError = {
        code: 'UNSUPPORTED_NETWORK',
        message: `Chain ${targetChainId} is not supported`,
        userFriendlyMessage: 'This network is not supported. Please use Ethereum, Polygon, or Arbitrum.',
        recoverable: false,
        walletType: 'unknown',
      }
      setError(error)
      throw error
    }

    try {
      setError(null)
      await switchChain({ chainId: targetChainId })
    } catch (err) {
      const walletError = classifyWalletError(err as Error, {
        action: 'switch_network',
        chainId: targetChainId,
      })
      setError(walletError)
      throw walletError
    }
  }, [switchChain])

  const validateCurrentNetwork = useCallback((): WalletSpecificError | null => {
    if (!isConnected) {
      return {
        code: 'WALLET_NOT_CONNECTED',
        message: 'Wallet not connected',
        userFriendlyMessage: 'Please connect your wallet to continue.',
        recoverable: true,
        walletType: 'unknown',
      }
    }
    
    if (!isCurrentChainSupported) {
      return {
        code: 'UNSUPPORTED_NETWORK',
        message: `Chain ${chainId} is not supported`,
        userFriendlyMessage: 'Please switch to Ethereum, Polygon, or Arbitrum.',
        recoverable: true,
        walletType: 'unknown',
      }
    }
    
    return null
  }, [isConnected, isCurrentChainSupported, chainId])

  const clearError = useCallback(() => setError(null), [])

  return {
    address,
    isConnected,
    isConnecting,
    isReconnecting,
    chainId,
    isCurrentChainSupported,
    supportedChainIds: SUPPORTED_CHAIN_IDS,
    connect,
    disconnect,
    switchToChain,
    validateCurrentNetwork,
    error,
    clearError,
  }
}
```

### 2. Chain Switching Component

Create/enhance `components/web3/network-switcher.tsx`:

```typescript
'use client'

import { useWallet, SUPPORTED_CHAIN_IDS, type SupportedChainId } from '@/hooks/use-wallet'
import { Button } from '@/components/ui/button'
import { NetworkBadge } from '@/components/ui/network-badge'
import { cn } from '@/lib/utils'

const CHAIN_INFO: Record<SupportedChainId, { name: string; icon: string }> = {
  1: { name: 'Ethereum', icon: '⟠' },
  137: { name: 'Polygon', icon: '⬡' },
  42161: { name: 'Arbitrum', icon: '🔵' },
}

interface NetworkSwitcherProps {
  className?: string
  showCurrentOnly?: boolean
}

export function NetworkSwitcher({ className, showCurrentOnly = false }: NetworkSwitcherProps) {
  const { chainId, isCurrentChainSupported, switchToChain, isConnected } = useWallet()
  const [isSwitching, setIsSwitching] = useState<number | null>(null)

  const handleSwitch = async (targetChainId: SupportedChainId) => {
    if (targetChainId === chainId) return
    
    setIsSwitching(targetChainId)
    try {
      await switchToChain(targetChainId)
    } catch (error) {
      // Error handled by useWallet
    } finally {
      setIsSwitching(null)
    }
  }

  if (!isConnected) return null

  if (showCurrentOnly) {
    return (
      <NetworkBadge 
        chainId={chainId} 
        className={cn(!isCurrentChainSupported && 'border-red-500', className)} 
      />
    )
  }

  return (
    <div className={cn('flex gap-2', className)}>
      {SUPPORTED_CHAIN_IDS.map((id) => (
        <Button
          key={id}
          variant={chainId === id ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => handleSwitch(id)}
          disabled={isSwitching !== null}
          loading={isSwitching === id}
          aria-pressed={chainId === id}
        >
          <span className="mr-1">{CHAIN_INFO[id].icon}</span>
          {CHAIN_INFO[id].name}
        </Button>
      ))}
    </div>
  )
}

NetworkSwitcher.displayName = 'NetworkSwitcher'

export { NetworkSwitcher }
```

### 3. Connection Status Component

Create/enhance `components/web3/connection-status.tsx`:

```typescript
'use client'

import { useWallet } from '@/hooks/use-wallet'
import { AddressDisplay } from '@/components/ui/address-display'
import { Button } from '@/components/ui/button'
import { NetworkBadge } from '@/components/ui/network-badge'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface ConnectionStatusProps {
  className?: string
  variant?: 'compact' | 'full'
  showNetworkBadge?: boolean
}

export function ConnectionStatus({ 
  className, 
  variant = 'compact',
  showNetworkBadge = true 
}: ConnectionStatusProps) {
  const { 
    address, 
    isConnected, 
    isConnecting, 
    chainId,
    isCurrentChainSupported,
    connect, 
    disconnect,
    error,
    clearError,
  } = useWallet()

  if (!isConnected) {
    return (
      <div className={cn('flex flex-col gap-2', className)}>
        <Button
          variant="primary"
          onClick={connect}
          loading={isConnecting}
          disabled={isConnecting}
        >
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </Button>
        {error && (
          <p className="text-sm text-red-500" role="alert">
            {error.userFriendlyMessage}
            <button 
              onClick={clearError}
              className="ml-2 underline hover:no-underline"
            >
              Dismiss
            </button>
          </p>
        )}
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {showNetworkBadge && <NetworkBadge chainId={chainId} size="sm" />}
        <AddressDisplay address={address!} truncate showCopy />
        <Button variant="ghost" size="sm" onClick={disconnect}>
          Disconnect
        </Button>
      </div>
    )
  }

  return (
    <Card variant="default" padding="md" className={className}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-green-500" aria-hidden="true" />
          <span className="font-medium text-green-600 dark:text-green-400">Connected</span>
        </div>
        <Button variant="ghost" size="sm" onClick={disconnect}>
          Disconnect
        </Button>
      </div>
      
      <div className="mt-4 space-y-3">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Address</p>
          <AddressDisplay address={address!} showCopy showExternalLink chainId={chainId} />
        </div>
        
        {showNetworkBadge && (
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Network</p>
            <NetworkBadge chainId={chainId} />
            {!isCurrentChainSupported && (
              <p className="mt-1 text-sm text-amber-600 dark:text-amber-400" role="alert">
                ⚠️ Please switch to a supported network
              </p>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}

ConnectionStatus.displayName = 'ConnectionStatus'

export { ConnectionStatus }
```

### 4. Session Persistence

Verify session persistence in `lib/web3/config.ts`:

```typescript
import { createConfig, http } from 'wagmi'
import { mainnet, polygon, arbitrum } from 'wagmi/chains'
import { createStorage } from 'wagmi'

const SUPPORTED_CHAINS = [mainnet, polygon, arbitrum] as const

export const wagmiConfig = createConfig({
  chains: SUPPORTED_CHAINS,
  transports: {
    [mainnet.id]: http(process.env.NEXT_PUBLIC_ALCHEMY_RPC_ETHEREUM),
    [polygon.id]: http(process.env.NEXT_PUBLIC_ALCHEMY_RPC_POLYGON),
    [arbitrum.id]: http(process.env.NEXT_PUBLIC_ALCHEMY_RPC_ARBITRUM),
  },
  storage: createStorage({
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    key: 'tokentoilet-wallet',
  }),
  // Reconnect on page load
  syncConnectedChain: true,
})
```

### 5. Wallet Error Recovery UI

Create `components/web3/wallet-error-recovery.tsx`:

```typescript
'use client'

import { type WalletSpecificError } from '@/lib/web3/wallet-error-detector'
import { getWalletErrorRecovery } from '@/lib/web3/wallet-error-detector'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface WalletErrorRecoveryProps {
  error: WalletSpecificError
  onRetry?: () => void
  onDismiss?: () => void
}

export function WalletErrorRecovery({ error, onRetry, onDismiss }: WalletErrorRecoveryProps) {
  const recovery = getWalletErrorRecovery(error)

  return (
    <Card variant="default" padding="md" className="border-red-200 dark:border-red-800">
      <div className="flex items-start gap-3">
        <div className="text-2xl" aria-hidden="true">⚠️</div>
        <div className="flex-1">
          <h3 className="font-semibold text-red-600 dark:text-red-400">
            {error.code.replace(/_/g, ' ')}
          </h3>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            {error.userFriendlyMessage}
          </p>
          
          {recovery.steps.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                To resolve this:
              </p>
              <ol className="mt-1 list-decimal list-inside text-sm text-gray-600 dark:text-gray-400">
                {recovery.steps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </div>
          )}
          
          <div className="mt-4 flex gap-2">
            {error.recoverable && onRetry && (
              <Button variant="primary" size="sm" onClick={onRetry}>
                {recovery.actionLabel || 'Try Again'}
              </Button>
            )}
            {onDismiss && (
              <Button variant="ghost" size="sm" onClick={onDismiss}>
                Dismiss
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

WalletErrorRecovery.displayName = 'WalletErrorRecovery'

export { WalletErrorRecovery }
```

---

## File Structure

```
hooks/
├── use-wallet.ts (enhance)
├── use-wallet.test.ts (existing - verify coverage)
├── use-wallet-persistence.ts (existing - verify)
├── use-wallet-switcher.ts (existing - verify)
└── use-wallet-error-handler.ts (existing - verify)

components/web3/
├── connection-status.tsx (enhance)
├── connection-status.test.tsx (existing - verify)
├── connection-status.stories.tsx (existing - verify)
├── network-switcher.tsx (create/enhance)
├── network-switcher.stories.tsx (create)
├── network-switcher.test.tsx (create)
├── wallet-error-recovery.tsx (create)
├── wallet-error-recovery.stories.tsx (create)
└── wallet-button.tsx (existing - verify)

lib/web3/
├── config.ts (verify session persistence)
├── wallet-error-detector.ts (existing - verify)
└── wallet-error-types.ts (existing - verify)
```

---

## Acceptance Criteria

### Connection
- [ ] MetaMask connects successfully (<2 seconds)
- [ ] WalletConnect v2 connects successfully
- [ ] Coinbase Wallet connects successfully
- [ ] Connection survives page refresh
- [ ] Auto-reconnect on return visit (within 24 hours)

### Chain Switching
- [ ] Switch between Ethereum, Polygon, Arbitrum
- [ ] Prompt to add network if not configured in wallet
- [ ] Clear error message if switch rejected
- [ ] UI updates immediately after switch

### Error Handling
- [ ] User-rejected connection shows friendly message
- [ ] Wallet not installed shows installation link
- [ ] Network mismatch shows switch prompt
- [ ] RPC failure shows retry option
- [ ] All errors have recovery actions

### Disconnect
- [ ] One-click disconnect from any page
- [ ] Session cleared on disconnect
- [ ] UI resets to disconnected state
- [ ] Warning shown if pending transactions

### Accessibility
- [ ] All buttons keyboard accessible
- [ ] Status announced to screen readers
- [ ] Focus managed on modal open/close
- [ ] Error messages have role="alert"

---

## Testing Strategy

### Unit Tests

```typescript
// hooks/use-wallet.test.ts
import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { useWallet } from './use-wallet'

// Mock wagmi
vi.mock('wagmi', () => ({
  useAccount: vi.fn(() => ({
    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f5bB98',
    isConnected: true,
    isConnecting: false,
    isReconnecting: false,
  })),
  useChainId: vi.fn(() => 1),
  useDisconnect: vi.fn(() => ({ disconnect: vi.fn() })),
  useSwitchChain: vi.fn(() => ({ switchChain: vi.fn() })),
}))

vi.mock('@reown/appkit/react', () => ({
  useAppKit: vi.fn(() => ({ open: vi.fn() })),
}))

describe('useWallet', () => {
  describe('connection state', () => {
    it('returns connected state when wallet is connected', () => {
      const { result } = renderHook(() => useWallet())
      expect(result.current.isConnected).toBe(true)
      expect(result.current.address).toBeDefined()
    })
  })

  describe('chain validation', () => {
    it('validates supported chains correctly', () => {
      const { result } = renderHook(() => useWallet())
      expect(result.current.isCurrentChainSupported).toBe(true)
    })

    it('returns error for unsupported chain', () => {
      vi.mocked(useChainId).mockReturnValue(999)
      const { result } = renderHook(() => useWallet())
      const error = result.current.validateCurrentNetwork()
      expect(error?.code).toBe('UNSUPPORTED_NETWORK')
    })
  })

  describe('chain switching', () => {
    it('switches to supported chain', async () => {
      const { result } = renderHook(() => useWallet())
      await act(async () => {
        await result.current.switchToChain(137)
      })
      // Verify switchChain was called
    })

    it('throws error for unsupported chain', async () => {
      const { result } = renderHook(() => useWallet())
      await expect(
        act(async () => {
          await result.current.switchToChain(999)
        })
      ).rejects.toThrow()
    })
  })
})
```

### Integration Tests

```typescript
// components/web3/__tests__/wallet-flow.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConnectionStatus } from '../connection-status'
import { NetworkSwitcher } from '../network-switcher'

describe('Wallet Flow Integration', () => {
  it('completes full connection flow', async () => {
    // Test connect -> switch network -> disconnect
  })

  it('handles connection rejection gracefully', async () => {
    // Test user rejection scenario
  })

  it('recovers from network switch failure', async () => {
    // Test failed switch with retry
  })
})
```

---

## Implementation Notes

1. **Existing Code:**
   - `use-wallet.ts` exists - audit and enhance
   - Error detection exists - verify coverage for all wallet types
   - Connection status component exists - verify all features

2. **Testing:**
   - Run existing wallet tests first: `pnpm test hooks/use-wallet`
   - Add tests for any missing scenarios
   - Test with real wallets on testnet

3. **Manual Testing Checklist:**
   - [ ] MetaMask extension (Chrome, Firefox)
   - [ ] MetaMask mobile (iOS, Android)
   - [ ] WalletConnect with Trust Wallet
   - [ ] Coinbase Wallet extension
   - [ ] Session persistence across refresh
   - [ ] Chain switch on each wallet type

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Connection Time | <2 seconds | Performance monitoring |
| Session Persistence | 100% | Manual testing |
| Error Recovery Rate | >95% | User testing |
| Test Coverage | >90% | Vitest coverage |
| Accessibility Issues | 0 | vitest-axe |

---

*RFC-002 - Last Updated: December 23, 2025*
