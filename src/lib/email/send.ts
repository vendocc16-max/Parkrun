import { resend, EMAIL_FROM } from './resend'
import { createAdminClient } from '../supabase/admin'
import { confirmationTemplate } from './templates/confirmation'
import { waitlistPromotionTemplate } from './templates/waitlist-promotion'
import { reminderTemplate } from './templates/reminder'
import { cancellationTemplate } from './templates/cancellation'
import { captureException, addBreadcrumb } from '../sentry'
import type {
  Participant,
  Registration,
  Session,
  InsertOutboundMessage,
  InsertMessageDelivery,
} from '../../../supabase/types'

interface SendResult {
  success: boolean
  messageId?: string
  error?: string
}

interface BulkSendResult {
  sent: number
  failed: number
  results: Array<{ email: string; success: boolean; messageId?: string }>
}

async function createOutboundMessage(
  params: InsertOutboundMessage,
): Promise<string | null> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('outbound_messages')
      .insert(params)
      .select('id')
      .single()
    if (error || !data) return null
    return (data as { id: string }).id
  } catch {
    return null
  }
}

async function logDelivery(params: InsertMessageDelivery): Promise<void> {
  try {
    const admin = createAdminClient()
    await admin.from('message_deliveries').insert(params)
  } catch {
    // Delivery logging is best-effort; do not surface DB errors to callers
  }
}

async function updateOutboundMessageStatus(
  id: string,
  status: 'sent' | 'failed',
): Promise<void> {
  try {
    const admin = createAdminClient()
    await admin
      .from('outbound_messages')
      .update({ status, sent_at: status === 'sent' ? new Date().toISOString() : null })
      .eq('id', id)
  } catch {
    // Best-effort
  }
}

export async function sendConfirmationEmail(params: {
  to: string
  guardianFirstName: string
  session: Session
  registrations: Array<{ participant: Participant; registration: Registration }>
}): Promise<SendResult> {
  try {
    const { to, guardianFirstName, session, registrations } = params
    const template = confirmationTemplate({ guardianFirstName, session, registrations })

    const guardianId = registrations[0]?.registration.guardian_id

    const outboundMessageId = await createOutboundMessage({
      session_id: session.id,
      subject: template.subject,
      body: template.text,
      message_type: 'confirmation',
      status: 'queued',
      target_filter: {
        guardian_id: guardianId,
        registration_ids: registrations.map(({ registration }) => registration.id),
      },
      sent_at: null,
      created_by: null,
    })

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    })

    if (emailError) {
      if (outboundMessageId) {
        await updateOutboundMessageStatus(outboundMessageId, 'failed')
      }
      addBreadcrumb('Confirmation email send failed', {
        to,
        messageId: outboundMessageId,
        sessionId: session.id,
      }, 'email')
      captureException(new Error(`Email send failed: ${emailError.message}`), {
        context: 'confirmation_email',
        to,
        sessionId: session.id,
        errorMessage: emailError.message,
      })
      return { success: false, error: emailError.message }
    }

    const resendMessageId = emailData?.id ?? null

    if (outboundMessageId) {
      await updateOutboundMessageStatus(outboundMessageId, 'sent')
      if (guardianId) {
        await logDelivery({
          message_id: outboundMessageId,
          guardian_id: guardianId,
          email: to,
          status: 'sent',
          resend_message_id: resendMessageId,
          sent_at: new Date().toISOString(),
        })
      }
    }

    addBreadcrumb('Confirmation email sent successfully', {
      to,
      sessionId: session.id,
      messageId: resendMessageId,
    }, 'email')

    return { success: true, messageId: resendMessageId ?? undefined }
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err))
    captureException(error, {
      context: 'sendConfirmationEmail',
      to: params.to,
      sessionId: params.session.id,
    })
    return { success: false, error: error.message }
  }
}

export async function sendWaitlistPromotionEmail(params: {
  to: string
  guardianFirstName: string
  session: Session
  registration: Registration
  participant: Participant
}): Promise<SendResult> {
  try {
    const { to, guardianFirstName, session, registration, participant } = params
    const template = waitlistPromotionTemplate({
      guardianFirstName,
      session,
      registration,
      participant,
    })

    const outboundMessageId = await createOutboundMessage({
      session_id: session.id,
      subject: template.subject,
      body: template.text,
      message_type: 'confirmation',
      status: 'queued',
      target_filter: {
        guardian_id: registration.guardian_id,
        registration_id: registration.id,
      },
      sent_at: null,
      created_by: null,
    })

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    })

    if (emailError) {
      if (outboundMessageId) {
        await updateOutboundMessageStatus(outboundMessageId, 'failed')
      }
      addBreadcrumb('Waitlist promotion email send failed', {
        to,
        messageId: outboundMessageId,
        sessionId: session.id,
      }, 'email')
      captureException(new Error(`Waitlist email send failed: ${emailError.message}`), {
        context: 'waitlist_promotion_email',
        to,
        sessionId: session.id,
        registrationId: registration.id,
        errorMessage: emailError.message,
      })
      return { success: false, error: emailError.message }
    }

    const resendMessageId = emailData?.id ?? null

    if (outboundMessageId) {
      await updateOutboundMessageStatus(outboundMessageId, 'sent')
      await logDelivery({
        message_id: outboundMessageId,
        guardian_id: registration.guardian_id,
        email: to,
        status: 'sent',
        resend_message_id: resendMessageId,
        sent_at: new Date().toISOString(),
      })
    }

    addBreadcrumb('Waitlist promotion email sent successfully', {
      to,
      sessionId: session.id,
      registrationId: registration.id,
    }, 'email')

    return { success: true, messageId: resendMessageId ?? undefined }
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err))
    captureException(error, {
      context: 'sendWaitlistPromotionEmail',
      to: params.to,
      sessionId: params.session.id,
      registrationId: params.registration.id,
    })
    return { success: false, error: error.message }
  }
}

