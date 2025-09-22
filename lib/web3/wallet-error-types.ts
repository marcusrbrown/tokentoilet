/**
 * Wallet-specific error handling types and interfaces for enhanced error classification
 *
 * Extends the existing NetworkValidationError system to provide wallet provider-specific
 * error detection, classification, and recovery suggestions for MetaMask, WalletConnect,
 * and Coinbase Wallet.
 */

export type WalletProvider = 'metamask' | 'walletconnect' | 'coinbase' | 'unknown'

export type WalletSpecificErrorCode =
  // MetaMask specific errors
  | 'METAMASK_NOT_INSTALLED'
  | 'METAMASK_LOCKED'
  | 'METAMASK_ACCOUNT_ACCESS_DENIED'
  | 'METAMASK_NETWORK_NOT_ADDED'
  | 'METAMASK_CHAIN_SWITCH_DENIED'
  | 'METAMASK_TRANSACTION_DENIED'
  | 'METAMASK_POPUP_BLOCKED'
  | 'METAMASK_EXTENSION_ERROR'

  // WalletConnect specific errors
  | 'WALLETCONNECT_QR_CODE_EXPIRED'
  | 'WALLETCONNECT_SESSION_REJECTED'
  | 'WALLETCONNECT_SESSION_TIMEOUT'
  | 'WALLETCONNECT_BRIDGE_ERROR'
  | 'WALLETCONNECT_MOBILE_DISCONNECTED'
  | 'WALLETCONNECT_PAIRING_FAILED'
  | 'WALLETCONNECT_INVALID_CHAIN'
  | 'WALLETCONNECT_RELAY_ERROR'

  // Coinbase Wallet specific errors
  | 'COINBASE_NOT_INSTALLED'
  | 'COINBASE_MOBILE_LINK_ERROR'
  | 'COINBASE_EXTENSION_ERROR'
  | 'COINBASE_UNAUTHORIZED'
  | 'COINBASE_NETWORK_ERROR'
  | 'COINBASE_SIGNING_ERROR'
  | 'COINBASE_POPUP_BLOCKED'
  | 'COINBASE_CONNECTION_LOST'

/**
 * Enhanced wallet-specific error interface that extends NetworkValidationError
 */
export interface WalletSpecificError extends Error {
  // Core error classification
  code: WalletSpecificErrorCode
  walletProvider: WalletProvider

  // User-facing content
  userFriendlyMessage: string
  recoveryInstructions?: string[]
  helpUrl?: string

  // Technical details
  originalError?: Error
  chainId?: number
  suggestedChainId?: number

  // Error context
  errorContext?: {
    action: 'connect' | 'disconnect' | 'switch_chain' | 'sign_transaction' | 'sign_message'
    timestamp: number
    userAgent?: string
    additionalData?: Record<string, unknown>
  }
}

/**
 * Recovery action suggestions for wallet-specific errors
 */
export interface WalletErrorRecovery {
  primaryAction: {
    type: 'retry' | 'install' | 'unlock' | 'refresh' | 'manual_switch' | 'contact_support'
    label: string
    url?: string
  }
  secondaryActions?: {
    type: 'retry' | 'install' | 'unlock' | 'refresh' | 'manual_switch' | 'contact_support' | 'try_different_wallet'
    label: string
    url?: string
  }[]
  documentationUrl?: string
}

/**
 * Wallet provider detection result
 */
export interface WalletProviderInfo {
  provider: WalletProvider
  isInstalled: boolean
  version?: string
  isSupported: boolean
  installUrl?: string
  capabilities: {
    supportsChainSwitching: boolean
    supportsNetworkAddition: boolean
    supportsSignTypedData: boolean
  }
}

/**
 * Error pattern matching configuration for wallet detection
 */
export interface WalletErrorPattern {
  provider: WalletProvider
  errorCode: WalletSpecificErrorCode
  patterns: {
    messagePatterns: string[]
    codePatterns?: (string | number)[]
    stackPatterns?: string[]
  }
  userMessage: string
  recoveryInstructions: string[]
  helpUrl?: string
}

/**
 * Wallet-specific error detection configuration
 */
