import {beforeEach, describe, expect, it, vi} from 'vitest'
import {
  getSecureItem,
  getStorageSize,
  isStorageAvailable,
  removeSecureItem,
  setSecureItem,
  STORAGE_KEYS,
  walletStorage,
  type WalletConnectionData,
} from './secure-storage'

describe('Secure Storage', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('Storage availability', () => {
    it('should return true when localStorage is available', () => {
      expect(isStorageAvailable()).toBe(true)
    })
  })

  describe('Storage constants', () => {
    it('should export correct storage keys', () => {
      expect(STORAGE_KEYS.WALLET_CONNECTION).toBe('tokentoilet_wallet_connection')
      expect(STORAGE_KEYS.LAST_WALLET_ID).toBe('tokentoilet_last_wallet_id')
      expect(STORAGE_KEYS.PREFERRED_CHAIN).toBe('tokentoilet_preferred_chain')
      expect(STORAGE_KEYS.AUTO_RECONNECT).toBe('tokentoilet_auto_reconnect')
    })
  })

  describe('Basic storage operations', () => {
    it('should store and retrieve string data', () => {
      const result = setSecureItem('test-key', 'test-value')
      expect(result).toBe(true)

      const retrieved = getSecureItem<string>('test-key')
      expect(retrieved).toBe('test-value')
    })

    it('should store and retrieve number data', () => {
      const result = setSecureItem('number-key', 42)
      expect(result).toBe(true)

      const retrieved = getSecureItem<number>('number-key')
      expect(retrieved).toBe(42)
    })

    it('should store and retrieve object data', () => {
      const obj = {name: 'test', value: 123}
      const result = setSecureItem('object-key', obj)
      expect(result).toBe(true)

      const retrieved = getSecureItem<typeof obj>('object-key')
      expect(retrieved).toEqual(obj)
    })

    it('should store and retrieve boolean data', () => {
      const result = setSecureItem('bool-key', true)
      expect(result).toBe(true)

      const retrieved = getSecureItem<boolean>('bool-key')
      expect(retrieved).toBe(true)
    })

    it('should return null for non-existent keys', () => {
      const result = getSecureItem<string>('non-existent')
      expect(result).toBeNull()
    })

    it('should remove stored items', () => {
      setSecureItem('remove-key', 'remove-value')
      expect(getSecureItem<string>('remove-key')).toBe('remove-value')

      removeSecureItem('remove-key')
      expect(getSecureItem<string>('remove-key')).toBeNull()
    })

    it('should handle item expiration', async () => {
      // Set item with very short expiration (1 millisecond)
      setSecureItem('expire-key', 'expire-value', 0.00001667) // ~1ms

      // Wait for expiration
      await new Promise<void>(resolve => {
        setTimeout(() => {
          const result = getSecureItem<string>('expire-key')
          expect(result).toBeNull()
          resolve()
        }, 10)
      })
    })
  })

  describe('Storage size calculation', () => {
    it('should calculate size correctly', () => {
      const initialSize = getStorageSize()

      setSecureItem(STORAGE_KEYS.LAST_WALLET_ID, 'metamask')
      const newSize = getStorageSize()

      expect(newSize).toBeGreaterThan(initialSize)
    })

    it('should return 0 for empty relevant storage', () => {
      // Clear all wallet-related storage
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key)
      })

      const size = getStorageSize()
      expect(size).toBe(0)
    })
  })

  describe('Wallet storage utilities', () => {
    describe('Connection data', () => {
      it('should store and retrieve connection data', () => {
        const connectionData: WalletConnectionData = {
          walletId: 'metamask',
          chainId: 1,
          connectedAt: Date.now(),
          lastActiveAt: Date.now(),
          autoReconnect: true,
        }

        const stored = walletStorage.setConnectionData(connectionData)
        expect(stored).toBe(true)

        const retrieved = walletStorage.getConnectionData()
        expect(retrieved).toEqual(connectionData)
      })

      it('should return null when no connection data exists', () => {
        const result = walletStorage.getConnectionData()
        expect(result).toBeNull()
      })
    })

    describe('Wallet session management', () => {
      it('should manage last wallet ID', () => {
        const stored = walletStorage.setLastWalletId('coinbase')
        expect(stored).toBe(true)

        const retrieved = walletStorage.getLastWalletId()
        expect(retrieved).toBe('coinbase')
      })

      it('should manage preferred chain', () => {
        const stored = walletStorage.setPreferredChain(137)
        expect(stored).toBe(true)

        const retrieved = walletStorage.getPreferredChain()
        expect(retrieved).toBe(137)
      })

      it('should manage auto-reconnect preference', () => {
        const stored = walletStorage.setAutoReconnect(false)
        expect(stored).toBe(true)

        const retrieved = walletStorage.getAutoReconnect()
        expect(retrieved).toBe(false)
      })

      it('should default auto-reconnect to true when not set', () => {
        const retrieved = walletStorage.getAutoReconnect()
        expect(retrieved).toBe(true)
      })

      it('should update last active timestamp', () => {
        // First set connection data
        const initialTime = Date.now() - 1000
        const connectionData: WalletConnectionData = {
          connectedAt: initialTime,
          lastActiveAt: initialTime,
          autoReconnect: true,
        }
        walletStorage.setConnectionData(connectionData)

        // Update last active
        const result = walletStorage.updateLastActive()
        expect(result).toBe(true)

        // Verify timestamp was updated
        const updated = walletStorage.getConnectionData()
        expect(updated?.lastActiveAt).toBeGreaterThan(initialTime)
      })

      it('should return false when updating last active with no existing data', () => {
        const result = walletStorage.updateLastActive()
        expect(result).toBe(false)
      })

      it('should clear all wallet data', () => {
        // Set some data first
        walletStorage.setLastWalletId('test')
        walletStorage.setPreferredChain(1)
        walletStorage.setAutoReconnect(true)

        // Clear all
        const result = walletStorage.clear()
        expect(result).toBe(true)

        // Verify data is cleared
        expect(walletStorage.getLastWalletId()).toBeNull()
        expect(walletStorage.getPreferredChain()).toBeNull()
        // Auto-reconnect should default to true even when cleared
        expect(walletStorage.getAutoReconnect()).toBe(true)
      })
    })
  })

  describe('Data persistence and encryption', () => {
    it('should persist data across storage operations', () => {
      const testData = {
        userId: 'user123',
        preferences: {theme: 'dark', autoConnect: true},
        timestamp: Date.now(),
      }

      setSecureItem('persistence-test', testData)

      // Data should persist
      const retrieved = getSecureItem<typeof testData>('persistence-test')
      expect(retrieved).toEqual(testData)

      // Should work after multiple operations
      setSecureItem('other-key', 'other-value')
      const stillThere = getSecureItem<typeof testData>('persistence-test')
      expect(stillThere).toEqual(testData)
    })

    it('should encrypt stored data', () => {
      const sensitiveData = 'sensitive-wallet-info'
      setSecureItem('encrypted-test', sensitiveData)

      // Check that raw localStorage doesn't contain the plain text
      const rawStored = localStorage.getItem('encrypted-test')
      expect(rawStored).not.toBeNull()
      expect(rawStored).not.toContain(sensitiveData)

      // But retrieval should work
      const decrypted = getSecureItem<string>('encrypted-test')
      expect(decrypted).toBe(sensitiveData)
    })
  })

  describe('Error handling', () => {
    it('should handle corrupted data gracefully', () => {
      // Manually corrupt the data
      localStorage.setItem('corrupted-key', 'invalid-encrypted-data')

      const result = getSecureItem<string>('corrupted-key')
      expect(result).toBeNull()

      // Should clean up corrupted data
      expect(localStorage.getItem('corrupted-key')).toBeNull()
    })

    it('should handle storage operations when data exists', () => {
      // Test overwriting existing data
      setSecureItem('overwrite-test', 'original')
      expect(getSecureItem<string>('overwrite-test')).toBe('original')

      setSecureItem('overwrite-test', 'updated')
      expect(getSecureItem<string>('overwrite-test')).toBe('updated')
    })
  })
})
