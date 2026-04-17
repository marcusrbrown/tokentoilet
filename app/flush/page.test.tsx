import {fireEvent, render, screen} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {useWallet} from '@/hooks/use-wallet'
import FlushPage from './page'

// Mock dependencies
vi.mock('@/hooks/use-wallet', () => ({
  useWallet: vi.fn(),
}))

// Mock components
vi.mock('@/components/web3/wallet-button', () => ({
  WalletButton: () => <div data-testid="wallet-button">WalletButton</div>,
}))

vi.mock('@/components/web3/network-guard', () => ({
  NetworkGuard: ({children}: {children: React.ReactNode}) => <div data-testid="network-guard">{children}</div>,
}))

vi.mock('@/components/web3/disposal-flow', () => ({
  DisposalFlow: () => <div data-testid="disposal-flow">DisposalFlow</div>,
}))

describe('Flush Page', () => {
  const mockConnect = vi.fn().mockResolvedValue(undefined)

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useWallet).mockReturnValue({
      isConnected: false,
      connect: mockConnect,
    } as unknown as ReturnType<typeof useWallet>)
  })

  it('renders WalletButton in the header', () => {
    // Given default state
    // When the page renders
    render(<FlushPage />)

    // Then WalletButton should be present
    expect(screen.getByTestId('wallet-button')).toBeInTheDocument()
  })

  it('shows connect prompt when wallet is not connected', () => {
    // Given wallet is disconnected
    vi.mocked(useWallet).mockReturnValue({
      isConnected: false,
      connect: mockConnect,
    } as unknown as ReturnType<typeof useWallet>)

    // When the page renders
    render(<FlushPage />)

    // Then connect prompt should be visible
    expect(screen.getByRole('heading', {name: /Connect your wallet/i})).toBeInTheDocument()
    expect(screen.getByRole('button', {name: /Connect Wallet/i})).toBeInTheDocument()

    // And DisposalFlow should not be visible
    expect(screen.queryByTestId('disposal-flow')).not.toBeInTheDocument()
  })

  it('calls connect() when Connect Wallet button is clicked', () => {
    // Given wallet is disconnected
    vi.mocked(useWallet).mockReturnValue({
      isConnected: false,
      connect: mockConnect,
    } as unknown as ReturnType<typeof useWallet>)

    // When the page renders and connect button is clicked
    render(<FlushPage />)
    fireEvent.click(screen.getByRole('button', {name: /Connect Wallet/i}))

    // Then connect() should be called
    expect(mockConnect).toHaveBeenCalled()
  })

  it('renders DisposalFlow inside NetworkGuard when wallet is connected', () => {
    // Given wallet is connected
    vi.mocked(useWallet).mockReturnValue({
      isConnected: true,
      connect: mockConnect,
    } as unknown as ReturnType<typeof useWallet>)

    // When the page renders
    render(<FlushPage />)

    // Then NetworkGuard should be present
    expect(screen.getByTestId('network-guard')).toBeInTheDocument()

    // And DisposalFlow should be rendered
    expect(screen.getByTestId('disposal-flow')).toBeInTheDocument()

    // And connect prompt should not be visible
    expect(screen.queryByRole('heading', {name: /Connect your wallet/i})).not.toBeInTheDocument()
  })
})
