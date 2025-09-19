'use client'

import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {Card} from '@/components/ui/card'
import {useWallet, type SupportedChainId} from '@/hooks/use-wallet'
import {formatAddress} from '@/lib/utils'
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Copy,
  ExternalLink,
  Info,
  Network,
  RefreshCw,
  Wallet,
  WifiOff,
  Zap,
} from 'lucide-react'
import React, {useState} from 'react'

export interface WalletDashboardProps {
  /**
   * Optional className for custom styling
   */
  className?: string
  /**
   * Whether to show the detailed connection info section
   * @default true
   */
  showConnectionDetails?: boolean
  /**
   * Whether to show network switching controls
   * @default true
   */
  showNetworkControls?: boolean
  /**
   * Callback when address is copied to clipboard
   */
  onAddressCopy?: (address: string) => void
  /**
   * Callback when wallet connection state changes
   */
  onConnectionStateChange?: (isConnected: boolean) => void
}

/**
 * Comprehensive wallet status dashboard component with detailed connection info
 *
 * Features:
 * - Real-time wallet connection status
 * - Network information and switching controls
 * - Account details with copy functionality
 * - Error state handling with recovery actions
 * - Comprehensive connection metadata display
 */
export function WalletDashboard({
  className,
  showConnectionDetails = true,
  showNetworkControls = true,
  onAddressCopy,
  onConnectionStateChange,
}: WalletDashboardProps) {
  const {
    address,
    isConnected,
    connect,
    disconnect,
    chainId,
    currentNetwork,
    isCurrentChainSupported,
    getUnsupportedNetworkError,
    handleUnsupportedNetwork,
    getSupportedChains,
    switchToChain,
    isSwitchingChain,
    switchChainError,
  } = useWallet()

  const [isConnecting, setIsConnecting] = useState(false)
  const [isHandlingNetwork, setIsHandlingNetwork] = useState(false)
  const [copiedAddress, setCopiedAddress] = useState(false)

  // Handle wallet connection with loading state
  const handleConnect = () => {
    setIsConnecting(true)
    connect()
      .then(() => {
        onConnectionStateChange?.(true)
      })
      .catch(error => {
        console.error('Failed to connect wallet:', error)
      })
      .finally(() => {
        setIsConnecting(false)
      })
  }

  // Handle wallet disconnection
  const handleDisconnect = () => {
    disconnect()
      .then(() => {
        onConnectionStateChange?.(false)
      })
      .catch(error => {
        console.error('Failed to disconnect wallet:', error)
      })
  }

  // Handle address copy to clipboard
  const handleCopyAddress = () => {
    if (typeof address !== 'string' || address.length === 0) return

    navigator.clipboard
      .writeText(address)
      .then(() => {
        setCopiedAddress(true)
        onAddressCopy?.(address)

        // Reset copy feedback after 2 seconds
        setTimeout(() => setCopiedAddress(false), 2000)
      })
      .catch(error => {
        console.error('Failed to copy address:', error)
      })
  }

  // Handle network switching with error handling
  const handleNetworkSwitch = (targetChainId: SupportedChainId) => {
    setIsHandlingNetwork(true)
    switchToChain(targetChainId)
      .catch(error => {
        console.error('Failed to switch network:', error)
      })
      .finally(() => {
        setIsHandlingNetwork(false)
      })
  }

  // Handle unsupported network with auto-switch
  const handleUnsupportedNetworkFix = () => {
    const unsupportedError = getUnsupportedNetworkError()
    if (!unsupportedError) return

    setIsHandlingNetwork(true)
    handleUnsupportedNetwork(true)
      .catch(error => {
        console.error('Failed to handle unsupported network:', error)
      })
      .finally(() => {
        setIsHandlingNetwork(false)
      })
  }

  const displayAddress = typeof address === 'string' ? formatAddress(address, 6) : ''
  const unsupportedNetworkError = getUnsupportedNetworkError()
  const supportedChains = getSupportedChains()

  // Get connection status details
  const getConnectionStatus = () => {
    if (!isConnected) {
      return {
        status: 'disconnected' as const,
        message: 'No wallet connected',
        icon: WifiOff,
        variant: 'disconnected' as const,
      }
    }

    if (!isCurrentChainSupported) {
      return {
        status: 'error' as const,
        message: 'Unsupported network',
        icon: AlertTriangle,
        variant: 'error' as const,
      }
    }

    return {
      status: 'connected' as const,
      message: 'Wallet connected',
      icon: CheckCircle,
      variant: 'connected' as const,
    }
  }

  const connectionStatus = getConnectionStatus()

  return (
    <div className={className}>
      <Card variant="web3" elevation="medium" padding="lg">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
              <Wallet className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Wallet Dashboard</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Connection status and account details</p>
            </div>
          </div>

          {/* Connection Status Badge */}
          <Badge variant={connectionStatus.variant} size="lg">
            <connectionStatus.icon className="h-4 w-4 mr-2" />
            {connectionStatus.message}
          </Badge>
        </div>

        {/* Connection State Content */}
        {isConnected ? (
          /* Connected State */
          <div className="space-y-6">
            {/* Account Information */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Account Information
              </h3>
              <Card variant="default" padding="md" elevation="low">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{displayAddress}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Connected Account</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyAddress}
                      leftIcon={<Copy className="h-4 w-4" />}
                    >
                      {copiedAddress ? 'Copied!' : 'Copy'}
                    </Button>
                    {address != null && address.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<ExternalLink className="h-4 w-4" />}
                        onClick={() => {
                          if (currentNetwork) {
                            const explorerUrl =
                              currentNetwork.name === 'Ethereum Mainnet'
                                ? `https://etherscan.io/address/${address}`
                                : currentNetwork.name === 'Polygon'
                                  ? `https://polygonscan.com/address/${address}`
                                  : `https://arbiscan.io/address/${address}`
                            window.open(explorerUrl, '_blank')
                          }
                        }}
                      >
                        Explorer
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </div>

            {/* Network Information */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Network className="h-4 w-4" />
                Network Information
              </h3>

              {unsupportedNetworkError ? (
                /* Unsupported Network Error */
                <Card
                  variant="default"
                  padding="md"
                  elevation="low"
                  className="border-red-200 bg-red-50/80 dark:border-red-800 dark:bg-red-900/20"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                      <div>
                        <p className="text-sm font-medium text-red-900 dark:text-red-100">Unsupported Network</p>
                        <p className="text-xs text-red-700 dark:text-red-300">
                          Chain ID: {chainId} • Switch to continue
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="web3Error"
                      size="sm"
                      loading={isHandlingNetwork}
                      onClick={handleUnsupportedNetworkFix}
                      leftIcon={<RefreshCw className="h-4 w-4" />}
                    >
                      Switch to {unsupportedNetworkError.suggestedChain.name}
                    </Button>
                  </div>
                </Card>
              ) : currentNetwork ? (
                /* Current Network Display */
                <Card variant="default" padding="md" elevation="low">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                        <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{currentNetwork.name}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Chain ID: {chainId} • Native: {currentNetwork.symbol}
                        </p>
                      </div>
                    </div>
                    <Badge variant="connected" size="sm">
                      Active
                    </Badge>
                  </div>
                </Card>
              ) : (
                /* Loading Network State */
                <Card variant="default" padding="md" elevation="low">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-gray-400 animate-pulse" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Loading network information...
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Detecting current network</p>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Network Switching Controls */}
            {showNetworkControls && isCurrentChainSupported && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Available Networks
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {supportedChains.map(chain => {
                    const isCurrentChain = chainId === chain.id
                    const isLoading = isSwitchingChain && !isCurrentChain

                    return (
                      <Card
                        key={chain.id}
                        variant="ghost"
                        padding="sm"
                        elevation="flat"
                        className={
                          isCurrentChain
                            ? 'bg-violet-50/50 border-violet-200 dark:bg-violet-900/20 dark:border-violet-700'
                            : undefined
                        }
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-3 h-3 rounded-full ${
                                isCurrentChain ? 'bg-violet-500' : 'bg-gray-300 dark:bg-gray-600'
                              }`}
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{chain.name}</p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">{chain.symbol}</p>
                            </div>
                          </div>

                          {isCurrentChain ? (
                            <Badge variant="connected" size="sm">
                              Current
                            </Badge>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              loading={isLoading}
                              onClick={() => handleNetworkSwitch(chain.id)}
                              disabled={isSwitchingChain}
                            >
                              Switch
                            </Button>
                          )}
                        </div>
                      </Card>
                    )
                  })}
                </div>

                {switchChainError && (
                  <Card
                    variant="default"
                    padding="sm"
                    elevation="low"
                    className="border-yellow-200 bg-yellow-50/80 dark:border-yellow-800 dark:bg-yellow-900/20 mt-2"
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                      <p className="text-xs text-yellow-800 dark:text-yellow-200">
                        Network switch failed. Please try again or switch manually in your wallet.
                      </p>
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* Connection Details */}
            {showConnectionDetails && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Connection Details
                </h3>
                <Card variant="ghost" padding="md" elevation="flat">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Status</p>
                      <p className="font-medium text-gray-900 dark:text-white">{connectionStatus.message}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Chain ID</p>
                      <p className="font-medium text-gray-900 dark:text-white">{chainId || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Network</p>
                      <p className="font-medium text-gray-900 dark:text-white">{currentNetwork?.name ?? 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Native Token</p>
                      <p className="font-medium text-gray-900 dark:text-white">{currentNetwork?.symbol ?? 'Unknown'}</p>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Disconnect Action */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="ghost"
                onClick={handleDisconnect}
                leftIcon={<WifiOff className="h-4 w-4" />}
                className="w-full"
              >
                Disconnect Wallet
              </Button>
            </div>
          </div>
        ) : (
          /* Disconnected State */
          <div className="text-center py-8">
            <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-800 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Wallet className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Connect Your Wallet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Connect your Web3 wallet to view account details, manage networks, and interact with the Token Toilet
              application.
            </p>
            <Button
              onClick={handleConnect}
              loading={isConnecting}
              leftIcon={<Wallet className="h-5 w-5" />}
              size="lg"
              variant="default"
            >
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
