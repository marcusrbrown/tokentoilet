> **⚠️ ARCHIVED — Superseded post-v1.0 vision.** This document describes the original multi-chain / charity / NFT / Fountain product vision, most of which was intentionally deferred when the MVP was rebaselined to a single-chain (Sepolia) ERC-20 burn-address disposal flow. It is retained for historical reference and future roadmap planning only. For current scope, see [`docs/brainstorms/2026-04-16-mvp-rebaseline-requirements.md`](../../brainstorms/2026-04-16-mvp-rebaseline-requirements.md).

# RFC-003: Token Discovery & Display

> Implement comprehensive token discovery with rich metadata display for ERC-20 and ERC-721 tokens

**Status:** Pending  
**Priority:** MUST  
**Phase:** 1 (Weeks 1-2)  
**Complexity:** High  
**Estimated Effort:** 3-4 days

---

## Summary

This RFC completes the token discovery system, enabling automatic detection and display of all ERC-20 and ERC-721 tokens in a connected wallet. It includes metadata fetching, caching, and a performant display interface that handles wallets with up to 1,000 tokens.

## Features Addressed

| Feature ID | Feature Name | Priority | Current Status |
|------------|--------------|----------|----------------|
| F2.1 | Token Discovery | Must Have | In Progress |
| F2.2 | Token Metadata Display | Must Have | Not Started |

## Dependencies

### Builds Upon
- RFC-001: Project Foundation & Design System
- RFC-002: Wallet Connection & Multi-Chain Support

### Enables
- RFC-004: Token Management UI
- RFC-005: Token Selection & Approval Workflow
- RFC-007: Token Disposal Flow

### External Dependencies
- Alchemy SDK (token discovery API)
- CoinGecko API (token icons)
- Token Lists (verified token metadata)

---

## Technical Specification

### 1. Token Discovery Hook

Enhance `hooks/use-token-discovery.ts`:

```typescript
'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useWallet } from '@/hooks/use-wallet'
import { discoverTokens, type TokenInfo } from '@/lib/web3/token-discovery'

export interface UseTokenDiscoveryOptions {
  /** Include tokens with zero balance */
  includeZeroBalance?: boolean
  /** Token types to discover */
  tokenTypes?: ('ERC20' | 'ERC721')[]
  /** Enable auto-refresh */
  autoRefresh?: boolean
  /** Refresh interval in ms (default: 30000) */
  refreshInterval?: number
}

export interface UseTokenDiscoveryReturn {
  tokens: TokenInfo[]
  erc20Tokens: TokenInfo[]
  erc721Tokens: TokenInfo[]
  isLoading: boolean
  isRefreshing: boolean
  error: Error | null
  refetch: () => Promise<void>
  lastUpdated: Date | null
}

export function useTokenDiscovery(
  options: UseTokenDiscoveryOptions = {}
): UseTokenDiscoveryReturn {
  const {
    includeZeroBalance = false,
    tokenTypes = ['ERC20', 'ERC721'],
    autoRefresh = true,
    refreshInterval = 30000,
  } = options

  const { address, chainId, isConnected } = useWallet()
  const queryClient = useQueryClient()

  const queryKey = ['tokens', address, chainId, tokenTypes.join(',')]

  const {
    data: tokens = [],
    isLoading,
    isFetching: isRefreshing,
    error,
    refetch,
    dataUpdatedAt,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!address || !chainId) return []
      
      const discovered = await discoverTokens({
        address,
        chainId,
        tokenTypes,
      })

      // Filter zero balance if needed
      if (!includeZeroBalance) {
        return discovered.filter((token) => BigInt(token.balance) > 0n)
      }

      return discovered
    },
    enabled: isConnected && !!address && !!chainId,
    staleTime: 30000, // 30 seconds
    refetchInterval: autoRefresh ? refreshInterval : false,
    refetchOnWindowFocus: true,
  })

  const erc20Tokens = tokens.filter((t) => t.type === 'ERC20')
  const erc721Tokens = tokens.filter((t) => t.type === 'ERC721')

  return {
    tokens,
    erc20Tokens,
    erc721Tokens,
    isLoading,
    isRefreshing: isRefreshing && !isLoading,
    error: error as Error | null,
    refetch: async () => {
      await refetch()
    },
    lastUpdated: dataUpdatedAt ? new Date(dataUpdatedAt) : null,
  }
}
```

### 2. Token Discovery Service

Enhance `lib/web3/token-discovery.ts`:

