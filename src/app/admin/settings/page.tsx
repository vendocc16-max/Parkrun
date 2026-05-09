import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import type { OrganizerRole } from '../../../../supabase/types'

export const metadata = { title: 'Settings | Parkrun Admin' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const adminClient = createAdminClient()
  const { data: organizer } = await adminClient
    .from('organizers')
    .select('*, organizer_roles(role)')
    .eq('user_id', user.id)
    .maybeSingle()

  const roles = (
    organizer?.organizer_roles as { role: OrganizerRole }[] | undefined
  )?.map((r) => r.role) ?? []

  return (
    <div className="max-w-lg">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-park-dark">Settings</h1>
        <p className="text-park-muted mt-1">Your account details.</p>
      </div>

      <div className="rounded-lg border border-park-border bg-park-white p-6 shadow-sm space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-park-muted/70 mb-3">
            Account
          </p>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="font-medium text-park-dark">Email</dt>
              <dd className="text-park-muted">{user.email}</dd>
            </div>
            {organizer?.full_name && (
              <div className="flex justify-between">
                <dt className="font-medium text-park-dark">Name</dt>
                <dd className="text-park-muted">{organizer.full_name}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="font-medium text-park-dark">Organiser ID</dt>
              <dd className="font-mono text-xs text-park-muted/70">{organizer?.id ?? '—'}</dd>
            </div>
          </dl>
        </div>

        <div className="border-t border-park-border pt-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-park-muted/70 mb-3">
            Roles
          </p>
          {roles.length === 0 ? (
            <p className="text-sm text-park-muted">No roles assigned.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {roles.map((role) => (
                <span
                  key={role}
                  className="rounded-full bg-park-lime px-3 py-1 text-xs font-semibold text-park-green"
                >
                  {role}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-park-border pt-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-park-muted/70 mb-3">
            Future settings
          </p>
          <p className="text-sm text-park-muted/70 italic">
            Notification preferences, password change, and other settings coming soon.
          </p>
        </div>
      </div>
    </div>
  )
}
