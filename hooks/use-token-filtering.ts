'use client'

import type {DiscoveredToken} from '../lib/web3/token-discovery'
import {useQuery, useQueryClient} from '@tanstack/react-query'

import {useCallback} from 'react'
import {
  calculateTokenStats,
  categorizeToken,
  DEFAULT_CATEGORIZATION_PREFERENCES,
  DEFAULT_FILTERING_CONFIG,
  filterTokens,
  sortTokens,
  TokenCategory,
  TokenValueClass,
  type CategorizedToken,
  type TokenCategorizationPreferences,
  type TokenFilter,
  type TokenFilteringConfig,
  type TokenFilteringResult,
  type TokenSortOptions,
} from '../lib/web3/token-filtering'
import {useWallet, type SupportedChainId} from './use-wallet'

/**
 * Hook configuration options for token filtering
 */
export interface UseTokenFilteringOptions extends Partial<TokenFilteringConfig> {
  /** Enable the query (default: true) */
  enabled?: boolean
  /** Refetch interval in milliseconds (default: 30 seconds) */
  refetchInterval?: number
  /** Stale time in milliseconds (default: 5 minutes) */
  staleTime?: number
  /** Garbage collection time in milliseconds (default: 10 minutes) */
  gcTime?: number
}

/**
 * Token categorization preferences hook options
 */
export interface UseTokenCategorizationPreferencesOptions {
  /** Storage key for localStorage (default: 'tokentoilet:categorization-preferences') */
  storageKey?: string
  /** Enable auto-save to localStorage (default: true) */
  autoSave?: boolean
}

/**
 * Return type for token filtering hook
 */
export interface UseTokenFilteringReturn {
  /** Filtered and categorized tokens */
  tokens: CategorizedToken[]
  /** Loading state */
  isLoading: boolean
  /** Error state */
  error: Error | null
  /** Is currently fetching */
  isFetching: boolean
  /** Has data been fetched at least once */
  isSuccess: boolean
  /** Filtering and categorization statistics */
  stats: ReturnType<typeof calculateTokenStats>
  /** Total tokens before filtering */
  totalTokens: number
  /** Number of tokens after filtering */
  filteredTokens: number
  /** Processing errors */
  errors: TokenFilteringResult['errors']
  /** Refetch function */
  refetch: () => void
  /** Force refresh (bypasses cache) */
  refresh: () => void
}

/**
 * Return type for token categorization preferences hook
 */
export interface UseTokenCategorizationPreferencesReturn {
  /** Current preferences */
  preferences: TokenCategorizationPreferences
  /** Update preferences */
  updatePreferences: (updates: Partial<TokenCategorizationPreferences>) => void
  /** Reset to defaults */
  resetPreferences: () => void
  /** Save to localStorage */
  savePreferences: () => void
  /** Load from localStorage */
  loadPreferences: () => void
  /** Check if preferences are loading */
  isLoading: boolean
  /** Error state */
  error: Error | null
}

/**
 * Default options for token filtering hook
 */
const DEFAULT_HOOK_OPTIONS: Required<Omit<UseTokenFilteringOptions, keyof TokenFilteringConfig>> = {
  enabled: true,
  refetchInterval: 30 * 1000, // 30 seconds
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 10 * 60 * 1000, // 10 minutes
}

/**
 * Storage key for categorization preferences
 */
const DEFAULT_STORAGE_KEY = 'tokentoilet:categorization-preferences'

/**
 * Hook for managing token categorization preferences with localStorage persistence
 *
 * Features:
 * - Local storage persistence
 * - Automatic saving on changes
 * - Default preference management
 * - Error handling for storage operations
 *
 * @param options Configuration options
 * @returns Token categorization preferences state and controls
 */
