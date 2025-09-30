/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return, unused-imports/no-unused-vars */
import type {CategorizedToken} from '@/lib/web3/token-filtering'
import type {Address} from 'viem'
import {renderHook, waitFor} from '@testing-library/react'
import {erc20Abi} from 'viem'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {useAccount, useChainId, useEstimateGas, useReadContract, useWriteContract} from 'wagmi'

import {useTokenApproval} from './use-token-approval'
import {useTransactionQueue} from './use-transaction-queue'
import {useWallet} from './use-wallet'

// Mock dependencies
vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
  useChainId: vi.fn(),
  useReadContract: vi.fn(),
  useWriteContract: vi.fn(),
  useEstimateGas: vi.fn(),
}))

vi.mock('./use-wallet', () => ({
  useWallet: vi.fn(),
}))

vi.mock('./use-transaction-queue', () => ({
  useTransactionQueue: vi.fn(),
}))

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('useTokenApproval', () => {
  const mockUserAddress = '0x1234567890123456789012345678901234567890' as Address
  const mockSpenderAddress = '0x9876543210987654321098765432109876543210' as Address
  const mockTokenAddress = '0xA0b86a33E6441E5d8CE6a65f7AEF4eDe18f23e94' as Address

  const mockToken: CategorizedToken = {
    address: mockTokenAddress,
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    balance: BigInt('1000000000'),
    chainId: 1,
    formattedBalance: '1000',
    category: 'valuable',
    score: 0.9,
    metadata: {
      address: mockTokenAddress,
      chainId: 1,
      name: 'USD Coin',
      symbol: 'USDC',
      decimals: 6,
      riskScore: 0,
      sources: [],
      lastUpdated: Date.now(),
      cacheKey: 'usdc-1',
    },
  }

  const mockConfig = {
    token: mockToken,
    spender: mockSpenderAddress,
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock implementations
    vi.mocked(useAccount).mockReturnValue({
      address: mockUserAddress,
    } as any)

    vi.mocked(useChainId).mockReturnValue(1)

    vi.mocked(useWallet).mockReturnValue({
      isConnected: true,
      getUnsupportedNetworkError: vi.fn(() => null),
    } as any)

    vi.mocked(useTransactionQueue).mockReturnValue({
      addTransaction: vi.fn(),
    } as any)

    vi.mocked(useReadContract).mockReturnValue({
      data: BigInt(0),
      isLoading: false,
      refetch: vi.fn(),
      error: null,
    } as any)

    vi.mocked(useEstimateGas).mockReturnValue({
      data: BigInt('50000'),
      isLoading: false,
      error: null,
    } as any)

    vi.mocked(useWriteContract).mockReturnValue({
      writeContract: vi.fn(),
      isPending: false,
    } as any)
  })

  describe('approval state management', () => {
    it('should initialize with correct approval state', () => {
      const {result} = renderHook(() => useTokenApproval(mockConfig))

      expect(result.current.approvalState.isApproved).toBe(false)
      expect(result.current.approvalState.currentAllowance).toBe(BigInt(0))
      expect(result.current.approvalState.isLoading).toBe(false)
      expect(result.current.approvalState.isPending).toBe(false)
    })

    it('should detect when token is already approved', () => {
      vi.mocked(useReadContract).mockReturnValue({
        data: BigInt('2000000000'),
        isLoading: false,
        refetch: vi.fn(),
        error: null,
      } as any)

      const {result} = renderHook(() => useTokenApproval(mockConfig))

      expect(result.current.approvalState.isApproved).toBe(true)
      expect(result.current.approvalState.currentAllowance).toBe(BigInt('2000000000'))
    })

    it('should track loading state', () => {
      vi.mocked(useReadContract).mockReturnValue({
        data: BigInt(0),
        isLoading: true,
        refetch: vi.fn(),
        error: null,
      } as any)

      const {result} = renderHook(() => useTokenApproval(mockConfig))

      expect(result.current.approvalState.isLoading).toBe(true)
    })

    it('should track pending state during approval', () => {
      vi.mocked(useWriteContract).mockReturnValue({
        writeContract: vi.fn(),
        isPending: true,
      } as any)

      const {result} = renderHook(() => useTokenApproval(mockConfig))

      expect(result.current.approvalState.isPending).toBe(true)
    })
  })

  describe('gas estimation', () => {
    it('should provide gas estimate when available', () => {
      const {result} = renderHook(() => useTokenApproval(mockConfig))

      expect(result.current.gasEstimate.gasLimit).toBeTruthy()
      expect(result.current.gasEstimate.totalCost).toBeTruthy()
      expect(result.current.gasEstimate.error).toBeNull()
    })

    it('should handle gas estimation errors', () => {
      const mockGasError = new Error('Gas estimation failed')
      vi.mocked(useEstimateGas).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockGasError,
      } as any)

      const {result} = renderHook(() => useTokenApproval(mockConfig))

      expect(result.current.gasEstimate.gasLimit).toBeNull()
      expect(result.current.gasEstimate.totalCost).toBeNull()
      expect(result.current.gasEstimate.error).toBe(mockGasError)
      expect(result.current.gasEstimate.totalCostFormatted).toBe('Unable to estimate')
    })

    it('should track gas loading state', () => {
      vi.mocked(useEstimateGas).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any)

      const {result} = renderHook(() => useTokenApproval(mockConfig))

      expect(result.current.gasEstimate.isLoading).toBe(true)
    })

    it('should apply safety buffer to gas estimate', () => {
      vi.mocked(useEstimateGas).mockReturnValue({
        data: BigInt('100000'),
        isLoading: false,
        error: null,
      } as any)

      const {result} = renderHook(() => useTokenApproval(mockConfig))

      // Should be 100000 * 1.5 = 150000
      expect(result.current.gasEstimate.gasLimit).toBe(BigInt('150000'))
    })
  })

  describe('infinite approval', () => {
    it('should use max uint256 for infinite approval', () => {
      const configWithInfinite = {
        ...mockConfig,
        useInfiniteApproval: true,
      }

      const {result} = renderHook(() => useTokenApproval(configWithInfinite))

      const MAX_UINT256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
      expect(result.current.approvalState.approvalAmount).toBe(MAX_UINT256)
    })

    it('should detect infinite approval already set', () => {
      const MAX_UINT256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
      vi.mocked(useReadContract).mockReturnValue({
        data: MAX_UINT256,
        isLoading: false,
        refetch: vi.fn(),
        error: null,
      } as any)

      const {result} = renderHook(() => useTokenApproval(mockConfig))

      expect(result.current.approvalState.isApproved).toBe(true)
    })
  })

  describe('custom approval amounts', () => {
    it('should use custom approval amount', () => {
      const customAmount = BigInt('500000000')
      const configWithAmount = {
        ...mockConfig,
        amount: customAmount,
      }

      const {result} = renderHook(() => useTokenApproval(configWithAmount))

      expect(result.current.approvalState.approvalAmount).toBe(customAmount)
    })

    it('should update approval amount dynamically', async () => {
      const {result} = renderHook(() => useTokenApproval(mockConfig))

      const newAmount = BigInt('2000000000')
      result.current.setApprovalAmount(newAmount)

      await waitFor(() => {
        expect(result.current.approvalState.approvalAmount).toBe(newAmount)
      })
    })
  })

  describe('approval execution', () => {
    it('should execute approval transaction', async () => {
      const mockWriteContract = vi.fn()
      vi.mocked(useWriteContract).mockReturnValue({
        writeContract: mockWriteContract,
        isPending: false,
      } as any)

      const {result} = renderHook(() => useTokenApproval(mockConfig))

      await result.current.approve()

      expect(mockWriteContract).toHaveBeenCalledWith({
        address: mockTokenAddress,
        abi: erc20Abi,
        functionName: 'approve',
        args: [mockSpenderAddress, mockToken.balance],
        chainId: 1,
      })
    })

    it('should not approve when wallet is not connected', async () => {
      vi.mocked(useWallet).mockReturnValue({
        isConnected: false,
        getUnsupportedNetworkError: vi.fn(() => null),
      } as any)

      vi.mocked(useAccount).mockReturnValue({
        address: undefined,
      } as any)

      const mockWriteContract = vi.fn()
      vi.mocked(useWriteContract).mockReturnValue({
        writeContract: mockWriteContract,
        isPending: false,
      } as any)

      const {result} = renderHook(() => useTokenApproval(mockConfig))

      await result.current.approve()

      await waitFor(() => {
        expect(mockWriteContract).not.toHaveBeenCalled()
        expect(result.current.approvalState.error).toBeTruthy()
      })
    })

    it('should handle network errors', async () => {
      const networkError = {
        error: {
          userFriendlyMessage: 'Unsupported network',
        },
      }

      vi.mocked(useWallet).mockReturnValue({
        isConnected: true,
        getUnsupportedNetworkError: vi.fn(() => networkError as any),
      } as any)

      const mockWriteContract = vi.fn()
      vi.mocked(useWriteContract).mockReturnValue({
        writeContract: mockWriteContract,
        isPending: false,
      } as any)

      const {result} = renderHook(() => useTokenApproval(mockConfig))

      await result.current.approve()

      await waitFor(() => {
        expect(mockWriteContract).not.toHaveBeenCalled()
        expect(result.current.approvalState.error).toBeTruthy()
      })
    })
  })

  describe('allowance checking', () => {
    it('should check allowance on demand', async () => {
      const mockRefetch = vi.fn()
      vi.mocked(useReadContract).mockReturnValue({
        data: BigInt(0),
        isLoading: false,
        refetch: mockRefetch,
        error: null,
      } as any)

      const {result} = renderHook(() => useTokenApproval(mockConfig))

      await result.current.checkAllowance()

      expect(mockRefetch).toHaveBeenCalled()
    })

    it('should handle allowance check errors', async () => {
      const mockRefetch = vi.fn().mockRejectedValue(new Error('RPC error'))
      vi.mocked(useReadContract).mockReturnValue({
        data: BigInt(0),
        isLoading: false,
        refetch: mockRefetch,
        error: null,
      } as any)

      const {result} = renderHook(() => useTokenApproval(mockConfig))

      await result.current.checkAllowance()

      await waitFor(() => {
        expect(result.current.approvalState.error).toBeTruthy()
      })
    })
  })

  describe('state reset', () => {
    it('should reset approval state', () => {
      const {result} = renderHook(() => useTokenApproval(mockConfig))

      result.current.resetApprovalState()

      expect(result.current.approvalState.error).toBeNull()
      expect(result.current.approvalState.isPending).toBe(false)
    })
  })

  describe('transaction queue integration', () => {
    it('should add transaction to queue on success', async () => {
      const mockAddTransaction = vi.fn()
      vi.mocked(useTransactionQueue).mockReturnValue({
        addTransaction: mockAddTransaction,
      } as any)

      const mockHash = '0xabc123' as Address
      const mockWriteContract = vi.fn()
      const mockMutation = {
        onSuccess: vi.fn(),
        onError: vi.fn(),
      }

      vi.mocked(useWriteContract).mockReturnValue({
        writeContract: mockWriteContract,
        isPending: false,
      } as any)

      renderHook(() => useTokenApproval(mockConfig))

      // Get the mutation config
      const writeContractCall = vi.mocked(useWriteContract).mock.calls[0][0]
      const mutationConfig = writeContractCall?.mutation

      // Simulate successful approval
      if (mutationConfig?.onSuccess) {
        mutationConfig.onSuccess(mockHash, {} as any, {} as any)
      }

      await waitFor(() => {
        expect(mockAddTransaction).toHaveBeenCalled()
      })
    })
  })

  describe('error handling', () => {
    it('should expose allowance read errors', () => {
      const mockError = new Error('Contract read failed')
      vi.mocked(useReadContract).mockReturnValue({
        data: BigInt(0),
        isLoading: false,
        refetch: vi.fn(),
        error: mockError,
      } as any)

      const {result} = renderHook(() => useTokenApproval(mockConfig))

      expect(result.current.approvalState.error).toBe(mockError)
    })
  })

  describe('auto-refresh behavior', () => {
    it('should auto-refresh allowance after successful approval by default', async () => {
      const mockRefetch = vi.fn()
      vi.mocked(useReadContract).mockReturnValue({
        data: BigInt(0),
        isLoading: false,
        refetch: mockRefetch,
        error: null,
      } as any)

      const mockHash = '0xabc123' as Address
      const mockWriteContract = vi.fn()

      vi.mocked(useWriteContract).mockReturnValue({
        writeContract: mockWriteContract,
        isPending: false,
      } as any)

      renderHook(() => useTokenApproval(mockConfig))

      // Get the mutation config
      const writeContractCall = vi.mocked(useWriteContract).mock.calls[0][0]
      const mutationConfig = writeContractCall?.mutation

      // Simulate successful approval
      if (mutationConfig?.onSuccess) {
        mutationConfig.onSuccess(mockHash, {} as any, {} as any, {} as any)
      }

      // Wait for auto-refresh timeout (2000ms)
      await waitFor(
        () => {
          expect(mockRefetch).toHaveBeenCalled()
        },
        {timeout: 3000},
      )
    })
  })

  describe('wallet state changes', () => {
    it('should refresh allowance when wallet changes', async () => {
      const mockRefetch = vi.fn()
      vi.mocked(useReadContract).mockReturnValue({
        data: BigInt(0),
        isLoading: false,
        refetch: mockRefetch,
        error: null,
      } as any)

      const {rerender} = renderHook(() => useTokenApproval(mockConfig))

      // Simulate wallet change
      vi.mocked(useAccount).mockReturnValue({
        address: '0xdifferentaddress' as Address,
      } as any)

      rerender()

      await waitFor(() => {
        expect(mockRefetch).toHaveBeenCalled()
      })
    })

    it('should not refresh allowance when not connected', () => {
      vi.mocked(useWallet).mockReturnValue({
        isConnected: false,
        getUnsupportedNetworkError: vi.fn(() => null),
      } as any)

      vi.mocked(useAccount).mockReturnValue({
        address: undefined,
      } as any)

      const mockRefetch = vi.fn()
      vi.mocked(useReadContract).mockReturnValue({
        data: BigInt(0),
        isLoading: false,
        refetch: mockRefetch,
        error: null,
      } as any)

      renderHook(() => useTokenApproval(mockConfig))

      expect(mockRefetch).not.toHaveBeenCalled()
    })
  })
})
