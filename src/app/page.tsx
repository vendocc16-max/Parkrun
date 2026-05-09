import Link from 'next/link'
import { connection } from 'next/server'
import { getSiteContent } from '@/lib/site-content'
import { createClient } from '@/lib/supabase/server'
import EventMapLoader from '@/components/event-map-loader'
import type { Session } from '../../supabase/types'

export default async function Home() {
  await connection()
  const content = await getSiteContent('home')

  let featured: Session | null = null
  if (content.featuredSessionSlug) {
    const supabase = await createClient()
    const { data } = await supabase
      .from('sessions')
      .select('*')
      .eq('slug', content.featuredSessionSlug)
      .maybeSingle()
    featured = (data as Session | null) ?? null
    if (featured && (featured.status === 'draft' || featured.status === 'cancelled')) {
      featured = null
    }
  }

  return (
    <>
      <section className="surface-grid border-b border-park-border bg-park-cream">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-24">
          <div className="max-w-2xl">
            <p className="mb-5 inline-flex rounded-full border border-park-border bg-park-white px-3 py-1 text-xs font-semibold text-park-accent shadow-sm">
              {content.badge}
            </p>
            <h1 className="text-5xl font-semibold leading-[1.02] tracking-tight text-park-dark sm:text-6xl lg:text-7xl">
              {content.headline}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-park-muted sm:text-lg">
              {content.intro}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/sessions"
                className="inline-flex items-center justify-center rounded-md bg-park-dark px-5 py-3 text-sm font-semibold text-park-white shadow-sm transition-[background-color,color,box-shadow] hover:bg-park-green"
              >
                {content.primaryCtaLabel}
                <span aria-hidden="true" className="ml-2">
                  →
                </span>
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center rounded-md border border-park-border bg-park-white px-5 py-3 text-sm font-semibold text-park-dark shadow-sm transition-[background-color,border-color,color,box-shadow] hover:border-park-green/35 hover:bg-park-lime"
              >
                {content.secondaryCtaLabel}
              </a>
            </div>
          </div>

          <div className="hairline-card relative overflow-hidden rounded-lg p-5">
            <div className="absolute right-4 top-4 h-2 w-2 rounded-full bg-park-accent" />
            <div className="mb-8 flex items-center justify-between border-b border-park-border pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-park-muted">
                  {content.previewEyebrow}
                </p>
                <p className="mt-1 text-lg font-semibold text-park-dark">
                  {content.previewWhen}
                </p>
              </div>
              <span className="rounded-full bg-park-accent-soft px-3 py-1 text-xs font-semibold text-park-accent">
                {content.previewDistance}
              </span>
            </div>
            <div className="space-y-4">
              {content.previewStats.map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between gap-4">
                  <span className="text-sm text-park-muted">{label}</span>
                  <span className="text-sm font-semibold text-park-dark">{value}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 rounded-md border border-park-border bg-park-cream p-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-park-green" />
                <p className="text-sm font-semibold text-park-dark">
                  {content.previewStatusLabel}
                </p>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-park-border">
                <div className="h-full w-2/3 rounded-full bg-park-green" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-park-border bg-park-white px-4 py-5">
        <div className="mx-auto grid max-w-6xl gap-4 text-sm sm:grid-cols-3">
          {content.stats.map(({ value, label }) => (
            <div key={label} className="flex items-baseline gap-3">
              <span className="text-xl font-semibold tracking-tight text-park-dark">{value}</span>
              <span className="text-park-muted">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {featured && (
        <section className="border-b border-park-border bg-park-white px-4 py-16">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              {content.featuredEyebrow && (
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-park-accent">
                  {content.featuredEyebrow}
                </p>
              )}
              <h2 className="text-3xl font-semibold tracking-tight text-park-dark sm:text-4xl">
                {content.featuredHeading || featured.title}
              </h2>
              <p className="mt-4 text-base font-medium text-park-dark">{featured.title}</p>
              <p className="mt-1 text-sm text-park-muted">
                {new Date(featured.event_date).toLocaleString('sv-SE', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                {featured.location ? ` · ${featured.location}` : ''}
              </p>
              {featured.description && (
                <p className="mt-4 text-sm leading-6 text-park-muted">{featured.description}</p>
              )}
              <Link
                href={`/sessions/${featured.slug}`}
                className="mt-6 inline-flex items-center justify-center rounded-md bg-park-green px-5 py-3 text-sm font-semibold text-park-white shadow-sm transition-[background-color,color,box-shadow] hover:bg-park-dark"
              >
                Visa evenemang
                <span aria-hidden="true" className="ml-2">
                  →
                </span>
              </Link>
            </div>
            <div>
              {featured.latitude != null && featured.longitude != null ? (
                <EventMapLoader
                  lat={Number(featured.latitude)}
                  lng={Number(featured.longitude)}
                  label={featured.title}
                  className="h-80 w-full overflow-hidden rounded-lg border border-park-border"
                />
              ) : (
                <div className="flex h-80 items-center justify-center rounded-lg border border-dashed border-park-border bg-park-cream/40 text-sm text-park-muted">
                  Ingen kartposition angiven för detta evenemang.
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <section id="how-it-works" className="bg-park-cream px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 max-w-xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-park-accent">
              {content.flowEyebrow}
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-park-dark sm:text-4xl">
              {content.flowHeading}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-park-border bg-park-border sm:grid-cols-3">
            {content.steps.map(({ step, title, description }) => (
              <div key={step} className="bg-park-white p-6">
                <span className="text-xs font-semibold text-park-accent">{step}</span>
                <h3 className="mt-5 text-base font-semibold text-park-dark">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-park-muted">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-park-border bg-park-white px-4 py-14">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-park-dark">
              {content.ctaHeading}
            </h2>
            <p className="mt-1 text-sm text-park-muted">
              {content.ctaBody}
            </p>
          </div>
          <Link
            href="/sessions"
            className="rounded-md bg-park-green px-5 py-3 text-sm font-semibold text-park-white shadow-sm transition-[background-color,box-shadow] hover:bg-park-dark"
          >
            {content.ctaButtonLabel}
          </Link>
        </div>
      </section>

      <section className="bg-park-cream px-4 py-14">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-xl font-semibold tracking-tight text-park-dark">
            {content.contactHeading}
          </h2>
          <p className="mt-2 text-sm leading-6 text-park-muted">
            {content.contactBody}
          </p>
          <a
            href={`mailto:${content.contactEmail}`}
            className="mt-5 inline-flex rounded-md border border-park-border bg-park-white px-4 py-2.5 text-sm font-semibold text-park-dark shadow-sm transition-[background-color,border-color,color] hover:border-park-green/35 hover:bg-park-lime"
          >
            {content.contactButtonLabel}
          </a>
        </div>
      </section>
    </>
  )
}
