import type {Hash, TransactionReceipt} from 'viem'
import type {SupportedChainId} from '../../hooks/use-wallet'

import {waitForTransactionReceipt} from 'viem/actions'

import {wagmiConfig} from './config'

// Transaction statuses for queue management
export type TransactionStatus =
  | 'pending' // Transaction submitted but not confirmed
  | 'confirmed' // Transaction confirmed and successful
  | 'failed' // Transaction failed or reverted
  | 'cancelled' // Transaction cancelled by user
  | 'replaced' // Transaction replaced by higher gas fee
  | 'timeout' // Transaction timed out waiting for confirmation

// Transaction types for different operations
export type TransactionType = 'transfer' | 'approval' | 'swap' | 'dispose' | 'donate' | 'unknown'

// Core transaction data structure
export interface QueuedTransaction {
  id: string
  hash: Hash
  chainId: SupportedChainId
  status: TransactionStatus
  type: TransactionType
  title: string
  description: string
  value?: bigint
  gasLimit?: bigint
  gasPrice?: bigint
  to?: string
  from?: string
  data?: string
  receipt?: TransactionReceipt
  error?: Error
  submittedAt: number
  confirmedAt?: number
  blockNumber?: bigint
  blockHash?: string
  gasUsed?: bigint
  effectiveGasPrice?: bigint
  retryCount: number
  metadata?: Record<string, unknown>
}

// Transaction queue configuration
export interface TransactionQueueConfig {
  maxRetries: number
  retryDelay: number
  confirmationTimeout: number
  maxQueueSize: number
  enablePersistence: boolean
  debug: boolean
}

// Default configuration for transaction queue
export const defaultQueueConfig: TransactionQueueConfig = {
  maxRetries: 3,
  retryDelay: 5000, // 5 seconds
  confirmationTimeout: 300000, // 5 minutes
  maxQueueSize: 100,
  enablePersistence: true,
  debug: process.env.NODE_ENV === 'development',
}

// Transaction queue event types
export type TransactionQueueEvent =
  | {type: 'TRANSACTION_ADDED'; payload: QueuedTransaction}
  | {type: 'TRANSACTION_UPDATED'; payload: QueuedTransaction}
  | {type: 'TRANSACTION_REMOVED'; payload: {id: string}}
  | {type: 'TRANSACTION_CONFIRMED'; payload: QueuedTransaction}
  | {type: 'TRANSACTION_FAILED'; payload: QueuedTransaction}
  | {type: 'QUEUE_CLEARED'; payload: {chainId?: SupportedChainId}}

// Event listener callback type
export type TransactionQueueEventListener = (event: TransactionQueueEvent) => void

// Serializable bigint for persistence
interface SerializableBigInt {
  __type: 'bigint'
  value: string
}

// Type guard for serializable bigint
function isSerializableBigInt(value: unknown): value is SerializableBigInt {
  return (
    typeof value === 'object' &&
    value !== null &&
    '__type' in value &&
    (value as SerializableBigInt).__type === 'bigint' &&
    'value' in value &&
    typeof (value as SerializableBigInt).value === 'string'
  )
}

// Core transaction queue implementation
export class TransactionQueue {
  private readonly transactions: Map<string, QueuedTransaction> = new Map()
  private readonly listeners: Set<TransactionQueueEventListener> = new Set()
  private readonly monitoringIntervals: Map<string, NodeJS.Timeout> = new Map()
  private readonly config: TransactionQueueConfig

  constructor(config: Partial<TransactionQueueConfig> = {}) {
    this.config = {...defaultQueueConfig, ...config}

    if (this.config.enablePersistence) {
      this.loadPersistedTransactions()
    }
  }

