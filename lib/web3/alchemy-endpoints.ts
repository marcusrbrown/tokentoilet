import {env} from '@/env'

/**
 * Alchemy JSON-RPC endpoint hosts for supported chains.
 * Keyed by EVM chain id.
 *
 * Only chains that Alchemy supports AND that this app may enumerate are listed.
 * Extend this map when adding new supported chains.
 */
const ALCHEMY_HOSTS: Readonly<Record<number, string>> = {
  1: 'https://eth-mainnet.g.alchemy.com/v2',
  11155111: 'https://eth-sepolia.g.alchemy.com/v2',
}

/**
 * Returns `true` when the Alchemy API key is present and non-empty.
 *
 * Use this to distinguish "key absent" (affects all chains) from "chain
 * unmapped" (affects only that chain) before calling `getAlchemyEndpoint`.
 */
export function isAlchemyConfigured(): boolean {
  const key = env.NEXT_PUBLIC_ALCHEMY_API_KEY
  return key !== undefined && key !== ''
}

/**
 * Returns the full Alchemy RPC endpoint URL for the given chain id, or
 * `undefined` when:
 *  - `NEXT_PUBLIC_ALCHEMY_API_KEY` is absent or empty (→ caller emits AUTH_MISSING)
 *  - the chain id is not in the supported Alchemy host map
 *
 * This is the signal `discoverUserTokens` uses to emit an `AUTH_MISSING` error
 * and surface the "discovery unavailable" UX state.
 */
export function getAlchemyEndpoint(chainId: number): string | undefined {
  const key = env.NEXT_PUBLIC_ALCHEMY_API_KEY
  if (key === undefined || key === '') return undefined

  const host = ALCHEMY_HOSTS[chainId]
  if (host === undefined) return undefined

  return `${host}/${key}`
}
