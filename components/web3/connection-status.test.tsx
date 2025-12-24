import {useWallet} from '@/hooks/use-wallet'
import {fireEvent, render, screen} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {ConnectionStatus} from './connection-status'

const mockConnect = vi.fn().mockResolvedValue(undefined)
const mockDisconnect = vi.fn().mockResolvedValue(undefined)
const mockClearError = vi.fn()

vi.mock('@/hooks/use-wallet', () => ({
  useWallet: vi.fn(() => ({
    address: undefined,
    isConnected: false,
    isConnecting: false,
    chainId: undefined,
    isCurrentChainSupported: true,
    connect: mockConnect,
    disconnect: mockDisconnect,
    error: null,
    clearError: mockClearError,
  })),
}))

vi.mock('@/components/ui/network-badge', () => ({
  NetworkBadge: () => <div data-testid="network-badge">Network Badge</div>,
}))

vi.mock('@/components/ui/address-display', () => ({
  AddressDisplay: ({address}: {address: string}) => (
    <span data-testid="address-display">{`${address.slice(0, 6)}...${address.slice(-4)}`}</span>
  ),
}))

const mockUseWallet = vi.mocked(useWallet)

const createMockWalletReturn = (overrides = {}) =>
  ({
    address: undefined,
    isConnected: false,
    isConnecting: false,
    isReconnecting: false,
    chainId: undefined,
    isCurrentChainSupported: true,
    connect: mockConnect,
    disconnect: mockDisconnect,
    error: null,
    clearError: mockClearError,
    ...overrides,
  }) as unknown as ReturnType<typeof useWallet>

describe('ConnectionStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseWallet.mockReturnValue(createMockWalletReturn())
  })

  describe('Disconnected State', () => {
    it('should show connect button when not connected', () => {
      render(<ConnectionStatus />)
      expect(screen.getByRole('button', {name: /connect wallet/i})).toBeInTheDocument()
    })

    it('should call connect when button is clicked', () => {
      render(<ConnectionStatus />)
      fireEvent.click(screen.getByRole('button', {name: /connect wallet/i}))
      expect(mockConnect).toHaveBeenCalled()
    })

    it('should show connecting state', () => {
      mockUseWallet.mockReturnValue(createMockWalletReturn({isConnecting: true}))

      render(<ConnectionStatus />)
      expect(screen.getByRole('button', {name: /connecting/i})).toBeInTheDocument()
      expect(screen.getByRole('button')).toBeDisabled()
    })
  })

  describe('Connected State - Compact Variant', () => {
    beforeEach(() => {
      mockUseWallet.mockReturnValue(
        createMockWalletReturn({
          address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
          isConnected: true,
          chainId: 1,
        }),
      )
    })

    it('should show address display', () => {
      render(<ConnectionStatus variant="compact" />)
      expect(screen.getByTestId('address-display')).toBeInTheDocument()
    })

    it('should show disconnect button', () => {
      render(<ConnectionStatus variant="compact" />)
      expect(screen.getByRole('button', {name: /disconnect/i})).toBeInTheDocument()
    })

    it('should call disconnect when button is clicked', () => {
      render(<ConnectionStatus variant="compact" />)
      fireEvent.click(screen.getByRole('button', {name: /disconnect/i}))
      expect(mockDisconnect).toHaveBeenCalled()
    })
  })

  describe('Connected State - Full Variant', () => {
    beforeEach(() => {
      mockUseWallet.mockReturnValue(
        createMockWalletReturn({
          address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
          isConnected: true,
          chainId: 1,
        }),
      )
    })

    it('should show connected indicator', () => {
      render(<ConnectionStatus variant="full" />)
      expect(screen.getByText(/connected/i)).toBeInTheDocument()
    })

    it('should show address section', () => {
      render(<ConnectionStatus variant="full" />)
      expect(screen.getByText(/address/i)).toBeInTheDocument()
    })

    it('should show network section when showNetworkBadge is true', () => {
      render(<ConnectionStatus variant="full" showNetworkBadge />)
      expect(screen.getByText('Network')).toBeInTheDocument()
    })

    it('should hide network section when showNetworkBadge is false', () => {
      render(<ConnectionStatus variant="full" showNetworkBadge={false} />)
      expect(screen.queryByText(/network/i)).not.toBeInTheDocument()
    })
  })

  describe('Unsupported Network', () => {
    beforeEach(() => {
      mockUseWallet.mockReturnValue(
        createMockWalletReturn({
          address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
          isConnected: true,
          chainId: 999,
          isCurrentChainSupported: false,
        }),
      )
    })

    it('should show warning for unsupported network in full variant', () => {
      render(<ConnectionStatus variant="full" showNetworkBadge />)
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText(/switch to a supported network/i)).toBeInTheDocument()
    })
  })

  describe('Error State', () => {
    beforeEach(() => {
      mockUseWallet.mockReturnValue(
        createMockWalletReturn({
          error: {
            code: 'USER_REJECTED',
            message: 'User rejected the request',
            userFriendlyMessage: 'You rejected the connection request.',
            recoverable: true,
            walletType: 'metamask',
          },
        }),
      )
    })

    it('should show error message', () => {
      render(<ConnectionStatus />)
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText(/rejected the connection/i)).toBeInTheDocument()
    })

    it('should call clearError when dismiss is clicked', () => {
      render(<ConnectionStatus />)
      fireEvent.click(screen.getByRole('button', {name: /dismiss/i}))
      expect(mockClearError).toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('should have accessible connect button', () => {
      render(<ConnectionStatus />)
      const button = screen.getByRole('button', {name: /connect wallet/i})
      expect(button).toBeInTheDocument()
    })

    it('should have role="alert" on error messages', () => {
      mockUseWallet.mockReturnValue(
        createMockWalletReturn({
          error: {
            code: 'CONNECTION_ERROR',
            message: 'Connection failed',
            userFriendlyMessage: 'Could not connect to wallet.',
            recoverable: true,
            walletType: 'unknown',
          },
        }),
      )

      render(<ConnectionStatus />)
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })
})
