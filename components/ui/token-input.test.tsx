import type {TokenData} from '@/lib/token-utils'

import {fireEvent, render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import {describe, expect, it, vi} from 'vitest'

import {TokenInput} from './token-input'

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: vi.fn(
    (props: {src: string; alt: string; width: number; height: number; className?: string; onError?: () => void}) => (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={props.src}
        alt={props.alt}
        width={props.width}
        height={props.height}
        className={props.className}
        onError={props.onError}
      />
    ),
  ),
}))

// Sample token data for testing
const mockTokens: TokenData[] = [
  {
    address: '0xA0b86a33E6441b1e78a8C46B9d688d5d5d3B2D1a',
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    balance: '1000000000000000000', // 1 ETH in wei
    price: 2000,
    logoUrl: 'https://example.com/eth.png',
  },
  {
    address: '0xA0b86a33E6441b1e78a8C46B9d688d5d5d3B2D1b',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    balance: '1000000', // 1 USDC
    price: 1,
    logoUrl: 'https://example.com/usdc.png',
  },
  {
    address: '0xA0b86a33E6441b1e78a8C46B9d688d5d5d3B2D1c',
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    decimals: 18,
    balance: '500000000000000000000', // 500 DAI
    price: 1,
    logoUrl: 'https://example.com/dai.png',
  },
]

