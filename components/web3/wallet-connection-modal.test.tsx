import {WalletConnectionModal} from '@/components/web3/wallet-connection-modal'
import {render, screen} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

// Mock useWallet hook
vi.mock('@/hooks/use-wallet', () => ({
  useWallet: vi.fn(() => ({
    address: undefined,
    isConnected: false,
    connect: vi.fn(),
    disconnect: vi.fn(),
    chainId: 1,
    currentNetwork: {name: 'Ethereum Mainnet', symbol: 'ETH'},
    isCurrentChainSupported: true,
    isSupportedChain: (chainId: number): chainId is 1 | 137 | 42161 => [1, 137, 42161].includes(chainId),
    validateCurrentNetwork: vi.fn(),
    getUnsupportedNetworkError: vi.fn(),
    handleUnsupportedNetwork: vi.fn(),
    switchToChain: vi.fn(),
    isSwitchingChain: false,
    switchChainError: null,
    getSupportedChains: vi.fn(() => [
      {id: 1, name: 'Ethereum Mainnet', symbol: 'ETH'},
      {id: 137, name: 'Polygon', symbol: 'MATIC'},
      {id: 42161, name: 'Arbitrum One', symbol: 'ETH'},
    ]),
    persistence: {
      isAvailable: true,
      autoReconnect: true,
      lastWalletId: null,
      preferredChain: 1,
      lastConnectionData: null,
      isRestoring: false,
      error: null,
      saveConnectionState: vi.fn(),
      clearStoredData: vi.fn(),
      setAutoReconnect: vi.fn(),
      setPreferredChain: vi.fn(),
      updateLastActive: vi.fn(),
      shouldRestore: vi.fn(),
      getConnectionAge: vi.fn(),
    },
  })),
}))

// Mock useWalletPersistence hook
vi.mock('@/hooks/use-wallet-persistence', () => ({
  useWalletPersistence: vi.fn(() => ({
    isAvailable: true,
    autoReconnect: true,
    lastWalletId: null,
    preferredChain: 1,
    lastConnectionData: null,
    isRestoring: false,
    error: null,
    saveConnectionState: vi.fn(),
    clearStoredData: vi.fn(),
    setAutoReconnect: vi.fn(),
    setPreferredChain: vi.fn(),
    updateLastActive: vi.fn(),
    shouldRestore: vi.fn(),
    getConnectionAge: vi.fn(),
  })),
}))

// Mock Modal component
vi.mock('@/components/ui/modal', () => ({
  Modal: ({children, open}: {children: React.ReactNode; open: boolean}) => {
    return open ? <div data-testid="wallet-connection-modal">{children}</div> : null
  },
}))

describe('WalletConnectionModal', () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders when open is true', () => {
    render(<WalletConnectionModal open={true} onClose={mockOnClose} />)

    expect(screen.getByTestId('wallet-connection-modal')).toBeInTheDocument()
    expect(screen.getByText('Connect Your Wallet')).toBeInTheDocument()
    expect(screen.getByText('Choose Wallet Provider')).toBeInTheDocument()
  })

  it('does not render when open is false', () => {
    render(<WalletConnectionModal open={false} onClose={mockOnClose} />)

    expect(screen.queryByTestId('wallet-connection-modal')).not.toBeInTheDocument()
  })

  it('displays supported networks when showNetworkSelection is true', () => {
    render(<WalletConnectionModal open={true} onClose={mockOnClose} showNetworkSelection={true} />)

    expect(screen.getByText('Select Network')).toBeInTheDocument()
    expect(screen.getByText('Ethereum Mainnet')).toBeInTheDocument()
    expect(screen.getByText('Polygon')).toBeInTheDocument()
    expect(screen.getByText('Arbitrum One')).toBeInTheDocument()
  })

  it('hides network selection when showNetworkSelection is false', () => {
    render(<WalletConnectionModal open={true} onClose={mockOnClose} showNetworkSelection={false} />)

    expect(screen.queryByText('Select Network')).not.toBeInTheDocument()
  })

  it('displays persistence options when showPersistenceOptions is true', () => {
    render(<WalletConnectionModal open={true} onClose={mockOnClose} showPersistenceOptions={true} />)

    expect(screen.getByText('Auto-reconnect')).toBeInTheDocument()
    expect(screen.getByText('Enabled')).toBeInTheDocument()
  })

  it('hides persistence options when showPersistenceOptions is false', () => {
    render(<WalletConnectionModal open={true} onClose={mockOnClose} showPersistenceOptions={false} />)

    expect(screen.queryByText('Auto-reconnect')).not.toBeInTheDocument()
  })

  it('displays wallet providers with popular badges', () => {
    render(<WalletConnectionModal open={true} onClose={mockOnClose} />)

    expect(screen.getByText('MetaMask')).toBeInTheDocument()
    expect(screen.getByText('WalletConnect')).toBeInTheDocument()
    expect(screen.getByText('Coinbase Wallet')).toBeInTheDocument()
    expect(screen.getByText('Browser Wallet')).toBeInTheDocument()

    // Check for popular badges (should have 3 popular wallets)
    const popularBadges = screen.getAllByText('Popular')
    expect(popularBadges).toHaveLength(3)
  })

  it('opens external link for wallet education', () => {
    const mockWindowOpen = vi.spyOn(window, 'open').mockImplementation(() => null)

    render(<WalletConnectionModal open={true} onClose={mockOnClose} />)

    const learnLink = screen.getByText('Learn about wallets')
    learnLink.click()

    expect(mockWindowOpen).toHaveBeenCalledWith('https://ethereum.org/en/wallets/', '_blank')

    mockWindowOpen.mockRestore()
  })
})
