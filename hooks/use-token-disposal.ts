import type {Address} from 'viem'
import {useCallback, useState} from 'react'
import toast from 'react-hot-toast'
import {erc20Abi, formatUnits} from 'viem'
import {useAccount, useChainId, useWriteContract} from 'wagmi'
import type {CategorizedToken} from '@/lib/web3/token-filtering'

import {useTransactionQueue} from './use-transaction-queue'
import {useWallet} from './use-wallet'

export const BURN_ADDRESS = '0x000000000000000000000000000000000000dEaD' as const

export interface UseTokenDisposalReturn {
  dispose: () => Promise<void>
  isPending: boolean
  isSuccess: boolean
  error: Error | null
  txHash: `0x${string}` | undefined
}

export function useTokenDisposal(token: CategorizedToken): UseTokenDisposalReturn {
  const chainId = useChainId()
  const {address: userAddress} = useAccount()
  const {getUnsupportedNetworkError, isConnected} = useWallet()
  const {addTransaction} = useTransactionQueue()
  const [error, setError] = useState<Error | null>(null)
  const networkError = getUnsupportedNetworkError()

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
          from: userAddress as Address,
        })

        toast.success(`${token.symbol} disposal submitted`)
        setError(null)
      },
      onError: mutationError => {
        console.error('Token disposal failed:', mutationError)
        setError(mutationError)
        toast.error(`Disposal failed: ${mutationError.message}`)
      },
    },
  })

  const dispose = useCallback(async () => {
    if (typeof userAddress !== 'string' || !isConnected || networkError !== null) {
      const errorMessage =
        typeof userAddress === 'string'
          ? (networkError?.error.userFriendlyMessage ?? 'Network configuration error - please check your connection')
          : 'Wallet connection required to dispose tokens'

      setError(new Error(errorMessage))
      return
    }

    writeContract({
      address: token.address,
      abi: erc20Abi,
      functionName: 'transfer',
      args: [BURN_ADDRESS, token.balance],
      chainId,
    })
  }, [chainId, isConnected, networkError, token.address, token.balance, userAddress, writeContract])

  return {
    dispose,
    isPending,
    isSuccess,
    error: error ?? writeError,
    txHash: data,
  }
}
