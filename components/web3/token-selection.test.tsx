import type {CategorizedToken} from '@/lib/web3/token-filtering'
import type {Address} from 'viem'
import {TokenCategory, TokenValueClass} from '@/lib/web3/token-filtering'
import {TokenRiskScore} from '@/lib/web3/token-metadata'

import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import {beforeEach, describe, expect, it, vi, type MockedFunction} from 'vitest'
import {useAccount, useChainId, type UseAccountReturnType} from 'wagmi'

import {TokenSelection, type BatchOperation, type TokenSelectionProps} from './token-selection'

// Mock wagmi hooks
vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
  useChainId: vi.fn(),
  useConfig: vi.fn(() => ({})),
}))

// Mock localStorage for persistence testing
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

// Replace global localStorage with our mock
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

describe('TokenSelection', () => {
  // Mock hooks
  const mockUseAccount = useAccount as MockedFunction<typeof useAccount>
  const mockUseChainId = useChainId as MockedFunction<typeof useChainId>

  // Test data
  const mockTokens: CategorizedToken[] = [
    {
      address: '0x1234567890123456789012345678901234567890' as Address,
      chainId: 1,
      symbol: 'TEST1',
      name: 'Test Token 1',
      decimals: 18,
      balance: BigInt('1000000000000000000'), // 1 token
      formattedBalance: '1.0',
      category: TokenCategory.VALUABLE,
      valueClass: TokenValueClass.HIGH_VALUE,
      riskScore: TokenRiskScore.LOW,
      spamScore: 10,
      isVerified: true,
      estimatedValueUSD: 100,
      priceUSD: 100,
      analysisTimestamp: Date.now(),
      confidenceScore: 95,
    },
    {
      address: '0x2345678901234567890123456789012345678901' as Address,
      chainId: 1,
      symbol: 'SPAM1',
      name: 'Spam Token 1',
      decimals: 18,
      balance: BigInt('500000000000000000'), // 0.5 tokens
      formattedBalance: '0.5',
      category: TokenCategory.SPAM,
      valueClass: TokenValueClass.DUST,
      riskScore: TokenRiskScore.HIGH,
      spamScore: 85,
      isVerified: false,
      estimatedValueUSD: 0.001,
      analysisTimestamp: Date.now(),
      confidenceScore: 90,
    },
    {
      address: '0x3456789012345678901234567890123456789012' as Address,
      chainId: 1,
      symbol: 'DUST1',
      name: 'Dust Token 1',
      decimals: 18,
      balance: BigInt('100000000000000'), // 0.0001 tokens
      formattedBalance: '0.0001',
      category: TokenCategory.DUST,
      valueClass: TokenValueClass.DUST,
      riskScore: TokenRiskScore.MEDIUM,
      spamScore: 30,
      isVerified: false,
      estimatedValueUSD: 0.005,
      analysisTimestamp: Date.now(),
      confidenceScore: 75,
    },
    {
      address: '0x4567890123456789012345678901234567890123' as Address,
      chainId: 1,
      symbol: 'UNW1',
      name: 'Unwanted Token 1',
      decimals: 18,
      balance: BigInt('2000000000000000000'), // 2 tokens
      formattedBalance: '2.0',
      category: TokenCategory.UNWANTED,
      valueClass: TokenValueClass.LOW_VALUE,
      riskScore: TokenRiskScore.MEDIUM,
      spamScore: 45,
      isVerified: true,
      estimatedValueUSD: 5.5,
      analysisTimestamp: Date.now(),
      confidenceScore: 80,
    },
    {
      address: '0x5678901234567890123456789012345678901234' as Address,
      chainId: 1,
      symbol: 'FAV1',
      name: 'Favorite Token 1',
      decimals: 18,
      balance: BigInt('750000000000000000'), // 0.75 tokens
      formattedBalance: '0.75',
      category: TokenCategory.VALUABLE,
      valueClass: TokenValueClass.MEDIUM_VALUE,
      riskScore: TokenRiskScore.LOW,
      spamScore: 5,
      isVerified: true,
      estimatedValueUSD: 50,
      isUserFavorite: true,
      userNotes: 'This is my favorite token',
      analysisTimestamp: Date.now(),
      confidenceScore: 98,
    },
  ]

  const mockBatchOperations: BatchOperation[] = [
    {
      id: 'mark-as-spam',
      label: 'Mark as Spam',
      description: 'Mark selected tokens as spam',
      icon: <div>spam-icon</div>,
      action: vi.fn(),
      variant: 'error',
    },
    {
      id: 'mark-as-unwanted',
      label: 'Mark as Unwanted',
      description: 'Mark selected tokens as unwanted for disposal',
      icon: <div>unwanted-icon</div>,
      action: vi.fn(),
      variant: 'warning',
    },
    {
      id: 'add-to-favorites',
      label: 'Add to Favorites',
      description: 'Add selected tokens to favorites',
      icon: <div>favorite-icon</div>,
      action: vi.fn(),
    },
    {
      id: 'batch-approval',
      label: 'Batch Approval',
      description: 'Approve selected tokens for disposal',
      icon: <div>approval-icon</div>,
      action: vi.fn(),
      requiresConfirmation: true,
      confirmationText: 'This will approve all selected tokens for disposal. Continue?',
    },
  ]

  const defaultProps: TokenSelectionProps = {
    tokens: mockTokens,
    selectedTokens: [],
    onSelectionChange: vi.fn(),
    batchOperations: mockBatchOperations,
  }

  // Query client for React Query
  let queryClient: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()

    // Reset localStorage mock
    mockLocalStorage.getItem.mockReturnValue(null)
    mockLocalStorage.setItem.mockImplementation(() => {})

    // Setup default wagmi mocks
    mockUseAccount.mockReturnValue({
      address: '0x1234567890123456789012345678901234567890' as Address,
      isConnected: true,
      chainId: 1,
    } as UseAccountReturnType)

    mockUseChainId.mockReturnValue(1)

    // Create fresh query client for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {retry: false},
        mutations: {retry: false},
      },
    })
  })

  const renderWithProviders = (props: Partial<TokenSelectionProps> = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <TokenSelection {...defaultProps} {...props} />
      </QueryClientProvider>,
    )
  }

  describe('Component Rendering', () => {
    it('should render the component with default configuration', () => {
      renderWithProviders()

      expect(screen.getByText('Batch Selection')).toBeInTheDocument()
      expect(screen.getByText(`0 of ${mockTokens.length} tokens selected`)).toBeInTheDocument()
    })

    it('should show loading state when loading prop is true', () => {
      renderWithProviders({loading: true})

      expect(screen.getByTestId('loading-skeleton')).toHaveClass('animate-pulse')
      expect(screen.queryByText('Batch Selection')).not.toBeInTheDocument()
    })

    it('should render quick selection presets by default', () => {
      renderWithProviders()

      expect(screen.getByText('Quick Selection')).toBeInTheDocument()
      expect(screen.getByText('Spam Tokens')).toBeInTheDocument()
      expect(screen.getByText('Dust Tokens')).toBeInTheDocument()
      expect(screen.getByText('Unwanted Tokens')).toBeInTheDocument()
      expect(screen.getByText('Low Value (<$1)')).toBeInTheDocument()
      expect(screen.getByText('High Risk Tokens')).toBeInTheDocument()
      expect(screen.getByText('Non-Favorites')).toBeInTheDocument()
    })

    it('should not render quick selection when disabled', () => {
      renderWithProviders({
        config: {enableQuickSelection: false},
      })

      expect(screen.queryByText('Quick Selection')).not.toBeInTheDocument()
    })

    it('should render advanced filtering section', () => {
      renderWithProviders()

      expect(screen.getByText('Advanced Selection')).toBeInTheDocument()
    })

    it('should not render advanced filtering when disabled', () => {
      renderWithProviders({
        config: {enableAdvancedFiltering: false},
      })

      expect(screen.queryByText('Advanced Selection')).not.toBeInTheDocument()
    })
  })

  describe('Selection State Management', () => {
    it('should display current selection count', () => {
      const selectedTokens = [mockTokens[0].address, mockTokens[1].address]
      renderWithProviders({selectedTokens})

      expect(screen.getByText(`${selectedTokens.length} of ${mockTokens.length} tokens selected`)).toBeInTheDocument()
    })

    it('should show selection statistics when tokens are selected', () => {
      const selectedTokens = [mockTokens[0].address, mockTokens[1].address]
      renderWithProviders({selectedTokens})

      expect(screen.getByText('Total Value')).toBeInTheDocument()
      expect(screen.getByText('Avg Risk')).toBeInTheDocument()
      expect(screen.getByText('Valuable')).toBeInTheDocument()
      expect(screen.getByText('Unwanted')).toBeInTheDocument()
    })

    it('should not show statistics when disabled', () => {
      const selectedTokens = [mockTokens[0].address]
      renderWithProviders({
        selectedTokens,
        config: {showSelectionStats: false},
      })

      expect(screen.queryByText('Total Value')).not.toBeInTheDocument()
    })

    it('should call onSelectionChange when clear button is clicked', async () => {
      const onSelectionChange = vi.fn()
      const selectedTokens = [mockTokens[0].address]
      renderWithProviders({selectedTokens, onSelectionChange})

      const clearButton = screen.getByRole('button', {name: /clear/i})
      await userEvent.click(clearButton)

      expect(onSelectionChange).toHaveBeenCalledWith([])
    })

    it('should call onSelectionChange when invert button is clicked', async () => {
      const onSelectionChange = vi.fn()
      const selectedTokens = [mockTokens[0].address]
      renderWithProviders({selectedTokens, onSelectionChange})

      const invertButton = screen.getByRole('button', {name: /invert/i})
      await userEvent.click(invertButton)

      const expectedSelection = mockTokens.slice(1).map(token => token.address)
      expect(onSelectionChange).toHaveBeenCalledWith(expectedSelection)
    })
  })

  describe('Quick Selection Presets', () => {
    it('should select spam tokens when spam preset is clicked', async () => {
      const onSelectionChange = vi.fn()
      renderWithProviders({onSelectionChange})

      const spamButton = screen.getByText('Spam Tokens').closest('button')!
      await userEvent.click(spamButton)

      const spamTokens = mockTokens.filter(token => token.category === TokenCategory.SPAM)
      expect(onSelectionChange).toHaveBeenCalledWith(spamTokens.map(token => token.address))
    })

    it('should select dust tokens when dust preset is clicked', async () => {
      const onSelectionChange = vi.fn()
      renderWithProviders({onSelectionChange})

      const dustButton = screen.getByText('Dust Tokens')
      await userEvent.click(dustButton)

      // Should select tokens matching the dust criteria:
      // - category: DUST, AND valueClass: DUST/MICRO_VALUE, AND value <= 0.01
      // Only DUST1 matches all criteria (SPAM1 is category SPAM)
      const dustTokens = mockTokens.filter(
        token =>
          token.category === TokenCategory.DUST &&
          [TokenValueClass.DUST, TokenValueClass.MICRO_VALUE].includes(token.valueClass) &&
          token.estimatedValueUSD != null &&
          token.estimatedValueUSD <= 0.01,
      )
      expect(onSelectionChange).toHaveBeenCalledWith(dustTokens.map(token => token.address))
    })

    it('should select unwanted tokens when unwanted preset is clicked', async () => {
      const onSelectionChange = vi.fn()
      renderWithProviders({onSelectionChange})

      const unwantedButton = screen.getByText('Unwanted Tokens').closest('button')!
      await userEvent.click(unwantedButton)

      const unwantedTokens = mockTokens.filter(token => token.category === TokenCategory.UNWANTED)
      expect(onSelectionChange).toHaveBeenCalledWith(unwantedTokens.map(token => token.address))
    })

    it('should select low value tokens when low value preset is clicked', async () => {
      const onSelectionChange = vi.fn()
      renderWithProviders({onSelectionChange})

      const lowValueButton = screen.getByText('Low Value (<$1)')
      await userEvent.click(lowValueButton)

      // Should select tokens worth less than $1 (SPAM1: 0.001, DUST1: 0.005)
      const lowValueTokens = mockTokens.filter(token => token.estimatedValueUSD != null && token.estimatedValueUSD < 1)
      expect(onSelectionChange).toHaveBeenCalledWith(lowValueTokens.map(token => token.address))
    })

    it('should select non-favorite tokens when non-favorites preset is clicked', async () => {
      const onSelectionChange = vi.fn()
      renderWithProviders({onSelectionChange})

      const nonFavoritesButton = screen.getByText('Non-Favorites').closest('button')!
      await userEvent.click(nonFavoritesButton)

      const nonFavoriteTokens = mockTokens.filter(token => !token.isUserFavorite)
      expect(onSelectionChange).toHaveBeenCalledWith(nonFavoriteTokens.map(token => token.address))
    })

    it('should respect max selection limit', async () => {
      const onSelectionChange = vi.fn()
      const maxSelection = 2
      renderWithProviders({onSelectionChange, config: {maxSelection}})

      const spamButton = screen.getByText('Spam Tokens')
      await userEvent.click(spamButton)

      // Should only select spam tokens (1 token)
      expect(onSelectionChange).toHaveBeenCalledWith(expect.arrayContaining([expect.any(String)]))
      const calledWith = onSelectionChange.mock.calls[0] as string[][]
      const spamTokens = mockTokens.filter(token => token.spamScore > 70)
      expect(calledWith[0]).toHaveLength(Math.min(maxSelection, spamTokens.length))
    })
  })

  describe('Advanced Filtering', () => {
    it('should show advanced filters section', () => {
      renderWithProviders()
      expect(screen.getByText('Advanced Selection')).toBeInTheDocument()
    })
  })

  describe('Batch Operations', () => {
    it('should show batch operations when tokens are selected', () => {
      const selectedTokens = [mockTokens[0].address]
      renderWithProviders({selectedTokens})

      expect(screen.getByText('Batch Operations (1 selected)')).toBeInTheDocument()
      expect(screen.getByText('Mark as Spam')).toBeInTheDocument()
      expect(screen.getByText('Mark as Unwanted')).toBeInTheDocument()
      expect(screen.getByText('Add to Favorites')).toBeInTheDocument()
      expect(screen.getByText('Batch Approval')).toBeInTheDocument()
    })

    it('should not show batch operations when no tokens selected', () => {
      renderWithProviders({selectedTokens: []})

      expect(screen.queryByText(/Batch Operations/)).not.toBeInTheDocument()
    })

    it('should not show batch operations when disabled', () => {
      const selectedTokens = [mockTokens[0].address]
      renderWithProviders({
        selectedTokens,
        config: {enableBatchOperations: false},
      })

      expect(screen.queryByText(/Batch Operations/)).not.toBeInTheDocument()
    })

    it('should execute batch operation without confirmation', async () => {
      const selectedTokens = [mockTokens[0].address]
      renderWithProviders({selectedTokens})

      const markAsSpamButton = screen.getByText('Mark as Spam').closest('button')!
      await userEvent.click(markAsSpamButton)

      expect(mockBatchOperations[0].action).toHaveBeenCalledWith([mockTokens[0]])
    })

    it('should show confirmation modal for operations requiring confirmation', async () => {
      const selectedTokens = [mockTokens[0].address]
      renderWithProviders({selectedTokens})

      const batchApprovalButton = screen.getByText('Batch Approval')
      await userEvent.click(batchApprovalButton)

      expect(screen.getAllByText('Confirm Batch Approval')).toHaveLength(2) // Title and button
      expect(screen.getByText('This will approve all selected tokens for disposal. Continue?')).toBeInTheDocument()
    })

    it('should execute operation after confirmation', async () => {
      const selectedTokens = [mockTokens[0].address]
      renderWithProviders({selectedTokens})

      const batchApprovalButton = screen.getByText('Batch Approval')
      await userEvent.click(batchApprovalButton)

      const confirmButton = screen.getAllByText('Confirm Batch Approval')[1] // Get the button, not the title
      await userEvent.click(confirmButton)

      expect(mockBatchOperations[3].action).toHaveBeenCalledWith([mockTokens[0]])
    })

    it('should cancel operation when cancel is clicked', async () => {
      const selectedTokens = [mockTokens[0].address]
      renderWithProviders({selectedTokens})

      const batchApprovalButton = screen.getByText('Batch Approval').closest('button')!
      await userEvent.click(batchApprovalButton)

      const cancelButton = screen.getByText('Cancel').closest('button')!
      await userEvent.click(cancelButton)

      expect(screen.queryByText('Confirm Batch Approval')).not.toBeInTheDocument()
      expect(mockBatchOperations[3].action).not.toHaveBeenCalled()
    })
  })

  describe('Initial Filtering', () => {
    it('should apply initial filter to available tokens', () => {
      const initialFilter = {
        categories: [TokenCategory.VALUABLE],
      }
      renderWithProviders({initialFilter})

      // Should only show valuable tokens in calculations (0 of 2 initially selected)
      expect(screen.getByText('0 of 2 tokens selected')).toBeInTheDocument()
    })

    it('should filter by search query in initial filter', () => {
      const initialFilter = {
        searchQuery: 'Test',
      }
      renderWithProviders({initialFilter})

      // Should only show tokens matching search query
      const testTokens = mockTokens.filter(
        token => token.name.toLowerCase().includes('test') || token.symbol.toLowerCase().includes('test'),
      )
      expect(screen.getByText(`0 of ${testTokens.length} tokens selected`)).toBeInTheDocument()
    })
  })

  describe('Selection Persistence', () => {
    it('should persist selection to localStorage when enabled', async () => {
      const onSelectionChange = vi.fn()
      const spamToken = mockTokens.find(t => t.category === TokenCategory.SPAM)

      renderWithProviders({
        onSelectionChange,
        selectedTokens: spamToken ? [spamToken.address] : [],
        config: {persistSelection: true},
      })

      // Should automatically persist the selected tokens
      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'tokentoilet-selection',
          expect.stringContaining(spamToken?.address ?? ''),
        )
      })
    })

    it('should not persist selection when disabled', async () => {
      const onSelectionChange = vi.fn()
      renderWithProviders({
        onSelectionChange,
        config: {persistSelection: false},
      })

      const spamButton = screen.getByText('Spam Tokens').closest('button')!
      await userEvent.click(spamButton)

      expect(mockLocalStorage.setItem).not.toHaveBeenCalled()
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty token list gracefully', () => {
      renderWithProviders({tokens: []})

      expect(screen.getByText('0 of 0 tokens selected')).toBeInTheDocument()
      expect(screen.queryByText('Quick Selection')).toBeInTheDocument() // Should still show interface
    })

    it('should handle localStorage errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('LocalStorage error')
      })

      const onSelectionChange = vi.fn()
      renderWithProviders({
        onSelectionChange,
        config: {persistSelection: true},
      })

      const spamButton = screen.getByText('Spam Tokens').closest('button')!
      await userEvent.click(spamButton)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to persist token selection:', expect.any(Error))
      })

      consoleSpy.mockRestore()
    })

    it('should handle batch operation errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const errorOperation = {...mockBatchOperations[0]}
      errorOperation.action = vi.fn().mockRejectedValue(new Error('Operation failed'))

      const selectedTokens = [mockTokens[0].address]
      renderWithProviders({
        selectedTokens,
        batchOperations: [errorOperation],
      })

      const markAsSpamButton = screen.getByText('Mark as Spam').closest('button')!
      await userEvent.click(markAsSpamButton)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error))
      })

      consoleSpy.mockRestore()
    })

    it('should handle max selection display correctly', () => {
      const maxSelection = 3
      renderWithProviders({
        config: {maxSelection},
      })

      expect(screen.getByText(`0 of ${mockTokens.length} tokens selected (max: ${maxSelection})`)).toBeInTheDocument()
    })

    it('should handle undefined/null values in token metadata', () => {
      const tokensWithNulls: CategorizedToken[] = [
        {
          ...mockTokens[0],
          estimatedValueUSD: undefined,
          userNotes: undefined,
          isUserFavorite: undefined,
        },
      ]

      renderWithProviders({tokens: tokensWithNulls})

      // Should render without crashing
      expect(screen.getByText('Batch Selection')).toBeInTheDocument()
    })
  })
})
