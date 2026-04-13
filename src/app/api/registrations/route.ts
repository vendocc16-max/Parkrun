import { headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { registrationSchema } from '@/lib/validations/registration'
import { RATE_LIMIT } from '@/lib/config/rules'
import { sendConfirmationEmail } from '@/lib/email/sendConfirmation'
import type {
  Session,
  Guardian,
  Participant,
  Registration,
  RegistrationStatus,
  InsertGuardian,
  InsertParticipant,
  InsertRegistration,
  InsertConsent,
  InsertRateLimitEvent,
} from '../../../../supabase/types'

export async function POST(request: Request) {
  // 1. Parse and validate body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json(
      { error: 'Invalid JSON body', code: 'INVALID_BODY' },
      { status: 400 },
    )
  }

  const parsed = registrationSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: 'Validation failed', code: 'VALIDATION_ERROR', details: parsed.error.issues },
      { status: 400 },
    )
  }

  const {
    sessionId,
    guardian,
    participants,
    consentTerms,
    consentPrivacy,
    consentChildRegistration,
  } = parsed.data

  // 2. Get client IP
  const headersList = await headers()
  const forwardedFor = headersList.get('x-forwarded-for')
  const clientIP = forwardedFor?.split(',')[0]?.trim() ?? 'unknown'

  const adminClient = createAdminClient()

  // 3. Look up session
  const { data: sessionData, error: sessionError } = await adminClient
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  const session = sessionData as Session | null

  if (sessionError || !session || !['published', 'full'].includes(session.status)) {
    return Response.json(
      { error: 'Session not found or unavailable', code: 'SESSION_NOT_FOUND' },
      { status: 404 },
    )
  }

  // 4. Rate limiting — check previous attempts first
  const windowStart = new Date(
    Date.now() - RATE_LIMIT.REGISTRATION_ATTEMPTS_WINDOW_MINUTES * 60 * 1000,
  ).toISOString()

  const { count: attemptCount } = await adminClient
    .from('rate_limit_events')
    .select('*', { count: 'exact', head: true })
    .eq('ip_address', clientIP)
    .eq('session_id', sessionId)
    .eq('event_type', 'registration_attempt')
    .gte('created_at', windowStart)

  // Record the attempt regardless (even if blocked)
  await adminClient.from('rate_limit_events').insert({
    ip_address: clientIP,
    session_id: sessionId,
    event_type: 'registration_attempt',
  } as InsertRateLimitEvent)

  if ((attemptCount ?? 0) >= RATE_LIMIT.REGISTRATION_ATTEMPTS_PER_IP_PER_SESSION) {
    return Response.json(
      { error: 'Too many registration attempts. Please try again later.', code: 'RATE_LIMITED' },
      { status: 429 },
    )
  }

  // 5. Capacity check
  const { data: confirmedCountData } = await adminClient.rpc('get_session_confirmed_count', {
    p_session_id: sessionId,
  })
  const confirmedCount = (confirmedCountData as number | null) ?? 0
  const isFull = confirmedCount >= session.capacity

  if (isFull && !session.waitlist_enabled) {
    return Response.json(
      { error: 'This session is full and has no waitlist.', code: 'SESSION_FULL' },
      { status: 409 },
    )
  }

  // 6. Upsert guardian
  const guardianInsert: InsertGuardian = {
    email: guardian.email,
    first_name: guardian.firstName,
    last_name: guardian.lastName,
    phone: guardian.phone || null,
    emergency_contact: guardian.emergencyContact || null,
  }

  const { data: guardianData, error: guardianError } = await adminClient
    .from('guardians')
    .upsert(guardianInsert, { onConflict: 'email' })
    .select('id, email, first_name, last_name')
    .single()

  const guardianRow = guardianData as Pick<
    Guardian,
    'id' | 'email' | 'first_name' | 'last_name'
  > | null

  if (guardianError || !guardianRow) {
    console.error('Guardian upsert error:', guardianError)
    return Response.json(
      { error: 'Failed to process contact details.', code: 'GUARDIAN_ERROR' },
      { status: 500 },
    )
  }

  // 7. Process each participant
  const registrationIds: string[] = []
  const registrationNumbers: string[] = []
  let spotsRemaining = Math.max(0, session.capacity - confirmedCount)
  let anyWaitlisted = false

  const userAgent = headersList.get('user-agent')

  for (const p of participants) {
    // Duplicate check: find existing participant records with same name + guardian
    const { data: existingParticipants } = await adminClient
      .from('participants')
      .select('id')
      .eq('guardian_id', guardianRow.id)
      .eq('first_name', p.firstName)
      .eq('last_name', p.lastName)

    const existingParticipantRows = (existingParticipants ?? []) as Pick<Participant, 'id'>[]
    let isDuplicate = false

    if (existingParticipantRows.length > 0) {
      const existingIds = existingParticipantRows.map((ep) => ep.id)
      const { data: existingRegs } = await adminClient
        .from('registrations')
        .select('id')
        .eq('session_id', sessionId)
        .in('participant_id', existingIds)
        .neq('status', 'cancelled')

      isDuplicate = ((existingRegs ?? []) as Pick<Registration, 'id'>[]).length > 0
    }

    // Insert participant
    const participantInsert: InsertParticipant = {
      guardian_id: guardianRow.id,
      first_name: p.firstName,
      last_name: p.lastName,
      date_of_birth: p.dateOfBirth || null,
      is_child: p.isChild,
      medical_notes: p.medicalNotes || null,
    }

    const { data: participantData, error: participantError } = await adminClient
      .from('participants')
      .insert(participantInsert)
      .select('id')
      .single()

    const participantRow = participantData as Pick<Participant, 'id'> | null

    if (participantError || !participantRow) {
      console.error('Participant insert error:', participantError)
      return Response.json(
        { error: 'Failed to save participant details.', code: 'PARTICIPANT_ERROR' },
        { status: 500 },
      )
    }

    // Determine registration status
    let regStatus: RegistrationStatus
    let waitlistPosition: number | null = null

    if (isDuplicate) {
      regStatus = 'duplicate_flagged'
    } else if (spotsRemaining > 0) {
      regStatus = 'confirmed'
      spotsRemaining--
    } else if (session.waitlist_enabled) {
      regStatus = 'waitlisted'
      anyWaitlisted = true
      const { data: wpData } = await adminClient.rpc('get_next_waitlist_position', {
        p_session_id: sessionId,
      })
      waitlistPosition = (wpData as number | null) ?? 1
    } else {
      // Shouldn't reach here given the earlier check, but handle gracefully
      regStatus = 'waitlisted'
      anyWaitlisted = true
    }

    // Insert registration
    const registrationInsert: InsertRegistration = {
      session_id: sessionId,
      participant_id: participantRow.id,
      guardian_id: guardianRow.id,
      status: regStatus,
      source_ip: clientIP,
      source_metadata: null,
      waitlist_position: waitlistPosition,
      confirmed_at: regStatus === 'confirmed' ? new Date().toISOString() : null,
      cancelled_at: null,
      cancellation_reason: null,
      messaging_opt_out: false,
    }

    const { data: regData, error: regError } = await adminClient
      .from('registrations')
      .insert(registrationInsert)
      .select('id, registration_number')
      .single()

    const regRow = regData as Pick<Registration, 'id' | 'registration_number'> | null

    if (regError || !regRow) {
      console.error('Registration insert error:', regError)
      return Response.json(
        { error: 'Failed to save registration.', code: 'REGISTRATION_ERROR' },
        { status: 500 },
      )
    }

    registrationIds.push(regRow.id)
    if (regRow.registration_number) {
      registrationNumbers.push(regRow.registration_number)
    }

    // Insert consent record for this registration
    const consentInsert: InsertConsent = {
      registration_id: regRow.id,
      guardian_id: guardianRow.id,
      consent_terms: consentTerms,
      consent_privacy: consentPrivacy,
      consent_child_registration: consentChildRegistration ?? false,
      ip_address: clientIP,
      user_agent: userAgent,
    }

    await adminClient.from('consents').insert(consentInsert)
  }

  // 8. Send confirmation email (fire-and-forget; don't block on failure)
  sendConfirmationEmail({
    to: guardianRow.email,
    guardianFirstName: guardianRow.first_name,
    sessionTitle: session.title,
    eventDate: session.event_date,
    eventLocation: session.location,
    registrationNumbers,
    status: anyWaitlisted ? 'waitlisted' : 'confirmed',
  }).catch((err: unknown) => {
    console.error('Failed to send confirmation email:', err)
  })

  const overallStatus: 'confirmed' | 'waitlisted' = anyWaitlisted ? 'waitlisted' : 'confirmed'

  return Response.json(
    { success: true, registrationIds, registrationNumbers, status: overallStatus },
    { status: 201 },
  )
}
