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
 *  - `NEXT_PUBLIC_ALCHEMY_API_KEY` is absent or empty
 *  - the chain id is not in the supported Alchemy host map
 *
 * Callers must distinguish these two cases via `isAlchemyConfigured()`: a
 * missing key is fatal for all chains (AUTH_MISSING), whereas an unmapped chain
 * affects only that chain (UNSUPPORTED_CHAIN — skip it and scan the rest). Do
 * not collapse both back into a single AUTH_MISSING path.
 */
export function getAlchemyEndpoint(chainId: number): string | undefined {
  const key = env.NEXT_PUBLIC_ALCHEMY_API_KEY
  if (key === undefined || key === '') return undefined

  const host = ALCHEMY_HOSTS[chainId]
  if (host === undefined) return undefined

  return `${host}/${key}`
}
