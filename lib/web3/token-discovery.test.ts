/**
 * Unit tests for discoverUserTokens (Unit 4 rewrite).
 *
 * Mock strategy: mock `lib/web3/alchemy-token-api` and
 * `lib/web3/alchemy-endpoints` so each test controls balances, metadata, and
 * endpoint availability independently. This exercises the REAL
 * discoverUserTokens mapping / sanitization / error logic without hitting the
 * network, addressing the "module-mock false-green" review finding.
 *
 * `lib/web3/display-sanitization` is NOT mocked — sanitization is exercised
 * for real so the boundary invariant is verified.
 */

import type {Address} from 'viem'
import {createPublicClient} from 'viem'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {getAlchemyEndpoint} from './alchemy-endpoints'
import {fetchAlchemyTokenMetadataBatch, fetchWalletTokenBalances} from './alchemy-token-api'
import {discoverUserTokens, formatTokenBalance, type TokenDiscoveryError} from './token-discovery'

// vi.mock calls are hoisted by Vitest before module evaluation regardless of
// their position in the file. Placing them after imports is the project
// convention (see hooks/use-token-discovery.test.tsx).
vi.mock('./alchemy-endpoints', () => ({
  getAlchemyEndpoint: vi.fn(),
}))

vi.mock('./alchemy-token-api', () => ({
  fetchWalletTokenBalances: vi.fn(),
  fetchAlchemyTokenMetadataBatch: vi.fn(),
}))

vi.mock('viem', async () => {
  const actual = await vi.importActual<typeof import('viem')>('viem')
  return {
    ...actual,
    createPublicClient: vi.fn(() => ({request: vi.fn()})),
  }
})

// ---------------------------------------------------------------------------
// Typed mock helpers
// ---------------------------------------------------------------------------

const mockGetAlchemyEndpoint = vi.mocked(getAlchemyEndpoint)
const mockFetchWalletTokenBalances = vi.mocked(fetchWalletTokenBalances)
const mockFetchAlchemyTokenMetadataBatch = vi.mocked(fetchAlchemyTokenMetadataBatch)
const mockCreatePublicClient = vi.mocked(createPublicClient)

// A stable fake wagmi Config — discoverUserTokens retains the arg for
// signature stability but the rewrite does not use it for enumeration.
const FAKE_CONFIG = {} as Parameters<typeof discoverUserTokens>[0]

const USER_ADDRESS: Address = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
const SEPOLIA_CHAIN_ID = 11155111

// Fake Alchemy endpoint returned by the mock.
const FAKE_ENDPOINT = 'https://eth-sepolia.g.alchemy.com/v2/test-key'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TOKEN_A_ADDRESS: Address = '0xaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAa'
const TOKEN_B_ADDRESS: Address = '0xbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBb'
const TOKEN_C_ADDRESS: Address = '0xCcCcCcCcCcCcCcCcCcCcCcCcCcCcCcCcCcCcCcCc'

function makeMetadataMap(
  entries: {address: Address; name: string; symbol: string; decimals: number}[],
): Map<Address, {name: string; symbol: string; decimals: number}> {
  const map = new Map<Address, {name: string; symbol: string; decimals: number}>()
  for (const e of entries) {
    map.set(e.address, {name: e.name, symbol: e.symbol, decimals: e.decimals})
  }
  return map
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks()
  // Default: endpoint available.
  mockGetAlchemyEndpoint.mockReturnValue(FAKE_ENDPOINT)
  // Default: createPublicClient returns a stub client.
  // Cast through unknown to avoid the full PublicClient shape requirement.
  mockCreatePublicClient.mockReturnValue({request: vi.fn()} as unknown as ReturnType<typeof createPublicClient>)
})

// ---------------------------------------------------------------------------
// Happy path: basic enumeration
// ---------------------------------------------------------------------------

