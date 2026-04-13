import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendBulkReminder } from '@/lib/email/send'
import type {
  Guardian,
  Organizer,
  Participant,
  Registration,
  RegistrationStatus,
  Session,
  InsertOutboundMessage,
  InsertMessageDelivery,
} from '../../../../../supabase/types'

interface RequestBody {
  sessionId: string
  subject: string
  body: string
  targetStatus?: RegistrationStatus[]
}

interface RegistrationWithRelations {
  id: string
  guardian_id: string
  status: RegistrationStatus
  registration_number: string | null
  messaging_opt_out: boolean
  participants: Participant
  guardians: Guardian
}

export async function POST(request: NextRequest) {
  // Verify organizer auth
  const client = await createClient()
  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { data: organizerData, error: organizerError } = await admin
    .from('organizers')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (organizerError || !organizerData) {
    return NextResponse.json({ error: 'Forbidden: not an organizer' }, { status: 403 })
  }

  const organizer = organizerData as Organizer

  let body: RequestBody
  try {
    body = (await request.json()) as RequestBody
    if (!body.sessionId || !body.subject || !body.body) {
      return NextResponse.json(
        { error: 'sessionId, subject, and body are required' },
        { status: 400 },
      )
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { sessionId, subject, body: messageBody, targetStatus = ['confirmed'] } = body

  // Fetch session
  const { data: sessionData, error: sessionError } = await admin
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (sessionError || !sessionData) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  const session = sessionData as Session

  // Fetch registrations with participant and guardian data
  const { data: registrationsData, error: registrationsError } = await admin
    .from('registrations')
    .select('id, guardian_id, status, registration_number, messaging_opt_out, participants(*), guardians(*)')
    .eq('session_id', sessionId)
    .in('status', targetStatus)
    .eq('messaging_opt_out', false)

  if (registrationsError) {
    return NextResponse.json({ error: registrationsError.message }, { status: 500 })
  }

  const rows = (registrationsData ?? []) as unknown as RegistrationWithRelations[]

  if (rows.length === 0) {
    return NextResponse.json({ sent: 0, failed: 0 })
  }

  const recipients = rows.map((row) => ({
    email: row.guardians.email,
    firstName: row.guardians.first_name,
    registrationNumber: row.registration_number ?? 'N/A',
    guardianId: row.guardian_id,
    registrationId: row.id,
  }))

  // Create outbound_message record
  const outboundMessageInsert: InsertOutboundMessage = {
    session_id: sessionId,
    subject,
    body: messageBody,
    message_type: 'reminder',
    status: 'sending',
    target_filter: { status_filter: targetStatus },
    sent_at: null,
    created_by: organizer.id,
  }

  const { data: msgData, error: msgError } = await admin
    .from('outbound_messages')
    .insert(outboundMessageInsert)
    .select('id')
    .single()

  const outboundMessageId = msgError || !msgData ? null : (msgData as { id: string }).id

  // Send emails
  const bulkResult = await sendBulkReminder({
    subject,
    body: messageBody,
    session,
    recipients: recipients.map((r) => ({
      email: r.email,
      firstName: r.firstName,
      registrationNumber: r.registrationNumber,
    })),
  })

  // Log message_deliveries
  if (outboundMessageId) {
    const deliveries: InsertMessageDelivery[] = bulkResult.results.map((result, index) => ({
      message_id: outboundMessageId,
      guardian_id: recipients[index].guardianId,
      email: result.email,
      status: result.success ? 'sent' : 'failed',
      resend_message_id: result.messageId ?? null,
      sent_at: result.success ? new Date().toISOString() : null,
    }))

    if (deliveries.length > 0) {
      await admin.from('message_deliveries').insert(deliveries)
    }

    // Update outbound_message status
    const finalStatus = bulkResult.failed === 0 ? 'sent' : bulkResult.sent === 0 ? 'failed' : 'sent'
    await admin
      .from('outbound_messages')
      .update({ status: finalStatus, sent_at: new Date().toISOString() })
      .eq('id', outboundMessageId)
  }

  return NextResponse.json({ sent: bulkResult.sent, failed: bulkResult.failed })
}
