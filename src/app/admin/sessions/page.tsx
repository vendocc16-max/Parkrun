import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import type { Session, SessionStatus } from '../../../../supabase/types'

export const metadata = { title: 'Sessions | Parkrun Admin' }

const STATUS_STYLES: Record<SessionStatus, string> = {
  draft: 'bg-gray-100 text-gray-600',
  published: 'bg-green-100 text-green-700',
  full: 'bg-blue-100 text-blue-700',
  closed: 'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-red-100 text-red-700',
}

type SessionWithCounts = Session & { confirmedCount: number; waitlistCount: number }

export default async function SessionsPage() {
  const adminClient = createAdminClient()

  const [{ data: sessions }, { data: regCounts }] = await Promise.all([
    adminClient.from('sessions').select('*').order('event_date', { ascending: false }),
    adminClient
      .from('registrations')
      .select('session_id, status')
      .in('status', ['confirmed', 'waitlisted']),
  ])

  const countMap = new Map<string, { confirmed: number; waitlisted: number }>()
  for (const r of regCounts ?? []) {
    const entry = countMap.get(r.session_id) ?? { confirmed: 0, waitlisted: 0 }
    if (r.status === 'confirmed') entry.confirmed++
    else if (r.status === 'waitlisted') entry.waitlisted++
    countMap.set(r.session_id, entry)
  }

  const sessionsWithCounts: SessionWithCounts[] = (sessions ?? []).map((s) => ({
    ...s,
    confirmedCount: countMap.get(s.id)?.confirmed ?? 0,
    waitlistCount: countMap.get(s.id)?.waitlisted ?? 0,
  }))

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sessions</h1>
          <p className="text-gray-500 mt-1">{sessionsWithCounts.length} sessions total</p>
        </div>
        <Link
          href="/admin/sessions/new"
          className="rounded-md bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 transition-colors"
        >
          + New session
        </Link>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
        {sessionsWithCounts.length === 0 ? (
          <p className="px-6 py-8 text-sm text-gray-500 text-center">
            No sessions yet.{' '}
            <Link href="/admin/sessions/new" className="text-green-700 hover:underline">
              Create the first one.
            </Link>
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Title</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Registrations</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Waitlist</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sessionsWithCounts.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{s.title}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(s.event_date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[s.status]}`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {s.confirmedCount} / {s.capacity}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {s.waitlist_enabled ? s.waitlistCount : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/sessions/${s.id}`}
                        className="text-green-700 hover:underline text-xs font-medium"
                      >
                        View
                      </Link>
                      <Link
                        href={`/admin/sessions/${s.id}/edit`}
                        className="text-gray-500 hover:underline text-xs font-medium"
                      >
                        Edit
                      </Link>
                    </div>
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
