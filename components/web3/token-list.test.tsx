import type {Address} from 'viem'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import {beforeEach, describe, expect, it, vi, type MockedFunction} from 'vitest'
import {useAccount, useChainId, type UseAccountReturnType} from 'wagmi'
import {useTokenDiscovery} from '@/hooks/use-token-discovery'
import {useTokenFiltering} from '@/hooks/use-token-filtering'
import type {DiscoveredToken} from '@/lib/web3/token-discovery'
import {TokenCategory, TokenValueClass} from '@/lib/web3/token-filtering'
import {TokenRiskScore} from '@/lib/web3/token-metadata'

import {TokenList} from './token-list'

// Mock wagmi hooks
vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
  useChainId: vi.fn(),
  useConfig: vi.fn(() => ({})),
}))

// Mock useWallet hook
vi.mock('@/hooks/use-wallet', () => ({
  useWallet: vi.fn(() => ({
    address: '0x1234567890123456789012345678901234567890',
    isConnected: true,
    chainId: 11155111,
    currentNetwork: {id: 11155111, name: 'Sepolia', nativeCurrency: {symbol: 'ETH'}},
    isCurrentChainSupported: true,
    getUnsupportedNetworkError: vi.fn(() => null),
    getSupportedChains: vi.fn(() => [{id: 11155111, name: 'Sepolia'}]),
    isSupportedChain: vi.fn(() => true),
    validateCurrentNetwork: vi.fn(() => ({success: true})),
    handleUnsupportedNetwork: vi.fn(),
  })),
}))

// Mock token hooks
vi.mock('@/hooks/use-token-discovery', () => ({
  useTokenDiscovery: vi.fn(),
}))

vi.mock('@/hooks/use-token-filtering', () => ({
  useTokenFiltering: vi.fn(),
  useTokenCategorizationPreferences: vi.fn(() => ({
    preferences: {
      favoriteTokens: new Set(),
      hiddenTokens: new Set(),
    },
  })),
}))

// Mock @tanstack/react-virtual
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: vi.fn(() => ({
    getTotalSize: () => 400,
    getVirtualItems: () => [
      {key: 'item-0', index: 0, start: 0, size: 80},
      {key: 'item-1', index: 1, start: 80, size: 80},
      {key: 'item-2', index: 2, start: 160, size: 80},
      {key: 'item-3', index: 3, start: 240, size: 80},
      {key: 'item-4', index: 4, start: 320, size: 80},
    ],
  })),
}))

// Mock network imports for consistency
vi.mock('@reown/appkit/networks', () => ({
  mainnet: {id: 1},
  polygon: {id: 137},
  arbitrum: {id: 42161},
  sepolia: {id: 11155111},
}))

const mockUseAccount = useAccount as MockedFunction<typeof useAccount>
const mockUseChainId = useChainId as MockedFunction<typeof useChainId>
const mockUseTokenDiscovery = useTokenDiscovery as MockedFunction<typeof useTokenDiscovery>
const mockUseTokenFiltering = useTokenFiltering as MockedFunction<typeof useTokenFiltering>

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

// Mock token data generators
const createMockDiscoveredToken = (overrides: Partial<DiscoveredToken> = {}): DiscoveredToken => ({
  address: '0xA0b86a33E6aA3D1C81e4f059a5E4b54B94e8a7A2',
  chainId: 11155111,
  symbol: 'TEST',
  name: 'Test Token',
  decimals: 18,
  balance: BigInt('1000000000000000000'),
  formattedBalance: '1.0',
  ...overrides,
})

const createMockCategorizedToken = (overrides = {}) => ({
  address: '0xA0b86a33E6aA3D1C81e4f059a5E4b54B94e8a7A2' as Address,
  chainId: 11155111 as const,
  symbol: 'TEST',
  name: 'Test Token',
  decimals: 18,
  balance: BigInt('1000000000000000000'),
  formattedBalance: '1.0',
  category: TokenCategory.UNKNOWN,
  valueClass: TokenValueClass.UNKNOWN,
  riskScore: TokenRiskScore.LOW,
  spamScore: 10,
  isVerified: false,
  analysisTimestamp: Date.now(),
  confidenceScore: 85,
  ...overrides,
})

const createMockSpamToken = (overrides = {}) =>
  createMockCategorizedToken({
    address: '0xDeAdBeEf00000000000000000000000000000001' as Address,
    symbol: 'SPAM',
    name: 'Free Claim Airdrop',
    category: TokenCategory.SPAM,
    spamScore: 95,
    isVerified: false,
    ...overrides,
  })

