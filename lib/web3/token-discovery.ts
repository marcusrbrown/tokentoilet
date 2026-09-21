/**
 * Token discovery via Alchemy's Token API (browser-direct, viem transport).
 *
 * ## SSR boundary
 * The Alchemy `client.request()` path is client-only. This module must never
 * be imported in server components, route handlers, or any SSR context.
 * Discovery is gated behind the `useTokenDiscovery` hook lifecycle, which
 * runs only on the client.
 *
 * ## `config` argument
 * `discoverUserTokens` retains the `config: Config` (wagmi) first argument for
 * signature stability — the `useTokenDiscovery` hook passes `useConfig()` and
 * changing the public signature would require updating all consumers. The
 * rewrite builds its own per-chain Alchemy `createPublicClient` and does NOT
 * use `config` for enumeration. `config` is kept available for future use
 * (e.g. a Sepolia wagmi-transport fallback path) and to avoid a breaking
 * change to the hook contract. Unit 7 must include a real-path integration
 * test to confirm the client-construction path is exercised.
 */

import type {Address} from 'viem'
import type {Config} from 'wagmi'
import type {SupportedChainId} from '../../hooks/use-wallet'
import {createPublicClient, erc20Abi, http} from 'viem'
import {mainnet, sepolia} from 'viem/chains'
import {readContracts} from 'wagmi/actions'
import {getAlchemyEndpoint, isAlchemyConfigured} from './alchemy-endpoints'
import {fetchAlchemyTokenMetadataBatch, fetchWalletTokenBalances, isAlchemyAuthError} from './alchemy-token-api'
import {sanitizeTokenDisplay} from './display-sanitization'
import {calculateBaseSpamScore, DEFAULT_SPAM_SCORE_THRESHOLD} from './token-spam-heuristics'

// ---------------------------------------------------------------------------
// Chain id → viem chain object map
// ---------------------------------------------------------------------------

/**
 * Maps supported chain IDs to their viem chain objects.
 * Extend this when adding new supported chains.
 */
const CHAIN_MAP: Readonly<
  Record<
    number,
    {
      id: number
      name: string
      nativeCurrency: {decimals: number; name: string; symbol: string}
      rpcUrls: {default: {http: readonly string[]}}
    }
  >
> = {
  [mainnet.id]: mainnet,
  [sepolia.id]: sepolia,
}

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/**
 * Token information structure for discovered tokens
 */
export interface DiscoveredToken {
  /** Token contract address */
  address: Address
  /** Token symbol (e.g., "USDC", "DAI") — sanitized at the discovery boundary */
  symbol: string
  /** Token name (e.g., "USD Coin", "Dai Stablecoin") — sanitized at the discovery boundary */
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
  /**
   * Metadata-fetch page size: how many balance-threshold-passing tokens get
   * metadata fetched and spam-filtered per page while adaptively filling
   * toward `maxTokensPerChain` (#1521, #1560). Floored at `maxTokensPerChain`
   * regardless of the configured value. A wallet whose threshold-passing
   * balances fit in one page issues exactly one metadata batch call, same as
   * before adaptive fill existed.
   */
  metadataFetchBudget?: number
  /**
   * Hard ceiling on total metadata requests per chain across all adaptive
   * pages (#1560). Bounds the fill loop so a wallet flooded with spam can't
   * drive unbounded Alchemy requests from the browser. Floored at
   * `metadataFetchBudget` so at least one page always runs.
   */
  maxMetadataRequests?: number
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
  /**
   * Total number of balances enumerated and metadata-fetched, before spam
   * filtering and the display cap. Field name preserved for contract
   * stability; meaning changed from "contracts polled" to "balances
   * enumerated" by the Alchemy path.
   */
  contractsChecked: number
  /** True when the cap or metadata request ceiling omitted any balance-threshold-passing token, on any chain. */
  truncated: boolean
  /**
   * Count of balance-threshold-passing tokens omitted from `tokens` across
   * all chains — spam-filtered survivors beyond `maxTokensPerChain`, plus
   * tokens never metadata-fetched because the adaptive fill stopped at
   * `maxMetadataRequests` before considering them (status unknown, counted
   * conservatively).
   */
  truncatedTokenCount: number
}

