// =============================================================
// supabase/types.ts
// TypeScript types for the Parkrun Supabase schema
// =============================================================

// Supabase-compatible JSON type (required by supabase-js v2 type inference)
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

// =============================================================
// Enum union types
// =============================================================

export type OrganizerRole = 'owner' | 'admin' | 'editor' | 'messaging_only'

export type SessionStatus = 'draft' | 'published' | 'full' | 'closed' | 'cancelled'

export type RegistrationStatus =
  | 'confirmed'
  | 'cancelled'
  | 'waitlisted'
  | 'duplicate_flagged'
  | 'blocked'

export type MessageType =
  | 'confirmation'
  | 'reminder'
  | 'pricing_info'
  | 'cancellation_notice'
  | 'general'

export type MessageStatus = 'draft' | 'queued' | 'sending' | 'sent' | 'failed'

export type DeliveryStatus = 'queued' | 'sent' | 'delivered' | 'bounced' | 'failed'

// =============================================================
// Table row interfaces (mirrors DB column names exactly)
// =============================================================

export type Organizer = {
  id: string
  user_id: string | null
  email: string
  full_name: string | null
  created_at: string
  updated_at: string
}

export type OrganizerRole_ = {
  id: string
  organizer_id: string
  role: OrganizerRole
  created_at: string
}