  // Add transaction to queue and start monitoring
  addTransaction(
    transaction: Omit<QueuedTransaction, 'id' | 'submittedAt' | 'retryCount' | 'status'>,
  ): QueuedTransaction {
    const queuedTransaction: QueuedTransaction = {
      ...transaction,
      id: this.generateTransactionId(transaction.hash, transaction.chainId),
      status: 'pending',
      submittedAt: Date.now(),
      retryCount: 0,
    }

    if (this.transactions.size >= this.config.maxQueueSize) {
      this.removeOldestTransaction()
    }

    this.transactions.set(queuedTransaction.id, queuedTransaction)
    this.persistTransactions()
    this.startMonitoring(queuedTransaction.id)

    this.emitEvent({
      type: 'TRANSACTION_ADDED',
      payload: queuedTransaction,
    })

    if (this.config.debug) {
      console.warn('[TransactionQueue] Transaction added to queue:', queuedTransaction)
    }

    return queuedTransaction
  }

  updateTransaction(id: string, updates: Partial<QueuedTransaction>): QueuedTransaction | null {
    const transaction = this.transactions.get(id)
    if (!transaction) {
      return null
    }

    const updatedTransaction = {...transaction, ...updates}
    this.transactions.set(id, updatedTransaction)
    this.persistTransactions()

    this.emitEvent({
      type: 'TRANSACTION_UPDATED',
      payload: updatedTransaction,
    })

    if (updates.status === 'confirmed') {
      this.emitEvent({
        type: 'TRANSACTION_CONFIRMED',
        payload: updatedTransaction,
      })
    } else if (updates.status === 'failed') {
      this.emitEvent({
        type: 'TRANSACTION_FAILED',
        payload: updatedTransaction,
      })
    }

    if (this.config.debug) {
      console.warn('[TransactionQueue] Transaction updated:', updatedTransaction)
    }

    return updatedTransaction
  }

  removeTransaction(id: string): boolean {
    const transaction = this.transactions.get(id)
    if (!transaction) {
      return false
    }

    this.transactions.delete(id)
    this.stopMonitoring(id)
    this.persistTransactions()

    this.emitEvent({
      type: 'TRANSACTION_REMOVED',
      payload: {id},
    })

    if (this.config.debug) {
      console.warn('[TransactionQueue] Transaction removed from queue:', id)
    }

    return true
  }

  // Get transaction by ID
  getTransaction(id: string): QueuedTransaction | null {
    return this.transactions.get(id) || null
  }

  // Get all transactions, optionally filtered by chain or status
  getTransactions(filter?: {
    chainId?: SupportedChainId
    status?: TransactionStatus
    type?: TransactionType
  }): QueuedTransaction[] {
    let transactions = Array.from(this.transactions.values())

    if (filter) {
      if (filter.chainId) {
        transactions = transactions.filter(tx => tx.chainId === filter.chainId)
      }
      if (filter.status) {
        transactions = transactions.filter(tx => tx.status === filter.status)
      }
      if (filter.type) {
        transactions = transactions.filter(tx => tx.type === filter.type)
      }
    }

    // Sort by submission time (newest first)
    return transactions.sort((a, b) => b.submittedAt - a.submittedAt)
  }

  // Clear all transactions from queue
  clearQueue(chainId?: SupportedChainId): void {
    if (chainId) {
      // Clear only transactions for specific chain
      const toRemove = Array.from(this.transactions.values())
        .filter(tx => tx.chainId === chainId)
        .map(tx => tx.id)

      toRemove.forEach(id => this.removeTransaction(id))
    } else {
      // Clear all transactions
      this.transactions.forEach((_, id) => {
        this.stopMonitoring(id)
      })
      this.transactions.clear()
      this.persistTransactions()
    }

    this.emitEvent({
      type: 'QUEUE_CLEARED',
      payload: {chainId},
    })

    if (this.config.debug) {
      console.warn('[TransactionQueue] Transaction queue cleared', chainId ? `for chain ${chainId}` : '')
    }
  }

