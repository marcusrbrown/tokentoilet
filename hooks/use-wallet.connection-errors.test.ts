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

// Mock Reown AppKit
const mockOpen = vi.fn()
vi.mock('@reown/appkit/react', () => ({
  useAppKit: vi.fn(() => ({
    open: mockOpen,
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

describe('useWallet - Error Handling for Connection Failures', () => {
  const mockDisconnect = vi.fn()
  const mockSwitchChain = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    // Reset all mocks to default successful state
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    mockUseAccount.mockReturnValue({
      address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
      isConnected: true,
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

    mockUseChainId.mockReturnValue(1) // Default to Ethereum mainnet
    mockOpen.mockResolvedValue(undefined) // Default successful open
  })

  describe('Wallet Connection Failures', () => {
    it('should handle wallet modal open failures gracefully', async () => {
      // Mock the AppKit open to fail
      mockOpen.mockRejectedValue(new Error('User rejected connection'))

      const {result} = renderHook(() => useWallet())

      await expect(async () => {
        await act(async () => {
          await result.current.connect()
        })
      }).rejects.toThrow('Failed to connect wallet')

      expect(mockOpen).toHaveBeenCalled()
    })

    it('should handle connection timeout errors', async () => {
      // Mock timeout scenario
      mockOpen.mockRejectedValue(new Error('Connection timeout'))

      const {result} = renderHook(() => useWallet())

      await expect(async () => {
        await act(async () => {
          await result.current.connect()
        })
      }).rejects.toMatchObject({
        message: 'Failed to connect wallet',
        code: 'CONNECTION_TIMEOUT',
        userFriendlyMessage: 'Connection timed out. Please check your internet connection and try again.',
      })
    })

    it('should handle wallet extension not found errors', async () => {
      mockOpen.mockRejectedValue(new Error('No wallet extension found'))

      const {result} = renderHook(() => useWallet())

      await expect(async () => {
        await act(async () => {
          await result.current.connect()
        })
      }).rejects.toThrow('Failed to connect wallet')
    })

    it('should handle unsupported wallet errors', async () => {
      mockOpen.mockRejectedValue(new Error('Wallet not supported'))

      const {result} = renderHook(() => useWallet())

      await expect(async () => {
        await act(async () => {
          await result.current.connect()
        })
      }).rejects.toThrow('Failed to connect wallet')
    })

    it('should warn about unsupported network after successful connection', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      // Mock connection succeeding but landing on unsupported network
      mockOpen.mockResolvedValue(undefined)
      mockUseChainId.mockReturnValue(56) // BSC - unsupported

      const {result} = renderHook(() => useWallet())

      await act(async () => {
        await result.current.connect()
      })

      expect(consoleSpy).toHaveBeenCalledWith(
        'Connected to unsupported network:',
        expect.stringContaining('Switch to Ethereum Mainnet'),
      )

      consoleSpy.mockRestore()
    })
  })

  describe('Wallet Disconnection Failures', () => {
    it('should handle disconnect failures gracefully', async () => {
      mockDisconnect.mockImplementation(() => {
        throw new Error('Failed to disconnect')
      })

      const {result} = renderHook(() => useWallet())

      await expect(async () => {
        await act(async () => {
          await result.current.disconnect()
        })
      }).rejects.toMatchObject({
        message: 'Failed to disconnect wallet',
        code: 'NETWORK_VALIDATION_FAILED',
        userFriendlyMessage: 'Unable to disconnect wallet. Please try refreshing the page.',
      })
    })

    it('should handle wallet extension communication errors during disconnect', async () => {
      mockDisconnect.mockImplementation(() => {
        throw new Error('Wallet extension not responding')
      })

      const {result} = renderHook(() => useWallet())

      await expect(async () => {
        await act(async () => {
          await result.current.disconnect()
        })
      }).rejects.toThrow('Failed to disconnect wallet')
    })
  })

  describe('Network Switching Error Scenarios', () => {
    it('should handle user rejection of network switch', async () => {
      mockUseChainId.mockReturnValue(1)
      mockSwitchChain.mockImplementation(() => {
        throw new Error('User rejected the request')
      })

      const {result} = renderHook(() => useWallet())

      await expect(async () => {
        await act(async () => {
          await result.current.switchToChain(137)
        })
      }).rejects.toMatchObject({
        message: 'Failed to switch to Polygon',
        code: 'CONNECTION_REJECTED',
        chainId: 137,
        userFriendlyMessage: 'Network switch was rejected. Please accept the request to switch to Polygon.',
      })
    })

    it('should handle RPC endpoint failures during network switch', async () => {
      mockUseChainId.mockReturnValue(1)
      mockSwitchChain.mockImplementation(() => {
        throw new Error('RPC endpoint not responding')
      })

      const {result} = renderHook(() => useWallet())

      await expect(async () => {
        await act(async () => {
          await result.current.switchToChain(42161)
        })
      }).rejects.toMatchObject({
        message: 'Failed to switch to Arbitrum One',
        code: 'RPC_ENDPOINT_FAILED',
        chainId: 42161,
      })
    })

    it('should handle network configuration errors', async () => {
      mockUseChainId.mockReturnValue(1)
      mockSwitchChain.mockImplementation(() => {
        throw new Error('Network configuration invalid')
      })

      const {result} = renderHook(() => useWallet())

      await expect(async () => {
        await act(async () => {
          await result.current.switchToChain(137)
        })
      }).rejects.toThrow('Failed to switch to Polygon')
    })

    it('should handle wallet locked errors during network switch', async () => {
      mockUseChainId.mockReturnValue(1)
      mockSwitchChain.mockImplementation(() => {
        throw new Error('Wallet is locked')
      })

      const {result} = renderHook(() => useWallet())

      await expect(async () => {
        await act(async () => {
          await result.current.switchToChain(137)
        })
      }).rejects.toThrow('Failed to switch to Polygon')
    })
  })

  describe('Unsupported Network Handling Errors', () => {
    it('should handle auto-switch failures gracefully', async () => {
      // Start on unsupported network
      mockUseChainId.mockReturnValue(56) // BSC

      // Mock switchChain to fail
      mockSwitchChain.mockImplementation(() => {
        throw new Error('Auto-switch failed')
      })

      const {result} = renderHook(() => useWallet())

      await act(async () => {
        const success = await result.current.handleUnsupportedNetwork(true)
        expect(success).toBe(false) // Should return false on failure
      })

      expect(mockSwitchChain).toHaveBeenCalledWith({chainId: 1})
    })

    it('should handle switch failures when user manually requests network change', async () => {
      mockUseChainId.mockReturnValue(56) // BSC - unsupported
      mockSwitchChain.mockImplementation(() => {
        throw new Error('Manual switch failed')
      })

      const {result} = renderHook(() => useWallet())

      await act(async () => {
        const success = await result.current.handleUnsupportedNetwork(true)
        expect(success).toBe(false)
      })
    })
  })

  describe('Edge Case Error Scenarios', () => {
    it('should handle undefined chainId during network operations', () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseChainId.mockReturnValue(undefined as any)

      const {result} = renderHook(() => useWallet())

      expect(result.current.isCurrentChainSupported).toBe(false)
      expect(result.current.currentNetwork).toBe(null)
      expect(result.current.getUnsupportedNetworkError()).toBe(null)
    })

    it('should handle null chainId during network operations', () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseChainId.mockReturnValue(null as any)

      const {result} = renderHook(() => useWallet())

      expect(result.current.isCurrentChainSupported).toBe(false)
      expect(result.current.currentNetwork).toBe(null)
    })

    it('should handle invalid chainId types', () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseChainId.mockReturnValue('invalid' as any)

      const {result} = renderHook(() => useWallet())

      expect(result.current.isCurrentChainSupported).toBe(false)
      expect(result.current.currentNetwork).toBe(null)
    })

    it('should handle extremely large chainId values', () => {
      mockUseChainId.mockReturnValue(Number.MAX_SAFE_INTEGER)

      const {result} = renderHook(() => useWallet())

      expect(result.current.isCurrentChainSupported).toBe(false)
      const error = result.current.getUnsupportedNetworkError()
      expect(error?.isUnsupported).toBe(true)
      expect(error?.currentChainId).toBe(Number.MAX_SAFE_INTEGER)
    })

    it('should handle negative chainId values', () => {
      mockUseChainId.mockReturnValue(-1)

      const {result} = renderHook(() => useWallet())

      expect(result.current.isCurrentChainSupported).toBe(false)
      const error = result.current.getUnsupportedNetworkError()
      expect(error?.isUnsupported).toBe(true)
      expect(error?.currentChainId).toBe(-1)
    })
  })

  describe('Concurrent Operation Error Handling', () => {
    it('should handle multiple simultaneous connection attempts', async () => {
      let openCallCount = 0
      mockOpen.mockImplementation(async () => {
        openCallCount++
        if (openCallCount > 1) {
          throw new Error('Connection already in progress')
        }
        return Promise.resolve()
      })

      const {result} = renderHook(() => useWallet())

      // Start first connection
      const firstConnection = act(async () => {
        await result.current.connect()
      })

      // Start second connection immediately
      const secondConnection = expect(async () => {
        await act(async () => {
          await result.current.connect()
        })
      }).rejects.toThrow('Failed to connect wallet')

      await firstConnection
      await secondConnection
    })

    it('should handle rapid network switch requests', async () => {
      mockUseChainId.mockReturnValue(1)

      let switchCallCount = 0
      mockSwitchChain.mockImplementation(({chainId}: {chainId: number}) => {
        switchCallCount++
        if (switchCallCount > 1) {
          throw new Error('Switch operation already in progress')
        }
        mockUseChainId.mockReturnValue(chainId)
      })

      const {result} = renderHook(() => useWallet())

      // First switch should succeed
      await act(async () => {
        await result.current.switchToChain(137)
      })

      // Second rapid switch should fail gracefully
      await expect(async () => {
        await act(async () => {
          await result.current.switchToChain(42161)
        })
      }).rejects.toMatchObject({
        message: 'Failed to switch to Arbitrum One',
        code: 'NETWORK_SWITCH_FAILED',
      })
    })
  })

  describe('Recovery and Retry Error Scenarios', () => {
    it('should handle connection recovery after initial failure', async () => {
      let connectionAttempts = 0
      mockOpen.mockImplementation(async () => {
        connectionAttempts++
        if (connectionAttempts === 1) {
          throw new Error('First attempt failed')
        }
        return Promise.resolve()
      })

      const {result} = renderHook(() => useWallet())

      // First attempt should fail
      await expect(async () => {
        await act(async () => {
          await result.current.connect()
        })
      }).rejects.toThrow('Failed to connect wallet')

      // Second attempt should succeed
      await act(async () => {
        await result.current.connect()
      })

      expect(connectionAttempts).toBe(2)
    })

    it('should handle network switch recovery after initial failure', async () => {
      mockUseChainId.mockReturnValue(1)

      let switchAttempts = 0
      mockSwitchChain.mockImplementation(({chainId}: {chainId: number}) => {
        switchAttempts++
        if (switchAttempts === 1) {
          throw new Error('First switch attempt failed')
        }
        mockUseChainId.mockReturnValue(chainId)
      })

      const {result} = renderHook(() => useWallet())

      // First attempt should fail
      await expect(async () => {
        await act(async () => {
          await result.current.switchToChain(137)
        })
      }).rejects.toThrow('Failed to switch to Polygon')

      // Second attempt should succeed
      await act(async () => {
        await result.current.switchToChain(137)
      })

      expect(switchAttempts).toBe(2)
    })
  })
})
