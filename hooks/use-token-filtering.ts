'use client'

import type {DiscoveredToken} from '../lib/web3/token-discovery'
import {useQuery, useQueryClient} from '@tanstack/react-query'

import {useCallback, useMemo, useState} from 'react'
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
 * Hook for token search functionality with fuzzy matching and advanced sorting
 *
 * @param discoveredTokens Array of discovered tokens
 * @param searchQuery Search query string
 * @param options Advanced search configuration options
 * @returns Enhanced search results with relevance scoring
 */
export function useTokenSearch(
  discoveredTokens: DiscoveredToken[],
  searchQuery: string,
  options: AdvancedSearchOptions = {},
): {
  /** Search results with relevance scoring */
  searchResults: SearchResult[]
  /** Filtered tokens from the search */
  tokens: CategorizedToken[]
  /** Search statistics */
  searchStats: {
    totalResults: number
    hasExactMatches: boolean
    hasFuzzyMatches: boolean
    avgRelevance: number
  }
  /** Loading state */
  isLoading: boolean
  /** Error state */
  error: Error | null
} {
  const {preferences} = useSearchAndSortPreferences()

  // Apply token filtering first to get categorized tokens
  const {
    tokens: categorizedTokens,
    isLoading,
    error,
  } = useTokenFiltering(
    discoveredTokens,
    {}, // No additional filters
    undefined,
    options,
  )

  // Perform advanced search with relevance scoring
  const searchResults = useMemo(() => {
    const searchOptions: AdvancedSearchOptions = {
      ...preferences.defaultSearch,
      ...options,
    }

    return performAdvancedSearch(categorizedTokens, searchQuery, searchOptions)
  }, [categorizedTokens, searchQuery, preferences.defaultSearch, options])

  // Calculate search statistics
  const searchStats = useMemo(() => {
    const totalResults = searchResults.length
    const exactMatches = searchResults.filter((r: SearchResult) => r.relevance >= 0.9).length
    const fuzzyMatches = searchResults.filter((r: SearchResult) => r.relevance < 0.7 && r.relevance > 0.3).length
    const avgRelevance =
      totalResults > 0 ? searchResults.reduce((sum: number, r: SearchResult) => sum + r.relevance, 0) / totalResults : 0

    return {
      totalResults,
      hasExactMatches: exactMatches > 0,
      hasFuzzyMatches: fuzzyMatches > 0,
      avgRelevance,
    }
  }, [searchResults])

  return {
    searchResults,
    tokens: searchResults.map((r: SearchResult) => r.token),
    searchStats,
    isLoading,
    error,
  }
}

// ============================================================================
// ENHANCED SEARCH AND SORTING FUNCTIONALITY - TASK-017 IMPLEMENTATION
// ============================================================================

/**
 * Advanced search options for improved token discovery
 */
export interface AdvancedSearchOptions extends UseTokenFilteringOptions {
  /** Enable fuzzy search matching */
  enableFuzzySearch?: boolean
  /** Minimum similarity score for fuzzy matching (0-1) */
  fuzzyThreshold?: number
  /** Fields to search in */
  searchFields?: ('name' | 'symbol' | 'address' | 'description')[]
  /** Enable debounced search */
  debounceMs?: number
  /** Case sensitive search */
  caseSensitive?: boolean
  /** Include partial word matches */
  includePartialMatches?: boolean
}

/**
 * Advanced sorting options with multiple criteria
 */
export interface AdvancedSortOptions extends TokenSortOptions {
  /** Enable stable sorting */
  stable?: boolean
  /** Multi-level sorting criteria */
  multiSort?: {
    field: TokenSortOptions['field']
    direction: 'asc' | 'desc'
    weight?: number
  }[]
  /** Sort by relevance when search is active */
  relevanceWeight?: number
}

/**
 * Search result with relevance scoring
 */
export interface SearchResult {
  /** The categorized token */
  token: CategorizedToken
  /** Search relevance score (0-1) */
  relevance: number
  /** Fields that matched */
  matchedFields: ('name' | 'symbol' | 'address' | 'description')[]
  /** Match positions for highlighting */
  matches: {
    field: string
    start: number
    end: number
    text: string
  }[]
}

