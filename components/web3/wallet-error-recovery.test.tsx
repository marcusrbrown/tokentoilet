import type {WalletSpecificError} from '@/lib/web3/wallet-error-types'

import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {WalletErrorRecovery} from './wallet-error-recovery'

vi.mock('@/lib/web3/wallet-error-detector', () => ({
  getWalletErrorRecovery: vi.fn((error: WalletSpecificError) => {
    if (error.code === 'METAMASK_NOT_INSTALLED') {
      return {
        primaryAction: {type: 'install', label: 'Install MetaMask', url: 'https://metamask.io/download/'},
        secondaryActions: [{type: 'try_different_wallet', label: 'Try Different Wallet'}],
      }
    }
    if (error.code === 'METAMASK_LOCKED') {
      return {
        primaryAction: {type: 'unlock', label: 'Unlock MetaMask'},
      }
    }
    if (error.code === 'WALLETCONNECT_SESSION_REJECTED') {
      return {
        primaryAction: {type: 'retry', label: 'Try Again'},
        secondaryActions: [{type: 'try_different_wallet', label: 'Try Different Wallet'}],
      }
    }
    if (error.code === 'METAMASK_EXTENSION_ERROR') {
      return {
        primaryAction: {type: 'refresh', label: 'Refresh Page'},
        secondaryActions: [{type: 'contact_support', label: 'Contact Support', url: 'https://support.metamask.io'}],
      }
    }
    return {
      primaryAction: {type: 'retry', label: 'Try Again'},
    }
  }),
}))

