/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type {CategorizedToken} from '@/lib/web3/token-filtering'
import type {ReactNode} from 'react'
import {TokenCategory, TokenValueClass} from '@/lib/web3/token-filtering'
import {TokenRiskScore} from '@/lib/web3/token-metadata'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {renderHook, waitFor} from '@testing-library/react'
import React from 'react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {TokenPriceFetchError, useTokenPrice, useTokenPrices} from './use-token-price'
import {useWallet} from './use-wallet'

// Mock useWallet hook
vi.mock('./use-wallet', () => ({
  useWallet: vi.fn(),
}))

// Mock fetch globally for API calls
const mockFetch = vi.fn()
globalThis.fetch = mockFetch

// Create a wrapper for React Query
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })

  return function Wrapper({children}: {children: ReactNode}) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

// Mock token data for tests
const mockToken: CategorizedToken = {
  address: '0xA0b86a33E6441b1e78a8C46B9d688d5d5d3B2D1c',
  chainId: 1,
  symbol: 'ETH',
  name: 'Ethereum',
  decimals: 18,
  balance: BigInt('1000000000000000000'), // 1 ETH
  formattedBalance: '1.0',
  category: TokenCategory.VALUABLE,
  valueClass: TokenValueClass.HIGH_VALUE,
  riskScore: TokenRiskScore.LOW,
  spamScore: 0,
  isVerified: true,
  analysisTimestamp: Date.now(),
  confidenceScore: 95,
}

const mockTokens: CategorizedToken[] = [
  mockToken,
  {
    ...mockToken,
    address: '0xA0b86a33E6441b1e78a8C46B9d688d5d5d3B2D1d',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    balance: BigInt('1000000'), // 1 USDC
    formattedBalance: '1.0',
  },
]

// Mock successful API response
const mockApiResponse = {
  '0xa0b86a33e6441b1e78a8c46b9d688d5d5d3b2d1c': {
    usd: 2000,
    usd_market_cap: 240000000000,
    usd_24h_vol: 15000000000,
    usd_24h_change: 2.5,
    last_updated_at: 1640995200,
  },
  '0xa0b86a33e6441b1e78a8c46b9d688d5d5d3b2d1d': {
    usd: 1,
    usd_market_cap: 50000000000,
    usd_24h_vol: 2000000000,
    usd_24h_change: -0.1,
    last_updated_at: 1640995200,
  },
}

