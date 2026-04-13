import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendWaitlistPromotionEmail } from '@/lib/email/send'
import type { Guardian, Participant, Registration, Session, Json } from '@/../supabase/types'

function verifyCronSecret(request: NextRequest): boolean {
  const auth = request.headers.get('authorization')
  const expected = `Bearer ${process.env.CRON_SECRET}`
  return auth === expected
}

interface SessionRow {
  id: string
  capacity: number
  title: string
  event_date: string
  location: string | null
  pricing_info: string | null
  notes: string | null
  status: Session['status']
  slug: string
  description: string | null
  registration_opens_at: string | null
  registration_closes_at: string | null
  waitlist_enabled: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

interface WaitlistedRegistrationRow {
  id: string
  session_id: string
  guardian_id: string
  participant_id: string
  status: Registration['status']
  registration_number: string | null
  waitlist_position: number | null
  source_ip: string | null
  source_metadata: Json | null
  confirmed_at: string | null
  cancelled_at: string | null
  cancellation_reason: string | null
  messaging_opt_out: boolean
  created_at: string
  updated_at: string
  participants: Participant
  guardians: Guardian
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  let promoted = 0

  // Find sessions that are not cancelled/closed and have waitlisted registrations
  const { data: sessionsData, error: sessionsError } = await admin
    .from('sessions')
    .select('*')
    .in('status', ['published', 'full', 'draft'])

  if (sessionsError || !sessionsData) {
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
  }

  const sessions = sessionsData as SessionRow[]

  for (const session of sessions) {
    // Count confirmed registrations for this session
    const { count: confirmedCount, error: countError } = await admin
      .from('registrations')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', session.id)
      .eq('status', 'confirmed')

    if (countError) continue

    const availableSlots = session.capacity - (confirmedCount ?? 0)
    if (availableSlots <= 0) continue

    // Get waitlisted registrations ordered by position, then creation time
    const { data: waitlistedData, error: waitlistedError } = await admin
      .from('registrations')
      .select('*, participants(*), guardians(*)')
      .eq('session_id', session.id)
      .eq('status', 'waitlisted')
      .order('waitlist_position', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(availableSlots)

    if (waitlistedError || !waitlistedData || waitlistedData.length === 0) continue

    const waitlisted = waitlistedData as unknown as WaitlistedRegistrationRow[]

    for (const row of waitlisted) {
      // Promote the registration to confirmed
      const { error: updateError } = await admin
        .from('registrations')
        .update({
          status: 'confirmed' as const,
          confirmed_at: new Date().toISOString(),
          waitlist_position: null,
        })
        .eq('id', row.id)

      if (updateError) continue

      promoted++

      // Send waitlist promotion email (best-effort, do not block on failure)
      const sessionFull: Session = {
        id: session.id,
        slug: session.slug,
        title: session.title,
        description: session.description,
        location: session.location,
        event_date: session.event_date,
        registration_opens_at: session.registration_opens_at,
        registration_closes_at: session.registration_closes_at,
        capacity: session.capacity,
        waitlist_enabled: session.waitlist_enabled,
        status: session.status,
        pricing_info: session.pricing_info,
        notes: session.notes,
        created_by: session.created_by,
        created_at: session.created_at,
        updated_at: session.updated_at,
      }

      const promotedRegistration: Registration = {
        id: row.id,
        session_id: row.session_id,
        participant_id: row.participant_id,
        guardian_id: row.guardian_id,
        status: 'confirmed',
        registration_number: row.registration_number,
        source_ip: row.source_ip,
        source_metadata: row.source_metadata,
        waitlist_position: null,
        confirmed_at: new Date().toISOString(),
        cancelled_at: row.cancelled_at,
        cancellation_reason: row.cancellation_reason,
        messaging_opt_out: row.messaging_opt_out,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }

      await sendWaitlistPromotionEmail({
        to: row.guardians.email,
        guardianFirstName: row.guardians.first_name,
        session: sessionFull,
        registration: promotedRegistration,
        participant: row.participants,
      })
    }
  }

  return NextResponse.json({ promoted })
}
