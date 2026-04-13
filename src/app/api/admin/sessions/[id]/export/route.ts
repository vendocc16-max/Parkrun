import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { type NextRequest, NextResponse } from 'next/server'
import type { Guardian, Participant, Registration, Session } from '@/../supabase/types'

interface Props {
  params: Promise<{ id: string }>
}

type ExportRow = Pick<
  Registration,
  'registration_number' | 'status' | 'created_at'
> & {
  participants: Pick<
    Participant,
    'first_name' | 'last_name' | 'is_child' | 'date_of_birth' | 'medical_notes'
  > | null
  guardians: Pick<
    Guardian,
    'first_name' | 'last_name' | 'email' | 'phone'
  > | null
  sessions: Pick<Session, 'slug'> | null
}

function escapeCsv(val: string | null | undefined | boolean): string {
  const s = val === null || val === undefined ? '' : String(val)
  return `"${s.replace(/"/g, '""')}"`
}

export async function GET(_request: NextRequest, { params }: Props) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { id } = await params
  const adminClient = createAdminClient()

  const { data: rawRows, error } = await adminClient
    .from('registrations')
    .select(
      'registration_number, status, created_at, participants(first_name, last_name, is_child, date_of_birth, medical_notes), guardians(first_name, last_name, email, phone), sessions(slug)'
    )
    .eq('session_id', id)
    .order('created_at', { ascending: true })

  if (error) {
    return new NextResponse('Internal Server Error', { status: 500 })
  }

  const rows = (rawRows ?? []) as unknown as ExportRow[]

  const slug =
    rows.find((r) => r.sessions?.slug)?.sessions?.slug ?? id

  const HEADERS = [
    'registration_number',
    'status',
    'participant_first_name',
    'participant_last_name',
    'is_child',
    'date_of_birth',
    'guardian_first_name',
    'guardian_last_name',
    'guardian_email',
    'guardian_phone',
    'medical_notes',
    'registered_at',
  ]

  const csvRows = rows.map((r) => {
    const p = r.participants
    const g = r.guardians
    return [
      escapeCsv(r.registration_number),
      escapeCsv(r.status),
      escapeCsv(p?.first_name),
      escapeCsv(p?.last_name),
      escapeCsv(p?.is_child),
      escapeCsv(p?.date_of_birth),
      escapeCsv(g?.first_name),
      escapeCsv(g?.last_name),
      escapeCsv(g?.email),
      escapeCsv(g?.phone),
      escapeCsv(p?.medical_notes),
      escapeCsv(r.created_at),
    ].join(',')
  })

  const csv = [HEADERS.join(','), ...csvRows].join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="parkrun-${slug}-registrations.csv"`,
    },
  })
}
