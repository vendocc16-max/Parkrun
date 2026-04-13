import type { Metadata } from 'next'
import { Barlow_Condensed, DM_Sans } from 'next/font/google'
import Link from 'next/link'
import { SentryClientInit } from '@/lib/sentry-client'
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

export const metadata: Metadata = {
  title: 'Parkrun Anmälan',
  description: 'Anmäl dig till kommande Parkrun-evenemang i ditt område',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${barlowCondensed.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-park-cream text-park-dark">
        <SentryClientInit />

        {/* Navigation */}
        <header className="sticky top-0 z-50 bg-park-white/95 backdrop-blur-sm border-b border-park-border">
          <nav className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-park-green text-park-lime font-display font-bold text-sm tracking-tight">
                P
              </span>
              <span className="font-display font-bold text-xl uppercase tracking-wide text-park-dark">
                Parkrun
              </span>
            </Link>

            <div className="flex items-center gap-5 text-sm font-medium">
              <Link
                href="/sessions"
                className="text-park-muted hover:text-park-dark transition-colors"
              >
                Evenemang
              </Link>
              <Link
                href="/admin"
                className="rounded-full bg-park-dark px-5 py-2 text-park-white text-sm font-semibold hover:bg-park-green transition-colors"
              >
                Arrangörsinloggning
              </Link>
            </div>
          </nav>
        </header>

        <main className="flex-1">{children}</main>

        {/* Footer */}
        <footer className="border-t border-park-border bg-park-white">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="font-display text-sm uppercase tracking-widest text-park-muted">
              © {new Date().getFullYear()} Parkrun Anmälan
            </p>
            <div className="flex gap-6 text-sm text-park-muted">
              <Link href="/privacy" className="hover:text-park-dark transition-colors">
                Integritetspolicy
              </Link>
              <Link href="/terms" className="hover:text-park-dark transition-colors">
                Användarvillkor
              </Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
