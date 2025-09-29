'use client'

import type {CategorizedToken} from '@/lib/web3/token-filtering'
import type {Address} from 'viem'
import {useQuery} from '@tanstack/react-query'
import {useCallback, useMemo} from 'react'
import {useWallet, type SupportedChainId} from './use-wallet'

/**
 * Platform identifiers for CoinGecko API
 */
const CHAIN_TO_PLATFORM: Record<SupportedChainId, string> = {
  1: 'ethereum', // Ethereum
  137: 'polygon-pos', // Polygon
  42161: 'arbitrum-one', // Arbitrum
}

/**
 * Individual token price response from CoinGecko
 */
export interface TokenPriceData {
  /** USD price of the token */
  usd: number
  /** Market cap in USD (if available) */
  usd_market_cap?: number
  /** 24-hour trading volume in USD (if available) */
  usd_24h_vol?: number
  /** 24-hour price change percentage (if available) */
  usd_24h_change?: number
  /** Last updated timestamp (if available) */
  last_updated_at?: number
}

/**
 * Batch token prices response
 */
export interface TokenPricesMap {
  [contractAddress: string]: TokenPriceData
}

/**
 * Price fetching configuration
 */
export interface TokenPriceConfig {
  /** Whether to include market cap data */
  includeMarketCap?: boolean
  /** Whether to include 24h volume data */
  include24hVolume?: boolean
  /** Whether to include 24h price change */
  include24hChange?: boolean
  /** Whether to include last updated timestamp */
  includeLastUpdated?: boolean
  /** Refresh interval in milliseconds (default: 60 seconds) */
  refreshInterval?: number
  /** Cache time in milliseconds (default: 5 minutes) */
  staleTime?: number
}

/**
 * Single token price hook return type
 */
export interface UseTokenPriceReturn {
  /** Current price in USD (null if loading/error) */
  price: number | null
  /** Market cap in USD (null if unavailable) */
  marketCap: number | null
  /** 24h volume in USD (null if unavailable) */
  volume24h: number | null
  /** 24h price change percentage (null if unavailable) */
  priceChange24h: number | null
  /** Last updated timestamp (null if unavailable) */
  lastUpdated: Date | null
  /** Whether currently fetching price data */
  isLoading: boolean
  /** Whether data has been successfully fetched at least once */
  isSuccess: boolean
  /** Error object if fetching failed */
  error: Error | null
  /** Manually refetch price data */
  refetch: () => Promise<void>
}

/**
 * Batch token prices hook return type
 */
export interface UseTokenPricesReturn {
  /** Map of contract addresses to price data */
  prices: TokenPricesMap
  /** Whether currently fetching price data */
  isLoading: boolean
  /** Whether data has been successfully fetched at least once */
  isSuccess: boolean
  /** Error object if fetching failed */
  error: Error | null
  /** Manually refetch price data */
  refetch: () => Promise<void>
  /** Get price for specific token address */
  getTokenPrice: (address: Address) => number | null
  /** Get formatted USD value for token amount */
  calculateUsdValue: (address: Address, amount: string) => string
}

/**
 * Token price fetching error with context
 */
export class TokenPriceFetchError extends Error {
  constructor(
    message: string,
    readonly cause?: Error,
    readonly statusCode?: number,
  ) {
    super(message)
    this.name = 'TokenPriceFetchError'
  }
}

/**
 * Fetch token prices from CoinGecko API
 */
async function fetchTokenPrices(
  chainId: SupportedChainId,
  contractAddresses: Address[],
  config: TokenPriceConfig = {},
): Promise<TokenPricesMap> {
  const {includeMarketCap, include24hVolume, include24hChange, includeLastUpdated} = config

  if (contractAddresses.length === 0) {
    return {}
  }

  const platform = CHAIN_TO_PLATFORM[chainId]
  if (!platform) {
    throw new TokenPriceFetchError(`Unsupported chain ID: ${chainId}`)
  }

  // Build API URL with optional parameters
  const baseUrl = 'https://api.coingecko.com/api/v3/simple/token_price'
  const url = new URL(`${baseUrl}/${platform}`)

  // Add query parameters
  url.searchParams.set('contract_addresses', contractAddresses.join(','))
  url.searchParams.set('vs_currencies', 'usd')

  if (includeMarketCap) {
    url.searchParams.set('include_market_cap', 'true')
  }
  if (include24hVolume) {
    url.searchParams.set('include_24hr_vol', 'true')
  }
  if (include24hChange) {
    url.searchParams.set('include_24hr_change', 'true')
  }
  if (includeLastUpdated) {
    url.searchParams.set('include_last_updated_at', 'true')
  }

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      // Handle rate limiting and other HTTP errors
      if (response.status === 429) {
        throw new TokenPriceFetchError('CoinGecko API rate limit exceeded. Please try again later.', undefined, 429)
      }

      throw new TokenPriceFetchError(
        `Failed to fetch token prices: ${response.status} ${response.statusText}`,
        undefined,
        response.status,
      )
    }

    const data: unknown = await response.json()

    // Validate response structure
    if (typeof data !== 'object' || data === null) {
      throw new TokenPriceFetchError('Invalid response format from CoinGecko API')
    }

    return data as TokenPricesMap
  } catch (error) {
    if (error instanceof TokenPriceFetchError) {
      throw error
    }

    // Handle network errors and other fetch failures
    throw new TokenPriceFetchError(
      'Network error while fetching token prices',
      error instanceof Error ? error : new Error(String(error)),
    )
  }
}

