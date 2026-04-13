import * as Sentry from '@sentry/nextjs'

export interface SentryContext {
  userId?: string
  userEmail?: string
  sessionId?: string
  organizerId?: string
  requestPath?: string
  requestMethod?: string
  [key: string]: string | number | boolean | undefined | null
}

/**
 * Initialize Sentry (server-side only)
 */
export function initSentry() {
  if (typeof window !== 'undefined') return

  const dsn = process.env.SENTRY_DSN
  const environment = process.env.SENTRY_ENVIRONMENT || 'development'
  const enabled = process.env.SENTRY_ENABLED !== 'false'

  if (!enabled || !dsn) {
    return
  }

  Sentry.init({
    dsn,
    environment,
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
    beforeSend(event) {
      // Filter out known non-critical errors
      let message = ''

      // Extract message from event safely
      try {
        const eventRecord = event as unknown as Record<string, unknown>
        const msgField = eventRecord.message as string | undefined
        const exceptionField = eventRecord.exception as unknown
        if (msgField) {
          message = msgField
        } else if (exceptionField) {
          const exceptionRecord = exceptionField as Record<string, unknown>
          const values = exceptionRecord.values as Array<Record<string, unknown>> | undefined
          const firstException = values?.[0] as Record<string, unknown> | undefined
          const value = firstException?.value as string | undefined
          if (value) message = value
        }
      } catch {
        // Fallback to empty message
      }

      // Skip 404 errors on prefetch requests
      if (message.includes('404') && event.request?.url?.includes('_next')) {
        return null
      }

      // Skip CORS preflights
      if (message.includes('CORS') || message.includes('Cross-Origin')) {
        return null
      }

      // Sanitize sensitive data
      if (event.request?.cookies) {
        delete event.request.cookies
      }

      return event
    },
  })
}

/**
 * Capture an exception with context
 */
export function captureException(error: Error, context?: SentryContext): void {
  if (!process.env.SENTRY_ENABLED || process.env.SENTRY_ENABLED === 'false') {
    console.error('Sentry Error:', error.message, context)
    return
  }

  try {
    if (context) {
      Sentry.setContext('custom', context as Record<string, unknown>)
      if (context.userEmail) {
        Sentry.setUser({ email: context.userEmail, id: context.userId })
      }
    }
    Sentry.captureException(error)
  } catch (err) {
    console.error('Failed to capture exception:', err)
  }
}

/**
 * Capture a message with severity level
 */
export function captureMessage(
  message: string,
  level: 'fatal' | 'error' | 'warning' | 'info' = 'error',
): void {
  if (!process.env.SENTRY_ENABLED || process.env.SENTRY_ENABLED === 'false') {
    console.log(`Sentry [${level}]:`, message)
    return
  }

  try {
    Sentry.captureMessage(message, level)
  } catch (err) {
    console.error('Failed to capture message:', err)
  }
}

/**
 * Add breadcrumb for tracking non-error events
 */
export function addBreadcrumb(
  message: string,
  data?: Record<string, unknown>,
  category: string = 'custom',
): void {
  if (!process.env.SENTRY_ENABLED || process.env.SENTRY_ENABLED === 'false') {
    return
  }

  try {
    Sentry.addBreadcrumb({
      message,
      data,
      category,
      level: 'info',
    })
  } catch (err) {
    console.error('Failed to add breadcrumb:', err)
  }
}

/**
 * Set user context for subsequent events
 */
export function setUserContext(userId?: string, userEmail?: string): void {
  if (!process.env.SENTRY_ENABLED || process.env.SENTRY_ENABLED === 'false') {
    return
  }

  try {
    if (userId || userEmail) {
      Sentry.setUser({ id: userId, email: userEmail })
    } else {
      Sentry.setUser(null)
    }
  } catch (err) {
    console.error('Failed to set user context:', err)
  }
}

/**
 * Sanitize sensitive data from object
 */
export function sanitizeForSentry(obj: unknown): unknown {
  if (!obj) return obj

  const sanitized = { ...obj }
  const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'authorization']

  const walk = (o: Record<string, unknown>) => {
    for (const key in o) {
      if (sensitiveKeys.some((k) => key.toLowerCase().includes(k.toLowerCase()))) {
        o[key] = '[REDACTED]'
      } else if (typeof o[key] === 'object' && o[key] !== null) {
        walk(o[key] as Record<string, unknown>)
      }
    }
  }

  walk(sanitized as Record<string, unknown>)
  return sanitized
}
