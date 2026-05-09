import type { Metadata } from 'next'
import { connection } from 'next/server'
import { getSiteContent } from '@/lib/site-content'

function renderBodyWithEmailLinks(body: string) {
  const parts = body.split(/([\w.%+-]+@[\w.-]+\.[A-Za-z]{2,})/g)

  return parts.map((part, index) =>
    part.includes('@') ? (
      <a
        key={`${part}-${index}`}
        href={`mailto:${part}`}
        className="text-park-green underline underline-offset-2 transition-colors hover:text-park-dark"
      >
        {part}
      </a>
    ) : (
      part
    )
  )
}

export async function generateMetadata(): Promise<Metadata> {
  const content = await getSiteContent('privacy')

  return {
    title: content.metadataTitle,
  }
}

export default async function PrivacyPage() {
  await connection()
  const content = await getSiteContent('privacy')

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="mb-2 text-4xl font-semibold tracking-tight text-park-dark">
        {content.title}
      </h1>
      <p className="mb-10 text-sm text-park-muted">{content.updatedLabel}</p>

      <div className="max-w-none space-y-8 rounded-lg border border-park-border bg-park-white p-6 text-park-dark shadow-sm sm:p-8">
        {content.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="mb-3 text-lg font-semibold tracking-tight">{section.heading}</h2>
            <p className="text-park-muted leading-relaxed">
              {renderBodyWithEmailLinks(section.body)}
            </p>
          </section>
        ))}
      </div>
    </div>
  )
}
