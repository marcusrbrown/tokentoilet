'use client'

import type {Connector} from 'wagmi'

import {useAppKit} from '@reown/appkit/react'
import {useCallback, useMemo} from 'react'
import {useAccount, useConnect, useConnections, useDisconnect, useSwitchAccount} from 'wagmi'

import {useWallet} from './use-wallet'

export interface ConnectedWallet {
  /** Unique identifier for the wallet connection */
  id: string
  /** Wallet connector instance */
  connector: Connector
  /** Connected address */
  address: string
  /** Whether this is the currently active wallet */
  isActive: boolean
  /** Connection chain ID */
  chainId: number
  /** Formatted display name for the wallet type */
  walletName: string
  /** Whether the wallet is on a supported network */
  isSupported: boolean
}

export interface WalletSwitcherState {
  /** List of all connected wallets */
  connectedWallets: ConnectedWallet[]
  /** Currently active wallet */
  activeWallet: ConnectedWallet | null
  /** Whether switching operation is in progress */
  isSwitching: boolean
  /** Error from switching operation */
  switchError: Error | null
  /** Whether connecting new wallet is in progress */
  isConnecting: boolean
  /** Available connectors for new connections */
  availableConnectors: Connector[]
}

export interface WalletSwitcherActions {
  /** Switch to a different connected wallet */
  switchToWallet: (walletId: string) => Promise<void>
  /** Connect a new wallet */
  connectNewWallet: (connector: Connector) => Promise<void>
  /** Disconnect a specific wallet */
  disconnectWallet: (walletId: string) => Promise<void>
  /** Disconnect all wallets */
  disconnectAll: () => Promise<void>
  /** Open the main wallet connection modal */
  openWalletModal: () => void
}

/**
 * Enhanced wallet management hook for handling multiple connected wallets
 *
 * Provides functionality to:
 * - View all connected wallets across different providers
 * - Switch between connected wallets
 * - Connect additional wallets
 * - Disconnect specific wallets
 * - Manage wallet state and errors
 */
export function useWalletSwitcher(): WalletSwitcherState & WalletSwitcherActions {
  const {open} = useAppKit()
  const {address: currentAddress, connector: activeConnector} = useAccount()
  const connections = useConnections()
  const {connect, connectors, isPending: isConnecting} = useConnect()
  const {disconnect} = useDisconnect()
  const {switchAccount, isPending: isSwitching, error: switchError} = useSwitchAccount()

  // Use our custom wallet hook for enhanced functionality
  const {isSupportedChain} = useWallet()

  // Transform connections into connected wallets with enhanced information
  const connectedWallets = useMemo<ConnectedWallet[]>(() => {
    return connections.map(connection => {
      const isActive = currentAddress === connection.accounts[0] && activeConnector?.uid === connection.connector.uid

      // Determine wallet display name from connector
      const getWalletName = (connector: Connector): string => {
        const name = connector.name.toLowerCase()
        if (name.includes('metamask')) return 'MetaMask'
        if (name.includes('walletconnect') || name.includes('wallet connect')) return 'WalletConnect'
        if (name.includes('coinbase')) return 'Coinbase Wallet'
        if (name.includes('rabby')) return 'Rabby Wallet'
        if (name.includes('rainbow')) return 'Rainbow'
        if (name.includes('safe')) return 'Safe'
        if (name.includes('ledger')) return 'Ledger'
        if (name.includes('injected')) return 'Browser Wallet'

        // Fallback to connector name with proper capitalization
        return connector.name.charAt(0).toUpperCase() + connector.name.slice(1)
      }

      return {
        id: `${connection.connector.uid}-${connection.accounts[0]}`,
        connector: connection.connector,
        address: connection.accounts[0],
        isActive,
        chainId: connection.chainId,
        walletName: getWalletName(connection.connector),
        isSupported: isSupportedChain(connection.chainId),
      }
    })
  }, [connections, currentAddress, activeConnector, isSupportedChain])

  // Get currently active wallet
  const activeWallet = useMemo<ConnectedWallet | null>(() => {
    return connectedWallets.find(wallet => wallet.isActive) || null
  }, [connectedWallets])

  // Get available connectors that aren't already connected
  const availableConnectors = useMemo<Connector[]>(() => {
    const connectedConnectorIds = new Set(connections.map(conn => conn.connector.uid))
    return connectors.filter(connector => !connectedConnectorIds.has(connector.uid))
  }, [connectors, connections])

  // Switch to a specific connected wallet
  const switchToWallet = useCallback(
    async (walletId: string): Promise<void> => {
      const targetWallet = connectedWallets.find(wallet => wallet.id === walletId)

      if (!targetWallet) {
        throw new Error(`Wallet with ID ${walletId} not found in connected wallets`)
      }

      if (targetWallet.isActive) {
        // Already active, no need to switch
        return
      }

      try {
        switchAccount({connector: targetWallet.connector})
      } catch (error) {
        console.error(`Failed to switch to wallet ${walletId}:`, error)
        throw new Error(`Failed to switch to ${targetWallet.walletName}. Please try again.`)
      }
    },
    [connectedWallets, switchAccount],
  )

  // Connect a new wallet
  const connectNewWallet = useCallback(
    async (connector: Connector): Promise<void> => {
      try {
        connect({connector})
      } catch (error) {
        console.error(`Failed to connect wallet ${connector.name}:`, error)
        throw new Error(`Failed to connect ${connector.name}. Please try again.`)
      }
    },
    [connect],
  )

  // Disconnect a specific wallet
  const disconnectWallet = useCallback(
    async (walletId: string): Promise<void> => {
      const targetWallet = connectedWallets.find(wallet => wallet.id === walletId)

      if (!targetWallet) {
        throw new Error(`Wallet with ID ${walletId} not found in connected wallets`)
      }

      try {
        disconnect({connector: targetWallet.connector})
      } catch (error) {
        console.error(`Failed to disconnect wallet ${walletId}:`, error)
        throw new Error(`Failed to disconnect ${targetWallet.walletName}. Please try again.`)
      }
    },
    [connectedWallets, disconnect],
  )

  const disconnectAll = useCallback(async (): Promise<void> => {
    try {
      // Disconnect all connections
      connections.forEach(connection => disconnect({connector: connection.connector}))
    } catch (error) {
      console.error('Failed to disconnect all wallets:', error)
      throw new Error('Failed to disconnect all wallets. Please try again.')
    }
  }, [connections, disconnect])

  // Open wallet connection modal
  const openWalletModal = useCallback(() => {
    open().catch(console.error)
  }, [open])

  return {
    // State
    connectedWallets,
    activeWallet,
    isSwitching,
    switchError,
    isConnecting,
    availableConnectors,

    // Actions
    switchToWallet,
    connectNewWallet,
    disconnectWallet,
    disconnectAll,
    openWalletModal,
  }
}
