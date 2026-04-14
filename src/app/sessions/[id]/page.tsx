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
    title: session ? `${session.title} | Parkrun Anmälan` : 'Evenemang | Parkrun Anmälan',
  }
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('sv-SE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('sv-SE', {
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
  const pct = Math.min(100, Math.round((confirmedCount / session.capacity) * 100))
  const registrationState = getRegistrationState(session, confirmedCount)

  return (
    <div className="min-h-screen bg-park-cream">
      {/* Session header */}
      <div className="bg-park-dark px-4 pt-10 pb-14 border-b-2 border-park-lime">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/sessions"
            className="inline-flex items-center gap-1.5 text-park-muted hover:text-park-lime transition-colors text-sm mb-6 font-mono"
          >
            ← Alla evenemang
          </Link>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-park-white uppercase leading-tight">
                {session.title}
              </h1>
              {/* Date as large display element */}
              <p className="font-mono text-park-lime text-sm mt-3 tracking-wide capitalize">
                {new Date(session.event_date).toLocaleDateString('sv-SE', {
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                })}
                {' · '}
                {new Date(session.event_date).toLocaleTimeString('sv-SE', {
                  hour: '2-digit', minute: '2-digit',
                })}
              </p>
            </div>
            <div className="flex gap-2 pt-1 shrink-0">
              {session.status === 'full' ? (
                <span className="border border-park-muted/40 px-3 py-1 text-xs font-semibold text-park-muted uppercase tracking-wide">
                  Fullbokad
                </span>
              ) : session.status === 'closed' ? (
                <span className="border border-park-muted/40 px-3 py-1 text-xs font-semibold text-park-muted uppercase tracking-wide">
                  Stängd
                </span>
              ) : (
                <span className="border border-park-lime/60 px-3 py-1 text-xs font-semibold text-park-lime uppercase tracking-wide">
                  Öppen
                </span>
              )}
              {session.status === 'full' && session.waitlist_enabled && (
                <span className="border border-amber-400/40 px-3 py-1 text-xs font-semibold text-amber-300 uppercase tracking-wide">
                  Väntelista
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
        {/* Info block */}
        <div className="bg-park-white border border-park-border overflow-hidden mb-4">
          <dl className="divide-y divide-park-border">
            {session.location && (
              <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="font-mono text-[10px] font-bold text-park-muted uppercase tracking-widest pt-0.5">
                  Plats
                </dt>
                <dd className="mt-1 sm:mt-0 sm:col-span-2 text-sm font-medium text-park-dark">
                  {session.location}
                </dd>
              </div>
            )}

            <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="font-mono text-[10px] font-bold text-park-muted uppercase tracking-widest pt-0.5">
                Datum &amp; tid
              </dt>
              <dd className="mt-1 sm:mt-0 sm:col-span-2 text-sm font-medium text-park-dark capitalize">
                {formatDateTime(session.event_date)}
              </dd>
            </div>

            <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4 items-start">
              <dt className="font-mono text-[10px] font-bold text-park-muted uppercase tracking-widest pt-0.5">
                Platser
              </dt>
              <dd className="mt-2 sm:mt-0 sm:col-span-2">
                {/* Capacity bar */}
                <div className="mb-2">
                  <div className="h-2 w-full bg-park-border overflow-hidden">
                    <div
                      className={`h-full transition-all ${pct >= 90 ? 'bg-red-400' : pct >= 70 ? 'bg-amber-400' : 'bg-park-lime'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                {session.status === 'full' ? (
                  <p className="font-mono text-sm text-park-muted">
                    {session.capacity}/{session.capacity} — Fullbokad
                  </p>
                ) : (
                  <p className="font-mono text-sm text-park-dark">
                    <span className="font-bold text-park-green">{spotsLeft}</span>
                    {' '}av {session.capacity} platser lediga
                    {spotsLeft <= 5 && spotsLeft > 0 && (
                      <span className="text-red-500 font-bold ml-2">— skynda!</span>
                    )}
                  </p>
                )}
              </dd>
            </div>

            {session.registration_opens_at && (
              <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="font-mono text-[10px] font-bold text-park-muted uppercase tracking-widest pt-0.5">
                  Anm. öppnar
                </dt>
                <dd className="mt-1 sm:mt-0 sm:col-span-2 text-sm text-park-dark capitalize">
                  {formatDate(session.registration_opens_at)}
                </dd>
              </div>
            )}

            {session.registration_closes_at && (
              <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="font-mono text-[10px] font-bold text-park-muted uppercase tracking-widest pt-0.5">
                  Anm. stänger
                </dt>
                <dd className="mt-1 sm:mt-0 sm:col-span-2 text-sm text-park-dark capitalize">
                  {formatDate(session.registration_closes_at)}
                </dd>
              </div>
            )}

            {session.pricing_info && (
              <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="font-mono text-[10px] font-bold text-park-muted uppercase tracking-widest pt-0.5">
                  Pris
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
          <div className="bg-park-white border border-park-border px-6 py-5 mb-4 border-l-4 border-l-park-lime">
            <h2 className="font-mono font-bold text-[10px] uppercase tracking-widest text-park-muted mb-2">
              Anteckningar
            </h2>
            <p className="text-sm text-park-dark leading-relaxed">{session.notes}</p>
          </div>
        )}

        {/* Status banners */}
        {registrationState === 'not_open_yet' && session.registration_opens_at && (
          <div className="border-l-4 border-l-amber-400 bg-amber-50 px-5 py-4 mb-3">
            <p className="font-mono text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">
              Anmälan har inte öppnat ännu
            </p>
            <p className="text-sm text-amber-700">
              Öppnar {formatDate(session.registration_opens_at)}
            </p>
          </div>
        )}
        {registrationState === 'closed' && (
          <div className="border-l-4 border-l-park-border bg-park-white border border-park-border px-5 py-4 mb-3">
            <p className="font-mono text-xs font-bold text-park-dark uppercase tracking-wider mb-1">
              Anmälan är stängd
            </p>
            <p className="text-sm text-park-muted">
              Det här evenemanget tar inte längre emot anmälningar.
            </p>
          </div>
        )}
        {registrationState === 'full_no_waitlist' && (
          <div className="border-l-4 border-l-red-400 bg-red-50 px-5 py-4 mb-3">
            <p className="font-mono text-xs font-bold text-red-700 uppercase tracking-wider mb-1">
              Evenemanget är fullbokat
            </p>
            <p className="text-sm text-red-700">
              Alla platser är tagna. Ingen väntelista finns för detta evenemang.
            </p>
          </div>
        )}

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-2 mt-2">
          {registrationState === 'open' && (
            <Link
              href={`/sessions/${slug}/register`}
              className="flex-1 bg-park-lime px-6 py-3.5 text-center text-base font-bold uppercase tracking-wide text-park-dark hover:bg-park-green hover:text-park-white transition-colors"
            >
              Anmäl dig nu
            </Link>
          )}
          {registrationState === 'waitlist' && (
            <Link
              href={`/sessions/${slug}/register`}
              className="flex-1 bg-amber-400 px-6 py-3.5 text-center text-base font-bold uppercase tracking-wide text-park-dark hover:bg-amber-500 transition-colors"
            >
              Gå med i väntelista
            </Link>
          )}
          {(registrationState === 'closed' || registrationState === 'full_no_waitlist') && (
            <div className="flex-1 border border-park-border px-6 py-3.5 text-center text-base font-semibold text-park-muted cursor-not-allowed">
              Anmälan stängd
            </div>
          )}
          {registrationState === 'not_open_yet' && (
            <div className="flex-1 border border-park-border px-6 py-3.5 text-center text-base font-semibold text-park-muted cursor-not-allowed">
              Anmälan har inte öppnat ännu
            </div>
          )}
          <Link
            href="/sessions"
            className="flex-1 border border-park-border px-6 py-3.5 text-center text-base font-semibold text-park-dark hover:bg-park-white transition-colors"
          >
            Visa fler evenemang
          </Link>
        </div>
      </div>
    </div>
  )
}
