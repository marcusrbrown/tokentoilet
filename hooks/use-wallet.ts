'use client'

import {arbitrum, mainnet, polygon} from '@reown/appkit/networks'
import {useAppKit} from '@reown/appkit/react'
import {useAccount, useChainId, useDisconnect, useSwitchChain} from 'wagmi'

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
  chainId?: number
  suggestedChainId?: SupportedChainId
  userFriendlyMessage?: string
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

  // Enhanced connect function with unsupported network handling
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

      // Create enhanced error for connection failures
      const connectionError = new Error('Failed to connect wallet') as NetworkValidationError
      connectionError.code = 'NETWORK_VALIDATION_FAILED'
      connectionError.userFriendlyMessage = 'Unable to connect wallet. Please try again or check your wallet extension.'
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

  // Enhanced disconnect function
  const handleDisconnect = async () => {
    try {
      disconnect()
    } catch (error) {
      console.error('Failed to disconnect wallet:', error)

      // Create enhanced error for disconnect failures
      const disconnectError = new Error('Failed to disconnect wallet') as NetworkValidationError
      disconnectError.code = 'NETWORK_VALIDATION_FAILED'
      disconnectError.userFriendlyMessage = 'Unable to disconnect wallet. Please try refreshing the page.'
      throw disconnectError
    }
  }

  // Safe chain switching with validation
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
      networkError.code = 'NETWORK_SWITCH_FAILED'
      networkError.chainId = targetChainId
      networkError.userFriendlyMessage = `Unable to switch to ${NETWORK_INFO[targetChainId].name}. Please try again or switch manually in your wallet.`
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
  }
}
