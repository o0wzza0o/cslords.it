/**
 * Server Action Rate Limiter with Sliding Window logic.
 * Supports Upstash Redis if env vars exist, with safe In-Memory fallback.
 */

// In-Memory sliding window rate limiter cache
const inMemoryStore = new Map<string, { count: number; resetTime: number }>()

export interface RateLimitResult<T> {
  success: boolean
  data?: T
  error?: string
  retryAfter?: number
}

/**
 * Wraps a Server Action execution with Rate Limiting protection.
 *
 * @param fn The target server action function
 * @param identifier User ID or IP Address identifier
 * @param limit Maximum allowed requests in the time window (default 60)
 * @param windowMs Time window in milliseconds (default 60000ms = 1 min)
 */
export async function withRateLimit<T>(
  fn: () => Promise<T>,
  identifier: string,
  limit: number = 60,
  windowMs: number = 60000
): Promise<RateLimitResult<T>> {
  const now = Date.now()
  const key = `ratelimit:${identifier}`

  // Check Upstash Redis configuration if available
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN

  if (upstashUrl && upstashToken) {
    try {
      // Dynamic import if installed or REST HTTP fetch fallback
      const res = await fetch(`${upstashUrl}/incr/${key}`, {
        headers: { Authorization: `Bearer ${upstashToken}` },
      })
      const { result: current } = await res.json()

      if (current === 1) {
        await fetch(`${upstashUrl}/expire/${key}/${Math.ceil(windowMs / 1000)}`, {
          headers: { Authorization: `Bearer ${upstashToken}` },
        })
      }

      if (current > limit) {
        return {
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil(windowMs / 1000),
        }
      }
    } catch (redisError) {
      console.warn('[RateLimit] Upstash Redis request failed, using in-memory fallback:', redisError)
    }
  }

  // --- In-Memory Fallback ---
  const record = inMemoryStore.get(key)

  if (!record || now > record.resetTime) {
    inMemoryStore.set(key, { count: 1, resetTime: now + windowMs })
  } else {
    record.count += 1
    if (record.count > limit) {
      const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000)
      return {
        success: false,
        error: `Rate limit exceeded. Too many requests. Please wait ${retryAfterSeconds} seconds.`,
        retryAfter: retryAfterSeconds,
      }
    }
  }

  try {
    const data = await fn()
    return { success: true, data }
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'An unexpected error occurred during operation execution.',
    }
  }
}
