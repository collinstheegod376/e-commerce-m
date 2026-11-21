import 'server-only'

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

interface MemoryBucket {
  count: number
  resetAt: number
}

const globalForRateLimit = globalThis as unknown as {
  authRateLimitBuckets?: Map<string, MemoryBucket>
}

const memoryBuckets =
  globalForRateLimit.authRateLimitBuckets ?? new Map<string, MemoryBucket>()

if (!globalForRateLimit.authRateLimitBuckets) {
  globalForRateLimit.authRateLimitBuckets = memoryBuckets
}

/**
 * Rate limiter for /api/auth/* routes (default: 5 attempts per 60 seconds).
 * Uses Upstash Redis / Vercel KV REST API when configured; falls back to a
 * best-effort process-local Map when no Redis credentials are present.
 */
export async function checkRateLimit(
  key: string,
  limit = 5,
  windowSeconds = 60,
): Promise<RateLimitResult> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN

  if (redisUrl && redisToken) {
    try {
      const redisKey = `rl:auth:${key}`
      const res = await fetch(`${redisUrl.replace(/\/$/, '')}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${redisToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          ['INCR', redisKey],
          ['EXPIRE', redisKey, String(windowSeconds), 'NX'],
          ['TTL', redisKey],
        ]),
        signal: AbortSignal.timeout(1500),
      })

      if (res.ok) {
        const data = (await res.json()) as Array<{ result?: number }>
        const count = Number(data[0]?.result ?? 1)
        const ttl = Number(data[2]?.result ?? windowSeconds)
        const resetAt = Date.now() + Math.max(ttl, 1) * 1000
        return {
          allowed: count <= limit,
          remaining: Math.max(limit - count, 0),
          resetAt,
        }
      }
    } catch (err) {
      console.warn('[rate-limit] Redis unavailable, falling back to in-memory limiter:', err)
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
    return { allowed: true, remaining: limit - 1, resetAt }
  }

  existing.count += 1
  return {
    allowed: existing.count <= limit,
    remaining: Math.max(limit - existing.count, 0),
    resetAt: existing.resetAt,
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
