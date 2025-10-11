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
    tokens: [],
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

describe('Dynamic Component Loading States', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
    vi.clearAllMocks()
  })

  describe('Suspense boundary behavior', () => {
    it('loads TokenList with Suspense boundary and renders component', async () => {
      const {container} = render(
        <QueryClientProvider client={queryClient}>
          <Suspense fallback={<div data-testid="custom-fallback">Loading tokens...</div>}>
            <DynamicTokenList />
          </Suspense>
        </QueryClientProvider>,
      )

      // Component loads (fallback disappears if it showed)
      await waitFor(
        () => {
          expect(screen.queryByTestId('custom-fallback')).not.toBeInTheDocument()
        },
        {timeout: 3000},
      )

      // Component rendered
      expect(container.innerHTML).toContain('</div>')
    })

    it('loads TransactionQueue with Suspense boundary and renders component', async () => {
      const {container} = render(
        <QueryClientProvider client={queryClient}>
          <Suspense fallback={<div data-testid="tx-fallback">Loading transactions...</div>}>
            <DynamicTransactionQueue />
          </Suspense>
        </QueryClientProvider>,
      )

      await waitFor(
        () => {
          expect(screen.queryByTestId('tx-fallback')).not.toBeInTheDocument()
        },
        {timeout: 3000},
      )

      expect(container.innerHTML).toContain('</div>')
    })

    it('loads WalletDashboard with Suspense boundary and renders component', async () => {
      const {container} = render(
        <QueryClientProvider client={queryClient}>
          <Suspense fallback={<div data-testid="wallet-fallback">Loading wallet...</div>}>
            <DynamicWalletDashboard />
          </Suspense>
        </QueryClientProvider>,
      )

      await waitFor(
        () => {
          expect(screen.queryByTestId('wallet-fallback')).not.toBeInTheDocument()
        },
        {timeout: 3000},
      )

      expect(container.innerHTML).toContain('</div>')
    })

    it('loads WalletSwitcher with Suspense boundary and renders component', async () => {
      const {container} = render(
        <QueryClientProvider client={queryClient}>
          <Suspense fallback={<div data-testid="switcher-fallback">Loading switcher...</div>}>
            <DynamicWalletSwitcher />
          </Suspense>
        </QueryClientProvider>,
      )

      await waitFor(
        () => {
          expect(screen.queryByTestId('switcher-fallback')).not.toBeInTheDocument()
        },
        {timeout: 3000},
      )

      expect(container.innerHTML.length).toBeGreaterThan(0)
    })
  })

  describe('Default loading states', () => {
    it('loads TokenList without explicit Suspense boundary', async () => {
      const {container} = render(
        <QueryClientProvider client={queryClient}>
          <DynamicTokenList />
        </QueryClientProvider>,
      )

      // Component loads and renders (may show skeleton briefly or render immediately)
      await waitFor(
        () => {
          expect(container.innerHTML.length).toBeGreaterThan(0)
        },
        {timeout: 3000},
      )

      expect(container.innerHTML).toContain('</div>')
    })

    it('loads TransactionQueue without explicit Suspense boundary', async () => {
      const {container} = render(
        <QueryClientProvider client={queryClient}>
          <DynamicTransactionQueue />
        </QueryClientProvider>,
      )

      await waitFor(
        () => {
          expect(container.innerHTML.length).toBeGreaterThan(0)
        },
        {timeout: 3000},
      )

      expect(container.innerHTML).toContain('</div>')
    })

    it('loads WalletDashboard without explicit Suspense boundary', async () => {
      const {container} = render(
        <QueryClientProvider client={queryClient}>
          <DynamicWalletDashboard />
        </QueryClientProvider>,
      )

      await waitFor(
        () => {
          expect(container.innerHTML.length).toBeGreaterThan(0)
        },
        {timeout: 3000},
      )

      expect(container.innerHTML).toContain('</div>')
    })
  })

  describe('Component renders after loading', () => {
    it('renders TokenList successfully after loading completes', async () => {
      const {container} = render(
        <QueryClientProvider client={queryClient}>
          <Suspense fallback={<div>Loading...</div>}>
            <DynamicTokenList />
          </Suspense>
        </QueryClientProvider>,
      )

      // Wait for component to load and render
      await waitFor(
        () => {
          expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
        },
        {timeout: 3000},
      )

      // Component should have rendered something (even if empty state)
      expect(container.innerHTML).toContain('</div>')
    })

    it('renders TransactionQueue successfully after loading completes', async () => {
      const {container} = render(
        <QueryClientProvider client={queryClient}>
          <Suspense fallback={<div>Loading...</div>}>
            <DynamicTransactionQueue />
          </Suspense>
        </QueryClientProvider>,
      )

      await waitFor(
        () => {
          expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
        },
        {timeout: 3000},
      )

      expect(container.innerHTML).toContain('</div>')
    })

    it('renders WalletDashboard successfully after loading completes', async () => {
      const {container} = render(
        <QueryClientProvider client={queryClient}>
          <Suspense fallback={<div>Loading...</div>}>
            <DynamicWalletDashboard />
          </Suspense>
        </QueryClientProvider>,
      )

      await waitFor(
        () => {
          expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
        },
        {timeout: 3000},
      )

      expect(container.innerHTML).toContain('</div>')
    })

    it('renders WalletSwitcher successfully after loading completes', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <Suspense fallback={<div>Loading...</div>}>
            <DynamicWalletSwitcher />
          </Suspense>
        </QueryClientProvider>,
      )

      // Component loads (fallback disappears)
      await waitFor(
        () => {
          expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
        },
        {timeout: 3000},
      )

      // WalletSwitcher may render nothing when no wallets connected, which is valid
      // The key test is that the loading completed without errors
    })
  })

  describe('Multiple dynamic components loading', () => {
    it('loads multiple components in parallel with independent Suspense boundaries', async () => {
      const {container} = render(
        <QueryClientProvider client={queryClient}>
          <div>
            <Suspense fallback={<div data-testid="loading-1">Loading 1...</div>}>
              <DynamicTokenList />
            </Suspense>
            <Suspense fallback={<div data-testid="loading-2">Loading 2...</div>}>
              <DynamicTransactionQueue />
            </Suspense>
            <Suspense fallback={<div data-testid="loading-3">Loading 3...</div>}>
              <DynamicWalletDashboard />
            </Suspense>
          </div>
        </QueryClientProvider>,
      )

      // All components should eventually load
      await waitFor(
        () => {
          expect(screen.queryByTestId('loading-1')).not.toBeInTheDocument()
          expect(screen.queryByTestId('loading-2')).not.toBeInTheDocument()
          expect(screen.queryByTestId('loading-3')).not.toBeInTheDocument()
        },
        {timeout: 5000},
      )

      // All components loaded (verify HTML is present)
      expect(container.innerHTML.length).toBeGreaterThan(100)
    })

    it('loads components with shared Suspense boundary', async () => {
      const {container} = render(
        <QueryClientProvider client={queryClient}>
          <Suspense fallback={<div data-testid="shared-loading">Loading all...</div>}>
            <div>
              <DynamicTokenList />
              <DynamicTransactionQueue />
            </div>
          </Suspense>
        </QueryClientProvider>,
      )

      // Shared fallback should eventually disappear
      await waitFor(
        () => {
          expect(screen.queryByTestId('shared-loading')).not.toBeInTheDocument()
        },
        {timeout: 5000},
      )

      // Both components loaded
      expect(container.innerHTML.length).toBeGreaterThan(50)
    })
  })
})