describe('useTokenPrice', () => {
  const mockUseWallet = vi.mocked(useWallet)

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseWallet.mockReturnValue({
      chainId: 1,
      isConnected: true,
      address: '0x123' as const,
      currentNetwork: {name: 'Ethereum Mainnet', symbol: 'ETH'},
      isCurrentChainSupported: true,
      connect: vi.fn(),
      disconnect: vi.fn(),
      switchToChain: vi.fn(),
      isSwitchingChain: false,
      switchChainError: null,
      isSupportedChain: vi.fn(() => true) as any,
      validateCurrentNetwork: vi.fn(),
      getUnsupportedNetworkError: vi.fn(),
      handleUnsupportedNetwork: vi.fn(),
      getSupportedChains: vi.fn(),
      classifyWalletError: vi.fn(),
      getWalletErrorRecovery: vi.fn(),
      persistence: {
        isAvailable: true,
        autoReconnect: false,
        lastWalletId: null,
        preferredChain: null,
        lastConnectionData: null,
        isRestoring: false,
        error: null,
        setAutoReconnect: vi.fn(),
        setPreferredChain: vi.fn(),
        clearStoredData: vi.fn(),
        shouldRestore: vi.fn(),
        getConnectionAge: vi.fn(),
      },
    })
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  it('fetches token price successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockApiResponse,
    })

    const wrapper = createWrapper()
    const {result} = renderHook(() => useTokenPrice(mockToken), {wrapper})

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.price).toBe(2000)
    expect(result.current.marketCap).toBe(240000000000)
    expect(result.current.volume24h).toBe(15000000000)
    expect(result.current.priceChange24h).toBe(2.5)
    expect(result.current.error).toBeNull()
  })

  it('handles API errors gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
    })

    const wrapper = createWrapper()
    const {result} = renderHook(() => useTokenPrice(mockToken), {wrapper})

    await waitFor(() => {
      expect(result.current.error).toBeDefined()
    })

    expect(result.current.price).toBeNull()
    expect(result.current.error).toBeDefined()
  })

  it('handles network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const wrapper = createWrapper()
    const {result} = renderHook(() => useTokenPrice(mockToken), {wrapper})

    await waitFor(() => {
      expect(result.current.error).toBeDefined()
    })

    expect(result.current.price).toBeNull()
    expect(result.current.error).toBeDefined()
  })

  it('does not fetch when wallet is not connected', async () => {
    mockUseWallet.mockReturnValue({
      chainId: 1,
      isConnected: false,
      address: undefined,
      currentNetwork: {name: 'Ethereum Mainnet', symbol: 'ETH'},
      isCurrentChainSupported: true,
      connect: vi.fn(),
      disconnect: vi.fn(),
      switchToChain: vi.fn(),
      isSwitchingChain: false,
      switchChainError: null,
      isSupportedChain: vi.fn(() => true) as any,
      validateCurrentNetwork: vi.fn(),
      getUnsupportedNetworkError: vi.fn(),
      handleUnsupportedNetwork: vi.fn(),
      getSupportedChains: vi.fn(),
      classifyWalletError: vi.fn(),
      getWalletErrorRecovery: vi.fn(),
      persistence: {
        isAvailable: true,
        autoReconnect: false,
        lastWalletId: null,
        preferredChain: null,
        lastConnectionData: null,
        isRestoring: false,
        error: null,
        setAutoReconnect: vi.fn(),
        setPreferredChain: vi.fn(),
        clearStoredData: vi.fn(),
        shouldRestore: vi.fn(),
        getConnectionAge: vi.fn(),
      },
    })

    const wrapper = createWrapper()
    const {result} = renderHook(() => useTokenPrice(mockToken), {wrapper})

    // Should not make any fetch calls
    expect(mockFetch).not.toHaveBeenCalled()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.price).toBeNull()
  })

  it('does not fetch when no token is provided', async () => {
    const wrapper = createWrapper()
    const {result} = renderHook(() => useTokenPrice(undefined), {wrapper})

    expect(mockFetch).not.toHaveBeenCalled()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.price).toBeNull()
  })

  it('includes correct query parameters for enhanced data', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockApiResponse,
    })

    const wrapper = createWrapper()
    renderHook(
      () =>
        useTokenPrice(mockToken, {
          includeMarketCap: true,
          include24hVolume: true,
          include24hChange: true,
          includeLastUpdated: true,
        }),
      {wrapper},
    )

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled()
    })

    const fetchCall = mockFetch.mock.calls[0]?.[0] as string
    expect(fetchCall).toContain('include_market_cap=true')
    expect(fetchCall).toContain('include_24hr_vol=true')
    expect(fetchCall).toContain('include_24hr_change=true')
    expect(fetchCall).toContain('include_last_updated_at=true')
  })
})

