import type {
  WalletErrorPattern,
  WalletErrorRecovery,
  WalletProvider,
  WalletProviderInfo,
  WalletSpecificError,
  WalletSpecificErrorCode,
} from './wallet-error-types'
import {WALLET_ERROR_PATTERNS} from './wallet-error-types'

// Ethereum provider type definitions
interface EthereumProvider extends Record<string, unknown> {
  isMetaMask?: boolean
  isCoinbaseWallet?: boolean
  request?: (args: {method: string; params?: unknown[]}) => Promise<unknown>
  on?: (event: string, callback: (...args: unknown[]) => void) => void
  removeListener?: (event: string, callback: (...args: unknown[]) => void) => void
  version?: string
  selectedProvider?: {
    isCoinbaseWallet?: boolean
    version?: string
  }
}

interface WindowWithEthereum extends Window {
  ethereum?: EthereumProvider
}

/**
 * Utility class for detecting and classifying wallet-specific errors
 *
 * Analyzes error messages, stack traces, and context to determine which wallet
 * provider an error originated from and provide appropriate error classification
 * with recovery suggestions.
 */
export class WalletErrorDetector {
  private readonly patterns: WalletErrorPattern[]

  constructor(patterns: WalletErrorPattern[] = WALLET_ERROR_PATTERNS) {
    this.patterns = patterns
  }

  /**
   * Detect wallet provider from error or browser environment
   */
  detectWalletProvider(error?: Error): WalletProvider {
    if (error) {
      const errorString = this.normalizeErrorForMatching(error)

      // Check error message patterns to identify wallet
      for (const pattern of this.patterns) {
        if (this.matchesErrorPattern(errorString, pattern.patterns.messagePatterns)) {
          return pattern.provider
        }
      }
    }

    // Fallback to environment detection
    return this.detectWalletFromEnvironment()
  }

  /**
   * Classify a wallet-specific error and enhance it with provider-specific information
   */
  classifyWalletError(
    error: Error,
    context?: {
      action?: 'connect' | 'disconnect' | 'switch_chain' | 'sign_transaction' | 'sign_message'
      chainId?: number
      userAgent?: string
    },
  ): WalletSpecificError {
    const provider = this.detectWalletProvider(error)
    const errorString = this.normalizeErrorForMatching(error)

    // Find matching pattern
    const matchedPattern = this.patterns.find(
      pattern =>
        pattern.provider === provider && this.matchesErrorPattern(errorString, pattern.patterns.messagePatterns),
    )

    const enhancedError = error as WalletSpecificError

    if (matchedPattern) {
      enhancedError.code = matchedPattern.errorCode
      enhancedError.walletProvider = matchedPattern.provider
      enhancedError.userFriendlyMessage = matchedPattern.userMessage
      enhancedError.recoveryInstructions = matchedPattern.recoveryInstructions
      enhancedError.helpUrl = matchedPattern.helpUrl
    } else {
      // Fallback classification for unknown errors
      enhancedError.code = this.getFallbackErrorCode(provider)
      enhancedError.walletProvider = provider
      enhancedError.userFriendlyMessage = this.getFallbackUserMessage(provider, error)
      enhancedError.recoveryInstructions = this.getFallbackRecoveryInstructions(provider)
    }

    enhancedError.originalError = error
    enhancedError.errorContext = {
      action: context?.action || 'connect',
      timestamp: Date.now(),
      userAgent:
        context?.userAgent ?? (typeof navigator === 'undefined' ? undefined : (navigator.userAgent ?? undefined)),
      additionalData: {
        chainId: context?.chainId,
      },
    }

    return enhancedError
  }

  /**
   * Get recovery suggestions for a wallet-specific error
   */
  getRecoveryActions(error: WalletSpecificError): WalletErrorRecovery {
    const pattern = this.patterns.find(p => p.provider === error.walletProvider && p.errorCode === error.code)

    if (!pattern) {
      return this.getFallbackRecoveryActions(error.walletProvider)
    }

    return {
      primaryAction: this.getPrimaryActionForError(error.code, pattern),
      secondaryActions: this.getSecondaryActionsForError(error.code, pattern),
      documentationUrl: pattern.helpUrl,
    }
  }

