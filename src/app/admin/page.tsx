import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import type { RegistrationStatus } from '../../../supabase/types'

export const metadata = {
  title: 'Dashboard | Parkrun Admin',
}

type DashboardRegistration = {
  id: string
  registration_number: string | null
  status: RegistrationStatus
  created_at: string
  participants: { first_name: string; last_name: string } | null
  sessions: { title: string } | null
}

const STATUS_STYLES: Record<RegistrationStatus, string> = {
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  waitlisted: 'bg-yellow-100 text-yellow-700',
  duplicate_flagged: 'bg-orange-100 text-orange-700',
  blocked: 'bg-gray-100 text-gray-600',
}

export default async function AdminDashboard() {
  const adminClient = createAdminClient()
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [
    { count: totalSessions },
    { count: confirmedRegistrations },
    { count: sessionsThisMonth },
    { count: upcomingSessions },
    { data: rawRecent },
  ] = await Promise.all([
    adminClient.from('sessions').select('*', { count: 'exact', head: true }),
    adminClient
      .from('registrations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'confirmed'),
    adminClient
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .gte('event_date', startOfMonth),
    adminClient
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .gt('event_date', now.toISOString())
      .eq('status', 'published'),
    adminClient
      .from('registrations')
      .select(
        'id, registration_number, status, created_at, participants(first_name, last_name), sessions(title)'
      )
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const recentRegistrations = (rawRecent ?? []) as unknown as DashboardRegistration[]

  const stats = [
    { label: 'Total sessions', value: totalSessions ?? 0 },
    { label: 'Confirmed registrations', value: confirmedRegistrations ?? 0 },
    { label: 'Sessions this month', value: sessionsThisMonth ?? 0 },
    { label: 'Upcoming sessions', value: upcomingSessions ?? 0 },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome to the Parkrun organiser portal.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map(({ label, value }) => (
          <div key={label} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="flex gap-3 mb-10">
        <Link
          href="/admin/sessions/new"
          className="rounded-md bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 transition-colors"
        >
          + New session
        </Link>
        <Link
          href="/admin/messages"
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Send message
        </Link>
      </div>

      {/* Recent registrations */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent registrations</h2>
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
          {recentRegistrations.length === 0 ? (
            <p className="px-6 py-8 text-sm text-gray-500 text-center">No registrations yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Reg #</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Participant</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Session</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentRegistrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">
                      {reg.registration_number ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      {reg.participants
                        ? `${reg.participants.first_name} ${reg.participants.last_name}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{reg.sessions?.title ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[reg.status] ?? 'bg-gray-100 text-gray-600'}`}
                      >
                        {reg.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(reg.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="mt-3">
          <Link href="/admin/registrations" className="text-sm text-green-700 hover:underline">
            View all registrations →
          </Link>
        </div>
      </div>
    </div>
  )
}

