import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {defaultRateLimiter, rateLimit, RateLimitError, strictRateLimiter} from './rate-limit'

describe('Rate Limiting', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('rateLimit factory', () => {
    it('should create a rate limiter with specified options', () => {
      const limiter = rateLimit({
        interval: 60000,
        uniqueTokenPerInterval: 100,
      })

      expect(limiter).toBeDefined()
      expect(typeof limiter.check).toBe('function')
      expect(typeof limiter.getUsage).toBe('function')
      expect(typeof limiter.reset).toBe('function')
      expect(typeof limiter.clear).toBe('function')
    })
  })

  describe('check method', () => {
    it('should allow requests under the limit', async () => {
      const limiter = rateLimit({
        interval: 60000,
        uniqueTokenPerInterval: 100,
      })

      const result = await limiter.check(10, 'test-token')

      expect(result.success).toBe(true)
      expect(result.remaining).toBe(9)
      expect(result.reset).toBeGreaterThan(Date.now())
    })

    it('should track multiple requests', async () => {
      const limiter = rateLimit({
        interval: 60000,
        uniqueTokenPerInterval: 100,
      })

      await limiter.check(10, 'test-token')
      await limiter.check(10, 'test-token')
      const result = await limiter.check(10, 'test-token')

      expect(result.success).toBe(true)
      expect(result.remaining).toBe(7)
    })

    it('should reject requests over the limit', async () => {
      const limiter = rateLimit({
        interval: 60000,
        uniqueTokenPerInterval: 100,
      })

      for (let i = 0; i < 5; i++) {
        await limiter.check(5, 'test-token')
      }

      await expect(limiter.check(5, 'test-token')).rejects.toThrow(RateLimitError)
    })

    it('should track different tokens separately', async () => {
      const limiter = rateLimit({
        interval: 60000,
        uniqueTokenPerInterval: 100,
      })

      await limiter.check(2, 'token-a')
      await limiter.check(2, 'token-a')

      await expect(limiter.check(2, 'token-a')).rejects.toThrow(RateLimitError)

      const result = await limiter.check(2, 'token-b')
      expect(result.success).toBe(true)
    })
  })

  describe('RateLimitError', () => {
    it('should have correct properties', async () => {
      const limiter = rateLimit({
        interval: 60000,
        uniqueTokenPerInterval: 100,
      })

      await limiter.check(1, 'test-token')

      try {
        await limiter.check(1, 'test-token')
      } catch (error) {
        expect(error).toBeInstanceOf(RateLimitError)
        expect((error as RateLimitError).name).toBe('RateLimitError')
        expect((error as RateLimitError).message).toBe('Rate limit exceeded')
        expect((error as RateLimitError).remaining).toBe(0)
        expect((error as RateLimitError).reset).toBeGreaterThan(0)
      }
    })
  })

  describe('getUsage method', () => {
    it('should return 0 for unused tokens', () => {
      const limiter = rateLimit({
        interval: 60000,
        uniqueTokenPerInterval: 100,
      })

      expect(limiter.getUsage('unused-token')).toBe(0)
    })

    it('should return correct usage count', async () => {
      const limiter = rateLimit({
        interval: 60000,
        uniqueTokenPerInterval: 100,
      })

      await limiter.check(10, 'test-token')
      await limiter.check(10, 'test-token')
      await limiter.check(10, 'test-token')

      expect(limiter.getUsage('test-token')).toBe(3)
    })
  })

  describe('reset method', () => {
    it('should reset usage for a specific token', async () => {
      const limiter = rateLimit({
        interval: 60000,
        uniqueTokenPerInterval: 100,
      })

      await limiter.check(10, 'test-token')
      await limiter.check(10, 'test-token')
      expect(limiter.getUsage('test-token')).toBe(2)

      limiter.reset('test-token')
      expect(limiter.getUsage('test-token')).toBe(0)
    })

    it('should not affect other tokens', async () => {
      const limiter = rateLimit({
        interval: 60000,
        uniqueTokenPerInterval: 100,
      })

      await limiter.check(10, 'token-a')
      await limiter.check(10, 'token-b')

      limiter.reset('token-a')

      expect(limiter.getUsage('token-a')).toBe(0)
      expect(limiter.getUsage('token-b')).toBe(1)
    })
  })

  describe('clear method', () => {
    it('should clear all tokens', async () => {
      const limiter = rateLimit({
        interval: 60000,
        uniqueTokenPerInterval: 100,
      })

      await limiter.check(10, 'token-a')
      await limiter.check(10, 'token-b')
      await limiter.check(10, 'token-c')

      limiter.clear()

      expect(limiter.getUsage('token-a')).toBe(0)
      expect(limiter.getUsage('token-b')).toBe(0)
      expect(limiter.getUsage('token-c')).toBe(0)
    })
  })

  describe('TTL expiration', () => {
    it('should reset usage after interval expires', async () => {
      vi.useRealTimers()

      const limiter = rateLimit({
        interval: 50,
        uniqueTokenPerInterval: 100,
      })

      await limiter.check(2, 'test-token')
      await limiter.check(2, 'test-token')

      await expect(limiter.check(2, 'test-token')).rejects.toThrow(RateLimitError)

      await new Promise(resolve => setTimeout(resolve, 60))

      const result = await limiter.check(2, 'test-token')
      expect(result.success).toBe(true)

      vi.useFakeTimers()
    })
  })

  describe('defaultRateLimiter', () => {
    it('should be configured with 60 second interval and 500 unique tokens', async () => {
      expect(defaultRateLimiter).toBeDefined()

      defaultRateLimiter.clear()

      const result = await defaultRateLimiter.check(100, 'default-test')
      expect(result.success).toBe(true)
    })
  })

  describe('strictRateLimiter', () => {
    it('should be configured with 60 second interval and 500 unique tokens', async () => {
      expect(strictRateLimiter).toBeDefined()

      strictRateLimiter.clear()

      const result = await strictRateLimiter.check(100, 'strict-test')
      expect(result.success).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('should handle limit of 0', async () => {
      const limiter = rateLimit({
        interval: 60000,
        uniqueTokenPerInterval: 100,
      })

      await expect(limiter.check(0, 'test-token')).rejects.toThrow(RateLimitError)
    })

    it('should handle empty token string', async () => {
      const limiter = rateLimit({
        interval: 60000,
        uniqueTokenPerInterval: 100,
      })

      const result = await limiter.check(10, '')
      expect(result.success).toBe(true)
    })

    it('should handle very large limits', async () => {
      const limiter = rateLimit({
        interval: 60000,
        uniqueTokenPerInterval: 100,
      })

      const result = await limiter.check(1000000, 'test-token')
      expect(result.success).toBe(true)
      expect(result.remaining).toBe(999999)
    })
  })
})
