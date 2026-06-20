> **⚠️ ARCHIVED — Superseded post-v1.0 vision.** This document describes the original multi-chain / charity / NFT / Fountain product vision, most of which was intentionally deferred when the MVP was rebaselined to a single-chain (Sepolia) ERC-20 burn-address disposal flow. It is retained for historical reference and future roadmap planning only. For current scope, see [`docs/brainstorms/2026-04-16-mvp-rebaseline-requirements.md`](../../brainstorms/2026-04-16-mvp-rebaseline-requirements.md).

# RFC-005: Token Selection & Approval Workflow

> Implement batch token selection and secure ERC-20/ERC-721 approval workflow

**Status:** Pending  
**Priority:** MUST  
**Phase:** 2 (Weeks 3-4)  
**Complexity:** High  
**Estimated Effort:** 3-4 days

---

## Summary

This RFC implements the token selection system and approval workflow, enabling users to select multiple tokens for batch disposal and securely approve token transfers. This is a critical security component that must clearly explain approval implications to users.

## Features Addressed

| Feature ID | Feature Name | Priority |
|------------|--------------|----------|
| F2.5 | Batch Token Selection | Must Have |
| F3.1 | Token Approval Workflow | Must Have |
| F8.2 | Transaction Simulation | Must Have |
| F8.3 | Gas Estimation | Must Have |

## Dependencies

### Builds Upon
- RFC-003: Token Discovery & Display
- RFC-004: Token Management UI

### Enables
- RFC-006: Transaction Infrastructure
- RFC-007: Token Disposal Flow

---

## Technical Specification

### 1. Token Selection Hook

Create `hooks/use-token-selection.ts`:

```typescript
'use client'

import { useState, useCallback, useMemo } from 'react'
import { type TokenInfo } from '@/lib/web3/token-discovery'

export const MAX_BATCH_SIZE = 10

export interface UseTokenSelectionReturn {
  selectedTokens: Map<string, TokenInfo>
  selectedCount: number
  isMaxSelected: boolean
  selectToken: (token: TokenInfo) => void
  deselectToken: (tokenKey: string) => void
  toggleToken: (token: TokenInfo) => void
  selectAll: (tokens: TokenInfo[]) => void
  clearSelection: () => void
  isSelected: (tokenKey: string) => boolean
  canSelectMore: boolean
}

function getTokenKey(token: TokenInfo): string {
  return token.tokenId ? `${token.address}-${token.tokenId}` : token.address
}

export function useTokenSelection(): UseTokenSelectionReturn {
  const [selectedTokens, setSelectedTokens] = useState<Map<string, TokenInfo>>(
    new Map()
  )

  const selectedCount = selectedTokens.size
  const isMaxSelected = selectedCount >= MAX_BATCH_SIZE
  const canSelectMore = selectedCount < MAX_BATCH_SIZE

  const selectToken = useCallback((token: TokenInfo) => {
    setSelectedTokens((prev) => {
      if (prev.size >= MAX_BATCH_SIZE) return prev
      const next = new Map(prev)
      next.set(getTokenKey(token), token)
      return next
    })
  }, [])

  const deselectToken = useCallback((tokenKey: string) => {
    setSelectedTokens((prev) => {
      const next = new Map(prev)
      next.delete(tokenKey)
      return next
    })
  }, [])

  const toggleToken = useCallback((token: TokenInfo) => {
    const key = getTokenKey(token)
    setSelectedTokens((prev) => {
      const next = new Map(prev)
      if (next.has(key)) {
        next.delete(key)
      } else if (next.size < MAX_BATCH_SIZE) {
        next.set(key, token)
      }
      return next
    })
  }, [])

  const selectAll = useCallback((tokens: TokenInfo[]) => {
    setSelectedTokens(() => {
      const next = new Map<string, TokenInfo>()
      tokens.slice(0, MAX_BATCH_SIZE).forEach((token) => {
        next.set(getTokenKey(token), token)
      })
      return next
    })
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedTokens(new Map())
  }, [])

  const isSelected = useCallback(
    (tokenKey: string) => selectedTokens.has(tokenKey),
    [selectedTokens]
  )

  return {
    selectedTokens,
    selectedCount,
    isMaxSelected,
    selectToken,
    deselectToken,
    toggleToken,
    selectAll,
    clearSelection,
    isSelected,
    canSelectMore,
  }
}
```

