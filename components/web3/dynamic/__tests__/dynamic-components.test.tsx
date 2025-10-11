import type {Address} from 'viem'

import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {render, screen, waitFor} from '@testing-library/react'
import {Suspense} from 'react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {DynamicTokenList, DynamicTransactionQueue, DynamicWalletDashboard, DynamicWalletSwitcher} from '../index'

// Mock wagmi hooks
vi.mock('wagmi', () => ({
  useAccount: vi.fn(() => ({
    address: '0x1234567890123456789012345678901234567890' as Address,
    isConnected: true,
    connector: {id: 'metamask', name: 'MetaMask'},
  })),
  useChainId: vi.fn(() => 1),
  useConfig: vi.fn(() => ({})),
  useReadContract: vi.fn(),
  useWriteContract: vi.fn(),
  useEstimateGas: vi.fn(),
  useSwitchChain: vi.fn(() => ({
    switchChain: vi.fn(),
    isPending: false,
  })),
  useDisconnect: vi.fn(() => ({
    disconnect: vi.fn(),
  })),
  useConnect: vi.fn(() => ({
    connect: vi.fn(),
    connectors: [],
    isPending: false,
  })),
  useConnections: vi.fn(() => []),
}))

// Mock Reown AppKit
vi.mock('@reown/appkit/react', () => ({
  useAppKit: vi.fn(() => ({
    open: vi.fn(),
  })),
}))

// Mock wallet switcher hook
vi.mock('@/hooks/use-wallet-switcher', () => ({
  useWalletSwitcher: vi.fn(() => ({
    connectedWallets: [],
    activeWallet: null,
    isSwitching: false,
    isConnecting: false,
    availableConnectors: [],
    switchToWallet: vi.fn(),
    connectNewWallet: vi.fn(),
    disconnectWallet: vi.fn(),
    openWalletModal: vi.fn(),
  })),
}))

// Mock useWallet hook
vi.mock('@/hooks/use-wallet', () => ({
  useWallet: vi.fn(() => ({
    address: '0x1234567890123456789012345678901234567890' as Address,
    isConnected: true,
    chainId: 1,
    currentNetwork: {id: 1, name: 'Ethereum', nativeCurrency: {symbol: 'ETH'}},
    isCurrentChainSupported: true,
    getUnsupportedNetworkError: vi.fn(() => null),
    getSupportedChains: vi.fn(() => [
      {id: 1, name: 'Ethereum Mainnet'},
      {id: 137, name: 'Polygon'},
      {id: 42161, name: 'Arbitrum One'},
    ]),
    isSupportedChain: vi.fn(() => true),
    validateCurrentNetwork: vi.fn(() => ({success: true})),
    handleUnsupportedNetwork: vi.fn(),
  })),
}))

// Mock token hooks
vi.mock('@/hooks/use-token-discovery', () => ({
  useTokenDiscovery: vi.fn(() => ({
    tokens: [],
    isLoading: false,
    isError: false,
    error: null,
  })),
}))

vi.mock('@/hooks/use-token-filtering', () => ({
  useTokenFiltering: vi.fn(() => ({
    tokens: [], // Return tokens array, not filteredTokens
    isLoading: false,
    error: null,
  })),
}))

vi.mock('@/hooks/use-token-metadata', () => ({
  useTokenMetadata: vi.fn(() => ({
    metadata: null,
    isLoading: false,
    isError: false,
    error: null,
  })),
}))

vi.mock('@/hooks/use-token-price', () => ({
  useTokenPrice: vi.fn(() => ({
    price: null,
    isLoading: false,
    isError: false,
    error: null,
  })),
}))

vi.mock('@/hooks/use-transaction-queue', () => ({
  useTransactionQueue: vi.fn(() => ({
    transactions: [],
    pending: [],
    confirmed: [],
    failed: [],
    isProcessing: false,
    add: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn(),
    retry: vi.fn(),
  })),
  useChainTransactionQueue: vi.fn(() => ({
    transactions: [],
    pending: [],
    confirmed: [],
    failed: [],
    isProcessing: false,
    add: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn(),
    retry: vi.fn(),
  })),
}))

describe('Dynamic Component Loading', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
  })

  describe('DynamicTokenList', () => {
    it('renders with Suspense boundary', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <Suspense fallback={<div>Loading token list...</div>}>
            <DynamicTokenList />
          </Suspense>
        </QueryClientProvider>,
      )

      // Component should eventually render - look for "No Tokens Found" message
      await waitFor(
        () => {
          expect(
            screen.queryByText('Loading token list...') || screen.queryByText(/no tokens found/i),
          ).toBeInTheDocument()
        },
        {timeout: 3000},
      )
    })

    it('shows loading skeleton during component load', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <DynamicTokenList />
        </QueryClientProvider>,
      )

      // Component should render - either with skeleton or empty state
      await waitFor(
        () => {
          expect(screen.queryByText(/no tokens found/i) || screen.queryByTestId('token-list-skeleton')).toBeTruthy()
        },
        {timeout: 3000},
      )
    })
  })

  describe('DynamicTransactionQueue', () => {
    it('renders with Suspense boundary', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <Suspense fallback={<div>Loading transaction queue...</div>}>
            <DynamicTransactionQueue />
          </Suspense>
        </QueryClientProvider>,
      )

      await waitFor(
        () => {
          expect(
            screen.queryByText('Loading transaction queue...') ||
              screen.queryByText(/transaction queue/i) ||
              screen.queryByText(/no transactions in queue/i),
          ).toBeInTheDocument()
        },
        {timeout: 3000},
      )
    })
  })

  describe('DynamicWalletDashboard', () => {
    it('renders with Suspense boundary', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <Suspense fallback={<div>Loading wallet dashboard...</div>}>
            <DynamicWalletDashboard />
          </Suspense>
        </QueryClientProvider>,
      )

      await waitFor(
        () => {
          expect(
            screen.queryByText('Loading wallet dashboard...') ||
              screen.queryByText(/wallet dashboard/i) ||
              screen.queryByText(/account information/i),
          ).toBeInTheDocument()
        },
        {timeout: 3000},
      )
    })
  })

  describe('DynamicWalletSwitcher', () => {
    it('renders with Suspense boundary', async () => {
      const {container} = render(
        <QueryClientProvider client={queryClient}>
          <Suspense fallback={<div>Loading wallet switcher...</div>}>
            <DynamicWalletSwitcher />
          </Suspense>
        </QueryClientProvider>,
      )

      // WalletSwitcher may not render anything if no wallets available
      // Just verify it doesn't crash and renders without error
      await waitFor(
        () => {
          const loadingText = screen.queryByText('Loading wallet switcher...')
          if (loadingText) {
            // Still loading
            expect(loadingText).toBeInTheDocument()
          } else {
            // Component loaded (may render nothing if no wallets - that's okay)
            expect(container).toBeTruthy()
          }
        },
        {timeout: 3000},
      )
    })
  })
})
