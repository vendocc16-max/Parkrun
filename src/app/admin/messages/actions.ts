'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { RegistrationStatus, OutboundMessage, InsertOutboundMessage } from '../../../../supabase/types'

export async function getRecipientCount(
  sessionId: string,
  targetStatus: string
): Promise<number> {
  const adminClient = createAdminClient()

  let query = adminClient
    .from('registrations')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', sessionId)
    .eq('messaging_opt_out', false)

  if (targetStatus !== 'all') {
    query = query.eq('status', targetStatus as RegistrationStatus)
  }

  const { count } = await query
  return count ?? 0
}

export async function getMessageHistory(sessionId: string): Promise<OutboundMessage[]> {
  const adminClient = createAdminClient()
  const { data } = await adminClient
    .from('outbound_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
  return (data ?? []) as OutboundMessage[]
}

export async function sendMessage(payload: {
  sessionId: string
  subject: string
  body: string
  targetStatus: string
}): Promise<{ error?: string; messageId?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const adminClient = createAdminClient()

  const rawOrg = await adminClient
    .from('organizers')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  const organizerId: string | null =
    (rawOrg.data as { id: string } | null)?.id ?? null

  const insertData: InsertOutboundMessage = {
    session_id: payload.sessionId,
    subject: payload.subject,
    body: payload.body,
    message_type: 'reminder',
    status: 'queued',
    target_filter: payload.targetStatus === 'all' ? {} : { status: payload.targetStatus },
    sent_at: null,
    created_by: organizerId,
  }

  const { data: rawMsg, error: insertError } = await adminClient
    .from('outbound_messages')
    .insert(insertData)
    .select('id')
    .single()
  const msg = rawMsg as { id: string } | null

  if (insertError || !msg) return { error: insertError?.message ?? 'Insert failed' }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/email/send-reminder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messageId: msg.id,
        sessionId: payload.sessionId,
        subject: payload.subject,
        body: payload.body,
        targetStatus: payload.targetStatus,
      }),
    })
    if (!res.ok) {
      await adminClient
        .from('outbound_messages')
        .update({ status: 'failed' })
        .eq('id', msg.id)
      return { error: `Send failed: ${res.statusText}` }
    }
  } catch (err) {
    await adminClient
      .from('outbound_messages')
      .update({ status: 'failed' })
      .eq('id', msg.id)
    return { error: err instanceof Error ? err.message : 'Failed to send' }
  }

  return { messageId: msg.id }
}

