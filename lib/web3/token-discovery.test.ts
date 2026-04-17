import {describe, expect, it} from 'vitest'

import {COMMON_TOKEN_ADDRESSES} from './token-discovery'

describe('token discovery Sepolia support', () => {
  it('provides known ERC-20 addresses for Sepolia discovery', () => {
    // Given Sepolia is the only supported network for v1.0
    const sepoliaChainId = 11155111

    // When token discovery reads the common token list for Sepolia
    const addresses = COMMON_TOKEN_ADDRESSES[sepoliaChainId]

    // Then the list exists and includes known Sepolia ERC-20 tokens
    expect(addresses).toBeDefined()
    expect(addresses.length).toBeGreaterThan(0)
  })
})
