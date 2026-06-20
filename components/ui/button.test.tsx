import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {describe, expect, it, vi} from 'vitest'

import {Button} from './button'

describe('Button', () => {
  describe('Basic Rendering', () => {
    it('renders button with text content', () => {
      render(<Button>Connect Wallet</Button>)
      expect(screen.getByRole('button', {name: 'Connect Wallet'})).toBeInTheDocument()
    })

    it('renders as a button element by default', () => {
      render(<Button>Click me</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('applies default variant classes', () => {
      render(<Button>Default</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-violet-600', 'text-white')
    })
  })

  describe('Variants', () => {
    it('applies destructive variant classes', () => {
      render(<Button variant="destructive">Delete</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-red-600', 'text-white')
    })

    it('applies outline variant classes', () => {
      render(<Button variant="outline">Outline</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('border', 'border-violet-300', 'bg-transparent', 'text-violet-700')
    })

    it('applies secondary variant classes', () => {
      render(<Button variant="secondary">Secondary</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-white/80', 'backdrop-blur-md')
    })

    it('applies ghost variant classes', () => {
      render(<Button variant="ghost">Ghost</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-transparent', 'text-violet-700')
    })

    it('applies link variant classes', () => {
      render(<Button variant="link">Link</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('text-violet-600', 'underline-offset-4')
    })

    it('applies web3Connected variant classes', () => {
      render(<Button variant="web3Connected">0x1234...5678</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-green-600', 'text-white')
    })

    it('applies web3Connecting variant classes', () => {
      render(<Button variant="web3Connecting">Connecting...</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-yellow-500', 'text-white')
    })

    it('applies web3Error variant classes', () => {
      render(<Button variant="web3Error">Error</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-red-600', 'border-2', 'border-red-400')
    })

    it('applies web3Network variant classes', () => {
      render(<Button variant="web3Network">Ethereum</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-blue-600', 'text-white')
    })

    it('applies web3Pending variant with animation', () => {
      render(<Button variant="web3Pending">Pending</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-orange-500', 'animate-pulse')
    })
  })

  describe('Sizes', () => {
    it('applies default size classes', () => {
      render(<Button>Default Size</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-10', 'px-4', 'py-2')
    })

    it('applies sm size classes', () => {
      render(<Button size="sm">Small</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-9', 'px-3', 'text-xs')
    })

    it('applies lg size classes', () => {
      render(<Button size="lg">Large</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-11', 'px-8')
    })

    it('applies xl size classes', () => {
      render(<Button size="xl">Extra Large</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-12', 'px-10', 'text-base')
    })

    it('applies icon size classes', () => {
      render(
        <Button size="icon" aria-label="icon button">
          ★
        </Button>,
      )
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-10', 'rounded-lg')
    })
  })

  describe('Full Width', () => {
    it('applies full width class when fullWidth is true', () => {
      render(<Button fullWidth>Full Width</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('w-full')
    })

    it('does not apply full width class by default', () => {
      render(<Button>Normal Width</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('w-auto')
    })
  })

  describe('Disabled State', () => {
    it('is disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveAttribute('aria-disabled', 'true')
    })

    it('applies disabled styles', () => {
      render(<Button disabled>Disabled</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50')
    })
  })

  describe('Loading State', () => {
    it('shows loading spinner when loading is true', () => {
      render(<Button loading>Loading</Button>)
      // Loading spinner is an SVG with aria-hidden
      const spinner = document.querySelector('svg[aria-hidden="true"]')
      expect(spinner).toBeInTheDocument()
    })

    it('is disabled when loading', () => {
      render(<Button loading>Loading</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveAttribute('aria-disabled', 'true')
    })

    it('does not show left icon when loading', () => {
      const LeftIcon = () => <span data-testid="left-icon">←</span>
      render(
        <Button loading leftIcon={<LeftIcon />}>
          Loading
        </Button>,
      )
      expect(screen.queryByTestId('left-icon')).not.toBeInTheDocument()
    })

    it('does not show right icon when loading', () => {
      const RightIcon = () => <span data-testid="right-icon">→</span>
      render(
        <Button loading rightIcon={<RightIcon />}>
          Loading
        </Button>,
      )
      expect(screen.queryByTestId('right-icon')).not.toBeInTheDocument()
    })
  })

  describe('Icons', () => {
    it('renders left icon when provided', () => {
      const LeftIcon = () => <span data-testid="left-icon">←</span>
      render(<Button leftIcon={<LeftIcon />}>With Left Icon</Button>)
      expect(screen.getByTestId('left-icon')).toBeInTheDocument()
    })

    it('renders right icon when provided', () => {
      const RightIcon = () => <span data-testid="right-icon">→</span>
      render(<Button rightIcon={<RightIcon />}>With Right Icon</Button>)
      expect(screen.getByTestId('right-icon')).toBeInTheDocument()
    })

    it('wraps left icon in aria-hidden span', () => {
      const LeftIcon = () => <span data-testid="left-icon">←</span>
      render(<Button leftIcon={<LeftIcon />}>With Left Icon</Button>)
      const iconWrapper = screen.getByTestId('left-icon').parentElement
      expect(iconWrapper).toHaveAttribute('aria-hidden', 'true')
    })

    it('wraps right icon in aria-hidden span', () => {
      const RightIcon = () => <span data-testid="right-icon">→</span>
      render(<Button rightIcon={<RightIcon />}>With Right Icon</Button>)
      const iconWrapper = screen.getByTestId('right-icon').parentElement
      expect(iconWrapper).toHaveAttribute('aria-hidden', 'true')
    })
  })

  describe('Click Handling', () => {
    it('fires onClick when clicked', async () => {
      const handleClick = vi.fn()
      render(<Button onClick={handleClick}>Click me</Button>)
      await userEvent.click(screen.getByRole('button'))
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('does not fire onClick when disabled', async () => {
      const handleClick = vi.fn()
      render(
        <Button disabled onClick={handleClick}>
          Disabled
        </Button>,
      )
      await userEvent.click(screen.getByRole('button'))
      expect(handleClick).not.toHaveBeenCalled()
    })

    it('does not fire onClick when loading', async () => {
      const handleClick = vi.fn()
      render(
        <Button loading onClick={handleClick}>
          Loading
        </Button>,
      )
      await userEvent.click(screen.getByRole('button'))
      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe('Custom Props', () => {
    it('applies custom className', () => {
      render(<Button className="custom-class">Test</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
    })

    it('forwards additional HTML attributes', () => {
      render(
        <Button data-testid="custom-button" aria-label="custom label">
          Test
        </Button>,
      )
      expect(screen.getByTestId('custom-button')).toBeInTheDocument()
      expect(screen.getByLabelText('custom label')).toBeInTheDocument()
    })

    it('has type="button" by default', () => {
      render(<Button>Test</Button>)
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
    })
  })
})
