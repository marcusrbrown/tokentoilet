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

// Mock Reown AppKit with MetaMask-specific behaviors
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

describe('useWallet - MetaMask Connection Flow (TASK-017)', () => {
  const mockDisconnect = vi.fn()
  const mockSwitchChain = vi.fn()

  // Mock MetaMask address for testing
  const MOCK_METAMASK_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' as const

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

  describe('MetaMask Connection Scenarios', () => {
    it('should handle initial MetaMask connection successfully', async () => {
      const {result} = renderHook(() => useWallet())

      // Verify initial disconnected state
      expect(result.current.isConnected).toBe(false)
      expect(result.current.address).toBeUndefined()

      // Simulate successful MetaMask connection
      mockAppKitOpen.mockResolvedValueOnce(undefined)

      await act(async () => {
        await result.current.connect()
      })

      // Verify AppKit modal was opened
      expect(mockAppKitOpen).toHaveBeenCalledTimes(1)

      // Simulate MetaMask connection success by updating account state
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseAccount.mockReturnValue({
        address: MOCK_METAMASK_ADDRESS,
        isConnected: true,
      } as any)

      // Re-render with updated state
      const {result: connectedResult} = renderHook(() => useWallet())

      expect(connectedResult.current.isConnected).toBe(true)
      expect(connectedResult.current.address).toBe(MOCK_METAMASK_ADDRESS)
      expect(connectedResult.current.isCurrentChainSupported).toBe(true)
    })

    it('should handle MetaMask connection failure gracefully', async () => {
      const {result} = renderHook(() => useWallet())

      // Simulate AppKit connection error (user rejection, etc.)
      const connectionError = new Error('User rejected the request')
      mockAppKitOpen.mockRejectedValueOnce(connectionError)

      // Capture console.error to verify error logging
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await act(async () => {
        await expect(result.current.connect()).rejects.toThrow('User rejected the request')
      })

      // Verify error was logged
      expect(consoleSpy).toHaveBeenCalledWith('Failed to connect wallet:', connectionError)

      // Verify state remains disconnected
      expect(result.current.isConnected).toBe(false)
      expect(result.current.address).toBeUndefined()

      consoleSpy.mockRestore()
    })

    it('should handle MetaMask connection on unsupported network', async () => {
      // Start on unsupported network (BSC)
      mockUseChainId.mockReturnValue(56)

      const {result} = renderHook(() => useWallet())

      // Simulate successful connection but on unsupported network
      mockAppKitOpen.mockResolvedValueOnce(undefined)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseAccount.mockReturnValue({
        address: MOCK_METAMASK_ADDRESS,
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
  })

  describe('MetaMask Disconnection Flow', () => {
    it('should handle MetaMask disconnection successfully', async () => {
      // Start in connected state
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseAccount.mockReturnValue({
        address: MOCK_METAMASK_ADDRESS,
        isConnected: true,
      } as any)

      const {result} = renderHook(() => useWallet())

      // Verify initial connected state
      expect(result.current.isConnected).toBe(true)
      expect(result.current.address).toBe(MOCK_METAMASK_ADDRESS)

      // Simulate successful disconnection
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

    it('should handle MetaMask disconnection failure gracefully', async () => {
      // Start in connected state
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseAccount.mockReturnValue({
        address: MOCK_METAMASK_ADDRESS,
        isConnected: true,
      } as any)

      const {result} = renderHook(() => useWallet())

      // Simulate disconnect error
      const disconnectError = new Error('Disconnect failed')
      mockDisconnect.mockImplementationOnce(() => {
        throw disconnectError
      })

      // Capture console.error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await act(async () => {
        await expect(result.current.disconnect()).rejects.toThrow('Failed to disconnect wallet')
      })

      // Verify error was logged
      expect(consoleSpy).toHaveBeenCalledWith('Failed to disconnect wallet:', disconnectError)

      consoleSpy.mockRestore()
    })
  })

  describe('MetaMask Network Switching', () => {
    beforeEach(() => {
      // Start in connected state with MetaMask
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseAccount.mockReturnValue({
        address: MOCK_METAMASK_ADDRESS,
        isConnected: true,
      } as any)
    })

    it('should switch from Ethereum to Polygon via MetaMask', async () => {
      // Start on Ethereum mainnet
      mockUseChainId.mockReturnValue(1)

      const {result} = renderHook(() => useWallet())

      // Verify initial state
      expect(result.current.chainId).toBe(1)
      expect(result.current.currentNetwork?.name).toBe('Ethereum Mainnet')

      // Simulate successful chain switch
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

    it('should switch from Polygon to Arbitrum via MetaMask', async () => {
      // Start on Polygon
      mockUseChainId.mockReturnValue(137)

      const {result} = renderHook(() => useWallet())

      // Verify initial state
      expect(result.current.chainId).toBe(137)
      expect(result.current.currentNetwork?.name).toBe('Polygon')

      // Simulate successful chain switch
      mockSwitchChain.mockImplementationOnce(async ({chainId}: {chainId: number}) => {
        mockUseChainId.mockReturnValue(chainId)
        return Promise.resolve()
      })

      await act(async () => {
        await result.current.switchToChain(42161) // Switch to Arbitrum
      })

      // Verify switch was attempted
      expect(mockSwitchChain).toHaveBeenCalledWith({chainId: 42161})

      // Re-render with updated chain
      const {result: switchedResult} = renderHook(() => useWallet())
      mockUseChainId.mockReturnValue(42161)

      expect(switchedResult.current.chainId).toBe(42161)
      expect(switchedResult.current.currentNetwork?.name).toBe('Arbitrum One')
      expect(switchedResult.current.isCurrentChainSupported).toBe(true)
    })

    it('should handle MetaMask network switch failure', async () => {
      // Start on Ethereum
      mockUseChainId.mockReturnValue(1)

      const {result} = renderHook(() => useWallet())

      // Simulate switch failure (user rejection, network not added, etc.)
      const switchError = new Error('User rejected the request')
      mockSwitchChain.mockImplementationOnce(() => {
        throw switchError
      })

      // Capture console.error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await act(async () => {
        await expect(result.current.switchToChain(137)).rejects.toThrow('User rejected the request')
      })

      // Verify error was logged
      expect(consoleSpy).toHaveBeenCalledWith('Failed to switch to chain 137:', switchError)

      // Verify chain remained unchanged
      expect(result.current.chainId).toBe(1)

      consoleSpy.mockRestore()
    })

    it('should reject switching to unsupported network', async () => {
      const {result} = renderHook(() => useWallet())

      await act(async () => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        await expect(result.current.switchToChain(56 as any)).rejects.toThrow(
          'Cannot switch to unsupported chain ID: 56',
        )
      })

      // Verify no switch was attempted
      expect(mockSwitchChain).not.toHaveBeenCalled()
    })
  })

  describe('MetaMask Connection Persistence', () => {
    it('should handle reconnection after page reload', () => {
      // Simulate app startup with existing MetaMask connection
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseAccount.mockReturnValue({
        address: MOCK_METAMASK_ADDRESS,
        isConnected: true,
      } as any)
      mockUseChainId.mockReturnValue(1)

      const {result} = renderHook(() => useWallet())

      // Verify connection state is restored
      expect(result.current.isConnected).toBe(true)
      expect(result.current.address).toBe(MOCK_METAMASK_ADDRESS)
      expect(result.current.chainId).toBe(1)
      expect(result.current.isCurrentChainSupported).toBe(true)
      expect(result.current.currentNetwork?.name).toBe('Ethereum Mainnet')
    })

    it('should handle wallet state changes (account switching)', () => {
      // Start with first account
      const firstAccount = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
      const secondAccount = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseAccount.mockReturnValue({
        address: firstAccount as `0x${string}`,
        isConnected: true,
      } as any)

      const {result, rerender} = renderHook(() => useWallet())

      // Verify initial account
      expect(result.current.address).toBe(firstAccount)

      // Simulate account switch in MetaMask
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

    it('should handle wallet disconnection externally (user disconnects in MetaMask)', () => {
      // Start connected
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseAccount.mockReturnValue({
        address: MOCK_METAMASK_ADDRESS,
        isConnected: true,
      } as any)

      const {result, rerender} = renderHook(() => useWallet())

      // Verify initial connected state
      expect(result.current.isConnected).toBe(true)

      // Simulate external disconnection (user disconnects in MetaMask)
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

  describe('MetaMask Error Scenarios', () => {
    it('should handle MetaMask not installed scenario', async () => {
      const {result} = renderHook(() => useWallet())

      // Simulate MetaMask not installed error
      const notInstalledError = new Error('No MetaMask wallet found')
      mockAppKitOpen.mockRejectedValueOnce(notInstalledError)

      // Capture console.error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await act(async () => {
        await expect(result.current.connect()).rejects.toThrow('No MetaMask wallet found')
      })

      expect(consoleSpy).toHaveBeenCalledWith('Failed to connect wallet:', notInstalledError)
      expect(result.current.isConnected).toBe(false)

      consoleSpy.mockRestore()
    })

    it('should handle MetaMask locked scenario', async () => {
      const {result} = renderHook(() => useWallet())

      // Simulate MetaMask locked error
      const lockedError = new Error('MetaMask is locked')
      mockAppKitOpen.mockRejectedValueOnce(lockedError)

      // Capture console.error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await act(async () => {
        await expect(result.current.connect()).rejects.toThrow('MetaMask is locked')
      })

      expect(consoleSpy).toHaveBeenCalledWith('Failed to connect wallet:', lockedError)
      expect(result.current.isConnected).toBe(false)

      consoleSpy.mockRestore()
    })

    it('should handle MetaMask network request timeout', async () => {
      // Start connected on Ethereum
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseAccount.mockReturnValue({
        address: MOCK_METAMASK_ADDRESS,
        isConnected: true,
      } as any)
      mockUseChainId.mockReturnValue(1)

      const {result} = renderHook(() => useWallet())

      // Simulate network switch timeout
      const timeoutError = new Error('Request timed out')
      mockSwitchChain.mockImplementationOnce(() => {
        throw timeoutError
      })

      // Capture console.error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await act(async () => {
        await expect(result.current.switchToChain(137)).rejects.toThrow('Request timed out')
      })

      expect(consoleSpy).toHaveBeenCalledWith('Failed to switch to chain 137:', timeoutError)

      consoleSpy.mockRestore()
    })
  })

  describe('MetaMask Integration with Unsupported Network Handling', () => {
    it('should auto-switch from unsupported network when requested', async () => {
      // Connect on unsupported network (BSC)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseAccount.mockReturnValue({
        address: MOCK_METAMASK_ADDRESS,
        isConnected: true,
      } as any)
      mockUseChainId.mockReturnValue(56) // BSC

      const {result} = renderHook(() => useWallet())

      // Verify unsupported network state
      expect(result.current.isCurrentChainSupported).toBe(false)
      const unsupportedError = result.current.getUnsupportedNetworkError()
      expect(unsupportedError?.currentChainId).toBe(56)

      // Simulate successful auto-switch
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

    it('should handle auto-switch failure from unsupported network', async () => {
      // Connect on unsupported network
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseAccount.mockReturnValue({
        address: MOCK_METAMASK_ADDRESS,
        isConnected: true,
      } as any)
      mockUseChainId.mockReturnValue(56)

      const {result} = renderHook(() => useWallet())

      // Simulate switch failure
      mockSwitchChain.mockImplementationOnce(() => {
        throw new Error('User rejected switch')
      })

      // Capture console.error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await act(async () => {
        const success = await result.current.handleUnsupportedNetwork(true)
        expect(success).toBe(false)
      })

      expect(consoleSpy).toHaveBeenCalledWith('Failed to handle unsupported network:', expect.any(Error))

      // Verify still on unsupported network
      expect(result.current.isCurrentChainSupported).toBe(false)

      consoleSpy.mockRestore()
    })
  })
})