/**
 * Error information for failed token discovery operations
 *
 * Type union is additive — existing `'RPC_ERROR' | 'CONTRACT_ERROR' |
 * 'VALIDATION_ERROR' | 'UNKNOWN_ERROR'` assertions remain valid.
 * New types:
 * - `'AUTH_MISSING'`: Alchemy key absent, invalid, or origin not on allowlist
 *   (HTTP 401/403 or JSON-RPC -32600 auth error) → discovery unavailable,
 *   non-retryable.
 * - `'API_ERROR'`: Per-chain Alchemy scan failed → retryable.
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
  type:
    | 'RPC_ERROR'
    | 'CONTRACT_ERROR'
    | 'VALIDATION_ERROR'
    | 'UNKNOWN_ERROR'
    | 'API_ERROR'
    | 'AUTH_MISSING'
    | 'UNSUPPORTED_CHAIN'
}

// ---------------------------------------------------------------------------
// Default configuration
// ---------------------------------------------------------------------------

/**
 * Default configuration for token discovery
 */
export const DEFAULT_TOKEN_DISCOVERY_CONFIG: Required<Omit<TokenDiscoveryConfig, 'chainIds'>> = {
  maxTokensPerChain: 100,
  metadataFetchBudget: 300, // page size — 3x maxTokensPerChain, absorbs spam ahead of the cap in one page for typical wallets
  maxMetadataRequests: 1000, // hard ceiling — ~3.3 pages; bounds worst-case browser-side Alchemy requests
  minBalanceThreshold: BigInt(0), // Include all tokens with any balance
  enableBatching: true,
  batchSize: 20,
}

// ---------------------------------------------------------------------------
// discoverUserTokens (entry point)
// ---------------------------------------------------------------------------

/**
 * Discover tokens for a specific user across multiple chains via Alchemy.
 *
 * For each chain in `discoveryConfig.chainIds`:
 * 1. Resolve the Alchemy endpoint. If absent (key missing) → push a single
 *    `AUTH_MISSING` error and return empty tokens immediately.
 * 2. Build a per-chain viem public client pointed at the Alchemy endpoint.
 * 3. Enumerate all non-zero ERC-20 balances via `fetchWalletTokenBalances`.
 *    On failure → push `API_ERROR` (explicit, not silent empty).
 * 4. Adaptively fetch metadata in bounded pages via
 *    `fetchAlchemyTokenMetadataBatch`, until enough legitimate tokens are
 *    found, threshold-passing balances are exhausted, or the per-chain
 *    request ceiling is reached (#1560).
 * 5. Map each balance+metadata pair to a `DiscoveredToken`, applying
 *    `sanitizeTokenDisplay()` to name and symbol at this boundary (R7).
 *
 * @param _config - wagmi Config (retained for signature stability; not used
 *   for enumeration — the rewrite builds its own Alchemy clients).
 * @param userAddress - Wallet address to enumerate.
 * @param discoveryConfig - Discovery configuration (chains, thresholds, etc.).
 */
export async function discoverUserTokens(
  _config: Config,
  userAddress: Address,
  discoveryConfig: TokenDiscoveryConfig,
): Promise<TokenDiscoveryResult> {
  // Spread order matters: a caller-supplied `undefined` for an optional field
  // (e.g. a hook merging `{...defaults, ...options}` where `options` explicitly
  // sets `metadataFetchBudget: undefined`) overrides the default at the spread
  // boundary despite TS inferring a non-optional type. Normalize explicitly so
  // downstream Math.max/slice never see NaN or an unbounded array.
  const mergedConfig = {
    ...DEFAULT_TOKEN_DISCOVERY_CONFIG,
    ...discoveryConfig,
    maxTokensPerChain: discoveryConfig.maxTokensPerChain ?? DEFAULT_TOKEN_DISCOVERY_CONFIG.maxTokensPerChain,
    metadataFetchBudget: discoveryConfig.metadataFetchBudget ?? DEFAULT_TOKEN_DISCOVERY_CONFIG.metadataFetchBudget,
    maxMetadataRequests: discoveryConfig.maxMetadataRequests ?? DEFAULT_TOKEN_DISCOVERY_CONFIG.maxMetadataRequests,
  }
  const tokens: DiscoveredToken[] = []
  const errors: TokenDiscoveryError[] = []
  let contractsChecked = 0
  let truncatedTokenCount = 0

  for (const chainId of mergedConfig.chainIds) {
    // Distinguish "key absent" (all chains affected) from "chain unmapped"
    // (only this chain affected) so we can skip unmapped chains without
    // aborting the entire scan.
    if (!isAlchemyConfigured()) {
      errors.push({
        chainId,
        message: 'Alchemy API key absent — token discovery unavailable',
        type: 'AUTH_MISSING',
      })
      // Return immediately: the key is missing for all chains.
      return {
        tokens: [],
        errors,
        chainsScanned: mergedConfig.chainIds.length,
        contractsChecked: 0,
        truncated: false,
        truncatedTokenCount: 0,
      }
    }

    const endpoint = getAlchemyEndpoint(chainId)
    if (endpoint === undefined) {
      // Key is present but this chain is not in ALCHEMY_HOSTS — skip it and
      // continue scanning the remaining chains.
      errors.push({
        chainId,
        message: `Chain ${chainId} is not supported by token discovery`,
        type: 'UNSUPPORTED_CHAIN',
      })
      continue
    }

    const chainResult = await discoverChainTokens(userAddress, chainId, endpoint, mergedConfig)
    tokens.push(...chainResult.tokens)
    errors.push(...chainResult.errors)
    contractsChecked += chainResult.contractsChecked
    truncatedTokenCount += chainResult.truncatedTokenCount
  }

  return {
    tokens,
    errors,
    chainsScanned: mergedConfig.chainIds.length,
    contractsChecked,
    truncated: truncatedTokenCount > 0,
    truncatedTokenCount,
  }
}

