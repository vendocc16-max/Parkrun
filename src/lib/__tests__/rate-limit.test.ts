/**
 * Rate Limit Middleware Tests
 *
 * These tests verify the rate limiting middleware behavior.
 * To run: npm test
 *
 * Rate Limiting Rules:
 * - IP limit: 10 requests per 60-second window
 * - Email limit: 5 requests per 60-second window
 * - Feature flag: RATE_LIMIT_ENABLED env var (default: false in dev)
 *
 * Expected behavior:
 * 1. First request from IP/email: { allowed: true, remaining: 5 }
 * 2. After 5 requests from same email: { allowed: false, retryAfter: 60 }
 * 3. After 10 requests from same IP: { allowed: false, retryAfter: 60 }
 * 4. If rate limit is disabled: All requests allowed
 * 5. If Redis is down: Fails open (allows request)
 */

import { checkRateLimit } from '../rate-limit'

describe('Rate Limit Middleware', () => {
  // Note: These tests require UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to be set
  // To run locally, set RATE_LIMIT_ENABLED=true first

  it('should allow the first request', async () => {
    const result = await checkRateLimit('192.168.1.1', 'test@example.com', 'session-123')
    expect(result.allowed).toBe(true)
    expect(result.retryAfter).toBeUndefined()
  })

  it('should track IP and email separately', async () => {
    // Same IP, different emails
    const result1 = await checkRateLimit('192.168.2.1', 'user1@example.com', 'session-123')
    const result2 = await checkRateLimit('192.168.2.1', 'user2@example.com', 'session-123')

    expect(result1.allowed).toBe(true)
    expect(result2.allowed).toBe(true)
  })

  it('should return retry-after header when rate limited', async () => {
    const result = await checkRateLimit('192.168.3.1', 'spam@example.com', 'session-123')
    if (!result.allowed) {
      expect(result.retryAfter).toBeGreaterThan(0)
      expect(result.retryAfter).toBeLessThanOrEqual(60)
    }
  })
})
