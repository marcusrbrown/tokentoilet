'use client'

import {Button} from '@/components/ui/button'
import {Card} from '@/components/ui/card'
import {AlertCircle, ExternalLink} from 'lucide-react'

interface FallbackUIProps {
  title: string
  message: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
}

export function FallbackUI({title, message, action}: FallbackUIProps) {
  return (
    <Card variant="default" className="w-full" padding="lg">
      <div className="flex flex-col items-center justify-center space-y-4 py-8 text-center">
        <AlertCircle className="h-12 w-12 text-blue-500" />
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          <p className="max-w-md text-sm text-gray-600 dark:text-gray-400">{message}</p>
        </div>
        {action &&
          (action.href !== undefined && action.href !== '' ? (
            <a
              href={action.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              {action.label}
              <ExternalLink className="h-4 w-4" />
            </a>
          ) : (
            <Button variant="outline" size="sm" onClick={action.onClick}>
              {action.label}
            </Button>
          ))}
      </div>
    </Card>
  )
}

export function TokenListFallback() {
  return (
    <FallbackUI
      title="Token List Unavailable"
      message="Unable to load the token list. You can still connect your wallet and view your tokens through your wallet provider."
      action={{
        label: 'Refresh Page',
        onClick: () => window.location.reload(),
      }}
    />
  )
}

export function WalletDashboardFallback() {
  return (
    <FallbackUI
      title="Dashboard Unavailable"
      message="Unable to load your wallet dashboard. Your wallet is still connected and you can perform transactions."
      action={{
        label: 'Refresh Page',
        onClick: () => window.location.reload(),
      }}
    />
  )
}

export function TransactionQueueFallback() {
  return (
    <FallbackUI
      title="Transaction Queue Unavailable"
      message="Unable to load the transaction queue. Your transactions are still processing normally."
      action={{
        label: 'View on Explorer',
        href: 'https://etherscan.io',
      }}
    />
  )
}

export function TokenDetailFallback() {
  return (
    <FallbackUI
      title="Token Details Unavailable"
      message="Unable to load detailed token information. The token is still available in your wallet."
      action={{
        label: 'Go Back',
        onClick: () => window.history.back(),
      }}
    />
  )
}
