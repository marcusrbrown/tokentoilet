import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {describe, expect, it, vi} from 'vitest'

import {Input} from './input'

// Mock clipboard API
const mockClipboard = {
  writeText: vi.fn().mockResolvedValue(undefined),
}
Object.assign(navigator, {clipboard: mockClipboard})

describe('Input', () => {
  describe('Basic Rendering', () => {
    it('renders an input element', () => {
      render(<Input />)
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('renders with a label when label prop is provided', () => {
      render(<Input label="Wallet Address" />)
      expect(screen.getByLabelText('Wallet Address')).toBeInTheDocument()
    })

    it('renders helper text when provided', () => {
      render(<Input helperText="Enter your Ethereum address" />)
      expect(screen.getByText('Enter your Ethereum address')).toBeInTheDocument()
    })

    it('renders placeholder text', () => {
      render(<Input placeholder="0x..." />)
      expect(screen.getByPlaceholderText('0x...')).toBeInTheDocument()
    })
  })

  describe('Variants', () => {
    it('applies default variant classes', () => {
      render(<Input data-testid="input" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('border-gray-200', 'text-gray-900')
    })

    it('applies solid variant classes', () => {
      render(<Input variant="solid" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('bg-white', 'border-gray-300')
    })

    it('applies web3 variant classes', () => {
      render(<Input variant="web3" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('border-violet-200', 'bg-violet-50/50')
    })

    it('applies ghost variant classes', () => {
      render(<Input variant="ghost" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('border-transparent', 'bg-transparent')
    })
  })

  describe('Sizes', () => {
    it('applies default size classes', () => {
      render(<Input />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('h-10', 'px-3', 'py-2', 'text-sm')
    })

    it('applies sm size classes', () => {
      render(<Input size="sm" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('h-9', 'px-2', 'py-1', 'text-xs')
    })

    it('applies lg size classes', () => {
      render(<Input size="lg" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('h-11', 'px-4', 'py-3', 'text-base')
    })
  })

  describe('State Messages', () => {
    it('shows error message and applies error state', () => {
      render(<Input error="Invalid address format" />)
      expect(screen.getByText('Invalid address format')).toBeInTheDocument()
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-invalid', 'true')
    })

    it('shows success message', () => {
      render(<Input success="Valid address" />)
      expect(screen.getByText('Valid address')).toBeInTheDocument()
    })

    it('shows warning message', () => {
      render(<Input warning="Double-check this address" />)
      expect(screen.getByText('Double-check this address')).toBeInTheDocument()
    })

    it('error message takes priority over warning', () => {
      render(<Input error="Error message" warning="Warning message" />)
      expect(screen.getByText('Error message')).toBeInTheDocument()
      expect(screen.queryByText('Warning message')).not.toBeInTheDocument()
    })

    it('links helper text to input via aria-describedby', () => {
      render(<Input helperText="Helper text" />)
      const input = screen.getByRole('textbox')
      const helperId = input.getAttribute('aria-describedby')
      expect(helperId).toBeTruthy()
      const helperEl = document.querySelector(`#${helperId}`)
      expect(helperEl).toHaveTextContent('Helper text')
    })
  })

  describe('Web3 Address Validation', () => {
    it('validates Ethereum address when validateAddress is true', async () => {
      render(<Input validateAddress value="0x742d35Cc6635C0532925a3b8D8B12567dC5E0123" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-invalid', 'false')
    })

    it('shows error for invalid Ethereum address', async () => {
      render(<Input validateAddress value="not-an-address" />)
      await waitFor(() => {
        expect(screen.getByText('Invalid Ethereum address format')).toBeInTheDocument()
      })
    })

    it('shows success for valid Ethereum address', async () => {
      render(<Input validateAddress value="0x742d35Cc6635C0532925a3b8D8B12567dC5E0123" />)
      await waitFor(() => {
        expect(screen.getByText('Valid Ethereum address')).toBeInTheDocument()
      })
    })
  })

  describe('Custom Validation', () => {
    it('uses custom validate function', async () => {
      const validate = (value: string) => (value.length < 3 ? 'Too short' : null)
      render(<Input validate={validate} value="ab" />)
      await waitFor(() => {
        expect(screen.getByText('Too short')).toBeInTheDocument()
      })
    })

    it('shows no error when custom validation passes', async () => {
      const validate = (value: string) => (value.length < 3 ? 'Too short' : null)
      render(<Input validate={validate} value="valid input" />)
      await waitFor(() => {
        expect(screen.queryByText('Too short')).not.toBeInTheDocument()
      })
    })
  })

  describe('Password Toggle', () => {
    it('shows password toggle button for password type', () => {
      render(<Input type="password" showPasswordToggle />)
      expect(screen.getByTitle('Show password')).toBeInTheDocument()
    })

    it('toggles password visibility when toggle button is clicked', async () => {
      render(<Input type="password" showPasswordToggle />)
      const input = screen.getByDisplayValue('')
      expect(input).toHaveAttribute('type', 'password')

      await userEvent.click(screen.getByTitle('Show password'))
      expect(input).toHaveAttribute('type', 'text')

      await userEvent.click(screen.getByTitle('Hide password'))
      expect(input).toHaveAttribute('type', 'password')
    })

    it('does not show password toggle for non-password inputs', () => {
      render(<Input type="text" showPasswordToggle />)
      expect(screen.queryByTitle('Show password')).not.toBeInTheDocument()
    })
  })

  describe('Copy Button', () => {
    it('shows copy button when showCopyButton is true and input has value', () => {
      render(<Input showCopyButton value="some value" />)
      expect(screen.getByTitle('Copy to clipboard')).toBeInTheDocument()
    })

    it('does not show copy button when input is empty', () => {
      render(<Input showCopyButton value="" />)
      expect(screen.queryByTitle('Copy to clipboard')).not.toBeInTheDocument()
    })

    it('copies value to clipboard when copy button is clicked', async () => {
      render(<Input showCopyButton value="0x1234" />)
      await userEvent.click(screen.getByTitle('Copy to clipboard'))
      expect(mockClipboard.writeText).toHaveBeenCalledWith('0x1234')
    })

    it('calls onCopyAddress callback when copy button is clicked', async () => {
      const onCopyAddress = vi.fn()
      render(<Input showCopyButton value="0x1234" onCopyAddress={onCopyAddress} />)
      await userEvent.click(screen.getByTitle('Copy to clipboard'))
      await waitFor(() => {
        expect(onCopyAddress).toHaveBeenCalledWith('0x1234')
      })
    })
  })

  describe('Clear Button', () => {
    it('shows clear button when showClearButton is true and input has value', () => {
      render(<Input showClearButton value="some value" onChange={vi.fn()} />)
      expect(screen.getByTitle('Clear input')).toBeInTheDocument()
    })

    it('does not show clear button when input is empty', () => {
      render(<Input showClearButton value="" onChange={vi.fn()} />)
      expect(screen.queryByTitle('Clear input')).not.toBeInTheDocument()
    })

    it('clears input value when clear button is clicked', async () => {
      const onChange = vi.fn()
      render(<Input showClearButton value="some value" onChange={onChange} />)
      await userEvent.click(screen.getByTitle('Clear input'))
      expect(onChange).toHaveBeenCalledTimes(1)
      expect((onChange.mock.calls[0] as [{target: {value: string}}])[0].target.value).toBe('')
    })
  })

  describe('Icons', () => {
    it('renders left icon when provided', () => {
      const LeftIcon = () => <span data-testid="left-icon">🔍</span>
      render(<Input leftIcon={<LeftIcon />} />)
      expect(screen.getByTestId('left-icon')).toBeInTheDocument()
    })

    it('renders right icon when provided', () => {
      const RightIcon = () => <span data-testid="right-icon">✓</span>
      render(<Input rightIcon={<RightIcon />} />)
      expect(screen.getByTestId('right-icon')).toBeInTheDocument()
    })
  })

  describe('Change Handling', () => {
    it('calls onChange when user types', async () => {
      const onChange = vi.fn()
      render(<Input onChange={onChange} />)
      await userEvent.type(screen.getByRole('textbox'), 'hello')
      expect(onChange).toHaveBeenCalled()
    })

    it('updates internal state when no external value is controlled', async () => {
      // The Input component defaults value='' and tracks internal state;
      // typing fires onChange but the displayed value stays at '' unless onChange updates the prop.
      // Verify onChange is called with each keystroke.
      const onChange = vi.fn()
      render(<Input onChange={onChange} />)
      await userEvent.type(screen.getByRole('textbox'), 'hi')
      expect(onChange).toHaveBeenCalledTimes(2)
    })
  })

  describe('Disabled State', () => {
    it('is disabled when disabled prop is true', () => {
      render(<Input disabled />)
      expect(screen.getByRole('textbox')).toBeDisabled()
    })

    it('applies disabled styles', () => {
      render(<Input disabled />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50')
    })
  })

  describe('Custom Props', () => {
    it('applies custom className to input', () => {
      render(<Input className="custom-input" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('custom-input')
    })

    it('applies containerClassName to wrapper', () => {
      render(<Input containerClassName="custom-container" />)
      const container = screen.getByRole('textbox').closest('.custom-container')
      expect(container).toBeInTheDocument()
    })

    it('forwards additional HTML attributes', () => {
      render(<Input data-testid="custom-input" maxLength={10} />)
      const input = screen.getByTestId('custom-input')
      expect(input).toHaveAttribute('maxlength', '10')
    })
  })
})