  // Start monitoring a transaction for status updates
  private startMonitoring(transactionId: string): void {
    const transaction = this.transactions.get(transactionId)
    if (!transaction || transaction.status !== 'pending') {
      return
    }

    const monitor = async () => {
      try {
        await this.checkTransactionStatus(transactionId)
      } catch (error) {
        if (this.config.debug) {
          console.error('Error monitoring transaction:', transactionId, error)
        }
      }
    }

    // Initial check (catch errors for fire-and-forget)
    monitor().catch(error => {
      if (this.config.debug) {
        console.error('Error in initial transaction monitor:', error)
      }
    })

    // Set up periodic monitoring
    const interval = setInterval(() => {
      monitor().catch(error => {
        if (this.config.debug) {
          console.error('Error in periodic transaction monitor:', error)
        }
      })
    }, 5000) // Check every 5 seconds
    this.monitoringIntervals.set(transactionId, interval)

    // Set timeout for transaction
    setTimeout(() => {
      const tx = this.transactions.get(transactionId)
      if (tx && tx.status === 'pending') {
        this.updateTransaction(transactionId, {
          status: 'timeout',
          error: new Error('Transaction confirmation timeout'),
        })
        this.stopMonitoring(transactionId)
      }
    }, this.config.confirmationTimeout)
  }

  // Stop monitoring a transaction
  private stopMonitoring(transactionId: string): void {
    const interval = this.monitoringIntervals.get(transactionId)
    if (interval) {
      clearInterval(interval)
      this.monitoringIntervals.delete(transactionId)
    }
  }

  // Check transaction status on blockchain
  private async checkTransactionStatus(transactionId: string): Promise<void> {
    const transaction = this.transactions.get(transactionId)
    if (!transaction || transaction.status !== 'pending') {
      return
    }

    try {
      const client = wagmiConfig.getClient({chainId: transaction.chainId})

      // Check if transaction is confirmed
      const receipt = await waitForTransactionReceipt(client, {
        hash: transaction.hash,
        timeout: 10000, // 10 second timeout for this check
        pollingInterval: 1000,
      })

      // Update transaction with receipt data
      this.updateTransaction(transactionId, {
        status: receipt.status === 'success' ? 'confirmed' : 'failed',
        receipt,
        confirmedAt: Date.now(),
        blockNumber: receipt.blockNumber,
        blockHash: receipt.blockHash,
        gasUsed: receipt.gasUsed,
        effectiveGasPrice: receipt.effectiveGasPrice,
      })

      this.stopMonitoring(transactionId)
    } catch (error) {
      // If error is timeout, transaction is still pending
      if ((error as Error).message.includes('timeout')) {
        return // Continue monitoring
      }

      // Handle other errors
      const retryCount = transaction.retryCount + 1
      if (retryCount <= this.config.maxRetries) {
        this.updateTransaction(transactionId, {retryCount})

        // Retry after delay (catch errors for fire-and-forget)
        setTimeout(() => {
          this.checkTransactionStatus(transactionId).catch(error => {
            if (this.config.debug) {
              console.error('Error in retry transaction status check:', error)
            }
          })
        }, this.config.retryDelay)
      } else {
        // Max retries reached, mark as failed
        this.updateTransaction(transactionId, {
          status: 'failed',
          error: new Error(
            `Transaction monitoring failed after ${this.config.maxRetries} retries: ${(error as Error).message}`,
          ),
        })
        this.stopMonitoring(transactionId)
      }
    }
  }

  // Generate unique transaction ID
  private generateTransactionId(hash: Hash, chainId: SupportedChainId): string {
    return `${chainId}-${hash}`
  }

  // Remove oldest transaction when queue is full
  private removeOldestTransaction(): void {
    let oldestTime = Infinity
    let oldestId = ''

    this.transactions.forEach((transaction, id) => {
      if (transaction.submittedAt < oldestTime) {
        oldestTime = transaction.submittedAt
        oldestId = id
      }
    })

    if (oldestId) {
      this.removeTransaction(oldestId)
    }
  }

  // Persist transactions to local storage
  private persistTransactions(): void {
    if (!this.config.enablePersistence || typeof window === 'undefined') {
      return
    }

    try {
      const serializedTransactions = JSON.stringify(Array.from(this.transactions.entries()), (key, value: unknown) => {
        // Handle bigint serialization
        if (typeof value === 'bigint') {
          return {__type: 'bigint', value: value.toString()} as SerializableBigInt
        }
        return value
      })

      localStorage.setItem('tokentoilet:transaction-queue', serializedTransactions)
    } catch (error) {
      if (this.config.debug) {
        console.error('Failed to persist transactions:', error)
      }
    }
  }