// ---------------------------------------------------------------------------
// discoverChainTokens (per-chain enumeration)
// ---------------------------------------------------------------------------

/**
 * Enumerate tokens on a single chain for the given user address.
 *
 * Builds a viem public client from the Alchemy endpoint, calls
 * `fetchWalletTokenBalances` (throws on RPC failure → mapped to API_ERROR),
 * then adaptively fetches metadata via `fetchAlchemyTokenMetadataBatch`
 * (best-effort per token, never throws) in bounded pages until
 * `maxTokensPerChain` legitimate tokens are found, threshold-passing
 * balances run out, or `maxMetadataRequests` is hit (#1560).
 *
 * Sanitizes name and symbol via `sanitizeTokenDisplay` when constructing each
 * `DiscoveredToken` (R7 — discovery-boundary sanitization).
 */
async function discoverChainTokens(
  userAddress: Address,
  chainId: SupportedChainId,
  alchemyEndpoint: string,
  discoveryConfig: Required<Omit<TokenDiscoveryConfig, 'chainIds'>>,
): Promise<{
  tokens: DiscoveredToken[]
  errors: TokenDiscoveryError[]
  contractsChecked: number
  truncatedTokenCount: number
}> {
  const chain = CHAIN_MAP[chainId]
  if (chain === undefined) {
    return {
      tokens: [],
      errors: [
        {
          chainId,
          message: `Chain ${chainId} is not in the supported chain map`,
          type: 'VALIDATION_ERROR',
        },
      ],
      contractsChecked: 0,
      truncatedTokenCount: 0,
    }
  }

  // Build a per-chain viem public client pointed at the Alchemy endpoint.
  // This is what makes the discovery mainnet-ready while staying chain-gated.
  const client = createPublicClient({
    chain,
    transport: http(alchemyEndpoint),
  })

  let balances: Awaited<ReturnType<typeof fetchWalletTokenBalances>>
  try {
    balances = await fetchWalletTokenBalances(client, userAddress)
  } catch (error) {
    // Per-chain scan failure → explicit error, not silent empty (R11).
    console.error(`[token-discovery] fetchWalletTokenBalances failed for chain ${chainId}:`, error)
    // HTTP 401/403 or JSON-RPC -32600 auth errors mean the Alchemy key is
    // invalid or the origin is not on the allowlist. Map to AUTH_MISSING
    // (non-retryable) so the UI shows "configure key" instead of the
    // retryable "Could not scan wallet" state.
    if (isAlchemyAuthError(error)) {
      return {
        tokens: [],
        errors: [
          {
            chainId,
            message: 'Alchemy API key rejected — token discovery unavailable',
            originalError: error instanceof Error ? error : undefined,
            type: 'AUTH_MISSING',
          },
        ],
        contractsChecked: 0,
        truncatedTokenCount: 0,
      }
    }
    return {
      tokens: [],
      errors: [
        {
          chainId,
          message: `Could not scan wallet on chain ${chainId}`,
          originalError: error instanceof Error ? error : new Error(String(error)),
          type: 'API_ERROR',
        },
      ],
      contractsChecked: 0,
      truncatedTokenCount: 0,
    }
  }

  // Apply the configured minimum-balance threshold before capping, preserving
  // the pre-rewrite filtering contract: callers that raise minBalanceThreshold
  // must not see (or be able to select) balances below it. Default is 0n, so
  // default callers keep every non-zero balance.
  const thresholdBalances = balances.filter(b => b.balance >= discoveryConfig.minBalanceThreshold)

  // Adaptive fill (#1560): Alchemy returns balances in pagination order with
  // no ranking, so a legitimate holding past a fixed index would never get
  // metadata under a single fixed-size slice. Instead, fetch metadata in
  // bounded pages and keep going until enough legitimate tokens are found,
  // the threshold-passing balances are exhausted, or the hard ceiling on
  // total metadata requests is reached. A wallet whose threshold-passing set
  // fits in one page behaves exactly as before — one metadata batch call.
  const pageSize = Math.max(discoveryConfig.metadataFetchBudget, discoveryConfig.maxTokensPerChain)
  const requestCeiling = Math.max(discoveryConfig.maxMetadataRequests, pageSize)

  const legitimateTokens: DiscoveredToken[] = []
  let consideredCount = 0

  while (
    consideredCount < thresholdBalances.length &&
    legitimateTokens.length < discoveryConfig.maxTokensPerChain &&
    consideredCount < requestCeiling
  ) {
    const pageEnd = Math.min(consideredCount + pageSize, thresholdBalances.length, requestCeiling)
    const page = thresholdBalances.slice(consideredCount, pageEnd)
    consideredCount = pageEnd

    // Fetch metadata for this page (best-effort, never throws).
    const addresses = page.map(b => b.contractAddress)
    const metadataMap = await fetchAlchemyTokenMetadataBatch(client, addresses)

    // Map balance + metadata → DiscoveredToken, applying sanitization at this
    // boundary so all downstream render sites (list, disposal, approval)
    // receive already-sanitized name/symbol values (R7). Spam filtering runs
    // per page — before the display cap — so junk tokens don't consume slots
    // real holdings need. Shares heuristics and threshold with
    // token-filtering.ts's SPAM category.
    for (const entry of page) {
      const meta = metadataMap.get(entry.contractAddress)
      const rawName = meta?.name ?? ''
      const rawSymbol = meta?.symbol ?? 'UNKNOWN'
      const decimals = meta?.decimals ?? 18

      const candidate: DiscoveredToken = {
        address: entry.contractAddress,
        name: sanitizeTokenDisplay(rawName),
        symbol: sanitizeTokenDisplay(rawSymbol),
        decimals,
        balance: entry.balance,
        chainId,
        formattedBalance: formatTokenBalance(entry.balance, decimals),
      }

      if (calculateBaseSpamScore(candidate) < DEFAULT_SPAM_SCORE_THRESHOLD) {
        legitimateTokens.push(candidate)
      }
    }
  }

  const tokens = legitimateTokens.slice(0, discoveryConfig.maxTokensPerChain)

  // Tokens omitted from the result despite meeting minBalanceThreshold: known
  // spam survivors beyond the cap, plus balances never metadata-fetched
  // because the fill loop stopped before reaching them (unknown status —
  // counted conservatively so truncation is never silently underreported).
  const truncatedTokenCount = legitimateTokens.length - tokens.length + (thresholdBalances.length - consideredCount)

  return {
    tokens,
    errors: [],
    contractsChecked: consideredCount,
    truncatedTokenCount,
  }
}

