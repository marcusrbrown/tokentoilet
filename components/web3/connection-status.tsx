'use client'

import {AddressDisplay} from '@/components/ui/address-display'
import {Button} from '@/components/ui/button'
import {Card} from '@/components/ui/card'
import {NetworkBadge} from '@/components/ui/network-badge'
import {useWallet} from '@/hooks/use-wallet'
import {cn} from '@/lib/utils'

export interface ConnectionStatusProps {
  className?: string
  variant?: 'compact' | 'full'
  showNetworkBadge?: boolean
}

export function ConnectionStatus({className, variant = 'compact', showNetworkBadge = true}: ConnectionStatusProps) {
  const {address, isConnected, isConnecting, isCurrentChainSupported, connect, disconnect, error, clearError} =
    useWallet()

  const handleConnect = () => {
    connect().catch(() => {
      // Error is handled by useWallet hook
    })
  }

  const handleDisconnect = () => {
    disconnect().catch(() => {
      // Error is handled by useWallet hook
    })
  }

  if (!isConnected) {
    return (
      <div className={cn('flex flex-col gap-2', className)}>
        <Button variant="default" onClick={handleConnect} disabled={isConnecting}>
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </Button>
        {error !== null && (
          <p className="text-sm text-red-500" role="alert">
            {error.userFriendlyMessage}
            <button type="button" onClick={clearError} className="ml-2 underline hover:no-underline">
              Dismiss
            </button>
          </p>
        )}
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {showNetworkBadge && <NetworkBadge size="sm" />}
        {address !== undefined && <AddressDisplay address={address} showCopy />}
        <Button variant="ghost" size="sm" onClick={handleDisconnect}>
          Disconnect
        </Button>
      </div>
    )
  }

  return (
    <Card variant="default" padding="md" className={className}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-green-500" aria-hidden="true" />
          <span className="font-medium text-green-600 dark:text-green-400">Connected</span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleDisconnect}>
          Disconnect
        </Button>
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Address</p>
          {address !== undefined && <AddressDisplay address={address} showCopy showExternalLink />}
        </div>

        {showNetworkBadge && (
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Network</p>
            <NetworkBadge />
            {!isCurrentChainSupported && (
              <p className="mt-1 text-sm text-amber-600 dark:text-amber-400" role="alert">
                Please switch to a supported network
              </p>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}

ConnectionStatus.displayName = 'ConnectionStatus'
