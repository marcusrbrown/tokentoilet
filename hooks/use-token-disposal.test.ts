import type {Address} from 'viem'
import {act, renderHook, waitFor} from '@testing-library/react'
import toast from 'react-hot-toast'
import {erc20Abi} from 'viem'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {useAccount, useChainId, useSimulateContract, useWriteContract} from 'wagmi'
import type {CategorizedToken} from '@/lib/web3/token-filtering'
import {TokenCategory, TokenValueClass} from '@/lib/web3/token-filtering'
import {TokenRiskScore} from '@/lib/web3/token-metadata'

import {BURN_ADDRESS, useTokenDisposal} from './use-token-disposal'
import {useTransactionQueue} from './use-transaction-queue'
import {useWallet} from './use-wallet'

vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
  useChainId: vi.fn(),
  useWriteContract: vi.fn(),
  useSimulateContract: vi.fn(),
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

describe('useTokenDisposal', () => {
  const mockUserAddress = '0x1234567890123456789012345678901234567890' as Address
  const mockTokenAddress = '0xA0b86a33E6441E5d8CE6a65f7AEF4eDe18f23e94' as Address

  const mockToken: CategorizedToken = {
    address: mockTokenAddress,
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    balance: BigInt('1000000000'),
    chainId: 11155111,
    formattedBalance: '1000',
    category: TokenCategory.VALUABLE,
    valueClass: TokenValueClass.HIGH_VALUE,
    riskScore: TokenRiskScore.VERIFIED,
    spamScore: 0,
    isVerified: true,
    analysisTimestamp: Date.now(),
    confidenceScore: 0.95,
    metadata: {
      address: mockTokenAddress,
      chainId: 11155111,
      name: 'USD Coin',
      symbol: 'USDC',
      decimals: 6,
      riskScore: TokenRiskScore.VERIFIED,
      sources: [],
      lastUpdated: Date.now(),
      cacheKey: 'usdc-sepolia',
    },
  }

  const mockSimulationRequest = {
    address: mockTokenAddress,
    abi: erc20Abi,
    functionName: 'transfer' as const,
    args: [BURN_ADDRESS, mockToken.balance] as const,
    account: mockUserAddress,
    chainId: 11155111,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})

    vi.mocked(useAccount).mockReturnValue({
      address: mockUserAddress,
    } as never)

    vi.mocked(useChainId).mockReturnValue(11155111)

    vi.mocked(useWallet).mockReturnValue({
      isConnected: true,
      getUnsupportedNetworkError: vi.fn(() => null),
    } as never)

    vi.mocked(useTransactionQueue).mockReturnValue({
      addTransaction: vi.fn(),
    } as never)

    vi.mocked(useWriteContract).mockReturnValue({
      writeContract: vi.fn(),
      isPending: false,
      isSuccess: false,
      error: null,
      data: undefined,
    } as never)

    // Default: successful simulation
    vi.mocked(useSimulateContract).mockReturnValue({
      data: {request: mockSimulationRequest},
      error: null,
      isLoading: false,
      isFetching: false,
    } as never)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('simulation configuration', () => {
    it('configures useSimulateContract with correct args when wallet is connected and token is valid', () => {
      // Given a connected wallet with a valid token
      renderHook(() => useTokenDisposal(mockToken))

      // When the hook initializes
      // Then useSimulateContract is called with the correct transfer parameters
      expect(useSimulateContract).toHaveBeenCalledWith(
        expect.objectContaining({
          address: mockTokenAddress,
          abi: erc20Abi,
          functionName: 'transfer',
          args: [BURN_ADDRESS, mockToken.balance],
          account: mockUserAddress,
          chainId: 11155111,
          query: expect.objectContaining({
            enabled: true,
            retry: false,
          }) as unknown,
        }),
      )
    })

    it('disables simulation when wallet is disconnected', () => {
      // Given a disconnected wallet
      vi.mocked(useWallet).mockReturnValue({
        isConnected: false,
        getUnsupportedNetworkError: vi.fn(() => null),
      } as never)
      vi.mocked(useAccount).mockReturnValue({address: undefined} as never)

      renderHook(() => useTokenDisposal(mockToken))

      // Then simulation is disabled
      expect(useSimulateContract).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.objectContaining({enabled: false}) as unknown,
        }),
      )
    })

    it('disables simulation on unsupported network', () => {
      // Given an unsupported network
      const networkError = {error: {userFriendlyMessage: 'Unsupported network'}}
      vi.mocked(useWallet).mockReturnValue({
        isConnected: true,
        getUnsupportedNetworkError: vi.fn(() => networkError),
      } as never)

      renderHook(() => useTokenDisposal(mockToken))

      // Then simulation is disabled
      expect(useSimulateContract).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.objectContaining({enabled: false}) as unknown,
        }),
      )
    })

    it('disables simulation for zero address (dummy token)', () => {
      // Given a dummy token with zero address
      const dummyToken: CategorizedToken = {
        ...mockToken,
        address: '0x0000000000000000000000000000000000000000',
      }

      renderHook(() => useTokenDisposal(dummyToken))

      // Then simulation is disabled
      expect(useSimulateContract).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.objectContaining({enabled: false}) as unknown,
        }),
      )
    })

    it('disables simulation when token balance is zero', () => {
      // Given a token with zero balance
      const zeroBalanceToken: CategorizedToken = {
        ...mockToken,
        balance: BigInt(0),
      }

      renderHook(() => useTokenDisposal(zeroBalanceToken))

      // Then simulation is disabled
      expect(useSimulateContract).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.objectContaining({enabled: false}) as unknown,
        }),
      )
    })
  })

  describe('dispose() behavior', () => {
    it('calls writeContract with the simulated request (not a hand-built object)', async () => {
      // Given a successful simulation
      const mockWriteContract = vi.fn()
      vi.mocked(useWriteContract).mockReturnValue({
        writeContract: mockWriteContract,
        isPending: false,
        isSuccess: false,
        error: null,
        data: undefined,
      } as never)

      const {result} = renderHook(() => useTokenDisposal(mockToken))

      // When dispose is called
      await result.current.dispose()

      // Then writeContract receives the exact simulated request object (not a hand-built one)
      expect(mockWriteContract).toHaveBeenCalledWith(mockSimulationRequest)
      // Verify it was called with the exact reference from simulateData.request
      expect(mockWriteContract).toHaveBeenCalledTimes(1)
    })

    it('does NOT write when simulation is still loading', async () => {
      // Given simulation is in progress
      const mockWriteContract = vi.fn()
      vi.mocked(useWriteContract).mockReturnValue({
        writeContract: mockWriteContract,
        isPending: false,
        isSuccess: false,
        error: null,
        data: undefined,
      } as never)
      vi.mocked(useSimulateContract).mockReturnValue({
        data: undefined,
        error: null,
        isLoading: true,
        isFetching: true,
      } as never)

      const {result} = renderHook(() => useTokenDisposal(mockToken))

      // When dispose is called while simulation is loading
      await result.current.dispose()

      // Then no write is attempted
      expect(mockWriteContract).not.toHaveBeenCalled()
      expect(result.current.isSimulating).toBe(true)
      expect(result.current.canDispose).toBe(false)
    })

    it('does NOT write when simulation fails; exposes simulation error', async () => {
      // Given a failed simulation
      const simulationError = new Error('Transfer would revert: insufficient balance')
      const mockWriteContract = vi.fn()
      vi.mocked(useWriteContract).mockReturnValue({
        writeContract: mockWriteContract,
        isPending: false,
        isSuccess: false,
        error: null,
        data: undefined,
      } as never)
      vi.mocked(useSimulateContract).mockReturnValue({
        data: undefined,
        error: simulationError,
        isLoading: false,
        isFetching: false,
      } as never)

      const {result} = renderHook(() => useTokenDisposal(mockToken))

      // When dispose is called after simulation failure
      await result.current.dispose()

      // Then no write is attempted and error is exposed
      expect(mockWriteContract).not.toHaveBeenCalled()
      expect(result.current.error).toBe(simulationError)
      expect(result.current.canDispose).toBe(false)
    })

    it('sets wallet error and does NOT write when wallet is disconnected', async () => {
      // Given a disconnected wallet
      vi.mocked(useWallet).mockReturnValue({
        isConnected: false,
        getUnsupportedNetworkError: vi.fn(() => null),
      } as never)
      vi.mocked(useAccount).mockReturnValue({address: undefined} as never)
      vi.mocked(useSimulateContract).mockReturnValue({
        data: undefined,
        error: null,
        isLoading: false,
        isFetching: false,
      } as never)

      const mockWriteContract = vi.fn()
      vi.mocked(useWriteContract).mockReturnValue({
        writeContract: mockWriteContract,
        isPending: false,
        isSuccess: false,
        error: null,
        data: undefined,
      } as never)

      const {result} = renderHook(() => useTokenDisposal(mockToken))

      // When dispose is called
      await result.current.dispose()

      // Then error is set and no write occurs
      expect(mockWriteContract).not.toHaveBeenCalled()
      await waitFor(() => {
        expect(result.current.error?.message).toBe('Wallet connection required to dispose tokens')
      })
    })

    it('sets network error and does NOT write on unsupported network', async () => {
      // Given an unsupported network
      const networkError = {error: {userFriendlyMessage: 'Please switch to Sepolia'}}
      vi.mocked(useWallet).mockReturnValue({
        isConnected: true,
        getUnsupportedNetworkError: vi.fn(() => networkError),
      } as never)
      vi.mocked(useSimulateContract).mockReturnValue({
        data: undefined,
        error: null,
        isLoading: false,
        isFetching: false,
      } as never)

      const mockWriteContract = vi.fn()
      vi.mocked(useWriteContract).mockReturnValue({
        writeContract: mockWriteContract,
        isPending: false,
        isSuccess: false,
        error: null,
        data: undefined,
      } as never)

      const {result} = renderHook(() => useTokenDisposal(mockToken))

      // When dispose is called
      await result.current.dispose()

      // Then network error is surfaced and no write occurs
      expect(mockWriteContract).not.toHaveBeenCalled()
      await waitFor(() => {
        expect(result.current.error?.message).toBe('Please switch to Sepolia')
      })
    })

    it('sets "No token selected" error and does NOT write for dummy zero-address token', async () => {
      // Given a dummy token with zero address
      const dummyToken: CategorizedToken = {
        ...mockToken,
        address: '0x0000000000000000000000000000000000000000',
      }
      vi.mocked(useSimulateContract).mockReturnValue({
        data: undefined,
        error: null,
        isLoading: false,
        isFetching: false,
      } as never)

      const mockWriteContract = vi.fn()
      vi.mocked(useWriteContract).mockReturnValue({
        writeContract: mockWriteContract,
        isPending: false,
        isSuccess: false,
        error: null,
        data: undefined,
      } as never)

      const {result} = renderHook(() => useTokenDisposal(dummyToken))

      // When dispose is called
      await result.current.dispose()

      // Then validation error is set and no write occurs
      expect(mockWriteContract).not.toHaveBeenCalled()
      await waitFor(() => {
        expect(result.current.error?.message).toBe('No token selected for disposal')
      })
    })

    it('sets "has no balance" error and does NOT write for zero-balance token', async () => {
      // Given a token with zero balance
      const zeroBalanceToken: CategorizedToken = {
        ...mockToken,
        balance: BigInt(0),
        symbol: 'USDC',
      }
      vi.mocked(useSimulateContract).mockReturnValue({
        data: undefined,
        error: null,
        isLoading: false,
        isFetching: false,
      } as never)

      const mockWriteContract = vi.fn()
      vi.mocked(useWriteContract).mockReturnValue({
        writeContract: mockWriteContract,
        isPending: false,
        isSuccess: false,
        error: null,
        data: undefined,
      } as never)

      const {result} = renderHook(() => useTokenDisposal(zeroBalanceToken))

      // When dispose is called
      await result.current.dispose()

      // Then balance error is set and no write occurs
      expect(mockWriteContract).not.toHaveBeenCalled()
      await waitFor(() => {
        expect(result.current.error?.message).toBe('USDC has no balance to dispose')
      })
    })
  })

  describe('onSuccess / onError mutation callbacks', () => {
    it('adds the disposal transaction to the queue on success', () => {
      const mockAddTransaction = vi.fn()
      vi.mocked(useTransactionQueue).mockReturnValue({
        addTransaction: mockAddTransaction,
      } as never)

      renderHook(() => useTokenDisposal(mockToken))

      const mutationConfig = vi.mocked(useWriteContract).mock.calls[0]?.[0]?.mutation
      const hash = '0xabc123' as Address

      // Given a submitted disposal transaction
      // When wagmi reports a successful submission
      mutationConfig?.onSuccess?.(hash, {} as never, {}, {} as never)

      // Then the transaction is queued for receipt monitoring
      expect(mockAddTransaction).toHaveBeenCalledWith({
        hash,
        chainId: 11155111,
        type: 'dispose',
        title: 'Dispose USDC',
        description: 'Burn 1000 USDC',
        value: mockToken.balance,
        to: BURN_ADDRESS,
        from: mockUserAddress,
      })
    })

    it('sets error state and shows a toast when disposal fails', async () => {
      const failure = new Error('User rejected transaction') as Error & {shortMessage?: string}
      const {result} = renderHook(() => useTokenDisposal(mockToken))

      const mutationConfig = vi.mocked(useWriteContract).mock.calls[0]?.[0]?.mutation

      // Given a submitted disposal transaction
      // When wagmi reports an error
      act(() => {
        mutationConfig?.onError?.(failure as never, {} as never, {}, {} as never)
      })

      // Then the hook exposes the error and notifies the user
      return waitFor(() => {
        expect(result.current.error).toBe(failure)
        expect(toast.error).toHaveBeenCalledWith('Disposal failed: User rejected transaction')
      })
    })
  })

  describe('derived state', () => {
    it('returns pending state while the disposal transaction is in flight', () => {
      vi.mocked(useWriteContract).mockReturnValue({
        writeContract: vi.fn(),
        isPending: true,
        isSuccess: false,
        error: null,
        data: undefined,
      } as never)

      const {result} = renderHook(() => useTokenDisposal(mockToken))

      // Given wagmi reports a pending write
      // When the hook is read
      // Then isPending stays true for real-time status rendering
      expect(result.current.isPending).toBe(true)
    })

    it('returns the submitted transaction hash for explorer linking', () => {
      const txHash = '0xfeedbeef' as Address
      vi.mocked(useWriteContract).mockReturnValue({
        writeContract: vi.fn(),
        isPending: false,
        isSuccess: true,
        error: null,
        data: txHash,
      } as never)

      const {result} = renderHook(() => useTokenDisposal(mockToken))

      // Given wagmi has a submitted disposal hash
      // When the hook is read
      // Then the hash is exposed for explorer links while the queue checks receipt status
      expect(result.current.txHash).toBe(txHash)
    })

    it('exposes canDispose=true only when simulation succeeded and no errors', () => {
      // Given a successful simulation with no errors
      const {result} = renderHook(() => useTokenDisposal(mockToken))

      // Then canDispose is true
      expect(result.current.canDispose).toBe(true)
      expect(result.current.isSimulating).toBe(false)
    })

    it('exposes isSimulating=true while simulation is in flight', () => {
      // Given simulation is in progress
      vi.mocked(useSimulateContract).mockReturnValue({
        data: undefined,
        error: null,
        isLoading: true,
        isFetching: true,
      } as never)

      const {result} = renderHook(() => useTokenDisposal(mockToken))

      // Then isSimulating is true and canDispose is false
      expect(result.current.isSimulating).toBe(true)
      expect(result.current.canDispose).toBe(false)
    })
  })
})
