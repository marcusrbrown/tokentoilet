import {useWallet} from '@/hooks/use-wallet'
import {act, renderHook} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi, type MockedFunction} from 'vitest'
import {useAccount, useConnect, useConnections, useDisconnect, useSwitchAccount} from 'wagmi'

import {useWalletSwitcher} from './use-wallet-switcher'

// Mock wagmi hooks
vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
  useConnect: vi.fn(),
  useConnections: vi.fn(),
  useDisconnect: vi.fn(),
  useSwitchAccount: vi.fn(),
}))

// Mock Reown AppKit
vi.mock('@reown/appkit/react', () => ({
  useAppKit: vi.fn(() => ({
    open: vi.fn(),
  })),
}))

// Mock useWallet hook
vi.mock('@/hooks/use-wallet', () => ({
  useWallet: vi.fn(),
}))

const mockUseAccount = useAccount as MockedFunction<typeof useAccount>
const mockUseConnect = useConnect as MockedFunction<typeof useConnect>
const mockUseConnections = useConnections as MockedFunction<typeof useConnections>
const mockUseDisconnect = useDisconnect as MockedFunction<typeof useDisconnect>
const mockUseSwitchAccount = useSwitchAccount as MockedFunction<typeof useSwitchAccount>
const mockUseWallet = useWallet as MockedFunction<typeof useWallet>