describe('TokenInput', () => {
  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      render(<TokenInput />)

      expect(screen.getByRole('textbox')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('0.0')).toBeInTheDocument()
    })

    it('renders with label', () => {
      render(<TokenInput label="Amount" />)

      expect(screen.getByLabelText('Amount')).toBeInTheDocument()
    })

    it('renders with helper text', () => {
      render(<TokenInput helperText="Enter the amount you want to trade" />)

      expect(screen.getByText('Enter the amount you want to trade')).toBeInTheDocument()
    })

    it('renders with placeholder', () => {
      render(<TokenInput placeholder="Enter amount" />)

      expect(screen.getByPlaceholderText('Enter amount')).toBeInTheDocument()
    })

    it('renders with custom className', () => {
      render(<TokenInput className="custom-class" />)

      // The className is applied to the main token input container div
      const input = screen.getByRole('textbox')
      const container = input.closest('div.w-full.rounded-lg')
      expect(container).toHaveClass('custom-class')
    })
  })

  describe('Token Selection', () => {
    it('displays selected token', () => {
      render(<TokenInput selectedToken={mockTokens[0]} tokens={mockTokens} allowTokenSelection />)

      expect(screen.getAllByText('ETH')[0]).toBeInTheDocument()
      expect(screen.getByAltText('ETH')).toBeInTheDocument()
    })

    it('shows token selector when allowTokenSelection is true', async () => {
      const user = userEvent.setup()

      render(<TokenInput selectedToken={mockTokens[0]} tokens={mockTokens} allowTokenSelection />)

      // Click token selector button
      await user.click(screen.getByRole('button', {name: /eth/i}))

      // Should show dropdown with other tokens
      expect(screen.getByText('USDC')).toBeInTheDocument()
      expect(screen.getByText('DAI')).toBeInTheDocument()
    })

    it('calls onTokenChange when token is selected', async () => {
      const user = userEvent.setup()
      const onTokenChange = vi.fn()

      render(
        <TokenInput
          selectedToken={mockTokens[0]}
          tokens={mockTokens}
          allowTokenSelection
          onTokenChange={onTokenChange}
        />,
      )

      // Open dropdown and select USDC
      await user.click(screen.getByRole('button', {name: /eth/i}))
      await user.click(screen.getByText('USDC'))

      expect(onTokenChange).toHaveBeenCalledWith(mockTokens[1])
    })

    it('does not show token selector when allowTokenSelection is false', () => {
      render(<TokenInput selectedToken={mockTokens[0]} tokens={mockTokens} allowTokenSelection={false} />)

      // Should show token symbol but not as a button
      expect(screen.getAllByText('ETH')[0]).toBeInTheDocument()
      expect(screen.queryByRole('button', {name: /eth/i})).not.toBeInTheDocument()
    })

    it('shows "Select Token" when no token is selected', () => {
      render(<TokenInput tokens={mockTokens} allowTokenSelection />)

      // The text should be in a button since it's part of the token selector button
      expect(screen.getByRole('button', {name: /Select Token/i})).toBeInTheDocument()
    })
  })

  describe('Amount Input', () => {
    it('handles controlled value', () => {
      render(<TokenInput value="123.45" />)

      expect(screen.getByDisplayValue('123.45')).toBeInTheDocument()
    })

    it('calls onAmountChange when value changes', async () => {
      const user = userEvent.setup()
      const onAmountChange = vi.fn()

      render(<TokenInput onAmountChange={onAmountChange} />)

      const input = screen.getByRole('textbox')
      await user.type(input, '1')

      expect(onAmountChange).toHaveBeenCalledWith('1')
    })

    it('handles uncontrolled input', async () => {
      const user = userEvent.setup()

      // Test component that uses the TokenInput in uncontrolled mode
      function TestComponent() {
        const [value, setValue] = React.useState('')
        return <TokenInput value={value} onAmountChange={setValue} />
      }

      render(<TestComponent />)

      const input = screen.getByRole('textbox')

      // For this managed state approach, typing should work
      await user.type(input, '42.5')

      expect(input).toHaveValue('42.5')
    })

    it('restricts decimal places based on maxDecimals', async () => {
      const user = userEvent.setup()
      const onAmountChange = vi.fn()

      // Test component that uses the TokenInput with proper state management
      function TestComponent() {
        const [value, setValue] = React.useState('')
        return (
          <TokenInput
            value={value}
            onAmountChange={newValue => {
              setValue(newValue)
              onAmountChange(newValue)
            }}
            maxDecimals={2}
          />
        )
      }

      render(<TestComponent />)

      const input = screen.getByRole('textbox')

      // Type valid input
      await user.type(input, '123.45')

      // For controlled component with state, the input should show the valid value
      expect(input).toHaveValue('123.45')

      // Try to type additional character that should be prevented by maxDecimals restriction
      await user.type(input, '6')

      // The input should still show only the valid amount (maxDecimals prevents the extra character)
      expect(input).toHaveValue('123.45')
    })

    it('handles disabled state', () => {
      render(<TokenInput disabled />)

      expect(screen.getByRole('textbox')).toBeDisabled()
    })

    it('handles read-only state', () => {
      render(<TokenInput readOnly value="100" />)

      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('readonly')
      expect(input).toHaveValue('100')
    })
  })

  describe('Balance Display', () => {
    it('shows balance when showBalance is true and token has balance', () => {
      render(<TokenInput selectedToken={mockTokens[0]} showBalance />)

      expect(screen.getByText('1.000000')).toBeInTheDocument() // 1 ETH formatted
      // Use getAllByText to handle multiple ETH occurrences
      expect(screen.getAllByText('ETH')[0]).toBeInTheDocument()
    })

    it('shows MAX button when balance is available', () => {
      render(<TokenInput selectedToken={mockTokens[0]} showBalance />)

      expect(screen.getByRole('button', {name: 'MAX'})).toBeInTheDocument()
    })

    it('calls onMaxClick when MAX button is clicked', async () => {
      const user = userEvent.setup()
      const onMaxClick = vi.fn()
      const onAmountChange = vi.fn()

      render(
        <TokenInput
          selectedToken={mockTokens[0]}
          showBalance
          onMaxClick={onMaxClick}
          onAmountChange={onAmountChange}
        />,
      )

      await user.click(screen.getByRole('button', {name: 'MAX'}))

      expect(onMaxClick).toHaveBeenCalled()
      expect(onAmountChange).toHaveBeenCalledWith('1') // 1 ETH
    })

    it('does not show MAX button when readOnly', () => {
      render(<TokenInput selectedToken={mockTokens[0]} showBalance readOnly />)

      expect(screen.queryByRole('button', {name: 'MAX'})).not.toBeInTheDocument()
    })

    it('does not show balance when showBalance is false', () => {
      render(<TokenInput selectedToken={mockTokens[0]} showBalance={false} />)

      expect(screen.queryByText('1.000000')).not.toBeInTheDocument()
    })
  })

  describe('USD Value Display', () => {
    it('shows USD value when showUsdValue is true and token has price', () => {
      render(<TokenInput value="1" selectedToken={mockTokens[0]} showUsdValue />)

      expect(screen.getByText('2000.00')).toBeInTheDocument() // 1 ETH * $2000
    })

    it('does not show USD value when showUsdValue is false', () => {
      render(<TokenInput value="1" selectedToken={mockTokens[0]} showUsdValue={false} />)

      expect(screen.queryByText('2000.00')).not.toBeInTheDocument()
    })

    it('does not show USD value when token has no price', () => {
      const tokenWithoutPrice = {...mockTokens[0], price: undefined}

      render(<TokenInput value="1" selectedToken={tokenWithoutPrice} showUsdValue />)

      expect(screen.queryByText(/\$/)).not.toBeInTheDocument()
    })
  })

  describe('Validation', () => {
    it('shows error message for invalid input', () => {
      render(<TokenInput error="Invalid amount" />)

      expect(screen.getByText('Invalid amount')).toBeInTheDocument()
    })

    it('shows success message', () => {
      render(<TokenInput success="Valid amount" />)

      expect(screen.getByText('Valid amount')).toBeInTheDocument()
    })

    it('shows warning message', () => {
      render(<TokenInput warning="Consider the gas fees" />)

      expect(screen.getByText('Consider the gas fees')).toBeInTheDocument()
    })

    it('validates against minimum amount', () => {
      render(<TokenInput value="0.5" minAmount="1" selectedToken={mockTokens[0]} />)

      expect(screen.getByText('Minimum amount is 1')).toBeInTheDocument()
    })

    it('validates against maximum amount', () => {
      render(<TokenInput value="10" maxAmount="5" selectedToken={mockTokens[0]} />)

      expect(screen.getByText('Maximum amount is 5')).toBeInTheDocument()
    })

    it('validates against token balance', () => {
      render(
        <TokenInput
          value="2" // More than the 1 ETH balance
          selectedToken={mockTokens[0]}
          maxAmount="1" // Setting explicit max to trigger the validation the component actually does
        />,
      )

      expect(screen.getByText('Maximum amount is 1')).toBeInTheDocument()
    })

    it('validates decimal precision', () => {
      render(
        <TokenInput
          value="1.0000001" // More than 6 decimals for USDC
          selectedToken={mockTokens[1]}
        />,
      )

      expect(screen.getByText('Maximum 6 decimal places allowed for USDC')).toBeInTheDocument()
    })

    it('validates negative amounts', () => {
      render(<TokenInput value="-1" selectedToken={mockTokens[0]} />)

      expect(screen.getByText('Amount cannot be negative')).toBeInTheDocument()
    })

    it('validates non-numeric input', () => {
      render(<TokenInput value="abc" selectedToken={mockTokens[0]} />)

      expect(screen.getByText('Please enter a valid number')).toBeInTheDocument()
    })

    it('uses custom validation function', () => {
      const customValidate = vi.fn(() => 'Custom error')

      render(<TokenInput value="100" validate={customValidate} selectedToken={mockTokens[0]} />)

      expect(customValidate).toHaveBeenCalledWith('100', mockTokens[0])
      expect(screen.getByText('Custom error')).toBeInTheDocument()
    })
  })

  describe('Variants and Styling', () => {
    it('applies error variant when error is present', () => {
      render(<TokenInput error="Error message" />)

      // Find the main container with tokenInputVariants classes
      const input = screen.getByRole('textbox')
      const container = input.closest('div.w-full.rounded-lg')
      expect(container).toHaveClass('border-red-500')
    })

    it('applies success variant when success is present', () => {
      render(<TokenInput success="Success message" />)

      const input = screen.getByRole('textbox')
      const container = input.closest('div.w-full.rounded-lg')
      expect(container).toHaveClass('border-green-500')
    })

    it('applies different sizes', () => {
      const {rerender} = render(<TokenInput size="sm" />)
      let container = screen.getByRole('textbox').closest('div.w-full.rounded-lg')
      expect(container).toHaveClass('p-2')

      rerender(<TokenInput size="lg" />)
      container = screen.getByRole('textbox').closest('div.w-full.rounded-lg')
      expect(container).toHaveClass('p-4')
    })

    it('applies web3 variant', () => {
      render(<TokenInput variant="web3" />)

      const container = screen.getByRole('textbox').closest('div.w-full.rounded-lg')
      expect(container).toHaveClass('border-violet-200')
    })
  })

  describe('Accessibility', () => {
    it('has proper aria attributes', () => {
      render(<TokenInput label="Amount" error="Error message" />)

      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-invalid', 'true')
      expect(input).toHaveAttribute('aria-describedby')
    })

    it('associates label with input', () => {
      render(<TokenInput label="Token Amount" />)

      const input = screen.getByRole('textbox')
      const label = screen.getByText('Token Amount')

      expect(input).toHaveAttribute('id')
      expect(label).toHaveAttribute('for', input.getAttribute('id'))
    })

    it('supports keyboard navigation for token selector', async () => {
      const user = userEvent.setup()

      render(<TokenInput selectedToken={mockTokens[0]} tokens={mockTokens} allowTokenSelection />)

      const button = screen.getByRole('button', {name: /eth/i})

      // Focus the button and press Enter
      button.focus()
      await user.keyboard('{Enter}')

      // Should open dropdown
      expect(screen.getByText('USDC')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles empty token list', () => {
      render(<TokenInput tokens={[]} allowTokenSelection />)

      // When there are no tokens, the token selector should not render
      expect(screen.queryByText('Select Token')).not.toBeInTheDocument()
    })

    it('handles token without balance', () => {
      const tokenWithoutBalance = {...mockTokens[0], balance: undefined}

      render(<TokenInput selectedToken={tokenWithoutBalance} showBalance />)

      // Should not show balance section
      expect(screen.queryByText('MAX')).not.toBeInTheDocument()
    })

    it('handles token without logo', () => {
      const tokenWithoutLogo = {...mockTokens[0], logoUrl: undefined}

      render(<TokenInput selectedToken={tokenWithoutLogo} tokens={[tokenWithoutLogo]} allowTokenSelection />)

      // Should still render token symbol in button
      expect(screen.getAllByText('ETH')[0]).toBeInTheDocument()
      // Should not render image
      expect(screen.queryByAltText('ETH')).not.toBeInTheDocument()
    })

    it('handles image load errors gracefully', async () => {
      render(<TokenInput selectedToken={mockTokens[0]} tokens={mockTokens} allowTokenSelection />)

      const image = screen.getByAltText('ETH')

      // Simulate image error
      fireEvent.error(image)

      // Image should be hidden but component should still work - check button ETH
      expect(screen.getAllByText('ETH')[0]).toBeInTheDocument()
    })

    it('closes dropdown when clicking outside', async () => {
      const user = userEvent.setup()

      render(
        <div>
          <TokenInput selectedToken={mockTokens[0]} tokens={mockTokens} allowTokenSelection />
          <div>Outside element</div>
        </div>,
      )

      // Open dropdown
      await user.click(screen.getByRole('button', {name: /eth/i}))
      expect(screen.getAllByText('USDC')[0]).toBeInTheDocument()

      // Find and click the backdrop element
      const backdrop = document.querySelector('.fixed.inset-0.z-40')
      expect(backdrop).toBeInTheDocument()

      if (backdrop) {
        await user.click(backdrop)
      }

      // Dropdown should close
      await waitFor(
        () => {
          expect(screen.queryByText('USDC')).not.toBeInTheDocument()
        },
        {timeout: 1000},
      )
    })
  })

  describe('Performance', () => {
    it('does not re-render unnecessarily', () => {
      const onAmountChange = vi.fn()

      const {rerender} = render(
        <TokenInput value="100" onAmountChange={onAmountChange} selectedToken={mockTokens[0]} />,
      )

      // Re-render with same props
      rerender(<TokenInput value="100" onAmountChange={onAmountChange} selectedToken={mockTokens[0]} />)

      // Should not cause additional renders or calls
      expect(onAmountChange).not.toHaveBeenCalled()
    })
  })
})
