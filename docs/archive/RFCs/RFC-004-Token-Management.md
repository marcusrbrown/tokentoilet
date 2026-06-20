> **⚠️ ARCHIVED — Superseded post-v1.0 vision.** This document describes the original multi-chain / charity / NFT / Fountain product vision, most of which was intentionally deferred when the MVP was rebaselined to a single-chain (Sepolia) ERC-20 burn-address disposal flow. It is retained for historical reference and future roadmap planning only. For current scope, see [`docs/brainstorms/2026-04-16-mvp-rebaseline-requirements.md`](../../brainstorms/2026-04-16-mvp-rebaseline-requirements.md).

# RFC-004: Token Management UI

> Implement filtering, sorting, and search functionality for token lists

**Status:** Pending  
**Priority:** MUST  
**Phase:** 2 (Weeks 3-4)  
**Complexity:** Medium  
**Estimated Effort:** 2-3 days

---

## Summary

This RFC implements the token management interface, enabling users to filter, sort, and search through their tokens efficiently. It builds on the token discovery from RFC-003 to provide a user-friendly way to navigate large token collections.

## Features Addressed

| Feature ID | Feature Name | Priority |
|------------|--------------|----------|
| F2.3 | Token Filtering | Must Have |
| F2.4 | Token Sorting | Must Have |
| F2.6 | Token Search | Should Have |
| F2.7 | Token Detail View | Should Have |

## Dependencies

### Builds Upon
- RFC-003: Token Discovery & Display

### Enables
- RFC-005: Token Selection & Approval Workflow

---

## Technical Specification

### 1. Token Filtering Hook

Create `hooks/use-token-filtering.ts`:

```typescript
'use client'

import { useMemo, useState, useCallback } from 'react'
import { type TokenInfo } from '@/lib/web3/token-discovery'

export interface TokenFilters {
  chainId?: number
  tokenType?: 'ERC20' | 'ERC721' | 'all'
  valueRange?: 'all' | 'high' | 'medium' | 'low' | 'zero'
  searchQuery?: string
}

export interface UseTokenFilteringOptions {
  tokens: TokenInfo[]
  initialFilters?: TokenFilters
}

export interface UseTokenFilteringReturn {
  filteredTokens: TokenInfo[]
  filters: TokenFilters
  setFilter: <K extends keyof TokenFilters>(key: K, value: TokenFilters[K]) => void
  clearFilters: () => void
  hasActiveFilters: boolean
  activeFilterCount: number
}

const DEFAULT_FILTERS: TokenFilters = {
  tokenType: 'all',
  valueRange: 'all',
  searchQuery: '',
}

export function useTokenFiltering({
  tokens,
  initialFilters = DEFAULT_FILTERS,
}: UseTokenFilteringOptions): UseTokenFilteringReturn {
  const [filters, setFilters] = useState<TokenFilters>(initialFilters)

  const setFilter = useCallback(<K extends keyof TokenFilters>(
    key: K,
    value: TokenFilters[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
  }, [])

  const filteredTokens = useMemo(() => {
    let result = [...tokens]

    // Filter by chain
    if (filters.chainId) {
      result = result.filter((t) => t.chainId === filters.chainId)
    }

    // Filter by token type
    if (filters.tokenType && filters.tokenType !== 'all') {
      result = result.filter((t) => t.type === filters.tokenType)
    }

    // Filter by value range (simplified - would need price data for real implementation)
    if (filters.valueRange && filters.valueRange !== 'all') {
      result = result.filter((t) => {
        const balance = BigInt(t.balance)
        switch (filters.valueRange) {
          case 'zero':
            return balance === 0n
          case 'low':
            return balance > 0n && balance < BigInt(1e18)
          case 'medium':
            return balance >= BigInt(1e18) && balance < BigInt(1e21)
          case 'high':
            return balance >= BigInt(1e21)
          default:
            return true
        }
      })
    }

    // Filter by search query
    if (filters.searchQuery && filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase().trim()
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.symbol.toLowerCase().includes(query) ||
          t.address.toLowerCase().includes(query)
      )
    }

    return result
  }, [tokens, filters])

  const hasActiveFilters = useMemo(() => {
    return (
      filters.chainId !== undefined ||
      (filters.tokenType !== 'all' && filters.tokenType !== undefined) ||
      (filters.valueRange !== 'all' && filters.valueRange !== undefined) ||
      (filters.searchQuery !== '' && filters.searchQuery !== undefined)
    )
  }, [filters])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.chainId) count++
    if (filters.tokenType && filters.tokenType !== 'all') count++
    if (filters.valueRange && filters.valueRange !== 'all') count++
    if (filters.searchQuery) count++
    return count
  }, [filters])

  return {
    filteredTokens,
    filters,
    setFilter,
    clearFilters,
    hasActiveFilters,
    activeFilterCount,
  }
}
```