```typescript
import { Alchemy, Network } from 'alchemy-sdk'

export interface TokenInfo {
  address: `0x${string}`
  chainId: number
  name: string
  symbol: string
  decimals: number
  balance: string
  balanceFormatted: string
  type: 'ERC20' | 'ERC721'
  logoURI?: string
  tokenId?: string // For NFTs
  metadata?: NFTMetadata // For NFTs
}

interface NFTMetadata {
  name?: string
  description?: string
  image?: string
  attributes?: Array<{ trait_type: string; value: string }>
}

interface DiscoverTokensOptions {
  address: `0x${string}`
  chainId: number
  tokenTypes: ('ERC20' | 'ERC721')[]
}

const CHAIN_TO_NETWORK: Record<number, Network> = {
  1: Network.ETH_MAINNET,
  137: Network.MATIC_MAINNET,
  42161: Network.ARB_MAINNET,
}

const alchemyCache = new Map<number, Alchemy>()

function getAlchemyClient(chainId: number): Alchemy {
  if (!alchemyCache.has(chainId)) {
    alchemyCache.set(
      chainId,
      new Alchemy({
        apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
        network: CHAIN_TO_NETWORK[chainId],
      })
    )
  }
  return alchemyCache.get(chainId)!
}

export async function discoverTokens({
  address,
  chainId,
  tokenTypes,
}: DiscoverTokensOptions): Promise<TokenInfo[]> {
  const alchemy = getAlchemyClient(chainId)
  const tokens: TokenInfo[] = []

  // Discover ERC-20 tokens
  if (tokenTypes.includes('ERC20')) {
    const balances = await alchemy.core.getTokenBalances(address)
    
    // Fetch metadata for non-zero balances
    const nonZeroBalances = balances.tokenBalances.filter(
      (b) => b.tokenBalance && BigInt(b.tokenBalance) > 0n
    )

    // Batch fetch metadata (max 100 at a time)
    const metadataPromises = nonZeroBalances.map((b) =>
      alchemy.core.getTokenMetadata(b.contractAddress)
    )
    const metadataResults = await Promise.allSettled(metadataPromises)

    nonZeroBalances.forEach((balance, index) => {
      const metadataResult = metadataResults[index]
      const metadata =
        metadataResult.status === 'fulfilled' ? metadataResult.value : null

      const decimals = metadata?.decimals ?? 18
      const rawBalance = BigInt(balance.tokenBalance || '0')
      const balanceFormatted = formatBalance(rawBalance, decimals)

      tokens.push({
        address: balance.contractAddress as `0x${string}`,
        chainId,
        name: metadata?.name || 'Unknown Token',
        symbol: metadata?.symbol || '???',
        decimals,
        balance: rawBalance.toString(),
        balanceFormatted,
        type: 'ERC20',
        logoURI: metadata?.logo || undefined,
      })
    })
  }

  // Discover ERC-721 NFTs
  if (tokenTypes.includes('ERC721')) {
    const nfts = await alchemy.nft.getNftsForOwner(address, {
      omitMetadata: false,
    })

    for (const nft of nfts.ownedNfts) {
      tokens.push({
        address: nft.contract.address as `0x${string}`,
        chainId,
        name: nft.name || nft.contract.name || 'Unknown NFT',
        symbol: nft.contract.symbol || 'NFT',
        decimals: 0,
        balance: '1',
        balanceFormatted: '1',
        type: 'ERC721',
        logoURI: nft.image?.thumbnailUrl || nft.image?.cachedUrl,
        tokenId: nft.tokenId,
        metadata: {
          name: nft.name,
          description: nft.description,
          image: nft.image?.cachedUrl,
          attributes: nft.raw?.metadata?.attributes,
        },
      })
    }
  }

  return tokens
}

function formatBalance(balance: bigint, decimals: number): string {
  if (balance === 0n) return '0'
  
  const divisor = BigInt(10 ** decimals)
  const intPart = balance / divisor
  const fracPart = balance % divisor
  
  if (fracPart === 0n) return intPart.toString()
  
  const fracStr = fracPart.toString().padStart(decimals, '0')
  const trimmedFrac = fracStr.replace(/0+$/, '')
  
  return `${intPart}.${trimmedFrac}`
}
```

### 3. Token List Component

Enhance `components/web3/token-list.tsx`:

