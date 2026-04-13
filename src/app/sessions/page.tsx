import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Session } from '../../../supabase/types'

export const metadata = {
  title: 'Evenemang | Parkrun Anmälan',
  description: 'Bläddra bland kommande Parkrun-evenemang och säkra din plats',
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })
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
    <div className="min-h-screen bg-park-cream">
      {/* Page header */}
      <div className="bg-park-dark py-14 px-4">
        <div className="mx-auto max-w-5xl">
          <p className="font-display text-park-lime uppercase tracking-[0.2em] text-xs font-semibold mb-3">
            Anmäl dig idag
          </p>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-park-white uppercase leading-tight">
            Kommande evenemang
          </h1>
          <p className="mt-3 text-park-muted text-sm max-w-md">
            Bläddra bland tillgängliga Parkrun-evenemang och anmäl din grupp.
          </p>
        </div>
      </div>

      {/* Sessions list */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
        {sessions.length === 0 ? (
          <div className="rounded-2xl border border-park-border bg-park-white px-8 py-20 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-park-cream">
              <span className="text-3xl">🏃</span>
            </div>
            <p className="font-display font-bold text-lg uppercase text-park-dark mb-2">
              Inga evenemang ännu
            </p>
            <p className="text-sm text-park-muted">
              Kom tillbaka snart — nya evenemang läggs till regelbundet.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session, i) => {
              const confirmed = confirmedCounts[i] ?? 0
              const isFull = session.status === 'full'
              const spotsLeft = Math.max(0, session.capacity - confirmed)

              return (
                <article
                  key={session.id}
                  className="group flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl bg-park-white border border-park-border hover:border-park-green/40 hover:shadow-md transition-all duration-200 overflow-hidden"
                >
                  {/* Left accent bar */}
                  <div
                    className={`h-1 sm:h-auto sm:w-1.5 sm:self-stretch ${
                      isFull ? 'bg-park-muted/30' : 'bg-park-lime'
                    }`}
                  />

                  <div className="flex-1 min-w-0 px-5 py-5 sm:py-5 sm:pl-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h2 className="font-display font-bold text-xl uppercase text-park-dark leading-tight">
                        {session.title}
                      </h2>
                      {isFull ? (
                        <span className="rounded-full bg-park-muted/15 px-2.5 py-0.5 text-xs font-semibold text-park-muted uppercase tracking-wide">
                          Fullbokad
                        </span>
                      ) : (
                        <span className="rounded-full bg-park-lime/20 px-2.5 py-0.5 text-xs font-semibold text-park-green uppercase tracking-wide">
                          Öppen
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-park-muted mt-1">
                      <span className="flex items-center gap-1.5">
                        <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M8 1.5A4.5 4.5 0 1 0 8 10.5 4.5 4.5 0 0 0 8 1.5zm0 9A5.5 5.5 0 1 1 8 .5a5.5 5.5 0 0 1 0 11zm.5-5.5a.5.5 0 0 0-1 0v2.5H5.5a.5.5 0 0 0 0 1H8a.5.5 0 0 0 .5-.5V5z"/>
                        </svg>
                        {formatDate(session.event_date)} · {formatTime(session.event_date)}
                      </span>
                      {session.location && (
                        <span className="flex items-center gap-1.5">
                          <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M8 1a5 5 0 1 0 0 10A5 5 0 0 0 8 1zM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8z"/>
                            <path d="M8 4.5a.5.5 0 0 1 .5.5v3H11a.5.5 0 0 1 0 1H8a.5.5 0 0 1-.5-.5V5a.5.5 0 0 1 .5-.5z"/>
                          </svg>
                          {session.location}
                        </span>
                      )}
                      <span className={`font-medium ${isFull ? 'text-park-muted' : 'text-park-green'}`}>
                        {isFull
                          ? (session.waitlist_enabled ? 'Väntelista tillgänglig' : 'Inga platser kvar')
                          : `${spotsLeft} plats${spotsLeft === 1 ? '' : 'er'} kvar`}
                      </span>
                    </div>
                  </div>

                  <div className="px-5 pb-5 sm:py-5 sm:pr-5 sm:pl-0 shrink-0">
                    <Link
                      href={`/sessions/${session.slug}`}
                      className={`inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
                        isFull
                          ? 'bg-park-cream text-park-muted hover:bg-park-border'
                          : 'bg-park-dark text-park-white hover:bg-park-green'
                      }`}
                    >
                      {isFull ? 'Gå med i väntelista' : 'Visa & anmäl'}
                      <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
