'use client'

import {Badge} from '@/components/ui/badge'
import {Card} from '@/components/ui/card'
import {cn, formatAddress} from '@/lib/utils'
import {cva, type VariantProps} from 'class-variance-authority'
import {CheckCircle, Clock, Copy, ExternalLink, Hash, RefreshCw, Wallet, XCircle} from 'lucide-react'
import React, {useState} from 'react'

/**
 * Transaction data interface based on Web3 patterns and PRD requirements
 */
export interface TransactionData {
  /** Transaction hash */
  txHash: string
  /** Chain ID where transaction occurred */
  chainId: number
  /** User address who initiated the transaction */
  user: string
  /** Type of action performed */
  actionType: 'disposal' | 'contribution' | 'claim' | 'transfer' | 'approval'
  /** Tokens involved in the transaction */
  tokens: {
    address: string
    amount: string
    symbol: string
    name?: string
    decimals?: number
    tokenId?: string
  }[]
  /** Timestamp when transaction was initiated */
  timestamp: number
  /** Current transaction status */
  status: 'pending' | 'confirmed' | 'failed'
  /** Block number when confirmed (optional) */
  blockNumber?: number
  /** Gas used in the transaction (optional) */
  gasUsed?: string
  /** Error message if failed (optional) */
  errorMessage?: string
  /** Confirmation count (optional) */
  confirmations?: number
}

/**
 * Transaction card component variants using class-variance-authority
 */
const transactionCardVariants = cva(['group', 'relative', 'transition-all', 'duration-200'], {
  variants: {
    variant: {
      // Default card for transaction history
      default: [],
      // Compact variant for lists
      compact: ['px-4', 'py-3'],
      // Detailed variant for single transaction view
      detailed: ['p-6'],
      // Interactive variant with hover effects
      interactive: ['cursor-pointer', 'hover:shadow-lg', 'hover:scale-[1.01]'],
    },
    status: {
      pending: ['border-l-4', 'border-l-orange-400', 'dark:border-l-orange-500'],
      confirmed: ['border-l-4', 'border-l-green-400', 'dark:border-l-green-500'],
      failed: ['border-l-4', 'border-l-red-400', 'dark:border-l-red-500'],
    },
  },
  defaultVariants: {
    variant: 'default',
    status: 'pending',
  },
})

export interface TransactionCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'onClick'>,
    VariantProps<typeof transactionCardVariants> {
  /** Transaction data to display */
  transaction: TransactionData
  /** Show detailed information */
  showDetails?: boolean
  /** Show copy button for transaction hash */
  showCopyButton?: boolean
  /** Show explorer link */
  showExplorerLink?: boolean
  /** Custom explorer URL builder */
  getExplorerUrl?: (chainId: number, txHash: string) => string
  /** Click handler for interactive variant */
  onClick?: (transaction: TransactionData) => void
}

/**
 * Format timestamp to readable date
 */
function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric',
  })
}

/**
 * Get chain name from chain ID
 */
function getChainName(chainId: number): string {
  const chainNames: Record<number, string> = {
    1: 'Ethereum',
    137: 'Polygon',
    42161: 'Arbitrum',
  }
  return chainNames[chainId] || `Chain ${chainId}`
}

/**
 * Default explorer URL builder
 */
function defaultGetExplorerUrl(chainId: number, txHash: string): string {
  const explorers: Record<number, string> = {
    1: 'https://etherscan.io/tx/',
    137: 'https://polygonscan.com/tx/',
    42161: 'https://arbiscan.io/tx/',
  }
  const baseUrl = explorers[chainId] || 'https://etherscan.io/tx/'
  return `${baseUrl}${txHash}`
}

/**
 * Get status icon based on transaction status
 */
function getStatusIcon(status: TransactionData['status'], className?: string) {
  const iconClassName = cn('h-4 w-4', className)

  switch (status) {
    case 'pending':
      return <RefreshCw className={cn(iconClassName, 'animate-spin', 'text-orange-500')} />
    case 'confirmed':
      return <CheckCircle className={cn(iconClassName, 'text-green-500')} />
    case 'failed':
      return <XCircle className={cn(iconClassName, 'text-red-500')} />
    default:
      return <Clock className={cn(iconClassName, 'text-gray-400')} />
  }
}

/**
 * Transaction card component for displaying transaction history and status
 */
