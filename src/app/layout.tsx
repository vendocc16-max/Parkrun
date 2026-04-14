import type { Metadata } from 'next'
import { Barlow_Condensed, DM_Sans, Space_Mono } from 'next/font/google'
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

const spaceMono = Space_Mono({
  variable: '--font-space-mono',
  subsets: ['latin'],
  weight: ['400', '700'],
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
      lang="sv"
      className={`${barlowCondensed.variable} ${dmSans.variable} ${spaceMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-park-cream text-park-dark">
        <SentryClientInit />

        {/* Navigation */}
        <header className="sticky top-0 z-50 bg-park-white border-b-2 border-park-dark">
          <nav className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 flex h-14 items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <span className="font-display font-black text-2xl text-park-lime bg-park-dark px-2 py-0.5 leading-none">
                P/
              </span>
              <span className="font-display font-bold text-xl uppercase tracking-wide text-park-dark">
                Parkrun
              </span>
            </Link>

            <div className="flex items-center gap-6 text-sm font-medium">
              <Link
                href="/sessions"
                className="text-park-muted hover:text-park-dark transition-colors"
              >
                Evenemang
              </Link>
              <Link
                href="/admin"
                className="border border-park-dark px-4 py-1.5 text-park-dark text-sm font-semibold hover:bg-park-dark hover:text-park-white transition-colors"
              >
                Arrangörsinloggning
              </Link>
            </div>
          </nav>
        </header>

        <main className="flex-1">{children}</main>

        {/* Footer */}
        <footer className="border-t-2 border-park-dark bg-park-white">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="font-mono text-xs uppercase tracking-widest text-park-muted">
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
