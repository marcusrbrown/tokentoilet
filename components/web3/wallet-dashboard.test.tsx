/* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */
import type {NetworkValidationError, UnsupportedNetworkError} from '@/hooks/use-wallet'
import {useWallet} from '@/hooks/use-wallet'
import {fireEvent, render, screen, waitFor} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {WalletDashboard} from './wallet-dashboard'

// Mock the useWallet hook - use vi.mocked to properly type the mock
vi.mock('@/hooks/use-wallet')
const mockUseWallet = vi.mocked(useWallet)

// Mock the utils
vi.mock('@/lib/utils', () => ({
  formatAddress: (address: string, chars = 4) => `${address.slice(0, chars)}...${address.slice(-chars)}`,
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}))

// Mock clipboard API
const mockWriteText = vi.fn().mockResolvedValue(undefined)
Object.assign(navigator, {
  clipboard: {
    writeText: mockWriteText,
  },
})

// Mock window.open
Object.assign(window, {
  open: vi.fn(),
})

// Test address with proper typing
const testAddress = '0x1234567890123456789012345678901234567890' as `0x${string}`

// Base wallet state for all tests
const mockConnect = vi.fn().mockResolvedValue(undefined)
const mockDisconnect = vi.fn().mockResolvedValue(undefined)
const mockSwitchToChain = vi.fn().mockResolvedValue(undefined)
const mockHandleUnsupportedNetwork = vi.fn().mockResolvedValue(undefined)

// Mock persistence object
const mockPersistence = {
  isAvailable: true,
  autoReconnect: true,
  lastWalletId: null,
  preferredChain: null,
  lastConnectionData: null,
  isRestoring: false,
  error: null,
  saveConnectionState: vi.fn().mockResolvedValue(true),
  clearStoredData: vi.fn().mockResolvedValue(true),
  setAutoReconnect: vi.fn().mockResolvedValue(true),
  setPreferredChain: vi.fn().mockResolvedValue(true),
  updateLastActive: vi.fn(),
  shouldRestore: vi.fn().mockReturnValue(false),
  getConnectionAge: vi.fn().mockReturnValue(null),
}

const defaultWalletState = {
  address: undefined as `0x${string}` | undefined,
  isConnected: false,
  connect: mockConnect,
  disconnect: mockDisconnect,
  chainId: 1, // Default to a valid chain ID
  currentNetwork: null,
  isCurrentChainSupported: false,
  getUnsupportedNetworkError: () => null,
  handleUnsupportedNetwork: mockHandleUnsupportedNetwork,
  getSupportedChains: () =>
    [
      {id: 1, name: 'Ethereum Mainnet', symbol: 'ETH'},
      {id: 137, name: 'Polygon', symbol: 'MATIC'},
      {id: 42161, name: 'Arbitrum One', symbol: 'ETH'},
    ] as any,
  switchToChain: mockSwitchToChain,
  isSwitchingChain: false,
  switchChainError: null,
  isSupportedChain: (chainId: number): chainId is any => [1, 137, 42161].includes(chainId),
  validateCurrentNetwork: vi.fn(() => null),
  persistence: mockPersistence,
}

