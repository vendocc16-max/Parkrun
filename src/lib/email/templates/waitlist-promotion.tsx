import type { Participant, Registration, Session } from '../../../../supabase/types'

export interface WaitlistPromotionEmailProps {
  guardianFirstName: string
  session: Session
  registration: Registration
  participant: Participant
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function waitlistPromotionTemplate(props: WaitlistPromotionEmailProps): {
  subject: string
  html: string
  text: string
} {
  const { guardianFirstName, session, registration, participant } = props
  const subject = `Great news — you've been confirmed for ${session.title}!`

  const pricingNote = session.pricing_info
    ? `<div style="margin:20px 0;padding:16px;background:#f0fdf4;border-radius:8px;">
        <strong style="color:#166534;font-size:14px;">Pricing Information</strong>
        <p style="margin:8px 0 0;color:#374151;font-size:14px;">${session.pricing_info}</p>
       </div>`
    : ''

  const notesSection = session.notes
    ? `<div style="margin:20px 0;padding:16px;background:#eff6ff;border-radius:8px;">
        <strong style="color:#1e40af;font-size:14px;">Session Notes</strong>
        <p style="margin:8px 0 0;color:#374151;font-size:14px;">${session.notes}</p>
       </div>`
    : ''

  const locationRow = session.location
    ? `<p style="margin:6px 0;color:#374151;font-size:14px;"><strong>Location:</strong> ${session.location}</p>`
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
            <td style="background:#009B55;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;">You're now confirmed! ✅</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;">
              <p style="margin:0 0 20px;font-size:16px;color:#374151;">Hi ${guardianFirstName},</p>
              <p style="margin:0 0 24px;font-size:16px;color:#374151;">
                Great news — a spot has opened up and <strong>${participant.first_name} ${participant.last_name}</strong> is now confirmed for <strong>${session.title}</strong>!
              </p>
              <div style="margin:0 0 20px;padding:16px;background:#f9fafb;border-radius:8px;">
                <p style="margin:0 0 6px;color:#374151;font-size:14px;"><strong>Event:</strong> ${session.title}</p>
                <p style="margin:6px 0;color:#374151;font-size:14px;"><strong>Date:</strong> ${formatDate(session.event_date)}</p>
                ${locationRow}
                <p style="margin:6px 0;color:#374151;font-size:14px;"><strong>Registration No.:</strong> ${registration.registration_number ?? 'Pending'}</p>
                <p style="margin:6px 0;font-size:14px;"><strong>Status:</strong> <span style="color:#059669;font-weight:600;">Confirmed</span></p>
              </div>
              ${pricingNote}
              ${notesSection}
              <p style="margin:20px 0;font-size:15px;color:#374151;">
                We look forward to seeing you there!
              </p>
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

Great news — a spot has opened up and ${participant.first_name} ${participant.last_name} is now confirmed for ${session.title}!

Event: ${session.title}
Date: ${formatDate(session.event_date)}${session.location ? `\nLocation: ${session.location}` : ''}
Registration No.: ${registration.registration_number ?? 'Pending'}
Status: Confirmed
${session.pricing_info ? `\nPricing Information:\n${session.pricing_info}` : ''}${session.notes ? `\nSession Notes:\n${session.notes}` : ''}

We look forward to seeing you there!

Questions? Reply to this email. To unsubscribe from future communications, please contact the event organiser.`

  return { subject, html, text }
}
