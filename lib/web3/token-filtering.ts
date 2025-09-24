import type {Address} from 'viem'

import type {SupportedChainId} from '../../hooks/use-wallet'
import type {DiscoveredToken} from './token-discovery'
import type {EnhancedTokenMetadata} from './token-metadata'
import {TokenRiskScore} from './token-metadata'

/**
 * Token categorization for disposal workflow
 */
export enum TokenCategory {
  VALUABLE = 'valuable', // Tokens user wants to keep
  UNWANTED = 'unwanted', // Tokens user wants to dispose of
  UNKNOWN = 'unknown', // Uncategorized tokens
  DUST = 'dust', // Tokens with negligible value
  SPAM = 'spam', // Suspected spam/scam tokens
}

/**
 * Token value classification based on various factors
 */
export enum TokenValueClass {
  HIGH_VALUE = 'high_value', // Significant USD value (>$100)
  MEDIUM_VALUE = 'medium_value', // Moderate USD value ($10-$100)
  LOW_VALUE = 'low_value', // Small USD value ($1-$10)
  MICRO_VALUE = 'micro_value', // Tiny USD value ($0.01-$1)
  DUST = 'dust', // Negligible value (<$0.01)
  UNKNOWN = 'unknown', // Value cannot be determined
}

/**
 * Comprehensive token information combining discovery, metadata, and balance data
 */
export interface CategorizedToken {
  /** Basic token information */
  address: Address
  chainId: SupportedChainId
  symbol: string
  name: string
  decimals: number

  /** Balance information */
  balance: bigint
  formattedBalance: string

  /** Enhanced metadata (when available) */
  metadata?: EnhancedTokenMetadata

  /** Token categorization */
  category: TokenCategory
  valueClass: TokenValueClass

  /** Risk and spam assessment */
  riskScore: TokenRiskScore
  spamScore: number // 0-100, higher = more likely spam
  isVerified: boolean

  /** Value estimation */
  estimatedValueUSD?: number
  priceUSD?: number
  marketCapUSD?: number

  /** User preferences */
  isUserFavorite?: boolean
  userNotes?: string
  lastCategorizedAt?: number

  /** Analysis metadata */
  analysisTimestamp: number
  confidenceScore: number // 0-100, confidence in categorization
}

/**
 * Token filtering criteria
 */
export interface TokenFilter {
  /** Categories to include */
  categories?: TokenCategory[]
  /** Value classes to include */
  valueClasses?: TokenValueClass[]
  /** Minimum USD value */
  minValueUSD?: number
  /** Maximum USD value */
  maxValueUSD?: number
  /** Minimum balance (in token units) */
  minBalance?: number
  /** Maximum balance (in token units) */
  maxBalance?: number
  /** Risk score filter */
  maxRiskScore?: TokenRiskScore
  /** Maximum spam score (0-100) */
  maxSpamScore?: number
  /** Only verified tokens */
  onlyVerified?: boolean
  /** Only user favorites */
  onlyFavorites?: boolean
  /** Include/exclude tokens with unknown values */
  includeUnknownValue?: boolean
  /** Chain IDs to include */
  chainIds?: SupportedChainId[]
  /** Text search in name/symbol */
  searchQuery?: string
}

/**
 * Token sorting options
 */
export interface TokenSortOptions {
  /** Sort field */
  field: 'balance' | 'value' | 'name' | 'symbol' | 'category' | 'riskScore' | 'lastCategorized'
  /** Sort direction */
  direction: 'asc' | 'desc'
  /** Secondary sort (for ties) */
  secondary?: Pick<TokenSortOptions, 'field' | 'direction'>
}

/**
 * User preferences for token categorization
 */
export interface TokenCategorizationPreferences {
  /** Auto-categorization settings */
  autoCategorizationEnabled: boolean

  /** Value thresholds for auto-categorization */
  valueThresholds: {
    highValue: number // USD value for high-value classification
    mediumValue: number // USD value for medium-value classification
    lowValue: number // USD value for low-value classification
    dustThreshold: number // USD value below which tokens are considered dust
  }

  /** Spam detection settings */
  spamDetection: {
    enabled: boolean
    aggressiveness: 'low' | 'medium' | 'high'
    autoMarkAsSpam: boolean
    spamScoreThreshold: number // 0-100
  }

  /** Risk tolerance settings */
  riskTolerance: {
    maxRiskScore: TokenRiskScore
    requireVerification: boolean
    hideHighRiskTokens: boolean
  }

  /** Display preferences */
  defaultView: {
    categories: TokenCategory[]
    sortBy: TokenSortOptions
    showDustTokens: boolean
    showZeroBalance: boolean
  }

