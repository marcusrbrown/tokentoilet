/**
 * Alchemy Token API client — browser-direct via viem PublicClient.request().
 *
 * No alchemy-sdk dependency. All calls use raw JSON-RPC through viem's
 * transport layer, which respects the wagmi/AppKit transport configuration.
 *
 * ## Error-handling contract
 *
 * `fetchWalletTokenBalances` — THROWS on RPC failure. The caller
 * (discoverUserTokens in Unit 4) wraps each chain scan in try/catch and maps
 * the thrown error to a `TokenDiscoveryError { type: 'API_ERROR' }`. This
 * keeps the error-mapping concern in one place and is consistent with how
 * Unit 4 handles per-chain failures.
 *
 * `fetchAlchemyTokenMetadataBatch` — NEVER THROWS. Individual metadata misses
 * yield a best-effort entry (`{ name: '', symbol: 'UNKNOWN', decimals: 18 }`).
 * The batch always resolves so that a single bad token does not abort
 * discovery for the entire wallet.
 *
 * ## Cache scope
 *
 * The metadata cache is scoped per-invocation (created fresh on each call to
 * `fetchAlchemyTokenMetadataBatch`). It is NOT a module-level singleton.
 * A module-level cache would leak stale metadata across wallet switches —
 * e.g. wallet A's token metadata would be served to wallet B if they share
 * a contract address. The per-invocation cache only deduplicates repeated
 * addresses within a single batch call.
 */

import type {Address, PublicClient} from 'viem'

// ---------------------------------------------------------------------------
// Alchemy JSON-RPC response types
// ---------------------------------------------------------------------------

/** One entry in the `alchemy_getTokenBalances` response. */
interface AlchemyTokenBalance {
  contractAddress: Address
  /** Hex-encoded uint256 balance, e.g. "0x64" or "0x0". */
  tokenBalance: string
}

/** Full response shape for `alchemy_getTokenBalances`. */
interface AlchemyTokenBalancesResponse {
  tokenBalances: AlchemyTokenBalance[]
  /** Present when there are more pages; absent (undefined) on the last page. */
  pageKey?: string
}

/** Response shape for `alchemy_getTokenMetadata`. */
interface AlchemyTokenMetadataResponse {
  name: string | null
  symbol: string | null
  decimals: number | null
  logo: string | null
}

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** A single token balance entry returned by `fetchWalletTokenBalances`. */
export interface WalletTokenBalance {
  contractAddress: Address
  balance: bigint
}