export async function sendCancellationEmail(params: {
  to: string
  guardianFirstName: string
  session: Session
  registration: Registration
  cancelledByOrganizer?: boolean
}): Promise<SendResult> {
  try {
    const { to, guardianFirstName, session, registration, cancelledByOrganizer } = params
    const template = cancellationTemplate({
      guardianFirstName,
      session,
      registration,
      cancelledByOrganizer,
    })

    const outboundMessageId = await createOutboundMessage({
      session_id: session.id,
      subject: template.subject,
      body: template.text,
      message_type: 'cancellation_notice',
      status: 'queued',
      target_filter: {
        guardian_id: registration.guardian_id,
        registration_id: registration.id,
      },
      sent_at: null,
      created_by: null,
    })

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    })

    if (emailError) {
      if (outboundMessageId) {
        await updateOutboundMessageStatus(outboundMessageId, 'failed')
      }
      addBreadcrumb('Cancellation email send failed', {
        to,
        messageId: outboundMessageId,
        sessionId: session.id,
      }, 'email')
      captureException(new Error(`Cancellation email send failed: ${emailError.message}`), {
        context: 'cancellation_email',
        to,
        sessionId: session.id,
        registrationId: registration.id,
        errorMessage: emailError.message,
      })
      return { success: false, error: emailError.message }
    }

    const resendMessageId = emailData?.id ?? null

    if (outboundMessageId) {
      await updateOutboundMessageStatus(outboundMessageId, 'sent')
      await logDelivery({
        message_id: outboundMessageId,
        guardian_id: registration.guardian_id,
        email: to,
        status: 'sent',
        resend_message_id: resendMessageId,
        sent_at: new Date().toISOString(),
      })
    }

    addBreadcrumb('Cancellation email sent successfully', {
      to,
      sessionId: session.id,
      registrationId: registration.id,
    }, 'email')

    return { success: true, messageId: resendMessageId ?? undefined }
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err))
    captureException(error, {
      context: 'sendCancellationEmail',
      to: params.to,
      sessionId: params.session.id,
      registrationId: params.registration.id,
    })
    return { success: false, error: error.message }
  }
}

export async function sendBulkReminder(params: {
  subject: string
  body: string
  session: Session
  recipients: Array<{ email: string; firstName: string; registrationNumber: string }>
}): Promise<BulkSendResult> {
  const { subject, body, session, recipients } = params
  const results: BulkSendResult['results'] = []

  for (const recipient of recipients) {
    try {
      const template = reminderTemplate({
        firstName: recipient.firstName,
        subject,
        body,
        session,
        replyToEmail: EMAIL_FROM,
        registrationNumber: recipient.registrationNumber,
      })

      const { data: emailData, error: emailError } = await resend.emails.send({
        from: EMAIL_FROM,
        to: recipient.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
        replyTo: EMAIL_FROM,
      })

      if (emailError) {
        addBreadcrumb('Bulk reminder email send failed', {
          to: recipient.email,
          sessionId: session.id,
        }, 'email')
        captureException(new Error(`Bulk reminder failed: ${emailError.message}`), {
          context: 'bulk_reminder_email',
          to: recipient.email,
          sessionId: session.id,
          errorMessage: emailError.message,
        })
        results.push({ email: recipient.email, success: false })
      } else {
        results.push({
          email: recipient.email,
          success: true,
          messageId: emailData?.id ?? undefined,
        })
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      captureException(error, {
        context: 'bulk_reminder_email_exception',
        to: recipient.email,
        sessionId: session.id,
      })
      results.push({ email: recipient.email, success: false })
    }
  }

  const sent = results.filter((r) => r.success).length
  const failed = results.filter((r) => !r.success).length

  addBreadcrumb('Bulk reminder send completed', {
    sessionId: session.id,
    total: recipients.length,
    sent,
    failed,
  }, 'email')

  return { sent, failed, results }
}
