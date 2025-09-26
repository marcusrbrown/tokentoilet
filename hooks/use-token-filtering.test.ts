import type {Address} from 'viem'
import type {DiscoveredToken} from '../lib/web3/token-discovery'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {renderHook, waitFor} from '@testing-library/react'
import React from 'react'
import {beforeEach, describe, expect, it, vi, type MockedFunction} from 'vitest'
import {useAccount, useChainId} from 'wagmi'
import {TokenCategory} from '../lib/web3/token-filtering'

import {
  useTokenCategorizationPreferences,
  useTokenFavorites,
  useTokenFiltering,
  useTokenHiding,
} from './use-token-filtering'

// Mock wagmi hooks
vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
  useChainId: vi.fn(),
}))

// Mock useWallet hook
vi.mock('./use-wallet', () => ({
  useWallet: vi.fn(() => ({
    address: '0x1234567890123456789012345678901234567890' as Address,
    isConnected: true,
    chainId: 1,
  })),
}))

// Mock network imports for consistency with other Web3 tests
vi.mock('@reown/appkit/networks', () => ({
  mainnet: {id: 1},
  polygon: {id: 137},
  arbitrum: {id: 42161},
}))

const mockUseAccount = useAccount as MockedFunction<typeof useAccount>
const mockUseChainId = useChainId as MockedFunction<typeof useChainId>

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Test wrapper for React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })
  return ({children}: {children: React.ReactNode}) =>
    React.createElement(QueryClientProvider, {client: queryClient}, children)
}

// Mock token data
const createMockToken = (overrides: Partial<DiscoveredToken> = {}): DiscoveredToken => ({
  address: '0xA0b86a33E6aA3D1C81e4f059a5E4b54B94e8a7A2' as Address,
  chainId: 1,
  name: 'Test Token',
  symbol: 'TEST',
  decimals: 18,
  balance: BigInt('1000000000000000000'),
  formattedBalance: '1.0',
  ...overrides,
})

const mockTokens: DiscoveredToken[] = [
  createMockToken({
    address: '0x1111111111111111111111111111111111111111' as Address,
    symbol: 'ETH',
    name: 'Ethereum',
  }),
  createMockToken({
    address: '0x2222222222222222222222222222222222222222' as Address,
    symbol: 'USDC',
    name: 'USD Coin',
  }),
]

describe('useTokenCategorizationPreferences', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()

    // Use type assertion to avoid complex interface matching
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    mockUseAccount.mockReturnValue({
      address: '0x1234567890123456789012345678901234567890' as Address,
      isConnected: true,
    } as any)

    mockUseChainId.mockReturnValue(1)
  })

  it('should return default preferences when no localStorage data exists', async () => {
    localStorageMock.getItem.mockReturnValue(null)

    const {result} = renderHook(() => useTokenCategorizationPreferences(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.preferences).toEqual(
      expect.objectContaining({
        autoCategorizationEnabled: expect.any(Boolean) as boolean,
        favoriteTokens: expect.any(Set) as Set<string>,
        hiddenTokens: expect.any(Set) as Set<string>,
      }),
    )
  })

  it('should provide update function', async () => {
    const {result} = renderHook(() => useTokenCategorizationPreferences(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(typeof result.current.updatePreferences).toBe('function')
    expect(typeof result.current.resetPreferences).toBe('function')
  })
})

describe('useTokenFiltering', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()

    // Use type assertion to avoid complex interface matching
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    mockUseAccount.mockReturnValue({
      address: '0x1234567890123456789012345678901234567890' as Address,
      isConnected: true,
    } as any)

    mockUseChainId.mockReturnValue(1)
  })

  it('should filter and categorize tokens correctly', async () => {
    const {result} = renderHook(() => useTokenFiltering(mockTokens), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.tokens).toHaveLength(2)
    expect(result.current.totalTokens).toBe(2)
    expect(result.current.filteredTokens).toBe(2)
  })

  it('should handle empty token list', async () => {
    const {result} = renderHook(() => useTokenFiltering([]), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.tokens).toHaveLength(0)
    expect(result.current.totalTokens).toBe(0)
    expect(result.current.filteredTokens).toBe(0)
  })
})

describe('useTokenFavorites', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
  })

  it('should provide favorites management functions', async () => {
    const {result} = renderHook(() => useTokenFavorites(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.favorites).toBeDefined()
    })

    expect(typeof result.current.addFavorite).toBe('function')
    expect(typeof result.current.removeFavorite).toBe('function')
    expect(typeof result.current.isFavorite).toBe('function')
    expect(typeof result.current.toggleFavorite).toBe('function')
  })
})

describe('useTokenHiding', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
  })

  it('should provide token hiding management functions', async () => {
    const {result} = renderHook(() => useTokenHiding(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.hiddenTokens).toBeDefined()
    })

    expect(typeof result.current.hideToken).toBe('function')
    expect(typeof result.current.unhideToken).toBe('function')
    expect(typeof result.current.isHidden).toBe('function')
    expect(typeof result.current.toggleHidden).toBe('function')
  })
})

// Additional utility hook tests
describe('useTokensByCategory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()

    // Use type assertion to avoid complex interface matching
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    mockUseAccount.mockReturnValue({
      address: '0x1234567890123456789012345678901234567890' as Address,
      isConnected: true,
    } as any)

    mockUseChainId.mockReturnValue(1)
  })

  it('should filter tokens by category', async () => {
    const {useTokensByCategory} = await import('./use-token-filtering')

    const {result} = renderHook(() => useTokensByCategory(mockTokens, TokenCategory.VALUABLE), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(Array.isArray(result.current.tokens)).toBe(true)
    expect(typeof result.current.filteredTokens).toBe('number')
  })
})

describe('useValuableTokens', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()

    // Use type assertion to avoid complex interface matching
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    mockUseAccount.mockReturnValue({
      address: '0x1234567890123456789012345678901234567890' as Address,
      isConnected: true,
    } as any)

    mockUseChainId.mockReturnValue(1)
  })

  it('should return valuable tokens', async () => {
    const {useValuableTokens} = await import('./use-token-filtering')

    const {result} = renderHook(() => useValuableTokens(mockTokens), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(Array.isArray(result.current.tokens)).toBe(true)
  })
})

describe('useTokenSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()

    // Use type assertion to avoid complex interface matching
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    mockUseAccount.mockReturnValue({
      address: '0x1234567890123456789012345678901234567890' as Address,
      isConnected: true,
    } as any)

    mockUseChainId.mockReturnValue(1)
  })

  it('should provide search functionality', async () => {
    const {useTokenSearch} = await import('./use-token-filtering')

    const {result} = renderHook(() => useTokenSearch(mockTokens, 'ETH'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(Array.isArray(result.current.tokens)).toBe(true)
    expect(Array.isArray(result.current.searchResults)).toBe(true)
    expect(typeof result.current.searchStats.totalResults).toBe('number')
  })
})
