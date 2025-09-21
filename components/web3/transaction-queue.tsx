'use client'

import type {SupportedChainId} from '@/hooks/use-wallet'
import type {QueuedTransaction, TransactionStatus, TransactionType} from '@/lib/web3/transaction-queue'

import {Badge} from '@/components/ui/badge'
import {Card} from '@/components/ui/card'
import {useChainTransactionQueue, useTransactionQueue} from '@/hooks/use-transaction-queue'
import {cn} from '@/lib/utils'
import {AlertTriangle, CheckCircle, Clock, RefreshCw, XCircle} from 'lucide-react'
import {TransactionStatusCard} from './transaction-status'

export interface TransactionQueueProps {
  /** Filter by specific chain ID */
  chainId?: SupportedChainId
  /** Filter by transaction status */
  statusFilter?: TransactionStatus
  /** Filter by transaction type */
  typeFilter?: TransactionType
  /** Maximum number of transactions to display */
  maxItems?: number
  /** Show queue statistics */
  showStats?: boolean
  /** Show transaction actions */
  showActions?: boolean
  /** Show detailed transaction info */
  showDetails?: boolean
  /** Variant for transaction cards */
  variant?: 'default' | 'compact' | 'minimal'
  /** Custom title for the queue */
  title?: string
  /** Custom empty state message */
  emptyMessage?: string
  /** Hide queue when empty */
  hideWhenEmpty?: boolean
  /** Custom class name */
  className?: string
  /** Remove transaction callback */
  onRemoveTransaction?: (transactionId: string) => void
  /** Transaction click handler */
  onTransactionClick?: (transaction: QueuedTransaction) => void
}

/**
 * Get queue statistics from transaction lists
 */
function getQueueStats(transactions: QueuedTransaction[]) {
  const pending = transactions.filter(tx => tx.status === 'pending').length
  const confirmed = transactions.filter(tx => tx.status === 'confirmed').length
  const failed = transactions.filter(
    tx => tx.status === 'failed' || tx.status === 'timeout' || tx.status === 'cancelled',
  ).length

  return {pending, confirmed, failed, total: transactions.length}
}

/**
 * Transaction queue component for displaying lists of queued transactions
 */
export function TransactionQueue({
  chainId,
  statusFilter,
  typeFilter,
  maxItems,
  showStats = true,
  showActions = true,
  showDetails = false,
  variant = 'default',
  title = 'Transaction Queue',
  emptyMessage = 'No transactions in queue',
  hideWhenEmpty = false,
  className,
  onRemoveTransaction,
  onTransactionClick,
}: TransactionQueueProps) {
  // Use appropriate hook based on whether chainId is provided
  const allQueue = useTransactionQueue()
  const chainQueue = useChainTransactionQueue(chainId ?? 1, {debug: false})

  // Select the appropriate queue data
  const queue = chainId ? chainQueue : allQueue

  // Apply filters
  let transactions = queue.transactions

  if (statusFilter) {
    transactions = transactions.filter(tx => tx.status === statusFilter)
  }

  if (typeFilter) {
    transactions = transactions.filter(tx => tx.type === typeFilter)
  }

  if (maxItems != null && maxItems > 0) {
    transactions = transactions.slice(0, maxItems)
  }

  // Get queue statistics
  const stats = getQueueStats(queue.transactions)

  // Hide component if empty and hideWhenEmpty is true
  if (hideWhenEmpty && transactions.length === 0) {
    return null
  }

  return (
    <Card variant="web3" elevation="low" className={cn('p-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>

        {showStats && (
          <div className="flex items-center gap-2">
            {stats.pending > 0 && (
              <Badge variant="pending" size="sm" className="flex items-center gap-1">
                <RefreshCw className="h-3 w-3 animate-spin" />
                {stats.pending}
              </Badge>
            )}

            {stats.confirmed > 0 && (
              <Badge variant="confirmed" size="sm" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                {stats.confirmed}
              </Badge>
            )}

            {stats.failed > 0 && (
              <Badge variant="failed" size="sm" className="flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                {stats.failed}
              </Badge>
            )}

            {stats.total === 0 && (
              <Badge variant="default" size="sm" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Empty
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Transaction List */}
      {transactions.length > 0 ? (
        <div className="space-y-3">
          {transactions.map(transaction => (
            <TransactionStatusCard
              key={transaction.id}
              transaction={transaction}
              variant={variant}
              showActions={showActions}
              showDetails={showDetails}
              onRemove={onRemoveTransaction}
              onTransactionClick={onTransactionClick}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
        </div>
      )}
    </Card>
  )
}

/**
 * Pending transactions queue - shows only pending transactions
 */
export function PendingTransactionQueue(props: Omit<TransactionQueueProps, 'statusFilter' | 'title'>) {
  return (
    <TransactionQueue
      {...props}
      statusFilter="pending"
      title="Pending Transactions"
      emptyMessage="No pending transactions"
      hideWhenEmpty={true}
    />
  )
}

/**
 * Failed transactions queue - shows only failed/timeout/cancelled transactions
 */
export function FailedTransactionQueue(props: Omit<TransactionQueueProps, 'statusFilter' | 'title'>) {
  const {transactions} = useTransactionQueue()
  const failedTransactions = transactions.filter(
    tx => tx.status === 'failed' || tx.status === 'timeout' || tx.status === 'cancelled',
  )

  if (failedTransactions.length === 0) {
    return null
  }

  return (
    <Card variant="web3" elevation="low" className={cn('p-4 border-red-200 dark:border-red-800', props.className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <h2 className="text-lg font-semibold text-red-700 dark:text-red-400">Failed Transactions</h2>
        </div>

        <Badge variant="failed" size="sm">
          {failedTransactions.length}
        </Badge>
      </div>

      <div className="space-y-3">
        {failedTransactions.map(transaction => (
          <TransactionStatusCard
            key={transaction.id}
            transaction={transaction}
            variant={props.variant || 'compact'}
            showActions={props.showActions ?? true}
            showDetails={props.showDetails ?? false}
            onRemove={props.onRemoveTransaction}
            onTransactionClick={props.onTransactionClick}
          />
        ))}
      </div>
    </Card>
  )
}

/**
 * Transaction queue summary - compact overview of queue status
 */
export function TransactionQueueSummary({
  chainId,
  className,
  onViewQueue,
}: {
  chainId?: SupportedChainId
  className?: string
  onViewQueue?: () => void
}) {
  // Use appropriate hook based on whether chainId is provided
  const allQueue = useTransactionQueue()
  const chainQueue = useChainTransactionQueue(chainId ?? 1, {debug: false})

  // Select the appropriate queue data
  const queue = chainId ? chainQueue : allQueue
  const stats = getQueueStats(queue.transactions)

  if (stats.total === 0) {
    return null
  }

  return (
    <Card
      variant="web3"
      elevation="low"
      className={cn('p-3 cursor-pointer hover:shadow-lg transition-all duration-200', className)}
      onClick={onViewQueue}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RefreshCw className={cn('h-4 w-4', stats.pending > 0 ? 'animate-spin text-orange-500' : 'text-gray-400')} />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Transaction Queue</span>
        </div>

        <div className="flex items-center gap-2">
          {stats.pending > 0 && (
            <Badge variant="pending" size="sm">
              {stats.pending}
            </Badge>
          )}

          {stats.failed > 0 && (
            <Badge variant="failed" size="sm">
              {stats.failed}
            </Badge>
          )}

          <span className="text-xs text-gray-500 dark:text-gray-400">{stats.total} total</span>
        </div>
      </div>
    </Card>
  )
}