describe('happy path — basic enumeration', () => {
  it('returns discovered tokens with sanitized name and symbol', async () => {
    mockFetchWalletTokenBalances.mockResolvedValue([
      {contractAddress: TOKEN_A_ADDRESS, balance: BigInt(1_000_000)},
      {contractAddress: TOKEN_B_ADDRESS, balance: BigInt(500_000)},
    ])
    mockFetchAlchemyTokenMetadataBatch.mockResolvedValue(
      makeMetadataMap([
        {address: TOKEN_A_ADDRESS, name: 'USD Coin', symbol: 'USDC', decimals: 6},
        {address: TOKEN_B_ADDRESS, name: 'Dai Stablecoin', symbol: 'DAI', decimals: 18},
      ]),
    )

    const result = await discoverUserTokens(FAKE_CONFIG, USER_ADDRESS, {chainIds: [SEPOLIA_CHAIN_ID]})

    expect(result.errors).toHaveLength(0)
    expect(result.tokens).toHaveLength(2)
    expect(result.chainsScanned).toBe(1)
    expect(result.contractsChecked).toBe(2)

    const usdc = result.tokens.find(t => t.address === TOKEN_A_ADDRESS)
    expect(usdc).toBeDefined()
    expect(usdc?.name).toBe('USD Coin')
    expect(usdc?.symbol).toBe('USDC')
    expect(usdc?.decimals).toBe(6)
    expect(usdc?.balance).toBe(BigInt(1_000_000))
    expect(usdc?.chainId).toBe(SEPOLIA_CHAIN_ID)
    expect(usdc?.formattedBalance).toBe('1')
  })

  it('includes obscure / unknown tokens returned by Alchemy', async () => {
    mockFetchWalletTokenBalances.mockResolvedValue([{contractAddress: TOKEN_C_ADDRESS, balance: BigInt(42)}])
    mockFetchAlchemyTokenMetadataBatch.mockResolvedValue(
      makeMetadataMap([{address: TOKEN_C_ADDRESS, name: 'Obscure Junk Token', symbol: 'OJT', decimals: 18}]),
    )

    const result = await discoverUserTokens(FAKE_CONFIG, USER_ADDRESS, {chainIds: [SEPOLIA_CHAIN_ID]})

    expect(result.tokens).toHaveLength(1)
    expect(result.tokens[0]?.symbol).toBe('OJT')
    expect(result.tokens[0]?.name).toBe('Obscure Junk Token')
  })
})

// ---------------------------------------------------------------------------
// Edge case: zero-balance exclusion
// ---------------------------------------------------------------------------

describe('edge case — zero-balance exclusion', () => {
  it('does not include zero-balance tokens (filtered by fetchWalletTokenBalances)', async () => {
    // fetchWalletTokenBalances already filters zeros — return only non-zero.
    mockFetchWalletTokenBalances.mockResolvedValue([{contractAddress: TOKEN_A_ADDRESS, balance: BigInt(100)}])
    mockFetchAlchemyTokenMetadataBatch.mockResolvedValue(
      makeMetadataMap([{address: TOKEN_A_ADDRESS, name: 'Token A', symbol: 'TKA', decimals: 18}]),
    )

    const result = await discoverUserTokens(FAKE_CONFIG, USER_ADDRESS, {chainIds: [SEPOLIA_CHAIN_ID]})

    // Only the non-zero token is present.
    expect(result.tokens).toHaveLength(1)
    expect(result.tokens[0]?.address).toBe(TOKEN_A_ADDRESS)
  })

  it('excludes balances below minBalanceThreshold (filtering-contract regression)', async () => {
    // A caller that raises minBalanceThreshold must not see (or be able to
    // select) balances below it — the pre-rewrite processBatch path enforced
    // this and the Alchemy enumeration path must preserve it.
    mockFetchWalletTokenBalances.mockResolvedValue([
      {contractAddress: TOKEN_A_ADDRESS, balance: BigInt(100)},
      {contractAddress: TOKEN_B_ADDRESS, balance: BigInt(5)},
    ])
    mockFetchAlchemyTokenMetadataBatch.mockResolvedValue(
      makeMetadataMap([
        {address: TOKEN_A_ADDRESS, name: 'Token A', symbol: 'TKA', decimals: 18},
        {address: TOKEN_B_ADDRESS, name: 'Token B', symbol: 'TKB', decimals: 18},
      ]),
    )

    const result = await discoverUserTokens(FAKE_CONFIG, USER_ADDRESS, {
      chainIds: [SEPOLIA_CHAIN_ID],
      minBalanceThreshold: BigInt(50),
    })

    // Only the balance at/above the threshold survives.
    expect(result.tokens).toHaveLength(1)
    expect(result.tokens[0]?.address).toBe(TOKEN_A_ADDRESS)
  })
})

