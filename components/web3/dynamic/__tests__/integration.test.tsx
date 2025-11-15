import type {ReactNode} from 'react'
import type {Address} from 'viem'

import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {render, waitFor} from '@testing-library/react'
import React from 'react'
import {describe, expect, it, vi} from 'vitest'

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

// Mock token discovery hook
vi.mock('@/hooks/use-token-discovery', () => ({
  useTokenDiscovery: vi.fn(() => ({
    tokens: [],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  })),
}))

// Mock transaction queue hook
vi.mock('@/hooks/use-transaction-queue', () => ({
  useTransactionQueue: vi.fn(() => ({
    queue: [],
    transactions: [], // Add transactions array for TransactionQueue component
    isProcessing: false,
    addTransaction: vi.fn(),
    removeTransaction: vi.fn(),
    clearQueue: vi.fn(),
  })),
  useChainTransactionQueue: vi.fn(() => ({
    queue: [],
    transactions: [], // Add transactions array for TransactionQueue component
    isProcessing: false,
    addTransaction: vi.fn(),
    removeTransaction: vi.fn(),
    clearQueue: vi.fn(),
  })),
  useTransaction: vi.fn(() => ({
    transaction: null,
    isProcessing: false,
  })),
}))

// Create a wrapper for React Query
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })

  return function Wrapper({children}: {children: ReactNode}) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('Dynamic Component Integration Tests - User Flows (TASK-029)', () => {
  describe('Sequential Component Loading', () => {
    it('should dynamically import and render TokenList component', async () => {
      const {DynamicTokenList} = await import('@/components/web3/dynamic/token-list')
      const Wrapper = createWrapper()
      const {container} = render(<DynamicTokenList />, {wrapper: Wrapper})

      await waitFor(() => {
        expect(container.firstChild).toBeTruthy()
      })
    })

    it('should dynamically import and render WalletDashboard component', async () => {
      const {DynamicWalletDashboard} = await import('@/components/web3/dynamic/wallet-dashboard')
      const Wrapper = createWrapper()
      const {container} = render(<DynamicWalletDashboard />, {wrapper: Wrapper})

      await waitFor(() => {
        expect(container.firstChild).toBeTruthy()
      })
    })

    it('should dynamically import and render TransactionQueue component', async () => {
      const {DynamicTransactionQueue} = await import('@/components/web3/dynamic/transaction-queue')
      const Wrapper = createWrapper()
      const {container} = render(<DynamicTransactionQueue />, {wrapper: Wrapper})

      await waitFor(() => {
        expect(container.firstChild).toBeTruthy()
      })
    })

    it('should dynamically import and render WalletSwitcher component', async () => {
      const {DynamicWalletSwitcher} = await import('@/components/web3/dynamic/wallet-switcher')
      const Wrapper = createWrapper()
      const {container} = render(<DynamicWalletSwitcher />, {wrapper: Wrapper})

      await waitFor(() => {
        expect(container.firstChild).toBeTruthy()
      })
    })
  })

  describe('Multi-Component User Journey', () => {
    it('should load multiple dynamic components sequentially without errors', async () => {
      const {DynamicWalletDashboard} = await import('@/components/web3/dynamic/wallet-dashboard')
      const {DynamicTokenList} = await import('@/components/web3/dynamic/token-list')
      const {DynamicTransactionQueue} = await import('@/components/web3/dynamic/transaction-queue')

      const Wrapper = createWrapper()
      const {rerender, container} = render(<DynamicWalletDashboard />, {wrapper: Wrapper})
      await waitFor(() => {
        expect(container.firstChild).toBeTruthy()
      })

      rerender(<DynamicTokenList />)
      await waitFor(() => {
        expect(container.firstChild).toBeTruthy()
      })

      rerender(<DynamicTransactionQueue />)
      await waitFor(() => {
        expect(container.firstChild).toBeTruthy()
      })
    }, 20000) // Increased timeout for CI environment
  })

  describe('Component Import Performance', () => {
    it('should allow repeated imports of same component', async () => {
      // Dynamic imports are cached by the module system - this verifies
      // that repeated imports work correctly without timing assertions
      const import1 = await import('@/components/web3/dynamic/token-list')
      const import2 = await import('@/components/web3/dynamic/token-list')

      // Both imports should return the same module
      expect(import1).toBe(import2)
      expect(import1.DynamicTokenList).toBe(import2.DynamicTokenList)
    })
  })

  describe('Component Reusability', () => {
    it('should allow multiple instances of same dynamic component', async () => {
      const {DynamicTokenList} = await import('@/components/web3/dynamic/token-list')

      const Wrapper = createWrapper()
      const instance1 = render(<DynamicTokenList />, {wrapper: Wrapper})
      const instance2 = render(<DynamicTokenList />, {wrapper: Wrapper})
      const instance3 = render(<DynamicTokenList />, {wrapper: Wrapper})

      await Promise.all([
        waitFor(() => expect(instance1.container.firstChild).toBeTruthy()),
        waitFor(() => expect(instance2.container.firstChild).toBeTruthy()),
        waitFor(() => expect(instance3.container.firstChild).toBeTruthy()),
      ])
    })
  })
})
