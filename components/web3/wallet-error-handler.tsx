'use client'

import type {WalletErrorRecovery, WalletSpecificError} from '@/lib/web3/wallet-error-types'
import {cn} from '@/lib/utils'
import {AlertCircle, ExternalLink, RefreshCw} from 'lucide-react'

import {Badge} from '../ui/badge'
import {Button} from '../ui/button'
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from '../ui/card'

interface WalletErrorHandlerProps {
  error: WalletSpecificError | null
  onRetry?: () => void
  onDismiss?: () => void
  className?: string
  recovery?: WalletErrorRecovery
}

/**
 * Component for displaying wallet-specific errors with recovery suggestions
 *
 * Provides user-friendly error messages, wallet provider identification,
 * and actionable recovery steps for MetaMask, WalletConnect, and Coinbase Wallet errors.
 */
export function WalletErrorHandler({error, onRetry, onDismiss, className, recovery}: WalletErrorHandlerProps) {
  if (!error) return null

  const handleAction = (
    actionType:
      | 'retry'
      | 'install'
      | 'unlock'
      | 'refresh'
      | 'manual_switch'
      | 'contact_support'
      | 'try_different_wallet',
    url?: string,
  ) => {
    switch (actionType) {
      case 'retry':
        onRetry?.()
        break
      case 'refresh':
        window.location.reload()
        break
      case 'install':
      case 'contact_support':
        if (url !== undefined && url.length > 0) {
          window.open(url, '_blank', 'noopener,noreferrer')
        }
        break
      case 'unlock':
        // Unlock action should be handled by the wallet extension
        onRetry?.()
        break
      case 'manual_switch':
        // Let user handle manually
        onDismiss?.()
        break
      case 'try_different_wallet':
        onDismiss?.()
        break
      default:
        onRetry?.()
        break
    }
  }

  const getWalletDisplayName = (provider: string) => {
    switch (provider) {
      case 'metamask':
        return 'MetaMask'
      case 'walletconnect':
        return 'WalletConnect'
      case 'coinbase':
        return 'Coinbase Wallet'
      default:
        return 'Wallet'
    }
  }

  const getWalletBadgeColor = (provider: string) => {
    switch (provider) {
      case 'metamask':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300'
      case 'walletconnect':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
      case 'coinbase':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
    }
  }

  const walletName = getWalletDisplayName(error.walletProvider)
  const badgeColor = getWalletBadgeColor(error.walletProvider)

  return (
    <Card role="alert" className={cn('glass-card border-red-200 dark:border-red-800', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-base">
              Wallet Connection Error
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
            <h4 className="mb-2 text-sm font-medium text-gray-900 dark:text-gray-100">How to fix this:</h4>
            <ol className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              {error.recoveryInstructions.map((instruction, stepIndex) => (
                <li key={instruction} className="flex gap-2">
                  <span className="text-violet-600 dark:text-violet-400 font-medium">{stepIndex + 1}.</span>
                  <span>{instruction}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {error.errorContext && process.env.NODE_ENV === 'development' && (
          <details className="mt-4 rounded border border-gray-200 dark:border-gray-700">
            <summary className="cursor-pointer p-2 text-xs font-medium text-gray-500 dark:text-gray-400">
              Technical Details
            </summary>
            <div className="border-t border-gray-200 dark:border-gray-700 p-2 text-xs text-gray-600 dark:text-gray-400">
              <div>
                <strong>Action:</strong> {error.errorContext.action}
              </div>
              <div>
                <strong>Code:</strong> {error.code}
              </div>
              <div>
                <strong>Provider:</strong> {error.walletProvider}
              </div>
              {typeof error.chainId === 'number' && error.chainId > 0 && (
                <div>
                  <strong>Chain ID:</strong> {error.chainId}
                </div>
              )}
              {error.originalError && (
                <div>
                  <strong>Original Error:</strong> {error.originalError.message}
                </div>
              )}
            </div>
          </details>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-3 pt-0">
        {/* Primary Action */}
        {recovery?.primaryAction && (
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

        {/* Secondary Actions */}
        {recovery?.secondaryActions && recovery.secondaryActions.length > 0 && (
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

        {/* Dismiss Button */}
        {onDismiss && (
          <Button onClick={onDismiss} variant="ghost" size="sm" className="w-full text-xs">
            Dismiss
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

/**
 * Simplified error display for inline usage
 */
interface WalletErrorMessageProps {
  error: WalletSpecificError
  className?: string
}

export function WalletErrorMessage({error, className}: WalletErrorMessageProps) {
  const walletName =
    error.walletProvider === 'metamask'
      ? 'MetaMask'
      : error.walletProvider === 'walletconnect'
        ? 'WalletConnect'
        : error.walletProvider === 'coinbase'
          ? 'Coinbase Wallet'
          : 'Wallet'

  return (
    <div className={cn('flex items-center gap-2 rounded-lg bg-red-50 p-3 dark:bg-red-900/10', className)}>
      <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
      <div className="flex-1 text-sm">
        <span className="font-medium text-red-800 dark:text-red-200">{walletName} Error:</span>
        <span className="ml-1 text-red-700 dark:text-red-300">{error.userFriendlyMessage}</span>
      </div>
    </div>
  )
}
