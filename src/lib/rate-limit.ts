import { Redis } from '@upstash/redis'
import { createAdminClient } from '@/lib/supabase/admin'
import type { InsertRateLimitEvent } from '../../supabase/types'

// Rate limiting configuration
const WINDOW_SECONDS = 60 // 1-minute rolling window
const IP_LIMIT = 10 // 10 requests per IP per window
const EMAIL_LIMIT = 5 // 5 requests per email per window

interface RateLimitResult {
  allowed: boolean
  retryAfter?: number
  remaining?: number
}

/**
 * Initialize Upstash Redis client
 * Requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN env vars
 */
function getRedisClient(): Redis {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    throw new Error('Missing Upstash Redis environment variables')
  }

  return new Redis({ url, token })
}

/**
 * Check rate limit for an IP and email combination
 * Uses Redis for fast, distributed rate limiting with a rolling window
 * Logs all attempts to rate_limit_events table for audit trail
 */
export async function checkRateLimit(
  ip: string,
  email: string,
  sessionId?: string,
): Promise<RateLimitResult> {
  const redis = getRedisClient()

  // Check if rate limiting is disabled
  if (process.env.RATE_LIMIT_ENABLED === 'false') {
    return { allowed: true }
  }

  // Create keys for rolling window (IP and email both tracked separately)
  const ipKey = `ratelimit:ip:${ip}`
  const emailKey = `ratelimit:email:${email}`

  try {
    // Get current counts from Redis
    const ipCountData = await redis.get(ipKey)
    const emailCountData = await redis.get(emailKey)

    const ipCount = typeof ipCountData === 'number' ? ipCountData : 0
    const emailCount = typeof emailCountData === 'number' ? emailCountData : 0

    // Calculate remaining quota
    const ipRemaining = IP_LIMIT - ipCount
    const emailRemaining = EMAIL_LIMIT - emailCount

    // Determine if request is allowed (must pass both checks)
    const ipAllowed = ipCount < IP_LIMIT
    const emailAllowed = emailCount < EMAIL_LIMIT
    const allowed = ipAllowed && emailAllowed

    // Calculate retry-after (highest TTL between the two)
    let retryAfter: number | undefined
    if (!allowed) {
      const ipTTL = await redis.ttl(ipKey)
      const emailTTL = await redis.ttl(emailKey)
      retryAfter = Math.max(
        ipTTL > 0 ? ipTTL : WINDOW_SECONDS,
        emailTTL > 0 ? emailTTL : WINDOW_SECONDS,
      )
    }

    // Increment counters if allowed
    if (allowed) {
      await Promise.all([
        redis.incr(ipKey),
        redis.incr(emailKey),
      ])
      // Set expiration on first increment
      if (ipCount === 0) {
        await redis.expire(ipKey, WINDOW_SECONDS)
      }
      if (emailCount === 0) {
        await redis.expire(emailKey, WINDOW_SECONDS)
      }
    }

    // Log the attempt to database (fire-and-forget)
    logRateLimitEvent(ip, sessionId, allowed).catch((err) => {
      console.error('Failed to log rate limit event:', err)
    })

    return {
      allowed,
      retryAfter,
      remaining: Math.min(ipRemaining, emailRemaining),
    }
  } catch (error) {
    console.error('Rate limit check failed:', error)
    // Fail open - allow request if Redis is down
    logRateLimitEvent(ip, sessionId, true).catch((err) => {
      console.error('Failed to log rate limit event:', err)
    })
    return { allowed: true }
  }
}

/**
 * Log rate limit event to database for audit trail
 * Runs asynchronously and doesn't block the request
 */
async function logRateLimitEvent(
  ip: string,
  sessionId: string | undefined,
  allowed: boolean,
): Promise<void> {
  const adminClient = createAdminClient()

  const event: InsertRateLimitEvent = {
    ip_address: ip || null,
    event_type: allowed ? 'registration_attempt' : 'registration_attempt_blocked',
    session_id: sessionId || null,
  }

  // Insert event - if it fails, we log but don't throw
  const { error } = await adminClient.from('rate_limit_events').insert(event)

  if (error) {
    console.error('Failed to insert rate limit event:', error)
  }
}
