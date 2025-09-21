'use client'

import {arbitrum, mainnet, polygon} from '@reown/appkit/networks'
import {useAppKit} from '@reown/appkit/react'
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
  const {address, isConnected} = useAccount()
  const {disconnect} = useDisconnect()
  const chainId = useChainId()
  const {switchChain, isPending: isSwitchingChain, error: switchChainError} = useSwitchChain()

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

  // Enhanced connect function with detailed error classification and persistence
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

      // Classify and enhance error based on error message/type
      const connectionError = new Error('Failed to connect wallet') as NetworkValidationError
      connectionError.originalError = error as Error

      const errorMessage = (error as Error).message.toLowerCase()

      if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
        connectionError.code = 'CONNECTION_TIMEOUT'
        connectionError.userFriendlyMessage =
          'Connection timed out. Please check your internet connection and try again.'
      } else if (
        errorMessage.includes('rejected') ||
        errorMessage.includes('denied') ||
        errorMessage.includes('cancelled')
      ) {
        connectionError.code = 'CONNECTION_REJECTED'
        connectionError.userFriendlyMessage =
          'Connection was rejected. Please accept the wallet connection request to continue.'
      } else if (
        errorMessage.includes('not found') ||
        errorMessage.includes('no wallet') ||
        errorMessage.includes('extension')
      ) {
        connectionError.code = 'WALLET_NOT_FOUND'
        connectionError.userFriendlyMessage =
          'No wallet extension found. Please install a supported wallet like MetaMask.'
      } else if (errorMessage.includes('locked') || errorMessage.includes('unlock')) {
        connectionError.code = 'WALLET_LOCKED'
        connectionError.userFriendlyMessage = 'Wallet is locked. Please unlock your wallet and try again.'
      } else if (
        errorMessage.includes('rpc') ||
        errorMessage.includes('network') ||
        errorMessage.includes('endpoint')
      ) {
        connectionError.code = 'RPC_ENDPOINT_FAILED'
        connectionError.userFriendlyMessage =
          'Network connection failed. Please check your internet connection and try again.'
      } else if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
        connectionError.code = 'INSUFFICIENT_PERMISSIONS'
        connectionError.userFriendlyMessage =
          'Insufficient permissions. Please check your wallet settings and try again.'
      } else {
        connectionError.code = 'NETWORK_VALIDATION_FAILED'
        connectionError.userFriendlyMessage =
          'Unable to connect wallet. Please try again or check your wallet extension.'
      }

      throw connectionError
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

  // Enhanced disconnect function with persistence cleanup
  const handleDisconnect = async () => {
    try {
      disconnect()

      // Clear persistence data when user manually disconnects
      if (persistence.isAvailable) {
        await persistence.clearStoredData()
      }
    } catch (error) {
      console.error('Failed to disconnect wallet:', error)

      // Create enhanced error for disconnect failures
      const disconnectError = new Error('Failed to disconnect wallet') as NetworkValidationError
      disconnectError.code = 'NETWORK_VALIDATION_FAILED'
      disconnectError.userFriendlyMessage = 'Unable to disconnect wallet. Please try refreshing the page.'
      throw disconnectError
    }
  }

  // Safe chain switching with enhanced error classification
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

      const networkError = new Error(
        `Failed to switch to ${NETWORK_INFO[targetChainId].name}`,
      ) as NetworkValidationError
      networkError.originalError = error as Error
      networkError.chainId = targetChainId

      const errorMessage = (error as Error).message.toLowerCase()

      if (errorMessage.includes('rejected') || errorMessage.includes('denied') || errorMessage.includes('cancelled')) {
        networkError.code = 'CONNECTION_REJECTED'
        networkError.userFriendlyMessage = `Network switch was rejected. Please accept the request to switch to ${NETWORK_INFO[targetChainId].name}.`
      } else if (errorMessage.includes('rpc') || errorMessage.includes('endpoint')) {
        networkError.code = 'RPC_ENDPOINT_FAILED'
        networkError.userFriendlyMessage = `RPC endpoint failed for ${NETWORK_INFO[targetChainId].name}. Please try again later.`
      } else if (errorMessage.includes('timeout')) {
        networkError.code = 'CONNECTION_TIMEOUT'
        networkError.userFriendlyMessage = `Request timed out while switching to ${NETWORK_INFO[targetChainId].name}. Please try again.`
      } else if (errorMessage.includes('locked')) {
        networkError.code = 'WALLET_LOCKED'
        networkError.userFriendlyMessage = `Wallet is locked. Please unlock your wallet and try switching to ${NETWORK_INFO[targetChainId].name} again.`
      } else {
        networkError.code = 'NETWORK_SWITCH_FAILED'
        networkError.userFriendlyMessage = `Unable to switch to ${NETWORK_INFO[targetChainId].name}. Please try again or switch manually in your wallet.`
      }

      throw networkError
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
    // Basic wallet functionality
    address,
    isConnected,
    connect: handleConnect,
    disconnect: handleDisconnect,

    // Network information
    chainId,
    currentNetwork: getCurrentNetworkInfo(),

    // Network validation
    isCurrentChainSupported: isCurrentChainSupported(),
    isSupportedChain,
    validateCurrentNetwork,

    // Enhanced error handling for unsupported networks
    getUnsupportedNetworkError,
    handleUnsupportedNetwork,

    // Network switching
    switchToChain,
    isSwitchingChain,
    switchChainError,

    // Utility functions
    getSupportedChains,

    // Persistence functionality
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
