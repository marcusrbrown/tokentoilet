'use client'

import type {QueuedTransaction, TransactionStatus} from '@/lib/web3/transaction-queue'

import {Badge} from '@/components/ui/badge'
import {Card} from '@/components/ui/card'
import {cn, formatAddress} from '@/lib/utils'
import {cva, type VariantProps} from 'class-variance-authority'
import {AlertTriangle, CheckCircle, Clock, Copy, ExternalLink, Hash, RefreshCw, Trash2, XCircle} from 'lucide-react'
import {useState} from 'react'

/**
 * Transaction status indicator variants
 */
const transactionStatusVariants = cva(['group', 'relative', 'transition-all', 'duration-200', 'rounded-lg'], {
  variants: {
    variant: {
      default: ['p-4'],
      compact: ['p-3'],
      minimal: ['p-2'],
    },
    status: {
      pending: ['border-l-4', 'border-l-orange-400', 'dark:border-l-orange-500'],
      confirmed: ['border-l-4', 'border-l-green-400', 'dark:border-l-green-500'],
      failed: ['border-l-4', 'border-l-red-400', 'dark:border-l-red-500'],
      cancelled: ['border-l-4', 'border-l-gray-400', 'dark:border-l-gray-500'],
      replaced: ['border-l-4', 'border-l-blue-400', 'dark:border-l-blue-500'],
      timeout: ['border-l-4', 'border-l-yellow-400', 'dark:border-l-yellow-500'],
    },
  },
  defaultVariants: {
    variant: 'default',
    status: 'pending',
  },
})

export interface TransactionStatusProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'onClick'>,
    VariantProps<typeof transactionStatusVariants> {
  /** Queued transaction to display */
  transaction: QueuedTransaction
  /** Show transaction actions */
  showActions?: boolean
  /** Show detailed transaction info */
  showDetails?: boolean
  /** Show copy functionality */
  showCopy?: boolean
  /** Show explorer link */
  showExplorer?: boolean
  /** Custom explorer URL builder */
  getExplorerUrl?: (chainId: number, txHash: string) => string
  /** Remove transaction callback */
  onRemove?: (transactionId: string) => void
  /** Click handler for transaction */
  onTransactionClick?: (transaction: QueuedTransaction) => void
}

/**
 * Get status icon based on transaction status
 */
function getStatusIcon(status: TransactionStatus, className?: string) {
  const iconClassName = cn('h-4 w-4', className)

  switch (status) {
    case 'pending':
      return <RefreshCw className={cn(iconClassName, 'animate-spin', 'text-orange-500')} />
    case 'confirmed':
      return <CheckCircle className={cn(iconClassName, 'text-green-500')} />
    case 'failed':
      return <XCircle className={cn(iconClassName, 'text-red-500')} />
    case 'cancelled':
      return <XCircle className={cn(iconClassName, 'text-gray-500')} />
    case 'replaced':
      return <RefreshCw className={cn(iconClassName, 'text-blue-500')} />
    case 'timeout':
      return <AlertTriangle className={cn(iconClassName, 'text-yellow-500')} />
    default:
      return <Clock className={cn(iconClassName, 'text-gray-400')} />
  }
}

/**
 * Get status badge variant for different transaction statuses
 */
function getStatusBadgeVariant(status: TransactionStatus): 'pending' | 'confirmed' | 'failed' | 'default' {
  switch (status) {
    case 'pending':
      return 'pending'
    case 'confirmed':
      return 'confirmed'
    case 'failed':
    case 'timeout':
    case 'cancelled':
      return 'failed'
    case 'replaced':
      return 'default'
    default:
      return 'default'
  }
}

/**
 * Format timestamp to relative time
 */
function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`

  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: new Date(timestamp).getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
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
 * Transaction status component for displaying individual queued transactions
 */
export function TransactionStatusCard({
  transaction,
  variant,
  status,
  showActions = true,
  showDetails = false,
  showCopy = true,
  showExplorer = true,
  getExplorerUrl = defaultGetExplorerUrl,
  onRemove,
  onTransactionClick,
  className,
  ...props
}: TransactionStatusProps) {
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
    const url = getExplorerUrl(transaction.chainId, transaction.hash)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleRemove = () => {
    if (onRemove) {
      onRemove(transaction.id)
    }
  }

  const handleClick = () => {
    if (onTransactionClick) {
      onTransactionClick(transaction)
    }
  }

  const isCompact = variant === 'compact' || variant === 'minimal'

  return (
    <Card
      variant="web3"
      elevation="low"
      className={cn(
        transactionStatusVariants({variant, status: status || transaction.status}),
        onTransactionClick && 'cursor-pointer hover:shadow-lg hover:scale-[1.01]',
        className,
      )}
      onClick={handleClick}
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
                    'font-semibold text-gray-900 dark:text-gray-100 truncate',
                    isCompact ? 'text-sm' : 'text-base',
                  )}
                >
                  {transaction.title}
                </h3>
                <Badge variant={getStatusBadgeVariant(transaction.status)} size="sm">
                  {transaction.status}
                </Badge>
              </div>

              {/* Description */}
              <p className={cn('text-gray-600 dark:text-gray-300 truncate', isCompact ? 'text-xs' : 'text-sm')}>
                {transaction.description}
              </p>
            </div>

            {/* Actions */}
            {showActions && (
              <div className="flex items-center gap-1">
                {showCopy && (
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation()
                      handleCopy(transaction.hash).catch(error => {
                        console.error('Failed to copy transaction hash:', error)
                      })
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    title={copied ? 'Copied!' : 'Copy transaction hash'}
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                )}

                {showExplorer && transaction.status !== 'pending' && (
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation()
                      handleExplorerClick()
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    title="View on explorer"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </button>
                )}

                {onRemove &&
                  (transaction.status === 'confirmed' ||
                    transaction.status === 'failed' ||
                    transaction.status === 'timeout') && (
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation()
                        handleRemove()
                      }}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      title="Remove transaction"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
              </div>
            )}
          </div>

          {/* Transaction Hash */}
          <div className="flex items-center gap-2 mb-2">
            <Hash className="h-3 w-3 text-gray-400" />
            <span className={cn('font-mono text-gray-600 dark:text-gray-300', isCompact ? 'text-xs' : 'text-sm')}>
              {formatAddress(transaction.hash, isCompact ? 3 : 4)}
            </span>
          </div>

          {/* Metadata Row */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <span>{getChainName(transaction.chainId)}</span>
              <span>{formatRelativeTime(transaction.submittedAt)}</span>
              {transaction.retryCount > 0 && <span className="text-orange-500">Retry {transaction.retryCount}</span>}
            </div>

            {showDetails && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {transaction.confirmedAt != null && (
                  <span>Confirmed {formatRelativeTime(transaction.confirmedAt)}</span>
                )}
                {transaction.blockNumber != null && (
                  <span className="ml-2">Block {transaction.blockNumber.toString()}</span>
                )}
              </div>
            )}
          </div>

          {/* Error Message */}
          {transaction.error && (
            <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
              <p className="text-xs text-red-600 dark:text-red-400">{transaction.error.message}</p>
            </div>
          )}

          {/* Gas Information (if detailed) */}
          {showDetails && transaction.receipt && (
            <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded text-xs text-gray-600 dark:text-gray-300">
              <div className="grid grid-cols-2 gap-2">
                {transaction.gasUsed != null && <span>Gas Used: {transaction.gasUsed.toString()}</span>}
                {transaction.effectiveGasPrice != null && (
                  <span>Gas Price: {(Number(transaction.effectiveGasPrice) / 1e9).toFixed(2)} Gwei</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
