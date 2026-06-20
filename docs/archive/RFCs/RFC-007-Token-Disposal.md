> **⚠️ ARCHIVED — Superseded post-v1.0 vision.** This document describes the original multi-chain / charity / NFT / Fountain product vision, most of which was intentionally deferred when the MVP was rebaselined to a single-chain (Sepolia) ERC-20 burn-address disposal flow. It is retained for historical reference and future roadmap planning only. For current scope, see [`docs/brainstorms/2026-04-16-mvp-rebaseline-requirements.md`](../../brainstorms/2026-04-16-mvp-rebaseline-requirements.md).

# RFC-007: Token Disposal Flow

> Implement the core token disposal mechanism with batch support and confirmation workflow

**Status:** Pending  
**Priority:** MUST  
**Phase:** 3 (Weeks 5-6)  
**Complexity:** High  
**Estimated Effort:** 4-5 days

---

## Summary

This RFC implements the core token disposal flow - the primary feature of Token Toilet. It covers single and batch token disposal, NFT disposal, confirmation dialogs, and the complete end-to-end disposal experience.

## Features Addressed

| Feature ID | Feature Name | Priority |
|------------|--------------|----------|
| F3.2 | Single Token Disposal | Must Have |
| F3.3 | Batch Token Disposal | Must Have |
| F3.4 | NFT Disposal | Must Have |
| F3.5 | Disposal Confirmation | Must Have |

## Dependencies

### Builds Upon
- RFC-005: Token Selection & Approval Workflow
- RFC-006: Transaction Infrastructure

### Enables
- RFC-008: Animations & UX Polish
- RFC-009: Charity Integration
- RFC-010: NFT Receipt System

### Smart Contract Dependency
**NOTE:** This RFC requires the TokenToilet smart contract to be deployed. The contract interface is defined below, but actual contract development is a separate workstream.

---

## Technical Specification

### 1. Token Disposal Hook

Create `hooks/use-token-disposal.ts`:

```typescript
'use client'

import { useState, useCallback } from 'react'
import { useWriteContract, useSimulateContract } from 'wagmi'
import { useWallet } from '@/hooks/use-wallet'
import { useTransactionQueue } from '@/hooks/use-transaction-queue'
import { type TokenInfo } from '@/lib/web3/token-discovery'
import { TOKEN_TOILET_ABI, getTokenToiletAddress } from '@/lib/web3/contracts'

export type DisposalStatus = 
  | 'idle'
  | 'simulating'
  | 'awaiting_confirmation'
  | 'disposing'
  | 'success'
  | 'error'

export interface DisposalResult {
  txHash: `0x${string}`
  disposedTokens: TokenInfo[]
  timestamp: number
  charityId?: string
}

export interface UseTokenDisposalReturn {
  status: DisposalStatus
  error: Error | null
  result: DisposalResult | null
  
  // Actions
  simulateDisposal: (tokens: TokenInfo[]) => Promise<{ success: boolean; gasEstimate: bigint }>
  executeDisposal: (tokens: TokenInfo[], charityId: string) => Promise<DisposalResult>
  reset: () => void
}

export function useTokenDisposal(): UseTokenDisposalReturn {
  const { chainId, address } = useWallet()
  const { addTransaction, updateTransaction } = useTransactionQueue()
  const { writeContractAsync, simulateContractAsync } = useWriteContract()
  
  const [status, setStatus] = useState<DisposalStatus>('idle')
  const [error, setError] = useState<Error | null>(null)
  const [result, setResult] = useState<DisposalResult | null>(null)

  const contractAddress = chainId ? getTokenToiletAddress(chainId) : undefined

  const simulateDisposal = useCallback(async (tokens: TokenInfo[]) => {
    if (!contractAddress || !chainId) {
      throw new Error('Contract not available on this network')
    }

    setStatus('simulating')
    setError(null)

    try {
      const erc20Tokens = tokens.filter((t) => t.type === 'ERC20')
      const erc721Tokens = tokens.filter((t) => t.type === 'ERC721')

      // Simulate batch flush
      if (erc20Tokens.length > 0) {
        const result = await simulateContractAsync({
          address: contractAddress,
          abi: TOKEN_TOILET_ABI,
          functionName: 'batchFlush',
          args: [
            erc20Tokens.map((t) => t.address),
            erc20Tokens.map((t) => BigInt(t.balance)),
          ],
        })

        return {
          success: true,
          gasEstimate: result.request.gas || 0n,
        }
      }

      return { success: true, gasEstimate: 0n }
    } catch (err) {
      setStatus('error')
      setError(err as Error)
      return { success: false, gasEstimate: 0n }
    }
  }, [contractAddress, chainId, simulateContractAsync])

  const executeDisposal = useCallback(async (
    tokens: TokenInfo[],
    charityId: string
  ): Promise<DisposalResult> => {
    if (!contractAddress || !chainId) {
      throw new Error('Contract not available on this network')
    }

    setStatus('disposing')
    setError(null)

    try {
      const erc20Tokens = tokens.filter((t) => t.type === 'ERC20')
      const erc721Tokens = tokens.filter((t) => t.type === 'ERC721')

      let txHash: `0x${string}`

      if (erc20Tokens.length === 1 && erc721Tokens.length === 0) {
        // Single ERC-20 disposal
        txHash = await writeContractAsync({
          address: contractAddress,
          abi: TOKEN_TOILET_ABI,
          functionName: 'flushToken',
          args: [erc20Tokens[0].address, BigInt(erc20Tokens[0].balance)],
        })
      } else if (erc721Tokens.length === 1 && erc20Tokens.length === 0) {
        // Single NFT disposal
        txHash = await writeContractAsync({
          address: contractAddress,
          abi: TOKEN_TOILET_ABI,
          functionName: 'flushNFT',
          args: [erc721Tokens[0].address, BigInt(erc721Tokens[0].tokenId!)],
        })
      } else {
        // Batch disposal
        txHash = await writeContractAsync({
          address: contractAddress,
          abi: TOKEN_TOILET_ABI,
          functionName: 'batchFlush',
          args: [
            tokens.map((t) => t.address),
            tokens.map((t) => BigInt(t.type === 'ERC721' ? t.tokenId! : t.balance)),
          ],
        })
      }

      // Add to transaction queue
      addTransaction({
        hash: txHash,
        chainId,
        type: 'disposal',
        description: `Dispose ${tokens.length} token${tokens.length > 1 ? 's' : ''}`,
        metadata: { tokens, charityId },
      })

      const disposalResult: DisposalResult = {
        txHash,
        disposedTokens: tokens,
        timestamp: Date.now(),
        charityId,
      }

      setResult(disposalResult)
      setStatus('success')
      
      return disposalResult
    } catch (err) {
      setStatus('error')
      setError(err as Error)
      throw err
    }
  }, [contractAddress, chainId, writeContractAsync, addTransaction])

  const reset = useCallback(() => {
    setStatus('idle')
    setError(null)
    setResult(null)
  }, [])

  return {
    status,
    error,
    result,
    simulateDisposal,
    executeDisposal,
    reset,
  }
}
```

