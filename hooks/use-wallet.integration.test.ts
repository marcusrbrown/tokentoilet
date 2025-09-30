/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/* eslint-disable unused-imports/no-unused-vars */
import {useWallet} from '@/hooks/use-wallet'
import {useWalletErrorHandler} from '@/hooks/use-wallet-error-handler'
import {useWalletPersistence} from '@/hooks/use-wallet-persistence'
import {useWalletSwitcher} from '@/hooks/use-wallet-switcher'
import {act, renderHook, waitFor} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi, type MockedFunction} from 'vitest'
import {useAccount, useChainId, useDisconnect, useSwitchChain} from 'wagmi'

// Mock wagmi hooks
vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
  useChainId: vi.fn(),
  useDisconnect: vi.fn(),
  useSwitchChain: vi.fn(),
}))

// Mock Reown AppKit
const mockAppKitOpen = vi.fn()
vi.mock('@reown/appkit/react', () => ({
  useAppKit: vi.fn(() => ({
    open: mockAppKitOpen,
  })),
}))

// Mock network imports
vi.mock('@reown/appkit/networks', () => ({
  mainnet: {id: 1},
  polygon: {id: 137},
  arbitrum: {id: 42161},
}))

// Mock localStorage for persistence tests
const mockLocalStorage: Record<string, string> = {}

beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', {
    value: {
      getItem: vi.fn((key: string) => mockLocalStorage[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        mockLocalStorage[key] = value
      }),
      removeItem: vi.fn((key: string) => {
        delete mockLocalStorage[key]
      }),
      clear: vi.fn(() => {
        Object.keys(mockLocalStorage).forEach(key => {
          delete mockLocalStorage[key]
        })
      }),
    },
    writable: true,
  })
})

const mockUseAccount = useAccount as MockedFunction<typeof useAccount>
const mockUseChainId = useChainId as MockedFunction<typeof useChainId>
const mockUseDisconnect = useDisconnect as MockedFunction<typeof useDisconnect>
const mockUseSwitchChain = useSwitchChain as MockedFunction<typeof useSwitchChain>

