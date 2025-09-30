/* eslint-disable @typescript-eslint/no-unsafe-argument */
import type {Address} from 'viem'
import type {Config} from 'wagmi'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {renderHook, waitFor} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {discoverUserTokens, type DiscoveredToken, type TokenDiscoveryResult} from '../lib/web3/token-discovery'
import {
  useChainTokenDiscovery,
  useNonZeroTokens,
  useTokenDiscovery,
  useTokenExists,
  useTokensByBalance,
  useTokensByChain,
} from './use-token-discovery'
import {useWallet} from './use-wallet'

// Mock dependencies
vi.mock('wagmi', () => ({
  useConfig: vi.fn(() => ({}) as Config),
}))

vi.mock('../lib/web3/token-discovery', () => ({
  discoverUserTokens: vi.fn(),
  DEFAULT_TOKEN_DISCOVERY_CONFIG: {
    maxTokensPerChain: 100,
    minBalanceThreshold: BigInt(0),
    enableBatching: true,
    batchSize: 20,
  },
}))

vi.mock('./use-wallet', () => ({
  useWallet: vi.fn(),
}))

describe('useTokenDiscovery', () => {
  const mockAddress = '0x1234567890123456789012345678901234567890' as Address
  const mockTokens: DiscoveredToken[] = [
    {
      address: '0xA0b86a33E6441E5d8CE6a65f7AEF4eDe18f23e94' as Address,
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      balance: BigInt('1000000000'),
      chainId: 1,
      formattedBalance: '1000',
    },
    {
      address: '0x6B175474E89094C44Da98b954EedeAC495271d0F' as Address,
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      decimals: 18,
      balance: BigInt('500000000000000000000'),
      chainId: 1,
      formattedBalance: '500',
    },
  ]

  let queryClient: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {retry: false},
      },
    })

    // Default mock implementations
    vi.mocked(useWallet).mockReturnValue({
      address: mockAddress,
      isConnected: true,
      getSupportedChains: vi.fn(() => [
        {id: 1, name: 'Ethereum', blockExplorers: {default: {name: 'Etherscan', url: 'https://etherscan.io'}}},
        {id: 137, name: 'Polygon', blockExplorers: {default: {name: 'PolygonScan', url: 'https://polygonscan.com'}}},
      ]),
    } as any)
  })

  const wrapper = ({children}: {children: React.ReactNode}) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  describe('basic functionality', () => {
    it('should discover tokens when wallet is connected', async () => {
      const mockResult: TokenDiscoveryResult = {
        tokens: mockTokens,
        errors: [],
        chainsScanned: 2,
        contractsChecked: 20,
      }

      vi.mocked(discoverUserTokens).mockResolvedValue(mockResult)

      const {result} = renderHook(() => useTokenDiscovery(), {wrapper})

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.tokens).toEqual(mockTokens)
      expect(result.current.chainsScanned).toBe(2)
      expect(result.current.contractsChecked).toBe(20)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should not fetch when wallet is not connected', async () => {
      vi.mocked(useWallet).mockReturnValue({
        address: undefined,
        isConnected: false,
        getSupportedChains: vi.fn(() => []),
      } as any)

      const {result} = renderHook(() => useTokenDiscovery(), {wrapper})

      expect(result.current.tokens).toEqual([])
      expect(result.current.isLoading).toBe(false)
      expect(discoverUserTokens).not.toHaveBeenCalled()
    })

    it('should respect enabled option', async () => {
      const {result} = renderHook(() => useTokenDiscovery({enabled: false}), {wrapper})

      expect(result.current.tokens).toEqual([])
      expect(discoverUserTokens).not.toHaveBeenCalled()
    })

    it.skip('should handle errors gracefully', async () => {
      const mockError = new Error('RPC connection failed')
      vi.mocked(discoverUserTokens).mockRejectedValue(mockError)

      const {result} = renderHook(() => useTokenDiscovery(), {wrapper})

      await waitFor(() => {
        expect(result.current.error).toBeTruthy()
      })

      expect(result.current.error?.message).toBe('RPC connection failed')
      expect(result.current.tokens).toEqual([])
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('configuration options', () => {
    it('should pass custom chain IDs to discovery function', async () => {
      const mockResult: TokenDiscoveryResult = {
        tokens: [],
        errors: [],
        chainsScanned: 1,
        contractsChecked: 0,
      }

      vi.mocked(discoverUserTokens).mockResolvedValue(mockResult)

      renderHook(() => useTokenDiscovery({chainIds: [1]}), {wrapper})

      await waitFor(() => {
        expect(discoverUserTokens).toHaveBeenCalled()
      })

      const callArgs = vi.mocked(discoverUserTokens).mock.calls[0]
      expect(callArgs[2]).toMatchObject({
        chainIds: [1],
      })
    })

    it('should pass custom maxTokensPerChain option', async () => {
      const mockResult: TokenDiscoveryResult = {
        tokens: [],
        errors: [],
        chainsScanned: 1,
        contractsChecked: 0,
      }

      vi.mocked(discoverUserTokens).mockResolvedValue(mockResult)

      renderHook(() => useTokenDiscovery({maxTokensPerChain: 50}), {wrapper})

      await waitFor(() => {
        expect(discoverUserTokens).toHaveBeenCalled()
      })

      const callArgs = vi.mocked(discoverUserTokens).mock.calls[0]
      expect(callArgs[2]).toMatchObject({
        maxTokensPerChain: 50,
      })
    })

    it('should pass custom minBalanceThreshold option', async () => {
      const mockResult: TokenDiscoveryResult = {
        tokens: [],
        errors: [],
        chainsScanned: 1,
        contractsChecked: 0,
      }

      vi.mocked(discoverUserTokens).mockResolvedValue(mockResult)

      renderHook(() => useTokenDiscovery({minBalanceThreshold: BigInt(1000)}), {wrapper})

      await waitFor(() => {
        expect(discoverUserTokens).toHaveBeenCalled()
      })

      const callArgs = vi.mocked(discoverUserTokens).mock.calls[0]
      expect(callArgs[2]).toMatchObject({
        minBalanceThreshold: BigInt(1000),
      })
    })
  })

  describe('discovery errors handling', () => {
    it('should expose discovery errors from result', async () => {
      const mockResult: TokenDiscoveryResult = {
        tokens: mockTokens,
        errors: [
          {
            chainId: 137,
            message: 'Polygon RPC timeout',
            type: 'RPC_ERROR',
          },
        ],
        chainsScanned: 2,
        contractsChecked: 20,
      }

      vi.mocked(discoverUserTokens).mockResolvedValue(mockResult)

      const {result} = renderHook(() => useTokenDiscovery(), {wrapper})

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.discoveryErrors).toHaveLength(1)
      expect(result.current.discoveryErrors[0].chainId).toBe(137)
      expect(result.current.discoveryErrors[0].type).toBe('RPC_ERROR')
    })

    it('should handle wallet not connected error without retry', async () => {
      const mockError = new Error('Wallet not connected')
      vi.mocked(discoverUserTokens).mockRejectedValue(mockError)

      const {result} = renderHook(() => useTokenDiscovery(), {wrapper})

      await waitFor(() => {
        expect(result.current.error).toBeTruthy()
      })

      expect(result.current.error?.message).toBe('Wallet not connected')
      // Should not retry connection errors
      expect(discoverUserTokens).toHaveBeenCalledTimes(1)
    })
  })

  describe('refetch functionality', () => {
    it('should provide refetch function', async () => {
      const mockResult: TokenDiscoveryResult = {
        tokens: mockTokens,
        errors: [],
        chainsScanned: 2,
        contractsChecked: 20,
      }

      vi.mocked(discoverUserTokens).mockResolvedValue(mockResult)

      const {result} = renderHook(() => useTokenDiscovery(), {wrapper})

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.refetch).toBeDefined()
      expect(typeof result.current.refetch).toBe('function')
    })

    it('should provide refresh function that bypasses cache', async () => {
      const mockResult: TokenDiscoveryResult = {
        tokens: mockTokens,
        errors: [],
        chainsScanned: 2,
        contractsChecked: 20,
      }

      vi.mocked(discoverUserTokens).mockResolvedValue(mockResult)

      const {result} = renderHook(() => useTokenDiscovery(), {wrapper})

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.refresh).toBeDefined()
      expect(typeof result.current.refresh).toBe('function')
    })
  })

  describe('loading and fetching states', () => {
    it('should track isFetching state', async () => {
      const mockResult: TokenDiscoveryResult = {
        tokens: mockTokens,
        errors: [],
        chainsScanned: 2,
        contractsChecked: 20,
      }

      vi.mocked(discoverUserTokens).mockResolvedValue(mockResult)

      const {result} = renderHook(() => useTokenDiscovery(), {wrapper})

      expect(result.current.isFetching).toBe(true)

      await waitFor(() => {
        expect(result.current.isFetching).toBe(false)
      })
    })

    it('should provide isSuccess state', async () => {
      const mockResult: TokenDiscoveryResult = {
        tokens: mockTokens,
        errors: [],
        chainsScanned: 2,
        contractsChecked: 20,
      }

      vi.mocked(discoverUserTokens).mockResolvedValue(mockResult)

      const {result} = renderHook(() => useTokenDiscovery(), {wrapper})

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })
    })
  })
})