/**
 * Hook for fetching price of a single token
 *
 * Provides real-time USD price data for a single token using CoinGecko API.
 * Includes automatic caching, error handling, and retry logic.
 *
 * @param token - The token to fetch price for
 * @param config - Price fetching configuration options
 * @returns Price data and query state
 */
export function useTokenPrice(token?: CategorizedToken, config: TokenPriceConfig = {}): UseTokenPriceReturn {
  const {chainId, isConnected} = useWallet()

  const {
    refreshInterval = 60_000, // 1 minute
    staleTime = 300_000, // 5 minutes
    ...fetchConfig
  } = config

  const {
    data,
    isLoading,
    isSuccess,
    error,
    refetch: queryRefetch,
  } = useQuery({
    queryKey: ['token-price', chainId, token?.address.toLowerCase(), fetchConfig] as const,
    queryFn: async () => {
      if (!token || !chainId) {
        return null
      }

      const prices = await fetchTokenPrices(chainId as SupportedChainId, [token.address], fetchConfig)
      return prices[token.address.toLowerCase()] ?? null
    },
    enabled: token != null && chainId != null && isConnected,
    staleTime,
    refetchInterval: refreshInterval,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30_000),
  })

  const refetch = useCallback(async () => {
    await queryRefetch()
  }, [queryRefetch])

  return {
    price: data?.usd ?? null,
    marketCap: data?.usd_market_cap ?? null,
    volume24h: data?.usd_24h_vol ?? null,
    priceChange24h: data?.usd_24h_change ?? null,
    lastUpdated: typeof data?.last_updated_at === 'number' ? new Date(data.last_updated_at * 1000) : null,
    isLoading,
    isSuccess,
    error,
    refetch,
  }
}

/**
 * Hook for fetching prices of multiple tokens in batch
 *
 * Efficiently fetches USD prices for multiple tokens using CoinGecko's batch API.
 * Provides utilities for calculating USD values and retrieving specific token prices.
 *
 * @param tokens - Array of tokens to fetch prices for
 * @param config - Price fetching configuration options
 * @returns Batch price data and query utilities
 */
export function useTokenPrices(tokens: CategorizedToken[] = [], config: TokenPriceConfig = {}): UseTokenPricesReturn {
  const {chainId, isConnected} = useWallet()

  const {
    refreshInterval = 60_000, // 1 minute
    staleTime = 300_000, // 5 minutes
    ...fetchConfig
  } = config

  // Extract addresses for query key consistency
  const addresses = useMemo(() => tokens.map(token => token.address.toLowerCase()).sort(), [tokens])

  const {
    data,
    isLoading,
    isSuccess,
    error,
    refetch: queryRefetch,
  } = useQuery({
    queryKey: ['token-prices', chainId, addresses, fetchConfig] as const,
    queryFn: async () => {
      if (tokens.length === 0 || !chainId) {
        return {}
      }

      const tokenAddresses = tokens.map(token => token.address)
      return fetchTokenPrices(chainId as SupportedChainId, tokenAddresses, fetchConfig)
    },
    enabled: tokens.length > 0 && chainId != null && isConnected,
    staleTime,
    refetchInterval: refreshInterval,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30_000),
  })

  const refetch = useCallback(async () => {
    await queryRefetch()
  }, [queryRefetch])

  const getTokenPrice = useCallback(
    (address: Address): number | null => {
      return data?.[address.toLowerCase()]?.usd ?? null
    },
    [data],
  )

  const calculateUsdValue = useCallback(
    (address: Address, amount: string): string => {
      const price = getTokenPrice(address)
      if (price === null || !amount) return '0.00'

      try {
        const numericAmount = Number.parseFloat(amount)
        if (Number.isNaN(numericAmount)) return '0.00'

        const usdValue = numericAmount * price

        // Format based on value magnitude
        if (usdValue < 0.01) {
          return usdValue < 0.001 ? '<$0.001' : `$${usdValue.toFixed(3)}`
        }
        if (usdValue >= 1_000_000) {
          return `$${(usdValue / 1_000_000).toFixed(2)}M`
        }
        if (usdValue >= 1_000) {
          return `$${(usdValue / 1_000).toFixed(2)}K`
        }

        return `$${usdValue.toFixed(2)}`
      } catch {
        return '0.00'
      }
    },
    [getTokenPrice],
  )

  return {
    prices: data ?? {},
    isLoading,
    isSuccess,
    error,
    refetch,
    getTokenPrice,
    calculateUsdValue,
  }
}
