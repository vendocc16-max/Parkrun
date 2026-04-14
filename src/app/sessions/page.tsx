import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Session } from '../../../supabase/types'

export const metadata = {
  title: 'Evenemang | Parkrun Anmälan',
  description: 'Bläddra bland kommande Parkrun-evenemang och säkra din plats',
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('sv-SE', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('sv-SE', {
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
    .order('promotion_rank', { ascending: true, nullsFirst: false })
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
          <div className="border border-park-border bg-park-white px-8 py-20 text-center">
            <p className="font-display font-bold text-lg uppercase text-park-dark mb-2">
              Inga evenemang ännu
            </p>
            <p className="text-sm text-park-muted">
              Kom tillbaka snart — nya evenemang läggs till regelbundet.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-park-border border border-park-border">
            {sessions.map((session, i) => {
              const confirmed = confirmedCounts[i] ?? 0
              const isFull = session.status === 'full'
              const spotsLeft = Math.max(0, session.capacity - confirmed)

              return (
                <article
                  key={session.id}
                  className="group flex flex-col sm:flex-row sm:items-center gap-4 bg-park-white hover:bg-park-cream transition-colors duration-150 overflow-hidden"
                >
                  {/* Left accent bar */}
                  <div
                    className={`h-1 sm:h-auto sm:w-1 sm:self-stretch shrink-0 ${
                      isFull ? 'bg-park-border' : 'bg-park-lime'
                    }`}
                  />

                  <div className="flex-1 min-w-0 px-5 py-5 sm:py-5 sm:pl-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <h2 className="font-display font-bold text-xl uppercase text-park-dark leading-tight">
                        {session.title}
                      </h2>
                      {session.promotion_rank != null && (
                        <span className="bg-park-lime px-2 py-0.5 text-xs font-black text-park-dark uppercase tracking-wide">
                          Utvald
                        </span>
                      )}
                      {isFull ? (
                        <span className="border border-park-muted/40 px-2 py-0.5 text-xs font-semibold text-park-muted uppercase tracking-wide">
                          Fullbokad
                        </span>
                      ) : (
                        <span className="border border-park-lime/60 px-2 py-0.5 text-xs font-semibold text-park-green uppercase tracking-wide">
                          Öppen
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-park-muted">
                      <span>
                        {formatDate(session.event_date)} · {formatTime(session.event_date)}
                      </span>
                      {session.location && (
                        <span>{session.location}</span>
                      )}
                      <span className={`font-medium ${isFull ? 'text-park-muted' : 'text-park-green'}`}>
                        {isFull
                          ? (session.waitlist_enabled ? 'Väntelista tillgänglig' : 'Inga platser kvar')
                          : `${spotsLeft} plats${spotsLeft === 1 ? '' : 'er'} kvar`}
                      </span>
                    </div>
                  </div>

                  <div className="px-5 pb-5 sm:py-5 sm:pr-6 sm:pl-0 shrink-0">
                    <Link
                      href={`/sessions/${session.slug}`}
                      className={`inline-flex items-center px-5 py-2 text-sm font-semibold transition-colors ${
                        isFull
                          ? 'border border-park-muted/40 text-park-muted hover:border-park-dark hover:text-park-dark'
                          : 'bg-park-dark text-park-white hover:bg-park-green'
                      }`}
                    >
                      {isFull ? 'Gå med i väntelista' : 'Visa & anmäl'}
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
