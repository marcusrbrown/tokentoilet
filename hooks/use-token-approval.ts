'use client'

import type {CategorizedToken} from '@/lib/web3/token-filtering'
import type {Address} from 'viem'

import type {SupportedChainId} from './use-wallet'

import {useCallback, useEffect, useMemo, useState} from 'react'
import toast from 'react-hot-toast'
import {erc20Abi, formatUnits} from 'viem'
import {useAccount, useChainId, useEstimateGas, useReadContract, useWriteContract} from 'wagmi'

import {useTransactionQueue} from './use-transaction-queue'
import {useWallet} from './use-wallet'

/**
 * Token approval state tracking
 */
export interface ApprovalState {
  isApproved: boolean
  currentAllowance: bigint
  approvalAmount: bigint
  isLoading: boolean
  isPending: boolean
  error: Error | null
}

/**
 * Gas estimation data for approval transaction
 */
export interface GasEstimate {
  gasLimit: bigint | null
  gasPrice: bigint | null
  maxFeePerGas: bigint | null
  maxPriorityFeePerGas: bigint | null
  totalCost: bigint | null
  totalCostFormatted: string
  error: Error | null
  isLoading: boolean
}

/**
 * Token approval workflow configuration
 */
export interface TokenApprovalConfig {
  /** Token to approve */
  token: CategorizedToken
  /** Spender contract address (disposal contract) */
  spender: Address
  /** Amount to approve (defaults to token balance) */
  amount?: bigint
  /** Use infinite approval (max uint256) */
  useInfiniteApproval?: boolean
  /** Auto-refresh allowance after approval */
  autoRefresh?: boolean
}

/**
 * Hook return interface for token approval workflow
 */
export interface UseTokenApprovalReturn {
  /** Current approval state */
  approvalState: ApprovalState
  /** Gas estimation for approval transaction */
  gasEstimate: GasEstimate
  /** Approval functions */
  approve: () => Promise<void>
  /** Check current allowance */
  checkAllowance: () => Promise<void>
  /** Reset approval state */
  resetApprovalState: () => void
  /** Update approval amount */
  setApprovalAmount: (amount: bigint) => void
}

/**
 * Standard ERC-20 max approval amount (2^256 - 1)
 */
const MAX_UINT256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')

/**
 * Custom hook for managing token approval workflow with gas estimation
 * Provides comprehensive approval management for ERC-20 tokens in disposal workflow
 */