describe('WalletDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock functions to return promises
    mockConnect.mockResolvedValue(undefined)
    mockDisconnect.mockResolvedValue(undefined)
    mockSwitchToChain.mockResolvedValue(undefined)
    mockHandleUnsupportedNetwork.mockResolvedValue(undefined)

    // Don't set a default state here - let individual describe blocks set their own
  })

  describe('Disconnected State', () => {
    beforeEach(() => {
      mockUseWallet.mockReturnValue(defaultWalletState as any)
    })

    it('displays connect wallet prompt when not connected', () => {
      render(<WalletDashboard />)

      expect(screen.getByText('Connect Your Wallet')).toBeInTheDocument()
      expect(screen.getByText(/Connect your Web3 wallet to view account details/)).toBeInTheDocument()
      expect(screen.getByRole('button', {name: /connect wallet/i})).toBeInTheDocument()
      expect(screen.getByText('No wallet connected')).toBeInTheDocument()
    })

    it('calls connect function when connect button is clicked', async () => {
      render(<WalletDashboard />)

      const connectButton = screen.getByRole('button', {name: /connect wallet/i})
      fireEvent.click(connectButton)

      expect(mockConnect).toHaveBeenCalledOnce()
    })

    it('shows loading state when connecting', async () => {
      mockConnect.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      render(<WalletDashboard />)

      const connectButton = screen.getByRole('button', {name: /connect wallet/i})
      fireEvent.click(connectButton)

      expect(screen.getByText('Connecting...')).toBeInTheDocument()
    })

    it('calls onConnectionStateChange when connecting', async () => {
      const onConnectionStateChange = vi.fn()
      mockConnect.mockResolvedValue(undefined)

      render(<WalletDashboard onConnectionStateChange={onConnectionStateChange} />)

      const connectButton = screen.getByRole('button', {name: /connect wallet/i})
      fireEvent.click(connectButton)

      await waitFor(() => {
        expect(onConnectionStateChange).toHaveBeenCalledWith(true)
      })
    })
  })

  describe('Connected State', () => {
    // Shared wallet states
    const connectedWalletState = {
      ...defaultWalletState,
      address: testAddress,
      isConnected: true,
      chainId: 1,
      currentNetwork: {name: 'Ethereum Mainnet', symbol: 'ETH'},
      isCurrentChainSupported: true,
    }

    beforeEach(() => {
      mockUseWallet.mockReturnValue(connectedWalletState as any)
    })

    it('displays account information when connected', () => {
      render(<WalletDashboard />)

      expect(screen.getByText('Account Information')).toBeInTheDocument()
      expect(screen.getByText('0x1234...567890')).toBeInTheDocument()
      expect(screen.getByText('Connected Account')).toBeInTheDocument()
      expect(screen.getAllByText('Wallet connected')[0]).toBeInTheDocument()
    })

    it('displays network information when connected', () => {
      render(<WalletDashboard />)

      expect(screen.getByText('Network Information')).toBeInTheDocument()
      expect(screen.getAllByText('Ethereum Mainnet')[0]).toBeInTheDocument()
      expect(screen.getByText('Chain ID: 1 • Native: ETH')).toBeInTheDocument()
      expect(screen.getByText('Active')).toBeInTheDocument()
    })

    it('displays available networks with switching controls', () => {
      render(<WalletDashboard />)

      expect(screen.getByText('Available Networks')).toBeInTheDocument()
      expect(screen.getAllByText('Ethereum Mainnet')[0]).toBeInTheDocument()
      expect(screen.getByText('Polygon')).toBeInTheDocument()
      expect(screen.getByText('Arbitrum One')).toBeInTheDocument()

      // Current network should show "Current" badge
      expect(screen.getByText('Current')).toBeInTheDocument()
    })

    it('displays connection details when enabled', () => {
      render(<WalletDashboard showConnectionDetails={true} />)

      expect(screen.getByText('Connection Details')).toBeInTheDocument()
      expect(screen.getByText('Chain ID')).toBeInTheDocument()
      expect(screen.getByText('Network')).toBeInTheDocument()
      expect(screen.getByText('Native Token')).toBeInTheDocument()
    })

    it('hides connection details when disabled', () => {
      render(<WalletDashboard showConnectionDetails={false} />)

      expect(screen.queryByText('Connection Details')).not.toBeInTheDocument()
    })

    it('copies address to clipboard when copy button is clicked', async () => {
      const onAddressCopy = vi.fn()
      render(<WalletDashboard onAddressCopy={onAddressCopy} />)

      const copyButton = screen.getByRole('button', {name: /copy/i})
      fireEvent.click(copyButton)

      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledWith(connectedWalletState.address)
        expect(onAddressCopy).toHaveBeenCalledWith(connectedWalletState.address)
      })

      await waitFor(() => {
        expect(screen.getByText('Copied!')).toBeInTheDocument()
      })
    })

    it('opens explorer when explorer button is clicked', () => {
      render(<WalletDashboard />)

      const explorerButton = screen.getByRole('button', {name: /explorer/i})
      fireEvent.click(explorerButton)

      expect(window.open).toHaveBeenCalledWith(`https://etherscan.io/address/${connectedWalletState.address}`, '_blank')
    })
  })

  it('switches network when switch button is clicked', async () => {
    render(<WalletDashboard />)

    // Find Polygon network section and click switch
    const polygonSection = screen.getByText('Polygon').closest('div')
    const switchButton = polygonSection?.querySelector('button')

    if (switchButton) {
      fireEvent.click(switchButton)
      expect(mockSwitchToChain).toHaveBeenCalledWith(137)
    }
  })

  it('disconnects wallet when disconnect button is clicked', async () => {
    const onConnectionStateChange = vi.fn()
    render(<WalletDashboard onConnectionStateChange={onConnectionStateChange} />)

    const disconnectButton = screen.getByRole('button', {name: /disconnect wallet/i})
    fireEvent.click(disconnectButton)

    expect(mockDisconnect).toHaveBeenCalledOnce()
    await waitFor(() => {
      expect(onConnectionStateChange).toHaveBeenCalledWith(false)
    })
  })
})

