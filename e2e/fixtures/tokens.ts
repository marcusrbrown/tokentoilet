import type {Address} from 'viem'

function fixtureAddress(label: string): Address {
  return `0x${label.padStart(40, '0')}`
}

export interface TokenFixture {
  readonly address: Address
  readonly symbol: string
  readonly name: string
  readonly decimals: number
  /** Raw balance in the token's smallest unit (not human-formatted). */
  readonly balance: bigint
  /**
   * Documented intended estimated USD value for this fixture. NOT currently
   * consumed by the live app: `hooks/use-token-filtering.ts` calls
   * `categorizeToken(token, undefined, ...)` with metadata hardcoded to
   * `undefined` at its only production call site, so `estimatedValueUSD` is
   * always `undefined` for every token today regardless of this field. Kept
   * here so the fixture is ready the day that call site starts passing real
   * metadata.
   */
  readonly estimatedValueUsd: number | undefined
  readonly scenario: string
}

/**
 * 6-decimal token (not 18). Exercises the decimal-assumption check Unit 7
 * reconciles the displayed amount against the signed raw value with.
 */
export const SIX_DECIMAL_TOKEN: TokenFixture = {
  address: fixtureAddress('600d6dec'),
  symbol: 'USDF',
  name: 'USD Fixture',
  decimals: 6,
  balance: 2_500_000n, // 2.5 USDF
  estimatedValueUsd: 2.5,
  scenario: 'six-decimal reconciliation (Unit 7)',
}

/**
 * Spoofed-metadata token: symbol/name impersonate USDC while the contract
 * address is not the real USDC address on any chain. Feeds Units 5 and 6.
 */
export const SPOOFED_USDC_TOKEN: TokenFixture = {
  address: fixtureAddress('face0000'),
  symbol: 'USDC',
  name: 'USD Coin',
  decimals: 6,
  balance: 100_000_000n, // 100 "USDC"
  estimatedValueUsd: 100,
  scenario: 'spoofed metadata / impersonation detection (Units 5, 6)',
}

/** Above the typed-confirmation value threshold, were the value wired up. */
export const HIGH_VALUE_TOKEN: TokenFixture = {
  address: fixtureAddress('a11ce001'),
  symbol: 'TTHIGH',
  name: 'Token Toilet High Value Fixture',
  decimals: 18,
  balance: 25_000_000_000_000_000_000n, // 25 TTHIGH
  estimatedValueUsd: 50,
  scenario: 'typed-confirmation boundary — above threshold',
}

/** Below the typed-confirmation value threshold, were the value wired up. */
export const LOW_VALUE_TOKEN: TokenFixture = {
  address: fixtureAddress('dec0de01'),
  symbol: 'TTLOW',
  name: 'Token Toilet Low Value Fixture',
  decimals: 18,
  balance: 1_000_000_000_000_000n, // 0.001 TTLOW
  estimatedValueUsd: 0.5,
  scenario: 'typed-confirmation boundary — below threshold',
}

/**
 * `lib/web3/token-filtering.ts`'s `useUnwantedTokens` only surfaces the
 * UNWANTED, DUST, and SPAM categories into the disposal-selection screen
 * (see `hooks/use-token-filtering.ts`). Every category path except SPAM is
 * unreachable through network stubbing alone today: `estimatedValueUSD` is
 * always `undefined` in the live app (see `TokenFixture.estimatedValueUsd`
 * above), so `valueClass` is always `UNKNOWN` and DUST/VALUABLE never
 * trigger, and UNWANTED requires manual/hidden user state. `decimals: 2` is
 * in `quickSecurityCheck`'s suspicious-decimal list
 * (`lib/web3/token-validation.ts`), which yields HIGH risk and a spam score
 * over the auto-categorization threshold — the only fixture property that
 * reliably lands a token in the disposable set through real app logic. Used
 * to drive an actual burn transaction end to end.
 */
export const DISPOSABLE_TOKEN: TokenFixture = {
  address: fixtureAddress('d15905ab1e'),
  symbol: 'TTDIS',
  name: 'Token Toilet Disposable Fixture',
  decimals: 2,
  balance: 500n, // 5.00 TTDIS
  estimatedValueUsd: 1,
  scenario: 'end-to-end disposal — reaches the transaction queue',
}

export const ALL_TOKEN_FIXTURES: readonly TokenFixture[] = [
  SIX_DECIMAL_TOKEN,
  SPOOFED_USDC_TOKEN,
  HIGH_VALUE_TOKEN,
  LOW_VALUE_TOKEN,
  DISPOSABLE_TOKEN,
]
