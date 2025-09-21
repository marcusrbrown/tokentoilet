import CryptoJS from 'crypto-js'

// Storage keys for different types of wallet data
export const STORAGE_KEYS = {
  WALLET_CONNECTION: 'tokentoilet_wallet_connection',
  LAST_WALLET_ID: 'tokentoilet_last_wallet_id',
  PREFERRED_CHAIN: 'tokentoilet_preferred_chain',
  AUTO_RECONNECT: 'tokentoilet_auto_reconnect',
} as const

// Encryption key derived from domain and user agent for basic obfuscation
// Note: This is not cryptographically secure but provides basic protection against casual inspection
const getEncryptionKey = (): string => {
  const domain = typeof window === 'undefined' ? 'tokentoilet' : window.location.hostname
  const userAgent = typeof window === 'undefined' ? 'default' : window.navigator.userAgent.slice(0, 20)
  return `${domain}_${userAgent}_wallet_v1`
}

// Interface for stored wallet connection data
export interface WalletConnectionData {
  walletId?: string
  chainId?: number
  connectedAt: number
  lastActiveAt: number
  autoReconnect: boolean
}

// Interface for secure storage operations
export interface SecureStorageItem<T> {
  value: T
  timestamp: number
  expiresAt?: number
}

/**
 * Encrypts data using AES encryption before storing
 */
function encryptData(data: string): string {
  try {
    const key = getEncryptionKey()
    return CryptoJS.AES.encrypt(data, key).toString()
  } catch (error) {
    console.error('Failed to encrypt data:', error)
    throw new Error('Encryption failed')
  }
}

/**
 * Decrypts data that was encrypted with encryptData
 */
function decryptData(encryptedData: string): string {
  try {
    const key = getEncryptionKey()
    const bytes = CryptoJS.AES.decrypt(encryptedData, key)
    const decrypted = bytes.toString(CryptoJS.enc.Utf8)

    if (!decrypted) {
      throw new Error('Decryption failed - invalid key or corrupted data')
    }

    return decrypted
  } catch (error) {
    console.error('Failed to decrypt data:', error)
    throw new Error('Decryption failed')
  }
}

/**
 * Validates and sanitizes input before storage to prevent XSS
 */
function sanitizeInput(input: unknown): string {
  if (typeof input !== 'string') {
    throw new TypeError('Input must be a string')
  }

  // Only remove HTML tags and script-related characters, preserve JSON quotes
  return input.replaceAll(/<[^>]*>?/g, '').replaceAll(/[<>&]/g, '')
}

/**
 * Creates a secure storage item with metadata
 */
function createStorageItem<T>(value: T, expirationMinutes?: number): SecureStorageItem<T> {
  const now = Date.now()
  return {
    value,
    timestamp: now,
    expiresAt:
      typeof expirationMinutes === 'number' && expirationMinutes > 0 ? now + expirationMinutes * 60 * 1000 : undefined,
  }
}

/**
 * Checks if a storage item has expired
 */
function isExpired<T>(item: SecureStorageItem<T>): boolean {
  if (typeof item.expiresAt !== 'number') return false
  return Date.now() > item.expiresAt
}

/**
 * Securely stores data in localStorage with encryption and expiration
 */
export function setSecureItem<T>(key: string, value: T, expirationMinutes?: number): boolean {
  try {
    if (typeof window === 'undefined') {
      console.warn('SecureStorage: localStorage not available in server environment')
      return false
    }

    const storageItem = createStorageItem(value, expirationMinutes)
    const serialized = JSON.stringify(storageItem)
    const sanitized = sanitizeInput(serialized)
    const encrypted = encryptData(sanitized)

    localStorage.setItem(key, encrypted)
    return true
  } catch (error) {
    console.error(`Failed to store secure item with key "${key}":`, error)
    return false
  }
}

/**
 * Retrieves and decrypts data from localStorage
 */
export function getSecureItem<T>(key: string): T | null {
  try {
    if (typeof window === 'undefined') {
      return null
    }

    const encrypted = localStorage.getItem(key)
    if (typeof encrypted !== 'string' || encrypted.length === 0) {
      return null
    }

    const decrypted = decryptData(encrypted)
    const storageItem = JSON.parse(decrypted) as SecureStorageItem<T>

    // Check if item has expired
    if (isExpired(storageItem)) {
      removeSecureItem(key)
      return null
    }

    return storageItem.value
  } catch (error) {
    console.error(`Failed to retrieve secure item with key "${key}":`, error)
    // Clean up corrupted data
    removeSecureItem(key)
    return null
  }
}

