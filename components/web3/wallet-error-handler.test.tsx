import type {WalletErrorRecovery, WalletSpecificError} from '@/lib/web3/wallet-error-types'

import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {WalletErrorHandler, WalletErrorMessage} from './wallet-error-handler'

describe('WalletErrorHandler', () => {
  const onRetry = vi.fn()
  const onDismiss = vi.fn()

  describe('MetaMask errors', () => {
    it('should display MetaMask not installed error with install action', () => {
      const error: WalletSpecificError = {
        name: 'MetaMaskNotInstalled',
        message: 'MetaMask not found',
        code: 'METAMASK_NOT_INSTALLED',
        userFriendlyMessage: 'MetaMask not found',
        walletProvider: 'metamask',
        recoveryInstructions: ['Install MetaMask browser extension'],
      }
      const recovery: WalletErrorRecovery = {
        primaryAction: {
          type: 'install',
          label: 'Install MetaMask',
          url: 'https://metamask.io/download/',
        },
      }

      render(<WalletErrorHandler error={error} recovery={recovery} onRetry={onRetry} onDismiss={onDismiss} />)

      expect(screen.getByText('MetaMask not found')).toBeInTheDocument()
      expect(screen.getByText(/Install MetaMask browser extension/i)).toBeInTheDocument()
      expect(screen.getByRole('button', {name: /install metamask/i})).toBeInTheDocument()
    })

    it('should display MetaMask locked error with unlock action', () => {
      const error: WalletSpecificError = {
        name: 'MetaMaskLocked',
        message: 'MetaMask is locked',
        code: 'METAMASK_LOCKED',
        userFriendlyMessage: 'MetaMask is locked',
        walletProvider: 'metamask',
        recoveryInstructions: ['Unlock MetaMask extension'],
      }
      const recovery: WalletErrorRecovery = {
        primaryAction: {
          type: 'unlock',
          label: 'Unlock MetaMask',
        },
      }

      render(<WalletErrorHandler error={error} recovery={recovery} onRetry={onRetry} onDismiss={onDismiss} />)

      expect(screen.getByText('MetaMask is locked')).toBeInTheDocument()
      expect(screen.getByText(/Unlock MetaMask extension/i)).toBeInTheDocument()
      expect(screen.getByRole('button', {name: /unlock metamask/i})).toBeInTheDocument()
    })

    it('should display MetaMask account access denied error', () => {
      const error: WalletSpecificError = {
        name: 'MetaMaskAccessDenied',
        message: 'Access denied',
        code: 'METAMASK_ACCOUNT_ACCESS_DENIED',
        userFriendlyMessage: 'Access denied',
        walletProvider: 'metamask',
        recoveryInstructions: ['Approve the connection in MetaMask'],
      }

      render(<WalletErrorHandler error={error} onRetry={onRetry} onDismiss={onDismiss} />)

      expect(screen.getByText('Access denied')).toBeInTheDocument()
      expect(screen.getByText(/Approve the connection in MetaMask/i)).toBeInTheDocument()
    })
  })

  describe('WalletConnect errors', () => {
    it('should display WalletConnect session rejected error', () => {
      const error: WalletSpecificError = {
        name: 'WalletConnectSessionRejected',
        message: 'Session rejected',
        code: 'WALLETCONNECT_SESSION_REJECTED',
        userFriendlyMessage: 'Session rejected',
        walletProvider: 'walletconnect',
        recoveryInstructions: ['Scan the QR code again'],
      }
      const recovery: WalletErrorRecovery = {
        primaryAction: {
          type: 'retry',
          label: 'Try Again',
        },
      }

      render(<WalletErrorHandler error={error} recovery={recovery} onRetry={onRetry} onDismiss={onDismiss} />)

      expect(screen.getByText('Session rejected')).toBeInTheDocument()
      expect(screen.getByText(/Scan the QR code again/i)).toBeInTheDocument()
      expect(screen.getByRole('button', {name: /try again/i})).toBeInTheDocument()
    })

    it('should display WalletConnect QR code expired error', () => {
      const error: WalletSpecificError = {
        name: 'WalletConnectQRExpired',
        message: 'QR code expired',
        code: 'WALLETCONNECT_QR_CODE_EXPIRED',
        userFriendlyMessage: 'QR code expired',
        walletProvider: 'walletconnect',
        recoveryInstructions: ['Generate a new QR code'],
      }

      render(<WalletErrorHandler error={error} onRetry={onRetry} onDismiss={onDismiss} />)

      expect(screen.getByText('QR code expired')).toBeInTheDocument()
      expect(screen.getByText(/Generate a new QR code/i)).toBeInTheDocument()
    })
  })

  describe('Coinbase errors', () => {
    it('should display Coinbase not installed error', () => {
      const error: WalletSpecificError = {
        name: 'CoinbaseNotInstalled',
        message: 'Coinbase not found',
        code: 'COINBASE_NOT_INSTALLED',
        userFriendlyMessage: 'Coinbase not found',
        walletProvider: 'coinbase',
        recoveryInstructions: ['Install Coinbase Wallet'],
      }
      const recovery: WalletErrorRecovery = {
        primaryAction: {
          type: 'install',
          label: 'Install Coinbase Wallet',
          url: 'https://wallet.coinbase.com/',
        },
      }

      render(<WalletErrorHandler error={error} recovery={recovery} onRetry={onRetry} onDismiss={onDismiss} />)

      expect(screen.getByText('Coinbase not found')).toBeInTheDocument()
      expect(screen.getByRole('button', {name: /install coinbase wallet/i})).toBeInTheDocument()
    })

    it('should display Coinbase unauthorized error', () => {
      const error: WalletSpecificError = {
        name: 'CoinbaseUnauthorized',
        message: 'Access denied',
        code: 'COINBASE_UNAUTHORIZED',
        userFriendlyMessage: 'Access denied',
        walletProvider: 'coinbase',
        recoveryInstructions: ['Approve the connection in Coinbase Wallet'],
      }

      render(<WalletErrorHandler error={error} onRetry={onRetry} onDismiss={onDismiss} />)

      expect(screen.getByText('Access denied')).toBeInTheDocument()
      expect(screen.getByText(/Approve the connection in Coinbase Wallet/i)).toBeInTheDocument()
    })
  })

  describe('action buttons', () => {
    it('should call onRetry when retry button is clicked', () => {
      const error: WalletSpecificError = {
        name: 'WalletConnectConnectionFailed',
        message: 'Connection failed',
        code: 'WALLETCONNECT_SESSION_REJECTED',
        userFriendlyMessage: 'Connection failed',
        walletProvider: 'walletconnect',
      }
      const recovery: WalletErrorRecovery = {
        primaryAction: {
          type: 'retry',
          label: 'Try Again',
        },
      }

      render(<WalletErrorHandler error={error} recovery={recovery} onRetry={onRetry} onDismiss={onDismiss} />)

      const retryButton = screen.getByRole('button', {name: /try again/i})
      retryButton.click()

      expect(onRetry).toHaveBeenCalled()
    })

    it('should call onDismiss when dismiss button is clicked', () => {
      const error: WalletSpecificError = {
        name: 'GeneralError',
        message: 'Connection failed',
        code: 'METAMASK_LOCKED',
        userFriendlyMessage: 'Connection failed',
        walletProvider: 'metamask',
      }

      render(<WalletErrorHandler error={error} onRetry={onRetry} onDismiss={onDismiss} />)

      const dismissButton = screen.getByRole('button', {name: /dismiss/i})
      dismissButton.click()

      expect(onDismiss).toHaveBeenCalled()
    })

    it('should show refresh page option for certain errors', () => {
      const error: WalletSpecificError = {
        name: 'MetaMaskExtensionError',
        message: 'Extension error',
        code: 'METAMASK_EXTENSION_ERROR',
        userFriendlyMessage: 'Extension error',
        walletProvider: 'metamask',
      }
      const recovery: WalletErrorRecovery = {
        primaryAction: {
          type: 'refresh',
          label: 'Refresh Page',
        },
        secondaryActions: [
          {
            type: 'refresh',
            label: 'Refresh Page',
          },
        ],
      }

      render(<WalletErrorHandler error={error} recovery={recovery} onRetry={onRetry} onDismiss={onDismiss} />)

      const refreshButtons = screen.getAllByRole('button', {name: /refresh page/i})
      expect(refreshButtons.length).toBeGreaterThan(0)
    })

    it('should show try different wallet option', () => {
      const error: WalletSpecificError = {
        name: 'WalletConnectConnectionFailed',
        message: 'Connection failed',
        code: 'WALLETCONNECT_SESSION_REJECTED',
        userFriendlyMessage: 'Connection failed',
        walletProvider: 'walletconnect',
      }
      const recovery: WalletErrorRecovery = {
        primaryAction: {
          type: 'retry',
          label: 'Try Again',
        },
        secondaryActions: [
          {
            type: 'try_different_wallet',
            label: 'Try Different Wallet',
          },
        ],
      }

      render(<WalletErrorHandler error={error} recovery={recovery} onRetry={onRetry} onDismiss={onDismiss} />)

      expect(screen.getByRole('button', {name: /try different wallet/i})).toBeInTheDocument()
    })
  })

  describe('provider-specific styling', () => {
    it('should apply MetaMask styling', () => {
      const error: WalletSpecificError = {
        name: 'MetaMaskGeneralError',
        message: 'Test error',
        code: 'METAMASK_LOCKED',
        userFriendlyMessage: 'Test error',
        walletProvider: 'metamask',
      }

      render(<WalletErrorHandler error={error} onRetry={onRetry} onDismiss={onDismiss} />)

      const container = screen.getByRole('alert')
      expect(container).toHaveClass('border-red-200')
    })

    it('should apply WalletConnect styling', () => {
      const error: WalletSpecificError = {
        name: 'WalletConnectGeneralError',
        message: 'Test error',
        code: 'WALLETCONNECT_RELAY_ERROR',
        userFriendlyMessage: 'Test error',
        walletProvider: 'walletconnect',
      }

      render(<WalletErrorHandler error={error} onRetry={onRetry} onDismiss={onDismiss} />)

      const container = screen.getByRole('alert')
      expect(container).toHaveClass('border-red-200')
    })

    it('should apply Coinbase styling', () => {
      const error: WalletSpecificError = {
        name: 'CoinbaseGeneralError',
        message: 'Test error',
        code: 'COINBASE_NETWORK_ERROR',
        userFriendlyMessage: 'Test error',
        walletProvider: 'coinbase',
      }

      render(<WalletErrorHandler error={error} onRetry={onRetry} onDismiss={onDismiss} />)

      const container = screen.getByRole('alert')
      expect(container).toHaveClass('border-red-200')
    })

    it('should apply default styling for unknown wallets', () => {
      const error: WalletSpecificError = {
        name: 'UnknownWalletError',
        message: 'Test error',
        code: 'METAMASK_LOCKED',
        userFriendlyMessage: 'Test error',
        walletProvider: 'unknown',
      }

      render(<WalletErrorHandler error={error} onRetry={onRetry} onDismiss={onDismiss} />)

      const container = screen.getByRole('alert')
      expect(container).toHaveClass('border-red-200')
    })
  })
})

describe('WalletErrorMessage', () => {
  it('should display simple error message', () => {
    const error: WalletSpecificError = {
      name: 'MetaMaskGeneralError',
      message: 'Test error',
      code: 'METAMASK_LOCKED',
      userFriendlyMessage: 'Test error',
      walletProvider: 'metamask',
    }

    render(<WalletErrorMessage error={error} />)

    expect(screen.getByText('MetaMask Error:')).toBeInTheDocument()
    expect(screen.getByText('Test error')).toBeInTheDocument()
  })

  it('should apply appropriate styling based on wallet provider', () => {
    const error: WalletSpecificError = {
      name: 'WalletConnectGeneralError',
      message: 'Test error',
      code: 'WALLETCONNECT_RELAY_ERROR',
      userFriendlyMessage: 'Test error',
      walletProvider: 'walletconnect',
    }

    render(<WalletErrorMessage error={error} />)

    const container = screen.getByText('Test error').closest('.bg-red-50')
    expect(container).toBeInTheDocument()
  })
})
