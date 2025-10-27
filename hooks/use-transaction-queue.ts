'use client'

import type {
  QueuedTransaction,
  TransactionQueueConfig,
  TransactionQueueEventListener,
  TransactionStatus,
  TransactionType,
} from '../lib/web3/transaction-queue'

import type {SupportedChainId} from './use-wallet'

import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {getTransactionQueue} from '../lib/web3/transaction-queue'

// Hook return type
export interface UseTransactionQueueReturn {
  // Transaction queue state
  transactions: QueuedTransaction[]
  pendingTransactions: QueuedTransaction[]
  confirmedTransactions: QueuedTransaction[]
  failedTransactions: QueuedTransaction[]

  // Queue management
  addTransaction: (
    transaction: Omit<QueuedTransaction, 'id' | 'submittedAt' | 'retryCount' | 'status'>,
  ) => QueuedTransaction
  removeTransaction: (id: string) => boolean
  clearQueue: (chainId?: SupportedChainId) => void

  // Transaction queries
  getTransaction: (id: string) => QueuedTransaction | null
  getTransactionsByChain: (chainId: SupportedChainId) => QueuedTransaction[]
  getTransactionsByStatus: (status: TransactionStatus) => QueuedTransaction[]
  getTransactionsByType: (type: TransactionType) => QueuedTransaction[]

  // Queue statistics
  totalTransactions: number
  pendingCount: number
  confirmedCount: number
  failedCount: number

  // Queue state flags
  hasPendingTransactions: boolean
  hasFailedTransactions: boolean
  isProcessing: boolean

  // Event handlers
  onTransactionAdded: (callback: (transaction: QueuedTransaction) => void) => () => void
  onTransactionConfirmed: (callback: (transaction: QueuedTransaction) => void) => () => void
  onTransactionFailed: (callback: (transaction: QueuedTransaction) => void) => () => void
}

// Hook configuration options
export interface UseTransactionQueueOptions extends Partial<TransactionQueueConfig> {
  autoReconnect?: boolean
  chainId?: SupportedChainId
}

// Default hook options
const defaultOptions: UseTransactionQueueOptions = {
  autoReconnect: true,
  debug: process.env.NODE_ENV === 'development',
}

export function useTransactionQueue(options: UseTransactionQueueOptions = {}): UseTransactionQueueReturn {
  const config = useMemo(() => ({...defaultOptions, ...options}), [options])

  // State for all transactions
  const [transactions, setTransactions] = useState<QueuedTransaction[]>([])

  // Ref to store the queue instance
  const queueRef = useRef(getTransactionQueue(config))

  // Event listener references for cleanup
  const listenersRef = useRef<Set<TransactionQueueEventListener>>(new Set())

  // Loads from localStorage-backed queue - not deriving from previous state
  const loadTransactions = useCallback(() => {
    try {
      const allTransactions = queueRef.current.getTransactions()
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect -- Loading from external localStorage-backed queue, not deriving from previous state
      setTransactions(() => allTransactions)
    } catch (error) {
      console.error('Failed to load transactions from queue:', error)
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect -- Error handling fallback
      setTransactions(() => [])
    }
  }, [])

  // Initialize queue and set up event listeners
  useEffect(() => {
    loadTransactions()

    const eventListener: TransactionQueueEventListener = _event => {
      loadTransactions()
    }

    const queue = queueRef.current
    const listeners = listenersRef.current

    queue.addEventListener(eventListener)
    listeners.add(eventListener)

    // Cleanup: capture ref values to avoid stale closure issues
    return () => {
      listeners.forEach(listener => {
        queue.removeEventListener(listener)
      })
      listeners.clear()
    }
  }, [loadTransactions])

  // Filtered transaction lists
  const pendingTransactions = useMemo(() => transactions.filter(tx => tx.status === 'pending'), [transactions])

  const confirmedTransactions = useMemo(() => transactions.filter(tx => tx.status === 'confirmed'), [transactions])

  const failedTransactions = useMemo(
    () => transactions.filter(tx => tx.status === 'failed' || tx.status === 'timeout'),
    [transactions],
  )

  // Queue management functions
  const addTransaction = useCallback(
    (transaction: Omit<QueuedTransaction, 'id' | 'submittedAt' | 'retryCount' | 'status'>) => {
      try {
        return queueRef.current.addTransaction(transaction)
      } catch (error) {
        console.error('Failed to add transaction to queue:', error)
        throw error
      }
    },
    [],
  )

  const removeTransaction = useCallback((id: string) => {
    try {
      return queueRef.current.removeTransaction(id)
    } catch (error) {
      console.error('Failed to remove transaction from queue:', error)
      return false
    }
  }, [])

  const clearQueue = useCallback((chainId?: SupportedChainId) => {
    try {
      queueRef.current.clearQueue(chainId)
    } catch (error) {
      console.error('Failed to clear queue:', error)
    }
  }, [])

  // Transaction query functions
  const getTransaction = useCallback((id: string) => {
    return queueRef.current.getTransaction(id)
  }, [])

  const getTransactionsByChain = useCallback((chainId: SupportedChainId) => {
    return queueRef.current.getTransactions({chainId})
  }, [])

  const getTransactionsByStatus = useCallback((status: TransactionStatus) => {
    return queueRef.current.getTransactions({status})
  }, [])

  const getTransactionsByType = useCallback((type: TransactionType) => {
    return queueRef.current.getTransactions({type})
  }, [])

  // Queue statistics
  const totalTransactions = transactions.length
  const pendingCount = pendingTransactions.length
  const confirmedCount = confirmedTransactions.length
  const failedCount = failedTransactions.length

  // Queue state flags
  const hasPendingTransactions = pendingCount > 0
  const hasFailedTransactions = failedCount > 0
  const isProcessing = hasPendingTransactions

  // Event handler registration functions
  const onTransactionAdded = useCallback((callback: (transaction: QueuedTransaction) => void) => {
    const listener: TransactionQueueEventListener = event => {
      if (event.type === 'TRANSACTION_ADDED') {
        callback(event.payload)
      }
    }

    queueRef.current.addEventListener(listener)
    listenersRef.current.add(listener)

    // Return cleanup function
    return () => {
      queueRef.current.removeEventListener(listener)
      listenersRef.current.delete(listener)
    }
  }, [])

  const onTransactionConfirmed = useCallback((callback: (transaction: QueuedTransaction) => void) => {
    const listener: TransactionQueueEventListener = event => {
      if (event.type === 'TRANSACTION_CONFIRMED') {
        callback(event.payload)
      }
    }

    queueRef.current.addEventListener(listener)
    listenersRef.current.add(listener)

    // Return cleanup function
    return () => {
      queueRef.current.removeEventListener(listener)
      listenersRef.current.delete(listener)
    }
  }, [])

  const onTransactionFailed = useCallback((callback: (transaction: QueuedTransaction) => void) => {
    const listener: TransactionQueueEventListener = event => {
      if (event.type === 'TRANSACTION_FAILED') {
        callback(event.payload)
      }
    }

    queueRef.current.addEventListener(listener)
    listenersRef.current.add(listener)

    // Return cleanup function
    return () => {
      queueRef.current.removeEventListener(listener)
      listenersRef.current.delete(listener)
    }
  }, [])

  return {
    // Transaction queue state
    transactions,
    pendingTransactions,
    confirmedTransactions,
    failedTransactions,

    // Queue management
    addTransaction,
    removeTransaction,
    clearQueue,

    // Transaction queries
    getTransaction,
    getTransactionsByChain,
    getTransactionsByStatus,
    getTransactionsByType,

    // Queue statistics
    totalTransactions,
    pendingCount,
    confirmedCount,
    failedCount,

    // Queue state flags
    hasPendingTransactions,
    hasFailedTransactions,
    isProcessing,

    // Event handlers
    onTransactionAdded,
    onTransactionConfirmed,
    onTransactionFailed,
  }
}

