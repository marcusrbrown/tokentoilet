/**
 * Unit tests for calculateBaseSpamScore — the scoring path token-discovery.ts
 * uses to decide which tokens a user ever sees before an irreversible burn.
 *
 * Every assertion pins an exact total, not a range. `calculateSpamScore` in
 * token-filtering.test.ts already covers range/positivity assertions layered
 * on top of these base signals (isVerified, riskScore); this file exists so a
 * change to any single weight here fails a test.
 *
 * Weights (documented on SPAM_PATTERNS / calculateBaseSpamScore):
 *   name pattern match       → 25
 *   symbol pattern match     → 20
 *   confusable name/symbol   → 20
 *   suspicious decimals      → 15
 *   huge balance             → 20
 */

import {describe, expect, it} from 'vitest'
import {calculateBaseSpamScore, DEFAULT_SPAM_SCORE_THRESHOLD} from './token-spam-heuristics'

// A balance safely below the huge-balance threshold (999999999999999999999999).
const NORMAL_BALANCE = BigInt(1000)
// A balance strictly above the huge-balance threshold.
const HUGE_BALANCE = BigInt('2000000000000000000000000')

describe('calculateBaseSpamScore — zero case', () => {
  it('returns 0 for a token with no spam signals', () => {
    const score = calculateBaseSpamScore({
      name: 'Legit Token',
      symbol: 'TOK',
      decimals: 18,
      balance: NORMAL_BALANCE,
    })

    expect(score).toBe(0)
  })
})

describe('calculateBaseSpamScore — isolated signal weights', () => {
  it('weighs a name-pattern match at exactly 25', () => {
    const score = calculateBaseSpamScore({
      name: 'free claim now',
      symbol: 'TOK',
      decimals: 18,
      balance: NORMAL_BALANCE,
    })

    expect(score).toBe(25)
  })

  it('weighs a symbol-pattern match at exactly 20', () => {
    const score = calculateBaseSpamScore({
      name: 'Legit Token',
      symbol: '123',
      decimals: 18,
      balance: NORMAL_BALANCE,
    })

    expect(score).toBe(20)
  })

  it('weighs a confusable (mixed-script) name at exactly 20', () => {
    // Greek Alpha (U+0391) mixed into an otherwise-Latin name — does not
    // match any namePattern, isolating the confusable signal.
    const score = calculateBaseSpamScore({
      name: 'Tok\u0391en',
      symbol: 'TOK',
      decimals: 18,
      balance: NORMAL_BALANCE,
    })

    expect(score).toBe(20)
  })

  it('weighs a confusable (mixed-script) symbol at exactly 20', () => {
    const score = calculateBaseSpamScore({
      name: 'Legit Token',
      symbol: 'TOK\u0391',
      decimals: 18,
      balance: NORMAL_BALANCE,
    })

    expect(score).toBe(20)
  })

  it('weighs a suspicious decimal count at exactly 15', () => {
    const score = calculateBaseSpamScore({
      name: 'Legit Token',
      symbol: 'TOK',
      decimals: 0,
      balance: NORMAL_BALANCE,
    })

    expect(score).toBe(15)
  })

  it('weighs a huge balance at exactly 20', () => {
    const score = calculateBaseSpamScore({
      name: 'Legit Token',
      symbol: 'TOK',
      decimals: 18,
      balance: HUGE_BALANCE,
    })

    expect(score).toBe(20)
  })
})

describe('calculateBaseSpamScore — combinations', () => {
  it('sums independent contributors (symbol + decimals + balance = 55)', () => {
    const score = calculateBaseSpamScore({
      name: 'Legit Token',
      symbol: '123',
      decimals: 0,
      balance: HUGE_BALANCE,
    })

    expect(score).toBe(55)
  })

  it('sums all five contributors to exactly 100 with no premature clamp', () => {
    // name matches a namePattern AND is confusable in the same field, so all
    // five weights land without needing a sixth signal: 25 (name pattern) +
    // 20 (confusable, via the same name) + 20 (symbol pattern) + 15
    // (suspicious decimals) + 20 (huge balance) = 100.
    const score = calculateBaseSpamScore({
      name: 'free claim \u0421', // "free claim" + Cyrillic С
      symbol: 'CLAIM',
      decimals: 0,
      balance: HUGE_BALANCE,
    })

    expect(score).toBe(100)
  })
})

describe('calculateBaseSpamScore — DEFAULT_SPAM_SCORE_THRESHOLD boundary', () => {
  // Every weight is a multiple of 5, so no achievable combination lands at
  // 69/70 exactly — 65/75 is the tightest bracket around the threshold and
  // is what actually exercises discovery's `< DEFAULT_SPAM_SCORE_THRESHOLD`
  // branch (lib/web3/token-discovery.ts).
  it('scores just under the threshold (65 < 70) — token-discovery would keep this token', () => {
    // name pattern (25) + confusable via the same name (20) + symbol pattern
    // (20) = 65, with decimals/balance both benign.
    const score = calculateBaseSpamScore({
      name: 'free claim \u0421',
      symbol: 'CLAIM',
      decimals: 18,
      balance: NORMAL_BALANCE,
    })

    expect(score).toBe(65)
    expect(score).toBeLessThan(DEFAULT_SPAM_SCORE_THRESHOLD)
  })

  it('scores at/over the threshold (75 >= 70) — token-discovery would drop this token', () => {
    // confusable name (20, no namePattern match) + symbol pattern (20) +
    // suspicious decimals (15) + huge balance (20) = 75.
    const score = calculateBaseSpamScore({
      name: 'Tok\u0391en',
      symbol: '123',
      decimals: 0,
      balance: HUGE_BALANCE,
    })

    expect(score).toBe(75)
    expect(score).toBeGreaterThanOrEqual(DEFAULT_SPAM_SCORE_THRESHOLD)
  })
})