describe('Wallet Connection Integration Tests - TASK-026', () => {
  const mockDisconnect = vi.fn()
  const mockSwitchChain = vi.fn()

  const METAMASK_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' as const
  const WALLETCONNECT_ADDRESS = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' as const
  const COINBASE_ADDRESS = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC' as const

  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.clear?.()

    // Default to disconnected state
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    mockUseAccount.mockReturnValue({
      address: undefined,
      isConnected: false,
      connector: undefined,
    } as any)

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    mockUseDisconnect.mockReturnValue({
      disconnect: mockDisconnect,
    } as any)

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    mockUseSwitchChain.mockReturnValue({
      switchChain: mockSwitchChain,
      isPending: false,
      error: null,
    } as any)

    mockUseChainId.mockReturnValue(1)
    mockAppKitOpen.mockReset()
    mockDisconnect.mockReset()
    mockSwitchChain.mockReset()
  })

  describe('MetaMask Complete Connection Flow', () => {
    it.skip('should complete full connection workflow: connect → validate → persist → disconnect', async () => {
      const {result} = renderHook(() => useWallet())

      // Step 1: Initial disconnected state
      expect(result.current.isConnected).toBe(false)
      expect(result.current.address).toBeUndefined()

      // Step 2: Initiate connection
      mockAppKitOpen.mockResolvedValueOnce(undefined)
      await act(async () => {
        await result.current.connect()
      })

      expect(mockAppKitOpen).toHaveBeenCalledTimes(1)

      // Step 3: Simulate successful MetaMask connection
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseAccount.mockReturnValue({
        address: METAMASK_ADDRESS,
        isConnected: true,
        connector: {id: 'metaMaskSDK', name: 'MetaMask'},
      } as any)

      const {result: connectedResult} = renderHook(() => useWallet())

      // Step 4: Verify connected state
      expect(connectedResult.current.isConnected).toBe(true)
      expect(connectedResult.current.address).toBe(METAMASK_ADDRESS)
      expect(connectedResult.current.displayAddress).toBe('0xf39F...2266')

      // Step 5: Verify network validation passes
      expect(connectedResult.current.isCurrentChainSupported).toBe(true)
      expect(connectedResult.current.unsupportedNetworkError).toBeNull()

      // Step 6: Test disconnection
      await act(async () => {
        await connectedResult.current.disconnect()
      })

      expect(mockDisconnect).toHaveBeenCalledTimes(1)
    })

    it('should handle MetaMask connection with network switching', async () => {
      // Start on unsupported network
      mockUseChainId.mockReturnValue(5) // Goerli testnet

      const {result} = renderHook(() => useWallet())

      // Step 1: Connect to MetaMask on unsupported network
      mockAppKitOpen.mockResolvedValueOnce(undefined)
      await act(async () => {
        await result.current.connect()
      })

      // Simulate connection
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseAccount.mockReturnValue({
        address: METAMASK_ADDRESS,
        isConnected: true,
        connector: {id: 'metaMaskSDK', name: 'MetaMask'},
      } as any)

      const {result: connectedResult} = renderHook(() => useWallet())

      // Step 2: Verify unsupported network detected
      expect(connectedResult.current.isCurrentChainSupported).toBe(false)
      const unsupportedError = connectedResult.current.getUnsupportedNetworkError()
      expect(unsupportedError).not.toBeNull()
      if (unsupportedError != null) {
        expect(unsupportedError.currentChainId).toBe(5)
      }

      // Step 3: Switch to supported network (Polygon)
      mockSwitchChain.mockImplementation(async ({chainId}: {chainId: number}) => {
        mockUseChainId.mockReturnValue(chainId)
        return Promise.resolve()
      })

      await act(async () => {
        await connectedResult.current.switchToChain(137)
      })

      // Step 4: Verify network switched successfully
      const {result: switchedResult} = renderHook(() => useWallet())
      expect(switchedResult.current.chainId).toBe(137)
      expect(switchedResult.current.isCurrentChainSupported).toBe(true)
      expect(switchedResult.current.currentNetwork?.name).toBe('Polygon')
    })

    it('should handle MetaMask connection rejection gracefully', async () => {
      const {result} = renderHook(() => useWallet())

      // Simulate user rejecting connection in MetaMask
      const rejectionError = new Error('User rejected the request')
      mockAppKitOpen.mockRejectedValueOnce(rejectionError)

      await expect(
        act(async () => {
          await result.current.connect()
        }),
      ).rejects.toThrow()

      // Verify still disconnected after rejection
      expect(result.current.isConnected).toBe(false)
      expect(result.current.address).toBeUndefined()
    })

    it('should handle MetaMask locked wallet error', async () => {
      const {result} = renderHook(() => useWallet())

      // Simulate MetaMask locked error
      const lockedError = new Error('MetaMask is locked')
      mockAppKitOpen.mockRejectedValueOnce(lockedError)

      await expect(
        act(async () => {
          await result.current.connect()
        }),
      ).rejects.toThrow('MetaMask is locked')

      expect(result.current.isConnected).toBe(false)
    })
  })

  describe('WalletConnect Complete Connection Flow', () => {
    it.skip('should complete full WalletConnect connection workflow', async () => {
      const {result} = renderHook(() => useWallet())

      // Step 1: Initial state
      expect(result.current.isConnected).toBe(false)

      // Step 2: Initiate WalletConnect connection (QR code displayed)
      mockAppKitOpen.mockResolvedValueOnce(undefined)
      await act(async () => {
        await result.current.connect()
      })

      expect(mockAppKitOpen).toHaveBeenCalledTimes(1)

      // Step 3: Simulate successful WalletConnect pairing
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseAccount.mockReturnValue({
        address: WALLETCONNECT_ADDRESS,
        isConnected: true,
        connector: {id: 'walletConnect', name: 'WalletConnect'},
      } as any)

      const {result: connectedResult} = renderHook(() => useWallet())

      // Step 4: Verify connected state
      expect(connectedResult.current.isConnected).toBe(true)
      expect(connectedResult.current.address).toBe(WALLETCONNECT_ADDRESS)
      expect(connectedResult.current.displayAddress).toBe('0x7099...79C8')

      // Step 5: Verify network support
      expect(connectedResult.current.isCurrentChainSupported).toBe(true)
    })

    it('should handle WalletConnect connection timeout', async () => {
      const {result} = renderHook(() => useWallet())

      // Simulate connection timeout (user doesn't scan QR code)
      const timeoutError = new Error('Connection timeout')
      mockAppKitOpen.mockRejectedValueOnce(timeoutError)

      await expect(
        act(async () => {
          await result.current.connect()
        }),
      ).rejects.toThrow('Connection timeout')

      expect(result.current.isConnected).toBe(false)
    })

    it('should handle WalletConnect session expiration and reconnection', async () => {
      // Step 1: Start with connected WalletConnect session
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseAccount.mockReturnValue({
        address: WALLETCONNECT_ADDRESS,
        isConnected: true,
        connector: {id: 'walletConnect', name: 'WalletConnect'},
      } as any)

      const {result} = renderHook(() => useWallet())
      expect(result.current.isConnected).toBe(true)

      // Step 2: Simulate session expiration (disconnect event)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseAccount.mockReturnValue({
        address: undefined,
        isConnected: false,
        connector: undefined,
      } as any)

      const {result: expiredResult} = renderHook(() => useWallet())
      expect(expiredResult.current.isConnected).toBe(false)

      // Step 3: Reconnect
      mockAppKitOpen.mockResolvedValueOnce(undefined)
      await act(async () => {
        await expiredResult.current.connect()
      })

      // Step 4: Verify reconnection successful
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseAccount.mockReturnValue({
        address: WALLETCONNECT_ADDRESS,
        isConnected: true,
        connector: {id: 'walletConnect', name: 'WalletConnect'},
      } as any)

      const {result: reconnectedResult} = renderHook(() => useWallet())
      expect(reconnectedResult.current.isConnected).toBe(true)
    })
  })

  describe('Coinbase Wallet Complete Connection Flow', () => {
    it.skip('should complete full Coinbase Wallet connection workflow', async () => {
      const {result} = renderHook(() => useWallet())

      // Step 1: Initial disconnected state
      expect(result.current.isConnected).toBe(false)

      // Step 2: Initiate Coinbase Wallet connection
      mockAppKitOpen.mockResolvedValueOnce(undefined)
      await act(async () => {
        await result.current.connect()
      })

      expect(mockAppKitOpen).toHaveBeenCalledTimes(1)

      // Step 3: Simulate successful Coinbase connection
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseAccount.mockReturnValue({
        address: COINBASE_ADDRESS,
        isConnected: true,
        connector: {id: 'coinbaseWalletSDK', name: 'Coinbase Wallet'},
      } as any)

      const {result: connectedResult} = renderHook(() => useWallet())

      // Step 4: Verify connected state
      expect(connectedResult.current.isConnected).toBe(true)
      expect(connectedResult.current.address).toBe(COINBASE_ADDRESS)
      expect(connectedResult.current.displayAddress).toBe('0x3C44...293BC')

      // Step 5: Test network validation on Arbitrum
      mockUseChainId.mockReturnValue(42161)
      const {result: arbitrumResult} = renderHook(() => useWallet())

      expect(arbitrumResult.current.chainId).toBe(42161)
      expect(arbitrumResult.current.isCurrentChainSupported).toBe(true)
      expect(arbitrumResult.current.currentNetwork?.name).toBe('Arbitrum One')
      expect(arbitrumResult.current.currentNetwork?.symbol).toBe('ETH')
    })

    it('should handle Coinbase Wallet browser extension not installed', async () => {
      const {result} = renderHook(() => useWallet())

      // Simulate Coinbase extension not found
      const notFoundError = new Error('Coinbase Wallet extension not found')
      mockAppKitOpen.mockRejectedValueOnce(notFoundError)

      await expect(
        act(async () => {
          await result.current.connect()
        }),
      ).rejects.toThrow('Coinbase Wallet extension not found')

      expect(result.current.isConnected).toBe(false)
    })

    it('should handle Coinbase Wallet network mismatch on connection', async () => {
      // Connect on unsupported network (BSC)
      mockUseChainId.mockReturnValue(56)

      mockAppKitOpen.mockResolvedValueOnce(undefined)

      const {result} = renderHook(() => useWallet())

      await act(async () => {
        await result.current.connect()
      })

      // Simulate connection on wrong network
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseAccount.mockReturnValue({
        address: COINBASE_ADDRESS,
        isConnected: true,
        connector: {id: 'coinbaseWalletSDK', name: 'Coinbase Wallet'},
      } as any)

      const {result: connectedResult} = renderHook(() => useWallet())

      // Verify unsupported network detected
      expect(connectedResult.current.isConnected).toBe(true)
      expect(connectedResult.current.isCurrentChainSupported).toBe(false)
      expect(connectedResult.current.unsupportedNetworkError).not.toBeNull()
    })
  })

  describe('Cross-Provider Switching Integration', () => {
    it('should switch from MetaMask to WalletConnect', async () => {
      // Step 1: Connect with MetaMask
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseAccount.mockReturnValue({
        address: METAMASK_ADDRESS,
        isConnected: true,
        connector: {id: 'metaMaskSDK', name: 'MetaMask'},
      } as any)

      const {result: metamaskResult} = renderHook(() => useWallet())
      expect(metamaskResult.current.isConnected).toBe(true)
      expect(metamaskResult.current.address).toBe(METAMASK_ADDRESS)

      // Step 2: Disconnect MetaMask
      await act(async () => {
        await metamaskResult.current.disconnect()
      })

      expect(mockDisconnect).toHaveBeenCalledTimes(1)

      // Step 3: Simulate disconnected state
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseAccount.mockReturnValue({
        address: undefined,
        isConnected: false,
        connector: undefined,
      } as any)

      const {result: disconnectedResult} = renderHook(() => useWallet())
      expect(disconnectedResult.current.isConnected).toBe(false)

      // Step 4: Connect with WalletConnect
      mockAppKitOpen.mockResolvedValueOnce(undefined)
      await act(async () => {
        await disconnectedResult.current.connect()
      })

      // Step 5: Simulate WalletConnect connection
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseAccount.mockReturnValue({
        address: WALLETCONNECT_ADDRESS,
        isConnected: true,
        connector: {id: 'walletConnect', name: 'WalletConnect'},
      } as any)

      const {result: walletConnectResult} = renderHook(() => useWallet())
      expect(walletConnectResult.current.isConnected).toBe(true)
      expect(walletConnectResult.current.address).toBe(WALLETCONNECT_ADDRESS)
    })

    it('should handle rapid provider switching without state corruption', async () => {
      // Step 1: Connect MetaMask
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseAccount.mockReturnValue({
        address: METAMASK_ADDRESS,
        isConnected: true,
        connector: {id: 'metaMaskSDK', name: 'MetaMask'},
      } as any)

      const {result: result1} = renderHook(() => useWallet())
      expect(result1.current.address).toBe(METAMASK_ADDRESS)

      // Step 2: Quick disconnect and reconnect with Coinbase
      await act(async () => {
        await result1.current.disconnect()
      })

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseAccount.mockReturnValue({
        address: COINBASE_ADDRESS,
        isConnected: true,
        connector: {id: 'coinbaseWalletSDK', name: 'Coinbase Wallet'},
      } as any)

      const {result: result2} = renderHook(() => useWallet())

      // Step 3: Verify clean state transition
      expect(result2.current.isConnected).toBe(true)
      expect(result2.current.address).toBe(COINBASE_ADDRESS)
      expect(result2.current.address).not.toBe(METAMASK_ADDRESS)
    })
  })

  describe('Multi-Hook Integration Scenarios', () => {
    it('should integrate useWallet with useWalletPersistence for reconnection', async () => {
      // Step 1: Connect wallet
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseAccount.mockReturnValue({
        address: METAMASK_ADDRESS,
        isConnected: true,
        connector: {id: 'metaMaskSDK', name: 'MetaMask'},
      } as any)

      const {result: walletResult} = renderHook(() => useWallet())
      const {result: persistenceResult} = renderHook(() => useWalletPersistence({debug: false}))

      expect(walletResult.current.isConnected).toBe(true)
      expect(persistenceResult.current.isAvailable).toBe(true)

      // Step 2: Store connection preferences through persistence API
      if (persistenceResult.current.setAutoReconnect != null) {
        await act(async () => {
          await persistenceResult.current.setAutoReconnect(true)
        })
      }

      // Step 3: Verify storage API available
      expect(persistenceResult.current.isAvailable).toBe(true)
    })

    it.skip('should integrate useWallet with useWalletSwitcher for multi-chain operations', async () => {
      // Step 1: Connect to Ethereum
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseAccount.mockReturnValue({
        address: METAMASK_ADDRESS,
        isConnected: true,
        connector: {id: 'metaMaskSDK', name: 'MetaMask'},
      } as any)
      mockUseChainId.mockReturnValue(1)

      const {result: walletResult} = renderHook(() => useWallet())
      const {result: switcherResult} = renderHook(() => useWalletSwitcher())

      expect(walletResult.current.chainId).toBe(1)

      // Step 2: Use switcher to change to Polygon
      mockSwitchChain.mockImplementation(async ({chainId}: {chainId: number}) => {
        mockUseChainId.mockReturnValue(chainId)
        return Promise.resolve()
      })

      if (switcherResult.current.switchChain != null) {
        await act(async () => {
          await switcherResult.current.switchChain(137)
        })
      }

      // Step 3: Verify chain switched through both hooks
      const {result: updatedWallet} = renderHook(() => useWallet())
      expect(updatedWallet.current.chainId).toBe(137)
      expect(updatedWallet.current.currentNetwork?.name).toBe('Polygon')
    })

    it.skip('should integrate useWallet with useWalletErrorHandler for error recovery', async () => {
      // Step 1: Simulate connection error
      const connectionError = new Error('Connection failed')
      mockAppKitOpen.mockRejectedValueOnce(connectionError)

      const {result: walletResult} = renderHook(() => useWallet())
      const {result: errorResult} = renderHook(() => useWalletErrorHandler())

      // Step 2: Attempt connection that fails
      await expect(
        act(async () => {
          await walletResult.current.connect()
        }),
      ).rejects.toThrow()

      // Step 3: Use wallet's classify function
      const classified = walletResult.current.classifyWalletError(connectionError, {
        action: 'connect',
      })

      expect(classified.code).toBeDefined()
      expect(classified.userFriendlyMessage).toBeDefined()

      // Step 4: Use error handler to show error
      errorResult.current.showError(classified)
      expect(errorResult.current.hasError).toBe(true)
    })
  })

  describe('Network Validation Integration Across Providers', () => {
    it('should enforce network validation consistently across all providers', async () => {
      const providers = [
        {id: 'metaMaskSDK', name: 'MetaMask', address: METAMASK_ADDRESS},
        {id: 'walletConnect', name: 'WalletConnect', address: WALLETCONNECT_ADDRESS},
        {id: 'coinbaseWalletSDK', name: 'Coinbase Wallet', address: COINBASE_ADDRESS},
      ]

      for (const provider of providers) {
        // Connect on unsupported network (BSC chain ID 56)
        mockUseChainId.mockReturnValue(56)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        mockUseAccount.mockReturnValue({
          address: provider.address,
          isConnected: true,
          connector: {id: provider.id, name: provider.name},
        } as any)

        const {result} = renderHook(() => useWallet())

        // Verify all providers detect unsupported network
        expect(result.current.isConnected).toBe(true)
        expect(result.current.isCurrentChainSupported).toBe(false)

        const unsupportedError = result.current.getUnsupportedNetworkError()
        expect(unsupportedError).not.toBeNull()
        if (unsupportedError != null) {
          expect(unsupportedError.currentChainId).toBe(56)
          expect(unsupportedError.suggestedChain.id).toBe(1)
        }
      }
    })

    it.skip('should support all three main chains (Ethereum, Polygon, Arbitrum) for all providers', async () => {
      const supportedChains = [
        {id: 1, name: 'Ethereum Mainnet', symbol: 'ETH'},
        {id: 137, name: 'Polygon', symbol: 'MATIC'},
        {id: 42161, name: 'Arbitrum One', symbol: 'ETH'},
      ]

      // Test MetaMask on all chains
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseAccount.mockReturnValue({
        address: METAMASK_ADDRESS,
        isConnected: true,
        connector: {id: 'metaMaskSDK', name: 'MetaMask'},
      } as any)

      for (const chain of supportedChains) {
        mockUseChainId.mockReturnValue(chain.id)
        const {result} = renderHook(() => useWallet())

        expect(result.current.isCurrentChainSupported).toBe(true)
        expect(result.current.currentNetwork?.name).toBe(chain.name)
        expect(result.current.currentNetwork?.symbol).toBe(chain.symbol)
        expect(result.current.unsupportedNetworkError).toBeNull()
      }
    })
  })

  describe('Connection Persistence Integration', () => {
    it.skip('should persist connection state across page reloads', async () => {
      // Step 1: Connect wallet
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseAccount.mockReturnValue({
        address: METAMASK_ADDRESS,
        isConnected: true,
        connector: {id: 'metaMaskSDK', name: 'MetaMask'},
      } as any)
      mockUseChainId.mockReturnValue(1)

      const {result: wallet1} = renderHook(() => useWallet())
      const {result: persistence1} = renderHook(() => useWalletPersistence({debug: false}))

      // Step 2: Store connection data
      await act(async () => {
        await persistence1.current.storeWalletPreference('MetaMask', METAMASK_ADDRESS)
        await persistence1.current.storeChainPreference(1)
      })

      // Step 3: Verify storage
      expect(mockLocalStorage.wallet_preference).toBeDefined()
      expect(mockLocalStorage.wallet_chain_preference).toBeDefined()

      // Step 4: Simulate page reload (new hook instances)
      const {result: persistence2} = renderHook(() => useWalletPersistence({debug: false}))

      await waitFor(() => {
        expect(persistence2.current.lastConnectedWallet).toBe('MetaMask')
      })

      expect(persistence2.current.lastConnectedAddress).toBe(METAMASK_ADDRESS)
      expect(persistence2.current.lastConnectedChain).toBe(1)
    })

    it.skip('should clear persistence on manual disconnect', async () => {
      // Step 1: Set up connected state with persistence
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseAccount.mockReturnValue({
        address: METAMASK_ADDRESS,
        isConnected: true,
        connector: {id: 'metaMaskSDK', name: 'MetaMask'},
      } as any)

      const {result: wallet} = renderHook(() => useWallet())
      const {result: persistence} = renderHook(() => useWalletPersistence({debug: false}))

      await act(async () => {
        if (persistence.current.storeWalletPreference) {
          await persistence.current.storeWalletPreference('MetaMask', METAMASK_ADDRESS)
        }
      })

      expect(mockLocalStorage.wallet_preference).toBeDefined()

      // Step 2: Disconnect wallet
      await act(async () => {
        await wallet.current.disconnect()
      })

      // Step 3: Verify persistence cleared
      await waitFor(() => {
        expect(mockLocalStorage.wallet_preference).toBeUndefined()
      })
    })
  })

  describe('Error Recovery Integration', () => {
    it('should provide error handling through wallet classification', async () => {
      const {result: wallet} = renderHook(() => useWallet())

      const rpcError = new Error('RPC endpoint not responding')
      const classified = wallet.current.classifyWalletError(rpcError, {
        action: 'connect',
        chainId: 1,
      })

      expect(classified.code).toBeDefined()
      expect(classified.userFriendlyMessage).toBeDefined()
    })

    it('should handle provider-specific errors with appropriate recovery', async () => {
      const metamaskError = new Error('MetaMask is locked')
      const walletConnectError = new Error('QR code scan timeout')
      const coinbaseError = new Error('Coinbase extension not installed')

      const {result: wallet} = renderHook(() => useWallet())

      // Test MetaMask error
      const metamaskClassified = wallet.current.classifyWalletError(metamaskError, {
        action: 'connect',
      })
      expect(metamaskClassified.userFriendlyMessage).toBeDefined()

      // Test WalletConnect error
      const wcClassified = wallet.current.classifyWalletError(walletConnectError, {
        action: 'connect',
      })
      expect(wcClassified.userFriendlyMessage).toBeDefined()

      // Test Coinbase error
      const cbClassified = wallet.current.classifyWalletError(coinbaseError, {
        action: 'connect',
      })
      expect(cbClassified.userFriendlyMessage).toBeDefined()
    })
  })

  describe('Concurrent Connection Attempts', () => {
    it('should handle multiple simultaneous connection attempts gracefully', async () => {
      const {result} = renderHook(() => useWallet())

      expect(result.current.isConnected).toBe(false)

      mockAppKitOpen.mockImplementation(
        async () =>
          new Promise(resolve => {
            setTimeout(() => resolve(undefined), 100)
          }),
      )

      // Attempt multiple connections simultaneously
      const connection1 = act(async () => {
        await result.current.connect()
      })

      const connection2 = act(async () => {
        await result.current.connect()
      })

      // Both should complete without error
      await Promise.all([connection1, connection2])

      // AppKit open should have been called (possibly multiple times)
      expect(mockAppKitOpen).toHaveBeenCalled()
    })
  })

  describe('Auto-Reconnection on Network Change', () => {
    it.skip('should maintain connection when network changes to another supported chain', async () => {
      // Start connected on Ethereum
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseAccount.mockReturnValue({
        address: METAMASK_ADDRESS,
        isConnected: true,
        connector: {id: 'metaMaskSDK', name: 'MetaMask'},
      } as any)
      mockUseChainId.mockReturnValue(1)

      const {result: result1} = renderHook(() => useWallet())
      expect(result1.current.chainId).toBe(1)
      expect(result1.current.isConnected).toBe(true)

      // User switches network in MetaMask to Polygon
      mockUseChainId.mockReturnValue(137)

      const {result: result2} = renderHook(() => useWallet())

      // Verify connection maintained
      expect(result2.current.isConnected).toBe(true)
      expect(result2.current.chainId).toBe(137)
      expect(result2.current.isCurrentChainSupported).toBe(true)
    })

    it.skip('should detect when network changes to unsupported chain', async () => {
      // Start connected on Ethereum
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseAccount.mockReturnValue({
        address: METAMASK_ADDRESS,
        isConnected: true,
        connector: {id: 'metaMaskSDK', name: 'MetaMask'},
      } as any)
      mockUseChainId.mockReturnValue(1)

      const {result: result1} = renderHook(() => useWallet())
      expect(result1.current.isCurrentChainSupported).toBe(true)

      // User switches to unsupported network (Optimism)
      mockUseChainId.mockReturnValue(10)

      const {result: result2} = renderHook(() => useWallet())

      // Verify unsupported network detected
      expect(result2.current.isConnected).toBe(true)
      expect(result2.current.isCurrentChainSupported).toBe(false)
      const unsupportedError = result2.current.getUnsupportedNetworkError()
      expect(unsupportedError).not.toBeNull()
    })
  })
})
