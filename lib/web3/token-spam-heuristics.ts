/**
 * Core spam-score heuristics, extracted from token-filtering.ts so
 * token-discovery.ts can spam-filter ahead of the display cap (#1521)
 * without creating an import cycle (token-metadata.ts imports
 * token-discovery.ts; token-filtering.ts imports token-metadata.ts).
 *
 * `calculateBaseSpamScore` covers every signal available at discovery time
 * (name, symbol, decimals, balance). `token-filtering.ts`'s `calculateSpamScore`
 * layers isVerified/riskScore on top for the full categorization pipeline.
 * Weights and patterns here are the single source of truth for both.
 */

import {isConfusableTokenName} from './display-sanitization'

/**
 * Known spam/scam patterns for token detection.
 */
export const SPAM_PATTERNS = {
  /** Common spam token name patterns */
  namePatterns: [
    /free.*claim/i,
    /visit.*to.*claim/i,
    /^\d+\$?\s*(?:usdt|usdc|eth|btc|usd)/i,
    /reward|bonus|prize/i,
    /airdrop/i,
    /\b(?:www|http|\.com|\.org)\b/i,
  ],

  /** Suspicious symbol patterns */
  symbolPatterns: [/^\d+$/, /\$\d+/, /^(visit|claim|free|bonus)$/i],

  /** High-risk decimal counts (unusual for legitimate tokens) */
  suspiciousDecimals: [0, 1, 2, 25, 26, 27, 28, 29, 30],
}

/** Default spam-score threshold (0-100) for treating a token as spam. */
export const DEFAULT_SPAM_SCORE_THRESHOLD = 70

/**
 * Spam score from signals available before metadata-fetch-time enrichment:
 * name, symbol, decimals, balance. Not capped at 100 — callers that add
 * further signals (isVerified, riskScore) cap after their own additions.
 */
export function calculateBaseSpamScore(token: {
  name: string
  symbol: string
  decimals: number
  balance: bigint
}): number {
  let spamScore = 0

  for (const pattern of SPAM_PATTERNS.namePatterns) {
    if (pattern.test(token.name)) {
      spamScore += 25
      break
    }
  }

  for (const pattern of SPAM_PATTERNS.symbolPatterns) {
    if (pattern.test(token.symbol)) {
      spamScore += 20
      break
    }
  }

  if (isConfusableTokenName(token.name) || isConfusableTokenName(token.symbol)) {
    spamScore += 20
  }

  if (SPAM_PATTERNS.suspiciousDecimals.includes(token.decimals)) {
    spamScore += 15
  }

  // Huge balance can indicate spam airdrop.
  if (token.balance > BigInt('999999999999999999999999')) {
    spamScore += 20
  }

  return spamScore
}
