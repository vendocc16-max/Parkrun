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
  DUPLICATE_CHECK_FIELDS: [
    'guardian_email',
    'participant_first_name',
    'participant_last_name',
    'session_id',
  ],
} as const

// Retention (in days)
export const RETENTION = {
  CONFIRMED_REGISTRATIONS_AFTER_EVENT_DAYS: 730, // 2 years
  CANCELLED_REGISTRATIONS_DAYS: 180, // 6 months
  UNPROMOTED_WAITLIST_AFTER_EVENT_DAYS: 30,
  RATE_LIMIT_EVENTS_DAYS: 90,
  MESSAGE_DELIVERIES_DAYS: 365,
} as const

// Organizer roles
export const ORGANIZER_ROLES = ['owner', 'admin', 'editor', 'messaging_only'] as const
export type OrganizerRole = (typeof ORGANIZER_ROLES)[number]

export const ROLE_PERMISSIONS = {
  owner: ['sessions:crud', 'participants:read', 'messaging:send', 'organizers:manage'],
  admin: ['sessions:crud', 'participants:read', 'messaging:send'],
  editor: ['sessions:crud'],
  messaging_only: ['messaging:send'],
} as const satisfies Record<OrganizerRole, string[]>
