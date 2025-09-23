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

      const balance = balanceResult[0].result as bigint

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

    const balance = results[0].result as bigint
    const tokenDecimals = (results[1].result as number) ?? 18

    return {
      address: tokenAddress,
      balance,
      formattedBalance: formatUnits(balance, tokenDecimals),
      decimals: tokenDecimals,
      chainId,
      lastUpdated: timestamp,
    }
  } catch (error) {
    throw new Error(`Failed to check token balance for ${tokenAddress} on chain ${chainId}: ${String(error)}`)
  }
}

/**
 * Check native token balance (ETH, MATIC, etc.)
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
    throw new Error(`Failed to check native balance on chain ${chainId}: ${String(error)}`)
  }
}

/**
 * Check balances for multiple tokens in batches
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
  const errors: BalanceCheckError[] = []

  if (!mergedOptions.enableBatching) {
    // Sequential processing
    for (const token of tokens) {
      try {
        const balance = await checkTokenBalance(config, userAddress, token.address, chainId, token.decimals)
        results.push(balance)
      } catch (error) {
        errors.push({
          type: 'TOKEN_BALANCE_FAILED',
          tokenAddress: token.address,
          chainId,
          message: error instanceof Error ? error.message : 'Unknown error',
          originalError: error,
          timestamp: Date.now(),
        })
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
          const balance = contractResults[resultIndex].result as bigint
          resultIndex++

          let decimals = token.decimals
          if (decimals === undefined) {
            decimals = (contractResults[resultIndex].result as number) ?? 18
            resultIndex++
          }

          results.push({
            address: token.address,
            balance,
            formattedBalance: formatUnits(balance, decimals),
            decimals,
            chainId,
            lastUpdated: timestamp,
          })
        } catch (error) {
          errors.push({
            type: 'TOKEN_BALANCE_FAILED',
            tokenAddress: token.address,
            chainId,
            message: error instanceof Error ? error.message : 'Failed to process batch result',
            originalError: error,
            timestamp: Date.now(),
          })
        }
      }
    } catch (error) {
      // Mark entire batch as failed
      for (const token of batch) {
        errors.push({
          type: 'NETWORK_ERROR',
          tokenAddress: token.address,
          chainId,
          message: error instanceof Error ? error.message : 'Batch request failed',
          originalError: error,
          timestamp: Date.now(),
        })
      }
    }
  }

  return results
}

/**
 * Check all balances (tokens + native) for a user across a single chain
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
 * Check balances across multiple chains
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
    }
  }

  return results
}
