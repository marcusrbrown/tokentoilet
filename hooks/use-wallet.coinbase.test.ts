import {useWallet} from '@/hooks/use-wallet'
import {act, renderHook} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi, type MockedFunction} from 'vitest'

import {useAccount, useChainId, useDisconnect, useSwitchChain} from 'wagmi'

// Mock wagmi hooks
vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
  useChainId: vi.fn(),
  useDisconnect: vi.fn(),
  useSwitchChain: vi.fn(),
}))

// Mock Reown AppKit with Coinbase Wallet-specific behaviors
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

const mockUseAccount = useAccount as MockedFunction<typeof useAccount>
const mockUseChainId = useChainId as MockedFunction<typeof useChainId>
const mockUseDisconnect = useDisconnect as MockedFunction<typeof useDisconnect>
const mockUseSwitchChain = useSwitchChain as MockedFunction<typeof useSwitchChain>

describe('useWallet - Coinbase Wallet Connection Flow (TASK-019)', () => {
  const mockDisconnect = vi.fn()
  const mockSwitchChain = vi.fn()

  // Mock Coinbase Wallet address for testing
  const MOCK_COINBASE_ADDRESS = '0xCF3fC30dd27C3B8c7da28b2518835d4E015Ad026' as const

  beforeEach(() => {
    vi.clearAllMocks()

    // Reset to disconnected state by default
    // Use type assertion to avoid complex interface matching
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    mockUseAccount.mockReturnValue({
      address: undefined,
      isConnected: false,
    } as any)

    mockUseChainId.mockReturnValue(1) // Default to Ethereum mainnet
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
  })

  describe('Coinbase Wallet Connection', () => {
    it('should successfully connect to Coinbase Wallet browser extension', async () => {
      const {result} = renderHook(() => useWallet())

      // Simulate successful Coinbase Wallet connection
      mockAppKitOpen.mockResolvedValueOnce(undefined)

      // After connection, wallet should be connected
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseAccount.mockReturnValue({
        address: MOCK_COINBASE_ADDRESS,
        isConnected: true,
      } as any)

      await act(async () => {
        await result.current.connect()
      })

      // Re-render to get updated state
      const {result: connectedResult} = renderHook(() => useWallet())
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseAccount.mockReturnValue({
        address: MOCK_COINBASE_ADDRESS,
        isConnected: true,
      } as any)

      expect(connectedResult.current.isConnected).toBe(true)
      expect(connectedResult.current.address).toBe(MOCK_COINBASE_ADDRESS)
      expect(connectedResult.current.isCurrentChainSupported).toBe(true)
    })

    it('should handle Coinbase Wallet connection failure gracefully', async () => {
      const {result} = renderHook(() => useWallet())

      // Simulate Coinbase Wallet connection error (user rejection, wallet locked, etc.)
      const connectionError = new Error('User denied account authorization')
      mockAppKitOpen.mockRejectedValueOnce(connectionError)

      // Capture console.error to verify error logging
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await act(async () => {
        await expect(result.current.connect()).rejects.toThrow('User denied account authorization')
      })

      // Verify error was logged
      expect(consoleSpy).toHaveBeenCalledWith('Failed to connect wallet:', connectionError)

      // Verify state remains disconnected
      expect(result.current.isConnected).toBe(false)
      expect(result.current.address).toBeUndefined()

      consoleSpy.mockRestore()
    })

    it('should handle Coinbase Wallet connection on unsupported network', async () => {
      // Start on unsupported network (BSC)
      mockUseChainId.mockReturnValue(56)

      const {result} = renderHook(() => useWallet())

      // Simulate successful connection but on unsupported network
      mockAppKitOpen.mockResolvedValueOnce(undefined)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseAccount.mockReturnValue({
        address: MOCK_COINBASE_ADDRESS,
        isConnected: true,
      } as any)

      // Capture console warnings
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      await act(async () => {
        await result.current.connect()
      })

      // Update mock to reflect connected state after connection
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseAccount.mockReturnValue({
        address: MOCK_COINBASE_ADDRESS,
        isConnected: true,
      } as any)

      // Re-render to get updated state
      const {result: connectedResult} = renderHook(() => useWallet())

      // Verify warning was logged for unsupported network
      expect(consoleSpy).toHaveBeenCalledWith(
        'Connected to unsupported network:',
        expect.stringContaining('Switch to Ethereum Mainnet'),
      )

      // Verify user is connected but on unsupported network
      expect(connectedResult.current.isConnected).toBe(true)
      expect(connectedResult.current.address).toBe(MOCK_COINBASE_ADDRESS)
      expect(connectedResult.current.isCurrentChainSupported).toBe(false)

      consoleSpy.mockRestore()
    })

    it('should handle Coinbase Smart Wallet connection scenarios', async () => {
      const {result} = renderHook(() => useWallet())

      // Simulate successful Coinbase Smart Wallet connection
      mockAppKitOpen.mockResolvedValueOnce(undefined)

      // Smart Wallet typically has different address format but same functionality
      const SMART_WALLET_ADDRESS = '0x4e6f1fc7671d1dE5F1Ef4E7b9B3e2e2Ef8c5A3b6' as const
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseAccount.mockReturnValue({
        address: SMART_WALLET_ADDRESS,
        isConnected: true,
      } as any)

      await act(async () => {
        await result.current.connect()
      })

      // Re-render to get updated state
      const {result: connectedResult} = renderHook(() => useWallet())
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseAccount.mockReturnValue({
        address: SMART_WALLET_ADDRESS,
        isConnected: true,
      } as any)

      expect(connectedResult.current.isConnected).toBe(true)
      expect(connectedResult.current.address).toBe(SMART_WALLET_ADDRESS)
      expect(connectedResult.current.isCurrentChainSupported).toBe(true)
    })

    it('should handle Coinbase Wallet mobile app deep linking', async () => {
      const {result} = renderHook(() => useWallet())

      // Simulate mobile deep link connection to Coinbase Wallet app
      mockAppKitOpen.mockResolvedValueOnce(undefined)

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseAccount.mockReturnValue({
        address: MOCK_COINBASE_ADDRESS,
        isConnected: true,
      } as any)

      await act(async () => {
        await result.current.connect()
      })

      // Re-render to get updated state
      const {result: connectedResult} = renderHook(() => useWallet())
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseAccount.mockReturnValue({
        address: MOCK_COINBASE_ADDRESS,
        isConnected: true,
      } as any)

      expect(connectedResult.current.isConnected).toBe(true)
      expect(connectedResult.current.address).toBe(MOCK_COINBASE_ADDRESS)
    })

    it('should handle Coinbase Wallet mobile app not installed error', async () => {
      const {result} = renderHook(() => useWallet())

      // Simulate Coinbase Wallet app not installed on mobile
      const appNotInstalledError = new Error('Coinbase Wallet app is not installed')
      mockAppKitOpen.mockRejectedValueOnce(appNotInstalledError)

      // Capture console.error to verify error logging
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await act(async () => {
        await expect(result.current.connect()).rejects.toThrow('Coinbase Wallet app is not installed')
      })

      // Verify error was logged
      expect(consoleSpy).toHaveBeenCalledWith('Failed to connect wallet:', appNotInstalledError)

      // Verify state remains disconnected
      expect(result.current.isConnected).toBe(false)
      expect(result.current.address).toBeUndefined()

      consoleSpy.mockRestore()
    })

    it('should handle Coinbase Wallet browser within mobile app connection', async () => {
      const {result} = renderHook(() => useWallet())

      // Simulate connection via Coinbase Wallet's built-in browser
      mockAppKitOpen.mockResolvedValueOnce(undefined)

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseAccount.mockReturnValue({
        address: MOCK_COINBASE_ADDRESS,
        isConnected: true,
      } as any)

      await act(async () => {
        await result.current.connect()
      })

      // Re-render to get updated state
      const {result: connectedResult} = renderHook(() => useWallet())
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseAccount.mockReturnValue({
        address: MOCK_COINBASE_ADDRESS,
        isConnected: true,
      } as any)

      expect(connectedResult.current.isConnected).toBe(true)
      expect(connectedResult.current.address).toBe(MOCK_COINBASE_ADDRESS)
    })
  })

  describe('Coinbase Wallet Disconnection', () => {
    beforeEach(() => {
      // Start with connected state
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseAccount.mockReturnValue({
        address: MOCK_COINBASE_ADDRESS,
        isConnected: true,
      } as any)
    })

    it('should successfully disconnect from Coinbase Wallet', async () => {
      const {result} = renderHook(() => useWallet())

      // Simulate successful disconnection
      mockDisconnect.mockResolvedValueOnce(undefined)

      await act(async () => {
        await result.current.disconnect()
      })

      expect(mockDisconnect).toHaveBeenCalledOnce()
    })

    it('should handle Coinbase Wallet disconnection failure gracefully', async () => {
      const {result} = renderHook(() => useWallet())

      // Simulate disconnection error
      const disconnectionError = new Error('Failed to disconnect from Coinbase Wallet')
      mockDisconnect.mockImplementationOnce(() => {
        throw disconnectionError
      })

      // Capture console.error to verify error logging
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await act(async () => {
        // Disconnect should not throw - uses graceful error handling
        await result.current.disconnect()
      })

      // Verify error was logged gracefully
      expect(consoleSpy).toHaveBeenCalledWith('Failed to disconnect wallet:', disconnectionError)

      consoleSpy.mockRestore()
    })

    it('should handle external disconnection from Coinbase Wallet app', async () => {
      renderHook(() => useWallet())

      // Simulate external disconnection (user disconnects from Coinbase Wallet app)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseAccount.mockReturnValue({
        address: undefined,
        isConnected: false,
      } as any)

      // Re-render to get updated state
      const {result: disconnectedResult} = renderHook(() => useWallet())
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseAccount.mockReturnValue({
        address: undefined,
        isConnected: false,
      } as any)

      expect(disconnectedResult.current.isConnected).toBe(false)
      expect(disconnectedResult.current.address).toBeUndefined()
    })
  })

  describe('Coinbase Wallet Network Switching', () => {
    beforeEach(() => {
      // Start with connected state on Ethereum mainnet
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseAccount.mockReturnValue({
        address: MOCK_COINBASE_ADDRESS,
        isConnected: true,
      } as any)
      mockUseChainId.mockReturnValue(1) // Ethereum mainnet
    })

    it('should successfully switch from Ethereum to Polygon via Coinbase Wallet', async () => {
      const {result} = renderHook(() => useWallet())

      // Simulate successful network switch
      mockSwitchChain.mockResolvedValueOnce(undefined)

      await act(async () => {
        await result.current.switchToChain(137) // Polygon
      })

      expect(mockSwitchChain).toHaveBeenCalledWith({chainId: 137})
    })

    it('should successfully switch from Polygon to Arbitrum via Coinbase Wallet', async () => {
      // Start on Polygon
      mockUseChainId.mockReturnValue(137)

      const {result} = renderHook(() => useWallet())

      // Simulate successful network switch
      mockSwitchChain.mockResolvedValueOnce(undefined)

      await act(async () => {
        await result.current.switchToChain(42161) // Arbitrum
      })

      expect(mockSwitchChain).toHaveBeenCalledWith({chainId: 42161})
    })

    it('should handle Coinbase Wallet network switch rejection', async () => {
      const {result} = renderHook(() => useWallet())

      // Simulate user rejecting network switch in Coinbase Wallet
      const switchError = new Error('User rejected the network switch request')
      mockSwitchChain.mockImplementationOnce(() => {
        throw switchError
      })

      // Capture console.error to verify error logging
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await act(async () => {
        await expect(result.current.switchToChain(137)).rejects.toThrow('User rejected the network switch request')
      })

      // Verify error was logged
      expect(consoleSpy).toHaveBeenCalledWith('Failed to switch to chain 137:', switchError)

      consoleSpy.mockRestore()
    })

    it('should handle unsupported network switch attempt via Coinbase Wallet', async () => {
      const {result} = renderHook(() => useWallet())

      // Attempt to switch to unsupported network
      await act(async () => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        await expect(result.current.switchToChain(56 as any)).rejects.toThrow(
          'Cannot switch to unsupported chain ID: 56',
        )
      })

      // Verify switchChain was not called for unsupported network
      expect(mockSwitchChain).not.toHaveBeenCalled()
    })

    it('should handle Coinbase Wallet network switch timeout', async () => {
      const {result} = renderHook(() => useWallet())

      // Simulate network switch timeout
      const timeoutError = new Error('Network switch request timed out')
      mockSwitchChain.mockImplementationOnce(() => {
        throw timeoutError
      })

      // Capture console.error to verify error logging
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await act(async () => {
        await expect(result.current.switchToChain(137)).rejects.toThrow('Network switch request timed out')
      })

      // Verify error was logged
      expect(consoleSpy).toHaveBeenCalledWith('Failed to switch to chain 137:', timeoutError)

      consoleSpy.mockRestore()
    })
  })

  describe('Coinbase Wallet Account Management', () => {
    it('should handle account switching within Coinbase Wallet', () => {
      // Start with first account
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseAccount.mockReturnValue({
        address: MOCK_COINBASE_ADDRESS,
        isConnected: true,
      } as any)

      const {result, rerender} = renderHook(() => useWallet())

      expect(result.current.address).toBe(MOCK_COINBASE_ADDRESS)

      // Simulate account switch in Coinbase Wallet
      const newAddress = '0x742d35Cc6634C0532925a3b8D4C8e6E2f5c0C8d8' as const
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseAccount.mockReturnValue({
        address: newAddress,
        isConnected: true,
      } as any)

      rerender()

      // Verify updated account
      expect(result.current.address).toBe(newAddress)
      expect(result.current.isConnected).toBe(true)
    })

    it('should handle connection persistence after page reload with Coinbase Wallet', async () => {
      // Simulate page reload with existing Coinbase Wallet connection
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseAccount.mockReturnValue({
        address: MOCK_COINBASE_ADDRESS,
        isConnected: true,
      } as any)

      const {result} = renderHook(() => useWallet())

      // Connection should be automatically restored
      expect(result.current.isConnected).toBe(true)
      expect(result.current.address).toBe(MOCK_COINBASE_ADDRESS)
    })
  })

  describe('Coinbase Wallet Error Handling', () => {
    it('should handle Coinbase Wallet locked error', async () => {
      const {result} = renderHook(() => useWallet())

      // Simulate Coinbase Wallet locked error
      const walletLockedError = new Error('Coinbase Wallet is locked')
      mockAppKitOpen.mockRejectedValueOnce(walletLockedError)

      // Capture console.error to verify error logging
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await act(async () => {
        await expect(result.current.connect()).rejects.toThrow('Coinbase Wallet is locked')
      })

      // Verify error was logged
      expect(consoleSpy).toHaveBeenCalledWith('Failed to connect wallet:', walletLockedError)

      consoleSpy.mockRestore()
    })

    it('should handle Coinbase Wallet extension not installed error', async () => {
      const {result} = renderHook(() => useWallet())

      // Simulate Coinbase Wallet extension not installed
      const extensionNotInstalledError = new Error('Coinbase Wallet extension is not installed')
      mockAppKitOpen.mockRejectedValueOnce(extensionNotInstalledError)

      // Capture console.error to verify error logging
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await act(async () => {
        await expect(result.current.connect()).rejects.toThrow('Coinbase Wallet extension is not installed')
      })

      // Verify error was logged
      expect(consoleSpy).toHaveBeenCalledWith('Failed to connect wallet:', extensionNotInstalledError)

      consoleSpy.mockRestore()
    })

    it('should handle Coinbase Wallet connection timeout', async () => {
      const {result} = renderHook(() => useWallet())

      // Simulate connection timeout
      const timeoutError = new Error('Connection to Coinbase Wallet timed out')
      mockAppKitOpen.mockRejectedValueOnce(timeoutError)

      // Capture console.error to verify error logging
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await act(async () => {
        await expect(result.current.connect()).rejects.toThrow('Connection to Coinbase Wallet timed out')
      })

      // Verify error was logged
      expect(consoleSpy).toHaveBeenCalledWith('Failed to connect wallet:', timeoutError)

      consoleSpy.mockRestore()
    })
  })

  describe('Coinbase Wallet Unsupported Network Handling', () => {
    it('should handle connection warning when Coinbase Wallet is on unsupported network', async () => {
      // Start on unsupported network (Base - Chain ID 8453)
      mockUseChainId.mockReturnValue(8453)

      const {result} = renderHook(() => useWallet())

      // Simulate successful connection but on unsupported network
      mockAppKitOpen.mockResolvedValueOnce(undefined)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseAccount.mockReturnValue({
        address: MOCK_COINBASE_ADDRESS,
        isConnected: true,
      } as any)

      // Capture console warnings
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      await act(async () => {
        await result.current.connect()
      })

      // Update mock to reflect connected state after connection
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseAccount.mockReturnValue({
        address: MOCK_COINBASE_ADDRESS,
        isConnected: true,
      } as any)

      // Re-render to get updated state
      const {result: connectedResult} = renderHook(() => useWallet())

      // Verify warning was logged for unsupported network
      expect(consoleSpy).toHaveBeenCalledWith(
        'Connected to unsupported network:',
        expect.stringContaining('Switch to Ethereum Mainnet'),
      )

      // Verify user is connected but on unsupported network
      expect(connectedResult.current.isConnected).toBe(true)
      expect(connectedResult.current.address).toBe(MOCK_COINBASE_ADDRESS)
      expect(connectedResult.current.isCurrentChainSupported).toBe(false)

      consoleSpy.mockRestore()
    })

    it('should handle auto-switching from unsupported network via Coinbase Wallet', async () => {
      // Start on unsupported network
      mockUseChainId.mockReturnValue(8453) // Base

      const {result} = renderHook(() => useWallet())

      // Mock connected state on unsupported network
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseAccount.mockReturnValue({
        address: MOCK_COINBASE_ADDRESS,
        isConnected: true,
      } as any)

      // Simulate successful auto-switch to Ethereum
      mockSwitchChain.mockResolvedValueOnce(undefined)

      await act(async () => {
        const switched = await result.current.handleUnsupportedNetwork(true)
        expect(switched).toBe(true)
      })

      expect(mockSwitchChain).toHaveBeenCalledWith({chainId: 1})
    })

    it('should handle auto-switching failure from unsupported network via Coinbase Wallet', async () => {
      // Start on unsupported network
      mockUseChainId.mockReturnValue(8453) // Base

      const {result} = renderHook(() => useWallet())

      // Mock connected state on unsupported network
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseAccount.mockReturnValue({
        address: MOCK_COINBASE_ADDRESS,
        isConnected: true,
      } as any)

      // Simulate auto-switch failure
      const switchError = new Error('User rejected network switch')
      mockSwitchChain.mockImplementationOnce(() => {
        throw switchError
      })

      // Capture console errors for the switch failure
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await act(async () => {
        const switched = await result.current.handleUnsupportedNetwork(true)
        expect(switched).toBe(false)
      })

      // Verify error was logged (from handleUnsupportedNetwork -> switchToChain)
      expect(consoleSpy).toHaveBeenCalledWith('Failed to switch to chain 1:', switchError)

      expect(mockSwitchChain).toHaveBeenCalledWith({chainId: 1})

      consoleSpy.mockRestore()
    })
  })
})
