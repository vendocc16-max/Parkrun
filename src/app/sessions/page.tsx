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
    day: 'numeric',
    month: 'short',
    year: 'numeric',
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
      <div className="bg-park-dark py-14 px-4 border-b-2 border-park-lime">
        <div className="mx-auto max-w-5xl">
          <p className="font-mono text-park-lime uppercase tracking-[0.2em] text-xs font-bold mb-3">
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
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
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
          <>
            {/* Column header — newspaper results-table style */}
            <div className="hidden sm:grid sm:grid-cols-[1fr_auto_auto_auto] gap-x-8 border-b-2 border-park-dark pb-2 mb-0">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-park-muted">Evenemang</span>
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-park-muted text-right">Datum / Tid</span>
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-park-muted text-right">Platser</span>
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-park-muted text-right">Status</span>
            </div>

            <div className="divide-y divide-park-border border-x border-b border-park-border">
              {sessions.map((session, i) => {
                const confirmed = confirmedCounts[i] ?? 0
                const isFull = session.status === 'full'
                const spotsLeft = Math.max(0, session.capacity - confirmed)
                const pct = Math.min(100, Math.round((confirmed / session.capacity) * 100))

                return (
                  <article
                    key={session.id}
                    className="group bg-park-white hover:bg-park-cream transition-colors duration-100"
                  >
                    {/* Mobile layout */}
                    <div className="sm:hidden px-4 py-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="font-display font-bold text-lg uppercase text-park-dark leading-tight">
                            {session.title}
                          </h2>
                          {session.promotion_rank != null && (
                            <span className="bg-park-lime px-1.5 py-0.5 text-[10px] font-black text-park-dark uppercase tracking-wide">
                              Utvald
                            </span>
                          )}
                        </div>
                        <Link
                          href={`/sessions/${session.slug}`}
                          className={`shrink-0 px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors ${
                            isFull
                              ? 'border border-park-muted/40 text-park-muted hover:border-park-dark hover:text-park-dark'
                              : 'bg-park-dark text-park-white hover:bg-park-green'
                          }`}
                        >
                          {isFull ? 'Väntelista' : 'Anmäl'}
                        </Link>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-park-muted font-mono">
                        <span>{formatDate(session.event_date)} {formatTime(session.event_date)}</span>
                        {session.location && <span>{session.location}</span>}
                      </div>
                      {/* Capacity bar */}
                      <div className="mt-3">
                        <div className="h-1 w-full bg-park-border overflow-hidden">
                          <div
                            className={`h-full transition-all ${pct >= 90 ? 'bg-red-400' : pct >= 70 ? 'bg-amber-400' : 'bg-park-lime'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="font-mono text-[10px] text-park-muted mt-1">
                          {confirmed}/{session.capacity}
                          {!isFull && spotsLeft <= 5 && (
                            <span className="text-red-500 font-bold ml-2">— bara {spotsLeft} kvar</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Desktop layout — table row */}
                    <div className="hidden sm:grid sm:grid-cols-[1fr_auto_auto_auto] sm:items-center gap-x-8 px-4 py-4">
                      {/* Title + location */}
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <h2 className="font-display font-bold text-xl uppercase text-park-dark leading-tight">
                            {session.title}
                          </h2>
                          {session.promotion_rank != null && (
                            <span className="bg-park-lime px-1.5 py-0.5 text-[10px] font-black text-park-dark uppercase tracking-wide">
                              Utvald
                            </span>
                          )}
                        </div>
                        {session.location && (
                          <p className="text-xs text-park-muted">{session.location}</p>
                        )}
                      </div>

                      {/* Date + time — monospace for tabular alignment */}
                      <div className="text-right">
                        <p className="font-mono text-sm text-park-dark">{formatDate(session.event_date)}</p>
                        <p className="font-mono text-xs text-park-muted">{formatTime(session.event_date)}</p>
                      </div>

                      {/* Capacity */}
                      <div className="text-right min-w-[90px]">
                        <p className={`font-mono text-sm font-bold ${isFull ? 'text-park-muted' : spotsLeft <= 5 ? 'text-red-500' : 'text-park-green'}`}>
                          {isFull ? 'Fullbokad' : `${spotsLeft} kvar`}
                        </p>
                        {/* mini capacity bar */}
                        <div className="mt-1 h-1 w-full bg-park-border overflow-hidden">
                          <div
                            className={`h-full ${pct >= 90 ? 'bg-red-400' : pct >= 70 ? 'bg-amber-400' : 'bg-park-lime'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="font-mono text-[10px] text-park-muted/60 mt-0.5">{confirmed}/{session.capacity}</p>
                      </div>

                      {/* CTA */}
                      <div className="text-right">
                        <Link
                          href={`/sessions/${session.slug}`}
                          className={`inline-block px-4 py-2 text-sm font-bold uppercase tracking-wide transition-colors ${
                            isFull
                              ? 'border border-park-muted/40 text-park-muted hover:border-park-dark hover:text-park-dark'
                              : 'bg-park-dark text-park-white hover:bg-park-green'
                          }`}
                        >
                          {isFull ? 'Väntelista' : 'Anmäl'}
                        </Link>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
