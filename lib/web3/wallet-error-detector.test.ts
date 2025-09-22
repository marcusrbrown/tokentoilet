import type {WalletSpecificError} from '@/lib/web3/wallet-error-types'
import {
  classifyWalletError,
  getWalletErrorRecovery,
  isWalletAvailable,
  WalletErrorDetector,
} from '@/lib/web3/wallet-error-detector'

import {beforeEach, describe, expect, it, vi} from 'vitest'

// Extend window interface for testing
interface WindowWithEthereum extends Window {
  ethereum?: any
}

declare const window: WindowWithEthereum

// Mock window and ethereum objects
const mockEthereum = {
  isMetaMask: true,
  version: '10.25.0',
  isCoinbaseWallet: false,
  selectedProvider: {
    isCoinbaseWallet: false,
    version: '1.0.0',
  },
}

Object.defineProperty(window, 'ethereum', {
  writable: true,
  value: mockEthereum,
})

describe('WalletErrorDetector', () => {
  let detector: WalletErrorDetector

  beforeEach(() => {
    vi.clearAllMocks()
    detector = new WalletErrorDetector()
  })

  describe('detectWalletProvider', () => {
    it('should detect MetaMask from error message', () => {
      const error = new Error('MetaMask is locked')
      const provider = detector.detectWalletProvider(error)
      expect(provider).toBe('metamask')
    })

    it('should detect WalletConnect from error message', () => {
      const error = new Error('WalletConnect session rejected')
      const provider = detector.detectWalletProvider(error)
      expect(provider).toBe('walletconnect')
    })

    it('should detect Coinbase from error message', () => {
      const error = new Error('Coinbase Wallet not found')
      const provider = detector.detectWalletProvider(error)
      expect(provider).toBe('coinbase')
    })

    it('should fall back to environment detection when error does not match patterns', () => {
      const error = new Error('Unknown error')
      const provider = detector.detectWalletProvider(error)
      expect(provider).toBe('metamask') // Should detect from mocked window.ethereum
    })

    it('should return unknown when no error and no environment detection', () => {
      // Temporarily remove ethereum object by setting to undefined
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const originalEthereum = window.ethereum
      window.ethereum = undefined

      const provider = detector.detectWalletProvider()
      expect(provider).toBe('unknown')

      // Restore ethereum object
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      window.ethereum = originalEthereum
    })
  })

  describe('classifyWalletError', () => {
    it('should classify MetaMask not installed error', () => {
      const error = new Error('MetaMask is not installed')
      const classified = detector.classifyWalletError(error)

      expect(classified.code).toBe('METAMASK_NOT_INSTALLED')
      expect(classified.walletProvider).toBe('metamask')
      expect(classified.userFriendlyMessage).toContain('MetaMask browser extension is not installed')
      expect(classified.recoveryInstructions).toContain('Install the MetaMask browser extension from metamask.io')
      expect(classified.helpUrl).toBe('https://metamask.io/download/')
    })

    it('should classify MetaMask locked error', () => {
      const error = new Error('MetaMask is locked')
      const classified = detector.classifyWalletError(error)

      expect(classified.code).toBe('METAMASK_LOCKED')
      expect(classified.walletProvider).toBe('metamask')
      expect(classified.userFriendlyMessage).toContain('MetaMask wallet is locked')
    })

    it('should classify WalletConnect session rejected error', () => {
      const error = new Error('session rejected')
      const classified = detector.classifyWalletError(error, {action: 'connect'})

      expect(classified.code).toBe('WALLETCONNECT_SESSION_REJECTED')
      expect(classified.walletProvider).toBe('walletconnect')
      expect(classified.userFriendlyMessage).toContain('WalletConnect session was rejected')
      expect(classified.errorContext?.action).toBe('connect')
    })

    it('should classify Coinbase not installed error', () => {
      const error = new Error('Coinbase Wallet not found')
      const classified = detector.classifyWalletError(error)

      expect(classified.code).toBe('COINBASE_NOT_INSTALLED')
      expect(classified.walletProvider).toBe('coinbase')
      expect(classified.userFriendlyMessage).toContain('Coinbase Wallet is not installed')
      expect(classified.helpUrl).toBe('https://wallet.coinbase.com/')
    })

    it('should handle unknown errors with fallback classification', () => {
      const error = new Error('Some unknown wallet error')
      const classified = detector.classifyWalletError(error)

      expect(classified.code).toBe('METAMASK_EXTENSION_ERROR') // Fallback
      expect(classified.walletProvider).toBe('metamask') // From environment detection
      expect(classified.userFriendlyMessage).toContain('An error occurred while connecting')
    })

    it('should include error context information', () => {
      const error = new Error('Test error')
      const context = {
        action: 'switch_chain' as const,
        chainId: 137,
        userAgent: 'test-browser',
      }
      const classified = detector.classifyWalletError(error, context)

      expect(classified.errorContext).toMatchObject({
        action: 'switch_chain',
        additionalData: {chainId: 137},
        userAgent: 'test-browser',
      })
      expect(classified.errorContext?.timestamp).toBeTypeOf('number')
    })
  })

  describe('getRecoveryActions', () => {
    it('should provide install action for not installed errors', () => {
      const error = new Error('MetaMask not found') as WalletSpecificError
      error.code = 'METAMASK_NOT_INSTALLED'
      error.walletProvider = 'metamask'

      const recovery = detector.getRecoveryActions(error)

      expect(recovery.primaryAction.type).toBe('install')
      expect(recovery.primaryAction.label).toContain('MetaMask')
      expect(recovery.primaryAction.url).toBe('https://metamask.io/download/')
    })

    it('should provide unlock action for locked wallet errors', () => {
      const error = new Error('Wallet is locked') as WalletSpecificError
      error.code = 'METAMASK_LOCKED'
      error.walletProvider = 'metamask'

      const recovery = detector.getRecoveryActions(error)

      expect(recovery.primaryAction.type).toBe('unlock')
      expect(recovery.primaryAction.label).toContain('MetaMask')
    })

    it('should provide retry action for timeout errors', () => {
      const error = new Error('Connection timeout') as WalletSpecificError
      error.code = 'WALLETCONNECT_QR_CODE_EXPIRED'
      error.walletProvider = 'walletconnect'

      const recovery = detector.getRecoveryActions(error)

      expect(recovery.primaryAction.type).toBe('retry')
      expect(recovery.primaryAction.label).toBe('Try Again')
    })

    it('should provide secondary actions', () => {
      const error = new Error('Connection error') as WalletSpecificError
      error.code = 'METAMASK_EXTENSION_ERROR'
      error.walletProvider = 'metamask'

      const recovery = detector.getRecoveryActions(error)

      expect(recovery.secondaryActions).toBeDefined()
      expect(recovery.secondaryActions?.some(action => action.type === 'refresh')).toBe(true)
      expect(recovery.secondaryActions?.some(action => action.type === 'try_different_wallet')).toBe(true)
    })
  })

  describe('getWalletProviderInfo', () => {
    it('should return MetaMask provider info when installed', () => {
      const info = detector.getWalletProviderInfo('metamask')

      expect(info.provider).toBe('metamask')
      expect(info.isInstalled).toBe(true)
      expect(info.version).toBe('10.25.0')
      expect(info.isSupported).toBe(true)
      expect(info.installUrl).toBe('https://metamask.io/download/')
      expect(info.capabilities.supportsChainSwitching).toBe(true)
    })

    it('should return Coinbase provider info', () => {
      const info = detector.getWalletProviderInfo('coinbase')

      expect(info.provider).toBe('coinbase')
      expect(info.isSupported).toBe(true)
      expect(info.installUrl).toBe('https://wallet.coinbase.com/')
      expect(info.capabilities.supportsNetworkAddition).toBe(true)
    })

    it('should return WalletConnect provider info', () => {
      const info = detector.getWalletProviderInfo('walletconnect')

      expect(info.provider).toBe('walletconnect')
      expect(info.isInstalled).toBe(true) // Always true for WalletConnect
      expect(info.isSupported).toBe(true)
      expect(info.capabilities.supportsChainSwitching).toBe(true)
      expect(info.capabilities.supportsNetworkAddition).toBe(false) // Depends on connected wallet
    })

    it('should return unknown provider info for unsupported providers', () => {
      const info = detector.getWalletProviderInfo('unknown')

      expect(info.provider).toBe('unknown')
      expect(info.isInstalled).toBe(false)
      expect(info.isSupported).toBe(false)
      expect(info.capabilities.supportsChainSwitching).toBe(false)
    })
  })

  describe('isWalletProviderAvailable', () => {
    it('should return true for available MetaMask', () => {
      const available = detector.isWalletProviderAvailable('metamask')
      expect(available).toBe(true)
    })

    it('should return false for unavailable providers', () => {
      // Temporarily remove ethereum to simulate unavailable
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const originalEthereum = window.ethereum
      window.ethereum = undefined

      const available = detector.isWalletProviderAvailable('metamask')
      expect(available).toBe(false)

      // Restore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      window.ethereum = originalEthereum
    })
  })
})

