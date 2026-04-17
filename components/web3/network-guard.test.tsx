import {fireEvent, render, screen} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {useWallet} from '@/hooks/use-wallet'
import {NetworkGuard} from './network-guard'

// Mock the useWallet hook
vi.mock('@/hooks/use-wallet', () => ({
  useWallet: vi.fn(),
}))

describe('NetworkGuard', () => {
  const mockSwitchToChain = vi.fn().mockResolvedValue(undefined)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders children when wallet is connected on Sepolia', () => {
    // Given wallet is connected on Sepolia (11155111)
    vi.mocked(useWallet).mockReturnValue({
      isConnected: true,
      chainId: 11155111,
      switchToChain: mockSwitchToChain,
      isSwitchingChain: false,
      isSupportedChain: (id: number) => id === 11155111,
    } as unknown as ReturnType<typeof useWallet>)

    // When NetworkGuard wraps content
    render(
      <NetworkGuard>
        <div data-testid="protected-content">Protected Content</div>
      </NetworkGuard>,
    )

    // Then the content should be visible
    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    // And warning should not be shown
    expect(screen.queryByText(/Switch to Sepolia/i)).not.toBeInTheDocument()
  })

  it('shows warning message and switch button when on wrong chain, hiding children', () => {
    // Given wallet is connected on Mainnet (1)
    vi.mocked(useWallet).mockReturnValue({
      isConnected: true,
      chainId: 1,
      switchToChain: mockSwitchToChain,
      isSwitchingChain: false,
      isSupportedChain: (id: number) => id === 11155111,
    } as unknown as ReturnType<typeof useWallet>)

    // When NetworkGuard wraps content
    render(
      <NetworkGuard>
        <div data-testid="protected-content">Protected Content</div>
      </NetworkGuard>,
    )

    // Then the content should be hidden
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    // And warning should be shown
    expect(screen.getByText(/Network Not Supported/i)).toBeInTheDocument()
    expect(screen.getByRole('button', {name: /Switch to Sepolia/i})).toBeInTheDocument()
  })

  it('calls switchToChain(11155111) when switch button is clicked', () => {
    // Given wallet is connected on wrong chain
    vi.mocked(useWallet).mockReturnValue({
      isConnected: true,
      chainId: 1,
      switchToChain: mockSwitchToChain,
      isSwitchingChain: false,
      isSupportedChain: (id: number) => id === 11155111,
    } as unknown as ReturnType<typeof useWallet>)

    render(
      <NetworkGuard>
        <div data-testid="protected-content">Protected Content</div>
      </NetworkGuard>,
    )

    // When switch button is clicked
    const switchButton = screen.getByRole('button', {name: /Switch to Sepolia/i})
    fireEvent.click(switchButton)

    // Then switchToChain should be called with Sepolia ID
    expect(mockSwitchToChain).toHaveBeenCalledWith(11155111)
  })

  it('handles disconnected wallet state gracefully (shows children or connect prompt)', () => {
    // Given wallet is not connected
    vi.mocked(useWallet).mockReturnValue({
      isConnected: false,
      chainId: undefined,
      switchToChain: mockSwitchToChain,
      isSwitchingChain: false,
      isSupportedChain: (id: number) => id === 11155111,
    } as unknown as ReturnType<typeof useWallet>)

    // When NetworkGuard wraps content
    render(
      <NetworkGuard>
        <div data-testid="protected-content">Protected Content</div>
      </NetworkGuard>,
    )

    // Then we assume for this guard, if not connected, we either show the content
    // (and let WalletButton handle connection) or show it. Let's say it renders children
    // if not connected, since this guard is specifically for network checking.
    // The requirement says "Handles disconnected wallet state gracefully".
    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    expect(screen.queryByText(/Network Not Supported/i)).not.toBeInTheDocument()
  })
})
