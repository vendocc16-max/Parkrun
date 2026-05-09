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
    <div className="admin-shell flex min-h-screen">
      {/* Sidebar */}
      <aside className="flex w-56 shrink-0 flex-col border-r border-park-border bg-park-white/90">
        <div className="border-b border-park-border px-4 py-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-park-muted">
            Organiser
          </p>
          <p className="truncate text-xs text-park-muted">{user.email}</p>
        </div>
        <nav className="flex-1 space-y-0.5 px-2 py-3 text-sm font-medium">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center rounded-md px-3 py-2 text-park-muted transition-[background-color,color] hover:bg-park-lime hover:text-park-dark"
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-park-border px-2 py-3">
          <a
            href="/auth/logout"
            className="flex items-center rounded-md px-3 py-2 text-sm text-park-muted transition-[background-color,color] hover:bg-park-lime hover:text-park-dark"
          >
            Sign out
          </a>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-auto px-6 py-6 lg:px-8">{children}</div>
    </div>
  )
}
