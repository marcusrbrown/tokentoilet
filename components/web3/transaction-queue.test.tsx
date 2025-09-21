import type {QueuedTransaction} from '@/lib/web3/transaction-queue'
import type {Hash} from 'viem'

import {useTransactionQueue} from '@/hooks/use-transaction-queue'
import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {PendingTransactionQueue, TransactionQueue, TransactionQueueSummary} from './transaction-queue'

// Mock the transaction queue hooks
vi.mock('@/hooks/use-transaction-queue', () => ({
  useTransactionQueue: vi.fn(),
  useChainTransactionQueue: vi.fn(),
}))

describe('TransactionQueue', () => {
  const baseMockReturn = {
    pendingTransactions: [],
    confirmedTransactions: [],
    failedTransactions: [],
    addTransaction: vi.fn(),
    removeTransaction: vi.fn(),
    clearQueue: vi.fn(),
    getTransaction: vi.fn(),
    getTransactionsByChain: vi.fn(),
    getTransactionsByStatus: vi.fn(),
    getTransactionsByType: vi.fn(),
    totalTransactions: 0,
    pendingCount: 0,
    confirmedCount: 0,
    failedCount: 0,
    hasPendingTransactions: false,
    hasFailedTransactions: false,
    isProcessing: false,
    onTransactionAdded: vi.fn(),
    onTransactionConfirmed: vi.fn(),
    onTransactionFailed: vi.fn(),
  }

  const mockTransactions: QueuedTransaction[] = [
    {
      id: 'tx_1',
      hash: '0x1234567890123456789012345678901234567890123456789012345678901234' as Hash,
      chainId: 1 as const,
      type: 'transfer',
      status: 'pending',
      title: 'Pending Transfer',
      description: 'Transfer in progress',
      submittedAt: Date.now(),
      retryCount: 0,
    },
    {
      id: 'tx_2',
      hash: '0xabcdef1234567890123456789012345678901234567890123456789012345678' as Hash,
      chainId: 1 as const,
      type: 'approval',
      status: 'confirmed',
      title: 'Confirmed Approval',
      description: 'Token approval completed',
      submittedAt: Date.now() - 120000,
      confirmedAt: Date.now() - 60000,
      retryCount: 0,
    },
    {
      id: 'tx_3',
      hash: '0xfedcba0987654321098765432109876543210987654321098765432109876543' as Hash,
      chainId: 1 as const,
      type: 'dispose',
      status: 'failed',
      title: 'Failed Disposal',
      description: 'Token disposal failed',
      submittedAt: Date.now() - 180000,
      error: new Error('Transaction reverted'),
      retryCount: 1,
    },
  ]

  it('renders empty state when no transactions', () => {
    vi.mocked(useTransactionQueue).mockReturnValue({
      ...baseMockReturn,
      transactions: [],
    })

    render(<TransactionQueue />)

    expect(screen.getByText('No transactions in queue')).toBeInTheDocument()
    expect(screen.getByText('Empty')).toBeInTheDocument()
  })

  it('displays transactions when present', () => {
    vi.mocked(useTransactionQueue).mockReturnValue({
      ...baseMockReturn,
      transactions: mockTransactions,
      totalTransactions: 3,
      pendingCount: 1,
      confirmedCount: 1,
      failedCount: 1,
    })

    render(<TransactionQueue />)

    expect(screen.getByText('Pending Transfer')).toBeInTheDocument()
    expect(screen.getByText('Confirmed Approval')).toBeInTheDocument()
    expect(screen.getByText('Failed Disposal')).toBeInTheDocument()
  })

  it('shows queue statistics', () => {
    vi.mocked(useTransactionQueue).mockReturnValue({
      ...baseMockReturn,
      transactions: mockTransactions,
      totalTransactions: 3,
      pendingCount: 1,
      confirmedCount: 1,
      failedCount: 1,
    })

    render(<TransactionQueue showStats />)

    // Should show badges for pending (1), confirmed (1), and failed (1)
    const badges = screen.getAllByText('1')
    expect(badges.length).toBeGreaterThan(0)
  })

  it('filters by status when statusFilter is provided', () => {
    vi.mocked(useTransactionQueue).mockReturnValue({
      ...baseMockReturn,
      transactions: mockTransactions,
    })

    render(<TransactionQueue statusFilter="pending" />)

    expect(screen.getByText('Pending Transfer')).toBeInTheDocument()
    expect(screen.queryByText('Confirmed Approval')).not.toBeInTheDocument()
    expect(screen.queryByText('Failed Disposal')).not.toBeInTheDocument()
  })

  it('hides when empty if hideWhenEmpty is true', () => {
    vi.mocked(useTransactionQueue).mockReturnValue({
      ...baseMockReturn,
      transactions: [],
    })

    const {container} = render(<TransactionQueue hideWhenEmpty />)

    expect(container.firstChild).toBeNull()
  })
})