  /**
   * Get information about available wallet providers
   */
  getWalletProviderInfo(provider: WalletProvider): WalletProviderInfo {
    switch (provider) {
      case 'metamask':
        return {
          provider: 'metamask',
          isInstalled: this.isMetaMaskInstalled(),
          version: this.getMetaMaskVersion(),
          isSupported: true,
          installUrl: 'https://metamask.io/download/',
          capabilities: {
            supportsChainSwitching: true,
            supportsNetworkAddition: true,
            supportsSignTypedData: true,
          },
        }

      case 'coinbase':
        return {
          provider: 'coinbase',
          isInstalled: this.isCoinbaseWalletInstalled(),
          version: this.getCoinbaseWalletVersion(),
          isSupported: true,
          installUrl: 'https://wallet.coinbase.com/',
          capabilities: {
            supportsChainSwitching: true,
            supportsNetworkAddition: true,
            supportsSignTypedData: true,
          },
        }

      case 'walletconnect':
        return {
          provider: 'walletconnect',
          isInstalled: true, // WalletConnect doesn't require installation
          isSupported: true,
          capabilities: {
            supportsChainSwitching: true,
            supportsNetworkAddition: false, // Depends on connected wallet
            supportsSignTypedData: true,
          },
        }

      case 'unknown':
        return {
          provider: 'unknown',
          isInstalled: false,
          isSupported: false,
          capabilities: {
            supportsChainSwitching: false,
            supportsNetworkAddition: false,
            supportsSignTypedData: false,
          },
        }

      default:
        return {
          provider: 'unknown',
          isInstalled: false,
          isSupported: false,
          capabilities: {
            supportsChainSwitching: false,
            supportsNetworkAddition: false,
            supportsSignTypedData: false,
          },
        }
    }
  }

  /**
   * Check if a specific wallet provider is available in the current environment
   */
  isWalletProviderAvailable(provider: WalletProvider): boolean {
    return this.getWalletProviderInfo(provider).isInstalled
  }

  /**
   * Normalize error for pattern matching
   */
  private normalizeErrorForMatching(error: Error): string {
    const message = error.message ?? ''
    const stack = error.stack ?? ''
    const errorString = `${message} ${stack}`.toLowerCase()

    // Remove common noise from error strings
    return errorString
      .replaceAll(/\s+/g, ' ')
      .replaceAll(/[^\w\s]/g, ' ')
      .trim()
  }

  /**
   * Check if error string matches any of the provided patterns
   */
  private matchesErrorPattern(errorString: string, patterns: string[]): boolean {
    return patterns.some(pattern => errorString.includes(pattern.toLowerCase()))
  }

  /**
   * Detect wallet provider from browser environment
   */
  private detectWalletFromEnvironment(): WalletProvider {
    if (typeof window === 'undefined') {
      return 'unknown'
    }

    // Check for MetaMask
    if (this.isMetaMaskInstalled()) {
      return 'metamask'
    }

    // Check for Coinbase Wallet
    if (this.isCoinbaseWalletInstalled()) {
      return 'coinbase'
    }

    // WalletConnect doesn't have a specific provider object
    // It's detected based on connection method
    return 'unknown'
  }

  /**
   * Check if MetaMask is installed
   */
  private isMetaMaskInstalled(): boolean {
    if (typeof window === 'undefined') return false

    const windowWithEthereum = window as WindowWithEthereum
    const {ethereum} = windowWithEthereum
    return Boolean(ethereum?.isMetaMask === true)
  }

  /**
   * Get MetaMask version if available
   */
  private getMetaMaskVersion(): string | undefined {
    if (typeof window === 'undefined') return undefined

    const windowWithEthereum = window as WindowWithEthereum
    const {ethereum} = windowWithEthereum
    return typeof ethereum?.version === 'string' ? ethereum.version : undefined
  }

  /**
   * Check if Coinbase Wallet is installed
   */
  private isCoinbaseWalletInstalled(): boolean {
    if (typeof window === 'undefined') return false

    const windowWithEthereum = window as WindowWithEthereum
    const {ethereum} = windowWithEthereum
    return Boolean(ethereum?.isCoinbaseWallet === true || ethereum?.selectedProvider?.isCoinbaseWallet === true)
  }

  /**
   * Get Coinbase Wallet version if available
   */
  private getCoinbaseWalletVersion(): string | undefined {
    if (typeof window === 'undefined') return undefined

    const windowWithEthereum = window as WindowWithEthereum
    const {ethereum} = windowWithEthereum
    const version = ethereum?.version ?? ethereum?.selectedProvider?.version
    return typeof version === 'string' ? version : undefined
  }