describe('useTokenPrices', () => {
  const mockUseWallet = vi.mocked(useWallet)

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseWallet.mockReturnValue({
      chainId: 1,
      isConnected: true,
      address: '0x123' as const,
      currentNetwork: {name: 'Ethereum Mainnet', symbol: 'ETH'},
      isCurrentChainSupported: true,
      connect: vi.fn(),
      disconnect: vi.fn(),
      switchToChain: vi.fn(),
      isSwitchingChain: false,
      switchChainError: null,
      isSupportedChain: vi.fn(() => true) as any,
      validateCurrentNetwork: vi.fn(),
      getUnsupportedNetworkError: vi.fn(),
      handleUnsupportedNetwork: vi.fn(),
      getSupportedChains: vi.fn(),
      classifyWalletError: vi.fn(),
      getWalletErrorRecovery: vi.fn(),
      persistence: {
        isAvailable: true,
        autoReconnect: false,
        lastWalletId: null,
        preferredChain: null,
        lastConnectionData: null,
        isRestoring: false,
        error: null,
        setAutoReconnect: vi.fn(),
        setPreferredChain: vi.fn(),
        clearStoredData: vi.fn(),
        shouldRestore: vi.fn(),
        getConnectionAge: vi.fn(),
      },
    })
  })

  it('fetches multiple token prices successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockApiResponse,
    })

    const wrapper = createWrapper()
    const {result} = renderHook(() => useTokenPrices(mockTokens), {wrapper})

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(Object.keys(result.current.prices)).toHaveLength(2)
    expect(result.current.getTokenPrice(mockToken.address)).toBe(2000)
    expect(result.current.getTokenPrice(mockTokens[1].address)).toBe(1)
  })

  it('calculates USD values correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockApiResponse,
    })

    const wrapper = createWrapper()
    const {result} = renderHook(() => useTokenPrices(mockTokens), {wrapper})

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // 1 ETH at $2000 = $2000 (should format as $2.00K)
    expect(result.current.calculateUsdValue(mockToken.address, '1')).toBe('$2.00K')

    // 1 USDC at $1 = $1
    expect(result.current.calculateUsdValue(mockTokens[1].address, '1')).toBe('$1.00')

    // 0.001 ETH at $2000 = $2
    expect(result.current.calculateUsdValue(mockToken.address, '0.001')).toBe('$2.00')
  })

  it('handles empty token array', async () => {
    const wrapper = createWrapper()
    const {result} = renderHook(() => useTokenPrices([]), {wrapper})

    expect(mockFetch).not.toHaveBeenCalled()
    expect(Object.keys(result.current.prices)).toHaveLength(0)
    expect(result.current.getTokenPrice(mockToken.address)).toBeNull()
  })

  it('handles unsupported chain gracefully', async () => {
    mockUseWallet.mockReturnValue({
      chainId: 999,
      isConnected: true,
      address: '0x123' as const,
      currentNetwork: null,
      isCurrentChainSupported: false,
      connect: vi.fn(),
      disconnect: vi.fn(),
      switchToChain: vi.fn(),
      isSwitchingChain: false,
      switchChainError: null,
      isSupportedChain: vi.fn(() => false) as any,
      validateCurrentNetwork: vi.fn(),
      getUnsupportedNetworkError: vi.fn(),
      handleUnsupportedNetwork: vi.fn(),
      getSupportedChains: vi.fn(),
      classifyWalletError: vi.fn(),
      getWalletErrorRecovery: vi.fn(),
      persistence: {
        isAvailable: true,
        autoReconnect: false,
        lastWalletId: null,
        preferredChain: null,
        lastConnectionData: null,
        isRestoring: false,
        error: null,
        setAutoReconnect: vi.fn(),
        setPreferredChain: vi.fn(),
        clearStoredData: vi.fn(),
        shouldRestore: vi.fn(),
        getConnectionAge: vi.fn(),
      },
    })

    mockFetch.mockRejectedValueOnce(new TokenPriceFetchError('Unsupported chain ID: 999'))

    const wrapper = createWrapper()
    const {result} = renderHook(() => useTokenPrices(mockTokens), {wrapper})

    await waitFor(() => {
      expect(result.current.error).toBeDefined()
    })

    expect(result.current.error).toBeDefined()
  })

  it.skip('refetch function works correctly', async () => {
    // Setup wallet for this test
    mockUseWallet.mockReturnValue({
      chainId: 1,
      isConnected: true,
      address: '0x123' as const,
      currentNetwork: null,
      isCurrentChainSupported: true,
      connect: vi.fn(),
      disconnect: vi.fn(),
      switchToChain: vi.fn(),
      isSwitchingChain: false,
      switchChainError: null,
      isSupportedChain: vi.fn(() => true) as any,
      validateCurrentNetwork: vi.fn(),
      getUnsupportedNetworkError: vi.fn(),
      handleUnsupportedNetwork: vi.fn(),
      getSupportedChains: vi.fn(),
      classifyWalletError: vi.fn(),
      getWalletErrorRecovery: vi.fn(),
      persistence: {
        isAvailable: true,
        autoReconnect: false,
        lastWalletId: null,
        preferredChain: null,
        lastConnectionData: null,
        isRestoring: false,
        error: null,
        setAutoReconnect: vi.fn(),
        setPreferredChain: vi.fn(),
        clearStoredData: vi.fn(),
        shouldRestore: vi.fn(),
        getConnectionAge: vi.fn(),
      },
    })

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockApiResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          ...mockApiResponse,
          '0xa0b86a33e6441b1e78a8c46b9d688d5d5d3b2d1c': {
            ...mockApiResponse['0xa0b86a33e6441b1e78a8c46b9d688d5d5d3b2d1c'],
            usd: 2100, // Updated price
          },
        }),
      })

    const wrapper = createWrapper()
    const {result} = renderHook(() => useTokenPrices(mockTokens), {wrapper})

    // Wait for initial data
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Verify refetch function exists and can be called
    expect(typeof result.current.refetch).toBe('function')

    // Test that refetch doesn't throw errors
    await expect(result.current.refetch()).resolves.not.toThrow()
  })
})

describe('TokenPriceFetchError', () => {
  it('creates error with proper message and metadata', () => {
    const cause = new Error('Network timeout')
    const error = new TokenPriceFetchError('Failed to fetch prices', cause, 500)

    expect(error.name).toBe('TokenPriceFetchError')
    expect(error.message).toBe('Failed to fetch prices')
    expect(error.cause).toBe(cause)
    expect(error.statusCode).toBe(500)
  })

  it('creates error without optional parameters', () => {
    const error = new TokenPriceFetchError('Simple error')

    expect(error.name).toBe('TokenPriceFetchError')
    expect(error.message).toBe('Simple error')
    expect(error.cause).toBeUndefined()
    expect(error.statusCode).toBeUndefined()
  })
})