describe('useChainTokenDiscovery', () => {
  const mockAddress = '0x1234567890123456789012345678901234567890' as Address
  let queryClient: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {retry: false},
      },
    })

    vi.mocked(useWallet).mockReturnValue({
      address: mockAddress,
      isConnected: true,
      getSupportedChains: vi.fn(() => [
        {id: 1, name: 'Ethereum', blockExplorers: {default: {name: 'Etherscan', url: 'https://etherscan.io'}}},
      ]),
    } as any)
  })

  const wrapper = ({children}: {children: React.ReactNode}) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  it('should discover tokens only on specified chain', async () => {
    const mockResult: TokenDiscoveryResult = {
      tokens: [
        {
          address: '0xA0b86a33E6441E5d8CE6a65f7AEF4eDe18f23e94' as Address,
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6,
          balance: BigInt('1000000000'),
          chainId: 1,
          formattedBalance: '1000',
        },
      ],
      errors: [],
      chainsScanned: 1,
      contractsChecked: 10,
    }

    vi.mocked(discoverUserTokens).mockResolvedValue(mockResult)

    const {result} = renderHook(() => useChainTokenDiscovery(1), {wrapper})

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(discoverUserTokens).toHaveBeenCalled()
    const callArgs = vi.mocked(discoverUserTokens).mock.calls[0]
    expect(callArgs[2]).toMatchObject({
      chainIds: [1],
    })
  })
})