  /** User manual categorizations */
  manualCategorizations: Record<
    string,
    {
      category: TokenCategory
      timestamp: number
      notes?: string
    }
  >

  /** User favorites */
  favoriteTokens: Set<string> // token addresses (with chain prefix)

  /** Hidden tokens */
  hiddenTokens: Set<string> // token addresses (with chain prefix)
}

/**
 * Token filtering and categorization configuration
 */
export interface TokenFilteringConfig {
  /** Auto-categorization enabled */
  enableAutoCategorization?: boolean
  /** Spam detection enabled */
  enableSpamDetection?: boolean
  /** Include market data for value calculation */
  includeMarketData?: boolean
  /** Cache duration for categorization results (ms) */
  cacheDuration?: number
  /** Batch size for processing tokens */
  batchSize?: number
}

/**
 * Result of token filtering operation
 */
export interface TokenFilteringResult {
  /** Filtered and categorized tokens */
  tokens: CategorizedToken[]
  /** Total tokens before filtering */
  totalTokens: number
  /** Tokens after filtering */
  filteredTokens: number
  /** Categorization statistics */
  categoryStats: Record<TokenCategory, number>
  /** Value classification statistics */
  valueStats: Record<TokenValueClass, number>
  /** Total estimated portfolio value */
  totalValueUSD: number
  /** Processing errors */
  errors: TokenFilteringError[]
}

/**
 * Error information for token filtering operations
 */
export interface TokenFilteringError {
  tokenAddress: Address
  chainId: SupportedChainId
  operation: 'categorization' | 'value_estimation' | 'spam_detection' | 'filtering'
  error: string
  timestamp: number
}

/**
 * Default configuration for token filtering
 */
export const DEFAULT_FILTERING_CONFIG: Required<TokenFilteringConfig> = {
  enableAutoCategorization: true,
  enableSpamDetection: true,
  includeMarketData: false, // Privacy-first default
  cacheDuration: 5 * 60 * 1000, // 5 minutes
  batchSize: 50,
}

/**
 * Default user preferences for token categorization
 */
export const DEFAULT_CATEGORIZATION_PREFERENCES: TokenCategorizationPreferences = {
  autoCategorizationEnabled: true,

  valueThresholds: {
    highValue: 100, // $100+
    mediumValue: 10, // $10-$100
    lowValue: 1, // $1-$10
    dustThreshold: 0.01, // <$0.01
  },

  spamDetection: {
    enabled: true,
    aggressiveness: 'medium',
    autoMarkAsSpam: false, // Let user decide
    spamScoreThreshold: 70,
  },

  riskTolerance: {
    maxRiskScore: TokenRiskScore.MEDIUM,
    requireVerification: false,
    hideHighRiskTokens: false,
  },

  defaultView: {
    categories: [TokenCategory.VALUABLE, TokenCategory.UNKNOWN],
    sortBy: {
      field: 'value',
      direction: 'desc',
      secondary: {field: 'balance', direction: 'desc'},
    },
    showDustTokens: false,
    showZeroBalance: false,
  },

  manualCategorizations: {},
  favoriteTokens: new Set(),
  hiddenTokens: new Set(),
}

/**
 * Known spam/scam patterns for token detection
 */
export const SPAM_PATTERNS = {
  /** Common spam token name patterns */
  namePatterns: [
    /free.*claim/i,
    /visit.*to.*claim/i,
    /^\d+\$?\s*(?:usdt|usdc|eth|btc|usd)/i,
    /reward|bonus|prize/i,
    /airdrop/i,
    /\b(?:www|http|\.com|\.org)\b/i,
  ],

  /** Suspicious symbol patterns */
  symbolPatterns: [/^\d+$/, /\$\d+/, /^(visit|claim|free|bonus)$/i],

  /** High-risk decimal counts (unusual for legitimate tokens) */
  suspiciousDecimals: [0, 1, 2, 25, 26, 27, 28, 29, 30],
}

/**
 * Well-known valuable token addresses for quick classification
 */
export const KNOWN_VALUABLE_TOKENS: Record<SupportedChainId, Set<Address>> = {
  // Ethereum Mainnet
  1: new Set([
    '0xA0b86a33E6441E5d8CE6a65f7AEF4eDe18f23e94', // USDC
    '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI
    '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
    '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // WBTC
    '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
    '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', // UNI
    '0x514910771AF9Ca656af840dff83E8264EcF986CA', // LINK
    '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0', // MATIC
  ] as Address[]),

  // Polygon
  137: new Set([
    '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // USDC
    '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', // DAI
    '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', // USDT
    '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', // WETH
    '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', // WMATIC
  ] as Address[]),

  // Arbitrum
  42161: new Set([
    '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8', // USDC
    '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', // DAI
    '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', // USDT
    '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f', // WBTC
    '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', // WETH
  ] as Address[]),
}

