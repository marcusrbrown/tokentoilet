'use client'

import type {Address} from 'viem'
import type {SupportedChainId} from './use-wallet'
import {useQueries, useQuery} from '@tanstack/react-query'
import {useConfig} from 'wagmi'

import {
  DEFAULT_METADATA_CONFIG,
  fetchBatchTokenMetadata,
  fetchEnhancedTokenMetadata,
  filterTokensByMetadataQuality,
  validateTokenMetadata,
  type EnhancedTokenMetadata,
  type MetadataFetchResult,
  type TokenMetadataConfig,
  type TokenRiskScore,
} from '../lib/web3/token-metadata'

/**
 * Hook configuration options for token metadata
 */
export interface UseTokenMetadataOptions extends Partial<TokenMetadataConfig> {
  /** Enable the query (default: true) */
  enabled?: boolean
  /** Refetch interval in milliseconds (default: 5 minutes) */
  refetchInterval?: number
  /** Stale time in milliseconds (default: 10 minutes) */
  staleTime?: number
  /** Cache time in milliseconds (default: 30 minutes) */
  cacheTime?: number
}

/**
 * Return type for useTokenMetadata hook
 */
export interface UseTokenMetadataReturn {
  /** Enhanced token metadata */
  metadata: EnhancedTokenMetadata | null
  /** Loading state */
  isLoading: boolean
  /** Error state */
  error: Error | null
  /** Is currently fetching */
  isFetching: boolean
  /** Has data been fetched at least once */
  isSuccess: boolean
  /** Metadata fetch errors */
  fetchErrors: MetadataFetchResult['errors']
  /** Metadata validation results */
  validation: ReturnType<typeof validateTokenMetadata> | null
  /** Cache hit indicator */
  cacheHit: boolean
  /** Number of successful metadata sources */
  successfulSources: number
  /** Total number of attempted sources */
  totalSources: number
  /** Refetch function */
  refetch: () => void
  /** Force refresh (bypasses cache) */
  refresh: () => void
}

/**
 * Return type for batch metadata hook
 */
export interface UseBatchTokenMetadataReturn {
  /** Array of metadata results */
  metadataResults: MetadataFetchResult[]
  /** Loading state */
  isLoading: boolean
  /** Error state */
  error: Error | null
  /** Is currently fetching */
  isFetching: boolean
  /** Has data been fetched at least once */
  isSuccess: boolean
  /** Total tokens processed */
  totalTokens: number
  /** Successfully processed tokens */
  successfulTokens: number
  /** Failed tokens */
  failedTokens: number
  /** Refetch function */
  refetch: () => void
}

/**
 * Default options for token metadata hook
 */
const DEFAULT_HOOK_OPTIONS: Required<Omit<UseTokenMetadataOptions, keyof TokenMetadataConfig>> = {
  enabled: true,
  refetchInterval: 5 * 60 * 1000, // 5 minutes
  staleTime: 10 * 60 * 1000, // 10 minutes
  cacheTime: 30 * 60 * 1000, // 30 minutes
}

/**
 * Hook for fetching enhanced metadata for a single token
 *
 * Features:
 * - Multi-source metadata fetching with fallback strategies
 * - Intelligent caching with TanStack Query
 * - Automatic validation and quality assessment
 * - Integration with existing Web3 infrastructure
 *
 * @param tokenAddress Token contract address
 * @param chainId Chain ID where the token exists
 * @param options Configuration options
 * @returns Enhanced token metadata state
 */
export function useTokenMetadata(
  tokenAddress: Address | undefined,
  chainId: SupportedChainId | undefined,
  options: UseTokenMetadataOptions = {},
): UseTokenMetadataReturn {
  const config = useConfig()

  // Merge options with defaults
  const mergedOptions = {...DEFAULT_HOOK_OPTIONS, ...options}
  const metadataConfig: TokenMetadataConfig = {
    ...DEFAULT_METADATA_CONFIG,
    ...options,
  }

  // Create query key based on token and configuration
  const queryKey = [
    'tokenMetadata',
    tokenAddress,
    chainId,
    metadataConfig.enableOnChain,
    metadataConfig.enableTokenLists,
    metadataConfig.enableExternalAPIs,
    metadataConfig.includeMarketData,
    metadataConfig.includeRiskAssessment,
    metadataConfig.timeout,
  ] as const

  // Enhanced metadata query
  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<MetadataFetchResult> => {
      if (tokenAddress === undefined || chainId === undefined) {
        throw new Error('Token address and chain ID are required')
      }

      return fetchEnhancedTokenMetadata(config, tokenAddress, chainId, metadataConfig)
    },
    enabled: mergedOptions.enabled && tokenAddress !== undefined && chainId !== undefined,
    refetchInterval: mergedOptions.refetchInterval,
    staleTime: mergedOptions.staleTime,
    gcTime: mergedOptions.cacheTime,
    retry: (failureCount, error) => {
      // Don't retry if token address is invalid
      if (error.message.includes('invalid') || error.message.includes('required')) {
        return false
      }
      // Retry up to 2 times for network errors
      return failureCount < 2
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10_000), // Exponential backoff up to 10s
  })

  // Calculate validation results
  const validation = query.data?.metadata ? validateTokenMetadata(query.data.metadata) : null

  return {
    metadata: query.data?.metadata ?? null,
    isLoading: query.isLoading,
    error: query.error,
    isFetching: query.isFetching,
    isSuccess: query.isSuccess,
    fetchErrors: query.data?.errors ?? [],
    validation,
    cacheHit: query.data?.cacheHit ?? false,
    successfulSources: query.data?.successfulSources ?? 0,
    totalSources: query.data?.totalSources ?? 0,
    refetch: () => {
      query.refetch().catch(() => {
        // Ignore refetch errors - they will be handled by the query state
      })
    },
    refresh: () => {
      query.refetch({cancelRefetch: true}).catch(() => {
        // Ignore refetch errors - they will be handled by the query state
      })
    },
  }
}

