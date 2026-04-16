import Link from 'next/link'

export default function Home() {
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
          <div className="max-w-2xl">
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
            href="mailto:ivantruedson@gmail.com"
            className="inline-block rounded-full border border-park-border px-6 py-2.5 text-sm font-medium text-park-dark hover:bg-park-white transition-colors"
          >
            Kontakta oss
          </a>
        </div>
      </section>
    </>
  )
}