### 2. Token Approval Hook

Enhance `hooks/use-token-approval.ts`:

```typescript
'use client'

import { useState, useCallback } from 'react'
import { useWriteContract, useSimulateContract, useWaitForTransactionReceipt } from 'wagmi'
import { erc20Abi, erc721Abi, maxUint256 } from 'viem'
import { useWallet } from '@/hooks/use-wallet'
import { type TokenInfo } from '@/lib/web3/token-discovery'

export type ApprovalStatus = 'idle' | 'checking' | 'needs_approval' | 'approving' | 'approved' | 'error'

export interface TokenApprovalState {
  tokenAddress: `0x${string}`
  status: ApprovalStatus
  currentAllowance?: bigint
  error?: Error
  txHash?: `0x${string}`
}

export interface UseTokenApprovalOptions {
  spenderAddress: `0x${string}` // TokenToilet contract address
}

export interface UseTokenApprovalReturn {
  approvalStates: Map<string, TokenApprovalState>
  checkAllowance: (token: TokenInfo) => Promise<bigint>
  approve: (token: TokenInfo, amount?: bigint) => Promise<`0x${string}`>
  approveAll: (tokens: TokenInfo[]) => Promise<void>
  getApprovalStatus: (tokenAddress: string) => ApprovalStatus
  isApproving: boolean
  pendingApprovals: number
}

export function useTokenApproval({
  spenderAddress,
}: UseTokenApprovalOptions): UseTokenApprovalReturn {
  const { address: userAddress } = useWallet()
  const [approvalStates, setApprovalStates] = useState<Map<string, TokenApprovalState>>(
    new Map()
  )
  const { writeContractAsync } = useWriteContract()

  const updateState = useCallback((
    tokenAddress: string,
    update: Partial<TokenApprovalState>
  ) => {
    setApprovalStates((prev) => {
      const next = new Map(prev)
      const current = next.get(tokenAddress) || { tokenAddress: tokenAddress as `0x${string}`, status: 'idle' }
      next.set(tokenAddress, { ...current, ...update })
      return next
    })
  }, [])

  const checkAllowance = useCallback(async (token: TokenInfo): Promise<bigint> => {
    if (!userAddress) throw new Error('Wallet not connected')
    
    updateState(token.address, { status: 'checking' })

    try {
      if (token.type === 'ERC721') {
        // For NFTs, check if approved for all or specific token
        // This would need actual contract call
        return 0n // Simplified - real implementation needs isApprovedForAll check
      }

      // For ERC-20, check allowance
      // This would be done via viem readContract
      // Simplified placeholder
      const allowance = 0n
      
      updateState(token.address, {
        status: allowance > 0n ? 'approved' : 'needs_approval',
        currentAllowance: allowance,
      })

      return allowance
    } catch (error) {
      updateState(token.address, { status: 'error', error: error as Error })
      throw error
    }
  }, [userAddress, updateState])

  const approve = useCallback(async (
    token: TokenInfo,
    amount: bigint = maxUint256
  ): Promise<`0x${string}`> => {
    if (!userAddress) throw new Error('Wallet not connected')

    updateState(token.address, { status: 'approving' })

    try {
      let txHash: `0x${string}`

      if (token.type === 'ERC721') {
        // Approve NFT (setApprovalForAll)
        txHash = await writeContractAsync({
          address: token.address,
          abi: erc721Abi,
          functionName: 'setApprovalForAll',
          args: [spenderAddress, true],
        })
      } else {
        // Approve ERC-20
        txHash = await writeContractAsync({
          address: token.address,
          abi: erc20Abi,
          functionName: 'approve',
          args: [spenderAddress, amount],
        })
      }

      updateState(token.address, { status: 'approved', txHash })
      return txHash
    } catch (error) {
      updateState(token.address, { status: 'error', error: error as Error })
      throw error
    }
  }, [userAddress, spenderAddress, writeContractAsync, updateState])

  const approveAll = useCallback(async (tokens: TokenInfo[]): Promise<void> => {
    for (const token of tokens) {
      const state = approvalStates.get(token.address)
      if (state?.status !== 'approved') {
        await approve(token)
      }
    }
  }, [approvalStates, approve])

  const getApprovalStatus = useCallback((tokenAddress: string): ApprovalStatus => {
    return approvalStates.get(tokenAddress)?.status || 'idle'
  }, [approvalStates])

  const isApproving = Array.from(approvalStates.values()).some(
    (s) => s.status === 'approving' || s.status === 'checking'
  )

  const pendingApprovals = Array.from(approvalStates.values()).filter(
    (s) => s.status === 'needs_approval'
  ).length

  return {
    approvalStates,
    checkAllowance,
    approve,
    approveAll,
    getApprovalStatus,
    isApproving,
    pendingApprovals,
  }
}
```

