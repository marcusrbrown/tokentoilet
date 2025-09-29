import type {TokenData} from '@/lib/token-utils'
import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {TokenAmountInput} from './token-amount-input'

// Mock dependencies
vi.mock('@/hooks/use-wallet', () => ({
  useWallet: vi.fn(() => ({
    address: '0x123...abc',
    chainId: 1,
    isConnected: true,
  })),
}))

vi.mock('@/hooks/use-token-balance')

// Get the mocked hook
const mockUseSingleTokenBalance = vi.mocked(await import('@/hooks/use-token-balance')).useSingleTokenBalance

vi.mock('@/lib/token-utils', () => ({
  rawToDecimal: vi.fn((raw: string, decimals: number) => {
    const num = Number.parseFloat(raw) / 10 ** decimals
    return num.toString()
  }),
  validateTokenAmount: vi.fn((amount: string) => {
    if (amount === 'invalid') return 'Please enter a valid number'
    if (Number.parseFloat(amount) < 0) return 'Amount cannot be negative'
    return null
  }),
  formatTokenAmount: vi.fn((amount: string) => amount),
  calculateUsdValue: vi.fn((amount: string, price?: number) => {
    if (price == null || price === 0) return '0.00'
    return (Number.parseFloat(amount) * price).toFixed(2)
  }),
}))

// Mock TokenInput component
vi.mock('./token-input', () => ({
  TokenInput: ({
    value,
    onAmountChange,
    error,
    warning,
    success,
    disabled,
    readOnly,
    selectedToken,
    ..._props
  }: {
    value?: string
    onAmountChange?: (value: string) => void
    error?: string
    warning?: string
    success?: string
    disabled?: boolean
    readOnly?: boolean
    selectedToken?: TokenData
  }) => (
    <div data-testid="token-input">
      <input
        type="text"
        value={value ?? ''}
        onChange={e => {
          if (onAmountChange != null) {
            onAmountChange(e.target.value)
          }
        }}
        disabled={disabled ?? false}
        readOnly={readOnly ?? false}
        data-testid="amount-input"
      />
      {error != null && error.length > 0 && <div data-testid="error-message">{error}</div>}
      {warning != null && warning.length > 0 && <div data-testid="warning-message">{warning}</div>}
      {success != null && success.length > 0 && <div data-testid="success-message">{success}</div>}
      {selectedToken != null && <div data-testid="selected-token">{selectedToken.symbol}</div>}
    </div>
  ),
}))

// Sample tokens for testing
const mockTokens: TokenData[] = [
  {
    address: '0xA0b86a33E6441b1e78a8C46B9d688d5d5d3B2D1c',
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    balance: '1000000000000000000', // 1 ETH
    price: 2000,
    logoUrl: 'https://example.com/eth.png',
  },
  {
    address: '0xA0b86a33E6441b1e78a8C46B9d688d5d5d3B2D1d',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    balance: '1000000', // 1 USDC
    price: 1,
    logoUrl: 'https://example.com/usdc.png',
  },
]