describe('PendingTransactionQueue', () => {
  it('renders with pending filter applied', () => {
    const pendingTx = {
      id: 'tx_pending',
      hash: '0x1234567890123456789012345678901234567890123456789012345678901234' as Hash,
      chainId: 1 as const,
      type: 'transfer' as const,
      status: 'pending' as const,
      title: 'Pending Transaction',
      description: 'Processing...',
      submittedAt: Date.now(),
      retryCount: 0,
    }

    vi.mocked(useTransactionQueue).mockReturnValue({
      pendingTransactions: [],
      confirmedTransactions: [],
      failedTransactions: [],
      addTransaction: vi.fn(),
      removeTransaction: vi.fn(),
      clearQueue: vi.fn(),
      getTransaction: vi.fn(),
      getTransactionsByChain: vi.fn(),
      getTransactionsByStatus: vi.fn(),
      getTransactionsByType: vi.fn(),
      totalTransactions: 1,
      pendingCount: 1,
      confirmedCount: 0,
      failedCount: 0,
      hasPendingTransactions: true,
      hasFailedTransactions: false,
      isProcessing: true,
      onTransactionAdded: vi.fn(),
      onTransactionConfirmed: vi.fn(),
      onTransactionFailed: vi.fn(),
      transactions: [pendingTx],
    })

    render(<PendingTransactionQueue />)

    expect(screen.getByText('Pending Transactions')).toBeInTheDocument()
    expect(screen.getByText('Pending Transaction')).toBeInTheDocument()
  })
})

describe('TransactionQueueSummary', () => {
  it('shows summary with transaction counts', () => {
    const mixedTransactions = [
      {
        id: 'tx_1',
        hash: '0x1234567890123456789012345678901234567890123456789012345678901234' as Hash,
        chainId: 1 as const,
        type: 'transfer' as const,
        status: 'pending' as const,
        title: 'Pending',
        description: 'Pending transaction',
        submittedAt: Date.now(),
        retryCount: 0,
      },
      {
        id: 'tx_2',
        hash: '0xabcdef1234567890123456789012345678901234567890123456789012345678' as Hash,
        chainId: 1 as const,
        type: 'approval' as const,
        status: 'confirmed' as const,
        title: 'Confirmed',
        description: 'Confirmed transaction',
        submittedAt: Date.now(),
        retryCount: 0,
      },
    ]

    vi.mocked(useTransactionQueue).mockReturnValue({
      pendingTransactions: [],
      confirmedTransactions: [],
      failedTransactions: [],
      addTransaction: vi.fn(),
      removeTransaction: vi.fn(),
      clearQueue: vi.fn(),
      getTransaction: vi.fn(),
      getTransactionsByChain: vi.fn(),
      getTransactionsByStatus: vi.fn(),
      getTransactionsByType: vi.fn(),
      totalTransactions: 2,
      pendingCount: 1,
      confirmedCount: 1,
      failedCount: 0,
      hasPendingTransactions: true,
      hasFailedTransactions: false,
      isProcessing: true,
      onTransactionAdded: vi.fn(),
      onTransactionConfirmed: vi.fn(),
      onTransactionFailed: vi.fn(),
      transactions: mixedTransactions,
    })

    render(<TransactionQueueSummary />)

    expect(screen.getByText('Transaction Queue')).toBeInTheDocument()
    expect(screen.getByText('2 total')).toBeInTheDocument()
  })

  it('hides when no transactions', () => {
    vi.mocked(useTransactionQueue).mockReturnValue({
      pendingTransactions: [],
      confirmedTransactions: [],
      failedTransactions: [],
      addTransaction: vi.fn(),
      removeTransaction: vi.fn(),
      clearQueue: vi.fn(),
      getTransaction: vi.fn(),
      getTransactionsByChain: vi.fn(),
      getTransactionsByStatus: vi.fn(),
      getTransactionsByType: vi.fn(),
      totalTransactions: 0,
      pendingCount: 0,
      confirmedCount: 0,
      failedCount: 0,
      hasPendingTransactions: false,
      hasFailedTransactions: false,
      isProcessing: false,
      onTransactionAdded: vi.fn(),
      onTransactionConfirmed: vi.fn(),
      onTransactionFailed: vi.fn(),
      transactions: [],
    })

    const {container} = render(<TransactionQueueSummary />)

    expect(container.firstChild).toBeNull()
  })
})
