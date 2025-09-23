import type {Address} from 'viem'
import type {Config} from 'wagmi'
import type {SupportedChainId} from '../../hooks/use-wallet'
import {erc20Abi} from 'viem'

import {readContracts} from 'wagmi/actions'

/**
 * Token information structure for discovered tokens
 */
export interface DiscoveredToken {
  /** Token contract address */
  address: Address
  /** Token symbol (e.g., "USDC", "DAI") */
  symbol: string
  /** Token name (e.g., "USD Coin", "Dai Stablecoin") */
  name: string
  /** Number of decimal places */
  decimals: number
  /** User's balance of this token (in wei-like units) */
  balance: bigint
  /** Chain ID where this token exists */
  chainId: SupportedChainId
  /** Formatted balance for display */
  formattedBalance: string
}

/**
 * Token discovery configuration options
 */
export interface TokenDiscoveryConfig {
  /** Chains to scan for tokens */
  chainIds: SupportedChainId[]
  /** Maximum number of tokens to discover per chain */
  maxTokensPerChain?: number
  /** Minimum balance threshold (in wei) to include token */
  minBalanceThreshold?: bigint
  /** Enable batch processing for better performance */
  enableBatching?: boolean
  /** Batch size for RPC calls */
  batchSize?: number
}

/**
 * Result of token discovery operation
 */
export interface TokenDiscoveryResult {
  /** Successfully discovered tokens */
  tokens: DiscoveredToken[]
  /** Errors encountered during discovery */
  errors: TokenDiscoveryError[]
  /** Total number of chains scanned */
  chainsScanned: number
  /** Total number of token contracts checked */
  contractsChecked: number
}

/**
 * Error information for failed token discovery operations
 */
export interface TokenDiscoveryError {
  /** Chain ID where error occurred */
  chainId: SupportedChainId
  /** Token contract address that failed */
  tokenAddress?: Address
  /** Error message */
  message: string
  /** Original error object */
  originalError?: Error
  /** Error type for categorization */
  type: 'RPC_ERROR' | 'CONTRACT_ERROR' | 'VALIDATION_ERROR' | 'UNKNOWN_ERROR'
}

/**
 * Default configuration for token discovery
 */
export const DEFAULT_TOKEN_DISCOVERY_CONFIG: Required<Omit<TokenDiscoveryConfig, 'chainIds'>> = {
  maxTokensPerChain: 100,
  minBalanceThreshold: BigInt(0), // Include all tokens with any balance
  enableBatching: true,
  batchSize: 20,
}

/**
 * Common ERC-20 token addresses for each supported chain
 * These are well-known tokens that users commonly hold
 */
export const COMMON_TOKEN_ADDRESSES: Record<SupportedChainId, Address[]> = {
  // Ethereum Mainnet
  1: [
    '0xA0b86a33E6441E5d8CE6a65f7AEF4eDe18f23e94', // USDC
    '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI
    '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
    '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // WBTC
    '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
    '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0', // MATIC
    '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE', // SHIB
    '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', // UNI
    '0x514910771AF9Ca656af840dff83E8264EcF986CA', // LINK
    '0x6982508145454Ce325dDbE47a25d4ec3d2311933', // PEPE
  ],
  // Polygon
  137: [
    '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // USDC
    '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', // DAI
    '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', // USDT
    '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6', // WBTC
    '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', // WETH
    '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', // WMATIC
    '0xb33EaAd8d922B1083446DC23f610c2567fB5180f', // UNI
    '0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39', // LINK
    '0x831753DD7087CaC61aB5644b308642cc1c33Dc13', // QUICK
    '0xD6DF932A45C0f255f85145f286eA0b292B21C90B', // AAVE
  ],
  // Arbitrum One
  42161: [
    '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8', // USDC.e
    '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC
    '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', // DAI
    '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', // USDT
    '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f', // WBTC
    '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', // WETH
    '0xfa7F8980b0f1E64A2062791cc3b0871572f1F7f0', // UNI
    '0xf97f4df75117a78c1A5a0DBb814Af92458539FB4', // LINK
    '0x11cDb42B0EB46D95f990BeDD4695A6e3fA034978', // CRV
    '0x912CE59144191C1204E64559FE8253a0e49E6548', // ARB
  ],
}

