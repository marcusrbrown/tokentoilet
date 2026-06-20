> **⚠️ ARCHIVED — Superseded post-v1.0 vision.** This document describes the original multi-chain / charity / NFT / Fountain product vision, most of which was intentionally deferred when the MVP was rebaselined to a single-chain (Sepolia) ERC-20 burn-address disposal flow. It is retained for historical reference and future roadmap planning only. For current scope, see [`docs/brainstorms/2026-04-16-mvp-rebaseline-requirements.md`](../../brainstorms/2026-04-16-mvp-rebaseline-requirements.md).

# RFC-006: Transaction Infrastructure

> Implement robust transaction management with status tracking, error recovery, and stuck transaction handling

**Status:** Pending  
**Priority:** MUST  
**Phase:** 2 (Weeks 3-4)  
**Complexity:** High  
**Estimated Effort:** 3-4 days

---

## Summary

This RFC establishes the transaction infrastructure required for all blockchain operations. It includes transaction submission, status tracking, confirmation handling, and recovery mechanisms for stuck/failed transactions.

## Features Addressed

| Feature ID | Feature Name | Priority |
|------------|--------------|----------|
| F3.6 | Transaction Status Tracking | Must Have |
| F8.4 | Stuck Transaction Handling | Must Have |

## Dependencies

### Builds Upon
- RFC-002: Wallet Connection & Multi-Chain Support
- RFC-005: Token Selection & Approval Workflow

### Enables
- RFC-007: Token Disposal Flow
- RFC-009: Charity Integration
- RFC-010: NFT Receipt System

---

## Technical Specification

### 1. Transaction Queue Hook

Enhance `hooks/use-transaction-queue.ts`:

```typescript
'use client'

import { useState, useCallback, useEffect } from 'react'
import { useWaitForTransactionReceipt, usePublicClient } from 'wagmi'

export type TransactionStatus = 
  | 'pending'      // Submitted, waiting for inclusion
  | 'confirming'   // In block, waiting for confirmations
  | 'confirmed'    // 2+ confirmations
  | 'failed'       // Transaction reverted
  | 'dropped'      // Replaced or dropped from mempool
  | 'stuck'        // Pending > 5 minutes

export interface QueuedTransaction {
  id: string
  hash: `0x${string}`
  chainId: number
  type: 'approval' | 'disposal' | 'claim'
  description: string
  status: TransactionStatus
  submittedAt: number
  confirmedAt?: number
  confirmations: number
  gasUsed?: bigint
  error?: string
  metadata?: Record<string, unknown>
}

export interface UseTransactionQueueReturn {
  transactions: QueuedTransaction[]
  pendingCount: number
  addTransaction: (tx: Omit<QueuedTransaction, 'id' | 'status' | 'submittedAt' | 'confirmations'>) => string
  updateTransaction: (id: string, update: Partial<QueuedTransaction>) => void
  removeTransaction: (id: string) => void
  clearCompleted: () => void
  getTransaction: (id: string) => QueuedTransaction | undefined
  hasPendingTransactions: boolean
}

const STUCK_THRESHOLD_MS = 5 * 60 * 1000 // 5 minutes
const REQUIRED_CONFIRMATIONS = 2

export function useTransactionQueue(): UseTransactionQueueReturn {
  const [transactions, setTransactions] = useState<QueuedTransaction[]>([])
  const publicClient = usePublicClient()

  // Generate unique ID
  const generateId = () => `tx_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

  const addTransaction = useCallback((
    tx: Omit<QueuedTransaction, 'id' | 'status' | 'submittedAt' | 'confirmations'>
  ): string => {
    const id = generateId()
    const newTx: QueuedTransaction = {
      ...tx,
      id,
      status: 'pending',
      submittedAt: Date.now(),
      confirmations: 0,
    }
    setTransactions((prev) => [newTx, ...prev])
    return id
  }, [])

  const updateTransaction = useCallback((id: string, update: Partial<QueuedTransaction>) => {
    setTransactions((prev) =>
      prev.map((tx) => (tx.id === id ? { ...tx, ...update } : tx))
    )
  }, [])

  const removeTransaction = useCallback((id: string) => {
    setTransactions((prev) => prev.filter((tx) => tx.id !== id))
  }, [])

  const clearCompleted = useCallback(() => {
    setTransactions((prev) =>
      prev.filter((tx) => tx.status !== 'confirmed' && tx.status !== 'failed')
    )
  }, [])

  const getTransaction = useCallback(
    (id: string) => transactions.find((tx) => tx.id === id),
    [transactions]
  )

  // Check for stuck transactions
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setTransactions((prev) =>
        prev.map((tx) => {
          if (
            tx.status === 'pending' &&
            now - tx.submittedAt > STUCK_THRESHOLD_MS
          ) {
            return { ...tx, status: 'stuck' }
          }
          return tx
        })
      )
    }, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const pendingCount = transactions.filter(
    (tx) => tx.status === 'pending' || tx.status === 'confirming'
  ).length

  const hasPendingTransactions = pendingCount > 0

  return {
    transactions,
    pendingCount,
    addTransaction,
    updateTransaction,
    removeTransaction,
    clearCompleted,
    getTransaction,
    hasPendingTransactions,
  }
}
```

### 2. Transaction Watcher Hook

Create `hooks/use-transaction-watcher.ts`:

```typescript
'use client'

