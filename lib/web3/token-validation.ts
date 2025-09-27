'use client'

import type {SupportedChainId} from '../../hooks/use-wallet'

import {isAddress, type Address} from 'viem'

/**
 * Token security risk levels
 */
export enum TokenSecurityRisk {
  VERIFIED = 'verified', // Verified by trusted sources
  LOW = 'low', // Generally safe, minor concerns
  MEDIUM = 'medium', // Some risk factors present
  HIGH = 'high', // Multiple risk factors or known issues
  CRITICAL = 'critical', // Dangerous, likely scam/malware
}

/**
 * Security validation result for a token
 */
export interface TokenSecurityValidation {
  /** Overall risk assessment */
  riskLevel: TokenSecurityRisk
  /** Security score (0-100, higher = more secure) */
  securityScore: number
  /** Detected security issues */
  issues: SecurityIssue[]
  /** Validation timestamp */
  validatedAt: Date
  /** Is this token verified by trusted sources */
  isVerified: boolean
  /** Contract security analysis */
  contractSecurity: ContractSecurityResult
  /** Token metadata security */
  metadataSecurity: MetadataSecurityResult
}

/**
 * Individual security issue detected
 */
export interface SecurityIssue {
  /** Issue type */
  type: SecurityIssueType
  /** Severity level */
  severity: 'low' | 'medium' | 'high' | 'critical'
  /** Description of the issue */
  description: string
  /** Recommendation for users */
  recommendation?: string
  /** Evidence or details */
  evidence?: Record<string, unknown>
}

/**
 * Types of security issues that can be detected
 */
export enum SecurityIssueType {
  // Contract-based issues
  HONEYPOT = 'honeypot',
  HIGH_TAX = 'high_tax',
  MINT_FUNCTION = 'mint_function',
  PROXY_CONTRACT = 'proxy_contract',
  UNVERIFIED_CONTRACT = 'unverified_contract',
  SUSPICIOUS_OWNER = 'suspicious_owner',

  // Metadata issues
  SPAM_NAME = 'spam_name',
  SPAM_SYMBOL = 'spam_symbol',
  MISLEADING_NAME = 'misleading_name',
  IMPERSONATION = 'impersonation',
  SUSPICIOUS_DECIMALS = 'suspicious_decimals',

  // Economic issues
  ZERO_LIQUIDITY = 'zero_liquidity',
  MASSIVE_SUPPLY = 'massive_supply',
  UNUSUAL_DISTRIBUTION = 'unusual_distribution',
  AIRDROP_SPAM = 'airdrop_spam',

  // Behavioral issues
  BLACKLISTED = 'blacklisted',
  KNOWN_SCAM = 'known_scam',
  PHISHING_RELATED = 'phishing_related',
  MALWARE_ASSOCIATED = 'malware_associated',
}

/**
 * Contract security analysis result
 */
export interface ContractSecurityResult {
  /** Is contract verified on block explorer */
  isVerified: boolean
  /** Contract has proxy implementation */
  isProxy: boolean
  /** Contract has mint function */
  hasMintFunction: boolean
  /** Contract has unusual transfer restrictions */
  hasTransferRestrictions: boolean
  /** Buy/sell tax percentage (0-100) */
  buyTax?: number
  sellTax?: number
  /** Honeypot detection */
  isHoneypot: boolean
  /** Contract deployer analysis */
  deployerRisk: 'low' | 'medium' | 'high'
}

/**
 * Metadata security analysis result
 */
export interface MetadataSecurityResult {
  /** Name contains spam patterns */
  hasSpamName: boolean
  /** Symbol contains spam patterns */
  hasSpamSymbol: boolean
  /** Appears to impersonate known tokens */
  isImpersonating: boolean
  /** Has suspicious decimal count */
  hasSuspiciousDecimals: boolean
  /** Contains URLs or promotional content */
  hasPromotionalContent: boolean
  /** Quality score of metadata (0-100) */
  metadataQuality: number
}

/**
 * Token validation configuration
 */