```typescript
'use client'

import { useMemo } from 'react'
import { useTokenDiscovery } from '@/hooks/use-token-discovery'
import { TokenListItem } from './token-list-item'
import { TokenListSkeleton } from '@/components/ui/skeletons/token-list-skeleton'
import { cn } from '@/lib/utils'

interface TokenListProps {
  className?: string
  tokenType?: 'ERC20' | 'ERC721' | 'all'
  emptyMessage?: string
  onTokenSelect?: (token: TokenInfo) => void
  selectedTokens?: Set<string>
  maxHeight?: string
}

export function TokenList({
  className,
  tokenType = 'all',
  emptyMessage = 'No tokens found in your wallet',
  onTokenSelect,
  selectedTokens,
  maxHeight = '400px',
}: TokenListProps) {
  const { tokens, erc20Tokens, erc721Tokens, isLoading, error, lastUpdated } =
    useTokenDiscovery()

  const displayTokens = useMemo(() => {
    switch (tokenType) {
      case 'ERC20':
        return erc20Tokens
      case 'ERC721':
        return erc721Tokens
      default:
        return tokens
    }
  }, [tokenType, tokens, erc20Tokens, erc721Tokens])

  if (isLoading) {
    return <TokenListSkeleton count={5} />
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500" role="alert">
        <p>Failed to load tokens</p>
        <p className="text-sm mt-1">{error.message}</p>
      </div>
    )
  }

  if (displayTokens.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p>{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col', className)}>
      {lastUpdated && (
        <p className="text-xs text-gray-400 mb-2">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </p>
      )}
      
      <div
        className="overflow-y-auto space-y-2"
        style={{ maxHeight }}
        role="list"
        aria-label="Token list"
      >
        {displayTokens.map((token) => {
          const tokenKey = token.tokenId
            ? `${token.address}-${token.tokenId}`
            : token.address
          const isSelected = selectedTokens?.has(tokenKey)

          return (
            <TokenListItem
              key={tokenKey}
              token={token}
              selected={isSelected}
              onSelect={onTokenSelect ? () => onTokenSelect(token) : undefined}
            />
          )
        })}
      </div>
    </div>
  )
}

TokenList.displayName = 'TokenList'

export { TokenList }
```

### 4. Token List Item Component

Enhance `components/web3/token-list-item.tsx`:

```typescript
'use client'

import Image from 'next/image'
import { type TokenInfo } from '@/lib/web3/token-discovery'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface TokenListItemProps {
  token: TokenInfo
  selected?: boolean
  onSelect?: () => void
  showCheckbox?: boolean
}

export function TokenListItem({
  token,
  selected = false,
  onSelect,
  showCheckbox = true,
}: TokenListItemProps) {
  const isNFT = token.type === 'ERC721'

  return (
    <Card
      as={onSelect ? 'button' : 'div'}
      variant={selected ? 'bordered' : 'default'}
      padding="sm"
      className={cn(
        'w-full flex items-center gap-3 transition-colors',
        onSelect && 'cursor-pointer hover:bg-violet-50 dark:hover:bg-violet-900/20',
        selected && 'ring-2 ring-violet-500 bg-violet-50 dark:bg-violet-900/20'
      )}
      onClick={onSelect}
      role={onSelect ? 'checkbox' : undefined}
      aria-checked={onSelect ? selected : undefined}
      aria-label={`${token.name} - ${token.balanceFormatted} ${token.symbol}`}
    >
      {/* Checkbox */}
      {showCheckbox && onSelect && (
        <div
          className={cn(
            'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0',
            selected
              ? 'bg-violet-600 border-violet-600'
              : 'border-gray-300 dark:border-gray-600'
          )}
        >
          {selected && (
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </div>
      )}

      {/* Token Icon */}
      <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden flex-shrink-0">
        {token.logoURI ? (
          <Image
            src={token.logoURI}
            alt={token.symbol}
            width={40}
            height={40}
            className="object-cover"
            onError={(e) => {
              // Fallback to symbol on error
              e.currentTarget.style.display = 'none'
            }}
          />
        ) : (
          <span className="text-lg font-bold text-gray-400">
            {token.symbol.slice(0, 2)}
          </span>
        )}
      </div>

      {/* Token Info */}
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
            {token.name}
          </span>
          <Badge variant={isNFT ? 'secondary' : 'default'} size="sm">
            {token.type}
          </Badge>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
          {token.symbol}
          {isNFT && token.tokenId && ` #${token.tokenId}`}
        </p>
      </div>

      {/* Balance */}
      <div className="text-right flex-shrink-0">
        <p className="font-medium text-gray-900 dark:text-gray-100">
          {token.balanceFormatted}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {token.symbol}
        </p>
      </div>
    </Card>
  )
}

TokenListItem.displayName = 'TokenListItem'

export { TokenListItem }
```

### 5. Token Metadata Caching

Create `lib/web3/token-metadata-cache.ts`:

```typescript
import { LRUCache } from 'lru-cache'

interface CachedMetadata {
  name: string
  symbol: string
  decimals: number
  logoURI?: string
  fetchedAt: number
}

