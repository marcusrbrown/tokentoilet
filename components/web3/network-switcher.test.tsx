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
      chainId: 1,
      isCurrentChainSupported: true,
      switchToChain: mockSwitchToChain,
      isConnected: true,
      currentNetwork: {name: 'Ethereum Mainnet', symbol: 'ETH'},
      getUnsupportedNetworkError: vi.fn(() => null),
      getSupportedChains: vi.fn(() => [
        {id: 1, name: 'Ethereum Mainnet', symbol: 'ETH'},
        {id: 137, name: 'Polygon', symbol: 'MATIC'},
        {id: 42161, name: 'Arbitrum One', symbol: 'ETH'},
      ]),
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
        chainId: 1,
        isCurrentChainSupported: true,
        switchToChain: mockSwitchToChain,
        isConnected: true,
        currentNetwork: {name: 'Ethereum Mainnet', symbol: 'ETH'},
        getUnsupportedNetworkError: vi.fn(() => null),
        getSupportedChains: vi.fn(() => [{id: 1, name: 'Ethereum Mainnet', symbol: 'ETH'}]),
      })

      render(<NetworkSwitcher showCurrentOnly />)

      expect(screen.getByText('Ethereum')).toBeInTheDocument()
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })

    it('highlights current chain button', () => {
      render(<NetworkSwitcher />)

      const ethereumButton = screen.getByRole('button', {name: /Ethereum/})
      expect(ethereumButton).toHaveAttribute('aria-pressed', 'true')

      const polygonButton = screen.getByRole('button', {name: /Polygon/})
      expect(polygonButton).toHaveAttribute('aria-pressed', 'false')
    })

    it('shows unsupported network indicator when on unsupported chain', () => {
      mockUseWallet.mockReturnValue({
        chainId: 999,
        isCurrentChainSupported: false,
        switchToChain: mockSwitchToChain,
        isConnected: true,
        currentNetwork: {name: 'Unknown Network', symbol: '?'},
        getUnsupportedNetworkError: vi.fn(() => ({message: 'Unsupported network'})),
        getSupportedChains: vi.fn(() => [{id: 1, name: 'Ethereum Mainnet', symbol: 'ETH'}]),
      })

      render(<NetworkSwitcher showCurrentOnly />)

      expect(screen.getByText('Chain 999')).toBeInTheDocument()
      expect(screen.getByText(/unsupported/i)).toBeInTheDocument()
    })
  })

  describe('chain switching', () => {
    it('calls switchToChain when clicking a different chain', async () => {
      const user = userEvent.setup()
      render(<NetworkSwitcher />)

      const polygonButton = screen.getByRole('button', {name: /Polygon/})
      await user.click(polygonButton)

      expect(mockSwitchToChain).toHaveBeenCalledWith(137)
    })

    it('does not call switchToChain when clicking current chain', async () => {
      const user = userEvent.setup()
      render(<NetworkSwitcher />)

      const ethereumButton = screen.getByRole('button', {name: /Ethereum/})
      await user.click(ethereumButton)

      expect(mockSwitchToChain).not.toHaveBeenCalled()
    })

    it('disables buttons during switching', async () => {
      const user = userEvent.setup()
      mockSwitchToChain.mockImplementation(async () => new Promise(() => {}))

      render(<NetworkSwitcher />)

      const polygonButton = screen.getByRole('button', {name: /Polygon/})
      await user.click(polygonButton)

      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toBeDisabled()
      })
    })

    it('handles switch errors gracefully', async () => {
      const user = userEvent.setup()
      mockSwitchToChain.mockRejectedValue(new Error('User rejected'))

      render(<NetworkSwitcher />)

      const polygonButton = screen.getByRole('button', {name: /Polygon/})
      await user.click(polygonButton)

      expect(screen.getByRole('button', {name: /Polygon/})).not.toBeDisabled()
    })
  })

  describe('accessibility', () => {
    it('has proper aria-pressed attributes', () => {
      render(<NetworkSwitcher />)

      const ethereumButton = screen.getByRole('button', {name: /Ethereum/})
      expect(ethereumButton).toHaveAttribute('aria-pressed', 'true')

      const polygonButton = screen.getByRole('button', {name: /Polygon/})
      expect(polygonButton).toHaveAttribute('aria-pressed', 'false')
    })

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<NetworkSwitcher />)

      const polygonButton = screen.getByRole('button', {name: /Polygon/})
      polygonButton.focus()
      await user.keyboard('{Enter}')

      expect(mockSwitchToChain).toHaveBeenCalledWith(137)
    })
  })
})
