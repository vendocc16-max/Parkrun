-- =============================================================
-- 001_initial_schema.sql
-- Core schema for the Parkrun event registration platform
-- =============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================
-- Shared trigger: keep updated_at current on every UPDATE
-- =============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- registration_counters
-- Tracks per-year sequential counters for registration numbers.
-- Accessed exclusively through the SECURITY DEFINER function
-- generate_registration_number() to ensure atomicity.
-- =============================================================
CREATE TABLE IF NOT EXISTS registration_counters (
  year    int  PRIMARY KEY,
  counter int  NOT NULL DEFAULT 0
);

-- =============================================================
-- generate_registration_number()
-- Returns the next PKR-YYYY-NNNNN string atomically using an
-- INSERT ... ON CONFLICT upsert on registration_counters.
-- SECURITY DEFINER so the trigger can write this table even
-- when called from an anon/public role context.
-- =============================================================
CREATE OR REPLACE FUNCTION generate_registration_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_year int;
  next_count   int;
BEGIN
  current_year := EXTRACT(YEAR FROM now())::int;

  INSERT INTO registration_counters (year, counter)
  VALUES (current_year, 1)
  ON CONFLICT (year) DO UPDATE
    SET counter = registration_counters.counter + 1
  RETURNING counter INTO next_count;

  RETURN 'PKR-' || current_year::text || '-' || LPAD(next_count::text, 5, '0');
END;
$$;