export interface TokenValidationConfig {
  /** Enable contract security checks */
  enableContractAnalysis: boolean
  /** Enable metadata validation */
  enableMetadataValidation: boolean
  /** Enable external API checks */
  enableExternalValidation: boolean
  /** Timeout for validation requests (ms) */
  validationTimeout: number
  /** Cache validation results */
  enableCaching: boolean
  /** Strict mode (more conservative risk assessment) */
  strictMode: boolean
}

/**
 * Default validation configuration
 */
export const DEFAULT_TOKEN_VALIDATION_CONFIG: TokenValidationConfig = {
  enableContractAnalysis: true,
  enableMetadataValidation: true,
  enableExternalValidation: false, // Privacy-first default
  validationTimeout: 10_000, // 10 seconds
  enableCaching: true,
  strictMode: false,
}

/**
 * Known token addresses for different risk categories
 */
export const TOKEN_SECURITY_LISTS = {
  /** Verified safe tokens by chain */
  verified: {
    1: [
      // Ethereum mainnet
      '0xa0b86a33e6776498bacedf825f0e7b2f228c4646', // USDT
      '0xa0b73e1ff0b80914ab6fe0444e65848c4c34450b', // USDC
      '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH
      '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', // WBTC
    ],
    137: [
      // Polygon
      '0x2791bca1f2de4661ed88a30c99a7a9449aa84174', // USDC
      '0xc2132d05d31c914a87c6611c10748aeb04b58e8f', // USDT
      '0x7ceb23fd6c8add589036b55727117c635777d282', // WETH
    ],
    42161: [
      // Arbitrum
      '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8', // USDC
      '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9', // USDT
      '0x82af49447d8a07e3bd95bd0d56f35241523fbab1', // WETH
    ],
  } as Record<SupportedChainId, Address[]>,

  /** Known scam/spam tokens */
  blacklisted: {
    1: [], // Ethereum mainnet
    137: [], // Polygon
    42161: [], // Arbitrum
  } as Record<SupportedChainId, Address[]>,

  /** Tokens with known security issues */
  risky: {
    1: [], // Ethereum mainnet
    137: [], // Polygon
    42161: [], // Arbitrum
  } as Record<SupportedChainId, Address[]>,
}

/**
 * Advanced spam detection patterns
 */
export const ADVANCED_SPAM_PATTERNS = {
  /** Scam token name patterns */
  scamNames: [
    // Common scam phrases
    /claim.*free|free.*claim/i,
    /visit.*to.*claim/i,
    /bonus.*reward|reward.*bonus/i,
    /airdrop.*claim/i,

    // Fake token patterns
    /^\d+[$€£¥]?\s*(?:usdt|usdc|eth|btc|bnb|ada|dot|sol)/i,
    /^(?:usdt|usdc|eth|btc)[\s\-_]*\d+/i,

    // Promotional/website content
    /(?:www|http|\.com|\.org|\.io|\.net)/i,
    /telegram|discord|twitter/i,

    // Impersonation attempts
    /^(?:fake|scam|test)[\s\-_]/i,
    /[\s\-_](?:fake|scam|test)$/i,
  ],

  /** Suspicious symbol patterns */
  scamSymbols: [
    /^\d+$/, // Only numbers
    /\$\d+/, // Dollar sign with numbers
    /^(?:visit|claim|free|bonus|reward)$/i,
    /^(?:www|http)/i,
    /\W/g, // Non-alphanumeric characters
  ],

  /** Phishing/malware indicators */
  maliciousPatterns: [
    /(?:connect.*wallet|approve.*transaction)/i,
    /(?:private.*key|seed.*phrase)/i,
    /metamask|trustwallet|coinbase/i,
    /(?:verify.*wallet|confirm.*identity)/i,
  ],

  /** Impersonation patterns for major tokens */
  impersonationPatterns: [
    // Major token impersonation
    {original: 'ethereum', variants: ['etherium', 'etherem', 'ethrium']},
    {original: 'bitcoin', variants: ['bitcon', 'bitcoln', 'biitcoin']},
    {original: 'chainlink', variants: ['chainlnk', 'chainlk', 'chainiink']},
    {original: 'uniswap', variants: ['uniswp', 'unisawp', 'umiswap']},
    {original: 'polygon', variants: ['polygoin', 'poygon', 'polygan']},
  ],
}

