'use client'

import type {Address} from 'viem'
import {useQuery} from '@tanstack/react-query'
import {useConfig} from 'wagmi'

import {
  checkAllBalances,
  checkCrossChainBalances,
  checkNativeBalance,
  checkTokenBalance,
  DEFAULT_BALANCE_CONFIG,
  type BalanceCheckConfig,
  type BalanceCheckResult,
  type NativeBalance,
  type TokenBalance,
} from '../lib/web3/token-balance'
import {useWallet, type SupportedChainId} from './use-wallet'

/**
 * Hook configuration options for token balance checking
 */
export interface UseTokenBalanceOptions extends Partial<BalanceCheckConfig> {
  /** Enable the query (default: true) */
  enabled?: boolean
  /** Refetch interval in milliseconds (default: 10 seconds) */
  refetchInterval?: number
  /** Stale time in milliseconds (default: 5 seconds) */
  staleTime?: number
  /** Cache time in milliseconds (default: 2 minutes) */
  cacheTime?: number
}

/**
 * Single token balance hook options
 */
export interface UseSingleTokenBalanceOptions extends UseTokenBalanceOptions {
  /** Token decimals (if known, avoids extra RPC call) */
  decimals?: number
}

/**
 * Cross-chain balance hook options
 */
export interface UseCrossChainBalanceOptions extends UseTokenBalanceOptions {
  /** Specific chains to check (default: all supported chains) */
  chainIds?: SupportedChainId[]
}

/**
 * Return type for single token balance hook
 */
export interface UseSingleTokenBalanceReturn {
  /** Token balance information */
  balance: TokenBalance | null
  /** Loading state */
  isLoading: boolean
  /** Error state */
  error: Error | null
  /** Is currently fetching */
  isFetching: boolean
  /** Has data been fetched at least once */
  isSuccess: boolean
  /** Refetch function */
  refetch: () => void
  /** Force refresh (bypasses cache) */
  refresh: () => void
}

/**
 * Return type for multiple token balances hook
 */
export interface UseMultipleTokenBalancesReturn {
  /** Array of token balances */
  balances: TokenBalance[]
  /** Native token balance (if requested) */
  nativeBalance: NativeBalance | null
  /** Loading state */
  isLoading: boolean
  /** Error state */
  error: Error | null
  /** Is currently fetching */
  isFetching: boolean
  /** Has data been fetched at least once */
  isSuccess: boolean
  /** Balance check errors */
  balanceErrors: BalanceCheckResult['errors']
  /** Number of successful balance checks */
  successfulChecks: number
  /** Total number of attempted checks */
  totalChecks: number
  /** Refetch function */
  refetch: () => void
  /** Force refresh (bypasses cache) */
  refresh: () => void
}

/**
 * Return type for cross-chain balances hook
 */
export interface UseCrossChainBalancesReturn {
  /** Balance results by chain */
  balancesByChain: Record<SupportedChainId, BalanceCheckResult>
  /** All token balances flattened */
  allTokenBalances: TokenBalance[]
  /** All native balances by chain */
  nativeBalances: Record<SupportedChainId, NativeBalance>
  /** Loading state */
  isLoading: boolean
  /** Error state */
  error: Error | null
  /** Is currently fetching */
  isFetching: boolean
  /** Has data been fetched at least once */
  isSuccess: boolean
  /** All balance check errors */
  allErrors: BalanceCheckResult['errors']
  /** Total successful checks across all chains */
  totalSuccessfulChecks: number
  /** Total attempted checks across all chains */
  totalAttemptedChecks: number
  /** Refetch function */
  refetch: () => void
  /** Force refresh (bypasses cache) */
  refresh: () => void
}

/**
 * Default options for balance hooks
 */
const DEFAULT_HOOK_OPTIONS: Required<Omit<UseTokenBalanceOptions, keyof BalanceCheckConfig>> = {
  enabled: true,
  refetchInterval: 10_000, // 10 seconds
  staleTime: 5_000, // 5 seconds
  cacheTime: 2 * 60 * 1000, // 2 minutes
}

/**
 * Retry configuration constants
 */
