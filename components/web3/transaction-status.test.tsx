import type {QueuedTransaction} from '@/lib/web3/transaction-queue'
import type {Hash} from 'viem'

import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {TransactionStatusCard} from './transaction-status'

describe('TransactionStatusCard', () => {
  const baseMockTransaction: QueuedTransaction = {
    id: 'tx_12345678',
    hash: '0xabc123def456789012345678901234567890abcdef123456789012345678901234' as Hash,
    chainId: 1,
    type: 'transfer',
    status: 'pending',
    title: 'Test Transfer',
    description: 'Transferring tokens to recipient',
    submittedAt: Date.now() - 60000, // 1 minute ago
    retryCount: 0,
  }

  it('renders transaction title and description', () => {
    render(<TransactionStatusCard transaction={baseMockTransaction} />)

    expect(screen.getByText('Test Transfer')).toBeInTheDocument()
    expect(screen.getByText('Transferring tokens to recipient')).toBeInTheDocument()
  })

  it('displays transaction hash in formatted form', () => {
    render(<TransactionStatusCard transaction={baseMockTransaction} />)

    // Hash is formatted with formatAddress function - should show truncated version
    expect(screen.getByText(/0xabc1.../)).toBeInTheDocument()
  })

  it('shows pending status badge', () => {
    render(<TransactionStatusCard transaction={baseMockTransaction} />)

    expect(screen.getByText('pending')).toBeInTheDocument()
  })

  it('shows confirmed status for completed transactions', () => {
    const confirmedTx = {
      ...baseMockTransaction,
      status: 'confirmed' as const,
      confirmedAt: Date.now(),
      blockNumber: BigInt(12345),
    }

    render(<TransactionStatusCard transaction={confirmedTx} />)

    expect(screen.getByText('confirmed')).toBeInTheDocument()
  })

  it('shows failed status for failed transactions', () => {
    const failedTx = {
      ...baseMockTransaction,
      status: 'failed' as const,
      error: new Error('Transaction reverted'),
    }

    render(<TransactionStatusCard transaction={failedTx} />)

    expect(screen.getByText('failed')).toBeInTheDocument()
  })

  it('displays chain name', () => {
    render(<TransactionStatusCard transaction={baseMockTransaction} />)

    expect(screen.getByText('Ethereum')).toBeInTheDocument()
  })

  it('shows relative timestamp', () => {
    render(<TransactionStatusCard transaction={baseMockTransaction} />)

    expect(screen.getByText('1m ago')).toBeInTheDocument()
  })

  it('shows retry count when present', () => {
    const retriedTx = {...baseMockTransaction, retryCount: 2}

    render(<TransactionStatusCard transaction={retriedTx} />)

    expect(screen.getByText('Retry 2')).toBeInTheDocument()
  })

  it('hides action buttons when showActions is false', () => {
    render(<TransactionStatusCard transaction={baseMockTransaction} showActions={false} />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('shows copy button by default', () => {
    render(<TransactionStatusCard transaction={baseMockTransaction} showActions />)

    const copyButton = screen.getByTitle(/copy transaction hash/i)
    expect(copyButton).toBeInTheDocument()
  })

  it('displays error message for failed transactions', () => {
    const failedTx = {
      ...baseMockTransaction,
      status: 'failed' as const,
      error: new Error('Transaction reverted: insufficient funds'),
    }

    render(<TransactionStatusCard transaction={failedTx} />)

    expect(screen.getByText('Transaction reverted: insufficient funds')).toBeInTheDocument()
  })

  it('shows remove button for completed transactions when onRemove is provided', () => {
    const confirmedTx = {
      ...baseMockTransaction,
      status: 'confirmed' as const,
      confirmedAt: Date.now(),
    }

    const mockOnRemove = () => {}
    render(<TransactionStatusCard transaction={confirmedTx} onRemove={mockOnRemove} />)

    const removeButton = screen.getByTitle('Remove transaction')
    expect(removeButton).toBeInTheDocument()
  })

  it('does not show remove button for pending transactions', () => {
    const mockOnRemove = () => {}
    render(<TransactionStatusCard transaction={baseMockTransaction} onRemove={mockOnRemove} />)

    expect(screen.queryByTitle('Remove transaction')).not.toBeInTheDocument()
  })
})