describe('Unsupported Network State', () => {
  const unsupportedNetworkError: UnsupportedNetworkError = {
    isUnsupported: true,
    currentChainId: 56, // BSC
    suggestedChain: {id: 1, name: 'Ethereum Mainnet'},
    error: {
      code: 'UNSUPPORTED_NETWORK',
      message: 'Unsupported network',
      chainId: 56,
      suggestedChainId: 1,
      userFriendlyMessage: 'Switch to Ethereum Mainnet to continue',
      name: 'NetworkValidationError',
    } as NetworkValidationError,
  }

  const unsupportedWalletState = {
    ...defaultWalletState,
    address: '0x1234567890123456789012345678901234567890',
    isConnected: true,
    chainId: 56,
    currentNetwork: null,
    isCurrentChainSupported: false,
    getUnsupportedNetworkError: () => unsupportedNetworkError,
  }

  beforeEach(() => {
    mockUseWallet.mockReturnValue(unsupportedWalletState as any)
  })

  it('displays unsupported network error when on unsupported chain', () => {
    render(<WalletDashboard />)

    expect(screen.getByText('Unsupported Network')).toBeInTheDocument()
    expect(screen.getByText('Chain ID: 56 • Switch to continue')).toBeInTheDocument()
    expect(screen.getAllByText('Unsupported network')[0]).toBeInTheDocument()
  })

  it('attempts to fix unsupported network when button is clicked', async () => {
    render(<WalletDashboard />)

    const switchButton = screen.getByRole('button', {name: /switch to ethereum mainnet/i})
    fireEvent.click(switchButton)

    expect(mockHandleUnsupportedNetwork).toHaveBeenCalledWith(true)
  })

  it('hides network controls when on unsupported network', () => {
    render(<WalletDashboard />)

    expect(screen.queryByText('Available Networks')).not.toBeInTheDocument()
  })

  it('shows network controls when disabled via prop', () => {
    render(<WalletDashboard showNetworkControls={false} />)

    expect(screen.queryByText('Available Networks')).not.toBeInTheDocument()
  })
})

describe('Loading States', () => {
  it('shows loading state when switching chains', () => {
    const loadingWalletState = {
      ...defaultWalletState,
      address: '0x1234567890123456789012345678901234567890',
      isConnected: true,
      chainId: 1,
      currentNetwork: {name: 'Ethereum Mainnet', symbol: 'ETH'},
      isCurrentChainSupported: true,
      isSwitchingChain: true,
    }

    mockUseWallet.mockReturnValue(loadingWalletState as any)
    render(<WalletDashboard />)

    // Switch buttons should be disabled when switching
    const switchButtons = screen.getAllByRole('button', {name: /switch/i})
    switchButtons.forEach(button => {
      expect(button).toBeDisabled()
    })
  })

  it('shows switch chain error when present', () => {
    const errorWalletState = {
      ...defaultWalletState,
      address: '0x1234567890123456789012345678901234567890',
      isConnected: true,
      chainId: 1,
      currentNetwork: {name: 'Ethereum Mainnet', symbol: 'ETH'},
      isCurrentChainSupported: true,
      switchChainError: new Error('User rejected the request') as NetworkValidationError,
    }

    mockUseWallet.mockReturnValue(errorWalletState as any)
    render(<WalletDashboard />)

    expect(screen.getByText(/Network switch failed/i)).toBeInTheDocument()
  })
})

