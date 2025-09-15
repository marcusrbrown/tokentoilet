import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {ConnectionStatus} from './connection-status'

// Simple mock of the useWallet hook
vi.mock('@/hooks/use-wallet', () => ({
  useWallet: vi.fn(() => ({
    address: undefined,
    isConnected: false,
    connect: vi.fn(),
    disconnect: vi.fn(),
    currentNetwork: null,
    isCurrentChainSupported: false,
    getUnsupportedNetworkError: vi.fn(() => null),
    handleUnsupportedNetwork: vi.fn(),
    validateCurrentNetwork: vi.fn(() => null),
    isSwitchingChain: false,
  })),
}))

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  AlertCircle: () => <div data-testid="alert-circle-icon" />,
  CheckCircle2: () => <div data-testid="check-circle-icon" />,
  Loader2: () => <div data-testid="loader-icon" />,
  Network: () => <div data-testid="network-icon" />,
  Wallet: () => <div data-testid="wallet-icon" />,
  WifiOff: () => <div data-testid="wifi-off-icon" />,
  Zap: () => <div data-testid="zap-icon" />,
}))

// Mock UI components
vi.mock('./badge', () => ({
  Badge: ({children}: {children: React.ReactNode}) => <div data-testid="badge">{children}</div>,
}))

vi.mock('./button', () => ({
  Button: ({children}: {children: React.ReactNode}) => (
    <button type="button" data-testid="button">
      {children}
    </button>
  ),
}))

describe('ConnectionStatus', () => {
  it('renders without crashing', () => {
    render(<ConnectionStatus />)
    expect(screen.getByTestId('wifi-off-icon')).toBeInTheDocument()
  })

  it('displays disconnected state by default', () => {
    render(<ConnectionStatus />)
    expect(screen.getByText('Not Connected')).toBeInTheDocument()
    expect(screen.getByTestId('badge')).toBeInTheDocument()
  })

  it('applies variant classes correctly', () => {
    const {container} = render(<ConnectionStatus variant="card" />)
    const element = container.firstChild as HTMLElement
    expect(element).toHaveClass('bg-white/80')
  })

  it('applies size classes correctly', () => {
    const {container} = render(<ConnectionStatus size="sm" />)
    const element = container.firstChild as HTMLElement
    expect(element).toHaveClass('text-xs')
  })
})