export function useTokenApproval(config: TokenApprovalConfig): UseTokenApprovalReturn {
  const {token, spender, amount, useInfiniteApproval = false, autoRefresh = true} = config

  // Web3 hooks
  const {address: userAddress} = useAccount()
  const chainId = useChainId()
  const {isConnected, getUnsupportedNetworkError} = useWallet()
  const {addTransaction} = useTransactionQueue()

  // Check for network errors
  const networkError = getUnsupportedNetworkError()

  // Local state
  const [approvalAmount, setApprovalAmount] = useState<bigint>(
    amount ?? (useInfiniteApproval ? MAX_UINT256 : token.balance),
  )
  const [error, setError] = useState<Error | null>(null)
  const [isPending, setIsPending] = useState(false)

  // Calculate approval parameters
  const shouldUseInfinite = useInfiniteApproval || approvalAmount === MAX_UINT256
  const finalApprovalAmount = shouldUseInfinite ? MAX_UINT256 : approvalAmount

  // Read current allowance
  const {
    data: currentAllowance = BigInt(0),
    isLoading: isLoadingAllowance,
    refetch: refetchAllowance,
    error: allowanceError,
  } = useReadContract({
    address: token.address,
    abi: erc20Abi,
    functionName: 'allowance',
    args: userAddress != null && spender != null ? [userAddress, spender] : undefined,
    chainId: chainId as SupportedChainId,
    query: {
      enabled: userAddress != null && spender != null && isConnected && networkError == null,
      staleTime: 30_000, // 30 second cache
      retry: 2,
    },
  })

  // Gas estimation for approval transaction
  const {
    data: gasLimit,
    isLoading: isLoadingGas,
    error: gasError,
  } = useEstimateGas({
    to: token.address,
    data:
      userAddress == null
        ? // Encode approve function call
          undefined
        : `0x095ea7b3${spender.slice(2).padStart(64, '0')}${finalApprovalAmount.toString(16).padStart(64, '0')}`,
    account: userAddress ?? undefined,
    chainId: chainId as SupportedChainId,
    query: {
      enabled: userAddress != null && spender != null && isConnected && networkError == null,
      retry: 1,
    },
  })

  // Write contract hook for approval
  const {writeContract, isPending: isWritePending} = useWriteContract({
    mutation: {
      onSuccess: hash => {
        // Add to transaction queue
        addTransaction({
          hash,
          chainId: chainId as SupportedChainId,
          type: 'approval',
          title: `Approve ${token.symbol}`,
          description: shouldUseInfinite
            ? `Infinite approval for ${token.symbol}`
            : `Approve ${formatUnits(finalApprovalAmount, token.decimals)} ${token.symbol}`,
          value: finalApprovalAmount,
          to: spender,
          from: userAddress as Address,
        })

        toast.success(
          shouldUseInfinite ? `Infinite ${token.symbol} approval submitted` : `${token.symbol} approval submitted`,
        )

        // Auto-refresh allowance after successful approval
        if (autoRefresh) {
          setTimeout(() => {
            refetchAllowance().catch(console.error)
          }, 2000)
        }

        setIsPending(false)
        setError(null)
      },
      onError: error => {
        console.error('Token approval failed:', error)
        setError(error)
        setIsPending(false)
        toast.error(`Approval failed: ${error.message}`)
      },
    },
  })

  // Approval state calculation
  const approvalState: ApprovalState = useMemo(
    () => ({
      isApproved: currentAllowance >= finalApprovalAmount,
      currentAllowance,
      approvalAmount: finalApprovalAmount,
      isLoading: isLoadingAllowance,
      isPending: isPending || isWritePending,
      error: error || (allowanceError as Error | null),
    }),
    [currentAllowance, finalApprovalAmount, isLoadingAllowance, isPending, isWritePending, error, allowanceError],
  )

  // Gas estimate calculation
  const gasEstimate: GasEstimate = useMemo(() => {
    if (gasLimit == null || gasError != null) {
      return {
        gasLimit: null,
        gasPrice: null,
        maxFeePerGas: null,
        maxPriorityFeePerGas: null,
        totalCost: null,
        totalCostFormatted: 'Unable to estimate',
        error: gasError,
        isLoading: isLoadingGas,
      }
    }

    // Simple gas cost estimation (gas limit * 1.5 for safety buffer)
    const adjustedGasLimit = (gasLimit * BigInt(150)) / BigInt(100)
    const estimatedGasPrice = BigInt('20000000000') // 20 gwei default
    const totalCost = adjustedGasLimit * estimatedGasPrice

    return {
      gasLimit: adjustedGasLimit,
      gasPrice: estimatedGasPrice,
      maxFeePerGas: estimatedGasPrice,
      maxPriorityFeePerGas: BigInt('2000000000'), // 2 gwei priority
      totalCost,
      totalCostFormatted: `${formatUnits(totalCost, 18)} ETH`,
      error: null,
      isLoading: isLoadingGas,
    }
  }, [gasLimit, gasError, isLoadingGas])

  // Approval function
  const approve = useCallback(async () => {
    if (userAddress == null || !isConnected || networkError != null) {
      const errorMsg =
        userAddress == null ? 'Wallet not connected' : (networkError?.error.userFriendlyMessage ?? 'Network error')
      setError(new Error(errorMsg))
      return
    }

    if (spender == null || token.address == null) {
      setError(new Error('Invalid approval parameters'))
      return
    }

    try {
      setIsPending(true)
      setError(null)

      writeContract({
        address: token.address,
        abi: erc20Abi,
        functionName: 'approve',
        args: [spender, finalApprovalAmount],
        chainId: chainId as SupportedChainId,
      })
    } catch (error_) {
      console.error('Approval transaction failed:', error_)
      setError(error_ as Error)
      setIsPending(false)
    }
  }, [userAddress, isConnected, networkError, spender, token.address, finalApprovalAmount, chainId, writeContract])

  // Check allowance function
  const checkAllowance = useCallback(async () => {
    try {
      await refetchAllowance()
      setError(null)
    } catch (error_) {
      console.error('Failed to check allowance:', error_)
      setError(error_ as Error)
    }
  }, [refetchAllowance])

  // Reset state function
  const resetApprovalState = useCallback(() => {
    setError(null)
    setIsPending(false)
  }, [])

  // Update approval amount function
  const updateApprovalAmount = useCallback((newAmount: bigint) => {
    setApprovalAmount(newAmount)
    setError(null)
  }, [])

  // Auto-refresh allowance on chain/user change
  useEffect(() => {
    if (userAddress != null && isConnected && networkError == null) {
      checkAllowance().catch(console.error)
    }
  }, [userAddress, chainId, isConnected, networkError, checkAllowance])

  return {
    approvalState,
    gasEstimate,
    approve,
    checkAllowance,
    resetApprovalState,
    setApprovalAmount: updateApprovalAmount,
  }
}
