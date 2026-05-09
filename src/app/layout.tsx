import type { Metadata } from 'next'
import { Barlow_Condensed, DM_Sans } from 'next/font/google'
import Link from 'next/link'
import { connection } from 'next/server'
import { SentryClientInit } from '@/lib/sentry-client'
import { getSiteContent } from '@/lib/site-content'
import { DEFAULT_SITE_CONTENT } from '@/lib/site-content-schema'
import './globals.css'

const barlowCondensed = Barlow_Condensed({
  variable: '--font-barlow-condensed',
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
})

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
})

export async function generateMetadata(): Promise<Metadata> {
  const content = await getSiteContent('layout')

  return {
    title: content.metadataTitle,
    description: content.metadataDescription,
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  await connection()
  const content = await getSiteContent('layout')
  const year = new Date().getFullYear()

  return (
    <html
      lang="en"
      className={`${barlowCondensed.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-park-cream text-park-dark">
        <SentryClientInit />

        {/* Navigation */}
        <header className="sticky top-0 z-50 border-b border-park-border bg-park-white/90 backdrop-blur-md">
          <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-park-dark text-park-lime font-sans text-xs font-semibold tracking-tight shadow-sm">
                {content.brandInitial}
              </span>
              <span className="text-sm font-semibold tracking-tight text-park-dark">
                {content.brandName}
              </span>
            </Link>

            <div className="flex items-center gap-2 text-sm font-medium sm:gap-5">
              <Link
                href="/sessions"
                className="text-park-muted transition-colors hover:text-park-dark"
              >
                {content.navSessionsLabel}
              </Link>
              <Link
                href="/admin"
                className="rounded-md border border-park-border bg-park-white px-3 py-2 text-xs font-semibold text-park-dark shadow-sm transition-[background-color,border-color,color,box-shadow] hover:border-park-green/35 hover:bg-park-lime sm:px-4 sm:text-sm"
              >
                {content.navAdminLabel}
              </Link>
            </div>
          </nav>
        </header>

        <main className="flex-1">{children}</main>

        {/* Footer */}
        <footer className="border-t border-park-border bg-park-white">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-4 py-8 sm:flex-row sm:items-center sm:px-6 lg:px-8">
            <p className="text-xs font-medium text-park-muted">
              © {year} {content.footerCopyright}
            </p>
            <div className="flex gap-6 text-sm text-park-muted">
              <Link
                href={content.privacyLink.href || DEFAULT_SITE_CONTENT.layout.privacyLink.href}
                className="transition-colors hover:text-park-dark"
              >
                {content.privacyLink.label}
              </Link>
              <Link
                href={content.termsLink.href || DEFAULT_SITE_CONTENT.layout.termsLink.href}
                className="transition-colors hover:text-park-dark"
              >
                {content.termsLink.label}
              </Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
