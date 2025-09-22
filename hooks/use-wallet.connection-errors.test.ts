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
      }).rejects.toThrow('User rejected connection')

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
        code: 'WALLETCONNECT_QR_CODE_EXPIRED',
        userFriendlyMessage: 'WalletConnect QR code has expired.',
      })
    })

    it('should handle wallet extension not found errors', async () => {
      mockOpen.mockRejectedValue(new Error('No wallet extension found'))

      const {result} = renderHook(() => useWallet())

      await expect(async () => {
        await act(async () => {
          await result.current.connect()
        })
      }).rejects.toThrow('No wallet extension found')
    })

    it('should handle unsupported wallet errors', async () => {
      mockOpen.mockRejectedValue(new Error('Wallet not supported'))

      const {result} = renderHook(() => useWallet())

      await expect(async () => {
        await act(async () => {
          await result.current.connect()
        })
      }).rejects.toThrow('Wallet not supported')
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
      const disconnectError = new Error('Failed to disconnect')
      mockDisconnect.mockImplementation(() => {
        throw disconnectError
      })

      const {result} = renderHook(() => useWallet())
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await act(async () => {
        // Disconnect should not throw - uses graceful error handling
        await result.current.disconnect()
      })

      // Verify error was logged gracefully
      expect(consoleSpy).toHaveBeenCalledWith('Failed to disconnect wallet:', disconnectError)
      consoleSpy.mockRestore()
    })

    it('should handle wallet extension communication errors during disconnect', async () => {
      const extensionError = new Error('Wallet extension not responding')
      mockDisconnect.mockImplementation(() => {
        throw extensionError
      })

      const {result} = renderHook(() => useWallet())
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await act(async () => {
        // Disconnect should not throw - uses graceful error handling
        await result.current.disconnect()
      })

      // Verify error was logged gracefully
      expect(consoleSpy).toHaveBeenCalledWith('Failed to disconnect wallet:', extensionError)
      consoleSpy.mockRestore()
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
        code: 'METAMASK_LOCKED',
        chainId: 137,
        userFriendlyMessage: 'MetaMask wallet is locked or access was denied.',
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
        code: 'METAMASK_EXTENSION_ERROR',
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
      }).rejects.toThrow('Network configuration invalid')
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
      }).rejects.toThrow('Wallet is locked')
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
      }).rejects.toThrow('Connection already in progress')

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
        code: 'METAMASK_EXTENSION_ERROR',
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
      }).rejects.toThrow('First attempt failed')

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
      }).rejects.toThrow('First switch attempt failed')

      // Second attempt should succeed
      await act(async () => {
        await result.current.switchToChain(137)
      })

      expect(switchAttempts).toBe(2)
    })
  })
})