// ---------------------------------------------------------------------------
// fetchTokenMetadata (on-chain ERC-20 — kept intact for token-metadata.ts)
// ---------------------------------------------------------------------------

/**
 * Fetch token metadata for a specific token on a specific chain via on-chain
 * ERC-20 `readContracts` calls.
 *
 * IMPORTANT: Do NOT change this function's signature. `lib/web3/token-metadata.ts`
 * imports this as `fetchBasicMetadata` (line 6) and calls it inside
 * `fetchOnChainMetadata` (line ~314). Changing the signature would break
 * `fetchEnhancedTokenMetadata`.
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

// ---------------------------------------------------------------------------
// formatTokenBalance
// ---------------------------------------------------------------------------

/**
 * Format token balance for display
 */
export function formatTokenBalance(balance: bigint, decimals: number, maxDisplayDecimals = 6): string {
  if (balance === BigInt(0)) return '0'

  try {
    // Convert to decimal string
    const divisor = BigInt(10) ** BigInt(decimals)
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

// ---------------------------------------------------------------------------
// filterTokens / sortTokens (kept intact)
// ---------------------------------------------------------------------------

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
    if (filters.chains !== undefined && !filters.chains.includes(token.chainId)) {
      return false
    }

    // Symbol filters
    if (filters.symbols !== undefined && !filters.symbols.includes(token.symbol)) {
      return false
    }
    if (filters.excludeSymbols !== undefined && filters.excludeSymbols.includes(token.symbol)) {
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