import { useEffect } from 'react'
import { useWaitForTransactionReceipt, usePublicClient } from 'wagmi'
import { type QueuedTransaction, type TransactionStatus } from './use-transaction-queue'

interface UseTransactionWatcherOptions {
  transaction: QueuedTransaction
  onStatusChange: (status: TransactionStatus, data?: { confirmations?: number; gasUsed?: bigint }) => void
  onConfirmed: (receipt: { gasUsed: bigint; blockNumber: bigint }) => void
  onFailed: (error: string) => void
}

const REQUIRED_CONFIRMATIONS = 2

export function useTransactionWatcher({
  transaction,
  onStatusChange,
  onConfirmed,
  onFailed,
}: UseTransactionWatcherOptions) {
  const publicClient = usePublicClient()

  const { data: receipt, isLoading, isError, error } = useWaitForTransactionReceipt({
    hash: transaction.hash,
    confirmations: REQUIRED_CONFIRMATIONS,
  })

  useEffect(() => {
    if (isLoading && transaction.status === 'pending') {
      // Still waiting - could check block inclusion
    }
  }, [isLoading, transaction.status])

  useEffect(() => {
    if (receipt) {
      if (receipt.status === 'success') {
        onStatusChange('confirmed', {
          confirmations: REQUIRED_CONFIRMATIONS,
          gasUsed: receipt.gasUsed,
        })
        onConfirmed({
          gasUsed: receipt.gasUsed,
          blockNumber: receipt.blockNumber,
        })
      } else {
        onStatusChange('failed')
        onFailed('Transaction reverted')
      }
    }
  }, [receipt, onStatusChange, onConfirmed, onFailed])

  useEffect(() => {
    if (isError && error) {
      onStatusChange('failed')
      onFailed(error.message)
    }
  }, [isError, error, onStatusChange, onFailed])

  // Watch for block confirmations
  useEffect(() => {
    if (!publicClient || !transaction.hash || transaction.status === 'confirmed') {
      return
    }

    const checkConfirmations = async () => {
      try {
        const receipt = await publicClient.getTransactionReceipt({
          hash: transaction.hash,
        })
        
        if (receipt) {
          const currentBlock = await publicClient.getBlockNumber()
          const confirmations = Number(currentBlock - receipt.blockNumber) + 1
          
          if (confirmations >= 1 && transaction.status === 'pending') {
            onStatusChange('confirming', { confirmations })
          }
          
          if (confirmations >= REQUIRED_CONFIRMATIONS) {
            onStatusChange('confirmed', {
              confirmations,
              gasUsed: receipt.gasUsed,
            })
          }
        }
      } catch (err) {
        // Transaction might not be mined yet
      }
    }

    const interval = setInterval(checkConfirmations, 5000)
    checkConfirmations()

    return () => clearInterval(interval)
  }, [publicClient, transaction.hash, transaction.status, onStatusChange])
}
```

### 3. Transaction Status Component

Create `components/web3/transaction-status.tsx`:

```typescript
'use client'

import { type QueuedTransaction, type TransactionStatus } from '@/hooks/use-transaction-queue'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AddressDisplay } from '@/components/ui/address-display'
import { cn } from '@/lib/utils'

interface TransactionStatusProps {
  transaction: QueuedTransaction
  onSpeedUp?: () => void
  onCancel?: () => void
  onDismiss?: () => void
  showDetails?: boolean
}

const STATUS_CONFIG: Record<TransactionStatus, {
  label: string
  color: string
  bgColor: string
  icon: string
}> = {
  pending: {
    label: 'Pending',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    icon: '⏳',
  },
  confirming: {
    label: 'Confirming',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    icon: '🔄',
  },
  confirmed: {
    label: 'Confirmed',
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    icon: '✓',
  },
  failed: {
    label: 'Failed',
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    icon: '✗',
  },
  dropped: {
    label: 'Dropped',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50 dark:bg-gray-900/20',
    icon: '⊘',
  },
  stuck: {
    label: 'Stuck',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    icon: '⚠️',
  },
}

