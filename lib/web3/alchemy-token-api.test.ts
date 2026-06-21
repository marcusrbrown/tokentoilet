/**
 * Tests for alchemy-token-api.ts
 *
 * Strategy: mock viem PublicClient.request at the object level — no module
 * mocking needed since the client is injected as a parameter.
 *
 * Error-handling contract for fetchWalletTokenBalances:
 *   THROWS — lets the caller (discoverUserTokens / Unit 4) catch and map to
 *   a TokenDiscoveryError. This is consistent with how Unit 4 wraps it.
 *
 * Error-handling contract for fetchAlchemyTokenMetadataBatch:
 *   NEVER THROWS — individual metadata misses yield best-effort entries;
 *   the batch always resolves.
 */

import type {Address} from 'viem'
import {describe, expect, it, vi} from 'vitest'

import {fetchAlchemyTokenMetadataBatch, fetchWalletTokenBalances} from './alchemy-token-api'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type RequestFn = (args: {method: string; params: unknown[]}) => Promise<unknown>

/** Build a minimal viem PublicClient stub with a mocked `request` method. */
function makeClient(requestFn: RequestFn) {
  return {request: vi.fn(requestFn)} as unknown as Parameters<typeof fetchWalletTokenBalances>[0]
}

const ADDR_A = '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' as Address
const ADDR_B = '0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB' as Address
const ADDR_C = '0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC' as Address
const USER = '0x1111111111111111111111111111111111111111' as Address

// ---------------------------------------------------------------------------
// fetchWalletTokenBalances
// ---------------------------------------------------------------------------

describe('fetchWalletTokenBalances', () => {
  describe('happy path — single page', () => {
    it('returns contractAddress and balance for non-zero tokens', async () => {
      const client = makeClient(async () => ({
        tokenBalances: [
          {contractAddress: ADDR_A, tokenBalance: '0x64'}, // 100
          {contractAddress: ADDR_B, tokenBalance: '0x1'}, // 1
        ],
        pageKey: undefined,
      }))

      const result = await fetchWalletTokenBalances(client, USER)

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({contractAddress: ADDR_A, balance: BigInt(100)})
      expect(result[1]).toEqual({contractAddress: ADDR_B, balance: BigInt(1)})
    })
  })

  describe('happy path — multi-page pagination', () => {
    it('follows pageKey until absent and concatenates both pages in order', async () => {
      let callCount = 0
      const client = makeClient(async () => {
        callCount++
        if (callCount === 1) {
          return {
            tokenBalances: [{contractAddress: ADDR_A, tokenBalance: '0x0a'}], // 10
            pageKey: 'page2key',
          }
        }
        return {
          tokenBalances: [{contractAddress: ADDR_B, tokenBalance: '0x14'}], // 20
          pageKey: undefined,
        }
      })

      const result = await fetchWalletTokenBalances(client, USER)

      expect(callCount).toBe(2)
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({contractAddress: ADDR_A, balance: BigInt(10)})
      expect(result[1]).toEqual({contractAddress: ADDR_B, balance: BigInt(20)})
    })

    it('passes the pageKey from page 1 as a param on page 2', async () => {
      const calls: {method: string; params: unknown[]}[] = []
      const client = makeClient(async args => {
        calls.push(args)
        const callIndex = calls.length
        if (callIndex === 1) {
          return {
            tokenBalances: [{contractAddress: ADDR_A, tokenBalance: '0x1'}],
            pageKey: 'cursor-abc',
          }
        }
        return {
          tokenBalances: [{contractAddress: ADDR_B, tokenBalance: '0x2'}],
          pageKey: undefined,
        }
      })

      await fetchWalletTokenBalances(client, USER)

      // Second call must include the pageKey from the first response
      const secondCall = calls[1] as unknown as {params: [string, string, {maxCount: number; pageKey: string}]}
      expect(secondCall.params[2].pageKey).toBe('cursor-abc')
    })
  })

  describe('edge case — zero-balance filtering', () => {
    it('filters out entries with tokenBalance 0x0', async () => {
      const client = makeClient(async () => ({
        tokenBalances: [
          {contractAddress: ADDR_A, tokenBalance: '0x0'},
          {contractAddress: ADDR_B, tokenBalance: '0x5'},
          {
            contractAddress: ADDR_C,
            tokenBalance: '0x0000000000000000000000000000000000000000000000000000000000000000',
          },
        ],
        pageKey: undefined,
      }))

      const result = await fetchWalletTokenBalances(client, USER)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({contractAddress: ADDR_B, balance: BigInt(5)})
    })

    it('returns an empty array when all balances are zero', async () => {
      const client = makeClient(async () => ({
        tokenBalances: [{contractAddress: ADDR_A, tokenBalance: '0x0'}],
        pageKey: undefined,
      }))

      const result = await fetchWalletTokenBalances(client, USER)

      expect(result).toHaveLength(0)
    })
  })

  describe('edge case — empty-string pageKey terminates pagination (AF2)', () => {
    it('treats pageKey="" as terminal and does not make a second request', async () => {
      let callCount = 0
      const client = makeClient(async () => {
        callCount++
        return {
          tokenBalances: [{contractAddress: ADDR_A, tokenBalance: '0x1'}],
          // Alchemy returns "" instead of omitting pageKey — must not loop
          pageKey: '',
        }
      })

      const result = await fetchWalletTokenBalances(client, USER)

      // Must stop after the first page — no infinite loop
      expect(callCount).toBe(1)
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({contractAddress: ADDR_A, balance: BigInt(1)})
    })

    it('does not include pageKey in the request options when pageKey is ""', async () => {
      const calls: {method: string; params: unknown[]}[] = []
      const client = makeClient(async args => {
        calls.push(args)
        return {
          tokenBalances: [{contractAddress: ADDR_A, tokenBalance: '0x1'}],
          pageKey: '',
        }
      })

      await fetchWalletTokenBalances(client, USER)

      // The single request must NOT include a pageKey option
      const firstCall = calls[0] as unknown as {params: [string, string, {maxCount: number; pageKey?: string}]}
      expect(firstCall.params[2].pageKey).toBeUndefined()
    })
  })

  describe('error path — request rejection', () => {
    it('throws when the RPC request rejects (caller maps to TokenDiscoveryError)', async () => {
      const rpcError = new Error('alchemy RPC error: rate limited')
      const client = makeClient(async () => {
        throw rpcError
      })

      await expect(fetchWalletTokenBalances(client, USER)).rejects.toThrow('alchemy RPC error: rate limited')
    })

    it('throws when the first page rejects even if subsequent pages would succeed', async () => {
      const client = makeClient(async () => {
        throw new Error('network error')
      })

      await expect(fetchWalletTokenBalances(client, USER)).rejects.toThrow()
    })
  })
})

