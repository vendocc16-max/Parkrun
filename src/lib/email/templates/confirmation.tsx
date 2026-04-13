import type { Participant, Registration, Session } from '../../../../supabase/types'

export interface ConfirmationEmailProps {
  guardianFirstName: string
  session: Session
  registrations: Array<{ participant: Participant; registration: Registration }>
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function confirmationTemplate(props: ConfirmationEmailProps): {
  subject: string
  html: string
  text: string
} {
  const { guardianFirstName, session, registrations } = props
  const subject = `You're registered for ${session.title}! 🎉`

  const participantRows = registrations
    .map(({ participant, registration }) => {
      const isWaitlisted = registration.status === 'waitlisted'
      const statusCell = isWaitlisted
        ? `<span style="color:#d97706;font-weight:600;">Waitlisted (position ${registration.waitlist_position ?? '?'})</span>`
        : `<span style="color:#059669;font-weight:600;">Confirmed</span>`
      return `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#374151;">${participant.first_name} ${participant.last_name}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#374151;">${registration.registration_number ?? 'Pending'}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;">${statusCell}</td>
      </tr>`
    })
    .join('')

  const waitlistedEntries = registrations.filter(
    ({ registration }) => registration.status === 'waitlisted',
  )
  const waitlistNote =
    waitlistedEntries.length > 0
      ? `<p style="margin:16px 0;padding:12px 16px;background:#fef3c7;border-left:4px solid #f59e0b;border-radius:4px;color:#92400e;font-size:14px;">
          Some participants are currently on the waitlist. We'll notify you if a spot opens up.
         </p>`
      : ''

  const pricingNote = session.pricing_info
    ? `<div style="margin:20px 0;padding:16px;background:#f0fdf4;border-radius:8px;">
        <strong style="color:#166534;font-size:14px;">Pricing Information</strong>
        <p style="margin:8px 0 0;color:#374151;font-size:14px;">${session.pricing_info}</p>
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
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;">Congrats, you are signed up! 🎉</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;">
              <p style="margin:0 0 20px;font-size:16px;color:#374151;">Hi ${guardianFirstName},</p>
              <p style="margin:0 0 24px;font-size:16px;color:#374151;">
                You're all set for <strong>${session.title}</strong>. Here's a summary of your registration:
              </p>
              <div style="margin:0 0 20px;padding:16px;background:#f9fafb;border-radius:8px;">
                <p style="margin:0 0 6px;color:#374151;font-size:14px;"><strong>Event:</strong> ${session.title}</p>
                <p style="margin:6px 0;color:#374151;font-size:14px;"><strong>Date:</strong> ${formatDate(session.event_date)}</p>
                ${locationRow}
              </div>
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 20px;">
                <thead>
                  <tr style="background:#f9fafb;">
                    <th style="padding:10px 12px;text-align:left;font-size:13px;color:#6b7280;border-bottom:2px solid #e5e7eb;">Participant</th>
                    <th style="padding:10px 12px;text-align:left;font-size:13px;color:#6b7280;border-bottom:2px solid #e5e7eb;">Registration No.</th>
                    <th style="padding:10px 12px;text-align:left;font-size:13px;color:#6b7280;border-bottom:2px solid #e5e7eb;">Status</th>
                  </tr>
                </thead>
                <tbody>${participantRows}</tbody>
              </table>
              ${waitlistNote}
              ${pricingNote}
              <p style="margin:20px 0;font-size:15px;color:#374151;">
                You'll receive more information as the event approaches. We look forward to seeing you there!
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

  const participantTextRows = registrations
    .map(({ participant, registration }) => {
      const status =
        registration.status === 'waitlisted'
          ? `Waitlisted (position ${registration.waitlist_position ?? '?'})`
          : 'Confirmed'
      return `- ${participant.first_name} ${participant.last_name} | Reg: ${registration.registration_number ?? 'Pending'} | ${status}`
    })
    .join('\n')

  const text = `Hi ${guardianFirstName},

Congrats, you are signed up for ${session.title}!

Event: ${session.title}
Date: ${formatDate(session.event_date)}${session.location ? `\nLocation: ${session.location}` : ''}

Registrations:
${participantTextRows}
${waitlistedEntries.length > 0 ? '\nNote: Some participants are on the waitlist. You will be notified if a spot opens up.' : ''}${session.pricing_info ? `\nPricing Information:\n${session.pricing_info}` : ''}

You'll receive more information as the event approaches.

Questions? Reply to this email. To unsubscribe from future communications, please contact the event organiser.`

  return { subject, html, text }
}
