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

    // Default chainId to Ethereum mainnet
    mockUseChainId.mockReturnValue(1)

    // Default switchChain behavior - succeed by default
    mockSwitchChain.mockImplementation(async ({chainId}: {chainId: number}) => {
      // Simulate successful chain switch by updating the mock chain ID
      mockUseChainId.mockReturnValue(chainId)
      return Promise.resolve()
    })
  })

  describe('Network Support Validation', () => {
    it('should identify Ethereum mainnet (1) as supported', () => {
      mockUseChainId.mockReturnValue(1)

      const {result} = renderHook(() => useWallet())

      expect(result.current.isCurrentChainSupported).toBe(true)
      expect(result.current.isSupportedChain(1)).toBe(true)
      expect(result.current.currentNetwork).toEqual({
        name: 'Ethereum Mainnet',
        symbol: 'ETH',
      })
    })

    it('should identify Polygon (137) as supported', () => {
      mockUseChainId.mockReturnValue(137)

      const {result} = renderHook(() => useWallet())

      expect(result.current.isCurrentChainSupported).toBe(true)
      expect(result.current.isSupportedChain(137)).toBe(true)
      expect(result.current.currentNetwork).toEqual({
        name: 'Polygon',
        symbol: 'MATIC',
      })
    })

    it('should identify Arbitrum One (42161) as supported', () => {
      mockUseChainId.mockReturnValue(42161)

      const {result} = renderHook(() => useWallet())

      expect(result.current.isCurrentChainSupported).toBe(true)
      expect(result.current.isSupportedChain(42161)).toBe(true)
      expect(result.current.currentNetwork).toEqual({
        name: 'Arbitrum One',
        symbol: 'ETH',
      })
    })

    it('should identify unsupported networks correctly', () => {
      mockUseChainId.mockReturnValue(56) // BSC

      const {result} = renderHook(() => useWallet())

      expect(result.current.isCurrentChainSupported).toBe(false)
      expect(result.current.isSupportedChain(56)).toBe(false)
      expect(result.current.currentNetwork).toBe(null)
    })

    it('should return list of supported chains', () => {
      mockUseChainId.mockReturnValue(1)

      const {result} = renderHook(() => useWallet())

      const supportedChains = result.current.getSupportedChains()
      expect(supportedChains).toHaveLength(3)
      expect(supportedChains).toEqual([
        {id: 1, name: 'Ethereum Mainnet', symbol: 'ETH'},
        {id: 137, name: 'Polygon', symbol: 'MATIC'},
        {id: 42161, name: 'Arbitrum One', symbol: 'ETH'},
      ])
    })
  })

  describe('Network Switching', () => {
    it('should switch to Ethereum mainnet successfully', async () => {
      mockUseChainId.mockReturnValue(137) // Start on Polygon

      const {result} = renderHook(() => useWallet())

      await act(async () => {
        await result.current.switchToChain(1)
      })

      expect(mockSwitchChain).toHaveBeenCalledWith({chainId: 1})
    })

    it('should switch to Polygon successfully', async () => {
      mockUseChainId.mockReturnValue(1) // Start on Ethereum

      const {result} = renderHook(() => useWallet())

      await act(async () => {
        await result.current.switchToChain(137)
      })

      expect(mockSwitchChain).toHaveBeenCalledWith({chainId: 137})
    })

    it('should switch to Arbitrum One successfully', async () => {
      mockUseChainId.mockReturnValue(1) // Start on Ethereum

      const {result} = renderHook(() => useWallet())

      await act(async () => {
        await result.current.switchToChain(42161)
      })

      expect(mockSwitchChain).toHaveBeenCalledWith({chainId: 42161})
    })

    it('should reject switching to unsupported chain', async () => {
      mockUseChainId.mockReturnValue(1)

      const {result} = renderHook(() => useWallet())

      await expect(async () => {
        await act(async () => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          await result.current.switchToChain(56 as any) // BSC - unsupported
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
          await result.current.switchToChain(137)
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
        id: 1,
        name: 'Ethereum Mainnet',
      })
      expect(error?.error.code).toBe('UNSUPPORTED_NETWORK')
      expect(error?.error.userFriendlyMessage).toContain('Switch to Ethereum Mainnet')
    })

    it('should return null for supported networks', () => {
      mockUseChainId.mockReturnValue(1) // Ethereum - supported

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

      // Verify that switchToChain was called with Ethereum mainnet (default fallback)
      expect(mockSwitchChain).toHaveBeenCalledWith({chainId: 1})

      expect(mockSwitchChain).toHaveBeenCalledWith({chainId: 1}) // Should switch to Ethereum
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
      mockUseChainId.mockReturnValue(137) // Polygon

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
      expect(validationError?.suggestedChainId).toBe(1)
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
        switchChain: mockSwitchChain,
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
        switchChain: mockSwitchChain,
        isPending: false,
        error: mockError,
      } as any)

      const {result} = renderHook(() => useWallet())

      expect(result.current.switchChainError).toBe(mockError)
    })
  })

  describe('All Network Combinations Testing', () => {
    const testCases = [
      {from: 1, to: 137, fromName: 'Ethereum', toName: 'Polygon'},
      {from: 1, to: 42161, fromName: 'Ethereum', toName: 'Arbitrum'},
      {from: 137, to: 1, fromName: 'Polygon', toName: 'Ethereum'},
      {from: 137, to: 42161, fromName: 'Polygon', toName: 'Arbitrum'},
      {from: 42161, to: 1, fromName: 'Arbitrum', toName: 'Ethereum'},
      {from: 42161, to: 137, fromName: 'Arbitrum', toName: 'Polygon'},
    ]

    testCases.forEach(({from, to, fromName, toName}) => {
      it(`should switch from ${fromName} (${from}) to ${toName} (${to})`, async () => {
        mockUseChainId.mockReturnValue(from)

        const {result} = renderHook(() => useWallet())

        // Verify starting state
        expect(result.current.isCurrentChainSupported).toBe(true)
        expect(result.current.chainId).toBe(from)

        // Perform switch
        await act(async () => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          await result.current.switchToChain(to as any)
        })

        expect(mockSwitchChain).toHaveBeenCalledWith({chainId: to})
      })
    })
  })
})