### 2. Smart Contract Interface

Create `lib/web3/contracts.ts`:

```typescript
export const TOKEN_TOILET_ABI = [
  {
    name: 'flushToken',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'flushNFT',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'nft', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'batchFlush',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tokens', type: 'address[]' },
      { name: 'amounts', type: 'uint256[]' },
    ],
    outputs: [],
  },
  {
    name: 'TokenFlushed',
    type: 'event',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'token', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'NFTFlushed',
    type: 'event',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'nft', type: 'address', indexed: true },
      { name: 'tokenId', type: 'uint256', indexed: false },
    ],
  },
] as const

// Contract addresses per chain (to be updated after deployment)
const CONTRACT_ADDRESSES: Record<number, `0x${string}`> = {
  1: '0x0000000000000000000000000000000000000000', // Ethereum Mainnet
  137: '0x0000000000000000000000000000000000000000', // Polygon
  42161: '0x0000000000000000000000000000000000000000', // Arbitrum
}

export function getTokenToiletAddress(chainId: number): `0x${string}` | undefined {
  return CONTRACT_ADDRESSES[chainId]
}
```

### 3. Disposal Confirmation Dialog

Create `components/web3/disposal-confirmation.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { type TokenInfo } from '@/lib/web3/token-discovery'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatEther } from 'viem'

interface DisposalConfirmationProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tokens: TokenInfo[]
  charityName: string
  estimatedGas?: bigint
  onConfirm: () => void
  isConfirming?: boolean
}

export function DisposalConfirmation({
  open,
  onOpenChange,
  tokens,
  charityName,
  estimatedGas,
  onConfirm,
  isConfirming = false,
}: DisposalConfirmationProps) {
  const [acknowledged, setAcknowledged] = useState(false)

  const erc20Count = tokens.filter((t) => t.type === 'ERC20').length
  const nftCount = tokens.filter((t) => t.type === 'ERC721').length

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Confirm Disposal"
      size="md"
    >
      <div className="space-y-4">
        {/* Warning */}
        <Card
          variant="default"
          padding="sm"
          className="bg-amber-50 dark:bg-amber-900/20 border-amber-200"
        >
          <p className="text-sm text-amber-800 dark:text-amber-200">
            ⚠️ This action is irreversible. Once disposed, tokens cannot be recovered.
          </p>
        </Card>

        {/* Token Summary */}
        <div>
          <h4 className="font-medium mb-2">Tokens to Dispose</h4>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {tokens.map((token) => (
              <Card
                key={token.tokenId ? `${token.address}-${token.tokenId}` : token.address}
                variant="default"
                padding="sm"
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{token.symbol}</span>
                  <Badge variant="secondary" size="sm">{token.type}</Badge>
                </div>
                <span className="text-gray-600 dark:text-gray-400">
                  {token.balanceFormatted}
                  {token.tokenId && ` #${token.tokenId}`}
                </span>
              </Card>
            ))}
          </div>
          
          <div className="mt-2 flex gap-2 text-sm text-gray-500">
            {erc20Count > 0 && <span>{erc20Count} ERC-20 token{erc20Count > 1 ? 's' : ''}</span>}
            {erc20Count > 0 && nftCount > 0 && <span>•</span>}
            {nftCount > 0 && <span>{nftCount} NFT{nftCount > 1 ? 's' : ''}</span>}
          </div>
        </div>

        {/* Charity */}
        <div className="flex justify-between py-2 border-y border-gray-200 dark:border-gray-700">
          <span className="text-gray-600 dark:text-gray-400">Beneficiary</span>
          <span className="font-medium">{charityName}</span>
        </div>

        {/* Gas Estimate */}
        {estimatedGas && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Estimated Gas</span>
            <span>{formatEther(estimatedGas)} ETH</span>
          </div>
        )}

        {/* Acknowledgment */}
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
            className="mt-1 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            I understand that these tokens will be permanently transferred and cannot be recovered.
            The value will be donated to {charityName}.
          </span>
        </label>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isConfirming}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={!acknowledged || isConfirming}
            loading={isConfirming}
          >
            {isConfirming ? 'Disposing...' : 'Confirm Disposal'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

DisposalConfirmation.displayName = 'DisposalConfirmation'

export { DisposalConfirmation }
```

### 4. Disposal Flow Page Component

Create `components/web3/disposal-flow.tsx`:

```typescript
'use client'

import { useState, useCallback } from 'react'
import { useTokenDiscovery } from '@/hooks/use-token-discovery'
import { useTokenSelection } from '@/hooks/use-token-selection'
import { useTokenApproval } from '@/hooks/use-token-approval'
import { useTokenDisposal } from '@/hooks/use-token-disposal'
import { TokenList } from './token-list'
import { TokenFilterBar } from './token-filter-bar'
import { TokenSelectionSummary } from './token-selection-summary'
import { TokenApprovalFlow } from './token-approval-flow'
import { DisposalConfirmation } from './disposal-confirmation'
import { DisposalSuccess } from './disposal-success'
import { useTokenFiltering } from '@/hooks/use-token-filtering'
import { Card } from '@/components/ui/card'

type FlowStep = 'select' | 'approve' | 'confirm' | 'processing' | 'success'

const DEFAULT_CHARITY_ID = 'giving-block-general'
const DEFAULT_CHARITY_NAME = 'The Giving Block'

export function DisposalFlow() {
  const [step, setStep] = useState<FlowStep>('select')
  const [showConfirmation, setShowConfirmation] = useState(false)
  
  const { tokens, isLoading } = useTokenDiscovery()
  const { filteredTokens, filters, setFilter, clearFilters, activeFilterCount } = 
    useTokenFiltering({ tokens })
  const { 
    selectedTokens, 
    toggleToken, 
    clearSelection, 
    selectedCount 
  } = useTokenSelection()
  const { executeDisposal, result, status, error, reset } = useTokenDisposal()

  const selectedTokensArray = Array.from(selectedTokens.values())

  const handleProceedToApproval = () => {
    setStep('approve')
  }

  const handleApprovalComplete = () => {
    setShowConfirmation(true)
  }

  const handleConfirmDisposal = async () => {
    setShowConfirmation(false)
    setStep('processing')
    
    try {
      await executeDisposal(selectedTokensArray, DEFAULT_CHARITY_ID)
      setStep('success')
    } catch (err) {
      // Error handled by hook
      setStep('approve') // Go back to allow retry
    }
  }

  const handleReset = () => {
    reset()
    clearSelection()
    setStep('select')
  }

  if (step === 'success' && result) {
    return (
      <DisposalSuccess
        result={result}
        onDone={handleReset}
      />
    )
  }

  if (step === 'approve') {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Approve Tokens</h2>
        <TokenApprovalFlow
          tokens={selectedTokensArray}
          onComplete={handleApprovalComplete}
          onCancel={() => setStep('select')}
        />
        
        <DisposalConfirmation
          open={showConfirmation}
          onOpenChange={setShowConfirmation}
          tokens={selectedTokensArray}
          charityName={DEFAULT_CHARITY_NAME}
          onConfirm={handleConfirmDisposal}
          isConfirming={status === 'disposing'}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Select Tokens to Dispose</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Choose the tokens you want to flush. They will be donated to charity.
        </p>
      </div>

      <TokenFilterBar
        filters={filters}
        onFilterChange={setFilter}
        onClearFilters={clearFilters}
        activeFilterCount={activeFilterCount}
      />

      <TokenList
        tokens={filteredTokens}
        isLoading={isLoading}
        selectedTokens={new Set(selectedTokens.keys())}
        onTokenSelect={toggleToken}
      />

      <TokenSelectionSummary
        selectedTokens={selectedTokens}
        onClear={clearSelection}
        onProceed={handleProceedToApproval}
        isDisabled={selectedCount === 0}
      />
    </div>
  )
}

DisposalFlow.displayName = 'DisposalFlow'

export { DisposalFlow }
```

### 5. Disposal Success Component

Create `components/web3/disposal-success.tsx`:

```typescript
'use client'

import { type DisposalResult } from '@/hooks/use-token-disposal'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AddressDisplay } from '@/components/ui/address-display'

