import type { Session } from '../../../../supabase/types'

export interface ReminderEmailProps {
  firstName: string
  subject: string
  body: string
  session: Session
  replyToEmail: string
  registrationNumber: string
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function reminderTemplate(props: ReminderEmailProps): {
  subject: string
  html: string
  text: string
} {
  const { firstName, subject, body, session, replyToEmail, registrationNumber } = props

  const locationRow = session.location
    ? `<p style="margin:6px 0;color:#374151;font-size:14px;"><strong>Location:</strong> ${session.location}</p>`
    : ''

  const bodyHtml = body
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')

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
            <td style="background:#009B55;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">${session.title}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;">
              <p style="margin:0 0 20px;font-size:16px;color:#374151;">Hi ${firstName},</p>
              <div style="margin:0 0 24px;font-size:16px;color:#374151;line-height:1.6;">${bodyHtml}</div>
              <div style="margin:24px 0;padding:16px;background:#f9fafb;border-radius:8px;border-left:4px solid #009B55;">
                <p style="margin:0 0 8px;color:#374151;font-size:14px;font-weight:600;">Event Details</p>
                <p style="margin:6px 0;color:#374151;font-size:14px;"><strong>Event:</strong> ${session.title}</p>
                <p style="margin:6px 0;color:#374151;font-size:14px;"><strong>Date:</strong> ${formatDate(session.event_date)}</p>
                ${locationRow}
                <p style="margin:6px 0;color:#374151;font-size:14px;"><strong>Your Registration No.:</strong> ${registrationNumber}</p>
              </div>
              <p style="margin:20px 0;font-size:14px;color:#6b7280;">
                If you need to cancel, please contact us at <a href="mailto:${replyToEmail}" style="color:#009B55;">${replyToEmail}</a>.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                Questions? Contact us at ${replyToEmail}. To unsubscribe from future communications, please contact the event organiser.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  const text = `Hi ${firstName},

${body}

---
Event Details
Event: ${session.title}
Date: ${formatDate(session.event_date)}${session.location ? `\nLocation: ${session.location}` : ''}
Your Registration No.: ${registrationNumber}

If you need to cancel, please contact us at ${replyToEmail}.

To unsubscribe from future communications, please contact the event organiser.`

  return { subject, html, text }
}
