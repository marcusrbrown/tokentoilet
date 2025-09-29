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
 * Tracks approval state to prevent unnecessary transactions and provide user feedback
 * Distinguishes between loading allowance data vs pending approval transaction
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
 * Provides comprehensive gas estimation to help users make informed approval decisions
 * Includes safety buffer and EIP-1559 fee structure for accurate cost prediction
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
 * Manages token approval workflow with gas estimation for disposal transactions
 *
 * Centralizes approval logic to ensure consistent UX across disposal workflow.
 * Provides real-time gas estimation to help users understand transaction costs
 * before approving tokens for disposal contract interaction.
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

  // Read current allowance with explicit null checks following strict boolean expressions
  const {
    data: currentAllowance = BigInt(0),
    isLoading: isLoadingAllowance,
    refetch: refetchAllowance,
    error: allowanceError,
  } = useReadContract({
    address: token.address,
    abi: erc20Abi,
    functionName: 'allowance',
    args: typeof userAddress === 'string' && typeof spender === 'string' ? [userAddress, spender] : undefined,
    chainId: chainId as SupportedChainId,
    query: {
      enabled: typeof userAddress === 'string' && typeof spender === 'string' && isConnected && networkError === null,
      staleTime: 30_000, // Cache for 30 seconds to reduce RPC calls
      retry: 2,
    },
  })

  // Gas estimation for approval transaction with explicit null checks
  const {
    data: gasLimit,
    isLoading: isLoadingGas,
    error: gasError,
  } = useEstimateGas({
    to: token.address,
    data:
      typeof userAddress === 'string'
        ? `0x095ea7b3${spender.slice(2).padStart(64, '0')}${finalApprovalAmount.toString(16).padStart(64, '0')}`
        : undefined,
    account: typeof userAddress === 'string' ? userAddress : undefined,
    chainId: chainId as SupportedChainId,
    query: {
      enabled: typeof userAddress === 'string' && typeof spender === 'string' && isConnected && networkError === null,
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

  // Gas estimate calculation with explicit error handling
  const gasEstimate: GasEstimate = useMemo(() => {
    if (typeof gasLimit !== 'bigint' || gasError !== null) {
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

  // Approval function with enhanced error handling following Web3 guidelines
  const approve = useCallback(async () => {
    if (typeof userAddress !== 'string' || !isConnected || networkError !== null) {
      const errorMsg =
        typeof userAddress === 'string'
          ? (networkError?.error.userFriendlyMessage ?? 'Network configuration error - please check your connection')
          : 'Wallet connection required to approve tokens'
      console.error('Token approval validation failed:', errorMsg, {userAddress, isConnected, networkError})
      setError(new Error(errorMsg))
      return
    }

    if (typeof spender !== 'string' || typeof token.address !== 'string') {
      const errorMsg = 'Invalid approval configuration - missing spender or token address'
      console.error('Token approval configuration error:', {spender, tokenAddress: token.address})
      setError(new Error(errorMsg))
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
      const errorMessage = error_ instanceof Error ? error_.message : 'Unknown approval transaction error'
      console.error('Approval transaction failed:', errorMessage, {
        token: token.symbol,
        spender,
        amount: finalApprovalAmount.toString(),
      })
      setError(error_ instanceof Error ? error_ : new Error(errorMessage))
      setIsPending(false)
    }
  }, [
    userAddress,
    isConnected,
    networkError,
    spender,
    token.address,
    token.symbol,
    finalApprovalAmount,
    chainId,
    writeContract,
  ])

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

  // Auto-refresh allowance on chain/user change with explicit null checks
  useEffect(() => {
    if (typeof userAddress === 'string' && isConnected && networkError === null) {
      checkAllowance().catch(error => {
        console.error('Failed to auto-refresh token allowance:', error, {userAddress, chainId})
      })
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