describe('useTokenExists', () => {
  const mockAddress = '0x1234567890123456789012345678901234567890' as Address
  const mockTokenAddress = '0xA0b86a33E6441E5d8CE6a65f7AEF4eDe18f23e94' as Address
  let queryClient: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {retry: false},
      },
    })

    vi.mocked(useWallet).mockReturnValue({
      address: mockAddress,
      isConnected: true,
      getSupportedChains: vi.fn(() => [
        {id: 1, name: 'Ethereum', blockExplorers: {default: {name: 'Etherscan', url: 'https://etherscan.io'}}},
      ]),
    } as any)
  })

  const wrapper = ({children}: {children: React.ReactNode}) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  it('should find existing token', async () => {
    const mockResult: TokenDiscoveryResult = {
      tokens: [
        {
          address: mockTokenAddress,
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6,
          balance: BigInt('1000000000'),
          chainId: 1,
          formattedBalance: '1000',
        },
      ],
      errors: [],
      chainsScanned: 1,
      contractsChecked: 1,
    }

    vi.mocked(discoverUserTokens).mockResolvedValue(mockResult)

    const {result} = renderHook(() => useTokenExists(mockTokenAddress, 1), {wrapper})

    await waitFor(() => {
      expect(result.current.token).toBeTruthy()
    })

    expect(result.current.token?.address.toLowerCase()).toBe(mockTokenAddress.toLowerCase())
    expect(result.current.token?.symbol).toBe('USDC')
  })

  it('should return null for non-existent token', async () => {
    const mockResult: TokenDiscoveryResult = {
      tokens: [],
      errors: [],
      chainsScanned: 1,
      contractsChecked: 1,
    }

    vi.mocked(discoverUserTokens).mockResolvedValue(mockResult)

    const {result} = renderHook(() => useTokenExists(mockTokenAddress, 1), {wrapper})

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.token).toBeNull()
  })

  it('should include tokens with zero balance', async () => {
    const mockResult: TokenDiscoveryResult = {
      tokens: [
        {
          address: mockTokenAddress,
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6,
          balance: BigInt('0'),
          chainId: 1,
          formattedBalance: '0',
        },
      ],
      errors: [],
      chainsScanned: 1,
      contractsChecked: 1,
    }

    vi.mocked(discoverUserTokens).mockResolvedValue(mockResult)

    const {result} = renderHook(() => useTokenExists(mockTokenAddress, 1), {wrapper})

    await waitFor(() => {
      expect(result.current.token).toBeTruthy()
    })

    expect(result.current.token?.balance).toBe(BigInt('0'))
  })
})

describe('useNonZeroTokens', () => {
  const mockAddress = '0x1234567890123456789012345678901234567890' as Address
  let queryClient: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {retry: false},
      },
    })

    vi.mocked(useWallet).mockReturnValue({
      address: mockAddress,
      isConnected: true,
      getSupportedChains: vi.fn(() => [
        {id: 1, name: 'Ethereum', blockExplorers: {default: {name: 'Etherscan', url: 'https://etherscan.io'}}},
      ]),
    } as any)
  })

  const wrapper = ({children}: {children: React.ReactNode}) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  it('should filter out zero balance tokens', async () => {
    const mockResult: TokenDiscoveryResult = {
      tokens: [
        {
          address: '0xA0b86a33E6441E5d8CE6a65f7AEF4eDe18f23e94' as Address,
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6,
          balance: BigInt('1000000000'),
          chainId: 1,
          formattedBalance: '1000',
        },
      ],
      errors: [],
      chainsScanned: 1,
      contractsChecked: 10,
    }

    vi.mocked(discoverUserTokens).mockResolvedValue(mockResult)

    renderHook(() => useNonZeroTokens(), {wrapper})

    await waitFor(() => {
      expect(discoverUserTokens).toHaveBeenCalled()
    })

    const callArgs = vi.mocked(discoverUserTokens).mock.calls[0]
    expect(callArgs[2]).toMatchObject({
      minBalanceThreshold: BigInt(1),
    })
  })
})

