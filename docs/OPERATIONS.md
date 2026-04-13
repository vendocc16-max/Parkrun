# Operations Reference

## Organizer Roles

| Role | Sessions CRUD | View Participants | Send Messages | Manage Organizers |
|------|:---:|:---:|:---:|:---:|
| `owner` | ✅ | ✅ | ✅ | ✅ |
| `admin` | ✅ | ✅ | ✅ | ❌ |
| `editor` | ✅ | ❌ | ❌ | ❌ |
| `messaging_only` | ❌ | ❌ | ✅ | ❌ |

**Role definitions:**

- **`owner`** — Full access. Can do everything below, plus add/remove organizers and change their roles.
- **`admin`** — Can create, update, and delete sessions; view all participant registrations for their sessions; send messages and reminders to registrants.
- **`editor`** — Can create and edit sessions only. Cannot view individual participant data, send messages, or manage organizers.
- **`messaging_only`** — Can only send messages or reminders to existing registrants for sessions they are assigned to. No structural access.

Role checks are enforced server-side on every API route. Do not rely on client-side role checks for security.

---

## Consent and Legal Rules

- Every registration requires `terms_accepted = true` and `privacy_accepted = true` before submission is accepted.
- Child registrations (`is_child = true`) additionally require `consent_child_registration = true`.
- Consent records **must** capture:
  - `ip_address` — the IP of the submitting client
  - `user_agent` — the browser/client user agent string
  - `consented_at` — timestamp at acceptance
- Consent records are tied to their registration record and **must be retained for the full lifetime of the registration**. They are not deleted when a registration is soft-deleted (participant data anonymisation); only the participant PII fields are cleared.

---

## Data Retention Policy

| Data type | Retention period | Trigger |
|-----------|-----------------|---------|
| Confirmed registrations | 2 years (730 days) | After event date |
| Cancelled registrations | 6 months (180 days) | After cancellation date |
| Waitlisted (never promoted) | 30 days | After event date |
| Rate limit events | 90 days | After event date |
| Message delivery records | 1 year (365 days) | After send date |

The cleanup cron job at `/api/cron/cleanup-stale-registrations` runs daily at 02:00 UTC and applies these rules. See `vercel.json` for the schedule.

---

## Cancellation and Waitlist Rules

- Any organizer with `owner` or `admin` role can cancel a registration on behalf of a participant.
- When a **confirmed** registration is cancelled:
  1. Its status is set to `cancelled`.
  2. The next waitlisted entry for the same session (lowest `waitlist_position`) is automatically promoted to `confirmed`.
  3. A notification email is triggered to the newly promoted participant.
- A participant (identified by guardian email + participant name) can appear on the waitlist **at most once per session**.
- The waitlist is **FIFO** — entries are promoted strictly in ascending `waitlist_position` order.
- The waitlist promotion cron runs every 15 minutes at `/api/cron/promote-waitlist` as a safety net, but promotion should also happen synchronously on cancellation.

---

## Anti-Spam and Rate Limiting Rules

- **IP rate limit:** Max 3 registration attempts per IP address per session within any 10-minute window. Attempts beyond this return HTTP 429.
- **Email cap:** Max 2 successful (confirmed or waitlisted) registrations from the same email address per session. This covers the one-adult + one-child scenario.
- **Session capacity:** Sessions have a hard `capacity` field. No confirmed registration can be created once confirmed count ≥ capacity. Submissions that would exceed capacity are placed on the waitlist.
- **Duplicate detection:** A submission is flagged as `duplicate_flagged` if `guardian_email` + `participant_first_name` + `participant_last_name` + `session_id` matches an existing non-cancelled registration. Flagged submissions must be manually reviewed by an organizer before they are accepted.

---

## Data Export and Deletion Workflow

### Export
Organizers with `owner` or `admin` role can export registrations for any of their sessions as CSV via `GET /api/sessions/:id/export`. The export includes participant name, email, registration status, and check-in status. It excludes medical notes and consent metadata.

### Participant data deletion (soft delete)
To comply with deletion requests while preserving referential integrity:

1. Set `first_name = '[deleted]'`
2. Set `last_name = '[deleted]'`
3. Set `email = '[deleted]@deleted.invalid'`
4. Set `date_of_birth = NULL`
5. Set `medical_notes = NULL`
6. Set `deleted_at = NOW()`

The registration record, consent metadata, and waitlist position remain intact so that capacity and waitlist logic are not corrupted. Consent records retain their `ip_address` and `user_agent` for legal audit purposes but are no longer linkable to a named individual.

---

## `src/lib/config/rules.ts` — Business Rules Constants

> **Note:** `src/lib/config/rules.ts` has not been created yet because the Next.js project has not been scaffolded. Once `npm create next-app` or equivalent has been run and `src/lib/` exists, create this file with the following content:

```typescript
// Rate limiting
export const RATE_LIMIT = {
  REGISTRATION_ATTEMPTS_PER_IP_PER_SESSION: 3,
  REGISTRATION_ATTEMPTS_WINDOW_MINUTES: 10,
  MAX_REGISTRATIONS_PER_EMAIL_PER_SESSION: 2,
} as const

// Registration
export const REGISTRATION = {
  MAX_PARTICIPANTS_PER_SUBMISSION: 5,
  MIN_PARTICIPANTS_PER_SUBMISSION: 1,
  DUPLICATE_CHECK_FIELDS: ['guardian_email', 'participant_first_name', 'participant_last_name', 'session_id'],
} as const

// Retention (in days)
export const RETENTION = {
  CONFIRMED_REGISTRATIONS_AFTER_EVENT_DAYS: 730, // 2 years
  CANCELLED_REGISTRATIONS_DAYS: 180,             // 6 months
  UNPROMOTED_WAITLIST_AFTER_EVENT_DAYS: 30,
  RATE_LIMIT_EVENTS_DAYS: 90,
  MESSAGE_DELIVERIES_DAYS: 365,
} as const

// Organizer roles
export const ORGANIZER_ROLES = ['owner', 'admin', 'editor', 'messaging_only'] as const
export type OrganizerRole = typeof ORGANIZER_ROLES[number]

export const ROLE_PERMISSIONS = {
  owner: ['sessions:crud', 'participants:read', 'messaging:send', 'organizers:manage'],
  admin: ['sessions:crud', 'participants:read', 'messaging:send'],
  editor: ['sessions:crud'],
  messaging_only: ['messaging:send'],
} as const satisfies Record<OrganizerRole, string[]>
```