const RETRY_CONFIG = {
  MAX_ATTEMPTS: 3,
  INITIAL_DELAY: 1000, // 1 second
  MAX_DELAY: 15_000, // 15 seconds
} as const

/**
 * Hook for checking balance of a single token
 *
 * Features:
 * - Real-time balance updates with configurable intervals
 * - Automatic caching and stale data management
 * - Error handling and recovery
 * - Integration with existing useWallet patterns
 *
 * @param tokenAddress Token contract address
 * @param chainId Chain ID where the token exists
 * @param options Configuration options
 * @returns Single token balance state
 */
export function useSingleTokenBalance(
  tokenAddress: Address | null,
  chainId: SupportedChainId | null,
  options: UseSingleTokenBalanceOptions = {},
): UseSingleTokenBalanceReturn {
  const config = useConfig()
  const {address, isConnected} = useWallet()

  // Merge options with defaults
  const mergedOptions = {...DEFAULT_HOOK_OPTIONS, ...options}

  // Create query key
  const queryKey = [
    'tokenBalance',
    'single',
    address,
    tokenAddress,
    chainId,
    options.decimals,
    options.bypassCache,
  ] as const

  // Balance query
  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<TokenBalance> => {
      if (address === undefined) {
        throw new Error('Wallet not connected')
      }
      if (tokenAddress === null) {
        throw new Error('Token address not provided')
      }
      if (chainId === null) {
        throw new Error('Chain ID not provided')
      }

      return checkTokenBalance(config, address, tokenAddress, chainId, options.decimals)
    },
    enabled: mergedOptions.enabled && isConnected && Boolean(address) && Boolean(tokenAddress) && Boolean(chainId),
    refetchInterval: mergedOptions.refetchInterval,
    staleTime: mergedOptions.staleTime,
    gcTime: mergedOptions.cacheTime,
    retry: (failureCount, error) => {
      // Don't retry if wallet is not connected
      if (error.message.includes('not connected')) {
        return false
      }
      // Retry up to configured max attempts for other errors
      return failureCount < RETRY_CONFIG.MAX_ATTEMPTS
    },
    retryDelay: attemptIndex => Math.min(RETRY_CONFIG.INITIAL_DELAY * 2 ** attemptIndex, RETRY_CONFIG.MAX_DELAY),
  })

  return {
    balance: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    isFetching: query.isFetching,
    isSuccess: query.isSuccess,
    refetch: () => {
      query.refetch().catch(() => {
        // Ignore refetch errors - they will be handled by the query state
      })
    },
    refresh: () => {
      query.refetch({cancelRefetch: true}).catch(() => {
        // Ignore refresh errors - they will be handled by the query state
      })
    },
  }
}

/**
 * Hook for checking balances of multiple tokens on a single chain
 *
 * Features:
 * - Batch balance checking for optimal performance
 * - Native token balance included optionally
 * - Real-time updates with error handling
 * - Detailed success/failure statistics
 *
 * @param tokens Array of tokens to check
 * @param chainId Chain ID where tokens exist
 * @param options Configuration options
 * @returns Multiple token balances state
 */
