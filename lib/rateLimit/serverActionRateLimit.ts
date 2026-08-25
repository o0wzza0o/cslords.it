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

/**
 * Multi-Factor Rate Limiter (IP + Device Fingerprint + Target Email Account)
 * Blocks attackers EVEN IF they change IP / use VPN or switch devices.
 */
export async function withMultiFactorRateLimit<T>(
  fn: () => Promise<T>,
  ip: string,
  deviceFingerprint: string,
  targetEmail: string = '',
  limit: number = 5,
  windowMs: number = 900000 // 15 mins
): Promise<RateLimitResult<T>> {
  // 1. Check IP bucket
  const ipCheck = await withRateLimit(async () => true, `ip:${ip}`, limit, windowMs)
  if (!ipCheck.success) {
    return {
      success: false,
      error: 'حظر أمني: تم تجاوز الحد الأقصى للمحاولات من هذا العنوان (IP Rate Limit). برجاء الانتظار.',
      retryAfter: ipCheck.retryAfter,
    }
  }

  // 2. Check Device Fingerprint bucket (BLOCKS EVEN IF VPN / IP CHANGES)
  if (deviceFingerprint) {
    const fpCheck = await withRateLimit(async () => true, `fp:${deviceFingerprint}`, limit, windowMs)
    if (!fpCheck.success) {
      return {
        success: false,
        error: 'حظر أمني: تم رصد محاولات متكررة من هذا الجهاز (Device Fingerprint Rate Limit). برجاء الانتظار.',
        retryAfter: fpCheck.retryAfter,
      }
    }
  }

  // 3. Check Target Account bucket (BLOCKS EVEN IF IP AND DEVICE CHANGE)
  if (targetEmail) {
    const targetCheck = await withRateLimit(async () => true, `target:${targetEmail.toLowerCase().trim()}`, limit, windowMs)
    if (!targetCheck.success) {
      return {
        success: false,
        error: 'حظر أمني: تم حماية الحساب المستهدف لكثرة المحاولات الفاشلة. برجاء الانتظار.',
        retryAfter: targetCheck.retryAfter,
      }
    }
  }

  return fn()
}
