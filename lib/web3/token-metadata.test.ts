import type {Address} from 'viem'
import {describe, expect, it} from 'vitest'

import {
  DEFAULT_METADATA_CONFIG,
  filterTokensByMetadataQuality,
  TokenRiskScore,
  validateTokenMetadata,
  type EnhancedTokenMetadata,
} from './token-metadata'

describe('token-metadata', () => {
  const testTokenAddress = '0x1234567890123456789012345678901234567890' as Address
  const testChainId = 1 as const

  describe('validateTokenMetadata', () => {
    const createTestMetadata = (overrides: Partial<EnhancedTokenMetadata> = {}): EnhancedTokenMetadata => ({
      address: testTokenAddress,
      chainId: testChainId,
      name: 'Test Token',
      symbol: 'TEST',
      decimals: 18,
      sources: [{source: 'onchain', priority: 1, timestamp: Date.now(), fields: ['name', 'symbol', 'decimals']}],
      lastUpdated: Date.now(),
      cacheKey: 'test-key',
      ...overrides,
    })

    it('should validate complete metadata', () => {
      const metadata = createTestMetadata({
        description: 'A test token',
        logoURI: 'https://example.com/logo.png',
        website: 'https://example.com',
        isVerified: true,
        riskScore: TokenRiskScore.VERIFIED,
        tags: ['test'],
      })

      const validation = validateTokenMetadata(metadata)

      expect(validation.isValid).toBe(true)
      expect(validation.completeness).toBeGreaterThan(70)
      expect(validation.warnings).toEqual([])
    })

    it('should identify missing required metadata', () => {
      const metadata = createTestMetadata({
        name: '',
        symbol: '',
      })

      const validation = validateTokenMetadata(metadata)

      expect(validation.isValid).toBe(false)
      expect(validation.warnings).toContain('Missing required ERC-20 metadata')
    })

    it('should warn about missing optional metadata', () => {
      const metadata = createTestMetadata()

      const validation = validateTokenMetadata(metadata)

      expect(validation.warnings).toContain('Missing token logo')
      expect(validation.warnings).toContain('Missing token description')
    })

    it('should warn about high-risk tokens', () => {
      const metadata = createTestMetadata({
        riskScore: TokenRiskScore.HIGH,
      })

      const validation = validateTokenMetadata(metadata)

      expect(validation.warnings).toContain('High risk token detected')
    })

    it('should calculate completeness percentage correctly', () => {
      const metadata = createTestMetadata({
        description: 'A test token',
        logoURI: 'https://example.com/logo.png',
        website: 'https://example.com',
        isVerified: true,
        riskScore: TokenRiskScore.VERIFIED,
        tags: ['test'],
      })

      const validation = validateTokenMetadata(metadata)

      expect(validation.completeness).toBe(100)
    })
  })

  describe('filterTokensByMetadataQuality', () => {
    const createTokens = (): EnhancedTokenMetadata[] => [
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
        description: 'A medium quality token',
        riskScore: TokenRiskScore.MEDIUM,
        sources: [{source: 'onchain', priority: 1, timestamp: Date.now(), fields: ['name']}],
        lastUpdated: Date.now(),
        cacheKey: 'token2',
      },
      {
        address: '0x3333333333333333333333333333333333333333' as Address,
        chainId: 1,
        name: 'Low Quality Token',
        symbol: 'LQT',
        decimals: 18,
        riskScore: TokenRiskScore.HIGH,
        sources: [{source: 'onchain', priority: 1, timestamp: Date.now(), fields: ['name']}],
        lastUpdated: Date.now(),
        cacheKey: 'token3',
      },
    ]

    it('should filter by minimum completeness', () => {
      const tokens = createTokens()
      const filtered = filterTokensByMetadataQuality(tokens, {
        minCompleteness: 70,
      })

      expect(filtered).toHaveLength(1)
      expect(filtered[0].symbol).toBe('HQT')
    })

    it('should filter by maximum risk score', () => {
      const tokens = createTokens()
      const filtered = filterTokensByMetadataQuality(tokens, {
        maxRiskScore: TokenRiskScore.MEDIUM,
      })

      expect(filtered).toHaveLength(2) // VERIFIED and MEDIUM
      expect(filtered.find(t => t.symbol === 'LQT')).toBeUndefined()
    })

    it('should filter by verification requirement', () => {
      const tokens = createTokens()
      const filtered = filterTokensByMetadataQuality(tokens, {
        requireVerification: true,
      })

      expect(filtered).toHaveLength(1)
      expect(filtered[0].symbol).toBe('HQT')
    })

    it('should filter by logo requirement', () => {
      const tokens = createTokens()
      const filtered = filterTokensByMetadataQuality(tokens, {
        requireLogo: true,
      })

      expect(filtered).toHaveLength(1)
      expect(filtered[0].symbol).toBe('HQT')
    })

    it('should apply multiple filters simultaneously', () => {
      const tokens = createTokens()
      const filtered = filterTokensByMetadataQuality(tokens, {
        minCompleteness: 50,
        maxRiskScore: TokenRiskScore.MEDIUM,
        requireVerification: false,
        requireLogo: false,
      })

      expect(filtered).toHaveLength(2) // HQT and MQT meet the criteria
    })

    it('should return empty array when no tokens meet criteria', () => {
      const tokens = createTokens()
      const filtered = filterTokensByMetadataQuality(tokens, {
        minCompleteness: 101, // Impossible to achieve
        requireVerification: true,
        requireLogo: true,
      })

      expect(filtered).toHaveLength(0)
    })
  })

  describe('DEFAULT_METADATA_CONFIG', () => {
    it('should have sensible default values', () => {
      expect(DEFAULT_METADATA_CONFIG.enableOnChain).toBe(true)
      expect(DEFAULT_METADATA_CONFIG.enableTokenLists).toBe(true)
      expect(DEFAULT_METADATA_CONFIG.enableExternalAPIs).toBe(false) // Privacy-first
      expect(DEFAULT_METADATA_CONFIG.includeMarketData).toBe(false) // Privacy-first
      expect(DEFAULT_METADATA_CONFIG.includeRiskAssessment).toBe(true)
      expect(DEFAULT_METADATA_CONFIG.timeout).toBe(10_000)
    })
  })

  describe('TokenRiskScore', () => {
    it('should define all risk levels', () => {
      expect(TokenRiskScore.VERIFIED).toBe('verified')
      expect(TokenRiskScore.LOW).toBe('low')
      expect(TokenRiskScore.MEDIUM).toBe('medium')
      expect(TokenRiskScore.HIGH).toBe('high')
      expect(TokenRiskScore.UNKNOWN).toBe('unknown')
    })
  })
})
