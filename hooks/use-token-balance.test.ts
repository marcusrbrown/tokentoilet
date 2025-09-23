import type {Address} from 'viem'
import type {Config} from 'wagmi'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {getBalance, readContracts} from 'wagmi/actions'

import {checkAllBalances, checkTokenBalance, DEFAULT_BALANCE_CONFIG} from '../lib/web3/token-balance'

// Mock wagmi/actions
vi.mock('wagmi/actions', () => ({
  readContracts: vi.fn(),
  getBalance: vi.fn(),
}))

describe('Token Balance Utilities', () => {
  const mockConfig = {} as Config
  const mockUserAddress = '0x1234567890123456789012345678901234567890' as Address
  const mockTokenAddress = '0xA0b86a33E6aA3D1C81e4f059a5E4b54B94e8a7A2' as Address
  const mockChainId = 1

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock implementations to prevent interference between tests
    vi.mocked(readContracts).mockReset()
    vi.mocked(getBalance).mockReset()
  })

  describe('checkTokenBalance', () => {
    it('should check token balance with provided decimals', async () => {
      const mockBalance = BigInt('1000000000000000000') // 1 token
      const decimals = 18

      vi.mocked(readContracts).mockResolvedValueOnce([{result: mockBalance, status: 'success'}])

      const result = await checkTokenBalance(mockConfig, mockUserAddress, mockTokenAddress, mockChainId, decimals)

      expect(result).toEqual({
        address: mockTokenAddress,
        balance: mockBalance,
        formattedBalance: '1',
        decimals,
        chainId: mockChainId,
        lastUpdated: expect.any(Number) as number,
      })
    })

    it('should check token balance and fetch decimals when not provided', async () => {
      const mockBalance = BigInt('500000') // 0.5 token with 6 decimals
      const mockDecimals = 6

      vi.mocked(readContracts).mockResolvedValueOnce([
        {result: mockBalance, status: 'success'},
        {result: mockDecimals, status: 'success'},
      ])

      const result = await checkTokenBalance(mockConfig, mockUserAddress, mockTokenAddress, mockChainId)

      expect(result).toEqual({
        address: mockTokenAddress,
        balance: mockBalance,
        formattedBalance: '0.5',
        decimals: mockDecimals,
        chainId: mockChainId,
        lastUpdated: expect.any(Number) as number,
      })
    })

    it('should handle errors gracefully', async () => {
      vi.mocked(readContracts).mockRejectedValueOnce(new Error('RPC failed'))

      await expect(checkTokenBalance(mockConfig, mockUserAddress, mockTokenAddress, mockChainId)).rejects.toThrow(
        'Failed to check token balance',
      )
    })

    it('should handle zero balance', async () => {
      const mockBalance = BigInt('0')
      const decimals = 18

      vi.mocked(readContracts).mockResolvedValueOnce([{result: mockBalance, status: 'success'}])

      const result = await checkTokenBalance(mockConfig, mockUserAddress, mockTokenAddress, mockChainId, decimals)

      expect(result.balance).toBe(BigInt('0'))
      expect(result.formattedBalance).toBe('0')
    })
  })

  describe('checkAllBalances', () => {
    it('should check balances for multiple tokens', async () => {
      const tokens = [
        {address: mockTokenAddress, decimals: 18},
        {address: '0xB0b86a33E6aA3D1C81e4f059a5E4b54B94e8a7A3' as Address, decimals: 6},
      ]

      // Mock token balance calls
      vi.mocked(readContracts).mockResolvedValueOnce([
        {result: BigInt('1000000000000000000'), status: 'success'}, // 1 token with 18 decimals
        {result: BigInt('500000'), status: 'success'}, // 0.5 token with 6 decimals
      ])

      // Mock native balance call
      vi.mocked(getBalance).mockResolvedValueOnce({
        value: BigInt('2000000000000000000'),
        decimals: 18,
        formatted: '2.0',
        symbol: 'ETH',
      })

      const result = await checkAllBalances(mockConfig, mockUserAddress, tokens, mockChainId, DEFAULT_BALANCE_CONFIG)

      expect(result.tokenBalances).toHaveLength(2)
      expect(result.nativeBalance).toBeDefined()
      expect(result.successfulChecks).toBe(3) // 2 tokens + 1 native
      expect(result.totalChecks).toBe(3)
      expect(result.errors).toHaveLength(0)
    })

    it('should handle partial failures gracefully', async () => {
      const tokens = [
        {address: mockTokenAddress, decimals: 18},
        {address: '0xB0b86a33E6aA3D1C81e4f059a5E4b54B94e8a7A3' as Address, decimals: 6},
      ]

      // Mock first token success, second token failure
      vi.mocked(readContracts)
        .mockResolvedValueOnce([{result: BigInt('1000000000000000000'), status: 'success'}])
        .mockRejectedValueOnce(new Error('Token 2 failed'))

      // Mock native balance success
      vi.mocked(getBalance).mockResolvedValueOnce({
        value: BigInt('2000000000000000000'),
        decimals: 18,
        formatted: '2.0',
        symbol: 'ETH',
      })

      const result = await checkAllBalances(mockConfig, mockUserAddress, tokens, mockChainId, DEFAULT_BALANCE_CONFIG)

      expect(result.tokenBalances).toHaveLength(1) // Only first token succeeded
      expect(result.nativeBalance).toBeDefined()
      expect(result.successfulChecks).toBe(2) // 1 token + 1 native
      expect(result.totalChecks).toBe(3)
      expect(result.errors).toHaveLength(0) // Individual token failures are handled internally
    })

    it('should skip native balance when disabled', async () => {
      const tokens = [{address: mockTokenAddress, decimals: 18}]

      // Clear all previous mocks and set up fresh mock
      vi.clearAllMocks()
      vi.mocked(readContracts).mockResolvedValueOnce([{result: BigInt('1000000000000000000'), status: 'success'}])

      const result = await checkAllBalances(mockConfig, mockUserAddress, tokens, mockChainId, {
        ...DEFAULT_BALANCE_CONFIG,
        includeNative: false,
      })

      expect(result.tokenBalances).toHaveLength(1)
      expect(result.nativeBalance).toBeUndefined()
      expect(result.successfulChecks).toBe(1) // Only 1 token
      expect(result.totalChecks).toBe(1)
      expect(vi.mocked(getBalance)).not.toHaveBeenCalled()
    })
  })

  describe('Configuration', () => {
    it('should use default configuration values', () => {
      expect(DEFAULT_BALANCE_CONFIG.enableBatching).toBe(true)
      expect(DEFAULT_BALANCE_CONFIG.batchSize).toBe(20)
      expect(DEFAULT_BALANCE_CONFIG.includeNative).toBe(true)
      expect(DEFAULT_BALANCE_CONFIG.bypassCache).toBe(false)
    })
  })
})
