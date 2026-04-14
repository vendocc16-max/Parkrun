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
            {/* Left: heading + CTAs */}
            <div className="max-w-2xl lg:flex-1">
              <p className="font-display text-park-lime uppercase tracking-[0.25em] text-sm font-semibold mb-5">
                Gratis · Varje vecka · För alla
              </p>
              <h1 className="font-display font-extrabold text-park-white uppercase leading-[0.9] tracking-tight">
                <span className="block text-6xl sm:text-7xl lg:text-8xl">Ditt nästa</span>
                <span className="block text-6xl sm:text-7xl lg:text-8xl text-park-lime">parkrun</span>
                <span className="block text-6xl sm:text-7xl lg:text-8xl">börjar här</span>
              </h1>
              <p className="mt-8 text-base sm:text-lg text-park-muted leading-relaxed max-w-lg">
                Bläddra bland kommande evenemang, säkra din plats och ta med hela familjen.
                Gratis, välkomnande och öppet för alla — bara dyka upp och springa.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/sessions"
                  className="inline-flex items-center justify-center bg-park-lime px-8 py-3.5 text-park-dark font-semibold text-base hover:bg-white transition-colors"
                >
                  Visa evenemang
                </Link>
              </div>
            </div>

            {/* Right: featured event notice */}
            {featured && (
              <div className="mt-12 lg:mt-0 lg:w-72 xl:w-80 shrink-0">
                <div className="border-2 border-park-lime bg-park-dark">
                  {/* Notice header */}
                  <div className="bg-park-lime px-4 py-2">
                    <p className="font-display font-black text-park-dark uppercase text-xs tracking-[0.2em]">
                      Nästa evenemang
                    </p>
                  </div>

                  {/* Notice body */}
                  <div className="px-5 py-5 space-y-4">
                    <h2 className="font-display font-bold text-xl text-park-white uppercase leading-tight">
                      {featured.title}
                    </h2>

                    <div className="space-y-1.5 text-sm text-park-muted">
                      <p>
                        <span className="uppercase text-xs tracking-wider text-park-muted/60 block">Datum</span>
                        <span className="text-park-white capitalize">{formatDate(featured.event_date)}</span>
                      </p>
                      <p>
                        <span className="uppercase text-xs tracking-wider text-park-muted/60 block">Tid</span>
                        <span className="text-park-white">{formatTime(featured.event_date)}</span>
                      </p>
                      {featured.location && (
                        <p>
                          <span className="uppercase text-xs tracking-wider text-park-muted/60 block">Plats</span>
                          <span className="text-park-white">{featured.location}</span>
                        </p>
                      )}
                      <p>
                        <span className="uppercase text-xs tracking-wider text-park-muted/60 block">Platser</span>
                        {isFeaturedFull ? (
                          <span className="text-park-muted">
                            {featured.waitlist_enabled ? 'Väntelista tillgänglig' : 'Fullbokad'}
                          </span>
                        ) : (
                          <span className="text-park-lime font-semibold">
                            {featuredSpotsLeft} kvar
                          </span>
                        )}
                      </p>
                    </div>

                    <Link
                      href={`/sessions/${featured.slug}`}
                      className={`block text-center py-2.5 text-sm font-semibold transition-colors ${
                        isFeaturedFull
                          ? 'border border-park-muted text-park-muted hover:border-park-white hover:text-park-white'
                          : 'bg-park-lime text-park-dark hover:bg-white'
                      }`}
                    >
                      {isFeaturedFull ? 'Gå med i väntelista' : 'Visa & anmäl'}
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-park-lime py-14 px-4">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-park-dark uppercase leading-tight">
              Redo att springa?
            </h2>
            <p className="text-park-dark/60 mt-1 text-sm">
              Platserna tar slut snabbt — anmäl dig tidigt.
            </p>
          </div>
          <Link
            href="/sessions"
            className="shrink-0 bg-park-dark px-8 py-3.5 text-park-white font-semibold text-base hover:bg-park-green transition-colors"
          >
            Visa evenemang
          </Link>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16 px-4 bg-park-cream border-t border-park-border">
        <div className="mx-auto max-w-xl text-center">
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