describe('WalletErrorRecovery', () => {
  const createError = (overrides: Partial<WalletSpecificError> = {}): WalletSpecificError =>
    ({
      name: 'TestError',
      message: 'Test error message',
      code: 'METAMASK_LOCKED',
      userFriendlyMessage: 'Test user friendly message',
      walletProvider: 'metamask',
      recoveryInstructions: ['Step 1', 'Step 2'],
      ...overrides,
    }) as WalletSpecificError

  describe('rendering', () => {
    it('should render error message', () => {
      render(<WalletErrorRecovery error={createError()} />)

      expect(screen.getByText('Test user friendly message')).toBeInTheDocument()
    })

    it('should render error code as title', () => {
      render(<WalletErrorRecovery error={createError({code: 'METAMASK_LOCKED'})} />)

      expect(screen.getByText('METAMASK LOCKED')).toBeInTheDocument()
    })

    it('should render wallet provider badge', () => {
      render(<WalletErrorRecovery error={createError({walletProvider: 'metamask'})} />)

      expect(screen.getByText('MetaMask')).toBeInTheDocument()
    })

    it('should render recovery instructions when provided', () => {
      render(<WalletErrorRecovery error={createError({recoveryInstructions: ['Step 1', 'Step 2']})} />)

      expect(screen.getByText('Step 1')).toBeInTheDocument()
      expect(screen.getByText('Step 2')).toBeInTheDocument()
    })

    it('should not render recovery instructions section when empty', () => {
      render(<WalletErrorRecovery error={createError({recoveryInstructions: []})} />)

      expect(screen.queryByText('To resolve this:')).not.toBeInTheDocument()
    })

    it('should have alert role for accessibility', () => {
      render(<WalletErrorRecovery error={createError()} />)

      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })

  describe('wallet provider badges', () => {
    it('should show MetaMask badge with correct styling', () => {
      render(<WalletErrorRecovery error={createError({walletProvider: 'metamask'})} />)

      const badge = screen.getByText('MetaMask').closest('[role="status"]')
      expect(badge).toHaveClass('bg-orange-100')
    })

    it('should show WalletConnect badge', () => {
      render(<WalletErrorRecovery error={createError({walletProvider: 'walletconnect'})} />)

      expect(screen.getByText('WalletConnect')).toBeInTheDocument()
    })

    it('should show Coinbase Wallet badge', () => {
      render(<WalletErrorRecovery error={createError({walletProvider: 'coinbase'})} />)

      expect(screen.getByText('Coinbase Wallet')).toBeInTheDocument()
    })

    it('should show generic Wallet badge for unknown provider', () => {
      render(<WalletErrorRecovery error={createError({walletProvider: 'unknown'})} />)

      expect(screen.getByText('Wallet')).toBeInTheDocument()
    })
  })

  describe('primary actions', () => {
    it('should render install action button', () => {
      render(<WalletErrorRecovery error={createError({code: 'METAMASK_NOT_INSTALLED'})} />)

      expect(screen.getByRole('button', {name: /install metamask/i})).toBeInTheDocument()
    })

    it('should render unlock action button', () => {
      render(<WalletErrorRecovery error={createError({code: 'METAMASK_LOCKED'})} />)

      expect(screen.getByRole('button', {name: /unlock metamask/i})).toBeInTheDocument()
    })

    it('should render retry action button', () => {
      render(<WalletErrorRecovery error={createError({code: 'WALLETCONNECT_SESSION_REJECTED'})} />)

      expect(screen.getByRole('button', {name: /try again/i})).toBeInTheDocument()
    })

    it('should render refresh action button', () => {
      render(<WalletErrorRecovery error={createError({code: 'METAMASK_EXTENSION_ERROR'})} />)

      expect(screen.getByRole('button', {name: /refresh page/i})).toBeInTheDocument()
    })
  })

  describe('action callbacks', () => {
    it('should call onRetry when retry button is clicked', () => {
      const onRetry = vi.fn()
      render(<WalletErrorRecovery error={createError({code: 'WALLETCONNECT_SESSION_REJECTED'})} onRetry={onRetry} />)

      fireEvent.click(screen.getByRole('button', {name: /try again/i}))

      expect(onRetry).toHaveBeenCalledTimes(1)
    })

    it('should call onRetry when unlock button is clicked', () => {
      const onRetry = vi.fn()
      render(<WalletErrorRecovery error={createError({code: 'METAMASK_LOCKED'})} onRetry={onRetry} />)

      fireEvent.click(screen.getByRole('button', {name: /unlock metamask/i}))

      expect(onRetry).toHaveBeenCalledTimes(1)
    })

    it('should call onDismiss when dismiss button is clicked', () => {
      const onDismiss = vi.fn()
      render(<WalletErrorRecovery error={createError()} onDismiss={onDismiss} />)

      fireEvent.click(screen.getByRole('button', {name: /dismiss/i}))

      expect(onDismiss).toHaveBeenCalledTimes(1)
    })

    it('should not render dismiss button when onDismiss is not provided', () => {
      render(<WalletErrorRecovery error={createError()} />)

      expect(screen.queryByRole('button', {name: /dismiss/i})).not.toBeInTheDocument()
    })

    it('should call onDismiss when try different wallet is clicked', () => {
      const onDismiss = vi.fn()
      render(
        <WalletErrorRecovery error={createError({code: 'WALLETCONNECT_SESSION_REJECTED'})} onDismiss={onDismiss} />,
      )

      fireEvent.click(screen.getByRole('button', {name: /try different wallet/i}))

      expect(onDismiss).toHaveBeenCalledTimes(1)
    })
  })

  describe('secondary actions', () => {
    it('should render secondary action buttons', () => {
      render(<WalletErrorRecovery error={createError({code: 'METAMASK_NOT_INSTALLED'})} />)

      expect(screen.getByRole('button', {name: /try different wallet/i})).toBeInTheDocument()
    })

    it('should render contact support with external link icon', () => {
      render(<WalletErrorRecovery error={createError({code: 'METAMASK_EXTENSION_ERROR'})} />)

      expect(screen.getByRole('button', {name: /contact support/i})).toBeInTheDocument()
    })
  })

  describe('custom className', () => {
    it('should apply custom className', () => {
      render(<WalletErrorRecovery error={createError()} className="custom-class" />)

      expect(screen.getByRole('alert')).toHaveClass('custom-class')
    })
  })
})