### 3. Selection Summary Component

Create `components/web3/token-selection-summary.tsx`:

```typescript
'use client'

import { type TokenInfo } from '@/lib/web3/token-discovery'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MAX_BATCH_SIZE } from '@/hooks/use-token-selection'

interface TokenSelectionSummaryProps {
  selectedTokens: Map<string, TokenInfo>
  onClear: () => void
  onProceed: () => void
  isDisabled?: boolean
}

export function TokenSelectionSummary({
  selectedTokens,
  onClear,
  onProceed,
  isDisabled = false,
}: TokenSelectionSummaryProps) {
  const tokens = Array.from(selectedTokens.values())
  const erc20Count = tokens.filter((t) => t.type === 'ERC20').length
  const nftCount = tokens.filter((t) => t.type === 'ERC721').length

  if (tokens.length === 0) return null

  return (
    <Card
      variant="bordered"
      padding="md"
      className="sticky bottom-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <p className="font-medium">
              {tokens.length} token{tokens.length !== 1 ? 's' : ''} selected
            </p>
            <div className="flex gap-2 mt-1">
              {erc20Count > 0 && (
                <Badge variant="secondary" size="sm">
                  {erc20Count} ERC-20
                </Badge>
              )}
              {nftCount > 0 && (
                <Badge variant="secondary" size="sm">
                  {nftCount} NFT{nftCount !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>
          
          {tokens.length >= MAX_BATCH_SIZE && (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              Maximum {MAX_BATCH_SIZE} tokens per batch
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onClear}>
            Clear
          </Button>
          <Button
            variant="primary"
            onClick={onProceed}
            disabled={isDisabled || tokens.length === 0}
          >
            Continue to Approval
          </Button>
        </div>
      </div>
    </Card>
  )
}

TokenSelectionSummary.displayName = 'TokenSelectionSummary'

export { TokenSelectionSummary }
```

### 4. Approval Flow Component

