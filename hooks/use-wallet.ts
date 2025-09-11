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
  code: 'UNSUPPORTED_NETWORK' | 'NETWORK_SWITCH_FAILED' | 'NETWORK_VALIDATION_FAILED'
  chainId?: number
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

  // Validate current network and create error if unsupported
  const validateCurrentNetwork = (): NetworkValidationError | null => {
    if (!chainId) {
      const error = new Error('No chain ID available') as NetworkValidationError
      error.code = 'NETWORK_VALIDATION_FAILED'
      return error
    }

    if (!isSupportedChain(chainId)) {
      const error = new Error(
        `Unsupported network: Chain ID ${chainId}. Please switch to a supported network: Ethereum Mainnet, Polygon, or Arbitrum One.`,
      ) as NetworkValidationError
      error.code = 'UNSUPPORTED_NETWORK'
      error.chainId = chainId
      return error
    }

    return null
  }

  // Enhanced connect function with network validation
  const handleConnect = async () => {
    try {
      await open()
      // Note: Network validation will be checked after connection via isCurrentChainSupported
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      throw error
    }
  }

  // Enhanced disconnect function
  const handleDisconnect = async () => {
    try {
      disconnect()
    } catch (error) {
      console.error('Failed to disconnect wallet:', error)
      throw error
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

    // Network switching
    switchToChain,
    isSwitchingChain,
    switchChainError,

    // Utility functions
    getSupportedChains,
  }
}
