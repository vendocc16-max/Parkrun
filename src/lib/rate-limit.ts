import { createAdminClient } from '@/lib/supabase/admin'
import type { InsertRateLimitEvent } from '../../supabase/types'

// Rate limiting configuration
const WINDOW_SECONDS = 60 // 1-minute rolling window
const IP_LIMIT = 10 // 10 requests per IP per window

interface RateLimitResult {
  allowed: boolean
  retryAfter?: number
  remaining?: number
}

/**
 * Check rate limit for an IP address.
 * Disabled by default so registration does not depend on an extra service.
 * When enabled, it uses the existing Supabase audit table and fails open.
 */
export async function checkRateLimit(
  ip: string,
  _email: string,
  sessionId?: string,
): Promise<RateLimitResult> {
  if (process.env.RATE_LIMIT_ENABLED !== 'true') {
    return { allowed: true }
  }

  try {
    const ipAddress = ip || 'unknown'
    const adminClient = createAdminClient()
    const windowStart = new Date(Date.now() - WINDOW_SECONDS * 1000).toISOString()
    const { count, error } = await adminClient
      .from('rate_limit_events')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', ipAddress)
      .in('event_type', ['registration_attempt', 'registration_attempt_blocked'])
      .gte('created_at', windowStart)

    if (error) {
      console.error('Rate limit count failed:', error)
      return { allowed: true }
    }

    const attempts = count ?? 0
    const allowed = attempts < IP_LIMIT

    await logRateLimitEvent(ip, sessionId, allowed)

    return {
      allowed,
      retryAfter: allowed ? undefined : WINDOW_SECONDS,
      remaining: Math.max(0, IP_LIMIT - attempts - (allowed ? 1 : 0)),
    }
  } catch (error) {
    console.error('Rate limit check failed:', error)
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
    ip_address: ip || 'unknown',
    event_type: allowed ? 'registration_attempt' : 'registration_attempt_blocked',
    session_id: sessionId || null,
  }

  // Insert event - if it fails, we log but don't throw
  const { error } = await adminClient.from('rate_limit_events').insert(event)

  if (error) {
    console.error('Failed to insert rate limit event:', error)
  }
}
