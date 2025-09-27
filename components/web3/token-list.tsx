'use client'

import type {CategorizedToken, TokenFilter, TokenSortOptions} from '@/lib/web3/token-filtering'
import type {Address} from 'viem'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Skeleton} from '@/components/ui/skeleton'
import {useTokenDiscovery} from '@/hooks/use-token-discovery'
import {useTokenFiltering} from '@/hooks/use-token-filtering'
import {cn} from '@/lib/utils'
import {useVirtualizer} from '@tanstack/react-virtual'
import {cva, type VariantProps} from 'class-variance-authority'
import {AlertCircle, ChevronLeft, ChevronRight, Filter, Loader2, Search, SortAsc, SortDesc, Trash2} from 'lucide-react'
import React, {useCallback, useMemo, useRef, useState} from 'react'

import {TokenListItem} from './token-list-item'

const tokenListVariants = cva(
  [
    'w-full',
    'rounded-lg',
    'border',
    'bg-white/80',
    'backdrop-blur-md',
    'dark:bg-gray-900/80',
    'dark:border-gray-700/40',
  ],
  {
    variants: {
      variant: {
        default: ['border-gray-200/60', 'shadow-sm'],
        compact: ['border-gray-200/60', 'shadow-none'],
        card: ['border-gray-200/60', 'shadow-lg', 'rounded-xl'],
      },
      layout: {
        list: [],
        grid: [],
      },
    },
    defaultVariants: {
      variant: 'default',
      layout: 'list',
    },
  },
)

export interface TokenListConfig {
  /** Items per page for pagination */
  itemsPerPage: number
  /** Estimated height of each token item in pixels */
  itemHeight: number
  /** Whether to enable virtual scrolling */
  enableVirtualScrolling: boolean
  /** Whether to enable pagination */
  enablePagination: boolean
  /** Whether to enable search functionality */
  enableSearch: boolean
  /** Whether to enable sorting */
  enableSorting: boolean
  /** Whether to enable filtering */
  enableFiltering: boolean
  /** Whether to enable batch selection */
  enableBatchSelection: boolean
}

export interface TokenListProps extends VariantProps<typeof tokenListVariants> {
  /** Configuration options */
  config?: Partial<TokenListConfig>
  /** Optional token filter to apply */
  filter?: TokenFilter
  /** Optional sort configuration */
  sort?: TokenSortOptions
  /** Search query */
  searchQuery?: string
  /** Selected tokens for batch operations */
  selectedTokens?: Address[]
  /** Callback when tokens are selected/deselected */
  onTokenSelectionChange?: (tokens: Address[]) => void
  /** Callback when a token is clicked */
  onTokenClick?: (token: CategorizedToken) => void
  /** Callback when token details should be viewed */
  onViewTokenDetails?: (token: CategorizedToken) => void
  /** Additional CSS classes */
  className?: string
}

// Default configuration optimized for 1000+ token performance
const DEFAULT_CONFIG = {
  itemsPerPage: 50,
  itemHeight: 80,
  enableVirtualScrolling: true,
  enablePagination: true,
  enableSearch: true,
  enableSorting: true,
  enableFiltering: true,
  enableBatchSelection: true,
} as const satisfies TokenListConfig

// Stable object references prevent unnecessary re-renders
const DEFAULT_USER_CONFIG = {}
const DEFAULT_FILTER: TokenFilter = {}
const DEFAULT_SORT: TokenSortOptions = {field: 'balance', direction: 'desc'}
const EMPTY_SELECTED_TOKENS: Address[] = []

/**
 * High-performance token list with virtual scrolling for efficient batch disposal operations.
 *
 * Virtual scrolling is critical for wallets containing 1000+ tokens, common in DeFi power users.
 * Search and filtering capabilities help users quickly identify unwanted tokens for disposal.
 * Batch selection enables efficient multi-token disposal transactions.
 */