export function TransactionStatusCard({
  transaction,
  onSpeedUp,
  onCancel,
  onDismiss,
  showDetails = true,
}: TransactionStatusProps) {
  const config = STATUS_CONFIG[transaction.status]
  const isActive = transaction.status === 'pending' || transaction.status === 'confirming'
  const isStuck = transaction.status === 'stuck'

  return (
    <Card
      variant="default"
      padding="md"
      className={cn(config.bgColor, 'transition-colors')}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden="true">{config.icon}</span>
          <div>
            <p className={cn('font-medium', config.color)}>
              {config.label}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {transaction.description}
            </p>
          </div>
        </div>

        {/* Spinner for active transactions */}
        {isActive && (
          <div className="animate-spin w-5 h-5 border-2 border-violet-600 border-t-transparent rounded-full" />
        )}
      </div>

      {showDetails && (
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Transaction</span>
            <AddressDisplay
              address={transaction.hash}
              truncate
              showCopy
              showExternalLink
              chainId={transaction.chainId}
              type="tx"
            />
          </div>

          {transaction.confirmations > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-500">Confirmations</span>
              <span>{transaction.confirmations}/2</span>
            </div>
          )}

          {transaction.gasUsed && (
            <div className="flex justify-between">
              <span className="text-gray-500">Gas Used</span>
              <span>{transaction.gasUsed.toString()}</span>
            </div>
          )}

          {transaction.error && (
            <p className="text-red-500 text-sm mt-2">
              Error: {transaction.error}
            </p>
          )}
        </div>
      )}

      {/* Actions for stuck transactions */}
      {isStuck && (onSpeedUp || onCancel) && (
        <div className="mt-4 pt-3 border-t border-amber-200 dark:border-amber-800 flex gap-2">
          {onSpeedUp && (
            <Button variant="secondary" size="sm" onClick={onSpeedUp}>
              Speed Up
            </Button>
          )}
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              Cancel Transaction
            </Button>
          )}
        </div>
      )}

      {/* Dismiss for completed transactions */}
      {(transaction.status === 'confirmed' || transaction.status === 'failed') && onDismiss && (
        <div className="mt-3 text-right">
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            Dismiss
          </Button>
        </div>
      )}
    </Card>
  )
}

TransactionStatusCard.displayName = 'TransactionStatusCard'

export { TransactionStatusCard }
```

### 4. Stuck Transaction Recovery

Create `lib/web3/transaction-recovery.ts`:

```typescript
import { type WalletClient, type PublicClient, parseGwei } from 'viem'

interface SpeedUpOptions {
  walletClient: WalletClient
  publicClient: PublicClient
  originalHash: `0x${string}`
  gasPriceMultiplier?: number // Default 1.2 (20% increase)
}

interface CancelOptions {
  walletClient: WalletClient
  publicClient: PublicClient
  originalHash: `0x${string}`
}

export async function speedUpTransaction({
  walletClient,
  publicClient,
  originalHash,
  gasPriceMultiplier = 1.2,
}: SpeedUpOptions): Promise<`0x${string}`> {
  // Get original transaction
  const originalTx = await publicClient.getTransaction({ hash: originalHash })
  
  if (!originalTx) {
    throw new Error('Original transaction not found')
  }

  // Calculate new gas price (20% higher)
  const currentGasPrice = await publicClient.getGasPrice()
  const originalGasPrice = originalTx.gasPrice || currentGasPrice
  const newGasPrice = BigInt(Math.ceil(Number(originalGasPrice) * gasPriceMultiplier))

  // Ensure new price is at least 10% higher (required by most nodes)
  const minNewPrice = (originalGasPrice * 110n) / 100n
  const finalGasPrice = newGasPrice > minNewPrice ? newGasPrice : minNewPrice

  // Resubmit with same nonce but higher gas
  const newHash = await walletClient.sendTransaction({
    to: originalTx.to!,
    value: originalTx.value,
    data: originalTx.input,
    nonce: originalTx.nonce,
    gasPrice: finalGasPrice,
  })

  return newHash
}

export async function cancelTransaction({
  walletClient,
  publicClient,
  originalHash,
}: CancelOptions): Promise<`0x${string}`> {
  // Get original transaction to get nonce
  const originalTx = await publicClient.getTransaction({ hash: originalHash })
  
  if (!originalTx) {
    throw new Error('Original transaction not found')
  }

  const account = walletClient.account
  if (!account) {
    throw new Error('No account connected')
  }

  // Calculate higher gas price
  const currentGasPrice = await publicClient.getGasPrice()
  const originalGasPrice = originalTx.gasPrice || currentGasPrice
  const cancelGasPrice = (originalGasPrice * 120n) / 100n // 20% higher

  // Send 0-value transaction to self with same nonce
  const cancelHash = await walletClient.sendTransaction({
    to: account.address,
    value: 0n,
    nonce: originalTx.nonce,
    gasPrice: cancelGasPrice,
  })

  return cancelHash
}
```

### 5. Transaction List Component

Create `components/web3/transaction-list.tsx`:

```typescript
'use client'

