import type {WalletErrorRecovery, WalletSpecificError} from '@/lib/web3/wallet-error-types'
import {useState} from 'react'

/**
 * Hook for managing wallet error state
 */
export function useWalletErrorHandler() {
  const [errorState, setErrorState] = useState<WalletSpecificError | null>(null)
  const [recoveryState, setRecoveryState] = useState<WalletErrorRecovery | null>(null)

  const showError = (walletError: WalletSpecificError, errorRecovery?: WalletErrorRecovery) => {
    setErrorState(walletError)
    setRecoveryState(errorRecovery ?? null)
  }

  const clearError = () => {
    setErrorState(null)
    setRecoveryState(null)
  }

  return {
    error: errorState,
    recovery: recoveryState,
    showError,
    clearError,
    hasError: errorState !== null,
  }
}

/**
 * Helper function for creating wallet errors
 */
export function createWalletError(
  message: string,
  code: WalletSpecificError['code'],
  provider: WalletSpecificError['walletProvider'],
): WalletSpecificError {
  const error = new Error(message) as WalletSpecificError
  error.code = code
  error.walletProvider = provider
  error.userFriendlyMessage = message
  error.errorContext = {
    action: 'connect',
    timestamp: Date.now(),
  }
  return error
}