describe('useTokensByBalance', () => {
  const mockAddress = '0x1234567890123456789012345678901234567890' as Address
  let queryClient: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {retry: false},
      },
    })

    vi.mocked(useWallet).mockReturnValue({
      address: mockAddress,
      isConnected: true,
      getSupportedChains: vi.fn(() => [
        {id: 1, name: 'Ethereum', blockExplorers: {default: {name: 'Etherscan', url: 'https://etherscan.io'}}},
      ]),
    } as any)
  })

  const wrapper = ({children}: {children: React.ReactNode}) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  it('should sort tokens by balance (highest first)', async () => {
    const mockResult: TokenDiscoveryResult = {
      tokens: [
        {
          address: '0xA0b86a33E6441E5d8CE6a65f7AEF4eDe18f23e94' as Address,
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6,
          balance: BigInt('1000000000'),
          chainId: 1,
          formattedBalance: '1000',
        },
        {
          address: '0x6B175474E89094C44Da98b954EedeAC495271d0F' as Address,
          symbol: 'DAI',
          name: 'Dai Stablecoin',
          decimals: 18,
          balance: BigInt('500000000000000000000'),
          chainId: 1,
          formattedBalance: '500',
        },
      ],
      errors: [],
      chainsScanned: 1,
      contractsChecked: 20,
    }

    vi.mocked(discoverUserTokens).mockResolvedValue(mockResult)

    const {result} = renderHook(() => useTokensByBalance(), {wrapper})

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.tokens).toHaveLength(2)
    expect(result.current.tokens[0].balance).toBeGreaterThan(result.current.tokens[1].balance)
    expect(result.current.tokens[0].symbol).toBe('DAI')
  })
})

describe('useTokensByChain', () => {
  const mockAddress = '0x1234567890123456789012345678901234567890' as Address
  let queryClient: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {retry: false},
      },
    })

    vi.mocked(useWallet).mockReturnValue({
      address: mockAddress,
      isConnected: true,
      getSupportedChains: vi.fn(() => [
        {id: 1, name: 'Ethereum', blockExplorers: {default: {name: 'Etherscan', url: 'https://etherscan.io'}}},
        {id: 137, name: 'Polygon', blockExplorers: {default: {name: 'PolygonScan', url: 'https://polygonscan.com'}}},
      ]),
    } as any)
  })

  const wrapper = ({children}: {children: React.ReactNode}) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  it('should group tokens by chain ID', async () => {
    const mockResult: TokenDiscoveryResult = {
      tokens: [
        {
          address: '0xA0b86a33E6441E5d8CE6a65f7AEF4eDe18f23e94' as Address,
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6,
          balance: BigInt('1000000000'),
          chainId: 1,
          formattedBalance: '1000',
        },
        {
          address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174' as Address,
          symbol: 'USDC',
          name: 'USD Coin (PoS)',
          decimals: 6,
          balance: BigInt('500000000'),
          chainId: 137,
          formattedBalance: '500',
        },
      ],
      errors: [],
      chainsScanned: 2,
      contractsChecked: 20,
    }

    vi.mocked(discoverUserTokens).mockResolvedValue(mockResult)

    const {result} = renderHook(() => useTokensByChain(), {wrapper})

    await waitFor(() => {
      expect(result.current.totalTokens).toBe(2)
    })

    expect(result.current.tokensByChain[1]).toBeDefined()
    expect(result.current.tokensByChain[137]).toBeDefined()
    expect(result.current.tokensByChain[1]).toHaveLength(1)
    expect(result.current.tokensByChain[137]).toHaveLength(1)
    expect(result.current.tokensByChain[1][0].symbol).toBe('USDC')
    expect(result.current.tokensByChain[137][0].symbol).toBe('USDC')
  })

  it('should track total token count', async () => {
    const mockResult: TokenDiscoveryResult = {
      tokens: [
        {
          address: '0xA0b86a33E6441E5d8CE6a65f7AEF4eDe18f23e94' as Address,
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6,
          balance: BigInt('1000000000'),
          chainId: 1,
          formattedBalance: '1000',
        },
      ],
      errors: [],
      chainsScanned: 1,
      contractsChecked: 10,
    }

    vi.mocked(discoverUserTokens).mockResolvedValue(mockResult)

    const {result} = renderHook(() => useTokensByChain(), {wrapper})

    await waitFor(() => {
      expect(result.current.totalTokens).toBe(1)
    })
  })
})
