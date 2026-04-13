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
          {/* Lime accent dot cluster */}
          <div className="absolute bottom-12 right-40 h-2 w-2 rounded-full bg-park-lime/40" />
          <div className="absolute bottom-20 right-56 h-1.5 w-1.5 rounded-full bg-park-lime/30" />
          <div className="absolute top-16 right-32 h-2.5 w-2.5 rounded-full bg-park-lime/25" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="max-w-2xl">
            <p className="font-display text-park-lime uppercase tracking-[0.25em] text-sm font-semibold mb-5">
              Free · Weekly · For everyone
            </p>
            <h1 className="font-display font-extrabold text-park-white uppercase leading-[0.9] tracking-tight">
              <span className="block text-6xl sm:text-7xl lg:text-8xl">Your next</span>
              <span className="block text-6xl sm:text-7xl lg:text-8xl text-park-lime">parkrun</span>
              <span className="block text-6xl sm:text-7xl lg:text-8xl">starts here</span>
            </h1>
            <p className="mt-8 text-base sm:text-lg text-park-muted leading-relaxed max-w-lg">
              Browse upcoming sessions, secure your spot, and bring the whole family.
              Free, friendly, and open to everyone — just show up and run.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-3">
              <Link
                href="/sessions"
                className="inline-flex items-center justify-center rounded-full bg-park-lime px-8 py-3.5 text-park-dark font-semibold text-base hover:bg-white transition-colors"
              >
                View sessions →
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center rounded-full border border-white/20 px-8 py-3.5 text-park-white font-semibold text-base hover:bg-white/10 transition-colors"
              >
                How it works
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="bg-park-green py-5 px-4">
        <div className="mx-auto max-w-6xl flex flex-wrap justify-center gap-x-12 gap-y-2 text-center">
          {[
            { value: '5km', label: 'Every session' },
            { value: '100%', label: 'Free to join' },
            { value: 'All ages', label: 'Welcome' },
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
              Simple process
            </p>
            <h2 className="font-display font-bold text-4xl sm:text-5xl text-park-dark uppercase leading-tight">
              How it works
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Find a session',
                description:
                  'Browse upcoming Parkrun events and pick a date that suits your schedule.',
              },
              {
                step: '02',
                title: 'Register your group',
                description:
                  'Fill in your details and add up to 5 participants — adults and children welcome.',
              },
              {
                step: '03',
                title: 'Show up and run',
                description:
                  "Get a confirmation email with everything you need. Just show up on the day!",
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
              Ready to run?
            </h2>
            <p className="text-park-dark/60 mt-1 text-sm">
              Spots fill up fast — register early.
            </p>
          </div>
          <Link
            href="/sessions"
            className="shrink-0 rounded-full bg-park-dark px-8 py-3.5 text-park-white font-semibold text-base hover:bg-park-green transition-colors"
          >
            Browse sessions →
          </Link>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16 px-4 bg-park-cream border-t border-park-border">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="font-display font-bold text-2xl text-park-dark uppercase mb-3">
            Questions?
          </h2>
          <p className="text-park-muted text-sm mb-6 leading-relaxed">
            Reach out to your local event organiser or get in touch with us directly.
          </p>
          <a
            href="mailto:hello@parkrun-registration.example.com"
            className="inline-block rounded-full border border-park-border px-6 py-2.5 text-sm font-medium text-park-dark hover:bg-park-white transition-colors"
          >
            Contact us
          </a>
        </div>
      </section>
    </>
  )
}
