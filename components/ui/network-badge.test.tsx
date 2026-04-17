import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi, type Mock} from 'vitest'

// Import useWallet to get access to the mock
import {useWallet} from '@/hooks/use-wallet'

import {NetworkBadge} from './network-badge'

// Mock the useWallet hook
const mockSwitchToChain = vi.fn()
const mockGetUnsupportedNetworkError = vi.fn()
const mockGetSupportedChains = vi.fn()

vi.mock('@/hooks/use-wallet', () => ({
  useWallet: vi.fn(() => ({
    chainId: 1,
    currentNetwork: {name: 'Ethereum Mainnet', symbol: 'ETH'},
    isCurrentChainSupported: true,
    getUnsupportedNetworkError: mockGetUnsupportedNetworkError,
    switchToChain: mockSwitchToChain,
    isSwitchingChain: false,
    getSupportedChains: mockGetSupportedChains,
    address: '0x1234567890123456789012345678901234567890',
    isConnected: true,
    connect: vi.fn(),
    disconnect: vi.fn(),
    isConnecting: false,
    isDisconnecting: false,
    error: null,
    handleUnsupportedNetwork: vi.fn(),
  })),
}))

// Mock child components
vi.mock('./badge', () => ({
  Badge: ({
    children,
    variant,
    size,
    showDot,
    icon,
  }: {
    children: React.ReactNode
    variant?: string
    size?: string
    showDot?: boolean
    icon?: React.ReactNode
  }) => (
    <div data-testid="badge" data-variant={variant} data-size={size} data-show-dot={showDot?.toString()}>
      {Boolean(icon) && <span data-testid="badge-icon">{icon}</span>}
      {children}
    </div>
  ),
}))

vi.mock('./button', () => ({
  Button: ({
    children,
    onClick,
    disabled,
    variant,
    size,
  }: {
    children: React.ReactNode
    onClick?: () => void
    disabled?: boolean
    variant?: string
    size?: string
  }) => (
    <button
      type="button"
      data-testid="button"
      onClick={onClick}
      disabled={disabled}
      data-variant={variant}
      data-size={size}
    >
      {children}
    </button>
  ),
}))

