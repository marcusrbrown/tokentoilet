import {WalletButton} from '@/components/web3/wallet-button'
import {useWallet} from '@/hooks/use-wallet'
import {render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi, type Mock} from 'vitest'

vi.mock('@/hooks/use-wallet', () => ({
  useWallet: vi.fn(),
}))

vi.mock('lucide-react', () => ({
  Wallet: () => <div data-testid="wallet-icon" />,
  AlertTriangle: () => <div data-testid="alert-icon" />,
}))

const mockUseWallet = useWallet as Mock

describe('WalletButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Disconnected State', () => {
    beforeEach(() => {
      mockUseWallet.mockReturnValue({
        address: null,
        isConnected: false,
        connect: vi.fn().mockResolvedValue(undefined),
        disconnect: vi.fn().mockResolvedValue(undefined),
        isCurrentChainSupported: true,
        getUnsupportedNetworkError: vi.fn().mockReturnValue(null),
        handleUnsupportedNetwork: vi.fn().mockResolvedValue(undefined),
        currentNetwork: null,
      })
    })

    it('should render connect button when disconnected', () => {
      render(<WalletButton />)

      const button = screen.getByRole('button', {name: /connect wallet/i})
      expect(button).toBeInTheDocument()
    })

    it('should display wallet icon in connect button', () => {
      render(<WalletButton />)

      expect(screen.getByTestId('wallet-icon')).toBeInTheDocument()
    })

    it('should call connect when connect button is clicked', async () => {
      const mockConnect = vi.fn().mockResolvedValue(undefined)
      mockUseWallet.mockReturnValue({
        ...mockUseWallet(),
        connect: mockConnect,
      })

      render(<WalletButton />)

      const button = screen.getByRole('button', {name: /connect wallet/i})
      await userEvent.click(button)

      expect(mockConnect).toHaveBeenCalledTimes(1)
    })

    it('should handle connection errors gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      const mockConnect = vi.fn().mockRejectedValue(new Error('Connection failed'))
      mockUseWallet.mockReturnValue({
        ...mockUseWallet(),
        connect: mockConnect,
      })

      render(<WalletButton />)

      const button = screen.getByRole('button', {name: /connect wallet/i})
      await userEvent.click(button)

      expect(mockConnect).toHaveBeenCalledTimes(1)
      await vi.waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Failed to connect:', expect.any(Error))
      })

      consoleError.mockRestore()
    })
  })

  describe('Connected State', () => {
    const mockAddress = '0x1234567890123456789012345678901234567890'

    beforeEach(() => {
      mockUseWallet.mockReturnValue({
        address: mockAddress,
        isConnected: true,
        connect: vi.fn().mockResolvedValue(undefined),
        disconnect: vi.fn().mockResolvedValue(undefined),
        isCurrentChainSupported: true,
        getUnsupportedNetworkError: vi.fn().mockReturnValue(null),
        handleUnsupportedNetwork: vi.fn().mockResolvedValue(undefined),
        currentNetwork: {
          id: 1,
          name: 'Ethereum Mainnet',
          symbol: 'ETH',
        },
      })
    })

    it('should render connected state with formatted address', () => {
      render(<WalletButton />)

      expect(screen.getByText(/0x1234/)).toBeInTheDocument()
    })

    it('should display network badge when connected', () => {
      render(<WalletButton />)

      expect(screen.getByText('Ethereum Mainnet')).toBeInTheDocument()
    })

    it('should call disconnect when connected button is clicked', async () => {
      const mockDisconnect = vi.fn().mockResolvedValue(undefined)
      mockUseWallet.mockReturnValue({
        ...mockUseWallet(),
        disconnect: mockDisconnect,
      })

      render(<WalletButton />)

      const button = screen.getByRole('button')
      await userEvent.click(button)

      expect(mockDisconnect).toHaveBeenCalledTimes(1)
    })

    it('should handle disconnection errors gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      const mockDisconnect = vi.fn().mockRejectedValue(new Error('Disconnection failed'))
      mockUseWallet.mockReturnValue({
        ...mockUseWallet(),
        disconnect: mockDisconnect,
      })

      render(<WalletButton />)

      const button = screen.getByRole('button')
      await userEvent.click(button)

      expect(mockDisconnect).toHaveBeenCalledTimes(1)
      await vi.waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Failed to disconnect:', expect.any(Error))
      })

      consoleError.mockRestore()
    })
  })

  describe('Unsupported Network State', () => {
    const mockAddress = '0x1234567890123456789012345678901234567890'

    beforeEach(() => {
      mockUseWallet.mockReturnValue({
        address: mockAddress,
        isConnected: true,
        connect: vi.fn().mockResolvedValue(undefined),
        disconnect: vi.fn().mockResolvedValue(undefined),
        isCurrentChainSupported: false,
        getUnsupportedNetworkError: vi.fn().mockReturnValue({
          currentChainId: 5,
          supportedChainIds: [1, 137, 42161],
          suggestedChain: {
            id: 1,
            name: 'Ethereum Mainnet',
            symbol: 'ETH',
          },
          message: 'Please switch to a supported network',
          canAutoSwitch: true,
        }),
        handleUnsupportedNetwork: vi.fn().mockResolvedValue(undefined),
        currentNetwork: null,
      })
    })

    it('should display unsupported network error state', () => {
      render(<WalletButton />)

      expect(screen.getByText(/unsupported network/i)).toBeInTheDocument()
      expect(screen.getByText(/network not supported/i)).toBeInTheDocument()
    })

    it('should display alert icon in error state', () => {
      render(<WalletButton />)

      expect(screen.getByTestId('alert-icon')).toBeInTheDocument()
    })

    it('should show switch network button with suggested network', () => {
      render(<WalletButton />)

      expect(screen.getByRole('button', {name: /switch to ethereum mainnet/i})).toBeInTheDocument()
    })

    it('should call handleUnsupportedNetwork when switch button is clicked', async () => {
      const mockHandleUnsupported = vi.fn().mockResolvedValue(undefined)
      mockUseWallet.mockReturnValue({
        ...mockUseWallet(),
        handleUnsupportedNetwork: mockHandleUnsupported,
      })

      render(<WalletButton />)

      const switchButton = screen.getByRole('button', {name: /switch to ethereum mainnet/i})
      await userEvent.click(switchButton)

      expect(mockHandleUnsupported).toHaveBeenCalledWith(true)
    })

    it('should show loading state while switching networks', async () => {
      const mockHandleUnsupported = vi.fn().mockImplementation(
        async () =>
          new Promise(resolve => {
            setTimeout(resolve, 100)
          }),
      )
      mockUseWallet.mockReturnValue({
        ...mockUseWallet(),
        handleUnsupportedNetwork: mockHandleUnsupported,
      })

      render(<WalletButton />)

      const switchButton = screen.getByRole('button', {name: /switch to ethereum mainnet/i})
      await userEvent.click(switchButton)

      expect(screen.getByText(/switching\.\.\./i)).toBeInTheDocument()
    })

    it('should allow disconnect even when on unsupported network', async () => {
      const mockDisconnect = vi.fn().mockResolvedValue(undefined)
      mockUseWallet.mockReturnValue({
        ...mockUseWallet(),
        disconnect: mockDisconnect,
      })

      render(<WalletButton />)

      const disconnectButton = screen.getByRole('button', {name: /unsupported network/i})
      await userEvent.click(disconnectButton)

      expect(mockDisconnect).toHaveBeenCalledTimes(1)
    })

    it('should handle network switch errors gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      const mockHandleUnsupported = vi.fn().mockRejectedValue(new Error('Network switch failed'))
      mockUseWallet.mockReturnValue({
        ...mockUseWallet(),
        handleUnsupportedNetwork: mockHandleUnsupported,
      })

      render(<WalletButton />)

      const switchButton = screen.getByRole('button', {name: /switch to ethereum mainnet/i})
      await userEvent.click(switchButton)

      expect(mockHandleUnsupported).toHaveBeenCalledWith(true)
      await vi.waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Failed to switch network:', expect.any(Error))
      })

      consoleError.mockRestore()
    })
  })

  describe('Design System Integration', () => {
    it('should use design system Button component', () => {
      mockUseWallet.mockReturnValue({
        address: null,
        isConnected: false,
        connect: vi.fn(),
        disconnect: vi.fn(),
        isCurrentChainSupported: true,
        getUnsupportedNetworkError: vi.fn().mockReturnValue(null),
        handleUnsupportedNetwork: vi.fn(),
        currentNetwork: null,
      })

      const {container} = render(<WalletButton />)

      const button = container.querySelector('button')
      expect(button).toBeInTheDocument()
    })

    it('should use design system Badge for network display', () => {
      mockUseWallet.mockReturnValue({
        address: '0x1234567890123456789012345678901234567890',
        isConnected: true,
        connect: vi.fn(),
        disconnect: vi.fn(),
        isCurrentChainSupported: true,
        getUnsupportedNetworkError: vi.fn().mockReturnValue(null),
        handleUnsupportedNetwork: vi.fn(),
        currentNetwork: {
          id: 1,
          name: 'Ethereum Mainnet',
          symbol: 'ETH',
        },
      })

      render(<WalletButton />)

      expect(screen.getByText('Ethereum Mainnet')).toBeInTheDocument()
    })

    it('should use design system Card for error state', () => {
      mockUseWallet.mockReturnValue({
        address: '0x1234567890123456789012345678901234567890',
        isConnected: true,
        connect: vi.fn(),
        disconnect: vi.fn(),
        isCurrentChainSupported: false,
        getUnsupportedNetworkError: vi.fn().mockReturnValue({
          currentChainId: 5,
          supportedChainIds: [1, 137, 42161],
          suggestedChain: {
            id: 1,
            name: 'Ethereum Mainnet',
            symbol: 'ETH',
          },
          message: 'Please switch to a supported network',
          canAutoSwitch: true,
        }),
        handleUnsupportedNetwork: vi.fn(),
        currentNetwork: null,
      })

      render(<WalletButton />)

      expect(screen.getByText(/network not supported/i)).toBeInTheDocument()
    })
  })

  describe('Address Formatting', () => {
    it('should format long addresses correctly', () => {
      const longAddress = '0x1234567890123456789012345678901234567890'

      mockUseWallet.mockReturnValue({
        address: longAddress,
        isConnected: true,
        connect: vi.fn(),
        disconnect: vi.fn(),
        isCurrentChainSupported: true,
        getUnsupportedNetworkError: vi.fn().mockReturnValue(null),
        handleUnsupportedNetwork: vi.fn(),
        currentNetwork: {
          id: 1,
          name: 'Ethereum Mainnet',
          symbol: 'ETH',
        },
      })

      render(<WalletButton />)

      expect(screen.getByText(/0x1234/)).toBeInTheDocument()
    })

    it('should handle null address gracefully', () => {
      mockUseWallet.mockReturnValue({
        address: null,
        isConnected: false,
        connect: vi.fn(),
        disconnect: vi.fn(),
        isCurrentChainSupported: true,
        getUnsupportedNetworkError: vi.fn().mockReturnValue(null),
        handleUnsupportedNetwork: vi.fn(),
        currentNetwork: null,
      })

      render(<WalletButton />)

      expect(screen.getByRole('button', {name: /connect wallet/i})).toBeInTheDocument()
    })

    it('should handle undefined address gracefully', () => {
      mockUseWallet.mockReturnValue({
        address: undefined,
        isConnected: false,
        connect: vi.fn(),
        disconnect: vi.fn(),
        isCurrentChainSupported: true,
        getUnsupportedNetworkError: vi.fn().mockReturnValue(null),
        handleUnsupportedNetwork: vi.fn(),
        currentNetwork: null,
      })

      render(<WalletButton />)

      expect(screen.getByRole('button', {name: /connect wallet/i})).toBeInTheDocument()
    })
  })
})
