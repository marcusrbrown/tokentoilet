/**
 * @vitest-environment jsdom
 */

// Import the mocked module to get typed access
import {walletStorage} from '@/lib/web3/secure-storage'
import {renderHook, waitFor} from '@testing-library/react'

import {beforeEach, describe, expect, it, vi} from 'vitest'

import {useWalletPersistence} from './use-wallet-persistence'

// Mock the secure storage module with inline factory
vi.mock('@/lib/web3/secure-storage', () => ({
  walletStorage: {
    getConnectionData: vi.fn(),
    setConnectionData: vi.fn(),
    getLastWalletId: vi.fn(),
    setLastWalletId: vi.fn(),
    getPreferredChain: vi.fn(),
    setPreferredChain: vi.fn(),
    getAutoReconnect: vi.fn(),
    setAutoReconnect: vi.fn(),
    updateLastActive: vi.fn(),
    clear: vi.fn(),
  },
}))

// Type the mocked storage for better testing
const mockWalletStorage = walletStorage as {
  getConnectionData: ReturnType<typeof vi.fn>
  setConnectionData: ReturnType<typeof vi.fn>
  getLastWalletId: ReturnType<typeof vi.fn>
  setLastWalletId: ReturnType<typeof vi.fn>
  getPreferredChain: ReturnType<typeof vi.fn>
  setPreferredChain: ReturnType<typeof vi.fn>
  getAutoReconnect: ReturnType<typeof vi.fn>
  setAutoReconnect: ReturnType<typeof vi.fn>
  updateLastActive: ReturnType<typeof vi.fn>
  clear: ReturnType<typeof vi.fn>
}