### 2. Token Sorting

Enhance `lib/web3/token-filtering.ts`:

```typescript
export type SortField = 'name' | 'symbol' | 'balance' | 'type'
export type SortDirection = 'asc' | 'desc'

export interface SortConfig {
  field: SortField
  direction: SortDirection
}

export function sortTokens(
  tokens: TokenInfo[],
  config: SortConfig
): TokenInfo[] {
  const sorted = [...tokens]
  
  sorted.sort((a, b) => {
    let comparison = 0
    
    switch (config.field) {
      case 'name':
        comparison = a.name.localeCompare(b.name)
        break
      case 'symbol':
        comparison = a.symbol.localeCompare(b.symbol)
        break
      case 'balance':
        comparison = Number(BigInt(a.balance) - BigInt(b.balance))
        break
      case 'type':
        comparison = a.type.localeCompare(b.type)
        break
    }
    
    return config.direction === 'asc' ? comparison : -comparison
  })
  
  return sorted
}
```

### 3. Token Filter Bar Component

Create `components/web3/token-filter-bar.tsx`:

```typescript
'use client'

import { type TokenFilters } from '@/hooks/use-token-filtering'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { SUPPORTED_CHAIN_IDS } from '@/hooks/use-wallet'
import { cn } from '@/lib/utils'

interface TokenFilterBarProps {
  filters: TokenFilters
  onFilterChange: <K extends keyof TokenFilters>(key: K, value: TokenFilters[K]) => void
  onClearFilters: () => void
  activeFilterCount: number
  className?: string
}

const CHAIN_NAMES: Record<number, string> = {
  1: 'Ethereum',
  137: 'Polygon',
  42161: 'Arbitrum',
}

export function TokenFilterBar({
  filters,
  onFilterChange,
  onClearFilters,
  activeFilterCount,
  className,
}: TokenFilterBarProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {/* Search */}
      <div className="relative">
        <Input
          type="search"
          placeholder="Search by name, symbol, or address..."
          value={filters.searchQuery || ''}
          onChange={(e) => onFilterChange('searchQuery', e.target.value)}
          className="pl-10"
          aria-label="Search tokens"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {/* Chain Filter */}
        <div className="flex gap-1">
          <Button
            variant={!filters.chainId ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => onFilterChange('chainId', undefined)}
          >
            All Chains
          </Button>
          {SUPPORTED_CHAIN_IDS.map((id) => (
            <Button
              key={id}
              variant={filters.chainId === id ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => onFilterChange('chainId', id)}
            >
              {CHAIN_NAMES[id]}
            </Button>
          ))}
        </div>

        {/* Type Filter */}
        <div className="flex gap-1">
          <Button
            variant={filters.tokenType === 'all' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => onFilterChange('tokenType', 'all')}
          >
            All Types
          </Button>
          <Button
            variant={filters.tokenType === 'ERC20' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => onFilterChange('tokenType', 'ERC20')}
          >
            ERC-20
          </Button>
          <Button
            variant={filters.tokenType === 'ERC721' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => onFilterChange('tokenType', 'ERC721')}
          >
            NFTs
          </Button>
        </div>

        {/* Clear Filters */}
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            Clear Filters
            <Badge variant="secondary" size="sm" className="ml-1">
              {activeFilterCount}
            </Badge>
          </Button>
        )}
      </div>
    </div>
  )
}

TokenFilterBar.displayName = 'TokenFilterBar'

export { TokenFilterBar }
```

### 4. Token Sort Dropdown

