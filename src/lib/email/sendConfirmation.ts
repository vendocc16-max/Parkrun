import { resend, EMAIL_FROM } from './resend'

interface SendConfirmationParams {
  to: string
  guardianFirstName: string
  sessionTitle: string
  eventDate: string
  eventLocation: string | null
  registrationNumbers: string[]
  status: 'confirmed' | 'waitlisted'
}

export async function sendConfirmationEmail({
  to,
  guardianFirstName,
  sessionTitle,
  eventDate,
  eventLocation,
  registrationNumbers,
  status,
}: SendConfirmationParams) {
  const formattedDate = new Date(eventDate).toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const isConfirmed = status === 'confirmed'
  const subject = isConfirmed
    ? `🎉 You're registered for ${sessionTitle}`
    : `You're on the waitlist for ${sessionTitle}`

  const registrationList = registrationNumbers
    .map((n) => `<li style="font-family:monospace;font-size:16px;font-weight:bold;">${n}</li>`)
    .join('')

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
      <h1 style="color:#15803d;font-size:24px;margin-bottom:8px;">
        ${isConfirmed ? '🎉 Registration confirmed!' : '⏳ You\'re on the waitlist'}
      </h1>
      <p style="color:#374151;font-size:16px;">Hi ${guardianFirstName},</p>
      <p style="color:#374151;font-size:16px;">
        ${
          isConfirmed
            ? `Your registration for <strong>${sessionTitle}</strong> is confirmed.`
            : `You've been added to the waitlist for <strong>${sessionTitle}</strong>. We'll notify you if a spot becomes available.`
        }
      </p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:24px 0;">
        <p style="margin:0 0 8px;color:#374151;font-size:14px;font-weight:600;">Event details</p>
        <p style="margin:0 0 4px;color:#374151;font-size:14px;">📅 ${formattedDate}</p>
        ${eventLocation ? `<p style="margin:0;color:#374151;font-size:14px;">📍 ${eventLocation}</p>` : ''}
      </div>
      ${
        registrationNumbers.length > 0
          ? `<div style="margin:24px 0;">
              <p style="color:#374151;font-size:14px;font-weight:600;margin-bottom:8px;">
                Your registration number${registrationNumbers.length > 1 ? 's' : ''}:
              </p>
              <ul style="list-style:none;padding:0;margin:0;">${registrationList}</ul>
            </div>`
          : ''
      }
      <p style="color:#6b7280;font-size:13px;border-top:1px solid #e5e7eb;padding-top:16px;margin-top:24px;">
        This is an automated message from Parkrun Registration. Please do not reply to this email.
      </p>
    </div>
  `

  return resend.emails.send({ from: EMAIL_FROM, to, subject, html })
}
