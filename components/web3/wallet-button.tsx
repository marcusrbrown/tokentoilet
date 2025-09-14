'use client'

import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {Card} from '@/components/ui/card'
import {useWallet} from '@/hooks/use-wallet'
import {formatAddress} from '@/lib/utils'
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

  const displayAddress = typeof address === 'string' && address.length > 0 ? formatAddress(address, 4) : ''

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
        <Button variant="web3Error" leftIcon={<AlertTriangle className="h-5 w-5" />} onClick={handleDisconnect}>
          Unsupported Network
        </Button>
        <Card
          variant="default"
          padding="sm"
          className="border-yellow-200 bg-yellow-50/80 dark:border-yellow-800 dark:bg-yellow-900/20"
        >
          <div className="text-sm text-yellow-800 dark:text-yellow-200">
            <p className="font-medium mb-1">Network Not Supported</p>
            <p className="mb-2">Switch to {unsupportedNetworkError.suggestedChain.name} to continue using the app.</p>
            <Button variant="web3Network" size="sm" loading={isHandlingNetwork} onClick={handleNetworkSwitch}>
              {isHandlingNetwork ? 'Switching...' : `Switch to ${unsupportedNetworkError.suggestedChain.name}`}
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // Show connected state with network info
  if (isConnected && isCurrentChainSupported) {
    return (
      <div className="flex flex-col gap-1">
        <Button variant="web3Connected" leftIcon={<Wallet className="h-5 w-5" />} onClick={handleDisconnect}>
          {displayAddress}
        </Button>
        {currentNetwork && (
          <Badge variant="connected" className="mx-auto">
            {currentNetwork.name}
          </Badge>
        )}
      </div>
    )
  }

  // Show connect button when not connected
  return (
    <Button variant="default" leftIcon={<Wallet className="h-5 w-5" />} onClick={handleConnect}>
      Connect Wallet
    </Button>
  )
}
