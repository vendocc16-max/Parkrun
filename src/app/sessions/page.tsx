import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Session } from '../../../supabase/types'

export const metadata = {
  title: 'Sessions | Parkrun Registration',
  description: 'Browse upcoming Parkrun sessions and secure your spot',
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function CapacityBadge({
  session,
  confirmedCount,
}: {
  session: Session
  confirmedCount: number
}) {
  if (session.status === 'full') {
    return (
      <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
        Full
      </span>
    )
  }
  return (
    <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
      Open
    </span>
  )
}

function spotsLabel(session: Session, confirmedCount: number) {
  if (session.status === 'full') {
    return session.waitlist_enabled ? 'Waitlist available' : 'No spots remaining'
  }
  const spotsLeft = Math.max(0, session.capacity - confirmedCount)
  return spotsLeft === 1 ? '1 spot remaining' : `${spotsLeft} spots remaining`
}

export default async function SessionsPage() {
  const supabase = await createClient()

  const { data: sessionsData, error } = await supabase
    .from('sessions')
    .select('*')
    .in('status', ['published', 'full'])
    .order('event_date', { ascending: true })

  const sessions = (sessionsData ?? []) as Session[]

  if (error) {
    console.error('Failed to fetch sessions:', error)
  }

  const confirmedCounts = await Promise.all(
    sessions.map(async (s) => {
      const { data } = await supabase.rpc('get_session_confirmed_count', {
        p_session_id: s.id,
      })
      return (data as number | null) ?? 0
    }),
  )

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Upcoming sessions</h1>
        <p className="mt-2 text-gray-500">
          Browse available Parkrun events and register your group.
        </p>
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-8 py-16 text-center">
          <span className="text-4xl">🏃</span>
          <p className="mt-4 text-lg font-semibold text-gray-700">No sessions available</p>
          <p className="mt-2 text-sm text-gray-500">
            Check back soon — new sessions are added regularly.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session, i) => {
            const confirmed = confirmedCounts[i] ?? 0
            const isFull = session.status === 'full'
            return (
              <div
                key={session.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h2 className="text-lg font-semibold text-gray-900 truncate">
                      {session.title}
                    </h2>
                    <CapacityBadge session={session} confirmedCount={confirmed} />
                  </div>
                  <p className="text-sm text-gray-500">{formatDate(session.event_date)}</p>
                  {session.location && (
                    <p className="text-sm text-gray-500">📍 {session.location}</p>
                  )}
                  <p className="text-sm text-gray-400 mt-1">
                    {spotsLabel(session, confirmed)}
                  </p>
                </div>
                <Link
                  href={`/sessions/${session.slug}`}
                  className={`shrink-0 inline-block rounded-md px-5 py-2.5 text-sm font-semibold text-center transition-colors ${
                    isFull
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-green-700 text-white hover:bg-green-800'
                  }`}
                >
                  {isFull ? 'Join waitlist' : 'View & register'}
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