/**
 * Create a unique identifier for a token (address + chain)
 */
export function createTokenId(address: Address, chainId: SupportedChainId): string {
  return `${chainId}:${address.toLowerCase()}`
}

/**
 * Parse a token ID back into address and chain ID
 */
export function parseTokenId(tokenId: string): {address: Address; chainId: SupportedChainId} {
  const [chainIdStr, address] = tokenId.split(':')
  return {
    address: address as Address,
    chainId: Number.parseInt(chainIdStr, 10) as SupportedChainId,
  }
}

/**
 * Calculate spam score for a token based on various heuristics
 */
export function calculateSpamScore(token: {
  name: string
  symbol: string
  decimals: number
  balance: bigint
  isVerified?: boolean
  riskScore?: TokenRiskScore
}): number {
  let spamScore = 0

  // Check name patterns
  for (const pattern of SPAM_PATTERNS.namePatterns) {
    if (pattern.test(token.name)) {
      spamScore += 25
      break
    }
  }

  // Check symbol patterns
  for (const pattern of SPAM_PATTERNS.symbolPatterns) {
    if (pattern.test(token.symbol)) {
      spamScore += 20
      break
    }
  }

  // Check suspicious decimals
  if (SPAM_PATTERNS.suspiciousDecimals.includes(token.decimals)) {
    spamScore += 15
  }

  // Check if unverified
  if (token.isVerified === false) {
    spamScore += 10
  }

  // Check risk score
  if (token.riskScore === TokenRiskScore.HIGH) {
    spamScore += 30
  } else if (token.riskScore === TokenRiskScore.MEDIUM) {
    spamScore += 15
  }

  // Huge balance can indicate spam airdrop
  if (token.balance > BigInt('999999999999999999999999')) {
    spamScore += 20
  }

  return Math.min(spamScore, 100)
}

/**
 * Determine value class based on USD value
 */
export function determineValueClass(
  valueUSD: number | undefined,
  preferences: TokenCategorizationPreferences,
): TokenValueClass {
  if (valueUSD === undefined) {
    return TokenValueClass.UNKNOWN
  }

  const {valueThresholds} = preferences

  if (valueUSD >= valueThresholds.highValue) {
    return TokenValueClass.HIGH_VALUE
  }
  if (valueUSD >= valueThresholds.mediumValue) {
    return TokenValueClass.MEDIUM_VALUE
  }
  if (valueUSD >= valueThresholds.lowValue) {
    return TokenValueClass.LOW_VALUE
  }
  if (valueUSD >= valueThresholds.dustThreshold) {
    return TokenValueClass.MICRO_VALUE
  }

  return TokenValueClass.DUST
}

/**
 * Auto-categorize a token based on its properties and user preferences
 */
export function autoCategorizeToken(
  token: CategorizedToken,
  preferences: TokenCategorizationPreferences,
): TokenCategory {
  const tokenId = createTokenId(token.address, token.chainId)

  // Check manual categorizations first
  const manualCategory = preferences.manualCategorizations[tokenId]
  if (manualCategory !== undefined) {
    return manualCategory.category
  }

  // Check if token is hidden
  if (preferences.hiddenTokens.has(tokenId)) {
    return TokenCategory.UNWANTED
  }

  // Check if token is a favorite
  if (preferences.favoriteTokens.has(tokenId)) {
    return TokenCategory.VALUABLE
  }

  // Check spam score
  if (preferences.spamDetection.enabled && token.spamScore >= preferences.spamDetection.spamScoreThreshold) {
    return TokenCategory.SPAM
  }

  // Check for dust
  if (token.valueClass === TokenValueClass.DUST) {
    return TokenCategory.DUST
  }

  // Check known valuable tokens
  const knownValuable = KNOWN_VALUABLE_TOKENS[token.chainId]
  if (knownValuable?.has(token.address)) {
    return TokenCategory.VALUABLE
  }

  // Check risk score
  if (token.riskScore === TokenRiskScore.HIGH) {
    return TokenCategory.UNWANTED
  }

  // Check value thresholds
  if (token.valueClass === TokenValueClass.HIGH_VALUE || token.valueClass === TokenValueClass.MEDIUM_VALUE) {
    return TokenCategory.VALUABLE
  }

  // Default to unknown for manual review
  return TokenCategory.UNKNOWN
}

