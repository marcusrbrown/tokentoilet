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

// Mock Reown AppKit with WalletConnect-specific behaviors
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

describe('useWallet - WalletConnect Connection Flow (TASK-018)', () => {
  const mockDisconnect = vi.fn()
  const mockSwitchChain = vi.fn()

  // Mock WalletConnect address for testing
  const MOCK_WALLETCONNECT_ADDRESS = '0x8ba1f109551bD432803012645Hac136c54f4F4' as const

  beforeEach(() => {
    vi.clearAllMocks()

    // Reset to disconnected state by default
    // Use type assertion to avoid complex interface matching
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    mockUseAccount.mockReturnValue({
      address: undefined,
      isConnected: false,
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

    // Default to Ethereum mainnet
    mockUseChainId.mockReturnValue(1)

    // Reset AppKit mock
    mockAppKitOpen.mockReset()
  })

  describe('WalletConnect QR Code Connection Flow', () => {
    it('should handle WalletConnect QR code connection successfully', async () => {
      const {result} = renderHook(() => useWallet())

      // Verify initial disconnected state
      expect(result.current.isConnected).toBe(false)
      expect(result.current.address).toBeUndefined()

      // Simulate successful WalletConnect QR code connection
      mockAppKitOpen.mockResolvedValueOnce(undefined)

      await act(async () => {
        await result.current.connect()
      })

      // Verify AppKit modal was opened (would show QR code or wallet selection)
      expect(mockAppKitOpen).toHaveBeenCalledTimes(1)

      // Simulate WalletConnect connection success by updating account state
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseAccount.mockReturnValue({
        address: MOCK_WALLETCONNECT_ADDRESS,
        isConnected: true,
      } as any)

      // Re-render with updated state
      const {result: connectedResult} = renderHook(() => useWallet())

      expect(connectedResult.current.isConnected).toBe(true)
      expect(connectedResult.current.address).toBe(MOCK_WALLETCONNECT_ADDRESS)
      expect(connectedResult.current.isCurrentChainSupported).toBe(true)
    })

    it('should handle WalletConnect QR code timeout', async () => {
      const {result} = renderHook(() => useWallet())

      // Simulate QR code connection timeout
      const timeoutError = new Error('Connection timeout: QR code expired')
      mockAppKitOpen.mockRejectedValueOnce(timeoutError)

      // Capture console.error to verify error logging
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await act(async () => {
        await expect(result.current.connect()).rejects.toThrow('Failed to connect wallet')
      })

      // Verify error was logged
      expect(consoleSpy).toHaveBeenCalledWith('Failed to connect wallet:', timeoutError)

      // Verify state remains disconnected
      expect(result.current.isConnected).toBe(false)
      expect(result.current.address).toBeUndefined()

      consoleSpy.mockRestore()
    })

    it('should handle WalletConnect QR code scanning but connection rejection', async () => {
      const {result} = renderHook(() => useWallet())

      // Simulate QR code scanned but user rejected connection in mobile wallet
      const rejectionError = new Error('User rejected the connection request')
      mockAppKitOpen.mockRejectedValueOnce(rejectionError)

      // Capture console.error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await act(async () => {
        await expect(result.current.connect()).rejects.toThrow('Failed to connect wallet')
      })

      // Verify error was logged
      expect(consoleSpy).toHaveBeenCalledWith('Failed to connect wallet:', rejectionError)

      // Verify state remains disconnected
      expect(result.current.isConnected).toBe(false)

      consoleSpy.mockRestore()
    })
  })

  describe('WalletConnect Deep Linking (Mobile Wallets)', () => {
    it('should handle deep link connection to mobile wallet successfully', async () => {
      const {result} = renderHook(() => useWallet())

      // Simulate successful deep link connection (Trust Wallet, Rainbow, etc.)
      mockAppKitOpen.mockImplementationOnce(async () => {
        // Simulate deep link opening and successful connection
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        mockUseAccount.mockReturnValue({
          address: MOCK_WALLETCONNECT_ADDRESS,
          isConnected: true,
        } as any)
        return Promise.resolve()
      })

      await act(async () => {
        await result.current.connect()
      })

      // Verify connection attempt was made
      expect(mockAppKitOpen).toHaveBeenCalledTimes(1)

      // Re-render with connected state
      const {result: connectedResult} = renderHook(() => useWallet())

      expect(connectedResult.current.isConnected).toBe(true)
      expect(connectedResult.current.address).toBe(MOCK_WALLETCONNECT_ADDRESS)
    })

    it('should handle mobile wallet deep link failure (app not installed)', async () => {
      const {result} = renderHook(() => useWallet())

      // Simulate deep link failure - mobile wallet app not installed
      const deepLinkError = new Error('Mobile wallet app not found or deep link failed')
      mockAppKitOpen.mockRejectedValueOnce(deepLinkError)

      // Capture console.error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await act(async () => {
        await expect(result.current.connect()).rejects.toThrow('Failed to connect wallet')
      })

      expect(consoleSpy).toHaveBeenCalledWith('Failed to connect wallet:', deepLinkError)
      expect(result.current.isConnected).toBe(false)

      consoleSpy.mockRestore()
    })

    it('should handle mobile wallet deep link timeout', async () => {
      const {result} = renderHook(() => useWallet())

      // Simulate deep link timeout - user didn't approve in mobile wallet
      const timeoutError = new Error('Mobile wallet connection timeout')
      mockAppKitOpen.mockRejectedValueOnce(timeoutError)

      // Capture console.error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await act(async () => {
        await expect(result.current.connect()).rejects.toThrow('Failed to connect wallet')
      })

      expect(consoleSpy).toHaveBeenCalledWith('Failed to connect wallet:', timeoutError)

      consoleSpy.mockRestore()
    })
  })

  describe('WalletConnect Session Management', () => {
    it('should handle WalletConnect session disconnection', async () => {
      // Start in connected state via WalletConnect
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseAccount.mockReturnValue({
        address: MOCK_WALLETCONNECT_ADDRESS,
        isConnected: true,
      } as any)

      const {result} = renderHook(() => useWallet())

      // Verify initial connected state
      expect(result.current.isConnected).toBe(true)
      expect(result.current.address).toBe(MOCK_WALLETCONNECT_ADDRESS)

      // Simulate successful WalletConnect session disconnection
      mockDisconnect.mockImplementationOnce(() => {
        // Update account state to disconnected
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        mockUseAccount.mockReturnValue({
          address: undefined,
          isConnected: false,
        } as any)
      })

      await act(async () => {
        await result.current.disconnect()
      })

      // Verify disconnect was called
      expect(mockDisconnect).toHaveBeenCalledTimes(1)

      // Re-render with updated disconnected state
      const {result: disconnectedResult} = renderHook(() => useWallet())

      expect(disconnectedResult.current.isConnected).toBe(false)
      expect(disconnectedResult.current.address).toBeUndefined()
    })

    it('should handle WalletConnect session expiry', async () => {
      // Start connected
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseAccount.mockReturnValue({
        address: MOCK_WALLETCONNECT_ADDRESS,
        isConnected: true,
      } as any)

      const {result, rerender} = renderHook(() => useWallet())

      // Verify initial connected state
      expect(result.current.isConnected).toBe(true)

      // Simulate session expiry (external disconnection)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseAccount.mockReturnValue({
        address: undefined,
        isConnected: false,
      } as any)

      rerender()

      // Verify disconnected state after session expiry
      expect(result.current.isConnected).toBe(false)
      expect(result.current.address).toBeUndefined()
    })

    it('should handle WalletConnect session restoration on page reload', () => {
      // Simulate app startup with existing WalletConnect session
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseAccount.mockReturnValue({
        address: MOCK_WALLETCONNECT_ADDRESS,
        isConnected: true,
      } as any)
      mockUseChainId.mockReturnValue(137) // Connected to Polygon

      const {result} = renderHook(() => useWallet())

      // Verify session state is restored
      expect(result.current.isConnected).toBe(true)
      expect(result.current.address).toBe(MOCK_WALLETCONNECT_ADDRESS)
      expect(result.current.chainId).toBe(137)
      expect(result.current.isCurrentChainSupported).toBe(true)
      expect(result.current.currentNetwork?.name).toBe('Polygon')
    })
  })

  describe('WalletConnect Multi-Chain Network Switching', () => {
    beforeEach(() => {
      // Start in connected state via WalletConnect
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseAccount.mockReturnValue({
        address: MOCK_WALLETCONNECT_ADDRESS,
        isConnected: true,
      } as any)
    })

    it('should switch from Ethereum to Polygon via WalletConnect', async () => {
      // Start on Ethereum mainnet
      mockUseChainId.mockReturnValue(1)

      const {result} = renderHook(() => useWallet())

      // Verify initial state
      expect(result.current.chainId).toBe(1)
      expect(result.current.currentNetwork?.name).toBe('Ethereum Mainnet')

      // Simulate successful WalletConnect chain switch
      mockSwitchChain.mockImplementationOnce(async ({chainId}: {chainId: number}) => {
        mockUseChainId.mockReturnValue(chainId)
        return Promise.resolve()
      })

      await act(async () => {
        await result.current.switchToChain(137) // Switch to Polygon
      })

      // Verify switch was attempted
      expect(mockSwitchChain).toHaveBeenCalledWith({chainId: 137})

      // Re-render with updated chain
      const {result: switchedResult} = renderHook(() => useWallet())
      mockUseChainId.mockReturnValue(137)

      expect(switchedResult.current.chainId).toBe(137)
      expect(switchedResult.current.currentNetwork?.name).toBe('Polygon')
      expect(switchedResult.current.isCurrentChainSupported).toBe(true)
    })

    it('should handle WalletConnect network switch rejection by mobile wallet', async () => {
      // Start on Ethereum
      mockUseChainId.mockReturnValue(1)

      const {result} = renderHook(() => useWallet())

      // Simulate switch rejection in mobile wallet
      const rejectionError = new Error('Network switch rejected in mobile wallet')
      mockSwitchChain.mockImplementationOnce(() => {
        throw rejectionError
      })

      // Capture console.error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await act(async () => {
        await expect(result.current.switchToChain(137)).rejects.toThrow('Failed to switch to Polygon')
      })

      // Verify error was logged
      expect(consoleSpy).toHaveBeenCalledWith('Failed to switch to chain 137:', rejectionError)

      // Verify chain remained unchanged
      expect(result.current.chainId).toBe(1)

      consoleSpy.mockRestore()
    })

    it('should handle WalletConnect network switch to unsupported chain in mobile wallet', async () => {
      // Start on Ethereum
      mockUseChainId.mockReturnValue(1)

      const {result} = renderHook(() => useWallet())

      // User attempts to switch to unsupported chain (BSC) through WalletConnect
      await act(async () => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        await expect(result.current.switchToChain(56 as any)).rejects.toThrow(
          'Cannot switch to unsupported chain ID: 56',
        )
      })

      // Verify no switch was attempted
      expect(mockSwitchChain).not.toHaveBeenCalled()
      expect(result.current.chainId).toBe(1) // Remained on Ethereum
    })
  })

  describe('WalletConnect Error Scenarios', () => {
    it('should handle WalletConnect URI generation failure', async () => {
      const {result} = renderHook(() => useWallet())

      // Simulate WalletConnect URI generation failure
      const uriError = new Error('Failed to generate WalletConnect URI')
      mockAppKitOpen.mockRejectedValueOnce(uriError)

      // Capture console.error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await act(async () => {
        await expect(result.current.connect()).rejects.toThrow('Failed to connect wallet')
      })

      expect(consoleSpy).toHaveBeenCalledWith('Failed to connect wallet:', uriError)
      expect(result.current.isConnected).toBe(false)

      consoleSpy.mockRestore()
    })

    it('should handle WalletConnect bridge connection failure', async () => {
      const {result} = renderHook(() => useWallet())

      // Simulate WalletConnect bridge server failure
      const bridgeError = new Error('WalletConnect bridge server unavailable')
      mockAppKitOpen.mockRejectedValueOnce(bridgeError)

      // Capture console.error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await act(async () => {
        await expect(result.current.connect()).rejects.toThrow('Failed to connect wallet')
      })

      expect(consoleSpy).toHaveBeenCalledWith('Failed to connect wallet:', bridgeError)

      consoleSpy.mockRestore()
    })

    it('should handle WalletConnect protocol version mismatch', async () => {
      const {result} = renderHook(() => useWallet())

      // Simulate WalletConnect v1/v2 protocol mismatch
      const protocolError = new Error('WalletConnect protocol version not supported')
      mockAppKitOpen.mockRejectedValueOnce(protocolError)

      // Capture console.error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await act(async () => {
        await expect(result.current.connect()).rejects.toThrow('Failed to connect wallet')
      })

      expect(consoleSpy).toHaveBeenCalledWith('Failed to connect wallet:', protocolError)

      consoleSpy.mockRestore()
    })
  })

  describe('WalletConnect Cross-Platform Compatibility', () => {
    it('should handle desktop browser with mobile wallet QR scanning', async () => {
      const {result} = renderHook(() => useWallet())

      // Simulate desktop browser showing QR code for mobile wallet scanning
      mockAppKitOpen.mockImplementationOnce(async () => {
        // QR code displayed, user scans with mobile wallet
        // Simulate successful mobile wallet connection
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        mockUseAccount.mockReturnValue({
          address: MOCK_WALLETCONNECT_ADDRESS,
          isConnected: true,
        } as any)
        return Promise.resolve()
      })

      await act(async () => {
        await result.current.connect()
      })

      expect(mockAppKitOpen).toHaveBeenCalledTimes(1)

      // Re-render with connected state
      const {result: connectedResult} = renderHook(() => useWallet())

      expect(connectedResult.current.isConnected).toBe(true)
      expect(connectedResult.current.address).toBe(MOCK_WALLETCONNECT_ADDRESS)
    })

    it('should handle mobile browser with WalletConnect wallet selection', async () => {
      const {result} = renderHook(() => useWallet())

      // Simulate mobile browser with direct wallet app switching
      mockAppKitOpen.mockImplementationOnce(async () => {
        // Direct mobile wallet connection (no QR code needed)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        mockUseAccount.mockReturnValue({
          address: MOCK_WALLETCONNECT_ADDRESS,
          isConnected: true,
        } as any)
        return Promise.resolve()
      })

      await act(async () => {
        await result.current.connect()
      })

      expect(mockAppKitOpen).toHaveBeenCalledTimes(1)

      // Re-render with connected state
      const {result: connectedResult} = renderHook(() => useWallet())

      expect(connectedResult.current.isConnected).toBe(true)
      expect(connectedResult.current.address).toBe(MOCK_WALLETCONNECT_ADDRESS)
    })
  })

  describe('WalletConnect Integration with Unsupported Networks', () => {
    it('should handle WalletConnect connection on unsupported network', async () => {
      // Start on unsupported network (BSC)
      mockUseChainId.mockReturnValue(56)

      const {result} = renderHook(() => useWallet())

      // Simulate successful WalletConnect connection but on unsupported network
      mockAppKitOpen.mockResolvedValueOnce(undefined)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseAccount.mockReturnValue({
        address: MOCK_WALLETCONNECT_ADDRESS,
        isConnected: true,
      } as any)

      // Capture console warnings
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      await act(async () => {
        await result.current.connect()
      })

      // Verify warning was logged for unsupported network
      expect(consoleSpy).toHaveBeenCalledWith(
        'Connected to unsupported network:',
        expect.stringContaining('Switch to Ethereum Mainnet'),
      )

      // Verify connection succeeded but network is unsupported
      const {result: connectedResult} = renderHook(() => useWallet())
      mockUseChainId.mockReturnValue(56) // Ensure unsupported chain in new render

      expect(connectedResult.current.isConnected).toBe(true)
      expect(connectedResult.current.isCurrentChainSupported).toBe(false)

      const unsupportedError = connectedResult.current.getUnsupportedNetworkError()
      expect(unsupportedError).not.toBeNull()
      expect(unsupportedError?.currentChainId).toBe(56)
      expect(unsupportedError?.suggestedChain.id).toBe(1)

      consoleSpy.mockRestore()
    })

    it('should auto-switch from unsupported network via WalletConnect', async () => {
      // Connect via WalletConnect on unsupported network (BSC)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseAccount.mockReturnValue({
        address: MOCK_WALLETCONNECT_ADDRESS,
        isConnected: true,
      } as any)
      mockUseChainId.mockReturnValue(56) // BSC

      const {result} = renderHook(() => useWallet())

      // Verify unsupported network state
      expect(result.current.isCurrentChainSupported).toBe(false)
      const unsupportedError = result.current.getUnsupportedNetworkError()
      expect(unsupportedError?.currentChainId).toBe(56)

      // Simulate successful auto-switch via WalletConnect
      mockSwitchChain.mockImplementationOnce(async ({chainId}: {chainId: number}) => {
        mockUseChainId.mockReturnValue(chainId)
        return Promise.resolve()
      })

      await act(async () => {
        const success = await result.current.handleUnsupportedNetwork(true)
        expect(success).toBe(true)
      })

      // Verify switch to Ethereum mainnet was attempted
      expect(mockSwitchChain).toHaveBeenCalledWith({chainId: 1})

      // Re-render with updated supported chain
      const {result: switchedResult} = renderHook(() => useWallet())
      mockUseChainId.mockReturnValue(1)

      expect(switchedResult.current.isCurrentChainSupported).toBe(true)
      expect(switchedResult.current.chainId).toBe(1)
    })
  })

  describe('WalletConnect Account Management', () => {
    it('should handle account switching in WalletConnect mobile wallet', () => {
      // Start with first account via WalletConnect
      const firstAccount = '0x8ba1f109551bD432803012645Hac136c54f4F4'
      const secondAccount = '0x742d35Cc6634C0532925a3b8D8d6b5eCa98fB337'

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseAccount.mockReturnValue({
        address: firstAccount as `0x${string}`,
        isConnected: true,
      } as any)

      const {result, rerender} = renderHook(() => useWallet())

      // Verify initial account
      expect(result.current.address).toBe(firstAccount)

      // Simulate account switch in WalletConnect mobile wallet
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseAccount.mockReturnValue({
        address: secondAccount as `0x${string}`,
        isConnected: true,
      } as any)

      rerender()

      // Verify updated account
      expect(result.current.address).toBe(secondAccount)
      expect(result.current.isConnected).toBe(true)
    })

    it('should handle disconnection from WalletConnect mobile wallet', () => {
      // Start connected via WalletConnect
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseAccount.mockReturnValue({
        address: MOCK_WALLETCONNECT_ADDRESS,
        isConnected: true,
      } as any)

      const {result, rerender} = renderHook(() => useWallet())

      // Verify initial connected state
      expect(result.current.isConnected).toBe(true)

      // Simulate external disconnection (user disconnects in WalletConnect mobile wallet)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseAccount.mockReturnValue({
        address: undefined,
        isConnected: false,
      } as any)

      rerender()

      // Verify disconnected state
      expect(result.current.isConnected).toBe(false)
      expect(result.current.address).toBeUndefined()
    })
  })
})
