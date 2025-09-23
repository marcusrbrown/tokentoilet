import type {Address} from 'viem'
import type {Config} from 'wagmi'

import type {SupportedChainId} from '../../hooks/use-wallet'

import {fetchTokenMetadata as fetchBasicMetadata} from './token-discovery'

/**
 * Token list format (Uniswap token list standard)
 */
interface TokenListEntry {
  address: string
  chainId: number
  name: string
  symbol: string
  decimals: number
  logoURI?: string
  description?: string
  website?: string
  tags?: string[]
  extensions?: {
    twitter?: string
    telegram?: string
    discord?: string
    [key: string]: unknown
  }
}

interface TokenList {
  name: string
  version: {
    major: number
    minor: number
    patch: number
  }
  tokens: TokenListEntry[]
}

/**
 * Enhanced token metadata structure with multiple data sources
 */
export interface EnhancedTokenMetadata {
  // Basic ERC-20 metadata (on-chain)
  address: Address
  chainId: SupportedChainId
  name: string
  symbol: string
  decimals: number

  // Extended metadata (external sources)
  description?: string
  logoURI?: string
  website?: string
  twitter?: string
  telegram?: string
  discord?: string

  // Market data (when available)
  priceUSD?: number
  marketCapUSD?: number
  volume24hUSD?: number
  priceChange24h?: number

  // Validation and risk assessment
  isVerified?: boolean
  riskScore?: TokenRiskScore
  tags?: string[]

  // Metadata source tracking
  sources: MetadataSource[]
  lastUpdated: number
  cacheKey: string
}

/**
 * Token risk assessment levels
 */
export enum TokenRiskScore {
  VERIFIED = 'verified', // Well-known, verified token
  LOW = 'low', // Token with good reputation
  MEDIUM = 'medium', // Unknown token, exercise caution
  HIGH = 'high', // Potential scam or suspicious token
  UNKNOWN = 'unknown', // Risk assessment unavailable
}

/**
 * Metadata source information for tracking data provenance
 */
export interface MetadataSource {
  source: 'onchain' | 'tokenlist' | 'coingecko' | 'fallback'
  priority: number
  timestamp: number
  fields: string[]
  error?: string
}

/**
 * Configuration for metadata fetching
 */
export interface TokenMetadataConfig {
  /** Enable on-chain metadata fetching */
  enableOnChain?: boolean
  /** Enable token list metadata */
  enableTokenLists?: boolean
  /** Enable external API metadata */
  enableExternalAPIs?: boolean
  /** Timeout for metadata requests in milliseconds */
  timeout?: number
  /** Include market data in metadata */
  includeMarketData?: boolean
  /** Include risk assessment */
  includeRiskAssessment?: boolean
}

/**
 * Error information for metadata fetching failures
 */
export interface MetadataFetchError {
  source: string
  tokenAddress: Address
  chainId: SupportedChainId
  error: string
  timestamp: number
}

/**
 * Result of metadata fetching operation
 */
export interface MetadataFetchResult {
  metadata: EnhancedTokenMetadata | null
  errors: MetadataFetchError[]
  cacheHit: boolean
  totalSources: number
  successfulSources: number
}

/**
 * Default configuration for metadata fetching
 */
export const DEFAULT_METADATA_CONFIG: Required<TokenMetadataConfig> = {
  enableOnChain: true,
  enableTokenLists: true,
  enableExternalAPIs: false, // Disabled by default to avoid API dependencies
  timeout: 10_000, // 10 seconds
  includeMarketData: false, // Disabled by default for privacy
  includeRiskAssessment: true,
}

/**
 * Known token lists for metadata fallback
 */
export const KNOWN_TOKEN_LISTS: Record<SupportedChainId, string[]> = {
  // Ethereum Mainnet
  1: [
    'https://tokens.uniswap.org', // Uniswap default list
    'https://tokenlist.aave.eth.limo', // Aave token list
    'https://tokens.1inch.io', // 1inch token list
  ],
  // Polygon
  137: ['https://unpkg.com/quickswap-default-token-list@1.2.28/build/quickswap-default.tokenlist.json'],
  // Arbitrum
  42161: ['https://tokenlist.arbitrum.io/ArbTokenLists/arbed_arb_whitelist_era.json'],
}

