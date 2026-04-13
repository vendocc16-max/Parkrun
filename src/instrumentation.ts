import * as Sentry from '@sentry/nextjs'

/**
 * Instrumentation hook for Sentry initialization
 * Next.js calls this automatically during build time and at runtime
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
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
        const message = event.message || (event.exception?.values?.[0]?.value as string | undefined) || ''

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
}