export type Session = {
  id: string
  slug: string
  title: string
  description: string | null
  location: string | null
  event_date: string
  registration_opens_at: string | null
  registration_closes_at: string | null
  capacity: number
  waitlist_enabled: boolean
  status: SessionStatus
  pricing_info: string | null
  notes: string | null
  promotion_rank: number | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export type Guardian = {
  id: string
  email: string
  first_name: string
  last_name: string
  phone: string | null
  emergency_contact: string | null
  created_at: string
  updated_at: string
}

export type Participant = {
  id: string
  guardian_id: string
  first_name: string
  last_name: string
  date_of_birth: string | null
  is_child: boolean
  medical_notes: string | null
  created_at: string
  updated_at: string
}

export type Registration = {
  id: string
  session_id: string
  participant_id: string
  guardian_id: string
  status: RegistrationStatus
  /** Auto-generated PKR-YYYY-NNNNN identifier; null until the insert trigger fires */
  registration_number: string | null
  source_ip: string | null
  source_metadata: Json | null
  waitlist_position: number | null
  confirmed_at: string | null
  cancelled_at: string | null
  cancellation_reason: string | null
  messaging_opt_out: boolean
  created_at: string
  updated_at: string
}

export type Consent = {
  id: string
  registration_id: string
  guardian_id: string
  consent_terms: boolean
  consent_privacy: boolean
  consent_child_registration: boolean
  ip_address: string | null
  user_agent: string | null
  /** Immutable after creation; no updated_at by design */
  consented_at: string
}

export type OutboundMessage = {
  id: string
  /** Nullable — broadcast messages may not be tied to a single session */
  session_id: string | null
  subject: string
  body: string
  message_type: MessageType
  status: MessageStatus
  target_filter: Json | null
  sent_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export type MessageDelivery = {
  id: string
  message_id: string
  guardian_id: string
  email: string | null
  status: DeliveryStatus
  /** Resend API message ID for webhook-based status updates */
  resend_message_id: string | null
  sent_at: string | null
  created_at: string
}

export type RateLimitEvent = {
  id: string
  ip_address: string | null
  event_type: string
  session_id: string | null
  created_at: string
}

// =============================================================
// Insert payload types — flat types required by supabase-js v2
// (Omit<T, K> causes type inference issues with RejectExcessProperties)
// =============================================================

export type InsertOrganizer = {
  user_id?: string | null
  email: string
  full_name?: string | null
}
export type UpdateOrganizer = Partial<InsertOrganizer>

export type InsertOrganizerRole = {
  organizer_id: string
  role: OrganizerRole
}

export type InsertSession = {
  title: string
  slug: string
  description?: string | null
  location?: string | null
  event_date: string
  registration_opens_at?: string | null
  registration_closes_at?: string | null
  capacity: number
  waitlist_enabled?: boolean
  status?: SessionStatus
  pricing_info?: string | null
  notes?: string | null
  promotion_rank?: number | null
  created_by?: string | null
}
export type UpdateSession = Partial<InsertSession>

export type InsertGuardian = {
  email: string
  first_name: string
  last_name: string
  phone?: string | null
  emergency_contact?: string | null
}
export type UpdateGuardian = Partial<InsertGuardian>

export type InsertParticipant = {
  guardian_id: string
  first_name: string
  last_name: string
  date_of_birth?: string | null
  is_child?: boolean
  medical_notes?: string | null
}
export type UpdateParticipant = Partial<InsertParticipant>

/** registration_number is excluded — it is set automatically by the DB trigger */
export type InsertRegistration = {
  session_id: string
  participant_id: string
  guardian_id: string
  status: RegistrationStatus
  source_ip?: string | null
  source_metadata?: Json | null
  waitlist_position?: number | null
  confirmed_at?: string | null
  cancelled_at?: string | null
  cancellation_reason?: string | null
  messaging_opt_out?: boolean
}
export type UpdateRegistration = Partial<InsertRegistration>

export type InsertConsent = {
  registration_id: string
  guardian_id: string
  consent_terms: boolean
  consent_privacy: boolean
  consent_child_registration: boolean
  ip_address?: string | null
  user_agent?: string | null
}
/** Consents are immutable by design */
export type UpdateConsent = never

export type InsertOutboundMessage = {
  session_id?: string | null
  subject: string
  body: string
  message_type: MessageType
  status?: MessageStatus
  target_filter?: Json | null
  sent_at?: string | null
  created_by?: string | null
}
export type UpdateOutboundMessage = Partial<InsertOutboundMessage>

export type InsertMessageDelivery = {
  message_id: string
  guardian_id: string
  email?: string | null
  status: DeliveryStatus
  resend_message_id?: string | null
  sent_at?: string | null
}
export type UpdateMessageDelivery = Partial<InsertMessageDelivery>

export type InsertRateLimitEvent = {
  ip_address?: string | null
  event_type: string
  session_id?: string | null
}
/** Rate limit events are append-only */
export type UpdateRateLimitEvent = never

// =============================================================
// Database type — for use with createClient<Database>() from
// @supabase/supabase-js so all queries are fully type-safe.
// =============================================================

export type Database = {
  public: {
    Tables: {
      organizers: {
        Row: Organizer
        Insert: InsertOrganizer & { id?: string; created_at?: string; updated_at?: string }
        Update: UpdateOrganizer & { updated_at?: string }
        Relationships: []
      }
      organizer_roles: {
        Row: OrganizerRole_
        Insert: InsertOrganizerRole & { id?: string; created_at?: string }
        Update: Partial<InsertOrganizerRole>
        Relationships: [
          {
            foreignKeyName: 'organizer_roles_organizer_id_fkey'
            columns: ['organizer_id']
            referencedRelation: 'organizers'
            referencedColumns: ['id']
          },
        ]
      }
      sessions: {
        Row: Session
        Insert: InsertSession & { id?: string; created_at?: string; updated_at?: string }
        Update: UpdateSession & { updated_at?: string }
        Relationships: [
          {
            foreignKeyName: 'sessions_created_by_fkey'
            columns: ['created_by']
            referencedRelation: 'organizers'
            referencedColumns: ['id']
          },
        ]
      }
      guardians: {
        Row: Guardian
        Insert: InsertGuardian & { id?: string; created_at?: string; updated_at?: string }
        Update: UpdateGuardian & { updated_at?: string }
        Relationships: []
      }
      participants: {
        Row: Participant
        Insert: InsertParticipant & { id?: string; created_at?: string; updated_at?: string }
        Update: UpdateParticipant & { updated_at?: string }
        Relationships: [
          {
            foreignKeyName: 'participants_guardian_id_fkey'
            columns: ['guardian_id']
            referencedRelation: 'guardians'
            referencedColumns: ['id']
          },
        ]
      }
      registrations: {
        Row: Registration
        Insert: InsertRegistration & {
          id?: string
          registration_number?: string
          created_at?: string
          updated_at?: string
        }
        Update: UpdateRegistration & { updated_at?: string }
        Relationships: [
          {
            foreignKeyName: 'registrations_session_id_fkey'
            columns: ['session_id']
            referencedRelation: 'sessions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'registrations_participant_id_fkey'
            columns: ['participant_id']
            referencedRelation: 'participants'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'registrations_guardian_id_fkey'
            columns: ['guardian_id']
            referencedRelation: 'guardians'
            referencedColumns: ['id']
          },
        ]
      }
      consents: {
        Row: Consent
        Insert: InsertConsent & { id?: string; consented_at?: string }
        Update: UpdateConsent
        Relationships: [
          {
            foreignKeyName: 'consents_registration_id_fkey'
            columns: ['registration_id']
            referencedRelation: 'registrations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'consents_guardian_id_fkey'
            columns: ['guardian_id']
            referencedRelation: 'guardians'
            referencedColumns: ['id']
          },
        ]
      }
      outbound_messages: {
        Row: OutboundMessage
        Insert: InsertOutboundMessage & { id?: string; created_at?: string; updated_at?: string }
        Update: UpdateOutboundMessage & { updated_at?: string }
        Relationships: [
          {
            foreignKeyName: 'outbound_messages_session_id_fkey'
            columns: ['session_id']
            referencedRelation: 'sessions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'outbound_messages_created_by_fkey'
            columns: ['created_by']
            referencedRelation: 'organizers'
            referencedColumns: ['id']
          },
        ]
      }
      message_deliveries: {
        Row: MessageDelivery
        Insert: InsertMessageDelivery & { id?: string; created_at?: string }
        Update: UpdateMessageDelivery
        Relationships: [
          {
            foreignKeyName: 'message_deliveries_message_id_fkey'
            columns: ['message_id']
            referencedRelation: 'outbound_messages'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'message_deliveries_guardian_id_fkey'
            columns: ['guardian_id']
            referencedRelation: 'guardians'
            referencedColumns: ['id']
          },
        ]
      }
      rate_limit_events: {
        Row: RateLimitEvent
        Insert: InsertRateLimitEvent & { id?: string; created_at?: string }
        Update: UpdateRateLimitEvent
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      get_session_confirmed_count: {
        Args: { p_session_id: string }
        Returns: number
      }
      get_session_waitlist_count: {
        Args: { p_session_id: string }
        Returns: number
      }
      is_session_full: {
        Args: { p_session_id: string }
        Returns: boolean
      }
      get_next_waitlist_position: {
        Args: { p_session_id: string }
        Returns: number
      }
      is_organizer: {
        Args: Record<string, never>
        Returns: boolean
      }
    }
    Enums: {
      organizer_role: OrganizerRole
      session_status: SessionStatus
      registration_status: RegistrationStatus
      message_type: MessageType
      message_status: MessageStatus
      delivery_status: DeliveryStatus
    }
    CompositeTypes: Record<string, never>
  }
}