/**
 * Validate token security and detect potential risks
 *
 * @param tokenAddress Token contract address
 * @param chainId Chain ID where token exists
 * @param tokenData Token metadata
 * @param tokenData.name Token name
 * @param tokenData.symbol Token symbol
 * @param tokenData.decimals Token decimal places
 * @param tokenData.totalSupply Total token supply (optional)
 * @param tokenData.balance User's token balance (optional)
 * @param config Validation configuration
 * @returns Security validation result
 */
export async function validateTokenSecurity(
  tokenAddress: Address,
  chainId: SupportedChainId,
  tokenData: {
    name: string
    symbol: string
    decimals: number
    totalSupply?: bigint
    balance?: bigint
  },
  config: TokenValidationConfig = DEFAULT_TOKEN_VALIDATION_CONFIG,
): Promise<TokenSecurityValidation> {
  const issues: SecurityIssue[] = []
  let securityScore = 100 // Start with perfect score, deduct for issues

  // Validate basic token data
  if (!isAddress(tokenAddress)) {
    throw new Error(`Invalid token address: ${String(tokenAddress)}`)
  }

  // Check if token is in verified list (highest trust)
  const isVerified = TOKEN_SECURITY_LISTS.verified[chainId]?.includes(tokenAddress) ?? false

  // Check if token is blacklisted (critical risk)
  const isBlacklisted = TOKEN_SECURITY_LISTS.blacklisted[chainId]?.includes(tokenAddress) ?? false
  if (isBlacklisted) {
    issues.push({
      type: SecurityIssueType.BLACKLISTED,
      severity: 'critical',
      description: 'Token is on security blacklist',
      recommendation: 'Do not interact with this token',
    })
    securityScore = 0
  }

  // Check if token has known risks
  const hasKnownRisks = TOKEN_SECURITY_LISTS.risky[chainId]?.includes(tokenAddress) ?? false
  if (hasKnownRisks) {
    issues.push({
      type: SecurityIssueType.SUSPICIOUS_OWNER,
      severity: 'high',
      description: 'Token has known security concerns',
      recommendation: 'Exercise extreme caution',
    })
    securityScore -= 30
  }

  // Perform metadata security validation
  let metadataSecurity: MetadataSecurityResult
  if (config.enableMetadataValidation) {
    metadataSecurity = validateTokenMetadata(tokenData)

    // Add metadata issues to overall security assessment
    if (metadataSecurity.hasSpamName) {
      issues.push({
        type: SecurityIssueType.SPAM_NAME,
        severity: 'medium',
        description: 'Token name matches spam patterns',
        recommendation: 'Verify token legitimacy before interacting',
      })
      securityScore -= 20
    }

    if (metadataSecurity.hasSpamSymbol) {
      issues.push({
        type: SecurityIssueType.SPAM_SYMBOL,
        severity: 'medium',
        description: 'Token symbol matches spam patterns',
        recommendation: 'Verify token legitimacy before interacting',
      })
      securityScore -= 15
    }

    if (metadataSecurity.isImpersonating) {
      issues.push({
        type: SecurityIssueType.IMPERSONATION,
        severity: 'high',
        description: 'Token appears to impersonate a well-known token',
        recommendation: 'Check official token contract addresses',
      })
      securityScore -= 25
    }

    if (metadataSecurity.hasSuspiciousDecimals) {
      issues.push({
        type: SecurityIssueType.SUSPICIOUS_DECIMALS,
        severity: 'low',
        description: 'Token has unusual decimal count',
        recommendation: 'Verify token specifications',
      })
      securityScore -= 5
    }

    if (metadataSecurity.hasPromotionalContent) {
      issues.push({
        type: SecurityIssueType.SPAM_NAME,
        severity: 'medium',
        description: 'Token metadata contains promotional content',
        recommendation: 'Be cautious of promotional tokens',
      })
      securityScore -= 10
    }
  } else {
    // Default metadata security if validation disabled
    metadataSecurity = {
      hasSpamName: false,
      hasSpamSymbol: false,
      isImpersonating: false,
      hasSuspiciousDecimals: false,
      hasPromotionalContent: false,
      metadataQuality: 50, // Unknown quality
    }
  }

  // Perform contract security analysis
  let contractSecurity: ContractSecurityResult
  if (config.enableContractAnalysis) {
    contractSecurity = await analyzeContractSecurity(tokenAddress, chainId, config)

    // Add contract issues to overall assessment
    if (contractSecurity.isHoneypot) {
      issues.push({
        type: SecurityIssueType.HONEYPOT,
        severity: 'critical',
        description: 'Token contract appears to be a honeypot',
        recommendation: 'Do not purchase this token',
      })
      securityScore = Math.min(securityScore, 10) // Cap at very low score
    }

    if (contractSecurity.buyTax != null && contractSecurity.buyTax > 10) {
      issues.push({
        type: SecurityIssueType.HIGH_TAX,
        severity: 'medium',
        description: `High buy tax: ${contractSecurity.buyTax}%`,
        recommendation: 'Consider tax implications before trading',
      })
      securityScore -= Math.min(contractSecurity.buyTax, 20)
    }

    if (contractSecurity.sellTax != null && contractSecurity.sellTax > 10) {
      issues.push({
        type: SecurityIssueType.HIGH_TAX,
        severity: 'medium',
        description: `High sell tax: ${contractSecurity.sellTax}%`,
        recommendation: 'Consider tax implications before trading',
      })
      securityScore -= Math.min(contractSecurity.sellTax, 20)
    }

    if (!contractSecurity.isVerified) {
      issues.push({
        type: SecurityIssueType.UNVERIFIED_CONTRACT,
        severity: 'medium',
        description: 'Contract source code is not verified',
        recommendation: 'Exercise caution with unverified contracts',
      })
      securityScore -= 15
    }

    if (contractSecurity.hasMintFunction) {
      issues.push({
        type: SecurityIssueType.MINT_FUNCTION,
        severity: 'low',
        description: 'Contract has mint function (supply can be increased)',
        recommendation: 'Be aware of potential supply inflation',
      })
      securityScore -= 5
    }

    if (contractSecurity.deployerRisk === 'high') {
      issues.push({
        type: SecurityIssueType.SUSPICIOUS_OWNER,
        severity: 'high',
        description: 'Contract deployer has high risk profile',
        recommendation: 'Verify deployer legitimacy',
      })
      securityScore -= 20
    }
  } else {
    // Default contract security if analysis disabled
    contractSecurity = {
      isVerified: false,
      isProxy: false,
      hasMintFunction: false,
      hasTransferRestrictions: false,
      isHoneypot: false,
      deployerRisk: 'medium',
    }
  }

  // Check for airdrop spam patterns
  if (tokenData.balance != null && tokenData.totalSupply != null) {
    const balanceRatio = Number(tokenData.balance) / Number(tokenData.totalSupply)
    if (balanceRatio > 0.001 && tokenData.balance > BigInt('1000000000000000000000')) {
      // >1000 tokens and >0.1% of supply
      issues.push({
        type: SecurityIssueType.AIRDROP_SPAM,
        severity: 'medium',
        description: 'Large unexpected token balance suggests airdrop spam',
        recommendation: 'Verify token legitimacy before interaction',
      })
      securityScore -= 15
    }
  }

  // Determine overall risk level
  let riskLevel: TokenSecurityRisk
  if (isVerified) {
    riskLevel = TokenSecurityRisk.VERIFIED
  } else if (securityScore >= 80) {
    riskLevel = TokenSecurityRisk.LOW
  } else if (securityScore >= 60) {
    riskLevel = TokenSecurityRisk.MEDIUM
  } else if (securityScore >= 30) {
    riskLevel = TokenSecurityRisk.HIGH
  } else {
    riskLevel = TokenSecurityRisk.CRITICAL
  }

  // Apply strict mode adjustments
  if (config.strictMode) {
    if (riskLevel === TokenSecurityRisk.LOW && !isVerified) {
      riskLevel = TokenSecurityRisk.MEDIUM
    }
    if (riskLevel === TokenSecurityRisk.MEDIUM) {
      riskLevel = TokenSecurityRisk.HIGH
    }
    securityScore = Math.max(0, securityScore - 10)
  }

  return {
    riskLevel,
    securityScore: Math.max(0, Math.min(100, securityScore)),
    issues,
    validatedAt: new Date(),
    isVerified,
    contractSecurity,
    metadataSecurity,
  }
}

