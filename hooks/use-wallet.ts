'use client'

import type {WalletSpecificError} from '@/lib/web3/wallet-error-types'
import {classifyWalletError, getWalletErrorRecovery} from '@/lib/web3/wallet-error-detector'
import {arbitrum, mainnet, polygon} from '@reown/appkit/networks'
import {useAppKit} from '@reown/appkit/react'
import {useCallback, useState} from 'react'
import {useAccount, useChainId, useDisconnect, useSwitchChain} from 'wagmi'

import {useWalletPersistence} from './use-wallet-persistence'

// Supported chain IDs for network validation
const SUPPORTED_CHAIN_IDS = [mainnet.id, polygon.id, arbitrum.id] as const

// Network information mapping
const NETWORK_INFO = {
  [mainnet.id]: {name: 'Ethereum Mainnet', symbol: 'ETH'},
  [polygon.id]: {name: 'Polygon', symbol: 'MATIC'},
  [arbitrum.id]: {name: 'Arbitrum One', symbol: 'ETH'},
} as const

export type SupportedChainId = (typeof SUPPORTED_CHAIN_IDS)[number]

export interface NetworkInfo {
  name: string
  symbol: string
}

export interface NetworkValidationError extends Error {
  code:
    | 'UNSUPPORTED_NETWORK'
    | 'NETWORK_SWITCH_FAILED'
    | 'NETWORK_VALIDATION_FAILED'
    | 'CONNECTION_ON_UNSUPPORTED_NETWORK'
    | 'CONNECTION_TIMEOUT'
    | 'CONNECTION_REJECTED'
    | 'WALLET_NOT_FOUND'
    | 'WALLET_LOCKED'
    | 'RPC_ENDPOINT_FAILED'
    | 'INSUFFICIENT_PERMISSIONS'
  chainId?: number
  suggestedChainId?: SupportedChainId
  userFriendlyMessage?: string
  originalError?: Error
}

export interface UnsupportedNetworkError {
  isUnsupported: boolean
  currentChainId?: number
  suggestedChain: {id: SupportedChainId; name: string}
  error: NetworkValidationError
}

