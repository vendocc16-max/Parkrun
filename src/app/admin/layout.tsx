import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const NAV_LINKS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/sessions', label: 'Sessions' },
  { href: '/admin/registrations', label: 'Registrations' },
  { href: '/admin/messages', label: 'Send Message' },
  { href: '/admin/settings', label: 'Settings' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r border-gray-200 bg-white flex flex-col">
        <div className="px-4 py-5 border-b border-gray-100">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">
            Organiser
          </p>
          <p className="text-xs text-gray-500 truncate">{user.email}</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 text-sm font-medium">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center rounded-md px-3 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-gray-100">
          <a
            href="/auth/logout"
            className="flex items-center rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 transition-colors"
          >
            Sign out
          </a>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-auto px-8 py-8">{children}</div>
    </div>
  )
}

