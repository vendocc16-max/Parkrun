import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Session } from '../../supabase/types'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('sv-SE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('sv-SE', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function Home() {
  const supabase = await createClient()

  const { data: featuredData } = await supabase
    .from('sessions')
    .select('*')
    .eq('promotion_rank', 1)
    .in('status', ['published', 'full'])
    .order('event_date', { ascending: true })
    .limit(1)
    .maybeSingle()

  const featured = featuredData as Session | null

  let featuredSpotsLeft = 0
  if (featured) {
    const { data: confirmedCount } = await supabase.rpc('get_session_confirmed_count', {
      p_session_id: featured.id,
    })
    featuredSpotsLeft = Math.max(0, featured.capacity - ((confirmedCount as number | null) ?? 0))
  }

  const isFeaturedFull = featured?.status === 'full'

  return (
    <>
      {/* Hero */}
      <section className="bg-park-dark">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className={`flex flex-col ${featured ? 'lg:flex-row lg:items-start lg:gap-20' : ''}`}>

            {/* Left: typographic headline */}
            <div className="max-w-2xl lg:flex-1">
              <p className="font-mono text-park-lime uppercase tracking-[0.2em] text-xs font-bold mb-6">
                Gratis · Varje vecka · Öppet för alla
              </p>
              <h1 className="font-display font-extrabold text-park-white uppercase leading-[0.88] tracking-tight">
                <span
                  className="block text-6xl sm:text-7xl lg:text-8xl animate-fade-up"
                  style={{ animationDelay: '0ms' }}
                >
                  Ditt nästa
                </span>
                <span
                  className="block text-6xl sm:text-7xl lg:text-8xl text-park-lime animate-fade-up"
                  style={{ animationDelay: '80ms' }}
                >
                  parkrun
                </span>
                <span
                  className="block text-6xl sm:text-7xl lg:text-8xl animate-fade-up"
                  style={{ animationDelay: '160ms' }}
                >
                  börjar här
                </span>
              </h1>
              <p className="mt-8 text-base text-park-muted leading-relaxed max-w-md">
                Bläddra bland kommande evenemang och säkra din plats.
                Gratis, välkomnande, öppet för hela familjen.
              </p>
              <div className="mt-10">
                <Link
                  href="/sessions"
                  className="inline-block bg-park-lime px-8 py-3.5 text-park-dark font-semibold text-base hover:bg-white transition-colors"
                >
                  Visa evenemang
                </Link>
              </div>
            </div>

            {/* Right: race-notice card */}
            {featured && (
              <div className="mt-14 lg:mt-0 lg:w-72 xl:w-80 shrink-0">
                {/* Notice strip */}
                <div className="bg-park-lime px-4 py-2 flex items-center justify-between">
                  <p className="font-mono font-bold text-park-dark uppercase text-xs tracking-[0.2em]">
                    Nästa evenemang
                  </p>
                  {!isFeaturedFull && (
                    <p className="font-mono font-bold text-park-dark text-xs">
                      {featuredSpotsLeft} kvar
                    </p>
                  )}
                </div>

                {/* Notice body — structured like a race-day entry form */}
                <div className="border-2 border-park-lime border-t-0 bg-park-dark divide-y divide-park-green/30">
                  <div className="px-5 pt-5 pb-4">
                    <h2 className="font-display font-black text-2xl text-park-white uppercase leading-tight">
                      {featured.title}
                    </h2>
                  </div>

                  <div className="px-5 py-4 grid grid-cols-2 gap-x-4 gap-y-3">
                    <div>
                      <p className="font-mono text-park-muted/60 text-[10px] uppercase tracking-widest mb-0.5">Datum</p>
                      <p className="text-park-white text-sm capitalize leading-snug">{formatDate(featured.event_date)}</p>
                    </div>
                    <div>
                      <p className="font-mono text-park-muted/60 text-[10px] uppercase tracking-widest mb-0.5">Starttid</p>
                      <p className="font-mono text-park-lime text-lg font-bold leading-none">{formatTime(featured.event_date)}</p>
                    </div>
                    {featured.location && (
                      <div className="col-span-2">
                        <p className="font-mono text-park-muted/60 text-[10px] uppercase tracking-widest mb-0.5">Plats</p>
                        <p className="text-park-white text-sm">{featured.location}</p>
                      </div>
                    )}
                    <div className="col-span-2">
                      <p className="font-mono text-park-muted/60 text-[10px] uppercase tracking-widest mb-0.5">Platser</p>
                      {isFeaturedFull ? (
                        <p className="text-park-muted text-sm font-semibold">
                          {featured.waitlist_enabled ? 'Fullbokad — väntelista öppen' : 'Fullbokad'}
                        </p>
                      ) : (
                        <p className="font-mono text-park-lime text-sm font-bold">
                          {featuredSpotsLeft} / {featured.capacity} lediga
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="px-5 py-4">
                    <Link
                      href={`/sessions/${featured.slug}`}
                      className={`block text-center py-2.5 text-sm font-bold uppercase tracking-wide transition-colors ${
                        isFeaturedFull
                          ? 'border border-park-muted/40 text-park-muted hover:border-park-white hover:text-park-white'
                          : 'bg-park-lime text-park-dark hover:bg-white'
                      }`}
                    >
                      {isFeaturedFull ? 'Gå med i väntelista' : 'Anmäl dig'}
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Rule + CTA — newspaper-style section break */}
      <section className="bg-park-lime">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="font-mono text-park-dark/50 uppercase text-xs tracking-widest mb-1">Parkrun — 5 km — gratis</p>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-park-dark uppercase leading-tight">
              Redo att springa?
            </h2>
          </div>
          <Link
            href="/sessions"
            className="shrink-0 bg-park-dark px-8 py-3.5 text-park-white font-semibold text-base hover:bg-park-green transition-colors"
          >
            Visa evenemang
          </Link>
        </div>
      </section>

      {/* Contact — minimal */}
      <section className="py-16 px-4 bg-park-cream border-t border-park-border">
        <div className="mx-auto max-w-xl">
          <h2 className="font-display font-bold text-2xl text-park-dark uppercase mb-3">
            Frågor?
          </h2>
          <p className="text-park-muted text-sm mb-6 leading-relaxed">
            Kontakta din lokala evenemangsarrangör eller hör av dig till oss direkt.
          </p>
          <a
            href="mailto:hello@parkrun-registration.example.com"
            className="inline-block border border-park-border px-6 py-2.5 text-sm font-medium text-park-dark hover:bg-park-white transition-colors"
          >
            Kontakta oss
          </a>
        </div>
      </section>
    </>
  )
}