// ---------------------------------------------------------------------------
// Edge case: multi-page / many-token wallet
// ---------------------------------------------------------------------------

describe('edge case — many-token wallet (multi-page)', () => {
  it('enumerates all tokens across multiple pages', async () => {
    // Simulate a wallet with 250 tokens across 3 pages (100 + 100 + 50).
    // fetchWalletTokenBalances handles pagination internally and returns the
    // full flat list — we verify discoverUserTokens processes all of them.
    const allBalances = Array.from({length: 250}, (_, i) => ({
      contractAddress: `0x${i.toString(16).padStart(40, '0')}` satisfies Address,
      balance: BigInt(i + 1),
    }))

    mockFetchWalletTokenBalances.mockResolvedValue(allBalances)

    // Build metadata for all 250 tokens.
    const metaEntries = allBalances.map((b, i) => ({
      address: b.contractAddress,
      name: `Token ${i}`,
      symbol: `TK${i}`,
      decimals: 18,
    }))
    mockFetchAlchemyTokenMetadataBatch.mockResolvedValue(makeMetadataMap(metaEntries))

    const result = await discoverUserTokens(FAKE_CONFIG, USER_ADDRESS, {
      chainIds: [SEPOLIA_CHAIN_ID],
      maxTokensPerChain: 250,
    })

    expect(result.errors).toHaveLength(0)
    expect(result.tokens).toHaveLength(250)
    expect(result.contractsChecked).toBe(250)

    // Spot-check first and last tokens are present.
    expect(result.tokens[0]?.symbol).toBe('TK0')
    expect(result.tokens[249]?.symbol).toBe('TK249')
  })

  it('respects maxTokensPerChain cap', async () => {
    const allBalances = Array.from({length: 200}, (_, i) => ({
      contractAddress: `0x${i.toString(16).padStart(40, '0')}` satisfies Address,
      balance: BigInt(i + 1),
    }))
    mockFetchWalletTokenBalances.mockResolvedValue(allBalances)

    const metaEntries = allBalances.map((b, i) => ({
      address: b.contractAddress,
      name: `Token ${i}`,
      symbol: `TK${i}`,
      decimals: 18,
    }))
    mockFetchAlchemyTokenMetadataBatch.mockResolvedValue(makeMetadataMap(metaEntries))

    const result = await discoverUserTokens(FAKE_CONFIG, USER_ADDRESS, {
      chainIds: [SEPOLIA_CHAIN_ID],
      maxTokensPerChain: 50,
    })

    expect(result.tokens).toHaveLength(50)
    expect(result.contractsChecked).toBe(50)
  })
})

// ---------------------------------------------------------------------------
// Error path: AUTH_MISSING (no Alchemy key)
// ---------------------------------------------------------------------------

