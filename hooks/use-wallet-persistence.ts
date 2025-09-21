'use client'

import {walletStorage, type WalletConnectionData} from '@/lib/web3/secure-storage'
import {useCallback, useEffect, useState} from 'react'

export interface WalletPersistenceConfig {
  // Auto-reconnect timeout in milliseconds (default: 30 seconds)
  reconnectTimeout?: number
  // Maximum age for stored connection data in milliseconds (default: 7 days)
  maxConnectionAge?: number
  // Whether to log persistence operations for debugging
  debug?: boolean
}

export interface WalletPersistenceState {
  // Whether persistence is enabled and available
  isAvailable: boolean
  // Whether auto-reconnect is enabled
  autoReconnect: boolean
  // Last connected wallet ID
  lastWalletId: string | null
  // Preferred chain ID
  preferredChain: number | null
  // Connection data from last session
  lastConnectionData: WalletConnectionData | null
  // Loading state during restoration
  isRestoring: boolean
  // Error state
  error: string | null
}

export interface WalletPersistenceActions {
  // Save current wallet connection state
  saveConnectionState: (walletId: string, chainId: number) => Promise<boolean>
  // Clear all stored connection data
  clearStoredData: () => Promise<boolean>
  // Set auto-reconnect preference
  setAutoReconnect: (enabled: boolean) => Promise<boolean>
  // Set preferred chain
  setPreferredChain: (chainId: number) => Promise<boolean>
  // Update last active timestamp
  updateLastActive: () => void
  // Check if a connection should be restored
  shouldRestore: () => boolean
  // Get connection age in milliseconds
  getConnectionAge: () => number | null
}

const DEFAULT_CONFIG: Required<WalletPersistenceConfig> = {
  reconnectTimeout: 30000, // 30 seconds
  maxConnectionAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  debug: false,
}

/**
 * Hook for managing wallet connection persistence across browser sessions
 */
