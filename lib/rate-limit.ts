import 'server-only'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  resetAt: number
  retryAfterSeconds: number
}

interface MemoryBucket {
  count: number
  resetAt: number
}

const globalForRateLimit = globalThis as unknown as {
  rateLimitBuckets?: Map<string, MemoryBucket>
  upstashRedis?: Redis | null
  upstashLimiters?: Map<string, Ratelimit>
  upstashEphemeralCache?: Map<string, number>
}

const memoryBuckets =
  globalForRateLimit.rateLimitBuckets ?? new Map<string, MemoryBucket>()
if (!globalForRateLimit.rateLimitBuckets) {
  globalForRateLimit.rateLimitBuckets = memoryBuckets
}

const limiters =
  globalForRateLimit.upstashLimiters ?? new Map<string, Ratelimit>()
if (!globalForRateLimit.upstashLimiters) {
  globalForRateLimit.upstashLimiters = limiters
}

const ephemeralCache =
  globalForRateLimit.upstashEphemeralCache ?? new Map<string, number>()
if (!globalForRateLimit.upstashEphemeralCache) {
  globalForRateLimit.upstashEphemeralCache = ephemeralCache
}

export function getUpstashRedis(): Redis | null {
  if (globalForRateLimit.upstashRedis !== undefined) {
    return globalForRateLimit.upstashRedis
  }

  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN

  if (!url || !token) {
    return null
  }

  const client = new Redis({ url, token })
  globalForRateLimit.upstashRedis = client
  return client
}

function getUpstashLimiter(limit: number, windowSeconds: number): Ratelimit | null {
  const redis = getUpstashRedis()
  if (!redis) return null

  const cacheKey = `${limit}:${windowSeconds}`
  const existing = limiters.get(cacheKey)
  if (existing) return existing

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
    prefix: 'mk:rl',
    ephemeralCache,
    analytics: false,
  })
  limiters.set(cacheKey, limiter)
  return limiter
}

function computeRetryAfter(resetAt: number): number {
  return Math.max(1, Math.ceil((resetAt - Date.now()) / 1000))
}

/**
 * Distributed sliding-window rate limiter backed by Upstash Redis (@upstash/ratelimit).
 * Falls back to a best-effort process-local Map when Redis credentials are not configured
 * or if Redis is temporarily unreachable.
 */
export async function checkRateLimit(
  key: string,
  limit = 5,
  windowSeconds = 60,
): Promise<RateLimitResult> {
  const limiter = getUpstashLimiter(limit, windowSeconds)

  if (limiter) {
    try {
      const result = await limiter.limit(key)
      const resetAt = result.reset
      return {
        allowed: result.success,
        limit: result.limit,
        remaining: Math.max(result.remaining, 0),
        resetAt,
        retryAfterSeconds: computeRetryAfter(resetAt),
      }
    } catch (err) {
      console.warn(
        '[rate-limit] Upstash Redis unavailable, falling back to in-memory limiter:',
        err,
      )
    }
  }

  // Best-effort in-memory fallback (per serverless instance)
  const now = Date.now()
  const existing = memoryBuckets.get(key)
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowSeconds * 1000
    memoryBuckets.set(key, { count: 1, resetAt })
    // Opportunistic cleanup to keep memory bounded
    if (memoryBuckets.size > 2000) {
      for (const [k, v] of memoryBuckets) {
        if (v.resetAt <= now) memoryBuckets.delete(k)
      }
    }
    return {
      allowed: true,
      limit,
      remaining: Math.max(limit - 1, 0),
      resetAt,
      retryAfterSeconds: computeRetryAfter(resetAt),
    }
  }

  existing.count += 1
  return {
    allowed: existing.count <= limit,
    limit,
    remaining: Math.max(limit - existing.count, 0),
    resetAt: existing.resetAt,
    retryAfterSeconds: computeRetryAfter(existing.resetAt),
  }
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
    'Retry-After': String(result.retryAfterSeconds),
  }
}

export function extractClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  const realIp = headers.get('x-real-ip')?.trim()
  return realIp || 'unknown'
}
