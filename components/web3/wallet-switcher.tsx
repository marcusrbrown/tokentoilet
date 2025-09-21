'use client'

import type {Connector} from 'wagmi'

import {Badge} from '@/components/ui/badge'

import {Button} from '@/components/ui/button'
import {Card} from '@/components/ui/card'
import {formatAddress} from '@/lib/utils'
import {CheckCircle, ChevronDown, ExternalLink, Plus, RefreshCw, Wallet, X} from 'lucide-react'
import {useState} from 'react'

import {useWalletSwitcher, type ConnectedWallet} from '../../hooks/use-wallet-switcher'

export interface WalletSwitcherProps {
  /**
   * Optional className for custom styling
   */
  className?: string
  /**
   * Whether to show the dropdown in a compact mode
   * @default false
   */
  compact?: boolean
  /**
   * Maximum number of wallets to show before scrolling
   * @default 5
   */
  maxVisibleWallets?: number
  /**
   * Callback when a wallet is switched
   */
  onWalletSwitch?: (wallet: ConnectedWallet) => void
  /**
   * Callback when a new wallet is connected
   */
  onWalletConnect?: (connector: Connector) => void
  /**
   * Callback when a wallet is disconnected
   */
  onWalletDisconnect?: (walletId: string) => void
}

/**
 * Wallet switching interface component for managing multiple connected wallets
 *
 * Features:
 * - Display all connected wallets with status indicators
 * - Switch between connected wallets with one click
 * - Connect new wallets from available providers
 * - Disconnect specific wallets
 * - Network status indicators for each wallet
 * - Responsive dropdown interface
 */