/**
 * Process and categorize a single token
 */
export function categorizeToken(
  discoveredToken: DiscoveredToken,
  metadata: EnhancedTokenMetadata | undefined,
  preferences: TokenCategorizationPreferences,
  config: TokenFilteringConfig = {},
): CategorizedToken {
  const mergedConfig = {...DEFAULT_FILTERING_CONFIG, ...config}

  // Extract risk score and verification status
  const riskScore = metadata?.riskScore ?? TokenRiskScore.UNKNOWN
  const isVerified = metadata?.isVerified ?? false

  // Calculate spam score
  const spamScore = mergedConfig.enableSpamDetection
    ? calculateSpamScore({
        name: discoveredToken.name,
        symbol: discoveredToken.symbol,
        decimals: discoveredToken.decimals,
        balance: discoveredToken.balance,
        isVerified,
        riskScore,
      })
    : 0

  // Estimate USD value
  const priceUSD = metadata?.priceUSD
  const balanceNumber = Number.parseFloat(discoveredToken.formattedBalance)
  const estimatedValueUSD =
    typeof priceUSD === 'number' && !Number.isNaN(balanceNumber) ? priceUSD * balanceNumber : undefined

  // Determine value class
  const valueClass = determineValueClass(estimatedValueUSD, preferences)

  // Create categorized token
  const categorizedToken: CategorizedToken = {
    address: discoveredToken.address,
    chainId: discoveredToken.chainId,
    symbol: discoveredToken.symbol,
    name: discoveredToken.name,
    decimals: discoveredToken.decimals,
    balance: discoveredToken.balance,
    formattedBalance: discoveredToken.formattedBalance,
    metadata,
    category: TokenCategory.UNKNOWN, // Will be set below
    valueClass,
    riskScore,
    spamScore,
    isVerified,
    estimatedValueUSD,
    priceUSD: metadata?.priceUSD,
    marketCapUSD: metadata?.marketCapUSD,
    analysisTimestamp: Date.now(),
    confidenceScore: calculateConfidenceScore(discoveredToken, metadata, spamScore),
  }

  // Auto-categorize if enabled
  if (mergedConfig.enableAutoCategorization && preferences.autoCategorizationEnabled) {
    categorizedToken.category = autoCategorizeToken(categorizedToken, preferences)
  }

  return categorizedToken
}

/**
 * Calculate confidence score for categorization (0-100)
 */
function calculateConfidenceScore(
  token: DiscoveredToken,
  metadata: EnhancedTokenMetadata | undefined,
  spamScore: number,
): number {
  let confidence = 30 // Base confidence

  // More metadata = higher confidence
  if (metadata) {
    confidence += 20
    if (metadata.description !== undefined && metadata.description.trim() !== '') confidence += 10
    if (metadata.logoURI !== undefined && metadata.logoURI.trim() !== '') confidence += 5
    if (metadata.website !== undefined && metadata.website.trim() !== '') confidence += 5
    if (typeof metadata.priceUSD === 'number' && metadata.priceUSD > 0) confidence += 15
    if (metadata.isVerified) confidence += 15
  }

  // Clear spam indicators increase confidence
  if (spamScore > 70) {
    confidence += 10
  }

  // Well-known token addresses increase confidence
  const knownTokens = KNOWN_VALUABLE_TOKENS[token.chainId]
  if (knownTokens?.has(token.address)) {
    confidence += 20
  }

  return Math.min(confidence, 100)
}

/**
 * Filter tokens based on criteria
 */