/**
 * Search and sorting preferences with localStorage persistence
 */
export interface SearchPreferences {
  /** Default search options */
  defaultSearch: {
    enableFuzzySearch: boolean
    fuzzyThreshold: number
    searchFields: ('name' | 'symbol' | 'address' | 'description')[]
    caseSensitive: boolean
    includePartialMatches: boolean
  }
  /** Default sorting options */
  defaultSort: AdvancedSortOptions
  /** Search history settings */
  history: {
    enabled: boolean
    maxEntries: number
  }
  /** UI preferences */
  ui: {
    debounceMs: number
    highlightMatches: boolean
    showSearchStats: boolean
  }
}

/**
 * Default search preferences
 */
const DEFAULT_SEARCH_PREFERENCES: SearchPreferences = {
  defaultSearch: {
    enableFuzzySearch: true,
    fuzzyThreshold: 0.6,
    searchFields: ['name', 'symbol', 'address'],
    caseSensitive: false,
    includePartialMatches: true,
  },
  defaultSort: {
    field: 'value',
    direction: 'desc',
    relevanceWeight: 0.3,
  },
  history: {
    enabled: true,
    maxEntries: 20,
  },
  ui: {
    debounceMs: 300,
    highlightMatches: true,
    showSearchStats: true,
  },
}

/**
 * Calculate fuzzy similarity using Levenshtein distance
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1

  if (longer.length === 0) return 1

  const editDistance = levenshteinDistance(longer, shorter)
  return (longer.length - editDistance) / longer.length
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1, // deletion
        )
      }
    }
  }

  return matrix[str2.length][str1.length]
}

/**
 * Perform enhanced search with fuzzy matching and relevance scoring
 */
function performAdvancedSearch(
  tokens: CategorizedToken[],
  query: string,
  options: AdvancedSearchOptions,
): SearchResult[] {
  if (!query.trim()) {
    return tokens.map(token => ({
      token,
      relevance: 0.1,
      matchedFields: [],
      matches: [],
    }))
  }

  const {
    enableFuzzySearch = true,
    fuzzyThreshold = 0.6,
    searchFields = ['name', 'symbol', 'address'],
    caseSensitive = false,
    includePartialMatches = true,
  } = options

  const searchQuery = caseSensitive ? query.trim() : query.trim().toLowerCase()
  const results: SearchResult[] = []

  for (const token of tokens) {
    const matches: SearchResult['matches'] = []
    const matchedFields: SearchResult['matchedFields'] = []
    let maxRelevance = 0

    for (const field of searchFields) {
      let fieldValue = ''

      switch (field) {
        case 'name':
          fieldValue = token.name
          break
        case 'symbol':
          fieldValue = token.symbol
          break
        case 'address':
          fieldValue = token.address
          break
        case 'description':
          fieldValue = token.metadata?.description ?? ''
          break
      }

      if (!fieldValue) continue

      const searchValue = caseSensitive ? fieldValue : fieldValue.toLowerCase()
      let relevance = 0

      // Exact match (highest priority)
      if (searchValue === searchQuery) {
        relevance = 1
        matches.push({
          field,
          start: 0,
          end: fieldValue.length,
          text: fieldValue,
        })
        matchedFields.push(field)
      }
      // Starts with (high priority)
      else if (searchValue.startsWith(searchQuery)) {
        relevance = 0.9
        matches.push({
          field,
          start: 0,
          end: searchQuery.length,
          text: fieldValue.slice(0, Math.max(0, searchQuery.length)),
        })
        matchedFields.push(field)
      }
      // Contains (medium priority)
      else if (includePartialMatches && searchValue.includes(searchQuery)) {
        const matchIndex = searchValue.indexOf(searchQuery)
        relevance = 0.7 - (matchIndex / searchValue.length) * 0.2 // Lower score for matches later in string
        matches.push({
          field,
          start: matchIndex,
          end: matchIndex + searchQuery.length,
          text: fieldValue.slice(matchIndex, matchIndex + searchQuery.length),
        })
        matchedFields.push(field)
      }
      // Fuzzy match (lower priority)
      else if (enableFuzzySearch) {
        const similarity = calculateSimilarity(searchQuery, searchValue)
        if (similarity >= fuzzyThreshold) {
          relevance = similarity * 0.6 // Lower base score for fuzzy matches
          matches.push({
            field,
            start: 0,
            end: fieldValue.length,
            text: fieldValue,
          })
          matchedFields.push(field)
        }
      }

      maxRelevance = Math.max(maxRelevance, relevance)
    }

    if (maxRelevance > 0) {
      results.push({
        token,
        relevance: maxRelevance,
        matchedFields,
        matches,
      })
    }
  }

  // Sort by relevance (highest first)
  return results.sort((a, b) => b.relevance - a.relevance)
}

