import type {Address} from 'viem'
import {describe, expect, it} from 'vitest'

import {TokenRiskScore, type EnhancedTokenMetadata} from '../lib/web3/token-metadata'

import {filterTokenMetadata, getTokenMetadataStats} from './use-token-metadata'

describe('use-token-metadata utils', () => {
  const mockTokens: EnhancedTokenMetadata[] = [
    {
      address: '0x1111111111111111111111111111111111111111' as Address,
      chainId: 1,
      name: 'High Quality Token',
      symbol: 'HQT',
      decimals: 18,
      description: 'A high quality token',
      logoURI: 'https://example.com/logo1.png',
      website: 'https://example.com',
      isVerified: true,
      riskScore: TokenRiskScore.VERIFIED,
      tags: ['verified'],
      sources: [{source: 'onchain', priority: 1, timestamp: Date.now(), fields: ['name']}],
      lastUpdated: Date.now(),
      cacheKey: 'token1',
    },
    {
      address: '0x2222222222222222222222222222222222222222' as Address,
      chainId: 1,
      name: 'Medium Quality Token',
      symbol: 'MQT',
      decimals: 18,
      riskScore: TokenRiskScore.MEDIUM,
      sources: [{source: 'onchain', priority: 1, timestamp: Date.now(), fields: ['name']}],
      lastUpdated: Date.now(),
      cacheKey: 'token2',
    },
    {
      address: '0x3333333333333333333333333333333333333333' as Address,
      chainId: 1,
      name: '',
      symbol: '',
      decimals: 18,
      riskScore: TokenRiskScore.HIGH,
      sources: [{source: 'onchain', priority: 1, timestamp: Date.now(), fields: ['name']}],
      lastUpdated: Date.now(),
      cacheKey: 'token3',
    },
  ]

  describe('filterTokenMetadata', () => {
    it('should return filter result with correct structure', () => {
      const result = filterTokenMetadata(mockTokens, {
        minCompleteness: 50,
      })

      expect(result).toHaveProperty('filteredTokens')
      expect(result).toHaveProperty('totalTokens')
      expect(result).toHaveProperty('filteredCount')
      expect(result).toHaveProperty('filterStats')
      expect(Array.isArray(result.filteredTokens)).toBe(true)
      expect(typeof result.totalTokens).toBe('number')
      expect(typeof result.filteredCount).toBe('number')
    })

    it('should filter tokens by verification requirement', () => {
      const result = filterTokenMetadata(mockTokens, {
        requireVerification: true,
      })

      expect(result.filteredTokens.length).toBeGreaterThan(0)
      expect(result.filteredTokens[0].isVerified).toBe(true)
    })

    it('should filter tokens requiring logo', () => {
      const result = filterTokenMetadata(mockTokens, {
        requireLogo: true,
      })

      expect(result.filteredTokens.length).toBeGreaterThan(0)
      expect(result.filteredTokens[0].logoURI).toBeTruthy()
    })
  })

  describe('getTokenMetadataStats', () => {
    it('should calculate correct statistics structure', () => {
      const stats = getTokenMetadataStats(mockTokens)

      expect(stats).toHaveProperty('totalTokens')
      expect(stats).toHaveProperty('averageCompleteness')
      expect(stats).toHaveProperty('qualityDistribution')
      expect(stats).toHaveProperty('riskDistribution')
      expect(stats).toHaveProperty('verifiedTokens')
      expect(stats).toHaveProperty('tokensWithLogos')
      expect(stats).toHaveProperty('tokensWithDescriptions')

      expect(stats.totalTokens).toBe(3)
      expect(typeof stats.averageCompleteness).toBe('number')
      expect(stats.verifiedTokens).toBe(1)
      expect(stats.tokensWithLogos).toBe(1)
    })

    it('should handle empty token array', () => {
      const stats = getTokenMetadataStats([])

      expect(stats.totalTokens).toBe(0)
      expect(stats.averageCompleteness).toBe(0)
      expect(stats.verifiedTokens).toBe(0)
      expect(stats.tokensWithLogos).toBe(0)
      expect(stats.tokensWithDescriptions).toBe(0)
    })
  })
})
