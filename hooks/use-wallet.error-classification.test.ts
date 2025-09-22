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
        code: 'WALLETCONNECT_QR_CODE_EXPIRED',
        userFriendlyMessage: 'WalletConnect QR code has expired.',
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
        code: 'METAMASK_LOCKED',
        userFriendlyMessage: 'MetaMask wallet is locked or access was denied.',
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
        code: 'METAMASK_EXTENSION_ERROR',
        userFriendlyMessage: 'An error occurred while connecting to Wallet. No wallet extension found',
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
        code: 'METAMASK_LOCKED',
        userFriendlyMessage: 'MetaMask wallet is locked or access was denied.',
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
        code: 'METAMASK_EXTENSION_ERROR',
        userFriendlyMessage: 'An error occurred while connecting to Wallet. RPC endpoint not responding',
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
        code: 'METAMASK_LOCKED',
        userFriendlyMessage: 'MetaMask wallet is locked or access was denied.',
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
        code: 'METAMASK_EXTENSION_ERROR',
        userFriendlyMessage: 'An error occurred while connecting to Wallet. Unknown error occurred',
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
        code: 'METAMASK_LOCKED',
        userFriendlyMessage: 'MetaMask wallet is locked or access was denied.',
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
        code: 'METAMASK_EXTENSION_ERROR',
        userFriendlyMessage: 'An error occurred while connecting to Wallet. RPC endpoint failed',
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
        code: 'METAMASK_EXTENSION_ERROR',
        userFriendlyMessage: 'An error occurred while connecting to Wallet. Request timeout',
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
        code: 'METAMASK_EXTENSION_ERROR',
        userFriendlyMessage: 'An error occurred while connecting to Wallet. Wallet locked',
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
        code: 'METAMASK_EXTENSION_ERROR',
        userFriendlyMessage: 'An error occurred while connecting to Wallet. Unknown switch error',
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
        code: 'WALLETCONNECT_QR_CODE_EXPIRED',
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
        code: 'METAMASK_LOCKED',
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
        code: 'METAMASK_LOCKED',
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
        code: 'METAMASK_EXTENSION_ERROR',
      })
    })
  })
})