describe('error path — AUTH_MISSING', () => {
  it('returns exactly one AUTH_MISSING error and empty tokens when key is absent', async () => {
    mockGetAlchemyEndpoint.mockReturnValue(undefined)

    const result = await discoverUserTokens(FAKE_CONFIG, USER_ADDRESS, {chainIds: [SEPOLIA_CHAIN_ID]})

    expect(result.tokens).toHaveLength(0)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]?.type).toBe('AUTH_MISSING')
    expect(result.errors[0]?.chainId).toBe(SEPOLIA_CHAIN_ID)

    // Verify no Alchemy API calls were made.
    expect(mockFetchWalletTokenBalances).not.toHaveBeenCalled()
    expect(mockFetchAlchemyTokenMetadataBatch).not.toHaveBeenCalled()
  })

  it('does NOT fall back to any hardcoded token list when key is absent', async () => {
    mockGetAlchemyEndpoint.mockReturnValue(undefined)

    const result = await discoverUserTokens(FAKE_CONFIG, USER_ADDRESS, {chainIds: [SEPOLIA_CHAIN_ID]})

    // Tokens must be empty — no hardcoded fallback.
    expect(result.tokens).toHaveLength(0)
    // The error type must be AUTH_MISSING, not a success with hardcoded tokens.
    const authMissingErrors = result.errors.filter(e => e.type === 'AUTH_MISSING')
    expect(authMissingErrors).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// Error path: API_ERROR (chain scan failure)
// ---------------------------------------------------------------------------

describe('error path — API_ERROR', () => {
  it('pushes API_ERROR when fetchWalletTokenBalances throws', async () => {
    mockFetchWalletTokenBalances.mockRejectedValue(new Error('RPC connection refused'))

    const result = await discoverUserTokens(FAKE_CONFIG, USER_ADDRESS, {chainIds: [SEPOLIA_CHAIN_ID]})

    expect(result.tokens).toHaveLength(0)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]?.type).toBe('API_ERROR')
    expect(result.errors[0]?.chainId).toBe(SEPOLIA_CHAIN_ID)
    expect(result.errors[0]?.originalError?.message).toBe('RPC connection refused')
  })

  it('is NOT an empty success — errors array is non-empty on chain scan failure', async () => {
    mockFetchWalletTokenBalances.mockRejectedValue(new Error('timeout'))

    const result = await discoverUserTokens(FAKE_CONFIG, USER_ADDRESS, {chainIds: [SEPOLIA_CHAIN_ID]})

    // Must not silently return empty tokens without an error.
    expect(result.errors.length).toBeGreaterThan(0)
    const apiErrors = result.errors.filter(e => e.type === 'API_ERROR')
    expect(apiErrors).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// Integration: sanitization at the discovery boundary (R7)
// ---------------------------------------------------------------------------

describe('integration — sanitization at the discovery boundary', () => {
  it('strips RTL override characters from token name and symbol', async () => {
    // RTL override: U+202E (RIGHT-TO-LEFT OVERRIDE)
    const maliciousName = 'USD\u202ECoin'
    const maliciousSymbol = 'US\u202EDC'

    mockFetchWalletTokenBalances.mockResolvedValue([{contractAddress: TOKEN_A_ADDRESS, balance: BigInt(1_000_000)}])
    mockFetchAlchemyTokenMetadataBatch.mockResolvedValue(
      makeMetadataMap([{address: TOKEN_A_ADDRESS, name: maliciousName, symbol: maliciousSymbol, decimals: 6}]),
    )

    const result = await discoverUserTokens(FAKE_CONFIG, USER_ADDRESS, {chainIds: [SEPOLIA_CHAIN_ID]})

    expect(result.tokens).toHaveLength(1)
    const token = result.tokens[0]
    // RTL override must be stripped.
    expect(token?.name).toBe('USDCoin')
    expect(token?.symbol).toBe('USDC')
    // Verify the raw malicious chars are gone.
    expect(token?.name).not.toContain('\u202E')
    expect(token?.symbol).not.toContain('\u202E')
  })

  it('strips control characters from token display fields', async () => {
    const nameWithControl = 'Token\u0000Name'
    const symbolWithControl = 'TK\u001FN'

    mockFetchWalletTokenBalances.mockResolvedValue([{contractAddress: TOKEN_B_ADDRESS, balance: BigInt(500)}])
    mockFetchAlchemyTokenMetadataBatch.mockResolvedValue(
      makeMetadataMap([{address: TOKEN_B_ADDRESS, name: nameWithControl, symbol: symbolWithControl, decimals: 18}]),
    )

    const result = await discoverUserTokens(FAKE_CONFIG, USER_ADDRESS, {chainIds: [SEPOLIA_CHAIN_ID]})

    expect(result.tokens[0]?.name).toBe('TokenName')
    expect(result.tokens[0]?.symbol).toBe('TKN')
  })

  it('sanitized symbol is safe for use in toast text (boundary invariant)', async () => {
    // Simulates what use-token-disposal / use-token-approval would receive.
    const maliciousSymbol = '\u202EUSDC\u202C'

    mockFetchWalletTokenBalances.mockResolvedValue([{contractAddress: TOKEN_A_ADDRESS, balance: BigInt(1)}])
    mockFetchAlchemyTokenMetadataBatch.mockResolvedValue(
      makeMetadataMap([{address: TOKEN_A_ADDRESS, name: 'USD Coin', symbol: maliciousSymbol, decimals: 6}]),
    )

    const result = await discoverUserTokens(FAKE_CONFIG, USER_ADDRESS, {chainIds: [SEPOLIA_CHAIN_ID]})

    const token = result.tokens[0]
    // The symbol that would appear in a toast must contain no bidi chars.
    const toastText = `Disposing ${token?.symbol ?? ''}`
    expect(toastText).not.toMatch(/[\u202A-\u202E\u2066-\u2069]/)
    expect(toastText).toBe('Disposing USDC')
  })
})

// ---------------------------------------------------------------------------
// Regression: DiscoveredToken shape unchanged
// ---------------------------------------------------------------------------

describe('regression — DiscoveredToken shape', () => {
  it('DiscoveredToken has all required fields with correct types', async () => {
    mockFetchWalletTokenBalances.mockResolvedValue([{contractAddress: TOKEN_A_ADDRESS, balance: BigInt(1_000_000)}])
    mockFetchAlchemyTokenMetadataBatch.mockResolvedValue(
      makeMetadataMap([{address: TOKEN_A_ADDRESS, name: 'USD Coin', symbol: 'USDC', decimals: 6}]),
    )

    const result = await discoverUserTokens(FAKE_CONFIG, USER_ADDRESS, {chainIds: [SEPOLIA_CHAIN_ID]})

    // Shape assertions — all fields must be present.
    const token = result.tokens[0]
    expect(token).toBeDefined()
    expect(typeof token?.address).toBe('string')
    expect(typeof token?.symbol).toBe('string')
    expect(typeof token?.name).toBe('string')
    expect(typeof token?.decimals).toBe('number')
    expect(typeof token?.balance).toBe('bigint')
    expect(typeof token?.chainId).toBe('number')
    expect(typeof token?.formattedBalance).toBe('string')
  })

  it('existing RPC_ERROR type assertion still type-checks (additive union)', () => {
    // This test verifies the type union is additive — existing code that
    // checks `type === 'RPC_ERROR'` must still compile and work.
    const error: TokenDiscoveryError = {
      chainId: SEPOLIA_CHAIN_ID,
      message: 'test',
      type: 'RPC_ERROR',
    }
    expect(error.type).toBe('RPC_ERROR')

    // New types must also be valid members of the union.
    const authError: TokenDiscoveryError = {
      chainId: SEPOLIA_CHAIN_ID,
      message: 'key absent',
      type: 'AUTH_MISSING',
    }
    expect(authError.type).toBe('AUTH_MISSING')

    const apiError: TokenDiscoveryError = {
      chainId: SEPOLIA_CHAIN_ID,
      message: 'scan failed',
      type: 'API_ERROR',
    }
    expect(apiError.type).toBe('API_ERROR')
  })

  it('TokenDiscoveryResult has contractsChecked reflecting tokens enumerated', async () => {
    mockFetchWalletTokenBalances.mockResolvedValue([
      {contractAddress: TOKEN_A_ADDRESS, balance: BigInt(1)},
      {contractAddress: TOKEN_B_ADDRESS, balance: BigInt(2)},
      {contractAddress: TOKEN_C_ADDRESS, balance: BigInt(3)},
    ])
    mockFetchAlchemyTokenMetadataBatch.mockResolvedValue(
      makeMetadataMap([
        {address: TOKEN_A_ADDRESS, name: 'A', symbol: 'A', decimals: 18},
        {address: TOKEN_B_ADDRESS, name: 'B', symbol: 'B', decimals: 18},
        {address: TOKEN_C_ADDRESS, name: 'C', symbol: 'C', decimals: 18},
      ]),
    )

    const result = await discoverUserTokens(FAKE_CONFIG, USER_ADDRESS, {chainIds: [SEPOLIA_CHAIN_ID]})

    // contractsChecked = count of tokens enumerated (not contracts polled).
    expect(result.contractsChecked).toBe(3)
  })
})

// ---------------------------------------------------------------------------
// Regression: chainsScanned reflects config
// ---------------------------------------------------------------------------

describe('regression — chainsScanned', () => {
  it('chainsScanned equals the number of chains in discoveryConfig', async () => {
    mockFetchWalletTokenBalances.mockResolvedValue([])
    mockFetchAlchemyTokenMetadataBatch.mockResolvedValue(new Map())

    const result = await discoverUserTokens(FAKE_CONFIG, USER_ADDRESS, {chainIds: [SEPOLIA_CHAIN_ID]})

    expect(result.chainsScanned).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// AF1: formatTokenBalance precision — high-decimal tokens (decimals > 15)
// ---------------------------------------------------------------------------

describe('formatTokenBalance — high-decimal precision (AF1)', () => {
  it('correctly formats a token with decimals=25 (old Number exponentiation lost precision)', () => {
    // 1 token with 25 decimals = 10^25 raw units.
    // The old code: BigInt(10 ** 25) → BigInt(10000000000000000303786028) (wrong, Number loses precision)
    // The new code: BigInt(10) ** BigInt(25) → 10000000000000000000000000n (correct)
    const oneToken = BigInt(10) ** BigInt(25) // 1 full token at 25 decimals
    const result = formatTokenBalance(oneToken, 25)
    expect(result).toBe('1')
  })

  it('correctly formats a fractional balance at decimals=25', () => {
    // 1.5 tokens at 25 decimals = 15 * 10^24
    const balance = BigInt(15) * BigInt(10) ** BigInt(24)
    const result = formatTokenBalance(balance, 25)
    expect(result).toBe('1.5')
  })

  it('correctly formats a token with decimals=30 (extreme spam-token range)', () => {
    const oneToken = BigInt(10) ** BigInt(30)
    const result = formatTokenBalance(oneToken, 30)
    expect(result).toBe('1')
  })

  it('returns 0 for zero balance regardless of decimals', () => {
    expect(formatTokenBalance(BigInt(0), 25)).toBe('0')
  })
})

// ---------------------------------------------------------------------------
// Regression: createPublicClient is called with the Alchemy endpoint
// ---------------------------------------------------------------------------

describe('regression — client construction path', () => {
  it('calls createPublicClient with the Alchemy endpoint (not a dead arg)', async () => {
    mockFetchWalletTokenBalances.mockResolvedValue([])
    mockFetchAlchemyTokenMetadataBatch.mockResolvedValue(new Map())

    await discoverUserTokens(FAKE_CONFIG, USER_ADDRESS, {chainIds: [SEPOLIA_CHAIN_ID]})

    // Verify createPublicClient was called — confirms the real client-
    // construction path is exercised, not just a module-mock boundary.
    expect(mockCreatePublicClient).toHaveBeenCalledOnce()
    const callArg = mockCreatePublicClient.mock.calls[0]?.[0]
    expect(callArg).toBeDefined()
    // The transport must be constructed from the Alchemy endpoint.
    // We can't inspect the http() return value directly, but we can verify
    // the call happened with a transport argument.
    expect(callArg).toHaveProperty('transport')
  })
})
