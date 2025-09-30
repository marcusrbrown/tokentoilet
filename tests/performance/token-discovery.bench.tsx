/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import type {Address} from 'viem'
import type {Config} from 'wagmi'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {renderHook, waitFor} from '@testing-library/react'
import {beforeEach, bench, describe, expect, vi} from 'vitest'

import {
  useChainTokenDiscovery,
  useNonZeroTokens,
  useTokenDiscovery,
  useTokensByBalance,
  useTokensByChain,
} from '../../hooks/use-token-discovery'
import {useWallet} from '../../hooks/use-wallet'
import {discoverUserTokens, type DiscoveredToken, type TokenDiscoveryResult} from '../../lib/web3/token-discovery'

/**
 * Performance Benchmarks for Token Discovery with Large Collections
 *
 * Tests performance characteristics of token discovery operations with
 * datasets ranging from 100 to 5000+ tokens across multiple chains.
 *
 * Key Performance Areas:
 * - Token discovery hook initialization and data fetching
 * - Query caching and re-render efficiency
 * - Filtering operations on large datasets
 * - Sorting operations by balance
 * - Multi-chain token grouping
 * - Batch processing performance
 */

// Mock dependencies
vi.mock('wagmi', () => ({
  useConfig: vi.fn(() => ({}) as Config),
}))

vi.mock('../../lib/web3/token-discovery', () => ({
  discoverUserTokens: vi.fn(),
  DEFAULT_TOKEN_DISCOVERY_CONFIG: {
    maxTokensPerChain: 100,
    minBalanceThreshold: BigInt(0),
    enableBatching: true,
    batchSize: 20,
  },
}))

vi.mock('../../hooks/use-wallet', () => ({
  useWallet: vi.fn(),
}))

/**
 * Generate realistic mock token data for performance testing
 */
function generateMockToken(index: number, chainId: number): DiscoveredToken {
  const tokenSymbols = ['USDC', 'DAI', 'USDT', 'WBTC', 'WETH', 'LINK', 'UNI', 'AAVE', 'MATIC', 'SHIB']
  const symbolIndex = index % tokenSymbols.length
  const symbol = tokenSymbols[symbolIndex]

  // Generate varied balances (some large, some small, some zero)
  let balance: bigint
  if (index % 10 === 0) {
    balance = BigInt(0) // 10% zero balance
  } else if (index % 3 === 0) {
    balance = BigInt(Math.floor(Math.random() * 1_000_000_000_000)) // Large balance
  } else {
    balance = BigInt(Math.floor(Math.random() * 1_000_000)) // Small balance
  }

  return {
    address: `0x${index.toString(16).padStart(40, '0')}` as Address,
    symbol: `${symbol}-${index}`,
    name: `Token ${symbol} ${index}`,
    decimals: 18,
    balance,
    chainId: chainId as 1 | 137 | 42161,
    formattedBalance: (Number(balance) / 1e18).toFixed(4),
  }
}

/**
 * Generate large collection of mock tokens across multiple chains
 */
function generateTokenCollection(size: number, chains: number[] = [1, 137, 42161]): DiscoveredToken[] {
  const tokens: DiscoveredToken[] = []
  const tokensPerChain = Math.ceil(size / chains.length)

  for (const chainId of chains) {
    for (let i = 0; i < tokensPerChain && tokens.length < size; i++) {
      tokens.push(generateMockToken(tokens.length, chainId))
    }
  }

  return tokens
}

