import type {WalletErrorRecovery, WalletSpecificError} from '@/lib/web3/wallet-error-types'

import type {Meta, StoryObj} from '@storybook/react'

import {WalletErrorHandler, type WalletErrorMessage} from './wallet-error-handler'

const meta: Meta<typeof WalletErrorHandler> = {
  title: 'Web3/WalletErrorHandler',
  component: WalletErrorHandler,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Displays wallet-specific error messages with provider-specific styling and recovery actions. Supports MetaMask, WalletConnect, and Coinbase Wallet error scenarios.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onRetry: {action: 'retry'},
    onDismiss: {action: 'dismiss'},
  },
}

export default meta
type Story = StoryObj<typeof meta>

// MetaMask Error Stories
export const MetaMaskNotInstalled: Story = {
  args: {
    error: {
      name: 'MetaMaskNotInstalled',
      message: 'MetaMask not found',
      code: 'METAMASK_NOT_INSTALLED',
      userFriendlyMessage: 'MetaMask extension not found',
      walletProvider: 'metamask',
      recoveryInstructions: ['Install MetaMask browser extension', 'Restart your browser after installation'],
    } as WalletSpecificError,
    recovery: {
      primaryAction: {
        type: 'install',
        label: 'Install MetaMask',
        url: 'https://metamask.io/download/',
      },
    } as WalletErrorRecovery,
  },
}

export const MetaMaskLocked: Story = {
  args: {
    error: {
      name: 'MetaMaskLocked',
      message: 'MetaMask is locked',
      code: 'METAMASK_LOCKED',
      userFriendlyMessage: 'MetaMask wallet is locked',
      walletProvider: 'metamask',
      recoveryInstructions: ['Unlock MetaMask extension', 'Enter your password'],
    } as WalletSpecificError,
    recovery: {
      primaryAction: {
        type: 'unlock',
        label: 'Unlock MetaMask',
      },
    } as WalletErrorRecovery,
  },
}

export const MetaMaskAccountAccessDenied: Story = {
  args: {
    error: {
      name: 'MetaMaskAccessDenied',
      message: 'User rejected the request',
      code: 'METAMASK_ACCOUNT_ACCESS_DENIED',
      userFriendlyMessage: 'Connection request was denied',
      walletProvider: 'metamask',
      recoveryInstructions: ['Click "Connect" in MetaMask popup', 'Select the account you want to connect'],
    } as WalletSpecificError,
    recovery: {
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
    } as WalletErrorRecovery,
  },
}

export const MetaMaskExtensionError: Story = {
  args: {
    error: {
      name: 'MetaMaskExtensionError',
      message: 'Extension error occurred',
      code: 'METAMASK_EXTENSION_ERROR',
      userFriendlyMessage: 'MetaMask extension encountered an error',
      walletProvider: 'metamask',
      recoveryInstructions: ['Refresh the page', 'Restart your browser', 'Disable and re-enable MetaMask extension'],
    } as WalletSpecificError,
    recovery: {
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
    } as WalletErrorRecovery,
  },
}

// WalletConnect Error Stories
export const WalletConnectSessionRejected: Story = {
  args: {
    error: {
      name: 'WalletConnectSessionRejected',
      message: 'Session request was rejected',
      code: 'WALLETCONNECT_SESSION_REJECTED',
      userFriendlyMessage: 'Connection was rejected in your wallet',
      walletProvider: 'walletconnect',
      recoveryInstructions: ['Scan the QR code again', 'Approve the connection in your wallet app'],
    } as WalletSpecificError,
    recovery: {
      primaryAction: {
        type: 'retry',
        label: 'Try Again',
      },
    } as WalletErrorRecovery,
  },
}

export const WalletConnectQRExpired: Story = {
  args: {
    error: {
      name: 'WalletConnectQRExpired',
      message: 'QR code has expired',
      code: 'WALLETCONNECT_QR_CODE_EXPIRED',
      userFriendlyMessage: 'QR code has expired',
      walletProvider: 'walletconnect',
      recoveryInstructions: ['Generate a new QR code', 'Scan within 2 minutes'],
    } as WalletSpecificError,
    recovery: {
      primaryAction: {
        type: 'retry',
        label: 'Generate New QR',
      },
    } as WalletErrorRecovery,
  },
}