export function filterTokens(tokens: CategorizedToken[], filter: TokenFilter): CategorizedToken[] {
  return tokens.filter(token => {
    // Category filter
    if (filter.categories && !filter.categories.includes(token.category)) {
      return false
    }

    // Value class filter
    if (filter.valueClasses && !filter.valueClasses.includes(token.valueClass)) {
      return false
    }

    // USD value filters
    if (filter.minValueUSD !== undefined && (token.estimatedValueUSD ?? 0) < filter.minValueUSD) {
      return false
    }
    if (filter.maxValueUSD !== undefined && (token.estimatedValueUSD ?? 0) > filter.maxValueUSD) {
      return false
    }

    // Balance filters
    const balanceNumber = Number.parseFloat(token.formattedBalance)
    if (filter.minBalance !== undefined && balanceNumber < filter.minBalance) {
      return false
    }
    if (filter.maxBalance !== undefined && balanceNumber > filter.maxBalance) {
      return false
    }

    // Risk score filter
    if (filter.maxRiskScore !== undefined) {
      const riskScores = [
        TokenRiskScore.VERIFIED,
        TokenRiskScore.LOW,
        TokenRiskScore.MEDIUM,
        TokenRiskScore.HIGH,
        TokenRiskScore.UNKNOWN,
      ]
      const tokenRiskIndex = riskScores.indexOf(token.riskScore)
      const maxRiskIndex = riskScores.indexOf(filter.maxRiskScore)
      if (tokenRiskIndex > maxRiskIndex) {
        return false
      }
    }

    // Spam score filter
    if (filter.maxSpamScore !== undefined && token.spamScore > filter.maxSpamScore) {
      return false
    }

    // Verification filter
    if (filter.onlyVerified && !token.isVerified) {
      return false
    }

    // Favorites filter
    if (filter.onlyFavorites && !token.isUserFavorite) {
      return false
    }

    // Unknown value filter
    if (filter.includeUnknownValue === false && token.estimatedValueUSD === undefined) {
      return false
    }

    // Chain filter
    if (filter.chainIds && !filter.chainIds.includes(token.chainId)) {
      return false
    }

    // Search query filter
    if (filter.searchQuery !== undefined && filter.searchQuery.trim() !== '') {
      const query = filter.searchQuery.toLowerCase()
      const searchableText = `${token.name} ${token.symbol} ${token.address}`.toLowerCase()
      if (!searchableText.includes(query)) {
        return false
      }
    }

    return true
  })
}

/**
 * Sort tokens based on options
 */
export function sortTokens(tokens: CategorizedToken[], sortOptions: TokenSortOptions): CategorizedToken[] {
  return [...tokens].sort((a, b) => {
    const compareResult = compareTokens(a, b, sortOptions.field, sortOptions.direction)

    // If primary sort is equal and secondary sort is defined, use secondary
    if (compareResult === 0 && sortOptions.secondary) {
      return compareTokens(a, b, sortOptions.secondary.field, sortOptions.secondary.direction)
    }

    return compareResult
  })
}

/**
 * Compare two tokens for sorting
 */
function compareTokens(
  a: CategorizedToken,
  b: CategorizedToken,
  field: TokenSortOptions['field'],
  direction: 'asc' | 'desc',
): number {
  const multiplier = direction === 'asc' ? 1 : -1

  switch (field) {
    case 'balance': {
      const aBalance = Number.parseFloat(a.formattedBalance)
      const bBalance = Number.parseFloat(b.formattedBalance)
      return (aBalance - bBalance) * multiplier
    }
    case 'value': {
      const aValue = a.estimatedValueUSD ?? 0
      const bValue = b.estimatedValueUSD ?? 0
      return (aValue - bValue) * multiplier
    }
    case 'name':
      return a.name.localeCompare(b.name) * multiplier
    case 'symbol':
      return a.symbol.localeCompare(b.symbol) * multiplier
    case 'category':
      return a.category.localeCompare(b.category) * multiplier
    case 'riskScore': {
      const riskOrder = [
        TokenRiskScore.VERIFIED,
        TokenRiskScore.LOW,
        TokenRiskScore.MEDIUM,
        TokenRiskScore.HIGH,
        TokenRiskScore.UNKNOWN,
      ]
      const aIndex = riskOrder.indexOf(a.riskScore)
      const bIndex = riskOrder.indexOf(b.riskScore)
      return (aIndex - bIndex) * multiplier
    }
    case 'lastCategorized': {
      const aTime = a.lastCategorizedAt ?? 0
      const bTime = b.lastCategorizedAt ?? 0
      return (aTime - bTime) * multiplier
    }
    default:
      return 0
  }
}

/**
 * Calculate statistics for a collection of tokens
 */
export function calculateTokenStats(tokens: CategorizedToken[]): {
  categoryStats: Record<TokenCategory, number>
  valueStats: Record<TokenValueClass, number>
  totalValueUSD: number
  totalTokens: number
} {
  const categoryStats = Object.values(TokenCategory).reduce(
    (acc, category) => ({...acc, [category]: 0}),
    {} as Record<TokenCategory, number>,
  )

  const valueStats = Object.values(TokenValueClass).reduce(
    (acc, valueClass) => ({...acc, [valueClass]: 0}),
    {} as Record<TokenValueClass, number>,
  )

  let totalValueUSD = 0

  for (const token of tokens) {
    categoryStats[token.category]++
    valueStats[token.valueClass]++
    totalValueUSD += token.estimatedValueUSD ?? 0
  }

  return {
    categoryStats,
    valueStats,
    totalValueUSD,
    totalTokens: tokens.length,
  }
}
