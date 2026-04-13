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
    <div className="min-h-screen bg-park-cream">
      {/* Session hero header */}
      <div className="bg-park-dark px-4 pt-10 pb-14">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/sessions"
            className="inline-flex items-center gap-1.5 text-park-muted hover:text-park-lime transition-colors text-sm mb-6"
          >
            <span aria-hidden="true">←</span> All sessions
          </Link>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-park-white uppercase leading-tight">
                {session.title}
              </h1>
            </div>
            <div className="flex gap-2 pt-1">
              {session.status === 'full' ? (
                <span className="rounded-full bg-park-muted/20 px-3 py-1 text-xs font-semibold text-park-muted uppercase tracking-wide">
                  Full
                </span>
              ) : session.status === 'closed' ? (
                <span className="rounded-full bg-park-muted/20 px-3 py-1 text-xs font-semibold text-park-muted uppercase tracking-wide">
                  Closed
                </span>
              ) : (
                <span className="rounded-full bg-park-lime/20 px-3 py-1 text-xs font-semibold text-park-lime uppercase tracking-wide">
                  Open
                </span>
              )}
              {session.status === 'full' && session.waitlist_enabled && (
                <span className="rounded-full bg-amber-400/20 px-3 py-1 text-xs font-semibold text-amber-300 uppercase tracking-wide">
                  Waitlist
                </span>
              )}
            </div>
          </div>

          {session.description && (
            <p className="mt-4 text-park-muted text-sm leading-relaxed max-w-xl">
              {session.description}
            </p>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 -mt-6 pb-16">
        {/* Info card */}
        <div className="rounded-xl bg-park-white border border-park-border shadow-sm overflow-hidden mb-5">
          <dl className="divide-y divide-park-border">
            <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-xs font-semibold text-park-muted uppercase tracking-wider pt-0.5">
                Date &amp; time
              </dt>
              <dd className="mt-1 sm:mt-0 sm:col-span-2 text-sm font-medium text-park-dark">
                {formatDateTime(session.event_date)}
              </dd>
            </div>

            {session.location && (
              <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-xs font-semibold text-park-muted uppercase tracking-wider pt-0.5">
                  Location
                </dt>
                <dd className="mt-1 sm:mt-0 sm:col-span-2 text-sm font-medium text-park-dark">
                  {session.location}
                </dd>
              </div>
            )}

            <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-xs font-semibold text-park-muted uppercase tracking-wider pt-0.5">
                Availability
              </dt>
              <dd className="mt-1 sm:mt-0 sm:col-span-2 text-sm">
                {session.status === 'full' ? (
                  <span className="text-park-muted">
                    {session.capacity} capacity · Full
                  </span>
                ) : (
                  <span className="text-park-dark">
                    <span className="font-semibold text-park-green">{spotsLeft}</span>
                    {' '}of {session.capacity} spot{session.capacity === 1 ? '' : 's'} remaining
                  </span>
                )}
              </dd>
            </div>

            {session.registration_opens_at && (
              <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-xs font-semibold text-park-muted uppercase tracking-wider pt-0.5">
                  Reg. opens
                </dt>
                <dd className="mt-1 sm:mt-0 sm:col-span-2 text-sm text-park-dark">
                  {formatDate(session.registration_opens_at)}
                </dd>
              </div>
            )}

            {session.registration_closes_at && (
              <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-xs font-semibold text-park-muted uppercase tracking-wider pt-0.5">
                  Reg. closes
                </dt>
                <dd className="mt-1 sm:mt-0 sm:col-span-2 text-sm text-park-dark">
                  {formatDate(session.registration_closes_at)}
                </dd>
              </div>
            )}

            {session.pricing_info && (
              <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-xs font-semibold text-park-muted uppercase tracking-wider pt-0.5">
                  Pricing
                </dt>
                <dd className="mt-1 sm:mt-0 sm:col-span-2 text-sm text-park-dark">
                  {session.pricing_info}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Notes */}
        {session.notes && (
          <div className="rounded-xl bg-park-white border border-park-border p-6 mb-5">
            <h2 className="font-display font-bold text-sm uppercase tracking-wider text-park-muted mb-3">
              Notes
            </h2>
            <p className="text-sm text-park-dark leading-relaxed">{session.notes}</p>
          </div>
        )}

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3">
          {registrationState === 'open' && (
            <Link
              href={`/sessions/${slug}/register`}
              className="flex-1 rounded-full bg-park-lime px-6 py-3.5 text-center text-base font-semibold text-park-dark hover:bg-park-green hover:text-park-white transition-colors"
            >
              Register now →
            </Link>
          )}
          {registrationState === 'waitlist' && (
            <Link
              href={`/sessions/${slug}/register`}
              className="flex-1 rounded-full bg-amber-400 px-6 py-3.5 text-center text-base font-semibold text-park-dark hover:bg-amber-500 transition-colors"
            >
              Join waitlist →
            </Link>
          )}
          {(registrationState === 'closed' || registrationState === 'full_no_waitlist') && (
            <div className="flex-1 rounded-full bg-park-border px-6 py-3.5 text-center text-base font-semibold text-park-muted cursor-not-allowed">
              Registration closed
            </div>
          )}
          {registrationState === 'not_open_yet' && (
            <div className="flex-1 rounded-full bg-park-border px-6 py-3.5 text-center text-base font-semibold text-park-muted cursor-not-allowed">
              Registration not yet open
            </div>
          )}
          <Link
            href="/sessions"
            className="flex-1 rounded-full border border-park-border px-6 py-3.5 text-center text-base font-semibold text-park-dark hover:bg-park-white transition-colors"
          >
            Browse other sessions
          </Link>
        </div>
      </div>
    </div>
  )
}
