import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EventMapLoader from '@/components/event-map-loader'
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
      <div className="surface-grid border-b border-park-border bg-park-cream px-4 pb-14 pt-10">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/sessions"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-park-muted transition-colors hover:text-park-dark"
          >
            <span aria-hidden="true">←</span> Alla evenemang
          </Link>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl font-semibold leading-tight tracking-tight text-park-dark sm:text-5xl">
                {session.title}
              </h1>
            </div>
            <div className="flex gap-2 pt-1">
              {session.status === 'full' ? (
                <span className="rounded-full bg-park-muted/10 px-3 py-1 text-xs font-semibold text-park-muted">
                  Fullbokad
                </span>
              ) : session.status === 'closed' ? (
                <span className="rounded-full bg-park-muted/10 px-3 py-1 text-xs font-semibold text-park-muted">
                  Stängd
                </span>
              ) : (
                <span className="rounded-full bg-park-lime px-3 py-1 text-xs font-semibold text-park-green">
                  Öppen
                </span>
              )}
              {session.status === 'full' && session.waitlist_enabled && (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                  Väntelista
                </span>
              )}
            </div>
          </div>

          {session.description && (
            <p className="mt-4 max-w-xl text-sm leading-6 text-park-muted">
              {session.description}
            </p>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 -mt-6 pb-16">
        {/* Info card */}
        <div className="mb-5 overflow-hidden rounded-lg border border-park-border bg-park-white shadow-sm">
          <dl className="divide-y divide-park-border">
            <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-xs font-semibold text-park-muted uppercase tracking-wider pt-0.5">
                Datum &amp; tid
              </dt>
              <dd className="mt-1 sm:mt-0 sm:col-span-2 text-sm font-medium text-park-dark">
                {formatDateTime(session.event_date)}
              </dd>
            </div>

            {session.location && (
              <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-xs font-semibold text-park-muted uppercase tracking-wider pt-0.5">
                  Plats
                </dt>
                <dd className="mt-1 sm:mt-0 sm:col-span-2 text-sm font-medium text-park-dark">
                  {session.location}
                </dd>
              </div>
            )}

            <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-xs font-semibold text-park-muted uppercase tracking-wider pt-0.5">
                Tillgänglighet
              </dt>
              <dd className="mt-1 sm:mt-0 sm:col-span-2 text-sm">
                {session.status === 'full' ? (
                  <span className="text-park-muted">
                    {session.capacity} platser · Fullbokad
                  </span>
                ) : (
                  <span className="text-park-dark">
                    <span className="font-semibold text-park-green">{spotsLeft}</span>
                    {' '}av {session.capacity} plats{session.capacity === 1 ? '' : 'er'} kvar
                  </span>
                )}
              </dd>
            </div>

            {session.registration_opens_at && (
              <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-xs font-semibold text-park-muted uppercase tracking-wider pt-0.5">
                  Anm. öppnar
                </dt>
                <dd className="mt-1 sm:mt-0 sm:col-span-2 text-sm text-park-dark">
                  {formatDate(session.registration_opens_at)}
                </dd>
              </div>
            )}

            {session.registration_closes_at && (
              <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-xs font-semibold text-park-muted uppercase tracking-wider pt-0.5">
                  Anm. stänger
                </dt>
                <dd className="mt-1 sm:mt-0 sm:col-span-2 text-sm text-park-dark">
                  {formatDate(session.registration_closes_at)}
                </dd>
              </div>
            )}

            {session.pricing_info && (
              <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-xs font-semibold text-park-muted uppercase tracking-wider pt-0.5">
                  Pris
                </dt>
                <dd className="mt-1 sm:mt-0 sm:col-span-2 text-sm text-park-dark">
                  {session.pricing_info}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Map */}
        {session.latitude != null && session.longitude != null && (
          <div className="mb-5 overflow-hidden rounded-lg border border-park-border bg-park-white shadow-sm">
            <EventMapLoader
              lat={Number(session.latitude)}
              lng={Number(session.longitude)}
              label={session.title}
              className="h-72 w-full"
            />
          </div>
        )}

        {/* Notes */}
        {session.notes && (
        <div className="mb-5 rounded-lg border border-park-border bg-park-white p-6">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-park-muted">
              Anteckningar
            </h2>
            <p className="text-sm text-park-dark leading-relaxed">{session.notes}</p>
          </div>
        )}

        {/* Status banners */}
        {registrationState === 'not_open_yet' && session.registration_opens_at && (
          <div className="mb-3 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-5 py-4">
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Anmälan har inte öppnat ännu</p>
              <p className="text-sm text-amber-700 mt-0.5">
                Anmälan öppnar {formatDate(session.registration_opens_at)}
              </p>
            </div>
          </div>
        )}
        {(registrationState === 'closed') && (
          <div className="mb-3 flex items-start gap-3 rounded-lg border border-park-border bg-park-white px-5 py-4">
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-park-muted" />
            <div>
              <p className="text-sm font-semibold text-park-dark">Anmälan är stängd</p>
              <p className="text-sm text-park-muted mt-0.5">
                Det här evenemanget tar inte längre emot anmälningar.
              </p>
            </div>
          </div>
        )}
        {registrationState === 'full_no_waitlist' && (
          <div className="mb-3 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-5 py-4">
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-red-500" />
            <div>
              <p className="text-sm font-semibold text-red-800">Evenemanget är fullbokat</p>
              <p className="text-sm text-red-700 mt-0.5">
                Alla platser är tagna och det finns ingen väntelista för detta evenemang.
              </p>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3">
          {registrationState === 'open' && (
            <Link
              href={`/sessions/${slug}/register`}
              className="flex-1 rounded-md bg-park-green px-6 py-3.5 text-center text-base font-semibold text-park-white shadow-sm transition-[background-color,color,box-shadow] hover:bg-park-dark"
            >
              Anmäl dig nu →
            </Link>
          )}
          {registrationState === 'waitlist' && (
            <Link
              href={`/sessions/${slug}/register`}
              className="flex-1 rounded-md bg-amber-400 px-6 py-3.5 text-center text-base font-semibold text-park-dark shadow-sm transition-[background-color,box-shadow] hover:bg-amber-500"
            >
              Gå med i väntelista →
            </Link>
          )}
          {(registrationState === 'closed' || registrationState === 'full_no_waitlist') && (
            <div className="flex-1 cursor-not-allowed rounded-md bg-park-border px-6 py-3.5 text-center text-base font-semibold text-park-muted">
              Anmälan stängd
            </div>
          )}
          {registrationState === 'not_open_yet' && (
            <div className="flex-1 cursor-not-allowed rounded-md bg-park-border px-6 py-3.5 text-center text-base font-semibold text-park-muted">
              Anmälan har inte öppnat ännu
            </div>
          )}
          <Link
            href="/sessions"
            className="flex-1 rounded-md border border-park-border bg-park-white px-6 py-3.5 text-center text-base font-semibold text-park-dark shadow-sm transition-[background-color,border-color,color,box-shadow] hover:border-park-green/35 hover:bg-park-lime"
          >
            Visa fler evenemang
          </Link>
        </div>
      </div>
    </div>
  )
}