/**
 * Validate token metadata for security issues
 */
function validateTokenMetadata(tokenData: {name: string; symbol: string; decimals: number}): MetadataSecurityResult {
  const {name, symbol, decimals} = tokenData

  // Check for spam name patterns
  const hasSpamName = ADVANCED_SPAM_PATTERNS.scamNames.some(pattern => pattern.test(name))

  // Check for spam symbol patterns
  const hasSpamSymbol = ADVANCED_SPAM_PATTERNS.scamSymbols.some(pattern => pattern.test(symbol))

  // Check for impersonation attempts
  const isImpersonating = ADVANCED_SPAM_PATTERNS.impersonationPatterns.some(({original, variants}) => {
    const nameLower = name.toLowerCase()
    return variants.some(variant => nameLower.includes(variant) && !nameLower.includes(original))
  })

  // Check for suspicious decimal count
  const suspiciousDecimalCounts = [0, 1, 2, 25, 26, 27, 28, 29, 30]
  const hasSuspiciousDecimals = suspiciousDecimalCounts.includes(decimals)

  // Check for promotional content
  const hasPromotionalContent = ADVANCED_SPAM_PATTERNS.maliciousPatterns.some(
    pattern => pattern.test(name) || pattern.test(symbol),
  )

  // Calculate metadata quality score
  let metadataQuality = 100
  if (hasSpamName) metadataQuality -= 30
  if (hasSpamSymbol) metadataQuality -= 20
  if (isImpersonating) metadataQuality -= 25
  if (hasSuspiciousDecimals) metadataQuality -= 10
  if (hasPromotionalContent) metadataQuality -= 15
  if (name.length < 2 || name.length > 50) metadataQuality -= 10
  if (symbol.length < 2 || symbol.length > 10) metadataQuality -= 10

  return {
    hasSpamName,
    hasSpamSymbol,
    isImpersonating,
    hasSuspiciousDecimals,
    hasPromotionalContent,
    metadataQuality: Math.max(0, metadataQuality),
  }
}

