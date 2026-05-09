'use client'

import { useState, useTransition } from 'react'
import { bulkCancelRegistrations } from './actions'
import type { RegistrationStatus } from '../../../../supabase/types'

type RowData = {
  id: string
  registration_number: string | null
  status: RegistrationStatus
  created_at: string
  participants: { first_name: string; last_name: string } | null
  guardians: { email: string } | null
  sessions: { title: string } | null
}

const STATUS_STYLES: Record<RegistrationStatus, string> = {
  confirmed: 'bg-park-lime text-park-green',
  cancelled: 'bg-red-100 text-red-700',
  waitlisted: 'bg-yellow-100 text-yellow-700',
  duplicate_flagged: 'bg-orange-100 text-orange-700',
  blocked: 'bg-park-cream text-park-muted',
}

export function RegistrationsTable({ rows }: { rows: RowData[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()
  const [actionError, setActionError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const allCancellable = rows.filter((r) => r.status !== 'cancelled')
  const allSelected =
    allCancellable.length > 0 && allCancellable.every((r) => selected.has(r.id))

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(allCancellable.map((r) => r.id)))
    }
  }

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleBulkCancel = () => {
    if (selected.size === 0) return
    if (!confirm(`Cancel ${selected.size} selected registration(s)?`)) return
    setActionError(null)
    setSuccessMsg(null)
    startTransition(async () => {
      const result = await bulkCancelRegistrations(Array.from(selected))
      if (result.error) {
        setActionError(result.error)
      } else {
        setSuccessMsg(`${result.count ?? selected.size} registration(s) cancelled.`)
        setSelected(new Set())
      }
    })
  }

  return (
    <div>
      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-md bg-yellow-50 border border-yellow-200 px-4 py-2.5">
          <span className="text-sm text-yellow-800 font-medium">
            {selected.size} selected
          </span>
          <button
            onClick={handleBulkCancel}
            disabled={isPending}
            className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition-[background-color,border-color,color,box-shadow,opacity] disabled:opacity-60"
          >
            {isPending ? 'Cancelling…' : 'Cancel selected'}
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="text-xs text-park-muted hover:underline"
          >
            Clear
          </button>
        </div>
      )}

      {actionError && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}
      {successMsg && (
        <div className="mb-4 rounded-md bg-park-lime border border-park-green/20 px-4 py-3 text-sm text-park-green">
          {successMsg}
        </div>
      )}

      <div className="rounded-lg border border-park-border bg-park-white overflow-hidden shadow-sm">
        {rows.length === 0 ? (
          <p className="px-6 py-8 text-sm text-park-muted text-center">
            No registrations match your filters.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-park-cream border-b border-park-border">
              <tr>
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-park-border text-park-green focus:ring-park-green/20"
                  />
                </th>
                <th className="px-4 py-3 text-left font-medium text-park-muted">Reg #</th>
                <th className="px-4 py-3 text-left font-medium text-park-muted">Participant</th>
                <th className="px-4 py-3 text-left font-medium text-park-muted">Guardian email</th>
                <th className="px-4 py-3 text-left font-medium text-park-muted">Session</th>
                <th className="px-4 py-3 text-left font-medium text-park-muted">Status</th>
                <th className="px-4 py-3 text-left font-medium text-park-muted">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-park-border">
              {rows.map((reg) => (
                <tr
                  key={reg.id}
                  className={`hover:bg-park-cream transition-[background-color,border-color,color,box-shadow,opacity] ${selected.has(reg.id) ? 'bg-yellow-50' : ''}`}
                >
                  <td className="px-4 py-3">
                    {reg.status !== 'cancelled' && (
                      <input
                        type="checkbox"
                        checked={selected.has(reg.id)}
                        onChange={() => toggle(reg.id)}
                        className="h-4 w-4 rounded border-park-border text-park-green focus:ring-park-green/20"
                      />
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-park-muted">
                    {reg.registration_number ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-park-dark">
                    {reg.participants
                      ? `${reg.participants.first_name} ${reg.participants.last_name}`
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-park-muted">{reg.guardians?.email ?? '—'}</td>
                  <td className="px-4 py-3 text-park-muted">{reg.sessions?.title ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[reg.status]}`}
                    >
                      {reg.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-park-muted">
                    {new Date(reg.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