Create `components/web3/token-approval-flow.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { type TokenInfo } from '@/lib/web3/token-discovery'
import { useTokenApproval, type ApprovalStatus } from '@/hooks/use-token-approval'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// Contract address would come from config
const TOKEN_TOILET_ADDRESS = '0x...' as `0x${string}`

interface TokenApprovalFlowProps {
  tokens: TokenInfo[]
  onComplete: () => void
  onCancel: () => void
}

const STATUS_CONFIG: Record<ApprovalStatus, { label: string; color: string }> = {
  idle: { label: 'Pending', color: 'text-gray-500' },
  checking: { label: 'Checking...', color: 'text-blue-500' },
  needs_approval: { label: 'Needs Approval', color: 'text-amber-500' },
  approving: { label: 'Approving...', color: 'text-blue-500' },
  approved: { label: 'Approved', color: 'text-green-500' },
  error: { label: 'Error', color: 'text-red-500' },
}

export function TokenApprovalFlow({
  tokens,
  onComplete,
  onCancel,
}: TokenApprovalFlowProps) {
  const {
    approvalStates,
    checkAllowance,
    approve,
    getApprovalStatus,
    isApproving,
  } = useTokenApproval({ spenderAddress: TOKEN_TOILET_ADDRESS })

  const [currentIndex, setCurrentIndex] = useState(0)

  // Check allowances on mount
  useEffect(() => {
    tokens.forEach((token) => {
      checkAllowance(token).catch(console.error)
    })
  }, [tokens, checkAllowance])

  const allApproved = tokens.every(
    (t) => getApprovalStatus(t.address) === 'approved'
  )

  const handleApprove = async (token: TokenInfo) => {
    try {
      await approve(token)
    } catch (error) {
      console.error('Approval failed:', error)
    }
  }

  const handleApproveAll = async () => {
    for (const token of tokens) {
      if (getApprovalStatus(token.address) !== 'approved') {
        try {
          await approve(token)
        } catch (error) {
          console.error('Approval failed for', token.symbol, error)
          break // Stop on first error
        }
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* Explanation */}
      <Card variant="default" padding="md" className="bg-amber-50 dark:bg-amber-900/20 border-amber-200">
        <h3 className="font-medium text-amber-800 dark:text-amber-200">
          Token Approval Required
        </h3>
        <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
          Before disposing tokens, you need to approve Token Toilet to transfer them.
          This is a standard security measure for all ERC-20 and ERC-721 tokens.
        </p>
        <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
          ⚠️ Each approval requires a separate transaction with gas fees.
        </p>
      </Card>

      {/* Token List */}
      <div className="space-y-2">
        {tokens.map((token, index) => {
          const status = getApprovalStatus(token.address)
          const config = STATUS_CONFIG[status]

          return (
            <Card
              key={token.address}
              variant="default"
              padding="sm"
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="font-medium">{token.symbol}</span>
                <span className="text-sm text-gray-500">
                  {token.balanceFormatted}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className={cn('text-sm', config.color)}>
                  {config.label}
                </span>
                
                {status === 'needs_approval' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleApprove(token)}
                    disabled={isApproving}
                  >
                    Approve
                  </Button>
                )}
                
                {status === 'approved' && (
                  <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="ghost" onClick={onCancel} disabled={isApproving}>
          Cancel
        </Button>

        <div className="flex gap-2">
          {!allApproved && (
            <Button
              variant="secondary"
              onClick={handleApproveAll}
              disabled={isApproving}
              loading={isApproving}
            >
              Approve All
            </Button>
          )}
          
          <Button
            variant="primary"
            onClick={onComplete}
            disabled={!allApproved || isApproving}
          >
            Continue to Disposal
          </Button>
        </div>
      </div>
    </div>
  )
}

TokenApprovalFlow.displayName = 'TokenApprovalFlow'

export { TokenApprovalFlow }
```

### 5. Gas Estimation Utility

Create `lib/web3/gas-estimation.ts`:

```typescript
import { formatEther, type PublicClient } from 'viem'

export interface GasEstimate {
  gasLimit: bigint
  gasPrice: bigint
  maxFeePerGas?: bigint
  maxPriorityFeePerGas?: bigint
  estimatedCostWei: bigint
  estimatedCostEth: string
  estimatedCostUsd?: string
}

export async function estimateApprovalGas(
  client: PublicClient,
  tokenAddress: `0x${string}`,
  tokenType: 'ERC20' | 'ERC721'
): Promise<GasEstimate> {
  // Base gas for approval transactions
  const baseGas = tokenType === 'ERC20' ? 46000n : 65000n
  
  // Add 20% buffer
  const gasLimit = (baseGas * 120n) / 100n
  
  const feeData = await client.estimateFeesPerGas()
  const gasPrice = feeData.maxFeePerGas || (await client.getGasPrice())
  
  const estimatedCostWei = gasLimit * gasPrice
  
  return {
    gasLimit,
    gasPrice,
    maxFeePerGas: feeData.maxFeePerGas,
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
    estimatedCostWei,
    estimatedCostEth: formatEther(estimatedCostWei),
  }
}

export async function estimateBatchDisposalGas(
  client: PublicClient,
  tokenCount: number
): Promise<GasEstimate> {
  // Base gas + per-token gas
  const baseGas = 50000n
  const perTokenGas = 30000n
  const totalGas = baseGas + perTokenGas * BigInt(tokenCount)
  
  // Add 20% buffer
  const gasLimit = (totalGas * 120n) / 100n
  
  const feeData = await client.estimateFeesPerGas()
  const gasPrice = feeData.maxFeePerGas || (await client.getGasPrice())
  
  const estimatedCostWei = gasLimit * gasPrice
  
  return {
    gasLimit,
    gasPrice,
    maxFeePerGas: feeData.maxFeePerGas,
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
    estimatedCostWei,
    estimatedCostEth: formatEther(estimatedCostWei),
  }
}
```

