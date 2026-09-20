import {useCallback, useMemo, useState} from 'react'
import toast from 'react-hot-toast'
import {erc20Abi, formatUnits, isAddress, zeroAddress} from 'viem'
import {useAccount, useChainId, useSimulateContract, useWriteContract} from 'wagmi'
import type {CategorizedToken} from '@/lib/web3/token-filtering'

import {useTransactionQueue} from './use-transaction-queue'
import {useWallet} from './use-wallet'

export const BURN_ADDRESS = '0x000000000000000000000000000000000000dEaD' as const

export interface UseTokenDisposalReturn {
  dispose: () => Promise<void>
  isPending: boolean // write-only pending, does NOT include simulation
  isSuccess: boolean
  isSimulating: boolean
  canDispose: boolean
  isSimulationEnabled: boolean
  error: Error | null
  txHash: `0x${string}` | undefined
}

export function useTokenDisposal(token: CategorizedToken): UseTokenDisposalReturn {
  const chainId = useChainId()
  const {address: userAddress} = useAccount()
  const {getUnsupportedNetworkError, isConnected} = useWallet()
  const {addTransaction} = useTransactionQueue()
  const [localError, setLocalError] = useState<Error | null>(null)
  const networkError = getUnsupportedNetworkError()

  const tokenValidationError = useMemo(() => {
    if (!isAddress(token.address, {strict: false}) || token.address.toLowerCase() === zeroAddress) {
      return new Error('No token selected for disposal')
    }
    if (token.balance <= BigInt(0)) {
      return new Error(`${token.symbol || 'Token'} has no balance to dispose`)
    }
    return null
  }, [token.address, token.balance, token.symbol])

  const isSimulationEnabled =
    localError == null &&
    typeof userAddress === 'string' &&
    isConnected &&
    networkError === null &&
    tokenValidationError === null

  const {
    data: simulateData,
    error: simulateError,
    isLoading: isSimulationLoading,
    isFetching: isSimulationFetching,
  } = useSimulateContract({
    address: token.address,
    abi: erc20Abi,
    functionName: 'transfer',
    args: [BURN_ADDRESS, token.balance],
    account: typeof userAddress === 'string' ? userAddress : undefined,
    chainId,
    query: {
      enabled: isSimulationEnabled,
      retry: false,
      staleTime: Number.POSITIVE_INFINITY,
      refetchOnWindowFocus: false,
    },
  })

  const {
    writeContract,
    isPending,
    isSuccess,
    error: writeError,
    data,
  } = useWriteContract({
    mutation: {
      onSuccess: hash => {
        addTransaction({
          hash,
          chainId,
          type: 'dispose',
          title: `Dispose ${token.symbol}`,
          description: `Burn ${formatUnits(token.balance, token.decimals)} ${token.symbol}`,
          value: token.balance,
          to: BURN_ADDRESS,
          from: userAddress,
        })

        toast.success(`${token.symbol} disposal submitted`)
        setLocalError(null)
      },
      onError: mutationError => {
        console.error('Token disposal failed:', mutationError)
        setLocalError(mutationError)
        toast.error(`Disposal failed: ${mutationError.message}`)
      },
    },
  })

  const simulationRequest = simulateData?.request
  const effectiveError = localError ?? simulateError ?? writeError ?? null
  const canDispose = effectiveError == null && isSimulationEnabled && simulationRequest != null
  const isSimulating =
    isSimulationEnabled &&
    simulationRequest == null &&
    simulateError == null &&
    (isSimulationLoading || isSimulationFetching)

  const dispose = useCallback(async () => {
    if (typeof userAddress !== 'string' || !isConnected || networkError !== null) {
      const errorMessage =
        typeof userAddress === 'string'
          ? (networkError?.error.userFriendlyMessage ?? 'Network configuration error - please check your connection')
          : 'Wallet connection required to dispose tokens'
      setLocalError(new Error(errorMessage))
      return
    }
    if (tokenValidationError !== null) {
      setLocalError(tokenValidationError)
      return
    }
    if (simulateError !== null) {
      setLocalError(simulateError)
      return
    }
    if (simulationRequest == null) {
      return // never write blind
    }
    writeContract(simulationRequest)
  }, [isConnected, networkError, simulateError, simulationRequest, tokenValidationError, userAddress, writeContract])

  return {
    dispose,
    isPending,
    isSuccess,
    isSimulating,
    canDispose,
    isSimulationEnabled,
    error: effectiveError,
    txHash: data,
  }
}