/**
 * Hook for fetching metadata for multiple tokens in batch
 *
 * @param tokens Array of token addresses and chain IDs
 * @param options Configuration options
 * @returns Batch metadata fetch results
 */
export function useBatchTokenMetadata(
  tokens: {address: Address; chainId: SupportedChainId}[],
  options: UseTokenMetadataOptions = {},
): UseBatchTokenMetadataReturn {
  const config = useConfig()

  // Merge options with defaults
  const mergedOptions = {...DEFAULT_HOOK_OPTIONS, ...options}
  const metadataConfig: TokenMetadataConfig = {
    ...DEFAULT_METADATA_CONFIG,
    ...options,
  }

  // Create query key based on tokens and configuration
  const queryKey = [
    'batchTokenMetadata',
    tokens.map(t => `${t.chainId}:${t.address}`).sort(),
    metadataConfig.enableOnChain,
    metadataConfig.enableTokenLists,
    metadataConfig.enableExternalAPIs,
    metadataConfig.includeMarketData,
    metadataConfig.includeRiskAssessment,
  ] as const

  // Batch metadata query
  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<MetadataFetchResult[]> => {
      if (tokens.length === 0) {
        return []
      }

      return fetchBatchTokenMetadata(config, tokens, metadataConfig)
    },
    enabled: mergedOptions.enabled && tokens.length > 0,
    refetchInterval: mergedOptions.refetchInterval,
    staleTime: mergedOptions.staleTime,
    gcTime: mergedOptions.cacheTime,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10_000),
  })

  // Calculate statistics
  const metadataResults = query.data ?? []
  const successfulTokens = metadataResults.filter(result => result.metadata !== null).length
  const failedTokens = metadataResults.length - successfulTokens

  return {
    metadataResults,
    isLoading: query.isLoading,
    error: query.error,
    isFetching: query.isFetching,
    isSuccess: query.isSuccess,
    totalTokens: tokens.length,
    successfulTokens,
    failedTokens,
    refetch: () => {
      query.refetch().catch(() => {
        // Ignore refetch errors - they will be handled by the query state
      })
    },
  }
}

/**
 * Hook for fetching metadata for multiple individual tokens using parallel queries
 *
 * This approach provides more granular control and loading states for each token
 * compared to the batch approach.
 *
 * @param tokens Array of token addresses and chain IDs
 * @param options Configuration options
 * @returns Array of individual metadata results
 */
export function useMultipleTokenMetadata(
  tokens: {address: Address; chainId: SupportedChainId}[],
  options: UseTokenMetadataOptions = {},
): UseTokenMetadataReturn[] {
  const config = useConfig()

  // Merge options with defaults
  const mergedOptions = {...DEFAULT_HOOK_OPTIONS, ...options}
  const metadataConfig: TokenMetadataConfig = {
    ...DEFAULT_METADATA_CONFIG,
    ...options,
  }

  // Create parallel queries for each token
  const queries = useQueries({
    queries: tokens.map(token => ({
      queryKey: [
        'tokenMetadata',
        token.address,
        token.chainId,
        metadataConfig.enableOnChain,
        metadataConfig.enableTokenLists,
        metadataConfig.enableExternalAPIs,
        metadataConfig.includeMarketData,
        metadataConfig.includeRiskAssessment,
        metadataConfig.timeout,
      ] as const,
      queryFn: async (): Promise<MetadataFetchResult> => {
        return fetchEnhancedTokenMetadata(config, token.address, token.chainId, metadataConfig)
      },
      enabled: mergedOptions.enabled,
      refetchInterval: mergedOptions.refetchInterval,
      staleTime: mergedOptions.staleTime,
      gcTime: mergedOptions.cacheTime,
      retry: 2,
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 10_000),
    })),
  })

  // Transform query results to match UseTokenMetadataReturn interface
  return queries.map(query => {
    const validation = query.data?.metadata ? validateTokenMetadata(query.data.metadata) : null

    return {
      metadata: query.data?.metadata ?? null,
      isLoading: query.isLoading,
      error: query.error,
      isFetching: query.isFetching,
      isSuccess: query.isSuccess,
      fetchErrors: query.data?.errors ?? [],
      validation,
      cacheHit: query.data?.cacheHit ?? false,
      successfulSources: query.data?.successfulSources ?? 0,
      totalSources: query.data?.totalSources ?? 0,
      refetch: () => {
        query.refetch().catch(() => {
          // Ignore refetch errors - they will be handled by the query state
        })
      },
      refresh: () => {
        query.refetch({cancelRefetch: true}).catch(() => {
          // Ignore refetch errors - they will be handled by the query state
        })
      },
    }
  })
}

