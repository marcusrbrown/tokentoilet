import {LRUCache} from 'lru-cache'

export interface RateLimitOptions {
  interval: number
  uniqueTokenPerInterval: number
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  reset: number
}

export class RateLimitError extends Error {
  readonly remaining: number
  readonly reset: number

  constructor(message: string, remaining = 0, reset = 0) {
    super(message)
    this.name = 'RateLimitError'
    this.remaining = remaining
    this.reset = reset
  }
}

export function rateLimit(options: RateLimitOptions) {
  const tokenCache = new LRUCache<string, number[]>({
    max: options.uniqueTokenPerInterval,
    ttl: options.interval,
    updateAgeOnGet: false,
    updateAgeOnHas: false,
  })

  return {
    check: async (limit: number, token: string): Promise<RateLimitResult> =>
      new Promise((resolve, reject) => {
        const now = Date.now()
        const existingCount = tokenCache.get(token)
        const currentUsage = (existingCount?.[0] ?? 0) + 1

        if (existingCount === undefined) {
          tokenCache.set(token, [currentUsage])
        } else {
          existingCount[0] = currentUsage
          tokenCache.set(token, existingCount, {noUpdateTTL: true})
        }

        const isRateLimited = currentUsage > limit
        const remaining = Math.max(0, limit - currentUsage)
        const reset = now + options.interval

        if (isRateLimited) {
          reject(new RateLimitError('Rate limit exceeded', remaining, reset))
        } else {
          resolve({
            success: true,
            remaining,
            reset,
          })
        }
      }),

    getUsage: (token: string): number => {
      const tokenCount = tokenCache.get(token)
      return tokenCount?.[0] ?? 0
    },

    reset: (token: string): void => {
      tokenCache.delete(token)
    },

    clear: (): void => {
      tokenCache.clear()
    },
  }
}

export const defaultRateLimiter = rateLimit({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 500,
})

export const strictRateLimiter = rateLimit({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 500,
})

export type RateLimiter = ReturnType<typeof rateLimit>
