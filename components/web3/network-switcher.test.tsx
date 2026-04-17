import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {CHAIN_INFO, NetworkSwitcher, SUPPORTED_CHAIN_IDS} from './network-switcher'

const mockSwitchToChain = vi.fn()
const mockUseWallet = vi.fn()

vi.mock('@/hooks/use-wallet', () => ({
  useWallet: () => mockUseWallet() as ReturnType<typeof import('@/hooks/use-wallet').useWallet>,
}))

describe('NetworkSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseWallet.mockReturnValue({
      chainId: 11155111,
      isCurrentChainSupported: true,
      switchToChain: mockSwitchToChain,
      isConnected: true,
      currentNetwork: {name: 'Sepolia', symbol: 'ETH'},
      getUnsupportedNetworkError: vi.fn(() => null),
      getSupportedChains: vi.fn(() => [{id: 11155111, name: 'Sepolia', symbol: 'ETH'}]),
    })
  })

  describe('rendering', () => {
    it('renders nothing when not connected', () => {
      mockUseWallet.mockReturnValue({
        chainId: undefined,
        isCurrentChainSupported: false,
        switchToChain: mockSwitchToChain,
        isConnected: false,
        currentNetwork: null,
        getUnsupportedNetworkError: vi.fn(() => null),
        getSupportedChains: vi.fn(() => []),
      })

      const {container} = render(<NetworkSwitcher />)
      expect(container.firstChild).toBeNull()
    })

    it('renders all supported chain buttons when connected', () => {
      render(<NetworkSwitcher />)

      for (const id of SUPPORTED_CHAIN_IDS) {
        expect(screen.getByRole('button', {name: new RegExp(CHAIN_INFO[id].name)})).toBeInTheDocument()
      }
    })

    it('renders only current network badge when showCurrentOnly is true', () => {
      mockUseWallet.mockReturnValue({
        chainId: 11155111,
        isCurrentChainSupported: true,
        switchToChain: mockSwitchToChain,
        isConnected: true,
        currentNetwork: {name: 'Sepolia', symbol: 'ETH'},
        getUnsupportedNetworkError: vi.fn(() => null),
        getSupportedChains: vi.fn(() => [{id: 11155111, name: 'Sepolia', symbol: 'ETH'}]),
      })

      render(<NetworkSwitcher showCurrentOnly />)

      expect(screen.getByText('Sepolia')).toBeInTheDocument()
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })

    it('highlights current chain button', () => {
      render(<NetworkSwitcher />)

      const sepoliaButton = screen.getByRole('button', {name: /Sepolia/})
      expect(sepoliaButton).toHaveAttribute('aria-pressed', 'true')
    })

    it('shows unsupported network indicator when on unsupported chain', () => {
      mockUseWallet.mockReturnValue({
        chainId: 999,
        isCurrentChainSupported: false,
        switchToChain: mockSwitchToChain,
        isConnected: true,
        currentNetwork: {name: 'Unknown Network', symbol: '?'},
        getUnsupportedNetworkError: vi.fn(() => ({message: 'Unsupported network'})),
        getSupportedChains: vi.fn(() => [{id: 11155111, name: 'Sepolia', symbol: 'ETH'}]),
      })

      render(<NetworkSwitcher showCurrentOnly />)

      expect(screen.getByText('Chain 999')).toBeInTheDocument()
      expect(screen.getByText(/unsupported/i)).toBeInTheDocument()
    })
  })

  describe('chain switching', () => {
    it('calls switchToChain when clicking a different chain', async () => {
      // With Sepolia-only, set wallet to unsupported chain so Sepolia button is not "current"
      mockUseWallet.mockReturnValue({
        chainId: 999,
        isCurrentChainSupported: false,
        switchToChain: mockSwitchToChain,
        isConnected: true,
        currentNetwork: {name: 'Unknown', symbol: '?'},
        getUnsupportedNetworkError: vi.fn(() => null),
        getSupportedChains: vi.fn(() => [{id: 11155111, name: 'Sepolia', symbol: 'ETH'}]),
      })
      const user = userEvent.setup()
      render(<NetworkSwitcher />)

      const sepoliaButton = screen.getByRole('button', {name: /Sepolia/})
      await user.click(sepoliaButton)

      expect(mockSwitchToChain).toHaveBeenCalledWith(11155111)
    })

    it('does not call switchToChain when clicking current chain', async () => {
      const user = userEvent.setup()
      render(<NetworkSwitcher />)

      const sepoliaButton = screen.getByRole('button', {name: /Sepolia/})
      await user.click(sepoliaButton)

      expect(mockSwitchToChain).not.toHaveBeenCalled()
    })

    it('disables buttons during switching', async () => {
      // Set wallet to unsupported chain so Sepolia button is clickable (not current)
      mockUseWallet.mockReturnValue({
        chainId: 999,
        isCurrentChainSupported: false,
        switchToChain: mockSwitchToChain,
        isConnected: true,
        currentNetwork: {name: 'Unknown', symbol: '?'},
        getUnsupportedNetworkError: vi.fn(() => null),
        getSupportedChains: vi.fn(() => [{id: 11155111, name: 'Sepolia', symbol: 'ETH'}]),
      })
      const user = userEvent.setup()
      mockSwitchToChain.mockImplementation(async () => new Promise(() => {}))

      render(<NetworkSwitcher />)

      const sepoliaButton = screen.getByRole('button', {name: /Sepolia/})
      await user.click(sepoliaButton)

      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toBeDisabled()
      })
    })

    it('handles switch errors gracefully', async () => {
      // Set wallet to unsupported chain so Sepolia button is clickable
      mockUseWallet.mockReturnValue({
        chainId: 999,
        isCurrentChainSupported: false,
        switchToChain: mockSwitchToChain,
        isConnected: true,
        currentNetwork: {name: 'Unknown', symbol: '?'},
        getUnsupportedNetworkError: vi.fn(() => null),
        getSupportedChains: vi.fn(() => [{id: 11155111, name: 'Sepolia', symbol: 'ETH'}]),
      })
      const user = userEvent.setup()
      mockSwitchToChain.mockRejectedValue(new Error('User rejected'))

      render(<NetworkSwitcher />)

      const sepoliaButton = screen.getByRole('button', {name: /Sepolia/})
      await user.click(sepoliaButton)

      expect(screen.getByRole('button', {name: /Sepolia/})).not.toBeDisabled()
    })
  })

  describe('accessibility', () => {
    it('has proper aria-pressed attributes', () => {
      render(<NetworkSwitcher />)

      const sepoliaButton = screen.getByRole('button', {name: /Sepolia/})
      expect(sepoliaButton).toHaveAttribute('aria-pressed', 'true')
    })

    it('supports keyboard navigation', async () => {
      // Set wallet to unsupported chain so Sepolia button is clickable
      mockUseWallet.mockReturnValue({
        chainId: 999,
        isCurrentChainSupported: false,
        switchToChain: mockSwitchToChain,
        isConnected: true,
        currentNetwork: {name: 'Unknown', symbol: '?'},
        getUnsupportedNetworkError: vi.fn(() => null),
        getSupportedChains: vi.fn(() => [{id: 11155111, name: 'Sepolia', symbol: 'ETH'}]),
      })
      const user = userEvent.setup()
      render(<NetworkSwitcher />)

      const sepoliaButton = screen.getByRole('button', {name: /Sepolia/})
      sepoliaButton.focus()
      await user.keyboard('{Enter}')

      expect(mockSwitchToChain).toHaveBeenCalledWith(11155111)
    })
  })
})