/**
 * Analyze contract security (simplified version - would need external APIs for full analysis)
 */
async function analyzeContractSecurity(
  _tokenAddress: Address,
  _chainId: SupportedChainId,
  _config: TokenValidationConfig,
): Promise<ContractSecurityResult> {
  // This is a simplified implementation
  // In a real implementation, this would:
  // 1. Check if contract is verified on Etherscan/Polygonscan/Arbiscan
  // 2. Analyze contract bytecode for common patterns
  // 3. Check for proxy patterns
  // 4. Look for mint functions, transfer restrictions
  // 5. Analyze deployer address history
  // 6. Use external APIs like Honeypot.is, GoPlus Security, etc.

  // For now, return conservative defaults
  return {
    isVerified: false, // Would need block explorer API
    isProxy: false, // Would need contract analysis
    hasMintFunction: false, // Would need ABI analysis
    hasTransferRestrictions: false, // Would need transaction simulation
    buyTax: undefined, // Would need DEX analysis
    sellTax: undefined, // Would need DEX analysis
    isHoneypot: false, // Would need external honeypot detection API
    deployerRisk: 'medium', // Would need deployer history analysis
  }
}

/**
 * Quick security check for token addresses
 * Provides fast risk assessment without full validation
 */
export function quickSecurityCheck(
  tokenAddress: Address,
  chainId: SupportedChainId,
  tokenData?: {name?: string; symbol?: string; decimals?: number},
): {
  riskLevel: TokenSecurityRisk
  reason: string
  trusted: boolean
} {
  // Check verified list first
  if (TOKEN_SECURITY_LISTS.verified[chainId]?.includes(tokenAddress)) {
    return {
      riskLevel: TokenSecurityRisk.VERIFIED,
      reason: 'Token is on verified safe list',
      trusted: true,
    }
  }

  // Check blacklist
  if (TOKEN_SECURITY_LISTS.blacklisted[chainId]?.includes(tokenAddress)) {
    return {
      riskLevel: TokenSecurityRisk.CRITICAL,
      reason: 'Token is on security blacklist',
      trusted: false,
    }
  }

  // Check risky list
  if (TOKEN_SECURITY_LISTS.risky[chainId]?.includes(tokenAddress)) {
    return {
      riskLevel: TokenSecurityRisk.HIGH,
      reason: 'Token has known security concerns',
      trusted: false,
    }
  }

  // Basic metadata checks if available
  if (tokenData != null) {
    const {name = '', symbol = '', decimals = 18} = tokenData

    // Check for obvious spam patterns
    const hasSpamIndicators =
      ADVANCED_SPAM_PATTERNS.scamNames.some(pattern => pattern.test(name)) ||
      ADVANCED_SPAM_PATTERNS.scamSymbols.some(pattern => pattern.test(symbol)) ||
      [0, 1, 2, 25, 26, 27, 28, 29, 30].includes(decimals)

    if (hasSpamIndicators) {
      return {
        riskLevel: TokenSecurityRisk.HIGH,
        reason: 'Token metadata matches spam patterns',
        trusted: false,
      }
    }
  }

  return {
    riskLevel: TokenSecurityRisk.MEDIUM,
    reason: 'Unknown token - exercise caution',
    trusted: false,
  }
}