export const WALLET_ERROR_PATTERNS: WalletErrorPattern[] = [
  // MetaMask Errors
  {
    provider: 'metamask',
    errorCode: 'METAMASK_NOT_INSTALLED',
    patterns: {
      messagePatterns: [
        'metamask not found',
        'no metamask provider',
        'metamask is not installed',
        'please install metamask',
        'ethereum provider not found',
      ],
    },
    userMessage: 'MetaMask browser extension is not installed.',
    recoveryInstructions: [
      'Install the MetaMask browser extension from metamask.io',
      'Refresh the page after installation',
      'Click the MetaMask icon in your browser toolbar to set up your wallet',
    ],
    helpUrl: 'https://metamask.io/download/',
  },

  {
    provider: 'metamask',
    errorCode: 'METAMASK_LOCKED',
    patterns: {
      messagePatterns: [
        'metamask is locked',
        'wallet is locked',
        'please unlock metamask',
        'unauthorized',
        'user rejected',
      ],
    },
    userMessage: 'MetaMask wallet is locked or access was denied.',
    recoveryInstructions: [
      'Click the MetaMask icon in your browser toolbar',
      'Enter your password to unlock MetaMask',
      'Try connecting again',
    ],
  },

  {
    provider: 'metamask',
    errorCode: 'METAMASK_ACCOUNT_ACCESS_DENIED',
    patterns: {
      messagePatterns: [
        'user denied account authorization',
        'user rejected the request',
        'denied account access',
        'authorization denied',
      ],
    },
    userMessage: 'MetaMask account access was denied.',
    recoveryInstructions: [
      'Click "Connect" in the MetaMask popup',
      'Select the accounts you want to connect',
      'Approve the connection request',
    ],
  },

  {
    provider: 'metamask',
    errorCode: 'METAMASK_NETWORK_NOT_ADDED',
    patterns: {
      messagePatterns: ['unrecognized chain id', 'chain not added', 'network not found', 'unsupported network'],
    },
    userMessage: 'The requested network is not added to MetaMask.',
    recoveryInstructions: [
      'Add the network to MetaMask manually',
      'Or approve the network addition request in MetaMask',
      'Try switching networks again',
    ],
  },

  // WalletConnect Errors
  {
    provider: 'walletconnect',
    errorCode: 'WALLETCONNECT_SESSION_REJECTED',
    patterns: {
      messagePatterns: ['session rejected', 'user rejected', 'connection rejected', 'pairing rejected'],
    },
    userMessage: 'WalletConnect session was rejected.',
    recoveryInstructions: [
      'Scan the QR code with your mobile wallet',
      'Approve the connection request in your wallet app',
      'Ensure your wallet supports WalletConnect',
    ],
  },

  {
    provider: 'walletconnect',
    errorCode: 'WALLETCONNECT_QR_CODE_EXPIRED',
    patterns: {
      messagePatterns: ['qr code expired', 'session expired', 'connection timeout', 'pairing expired'],
    },
    userMessage: 'WalletConnect QR code has expired.',
    recoveryInstructions: [
      'Click "Try again" to generate a new QR code',
      'Scan the new QR code quickly with your mobile wallet',
      'Approve the connection promptly',
    ],
  },

  {
    provider: 'walletconnect',
    errorCode: 'WALLETCONNECT_BRIDGE_ERROR',
    patterns: {
      messagePatterns: ['bridge error', 'relay error', 'connection failed', 'network error'],
    },
    userMessage: 'WalletConnect bridge connection failed.',
    recoveryInstructions: [
      'Check your internet connection',
      'Try connecting again',
      'Consider using a different wallet or connection method',
    ],
  },

  // Coinbase Wallet Errors
  {
    provider: 'coinbase',
    errorCode: 'COINBASE_NOT_INSTALLED',
    patterns: {
      messagePatterns: [
        'coinbase wallet not found',
        'coinbase not installed',
        'no coinbase provider',
        'install coinbase wallet',
      ],
    },
    userMessage: 'Coinbase Wallet is not installed.',
    recoveryInstructions: [
      'Install Coinbase Wallet browser extension',
      'Or download the mobile app and use WalletConnect',
      'Refresh the page after installation',
    ],
    helpUrl: 'https://wallet.coinbase.com/',
  },

  {
    provider: 'coinbase',
    errorCode: 'COINBASE_MOBILE_LINK_ERROR',
    patterns: {
      messagePatterns: [
        'mobile link error',
        'coinbase mobile connection failed',
        'deep link failed',
        'mobile app not responding',
      ],
    },
    userMessage: 'Failed to connect to Coinbase mobile app.',
    recoveryInstructions: [
      'Ensure Coinbase Wallet mobile app is installed and updated',
      'Try using the browser extension instead',
      'Check that the mobile app is not in the background',
    ],
  },

  {
    provider: 'coinbase',
    errorCode: 'COINBASE_UNAUTHORIZED',
    patterns: {
      messagePatterns: [
        'coinbase unauthorized',
        'coinbase access denied',
        'coinbase user rejected',
        'authorization failed',
      ],
    },
    userMessage: 'Coinbase Wallet access was denied.',
    recoveryInstructions: [
      'Open Coinbase Wallet and approve the connection',
      'Check that you have accounts available in Coinbase Wallet',
      'Try connecting again',
    ],
  },
]