// ---------------------------------------------------------------------------
// fetchAlchemyTokenMetadataBatch
// ---------------------------------------------------------------------------

describe('fetchAlchemyTokenMetadataBatch', () => {
  describe('happy path — metadata returned for all addresses', () => {
    it('returns a Map with metadata for each address', async () => {
      const client = makeClient(async args => {
        const addr = (args as unknown as {params: [string]}).params[0]
        if (addr === ADDR_A) {
          return {name: 'Token A', symbol: 'TKNA', decimals: 18, logo: 'https://example.com/a.png'}
        }
        return {name: 'Token B', symbol: 'TKNB', decimals: 6, logo: null}
      })

      const result = await fetchAlchemyTokenMetadataBatch(client, [ADDR_A, ADDR_B])

      expect(result.size).toBe(2)
      expect(result.get(ADDR_A)).toEqual({
        name: 'Token A',
        symbol: 'TKNA',
        decimals: 18,
        logo: 'https://example.com/a.png',
      })
      expect(result.get(ADDR_B)).toEqual({name: 'Token B', symbol: 'TKNB', decimals: 6, logo: undefined})
    })
  })

  describe('edge case — cache hit within a single batch call', () => {
    it('does not issue a second request for a repeated address in the same batch', async () => {
      const client = makeClient(async () => ({name: 'Token A', symbol: 'TKNA', decimals: 18, logo: null}))

      // Pass ADDR_A twice
      const result = await fetchAlchemyTokenMetadataBatch(client, [ADDR_A, ADDR_A])

      // Only one request should have been made
      expect(client.request).toHaveBeenCalledTimes(1)
      expect(result.size).toBe(1)
      expect(result.get(ADDR_A)).toBeDefined()
    })

    it('deduplicates across three occurrences of the same address', async () => {
      const client = makeClient(async () => ({name: 'Token A', symbol: 'TKNA', decimals: 18, logo: null}))

      await fetchAlchemyTokenMetadataBatch(client, [ADDR_A, ADDR_A, ADDR_A])

      expect(client.request).toHaveBeenCalledTimes(1)
    })
  })

  describe('edge case — wallet-switch: cache does not leak across invocations', () => {
    it('a fresh invocation fetches metadata again (no module-level singleton)', async () => {
      const client = makeClient(async () => ({name: 'Token A', symbol: 'TKNA', decimals: 18, logo: null}))

      // First invocation (simulates wallet A)
      await fetchAlchemyTokenMetadataBatch(client, [ADDR_A])
      const firstCallCount = vi.mocked(client.request).mock.calls.length

      // Second invocation (simulates wallet B — same address, different wallet context)
      await fetchAlchemyTokenMetadataBatch(client, [ADDR_A])
      const secondCallCount = vi.mocked(client.request).mock.calls.length

      // Each invocation must issue its own request — no cross-invocation cache
      expect(secondCallCount).toBe(firstCallCount + 1)
    })
  })

  describe('error path — single metadata miss yields best-effort entry', () => {
    it('returns a best-effort entry for a failing address and keeps other tokens intact', async () => {
      const client = makeClient(async args => {
        const addr = (args as unknown as {params: [string]}).params[0]
        if (addr === ADDR_A) {
          throw new Error('metadata not found')
        }
        return {name: 'Token B', symbol: 'TKNB', decimals: 6, logo: null}
      })

      const result = await fetchAlchemyTokenMetadataBatch(client, [ADDR_A, ADDR_B])

      // Batch must resolve (not throw)
      expect(result.size).toBe(2)

      // ADDR_A gets a best-effort entry
      const fallback = result.get(ADDR_A)
      expect(fallback).toBeDefined()
      expect(fallback?.symbol).toBe('UNKNOWN')
      expect(fallback?.decimals).toBe(18)

      // ADDR_B is intact
      expect(result.get(ADDR_B)).toEqual({name: 'Token B', symbol: 'TKNB', decimals: 6, logo: undefined})
    })

    it('resolves with all best-effort entries when every request fails', async () => {
      const client = makeClient(async () => {
        throw new Error('all fail')
      })

      const result = await fetchAlchemyTokenMetadataBatch(client, [ADDR_A, ADDR_B])

      expect(result.size).toBe(2)
      expect(result.get(ADDR_A)?.symbol).toBe('UNKNOWN')
      expect(result.get(ADDR_B)?.symbol).toBe('UNKNOWN')
    })
  })

  describe('integration — concurrency cap', () => {
    it('never exceeds 8 in-flight requests simultaneously', async () => {
      // 20 distinct addresses to ensure we exceed the cap
      const addresses = Array.from({length: 20}, (_, i) => `0x${i.toString(16).padStart(40, '0')}`) as Address[]

      let activeCount = 0
      let maxActive = 0

      const client = makeClient(
        async () =>
          new Promise(resolve => {
            activeCount++
            if (activeCount > maxActive) maxActive = activeCount
            // Resolve asynchronously to allow concurrency to build up
            setTimeout(() => {
              activeCount--
              resolve({name: 'T', symbol: 'T', decimals: 18, logo: null})
            }, 0)
          }),
      )

      await fetchAlchemyTokenMetadataBatch(client, addresses)

      expect(maxActive).toBeLessThanOrEqual(8)
    })

    it('processes all addresses even with the concurrency cap', async () => {
      const addresses = Array.from({length: 20}, (_, i) => `0x${i.toString(16).padStart(40, '0')}`) as Address[]

      const client = makeClient(async () => ({name: 'T', symbol: 'T', decimals: 18, logo: null}))

      const result = await fetchAlchemyTokenMetadataBatch(client, addresses)

      expect(result.size).toBe(20)
    })
  })

  describe('edge case — empty input', () => {
    it('returns an empty Map for an empty address list', async () => {
      const client = makeClient(async () => ({name: 'T', symbol: 'T', decimals: 18, logo: null}))

      const result = await fetchAlchemyTokenMetadataBatch(client, [])

      expect(result.size).toBe(0)
      expect(client.request).not.toHaveBeenCalled()
    })
  })
})

// ---------------------------------------------------------------------------
// Note: no vi.mock calls needed — the client is injected as a parameter,
// so we mock at the object level. This avoids hoisting complexity entirely.
// ---------------------------------------------------------------------------
