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

  // Fetch the rank-1 promoted session (published or full)
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
      <section className="relative bg-park-dark overflow-hidden">
        {/* Decorative track oval shapes */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="absolute -right-32 top-1/2 -translate-y-1/2 h-[640px] w-[640px] rounded-full border border-park-green/25" />
          <div className="absolute -right-12 top-1/2 -translate-y-1/2 h-[440px] w-[440px] rounded-full border border-park-green/15" />
          <div className="absolute right-24 top-1/2 -translate-y-1/2 h-[220px] w-[220px] rounded-full border border-park-lime/20" />
          <div className="absolute bottom-12 right-40 h-2 w-2 rounded-full bg-park-lime/40" />
          <div className="absolute bottom-20 right-56 h-1.5 w-1.5 rounded-full bg-park-lime/30" />
          <div className="absolute top-16 right-32 h-2.5 w-2.5 rounded-full bg-park-lime/25" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className={`flex flex-col ${featured ? 'lg:flex-row lg:items-center lg:gap-16' : ''}`}>
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
                  className="inline-flex items-center justify-center rounded-full bg-park-lime px-8 py-3.5 text-park-dark font-semibold text-base hover:bg-white transition-colors"
                >
                  Visa evenemang →
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center rounded-full border border-white/20 px-8 py-3.5 text-park-white font-semibold text-base hover:bg-white/10 transition-colors"
                >
                  Hur det fungerar
                </a>
              </div>
            </div>

            {/* Right: featured event card (only when a rank-1 session exists) */}
            {featured && (
              <div className="mt-12 lg:mt-0 lg:w-80 xl:w-96 shrink-0">
                <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm overflow-hidden">
                  {/* Card header */}
                  <div className="px-6 pt-5 pb-4 border-b border-white/10">
                    <p className="font-display text-park-lime uppercase tracking-[0.2em] text-xs font-semibold mb-1">
                      Utvalt evenemang
                    </p>
                    <h2 className="font-display font-bold text-xl text-park-white uppercase leading-tight">
                      {featured.title}
                    </h2>
                  </div>

                  {/* Card body */}
                  <div className="px-6 py-4 space-y-3 text-sm">
                    {/* Date & time */}
                    <div className="flex items-start gap-2.5 text-park-muted">
                      <svg className="h-4 w-4 shrink-0 mt-0.5" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/>
                      </svg>
                      <span className="capitalize">
                        {formatDate(featured.event_date)} · {formatTime(featured.event_date)}
                      </span>
                    </div>

                    {/* Location */}
                    {featured.location && (
                      <div className="flex items-start gap-2.5 text-park-muted">
                        <svg className="h-4 w-4 shrink-0 mt-0.5" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
                        </svg>
                        <span>{featured.location}</span>
                      </div>
                    )}

                    {/* Spots */}
                    <div className="flex items-center gap-2.5">
                      <svg className="h-4 w-4 shrink-0 text-park-muted" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
                        <path fillRule="evenodd" d="M5.216 14A2.238 2.238 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1h4.216z"/>
                        <path d="M4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"/>
                      </svg>
                      {isFeaturedFull ? (
                        <span className="font-medium text-park-muted">
                          {featured.waitlist_enabled ? 'Väntelista tillgänglig' : 'Fullbokad'}
                        </span>
                      ) : (
                        <span className="font-medium text-park-lime">
                          {featuredSpotsLeft} plats{featuredSpotsLeft === 1 ? '' : 'er'} kvar
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card CTA */}
                  <div className="px-6 pb-5">
                    <Link
                      href={`/sessions/${featured.slug}`}
                      className={`flex items-center justify-center gap-1.5 w-full rounded-full py-2.5 text-sm font-semibold transition-colors ${
                        isFeaturedFull
                          ? 'bg-white/10 text-park-white hover:bg-white/20'
                          : 'bg-park-lime text-park-dark hover:bg-white'
                      }`}
                    >
                      {isFeaturedFull ? 'Gå med i väntelista' : 'Visa & anmäl'}
                      <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="bg-park-green py-5 px-4">
        <div className="mx-auto max-w-6xl flex flex-wrap justify-center gap-x-12 gap-y-2 text-center">
          {[
            { value: '5 km', label: 'Varje gång' },
            { value: '100%', label: 'Gratis' },
            { value: 'Alla åldrar', label: 'Välkomna' },
          ].map(({ value, label }) => (
            <div key={label} className="flex items-center gap-2.5">
              <span className="font-display font-bold text-park-lime text-2xl uppercase">{value}</span>
              <span className="text-white/60 text-sm">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-4 bg-park-cream">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14">
            <p className="font-display text-park-green uppercase tracking-[0.2em] text-sm font-semibold mb-3">
              Enkelt att komma igång
            </p>
            <h2 className="font-display font-bold text-4xl sm:text-5xl text-park-dark uppercase leading-tight">
              Hur det fungerar
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Hitta ett evenemang',
                description:
                  'Bläddra bland kommande Parkrun-evenemang och välj ett datum som passar dig.',
              },
              {
                step: '02',
                title: 'Anmäl din grupp',
                description:
                  'Fyll i dina uppgifter och lägg till upp till 5 deltagare — vuxna och barn välkomna.',
              },
              {
                step: '03',
                title: 'Dyka upp och spring',
                description:
                  'Få en bekräftelse via e-post med allt du behöver. Bara dyka upp på dagen!',
              },
            ].map(({ step, title, description }) => (
              <div key={step} className="group">
                <div className="mb-4">
                  <span className="font-display font-extrabold text-6xl text-park-border leading-none select-none">
                    {step}
                  </span>
                </div>
                <div className="h-px w-12 bg-park-lime mb-4" />
                <h3 className="font-display font-bold text-xl uppercase text-park-dark mb-2">
                  {title}
                </h3>
                <p className="text-park-muted text-sm leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-park-lime py-16 px-4">
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
            className="shrink-0 rounded-full bg-park-dark px-8 py-3.5 text-park-white font-semibold text-base hover:bg-park-green transition-colors"
          >
            Visa evenemang →
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
            className="inline-block rounded-full border border-park-border px-6 py-2.5 text-sm font-medium text-park-dark hover:bg-park-white transition-colors"
          >
            Kontakta oss
          </a>
        </div>
      </section>
    </>
  )
}