/**
 * Chain names for external API calls
 */
export const CHAIN_NAMES: Record<SupportedChainId, string> = {
  1: 'ethereum',
  137: 'polygon-pos',
  42161: 'arbitrum-one',
}

/**
 * Fetch comprehensive token metadata from multiple sources with fallback strategies
 */
export async function fetchEnhancedTokenMetadata(
  config: Config,
  tokenAddress: Address,
  chainId: SupportedChainId,
  metadataConfig: TokenMetadataConfig = {},
): Promise<MetadataFetchResult> {
  const mergedConfig = {...DEFAULT_METADATA_CONFIG, ...metadataConfig}
  const errors: MetadataFetchError[] = []
  const sources: MetadataSource[] = []
  let metadata: EnhancedTokenMetadata | null = null

  const cacheKey = generateCacheKey(tokenAddress, chainId)
  const timestamp = Date.now()

  try {
    // Primary source: On-chain ERC-20 metadata
    if (mergedConfig.enableOnChain) {
      const onChainMetadata = await fetchOnChainMetadata(config, tokenAddress, chainId)
      if (onChainMetadata) {
        metadata = {
          address: tokenAddress,
          chainId,
          ...onChainMetadata,
          sources: [],
          lastUpdated: timestamp,
          cacheKey,
        }

        sources.push({
          source: 'onchain',
          priority: 1,
          timestamp,
          fields: ['name', 'symbol', 'decimals'],
        })
      } else {
        errors.push({
          source: 'onchain',
          tokenAddress,
          chainId,
          error: 'Failed to fetch on-chain metadata',
          timestamp,
        })
      }
    }

    // Secondary source: Token Lists metadata
    if (mergedConfig.enableTokenLists && metadata) {
      try {
        const tokenListData = await fetchTokenListMetadata(tokenAddress, chainId)
        if (tokenListData) {
          metadata = mergeMetadata(metadata, tokenListData)
          sources.push({
            source: 'tokenlist',
            priority: 2,
            timestamp,
            fields: ['description', 'logoURI', 'website', 'tags'],
          })
        }
      } catch (error) {
        errors.push({
          source: 'tokenlist',
          tokenAddress,
          chainId,
          error: error instanceof Error ? error.message : 'Token list fetch failed',
          timestamp,
        })
      }
    }

    // Tertiary source: External APIs (optional)
    if (mergedConfig.enableExternalAPIs && metadata) {
      try {
        const externalData = await fetchExternalAPIMetadata(tokenAddress, chainId, mergedConfig)
        if (externalData) {
          metadata = mergeMetadata(metadata, externalData)
          sources.push({
            source: 'coingecko',
            priority: 3,
            timestamp,
            fields: ['priceUSD', 'marketCapUSD', 'description'],
          })
        }
      } catch (error) {
        errors.push({
          source: 'coingecko',
          tokenAddress,
          chainId,
          error: error instanceof Error ? error.message : 'External API fetch failed',
          timestamp,
        })
      }
    }

    // Risk assessment
    if (metadata && mergedConfig.includeRiskAssessment) {
      metadata.riskScore = assessTokenRisk(metadata, sources)
    }

    if (metadata) {
      metadata.sources = sources
    }

    return {
      metadata,
      errors,
      cacheHit: false,
      totalSources: sources.length,
      successfulSources: sources.filter(s => s.error === undefined).length,
    }
  } catch (error) {
    errors.push({
      source: 'metadata-system',
      tokenAddress,
      chainId,
      error: error instanceof Error ? error.message : 'Metadata system error',
      timestamp,
    })

    return {
      metadata: null,
      errors,
      cacheHit: false,
      totalSources: 0,
      successfulSources: 0,
    }
  }
}

/**
 * Fetch basic on-chain metadata (name, symbol, decimals)
 */
async function fetchOnChainMetadata(
  config: Config,
  tokenAddress: Address,
  chainId: SupportedChainId,
): Promise<{name: string; symbol: string; decimals: number} | null> {
  try {
    return await fetchBasicMetadata(config, tokenAddress, chainId)
  } catch (error) {
    console.error(`On-chain metadata fetch failed for ${tokenAddress}:`, error)
    return null
  }
}

/**
 * Type guard to validate token list structure
 */