---

## File Structure

```
hooks/
├── use-token-selection.ts (create)
├── use-token-selection.test.ts (create)
├── use-token-approval.ts (enhance)
└── use-token-approval.test.tsx (update)

lib/web3/
└── gas-estimation.ts (create)

components/web3/
├── token-selection-summary.tsx (create)
├── token-selection-summary.stories.tsx (create)
├── token-approval-flow.tsx (create)
├── token-approval-flow.stories.tsx (create)
└── token-approval.tsx (existing - verify)
```

---

## Acceptance Criteria

### Selection
- [ ] Select individual tokens via checkbox/click
- [ ] "Select All" respects current filters
- [ ] Maximum 10 tokens per batch enforced
- [ ] Show selection count and breakdown
- [ ] Clear selection option
- [ ] Visual distinction for selected tokens

### Approval
- [ ] Clear explanation of what approval means
- [ ] Check existing allowance before requesting
- [ ] One-click approve for each token
- [ ] "Approve All" batch option
- [ ] Show approval status (pending, approved, failed)
- [ ] Handle non-standard approve implementations

### Gas Estimation
- [ ] Estimate gas for each approval
- [ ] Add 20% safety buffer
- [ ] Display estimated cost in ETH
- [ ] Warn for unusually high gas

### Security
- [ ] Transaction simulation before approval
- [ ] Clear warning for unlimited approvals
- [ ] Explain approval revocation options

---

## Testing Strategy

```typescript
// hooks/use-token-selection.test.ts
import { renderHook, act } from '@testing-library/react'
import { useTokenSelection, MAX_BATCH_SIZE } from './use-token-selection'

describe('useTokenSelection', () => {
  const mockToken = (address: string) => ({
    address: address as `0x${string}`,
    name: 'Test',
    symbol: 'TEST',
    balance: '1000',
    balanceFormatted: '1.0',
    type: 'ERC20' as const,
    chainId: 1,
    decimals: 18,
  })

  it('selects and deselects tokens', () => {
    const { result } = renderHook(() => useTokenSelection())
    
    act(() => {
      result.current.selectToken(mockToken('0x1'))
    })
    
    expect(result.current.selectedCount).toBe(1)
    expect(result.current.isSelected('0x1')).toBe(true)

    act(() => {
      result.current.deselectToken('0x1')
    })
    
    expect(result.current.selectedCount).toBe(0)
  })

  it('enforces maximum batch size', () => {
    const { result } = renderHook(() => useTokenSelection())
    
    // Select MAX_BATCH_SIZE tokens
    act(() => {
      for (let i = 0; i < MAX_BATCH_SIZE + 2; i++) {
        result.current.selectToken(mockToken(`0x${i}`))
      }
    })
    
    expect(result.current.selectedCount).toBe(MAX_BATCH_SIZE)
    expect(result.current.isMaxSelected).toBe(true)
    expect(result.current.canSelectMore).toBe(false)
  })

  it('clears all selections', () => {
    const { result } = renderHook(() => useTokenSelection())
    
    act(() => {
      result.current.selectToken(mockToken('0x1'))
      result.current.selectToken(mockToken('0x2'))
      result.current.clearSelection()
    })
    
    expect(result.current.selectedCount).toBe(0)
  })
})
```

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Approval Success Rate | >95% | Transaction monitoring |
| Gas Estimation Accuracy | ±10% | Post-tx analysis |
| User Completion Rate | >80% | Analytics |
| Test Coverage | >90% | Vitest coverage |

---

*RFC-005 - Last Updated: December 23, 2025*