import { useTransactionQueue } from '@/hooks/use-transaction-queue'
import { TransactionStatusCard } from './transaction-status'
import { Button } from '@/components/ui/button'

interface TransactionListProps {
  maxVisible?: number
  showClearButton?: boolean
}

export function TransactionList({
  maxVisible = 5,
  showClearButton = true,
}: TransactionListProps) {
  const {
    transactions,
    clearCompleted,
    removeTransaction,
    hasPendingTransactions,
  } = useTransactionQueue()

  const visibleTransactions = transactions.slice(0, maxVisible)
  const hasMore = transactions.length > maxVisible
  const completedCount = transactions.filter(
    (tx) => tx.status === 'confirmed' || tx.status === 'failed'
  ).length

  if (transactions.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">
          Transactions
          {hasPendingTransactions && (
            <span className="ml-2 text-sm text-blue-600">
              ({transactions.filter((t) => t.status === 'pending').length} pending)
            </span>
          )}
        </h3>
        
        {showClearButton && completedCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearCompleted}>
            Clear Completed ({completedCount})
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {visibleTransactions.map((tx) => (
          <TransactionStatusCard
            key={tx.id}
            transaction={tx}
            onDismiss={() => removeTransaction(tx.id)}
          />
        ))}
      </div>

      {hasMore && (
        <p className="text-sm text-gray-500 text-center">
          +{transactions.length - maxVisible} more transactions
        </p>
      )}
    </div>
  )
}

TransactionList.displayName = 'TransactionList'

export { TransactionList }
```

---

## File Structure

```
hooks/
├── use-transaction-queue.ts (enhance)
├── use-transaction-queue.test.tsx (update)
├── use-transaction-watcher.ts (create)
└── use-transaction-watcher.test.ts (create)

lib/web3/
├── transaction-recovery.ts (create)
└── transaction-queue.ts (existing - verify)

components/web3/
├── transaction-status.tsx (create)
├── transaction-status.stories.tsx (create)
├── transaction-list.tsx (create)
├── transaction-list.stories.tsx (create)
└── transaction-card.tsx (existing - verify)
```

---

## Acceptance Criteria

### Status Tracking
- [ ] Show transaction hash with explorer link
- [ ] Display status: pending, confirming, confirmed, failed
- [ ] Wait for 2 confirmations before "complete"
- [ ] Update UI in real-time
- [ ] Average confirmation time < 30 seconds display

### Stuck Transaction Handling
- [ ] Detect stuck transactions (> 5 minutes pending)
- [ ] Offer speed-up option (higher gas)
- [ ] Offer cancel option (0-value replacement)
- [ ] Clear status display for pending transactions

### Error Handling
- [ ] Display revert reasons when available
- [ ] Provide retry options for failed transactions
- [ ] Handle dropped/replaced transactions
- [ ] Clear error messages with recovery actions

---

## Testing Strategy

```typescript
// hooks/use-transaction-queue.test.tsx
import { renderHook, act } from '@testing-library/react'
import { useTransactionQueue } from './use-transaction-queue'

describe('useTransactionQueue', () => {
  it('adds transaction to queue', () => {
    const { result } = renderHook(() => useTransactionQueue())
    
    act(() => {
      result.current.addTransaction({
        hash: '0x123...' as `0x${string}`,
        chainId: 1,
        type: 'approval',
        description: 'Approve TOKEN',
      })
    })
    
    expect(result.current.transactions).toHaveLength(1)
    expect(result.current.transactions[0].status).toBe('pending')
  })

  it('updates transaction status', () => {
    const { result } = renderHook(() => useTransactionQueue())
    
    let txId: string
    act(() => {
      txId = result.current.addTransaction({
        hash: '0x123...' as `0x${string}`,
        chainId: 1,
        type: 'disposal',
        description: 'Dispose tokens',
      })
    })

    act(() => {
      result.current.updateTransaction(txId, { status: 'confirmed' })
    })

    expect(result.current.transactions[0].status).toBe('confirmed')
  })

  it('clears completed transactions', () => {
    const { result } = renderHook(() => useTransactionQueue())
    
    act(() => {
      const id = result.current.addTransaction({
        hash: '0x123...' as `0x${string}`,
        chainId: 1,
        type: 'approval',
        description: 'Test',
      })
      result.current.updateTransaction(id, { status: 'confirmed' })
      result.current.clearCompleted()
    })

    expect(result.current.transactions).toHaveLength(0)
  })
})
```

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Status Update Latency | <5 seconds | Performance monitoring |
| Confirmation Detection | 100% | Transaction monitoring |
| Stuck Detection Rate | 100% | Monitoring |
| Test Coverage | >85% | Vitest coverage |

---

*RFC-006 - Last Updated: December 23, 2025*