/**
 * Utility function for filtering tokens by metadata quality
 *
 * @param tokens Array of enhanced token metadata
 * @param filterOptions Filtering criteria
 * @param filterOptions.minCompleteness Minimum metadata completeness percentage
 * @param filterOptions.maxRiskScore Maximum allowed risk score
 * @param filterOptions.requireVerification Require token to be verified
 * @param filterOptions.requireLogo Require token to have a logo
 * @returns Filtered tokens and statistics
 */
export function filterTokenMetadata(
  tokens: EnhancedTokenMetadata[],
  filterOptions: {
    minCompleteness?: number
    maxRiskScore?: TokenRiskScore
    requireVerification?: boolean
    requireLogo?: boolean
  } = {},
): {
  filteredTokens: EnhancedTokenMetadata[]
  totalTokens: number
  filteredCount: number
  filterStats: {
    lowCompleteness: number
    highRisk: number
    unverified: number
    missingLogo: number
  }
} {
  const filteredTokens = filterTokensByMetadataQuality(tokens, filterOptions)

  // Calculate filter statistics
  const filterStats = {
    lowCompleteness: 0,
    highRisk: 0,
    unverified: 0,
    missingLogo: 0,
  }

  tokens.forEach(token => {
    const validation = validateTokenMetadata(token)

    if (validation.completeness < (filterOptions.minCompleteness ?? 30)) {
      filterStats.lowCompleteness++
    }

    if (token.riskScore === 'high') {
      filterStats.highRisk++
    }

    if (filterOptions.requireVerification && !token.isVerified) {
      filterStats.unverified++
    }

    if (filterOptions.requireLogo && (token.logoURI === undefined || token.logoURI.length === 0)) {
      filterStats.missingLogo++
    }
  })

  return {
    filteredTokens,
    totalTokens: tokens.length,
    filteredCount: filteredTokens.length,
    filterStats,
  }
}

/**
 * Utility function for getting token metadata quality statistics
 *
 * @param tokens Array of enhanced token metadata
 * @returns Quality statistics and insights
 */
export function getTokenMetadataStats(tokens: EnhancedTokenMetadata[]): {
  totalTokens: number
  averageCompleteness: number
  qualityDistribution: {
    excellent: number // 80%+ completeness
    good: number // 60-79% completeness
    fair: number // 40-59% completeness
    poor: number // <40% completeness
  }
  riskDistribution: Record<TokenRiskScore, number>
  verifiedTokens: number
  tokensWithLogos: number
  tokensWithDescriptions: number
} {
  const qualityDistribution = {excellent: 0, good: 0, fair: 0, poor: 0}
  const riskDistribution: Record<TokenRiskScore, number> = {
    verified: 0,
    low: 0,
    medium: 0,
    high: 0,
    unknown: 0,
  }

  let totalCompleteness = 0
  let verifiedTokens = 0
  let tokensWithLogos = 0
  let tokensWithDescriptions = 0

  tokens.forEach(token => {
    const validation = validateTokenMetadata(token)
    totalCompleteness += validation.completeness

    // Quality distribution
    if (validation.completeness >= 80) {
      qualityDistribution.excellent++
    } else if (validation.completeness >= 60) {
      qualityDistribution.good++
    } else if (validation.completeness >= 40) {
      qualityDistribution.fair++
    } else {
      qualityDistribution.poor++
    }

    // Risk distribution
    const riskScore = token.riskScore ?? 'unknown'
    riskDistribution[riskScore]++

    // Feature counts
    if (token.isVerified) verifiedTokens++
    if (token.logoURI !== undefined && token.logoURI.length > 0) tokensWithLogos++
    if (token.description !== undefined && token.description.length > 0) tokensWithDescriptions++
  })

  return {
    totalTokens: tokens.length,
    averageCompleteness: tokens.length > 0 ? Math.round(totalCompleteness / tokens.length) : 0,
    qualityDistribution,
    riskDistribution,
    verifiedTokens,
    tokensWithLogos,
    tokensWithDescriptions,
  }
}