export function TokenList({
  config: userConfig = DEFAULT_USER_CONFIG,
  filter = DEFAULT_FILTER,
  sort = DEFAULT_SORT,
  searchQuery: initialSearchQuery = '',
  selectedTokens = EMPTY_SELECTED_TOKENS,
  onTokenSelectionChange,
  onTokenClick,
  onViewTokenDetails,
  className,
  variant = 'default',
  layout = 'list',
  ...props
}: TokenListProps): React.ReactElement {
  // Memoized config prevents unnecessary child re-renders
  const config = useMemo(() => ({...DEFAULT_CONFIG, ...userConfig}), [userConfig])

  const [searchQuery, setSearchQuery] = useState(initialSearchQuery)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortConfig, setSortConfig] = useState<TokenSortOptions>(sort)
  const [activeFilter] = useState<TokenFilter>(filter)
  const [internalSelectedTokens, setInternalSelectedTokens] = useState<Address[]>(selectedTokens)

  const parentRef = useRef<HTMLDivElement>(null)

  const {
    tokens: discoveredTokens,
    isLoading: isDiscovering,
    error: discoveryError,
    refetch: refetchTokens,
  } = useTokenDiscovery({
    enabled: true,
  })

  const {
    tokens: categorizedTokens,
    isLoading: isFiltering,
    error: filteringError,
  } = useTokenFiltering(
    discoveredTokens,
    {
      ...activeFilter,
      searchQuery: searchQuery.trim() || undefined,
    },
    sortConfig,
  )

  const totalTokens = categorizedTokens.length
  const totalPages = Math.ceil(totalTokens / config.itemsPerPage)
  const startIndex = (currentPage - 1) * config.itemsPerPage
  const endIndex = Math.min(startIndex + config.itemsPerPage, totalTokens)
  const paginatedTokens = config.enablePagination ? categorizedTokens.slice(startIndex, endIndex) : categorizedTokens

  const virtualizer = useVirtualizer({
    count: config.enableVirtualScrolling ? paginatedTokens.length : 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => config.itemHeight,
    overscan: 5,
  })

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value)
    setCurrentPage(1) // Reset to first page on search
  }, [])

  const handleSortChange = useCallback((field: TokenSortOptions['field']) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
    setCurrentPage(1) // Reset to first page on sort
  }, [])

  const handleTokenSelection = useCallback(
    (token: CategorizedToken, selected: boolean) => {
      const newSelection = selected
        ? [...internalSelectedTokens, token.address]
        : internalSelectedTokens.filter(addr => addr !== token.address)

      setInternalSelectedTokens(newSelection)
      onTokenSelectionChange?.(newSelection)
    },
    [internalSelectedTokens, onTokenSelectionChange],
  )

  const handleSelectAll = useCallback(() => {
    const allAddresses = paginatedTokens.map(token => token.address)
    setInternalSelectedTokens(allAddresses)
    onTokenSelectionChange?.(allAddresses)
  }, [paginatedTokens, onTokenSelectionChange])

  const handleDeselectAll = useCallback(() => {
    setInternalSelectedTokens([])
    onTokenSelectionChange?.([])
  }, [onTokenSelectionChange])

  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(Math.max(1, Math.min(page, totalPages)))
    },
    [totalPages],
  )

  const isLoading = isDiscovering || isFiltering
  const hasError = discoveryError != null || filteringError != null

  if (isLoading && categorizedTokens.length === 0) {
    return (
      <div className={cn(tokenListVariants({variant, layout}), className)} {...props}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
            <span className="text-gray-700 dark:text-gray-300">Discovering tokens...</span>
          </div>
          <div className="space-y-4">
            {Array.from({length: 5}, (_, index) => `loading-${index}`).map(key => (
              <div key={key} className="p-4 rounded-lg border border-gray-200/60 dark:border-gray-700/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <Skeleton variant="web3" className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Skeleton variant="web3" className="h-4 w-20" />
                        <Skeleton variant="web3" className="h-4 w-16" />
                      </div>
                      <Skeleton variant="web3" className="h-3 w-32" />
                    </div>
                  </div>
                  <div className="text-right">
                    <Skeleton variant="web3" className="h-4 w-16 mb-1" />
                    <Skeleton variant="web3" className="h-3 w-12" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (hasError) {
    return (
      <div className={cn(tokenListVariants({variant, layout}), className)} {...props}>
        <div className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Failed to Load Tokens</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {discoveryError?.message ?? filteringError?.message ?? 'An unexpected error occurred'}
          </p>
          <Button onClick={refetchTokens} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading === false && categorizedTokens.length === 0) {
    return (
      <div className={cn(tokenListVariants({variant, layout}), className)} {...props}>
        <div className="p-8 text-center">
          <Trash2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No Tokens Found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {searchQuery.length > 0
              ? `No tokens match "${searchQuery}". Try adjusting your search or filters.`
              : "Connect your wallet and we'll discover your tokens automatically."}
          </p>
          {searchQuery.length > 0 && (
            <Button onClick={() => setSearchQuery('')} variant="outline">
              Clear Search
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={cn(tokenListVariants({variant, layout}), className)} {...props}>
      <div className="p-4 border-b border-gray-200/60 dark:border-gray-700/40">
        <div className="flex flex-col gap-4">
          {(config.enableSearch || config.enableFiltering) && (
            <div className="flex items-center gap-3">
              {config.enableSearch && (
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search tokens..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="pl-9"
                  />
                </div>
              )}
              {config.enableFiltering && (
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4" />
                  Filter
                </Button>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {searchQuery && `"${searchQuery}" • `}
              {totalTokens.toLocaleString()} tokens
              {config.enablePagination && totalPages > 1 && (
                <span>
                  {' '}
                  • Page {currentPage} of {totalPages}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {config.enableBatchSelection && totalTokens > 0 && (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                    Select All
                  </Button>
                  {internalSelectedTokens.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={handleDeselectAll}>
                      Deselect All ({internalSelectedTokens.length})
                    </Button>
                  )}
                </div>
              )}

              {config.enableSorting && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSortChange('balance')}
                    className={cn(sortConfig.field === 'balance' && 'bg-violet-50 dark:bg-violet-900/30')}
                  >
                    Balance
                    {sortConfig.field === 'balance' &&
                      (sortConfig.direction === 'asc' ? (
                        <SortAsc className="h-3 w-3 ml-1" />
                      ) : (
                        <SortDesc className="h-3 w-3 ml-1" />
                      ))}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSortChange('value')}
                    className={cn(sortConfig.field === 'value' && 'bg-violet-50 dark:bg-violet-900/30')}
                  >
                    Value
                    {sortConfig.field === 'value' &&
                      (sortConfig.direction === 'asc' ? (
                        <SortAsc className="h-3 w-3 ml-1" />
                      ) : (
                        <SortDesc className="h-3 w-3 ml-1" />
                      ))}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1">
        {config.enableVirtualScrolling ? (
          <div
            ref={parentRef}
            className="h-[600px] overflow-auto p-4"
            style={{
              contain: 'strict',
            }}
          >
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {virtualizer.getVirtualItems().map(virtualItem => (
                <div
                  key={virtualItem.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <div className="px-2 pb-2">
                    <TokenListItem
                      token={paginatedTokens[virtualItem.index]}
                      selected={internalSelectedTokens.includes(paginatedTokens[virtualItem.index].address)}
                      onClick={onTokenClick}
                      onToggleSelection={config.enableBatchSelection ? handleTokenSelection : undefined}
                      onViewDetails={onViewTokenDetails}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
            {paginatedTokens.map(token => (
              <TokenListItem
                key={`${token.chainId}-${token.address}`}
                token={token}
                selected={internalSelectedTokens.includes(token.address)}
                onClick={onTokenClick}
                onToggleSelection={config.enableBatchSelection ? handleTokenSelection : undefined}
                onViewDetails={onViewTokenDetails}
              />
            ))}
          </div>
        )}
      </div>

      {config.enablePagination && totalPages > 1 && (
        <div className="p-4 border-t border-gray-200/60 dark:border-gray-700/40">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {startIndex + 1}-{endIndex} of {totalTokens} tokens
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              <span className="text-sm text-gray-600 dark:text-gray-400 px-3">
                {currentPage} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