/**
 * Fetch token metadata for a specific token on a specific chain
 */
export async function fetchTokenMetadata(
  config: Config,
  tokenAddress: Address,
  chainId: SupportedChainId,
): Promise<{name: string; symbol: string; decimals: number} | null> {
  try {
    const results = await readContracts(config, {
      allowFailure: false,
      contracts: [
        {
          address: tokenAddress,
          abi: erc20Abi,
          functionName: 'name',
          chainId,
        },
        {
          address: tokenAddress,
          abi: erc20Abi,
          functionName: 'symbol',
          chainId,
        },
        {
          address: tokenAddress,
          abi: erc20Abi,
          functionName: 'decimals',
          chainId,
        },
      ],
    })

    return {
      name: results[0],
      symbol: results[1],
      decimals: results[2],
    }
  } catch (error) {
    console.error(`Failed to fetch metadata for token ${tokenAddress} on chain ${chainId}:`, error)
    return null
  }
}

/**
 * Fetch token balance for a specific user address
 */
export async function fetchTokenBalance(
  config: Config,
  tokenAddress: Address,
  userAddress: Address,
  chainId: SupportedChainId,
): Promise<bigint | null> {
  try {
    const result = await readContracts(config, {
      allowFailure: false,
      contracts: [
        {
          address: tokenAddress,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [userAddress],
          chainId,
        },
      ],
    })

    return result[0]
  } catch (error) {
    console.error(
      `Failed to fetch balance for token ${tokenAddress} and user ${userAddress} on chain ${chainId}:`,
      error,
    )
    return null
  }
}

/**
 * Format token balance for display
 */
export function formatTokenBalance(balance: bigint, decimals: number, maxDisplayDecimals = 6): string {
  if (balance === BigInt(0)) return '0'

  try {
    // Convert to decimal string
    const divisor = BigInt(10 ** decimals)
    const whole = balance / divisor
    const remainder = balance % divisor

    if (remainder === BigInt(0)) {
      return whole.toString()
    }

    // Handle fractional part
    const fractionalStr = remainder.toString().padStart(decimals, '0')
    const trimmedFractional = fractionalStr.replace(/0+$/, '')

    if (trimmedFractional === '') {
      return whole.toString()
    }

    // Limit display decimals
    const displayFractional = trimmedFractional.slice(0, Math.min(trimmedFractional.length, maxDisplayDecimals))
    return `${whole}.${displayFractional}`
  } catch (error) {
    console.error('Failed to format token balance:', error)
    return '0'
  }
}

/**
 * Discover tokens for a specific user across multiple chains
 */
export async function discoverUserTokens(
  config: Config,
  userAddress: Address,
  discoveryConfig: TokenDiscoveryConfig,
): Promise<TokenDiscoveryResult> {
  const mergedConfig = {...DEFAULT_TOKEN_DISCOVERY_CONFIG, ...discoveryConfig}
  const tokens: DiscoveredToken[] = []
  const errors: TokenDiscoveryError[] = []
  let contractsChecked = 0

  // Process each chain
  for (const chainId of mergedConfig.chainIds) {
    try {
      const chainTokens = await discoverChainTokens(config, userAddress, chainId, mergedConfig)
      tokens.push(...chainTokens.tokens)
      errors.push(...chainTokens.errors)
      contractsChecked += chainTokens.contractsChecked
    } catch (error) {
      errors.push({
        chainId,
        message: `Failed to scan chain ${chainId}`,
        originalError: error instanceof Error ? error : new Error(String(error)),
        type: 'RPC_ERROR',
      })
    }
  }

  return {
    tokens,
    errors,
    chainsScanned: mergedConfig.chainIds.length,
    contractsChecked,
  }
}

/**
 * Discover tokens on a specific chain for a user
 */