interface DisposalSuccessProps {
  result: DisposalResult
  onDone: () => void
}

export function DisposalSuccess({ result, onDone }: DisposalSuccessProps) {
  return (
    <div className="text-center space-y-6">
      {/* Success Icon */}
      <div className="text-6xl">🚽✨</div>

      <div>
        <h2 className="text-2xl font-bold text-green-600">Tokens Disposed!</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {result.disposedTokens.length} token{result.disposedTokens.length > 1 ? 's' : ''} successfully flushed
        </p>
      </div>

      {/* Transaction Details */}
      <Card variant="default" padding="md" className="text-left">
        <dl className="space-y-3">
          <div className="flex justify-between">
            <dt className="text-gray-500">Transaction</dt>
            <dd>
              <AddressDisplay
                address={result.txHash}
                truncate
                showCopy
                showExternalLink
                type="tx"
              />
            </dd>
          </div>
          
          <div className="flex justify-between">
            <dt className="text-gray-500">Tokens Disposed</dt>
            <dd>{result.disposedTokens.length}</dd>
          </div>
          
          <div className="flex justify-between">
            <dt className="text-gray-500">Time</dt>
            <dd>{new Date(result.timestamp).toLocaleString()}</dd>
          </div>
        </dl>
      </Card>

      {/* Disposed Tokens List */}
      <Card variant="bordered" padding="md" className="text-left">
        <h3 className="font-medium mb-3">Disposed Tokens</h3>
        <ul className="space-y-2">
          {result.disposedTokens.map((token) => (
            <li
              key={token.tokenId ? `${token.address}-${token.tokenId}` : token.address}
              className="flex justify-between text-sm"
            >
              <span>{token.symbol}</span>
              <span className="text-gray-500">
                {token.balanceFormatted}
                {token.tokenId && ` #${token.tokenId}`}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Actions */}
      <div className="flex justify-center gap-4">
        <Button variant="secondary" onClick={() => window.open(`https://etherscan.io/tx/${result.txHash}`, '_blank')}>
          View on Explorer
        </Button>
        <Button variant="primary" onClick={onDone}>
          Dispose More Tokens
        </Button>
      </div>
    </div>
  )
}

DisposalSuccess.displayName = 'DisposalSuccess'

export { DisposalSuccess }
```

---

## File Structure

```
hooks/
├── use-token-disposal.ts (create)
└── use-token-disposal.test.tsx (create)

lib/web3/
└── contracts.ts (create)

components/web3/
├── disposal-flow.tsx (create)
├── disposal-flow.stories.tsx (create)
├── disposal-confirmation.tsx (create)
├── disposal-confirmation.stories.tsx (create)
├── disposal-success.tsx (create)
└── disposal-success.stories.tsx (create)
```

---

## Acceptance Criteria

### Single Token Disposal
- [ ] Clear confirmation dialog before disposal
- [ ] Show token being disposed with amount
- [ ] Real-time transaction status updates
- [ ] Success confirmation with receipt link
- [ ] Gas estimation before confirmation

### Batch Token Disposal
- [ ] Support up to 10 tokens per batch
- [ ] Show all tokens in confirmation summary
- [ ] Single transaction for batch disposal
- [ ] Partial success handling

### NFT Disposal
- [ ] Support ERC-721 standard NFTs
- [ ] Show NFT image/preview in confirmation
- [ ] Handle setApprovalForAll pattern
- [ ] Success confirmation with disposed NFT details

### Confirmation
- [ ] List all tokens being disposed
- [ ] Show total gas estimate
- [ ] Display charity receiving contribution
- [ ] Require explicit acknowledgment
- [ ] Warning for irreversible action

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Disposal Success Rate | >98% | Transaction monitoring |
| User Completion Rate | >85% | Analytics |
| Average Disposal Time | <30 seconds | Performance monitoring |
| Test Coverage | >85% | Vitest coverage |

---

*RFC-007 - Last Updated: December 23, 2025*
