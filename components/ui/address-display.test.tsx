import {render, screen} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {AddressDisplay} from './address-display'

// Mock clipboard API
const mockClipboard = {
  writeText: vi.fn(),
}
Object.assign(navigator, {
  clipboard: mockClipboard,
})

// Mock window.open for external link tests
const mockWindowOpen = vi.fn()
Object.assign(window, {
  open: mockWindowOpen,
})

describe('AddressDisplay', () => {
  const validAddress = '0x742d35Cc6635C0532925a3b8D8B12567dC5E0123'
  const invalidAddress = 'invalid-address'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('renders valid address with default formatting', () => {
      render(<AddressDisplay address={validAddress} />)
      expect(screen.getByText('0x742d...0123')).toBeInTheDocument()
    })

    it('renders with custom character count', () => {
      render(<AddressDisplay address={validAddress} chars={6} />)
      expect(screen.getByText('0x742d35...5E0123')).toBeInTheDocument()
    })

    it('renders full address if shorter than chars * 2', () => {
      const shortAddress = '0x123456'
      render(<AddressDisplay address={shortAddress} />)
      expect(screen.getByText('0x123456')).toBeInTheDocument()
    })

    it('shows full address on hover via title attribute', () => {
      render(<AddressDisplay address={validAddress} />)
      const addressElement = screen.getByText('0x742d...0123')
      expect(addressElement).toHaveAttribute('title', validAddress)
    })
  })

  describe('Variants and Sizing', () => {
    it('applies default variant and size classes', () => {
      render(<AddressDisplay address={validAddress} />)
      const container = screen.getByRole('group')
      expect(container).toHaveClass('text-gray-700', 'text-sm', 'gap-2')
    })

    it('applies card variant classes', () => {
      render(<AddressDisplay address={validAddress} variant="card" />)
      const container = screen.getByRole('group')
      expect(container).toHaveClass('bg-gray-50', 'border', 'border-gray-200', 'rounded-lg', 'px-3', 'py-2')
    })

    it('applies glass variant classes', () => {
      render(<AddressDisplay address={validAddress} variant="glass" />)
      const container = screen.getByRole('group')
      expect(container).toHaveClass('bg-white/60', 'backdrop-blur-md', 'border', 'border-white/20')
    })

    it('applies primary variant classes', () => {
      render(<AddressDisplay address={validAddress} variant="primary" />)
      const container = screen.getByRole('group')
      expect(container).toHaveClass('bg-violet-50', 'text-violet-700', 'border-violet-200')
    })

    it('applies small size classes', () => {
      render(<AddressDisplay address={validAddress} size="sm" />)
      const container = screen.getByRole('group')
      expect(container).toHaveClass('text-xs', 'gap-1.5')
    })

    it('applies large size classes', () => {
      render(<AddressDisplay address={validAddress} size="lg" />)
      const container = screen.getByRole('group')
      expect(container).toHaveClass('text-base', 'gap-2.5')
    })
  })

  describe('Address Validation', () => {
    it('renders valid address normally', () => {
      render(<AddressDisplay address={validAddress} />)
      const addressElement = screen.getByText('0x742d...0123')
      expect(addressElement).not.toHaveClass('text-red-600')
    })

    it('highlights invalid address when validation enabled', () => {
      render(<AddressDisplay address={invalidAddress} validateAddress={true} />)
      const addressElement = screen.getByText('invalid-address')
      expect(addressElement).toHaveClass('text-red-600')
    })

    it('does not highlight invalid address when validation disabled', () => {
      render(<AddressDisplay address={invalidAddress} validateAddress={false} />)
      const addressElement = screen.getByText('invali...ress')
      expect(addressElement).not.toHaveClass('text-red-600')
    })

    it('disables copy button for invalid addresses', () => {
      render(<AddressDisplay address={invalidAddress} showCopy={true} />)
      const copyButton = screen.getByLabelText('Copy address')
      expect(copyButton).toBeDisabled()
    })

    it('disables external link button for invalid addresses', () => {
      render(<AddressDisplay address={invalidAddress} showExternalLink={true} />)
      const linkButton = screen.getByLabelText('View on block explorer')
      expect(linkButton).toBeDisabled()
    })
  })

  describe('Copy Functionality', () => {
    it('shows copy button by default', () => {
      render(<AddressDisplay address={validAddress} />)
      expect(screen.getByLabelText('Copy address')).toBeInTheDocument()
    })

    it('hides copy button when showCopy is false', () => {
      render(<AddressDisplay address={validAddress} showCopy={false} />)
      expect(screen.queryByLabelText('Copy address')).not.toBeInTheDocument()
    })
  })

  describe('External Link Functionality', () => {
    it('hides external link button by default', () => {
      render(<AddressDisplay address={validAddress} />)
      expect(screen.queryByLabelText('View on block explorer')).not.toBeInTheDocument()
    })

    it('shows external link button when showExternalLink is true', () => {
      render(<AddressDisplay address={validAddress} showExternalLink={true} />)
      expect(screen.getByLabelText('View on block explorer')).toBeInTheDocument()
    })

    it('does not open link for invalid addresses', () => {
      render(<AddressDisplay address={invalidAddress} showExternalLink={true} />)
      const linkButton = screen.getByLabelText('View on block explorer')
      expect(linkButton).toBeDisabled()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<AddressDisplay address={validAddress} />)
      const container = screen.getByRole('group')
      expect(container).toHaveAttribute('aria-label', `Ethereum address: ${validAddress}`)
    })

    it('accepts custom ARIA label', () => {
      const customLabel = 'Wallet address for current user'
      render(<AddressDisplay address={validAddress} aria-label={customLabel} />)
      const container = screen.getByRole('group')
      expect(container).toHaveAttribute('aria-label', customLabel)
    })

    it('has selectable address text', () => {
      render(<AddressDisplay address={validAddress} />)
      const addressElement = screen.getByText('0x742d...0123')
      expect(addressElement).toHaveClass('select-all')
    })

    it('has proper focus management for buttons', () => {
      render(<AddressDisplay address={validAddress} showCopy={true} showExternalLink={true} />)
      const copyButton = screen.getByLabelText('Copy address')
      const linkButton = screen.getByLabelText('View on block explorer')

      expect(copyButton).toHaveClass('focus:outline-none', 'focus:ring-2')
      expect(linkButton).toHaveClass('focus:outline-none', 'focus:ring-2')
    })
  })

  describe('Custom Props', () => {
    it('applies custom className', () => {
      render(<AddressDisplay address={validAddress} className="custom-class" />)
      const container = screen.getByRole('group')
      expect(container).toHaveClass('custom-class')
    })

    it('forwards additional props to container', () => {
      render(<AddressDisplay address={validAddress} data-testid="address-display" />)
      const container = screen.getByTestId('address-display')
      expect(container).toBeInTheDocument()
    })
  })

  describe('Button Visibility', () => {
    it('shows buttons on hover via group-hover classes', () => {
      render(<AddressDisplay address={validAddress} showCopy={true} showExternalLink={true} />)
      const copyButton = screen.getByLabelText('Copy address')
      const linkButton = screen.getByLabelText('View on block explorer')

      expect(copyButton).toHaveClass('opacity-0', 'group-hover:opacity-100')
      expect(linkButton).toHaveClass('opacity-0', 'group-hover:opacity-100')
    })

    it('shows buttons on focus-within via group-focus-within classes', () => {
      render(<AddressDisplay address={validAddress} showCopy={true} showExternalLink={true} />)
      const copyButton = screen.getByLabelText('Copy address')
      const linkButton = screen.getByLabelText('View on block explorer')

      expect(copyButton).toHaveClass('group-focus-within:opacity-100')
      expect(linkButton).toHaveClass('group-focus-within:opacity-100')
    })
  })
})