describe('useWalletSwitcher', () => {
  const mockConnect = vi.fn()
  const mockDisconnect = vi.fn()
  const mockSwitchAccount = vi.fn()

  // Create mock connectors
  const mockMetaMaskConnector = {
    uid: 'metamask-1',
    name: 'MetaMask',
  }

  const mockWalletConnectConnector = {
    uid: 'walletconnect-1',
    name: 'WalletConnect',
  }

  const mockCoinbaseConnector = {
    uid: 'coinbase-1',
    name: 'Coinbase Wallet',
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Use type assertion to avoid complex interface matching
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    mockUseAccount.mockReturnValue({
      address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
      connector: mockMetaMaskConnector,
      isConnected: true,
    } as any)

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    mockUseConnect.mockReturnValue({
      connect: mockConnect,
      connectors: [mockWalletConnectConnector, mockCoinbaseConnector],
      isPending: false,
    } as any)

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    mockUseConnections.mockReturnValue([
      {
        connector: mockMetaMaskConnector,
        accounts: ['0x1234567890123456789012345678901234567890' as `0x${string}`],
        chainId: 1,
      },
      {
        connector: mockWalletConnectConnector,
        accounts: ['0x9876543210987654321098765432109876543210' as `0x${string}`],
        chainId: 137,
      },
    ] as any)

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    mockUseDisconnect.mockReturnValue({
      disconnect: mockDisconnect,
    } as any)

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    mockUseSwitchAccount.mockReturnValue({
      switchAccount: mockSwitchAccount,
      isPending: false,
      error: null,
    } as any)

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    mockUseWallet.mockReturnValue({
      isSupportedChain: vi.fn((chainId: number) => [1, 137, 42161].includes(chainId)),
    } as any)
  })

  describe('Connected Wallets State', () => {
    it('should return connected wallets with correct information', () => {
      const {result} = renderHook(() => useWalletSwitcher())

      expect(result.current.connectedWallets).toHaveLength(2)

      const [metaMaskWallet, walletConnectWallet] = result.current.connectedWallets

      // Check MetaMask wallet (active)
      expect(metaMaskWallet.id).toBe('metamask-1-0x1234567890123456789012345678901234567890')
      expect(metaMaskWallet.connector).toBe(mockMetaMaskConnector)
      expect(metaMaskWallet.address).toBe('0x1234567890123456789012345678901234567890')
      expect(metaMaskWallet.isActive).toBe(true)
      expect(metaMaskWallet.chainId).toBe(1)
      expect(metaMaskWallet.walletName).toBe('MetaMask')
      expect(metaMaskWallet.isSupported).toBe(true)

      // Check WalletConnect wallet (inactive)
      expect(walletConnectWallet.id).toBe('walletconnect-1-0x9876543210987654321098765432109876543210')
      expect(walletConnectWallet.connector).toBe(mockWalletConnectConnector)
      expect(walletConnectWallet.address).toBe('0x9876543210987654321098765432109876543210')
      expect(walletConnectWallet.isActive).toBe(false)
      expect(walletConnectWallet.chainId).toBe(137)
      expect(walletConnectWallet.walletName).toBe('WalletConnect')
      expect(walletConnectWallet.isSupported).toBe(true)
    })

    it('should identify active wallet correctly', () => {
      const {result} = renderHook(() => useWalletSwitcher())

      expect(result.current.activeWallet?.id).toBe('metamask-1-0x1234567890123456789012345678901234567890')
      expect(result.current.activeWallet?.isActive).toBe(true)
      expect(result.current.activeWallet?.walletName).toBe('MetaMask')
    })

    it('should return available connectors that are not connected', () => {
      const {result} = renderHook(() => useWalletSwitcher())

      expect(result.current.availableConnectors).toHaveLength(1)
      expect(result.current.availableConnectors[0]).toBe(mockCoinbaseConnector)
    })

    it('should handle unsupported networks correctly', () => {
      // Mock connection on unsupported network
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseConnections.mockReturnValue([
        {
          connector: mockMetaMaskConnector,
          accounts: ['0x1234567890123456789012345678901234567890' as `0x${string}`],
          chainId: 999, // Unsupported network
        },
      ] as any)

      const {result} = renderHook(() => useWalletSwitcher())

      expect(result.current.connectedWallets[0].isSupported).toBe(false)
    })
  })

  describe('Wallet Switching', () => {
    it('should switch to a different wallet', async () => {
      const {result} = renderHook(() => useWalletSwitcher())

      const targetWallet = result.current.connectedWallets.find(wallet => wallet.walletName === 'WalletConnect')

      expect(targetWallet).toBeDefined()

      await act(async () => {
        await result.current.switchToWallet(targetWallet?.id ?? '')
      })

      expect(mockSwitchAccount).toHaveBeenCalledWith({
        connector: mockWalletConnectConnector,
      })
    })

    it('should not switch if wallet is already active', async () => {
      const {result} = renderHook(() => useWalletSwitcher())

      const activeWallet = result.current.activeWallet

      expect(activeWallet).toBeDefined()

      await act(async () => {
        await result.current.switchToWallet(activeWallet?.id ?? '')
      })

      expect(mockSwitchAccount).not.toHaveBeenCalled()
    })

    it('should throw error for invalid wallet ID', async () => {
      const {result} = renderHook(() => useWalletSwitcher())

      await act(async () => {
        await expect(result.current.switchToWallet('invalid-id')).rejects.toThrow(
          'Wallet with ID invalid-id not found in connected wallets',
        )
      })
    })

    it('should handle switching errors gracefully', async () => {
      mockSwitchAccount.mockImplementation(() => {
        throw new Error('Switch failed')
      })

      const {result} = renderHook(() => useWalletSwitcher())

      const targetWallet = result.current.connectedWallets.find(wallet => wallet.walletName === 'WalletConnect')

      expect(targetWallet).toBeDefined()

      await act(async () => {
        await expect(result.current.switchToWallet(targetWallet?.id ?? '')).rejects.toThrow(
          'Failed to switch to WalletConnect. Please try again.',
        )
      })
    })
  })

  describe('Connecting New Wallets', () => {
    it('should connect a new wallet', async () => {
      const {result} = renderHook(() => useWalletSwitcher())

      await act(async () => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        await result.current.connectNewWallet(mockCoinbaseConnector as any)
      })

      expect(mockConnect).toHaveBeenCalledWith({
        connector: mockCoinbaseConnector,
      })
    })

    it('should handle connection errors gracefully', async () => {
      mockConnect.mockImplementation(() => {
        throw new Error('Connection failed')
      })

      const {result} = renderHook(() => useWalletSwitcher())

      await act(async () => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        await expect(result.current.connectNewWallet(mockCoinbaseConnector as any)).rejects.toThrow(
          'Failed to connect Coinbase Wallet. Please try again.',
        )
      })
    })
  })

  describe('Disconnecting Wallets', () => {
    it('should disconnect a specific wallet', async () => {
      const {result} = renderHook(() => useWalletSwitcher())

      const targetWallet = result.current.connectedWallets.find(wallet => wallet.walletName === 'WalletConnect')

      expect(targetWallet).toBeDefined()

      await act(async () => {
        await result.current.disconnectWallet(targetWallet?.id ?? '')
      })

      expect(mockDisconnect).toHaveBeenCalledWith({
        connector: mockWalletConnectConnector,
      })
    })

    it('should throw error for invalid wallet ID on disconnect', async () => {
      const {result} = renderHook(() => useWalletSwitcher())

      await act(async () => {
        await expect(result.current.disconnectWallet('invalid-id')).rejects.toThrow(
          'Wallet with ID invalid-id not found in connected wallets',
        )
      })
    })

    it('should disconnect all wallets', async () => {
      const {result} = renderHook(() => useWalletSwitcher())

      await act(async () => {
        await result.current.disconnectAll()
      })

      expect(mockDisconnect).toHaveBeenCalledTimes(2)
      expect(mockDisconnect).toHaveBeenCalledWith({connector: mockMetaMaskConnector})
      expect(mockDisconnect).toHaveBeenCalledWith({connector: mockWalletConnectConnector})
    })

    it('should handle disconnect errors gracefully', async () => {
      mockDisconnect.mockImplementation(() => {
        throw new Error('Disconnect failed')
      })

      const {result} = renderHook(() => useWalletSwitcher())

      const targetWallet = result.current.connectedWallets.find(wallet => wallet.walletName === 'WalletConnect')

      expect(targetWallet).toBeDefined()

      await act(async () => {
        await expect(result.current.disconnectWallet(targetWallet?.id ?? '')).rejects.toThrow(
          'Failed to disconnect WalletConnect. Please try again.',
        )
      })
    })
  })

  describe('Loading States', () => {
    it('should reflect switching state', () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseSwitchAccount.mockReturnValue({
        switchAccount: mockSwitchAccount,
        isPending: true,
        error: null,
      } as any)

      const {result} = renderHook(() => useWalletSwitcher())

      expect(result.current.isSwitching).toBe(true)
    })

    it('should reflect connecting state', () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseConnect.mockReturnValue({
        connect: mockConnect,
        connectors: [mockCoinbaseConnector],
        isPending: true,
      } as any)

      const {result} = renderHook(() => useWalletSwitcher())

      expect(result.current.isConnecting).toBe(true)
    })
  })

  describe('Wallet Name Detection', () => {
    it('should detect different wallet types correctly', () => {
      const testConnectors = [
        {uid: 'metamask-test', name: 'MetaMask'},
        {uid: 'walletconnect-test', name: 'WalletConnect'},
        {uid: 'coinbase-test', name: 'Coinbase Wallet'},
        {uid: 'rabby-test', name: 'Rabby'},
        {uid: 'rainbow-test', name: 'Rainbow'},
        {uid: 'injected-test', name: 'Injected'},
        {uid: 'unknown-test', name: 'Unknown Provider'},
      ]

      mockUseConnections.mockReturnValue(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        testConnectors.map((connector, index) => ({
          connector,
          accounts: [`0x${'0'.repeat(39)}${index}` as `0x${string}`],
          chainId: 1,
        })) as any,
      )

      const {result} = renderHook(() => useWalletSwitcher())

      const walletNames = result.current.connectedWallets.map(wallet => wallet.walletName)

      expect(walletNames).toEqual([
        'MetaMask',
        'WalletConnect',
        'Coinbase Wallet',
        'Rabby Wallet',
        'Rainbow',
        'Browser Wallet',
        'Unknown Provider',
      ])
    })
  })
})