export function TransactionCard({
  transaction,
  variant,
  status,
  showDetails = false,
  showCopyButton = true,
  showExplorerLink = true,
  getExplorerUrl = defaultGetExplorerUrl,
  onClick,
  className,
  ...props
}: TransactionCardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.append(textArea)
      textArea.select()
      document.execCommand('copy')
      textArea.remove()
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleExplorerClick = () => {
    const url = getExplorerUrl(transaction.chainId, transaction.txHash)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleCardClick = () => {
    if (onClick && variant === 'interactive') {
      onClick(transaction)
    }
  }

  const isDetailed = variant === 'detailed' || showDetails
  const isCompact = variant === 'compact'

  return (
    <Card
      variant="web3"
      elevation="low"
      className={cn(transactionCardVariants({variant, status: status || transaction.status}), className)}
      onClick={handleCardClick}
      {...props}
    >
      <div className={cn('flex items-start gap-4', isCompact && 'gap-3')}>
        {/* Status Icon */}
        <div className="flex-shrink-0 pt-1">{getStatusIcon(transaction.status)}</div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3
                  className={cn(
                    'font-semibold text-gray-900 dark:text-gray-100 capitalize',
                    isCompact ? 'text-sm' : 'text-base',
                  )}
                >
                  {transaction.actionType}
                </h3>
                <Badge
                  variant={
                    transaction.status === 'pending'
                      ? 'pending'
                      : transaction.status === 'confirmed'
                        ? 'confirmed'
                        : 'failed'
                  }
                  size="sm"
                >
                  {transaction.status}
                </Badge>
              </div>

              {/* Transaction Hash */}
              <div className="flex items-center gap-2 mb-1">
                <Hash className="h-3 w-3 text-gray-400" />
                <span className={cn('font-mono text-gray-600 dark:text-gray-300', isCompact ? 'text-xs' : 'text-sm')}>
                  {formatAddress(transaction.txHash, isCompact ? 3 : 4)}
                </span>

                {showCopyButton && (
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation()
                      handleCopy(transaction.txHash).catch(() => {
                        // Handle error silently
                      })
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    title="Copy transaction hash"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                )}

                {showExplorerLink && (
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation()
                      handleExplorerClick()
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    title="View on explorer"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </button>
                )}

                {copied && <span className="text-xs text-green-600 dark:text-green-400">Copied!</span>}
              </div>
            </div>

            {/* Timestamp */}
            <div className="flex-shrink-0 text-right">
              <time className={cn('text-gray-500 dark:text-gray-400', isCompact ? 'text-xs' : 'text-sm')}>
                {formatTimestamp(transaction.timestamp)}
              </time>
              <div className={cn('text-gray-400 dark:text-gray-500', isCompact ? 'text-xs' : 'text-xs')}>
                {getChainName(transaction.chainId)}
              </div>
            </div>
          </div>

          {/* Token Information */}
          {transaction.tokens.length > 0 && (
            <div className="mb-3">
              {transaction.tokens.map(token => (
                <div key={token.address} className="flex items-center gap-2 mb-1 last:mb-0">
                  <span
                    className={cn('font-medium text-gray-700 dark:text-gray-300', isCompact ? 'text-sm' : 'text-base')}
                  >
                    {token.amount} {token.symbol}
                  </span>
                  {token.name != null && token.name !== '' && (
                    <span className={cn('text-gray-500 dark:text-gray-400', isCompact ? 'text-xs' : 'text-sm')}>
                      ({token.name})
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* User Address */}
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="h-3 w-3 text-gray-400" />
            <span className={cn('font-mono text-gray-600 dark:text-gray-300', isCompact ? 'text-xs' : 'text-sm')}>
              {formatAddress(transaction.user, 4)}
            </span>
          </div>

          {/* Detailed Information */}
          {isDetailed && (
            <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              {transaction.blockNumber != null && transaction.blockNumber > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Block:</span>
                  <span className="font-mono text-gray-700 dark:text-gray-300">#{transaction.blockNumber}</span>
                </div>
              )}

              {transaction.gasUsed != null && transaction.gasUsed !== '' && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Gas Used:</span>
                  <span className="font-mono text-gray-700 dark:text-gray-300">{transaction.gasUsed}</span>
                </div>
              )}

              {transaction.confirmations !== undefined && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Confirmations:</span>
                  <span className="font-mono text-gray-700 dark:text-gray-300">{transaction.confirmations}</span>
                </div>
              )}

              {transaction.errorMessage != null &&
                transaction.errorMessage !== '' &&
                transaction.status === 'failed' && (
                  <div className="mt-2 p-2 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30">
                    <p className="text-sm text-red-700 dark:text-red-300">{transaction.errorMessage}</p>
                  </div>
                )}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

/**
 * Transaction list component for displaying multiple transactions
 */
export interface TransactionListProps {
  /** List of transactions to display */
  transactions: TransactionData[]
  /** Variant to apply to all cards */
  variant?: VariantProps<typeof transactionCardVariants>['variant']
  /** Show detailed information for all cards */
  showDetails?: boolean
  /** Show copy button for all cards */
  showCopyButton?: boolean
  /** Show explorer link for all cards */
  showExplorerLink?: boolean
  /** Custom explorer URL builder */
  getExplorerUrl?: (chainId: number, txHash: string) => string
  /** Click handler for interactive cards */
  onTransactionClick?: (transaction: TransactionData) => void
  /** Empty state content */
  emptyState?: React.ReactNode
  /** Additional className */
  className?: string
}

/**
 * Default empty state component
 */
const DefaultEmptyState = () => (
  <div className="text-center py-8">
    <div className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4">
      <Hash className="h-full w-full" />
    </div>
    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No transactions yet</h3>
    <p className="text-gray-500 dark:text-gray-400">
      Your transaction history will appear here once you start interacting with the platform.
    </p>
  </div>
)

/**
 * Transaction list component for displaying multiple transaction cards
 */
export function TransactionList({
  transactions,
  variant = 'default',
  showDetails = false,
  showCopyButton = true,
  showExplorerLink = true,
  getExplorerUrl,
  onTransactionClick,
  emptyState,
  className,
}: TransactionListProps) {
  const defaultEmptyState = <DefaultEmptyState />

  if (transactions.length === 0) {
    return <div className={className}>{emptyState ?? defaultEmptyState}</div>
  }

  return (
    <div className={cn('space-y-3', className)}>
      {transactions.map(transaction => (
        <TransactionCard
          key={transaction.txHash}
          transaction={transaction}
          variant={variant}
          showDetails={showDetails}
          showCopyButton={showCopyButton}
          showExplorerLink={showExplorerLink}
          getExplorerUrl={getExplorerUrl}
          onClick={onTransactionClick}
        />
      ))}
    </div>
  )
}