export function useMultipleTokenBalances(
  tokens: {address: Address; decimals?: number}[] | null,
  chainId: SupportedChainId | null,
  options: UseTokenBalanceOptions = {},
): UseMultipleTokenBalancesReturn {
  const config = useConfig()
  const {address, isConnected} = useWallet()

  // Merge options with defaults
  const mergedOptions = {...DEFAULT_HOOK_OPTIONS, ...options}
  const balanceConfig: BalanceCheckConfig = {
    ...DEFAULT_BALANCE_CONFIG,
    ...options,
  }

  // Create query key
  const queryKey = [
    'tokenBalance',
    'multiple',
    address,
    tokens?.map(t => ({address: t.address, decimals: t.decimals})),
    chainId,
    balanceConfig.enableBatching,
    balanceConfig.batchSize,
    balanceConfig.includeNative,
    balanceConfig.bypassCache,
  ] as const

  // Balance query
  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<BalanceCheckResult> => {
      if (address === undefined) {
        throw new Error('Wallet not connected')
      }
      if (tokens === null) {
        throw new Error('Tokens not provided')
      }
      if (chainId === null) {
        throw new Error('Chain ID not provided')
      }

      return checkAllBalances(config, address, tokens, chainId, balanceConfig)
    },
    enabled: mergedOptions.enabled && isConnected && Boolean(address) && Boolean(tokens) && Boolean(chainId),
    refetchInterval: mergedOptions.refetchInterval,
    staleTime: mergedOptions.staleTime,
    gcTime: mergedOptions.cacheTime,
    retry: (failureCount, error) => {
      // Don't retry if wallet is not connected
      if (error.message.includes('not connected')) {
        return false
      }
      // Retry up to configured max attempts for other errors
      return failureCount < RETRY_CONFIG.MAX_ATTEMPTS
    },
    retryDelay: attemptIndex => Math.min(RETRY_CONFIG.INITIAL_DELAY * 2 ** attemptIndex, RETRY_CONFIG.MAX_DELAY),
  })

  return {
    balances: query.data?.tokenBalances ?? [],
    nativeBalance: query.data?.nativeBalance ?? null,
    isLoading: query.isLoading,
    error: query.error,
    isFetching: query.isFetching,
    isSuccess: query.isSuccess,
    balanceErrors: query.data?.errors ?? [],
    successfulChecks: query.data?.successfulChecks ?? 0,
    totalChecks: query.data?.totalChecks ?? 0,
    refetch: () => {
      query.refetch().catch(() => {
        // Ignore refetch errors - they will be handled by the query state
      })
    },
    refresh: () => {
      query.refetch({cancelRefetch: true}).catch(() => {
        // Ignore refresh errors - they will be handled by the query state
      })
    },
  }
}

/**
 * Hook for checking native token balance (ETH, MATIC, etc.)
 *
 * Features:
 * - Real-time native balance updates
 * - Automatic network symbol detection
 * - Efficient caching and refresh strategies
 * - Error handling for network issues
 *
 * @param chainId Chain ID to check native balance on
 * @param options Configuration options
 * @returns Native token balance state
 */
export function useNativeBalance(
  chainId: SupportedChainId | null,
  options: UseTokenBalanceOptions = {},
): UseSingleTokenBalanceReturn {
  const config = useConfig()
  const {address, isConnected} = useWallet()

  // Merge options with defaults
  const mergedOptions = {...DEFAULT_HOOK_OPTIONS, ...options}

  // Create query key
  const queryKey = ['tokenBalance', 'native', address, chainId, options.bypassCache] as const

  // Native balance query
  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<TokenBalance> => {
      if (address === undefined) {
        throw new Error('Wallet not connected')
      }
      if (chainId === null) {
        throw new Error('Chain ID not provided')
      }

      const nativeBalance = await checkNativeBalance(config, address, chainId)

      // Convert to TokenBalance format for consistency
      return {
        address: '0x0000000000000000000000000000000000000000' as Address, // Zero address for native
        balance: nativeBalance.balance,
        formattedBalance: nativeBalance.formattedBalance,
        decimals: 18, // Native tokens typically use 18 decimals
        chainId: nativeBalance.chainId,
        lastUpdated: nativeBalance.lastUpdated,
      }
    },
    enabled: mergedOptions.enabled && isConnected && Boolean(address) && Boolean(chainId),
    refetchInterval: mergedOptions.refetchInterval,
    staleTime: mergedOptions.staleTime,
    gcTime: mergedOptions.cacheTime,
    retry: (failureCount, error) => {
      // Don't retry if wallet is not connected
      if (error.message.includes('not connected')) {
        return false
      }
      // Retry up to configured max attempts for other errors
      return failureCount < RETRY_CONFIG.MAX_ATTEMPTS
    },
    retryDelay: attemptIndex => Math.min(RETRY_CONFIG.INITIAL_DELAY * 2 ** attemptIndex, RETRY_CONFIG.MAX_DELAY),
  })

  return {
    balance: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    isFetching: query.isFetching,
    isSuccess: query.isSuccess,
    refetch: () => {
      query.refetch().catch(() => {
        // Ignore refetch errors - they will be handled by the query state
      })
    },
    refresh: () => {
      query.refetch({cancelRefetch: true}).catch(() => {
        // Ignore refresh errors - they will be handled by the query state
      })
    },
  }
}

