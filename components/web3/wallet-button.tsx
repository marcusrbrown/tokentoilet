'use client'

import {useWallet} from '@/hooks/use-wallet'
import {AlertTriangle, Wallet} from 'lucide-react'
import {useState} from 'react'

export function WalletButton() {
  const {
    address,
    isConnected,
    connect,
    disconnect,
    isCurrentChainSupported,
    getUnsupportedNetworkError,
    handleUnsupportedNetwork,
    currentNetwork,
  } = useWallet()

  const [isHandlingNetwork, setIsHandlingNetwork] = useState(false)

  const handleConnect = () => {
    connect().catch(error => {
      console.error('Failed to connect:', error)
    })
  }

  const handleDisconnect = () => {
    disconnect().catch(error => {
      console.error('Failed to disconnect:', error)
    })
  }

  const displayAddress =
    typeof address === 'string' && address.length > 0 ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''

  const unsupportedNetworkError = getUnsupportedNetworkError()

  const handleNetworkSwitch = () => {
    if (!unsupportedNetworkError) return

    setIsHandlingNetwork(true)
    handleUnsupportedNetwork(true) // Auto-switch to suggested network
      .catch(error => {
        console.error('Failed to switch network:', error)
      })
      .finally(() => {
        setIsHandlingNetwork(false)
      })
  }

  // Show network error state when connected but on unsupported network
  if (isConnected && !isCurrentChainSupported && unsupportedNetworkError) {
    return (
      <div className="flex flex-col gap-2">
        <button
          onClick={handleDisconnect}
          className="flex items-center gap-2 rounded-lg bg-red-500 px-6 py-2 font-medium text-white transition-colors hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
        >
          <AlertTriangle className="h-5 w-5" />
          Unsupported Network
        </button>
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200">
          <p className="font-medium mb-1">Network Not Supported</p>
          <p className="mb-2">Switch to {unsupportedNetworkError.suggestedChain.name} to continue using the app.</p>
          <button
            onClick={handleNetworkSwitch}
            disabled={isHandlingNetwork}
            className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-600 text-white rounded text-xs font-medium hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isHandlingNetwork ? 'Switching...' : `Switch to ${unsupportedNetworkError.suggestedChain.name}`}
          </button>
        </div>
      </div>
    )
  }

  // Show connected state with network info
  if (isConnected && isCurrentChainSupported) {
    return (
      <div className="flex flex-col gap-1">
        <button
          onClick={handleDisconnect}
          className="flex items-center gap-2 rounded-lg bg-violet-500 px-6 py-2 font-medium text-white transition-colors hover:bg-violet-600 dark:bg-violet-600 dark:hover:bg-violet-700"
        >
          <Wallet className="h-5 w-5" />
          {displayAddress}
        </button>
        {currentNetwork && (
          <div className="text-xs text-gray-600 dark:text-gray-400 text-center">Connected to {currentNetwork.name}</div>
        )}
      </div>
    )
  }

  // Show connect button when not connected
  return (
    <button
      onClick={handleConnect}
      className="flex items-center gap-2 rounded-lg bg-violet-500 px-6 py-2 font-medium text-white transition-colors hover:bg-violet-600 dark:bg-violet-600 dark:hover:bg-violet-700"
    >
      <Wallet className="h-5 w-5" />
      Connect Wallet
    </button>
  )
}
