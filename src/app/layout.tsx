import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import Link from 'next/link'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Parkrun Registration',
  description: 'Register for upcoming Parkrun events in your area',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-gray-900">
        <header className="border-b border-gray-200 bg-white">
          <nav className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg text-green-700">
              <span className="text-2xl">🏃</span>
              <span>Parkrun</span>
            </Link>
            <div className="flex items-center gap-6 text-sm font-medium">
              <Link href="/sessions" className="text-gray-600 hover:text-gray-900 transition-colors">
                Sessions
              </Link>
              <Link
                href="/admin"
                className="rounded-md bg-green-700 px-4 py-2 text-white hover:bg-green-800 transition-colors"
              >
                Organiser login
              </Link>
            </div>
          </nav>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-gray-200 bg-gray-50">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 text-sm text-gray-500 flex flex-col sm:flex-row justify-between gap-4">
            <p>© {new Date().getFullYear()} Parkrun Registration. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/privacy" className="hover:text-gray-700 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-gray-700 transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