export function WalletSwitcher({
  className = '',
  compact = false,
  maxVisibleWallets = 5,
  onWalletSwitch,
  onWalletConnect,
  onWalletDisconnect,
}: WalletSwitcherProps) {
  const {
    connectedWallets,
    activeWallet,
    isSwitching,
    isConnecting,
    availableConnectors,
    switchToWallet,
    connectNewWallet,
    disconnectWallet,
    openWalletModal,
  } = useWalletSwitcher()

  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [switchingWalletId, setSwitchingWalletId] = useState<string | null>(null)

  // Handle wallet switching with loading state
  const handleWalletSwitch = async (wallet: ConnectedWallet) => {
    if (wallet.isActive || isSwitching) return

    setSwitchingWalletId(wallet.id)
    try {
      await switchToWallet(wallet.id)
      onWalletSwitch?.(wallet)
      setIsDropdownOpen(false)
    } catch (error) {
      console.error('Failed to switch wallet:', error)
    } finally {
      setSwitchingWalletId(null)
    }
  }

  // Handle new wallet connection
  const handleConnectNewWallet = async (connector: Connector) => {
    try {
      await connectNewWallet(connector)
      onWalletConnect?.(connector)
      setIsDropdownOpen(false)
    } catch (error) {
      console.error('Failed to connect new wallet:', error)
    }
  }

  // Handle wallet disconnection
  const handleWalletDisconnect = async (walletId: string, event: React.MouseEvent) => {
    event.stopPropagation()

    try {
      await disconnectWallet(walletId)
      onWalletDisconnect?.(walletId)
    } catch (error) {
      console.error('Failed to disconnect wallet:', error)
    }
  }

  // Handle opening the main wallet modal for connecting new wallets
  const handleOpenWalletModal = () => {
    openWalletModal()
    setIsDropdownOpen(false)
  }

  // Get network badge color based on support status
  const getNetworkBadgeVariant = (wallet: ConnectedWallet) => {
    return wallet.isSupported ? 'default' : 'error'
  }

  // Get wallet icon based on wallet type
  const getWalletIcon = (_walletName: string) => {
    // Default wallet icon for all wallet types
    return <Wallet className="h-4 w-4" />
  }

  if (connectedWallets.length === 0) {
    return null
  }

  return (
    <div className={`relative ${className}`}>
      {/* Main wallet switcher button */}
      <Button
        variant="outline"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="glass-button flex items-center gap-2 min-w-[200px] justify-between"
        disabled={isSwitching}
        aria-expanded={isDropdownOpen}
        aria-haspopup="listbox"
        aria-label="Switch between connected wallets"
      >
        <div className="flex items-center gap-2">
          {activeWallet ? (
            <>
              {getWalletIcon(activeWallet.walletName)}
              <span className="font-medium">{activeWallet.walletName}</span>
              {!compact && <span className="text-muted-foreground text-sm">{formatAddress(activeWallet.address)}</span>}
            </>
          ) : (
            <>
              <Wallet className="h-4 w-4" />
              <span>Select Wallet</span>
            </>
          )}
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
      </Button>

      {/* Dropdown menu */}
      {isDropdownOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} aria-hidden="true" />

          {/* Dropdown content */}
          <Card className="absolute top-full mt-2 w-full min-w-[320px] z-50 glass-card border-violet-200 dark:border-violet-800">
            <div className="p-2">
              {/* Connected wallets header */}
              <div className="flex items-center justify-between px-2 py-1 mb-2">
                <span className="text-sm font-medium text-violet-900 dark:text-violet-100">
                  Connected Wallets ({connectedWallets.length})
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDropdownOpen(false)}
                  className="h-6 w-6 p-0"
                  aria-label="Close wallet switcher"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Connected wallets list */}
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {connectedWallets.slice(0, maxVisibleWallets).map(wallet => {
                  const isCurrentlySwitching = switchingWalletId === wallet.id

                  return (
                    <div
                      key={wallet.id}
                      className={`
                        group flex items-center justify-between p-3 rounded-lg transition-colors cursor-pointer
                        ${
                          wallet.isActive
                            ? 'bg-violet-50 dark:bg-violet-950/50 border border-violet-200 dark:border-violet-800'
                            : 'hover:bg-violet-50/50 dark:hover:bg-violet-950/20'
                        }
                      `}
                      onClick={() => {
                        handleWalletSwitch(wallet).catch(console.error)
                      }}
                      role="option"
                      aria-selected={wallet.isActive}
                      tabIndex={0}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleWalletSwitch(wallet).catch(console.error)
                        }
                      }}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Wallet icon and name */}
                        <div className="flex items-center gap-2">
                          {getWalletIcon(wallet.walletName)}
                          <span className="font-medium text-sm">{wallet.walletName}</span>
                        </div>

                        {/* Address and status */}
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-sm text-muted-foreground truncate">
                            {formatAddress(wallet.address)}
                          </span>

                          {/* Network status badge */}
                          <Badge variant={getNetworkBadgeVariant(wallet)} className="text-xs px-1.5 py-0.5">
                            Chain {wallet.chainId}
                          </Badge>
                        </div>

                        {/* Active indicator */}
                        {wallet.isActive && <CheckCircle className="h-4 w-4 text-violet-600 dark:text-violet-400" />}

                        {/* Loading indicator */}
                        {isCurrentlySwitching && (
                          <RefreshCw className="h-4 w-4 animate-spin text-violet-600 dark:text-violet-400" />
                        )}
                      </div>

                      {/* Disconnect button */}
                      {!wallet.isActive && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={e => {
                            handleWalletDisconnect(wallet.id, e).catch(console.error)
                          }}
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label={`Disconnect ${wallet.walletName}`}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Show more indicator if there are additional wallets */}
              {connectedWallets.length > maxVisibleWallets && (
                <div className="px-2 py-1 text-xs text-muted-foreground text-center">
                  +{connectedWallets.length - maxVisibleWallets} more wallet
                  {connectedWallets.length - maxVisibleWallets > 1 ? 's' : ''}
                </div>
              )}

              {/* Divider */}
              {availableConnectors.length > 0 && (
                <div className="border-t border-violet-200/50 dark:border-violet-800/50 my-2" />
              )}

              {/* Available connectors for new connections */}
              {availableConnectors.length > 0 && (
                <div>
                  <span className="text-sm font-medium text-violet-900 dark:text-violet-100 px-2 py-1 block">
                    Connect New Wallet
                  </span>
                  <div className="space-y-1 mt-1">
                    {availableConnectors.slice(0, 3).map(connector => (
                      <Button
                        key={connector.uid}
                        variant="ghost"
                        onClick={() => {
                          handleConnectNewWallet(connector).catch(console.error)
                        }}
                        disabled={isConnecting}
                        className="w-full justify-start text-sm p-2 h-auto"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {connector.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* All wallets button */}
              <div className="border-t border-violet-200/50 dark:border-violet-800/50 mt-2 pt-2">
                <Button variant="ghost" onClick={handleOpenWalletModal} className="w-full justify-start text-sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  All Wallet Options
                </Button>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