/** Metadata for a single token returned by `fetchAlchemyTokenMetadataBatch`. */
export interface AlchemyTokenMetadata {
  name: string
  symbol: string
  decimals: number
  logo?: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum tokens per page for `alchemy_getTokenBalances`. Alchemy cap is 100. */
const MAX_COUNT = 100

/** Maximum number of in-flight metadata requests at once. */
const METADATA_CONCURRENCY = 8

/** Best-effort metadata returned when a metadata request fails. */
const BEST_EFFORT_METADATA: AlchemyTokenMetadata = {
  name: '',
  symbol: 'UNKNOWN',
  decimals: 18,
}

// ---------------------------------------------------------------------------
// fetchWalletTokenBalances
// ---------------------------------------------------------------------------

/**
 * Enumerate all ERC-20 token balances for `address` via Alchemy's
 * `alchemy_getTokenBalances` JSON-RPC method.
 *
 * Paginates automatically using the `pageKey` cursor until all pages are
 * exhausted. Filters out zero-balance entries before returning.
 *
 * @param client - A viem PublicClient pointed at an Alchemy endpoint.
 * @param address - The wallet address to enumerate.
 * @returns Array of `{ contractAddress, balance }` for all non-zero tokens.
 * @throws When the RPC request fails. The caller should catch and map to a
 *   `TokenDiscoveryError { type: 'API_ERROR' }`.
 */
export async function fetchWalletTokenBalances(
  client: Pick<PublicClient, 'request'>,
  address: Address,
): Promise<WalletTokenBalance[]> {
  const allBalances: WalletTokenBalance[] = []
  let pageKey: string | undefined

  do {
    const options: {maxCount: number; pageKey?: string} =
      pageKey === undefined ? {maxCount: MAX_COUNT} : {maxCount: MAX_COUNT, pageKey}

    // Throws on RPC failure — intentional; caller maps to API_ERROR.
    // alchemy_getTokenBalances is not in viem's built-in EIP-1193 method
    // registry, so we suppress the unknown-method error here and cast the
    // response through unknown to our typed shape.
    const raw = await (client.request as (args: {method: string; params: unknown[]}) => Promise<unknown>)({
      method: 'alchemy_getTokenBalances',
      params: [address, 'erc20', options],
    })

    const page = raw as AlchemyTokenBalancesResponse

    for (const entry of page.tokenBalances) {
      const balance = BigInt(entry.tokenBalance)
      if (balance > BigInt(0)) {
        allBalances.push({contractAddress: entry.contractAddress, balance})
      }
    }

    pageKey = page.pageKey
  } while (pageKey !== undefined)

  return allBalances
}

// ---------------------------------------------------------------------------
// fetchAlchemyTokenMetadataBatch
// ---------------------------------------------------------------------------

/**
 * Fetch token metadata for a list of contract addresses via Alchemy's
 * `alchemy_getTokenMetadata` JSON-RPC method.
 *
 * - Deduplicates addresses within the batch (per-invocation cache).
 * - Caps in-flight requests at `METADATA_CONCURRENCY` (8) to stay within
 *   Alchemy's free-tier rate limit (500 CU/s; each call costs 10 CU).
 * - A metadata miss for any single address yields a best-effort entry
 *   (`{ name: '', symbol: 'UNKNOWN', decimals: 18 }`); the batch never throws.
 *
 * **Cache scope:** the cache is created fresh on each invocation. It is NOT
 * a module-level singleton — that would leak stale metadata across wallet
 * switches. The per-invocation cache only deduplicates repeated addresses
 * within a single batch call.
 *
 * @param client - A viem PublicClient pointed at an Alchemy endpoint.
 * @param addresses - Contract addresses to fetch metadata for.
 * @returns A Map from address → metadata. Every input address has an entry.
 */
export async function fetchAlchemyTokenMetadataBatch(
  client: Pick<PublicClient, 'request'>,
  addresses: Address[],
): Promise<Map<Address, AlchemyTokenMetadata>> {
  // Per-invocation cache — NOT a module-level singleton.
  const cache = new Map<Address, AlchemyTokenMetadata>()

  // Deduplicate: only fetch each address once per invocation.
  const unique = [...new Set(addresses)]

  if (unique.length === 0) {
    return cache
  }

  // Concurrency-capped fetch using a semaphore pattern.
  await runWithConcurrencyLimit(unique, METADATA_CONCURRENCY, async (address: Address) => {
    try {
      // alchemy_getTokenMetadata is not in viem's built-in EIP-1193 method
      // registry; cast through unknown to our typed shape.
      const raw = await (client.request as (args: {method: string; params: unknown[]}) => Promise<unknown>)({
        method: 'alchemy_getTokenMetadata',
        params: [address],
      })

      const meta = raw as AlchemyTokenMetadataResponse

      cache.set(address, {
        name: meta.name ?? '',
        symbol: meta.symbol ?? 'UNKNOWN',
        decimals: meta.decimals ?? 18,
        logo: meta.logo ?? undefined,
      })
    } catch (error) {
      console.error(`[alchemy-token-api] metadata fetch failed for ${address}:`, error)
      cache.set(address, {...BEST_EFFORT_METADATA})
    }
  })

  return cache
}

// ---------------------------------------------------------------------------
// Internal: concurrency limiter
// ---------------------------------------------------------------------------

/**
 * Run `fn` over each item in `items` with at most `limit` concurrent
 * executions. Resolves when all items have been processed.
 *
 * This is a simple semaphore implementation — no external dependency needed.
 */
async function runWithConcurrencyLimit<T>(items: T[], limit: number, fn: (item: T) => Promise<void>): Promise<void> {
  if (items.length === 0) {
    return
  }

  const queue = [...items]
  let active = 0

  await new Promise<void>((resolve, reject) => {
    let settled = false
    let completed = 0

    function settle(error?: unknown) {
      if (settled) return
      settled = true
      if (error === undefined) {
        resolve()
      } else {
        reject(error)
      }
    }

    function next() {
      while (active < limit && queue.length > 0) {
        const item = queue.shift()
        if (item === undefined) break
        active++
        fn(item)
          .then(() => {
            active--
            completed++
            if (completed === items.length) {
              settle()
            } else {
              next()
            }
          })
          .catch((error: unknown) => {
            // fn is expected to catch its own errors (best-effort); if it
            // somehow throws, propagate to the outer promise.
            settle(error)
          })
      }
    }

    next()
  })
}