describe('Explorer Links', () => {
  const connectedWalletState = {
    ...defaultWalletState,
    address: '0x1234567890123456789012345678901234567890',
    isConnected: true,
    chainId: 137, // Polygon
    currentNetwork: {name: 'Polygon', symbol: 'MATIC'},
    isCurrentChainSupported: true,
  }

  it('opens correct explorer for Polygon network', () => {
    mockUseWallet.mockReturnValue(connectedWalletState as any)
    render(<WalletDashboard />)

    const explorerButton = screen.getByRole('button', {name: /explorer/i})
    fireEvent.click(explorerButton)

    expect(window.open).toHaveBeenCalledWith(
      `https://polygonscan.com/address/${connectedWalletState.address}`,
      '_blank',
    )
  })

  it('opens correct explorer for Arbitrum network', () => {
    const arbitrumWalletState = {
      ...connectedWalletState,
      chainId: 42161,
      currentNetwork: {name: 'Arbitrum One', symbol: 'ETH'},
    }

    mockUseWallet.mockReturnValue(arbitrumWalletState as any)
    render(<WalletDashboard />)

    const explorerButton = screen.getByRole('button', {name: /explorer/i})
    fireEvent.click(explorerButton)

    expect(window.open).toHaveBeenCalledWith(`https://arbiscan.io/address/${arbitrumWalletState.address}`, '_blank')
  })
})

describe('Accessibility', () => {
  it('has proper ARIA labels and roles', () => {
    mockUseWallet.mockReturnValue({
      ...defaultWalletState,
      address: '0x1234567890123456789012345678901234567890',
      isConnected: true,
      chainId: 1,
      currentNetwork: {name: 'Ethereum Mainnet', symbol: 'ETH'},
      isCurrentChainSupported: true,
    })

    render(<WalletDashboard />)

    // Check for proper button roles
    expect(screen.getByRole('button', {name: /copy/i})).toBeInTheDocument()
    expect(screen.getByRole('button', {name: /explorer/i})).toBeInTheDocument()
    expect(screen.getByRole('button', {name: /disconnect wallet/i})).toBeInTheDocument()
  })

  it('supports keyboard navigation', () => {
    render(<WalletDashboard />)

    const connectButton = screen.getByRole('button', {name: /connect wallet/i})
    connectButton.focus()
    expect(document.activeElement).toBe(connectButton)
  })
})

describe('Custom Props', () => {
  it('applies custom className', () => {
    const {container} = render(<WalletDashboard className="custom-dashboard" />)

    expect(container.firstChild).toHaveClass('custom-dashboard')
  })

  it('triggers onAddressCopy callback with correct address', async () => {
    const onAddressCopy = vi.fn()
    const address = '0x1234567890123456789012345678901234567890' as `0x${string}`

    mockUseWallet.mockReturnValue({
      ...defaultWalletState,
      address,
      isConnected: true,
      chainId: 1,
      currentNetwork: {name: 'Ethereum Mainnet', symbol: 'ETH'},
      isCurrentChainSupported: true,
    })

    render(<WalletDashboard onAddressCopy={onAddressCopy} />)

    const copyButton = screen.getByRole('button', {name: /copy/i})

    await waitFor(async () => {
      fireEvent.click(copyButton)
      await new Promise(resolve => setTimeout(resolve, 100)) // Wait for async clipboard operation
    })

    expect(onAddressCopy).toHaveBeenCalledWith(address)
  })
})
