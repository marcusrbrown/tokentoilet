import type {Address} from 'viem'
import {act, renderHook, waitFor} from '@testing-library/react'
import toast from 'react-hot-toast'
import {erc20Abi} from 'viem'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {useAccount, useChainId, useWriteContract} from 'wagmi'
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
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('calls transfer with the burn address and token balance', async () => {
    const mockWriteContract = vi.fn()
    vi.mocked(useWriteContract).mockReturnValue({
      writeContract: mockWriteContract,
      isPending: false,
      isSuccess: false,
      error: null,
      data: undefined,
    } as never)

    const {result} = renderHook(() => useTokenDisposal(mockToken))

    // Given a connected wallet and a token selected for disposal
    // When dispose is executed
    await result.current.dispose()

    // Then the hook writes an ERC-20 transfer to the burn address
    expect(mockWriteContract).toHaveBeenCalledWith({
      address: mockTokenAddress,
      abi: erc20Abi,
      functionName: 'transfer',
      args: [BURN_ADDRESS, mockToken.balance],
      chainId: 11155111,
    })
  })

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
})
