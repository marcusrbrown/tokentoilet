import {beforeEach, describe, expect, it, vi} from 'vitest'
import {env} from '@/env'
import {getAlchemyEndpoint} from './alchemy-endpoints'

// Mock @/env before importing the module under test so we can control
// NEXT_PUBLIC_ALCHEMY_API_KEY per test. vi.mock is hoisted above imports.
vi.mock('@/env', () => ({
  env: {
    NEXT_PUBLIC_ALCHEMY_API_KEY: 'test-api-key-abc123',
  },
}))

describe('getAlchemyEndpoint', () => {
  beforeEach(() => {
    // Reset to a known key before each test
    vi.mocked(env).NEXT_PUBLIC_ALCHEMY_API_KEY = 'test-api-key-abc123'
  })

  describe('happy paths', () => {
    it('returns the eth-sepolia URL with the key embedded for chain 11155111', () => {
      const result = getAlchemyEndpoint(11155111)
      expect(result).toBe('https://eth-sepolia.g.alchemy.com/v2/test-api-key-abc123')
    })

    it('returns the eth-mainnet URL with the key embedded for chain 1', () => {
      const result = getAlchemyEndpoint(1)
      expect(result).toBe('https://eth-mainnet.g.alchemy.com/v2/test-api-key-abc123')
    })
  })

  describe('edge cases — key absent or empty', () => {
    it('returns undefined when the key is undefined', () => {
      vi.mocked(env).NEXT_PUBLIC_ALCHEMY_API_KEY = undefined
      expect(getAlchemyEndpoint(11155111)).toBeUndefined()
    })

    it('returns undefined when the key is an empty string', () => {
      // z.string().min(1).optional() means an empty string would fail validation,
      // but we guard defensively here in case the value slips through (e.g. skipValidation).
      vi.mocked(env).NEXT_PUBLIC_ALCHEMY_API_KEY = ''
      expect(getAlchemyEndpoint(11155111)).toBeUndefined()
    })
  })

  describe('edge cases — unmapped chain id', () => {
    it('returns undefined for an unmapped chain id', () => {
      expect(getAlchemyEndpoint(999)).toBeUndefined()
    })

    it('returns undefined for chain 137 (Polygon, not yet mapped)', () => {
      expect(getAlchemyEndpoint(137)).toBeUndefined()
    })
  })
})
