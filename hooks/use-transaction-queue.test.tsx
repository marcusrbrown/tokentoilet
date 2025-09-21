import {renderHook} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {useTransactionQueue} from './use-transaction-queue'

// Mock the transaction queue module
vi.mock('@/lib/web3/transaction-queue', () => {
  const mockQueue = {
    addTransaction: vi.fn(),
    removeTransaction: vi.fn(),
    getTransactions: vi.fn(() => []),
    getTransaction: vi.fn(),
    clearQueue: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    getStatistics: vi.fn(() => ({
      total: 0,
      pending: 0,
      confirmed: 0,
      failed: 0,
    })),
  }

  return {
    getTransactionQueue: vi.fn(() => mockQueue),
  }
})

describe('useTransactionQueue', () => {
  it('returns initial empty state', () => {
    const {result} = renderHook(() => useTransactionQueue())

    expect(result.current.transactions).toEqual([])
    expect(result.current.totalTransactions).toBe(0)
    expect(result.current.pendingCount).toBe(0)
    expect(result.current.confirmedCount).toBe(0)
    expect(result.current.failedCount).toBe(0)
    expect(result.current.hasPendingTransactions).toBe(false)
    expect(result.current.hasFailedTransactions).toBe(false)
    expect(result.current.isProcessing).toBe(false)
  })

  it('provides queue management functions', () => {
    const {result} = renderHook(() => useTransactionQueue())

    expect(typeof result.current.addTransaction).toBe('function')
    expect(typeof result.current.removeTransaction).toBe('function')
    expect(typeof result.current.clearQueue).toBe('function')
    expect(typeof result.current.getTransaction).toBe('function')
    expect(typeof result.current.getTransactionsByChain).toBe('function')
    expect(typeof result.current.getTransactionsByStatus).toBe('function')
    expect(typeof result.current.getTransactionsByType).toBe('function')
  })

  it('provides event handler registration functions', () => {
    const {result} = renderHook(() => useTransactionQueue())

    expect(typeof result.current.onTransactionAdded).toBe('function')
    expect(typeof result.current.onTransactionConfirmed).toBe('function')
    expect(typeof result.current.onTransactionFailed).toBe('function')
  })
})