/**
 * Hook for checking token balances across multiple chains
 *
 * Features:
 * - Cross-chain balance aggregation
 * - Parallel processing for optimal performance
 * - Comprehensive error handling per chain
 * - Unified interface for multi-chain data
 *
 * @param tokensByChain Mapping of chain IDs to token arrays
 * @param options Configuration options
 * @returns Cross-chain balance state
 */
export function useCrossChainBalances(
  tokensByChain: Record<SupportedChainId, {address: Address; decimals?: number}[]> | null,
  options: UseCrossChainBalanceOptions = {},
): UseCrossChainBalancesReturn {
  const config = useConfig()
  const {address, isConnected, getSupportedChains} = useWallet()

  // Merge options with defaults
  const mergedOptions = {...DEFAULT_HOOK_OPTIONS, ...options}
  const balanceConfig: BalanceCheckConfig = {
    ...DEFAULT_BALANCE_CONFIG,
    ...options,
  }

  // Use specified chains or all supported chains
  const targetChains = options.chainIds ?? getSupportedChains().map(chain => chain.id)

  // Create query key
  const queryKey = [
    'tokenBalance',
    'crossChain',
    address,
    tokensByChain,
    targetChains,
    balanceConfig.enableBatching,
    balanceConfig.batchSize,
    balanceConfig.includeNative,
    balanceConfig.bypassCache,
  ] as const

  // Cross-chain balance query
  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<Record<SupportedChainId, BalanceCheckResult>> => {
      if (address === undefined) {
        throw new Error('Wallet not connected')
      }
      if (tokensByChain === null) {
        throw new Error('Tokens by chain not provided')
      }

      return checkCrossChainBalances(config, address, tokensByChain, balanceConfig)
    },
    enabled: mergedOptions.enabled && isConnected && Boolean(address) && Boolean(tokensByChain),
    refetchInterval: mergedOptions.refetchInterval,
    staleTime: mergedOptions.staleTime,
    gcTime: mergedOptions.cacheTime,
    retry: (failureCount, error) => {
      // Don't retry if wallet is not connected
      if (error.message.includes('not connected')) {
        return false
      }
      // Retry up to configured max attempts for other errors
      return failureCount < RETRY_CONFIG.MAX_ATTEMPTS
    },
    retryDelay: attemptIndex => Math.min(RETRY_CONFIG.INITIAL_DELAY * 2 ** attemptIndex, RETRY_CONFIG.MAX_DELAY),
  })

  // Process results for convenience accessors
  const balancesByChain = query.data ?? ({} as Record<SupportedChainId, BalanceCheckResult>)
  const allTokenBalances = Object.values(balancesByChain).flatMap(result => result.tokenBalances)
  const nativeBalances = Object.fromEntries(
    Object.entries(balancesByChain)
      .filter(([, result]) => result.nativeBalance)
      .map(([chainId, result]) => [chainId, result.nativeBalance as NativeBalance]),
  ) as Record<SupportedChainId, NativeBalance>
  const allErrors = Object.values(balancesByChain).flatMap(result => result.errors)
  const totalSuccessfulChecks = Object.values(balancesByChain).reduce((sum, result) => sum + result.successfulChecks, 0)
  const totalAttemptedChecks = Object.values(balancesByChain).reduce((sum, result) => sum + result.totalChecks, 0)

  return {
    balancesByChain,
    allTokenBalances,
    nativeBalances,
    isLoading: query.isLoading,
    error: query.error,
    isFetching: query.isFetching,
    isSuccess: query.isSuccess,
    allErrors,
    totalSuccessfulChecks,
    totalAttemptedChecks,
    refetch: () => {
      query.refetch().catch(() => {
        // Ignore refetch errors - they will be handled by the query state
      })
    },
    refresh: () => {
      query.refetch({cancelRefetch: true}).catch(() => {
        // Ignore refresh errors - they will be handled by the query state
      })
    },
  }
}