export function useWallet() {
  const {open} = useAppKit()
  const {address, isConnected, isConnecting, isReconnecting} = useAccount()
  const {disconnect} = useDisconnect()
  const chainId = useChainId()
  const {switchChain, isPending: isSwitchingChain, error: switchChainError} = useSwitchChain()

  const [error, setError] = useState<WalletSpecificError | null>(null)
  const clearError = useCallback(() => setError(null), [])

  // Integration with wallet persistence
  const persistence = useWalletPersistence({
    debug: process.env.NODE_ENV === 'development',
  })

  // Network validation functions
  const isSupportedChain = (chainId: number): chainId is SupportedChainId => {
    return SUPPORTED_CHAIN_IDS.includes(chainId as SupportedChainId)
  }

  const isCurrentChainSupported = () => {
    return chainId ? isSupportedChain(chainId) : false
  }

  const getCurrentNetworkInfo = (): NetworkInfo | null => {
    if (!chainId || !isSupportedChain(chainId)) {
      return null
    }
    return NETWORK_INFO[chainId]
  }

  // Enhanced error handling for unsupported networks
  const getUnsupportedNetworkError = (): UnsupportedNetworkError | null => {
    if (!chainId) {
      return null
    }

    if (isSupportedChain(chainId)) {
      return null
    }

    // User is on an unsupported network - create comprehensive error
    const suggestedChain = {id: mainnet.id, name: NETWORK_INFO[mainnet.id].name}
    const error = new Error(
      `You're currently connected to an unsupported network (Chain ID: ${chainId}). Please switch to a supported network to continue.`,
    ) as NetworkValidationError

    error.code = 'UNSUPPORTED_NETWORK'
    error.chainId = chainId
    error.suggestedChainId = suggestedChain.id
    error.userFriendlyMessage = `Unsupported Network Detected. Switch to ${suggestedChain.name} to continue using the app.`

    return {
      isUnsupported: true,
      currentChainId: chainId,
      suggestedChain,
      error,
    }
  }

  // Handle automatic network switching with user consent
  const handleUnsupportedNetwork = async (autoSwitch = false): Promise<boolean> => {
    const unsupportedError = getUnsupportedNetworkError()

    if (!unsupportedError) {
      return true // Network is supported
    }

    try {
      if (autoSwitch) {
        // Attempt to switch to suggested network automatically
        await switchToChain(unsupportedError.suggestedChain.id)
        return true
      } else {
        // Log error for manual handling by UI components
        console.warn('Unsupported network detected:', unsupportedError.error.userFriendlyMessage)
        return false
      }
    } catch (switchError) {
      console.error('Failed to handle unsupported network:', switchError)
      return false
    }
  }

  // Enhanced connect function with wallet-specific error classification and persistence
  const handleConnect = async () => {
    try {
      await open()

      // Check for unsupported network after connection
      const unsupportedError = getUnsupportedNetworkError()
      if (unsupportedError) {
        console.warn('Connected to unsupported network:', unsupportedError.error.userFriendlyMessage)
        // Don't throw here - let UI components handle the warning
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error)

      // Use wallet-specific error classification
      const walletError = classifyWalletError(error as Error, {
        action: 'connect',
        chainId,
      })

      // Enhance with recovery actions for better UX
      const recoveryActions = getWalletErrorRecovery(walletError)

      // Add recovery information to the error
      const enhancedError = walletError as WalletSpecificError & {
        recoveryActions?: typeof recoveryActions
      }
      enhancedError.recoveryActions = recoveryActions

      throw enhancedError
    }
  }

  // Validate current network and create error if unsupported
  const validateCurrentNetwork = (): NetworkValidationError | null => {
    if (!chainId) {
      const error = new Error('No chain ID available') as NetworkValidationError
      error.code = 'NETWORK_VALIDATION_FAILED'
      error.userFriendlyMessage = 'Unable to detect network. Please check your wallet connection.'
      return error
    }

    if (!isSupportedChain(chainId)) {
      const error = new Error(
        `Unsupported network: Chain ID ${chainId}. Please switch to a supported network: Ethereum Mainnet, Polygon, or Arbitrum One.`,
      ) as NetworkValidationError
      error.code = 'UNSUPPORTED_NETWORK'
      error.chainId = chainId
      error.suggestedChainId = mainnet.id
      error.userFriendlyMessage = `Please switch to a supported network. Current network (${chainId}) is not supported.`
      return error
    }

    return null
  }

  const handleDisconnect = async () => {
    try {
      disconnect()

      // Clear persistence data when user manually disconnects
      if (persistence.isAvailable) {
        await persistence.clearStoredData()
      }
    } catch (error) {
      console.error('Failed to disconnect wallet:', error)
      // Graceful fallback - don't throw on disconnect errors
      // UI components should handle disconnect failures gracefully
    }
  }

  // Safe chain switching with wallet-specific error classification
  const switchToChain = async (targetChainId: SupportedChainId) => {
    if (!isSupportedChain(targetChainId)) {
      const error = new Error(
        `Cannot switch to unsupported chain ID: ${String(targetChainId)}`,
      ) as NetworkValidationError
      error.code = 'UNSUPPORTED_NETWORK'
      error.chainId = targetChainId
      error.userFriendlyMessage = `Cannot switch to chain ${String(targetChainId)}. This network is not supported.`
      throw error
    }

    try {
      switchChain({chainId: targetChainId})
    } catch (error) {
      console.error(`Failed to switch to chain ${targetChainId}:`, error)

      // Use wallet-specific error classification for chain switching
      const walletError = classifyWalletError(error as Error, {
        action: 'switch_chain',
        chainId: targetChainId,
      })

      // Enhance error message with target network name
      const networkName = NETWORK_INFO[targetChainId].name
      walletError.userFriendlyMessage = walletError.userFriendlyMessage.replaceAll(
        /switch to [^.]+/gi,
        `switch to ${networkName}`,
      )

      // Add recovery actions
      const recoveryActions = getWalletErrorRecovery(walletError)
      const enhancedError = walletError as WalletSpecificError & {
        recoveryActions?: typeof recoveryActions
      }
      enhancedError.recoveryActions = recoveryActions
      enhancedError.chainId = targetChainId

      throw enhancedError
    }
  }

  // Get list of supported chains for UI
  const getSupportedChains = () => {
    return SUPPORTED_CHAIN_IDS.map(id => ({
      id,
      ...NETWORK_INFO[id],
    }))
  }

  return {
    address,
    isConnected,
    isConnecting,
    isReconnecting,
    connect: handleConnect,
    disconnect: handleDisconnect,

    chainId,
    currentNetwork: getCurrentNetworkInfo(),

    isCurrentChainSupported: isCurrentChainSupported(),
    isSupportedChain,
    validateCurrentNetwork,

    getUnsupportedNetworkError,
    handleUnsupportedNetwork,

    switchToChain,
    isSwitchingChain,
    switchChainError,

    getSupportedChains,

    error,
    clearError,

    classifyWalletError: (error: Error, context?: Parameters<typeof classifyWalletError>[1]) =>
      classifyWalletError(error, context),
    getWalletErrorRecovery,

    persistence: {
      isAvailable: persistence.isAvailable,
      autoReconnect: persistence.autoReconnect,
      lastWalletId: persistence.lastWalletId,
      preferredChain: persistence.preferredChain,
      lastConnectionData: persistence.lastConnectionData,
      isRestoring: persistence.isRestoring,
      error: persistence.error,
      setAutoReconnect: persistence.setAutoReconnect,
      setPreferredChain: persistence.setPreferredChain,
      clearStoredData: persistence.clearStoredData,
      shouldRestore: persistence.shouldRestore,
      getConnectionAge: persistence.getConnectionAge,
    },
  }
}