/**
 * Check if a token should be filtered out based on security settings
 */
export function shouldFilterToken(
  validation: TokenSecurityValidation,
  userRiskTolerance: TokenSecurityRisk = TokenSecurityRisk.MEDIUM,
): boolean {
  const riskLevels = {
    [TokenSecurityRisk.VERIFIED]: 0,
    [TokenSecurityRisk.LOW]: 1,
    [TokenSecurityRisk.MEDIUM]: 2,
    [TokenSecurityRisk.HIGH]: 3,
    [TokenSecurityRisk.CRITICAL]: 4,
  }

  const tokenRisk = riskLevels[validation.riskLevel]
  const maxAcceptableRisk = riskLevels[userRiskTolerance]

  return tokenRisk > maxAcceptableRisk
}

/**
 * Get user-friendly risk description
 */
export function getRiskDescription(riskLevel: TokenSecurityRisk): string {
  switch (riskLevel) {
    case TokenSecurityRisk.VERIFIED:
      return 'Verified and safe to interact with'
    case TokenSecurityRisk.LOW:
      return 'Generally safe with minimal risk factors'
    case TokenSecurityRisk.MEDIUM:
      return 'Some risk factors present - exercise caution'
    case TokenSecurityRisk.HIGH:
      return 'Multiple risk factors - high caution advised'
    case TokenSecurityRisk.CRITICAL:
      return 'Dangerous - do not interact'
    default:
      return 'Unknown risk level'
  }
}

/**
 * Get security recommendation based on risk level
 */
export function getSecurityRecommendation(riskLevel: TokenSecurityRisk): string {
  switch (riskLevel) {
    case TokenSecurityRisk.VERIFIED:
      return 'Safe to interact with normal precautions'
    case TokenSecurityRisk.LOW:
      return 'Generally safe, verify token details before large transactions'
    case TokenSecurityRisk.MEDIUM:
      return 'Research token thoroughly before interacting'
    case TokenSecurityRisk.HIGH:
      return 'Only interact if you fully understand the risks'
    case TokenSecurityRisk.CRITICAL:
      return 'Do not interact with this token'
    default:
      return 'Unknown risk - exercise extreme caution'
  }
}
