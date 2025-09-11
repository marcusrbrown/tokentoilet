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

describe('useWallet - Enhanced Error Classification', () => {
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

  describe('Connection Error Classification', () => {
    it('should classify timeout errors correctly', async () => {
      mockOpen.mockRejectedValue(new Error('Connection timeout'))

      const {result} = renderHook(() => useWallet())

      await expect(async () => {
        await act(async () => {
          await result.current.connect()
        })
      }).rejects.toMatchObject({
        code: 'CONNECTION_TIMEOUT',
        userFriendlyMessage: 'Connection timed out. Please check your internet connection and try again.',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        originalError: expect.objectContaining({message: 'Connection timeout'}),
      })
    })

    it('should classify user rejection errors correctly', async () => {
      mockOpen.mockRejectedValue(new Error('User rejected the request'))

      const {result} = renderHook(() => useWallet())

      await expect(async () => {
        await act(async () => {
          await result.current.connect()
        })
      }).rejects.toMatchObject({
        code: 'CONNECTION_REJECTED',
        userFriendlyMessage: 'Connection was rejected. Please accept the wallet connection request to continue.',
      })
    })

    it('should classify wallet not found errors correctly', async () => {
      mockOpen.mockRejectedValue(new Error('No wallet extension found'))

      const {result} = renderHook(() => useWallet())

      await expect(async () => {
        await act(async () => {
          await result.current.connect()
        })
      }).rejects.toMatchObject({
        code: 'WALLET_NOT_FOUND',
        userFriendlyMessage: 'No wallet extension found. Please install a supported wallet like MetaMask.',
      })
    })

    it('should classify wallet locked errors correctly', async () => {
      mockOpen.mockRejectedValue(new Error('Wallet is locked'))

      const {result} = renderHook(() => useWallet())

      await expect(async () => {
        await act(async () => {
          await result.current.connect()
        })
      }).rejects.toMatchObject({
        code: 'WALLET_LOCKED',
        userFriendlyMessage: 'Wallet is locked. Please unlock your wallet and try again.',
      })
    })

    it('should classify RPC endpoint errors correctly', async () => {
      mockOpen.mockRejectedValue(new Error('RPC endpoint not responding'))

      const {result} = renderHook(() => useWallet())

      await expect(async () => {
        await act(async () => {
          await result.current.connect()
        })
      }).rejects.toMatchObject({
        code: 'RPC_ENDPOINT_FAILED',
        userFriendlyMessage: 'Network connection failed. Please check your internet connection and try again.',
      })
    })

    it('should classify permission errors correctly', async () => {
      mockOpen.mockRejectedValue(new Error('Unauthorized access'))

      const {result} = renderHook(() => useWallet())

      await expect(async () => {
        await act(async () => {
          await result.current.connect()
        })
      }).rejects.toMatchObject({
        code: 'INSUFFICIENT_PERMISSIONS',
        userFriendlyMessage: 'Insufficient permissions. Please check your wallet settings and try again.',
      })
    })

    it('should use generic error for unclassified errors', async () => {
      mockOpen.mockRejectedValue(new Error('Unknown error occurred'))

      const {result} = renderHook(() => useWallet())

      await expect(async () => {
        await act(async () => {
          await result.current.connect()
        })
      }).rejects.toMatchObject({
        code: 'NETWORK_VALIDATION_FAILED',
        userFriendlyMessage: 'Unable to connect wallet. Please try again or check your wallet extension.',
      })
    })
  })

  describe('Network Switch Error Classification', () => {
    it('should classify switch rejection errors correctly', async () => {
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
        code: 'CONNECTION_REJECTED',
        userFriendlyMessage: 'Network switch was rejected. Please accept the request to switch to Polygon.',
        chainId: 137,
      })
    })

    it('should classify RPC endpoint failures during switch correctly', async () => {
      mockUseChainId.mockReturnValue(1)
      mockSwitchChain.mockImplementation(() => {
        throw new Error('RPC endpoint failed')
      })

      const {result} = renderHook(() => useWallet())

      await expect(async () => {
        await act(async () => {
          await result.current.switchToChain(42161)
        })
      }).rejects.toMatchObject({
        code: 'RPC_ENDPOINT_FAILED',
        userFriendlyMessage: 'RPC endpoint failed for Arbitrum One. Please try again later.',
        chainId: 42161,
      })
    })

    it('should classify timeout errors during switch correctly', async () => {
      mockUseChainId.mockReturnValue(1)
      mockSwitchChain.mockImplementation(() => {
        throw new Error('Request timeout')
      })

      const {result} = renderHook(() => useWallet())

      await expect(async () => {
        await act(async () => {
          await result.current.switchToChain(137)
        })
      }).rejects.toMatchObject({
        code: 'CONNECTION_TIMEOUT',
        userFriendlyMessage: 'Request timed out while switching to Polygon. Please try again.',
        chainId: 137,
      })
    })

    it('should classify wallet locked errors during switch correctly', async () => {
      mockUseChainId.mockReturnValue(1)
      mockSwitchChain.mockImplementation(() => {
        throw new Error('Wallet locked')
      })

      const {result} = renderHook(() => useWallet())

      await expect(async () => {
        await act(async () => {
          await result.current.switchToChain(42161)
        })
      }).rejects.toMatchObject({
        code: 'WALLET_LOCKED',
        userFriendlyMessage: 'Wallet is locked. Please unlock your wallet and try switching to Arbitrum One again.',
        chainId: 42161,
      })
    })

    it('should use generic switch error for unclassified errors', async () => {
      mockUseChainId.mockReturnValue(1)
      mockSwitchChain.mockImplementation(() => {
        throw new Error('Unknown switch error')
      })

      const {result} = renderHook(() => useWallet())

      await expect(async () => {
        await act(async () => {
          await result.current.switchToChain(137)
        })
      }).rejects.toMatchObject({
        code: 'NETWORK_SWITCH_FAILED',
        userFriendlyMessage: 'Unable to switch to Polygon. Please try again or switch manually in your wallet.',
        chainId: 137,
      })
    })
  })

  describe('Error Metadata Preservation', () => {
    it('should preserve original error in connection failures', async () => {
      const originalError = new Error('Original connection error')
      mockOpen.mockRejectedValue(originalError)

      const {result} = renderHook(() => useWallet())

      await expect(async () => {
        await act(async () => {
          await result.current.connect()
        })
      }).rejects.toMatchObject({
        originalError,
      })
    })

    it('should preserve original error in switch failures', async () => {
      mockUseChainId.mockReturnValue(1)
      const originalError = new Error('Original switch error')
      mockSwitchChain.mockImplementation(() => {
        throw originalError
      })

      const {result} = renderHook(() => useWallet())

      await expect(async () => {
        await act(async () => {
          await result.current.switchToChain(137)
        })
      }).rejects.toMatchObject({
        originalError,
        chainId: 137,
      })
    })
  })

  describe('Error Message Case Insensitivity', () => {
    it('should classify errors regardless of case', async () => {
      mockOpen.mockRejectedValue(new Error('CONNECTION TIMEOUT'))

      const {result} = renderHook(() => useWallet())

      await expect(async () => {
        await act(async () => {
          await result.current.connect()
        })
      }).rejects.toMatchObject({
        code: 'CONNECTION_TIMEOUT',
      })
    })

    it('should classify mixed case errors correctly', async () => {
      mockOpen.mockRejectedValue(new Error('User Rejected The Request'))

      const {result} = renderHook(() => useWallet())

      await expect(async () => {
        await act(async () => {
          await result.current.connect()
        })
      }).rejects.toMatchObject({
        code: 'CONNECTION_REJECTED',
      })
    })
  })

  describe('Multiple Error Keyword Handling', () => {
    it('should handle errors with multiple keywords by priority', async () => {
      // Should classify as timeout since timeout appears first in our if-else chain
      mockOpen.mockRejectedValue(new Error('User rejected connection due to timeout'))

      const {result} = renderHook(() => useWallet())

      await expect(async () => {
        await act(async () => {
          await result.current.connect()
        })
      }).rejects.toMatchObject({
        code: 'CONNECTION_TIMEOUT',
      })
    })

    it('should handle network errors with RPC mentions', async () => {
      mockOpen.mockRejectedValue(new Error('Network RPC endpoint failed'))

      const {result} = renderHook(() => useWallet())

      await expect(async () => {
        await act(async () => {
          await result.current.connect()
        })
      }).rejects.toMatchObject({
        code: 'RPC_ENDPOINT_FAILED',
      })
    })
  })
})