export function useTokenCategorizationPreferences(
  options: UseTokenCategorizationPreferencesOptions = {},
): UseTokenCategorizationPreferencesReturn {
  const {storageKey = DEFAULT_STORAGE_KEY, autoSave = true} = options

  const {
    data: preferences = DEFAULT_CATEGORIZATION_PREFERENCES,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['token-categorization-preferences', storageKey],
    queryFn: async (): Promise<TokenCategorizationPreferences> => {
      try {
        const stored = localStorage.getItem(storageKey)
        if (stored !== null && stored.trim() !== '') {
          const parsed = JSON.parse(stored) as Partial<TokenCategorizationPreferences>

          // Convert Sets back from arrays (localStorage JSON serialization issue)
          const restoredPreferences: TokenCategorizationPreferences = {
            ...DEFAULT_CATEGORIZATION_PREFERENCES,
            ...parsed,
            favoriteTokens: new Set(
              parsed.favoriteTokens ? Array.from(parsed.favoriteTokens as unknown as string[]) : [],
            ),
            hiddenTokens: new Set(parsed.hiddenTokens ? Array.from(parsed.hiddenTokens as unknown as string[]) : []),
          }

          return restoredPreferences
        }
        return DEFAULT_CATEGORIZATION_PREFERENCES
      } catch (error) {
        console.error('Failed to load token categorization preferences:', error)
        return DEFAULT_CATEGORIZATION_PREFERENCES
      }
    },
    staleTime: Number.POSITIVE_INFINITY, // Preferences don't go stale
    gcTime: Number.POSITIVE_INFINITY, // Keep in cache indefinitely
  })

  const queryClient = useQueryClient()

  const saveToStorage = useCallback(
    (preferencesToSave: TokenCategorizationPreferences) => {
      try {
        // Convert Sets to arrays for JSON serialization
        const serializable = {
          ...preferencesToSave,
          favoriteTokens: Array.from(preferencesToSave.favoriteTokens),
          hiddenTokens: Array.from(preferencesToSave.hiddenTokens),
        }
        localStorage.setItem(storageKey, JSON.stringify(serializable))
      } catch (error) {
        console.error('Failed to save token categorization preferences:', error)
        throw new Error('Failed to save preferences to local storage')
      }
    },
    [storageKey],
  )

  const updatePreferences = useCallback(
    (updates: Partial<TokenCategorizationPreferences>) => {
      if (preferences === null || typeof preferences !== 'object') return

      const updatedPreferences = {...preferences, ...updates}

      // Update query cache
      queryClient.setQueryData(['token-categorization-preferences', storageKey], updatedPreferences)

      // Auto-save if enabled
      if (autoSave) {
        saveToStorage(updatedPreferences)
      }
    },
    [preferences, queryClient, storageKey, autoSave, saveToStorage],
  )

  const resetPreferences = useCallback(() => {
    queryClient.setQueryData(['token-categorization-preferences', storageKey], DEFAULT_CATEGORIZATION_PREFERENCES)

    if (autoSave) {
      saveToStorage(DEFAULT_CATEGORIZATION_PREFERENCES)
    }
  }, [queryClient, storageKey, autoSave, saveToStorage])

  const savePreferences = useCallback(() => {
    saveToStorage(preferences)
  }, [preferences, saveToStorage])

  const loadPreferences = useCallback(() => {
    refetch().catch(console.error)
  }, [refetch])

  return {
    preferences,
    updatePreferences,
    resetPreferences,
    savePreferences,
    loadPreferences,
    isLoading,
    error,
  }
}

/**
 * Hook for filtering and categorizing discovered tokens
 *
 * Features:
 * - Combines token discovery, metadata, and balance data
 * - Applies user preferences for categorization
 * - Filters tokens based on criteria
 * - Calculates portfolio statistics
 * - TanStack Query caching and background refresh
 *
 * @param tokens Array of discovered tokens to categorize
 * @param filter Filtering criteria
 * @param sortOptions Sorting options
 * @param options Hook configuration options
 * @returns Filtered and categorized tokens with statistics
 */