function isValidTokenList(obj: unknown): obj is TokenList {
  if (typeof obj !== 'object' || obj === null) {
    return false
  }

  const tokenList = obj as Record<string, unknown>

  return (
    typeof tokenList.name === 'string' &&
    typeof tokenList.version === 'object' &&
    tokenList.version !== null &&
    Array.isArray(tokenList.tokens) &&
    tokenList.tokens.every(
      (token: unknown) =>
        typeof token === 'object' &&
        token !== null &&
        typeof (token as Record<string, unknown>).address === 'string' &&
        typeof (token as Record<string, unknown>).chainId === 'number',
    )
  )
}

/**
 * Fetch metadata from token lists (Uniswap format)
 */
async function fetchTokenListMetadata(
  tokenAddress: Address,
  chainId: SupportedChainId,
): Promise<Partial<EnhancedTokenMetadata> | null> {
  const tokenLists = KNOWN_TOKEN_LISTS[chainId]
  if (tokenLists === undefined) {
    return null
  }

  for (const listUrl of tokenLists) {
    try {
      const response = await fetch(listUrl, {
        headers: {Accept: 'application/json'},
        signal: AbortSignal.timeout(5000), // 5 second timeout
      })

      if (!response.ok) continue

      const tokenList = (await response.json()) as unknown

      // Type guard to validate token list structure
      if (!isValidTokenList(tokenList)) {
        continue
      }

      // Find token in the list
      const token = tokenList.tokens.find(
        t => t.address.toLowerCase() === tokenAddress.toLowerCase() && t.chainId === chainId,
      )

      if (token !== undefined) {
        return {
          description: token.description,
          logoURI: token.logoURI,
          website: token.website,
          twitter: token.extensions?.twitter,
          telegram: token.extensions?.telegram,
          discord: token.extensions?.discord,
          tags: token.tags || [],
          isVerified: true, // Tokens in curated lists are considered verified
        }
      }
    } catch (error) {
      // Continue to next token list on error
      console.warn(`Failed to fetch from token list ${listUrl}:`, error)
    }
  }

  return null
}

/**
 * Fetch metadata from external APIs (placeholder for CoinGecko, etc.)
 */
async function fetchExternalAPIMetadata(
  _tokenAddress: Address,
  _chainId: SupportedChainId,
  _config: Required<TokenMetadataConfig>,
): Promise<Partial<EnhancedTokenMetadata> | null> {
  // This is a placeholder for external API integration
  // In a production environment, you would integrate with services like:
  // - CoinGecko API for price and market data
  // - Moralis API for extended metadata
  // - Custom backend services

  // For now, return null to indicate external APIs are not implemented
  // This maintains the fallback strategy without external dependencies
  return null
}

/**
 * Merge metadata from multiple sources, prioritizing higher-priority sources
 */
function mergeMetadata(base: EnhancedTokenMetadata, additional: Partial<EnhancedTokenMetadata>): EnhancedTokenMetadata {
  return {
    ...base,
    ...additional,
    // Preserve base properties that should not be overwritten
    address: base.address,
    chainId: base.chainId,
    sources: base.sources,
    lastUpdated: base.lastUpdated,
    cacheKey: base.cacheKey,
  }
}

/**
 * Assess token risk based on available metadata and sources
 */
function assessTokenRisk(metadata: EnhancedTokenMetadata, sources: MetadataSource[]): TokenRiskScore {
  // Simple risk assessment algorithm
  let riskScore = TokenRiskScore.UNKNOWN

  // Check if token is verified through token lists
  if (metadata.isVerified) {
    riskScore = TokenRiskScore.VERIFIED
  } else if (sources.some(s => s.source === 'tokenlist')) {
    riskScore = TokenRiskScore.LOW
  } else if (sources.some(s => s.source === 'onchain' && s.fields.includes('name'))) {
    // Has basic on-chain metadata
    riskScore = TokenRiskScore.MEDIUM
  } else {
    riskScore = TokenRiskScore.HIGH
  }

  // Additional risk factors could include:
  // - Token age (newer tokens = higher risk)
  // - Market cap and liquidity
  // - Number of holders
  // - Known scam patterns in name/symbol

  return riskScore
}

/**
 * Generate cache key for metadata
 */