Create `components/web3/token-sort-dropdown.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { type SortConfig, type SortField, type SortDirection } from '@/lib/web3/token-filtering'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface TokenSortDropdownProps {
  sortConfig: SortConfig
  onSortChange: (config: SortConfig) => void
  className?: string
}

const SORT_OPTIONS: { field: SortField; label: string }[] = [
  { field: 'balance', label: 'Balance' },
  { field: 'name', label: 'Name' },
  { field: 'symbol', label: 'Symbol' },
  { field: 'type', label: 'Type' },
]

export function TokenSortDropdown({
  sortConfig,
  onSortChange,
  className,
}: TokenSortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleSortSelect = (field: SortField) => {
    // Toggle direction if same field, otherwise default to desc
    const direction: SortDirection =
      sortConfig.field === field && sortConfig.direction === 'desc'
        ? 'asc'
        : 'desc'
    onSortChange({ field, direction })
    setIsOpen(false)
  }

  const currentLabel = SORT_OPTIONS.find((o) => o.field === sortConfig.field)?.label

  return (
    <div className={cn('relative', className)}>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        Sort: {currentLabel}
        <span className="ml-1">
          {sortConfig.direction === 'asc' ? '↑' : '↓'}
        </span>
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div
            className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20"
            role="listbox"
          >
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.field}
                className={cn(
                  'w-full px-3 py-2 text-left text-sm hover:bg-violet-50 dark:hover:bg-violet-900/20',
                  sortConfig.field === option.field && 'bg-violet-50 dark:bg-violet-900/20'
                )}
                onClick={() => handleSortSelect(option.field)}
                role="option"
                aria-selected={sortConfig.field === option.field}
              >
                {option.label}
                {sortConfig.field === option.field && (
                  <span className="float-right">
                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

TokenSortDropdown.displayName = 'TokenSortDropdown'

export { TokenSortDropdown }
```

### 5. Token Detail Modal

Enhance `components/web3/token-detail.tsx`:

```typescript
'use client'

import { type TokenInfo } from '@/lib/web3/token-discovery'
import { Modal } from '@/components/ui/modal'
import { AddressDisplay } from '@/components/ui/address-display'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

interface TokenDetailProps {
  token: TokenInfo | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectForDisposal?: (token: TokenInfo) => void
}

export function TokenDetail({
  token,
  open,
  onOpenChange,
  onSelectForDisposal,
}: TokenDetailProps) {
  if (!token) return null

  const isNFT = token.type === 'ERC721'

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={token.name}
      size="md"
    >
      <div className="space-y-4">
        {/* Token Image/Icon */}
        <div className="flex justify-center">
          {token.logoURI ? (
            <Image
              src={token.logoURI}
              alt={token.symbol}
              width={isNFT ? 200 : 80}
              height={isNFT ? 200 : 80}
              className={cn(
                'rounded-lg',
                isNFT ? 'aspect-square object-cover' : 'rounded-full'
              )}
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <span className="text-2xl font-bold text-gray-400">
                {token.symbol.slice(0, 2)}
              </span>
            </div>
          )}
        </div>

        {/* Token Info */}
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2">
            <span className="text-xl font-bold">{token.symbol}</span>
            <Badge variant="secondary">{token.type}</Badge>
          </div>

          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-gray-500">Balance</dt>
            <dd className="font-medium text-right">{token.balanceFormatted}</dd>

            <dt className="text-gray-500">Decimals</dt>
            <dd className="font-medium text-right">{token.decimals}</dd>

            {isNFT && token.tokenId && (
              <>
                <dt className="text-gray-500">Token ID</dt>
                <dd className="font-medium text-right">#{token.tokenId}</dd>
              </>
            )}

            <dt className="text-gray-500">Contract</dt>
            <dd className="text-right">
              <AddressDisplay
                address={token.address}
                truncate
                showCopy
                showExternalLink
                chainId={token.chainId}
              />
            </dd>
          </dl>

          {/* NFT Metadata */}
          {isNFT && token.metadata?.description && (
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Description</h4>
              <p className="text-sm">{token.metadata.description}</p>
            </div>
          )}

          {isNFT && token.metadata?.attributes && token.metadata.attributes.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Attributes</h4>
              <div className="flex flex-wrap gap-2">
                {token.metadata.attributes.map((attr, i) => (
                  <Badge key={i} variant="secondary" size="sm">
                    {attr.trait_type}: {attr.value}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {onSelectForDisposal && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="primary"
              className="w-full"
              onClick={() => {
                onSelectForDisposal(token)
                onOpenChange(false)
              }}
            >
              Select for Disposal
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}

TokenDetail.displayName = 'TokenDetail'

export { TokenDetail }
```