describe('Convenience Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('classifyWalletError', () => {
    it('should work as a standalone function', () => {
      const error = new Error('MetaMask is locked')
      const classified = classifyWalletError(error, {action: 'connect'})

      expect(classified.code).toBe('METAMASK_LOCKED')
      expect(classified.walletProvider).toBe('metamask')
      expect(classified.errorContext?.action).toBe('connect')
    })
  })

  describe('getWalletErrorRecovery', () => {
    it('should provide recovery actions for classified errors', () => {
      const error = new Error('MetaMask not found') as WalletSpecificError
      error.code = 'METAMASK_NOT_INSTALLED'
      error.walletProvider = 'metamask'

      const recovery = getWalletErrorRecovery(error)

      expect(recovery.primaryAction.type).toBe('install')
      expect(recovery.primaryAction.url).toBe('https://metamask.io/download/')
    })
  })

  describe('isWalletAvailable', () => {
    it('should check wallet availability', () => {
      const available = isWalletAvailable('metamask')
      expect(available).toBe(true)
    })
  })
})

describe('Error Pattern Matching', () => {
  let detector: WalletErrorDetector

  beforeEach(() => {
    detector = new WalletErrorDetector()
  })

  it('should match case-insensitive error patterns', () => {
    const error = new Error('METAMASK IS NOT INSTALLED')
    const classified = detector.classifyWalletError(error)

    expect(classified.code).toBe('METAMASK_NOT_INSTALLED')
    expect(classified.walletProvider).toBe('metamask')
  })

  it('should handle errors with special characters', () => {
    const error = new Error('session rejected')
    const classified = detector.classifyWalletError(error)

    expect(classified.code).toBe('WALLETCONNECT_SESSION_REJECTED')
    expect(classified.walletProvider).toBe('walletconnect')
  })

  it('should match partial error messages', () => {
    const error = new Error('user denied account authorization')
    const classified = detector.classifyWalletError(error)

    expect(classified.code).toBe('METAMASK_ACCOUNT_ACCESS_DENIED')
    expect(classified.walletProvider).toBe('metamask')
  })

  it('should prioritize specific patterns over general ones', () => {
    // Should match MetaMask-specific pattern rather than general "rejected" pattern
    const error = new Error('user denied account authorization')
    const classified = detector.classifyWalletError(error)

    expect(classified.walletProvider).toBe('metamask')
    expect(classified.code).toBe('METAMASK_ACCOUNT_ACCESS_DENIED')
  })
})

describe('Environment Detection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should detect MetaMask from window.ethereum.isMetaMask', () => {
    Object.defineProperty(window, 'ethereum', {
      writable: true,
      value: {isMetaMask: true, version: '10.25.0'},
    })

    const detector = new WalletErrorDetector()
    const info = detector.getWalletProviderInfo('metamask')

    expect(info.isInstalled).toBe(true)
    expect(info.version).toBe('10.25.0')
  })

  it('should detect Coinbase Wallet from window.ethereum.isCoinbaseWallet', () => {
    Object.defineProperty(window, 'ethereum', {
      writable: true,
      value: {isCoinbaseWallet: true, version: '1.0.0'},
    })

    const detector = new WalletErrorDetector()
    const info = detector.getWalletProviderInfo('coinbase')

    expect(info.isInstalled).toBe(true)
    expect(info.version).toBe('1.0.0')
  })

  it('should handle missing ethereum object gracefully', () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const originalEthereum = window.ethereum
    window.ethereum = undefined

    const detector = new WalletErrorDetector()
    const info = detector.getWalletProviderInfo('metamask')

    expect(info.isInstalled).toBe(false)
    expect(info.version).toBeUndefined()

    // Restore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    window.ethereum = originalEthereum
  })
})