function generateCacheKey(tokenAddress: Address, chainId: SupportedChainId): string {
  return `metadata:${chainId}:${tokenAddress.toLowerCase()}`
}

/**
 * Batch fetch metadata for multiple tokens
 */
export async function fetchBatchTokenMetadata(
  config: Config,
  tokens: {address: Address; chainId: SupportedChainId}[],
  metadataConfig: TokenMetadataConfig = {},
): Promise<MetadataFetchResult[]> {
  const results = await Promise.allSettled(
    tokens.map(async token => fetchEnhancedTokenMetadata(config, token.address, token.chainId, metadataConfig)),
  )

  return results.map(result => {
    if (result.status === 'fulfilled') {
      return result.value
    } else {
      const reason = result.reason as Error | undefined
      return {
        metadata: null,
        errors: [
          {
            source: 'batch-system',
            tokenAddress: '0x0' as Address,
            chainId: 1,
            error: reason?.message ?? 'Batch fetch failed',
            timestamp: Date.now(),
          },
        ],
        cacheHit: false,
        totalSources: 0,
        successfulSources: 0,
      }
    }
  })
}

/**
 * Validate metadata completeness and quality
 */
export function validateTokenMetadata(metadata: EnhancedTokenMetadata): {
  isValid: boolean
  completeness: number
  warnings: string[]
} {
  const warnings: string[] = []
  let completeness = 0
  const totalFields = 10 // Adjust based on expected fields

  // Check required fields
  if (metadata.name && metadata.symbol && metadata.decimals !== undefined) {
    completeness += 3
  } else {
    warnings.push('Missing required ERC-20 metadata')
  }

  // Check optional fields
  if (metadata.description !== undefined && metadata.description.length > 0) completeness += 1
  if (metadata.logoURI !== undefined && metadata.logoURI.length > 0) completeness += 1
  if (metadata.website !== undefined && metadata.website.length > 0) completeness += 1
  if (metadata.isVerified !== undefined) completeness += 1
  if (metadata.riskScore !== undefined) completeness += 1
  if (metadata.tags !== undefined && metadata.tags.length > 0) completeness += 1
  if (metadata.sources.length > 0) completeness += 1

  // Quality checks
  if (metadata.logoURI === undefined || metadata.logoURI.length === 0) {
    warnings.push('Missing token logo')
  }

  if (metadata.description === undefined || metadata.description.length === 0) {
    warnings.push('Missing token description')
  }

  if (metadata.riskScore === TokenRiskScore.HIGH) {
    warnings.push('High risk token detected')
  }

  if (metadata.sources.length === 0) {
    warnings.push('No metadata sources available')
  }

  const isValid = warnings.length === 0 && completeness >= 3 // At least basic metadata

  return {
    isValid,
    completeness: Math.round((completeness / totalFields) * 100),
    warnings,
  }
}

/**
 * Filter tokens by metadata quality and risk
 */
export function filterTokensByMetadataQuality(
  tokens: EnhancedTokenMetadata[],
  options: {
    minCompleteness?: number
    maxRiskScore?: TokenRiskScore
    requireVerification?: boolean
    requireLogo?: boolean
  } = {},
): EnhancedTokenMetadata[] {
  const {
    minCompleteness = 30,
    maxRiskScore = TokenRiskScore.HIGH,
    requireVerification = false,
    requireLogo = false,
  } = options

  return tokens.filter(token => {
    const validation = validateTokenMetadata(token)

    // Check completeness
    if (validation.completeness < minCompleteness) {
      return false
    }

    // Check risk score
    const riskLevels = [TokenRiskScore.VERIFIED, TokenRiskScore.LOW, TokenRiskScore.MEDIUM, TokenRiskScore.HIGH]
    const tokenRiskLevel = riskLevels.indexOf(token.riskScore ?? TokenRiskScore.UNKNOWN)
    const maxRiskLevel = riskLevels.indexOf(maxRiskScore)

    if (tokenRiskLevel > maxRiskLevel) {
      return false
    }

    // Check verification requirement
    if (requireVerification && !token.isVerified) {
      return false
    }

    // Check logo requirement
    if (requireLogo && (token.logoURI === undefined || token.logoURI.length === 0)) {
      return false
    }

    return true
  })
}
