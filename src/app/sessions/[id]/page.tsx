import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Session } from '../../../../supabase/types'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id: slug } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('sessions').select('title').eq('slug', slug).single()
  const session = data as Pick<Session, 'title'> | null
  return {
    title: session ? `${session.title} | Parkrun Registration` : 'Session | Parkrun Registration',
  }
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getRegistrationState(session: Session, confirmedCount: number) {
  const now = new Date()
  const eventDate = new Date(session.event_date)

  if (session.status === 'cancelled' || session.status === 'draft') return 'unavailable'
  if (session.status === 'closed' || eventDate <= now) return 'closed'
  if (session.registration_closes_at && new Date(session.registration_closes_at) < now)
    return 'closed'
  if (session.registration_opens_at && new Date(session.registration_opens_at) > now)
    return 'not_open_yet'
  if (session.status === 'full') return session.waitlist_enabled ? 'waitlist' : 'full_no_waitlist'
  return 'open'
}

export default async function SessionDetailPage({ params }: Props) {
  const { id: slug } = await params
  const supabase = await createClient()

  const { data, error } = await supabase.from('sessions').select('*').eq('slug', slug).single()

  const session = data as Session | null

  if (error || !session || session.status === 'draft' || session.status === 'cancelled') {
    notFound()
  }

  const { data: countData } = await supabase.rpc('get_session_confirmed_count', {
    p_session_id: session.id,
  })
  const confirmedCount = (countData as number | null) ?? 0
  const spotsLeft = Math.max(0, session.capacity - confirmedCount)
  const registrationState = getRegistrationState(session, confirmedCount)

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
      <nav className="mb-6 text-sm text-gray-500">
        <Link href="/sessions" className="hover:text-gray-700 transition-colors">
          ← Back to sessions
        </Link>
      </nav>

      {/* Session header */}
      <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{session.title}</h1>
          </div>
          <div className="flex gap-2">
            {session.status === 'full' ? (
              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                Full
              </span>
            ) : session.status === 'closed' ? (
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                Closed
              </span>
            ) : (
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                Open
              </span>
            )}
            {session.status === 'full' && session.waitlist_enabled && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                Waitlist available
              </span>
            )}
          </div>
        </div>

        {session.description && (
          <p className="mt-4 text-gray-600 leading-relaxed">{session.description}</p>
        )}

        <dl className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="font-medium text-gray-700">Date &amp; time</dt>
            <dd className="text-gray-500 mt-0.5">{formatDateTime(session.event_date)}</dd>
          </div>
          {session.location && (
            <div>
              <dt className="font-medium text-gray-700">Location</dt>
              <dd className="text-gray-500 mt-0.5">📍 {session.location}</dd>
            </div>
          )}
          <div>
            <dt className="font-medium text-gray-700">Capacity</dt>
            <dd className="text-gray-500 mt-0.5">
              {session.status === 'full'
                ? `${session.capacity} participants (full)`
                : `${session.capacity} total · ${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} remaining`}
            </dd>
          </div>
          {session.registration_closes_at && (
            <div>
              <dt className="font-medium text-gray-700">Registration closes</dt>
              <dd className="text-gray-500 mt-0.5">
                {formatDate(session.registration_closes_at)}
              </dd>
            </div>
          )}
          {session.registration_opens_at && (
            <div>
              <dt className="font-medium text-gray-700">Registration opens</dt>
              <dd className="text-gray-500 mt-0.5">
                {formatDate(session.registration_opens_at)}
              </dd>
            </div>
          )}
        </dl>

        {session.pricing_info && (
          <div className="mt-6 border-t border-gray-100 pt-6">
            <h2 className="font-medium text-gray-700 mb-2">Pricing</h2>
            <p className="text-sm text-gray-500">{session.pricing_info}</p>
          </div>
        )}

        {session.notes && (
          <div className="mt-6 border-t border-gray-100 pt-6">
            <h2 className="font-medium text-gray-700 mb-2">Notes</h2>
            <p className="text-sm text-gray-500 leading-relaxed">{session.notes}</p>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="flex flex-col sm:flex-row gap-4">
        {registrationState === 'open' && (
          <Link
            href={`/sessions/${slug}/register`}
            className="flex-1 rounded-md bg-green-700 px-6 py-3 text-center text-base font-semibold text-white hover:bg-green-800 transition-colors"
          >
            Register now
          </Link>
        )}
        {registrationState === 'waitlist' && (
          <Link
            href={`/sessions/${slug}/register`}
            className="flex-1 rounded-md bg-amber-600 px-6 py-3 text-center text-base font-semibold text-white hover:bg-amber-700 transition-colors"
          >
            Join waitlist
          </Link>
        )}
        {(registrationState === 'closed' || registrationState === 'full_no_waitlist') && (
          <div className="flex-1 rounded-md bg-gray-100 px-6 py-3 text-center text-base font-semibold text-gray-500 cursor-not-allowed">
            Registration closed
          </div>
        )}
        {registrationState === 'not_open_yet' && (
          <div className="flex-1 rounded-md bg-gray-100 px-6 py-3 text-center text-base font-semibold text-gray-500 cursor-not-allowed">
            Registration not yet open
          </div>
        )}
        <Link
          href="/sessions"
          className="flex-1 rounded-md border border-gray-300 px-6 py-3 text-center text-base font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Browse other sessions
        </Link>
      </div>
    </div>
  )
}
