import {createWalletError, useWalletErrorHandler} from '@/hooks/use-wallet-error-handler'
import {classifyWalletError} from '@/lib/web3/wallet-error-detector'

import {act, renderHook} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

describe('useWalletErrorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createWalletError utility', () => {
    it('should create a wallet-specific error', () => {
      const walletError = createWalletError('Test error', 'METAMASK_LOCKED', 'metamask')

      expect(walletError.code).toBe('METAMASK_LOCKED')
      expect(walletError.walletProvider).toBe('metamask')
      expect(walletError.userFriendlyMessage).toBe('Test error')
      expect(walletError.errorContext?.action).toBe('connect')
      expect(walletError.errorContext?.timestamp).toBeTypeOf('number')
    })
  })

  describe('classifyWalletError integration', () => {
    it('should create a wallet-specific error from Error object', () => {
      const originalError = new Error('MetaMask is locked')
      const walletError = classifyWalletError(originalError, {action: 'connect'})

      expect(walletError.code).toBe('METAMASK_LOCKED')
      expect(walletError.walletProvider).toBe('metamask')
      expect(walletError.userFriendlyMessage).toContain('MetaMask wallet is locked')
      expect(walletError.originalError).toBe(originalError)
      expect(walletError.errorContext?.action).toBe('connect')
    })

    it('should create error with additional context', () => {
      const originalError = new Error('unrecognized chain id')
      const walletError = classifyWalletError(originalError, {
        action: 'switch_chain',
        chainId: 137,
      })

      expect(walletError.errorContext?.action).toBe('switch_chain')
      expect(walletError.errorContext?.additionalData?.chainId).toBe(137)
      expect(walletError.errorContext?.timestamp).toBeTypeOf('number')
    })
  })

  describe('error state management', () => {
    it('should manage current error state', () => {
      const {result} = renderHook(() => useWalletErrorHandler())

      expect(result.current.error).toBeNull()

      const testError = createWalletError('Test error', 'METAMASK_NOT_INSTALLED', 'metamask')

      act(() => {
        result.current.showError(testError)
      })

      expect(result.current.error).toBe(testError)
    })

    it('should clear current error', () => {
      const {result} = renderHook(() => useWalletErrorHandler())

      const testError = createWalletError('Test error', 'COINBASE_NOT_INSTALLED', 'coinbase')

      act(() => {
        result.current.showError(testError)
      })

      expect(result.current.error).toBe(testError)

      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBeNull()
    })
  })

  describe('hasError', () => {
    it('should return true when error exists', () => {
      const {result} = renderHook(() => useWalletErrorHandler())

      const testError = createWalletError('Test error', 'WALLETCONNECT_SESSION_REJECTED', 'walletconnect')

      act(() => {
        result.current.showError(testError)
      })

      expect(result.current.hasError).toBe(true)
    })

    it('should return false when no error', () => {
      const {result} = renderHook(() => useWalletErrorHandler())

      expect(result.current.hasError).toBe(false)
    })
  })

  describe('error type checks', () => {
    it('should identify MetaMask errors', () => {
      const {result} = renderHook(() => useWalletErrorHandler())

      const metamaskError = createWalletError('MetaMask locked', 'METAMASK_LOCKED', 'metamask')

      act(() => {
        result.current.showError(metamaskError)
      })

      expect(result.current.error?.walletProvider).toBe('metamask')
    })

    it('should identify WalletConnect errors', () => {
      const {result} = renderHook(() => useWalletErrorHandler())

      const wcError = createWalletError('QR expired', 'WALLETCONNECT_QR_CODE_EXPIRED', 'walletconnect')

      act(() => {
        result.current.showError(wcError)
      })

      expect(result.current.error?.walletProvider).toBe('walletconnect')
    })

    it('should identify Coinbase errors', () => {
      const {result} = renderHook(() => useWalletErrorHandler())

      const coinbaseError = createWalletError('Coinbase not found', 'COINBASE_NOT_INSTALLED', 'coinbase')

      act(() => {
        result.current.showError(coinbaseError)
      })

      expect(result.current.error?.walletProvider).toBe('coinbase')
    })
  })
})
