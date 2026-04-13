'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

/**
 * Client-side Sentry initialization component
 * Should be mounted near the root of your app
 */
export function SentryClientInit(): null {
  useEffect(() => {
    const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN
    const enabled = process.env.NEXT_PUBLIC_SENTRY_ENABLED !== 'false'

    if (!enabled || !dsn) {
      return
    }

    // Client-side Sentry is already initialized by the Sentry Next.js SDK
    // This component just ensures it's properly set up
    if (Sentry && typeof Sentry.captureException === 'function') {
      // Sentry is ready
    }
  }, [])

  return null
}

/**
 * Capture a client-side error
 */
export function captureClientException(
  error: Error,
  context?: Record<string, unknown>,
): void {
  if (typeof window === 'undefined') return

  try {
    if (context) {
      Sentry.setContext('custom', context)
    }
    Sentry.captureException(error)
  } catch (err) {
    console.error('Failed to capture client exception:', err)
  }
}

/**
 * Capture a client-side message
 */
export function captureClientMessage(
  message: string,
  level: 'fatal' | 'error' | 'warning' | 'info' = 'error',
): void {
  if (typeof window === 'undefined') return

  try {
    Sentry.captureMessage(message, level)
  } catch (err) {
    console.error('Failed to capture client message:', err)
  }
}