export function useTokenFiltering(
  tokens: DiscoveredToken[],
  filter: TokenFilter = {},
  sortOptions: TokenSortOptions | undefined = undefined,
  options: UseTokenFilteringOptions = {},
): UseTokenFilteringReturn {
  const {isConnected} = useWallet()
  const {preferences} = useTokenCategorizationPreferences()

  // Merge options with defaults
  const mergedOptions = {...DEFAULT_HOOK_OPTIONS, ...options}
  const filteringConfig: TokenFilteringConfig = {
    ...DEFAULT_FILTERING_CONFIG,
    ...options,
  }

  // Create query key for caching
  const queryKey = [
    'token-filtering',
    tokens.map(t => t.address),
    filter,
    sortOptions,
    hashPreferences(preferences),
  ] as const

  const {
    data: result,
    isLoading,
    error,
    isFetching,
    isSuccess,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async (): Promise<TokenFilteringResult> => {
      if (tokens.length === 0) {
        return {
          tokens: [],
          totalTokens: 0,
          filteredTokens: 0,
          categoryStats: {
            [TokenCategory.VALUABLE]: 0,
            [TokenCategory.UNWANTED]: 0,
            [TokenCategory.UNKNOWN]: 0,
            [TokenCategory.DUST]: 0,
            [TokenCategory.SPAM]: 0,
          },
          valueStats: {
            [TokenValueClass.HIGH_VALUE]: 0,
            [TokenValueClass.MEDIUM_VALUE]: 0,
            [TokenValueClass.LOW_VALUE]: 0,
            [TokenValueClass.MICRO_VALUE]: 0,
            [TokenValueClass.DUST]: 0,
            [TokenValueClass.UNKNOWN]: 0,
          },
          totalValueUSD: 0,
          errors: [],
        }
      }

      // Categorize tokens
      const categorizedTokens = tokens.map(token => categorizeToken(token, undefined, preferences, filteringConfig))

      // Apply filters
      const filteredTokens = filterTokens(categorizedTokens, filter)

      // Sort tokens
      const sortedTokens = sortOptions ? sortTokens(filteredTokens, sortOptions) : filteredTokens

      // Calculate statistics
      const stats = calculateTokenStats(categorizedTokens)

      return {
        tokens: sortedTokens,
        filteredTokens: sortedTokens.length,
        ...stats,
        errors: [],
      }
    },
    enabled: Boolean(mergedOptions.enabled) && isConnected,
    refetchInterval: mergedOptions.refetchInterval,
    staleTime: mergedOptions.staleTime,
    gcTime: mergedOptions.gcTime,
  })

  const refresh = useCallback(() => {
    refetch().catch(console.error)
  }, [refetch])

  return {
    tokens: result?.tokens ?? [],
    stats: calculateTokenStats([]),
    errors: result?.errors ?? [],
    totalTokens: tokens.length,
    filteredTokens: result?.tokens.length ?? 0,
    isLoading,
    error,
    isFetching,
    isSuccess,
    refetch: () => {
      refetch().catch(console.error)
    },
    refresh,
  }
}

/**
 * Hook for getting filtered tokens by category
 *
 * @param discoveredTokens Array of discovered tokens
 * @param categories Categories to filter by
 * @param options Hook configuration options
 * @returns Tokens filtered by category
 */
export function useTokensByCategory(
  discoveredTokens: Parameters<typeof useTokenFiltering>[0],
  categories: TokenCategory | TokenCategory[],
  options: UseTokenFilteringOptions = {},
): Omit<UseTokenFilteringReturn, 'stats'> {
  const categoriesArray = Array.isArray(categories) ? categories : [categories]
  const filter: TokenFilter = {categories: categoriesArray}
  const {stats, ...result} = useTokenFiltering(discoveredTokens, filter, undefined, options)
  return result
}

/**
 * Hook for getting valuable tokens (user's portfolio)
 *
 * @param discoveredTokens Array of discovered tokens
 * @param options Hook configuration options
 * @returns Valuable tokens for portfolio view
 */
export function useValuableTokens(
  discoveredTokens: Parameters<typeof useTokenFiltering>[0],
  options: UseTokenFilteringOptions = {},
): Omit<UseTokenFilteringReturn, 'stats'> {
  return useTokensByCategory(discoveredTokens, [TokenCategory.VALUABLE], options)
}

/**
 * Hook for getting unwanted tokens (candidates for disposal)
 *
 * @param discoveredTokens Array of discovered tokens
 * @param options Hook configuration options
 * @returns Unwanted tokens for disposal workflow
 */
export function useUnwantedTokens(
  discoveredTokens: Parameters<typeof useTokenFiltering>[0],
  options: UseTokenFilteringOptions = {},
): Omit<UseTokenFilteringReturn, 'stats'> {
  return useTokensByCategory(
    discoveredTokens,
    [TokenCategory.UNWANTED, TokenCategory.DUST, TokenCategory.SPAM],
    options,
  )
}

/**
 * Hook for getting tokens that need manual categorization
 *
 * @param discoveredTokens Array of discovered tokens
 * @param options Hook configuration options
 * @returns Tokens that need user review
 */
export function useUncategorizedTokens(
  discoveredTokens: Parameters<typeof useTokenFiltering>[0],
  options: UseTokenFilteringOptions = {},
): Omit<UseTokenFilteringReturn, 'stats'> {
  return useTokensByCategory(discoveredTokens, [TokenCategory.UNKNOWN], options)
}

/**
 * Hook for token search functionality
 *
 * @param discoveredTokens Array of discovered tokens
 * @param searchQuery Search query string
 * @param options Hook configuration options
 * @returns Search results
 */