export function useWalletPersistence(
  config: WalletPersistenceConfig = {},
): WalletPersistenceState & WalletPersistenceActions {
  const finalConfig = {...DEFAULT_CONFIG, ...config}

  // State management
  const [state, setState] = useState<WalletPersistenceState>({
    isAvailable: false,
    autoReconnect: true,
    lastWalletId: null,
    preferredChain: null,
    lastConnectionData: null,
    isRestoring: true,
    error: null,
  })

  // Debug logging helper
  const debugLog = useCallback(
    (message: string, data?: unknown) => {
      if (finalConfig.debug) {
        console.warn(`[WalletPersistence] ${message}`, data)
      }
    },
    [finalConfig.debug],
  )

  // Initialize persistence state
  useEffect(() => {
    const initializePersistence = async () => {
      try {
        debugLog('Initializing wallet persistence')

        // Check if storage is available
        const isStorageAvailable = typeof window !== 'undefined' && Boolean(window.localStorage)

        if (!isStorageAvailable) {
          debugLog('Storage not available')
          setState(prev => ({
            ...prev,
            isAvailable: false,
            isRestoring: false,
            error: 'Local storage not available',
          }))
          return
        }

        // Load stored data
        const connectionData = walletStorage.getConnectionData()
        const lastWalletId = walletStorage.getLastWalletId()
        const preferredChain = walletStorage.getPreferredChain()
        const autoReconnect = walletStorage.getAutoReconnect()

        debugLog('Loaded stored data', {
          connectionData,
          lastWalletId,
          preferredChain,
          autoReconnect,
        })

        // Validate connection data age
        let validConnectionData: WalletConnectionData | null = null
        if (connectionData) {
          const age = Date.now() - connectionData.connectedAt
          if (age <= finalConfig.maxConnectionAge) {
            validConnectionData = connectionData
            debugLog(`Connection data is valid (age: ${Math.round(age / 1000 / 60)} minutes)`)
          } else {
            debugLog(`Connection data expired (age: ${Math.round(age / 1000 / 60 / 60)} hours)`)
            // Clear expired data
            walletStorage.clear()
          }
        }

        setState(prev => ({
          ...prev,
          isAvailable: true,
          autoReconnect,
          lastWalletId,
          preferredChain,
          lastConnectionData: validConnectionData,
          isRestoring: false,
          error: null,
        }))

        debugLog('Persistence initialization complete')
      } catch (error) {
        console.error('Failed to initialize wallet persistence:', error)
        setState(prev => ({
          ...prev,
          isAvailable: false,
          isRestoring: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }))
      }
    }

    initializePersistence().catch(error => {
      console.error('Failed to initialize persistence:', error)
    })
  }, [finalConfig.maxConnectionAge, debugLog])

  // Save connection state
  const saveConnectionState = useCallback(
    async (walletId: string, chainId: number): Promise<boolean> => {
      try {
        if (!state.isAvailable) {
          debugLog('Storage not available, cannot save connection state')
          return false
        }

        const now = Date.now()
        const connectionData: WalletConnectionData = {
          walletId,
          chainId,
          connectedAt: now,
          lastActiveAt: now,
          autoReconnect: state.autoReconnect,
        }

        const success =
          walletStorage.setConnectionData(connectionData) &&
          walletStorage.setLastWalletId(walletId) &&
          walletStorage.setPreferredChain(chainId)

        if (success) {
          setState(prev => ({
            ...prev,
            lastWalletId: walletId,
            preferredChain: chainId,
            lastConnectionData: connectionData,
            error: null,
          }))
          debugLog('Connection state saved successfully', connectionData)
        } else {
          debugLog('Failed to save connection state')
        }

        return success
      } catch (error) {
        console.error('Error saving connection state:', error)
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to save connection state',
        }))
        return false
      }
    },
    [state.isAvailable, state.autoReconnect, debugLog],
  )

  // Clear stored data
  const clearStoredData = useCallback(async (): Promise<boolean> => {
    try {
      const success = walletStorage.clear()

      if (success) {
        setState(prev => ({
          ...prev,
          lastWalletId: null,
          preferredChain: null,
          lastConnectionData: null,
          error: null,
        }))
        debugLog('Stored data cleared successfully')
      } else {
        debugLog('Failed to clear stored data')
      }

      return success
    } catch (error) {
      console.error('Error clearing stored data:', error)
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to clear stored data',
      }))
      return false
    }
  }, [debugLog])

  // Set auto-reconnect preference
  const setAutoReconnect = useCallback(
    async (enabled: boolean): Promise<boolean> => {
      try {
        if (!state.isAvailable) {
          debugLog('Storage not available, cannot set auto-reconnect')
          return false
        }

        const success = walletStorage.setAutoReconnect(enabled)

        if (success) {
          setState(prev => ({
            ...prev,
            autoReconnect: enabled,
            error: null,
          }))
          debugLog(`Auto-reconnect ${enabled ? 'enabled' : 'disabled'}`)
        } else {
          debugLog('Failed to set auto-reconnect preference')
        }

        return success
      } catch (error) {
        console.error('Error setting auto-reconnect:', error)
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to set auto-reconnect',
        }))
        return false
      }
    },
    [state.isAvailable, debugLog],
  )

  // Set preferred chain
  const setPreferredChain = useCallback(
    async (chainId: number): Promise<boolean> => {
      try {
        if (!state.isAvailable) {
          debugLog('Storage not available, cannot set preferred chain')
          return false
        }

        const success = walletStorage.setPreferredChain(chainId)

        if (success) {
          setState(prev => ({
            ...prev,
            preferredChain: chainId,
            error: null,
          }))
          debugLog(`Preferred chain set to ${chainId}`)
        } else {
          debugLog('Failed to set preferred chain')
        }

        return success
      } catch (error) {
        console.error('Error setting preferred chain:', error)
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to set preferred chain',
        }))
        return false
      }
    },
    [state.isAvailable, debugLog],
  )

  // Update last active timestamp
  const updateLastActive = useCallback(() => {
    try {
      if (state.isAvailable && state.lastConnectionData) {
        walletStorage.updateLastActive()
        debugLog('Last active timestamp updated')
      }
    } catch (error) {
      console.error('Error updating last active timestamp:', error)
    }
  }, [state.isAvailable, state.lastConnectionData, debugLog])

  // Check if connection should be restored
  const shouldRestore = useCallback((): boolean => {
    if (!state.isAvailable || !state.autoReconnect || !state.lastConnectionData) {
      return false
    }

    const age = Date.now() - state.lastConnectionData.connectedAt
    const shouldRestoreBasedOnAge = age <= finalConfig.maxConnectionAge
    const shouldRestoreBasedOnActivity =
      Date.now() - state.lastConnectionData.lastActiveAt <= finalConfig.reconnectTimeout

    debugLog('Should restore check', {
      age: Math.round(age / 1000 / 60),
      maxAge: Math.round(finalConfig.maxConnectionAge / 1000 / 60),
      shouldRestoreBasedOnAge,
      shouldRestoreBasedOnActivity,
    })

    return shouldRestoreBasedOnAge && shouldRestoreBasedOnActivity
  }, [
    state.isAvailable,
    state.autoReconnect,
    state.lastConnectionData,
    finalConfig.maxConnectionAge,
    finalConfig.reconnectTimeout,
    debugLog,
  ])

  // Get connection age
  const getConnectionAge = useCallback((): number | null => {
    if (!state.lastConnectionData) {
      return null
    }
    return Date.now() - state.lastConnectionData.connectedAt
  }, [state.lastConnectionData])

  return {
    // State
    isAvailable: state.isAvailable,
    autoReconnect: state.autoReconnect,
    lastWalletId: state.lastWalletId,
    preferredChain: state.preferredChain,
    lastConnectionData: state.lastConnectionData,
    isRestoring: state.isRestoring,
    error: state.error,

    // Actions
    saveConnectionState,
    clearStoredData,
    setAutoReconnect,
    setPreferredChain,
    updateLastActive,
    shouldRestore,
    getConnectionAge,
  }
}