describe('useWalletPersistence', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Set default mock returns for a working state
    mockWalletStorage.getConnectionData.mockReturnValue(null)
    mockWalletStorage.getLastWalletId.mockReturnValue(null)
    mockWalletStorage.getPreferredChain.mockReturnValue(null)
    mockWalletStorage.getAutoReconnect.mockReturnValue(true)
    mockWalletStorage.setConnectionData.mockReturnValue(true)
    mockWalletStorage.setLastWalletId.mockReturnValue(true)
    mockWalletStorage.setPreferredChain.mockReturnValue(true)
    mockWalletStorage.setAutoReconnect.mockReturnValue(true)
    mockWalletStorage.updateLastActive.mockReturnValue(true)
    mockWalletStorage.clear.mockReturnValue(true)
  })

  describe('Initialization', () => {
    it('should initialize with default state when no stored data', async () => {
      const {result} = renderHook(() => useWalletPersistence())

      await waitFor(() => {
        expect(result.current.isRestoring).toBe(false)
      })

      expect(result.current.isAvailable).toBe(true)
      expect(result.current.autoReconnect).toBe(true)
      expect(result.current.lastWalletId).toBeNull()
      expect(result.current.preferredChain).toBeNull()
      expect(result.current.lastConnectionData).toBeNull()
      expect(result.current.error).toBeNull()
    })

    it('should load existing connection data on initialization', async () => {
      const mockConnectionData = {
        walletId: 'metamask',
        chainId: 1,
        connectedAt: Date.now() - 1000,
        lastActiveAt: Date.now() - 500,
        autoReconnect: true,
      }

      mockWalletStorage.getConnectionData.mockReturnValue(mockConnectionData)
      mockWalletStorage.getLastWalletId.mockReturnValue('metamask')
      mockWalletStorage.getPreferredChain.mockReturnValue(1)

      const {result} = renderHook(() => useWalletPersistence())

      await waitFor(() => {
        expect(result.current.isRestoring).toBe(false)
      })

      expect(result.current.lastWalletId).toBe('metamask')
      expect(result.current.preferredChain).toBe(1)
      expect(result.current.lastConnectionData).toEqual(mockConnectionData)
    })

    it('should clear expired connection data', async () => {
      const expiredData = {
        walletId: 'metamask',
        chainId: 1,
        connectedAt: Date.now() - 8 * 24 * 60 * 60 * 1000, // 8 days ago
        lastActiveAt: Date.now() - 8 * 24 * 60 * 60 * 1000,
        autoReconnect: true,
      }

      mockWalletStorage.getConnectionData.mockReturnValue(expiredData)

      const {result} = renderHook(() =>
        useWalletPersistence({
          maxConnectionAge: 7 * 24 * 60 * 60 * 1000, // 7 days max
        }),
      )

      await waitFor(() => {
        expect(result.current.isRestoring).toBe(false)
      })

      expect(mockWalletStorage.clear).toHaveBeenCalled()
      expect(result.current.lastConnectionData).toBeNull()
    })
  })

  describe('Connection State Management', () => {
    it('should save connection state successfully', async () => {
      const {result} = renderHook(() => useWalletPersistence())

      await waitFor(() => {
        expect(result.current.isRestoring).toBe(false)
      })

      const success = await result.current.saveConnectionState('metamask', 1)

      expect(success).toBe(true)
      expect(mockWalletStorage.setConnectionData).toHaveBeenCalledWith(
        expect.objectContaining({
          walletId: 'metamask',
          chainId: 1,
          autoReconnect: true,
        }),
      )
      expect(mockWalletStorage.setLastWalletId).toHaveBeenCalledWith('metamask')
      expect(mockWalletStorage.setPreferredChain).toHaveBeenCalledWith(1)
    })

    it('should handle save failures gracefully', async () => {
      mockWalletStorage.setConnectionData.mockReturnValue(false)

      const {result} = renderHook(() => useWalletPersistence())

      await waitFor(() => {
        expect(result.current.isRestoring).toBe(false)
      })

      const success = await result.current.saveConnectionState('metamask', 1)

      expect(success).toBe(false)
    })
  })

  describe('Preferences Management', () => {
    it('should set auto-reconnect preference', async () => {
      const {result} = renderHook(() => useWalletPersistence())

      await waitFor(() => {
        expect(result.current.isRestoring).toBe(false)
      })

      const success = await result.current.setAutoReconnect(false)

      expect(success).toBe(true)
      expect(mockWalletStorage.setAutoReconnect).toHaveBeenCalledWith(false)

      // Wait for state to update
      await waitFor(() => {
        expect(result.current.autoReconnect).toBe(false)
      })
    })

    it('should set preferred chain', async () => {
      const {result} = renderHook(() => useWalletPersistence())

      await waitFor(() => {
        expect(result.current.isRestoring).toBe(false)
      })

      const success = await result.current.setPreferredChain(137)

      expect(success).toBe(true)
      expect(mockWalletStorage.setPreferredChain).toHaveBeenCalledWith(137)

      // Wait for state to update
      await waitFor(() => {
        expect(result.current.preferredChain).toBe(137)
      })
    })
  })

  describe('Data Management', () => {
    it('should clear stored data successfully', async () => {
      const {result} = renderHook(() => useWalletPersistence())

      await waitFor(() => {
        expect(result.current.isRestoring).toBe(false)
      })

      const success = await result.current.clearStoredData()

      expect(success).toBe(true)
      expect(mockWalletStorage.clear).toHaveBeenCalled()
      expect(result.current.lastWalletId).toBeNull()
      expect(result.current.preferredChain).toBeNull()
      expect(result.current.lastConnectionData).toBeNull()
    })

    it('should update last active timestamp when connection exists', async () => {
      const connectionData = {
        walletId: 'metamask',
        chainId: 1,
        connectedAt: Date.now() - 1000,
        lastActiveAt: Date.now() - 500,
        autoReconnect: true,
      }

      mockWalletStorage.getConnectionData.mockReturnValue(connectionData)

      const {result} = renderHook(() => useWalletPersistence())

      await waitFor(() => {
        expect(result.current.isRestoring).toBe(false)
        expect(result.current.lastConnectionData).toEqual(connectionData)
      })

      result.current.updateLastActive()

      expect(mockWalletStorage.updateLastActive).toHaveBeenCalled()
    })
  })

  describe('Restoration Logic', () => {
    it('should indicate restoration is needed for recent valid connection', async () => {
      const recentConnectionData = {
        walletId: 'metamask',
        chainId: 1,
        connectedAt: Date.now() - 1000, // 1 second ago
        lastActiveAt: Date.now() - 1000,
        autoReconnect: true,
      }

      mockWalletStorage.getConnectionData.mockReturnValue(recentConnectionData)

      const {result} = renderHook(() =>
        useWalletPersistence({
          reconnectTimeout: 30000, // 30 seconds
          maxConnectionAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        }),
      )

      await waitFor(() => {
        expect(result.current.isRestoring).toBe(false)
        expect(result.current.lastConnectionData).toEqual(recentConnectionData)
      })

      expect(result.current.shouldRestore()).toBe(true)
    })

    it('should not restore when auto-reconnect is disabled', async () => {
      const connectionData = {
        walletId: 'metamask',
        chainId: 1,
        connectedAt: Date.now() - 1000,
        lastActiveAt: Date.now() - 1000,
        autoReconnect: true,
      }

      mockWalletStorage.getConnectionData.mockReturnValue(connectionData)
      mockWalletStorage.getAutoReconnect.mockReturnValue(false)

      const {result} = renderHook(() => useWalletPersistence())

      await waitFor(() => {
        expect(result.current.isRestoring).toBe(false)
      })

      expect(result.current.shouldRestore()).toBe(false)
    })

    it('should not restore expired connections', async () => {
      const oldConnectionData = {
        walletId: 'metamask',
        chainId: 1,
        connectedAt: Date.now() - 32000, // 32 seconds ago (beyond timeout)
        lastActiveAt: Date.now() - 32000,
        autoReconnect: true,
      }

      mockWalletStorage.getConnectionData.mockReturnValue(oldConnectionData)

      const {result} = renderHook(() =>
        useWalletPersistence({
          reconnectTimeout: 30000, // 30 seconds
        }),
      )

      await waitFor(() => {
        expect(result.current.isRestoring).toBe(false)
      })

      expect(result.current.shouldRestore()).toBe(false)
    })
  })

  describe('Connection Age Calculation', () => {
    it('should calculate connection age correctly', async () => {
      const connectionTime = Date.now() - 5000 // 5 seconds ago
      const connectionData = {
        walletId: 'metamask',
        chainId: 1,
        connectedAt: connectionTime,
        lastActiveAt: connectionTime,
        autoReconnect: true,
      }

      mockWalletStorage.getConnectionData.mockReturnValue(connectionData)

      const {result} = renderHook(() => useWalletPersistence())

      await waitFor(() => {
        expect(result.current.isRestoring).toBe(false)
        expect(result.current.lastConnectionData).toEqual(connectionData)
      })

      const age = result.current.getConnectionAge()
      expect(age).toBeGreaterThanOrEqual(4000) // Should be around 5000ms
      expect(age).toBeLessThan(10000) // But not too much more
    })

    it('should return null when no connection data exists', async () => {
      const {result} = renderHook(() => useWalletPersistence())

      await waitFor(() => {
        expect(result.current.isRestoring).toBe(false)
      })

      const age = result.current.getConnectionAge()
      expect(age).toBeNull()
    })
  })

  describe('Error Handling', () => {
    it('should handle storage errors gracefully', async () => {
      mockWalletStorage.getConnectionData.mockImplementation(() => {
        throw new Error('Storage error')
      })

      const {result} = renderHook(() => useWalletPersistence())

      await waitFor(() => {
        expect(result.current.isRestoring).toBe(false)
      })

      expect(result.current.isAvailable).toBe(false)
      expect(result.current.error).toBe('Storage error')
    })
  })
})