/**
 * Enhanced multi-criteria sorting
 */
function performAdvancedSort(
  tokens: CategorizedToken[],
  searchResults: SearchResult[],
  sortOptions: AdvancedSortOptions,
): CategorizedToken[] {
  // Create relevance map for search results
  const relevanceMap = new Map<string, number>()
  for (const result of searchResults) {
    const key = `${result.token.chainId}:${result.token.address.toLowerCase()}`
    relevanceMap.set(key, result.relevance)
  }

  return [...tokens].sort((a, b) => {
    // Apply relevance weighting if search is active
    if ((sortOptions.relevanceWeight ?? 0) > 0) {
      const aKey = `${a.chainId}:${a.address.toLowerCase()}`
      const bKey = `${b.chainId}:${b.address.toLowerCase()}`
      const aRelevance = relevanceMap.get(aKey) ?? 0
      const bRelevance = relevanceMap.get(bKey) ?? 0

      if (aRelevance !== bRelevance) {
        const relevanceResult = (bRelevance - aRelevance) * (sortOptions.relevanceWeight ?? 0)
        if (Math.abs(relevanceResult) > 0.1) return relevanceResult
      }
    }

    // Primary sort field
    let result = compareTokenFields(a, b, sortOptions.field, sortOptions.direction)
    if (result !== 0) return result

    // Secondary sort
    if (sortOptions.secondary) {
      result = compareTokenFields(a, b, sortOptions.secondary.field, sortOptions.secondary.direction)
      if (result !== 0) return result
    }

    // Multi-sort criteria
    if (sortOptions.multiSort) {
      for (const criteria of sortOptions.multiSort) {
        const weight = criteria.weight ?? 1
        result = compareTokenFields(a, b, criteria.field, criteria.direction) * weight
        if (result !== 0) return result
      }
    }

    return 0
  })
}

/**
 * Compare tokens by specific field (extracted from existing sortTokens function)
 */
function compareTokenFields(
  a: CategorizedToken,
  b: CategorizedToken,
  field: TokenSortOptions['field'],
  direction: 'asc' | 'desc',
): number {
  const multiplier = direction === 'asc' ? 1 : -1

  switch (field) {
    case 'balance': {
      const aBalance = Number.parseFloat(a.formattedBalance)
      const bBalance = Number.parseFloat(b.formattedBalance)
      return (aBalance - bBalance) * multiplier
    }
    case 'value': {
      const aValue = a.estimatedValueUSD ?? 0
      const bValue = b.estimatedValueUSD ?? 0
      return (aValue - bValue) * multiplier
    }
    case 'name':
      return a.name.localeCompare(b.name) * multiplier
    case 'symbol':
      return a.symbol.localeCompare(b.symbol) * multiplier
    case 'category':
      return a.category.localeCompare(b.category) * multiplier
    case 'riskScore': {
      // Define consistent risk score ordering
      const riskOrder = ['verified', 'low', 'medium', 'high', 'unknown']
      const aIndex = riskOrder.indexOf(a.riskScore)
      const bIndex = riskOrder.indexOf(b.riskScore)
      return (aIndex - bIndex) * multiplier
    }
    case 'lastCategorized': {
      const aTime = a.lastCategorizedAt ?? 0
      const bTime = b.lastCategorizedAt ?? 0
      return (aTime - bTime) * multiplier
    }
    default:
      return 0
  }
}

/**
 * Hook for managing search and sorting preferences with localStorage persistence
 */
