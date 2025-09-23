import type {Config} from 'wagmi'
import type {SupportedChainId} from '../../hooks/use-wallet'
import {erc20Abi, formatUnits, type Address} from 'viem'
import {getBalance, readContracts} from 'wagmi/actions'

/**
 * Token balance information structure
 */
export interface TokenBalance {
  /** Token contract address */
  address: Address
  /** User's raw balance (in wei-like units) */
  balance: bigint
  /** Formatted balance for display */
  formattedBalance: string
  /** Token decimals used for formatting */
  decimals: number
  /** Chain ID where this balance exists */
  chainId: SupportedChainId
  /** Timestamp when balance was fetched */
  lastUpdated: number
}

/**
 * Native token balance information
 */
export interface NativeBalance {
  /** Native token balance (ETH, MATIC, etc.) */
  balance: bigint
  /** Formatted balance for display */
  formattedBalance: string
  /** Chain ID where this balance exists */
  chainId: SupportedChainId
  /** Native token symbol (ETH, MATIC, etc.) */
  symbol: string
  /** Timestamp when balance was fetched */
  lastUpdated: number
}

/**
 * Balance checking configuration options
 */
export interface BalanceCheckConfig {
  /** Enable batch processing for multiple tokens */
  enableBatching?: boolean
  /** Batch size for RPC calls */
  batchSize?: number
  /** Include native token balance */
  includeNative?: boolean
  /** Force fresh data (bypass cache) */
  bypassCache?: boolean
}

/**
 * Result of balance checking operation
 */
export interface BalanceCheckResult {
  /** Token balances */
  tokenBalances: TokenBalance[]
  /** Native token balance (if requested) */
  nativeBalance?: NativeBalance
  /** Errors encountered during balance checking */
  errors: BalanceCheckError[]
  /** Number of successful balance checks */
  successfulChecks: number
  /** Total number of attempted checks */
  totalChecks: number
  /** Timestamp when check was performed */
  timestamp: number
}

/**
 * Error that occurred during balance checking
 */
export interface BalanceCheckError {
  /** Type of error */
  type: 'TOKEN_BALANCE_FAILED' | 'NATIVE_BALANCE_FAILED' | 'NETWORK_ERROR' | 'RATE_LIMITED' | 'UNKNOWN_ERROR'
  /** Token address (if applicable) */
  tokenAddress?: Address
  /** Chain ID where error occurred */
  chainId: SupportedChainId
  /** Error message */
  message: string
  /** Original error object */
  originalError?: unknown
  /** Timestamp when error occurred */
  timestamp: number
}

/**
 * Default configuration for balance checking
 */
export const DEFAULT_BALANCE_CONFIG: Required<BalanceCheckConfig> = {
  enableBatching: true,
  batchSize: 20,
  includeNative: true,
  bypassCache: false,
} as const

/**
 * Native token symbols by chain
 */
const NATIVE_SYMBOLS: Record<SupportedChainId, string> = {
  1: 'ETH', // Ethereum Mainnet
  137: 'MATIC', // Polygon
  42161: 'ETH', // Arbitrum One
} as const

/**
 * Check balance for a single ERC-20 token
 *
 * @param config Wagmi configuration
 * @param userAddress User's wallet address
 * @param tokenAddress Token contract address
 * @param chainId Chain ID where the token exists
 * @param decimals Token decimals (optional - will be fetched if not provided)
 * @returns Promise resolving to token balance information
 */
