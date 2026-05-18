import {act, renderHook} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi, type MockedFunction} from 'vitest'
import {useAccount, useChainId, useDisconnect, useSwitchChain} from 'wagmi'

import {useWallet} from '@/hooks/use-wallet'

// Mock wagmi hooks
vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
  useChainId: vi.fn(),
  useDisconnect: vi.fn(),
  useSwitchChain: vi.fn(),
}))

// Mock Reown AppKit
vi.mock('@reown/appkit/react', () => ({
  useAppKit: vi.fn(() => ({
    open: vi.fn(),
  })),
}))

// Mock network imports
vi.mock('@reown/appkit/networks', () => ({
  mainnet: {id: 1},
  polygon: {id: 137},
  arbitrum: {id: 42161},
  sepolia: {id: 11155111},
}))

const mockUseAccount = useAccount as MockedFunction<typeof useAccount>
const mockUseChainId = useChainId as MockedFunction<typeof useChainId>
const mockUseDisconnect = useDisconnect as MockedFunction<typeof useDisconnect>
const mockUseSwitchChain = useSwitchChain as MockedFunction<typeof useSwitchChain>

describe('useWallet - Network Switching', () => {
  const mockDisconnect = vi.fn()
  const mockSwitchChain = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    // Use type assertion to avoid complex interface matching
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    mockUseAccount.mockReturnValue({
      address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
      isConnected: true,
      isConnecting: false,
      isReconnecting: false,
    } as any)

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    mockUseDisconnect.mockReturnValue({
      disconnect: mockDisconnect,
    } as any)

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    mockUseSwitchChain.mockReturnValue({
      switchChain: undefined,
      switchChainAsync: mockSwitchChain,
      isPending: false,
      error: null,
    } as any)

    // Default chainId to Sepolia
    mockUseChainId.mockReturnValue(11155111)

    // Default switchChain behavior - succeed by default
    mockSwitchChain.mockImplementation(async ({chainId}: {chainId: number}) => {
      // Simulate successful chain switch by updating the mock chain ID
      mockUseChainId.mockReturnValue(chainId)
      return Promise.resolve()
    })
  })

  describe('Network Support Validation', () => {
    it('should identify Sepolia (11155111) as the only supported chain for v1.0', () => {
      // Given a wallet connected to Sepolia
      mockUseChainId.mockReturnValue(11155111)

      // When the wallet hook evaluates network support
      const {result} = renderHook(() => useWallet())

      // Then Sepolia is supported and exposed as the current network
      expect(result.current.isCurrentChainSupported).toBe(true)
      expect(result.current.isSupportedChain(11155111)).toBe(true)
      expect(result.current.currentNetwork).toEqual({
        name: 'Sepolia',
        symbol: 'ETH',
      })
    })

    it('should reject Ethereum mainnet (1) for v1.0', () => {
      // Given a wallet connected to Ethereum mainnet
      mockUseChainId.mockReturnValue(1)

      // When the wallet hook evaluates network support
      const {result} = renderHook(() => useWallet())

      // Then mainnet is treated as unsupported for v1.0
      expect(result.current.isCurrentChainSupported).toBe(false)
      expect(result.current.isSupportedChain(1)).toBe(false)
      expect(result.current.currentNetwork).toBe(null)
    })

    it('should identify unsupported networks correctly', () => {
      mockUseChainId.mockReturnValue(56) // BSC

      const {result} = renderHook(() => useWallet())

      expect(result.current.isCurrentChainSupported).toBe(false)
      expect(result.current.isSupportedChain(56)).toBe(false)
      expect(result.current.currentNetwork).toBe(null)
    })

    it('should return Sepolia as the only supported chain', () => {
      // Given a wallet connected to Sepolia
      mockUseChainId.mockReturnValue(11155111)

      // When the wallet hook returns supported chains
      const {result} = renderHook(() => useWallet())

      // Then only Sepolia is available for network selection
      const supportedChains = result.current.getSupportedChains()
      expect(supportedChains).toHaveLength(1)
      expect(supportedChains).toEqual([{id: 11155111, name: 'Sepolia', symbol: 'ETH'}])
    })
  })

  describe('Network Switching', () => {
    it('should switch to Sepolia successfully', async () => {
      mockUseChainId.mockReturnValue(56) // Start on unsupported network

      const {result} = renderHook(() => useWallet())

      await act(async () => {
        await result.current.switchToChain(11155111)
      })

      expect(mockSwitchChain).toHaveBeenCalledWith({chainId: 11155111})
    })

    it('should use the async chain switching API', async () => {
      // Given wagmi only exposes the async switch API implementation
      mockUseChainId.mockReturnValue(56)

      // When the wallet hook switches to Sepolia
      const {result} = renderHook(() => useWallet())

      await act(async () => {
        await result.current.switchToChain(11155111)
      })

      // Then the async switch API is invoked successfully
      expect(mockSwitchChain).toHaveBeenCalledWith({chainId: 11155111})
    })

    it('should reject switching to unsupported chain', async () => {
      mockUseChainId.mockReturnValue(1)

      const {result} = renderHook(() => useWallet())

      await expect(async () => {
        await act(async () => {
          await result.current.switchToChain(56) // BSC - unsupported
        })
      }).rejects.toThrow('Cannot switch to unsupported chain ID: 56')
    })

    it('should handle switch chain errors gracefully', async () => {
      mockUseChainId.mockReturnValue(1)

      // Override the default successful mock for this test only
      mockSwitchChain.mockImplementation(() => {
        throw new Error('User rejected the request')
      })

      const {result} = renderHook(() => useWallet())

      await expect(async () => {
        await act(async () => {
          await result.current.switchToChain(11155111)
        })
      }).rejects.toThrow('User rejected the request')
    })
  })

  describe('Unsupported Network Detection', () => {
    it('should detect unsupported network and provide error details', () => {
      mockUseChainId.mockReturnValue(56) // BSC - unsupported

      const {result} = renderHook(() => useWallet())

      const error = result.current.getUnsupportedNetworkError()
      expect(error).not.toBe(null)
      expect(error?.isUnsupported).toBe(true)
      expect(error?.currentChainId).toBe(56)
      expect(error?.suggestedChain).toEqual({
        id: 11155111,
        name: 'Sepolia',
      })
      expect(error?.error.code).toBe('UNSUPPORTED_NETWORK')
      expect(error?.error.userFriendlyMessage).toContain('Switch to Sepolia')
    })

    it('should return null for supported networks', () => {
      mockUseChainId.mockReturnValue(11155111) // Sepolia - supported

      const {result} = renderHook(() => useWallet())

      const error = result.current.getUnsupportedNetworkError()
      expect(error).toBe(null)
    })

    it('should handle unsupported network automatically when requested', async () => {
      // Start on unsupported network (BSC)
      mockUseChainId.mockReturnValue(56)

      const {result} = renderHook(() => useWallet())

      // Ensure our switchChain mock will succeed and update the chain ID
      mockSwitchChain.mockImplementation(async ({chainId}: {chainId: number}) => {
        mockUseChainId.mockReturnValue(chainId)
        return Promise.resolve()
      })

      await act(async () => {
        const success = await result.current.handleUnsupportedNetwork(true)
        expect(success).toBe(true)
      })

      // Verify that switchToChain was called with Sepolia (v1 supported network)
      expect(mockSwitchChain).toHaveBeenCalledWith({chainId: 11155111})
    })

    it('should not auto-switch when autoSwitch is false', async () => {
      mockUseChainId.mockReturnValue(56) // BSC - unsupported

      const {result} = renderHook(() => useWallet())

      await act(async () => {
        const success = await result.current.handleUnsupportedNetwork(false)
        expect(success).toBe(false)
      })

      expect(mockSwitchChain).not.toHaveBeenCalled()
    })
  })

  describe('Network Validation', () => {
    it('should validate current network successfully on supported chain', () => {
      mockUseChainId.mockReturnValue(11155111) // Sepolia

      const {result} = renderHook(() => useWallet())

      const validationError = result.current.validateCurrentNetwork()
      expect(validationError).toBe(null)
    })

    it('should return validation error for unsupported network', () => {
      mockUseChainId.mockReturnValue(56) // BSC

      const {result} = renderHook(() => useWallet())

      const validationError = result.current.validateCurrentNetwork()
      expect(validationError).not.toBe(null)
      expect(validationError?.code).toBe('UNSUPPORTED_NETWORK')
      expect(validationError?.chainId).toBe(56)
      expect(validationError?.suggestedChainId).toBe(11155111)
    })

    it('should return validation error when no chain ID is available', () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseChainId.mockReturnValue(undefined as any)

      const {result} = renderHook(() => useWallet())

      const validationError = result.current.validateCurrentNetwork()
      expect(validationError).not.toBe(null)
      expect(validationError?.code).toBe('NETWORK_VALIDATION_FAILED')
      expect(validationError?.userFriendlyMessage).toContain('Unable to detect network')
    })
  })

  describe('Connection and Switching States', () => {
    it('should expose switching chain state', () => {
      mockUseChainId.mockReturnValue(1)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseSwitchChain.mockReturnValue({
        switchChain: undefined,
        switchChainAsync: mockSwitchChain,
        isPending: true,
        error: null,
      } as any)

      const {result} = renderHook(() => useWallet())

      expect(result.current.isSwitchingChain).toBe(true)
    })

    it('should expose switch chain errors', () => {
      mockUseChainId.mockReturnValue(1)
      const mockError = new Error('Switch failed')
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseSwitchChain.mockReturnValue({
        switchChain: undefined,
        switchChainAsync: mockSwitchChain,
        isPending: false,
        error: mockError,
      } as any)

      const {result} = renderHook(() => useWallet())

      expect(result.current.switchChainError).toBe(mockError)
    })
  })

  describe('All Network Combinations Testing', () => {
    it('should report only Sepolia as supported across combinations', async () => {
      mockUseChainId.mockReturnValue(11155111)

      const {result} = renderHook(() => useWallet())

      expect(result.current.isCurrentChainSupported).toBe(true)
      expect(result.current.chainId).toBe(11155111)

      await expect(async () => {
        await act(async () => {
          await result.current.switchToChain(137)
        })
      }).rejects.toThrow('Cannot switch to unsupported chain ID: 137')
    })
  })

  describe('Connection States (RFC-002)', () => {
    it('should expose isConnecting state from useAccount', () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseAccount.mockReturnValue({
        address: undefined,
        isConnected: false,
        isConnecting: true,
        isReconnecting: false,
      } as any)

      const {result} = renderHook(() => useWallet())

      expect(result.current.isConnecting).toBe(true)
      expect(result.current.isReconnecting).toBe(false)
    })

    it('should expose isReconnecting state from useAccount', () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseAccount.mockReturnValue({
        address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
        isConnected: false,
        isConnecting: false,
        isReconnecting: true,
      } as any)

      const {result} = renderHook(() => useWallet())

      expect(result.current.isConnecting).toBe(false)
      expect(result.current.isReconnecting).toBe(true)
    })

    it('should show both false when fully connected', () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockUseAccount.mockReturnValue({
        address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
        isConnected: true,
        isConnecting: false,
        isReconnecting: false,
      } as any)

      const {result} = renderHook(() => useWallet())

      expect(result.current.isConnected).toBe(true)
      expect(result.current.isConnecting).toBe(false)
      expect(result.current.isReconnecting).toBe(false)
    })
  })

  describe('Error State Management (RFC-002)', () => {
    it('should initialize with null error state', () => {
      const {result} = renderHook(() => useWallet())

      expect(result.current.error).toBe(null)
    })

    it('should have clearError function', () => {
      const {result} = renderHook(() => useWallet())

      expect(typeof result.current.clearError).toBe('function')
    })

    it('should clear error when clearError is called', async () => {
      const {result} = renderHook(() => useWallet())

      await act(async () => {
        result.current.clearError()
      })

      expect(result.current.error).toBe(null)
    })
  })
})