const metadataCache = new LRUCache<string, CachedMetadata>({
  max: 1000, // Max 1000 tokens cached
  ttl: 1000 * 60 * 60 * 24, // 24 hour TTL
})

export function getCachedMetadata(
  address: string,
  chainId: number
): CachedMetadata | undefined {
  return metadataCache.get(`${chainId}:${address.toLowerCase()}`)
}

export function setCachedMetadata(
  address: string,
  chainId: number,
  metadata: Omit<CachedMetadata, 'fetchedAt'>
): void {
  metadataCache.set(`${chainId}:${address.toLowerCase()}`, {
    ...metadata,
    fetchedAt: Date.now(),
  })
}

export function clearMetadataCache(): void {
  metadataCache.clear()
}
```

---

## File Structure

```
hooks/
├── use-token-discovery.ts (enhance)
├── use-token-discovery.test.tsx (update)
└── use-token-metadata.ts (existing - verify)

lib/web3/
├── token-discovery.ts (enhance)
├── token-metadata.ts (existing - verify)
├── token-metadata-cache.ts (create)
└── token-validation.ts (existing)

components/web3/
├── token-list.tsx (enhance)
├── token-list.stories.tsx (update)
├── token-list.test.tsx (update)
├── token-list-item.tsx (enhance)
├── token-detail.tsx (existing - verify)
└── __tests__/
    └── token-discovery.test.tsx (update)

components/ui/skeletons/
└── token-list-skeleton.tsx (verify)
```

---

## Acceptance Criteria

### Discovery
- [ ] Discover ERC-20 tokens within 5 seconds (100 tokens)
- [ ] Discover ERC-721 NFTs with metadata
- [ ] Handle wallets with up to 1,000 tokens
- [ ] Support all three chains (Ethereum, Polygon, Arbitrum)
- [ ] Auto-refresh balances every 30 seconds

### Display
- [ ] Show token name, symbol, balance, and icon
- [ ] Show type badge (ERC-20/ERC-721)
- [ ] Display NFT images when available
- [ ] Handle missing metadata gracefully
- [ ] No layout shift on load (skeleton)

### Performance
- [ ] Discovery < 5 seconds for 100 tokens
- [ ] Metadata caching reduces API calls
- [ ] Virtualized list for > 50 tokens (optional)
- [ ] Balance accuracy within 30 seconds

### Error Handling
- [ ] Show error state on discovery failure
- [ ] Retry option available
- [ ] Fallback for missing token icons
- [ ] Handle non-standard token contracts

---

## Testing Strategy

### Unit Tests

```typescript
// hooks/use-token-discovery.test.tsx
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useTokenDiscovery } from './use-token-discovery'

// Mock token discovery
vi.mock('@/lib/web3/token-discovery', () => ({
  discoverTokens: vi.fn(() =>
    Promise.resolve([
      {
        address: '0x...',
        name: 'Test Token',
        symbol: 'TEST',
        balance: '1000000000000000000',
        balanceFormatted: '1.0',
        type: 'ERC20',
      },
    ])
  ),
}))

describe('useTokenDiscovery', () => {
  it('discovers tokens for connected wallet', async () => {
    const { result } = renderHook(() => useTokenDiscovery(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.tokens).toHaveLength(1)
    expect(result.current.tokens[0].symbol).toBe('TEST')
  })

  it('separates ERC-20 and ERC-721 tokens', async () => {
    // Test filtering
  })

  it('handles discovery errors', async () => {
    // Test error state
  })
})
```

### Performance Tests

```typescript
// tests/performance/token-discovery.bench.tsx
import { bench, describe } from 'vitest'
import { discoverTokens } from '@/lib/web3/token-discovery'

describe('Token Discovery Performance', () => {
  bench('discover 100 tokens', async () => {
    await discoverTokens({
      address: '0x...',
      chainId: 1,
      tokenTypes: ['ERC20'],
    })
  })
})
```

---

## Implementation Notes

1. **Existing Code:**
   - `use-token-discovery.ts` exists - audit and enhance
   - `token-list.tsx` exists - verify all features
   - Some metadata utilities exist - consolidate

2. **API Rate Limits:**
   - Alchemy: 330 CUs/second (free tier)
   - Batch requests where possible
   - Implement exponential backoff

3. **Testing:**
   - Mock Alchemy SDK for unit tests
   - Use real testnet for integration tests
   - Performance benchmark with large wallets

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Discovery Time (100 tokens) | <5 seconds | Performance test |
| Cache Hit Rate | >80% | Monitoring |
| API Error Rate | <1% | Alchemy dashboard |
| Test Coverage | >85% | Vitest coverage |

---

*RFC-003 - Last Updated: December 23, 2025*
