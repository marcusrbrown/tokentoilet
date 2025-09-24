import type {Address} from 'viem'
import type {DiscoveredToken} from './token-discovery'

import {describe, expect, it} from 'vitest'
import {
  autoCategorizeToken,
  calculateSpamScore,
  calculateTokenStats,
  categorizeToken,
  createTokenId,
  DEFAULT_CATEGORIZATION_PREFERENCES,
  determineValueClass,
  filterTokens,
  parseTokenId,
  sortTokens,
  TokenCategory,
  TokenValueClass,
  type CategorizedToken,
  type TokenCategorizationPreferences,
  type TokenFilter,
  type TokenSortOptions,
} from './token-filtering'
import {TokenRiskScore} from './token-metadata'

// Mock data for testing
const mockDiscoveredToken: DiscoveredToken = {
  address: '0x1234567890123456789012345678901234567890' as Address,
  chainId: 1,
  symbol: 'TEST',
  name: 'Test Token',
  decimals: 18,
  balance: BigInt('1000000000000000000'), // 1 token
  formattedBalance: '1.0',
}

const mockSpamToken: DiscoveredToken = {
  address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' as Address,
  chainId: 1,
  symbol: 'VISIT',
  name: 'Visit our website to claim 1000 USDT',
  decimals: 18,
  balance: BigInt('999999999999999999999999'), // Huge balance
  formattedBalance: '999999999999999999999999.0',
}

const mockCategorizedToken: CategorizedToken = {
  address: '0x1234567890123456789012345678901234567890' as Address,
  chainId: 1,
  symbol: 'TEST',
  name: 'Test Token',
  decimals: 18,
  balance: BigInt('1000000000000000000'),
  formattedBalance: '1.0',
  category: TokenCategory.UNKNOWN,
  valueClass: TokenValueClass.UNKNOWN,
  riskScore: TokenRiskScore.UNKNOWN,
  spamScore: 0,
  isVerified: false,
  analysisTimestamp: Date.now(),
  confidenceScore: 30,
}