---

## File Structure

```
hooks/
├── use-token-filtering.ts (create)
└── use-token-filtering.test.ts (create)

lib/web3/
└── token-filtering.ts (enhance with sorting)

components/web3/
├── token-filter-bar.tsx (create)
├── token-filter-bar.stories.tsx (create)
├── token-sort-dropdown.tsx (create)
├── token-sort-dropdown.stories.tsx (create)
├── token-detail.tsx (enhance)
└── token-detail.stories.tsx (update)
```

---

## Acceptance Criteria

### Filtering
- [ ] Filter by blockchain network (Ethereum, Polygon, Arbitrum)
- [ ] Filter by token type (ERC-20 vs ERC-721)
- [ ] Filter by value range (high, medium, low, zero)
- [ ] Combine multiple filters
- [ ] Show active filter indicator
- [ ] Clear all filters option

### Sorting
- [ ] Sort by balance (high to low, low to high)
- [ ] Sort alphabetically by name
- [ ] Sort by symbol
- [ ] Visual indicator of current sort
- [ ] Persist sort preference in session

### Search
- [ ] Real-time search as user types
- [ ] Match on token name, symbol, and address
- [ ] Case-insensitive search
- [ ] Show "no results" state
- [ ] Clear search input option

### Token Detail
- [ ] Display full token information
- [ ] Show contract address with explorer link
- [ ] Display NFT image and attributes
- [ ] Quick action to select for disposal

---

## Testing Strategy

```typescript
// hooks/use-token-filtering.test.ts
import { renderHook, act } from '@testing-library/react'
import { useTokenFiltering } from './use-token-filtering'

const mockTokens = [
  { address: '0x1', name: 'Token A', symbol: 'TKA', type: 'ERC20', chainId: 1, balance: '1000' },
  { address: '0x2', name: 'Token B', symbol: 'TKB', type: 'ERC721', chainId: 137, balance: '1' },
  { address: '0x3', name: 'Token C', symbol: 'TKC', type: 'ERC20', chainId: 1, balance: '0' },
]

describe('useTokenFiltering', () => {
  it('filters by chain', () => {
    const { result } = renderHook(() => useTokenFiltering({ tokens: mockTokens }))
    
    act(() => {
      result.current.setFilter('chainId', 1)
    })
    
    expect(result.current.filteredTokens).toHaveLength(2)
  })

  it('filters by token type', () => {
    const { result } = renderHook(() => useTokenFiltering({ tokens: mockTokens }))
    
    act(() => {
      result.current.setFilter('tokenType', 'ERC721')
    })
    
    expect(result.current.filteredTokens).toHaveLength(1)
  })

  it('searches by name', () => {
    const { result } = renderHook(() => useTokenFiltering({ tokens: mockTokens }))
    
    act(() => {
      result.current.setFilter('searchQuery', 'Token A')
    })
    
    expect(result.current.filteredTokens).toHaveLength(1)
    expect(result.current.filteredTokens[0].name).toBe('Token A')
  })

  it('combines multiple filters', () => {
    const { result } = renderHook(() => useTokenFiltering({ tokens: mockTokens }))
    
    act(() => {
      result.current.setFilter('chainId', 1)
      result.current.setFilter('tokenType', 'ERC20')
    })
    
    expect(result.current.filteredTokens).toHaveLength(2)
  })

  it('clears all filters', () => {
    const { result } = renderHook(() => useTokenFiltering({ tokens: mockTokens }))
    
    act(() => {
      result.current.setFilter('chainId', 1)
      result.current.clearFilters()
    })
    
    expect(result.current.filteredTokens).toHaveLength(3)
    expect(result.current.hasActiveFilters).toBe(false)
  })
})
```

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Filter Response Time | <50ms | Performance test |
| Search Debounce | 300ms | UX testing |
| Test Coverage | >90% | Vitest coverage |
| Accessibility Issues | 0 | vitest-axe |

---

*RFC-004 - Last Updated: December 23, 2025*
