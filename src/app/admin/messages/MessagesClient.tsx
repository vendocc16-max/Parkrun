'use client'

import { useState, useTransition, useEffect } from 'react'
import type { Session, OutboundMessage } from '../../../../supabase/types'
import { getRecipientCount, getMessageHistory, sendMessage } from './actions'

type Props = {
  sessions: Session[]
  initialSessionId?: string
}

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  queued: 'bg-yellow-100 text-yellow-700',
  sending: 'bg-blue-100 text-blue-700',
  sent: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
}

export function MessagesClient({ sessions, initialSessionId }: Props) {
  const firstSessionId = initialSessionId ?? sessions[0]?.id ?? ''

  const [sessionId, setSessionId] = useState(firstSessionId)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [targetStatus, setTargetStatus] = useState('confirmed')
  const [recipientCount, setRecipientCount] = useState<number | null>(null)
  const [history, setHistory] = useState<OutboundMessage[]>([])
  const [sendResult, setSendResult] = useState<{ ok?: boolean; error?: string } | null>(null)

  const [countPending, startCountTransition] = useTransition()
  const [historyPending, startHistoryTransition] = useTransition()
  const [sendPending, startSendTransition] = useTransition()

  // Load recipient count and history when session or status filter changes
  useEffect(() => {
    if (!sessionId) return
    startCountTransition(async () => {
      const count = await getRecipientCount(sessionId, targetStatus)
      setRecipientCount(count)
    })
    startHistoryTransition(async () => {
      const msgs = await getMessageHistory(sessionId)
      setHistory(msgs)
    })
  }, [sessionId, targetStatus])

  const handleSend = () => {
    if (!sessionId || !subject.trim() || !body.trim()) return
    setSendResult(null)
    startSendTransition(async () => {
      const result = await sendMessage({ sessionId, subject, body, targetStatus })
      if (result.error) {
        setSendResult({ error: result.error })
      } else {
        setSendResult({ ok: true })
        setSubject('')
        setBody('')
        // Refresh history
        const msgs = await getMessageHistory(sessionId)
        setHistory(msgs)
      }
    })
  }

  return (
    <div className="space-y-8">
      {/* Compose form */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900 mb-5">Compose message</h2>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Session</label>
              <select
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
              >
                {sessions.length === 0 && <option value="">No sessions available</option>}
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Send to
              </label>
              <select
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
              >
                <option value="confirmed">Confirmed registrations</option>
                <option value="waitlisted">Waitlisted registrations</option>
                <option value="all">All registrations</option>
              </select>
            </div>
          </div>

          {/* Recipient preview */}
          <div className="rounded-md bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm text-gray-600">
            {countPending ? (
              'Calculating recipients…'
            ) : recipientCount !== null ? (
              <span>
                <span className="font-semibold text-gray-900">{recipientCount}</span>{' '}
                recipient{recipientCount !== 1 ? 's' : ''} will receive this message
              </span>
            ) : (
              'Select a session to see recipient count'
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Reminder: Parkrun session this Saturday"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              rows={6}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message here…"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>

          {sendResult?.error && (
            <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {sendResult.error}
            </div>
          )}
          {sendResult?.ok && (
            <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
              Message queued for delivery successfully.
            </div>
          )}

          <div>
            <button
              onClick={handleSend}
              disabled={sendPending || !sessionId || !subject.trim() || !body.trim()}
              className="rounded-md bg-green-700 px-5 py-2 text-sm font-semibold text-white hover:bg-green-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {sendPending ? 'Sending…' : 'Send message'}
            </button>
          </div>
        </div>
      </div>

      {/* Message history */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-4">Message history</h2>
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
          {historyPending ? (
            <p className="px-6 py-6 text-sm text-gray-400 text-center">Loading…</p>
          ) : history.length === 0 ? (
            <p className="px-6 py-8 text-sm text-gray-500 text-center">
              No messages sent for this session yet.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Subject</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Sent at</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.map((msg) => (
                  <tr key={msg.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-900">{msg.subject}</td>
                    <td className="px-4 py-3 text-gray-500">{msg.message_type}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[msg.status] ?? 'bg-gray-100 text-gray-600'}`}
                      >
                        {msg.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {msg.sent_at ? new Date(msg.sent_at).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