export async function checkTokenBalance(
  config: Config,
  userAddress: Address,
  tokenAddress: Address,
  chainId: SupportedChainId,
  decimals?: number,
): Promise<TokenBalance> {
  try {
    const timestamp = Date.now()

    // If decimals provided, only fetch balance
    if (decimals !== undefined) {
      const balanceResult = await readContracts(config, {
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

      const balance = balanceResult[0]?.result
      if (typeof balance !== 'bigint') {
        console.error(`Failed to get balance for token ${tokenAddress} on chain ${chainId}: Invalid balance type`)
        throw new Error(`Failed to check token balance for ${tokenAddress} on chain ${chainId}: Invalid balance result`)
      }

      return {
        address: tokenAddress,
        balance,
        formattedBalance: formatUnits(balance, decimals),
        decimals,
        chainId,
        lastUpdated: timestamp,
      }
    }

    // Fetch both balance and decimals
    const results = await readContracts(config, {
      contracts: [
        {
          address: tokenAddress,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [userAddress],
          chainId,
        },
        {
          address: tokenAddress,
          abi: erc20Abi,
          functionName: 'decimals',
          args: [],
          chainId,
        },
      ],
    })

    const balance = results[0]?.result
    const tokenDecimals = (results[1]?.result as number) ?? 18

    if (typeof balance !== 'bigint') {
      console.error(`Failed to get balance for token ${tokenAddress} on chain ${chainId}: Invalid balance type`)
      throw new Error(`Failed to check token balance for ${tokenAddress} on chain ${chainId}: Invalid balance result`)
    }

    return {
      address: tokenAddress,
      balance,
      formattedBalance: formatUnits(balance, tokenDecimals),
      decimals: tokenDecimals,
      chainId,
      lastUpdated: timestamp,
    }
  } catch (error) {
    console.error(`Failed to check token balance for ${tokenAddress} on chain ${chainId}:`, error)
    throw new Error(`Failed to check token balance for ${tokenAddress} on chain ${chainId}: ${String(error)}`)
  }
}

/**
 * Check native token balance (ETH, MATIC, etc.)
 *
 * @param config Wagmi configuration
 * @param userAddress User's wallet address
 * @param chainId Chain ID where to check the balance
 * @returns Promise resolving to native token balance information
 */
export async function checkNativeBalance(
  config: Config,
  userAddress: Address,
  chainId: SupportedChainId,
): Promise<NativeBalance> {
  try {
    const timestamp = Date.now()

    const balance = await getBalance(config, {
      address: userAddress,
      chainId,
    })

    return {
      balance: balance.value,
      formattedBalance: formatUnits(balance.value, balance.decimals),
      chainId,
      symbol: NATIVE_SYMBOLS[chainId],
      lastUpdated: timestamp,
    }
  } catch (error) {
    console.error(`Failed to check native balance on chain ${chainId}:`, error)
    throw new Error(`Failed to check native balance on chain ${chainId}: ${String(error)}`)
  }
}

/**
 * Check balances for multiple tokens in batches
 *
 * @param config Wagmi configuration
 * @param userAddress User's wallet address
 * @param tokens Array of tokens to check with optional decimals
 * @param chainId Chain ID where tokens exist
 * @param options Configuration options for batch processing
 * @returns Promise resolving to array of token balances
 */
export async function checkMultipleTokenBalances(
  config: Config,
  userAddress: Address,
  tokens: {address: Address; decimals?: number}[],
  chainId: SupportedChainId,
  options: BalanceCheckConfig = {},
): Promise<TokenBalance[]> {
  const mergedOptions = {...DEFAULT_BALANCE_CONFIG, ...options}
  const results: TokenBalance[] = []

  if (!mergedOptions.enableBatching) {
    // Sequential processing
    for (const token of tokens) {
      try {
        const balance = await checkTokenBalance(config, userAddress, token.address, chainId, token.decimals)
        results.push(balance)
      } catch (error) {
        console.error(`Failed to check balance for token ${token.address}:`, error)
        // Continue with other tokens instead of failing completely
      }
    }
    return results
  }

  // Batch processing
  const batches = []
  for (let i = 0; i < tokens.length; i += mergedOptions.batchSize) {
    batches.push(tokens.slice(i, i + mergedOptions.batchSize))
  }

  for (const batch of batches) {
    try {
      const contracts = batch.flatMap(token => [
        {
          address: token.address,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [userAddress],
          chainId,
        },
        ...(token.decimals === undefined
          ? [
              {
                address: token.address,
                abi: erc20Abi,
                functionName: 'decimals',
                args: [],
                chainId,
              },
            ]
          : []),
      ])

      const contractResults = await readContracts(config, {contracts})
      const timestamp = Date.now()

      let resultIndex = 0
      for (const token of batch) {
        try {
          const balanceResult = contractResults[resultIndex]?.result
          resultIndex++

          if (typeof balanceResult !== 'bigint') {
            console.error(`Invalid balance result for token ${token.address}`)
            continue
          }

          let decimals = token.decimals
          if (decimals === undefined) {
            const decimalsResult = contractResults[resultIndex]?.result
            decimals = (typeof decimalsResult === 'number' ? decimalsResult : undefined) ?? 18
            resultIndex++
          }

          results.push({
            address: token.address,
            balance: balanceResult,
            formattedBalance: formatUnits(balanceResult, decimals),
            decimals,
            chainId,
            lastUpdated: timestamp,
          })
        } catch (error) {
          console.error(`Failed to process batch result for token ${token.address}:`, error)
          // Continue with next token instead of failing the whole batch
        }
      }
    } catch (error) {
      console.error(
        `Batch request failed for tokens:`,
        batch.map(t => t.address),
        error,
      )
      // Continue with next batch instead of failing completely
    }
  }

  return results
}

/**
 * Check all balances (tokens + native) for a user across a single chain
 *
 * @param config Wagmi configuration
 * @param userAddress User's wallet address
 * @param tokens Array of tokens to check with optional decimals
 * @param chainId Chain ID where tokens exist
 * @param options Configuration options for balance checking
 * @returns Promise resolving to comprehensive balance check results
 */
export async function checkAllBalances(
  config: Config,
  userAddress: Address,
  tokens: {address: Address; decimals?: number}[],
  chainId: SupportedChainId,
  options: BalanceCheckConfig = {},
): Promise<BalanceCheckResult> {
  const mergedOptions = {...DEFAULT_BALANCE_CONFIG, ...options}
  const errors: BalanceCheckError[] = []
  const timestamp = Date.now()

  // Check token balances
  let tokenBalances: TokenBalance[] = []
  try {
    tokenBalances = await checkMultipleTokenBalances(config, userAddress, tokens, chainId, options)
  } catch (error) {
    console.error('Token balance check failed:', error)
    errors.push({
      type: 'NETWORK_ERROR',
      chainId,
      message: error instanceof Error ? error.message : 'Token balance check failed',
      originalError: error,
      timestamp: Date.now(),
    })
  }

  // Check native balance if requested
  let nativeBalance: NativeBalance | undefined
  if (mergedOptions.includeNative) {
    try {
      nativeBalance = await checkNativeBalance(config, userAddress, chainId)
    } catch (error) {
      console.error('Native balance check failed:', error)
      errors.push({
        type: 'NATIVE_BALANCE_FAILED',
        chainId,
        message: error instanceof Error ? error.message : 'Native balance check failed',
        originalError: error,
        timestamp: Date.now(),
      })
    }
  }

  const totalChecks = tokens.length + (mergedOptions.includeNative ? 1 : 0)
  const successfulChecks = tokenBalances.length + (nativeBalance ? 1 : 0)

  return {
    tokenBalances,
    nativeBalance,
    errors,
    successfulChecks,
    totalChecks,
    timestamp,
  }
}

/**
 * Check token balances across multiple chains for a single user
 *
 * @param config Wagmi configuration
 * @param userAddress User's wallet address
 * @param tokensByChain Record mapping chain IDs to arrays of tokens to check
 * @param options Configuration options for balance checking
 * @returns Promise resolving to cross-chain balance check results by chain ID
 */
export async function checkCrossChainBalances(
  config: Config,
  userAddress: Address,
  tokensByChain: Record<SupportedChainId, {address: Address; decimals?: number}[]>,
  options: BalanceCheckConfig = {},
): Promise<Record<SupportedChainId, BalanceCheckResult>> {
  const results: Record<SupportedChainId, BalanceCheckResult> = {} as Record<SupportedChainId, BalanceCheckResult>

  // Process chains in parallel for better performance
  const chainPromises = Object.entries(tokensByChain).map(async ([chainIdStr, tokens]) => {
    const chainId = Number(chainIdStr) as SupportedChainId
    try {
      const result = await checkAllBalances(config, userAddress, tokens, chainId, options)
      return {chainId, result}
    } catch (error) {
      console.error(`Cross-chain balance check failed for chain ${chainId}:`, error)
      const errorResult: BalanceCheckResult = {
        tokenBalances: [],
        nativeBalance: undefined,
        errors: [
          {
            type: 'NETWORK_ERROR',
            chainId,
            message: error instanceof Error ? error.message : 'Chain balance check failed',
            originalError: error,
            timestamp: Date.now(),
          },
        ],
        successfulChecks: 0,
        totalChecks: tokens.length + (options.includeNative === true ? 1 : 0),
        timestamp: Date.now(),
      }
      return {chainId, result: errorResult}
    }
  })

  const chainResults = await Promise.allSettled(chainPromises)

  for (const chainResult of chainResults) {
    if (chainResult.status === 'fulfilled') {
      results[chainResult.value.chainId] = chainResult.value.result
    } else {
      console.error('Failed to process chain balance result:', chainResult.reason)
    }
  }

  return results
}
