'use client'

import type {WalletSpecificError} from '@/lib/web3/wallet-error-types'
import {cn} from '@/lib/utils'
import {getWalletErrorRecovery} from '@/lib/web3/wallet-error-detector'
import {AlertCircle, ExternalLink, RefreshCw} from 'lucide-react'

import {Badge} from '../ui/badge'
import {Button} from '../ui/button'
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from '../ui/card'

interface WalletErrorRecoveryProps {
  error: WalletSpecificError
  onRetry?: () => void
  onDismiss?: () => void
  className?: string
}

const WALLET_DISPLAY_NAMES: Record<string, string> = {
  metamask: 'MetaMask',
  walletconnect: 'WalletConnect',
  coinbase: 'Coinbase Wallet',
}

const WALLET_BADGE_COLORS: Record<string, string> = {
  metamask: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
  walletconnect: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
  coinbase: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300',
}

type ActionType =
  | 'retry'
  | 'install'
  | 'unlock'
  | 'refresh'
  | 'manual_switch'
  | 'contact_support'
  | 'try_different_wallet'

export function WalletErrorRecovery({error, onRetry, onDismiss, className}: WalletErrorRecoveryProps) {
  const recovery = getWalletErrorRecovery(error)
  const walletName = WALLET_DISPLAY_NAMES[error.walletProvider] || 'Wallet'
  const badgeColor =
    WALLET_BADGE_COLORS[error.walletProvider] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'

  const handleAction = (actionType: ActionType, url?: string) => {
    switch (actionType) {
      case 'retry':
      case 'unlock':
        onRetry?.()
        break
      case 'refresh':
        window.location.reload()
        break
      case 'install':
      case 'contact_support':
        if (url !== undefined && url !== '') {
          window.open(url, '_blank', 'noopener,noreferrer')
        }
        break
      case 'manual_switch':
      case 'try_different_wallet':
        onDismiss?.()
        break
      default:
        onRetry?.()
        break
    }
  }

  return (
    <Card role="alert" className={cn('glass-card border-red-200 dark:border-red-800', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-base">
              {error.code.replaceAll('_', ' ')}
              <Badge variant="default" className={badgeColor}>
                {walletName}
              </Badge>
            </CardTitle>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        <CardDescription className="text-sm text-red-700 dark:text-red-300">
          {error.userFriendlyMessage}
        </CardDescription>

        {error.recoveryInstructions && error.recoveryInstructions.length > 0 && (
          <div className="mt-4">
            <h4 className="mb-2 text-sm font-medium text-gray-900 dark:text-gray-100">To resolve this:</h4>
            <ol className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              {error.recoveryInstructions.map((step, index) => (
                <li key={step} className="flex gap-2">
                  <span className="font-medium text-violet-600 dark:text-violet-400">{index + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-3 pt-0">
        {recovery.primaryAction !== undefined && (
          <Button
            onClick={() => handleAction(recovery.primaryAction.type, recovery.primaryAction.url)}
            variant="default"
            size="sm"
            className="w-full"
          >
            {recovery.primaryAction.type === 'install' && <ExternalLink className="mr-2 h-4 w-4" />}
            {recovery.primaryAction.type === 'retry' && <RefreshCw className="mr-2 h-4 w-4" />}
            {recovery.primaryAction.label}
          </Button>
        )}

        {recovery.secondaryActions && recovery.secondaryActions.length > 0 && (
          <div className="flex w-full flex-wrap gap-2">
            {recovery.secondaryActions.map(action => (
              <Button
                key={`${action.type}-${action.label}`}
                onClick={() => handleAction(action.type, action.url)}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                {action.type === 'contact_support' && <ExternalLink className="mr-1 h-3 w-3" />}
                {action.type === 'refresh' && <RefreshCw className="mr-1 h-3 w-3" />}
                <span className="text-xs">{action.label}</span>
              </Button>
            ))}
          </div>
        )}

        {onDismiss && (
          <Button onClick={onDismiss} variant="ghost" size="sm" className="w-full text-xs">
            Dismiss
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

WalletErrorRecovery.displayName = 'WalletErrorRecovery'

export {WalletErrorRecovery as default}