async function discoverChainTokens(
  config: Config,
  userAddress: Address,
  chainId: SupportedChainId,
  discoveryConfig: Required<Omit<TokenDiscoveryConfig, 'chainIds'>>,
): Promise<{tokens: DiscoveredToken[]; errors: TokenDiscoveryError[]; contractsChecked: number}> {
  const tokens: DiscoveredToken[] = []
  const errors: TokenDiscoveryError[] = []
  const tokenAddresses = COMMON_TOKEN_ADDRESSES[chainId]
  let contractsChecked = 0

  // Limit the number of tokens to check based on configuration
  const tokensToCheck = tokenAddresses.slice(0, discoveryConfig.maxTokensPerChain)

  if (discoveryConfig.enableBatching) {
    // Process tokens in batches for better performance
    for (let i = 0; i < tokensToCheck.length; i += discoveryConfig.batchSize) {
      const batch = tokensToCheck.slice(i, i + discoveryConfig.batchSize)
      const batchResults = await processBatch(config, userAddress, chainId, batch, discoveryConfig)
      tokens.push(...batchResults.tokens)
      errors.push(...batchResults.errors)
      contractsChecked += batch.length
    }
  } else {
    // Process tokens individually
    for (const tokenAddress of tokensToCheck) {
      try {
        const token = await processToken(config, userAddress, chainId, tokenAddress, discoveryConfig)
        if (token) {
          tokens.push(token)
        }
        contractsChecked++
      } catch (error) {
        errors.push({
          chainId,
          tokenAddress,
          message: `Failed to process token ${tokenAddress}`,
          originalError: error instanceof Error ? error : new Error(String(error)),
          type: 'CONTRACT_ERROR',
        })
        contractsChecked++
      }
    }
  }

  return {tokens, errors, contractsChecked}
}

/**
 * Process a batch of tokens for efficiency
 */
async function processBatch(
  config: Config,
  userAddress: Address,
  chainId: SupportedChainId,
  tokenAddresses: Address[],
  discoveryConfig: Required<Omit<TokenDiscoveryConfig, 'chainIds'>>,
): Promise<{tokens: DiscoveredToken[]; errors: TokenDiscoveryError[]}> {
  const tokens: DiscoveredToken[] = []
  const errors: TokenDiscoveryError[] = []

  try {
    // Create batch contract calls for metadata and balances
    const metadataContracts = tokenAddresses.flatMap(address => [
      {address, abi: erc20Abi, functionName: 'name' as const, chainId},
      {address, abi: erc20Abi, functionName: 'symbol' as const, chainId},
      {address, abi: erc20Abi, functionName: 'decimals' as const, chainId},
    ])

    const balanceContracts = tokenAddresses.map(address => ({
      address,
      abi: erc20Abi,
      functionName: 'balanceOf' as const,
      args: [userAddress],
      chainId,
    }))

    // Execute batch calls
    const [metadataResults, balanceResults] = await Promise.all([
      readContracts(config, {allowFailure: true, contracts: metadataContracts}),
      readContracts(config, {allowFailure: true, contracts: balanceContracts}),
    ])

    // Process results
    for (const [i, tokenAddress] of tokenAddresses.entries()) {
      const metadataIndex = i * 3
      const balanceIndex = i

      try {
        const nameResult = metadataResults[metadataIndex]
        const symbolResult = metadataResults[metadataIndex + 1]
        const decimalsResult = metadataResults[metadataIndex + 2]
        const balanceResult = balanceResults[balanceIndex]

        // Check if all results are successful
        if (
          nameResult.status === 'success' &&
          symbolResult.status === 'success' &&
          decimalsResult.status === 'success' &&
          balanceResult.status === 'success'
        ) {
          const balance = balanceResult.result
          const decimals = decimalsResult.result as number

          // Apply minimum balance threshold
          if (balance >= discoveryConfig.minBalanceThreshold) {
            tokens.push({
              address: tokenAddress,
              name: nameResult.result as string,
              symbol: symbolResult.result as string,
              decimals,
              balance,
              chainId,
              formattedBalance: formatTokenBalance(balance, decimals),
            })
          }
        } else {
          // Log which specific call failed
          const failedCalls = []
          if (nameResult.status === 'failure') failedCalls.push('name')
          if (symbolResult.status === 'failure') failedCalls.push('symbol')
          if (decimalsResult.status === 'failure') failedCalls.push('decimals')
          if (balanceResult.status === 'failure') failedCalls.push('balance')

          errors.push({
            chainId,
            tokenAddress,
            message: `Failed to fetch ${failedCalls.join(', ')} for token ${tokenAddress}`,
            type: 'CONTRACT_ERROR',
          })
        }
      } catch (error) {
        errors.push({
          chainId,
          tokenAddress,
          message: `Error processing token ${tokenAddress} in batch`,
          originalError: error instanceof Error ? error : new Error(String(error)),
          type: 'CONTRACT_ERROR',
        })
      }
    }
  } catch (error) {
    // If batch operation fails entirely, fall back to individual processing
    errors.push({
      chainId,
      message: 'Batch processing failed, consider reducing batch size',
      originalError: error instanceof Error ? error : new Error(String(error)),
      type: 'RPC_ERROR',
    })
  }

  return {tokens, errors}
}

