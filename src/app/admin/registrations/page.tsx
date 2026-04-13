import { createAdminClient } from '@/lib/supabase/admin'
import type { RegistrationStatus, Session } from '../../../../supabase/types'
import { RegistrationsTable } from './RegistrationsTable'

export const metadata = { title: 'Registrations | Parkrun Admin' }

type RowData = {
  id: string
  registration_number: string | null
  status: RegistrationStatus
  created_at: string
  participants: { first_name: string; last_name: string } | null
  guardians: { email: string } | null
  sessions: { title: string } | null
}

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function RegistrationsPage({ searchParams }: Props) {
  const params = await searchParams
  const sessionFilter = typeof params.session === 'string' ? params.session : undefined
  const statusFilter = typeof params.status === 'string' ? params.status : undefined
  const fromFilter = typeof params.from === 'string' ? params.from : undefined
  const toFilter = typeof params.to === 'string' ? params.to : undefined

  const adminClient = createAdminClient()

  const [{ data: rawRegs }, { data: sessions }] = await Promise.all([
    (() => {
      let q = adminClient
        .from('registrations')
        .select(
          'id, registration_number, status, created_at, participants(first_name, last_name), guardians(email), sessions(title)'
        )
        .order('created_at', { ascending: false })

      if (sessionFilter) q = q.eq('session_id', sessionFilter)
      if (statusFilter && statusFilter !== 'all')
        q = q.eq('status', statusFilter as RegistrationStatus)
      if (fromFilter) q = q.gte('created_at', fromFilter)
      if (toFilter) q = q.lte('created_at', toFilter + 'T23:59:59')

      return q
    })(),
    adminClient.from('sessions').select('id, title').order('event_date', { ascending: false }),
  ])

  const rows = (rawRegs ?? []) as unknown as RowData[]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Registrations</h1>
        <p className="text-gray-500 mt-1">{rows.length} registrations</p>
      </div>

      {/* Filters */}
      <form method="get" className="mb-6 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Session</label>
          <select
            name="session"
            defaultValue={sessionFilter ?? ''}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          >
            <option value="">All sessions</option>
            {(sessions as Session[] | null)?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
          <select
            name="status"
            defaultValue={statusFilter ?? ''}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          >
            <option value="">All statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="waitlisted">Waitlisted</option>
            <option value="cancelled">Cancelled</option>
            <option value="duplicate_flagged">Duplicate flagged</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">From date</label>
          <input
            type="date"
            name="from"
            defaultValue={fromFilter ?? ''}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">To date</label>
          <input
            type="date"
            name="to"
            defaultValue={toFilter ?? ''}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 transition-colors"
        >
          Filter
        </button>
        {(sessionFilter || statusFilter || fromFilter || toFilter) && (
          <a
            href="/admin/registrations"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Clear
          </a>
        )}
      </form>

      <RegistrationsTable rows={rows} />
    </div>
  )
}
