import type {WalletSpecificError} from '@/lib/web3/wallet-error-types'

import type {Meta, StoryObj} from '@storybook/react'

import {WalletErrorRecovery} from './wallet-error-recovery'

const meta: Meta<typeof WalletErrorRecovery> = {
  title: 'Web3/WalletErrorRecovery',
  component: WalletErrorRecovery,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Displays wallet-specific error messages with provider-specific styling and recovery actions. Automatically fetches recovery steps based on the error. Supports MetaMask, WalletConnect, and Coinbase Wallet error scenarios.',
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
      userFriendlyMessage: 'MetaMask extension not found. Please install MetaMask to connect.',
      walletProvider: 'metamask',
      recoveryInstructions: ['Install MetaMask browser extension', 'Restart your browser after installation'],
    } as WalletSpecificError,
  },
}

export const MetaMaskLocked: Story = {
  args: {
    error: {
      name: 'MetaMaskLocked',
      message: 'MetaMask is locked',
      code: 'METAMASK_LOCKED',
      userFriendlyMessage: 'MetaMask wallet is locked. Please unlock it to continue.',
      walletProvider: 'metamask',
      recoveryInstructions: ['Click the MetaMask extension icon', 'Enter your password to unlock'],
    } as WalletSpecificError,
  },
}

export const MetaMaskAccountAccessDenied: Story = {
  args: {
    error: {
      name: 'MetaMaskAccessDenied',
      message: 'User rejected the request',
      code: 'METAMASK_ACCOUNT_ACCESS_DENIED',
      userFriendlyMessage: 'Connection request was denied. Please approve the connection in MetaMask.',
      walletProvider: 'metamask',
      recoveryInstructions: ['Click "Connect" in MetaMask popup', 'Select the account you want to connect'],
    } as WalletSpecificError,
  },
}

export const MetaMaskExtensionError: Story = {
  args: {
    error: {
      name: 'MetaMaskExtensionError',
      message: 'Extension error occurred',
      code: 'METAMASK_EXTENSION_ERROR',
      userFriendlyMessage: 'MetaMask extension encountered an error.',
      walletProvider: 'metamask',
      recoveryInstructions: ['Refresh the page', 'Restart your browser', 'Disable and re-enable MetaMask extension'],
    } as WalletSpecificError,
  },
}

// WalletConnect Error Stories
export const WalletConnectSessionRejected: Story = {
  args: {
    error: {
      name: 'WalletConnectSessionRejected',
      message: 'Session request was rejected',
      code: 'WALLETCONNECT_SESSION_REJECTED',
      userFriendlyMessage: 'Connection was rejected in your wallet app.',
      walletProvider: 'walletconnect',
      recoveryInstructions: ['Scan the QR code again', 'Approve the connection in your wallet app'],
    } as WalletSpecificError,
  },
}

export const WalletConnectQRExpired: Story = {
  args: {
    error: {
      name: 'WalletConnectQRExpired',
      message: 'QR code has expired',
      code: 'WALLETCONNECT_QR_CODE_EXPIRED',
      userFriendlyMessage: 'The QR code has expired. Please generate a new one.',
      walletProvider: 'walletconnect',
      recoveryInstructions: ['Generate a new QR code', 'Scan within 2 minutes'],
    } as WalletSpecificError,
  },
}

export const WalletConnectRelayError: Story = {
  args: {
    error: {
      name: 'WalletConnectRelayError',
      message: 'Relay server connection failed',
      code: 'WALLETCONNECT_RELAY_ERROR',
      userFriendlyMessage: 'Connection server is temporarily unavailable.',
      walletProvider: 'walletconnect',
      recoveryInstructions: ['Check your internet connection', 'Try again in a few moments'],
    } as WalletSpecificError,
  },
}

// Coinbase Wallet Error Stories
export const CoinbaseNotInstalled: Story = {
  args: {
    error: {
      name: 'CoinbaseNotInstalled',
      message: 'Coinbase Wallet not found',
      code: 'COINBASE_NOT_INSTALLED',
      userFriendlyMessage: 'Coinbase Wallet not detected. Please install it to continue.',
      walletProvider: 'coinbase',
      recoveryInstructions: ['Install Coinbase Wallet app or extension', 'Make sure it is properly installed'],
    } as WalletSpecificError,
  },
}

export const CoinbaseUnauthorized: Story = {
  args: {
    error: {
      name: 'CoinbaseUnauthorized',
      message: 'Authorization failed',
      code: 'COINBASE_UNAUTHORIZED',
      userFriendlyMessage: 'Connection authorization failed. Please try again.',
      walletProvider: 'coinbase',
      recoveryInstructions: [
        'Approve the connection in Coinbase Wallet',
        'Make sure you are logged into Coinbase Wallet',
      ],
    } as WalletSpecificError,
  },
}

export const CoinbaseNetworkError: Story = {
  args: {
    error: {
      name: 'CoinbaseNetworkError',
      message: 'Network connection failed',
      code: 'COINBASE_NETWORK_ERROR',
      userFriendlyMessage: 'Network connection error with Coinbase Wallet.',
      walletProvider: 'coinbase',
      recoveryInstructions: ['Check your internet connection', 'Verify Coinbase Wallet is online'],
    } as WalletSpecificError,
  },
}

export const UnknownWalletError: Story = {
  args: {
    error: {
      name: 'UnknownWalletError',
      message: 'An unexpected error occurred',
      code: 'METAMASK_EXTENSION_ERROR',
      userFriendlyMessage: 'An unexpected wallet error occurred.',
      walletProvider: 'unknown',
      recoveryInstructions: ['Try refreshing the page', 'Check your wallet connection'],
    } as WalletSpecificError,
  },
}

// Interactive Stories
export const WithRetryAction: Story = {
  args: {
    error: {
      name: 'ConnectionFailed',
      message: 'Connection failed',
      code: 'METAMASK_LOCKED',
      userFriendlyMessage: 'Failed to connect to MetaMask. Please try again.',
      walletProvider: 'metamask',
      recoveryInstructions: ['Ensure MetaMask is unlocked', 'Click retry to try again'],
    } as WalletSpecificError,
  },
}

export const WithDismissAction: Story = {
  args: {
    error: {
      name: 'MinorError',
      message: 'Minor error occurred',
      code: 'WALLETCONNECT_SESSION_REJECTED',
      userFriendlyMessage: 'Connection was cancelled.',
      walletProvider: 'walletconnect',
    } as WalletSpecificError,
  },
}

export const NoRecoveryInstructions: Story = {
  args: {
    error: {
      name: 'SimpleError',
      message: 'Simple error',
      code: 'COINBASE_NETWORK_ERROR',
      userFriendlyMessage: 'A network error occurred.',
      walletProvider: 'coinbase',
    } as WalletSpecificError,
  },
}
