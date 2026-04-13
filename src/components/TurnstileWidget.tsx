'use client'

import { useCallback } from 'react'
import Turnstile from 'react-turnstile'

interface TurnstileWidgetProps {
  onVerify: (token: string) => void
  onError?: () => void
}

export default function TurnstileWidget({ onVerify, onError }: TurnstileWidgetProps) {
  const handleVerify = useCallback(
    (token: string) => {
      onVerify(token)
    },
    [onVerify],
  )

  const handleError = useCallback(() => {
    if (onError) {
      onError()
    }
  }, [onError])

  const handleExpire = useCallback(() => {
    if (onError) {
      onError()
    }
  }, [onError])

  return (
    <div className="flex justify-center py-4">
      <Turnstile
        sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''}
        onVerify={handleVerify}
        onError={handleError}
        onExpire={handleExpire}
        theme="light"
        size="normal"
      />
    </div>
  )
}