describe('Token Filtering Utilities', () => {
  describe('createTokenId and parseTokenId', () => {
    it('should create and parse token IDs correctly', () => {
      const address = '0x1234567890123456789012345678901234567890' as Address
      const chainId = 1

      const tokenId = createTokenId(address, chainId)
      expect(tokenId).toBe('1:0x1234567890123456789012345678901234567890')

      const parsed = parseTokenId(tokenId)
      expect(parsed.address).toBe(address)
      expect(parsed.chainId).toBe(chainId)
    })
  })

  describe('calculateSpamScore', () => {
    it('should return 0 for legitimate tokens', () => {
      const score = calculateSpamScore({
        name: 'Uniswap',
        symbol: 'UNI',
        decimals: 18,
        balance: BigInt('1000000000000000000'),
        isVerified: true,
        riskScore: TokenRiskScore.VERIFIED,
      })

      expect(score).toBe(0)
    })

    it('should detect spam patterns in name', () => {
      const score = calculateSpamScore({
        name: 'Visit our website to claim 1000 USDT',
        symbol: 'CLAIM',
        decimals: 18,
        balance: BigInt('1000000000000000000'),
        isVerified: false,
        riskScore: TokenRiskScore.HIGH,
      })

      expect(score).toBeGreaterThan(50)
    })

    it('should detect suspicious decimals', () => {
      const score = calculateSpamScore({
        name: 'Test Token',
        symbol: 'TEST',
        decimals: 0, // Suspicious
        balance: BigInt('1000000000000000000'),
        isVerified: false,
        riskScore: TokenRiskScore.UNKNOWN,
      })

      expect(score).toBeGreaterThan(0)
    })

    it('should detect huge balance airdrops', () => {
      const score = calculateSpamScore({
        name: 'Test Token',
        symbol: 'TEST',
        decimals: 18,
        balance: BigInt('999999999999999999999999'), // Huge balance
        isVerified: false,
        riskScore: TokenRiskScore.UNKNOWN,
      })

      expect(score).toBeGreaterThan(0)
    })
  })

  describe('determineValueClass', () => {
    const preferences = DEFAULT_CATEGORIZATION_PREFERENCES

    it('should classify high value tokens', () => {
      const valueClass = determineValueClass(150, preferences)
      expect(valueClass).toBe(TokenValueClass.HIGH_VALUE)
    })

    it('should classify medium value tokens', () => {
      const valueClass = determineValueClass(50, preferences)
      expect(valueClass).toBe(TokenValueClass.MEDIUM_VALUE)
    })

    it('should classify low value tokens', () => {
      const valueClass = determineValueClass(5, preferences)
      expect(valueClass).toBe(TokenValueClass.LOW_VALUE)
    })

    it('should classify micro value tokens', () => {
      const valueClass = determineValueClass(0.5, preferences)
      expect(valueClass).toBe(TokenValueClass.MICRO_VALUE)
    })

    it('should classify dust tokens', () => {
      const valueClass = determineValueClass(0.005, preferences)
      expect(valueClass).toBe(TokenValueClass.DUST)
    })

    it('should handle unknown value', () => {
      const valueClass = determineValueClass(undefined, preferences)
      expect(valueClass).toBe(TokenValueClass.UNKNOWN)
    })
  })

  describe('autoCategorizeToken', () => {
    it('should respect manual categorizations', () => {
      const tokenId = createTokenId(mockCategorizedToken.address, mockCategorizedToken.chainId)
      const preferences: TokenCategorizationPreferences = {
        ...DEFAULT_CATEGORIZATION_PREFERENCES,
        manualCategorizations: {
          [tokenId]: {
            category: TokenCategory.VALUABLE,
            timestamp: Date.now(),
          },
        },
      }

      const category = autoCategorizeToken(mockCategorizedToken, preferences)
      expect(category).toBe(TokenCategory.VALUABLE)
    })

    it('should categorize favorites as valuable', () => {
      const tokenId = createTokenId(mockCategorizedToken.address, mockCategorizedToken.chainId)
      const preferences: TokenCategorizationPreferences = {
        ...DEFAULT_CATEGORIZATION_PREFERENCES,
        favoriteTokens: new Set([tokenId]),
      }

      const category = autoCategorizeToken(mockCategorizedToken, preferences)
      expect(category).toBe(TokenCategory.VALUABLE)
    })

    it('should categorize high spam score tokens as spam', () => {
      const spamToken: CategorizedToken = {
        ...mockCategorizedToken,
        spamScore: 80,
      }

      const category = autoCategorizeToken(spamToken, DEFAULT_CATEGORIZATION_PREFERENCES)
      expect(category).toBe(TokenCategory.SPAM)
    })

    it('should categorize dust tokens', () => {
      const dustToken: CategorizedToken = {
        ...mockCategorizedToken,
        valueClass: TokenValueClass.DUST,
      }

      const category = autoCategorizeToken(dustToken, DEFAULT_CATEGORIZATION_PREFERENCES)
      expect(category).toBe(TokenCategory.DUST)
    })

    it('should categorize high risk tokens as unwanted', () => {
      const highRiskToken: CategorizedToken = {
        ...mockCategorizedToken,
        riskScore: TokenRiskScore.HIGH,
      }

      const category = autoCategorizeToken(highRiskToken, DEFAULT_CATEGORIZATION_PREFERENCES)
      expect(category).toBe(TokenCategory.UNWANTED)
    })

    it('should categorize high value tokens as valuable', () => {
      const highValueToken: CategorizedToken = {
        ...mockCategorizedToken,
        valueClass: TokenValueClass.HIGH_VALUE,
      }

      const category = autoCategorizeToken(highValueToken, DEFAULT_CATEGORIZATION_PREFERENCES)
      expect(category).toBe(TokenCategory.VALUABLE)
    })

    it('should default to unknown for unclear tokens', () => {
      const category = autoCategorizeToken(mockCategorizedToken, DEFAULT_CATEGORIZATION_PREFERENCES)
      expect(category).toBe(TokenCategory.UNKNOWN)
    })
  })

  describe('categorizeToken', () => {
    it('should categorize a discovered token', () => {
      const categorized = categorizeToken(mockDiscoveredToken, undefined, DEFAULT_CATEGORIZATION_PREFERENCES)

      expect(categorized.address).toBe(mockDiscoveredToken.address)
      expect(categorized.chainId).toBe(mockDiscoveredToken.chainId)
      expect(categorized.symbol).toBe(mockDiscoveredToken.symbol)
      expect(categorized.name).toBe(mockDiscoveredToken.name)
      expect(categorized.category).toBe(TokenCategory.UNKNOWN)
      expect(categorized.spamScore).toBeGreaterThanOrEqual(0)
      expect(categorized.spamScore).toBeLessThanOrEqual(100)
      expect(categorized.confidenceScore).toBeGreaterThan(0)
    })

    it('should handle spam tokens', () => {
      // Use custom preferences with lower spam threshold for this test
      const testPreferences: TokenCategorizationPreferences = {
        ...DEFAULT_CATEGORIZATION_PREFERENCES,
        spamDetection: {
          ...DEFAULT_CATEGORIZATION_PREFERENCES.spamDetection,
          spamScoreThreshold: 50, // Lower threshold for this test
        },
      }

      const categorized = categorizeToken(mockSpamToken, undefined, testPreferences)

      expect(categorized.spamScore).toBeGreaterThan(50)
      expect(categorized.category).toBe(TokenCategory.SPAM)
    })
  })

  describe('filterTokens', () => {
    const mockTokens: CategorizedToken[] = [
      {
        ...mockCategorizedToken,
        category: TokenCategory.VALUABLE,
        estimatedValueUSD: 100,
      },
      {
        ...mockCategorizedToken,
        address: '0x2222222222222222222222222222222222222222' as Address,
        category: TokenCategory.UNWANTED,
        estimatedValueUSD: 0.01,
      },
      {
        ...mockCategorizedToken,
        address: '0x3333333333333333333333333333333333333333' as Address,
        category: TokenCategory.SPAM,
        spamScore: 90,
      },
    ]

    it('should filter by category', () => {
      const filter: TokenFilter = {
        categories: [TokenCategory.VALUABLE],
      }

      const filtered = filterTokens(mockTokens, filter)
      expect(filtered).toHaveLength(1)
      expect(filtered[0].category).toBe(TokenCategory.VALUABLE)
    })

    it('should filter by minimum USD value', () => {
      const filter: TokenFilter = {
        minValueUSD: 50,
      }

      const filtered = filterTokens(mockTokens, filter)
      expect(filtered).toHaveLength(1)
      expect(filtered[0].estimatedValueUSD).toBeGreaterThanOrEqual(50)
    })

    it('should filter by spam score', () => {
      const filter: TokenFilter = {
        maxSpamScore: 50,
      }

      const filtered = filterTokens(mockTokens, filter)
      expect(filtered).toHaveLength(2)
      expect(filtered.every(token => token.spamScore <= 50)).toBe(true)
    })

    it('should filter by search query', () => {
      const filter: TokenFilter = {
        searchQuery: 'test',
      }

      const filtered = filterTokens(mockTokens, filter)
      expect(filtered.length).toBeGreaterThan(0)
      expect(
        filtered.every(
          token => token.name.toLowerCase().includes('test') || token.symbol.toLowerCase().includes('test'),
        ),
      ).toBe(true)
    })
  })

  describe('sortTokens', () => {
    const mockTokens: CategorizedToken[] = [
      {
        ...mockCategorizedToken,
        name: 'A Token',
        estimatedValueUSD: 10,
        formattedBalance: '1.0',
      },
      {
        ...mockCategorizedToken,
        address: '0x2222222222222222222222222222222222222222' as Address,
        name: 'B Token',
        estimatedValueUSD: 50,
        formattedBalance: '2.0',
      },
      {
        ...mockCategorizedToken,
        address: '0x3333333333333333333333333333333333333333' as Address,
        name: 'C Token',
        estimatedValueUSD: 25,
        formattedBalance: '3.0',
      },
    ]

    it('should sort by value descending', () => {
      const sortOptions: TokenSortOptions = {
        field: 'value',
        direction: 'desc',
      }

      const sorted = sortTokens(mockTokens, sortOptions)
      expect(sorted[0].estimatedValueUSD).toBe(50)
      expect(sorted[1].estimatedValueUSD).toBe(25)
      expect(sorted[2].estimatedValueUSD).toBe(10)
    })

    it('should sort by name ascending', () => {
      const sortOptions: TokenSortOptions = {
        field: 'name',
        direction: 'asc',
      }

      const sorted = sortTokens(mockTokens, sortOptions)
      expect(sorted[0].name).toBe('A Token')
      expect(sorted[1].name).toBe('B Token')
      expect(sorted[2].name).toBe('C Token')
    })

    it('should sort by balance descending', () => {
      const sortOptions: TokenSortOptions = {
        field: 'balance',
        direction: 'desc',
      }

      const sorted = sortTokens(mockTokens, sortOptions)
      expect(Number.parseFloat(sorted[0].formattedBalance)).toBe(3)
      expect(Number.parseFloat(sorted[1].formattedBalance)).toBe(2)
      expect(Number.parseFloat(sorted[2].formattedBalance)).toBe(1)
    })

    it('should handle secondary sort', () => {
      const tokensWithSameValue: CategorizedToken[] = [
        {
          ...mockCategorizedToken,
          name: 'B Token',
          estimatedValueUSD: 25,
          formattedBalance: '1.0',
        },
        {
          ...mockCategorizedToken,
          address: '0x2222222222222222222222222222222222222222' as Address,
          name: 'A Token',
          estimatedValueUSD: 25,
          formattedBalance: '2.0',
        },
      ]

      const sortOptions: TokenSortOptions = {
        field: 'value',
        direction: 'desc',
        secondary: {field: 'name', direction: 'asc'},
      }

      const sorted = sortTokens(tokensWithSameValue, sortOptions)
      expect(sorted[0].name).toBe('A Token')
      expect(sorted[1].name).toBe('B Token')
    })
  })

  describe('calculateTokenStats', () => {
    const mockTokens: CategorizedToken[] = [
      {
        ...mockCategorizedToken,
        category: TokenCategory.VALUABLE,
        valueClass: TokenValueClass.HIGH_VALUE,
        estimatedValueUSD: 100,
      },
      {
        ...mockCategorizedToken,
        address: '0x2222222222222222222222222222222222222222' as Address,
        category: TokenCategory.VALUABLE,
        valueClass: TokenValueClass.MEDIUM_VALUE,
        estimatedValueUSD: 50,
      },
      {
        ...mockCategorizedToken,
        address: '0x3333333333333333333333333333333333333333' as Address,
        category: TokenCategory.UNWANTED,
        valueClass: TokenValueClass.DUST,
        estimatedValueUSD: 0.01,
      },
    ]

    it('should calculate correct statistics', () => {
      const stats = calculateTokenStats(mockTokens)

      expect(stats.totalTokens).toBe(3)
      expect(stats.totalValueUSD).toBe(150.01)
      expect(stats.categoryStats[TokenCategory.VALUABLE]).toBe(2)
      expect(stats.categoryStats[TokenCategory.UNWANTED]).toBe(1)
      expect(stats.valueStats[TokenValueClass.HIGH_VALUE]).toBe(1)
      expect(stats.valueStats[TokenValueClass.MEDIUM_VALUE]).toBe(1)
      expect(stats.valueStats[TokenValueClass.DUST]).toBe(1)
    })

    it('should handle empty token list', () => {
      const stats = calculateTokenStats([])

      expect(stats.totalTokens).toBe(0)
      expect(stats.totalValueUSD).toBe(0)
      expect(Object.values(stats.categoryStats).every(count => count === 0)).toBe(true)
    })
  })
})