  /**
   * Get fallback error code for unknown errors
   */
  private getFallbackErrorCode(provider: WalletProvider): WalletSpecificErrorCode {
    switch (provider) {
      case 'metamask':
        return 'METAMASK_EXTENSION_ERROR'
      case 'walletconnect':
        return 'WALLETCONNECT_BRIDGE_ERROR'
      case 'coinbase':
        return 'COINBASE_EXTENSION_ERROR'
      case 'unknown':
        return 'METAMASK_EXTENSION_ERROR' // Default fallback
      default:
        return 'METAMASK_EXTENSION_ERROR' // Default fallback
    }
  }

  /**
   * Get fallback user message for unknown errors
   */
  private getFallbackUserMessage(provider: WalletProvider, error: Error): string {
    const walletName = this.getWalletDisplayName(provider)
    return `An error occurred while connecting to ${walletName}. ${error.message || 'Please try again.'}`
  }

  /**
   * Get fallback recovery instructions
   */
  private getFallbackRecoveryInstructions(provider: WalletProvider): string[] {
    const walletName = this.getWalletDisplayName(provider)
    return [
      `Check that ${walletName} is properly installed and unlocked`,
      'Refresh the page and try again',
      'If the problem persists, try restarting your browser',
    ]
  }

  /**
   * Get fallback recovery actions
   */
  private getFallbackRecoveryActions(_provider: WalletProvider): WalletErrorRecovery {
    return {
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
    }
  }

  /**
   * Get primary action for specific error
   */
  private getPrimaryActionForError(
    code: WalletSpecificErrorCode,
    pattern: WalletErrorPattern,
  ): WalletErrorRecovery['primaryAction'] {
    if (code.includes('NOT_INSTALLED')) {
      return {
        type: 'install',
        label: `Install ${this.getWalletDisplayName(pattern.provider)}`,
        url: pattern.helpUrl,
      }
    }

    if (code.includes('LOCKED') || code.includes('UNAUTHORIZED')) {
      return {
        type: 'unlock',
        label: `Unlock ${this.getWalletDisplayName(pattern.provider)}`,
      }
    }

    if (code.includes('EXPIRED') || code.includes('TIMEOUT')) {
      return {
        type: 'retry',
        label: 'Try Again',
      }
    }

    return {
      type: 'retry',
      label: 'Retry Connection',
    }
  }

  /**
   * Get secondary actions for specific error
   */
  private getSecondaryActionsForError(
    code: WalletSpecificErrorCode,
    pattern: WalletErrorPattern,
  ): WalletErrorRecovery['secondaryActions'] {
    const actions: WalletErrorRecovery['secondaryActions'] = []

    if (!code.includes('NOT_INSTALLED')) {
      actions.push({
        type: 'refresh',
        label: 'Refresh Page',
      })
    }

    if (pattern.provider !== 'walletconnect') {
      actions.push({
        type: 'try_different_wallet',
        label: 'Try Different Wallet',
      })
    }

    if (pattern.helpUrl !== undefined && pattern.helpUrl.length > 0) {
      actions.push({
        type: 'contact_support',
        label: 'Get Help',
        url: pattern.helpUrl,
      })
    }

    return actions
  }

  /**
   * Get display name for wallet provider
   */
  private getWalletDisplayName(provider: WalletProvider): string {
    switch (provider) {
      case 'metamask':
        return 'MetaMask'
      case 'walletconnect':
        return 'WalletConnect'
      case 'coinbase':
        return 'Coinbase Wallet'
      case 'unknown':
        return 'Wallet'
      default:
        return 'Wallet'
    }
  }
}

// Export singleton instance for use throughout the application
export const walletErrorDetector = new WalletErrorDetector()

/**
 * Convenience function to classify wallet errors
 */
export function classifyWalletError(
  error: Error,
  context?: Parameters<WalletErrorDetector['classifyWalletError']>[1],
): WalletSpecificError {
  return walletErrorDetector.classifyWalletError(error, context)
}

/**
 * Convenience function to get recovery actions
 */
export function getWalletErrorRecovery(error: WalletSpecificError): WalletErrorRecovery {
  return walletErrorDetector.getRecoveryActions(error)
}

/**
 * Convenience function to check wallet availability
 */
export function isWalletAvailable(provider: WalletProvider): boolean {
  return walletErrorDetector.isWalletProviderAvailable(provider)
}

/**
 * Convenience function to get wallet information
 */
export function getWalletInfo(provider: WalletProvider): WalletProviderInfo {
  return walletErrorDetector.getWalletProviderInfo(provider)
}
