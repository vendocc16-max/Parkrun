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
        <header className="sticky top-0 z-50 border-b border-park-border bg-park-white/90 backdrop-blur-md">
          <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-park-dark text-park-lime font-sans text-xs font-semibold tracking-tight shadow-sm">
                P
              </span>
              <span className="text-sm font-semibold tracking-tight text-park-dark">
                Parkrun
              </span>
            </Link>

            <div className="flex items-center gap-2 text-sm font-medium sm:gap-5">
              <Link
                href="/sessions"
                className="text-park-muted transition-colors hover:text-park-dark"
              >
                Evenemang
              </Link>
              <Link
                href="/admin"
                className="rounded-md border border-park-border bg-park-white px-3 py-2 text-xs font-semibold text-park-dark shadow-sm transition-[background-color,border-color,color,box-shadow] hover:border-park-green/35 hover:bg-park-lime sm:px-4 sm:text-sm"
              >
                Arrangör
              </Link>
            </div>
          </nav>
        </header>

        <main className="flex-1">{children}</main>

        {/* Footer */}
        <footer className="border-t border-park-border bg-park-white">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-4 py-8 sm:flex-row sm:items-center sm:px-6 lg:px-8">
            <p className="text-xs font-medium text-park-muted">
              © {new Date().getFullYear()} Parkrun Anmälan
            </p>
            <div className="flex gap-6 text-sm text-park-muted">
              <Link href="/privacy" className="transition-colors hover:text-park-dark">
                Integritetspolicy
              </Link>
              <Link href="/terms" className="transition-colors hover:text-park-dark">
                Användarvillkor
              </Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