/**
 * Removes an item from secure storage
 */
export function removeSecureItem(key: string): boolean {
  try {
    if (typeof window === 'undefined') {
      return false
    }

    localStorage.removeItem(key)
    return true
  } catch (error) {
    console.error(`Failed to remove secure item with key "${key}":`, error)
    return false
  }
}

/**
 * Clears all wallet-related data from storage
 */
export function clearWalletStorage(): boolean {
  try {
    const keys = Object.values(STORAGE_KEYS)
    let success = true

    keys.forEach(key => {
      if (!removeSecureItem(key)) {
        success = false
      }
    })

    return success
  } catch (error) {
    console.error('Failed to clear wallet storage:', error)
    return false
  }
}

/**
 * Gets the size of stored data in bytes (for monitoring storage usage)
 */
export function getStorageSize(): number {
  try {
    if (typeof window === 'undefined') {
      return 0
    }

    let totalSize = 0
    const keys = Object.values(STORAGE_KEYS)

    keys.forEach(key => {
      const item = localStorage.getItem(key)
      if (typeof item === 'string' && item.length > 0) {
        totalSize += new Blob([item]).size
      }
    })

    return totalSize
  } catch (error) {
    console.error('Failed to calculate storage size:', error)
    return 0
  }
}

/**
 * Checks if storage is available and functional
 */
export function isStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined') {
      return false
    }

    const testKey = 'tokentoilet_storage_test'
    const testValue = 'test'

    localStorage.setItem(testKey, testValue)
    const retrieved = localStorage.getItem(testKey)
    localStorage.removeItem(testKey)

    return retrieved === testValue
  } catch (error) {
    console.error('Storage availability check failed:', error)
    return false
  }
}

// Wallet-specific storage utilities
export const walletStorage = {
  /**
   * Stores wallet connection data securely
   */
  setConnectionData(data: WalletConnectionData): boolean {
    return setSecureItem(STORAGE_KEYS.WALLET_CONNECTION, data, 60 * 24 * 7) // 7 days expiration
  },

  /**
   * Retrieves stored wallet connection data
   */
  getConnectionData(): WalletConnectionData | null {
    return getSecureItem<WalletConnectionData>(STORAGE_KEYS.WALLET_CONNECTION)
  },

  /**
   * Stores the last connected wallet identifier
   */
  setLastWalletId(walletId: string): boolean {
    return setSecureItem(STORAGE_KEYS.LAST_WALLET_ID, walletId, 60 * 24 * 30) // 30 days
  },

  /**
   * Retrieves the last connected wallet identifier
   */
  getLastWalletId(): string | null {
    return getSecureItem<string>(STORAGE_KEYS.LAST_WALLET_ID)
  },

  /**
   * Stores the preferred chain ID
   */
  setPreferredChain(chainId: number): boolean {
    return setSecureItem(STORAGE_KEYS.PREFERRED_CHAIN, chainId, 60 * 24 * 30) // 30 days
  },

  /**
   * Retrieves the preferred chain ID
   */
  getPreferredChain(): number | null {
    return getSecureItem<number>(STORAGE_KEYS.PREFERRED_CHAIN)
  },

  /**
   * Sets auto-reconnect preference
   */
  setAutoReconnect(enabled: boolean): boolean {
    return setSecureItem(STORAGE_KEYS.AUTO_RECONNECT, enabled, 60 * 24 * 365) // 1 year
  },

  /**
   * Gets auto-reconnect preference
   */
  getAutoReconnect(): boolean {
    const stored = getSecureItem<boolean>(STORAGE_KEYS.AUTO_RECONNECT)
    return stored ?? true // Default to true for better UX
  },

  /**
   * Updates the last active timestamp for the current connection
   */
  updateLastActive(): boolean {
    const existing = this.getConnectionData()
    if (!existing) return false

    return this.setConnectionData({
      ...existing,
      lastActiveAt: Date.now(),
    })
  },

  /**
   * Clears all stored wallet data
   */
  clear(): boolean {
    return clearWalletStorage()
  },
}