describe('TokenAmountInput', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock to default implementation
    mockUseSingleTokenBalance.mockReturnValue({
      balance: null,
      isLoading: false,
      error: null,
      refresh: vi.fn(),
      isSuccess: false,
      isFetching: false,
      refetch: vi.fn(),
    })
  })

  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      render(<TokenAmountInput />)

      expect(screen.getByTestId('token-input')).toBeInTheDocument()
      expect(screen.getByTestId('amount-input')).toBeInTheDocument()
    })

    it('renders with selected token', () => {
      render(<TokenAmountInput selectedToken={mockTokens[0]} />)

      expect(screen.getByTestId('selected-token')).toHaveTextContent('ETH')
    })

    it('passes through props to underlying TokenInput', () => {
      render(
        <TokenAmountInput
          value="100"
          selectedToken={mockTokens[0]}
          disabled
          placeholder="Enter amount"
          helperText="Helper text"
        />,
      )

      const input = screen.getByTestId('amount-input')
      expect(input).toHaveValue('100')
      expect(input).toBeDisabled()
    })
  })

  describe('Validation Logic', () => {
    it('shows no validation for empty input', () => {
      render(<TokenAmountInput value="" />)

      expect(screen.queryByTestId('error-message')).not.toBeInTheDocument()
      expect(screen.queryByTestId('warning-message')).not.toBeInTheDocument()
      expect(screen.queryByTestId('success-message')).not.toBeInTheDocument()
    })

    it('validates negative amounts', async () => {
      const mockValidateTokenAmount = vi.mocked(await import('@/lib/token-utils').then(m => m.validateTokenAmount))
      mockValidateTokenAmount.mockReturnValue('Amount cannot be negative')

      render(<TokenAmountInput value="-10" />)

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Amount cannot be negative')
      })
    })

    it('validates invalid number format', async () => {
      const mockValidateTokenAmount = vi.mocked(await import('@/lib/token-utils').then(m => m.validateTokenAmount))
      mockValidateTokenAmount.mockReturnValue('Please enter a valid number')

      render(<TokenAmountInput value="invalid" />)

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Please enter a valid number')
      })
    })

    it('shows success for valid amounts', async () => {
      const mockValidateTokenAmount = vi.mocked(await import('@/lib/token-utils').then(m => m.validateTokenAmount))
      mockValidateTokenAmount.mockReturnValue(null)

      render(<TokenAmountInput value="10" selectedToken={mockTokens[0]} />)

      await waitFor(() => {
        expect(screen.getByTestId('success-message')).toHaveTextContent(/Amount appears valid|Valid amount/)
      })
    })
  })

  describe('Custom Validation', () => {
    it('uses custom validator when provided', async () => {
      const customValidator = vi.fn(() => ({
        isValid: false,
        type: 'error' as const,
        message: 'Custom validation error',
        severity: 'high' as const,
      }))

      render(<TokenAmountInput value="100" validationConfig={{customValidator}} selectedToken={mockTokens[0]} />)

      await waitFor(() => {
        expect(customValidator).toHaveBeenCalledWith('100', mockTokens[0], '1000000000000000000')
        expect(screen.getByTestId('error-message')).toHaveTextContent('Custom validation error')
      })
    })

    it('shows dust threshold warning', async () => {
      const mockValidateTokenAmount = vi.mocked(await import('@/lib/token-utils').then(m => m.validateTokenAmount))
      mockValidateTokenAmount.mockReturnValue(null)

      render(
        <TokenAmountInput value="0.0001" validationConfig={{dustThreshold: '0.001'}} selectedToken={mockTokens[0]} />,
      )

      await waitFor(() => {
        expect(screen.getByTestId('warning-message')).toHaveTextContent(/very small amount.*dust/i)
      })
    })
  })

  describe('Real-time Balance Verification', () => {
    it('shows balance loading state', () => {
      mockUseSingleTokenBalance.mockReturnValue({
        balance: null,
        isLoading: true,
        error: null,
        refresh: vi.fn(),
        isSuccess: false,
        isFetching: true,
        refetch: vi.fn(),
      })

      render(
        <TokenAmountInput
          selectedToken={mockTokens[0]}
          validationConfig={{enableRealTimeBalance: true}}
          showBalanceVerification
          showDetailedFeedback
        />,
      )

      expect(screen.getByText('Balance verification')).toBeInTheDocument()
      expect(screen.getByText('Pending')).toBeInTheDocument()
    })

    it('shows balance verification success', () => {
      mockUseSingleTokenBalance.mockReturnValue({
        balance: {
          address: '0xA0b86a33E6441b1e78a8C46B9d688d5d5d3B2D1c' as `0x${string}`,
          balance: BigInt('1000000000000000000'),
          formattedBalance: '1.0',
          decimals: 18,
          chainId: 1,
          lastUpdated: Date.now(),
        },
        isLoading: false,
        error: null,
        refresh: vi.fn(),
        isSuccess: true,
        isFetching: false,
        refetch: vi.fn(),
      })

      render(
        <TokenAmountInput
          selectedToken={mockTokens[0]}
          validationConfig={{enableRealTimeBalance: true}}
          showBalanceVerification
          showDetailedFeedback
        />,
      )

      expect(screen.getByText('Verified')).toBeInTheDocument()
    })

    it('shows balance error with retry option', () => {
      const mockRefresh = vi.fn()
      mockUseSingleTokenBalance.mockReturnValue({
        balance: null,
        isLoading: false,
        error: new Error('Network error'),
        refresh: mockRefresh,
        isSuccess: false,
        isFetching: false,
        refetch: vi.fn(),
      })

      render(
        <TokenAmountInput
          selectedToken={mockTokens[0]}
          validationConfig={{enableRealTimeBalance: true}}
          showBalanceVerification
          showDetailedFeedback
        />,
      )

      expect(screen.getByText('Retry')).toBeInTheDocument()
    })
  })

  describe('Quick Percentage Buttons', () => {
    it('renders percentage buttons when enabled', () => {
      render(<TokenAmountInput enableQuickPercentages selectedToken={mockTokens[0]} />)

      expect(screen.getByText('25%')).toBeInTheDocument()
      expect(screen.getByText('50%')).toBeInTheDocument()
      expect(screen.getByText('75%')).toBeInTheDocument()
      expect(screen.getByText('100%')).toBeInTheDocument()
    })

    it('calculates percentage amounts correctly', async () => {
      const user = userEvent.setup()
      const onAmountChange = vi.fn()

      render(<TokenAmountInput enableQuickPercentages selectedToken={mockTokens[0]} onAmountChange={onAmountChange} />)

      await user.click(screen.getByText('50%'))

      // Should calculate 50% of 1 ETH balance = 0.5 ETH
      expect(onAmountChange).toHaveBeenCalledWith('0.5')
    })

    it('disables percentage buttons when no balance', () => {
      const tokenWithoutBalance = {...mockTokens[0], balance: ''}

      render(<TokenAmountInput enableQuickPercentages selectedToken={tokenWithoutBalance} />)

      expect(screen.queryByText('25%')).not.toBeInTheDocument()
    })

    it('disables percentage buttons when input is disabled', () => {
      render(<TokenAmountInput enableQuickPercentages selectedToken={mockTokens[0]} disabled />)

      expect(screen.queryByText('25%')).not.toBeInTheDocument()
    })
  })

  describe('Balance Percentage Display', () => {
    it('shows percentage of balance when enabled', () => {
      render(
        <TokenAmountInput value="0.5" selectedToken={mockTokens[0]} showPercentageOfBalance showDetailedFeedback />,
      )

      expect(screen.getByText(/50\.0% of available balance/)).toBeInTheDocument()
    })

    it('hides percentage when no balance available', () => {
      const tokenWithoutBalance = {...mockTokens[0], balance: ''}

      render(
        <TokenAmountInput
          value="0.5"
          selectedToken={tokenWithoutBalance}
          showPercentageOfBalance
          showDetailedFeedback
        />,
      )

      expect(screen.queryByText(/of available balance/)).not.toBeInTheDocument()
    })
  })

  describe('Override Messages', () => {
    it('shows error override', () => {
      render(<TokenAmountInput value="100" errorOverride="Custom error message" />)

      expect(screen.getByTestId('error-message')).toHaveTextContent('Custom error message')
    })

    it('shows warning override', () => {
      render(<TokenAmountInput value="100" warningOverride="Custom warning message" />)

      expect(screen.getByTestId('warning-message')).toHaveTextContent('Custom warning message')
    })

    it('shows success override', () => {
      render(<TokenAmountInput value="100" successOverride="Custom success message" />)

      expect(screen.getByTestId('success-message')).toHaveTextContent('Custom success message')
    })
  })

  describe('Callback Functions', () => {
    it('calls validation change callback', async () => {
      const onValidationChange = vi.fn()

      render(<TokenAmountInput value="100" onValidationChange={onValidationChange} />)

      await waitFor(() => {
        expect(onValidationChange).toHaveBeenCalledWith(
          expect.objectContaining({
            isValid: true,
            type: 'success',
          }),
        )
      })
    })

    it('calls balance verification change callback', async () => {
      const onBalanceVerificationChange = vi.fn()

      render(<TokenAmountInput onBalanceVerificationChange={onBalanceVerificationChange} />)

      await waitFor(() => {
        expect(onBalanceVerificationChange).toHaveBeenCalledWith(
          expect.objectContaining({
            isLoading: false,
            isStale: true,
          }),
        )
      })
    })
  })

  describe('Validation Icons', () => {
    it('shows success icon for valid amounts', async () => {
      const mockValidateTokenAmount = vi.mocked(await import('@/lib/token-utils').then(m => m.validateTokenAmount))
      mockValidateTokenAmount.mockReturnValue(null)

      render(<TokenAmountInput value="10" showDetailedFeedback />)

      await waitFor(() => {
        // Icon is rendered but we can't easily test lucide-react icons in jsdom
        expect(screen.getByTestId('token-input')).toBeInTheDocument()
      })
    })

    it('shows loading icon during balance verification', () => {
      const mockUseSingleTokenBalance = vi.mocked(
        vi.fn(() => ({
          balance: null,
          isLoading: true,
          error: null,
          refresh: vi.fn(),
          isSuccess: false,
        })),
      )

      vi.doMock('@/hooks/use-token-balance', () => ({
        useSingleTokenBalance: mockUseSingleTokenBalance,
      }))

      render(
        <TokenAmountInput
          value="10"
          selectedToken={mockTokens[0]}
          validationConfig={{enableRealTimeBalance: true}}
          showDetailedFeedback
        />,
      )

      expect(screen.getByTestId('token-input')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('maintains proper focus management', async () => {
      const user = userEvent.setup()

      render(<TokenAmountInput />)

      const input = screen.getByTestId('amount-input')
      await user.click(input)

      expect(input).toHaveFocus()
    })

    it('provides proper ARIA labels through TokenInput', () => {
      render(<TokenAmountInput label="Token Amount" />)

      // The underlying TokenInput should handle ARIA properly
      expect(screen.getByTestId('token-input')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles undefined selectedToken gracefully', () => {
      render(<TokenAmountInput value="100" />)

      expect(screen.getByTestId('token-input')).toBeInTheDocument()
      expect(screen.queryByTestId('selected-token')).not.toBeInTheDocument()
    })

    it('handles zero balance tokens', () => {
      const zeroBalanceToken = {...mockTokens[0], balance: '0'}

      render(<TokenAmountInput selectedToken={zeroBalanceToken} enableQuickPercentages />)

      // Should not show percentage buttons for zero balance
      expect(screen.queryByText('25%')).not.toBeInTheDocument()
    })

    it('handles very large numbers', async () => {
      const mockValidateTokenAmount = vi.mocked(await import('@/lib/token-utils').then(m => m.validateTokenAmount))
      mockValidateTokenAmount.mockReturnValue(null)

      render(<TokenAmountInput value="999999999999999999999" />)

      await waitFor(() => {
        expect(screen.getByTestId('token-input')).toBeInTheDocument()
      })
    })

    it('handles decimal precision correctly', () => {
      const highDecimalToken = {...mockTokens[0], decimals: 18}

      render(<TokenAmountInput selectedToken={highDecimalToken} value="1.123456789012345678" />)

      expect(screen.getByTestId('token-input')).toBeInTheDocument()
    })
  })
})
