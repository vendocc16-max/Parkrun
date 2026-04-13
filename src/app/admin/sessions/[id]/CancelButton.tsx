'use client'

import { useState, useTransition } from 'react'
import { cancelRegistration } from './actions'

export function CancelButton({
  registrationId,
  currentStatus,
}: {
  registrationId: string
  currentStatus: string
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [cancelled, setCancelled] = useState(false)

  if (currentStatus === 'cancelled' || cancelled) {
    return <span className="text-xs text-gray-400">Cancelled</span>
  }

  const handleCancel = () => {
    if (!confirm('Cancel this registration?')) return
    startTransition(async () => {
      const result = await cancelRegistration(registrationId)
      if (result.error) {
        setError(result.error)
      } else {
        setCancelled(true)
      }
    })
  }

  return (
    <div>
      <button
        onClick={handleCancel}
        disabled={isPending}
        className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? 'Cancelling…' : 'Cancel'}
      </button>
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  )
}
