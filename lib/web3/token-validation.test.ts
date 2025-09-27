'use client'

import {describe, expect, it} from 'vitest'

import {
  ADVANCED_SPAM_PATTERNS,
  getRiskDescription,
  getSecurityRecommendation,
  quickSecurityCheck,
  shouldFilterToken,
  TOKEN_SECURITY_LISTS,
  TokenSecurityRisk,
  validateTokenSecurity,
  type TokenSecurityValidation,
} from './token-validation'

// Mock token addresses for testing
const MOCK_ADDRESSES = {
  VERIFIED: '0xa0b86a33e6776498bacedf825f0e7b2f228c4646' as const, // USDT on Ethereum
  UNKNOWN: '0x1234567890123456789012345678901234567890' as const,
  INVALID: 'invalid-address' as const,
}

describe('Token Security Validation', () => {
  describe('ADVANCED_SPAM_PATTERNS', () => {
    it('should detect spam names', () => {
      const spamNames = [
        'Free USDT Claim Now',
        'Visit website to claim',
        'Bonus Reward Token',
        'www.scamsite.com Token',
        '1000$ USDT',
      ]

      for (const name of spamNames) {
        const hasSpam = ADVANCED_SPAM_PATTERNS.scamNames.some(pattern => pattern.test(name))
        expect(hasSpam).toBe(true)
      }
    })

    it('should detect spam symbols', () => {
      const spamSymbols = ['123', '$100', 'VISIT', 'CLAIM', 'WWW']

      for (const symbol of spamSymbols) {
        const hasSpam = ADVANCED_SPAM_PATTERNS.scamSymbols.some(pattern => pattern.test(symbol))
        expect(hasSpam).toBe(true)
      }
    })

    it('should detect impersonation attempts', () => {
      const impersonationCases = [
        {name: 'etherium token', shouldDetect: true},
        {name: 'ethereum classic', shouldDetect: false}, // legitimate
        {name: 'chainlnk protocol', shouldDetect: true},
        {name: 'chainlink oracle', shouldDetect: false}, // legitimate
      ]

      for (const testCase of impersonationCases) {
        const isImpersonating = ADVANCED_SPAM_PATTERNS.impersonationPatterns.some(({original, variants}) => {
          const nameLower = testCase.name.toLowerCase()
          return variants.some(variant => nameLower.includes(variant) && !nameLower.includes(original))
        })
        expect(isImpersonating).toBe(testCase.shouldDetect)
      }
    })
  })

  describe('TOKEN_SECURITY_LISTS', () => {
    it('should have verified tokens for all supported chains', () => {
      expect(TOKEN_SECURITY_LISTS.verified[1]).toBeDefined() // Ethereum
      expect(TOKEN_SECURITY_LISTS.verified[137]).toBeDefined() // Polygon
      expect(TOKEN_SECURITY_LISTS.verified[42161]).toBeDefined() // Arbitrum
      expect(Array.isArray(TOKEN_SECURITY_LISTS.verified[1])).toBe(true)
    })

    it('should have blacklisted and risky token arrays', () => {
      expect(Array.isArray(TOKEN_SECURITY_LISTS.blacklisted[1])).toBe(true)
      expect(Array.isArray(TOKEN_SECURITY_LISTS.risky[1])).toBe(true)
    })
  })

  describe('quickSecurityCheck', () => {
    it('should identify verified tokens as safe', () => {
      const result = quickSecurityCheck(MOCK_ADDRESSES.VERIFIED, 1)
      expect(result.riskLevel).toBe(TokenSecurityRisk.VERIFIED)
      expect(result.trusted).toBe(true)
      expect(result.reason).toContain('verified')
    })

    it('should flag unknown tokens with medium risk', () => {
      const result = quickSecurityCheck(MOCK_ADDRESSES.UNKNOWN, 1)
      expect(result.riskLevel).toBe(TokenSecurityRisk.MEDIUM)
      expect(result.trusted).toBe(false)
    })

    it('should detect spam patterns in metadata', () => {
      const result = quickSecurityCheck(MOCK_ADDRESSES.UNKNOWN, 1, {
        name: 'Free USDT Claim',
        symbol: 'VISIT',
        decimals: 18,
      })
      expect(result.riskLevel).toBe(TokenSecurityRisk.HIGH)
      expect(result.trusted).toBe(false)
    })
  })

  describe('validateTokenSecurity', () => {
    it('should validate verified tokens as secure', async () => {
      const result = await validateTokenSecurity(
        MOCK_ADDRESSES.VERIFIED,
        1,
        {
          name: 'Tether USD',
          symbol: 'USDT',
          decimals: 18,
        },
        {
          enableContractAnalysis: false, // Skip for faster testing
          enableMetadataValidation: true,
          enableExternalValidation: false,
          validationTimeout: 5000,
          enableCaching: true,
          strictMode: false,
        },
      )

      expect(result.riskLevel).toBe(TokenSecurityRisk.VERIFIED)
      expect(result.isVerified).toBe(true)
      expect(result.securityScore).toBeGreaterThan(80)
    })

    it('should detect spam metadata issues', async () => {
      const result = await validateTokenSecurity(
        MOCK_ADDRESSES.UNKNOWN,
        1,
        {
          name: 'Free USDT Claim Token',
          symbol: '1000',
          decimals: 0, // Suspicious decimals
        },
        {
          enableContractAnalysis: false,
          enableMetadataValidation: true,
          enableExternalValidation: false,
          validationTimeout: 5000,
          enableCaching: true,
          strictMode: false,
        },
      )

      expect(result.issues.length).toBeGreaterThan(0)
      expect(result.metadataSecurity.hasSpamName).toBe(true)
      expect(result.metadataSecurity.hasSpamSymbol).toBe(true)
      expect(result.metadataSecurity.hasSuspiciousDecimals).toBe(true)
      expect(result.securityScore).toBeLessThanOrEqual(60)
    })

    it('should handle airdrop spam detection', async () => {
      const result = await validateTokenSecurity(
        MOCK_ADDRESSES.UNKNOWN,
        1,
        {
          name: 'Normal Token',
          symbol: 'NORM',
          decimals: 18,
          balance: BigInt('1000000000000000000000000'), // 1 million tokens
          totalSupply: BigInt('1000000000000000000000000'), // 1 million total (100% owned)
        },
        {
          enableContractAnalysis: false,
          enableMetadataValidation: true,
          enableExternalValidation: false,
          validationTimeout: 5000,
          enableCaching: true,
          strictMode: false,
        },
      )

      const hasAirdropSpam = result.issues.some(issue => issue.type === 'airdrop_spam')
      expect(hasAirdropSpam).toBe(true)
      expect(result.securityScore).toBeLessThan(90)
    })

    it('should apply strict mode correctly', async () => {
      const normalResult = await validateTokenSecurity(
        MOCK_ADDRESSES.UNKNOWN,
        1,
        {
          name: 'Normal Token',
          symbol: 'NORM',
          decimals: 18,
        },
        {
          enableContractAnalysis: false,
          enableMetadataValidation: true,
          enableExternalValidation: false,
          validationTimeout: 5000,
          enableCaching: true,
          strictMode: false,
        },
      )

      const strictResult = await validateTokenSecurity(
        MOCK_ADDRESSES.UNKNOWN,
        1,
        {
          name: 'Normal Token',
          symbol: 'NORM',
          decimals: 18,
        },
        {
          enableContractAnalysis: false,
          enableMetadataValidation: true,
          enableExternalValidation: false,
          validationTimeout: 5000,
          enableCaching: true,
          strictMode: true,
        },
      )

      expect(strictResult.securityScore).toBeLessThanOrEqual(normalResult.securityScore)
    })

    it('should reject invalid addresses', async () => {
      await expect(
        validateTokenSecurity(MOCK_ADDRESSES.INVALID as never, 1, {
          name: 'Test Token',
          symbol: 'TEST',
          decimals: 18,
        }),
      ).rejects.toThrow('Invalid token address')
    })
  })

  describe('shouldFilterToken', () => {
    const createMockValidation = (riskLevel: TokenSecurityRisk): TokenSecurityValidation => ({
      riskLevel,
      securityScore: 50,
      issues: [],
      validatedAt: new Date(),
      isVerified: false,
      contractSecurity: {
        isVerified: false,
        isProxy: false,
        hasMintFunction: false,
        hasTransferRestrictions: false,
        isHoneypot: false,
        deployerRisk: 'medium',
      },
      metadataSecurity: {
        hasSpamName: false,
        hasSpamSymbol: false,
        isImpersonating: false,
        hasSuspiciousDecimals: false,
        hasPromotionalContent: false,
        metadataQuality: 50,
      },
    })

    it('should filter tokens based on user risk tolerance', () => {
      const verifiedToken = createMockValidation(TokenSecurityRisk.VERIFIED)
      const lowRiskToken = createMockValidation(TokenSecurityRisk.LOW)
      const mediumRiskToken = createMockValidation(TokenSecurityRisk.MEDIUM)
      const highRiskToken = createMockValidation(TokenSecurityRisk.HIGH)
      const criticalRiskToken = createMockValidation(TokenSecurityRisk.CRITICAL)

      // Conservative user (only accepts verified and low risk)
      expect(shouldFilterToken(verifiedToken, TokenSecurityRisk.LOW)).toBe(false)
      expect(shouldFilterToken(lowRiskToken, TokenSecurityRisk.LOW)).toBe(false)
      expect(shouldFilterToken(mediumRiskToken, TokenSecurityRisk.LOW)).toBe(true)
      expect(shouldFilterToken(highRiskToken, TokenSecurityRisk.LOW)).toBe(true)
      expect(shouldFilterToken(criticalRiskToken, TokenSecurityRisk.LOW)).toBe(true)

      // Moderate user (accepts up to medium risk)
      expect(shouldFilterToken(mediumRiskToken, TokenSecurityRisk.MEDIUM)).toBe(false)
      expect(shouldFilterToken(highRiskToken, TokenSecurityRisk.MEDIUM)).toBe(true)

      // Risk-tolerant user (accepts up to high risk)
      expect(shouldFilterToken(highRiskToken, TokenSecurityRisk.HIGH)).toBe(false)
      expect(shouldFilterToken(criticalRiskToken, TokenSecurityRisk.HIGH)).toBe(true)
    })
  })

  describe('Risk descriptions and recommendations', () => {
    it('should provide appropriate risk descriptions', () => {
      expect(getRiskDescription(TokenSecurityRisk.VERIFIED)).toContain('Verified')
      expect(getRiskDescription(TokenSecurityRisk.LOW)).toContain('safe')
      expect(getRiskDescription(TokenSecurityRisk.MEDIUM)).toContain('caution')
      expect(getRiskDescription(TokenSecurityRisk.HIGH)).toContain('risk')
      expect(getRiskDescription(TokenSecurityRisk.CRITICAL)).toContain('Dangerous')
    })

    it('should provide appropriate security recommendations', () => {
      expect(getSecurityRecommendation(TokenSecurityRisk.VERIFIED)).toContain('Safe')
      expect(getSecurityRecommendation(TokenSecurityRisk.LOW)).toContain('safe')
      expect(getSecurityRecommendation(TokenSecurityRisk.MEDIUM)).toContain('Research')
      expect(getSecurityRecommendation(TokenSecurityRisk.HIGH)).toContain('risks')
      expect(getSecurityRecommendation(TokenSecurityRisk.CRITICAL)).toContain('Do not')
    })
  })

  describe('Edge cases and error handling', () => {
    it('should handle missing token data gracefully', async () => {
      const result = await validateTokenSecurity(
        MOCK_ADDRESSES.UNKNOWN,
        1,
        {
          name: '',
          symbol: '',
          decimals: 18,
        },
        {
          enableContractAnalysis: false,
          enableMetadataValidation: true,
          enableExternalValidation: false,
          validationTimeout: 1000,
          enableCaching: false,
          strictMode: false,
        },
      )

      expect(result.securityScore).toBeGreaterThanOrEqual(0)
      expect(result.securityScore).toBeLessThanOrEqual(100)
    })

    it('should handle very large numbers gracefully', async () => {
      const result = await validateTokenSecurity(
        MOCK_ADDRESSES.UNKNOWN,
        1,
        {
          name: 'Big Token',
          symbol: 'BIG',
          decimals: 18,
          balance: BigInt('999999999999999999999999999999999999'),
          totalSupply: BigInt('1000000000000000000000000000000000000'),
        },
        {
          enableContractAnalysis: false,
          enableMetadataValidation: true,
          enableExternalValidation: false,
          validationTimeout: 1000,
          enableCaching: false,
          strictMode: false,
        },
      )

      expect(result).toBeDefined()
      expect(result.issues.length).toBeGreaterThan(0)
    })

    it('should validate all supported chain IDs', () => {
      const supportedChains = [1, 137, 42161] as const

      for (const chainId of supportedChains) {
        const result = quickSecurityCheck(MOCK_ADDRESSES.UNKNOWN, chainId)
        expect(result).toBeDefined()
        expect(result.riskLevel).toBeDefined()
      }
    })
  })
})