export function useSearchAndSortPreferences(): {
  preferences: SearchPreferences
  updatePreferences: (updates: Partial<SearchPreferences>) => void
  resetPreferences: () => void
} {
  const storageKey = 'tokentoilet:search-sort-preferences'

  const {data: preferences = DEFAULT_SEARCH_PREFERENCES} = useQuery({
    queryKey: ['search-sort-preferences'],
    queryFn: (): SearchPreferences => {
      try {
        const stored = localStorage.getItem(storageKey)
        if (stored != null && stored.trim().length > 0) {
          return {...DEFAULT_SEARCH_PREFERENCES, ...(JSON.parse(stored) as Partial<SearchPreferences>)}
        }
      } catch {
        // Ignore errors, use defaults
      }
      return DEFAULT_SEARCH_PREFERENCES
    },
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  })

  const queryClient = useQueryClient()

  const updatePreferences = useCallback(
    (updates: Partial<SearchPreferences>) => {
      const newPreferences = {...preferences, ...updates}
      queryClient.setQueryData(['search-sort-preferences'], newPreferences)

      try {
        localStorage.setItem(storageKey, JSON.stringify(newPreferences))
      } catch {
        // Ignore storage errors
      }
    },
    [preferences, queryClient],
  )

  const resetPreferences = useCallback(() => {
    queryClient.setQueryData(['search-sort-preferences'], DEFAULT_SEARCH_PREFERENCES)

    try {
      localStorage.removeItem(storageKey)
    } catch {
      // Ignore storage errors
    }
  }, [queryClient])

  return {
    preferences,
    updatePreferences,
    resetPreferences,
  }
}

/**
 * Token sorting hook with multi-criteria support
 */
export function useTokenSorting(
  tokens: CategorizedToken[],
  searchResults: SearchResult[] = [],
  sortOptions?: Partial<AdvancedSortOptions>,
): {
  /** Sorted tokens */
  sortedTokens: CategorizedToken[]
  /** Current sort options */
  currentSort: AdvancedSortOptions
  /** Update sort options */
  updateSort: (updates: Partial<AdvancedSortOptions>) => void
} {
  const {preferences, updatePreferences} = useSearchAndSortPreferences()
  const [localSort, setLocalSort] = useState<AdvancedSortOptions>(() => ({
    ...preferences.defaultSort,
    ...sortOptions,
  }))

  // Sort tokens using advanced sorting
  const sortedTokens = useMemo(() => {
    return performAdvancedSort(tokens, searchResults, localSort)
  }, [tokens, searchResults, localSort])

  const updateSort = useCallback(
    (updates: Partial<AdvancedSortOptions>) => {
      const newSort = {...localSort, ...updates}
      setLocalSort(newSort)

      // Optionally update preferences if this should be the new default
      if (updates.field || updates.direction) {
        updatePreferences({
          defaultSort: {
            ...preferences.defaultSort,
            field: updates.field ?? preferences.defaultSort.field,
            direction: updates.direction ?? preferences.defaultSort.direction,
          },
        })
      }
    },
    [localSort, preferences.defaultSort, updatePreferences],
  )

  return {
    sortedTokens,
    currentSort: localSort,
    updateSort,
  }
}

/**
 * Combined search and sort hook for comprehensive token management
 */
export function useTokenSearchAndSort(
  discoveredTokens: DiscoveredToken[],
  searchQuery: string,
  options: AdvancedSearchOptions = {},
  sortOptions?: Partial<AdvancedSortOptions>,
): {
  /** Search results with relevance */
  searchResults: SearchResult[]
  /** Final sorted and filtered tokens */
  tokens: CategorizedToken[]
  /** Search statistics */
  searchStats: ReturnType<typeof useTokenSearch>['searchStats']
  /** Sorting controls */
  sorting: ReturnType<typeof useTokenSorting>
  /** Loading and error states */
  isLoading: boolean
  error: Error | null
} {
  const searchReturn = useTokenSearch(discoveredTokens, searchQuery, options)
  const sortingReturn = useTokenSorting(searchReturn.tokens, searchReturn.searchResults, sortOptions)

  return {
    searchResults: searchReturn.searchResults,
    tokens: sortingReturn.sortedTokens,
    searchStats: searchReturn.searchStats,
    sorting: sortingReturn,
    isLoading: searchReturn.isLoading,
    error: searchReturn.error,
  }
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
