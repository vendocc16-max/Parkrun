import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { RegistrationStatus } from '../../../../../supabase/types'
import { CancelButton } from './CancelButton'

interface Props {
  params: Promise<{ id: string }>
}

type RegistrationRow = {
  id: string
  registration_number: string | null
  status: RegistrationStatus
  created_at: string
  waitlist_position: number | null
  participants: {
    first_name: string
    last_name: string
    is_child: boolean
  } | null
  guardians: {
    first_name: string
    last_name: string
    email: string
    phone: string | null
  } | null
}

const STATUS_STYLES: Record<RegistrationStatus, string> = {
  confirmed: 'bg-park-lime text-park-green',
  cancelled: 'bg-red-100 text-red-700',
  waitlisted: 'bg-yellow-100 text-yellow-700',
  duplicate_flagged: 'bg-orange-100 text-orange-700',
  blocked: 'bg-park-cream text-park-muted',
}

export default async function SessionDetailPage({ params }: Props) {
  const { id } = await params
  const adminClient = createAdminClient()

  const [{ data: session }, { data: rawRegs }] = await Promise.all([
    adminClient.from('sessions').select('*').eq('id', id).maybeSingle(),
    adminClient
      .from('registrations')
      .select(
        'id, registration_number, status, created_at, waitlist_position, participants(first_name, last_name, is_child), guardians(first_name, last_name, email, phone)'
      )
      .eq('session_id', id)
      .order('created_at', { ascending: true }),
  ])

  if (!session) notFound()

  const registrations = (rawRegs ?? []) as unknown as RegistrationRow[]
  const confirmed = registrations.filter((r) => r.status === 'confirmed')
  const waitlisted = registrations.filter((r) => r.status === 'waitlisted')

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin/sessions" className="text-sm text-park-muted hover:text-park-dark">
              Sessions
            </Link>
            <span className="text-park-border">/</span>
            <span className="text-sm text-park-dark">{session.title}</span>
          </div>
          <h1 className="text-2xl font-semibold text-park-dark">{session.title}</h1>
          <p className="text-park-muted mt-1">
            {new Date(session.event_date).toLocaleString()} · {session.location ?? 'No location'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/api/admin/sessions/${id}/export`}
            className="rounded-md border border-park-border px-4 py-2 text-sm font-medium text-park-dark hover:bg-park-cream transition-[background-color,border-color,color,box-shadow,opacity]"
          >
            Export CSV
          </a>
          <Link
            href={`/admin/sessions/${id}/edit`}
            className="rounded-md bg-park-green px-4 py-2 text-sm font-semibold text-white hover:bg-park-dark transition-[background-color,border-color,color,box-shadow,opacity]"
          >
            Edit session
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="rounded-lg border border-park-border bg-park-white p-5 shadow-sm">
          <p className="text-sm text-park-muted">Confirmed</p>
          <p className="text-2xl font-semibold text-park-dark mt-1">
            {confirmed.length} / {session.capacity}
          </p>
        </div>
        <div className="rounded-lg border border-park-border bg-park-white p-5 shadow-sm">
          <p className="text-sm text-park-muted">Waitlisted</p>
          <p className="text-2xl font-semibold text-park-dark mt-1">
            {session.waitlist_enabled ? waitlisted.length : '—'}
          </p>
        </div>
        <div className="rounded-lg border border-park-border bg-park-white p-5 shadow-sm">
          <p className="text-sm text-park-muted">Spots remaining</p>
          <p className="text-2xl font-semibold text-park-dark mt-1">
            {Math.max(0, session.capacity - confirmed.length)}
          </p>
        </div>
      </div>

      {/* Registrations table */}
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-park-dark mb-4">
          Registrations ({registrations.length})
        </h2>
        <div className="rounded-lg border border-park-border bg-park-white overflow-hidden shadow-sm">
          {registrations.length === 0 ? (
            <p className="px-6 py-8 text-sm text-park-muted text-center">
              No registrations for this session.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-park-cream border-b border-park-border">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-park-muted">Reg #</th>
                  <th className="px-4 py-3 text-left font-medium text-park-muted">Participant</th>
                  <th className="px-4 py-3 text-left font-medium text-park-muted">Guardian</th>
                  <th className="px-4 py-3 text-left font-medium text-park-muted">Child?</th>
                  <th className="px-4 py-3 text-left font-medium text-park-muted">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-park-muted">Registered</th>
                  <th className="px-4 py-3 text-left font-medium text-park-muted">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-park-border">
                {registrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-park-cream transition-[background-color,border-color,color,box-shadow,opacity]">
                    <td className="px-4 py-3 font-mono text-xs text-park-muted">
                      {reg.registration_number ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-park-dark">
                      {reg.participants
                        ? `${reg.participants.first_name} ${reg.participants.last_name}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-park-muted">
                      {reg.guardians ? (
                        <div>
                          <div>{`${reg.guardians.first_name} ${reg.guardians.last_name}`}</div>
                          <div className="text-xs text-park-muted/70">{reg.guardians.email}</div>
                          {reg.guardians.phone && (
                            <div className="text-xs text-park-muted/70">{reg.guardians.phone}</div>
                          )}
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-park-muted">
                      {reg.participants?.is_child ? 'Yes' : 'No'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[reg.status]}`}
                      >
                        {reg.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-park-muted">
                      {new Date(reg.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <CancelButton
                        registrationId={reg.id}
                        currentStatus={reg.status}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