// Hook for managing transaction queue with specific chain filtering
export function useChainTransactionQueue(chainId: SupportedChainId, options: UseTransactionQueueOptions = {}) {
  const allQueue = useTransactionQueue(options)

  // Filter transactions by chain
  const transactions = useMemo(
    () => allQueue.transactions.filter(tx => tx.chainId === chainId),
    [allQueue.transactions, chainId],
  )

  const pendingTransactions = useMemo(
    () => allQueue.pendingTransactions.filter(tx => tx.chainId === chainId),
    [allQueue.pendingTransactions, chainId],
  )

  const confirmedTransactions = useMemo(
    () => allQueue.confirmedTransactions.filter(tx => tx.chainId === chainId),
    [allQueue.confirmedTransactions, chainId],
  )

  const failedTransactions = useMemo(
    () => allQueue.failedTransactions.filter(tx => tx.chainId === chainId),
    [allQueue.failedTransactions, chainId],
  )

  // Chain-specific clear function
  const clearQueue = useCallback(() => {
    allQueue.clearQueue(chainId)
  }, [allQueue, chainId])

  // Chain-specific statistics
  const totalTransactions = transactions.length
  const pendingCount = pendingTransactions.length
  const confirmedCount = confirmedTransactions.length
  const failedCount = failedTransactions.length

  return {
    ...allQueue,
    transactions,
    pendingTransactions,
    confirmedTransactions,
    failedTransactions,
    clearQueue,
    totalTransactions,
    pendingCount,
    confirmedCount,
    failedCount,
    hasPendingTransactions: pendingCount > 0,
    hasFailedTransactions: failedCount > 0,
    isProcessing: pendingCount > 0,
  }
}

// Hook for getting a single transaction with real-time updates via polling
export function useTransaction(transactionId: string) {
  const {getTransaction} = useTransactionQueue()
  const [transaction, setTransaction] = useState<QueuedTransaction | null>(null)

  // Polling: fetches fresh data from queue every second
  const fetchAndUpdateTransaction = useCallback(() => {
    try {
      const tx = getTransaction(transactionId)

      setTransaction(_prev => tx)
    } catch (error) {
      console.error('Failed to fetch transaction:', error)

      setTransaction(_prev => null)
    }
  }, [getTransaction, transactionId])

  useEffect(() => {
    // Schedule the initial fetch asynchronously to avoid calling setState synchronously within the effect
    const timeout = setTimeout(fetchAndUpdateTransaction, 0)
    const interval = setInterval(fetchAndUpdateTransaction, 1000)
    return () => {
      clearTimeout(timeout)
      clearInterval(interval)
    }
  }, [fetchAndUpdateTransaction])

  return transaction
}
