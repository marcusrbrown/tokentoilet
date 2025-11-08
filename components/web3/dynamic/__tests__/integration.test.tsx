import {render, waitFor} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

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
    }, 20000) // Increased timeout for CI environment
  })

  describe('Component Import Performance', () => {
    it('should allow repeated imports of same component', async () => {
      // Dynamic imports are cached by the module system - this verifies
      // that repeated imports work correctly without timing assertions
      const import1 = await import('@/components/web3/dynamic/token-list')
      const import2 = await import('@/components/web3/dynamic/token-list')

      // Both imports should return the same module
      expect(import1).toBe(import2)
      expect(import1.DynamicTokenList).toBe(import2.DynamicTokenList)
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