export function useTokenSearch(
  discoveredTokens: Parameters<typeof useTokenFiltering>[0],
  searchQuery: string,
  options: UseTokenFilteringOptions = {},
): Omit<UseTokenFilteringReturn, 'stats'> {
  const filter: TokenFilter = {searchQuery}
  const {stats, ...result} = useTokenFiltering(discoveredTokens, filter, undefined, options)
  return result
}

/**
 * Helper function to create a hash of preferences for cache invalidation
 */
function hashPreferences(preferences: TokenCategorizationPreferences): string {
  // Create a simple hash of the preferences for cache invalidation
  const hashData = {
    autoCategorizationEnabled: preferences.autoCategorizationEnabled,
    valueThresholds: preferences.valueThresholds,
    spamDetection: preferences.spamDetection,
    riskTolerance: preferences.riskTolerance,
    manualCategorizations: Object.keys(preferences.manualCategorizations).length,
    favoriteTokens: preferences.favoriteTokens.size,
    hiddenTokens: preferences.hiddenTokens.size,
  }

  return JSON.stringify(hashData)
}

/**
 * Utility hook for managing token favorites
 *
 * @returns Functions for managing favorite tokens
 */
export function useTokenFavorites() {
  const {preferences, updatePreferences} = useTokenCategorizationPreferences()

  const addFavorite = useCallback(
    (tokenAddress: string, chainId: SupportedChainId) => {
      const tokenId = `${chainId}:${tokenAddress.toLowerCase()}`
      const newFavorites = new Set(preferences.favoriteTokens)
      newFavorites.add(tokenId)
      updatePreferences({favoriteTokens: newFavorites})
    },
    [preferences.favoriteTokens, updatePreferences],
  )

  const removeFavorite = useCallback(
    (tokenAddress: string, chainId: SupportedChainId) => {
      const tokenId = `${chainId}:${tokenAddress.toLowerCase()}`
      const newFavorites = new Set(preferences.favoriteTokens)
      newFavorites.delete(tokenId)
      updatePreferences({favoriteTokens: newFavorites})
    },
    [preferences.favoriteTokens, updatePreferences],
  )

  const isFavorite = useCallback(
    (tokenAddress: string, chainId: SupportedChainId) => {
      const tokenId = `${chainId}:${tokenAddress.toLowerCase()}`
      return preferences.favoriteTokens.has(tokenId)
    },
    [preferences.favoriteTokens],
  )

  const toggleFavorite = useCallback(
    (tokenAddress: string, chainId: SupportedChainId) => {
      if (isFavorite(tokenAddress, chainId)) {
        removeFavorite(tokenAddress, chainId)
      } else {
        addFavorite(tokenAddress, chainId)
      }
    },
    [isFavorite, removeFavorite, addFavorite],
  )

  return {
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite,
    favorites: preferences.favoriteTokens,
  }
}

/**
 * Utility hook for managing hidden tokens
 *
 * @returns Functions for managing hidden tokens
 */
export function useTokenHiding() {
  const {preferences, updatePreferences} = useTokenCategorizationPreferences()

  const hideToken = useCallback(
    (tokenAddress: string, chainId: SupportedChainId) => {
      const tokenId = `${chainId}:${tokenAddress.toLowerCase()}`
      const newHidden = new Set(preferences.hiddenTokens)
      newHidden.add(tokenId)
      updatePreferences({hiddenTokens: newHidden})
    },
    [preferences.hiddenTokens, updatePreferences],
  )

  const unhideToken = useCallback(
    (tokenAddress: string, chainId: SupportedChainId) => {
      const tokenId = `${chainId}:${tokenAddress.toLowerCase()}`
      const newHidden = new Set(preferences.hiddenTokens)
      newHidden.delete(tokenId)
      updatePreferences({hiddenTokens: newHidden})
    },
    [preferences.hiddenTokens, updatePreferences],
  )

  const isHidden = useCallback(
    (tokenAddress: string, chainId: SupportedChainId) => {
      const tokenId = `${chainId}:${tokenAddress.toLowerCase()}`
      return preferences.hiddenTokens.has(tokenId)
    },
    [preferences.hiddenTokens],
  )

  const toggleHidden = useCallback(
    (tokenAddress: string, chainId: SupportedChainId) => {
      if (isHidden(tokenAddress, chainId)) {
        unhideToken(tokenAddress, chainId)
      } else {
        hideToken(tokenAddress, chainId)
      }
    },
    [isHidden, unhideToken, hideToken],
  )

  return {
    hideToken,
    unhideToken,
    isHidden,
    toggleHidden,
    hiddenTokens: preferences.hiddenTokens,
  }
}