describe('TokenList', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock setup
    mockUseAccount.mockReturnValue({
      address: '0x1234567890123456789012345678901234567890',
      isConnected: true,
      chainId: 11155111,
      isConnecting: false,
      isDisconnected: false,
      isReconnecting: false,
      status: 'connected',
    } as unknown as UseAccountReturnType)

    mockUseChainId.mockReturnValue(11155111)

    mockUseTokenDiscovery.mockReturnValue({
      tokens: [],
      isLoading: false,
      error: null,
      isFetching: false,
      isSuccess: true,
      discoveryErrors: [],
      chainsScanned: 1,
      contractsChecked: 0,
      refetch: vi.fn(),
      refresh: vi.fn(),
    })

    mockUseTokenFiltering.mockReturnValue({
      tokens: [],
      isLoading: false,
      error: null,
      isFetching: false,
      isSuccess: true,
      totalTokens: 0,
      filteredTokens: 0,
      errors: [],
      stats: {
        categoryStats: {} as Record<TokenCategory, number>,
        valueStats: {} as Record<TokenValueClass, number>,
        totalValueUSD: 0,
        totalTokens: 0,
      },
      refetch: vi.fn(),
      refresh: vi.fn(),
    })
  })

  describe('Loading States', () => {
    it('renders loading skeleton when discovering tokens', () => {
      mockUseTokenDiscovery.mockReturnValue({
        tokens: [],
        isLoading: true,
        error: null,
        isFetching: true,
        isSuccess: false,
        discoveryErrors: [],
        chainsScanned: 0,
        contractsChecked: 0,
        refetch: vi.fn(),
        refresh: vi.fn(),
      })

      render(<TokenList config={{enableVirtualScrolling: false}} />, {wrapper: createWrapper()})

      expect(screen.getByText('Scanning your wallet…')).toBeInTheDocument()
      expect(screen.getAllByTestId('skeleton')).toHaveLength(30) // 6 skeleton elements × 5 items
    })

    it('renders loading state when filtering tokens', () => {
      mockUseTokenDiscovery.mockReturnValue({
        tokens: [createMockDiscoveredToken()],
        isLoading: false,
        error: null,
        isFetching: false,
        isSuccess: true,
        discoveryErrors: [],
        chainsScanned: 1,
        contractsChecked: 1,
        refetch: vi.fn(),
        refresh: vi.fn(),
      })

      mockUseTokenFiltering.mockReturnValue({
        tokens: [],
        isLoading: true,
        error: null,
        isFetching: true,
        isSuccess: false,
        totalTokens: 0,
        filteredTokens: 0,
        errors: [],
        stats: {
          categoryStats: {} as Record<TokenCategory, number>,
          valueStats: {} as Record<TokenValueClass, number>,
          totalValueUSD: 0,
          totalTokens: 0,
        },
        refetch: vi.fn(),
        refresh: vi.fn(),
      })

      render(<TokenList config={{enableVirtualScrolling: false}} />, {wrapper: createWrapper()})

      expect(screen.getByText('Scanning your wallet…')).toBeInTheDocument()
    })
  })

  describe('Discovery UX States (R9a)', () => {
    it('renders AUTH_MISSING unavailable state with setup guidance and NO retry button', () => {
      mockUseTokenDiscovery.mockReturnValue({
        tokens: [],
        isLoading: false,
        error: null,
        isFetching: false,
        isSuccess: false,
        discoveryErrors: [{type: 'AUTH_MISSING', chainId: 11155111, message: 'API key missing'}],
        chainsScanned: 0,
        contractsChecked: 0,
        refetch: vi.fn(),
        refresh: vi.fn(),
      })

      render(<TokenList config={{enableVirtualScrolling: false}} />, {wrapper: createWrapper()})

      expect(screen.getByText('Token discovery unavailable')).toBeInTheDocument()
      expect(screen.getByText(/NEXT_PUBLIC_ALCHEMY_API_KEY/)).toBeInTheDocument()
      // No retry button — retrying without a key won't help
      expect(screen.queryByRole('button', {name: /Try Again/i})).not.toBeInTheDocument()
    })

    it('renders API_ERROR state with "Could not scan wallet" copy and retry button', () => {
      const mockRefetch = vi.fn()
      mockUseTokenDiscovery.mockReturnValue({
        tokens: [],
        isLoading: false,
        error: null,
        isFetching: false,
        isSuccess: false,
        discoveryErrors: [{type: 'API_ERROR', chainId: 11155111, message: 'Alchemy request failed'}],
        chainsScanned: 0,
        contractsChecked: 0,
        refetch: mockRefetch,
        refresh: vi.fn(),
      })

      render(<TokenList config={{enableVirtualScrolling: false}} />, {wrapper: createWrapper()})

      expect(screen.getByText('Could not scan wallet')).toBeInTheDocument()
      expect(screen.getByRole('button', {name: /Try Again/i})).toBeInTheDocument()
    })

    it('retry button calls refetch on API_ERROR', async () => {
      const user = userEvent.setup()
      const mockRefetch = vi.fn()

      mockUseTokenDiscovery.mockReturnValue({
        tokens: [],
        isLoading: false,
        error: null,
        isFetching: false,
        isSuccess: false,
        discoveryErrors: [{type: 'API_ERROR', chainId: 11155111, message: 'Alchemy request failed'}],
        chainsScanned: 0,
        contractsChecked: 0,
        refetch: mockRefetch,
        refresh: vi.fn(),
      })

      render(<TokenList config={{enableVirtualScrolling: false}} />, {wrapper: createWrapper()})

      await user.click(screen.getByRole('button', {name: /Try Again/i}))
      expect(mockRefetch).toHaveBeenCalledTimes(1)
    })

    it('renders empty-success state with neutral copy distinct from error and unavailable', () => {
      mockUseTokenDiscovery.mockReturnValue({
        tokens: [],
        isLoading: false,
        error: null,
        isFetching: false,
        isSuccess: true,
        discoveryErrors: [],
        chainsScanned: 1,
        contractsChecked: 0,
        refetch: vi.fn(),
        refresh: vi.fn(),
      })

      render(<TokenList config={{enableVirtualScrolling: false}} />, {wrapper: createWrapper()})

      // Must use the exact empty-success copy — not error copy, not unavailable copy
      expect(screen.getByText('No disposable tokens found in this wallet')).toBeInTheDocument()
      expect(screen.getByText(/Scan completed successfully/)).toBeInTheDocument()

      // Must NOT show error or unavailable copy
      expect(screen.queryByText('Could not scan wallet')).not.toBeInTheDocument()
      expect(screen.queryByText('Token discovery unavailable')).not.toBeInTheDocument()
      // No retry button on empty-success
      expect(screen.queryByRole('button', {name: /Try Again/i})).not.toBeInTheDocument()
    })

    it('AUTH_MISSING and API_ERROR states render distinct copy (not conflated)', () => {
      // AUTH_MISSING
      mockUseTokenDiscovery.mockReturnValue({
        tokens: [],
        isLoading: false,
        error: null,
        isFetching: false,
        isSuccess: false,
        discoveryErrors: [{type: 'AUTH_MISSING', chainId: 11155111, message: 'key missing'}],
        chainsScanned: 0,
        contractsChecked: 0,
        refetch: vi.fn(),
        refresh: vi.fn(),
      })

      const {unmount} = render(<TokenList config={{enableVirtualScrolling: false}} />, {wrapper: createWrapper()})
      expect(screen.getByText('Token discovery unavailable')).toBeInTheDocument()
      expect(screen.queryByText('Could not scan wallet')).not.toBeInTheDocument()
      unmount()

      // API_ERROR
      mockUseTokenDiscovery.mockReturnValue({
        tokens: [],
        isLoading: false,
        error: null,
        isFetching: false,
        isSuccess: false,
        discoveryErrors: [{type: 'API_ERROR', chainId: 11155111, message: 'api error'}],
        chainsScanned: 0,
        contractsChecked: 0,
        refetch: vi.fn(),
        refresh: vi.fn(),
      })

      render(<TokenList config={{enableVirtualScrolling: false}} />, {wrapper: createWrapper()})
      expect(screen.getByText('Could not scan wallet')).toBeInTheDocument()
      expect(screen.queryByText('Token discovery unavailable')).not.toBeInTheDocument()
    })
  })

  describe('Error States', () => {
    it('renders error state when token discovery fails (hook-level error)', () => {
      const mockRefetch = vi.fn()
      mockUseTokenDiscovery.mockReturnValue({
        tokens: [],
        isLoading: false,
        error: new Error('Network error'),
        isFetching: false,
        isSuccess: false,
        discoveryErrors: [],
        chainsScanned: 0,
        contractsChecked: 0,
        refetch: mockRefetch,
        refresh: vi.fn(),
      })

      render(<TokenList config={{enableVirtualScrolling: false}} />, {wrapper: createWrapper()})

      expect(screen.getByText('Could not scan wallet')).toBeInTheDocument()
      expect(screen.getByText('Network error')).toBeInTheDocument()
      expect(screen.getByRole('button', {name: /Try Again/i})).toBeInTheDocument()
    })

    it('handles retry on error', async () => {
      const user = userEvent.setup()
      const mockRefetch = vi.fn()

      mockUseTokenDiscovery.mockReturnValue({
        tokens: [],
        isLoading: false,
        error: new Error('Network error'),
        isFetching: false,
        isSuccess: false,
        discoveryErrors: [],
        chainsScanned: 0,
        contractsChecked: 0,
        refetch: mockRefetch,
        refresh: vi.fn(),
      })

      render(<TokenList config={{enableVirtualScrolling: false}} />, {wrapper: createWrapper()})

      const retryButton = screen.getByRole('button', {name: /Try Again/i})
      await user.click(retryButton)

      expect(mockRefetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('Empty States', () => {
    it('renders empty state when no tokens are found', () => {
      render(<TokenList config={{enableVirtualScrolling: false}} />, {wrapper: createWrapper()})

      expect(screen.getByText('No disposable tokens found in this wallet')).toBeInTheDocument()
      expect(screen.getByText(/Scan completed successfully/)).toBeInTheDocument()
    })

    it('renders search-specific empty state', async () => {
      // Render with a pre-set search query that results in no matches
      render(<TokenList searchQuery="nonexistent" />, {wrapper: createWrapper()})

      expect(screen.getByText('No Tokens Found')).toBeInTheDocument()
      expect(screen.getByText(/No tokens match "nonexistent"/)).toBeInTheDocument()
      expect(screen.getByRole('button', {name: 'Clear Search'})).toBeInTheDocument()
    })

    it('clears search when clear search button is clicked', async () => {
      const user = userEvent.setup()
      const mockTokens = [createMockCategorizedToken()]

      // Setup tokens first so search interface renders
      mockUseTokenFiltering.mockReturnValue({
        tokens: mockTokens,
        isLoading: false,
        error: null,
        isFetching: false,
        isSuccess: true,
        totalTokens: 1,
        filteredTokens: 1,
        errors: [],
        stats: {
          categoryStats: {[TokenCategory.UNKNOWN]: 1} as Record<TokenCategory, number>,
          valueStats: {[TokenValueClass.UNKNOWN]: 1} as Record<TokenValueClass, number>,
          totalValueUSD: 100,
          totalTokens: 1,
        },
        refetch: vi.fn(),
        refresh: vi.fn(),
      })

      render(<TokenList config={{enableVirtualScrolling: false}} />, {wrapper: createWrapper()})

      const searchInput = screen.getByPlaceholderText('Search tokens...')
      await user.type(searchInput, 'test')

      await waitFor(() => {
        expect(screen.getByDisplayValue('test')).toBeInTheDocument()
      })

      await user.clear(searchInput)

      await waitFor(() => {
        expect(screen.getByDisplayValue('')).toBeInTheDocument()
      })
    })
  })

  describe('Token Display', () => {
    it('renders token list with tokens', () => {
      const mockTokens = [
        createMockCategorizedToken({
          symbol: 'ETH',
          name: 'Ethereum',
          category: TokenCategory.VALUABLE,
        }),
        createMockCategorizedToken({
          address: '0xA0b86a33E6aA3D1C81e4f059a5E4b54B94e8a7A3',
          symbol: 'USDC',
          name: 'USD Coin',
          category: TokenCategory.VALUABLE,
        }),
      ]

      mockUseTokenFiltering.mockReturnValue({
        tokens: mockTokens,
        isLoading: false,
        error: null,
        isFetching: false,
        isSuccess: true,
        totalTokens: 2,
        filteredTokens: 2,
        errors: [],
        stats: {
          categoryStats: {} as Record<TokenCategory, number>,
          valueStats: {} as Record<TokenValueClass, number>,
          totalValueUSD: 0,
          totalTokens: 2,
        },
        refetch: vi.fn(),
        refresh: vi.fn(),
      })

      render(<TokenList config={{enableVirtualScrolling: false}} />, {wrapper: createWrapper()})

      expect(screen.getAllByText('ETH')).toHaveLength(3) // Symbol appears in multiple places per token
      expect(screen.getByText('Ethereum')).toBeInTheDocument()
      expect(screen.getByText('USDC')).toBeInTheDocument()
      expect(screen.getByText('USD Coin')).toBeInTheDocument()
      expect(screen.getByText('2 tokens')).toBeInTheDocument()
    })

    it('handles virtual scrolling mode', () => {
      const mockTokens = Array.from({length: 100}, (_, index) =>
        createMockCategorizedToken({
          address: `0x${'a'.repeat(39)}${index}` as Address,
          symbol: `TOK${index}`,
          name: `Token ${index}`,
        }),
      )

      mockUseTokenFiltering.mockReturnValue({
        tokens: mockTokens,
        isLoading: false,
        error: null,
        isFetching: false,
        isSuccess: true,
        totalTokens: 100,
        filteredTokens: 100,
        errors: [],
        stats: {
          categoryStats: {} as Record<TokenCategory, number>,
          valueStats: {} as Record<TokenValueClass, number>,
          totalValueUSD: 0,
          totalTokens: 100,
        },
        refetch: vi.fn(),
        refresh: vi.fn(),
      })

      render(
        <TokenList
          config={{
            enableVirtualScrolling: true,
            itemHeight: 80,
          }}
        />,
        {wrapper: createWrapper()},
      )

      // Only first few tokens should be rendered (virtual scrolling)
      expect(screen.getByText('TOK0')).toBeInTheDocument()
      expect(screen.getByText('TOK1')).toBeInTheDocument()
      // Last tokens should not be in DOM
      expect(screen.queryByText('TOK99')).not.toBeInTheDocument()
    })
  })

  describe('Spam Badge and Filter (R6, R9b)', () => {
    it('renders spam badge on suspected-spam tokens', () => {
      const spamToken = createMockSpamToken()
      const normalToken = createMockCategorizedToken({
        address: '0xA0b86a33E6aA3D1C81e4f059a5E4b54B94e8a7A3' as Address,
        symbol: 'GOOD',
        name: 'Good Token',
        category: TokenCategory.UNKNOWN,
        spamScore: 5,
      })

      mockUseTokenFiltering.mockReturnValue({
        tokens: [normalToken, spamToken],
        isLoading: false,
        error: null,
        isFetching: false,
        isSuccess: true,
        totalTokens: 2,
        filteredTokens: 2,
        errors: [],
        stats: {
          categoryStats: {} as Record<TokenCategory, number>,
          valueStats: {} as Record<TokenValueClass, number>,
          totalValueUSD: 0,
          totalTokens: 2,
        },
        refetch: vi.fn(),
        refresh: vi.fn(),
      })

      render(<TokenList config={{enableVirtualScrolling: false}} />, {wrapper: createWrapper()})

      // Spam badge should appear for the spam token
      expect(screen.getByText('Suspected Spam')).toBeInTheDocument()
    })

    it('spam filter segmented control renders All / Non-spam / Spam tabs', () => {
      const mockTokens = [createMockCategorizedToken()]

      mockUseTokenFiltering.mockReturnValue({
        tokens: mockTokens,
        isLoading: false,
        error: null,
        isFetching: false,
        isSuccess: true,
        totalTokens: 1,
        filteredTokens: 1,
        errors: [],
        stats: {
          categoryStats: {} as Record<TokenCategory, number>,
          valueStats: {} as Record<TokenValueClass, number>,
          totalValueUSD: 0,
          totalTokens: 1,
        },
        refetch: vi.fn(),
        refresh: vi.fn(),
      })

      render(<TokenList config={{enableVirtualScrolling: false}} />, {wrapper: createWrapper()})

      // The spam filter tabs are plain <button> elements (not design-system Buttons)
      // Use getAllByRole to handle multiple matches and check at least one exists
      const allButtons = screen.getAllByRole('button')
      const buttonTexts = allButtons.map(b => b.textContent ?? '')
      expect(buttonTexts.some(t => t.includes('All'))).toBe(true)
      expect(buttonTexts.some(t => t.includes('Non-spam'))).toBe(true)
      expect(buttonTexts.some(t => t.includes('Spam'))).toBe(true)
    })

    it('spam tokens are NOT auto-selected (default selection is empty)', () => {
      const onSelectionChange = vi.fn()
      const spamToken = createMockSpamToken()
      const normalToken = createMockCategorizedToken({
        address: '0xA0b86a33E6aA3D1C81e4f059a5E4b54B94e8a7A3' as Address,
        symbol: 'GOOD',
        name: 'Good Token',
        category: TokenCategory.UNKNOWN,
        spamScore: 5,
      })

      mockUseTokenFiltering.mockReturnValue({
        tokens: [normalToken, spamToken],
        isLoading: false,
        error: null,
        isFetching: false,
        isSuccess: true,
        totalTokens: 2,
        filteredTokens: 2,
        errors: [],
        stats: {
          categoryStats: {} as Record<TokenCategory, number>,
          valueStats: {} as Record<TokenValueClass, number>,
          totalValueUSD: 0,
          totalTokens: 2,
        },
        refetch: vi.fn(),
        refresh: vi.fn(),
      })

      render(
        <TokenList
          config={{enableBatchSelection: true, enableVirtualScrolling: false}}
          onTokenSelectionChange={onSelectionChange}
        />,
        {wrapper: createWrapper()},
      )

      // No tokens should be selected by default
      expect(onSelectionChange).not.toHaveBeenCalled()
    })

    it('select-all excludes suspected-spam tokens (R9b)', async () => {
      const user = userEvent.setup()
      const onSelectionChange = vi.fn()

      const spamToken = createMockSpamToken({
        address: '0xDeAdBeEf00000000000000000000000000000001' as Address,
      })
      const normalToken = createMockCategorizedToken({
        address: '0xA0b86a33E6aA3D1C81e4f059a5E4b54B94e8a7A3' as Address,
        symbol: 'GOOD',
        name: 'Good Token',
        category: TokenCategory.UNKNOWN,
        spamScore: 5,
      })

      mockUseTokenFiltering.mockReturnValue({
        tokens: [normalToken, spamToken],
        isLoading: false,
        error: null,
        isFetching: false,
        isSuccess: true,
        totalTokens: 2,
        filteredTokens: 2,
        errors: [],
        stats: {
          categoryStats: {} as Record<TokenCategory, number>,
          valueStats: {} as Record<TokenValueClass, number>,
          totalValueUSD: 0,
          totalTokens: 2,
        },
        refetch: vi.fn(),
        refresh: vi.fn(),
      })

      render(
        <TokenList
          config={{enableBatchSelection: true, enableVirtualScrolling: false}}
          onTokenSelectionChange={onSelectionChange}
        />,
        {wrapper: createWrapper()},
      )

      const selectAllButton = screen.getByRole('button', {name: 'Select All'})
      await user.click(selectAllButton)

      // Only the non-spam token should be selected
      expect(onSelectionChange).toHaveBeenCalledWith([normalToken.address])
      // Spam token address must NOT be in the selection
      expect(onSelectionChange).not.toHaveBeenCalledWith(expect.arrayContaining([spamToken.address]))
    })

    it('high-spamScore token (>70) is also excluded from select-all', async () => {
      const user = userEvent.setup()
      const onSelectionChange = vi.fn()

      // spamScore > 70 but category !== SPAM — still suspected spam
      const highScoreToken = createMockCategorizedToken({
        address: '0xDeAdBeEf00000000000000000000000000000002' as Address,
        symbol: 'RISKY',
        name: 'Risky Token',
        category: TokenCategory.UNKNOWN,
        spamScore: 80,
      })
      const normalToken = createMockCategorizedToken({
        address: '0xA0b86a33E6aA3D1C81e4f059a5E4b54B94e8a7A3' as Address,
        symbol: 'GOOD',
        name: 'Good Token',
        category: TokenCategory.UNKNOWN,
        spamScore: 5,
      })

      mockUseTokenFiltering.mockReturnValue({
        tokens: [normalToken, highScoreToken],
        isLoading: false,
        error: null,
        isFetching: false,
        isSuccess: true,
        totalTokens: 2,
        filteredTokens: 2,
        errors: [],
        stats: {
          categoryStats: {} as Record<TokenCategory, number>,
          valueStats: {} as Record<TokenValueClass, number>,
          totalValueUSD: 0,
          totalTokens: 2,
        },
        refetch: vi.fn(),
        refresh: vi.fn(),
      })

      render(
        <TokenList
          config={{enableBatchSelection: true, enableVirtualScrolling: false}}
          onTokenSelectionChange={onSelectionChange}
        />,
        {wrapper: createWrapper()},
      )

      await user.click(screen.getByRole('button', {name: 'Select All'}))

      expect(onSelectionChange).toHaveBeenCalledWith([normalToken.address])
      expect(onSelectionChange).not.toHaveBeenCalledWith(expect.arrayContaining([highScoreToken.address]))
    })
  })

  describe('Search Functionality', () => {
    it('filters tokens based on search query', async () => {
      const user = userEvent.setup()
      const mockTokens = [
        createMockCategorizedToken({symbol: 'ETH', name: 'Ethereum'}),
        createMockCategorizedToken({
          address: '0xA0b86a33E6aA3D1C81e4f059a5E4b54B94e8a7A3',
          symbol: 'USDC',
          name: 'USD Coin',
        }),
      ]

      // Initially show all tokens
      mockUseTokenFiltering.mockReturnValue({
        tokens: mockTokens,
        isLoading: false,
        error: null,
        isFetching: false,
        isSuccess: true,
        totalTokens: 2,
        filteredTokens: 2,
        errors: [],
        stats: {
          categoryStats: {} as Record<TokenCategory, number>,
          valueStats: {} as Record<TokenValueClass, number>,
          totalValueUSD: 0,
          totalTokens: 2,
        },
        refetch: vi.fn(),
        refresh: vi.fn(),
      })

      render(<TokenList config={{enableVirtualScrolling: false}} />, {wrapper: createWrapper()})

      const searchInput = screen.getByPlaceholderText('Search tokens...')
      await user.type(searchInput, 'ETH')

      // The hook should be called with search query
      expect(mockUseTokenFiltering).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({searchQuery: 'ETH'}),
        expect.any(Object),
      )
    })

    it('resets pagination when searching', async () => {
      const user = userEvent.setup()
      const mockTokens = Array.from({length: 100}, (_, i) =>
        createMockCategorizedToken({
          address: `0x${i.toString().padStart(40, '0')}`,
          symbol: `TOK${i}`,
          name: `Token ${i}`,
        }),
      )

      mockUseTokenFiltering.mockReturnValue({
        tokens: mockTokens,
        isLoading: false,
        error: null,
        isFetching: false,
        isSuccess: true,
        totalTokens: 100,
        filteredTokens: 100,
        errors: [],
        stats: {
          categoryStats: {[TokenCategory.UNKNOWN]: 100} as Record<TokenCategory, number>,
          valueStats: {[TokenValueClass.UNKNOWN]: 100} as Record<TokenValueClass, number>,
          totalValueUSD: 10000,
          totalTokens: 100,
        },
        refetch: vi.fn(),
        refresh: vi.fn(),
      })

      render(<TokenList config={{enablePagination: true, itemsPerPage: 20}} />, {wrapper: createWrapper()})

      const searchInput = screen.getByPlaceholderText('Search tokens...')
      await user.type(searchInput, 'test')

      // Should reset to page 1 when search changes
      expect(screen.getByText(/Page 1/)).toBeInTheDocument()
    })
  })

  describe('Sorting', () => {
    it('handles sorting by balance', async () => {
      const user = userEvent.setup()
      const mockTokens = [createMockCategorizedToken()]

      mockUseTokenFiltering.mockReturnValue({
        tokens: mockTokens,
        isLoading: false,
        error: null,
        isFetching: false,
        isSuccess: true,
        totalTokens: 1,
        filteredTokens: 1,
        errors: [],
        stats: {
          categoryStats: {} as Record<TokenCategory, number>,
          valueStats: {} as Record<TokenValueClass, number>,
          totalValueUSD: 0,
          totalTokens: 1,
        },
        refetch: vi.fn(),
        refresh: vi.fn(),
      })

      render(<TokenList config={{enableVirtualScrolling: false}} />, {wrapper: createWrapper()})

      const balanceButton = screen.getByRole('button', {name: /Balance/})
      await user.click(balanceButton)

      // Should trigger filtering with new sort order
      expect(mockUseTokenFiltering).toHaveBeenCalledWith(
        expect.any(Array),
        expect.any(Object),
        expect.objectContaining({field: 'balance', direction: 'asc'}),
      )
    })

    it('toggles sort direction when clicking same field', async () => {
      const user = userEvent.setup()
      const mockTokens = [createMockCategorizedToken()]

      mockUseTokenFiltering.mockReturnValue({
        tokens: mockTokens,
        isLoading: false,
        error: null,
        isFetching: false,
        isSuccess: true,
        totalTokens: 1,
        filteredTokens: 1,
        errors: [],
        stats: {
          categoryStats: {} as Record<TokenCategory, number>,
          valueStats: {} as Record<TokenValueClass, number>,
          totalValueUSD: 0,
          totalTokens: 1,
        },
        refetch: vi.fn(),
        refresh: vi.fn(),
      })

      render(<TokenList config={{enableVirtualScrolling: false}} />, {wrapper: createWrapper()})

      const balanceButton = screen.getByRole('button', {name: /Balance/})

      // First click should sort ascending
      await user.click(balanceButton)
      // Second click should sort descending
      await user.click(balanceButton)

      expect(mockUseTokenFiltering).toHaveBeenLastCalledWith(
        expect.any(Array),
        expect.any(Object),
        expect.objectContaining({field: 'balance', direction: 'desc'}),
      )
    })
  })

  describe('Batch Selection', () => {
    it('enables batch selection when configured', () => {
      const mockTokens = [createMockCategorizedToken()]

      mockUseTokenFiltering.mockReturnValue({
        tokens: mockTokens,
        isLoading: false,
        error: null,
        isFetching: false,
        isSuccess: true,
        totalTokens: 1,
        filteredTokens: 1,
        errors: [],
        stats: {
          categoryStats: {} as Record<TokenCategory, number>,
          valueStats: {} as Record<TokenValueClass, number>,
          totalValueUSD: 0,
          totalTokens: 1,
        },
        refetch: vi.fn(),
        refresh: vi.fn(),
      })

      render(
        <TokenList
          config={{
            enableBatchSelection: true,
            enableVirtualScrolling: false,
          }}
        />,
        {wrapper: createWrapper()},
      )

      expect(screen.getByRole('button', {name: 'Select All'})).toBeInTheDocument()
    })

    it('handles select all functionality (non-spam tokens only)', async () => {
      const user = userEvent.setup()
      const onSelectionChange = vi.fn()
      const mockTokens = [
        createMockCategorizedToken({symbol: 'ETH'}),
        createMockCategorizedToken({
          address: '0xA0b86a33E6aA3D1C81e4f059a5E4b54B94e8a7A3',
          symbol: 'USDC',
        }),
      ]

      mockUseTokenFiltering.mockReturnValue({
        tokens: mockTokens,
        isLoading: false,
        error: null,
        isFetching: false,
        isSuccess: true,
        totalTokens: 2,
        filteredTokens: 2,
        errors: [],
        stats: {
          categoryStats: {} as Record<TokenCategory, number>,
          valueStats: {} as Record<TokenValueClass, number>,
          totalValueUSD: 0,
          totalTokens: 2,
        },
        refetch: vi.fn(),
        refresh: vi.fn(),
      })

      render(
        <TokenList
          config={{enableBatchSelection: true, enableVirtualScrolling: false}}
          onTokenSelectionChange={onSelectionChange}
        />,
        {
          wrapper: createWrapper(),
        },
      )

      const selectAllButton = screen.getByRole('button', {name: 'Select All'})
      await user.click(selectAllButton)

      expect(onSelectionChange).toHaveBeenCalledWith([
        '0xA0b86a33E6aA3D1C81e4f059a5E4b54B94e8a7A2',
        '0xA0b86a33E6aA3D1C81e4f059a5E4b54B94e8a7A3',
      ])
    })
  })

  describe('Pagination', () => {
    it('displays pagination when enabled and needed', () => {
      const mockTokens = Array.from({length: 100}, (_, index) =>
        createMockCategorizedToken({
          address: `0x${'a'.repeat(39)}${index}` as Address,
          symbol: `TOK${index}`,
        }),
      )

      mockUseTokenFiltering.mockReturnValue({
        tokens: mockTokens,
        isLoading: false,
        error: null,
        isFetching: false,
        isSuccess: true,
        totalTokens: 100,
        filteredTokens: 100,
        errors: [],
        stats: {
          categoryStats: {} as Record<TokenCategory, number>,
          valueStats: {} as Record<TokenValueClass, number>,
          totalValueUSD: 0,
          totalTokens: 100,
        },
        refetch: vi.fn(),
        refresh: vi.fn(),
      })

      render(
        <TokenList
          config={{
            enablePagination: true,
            itemsPerPage: 10,
          }}
        />,
        {wrapper: createWrapper()},
      )

      expect(screen.getByText('1 of 10')).toBeInTheDocument()
      expect(screen.getByText('Showing 1-10 of 100 tokens')).toBeInTheDocument()
      expect(screen.getByRole('button', {name: /Next/})).toBeInTheDocument()
      expect(screen.getByRole('button', {name: /Previous/})).toBeInTheDocument()
    })

    it('handles page navigation', async () => {
      const user = userEvent.setup()
      const mockTokens = Array.from({length: 100}, (_, index) =>
        createMockCategorizedToken({
          address: `0x${'a'.repeat(39)}${index}` as Address,
          symbol: `TOK${index}`,
        }),
      )

      mockUseTokenFiltering.mockReturnValue({
        tokens: mockTokens,
        isLoading: false,
        error: null,
        isFetching: false,
        isSuccess: true,
        totalTokens: 100,
        filteredTokens: 100,
        errors: [],
        stats: {
          categoryStats: {} as Record<TokenCategory, number>,
          valueStats: {} as Record<TokenValueClass, number>,
          totalValueUSD: 0,
          totalTokens: 100,
        },
        refetch: vi.fn(),
        refresh: vi.fn(),
      })

      render(
        <TokenList
          config={{
            enablePagination: true,
            itemsPerPage: 10,
          }}
        />,
        {wrapper: createWrapper()},
      )

      const nextButton = screen.getByRole('button', {name: /Next/})
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText('2 of 10')).toBeInTheDocument()
        expect(screen.getByText('Showing 11-20 of 100 tokens')).toBeInTheDocument()
      })
    })
  })

  describe('Privacy Disclosure (R9d)', () => {
    it('renders Alchemy privacy disclosure in the populated state', () => {
      const mockTokens = [createMockCategorizedToken()]

      mockUseTokenFiltering.mockReturnValue({
        tokens: mockTokens,
        isLoading: false,
        error: null,
        isFetching: false,
        isSuccess: true,
        totalTokens: 1,
        filteredTokens: 1,
        errors: [],
        stats: {
          categoryStats: {} as Record<TokenCategory, number>,
          valueStats: {} as Record<TokenValueClass, number>,
          totalValueUSD: 0,
          totalTokens: 1,
        },
        refetch: vi.fn(),
        refresh: vi.fn(),
      })

      render(<TokenList config={{enableVirtualScrolling: false}} />, {wrapper: createWrapper()})

      expect(screen.getByText(/Token discovery uses Alchemy to read your wallet's token balances/)).toBeInTheDocument()
      expect(screen.getByText(/Your wallet address is shared with Alchemy for this purpose/)).toBeInTheDocument()
    })
  })

  describe('Configuration Options', () => {
    it('disables features when configured', () => {
      render(
        <TokenList
          config={{
            enableSearch: false,
            enableSorting: false,
            enableFiltering: false,
            enableBatchSelection: false,
          }}
        />,
        {wrapper: createWrapper()},
      )

      expect(screen.queryByPlaceholderText('Search tokens...')).not.toBeInTheDocument()
      expect(screen.queryByRole('button', {name: /Balance/})).not.toBeInTheDocument()
      expect(screen.queryByRole('button', {name: /Filter/})).not.toBeInTheDocument()
      expect(screen.queryByRole('button', {name: 'Select All'})).not.toBeInTheDocument()
    })

    it('applies custom CSS classes', () => {
      const {container} = render(<TokenList className="custom-class" />, {wrapper: createWrapper()})

      expect(container.firstChild).toHaveClass('custom-class')
    })
  })
})
