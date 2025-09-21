'use client'

import type {ReactNode} from 'react'
import {useWallet} from '@/hooks/use-wallet'
import {useWalletPersistence} from '@/hooks/use-wallet-persistence'
import {useAppKit} from '@reown/appkit/react'
import {useEffect, useRef} from 'react'

interface WalletAutoConnectProps {
  children: ReactNode
  // Configuration for persistence behavior
  enableAutoReconnect?: boolean
  reconnectDelay?: number
  debug?: boolean
}

/**
 * Component that handles automatic wallet reconnection based on stored persistence data
 */
export function WalletAutoConnect({
  children,
  enableAutoReconnect = true,
  reconnectDelay = 1000,
  debug = false,
}: WalletAutoConnectProps) {
  const {open} = useAppKit()
  const {address, isConnected, chainId} = useWallet()
  const hasAttemptedReconnect = useRef(false)

  const {
    isAvailable,
    autoReconnect,
    lastWalletId,
    preferredChain,
    isRestoring,
    shouldRestore,
    saveConnectionState,
    updateLastActive,
    clearStoredData,
  } = useWalletPersistence({
    debug,
    reconnectTimeout: 30000, // 30 seconds
    maxConnectionAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  })

  // Auto-reconnect logic
  useEffect(() => {
    if (
      !enableAutoReconnect ||
      !isAvailable ||
      !autoReconnect ||
      isConnected ||
      isRestoring ||
      hasAttemptedReconnect.current
    ) {
      return
    }

    if (shouldRestore() && typeof lastWalletId === 'string' && lastWalletId.length > 0) {
      hasAttemptedReconnect.current = true

      if (debug) {
        console.warn('[WalletAutoConnect] Attempting to restore connection to wallet:', lastWalletId, {
          preferredChain,
        })
      }

      // Delay the reconnection attempt to avoid conflicts with initial app setup
      const timeoutId = setTimeout(() => {
        const attemptReconnect = async () => {
          try {
            await open()
          } catch (error) {
            console.error('Auto-reconnect failed:', error)
            // Clear invalid connection data if auto-reconnect fails
            await clearStoredData()
          }
        }

        attemptReconnect().catch(error => {
          console.error('Failed to execute auto-reconnect:', error)
        })
      }, reconnectDelay)

      return () => {
        clearTimeout(timeoutId)
      }
    }
  }, [
    enableAutoReconnect,
    isAvailable,
    autoReconnect,
    isConnected,
    isRestoring,
    shouldRestore,
    lastWalletId,
    preferredChain,
    open,
    clearStoredData,
    reconnectDelay,
    debug,
  ])

  // Save connection state when wallet connects
  useEffect(() => {
    if (isConnected && typeof address === 'string' && address.length > 0 && typeof chainId === 'number') {
      // Extract wallet ID from connector - this is a simplified approach
      // In a real implementation, you might need to get this from the connector
      const walletId = 'connected_wallet' // Placeholder - would be actual wallet identifier

      saveConnectionState(walletId, chainId)
        .then(success => {
          if (debug && success) {
            console.warn('[WalletAutoConnect] Connection state saved:', {walletId, chainId})
          }
        })
        .catch(error => {
          console.error('Failed to save connection state:', error)
        })
    }
  }, [isConnected, address, chainId, saveConnectionState, debug])

  // Update last active timestamp periodically
  useEffect(() => {
    if (!isConnected) return

    // Update immediately
    updateLastActive()

    // Set up periodic updates (every 5 minutes)
    const intervalId = setInterval(
      () => {
        updateLastActive()
      },
      5 * 60 * 1000,
    )

    return () => {
      clearInterval(intervalId)
    }
  }, [isConnected, updateLastActive])

  // Clear stored data when user manually disconnects
  useEffect(() => {
    if (!isConnected && hasAttemptedReconnect.current) {
      // Only clear if we previously had a connection (prevent clearing on initial load)
      clearStoredData()
        .then(() => {
          if (debug) {
            console.warn('[WalletAutoConnect] Cleared stored data after disconnect')
          }
        })
        .catch(error => {
          console.error('Failed to clear stored data:', error)
        })
      hasAttemptedReconnect.current = false
    }
  }, [isConnected, clearStoredData, debug])

  return <>{children}</>
}