describe('NetworkBadge', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()

    // Reset the useWallet mock to default state
    ;(useWallet as Mock).mockReturnValue({
      chainId: 11155111,
      currentNetwork: {name: 'Sepolia', symbol: 'ETH'},
      isCurrentChainSupported: true,
      getUnsupportedNetworkError: mockGetUnsupportedNetworkError,
      switchToChain: mockSwitchToChain,
      isSwitchingChain: false,
      getSupportedChains: mockGetSupportedChains,
      address: '0x1234567890123456789012345678901234567890',
      isConnected: true,
      connect: vi.fn(),
      disconnect: vi.fn(),
      isConnecting: false,
      isDisconnecting: false,
      error: null,
      handleUnsupportedNetwork: vi.fn(),
    })

    mockGetSupportedChains.mockReturnValue([{id: 11155111, name: 'Sepolia', symbol: 'ETH'}])
    mockGetUnsupportedNetworkError.mockReturnValue(null)
  })

  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      render(<NetworkBadge />)

      expect(screen.getByTestId('badge')).toBeInTheDocument()
      expect(screen.getByText('ETH')).toBeInTheDocument()
    })

    it('applies custom className', () => {
      const {container} = render(<NetworkBadge className="custom-class" />)

      expect(container.firstChild).toHaveClass('custom-class')
      expect(container.firstChild).toHaveClass('relative')
    })

    it('shows full network name when showFullName is true', () => {
      render(<NetworkBadge showFullName />)

      expect(screen.getByText('Sepolia')).toBeInTheDocument()
    })

    it('shows custom name when provided', () => {
      render(<NetworkBadge customName="Custom Network" />)

      expect(screen.getByText('Custom Network')).toBeInTheDocument()
    })
  })

  describe('Variants and Styling', () => {
    it('applies default variant classes', () => {
      const {container} = render(<NetworkBadge />)

      const innerDiv = container.querySelector('.inline-flex')
      expect(innerDiv).toHaveClass('text-gray-700', 'dark:text-gray-300')
    })

    it('applies interactive variant classes', () => {
      const {container} = render(<NetworkBadge variant="interactive" />)

      const innerDiv = container.querySelector('.inline-flex')
      expect(innerDiv).toHaveClass('cursor-pointer', 'rounded-lg')
    })

    it('applies card variant classes', () => {
      const {container} = render(<NetworkBadge variant="card" />)

      const innerDiv = container.querySelector('.inline-flex')
      expect(innerDiv).toHaveClass('bg-gray-50', 'border', 'border-gray-200')
    })

    it('applies glass variant classes', () => {
      const {container} = render(<NetworkBadge variant="glass" />)

      const innerDiv = container.querySelector('.inline-flex')
      expect(innerDiv).toHaveClass('bg-white/60', 'backdrop-blur-md')
    })

    it('applies size variants correctly', () => {
      const {rerender, container} = render(<NetworkBadge size="sm" />)
      let innerDiv = container.querySelector('.inline-flex')
      expect(innerDiv).toHaveClass('text-xs', 'gap-1.5')

      rerender(<NetworkBadge size="lg" />)
      innerDiv = container.querySelector('.inline-flex')
      expect(innerDiv).toHaveClass('text-base', 'gap-2.5')
    })
  })

  describe('Network Status', () => {
    it('shows connecting status when isSwitchingChain is true', async () => {
      const {useWallet} = await import('@/hooks/use-wallet')
      ;(useWallet as Mock).mockReturnValue({
        chainId: 11155111,
        currentNetwork: {name: 'Sepolia', symbol: 'ETH'},
        isCurrentChainSupported: true,
        getUnsupportedNetworkError: mockGetUnsupportedNetworkError,
        switchToChain: mockSwitchToChain,
        isSwitchingChain: true,
        getSupportedChains: mockGetSupportedChains,
      })

      render(<NetworkBadge />)

      expect(screen.getByText('Switching...')).toBeInTheDocument()
    })

    it('shows disconnected status when no chainId', async () => {
      const {useWallet} = await import('@/hooks/use-wallet')
      ;(useWallet as Mock).mockReturnValue({
        chainId: null,
        currentNetwork: null,
        isCurrentChainSupported: false,
        getUnsupportedNetworkError: mockGetUnsupportedNetworkError,
        switchToChain: mockSwitchToChain,
        isSwitchingChain: false,
        getSupportedChains: mockGetSupportedChains,
      })

      render(<NetworkBadge />)

      expect(screen.getByText('⭕ Disconnected')).toBeInTheDocument()
      expect(screen.getByText('N/A')).toBeInTheDocument()
    })

    it('shows unsupported status for unsupported networks', async () => {
      const {useWallet} = await import('@/hooks/use-wallet')
      ;(useWallet as Mock).mockReturnValue({
        chainId: 999,
        currentNetwork: null,
        isCurrentChainSupported: false,
        getUnsupportedNetworkError: mockGetUnsupportedNetworkError,
        switchToChain: mockSwitchToChain,
        isSwitchingChain: false,
        getSupportedChains: mockGetSupportedChains,
      })

      render(<NetworkBadge />)

      expect(screen.getByText('⚠️ Unsupported')).toBeInTheDocument()
      expect(screen.getByText('Unknown')).toBeInTheDocument()
    })
  })

  describe('Network Icons and Features', () => {
    it('shows network icon when showIcon is true', () => {
      render(<NetworkBadge showIcon />)

      expect(screen.getByTestId('badge-icon')).toBeInTheDocument()
    })

    it('shows status dot when showStatusDot is true', () => {
      render(<NetworkBadge showStatusDot />)

      const badge = screen.getByTestId('badge')
      expect(badge).toHaveAttribute('data-show-dot', 'true')
    })

    it('displays correct network icons for different chains', async () => {
      const {useWallet} = await import('@/hooks/use-wallet')

      // Test Sepolia (the only supported chain)
      ;(useWallet as Mock).mockReturnValue({
        chainId: 11155111,
        currentNetwork: {name: 'Sepolia', symbol: 'ETH'},
        isCurrentChainSupported: true,
        getUnsupportedNetworkError: mockGetUnsupportedNetworkError,
        switchToChain: mockSwitchToChain,
        isSwitchingChain: false,
        getSupportedChains: mockGetSupportedChains,
      })

      render(<NetworkBadge showIcon />)
      expect(screen.getByText('🧪')).toBeInTheDocument()
    })
  })

  describe('Network Switching Functionality', () => {
    it('shows dropdown when showSwitcher is true and clicked', async () => {
      render(<NetworkBadge showSwitcher />)

      const networkBadge = screen.getByRole('button')
      await user.click(networkBadge)

      expect(screen.getByText('Switch Network')).toBeInTheDocument()
      expect(screen.getByText('Sepolia')).toBeInTheDocument()
    })

    it('handles keyboard navigation for switcher', async () => {
      render(<NetworkBadge showSwitcher />)

      const networkBadge = screen.getByRole('button')
      networkBadge.focus()
      await user.keyboard('{Enter}')

      await waitFor(() => {
        expect(screen.getByText('Switch Network')).toBeInTheDocument()
      })
    })

    it('calls switchToChain when network is selected', async () => {
      // Set wallet to unsupported chain so Sepolia option is selectable (not current)
      ;(useWallet as Mock).mockReturnValue({
        chainId: 999,
        currentNetwork: null,
        isCurrentChainSupported: false,
        getUnsupportedNetworkError: mockGetUnsupportedNetworkError,
        switchToChain: mockSwitchToChain,
        isSwitchingChain: false,
        getSupportedChains: mockGetSupportedChains,
        address: '0x1234567890123456789012345678901234567890',
        isConnected: true,
      })
      render(<NetworkBadge showSwitcher />)

      const networkBadge = screen.getByRole('button')
      await user.click(networkBadge)

      const sepoliaOption = screen.getByText('Sepolia')
      await user.click(sepoliaOption)

      expect(mockSwitchToChain).toHaveBeenCalledWith(11155111)
    })

    it('calls onNetworkSwitch callback when provided', async () => {
      // Set wallet to unsupported chain so Sepolia option is selectable
      ;(useWallet as Mock).mockReturnValue({
        chainId: 999,
        currentNetwork: null,
        isCurrentChainSupported: false,
        getUnsupportedNetworkError: mockGetUnsupportedNetworkError,
        switchToChain: mockSwitchToChain,
        isSwitchingChain: false,
        getSupportedChains: mockGetSupportedChains,
        address: '0x1234567890123456789012345678901234567890',
        isConnected: true,
      })
      const onNetworkSwitch = vi.fn()
      render(<NetworkBadge showSwitcher onNetworkSwitch={onNetworkSwitch} />)

      const networkBadge = screen.getByRole('button')
      await user.click(networkBadge)

      const sepoliaOption = screen.getByText('Sepolia')
      await user.click(sepoliaOption)

      await waitFor(() => {
        expect(onNetworkSwitch).toHaveBeenCalledWith(11155111)
      })
    })

    it('closes dropdown when clicking outside', async () => {
      render(
        <div>
          <NetworkBadge showSwitcher />
          <div data-testid="outside">Outside</div>
        </div>,
      )

      const networkBadge = screen.getByRole('button')
      await user.click(networkBadge)

      expect(screen.getByText('Switch Network')).toBeInTheDocument()

      const outside = screen.getByTestId('outside')
      await user.click(outside)

      expect(screen.queryByText('Switch Network')).not.toBeInTheDocument()
    })

    it('shows current network indicator in dropdown', async () => {
      render(<NetworkBadge showSwitcher />)

      const networkBadge = screen.getByRole('button')
      await user.click(networkBadge)

      expect(screen.getByText('Current')).toBeInTheDocument()
    })

    it('disables current network option in dropdown', async () => {
      render(<NetworkBadge showSwitcher />)

      const networkBadge = screen.getByRole('button')
      await user.click(networkBadge)

      const sepoliaButton = screen.getByText('Sepolia').closest('button')
      expect(sepoliaButton).toBeDisabled()
    })
  })

  describe('Unsupported Network Warning', () => {
    it('shows unsupported network warning when enabled and network is unsupported', async () => {
      const {useWallet} = await import('@/hooks/use-wallet')
      const mockError = {
        isUnsupported: true,
        currentChainId: 999,
        suggestedChain: {id: 11155111, name: 'Sepolia'},
        error: new Error('Unsupported network'),
      }

      ;(useWallet as Mock).mockReturnValue({
        chainId: 999,
        currentNetwork: null,
        isCurrentChainSupported: false,
        getUnsupportedNetworkError: () => mockError,
        switchToChain: mockSwitchToChain,
        isSwitchingChain: false,
        getSupportedChains: mockGetSupportedChains,
      })

      mockGetUnsupportedNetworkError.mockReturnValue(mockError)

      render(<NetworkBadge showUnsupportedWarning />)

      expect(screen.getByText('Switch to a supported network to continue')).toBeInTheDocument()
      expect(screen.getByText('Switch to Sepolia')).toBeInTheDocument()
    })

    it('handles switch to Sepolia from unsupported warning', async () => {
      const {useWallet} = await import('@/hooks/use-wallet')
      const mockError = {
        isUnsupported: true,
        currentChainId: 999,
        suggestedChain: {id: 11155111, name: 'Sepolia'},
        error: new Error('Unsupported network'),
      }

      ;(useWallet as Mock).mockReturnValue({
        chainId: 999,
        currentNetwork: null,
        isCurrentChainSupported: false,
        getUnsupportedNetworkError: () => mockError,
        switchToChain: mockSwitchToChain,
        isSwitchingChain: false,
        getSupportedChains: mockGetSupportedChains,
      })

      mockGetUnsupportedNetworkError.mockReturnValue(mockError)

      render(<NetworkBadge showUnsupportedWarning />)

      const switchButton = screen.getByText('Switch to Sepolia')
      await user.click(switchButton)

      expect(mockSwitchToChain).toHaveBeenCalledWith(11155111)
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<NetworkBadge showSwitcher />)

      const networkBadge = screen.getByRole('button')
      expect(networkBadge).toHaveAttribute('aria-label')
      expect(networkBadge.getAttribute('aria-label')).toContain('Current network: ETH')
    })

    it('supports keyboard navigation', async () => {
      render(<NetworkBadge showSwitcher />)

      const networkBadge = screen.getByRole('button')
      expect(networkBadge).toHaveAttribute('tabIndex', '0')

      await user.tab()
      expect(networkBadge).toHaveFocus()
    })

    it('has proper role for non-interactive mode', () => {
      render(<NetworkBadge />)

      const container = screen.getByTestId('badge').closest('div')
      expect(container).not.toHaveAttribute('role', 'button')
    })
  })

  describe('Error Handling', () => {
    it('handles switchToChain errors gracefully', async () => {
      // Set wallet to unsupported chain so Sepolia option is selectable
      ;(useWallet as Mock).mockReturnValue({
        chainId: 999,
        currentNetwork: null,
        isCurrentChainSupported: false,
        getUnsupportedNetworkError: mockGetUnsupportedNetworkError,
        switchToChain: mockSwitchToChain,
        isSwitchingChain: false,
        getSupportedChains: mockGetSupportedChains,
        address: '0x1234567890123456789012345678901234567890',
        isConnected: true,
      })
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockSwitchToChain.mockRejectedValue(new Error('Switch failed'))

      render(<NetworkBadge showSwitcher />)

      const networkBadge = screen.getByRole('button')
      await user.click(networkBadge)

      const sepoliaOption = screen.getByText('Sepolia')
      await user.click(sepoliaOption)

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Failed to switch network:', expect.any(Error))
      })

      consoleError.mockRestore()
    })
  })

  describe('Status Prop Override', () => {
    it('uses provided status prop over computed status', () => {
      const {container} = render(<NetworkBadge status="error" />)

      expect(screen.getByText('❌ Error')).toBeInTheDocument()
      const innerDiv = container.querySelector('.inline-flex')
      expect(innerDiv).toHaveClass('text-red-600', 'dark:text-red-400')
    })

    it('shows animate-pulse for connecting status', () => {
      const {container} = render(<NetworkBadge status="connecting" />)

      const innerDiv = container.querySelector('.inline-flex')
      expect(innerDiv).toHaveClass('animate-pulse')
    })

    it('shows opacity-60 for disconnected status', () => {
      const {container} = render(<NetworkBadge status="disconnected" />)

      const innerDiv = container.querySelector('.inline-flex')
      expect(innerDiv).toHaveClass('opacity-60')
    })
  })
})
