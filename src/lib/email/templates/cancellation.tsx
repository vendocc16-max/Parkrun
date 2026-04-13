import type { Registration, Session } from '../../../../supabase/types'

export interface CancellationEmailProps {
  guardianFirstName: string
  session: Session
  registration: Registration
  cancelledByOrganizer?: boolean
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function cancellationTemplate(props: CancellationEmailProps): {
  subject: string
  html: string
  text: string
} {
  const { guardianFirstName, session, registration, cancelledByOrganizer = false } = props
  const subject = `Your registration for ${session.title} has been cancelled`

  const organizerNote = cancelledByOrganizer
    ? `<p style="margin:16px 0;padding:12px 16px;background:#fef2f2;border-left:4px solid #ef4444;border-radius:4px;color:#991b1b;font-size:14px;">
        This cancellation was made by the event organiser. Please contact us if this was unexpected.
       </p>`
    : ''

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:#6b7280;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;">Registration Cancelled</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;">
              <p style="margin:0 0 20px;font-size:16px;color:#374151;">Hi ${guardianFirstName},</p>
              <p style="margin:0 0 16px;font-size:16px;color:#374151;">Your registration has been cancelled.</p>
              ${organizerNote}
              <div style="margin:20px 0;padding:16px;background:#f9fafb;border-radius:8px;">
                <p style="margin:0 0 6px;color:#374151;font-size:14px;"><strong>Event:</strong> ${session.title}</p>
                <p style="margin:6px 0;color:#374151;font-size:14px;"><strong>Date:</strong> ${formatDate(session.event_date)}</p>
                <p style="margin:6px 0;color:#374151;font-size:14px;"><strong>Original Registration No.:</strong> ${registration.registration_number ?? 'N/A'}</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                Questions? Reply to this email. To unsubscribe from future communications, please contact the event organiser.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  const text = `Hi ${guardianFirstName},

Your registration has been cancelled.
${cancelledByOrganizer ? '\nThis cancellation was made by the event organiser. Please contact us if this was unexpected.\n' : ''}
Event: ${session.title}
Date: ${formatDate(session.event_date)}
Original Registration No.: ${registration.registration_number ?? 'N/A'}

Questions? Reply to this email. To unsubscribe from future communications, please contact the event organiser.`

  return { subject, html, text }
}
