import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendConfirmationEmail } from '@/lib/email/send'
import type { Guardian, Participant, Registration, Session } from '../../../../../supabase/types'

interface RegistrationWithRelations {
  id: string
  guardian_id: string
  participant_id: string
  session_id: string
  status: Registration['status']
  registration_number: string | null
  waitlist_position: number | null
  confirmed_at: string | null
  cancelled_at: string | null
  cancellation_reason: string | null
  messaging_opt_out: boolean
  source_ip: string | null
  source_metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
  participants: Participant
  guardians: Guardian
  sessions: Session
}

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-internal-secret')
  if (!secret || secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let registrationIds: string[]
  try {
    const body = (await request.json()) as { registrationIds: string[] }
    registrationIds = body.registrationIds
    if (!Array.isArray(registrationIds) || registrationIds.length === 0) {
      return NextResponse.json({ error: 'registrationIds must be a non-empty array' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('registrations')
      .select('*, participants(*), guardians(*), sessions(*)')
      .in('id', registrationIds)

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ success: false, error: 'No registrations found' }, { status: 404 })
    }

    const rows = data as unknown as RegistrationWithRelations[]

    // Group registrations by guardian so each guardian receives one email
    const byGuardian = new Map<string, RegistrationWithRelations[]>()
    for (const row of rows) {
      const existing = byGuardian.get(row.guardian_id) ?? []
      existing.push(row)
      byGuardian.set(row.guardian_id, existing)
    }

    const sendResults = await Promise.all(
      Array.from(byGuardian.values()).map(async (guardianRows) => {
        const firstRow = guardianRows[0]
        const guardian = firstRow.guardians
        const session = firstRow.sessions

        return sendConfirmationEmail({
          to: guardian.email,
          guardianFirstName: guardian.first_name,
          session,
          registrations: guardianRows.map((row) => ({
            participant: row.participants,
            registration: row as Registration,
          })),
        })
      }),
    )

    const allSucceeded = sendResults.every((r) => r.success)
    return NextResponse.json({ success: allSucceeded })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