-- =============================================================
-- organizers — internal users who manage sessions
-- Linked 1-to-1 with auth.users via user_id.
-- =============================================================
CREATE TABLE IF NOT EXISTS organizers (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email      text        NOT NULL,
  full_name  text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_organizers_user_id ON organizers(user_id);
CREATE INDEX IF NOT EXISTS idx_organizers_email   ON organizers(email);

DROP TRIGGER IF EXISTS trg_organizers_updated_at ON organizers;
CREATE TRIGGER trg_organizers_updated_at
  BEFORE UPDATE ON organizers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================
-- organizer_roles — role per organizer
-- A single organizer may hold one or more roles.
-- =============================================================
CREATE TABLE IF NOT EXISTS organizer_roles (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id uuid        NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
  role         text        NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT chk_organizer_role
    CHECK (role IN ('owner', 'admin', 'editor', 'messaging_only'))
);

CREATE INDEX IF NOT EXISTS idx_organizer_roles_organizer_id ON organizer_roles(organizer_id);

-- =============================================================
-- sessions — individual parkrun events
-- =============================================================
CREATE TABLE IF NOT EXISTS sessions (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                    text        UNIQUE NOT NULL,
  title                   text        NOT NULL,
  description             text,
  location                text,
  event_date              timestamptz NOT NULL,
  registration_opens_at   timestamptz,
  registration_closes_at  timestamptz,
  capacity                int         NOT NULL DEFAULT 50,
  waitlist_enabled        bool        NOT NULL DEFAULT true,
  status                  text        NOT NULL DEFAULT 'draft',
  -- Informational pricing text; no payment processing in-app
  pricing_info            text,
  notes                   text,
  created_by              uuid        REFERENCES organizers(id) ON DELETE SET NULL,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT chk_session_status
    CHECK (status IN ('draft', 'published', 'full', 'closed', 'cancelled')),
  CONSTRAINT chk_session_capacity
    CHECK (capacity > 0),
  CONSTRAINT chk_session_registration_window
    CHECK (
      registration_opens_at IS NULL
      OR registration_closes_at IS NULL
      OR registration_opens_at < registration_closes_at
    )
);

CREATE INDEX IF NOT EXISTS idx_sessions_slug       ON sessions(slug);
CREATE INDEX IF NOT EXISTS idx_sessions_status     ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_event_date ON sessions(event_date);
CREATE INDEX IF NOT EXISTS idx_sessions_created_by ON sessions(created_by);

DROP TRIGGER IF EXISTS trg_sessions_updated_at ON sessions;
CREATE TRIGGER trg_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================
-- guardians — adult contact record
-- One guardian can register multiple participants (e.g. their children).
-- =============================================================
CREATE TABLE IF NOT EXISTS guardians (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email             text        NOT NULL,
  first_name        text        NOT NULL,
  last_name         text        NOT NULL,
  phone             text,
  -- Free-text: "Jane Smith — 07700 900000 (spouse)"
  emergency_contact text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_guardians_email ON guardians(email);

DROP TRIGGER IF EXISTS trg_guardians_updated_at ON guardians;
CREATE TRIGGER trg_guardians_updated_at
  BEFORE UPDATE ON guardians
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================
-- participants — person attending the event
-- May be the guardian themselves (adult runner) or a child.
-- =============================================================
CREATE TABLE IF NOT EXISTS participants (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  guardian_id    uuid        NOT NULL REFERENCES guardians(id) ON DELETE CASCADE,
  first_name     text        NOT NULL,
  last_name      text        NOT NULL,
  date_of_birth  date,
  is_child       bool        NOT NULL DEFAULT false,
  medical_notes  text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_participants_guardian_id ON participants(guardian_id);

DROP TRIGGER IF EXISTS trg_participants_updated_at ON participants;
CREATE TRIGGER trg_participants_updated_at
  BEFORE UPDATE ON participants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================
-- registrations — join of a participant to a session
-- ON DELETE RESTRICT on session/participant/guardian FKs
-- prevents accidental data loss of registration records.
-- =============================================================
CREATE TABLE IF NOT EXISTS registrations (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id            uuid        NOT NULL REFERENCES sessions(id)     ON DELETE RESTRICT,
  participant_id        uuid        NOT NULL REFERENCES participants(id)  ON DELETE RESTRICT,
  guardian_id           uuid        NOT NULL REFERENCES guardians(id)     ON DELETE RESTRICT,
  status                text        NOT NULL DEFAULT 'confirmed',
  -- Human-readable identifier set by trigger; format: PKR-YYYY-NNNNN
  registration_number   text        UNIQUE,
  -- IP and metadata captured server-side for abuse detection
  source_ip             text,
  source_metadata       jsonb,
  waitlist_position     int,
  confirmed_at          timestamptz,
  cancelled_at          timestamptz,
  cancellation_reason   text,
  messaging_opt_out     bool        NOT NULL DEFAULT false,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT chk_registration_status
    CHECK (status IN ('confirmed', 'cancelled', 'waitlisted', 'duplicate_flagged', 'blocked')),
  CONSTRAINT chk_waitlist_position
    CHECK (waitlist_position IS NULL OR waitlist_position > 0)
);

CREATE INDEX IF NOT EXISTS idx_registrations_session_id          ON registrations(session_id);
CREATE INDEX IF NOT EXISTS idx_registrations_participant_id      ON registrations(participant_id);
CREATE INDEX IF NOT EXISTS idx_registrations_guardian_id         ON registrations(guardian_id);
CREATE INDEX IF NOT EXISTS idx_registrations_status              ON registrations(status);
CREATE INDEX IF NOT EXISTS idx_registrations_registration_number ON registrations(registration_number);
CREATE INDEX IF NOT EXISTS idx_registrations_created_at          ON registrations(created_at);
-- Composite index used by capacity counting queries
CREATE INDEX IF NOT EXISTS idx_registrations_session_status      ON registrations(session_id, status);

-- Partial unique index: one active registration per participant per session.
-- Cancelled registrations are excluded so re-registration is allowed.
CREATE UNIQUE INDEX IF NOT EXISTS idx_registrations_unique_active
  ON registrations(session_id, participant_id)
  WHERE status <> 'cancelled';

-- Trigger function: auto-assign registration_number before insert
CREATE OR REPLACE FUNCTION trg_set_registration_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.registration_number IS NULL THEN
    NEW.registration_number := generate_registration_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_registrations_set_number ON registrations;
CREATE TRIGGER trg_registrations_set_number
  BEFORE INSERT ON registrations
  FOR EACH ROW EXECUTE FUNCTION trg_set_registration_number();

DROP TRIGGER IF EXISTS trg_registrations_updated_at ON registrations;
CREATE TRIGGER trg_registrations_updated_at
  BEFORE UPDATE ON registrations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================
-- consents — legal consent records per registration
-- Intentionally has no updated_at; consent records are immutable
-- after creation for audit purposes.
-- =============================================================
CREATE TABLE IF NOT EXISTS consents (
  id                        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id           uuid        NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  guardian_id               uuid        NOT NULL REFERENCES guardians(id)     ON DELETE RESTRICT,
  consent_terms             bool        NOT NULL,
  consent_privacy           bool        NOT NULL,
  consent_child_registration bool       NOT NULL DEFAULT false,
  ip_address                text,
  user_agent                text,
  consented_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consents_registration_id ON consents(registration_id);
CREATE INDEX IF NOT EXISTS idx_consents_guardian_id     ON consents(guardian_id);

-- =============================================================
-- outbound_messages — reminder and announcement tracking
-- session_id is nullable to support broadcast messages not
-- tied to a specific event.
-- =============================================================
CREATE TABLE IF NOT EXISTS outbound_messages (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    uuid        REFERENCES sessions(id) ON DELETE SET NULL,
  subject       text        NOT NULL,
  body          text        NOT NULL,
  message_type  text        NOT NULL,
  status        text        NOT NULL DEFAULT 'draft',
  -- JSON filter used by the send job, e.g. {"status":"confirmed","session_id":"..."}
  target_filter jsonb,
  sent_at       timestamptz,
  created_by    uuid        REFERENCES organizers(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT chk_message_type
    CHECK (message_type IN ('confirmation', 'reminder', 'pricing_info', 'cancellation_notice', 'general')),
  CONSTRAINT chk_message_status
    CHECK (status IN ('draft', 'queued', 'sending', 'sent', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_outbound_messages_session_id  ON outbound_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_outbound_messages_status      ON outbound_messages(status);
CREATE INDEX IF NOT EXISTS idx_outbound_messages_created_by  ON outbound_messages(created_by);

DROP TRIGGER IF EXISTS trg_outbound_messages_updated_at ON outbound_messages;
CREATE TRIGGER trg_outbound_messages_updated_at
  BEFORE UPDATE ON outbound_messages
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================
-- message_deliveries — per-recipient delivery record
-- resend_message_id stores the ID returned by Resend's API
-- for webhook-based delivery status tracking.
-- =============================================================
CREATE TABLE IF NOT EXISTS message_deliveries (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id        uuid        NOT NULL REFERENCES outbound_messages(id) ON DELETE CASCADE,
  guardian_id       uuid        NOT NULL REFERENCES guardians(id)          ON DELETE RESTRICT,
  email             text,
  status            text        NOT NULL DEFAULT 'queued',
  resend_message_id text,
  sent_at           timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT chk_delivery_status
    CHECK (status IN ('queued', 'sent', 'delivered', 'bounced', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_message_deliveries_message_id ON message_deliveries(message_id);
CREATE INDEX IF NOT EXISTS idx_message_deliveries_guardian_id ON message_deliveries(guardian_id);
CREATE INDEX IF NOT EXISTS idx_message_deliveries_status      ON message_deliveries(status);
-- Composite for webhook lookups by Resend message ID
CREATE INDEX IF NOT EXISTS idx_message_deliveries_resend_id
  ON message_deliveries(resend_message_id)
  WHERE resend_message_id IS NOT NULL;

-- =============================================================
-- rate_limit_events — abuse / brute-force tracking
-- session_id is nullable; event_type is free-text (e.g.
-- 'registration_attempt', 'otp_request').
-- =============================================================
CREATE TABLE IF NOT EXISTS rate_limit_events (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text,
  event_type text        NOT NULL,
  session_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_events_ip_address ON rate_limit_events(ip_address);
CREATE INDEX IF NOT EXISTS idx_rate_limit_events_created_at ON rate_limit_events(created_at);
-- Composite used by the rate-limit check query
CREATE INDEX IF NOT EXISTS idx_rate_limit_events_ip_type_time
  ON rate_limit_events(ip_address, event_type, created_at);