export const WalletConnectRelayError: Story = {
  args: {
    error: {
      name: 'WalletConnectRelayError',
      message: 'Relay server connection failed',
      code: 'WALLETCONNECT_RELAY_ERROR',
      userFriendlyMessage: 'Connection server unavailable',
      walletProvider: 'walletconnect',
      recoveryInstructions: ['Check your internet connection', 'Try again in a few moments'],
    } as WalletSpecificError,
    recovery: {
      primaryAction: {
        type: 'retry',
        label: 'Retry Connection',
      },
      secondaryActions: [
        {
          type: 'try_different_wallet',
          label: 'Try Different Wallet',
        },
      ],
    } as WalletErrorRecovery,
  },
}

// Coinbase Wallet Error Stories
export const CoinbaseNotInstalled: Story = {
  args: {
    error: {
      name: 'CoinbaseNotInstalled',
      message: 'Coinbase Wallet not found',
      code: 'COINBASE_NOT_INSTALLED',
      userFriendlyMessage: 'Coinbase Wallet not detected',
      walletProvider: 'coinbase',
      recoveryInstructions: ['Install Coinbase Wallet app or extension', 'Make sure it is properly installed'],
    } as WalletSpecificError,
    recovery: {
      primaryAction: {
        type: 'install',
        label: 'Install Coinbase Wallet',
        url: 'https://wallet.coinbase.com/',
      },
    } as WalletErrorRecovery,
  },
}

export const CoinbaseUnauthorized: Story = {
  args: {
    error: {
      name: 'CoinbaseUnauthorized',
      message: 'Authorization failed',
      code: 'COINBASE_UNAUTHORIZED',
      userFriendlyMessage: 'Connection authorization failed',
      walletProvider: 'coinbase',
      recoveryInstructions: [
        'Approve the connection in Coinbase Wallet',
        'Make sure you are logged into Coinbase Wallet',
      ],
    } as WalletSpecificError,
    recovery: {
      primaryAction: {
        type: 'retry',
        label: 'Try Again',
      },
    } as WalletErrorRecovery,
  },
}

export const CoinbaseNetworkError: Story = {
  args: {
    error: {
      name: 'CoinbaseNetworkError',
      message: 'Network connection failed',
      code: 'COINBASE_NETWORK_ERROR',
      userFriendlyMessage: 'Network connection error',
      walletProvider: 'coinbase',
      recoveryInstructions: ['Check your internet connection', 'Verify Coinbase Wallet is online'],
    } as WalletSpecificError,
    recovery: {
      primaryAction: {
        type: 'retry',
        label: 'Retry Connection',
      },
      secondaryActions: [
        {
          type: 'refresh',
          label: 'Refresh Page',
        },
      ],
    } as WalletErrorRecovery,
  },
}

// Generic Error Story
export const UnknownWalletError: Story = {
  args: {
    error: {
      name: 'UnknownWalletError',
      message: 'An unexpected error occurred',
      code: 'METAMASK_LOCKED',
      userFriendlyMessage: 'Unknown wallet error',
      walletProvider: 'unknown',
      recoveryInstructions: ['Try refreshing the page', 'Check your wallet connection'],
    } as WalletSpecificError,
    recovery: {
      primaryAction: {
        type: 'retry',
        label: 'Try Again',
      },
      secondaryActions: [
        {
          type: 'refresh',
          label: 'Refresh Page',
        },
        {
          type: 'try_different_wallet',
          label: 'Try Different Wallet',
        },
      ],
    } as WalletErrorRecovery,
  },
}

// WalletErrorMessage Component Stories
export const SimpleErrorMessage: StoryObj<typeof WalletErrorMessage> = {
  args: {
    error: {
      name: 'MetaMaskGeneralError',
      message: 'Something went wrong with MetaMask',
      code: 'METAMASK_LOCKED',
      userFriendlyMessage: 'MetaMask encountered an error',
      walletProvider: 'metamask',
    } as WalletSpecificError,
  },
}

export const WalletConnectErrorMessage: StoryObj<typeof WalletErrorMessage> = {
  args: {
    error: {
      name: 'WalletConnectGeneralError',
      message: 'WalletConnect session failed',
      code: 'WALLETCONNECT_RELAY_ERROR',
      userFriendlyMessage: 'WalletConnect connection failed',
      walletProvider: 'walletconnect',
    } as WalletSpecificError,
  },
}

export const CoinbaseErrorMessage: StoryObj<typeof WalletErrorMessage> = {
  args: {
    error: {
      name: 'CoinbaseGeneralError',
      message: 'Coinbase Wallet error occurred',
      code: 'COINBASE_NETWORK_ERROR',
      userFriendlyMessage: 'Coinbase Wallet error',
      walletProvider: 'coinbase',
    } as WalletSpecificError,
  },
}
