'use client'

import {useQuery} from '@tanstack/react-query'
import {useConfig} from 'wagmi'

import {
  DEFAULT_TOKEN_DISCOVERY_CONFIG,
  discoverUserTokens,
  type DiscoveredToken,
  type TokenDiscoveryConfig,
  type TokenDiscoveryResult,
} from '../lib/web3/token-discovery'
import {useWallet, type SupportedChainId} from './use-wallet'

/**
 * Hook configuration options for token discovery
 */
export interface UseTokenDiscoveryOptions extends Partial<TokenDiscoveryConfig> {
  /** Enable the query (default: true) */
  enabled?: boolean
  /** Refetch interval in milliseconds (default: 30 seconds) */
  refetchInterval?: number
  /** Stale time in milliseconds (default: 5 minutes) */
  staleTime?: number
  /** Cache time in milliseconds (default: 10 minutes) */
  cacheTime?: number
}

/**
 * Return type for useTokenDiscovery hook
 */
export interface UseTokenDiscoveryReturn {
  /** Discovered tokens across all chains */
  tokens: DiscoveredToken[]
  /** Loading state */
  isLoading: boolean
  /** Error state */
  error: Error | null
  /** Is currently fetching */
  isFetching: boolean
  /** Has data been fetched at least once */
  isSuccess: boolean
  /** Discovery errors that occurred */
  discoveryErrors: TokenDiscoveryResult['errors']
  /** Number of chains that were scanned */
  chainsScanned: number
  /** Number of contracts that were checked */
  contractsChecked: number
  /** Refetch function */
  refetch: () => void
  /** Force refresh (bypasses cache) */
  refresh: () => void
}

/**
 * Default options for token discovery hook
 */
const DEFAULT_HOOK_OPTIONS: Required<Omit<UseTokenDiscoveryOptions, keyof TokenDiscoveryConfig>> = {
  enabled: true,
  refetchInterval: 30_000, // 30 seconds
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
}

/**
 * Hook for discovering tokens across multiple chains for the connected wallet
 *
 * Features:
 * - Automatic token discovery across all supported chains
 * - Real-time balance fetching with caching
 * - Intelligent batching for performance
 * - Error handling and recovery
 * - Integration with existing useWallet patterns
 *
 * @param options Configuration options for token discovery
 * @returns Token discovery state and utilities
 */
export function useTokenDiscovery(options: UseTokenDiscoveryOptions = {}): UseTokenDiscoveryReturn {
  const config = useConfig()
  const {address, isConnected, getSupportedChains} = useWallet()

  // Merge options with defaults
  const mergedOptions = {...DEFAULT_HOOK_OPTIONS, ...options}
  const discoveryConfig: TokenDiscoveryConfig = {
    ...DEFAULT_TOKEN_DISCOVERY_CONFIG,
    chainIds: getSupportedChains().map(chain => chain.id),
    ...options,
  }

  // Create query key based on address and configuration
  const queryKey = [
    'tokenDiscovery',
    address,
    discoveryConfig.chainIds,
    discoveryConfig.maxTokensPerChain,
    discoveryConfig.minBalanceThreshold?.toString(),
    discoveryConfig.enableBatching,
    discoveryConfig.batchSize,
  ] as const

  // Token discovery query
  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<TokenDiscoveryResult> => {
      if (address === undefined) {
        throw new Error('Wallet not connected')
      }

      return discoverUserTokens(config, address, discoveryConfig)
    },
    enabled: mergedOptions.enabled && isConnected && Boolean(address),
    refetchInterval: mergedOptions.refetchInterval,
    staleTime: mergedOptions.staleTime,
    gcTime: mergedOptions.cacheTime,
    retry: (failureCount, error) => {
      // Don't retry if wallet is not connected
      if (error.message.includes('not connected')) {
        return false
      }
      // Retry up to 3 times for other errors
      return failureCount < 3
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  return {
    tokens: query.data?.tokens ?? [],
    isLoading: query.isLoading,
    error: query.error,
    isFetching: query.isFetching,
    isSuccess: query.isSuccess,
    discoveryErrors: query.data?.errors ?? [],
    chainsScanned: query.data?.chainsScanned ?? 0,
    contractsChecked: query.data?.contractsChecked ?? 0,
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
 * Hook for discovering tokens on a specific chain
 *
 * @param chainId Chain to discover tokens on
 * @param options Configuration options
 * @returns Token discovery state for the specific chain
 */
export function useChainTokenDiscovery(
  chainId: SupportedChainId,
  options: Omit<UseTokenDiscoveryOptions, 'chainIds'> = {},
): UseTokenDiscoveryReturn {
  return useTokenDiscovery({
    ...options,
    chainIds: [chainId],
  })
}

/**
 * Hook for checking if a specific token exists in the user's wallet
 *
 * @param tokenAddress Token contract address
 * @param chainId Chain ID where the token exists
 * @returns Token data if found, null otherwise
 */
export function useTokenExists(
  tokenAddress: string,
  chainId: SupportedChainId,
): {
  token: DiscoveredToken | null
  isLoading: boolean
  error: Error | null
} {
  const {tokens, isLoading, error} = useTokenDiscovery({
    chainIds: [chainId],
    minBalanceThreshold: BigInt(0), // Include tokens with zero balance
  })

  const token =
    tokens.find(t => t.address.toLowerCase() === tokenAddress.toLowerCase() && t.chainId === chainId) ?? null

  return {
    token,
    isLoading,
    error,
  }
}

/**
 * Hook for getting tokens with non-zero balances only
 *
 * @param options Configuration options
 * @returns Token discovery state filtered for non-zero balances
 */
export function useNonZeroTokens(options: UseTokenDiscoveryOptions = {}): UseTokenDiscoveryReturn {
  return useTokenDiscovery({
    ...options,
    minBalanceThreshold: BigInt(1), // Only include tokens with positive balance
  })
}

/**
 * Hook for getting tokens sorted by balance (highest first)
 *
 * @param options Configuration options
 * @returns Token discovery state with tokens sorted by balance
 */
export function useTokensByBalance(options: UseTokenDiscoveryOptions = {}): UseTokenDiscoveryReturn {
  const result = useTokenDiscovery(options)

  // Sort tokens by balance (highest first)
  const sortedTokens = [...result.tokens].sort((a, b) => {
    if (a.balance > b.balance) return -1
    if (a.balance < b.balance) return 1
    return 0
  })

  return {
    ...result,
    tokens: sortedTokens,
  }
}

/**
 * Hook for getting tokens grouped by chain
 *
 * @param options Configuration options
 * @returns Tokens grouped by chain ID
 */
export function useTokensByChain(options: UseTokenDiscoveryOptions = {}): {
  tokensByChain: Record<number, DiscoveredToken[]>
  isLoading: boolean
  error: Error | null
  totalTokens: number
} {
  const {tokens, isLoading, error} = useTokenDiscovery(options)

  // Group tokens by chain ID
  const tokensByChain = tokens.reduce(
    (acc, token) => {
      if (acc[token.chainId] === undefined) {
        acc[token.chainId] = []
      }
      acc[token.chainId].push(token)
      return acc
    },
    {} as Record<number, DiscoveredToken[]>,
  )

  return {
    tokensByChain,
    isLoading,
    error,
    totalTokens: tokens.length,
  }
}