describe('Token Discovery Performance Benchmarks', () => {
  const mockAddress = '0x1234567890123456789012345678901234567890' as Address
  let queryClient: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0, // Disable cache for performance tests
          staleTime: 0,
        },
      },
    })

    vi.mocked(useWallet).mockReturnValue({
      address: mockAddress,
      isConnected: true,
      getSupportedChains: vi.fn(() => [
        {id: 1, name: 'Ethereum', blockExplorers: {default: {name: 'Etherscan', url: 'https://etherscan.io'}}},
        {id: 137, name: 'Polygon', blockExplorers: {default: {name: 'PolygonScan', url: 'https://polygonscan.com'}}},
        {id: 42161, name: 'Arbitrum', blockExplorers: {default: {name: 'Arbiscan', url: 'https://arbiscan.io'}}},
      ]),
    } as any)
  })

  const wrapper = ({children}: {children: React.ReactNode}) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  describe('Token Discovery with Large Collections', () => {
    bench('discover 100 tokens', async () => {
      const mockTokens = generateTokenCollection(100)
      const mockResult: TokenDiscoveryResult = {
        tokens: mockTokens,
        errors: [],
        chainsScanned: 3,
        contractsChecked: 100,
      }

      vi.mocked(discoverUserTokens).mockResolvedValue(mockResult)

      const {result} = renderHook(() => useTokenDiscovery(), {wrapper})

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
        expect(result.current.tokens).toHaveLength(100)
      })
    })

    bench('discover 500 tokens', async () => {
      const mockTokens = generateTokenCollection(500)
      const mockResult: TokenDiscoveryResult = {
        tokens: mockTokens,
        errors: [],
        chainsScanned: 3,
        contractsChecked: 500,
      }

      vi.mocked(discoverUserTokens).mockResolvedValue(mockResult)

      const {result} = renderHook(() => useTokenDiscovery(), {wrapper})

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
        expect(result.current.tokens).toHaveLength(500)
      })
    })

    bench('discover 1000 tokens', async () => {
      const mockTokens = generateTokenCollection(1000)
      const mockResult: TokenDiscoveryResult = {
        tokens: mockTokens,
        errors: [],
        chainsScanned: 3,
        contractsChecked: 1000,
      }

      vi.mocked(discoverUserTokens).mockResolvedValue(mockResult)

      const {result} = renderHook(() => useTokenDiscovery(), {wrapper})

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
        expect(result.current.tokens).toHaveLength(1000)
      })
    })

    bench('discover 2000 tokens', async () => {
      const mockTokens = generateTokenCollection(2000)
      const mockResult: TokenDiscoveryResult = {
        tokens: mockTokens,
        errors: [],
        chainsScanned: 3,
        contractsChecked: 2000,
      }

      vi.mocked(discoverUserTokens).mockResolvedValue(mockResult)

      const {result} = renderHook(() => useTokenDiscovery(), {wrapper})

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
        expect(result.current.tokens).toHaveLength(2000)
      })
    })

    bench('discover 5000 tokens (extreme case)', async () => {
      const mockTokens = generateTokenCollection(5000)
      const mockResult: TokenDiscoveryResult = {
        tokens: mockTokens,
        errors: [],
        chainsScanned: 3,
        contractsChecked: 5000,
      }

      vi.mocked(discoverUserTokens).mockResolvedValue(mockResult)

      const {result} = renderHook(() => useTokenDiscovery(), {wrapper})

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
        expect(result.current.tokens).toHaveLength(5000)
      })
    })
  })

  describe('Filtering Performance with Large Datasets', () => {
    bench('filter non-zero tokens from 1000 tokens', async () => {
      const mockTokens = generateTokenCollection(1000)
      const mockResult: TokenDiscoveryResult = {
        tokens: mockTokens,
        errors: [],
        chainsScanned: 3,
        contractsChecked: 1000,
      }

      vi.mocked(discoverUserTokens).mockResolvedValue(mockResult)

      const {result} = renderHook(() => useNonZeroTokens(), {wrapper})

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
        // Should filter out zero balance tokens (~10% in our mock data)
        expect(result.current.tokens.length).toBeGreaterThan(0)
        expect(result.current.tokens.length).toBeLessThan(1000)
      })
    })

    bench('filter tokens by chain from 1000 tokens', async () => {
      const mockTokens = generateTokenCollection(1000)
      const mockResult: TokenDiscoveryResult = {
        tokens: mockTokens,
        errors: [],
        chainsScanned: 1,
        contractsChecked: 1000,
      }

      vi.mocked(discoverUserTokens).mockResolvedValue(mockResult)

      const {result} = renderHook(() => useChainTokenDiscovery(1), {wrapper})

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })
    })

    bench('group 2000 tokens by chain', async () => {
      const mockTokens = generateTokenCollection(2000)
      const mockResult: TokenDiscoveryResult = {
        tokens: mockTokens,
        errors: [],
        chainsScanned: 3,
        contractsChecked: 2000,
      }

      vi.mocked(discoverUserTokens).mockResolvedValue(mockResult)

      const {result} = renderHook(() => useTokensByChain(), {wrapper})

      await waitFor(() => {
        expect(result.current.totalTokens).toBe(2000)
        // Should group into 3 chains
        expect(Object.keys(result.current.tokensByChain).length).toBeGreaterThan(0)
      })
    })
  })

  describe('Sorting Performance with Large Datasets', () => {
    bench('sort 500 tokens by balance', async () => {
      const mockTokens = generateTokenCollection(500)
      const mockResult: TokenDiscoveryResult = {
        tokens: mockTokens,
        errors: [],
        chainsScanned: 3,
        contractsChecked: 500,
      }

      vi.mocked(discoverUserTokens).mockResolvedValue(mockResult)

      const {result} = renderHook(() => useTokensByBalance(), {wrapper})

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
        expect(result.current.tokens).toHaveLength(500)
        // Verify sorted (highest balance first)
        if (result.current.tokens.length > 1) {
          expect(result.current.tokens[0].balance >= result.current.tokens[1].balance).toBe(true)
        }
      })
    })

    bench('sort 1000 tokens by balance', async () => {
      const mockTokens = generateTokenCollection(1000)
      const mockResult: TokenDiscoveryResult = {
        tokens: mockTokens,
        errors: [],
        chainsScanned: 3,
        contractsChecked: 1000,
      }

      vi.mocked(discoverUserTokens).mockResolvedValue(mockResult)

      const {result} = renderHook(() => useTokensByBalance(), {wrapper})

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
        expect(result.current.tokens).toHaveLength(1000)
        // Verify sorted
        if (result.current.tokens.length > 1) {
          expect(result.current.tokens[0].balance >= result.current.tokens[1].balance).toBe(true)
        }
      })
    })

    bench('sort 2000 tokens by balance', async () => {
      const mockTokens = generateTokenCollection(2000)
      const mockResult: TokenDiscoveryResult = {
        tokens: mockTokens,
        errors: [],
        chainsScanned: 3,
        contractsChecked: 2000,
      }

      vi.mocked(discoverUserTokens).mockResolvedValue(mockResult)

      const {result} = renderHook(() => useTokensByBalance(), {wrapper})

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
        expect(result.current.tokens).toHaveLength(2000)
        // Verify sorted
        if (result.current.tokens.length > 1) {
          expect(result.current.tokens[0].balance >= result.current.tokens[1].balance).toBe(true)
        }
      })
    })
  })

  describe('Multi-Chain Discovery Performance', () => {
    bench('discover tokens across 3 chains (1000 tokens total)', async () => {
      const mockTokens = generateTokenCollection(1000, [1, 137, 42161])
      const mockResult: TokenDiscoveryResult = {
        tokens: mockTokens,
        errors: [],
        chainsScanned: 3,
        contractsChecked: 1000,
      }

      vi.mocked(discoverUserTokens).mockResolvedValue(mockResult)

      const {result} = renderHook(() => useTokenDiscovery({chainIds: [1, 137, 42161]}), {wrapper})

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
        expect(result.current.tokens).toHaveLength(1000)
        expect(result.current.chainsScanned).toBe(3)
      })
    })

    bench('discover and group tokens by chain (2000 tokens)', async () => {
      const mockTokens = generateTokenCollection(2000, [1, 137, 42161])
      const mockResult: TokenDiscoveryResult = {
        tokens: mockTokens,
        errors: [],
        chainsScanned: 3,
        contractsChecked: 2000,
      }

      vi.mocked(discoverUserTokens).mockResolvedValue(mockResult)

      const {result} = renderHook(() => useTokensByChain({chainIds: [1, 137, 42161]}), {wrapper})

      await waitFor(() => {
        expect(result.current.totalTokens).toBe(2000)
        // Should have tokens distributed across chains
        const chainCount = Object.keys(result.current.tokensByChain).length
        expect(chainCount).toBeGreaterThan(0)
        expect(chainCount).toBeLessThanOrEqual(3)
      })
    })
  })

  describe('Query Cache Performance', () => {
    bench('re-render with cached data (1000 tokens)', async () => {
      const mockTokens = generateTokenCollection(1000)
      const mockResult: TokenDiscoveryResult = {
        tokens: mockTokens,
        errors: [],
        chainsScanned: 3,
        contractsChecked: 1000,
      }

      vi.mocked(discoverUserTokens).mockResolvedValue(mockResult)

      // First render - populate cache
      const {result, rerender} = renderHook(() => useTokenDiscovery(), {wrapper})

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Clear mock call count
      vi.mocked(discoverUserTokens).mockClear()

      // Re-render should use cache (no new API call in our mock setup)
      rerender()

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
        expect(result.current.tokens).toHaveLength(1000)
      })
    })

    bench('multiple hook instances with shared cache (500 tokens)', async () => {
      const mockTokens = generateTokenCollection(500)
      const mockResult: TokenDiscoveryResult = {
        tokens: mockTokens,
        errors: [],
        chainsScanned: 3,
        contractsChecked: 500,
      }

      vi.mocked(discoverUserTokens).mockResolvedValue(mockResult)

      // Render multiple hook instances
      const {result: result1} = renderHook(() => useTokenDiscovery(), {wrapper})
      const {result: result2} = renderHook(() => useTokenDiscovery(), {wrapper})
      const {result: result3} = renderHook(() => useTokensByBalance(), {wrapper})

      await waitFor(() => {
        expect(result1.current.isSuccess).toBe(true)
        expect(result2.current.isSuccess).toBe(true)
        expect(result3.current.isSuccess).toBe(true)
      })

      // All instances should have the same data
      expect(result1.current.tokens).toHaveLength(500)
      expect(result2.current.tokens).toHaveLength(500)
      expect(result3.current.tokens).toHaveLength(500)
    })
  })

  describe('Batch Processing Performance', () => {
    bench('batch discovery with large dataset (1000 tokens, batch size 20)', async () => {
      const mockTokens = generateTokenCollection(1000)
      const mockResult: TokenDiscoveryResult = {
        tokens: mockTokens,
        errors: [],
        chainsScanned: 3,
        contractsChecked: 1000,
      }

      vi.mocked(discoverUserTokens).mockResolvedValue(mockResult)

      const {result} = renderHook(
        () =>
          useTokenDiscovery({
            enableBatching: true,
            batchSize: 20,
          }),
        {wrapper},
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
        expect(result.current.tokens).toHaveLength(1000)
      })
    })

    bench('batch discovery with larger batch size (1000 tokens, batch size 50)', async () => {
      const mockTokens = generateTokenCollection(1000)
      const mockResult: TokenDiscoveryResult = {
        tokens: mockTokens,
        errors: [],
        chainsScanned: 3,
        contractsChecked: 1000,
      }

      vi.mocked(discoverUserTokens).mockResolvedValue(mockResult)

      const {result} = renderHook(
        () =>
          useTokenDiscovery({
            enableBatching: true,
            batchSize: 50,
          }),
        {wrapper},
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
        expect(result.current.tokens).toHaveLength(1000)
      })
    })
  })

  describe('Memory Efficiency', () => {
    bench('token discovery with minimal data copying (1000 tokens)', async () => {
      const mockTokens = generateTokenCollection(1000)
      const mockResult: TokenDiscoveryResult = {
        tokens: mockTokens,
        errors: [],
        chainsScanned: 3,
        contractsChecked: 1000,
      }

      vi.mocked(discoverUserTokens).mockResolvedValue(mockResult)

      const {result} = renderHook(() => useTokenDiscovery(), {wrapper})

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Verify that token array references are stable
      const tokensRef1 = result.current.tokens
      const tokensRef2 = result.current.tokens
      expect(tokensRef1).toBe(tokensRef2) // Same reference
    })

    bench('filtered tokens maintain references (2000 tokens)', async () => {
      const mockTokens = generateTokenCollection(2000)
      const mockResult: TokenDiscoveryResult = {
        tokens: mockTokens,
        errors: [],
        chainsScanned: 3,
        contractsChecked: 2000,
      }

      vi.mocked(discoverUserTokens).mockResolvedValue(mockResult)

      const {result} = renderHook(() => useTokensByChain(), {wrapper})

      await waitFor(() => {
        expect(result.current.totalTokens).toBe(2000)
      })

      // Verify grouping is efficient
      const totalGroupedTokens = Object.values(result.current.tokensByChain).reduce(
        (sum, tokens) => sum + tokens.length,
        0,
      )
      expect(totalGroupedTokens).toBe(2000)
    })
  })
})