  // Load persisted transactions from local storage
  private loadPersistedTransactions(): void {
    if (typeof window === 'undefined') {
      return
    }

    try {
      const serializedTransactions = localStorage.getItem('tokentoilet:transaction-queue')
      if (serializedTransactions === null || serializedTransactions === '') {
        return
      }

      const transactionEntries = JSON.parse(serializedTransactions, (key, value: unknown) => {
        // Handle bigint deserialization
        if (isSerializableBigInt(value)) {
          return BigInt(value.value)
        }
        return value
      }) as [string, QueuedTransaction][]

      // Only load pending transactions and restart monitoring
      transactionEntries.forEach(([id, transaction]) => {
        this.transactions.set(id, transaction)

        if (transaction.status === 'pending') {
          this.startMonitoring(id)
        }
      })

      if (this.config.debug) {
        console.warn('[TransactionQueue] Loaded persisted transactions:', this.transactions.size)
      }
    } catch (error) {
      if (this.config.debug) {
        console.error('Failed to load persisted transactions:', error)
      }
    }
  }

  // Event system for transaction updates
  addEventListener(listener: TransactionQueueEventListener): void {
    this.listeners.add(listener)
  }

  removeEventListener(listener: TransactionQueueEventListener): void {
    this.listeners.delete(listener)
  }

  private emitEvent(event: TransactionQueueEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event)
      } catch (error) {
        if (this.config.debug) {
          console.error('Error in transaction queue event listener:', error)
        }
      }
    })
  }

  // Cleanup resources
  destroy(): void {
    this.monitoringIntervals.forEach(interval => clearInterval(interval))
    this.monitoringIntervals.clear()
    this.listeners.clear()
    this.transactions.clear()
  }
}

// Global transaction queue instance
let globalQueue: TransactionQueue | null = null

// Get or create global transaction queue
export function getTransactionQueue(config?: Partial<TransactionQueueConfig>): TransactionQueue {
  if (!globalQueue) {
    globalQueue = new TransactionQueue(config)
  }
  return globalQueue
}

// Utility functions for common transaction operations
export const TransactionUtils = {
  // Create transaction data for token transfer
  createTransferTransaction(
    hash: Hash,
    chainId: SupportedChainId,
    to: string,
    from: string,
    value: bigint,
    tokenSymbol?: string,
  ): Omit<QueuedTransaction, 'id' | 'submittedAt' | 'retryCount' | 'status'> {
    const symbol = tokenSymbol ?? 'Token'
    const tokens = tokenSymbol ?? 'tokens'
    return {
      hash,
      chainId,
      type: 'transfer',
      title: `Transfer ${symbol}`,
      description: `Transferring ${tokens} to ${to.slice(0, 6)}...${to.slice(-4)}`,
      value,
      to,
      from,
    }
  },

  // Create transaction data for token approval
  createApprovalTransaction(
    hash: Hash,
    chainId: SupportedChainId,
    spender: string,
    from: string,
    value: bigint,
    tokenSymbol?: string,
  ): Omit<QueuedTransaction, 'id' | 'submittedAt' | 'retryCount' | 'status'> {
    const symbol = tokenSymbol ?? 'Token'
    const tokens = tokenSymbol ?? 'tokens'
    return {
      hash,
      chainId,
      type: 'approval',
      title: `Approve ${symbol}`,
      description: `Approving ${tokens} for ${spender.slice(0, 6)}...${spender.slice(-4)}`,
      value,
      to: spender,
      from,
    }
  },

  // Create transaction data for token disposal
  createDisposalTransaction(
    hash: Hash,
    chainId: SupportedChainId,
    tokenAddress: string,
    from: string,
    value: bigint,
    tokenSymbol?: string,
  ): Omit<QueuedTransaction, 'id' | 'submittedAt' | 'retryCount' | 'status'> {
    const symbol = tokenSymbol ?? 'Token'
    const tokens = tokenSymbol ?? 'tokens'
    return {
      hash,
      chainId,
      type: 'dispose',
      title: `Dispose ${symbol}`,
      description: `Disposing of ${tokens} via Token Toilet`,
      value,
      to: tokenAddress,
      from,
    }
  },
}