/**
 * Process a single token
 */
async function processToken(
  config: Config,
  userAddress: Address,
  chainId: SupportedChainId,
  tokenAddress: Address,
  discoveryConfig: Required<Omit<TokenDiscoveryConfig, 'chainIds'>>,
): Promise<DiscoveredToken | null> {
  // Fetch token metadata and balance
  const [metadata, balance] = await Promise.all([
    fetchTokenMetadata(config, tokenAddress, chainId),
    fetchTokenBalance(config, tokenAddress, userAddress, chainId),
  ])

  if (!metadata || balance === null) {
    return null
  }

  // Apply minimum balance threshold
  if (balance < discoveryConfig.minBalanceThreshold) {
    return null
  }

  return {
    address: tokenAddress,
    name: metadata.name,
    symbol: metadata.symbol,
    decimals: metadata.decimals,
    balance,
    chainId,
    formattedBalance: formatTokenBalance(balance, metadata.decimals),
  }
}

/**
 * Filter discovered tokens based on criteria
 */
export function filterTokens(
  tokens: DiscoveredToken[],
  filters: {
    minBalance?: bigint
    maxBalance?: bigint
    chains?: SupportedChainId[]
    symbols?: string[]
    excludeSymbols?: string[]
  },
): DiscoveredToken[] {
  return tokens.filter(token => {
    // Balance filters
    if (filters.minBalance !== undefined && token.balance < filters.minBalance) {
      return false
    }
    if (filters.maxBalance !== undefined && token.balance > filters.maxBalance) {
      return false
    }

    // Chain filter
    if (filters.chains && !filters.chains.includes(token.chainId)) {
      return false
    }

    // Symbol filters
    if (filters.symbols && !filters.symbols.includes(token.symbol)) {
      return false
    }
    if (filters.excludeSymbols && filters.excludeSymbols.includes(token.symbol)) {
      return false
    }

    return true
  })
}

/**
 * Sort discovered tokens by various criteria
 */
export function sortTokens(
  tokens: DiscoveredToken[],
  sortBy: 'symbol' | 'name' | 'balance' | 'chain',
  direction: 'asc' | 'desc' = 'asc',
): DiscoveredToken[] {
  const sorted = [...tokens].sort((a, b) => {
    let comparison = 0

    switch (sortBy) {
      case 'symbol':
        comparison = a.symbol.localeCompare(b.symbol)
        break
      case 'name':
        comparison = a.name.localeCompare(b.name)
        break
      case 'balance':
        comparison = a.balance < b.balance ? -1 : a.balance > b.balance ? 1 : 0
        break
      case 'chain':
        comparison = a.chainId - b.chainId
        break
    }

    return direction === 'desc' ? -comparison : comparison
  })

  return sorted
}
