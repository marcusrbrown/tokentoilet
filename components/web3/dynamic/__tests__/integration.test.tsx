import type {RenderResult} from '@testing-library/react'

import {render, waitFor} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

const MAX_TEST_LOAD_TIME_MS = 500

describe('Dynamic Component Integration Tests - User Flows (TASK-029)', () => {
  describe('Sequential Component Loading', () => {
    it('should dynamically import and render TokenList component', async () => {
      const {DynamicTokenList} = await import('@/components/web3/dynamic/token-list')
      const {container} = render(<DynamicTokenList />)

      await waitFor(() => {
        expect(container.firstChild).toBeTruthy()
      })
    })

    it('should dynamically import and render WalletDashboard component', async () => {
      const {DynamicWalletDashboard} = await import('@/components/web3/dynamic/wallet-dashboard')
      const {container} = render(<DynamicWalletDashboard />)

      await waitFor(() => {
        expect(container.firstChild).toBeTruthy()
      })
    })

    it('should dynamically import and render TransactionQueue component', async () => {
      const {DynamicTransactionQueue} = await import('@/components/web3/dynamic/transaction-queue')
      const {container} = render(<DynamicTransactionQueue />)

      await waitFor(() => {
        expect(container.firstChild).toBeTruthy()
      })
    })

    it('should dynamically import and render WalletSwitcher component', async () => {
      const {DynamicWalletSwitcher} = await import('@/components/web3/dynamic/wallet-switcher')
      const {container} = render(<DynamicWalletSwitcher />)

      await waitFor(() => {
        expect(container.firstChild).toBeTruthy()
      })
    })
  })

  describe('Multi-Component User Journey', () => {
    it('should load multiple dynamic components sequentially without errors', async () => {
      const {DynamicWalletDashboard} = await import('@/components/web3/dynamic/wallet-dashboard')
      const {DynamicTokenList} = await import('@/components/web3/dynamic/token-list')
      const {DynamicTransactionQueue} = await import('@/components/web3/dynamic/transaction-queue')

      const {rerender, container} = render(<DynamicWalletDashboard />)
      await waitFor(() => {
        expect(container.firstChild).toBeTruthy()
      })

      rerender(<DynamicTokenList />)
      await waitFor(() => {
        expect(container.firstChild).toBeTruthy()
      })

      rerender(<DynamicTransactionQueue />)
      await waitFor(() => {
        expect(container.firstChild).toBeTruthy()
      })
    })

    it('should handle parallel component loading', async () => {
      const [{DynamicTokenList}, {DynamicWalletDashboard}, {DynamicTransactionQueue}, {DynamicWalletSwitcher}] =
        await Promise.all([
          import('@/components/web3/dynamic/token-list'),
          import('@/components/web3/dynamic/wallet-dashboard'),
          import('@/components/web3/dynamic/transaction-queue'),
          import('@/components/web3/dynamic/wallet-switcher'),
        ])

      const renders: RenderResult[] = [
        render(<DynamicTokenList />),
        render(<DynamicWalletDashboard />),
        render(<DynamicTransactionQueue />),
        render(<DynamicWalletSwitcher />),
      ]

      await Promise.all(
        renders.map(async ({container}) => {
          await waitFor(() => {
            expect(container.firstChild).toBeTruthy()
          })
        }),
      )
    })
  })

  describe('Component Import Performance', () => {
    it('should load components within acceptable timeframe', async () => {
      const startTime = performance.now()

      await import('@/components/web3/dynamic/token-list')
      await import('@/components/web3/dynamic/wallet-dashboard')
      await import('@/components/web3/dynamic/transaction-queue')

      const loadTime = performance.now() - startTime

      expect(loadTime).toBeLessThan(MAX_TEST_LOAD_TIME_MS)
    })

    it('should cache dynamic imports for subsequent uses', async () => {
      const start1 = performance.now()
      await import('@/components/web3/dynamic/token-list')
      const time1 = performance.now() - start1

      const start2 = performance.now()
      await import('@/components/web3/dynamic/token-list')
      const time2 = performance.now() - start2

      expect(time2).toBeLessThanOrEqual(time1)
    })
  })

  describe('Component Reusability', () => {
    it('should allow multiple instances of same dynamic component', async () => {
      const {DynamicTokenList} = await import('@/components/web3/dynamic/token-list')

      const instance1 = render(<DynamicTokenList />)
      const instance2 = render(<DynamicTokenList />)
      const instance3 = render(<DynamicTokenList />)

      await Promise.all([
        waitFor(() => expect(instance1.container.firstChild).toBeTruthy()),
        waitFor(() => expect(instance2.container.firstChild).toBeTruthy()),
        waitFor(() => expect(instance3.container.firstChild).toBeTruthy()),
      ])
    })
  })
})
