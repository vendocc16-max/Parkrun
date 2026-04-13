-- =============================================================
-- 002_rls_policies.sql
-- Row Level Security policies for the Parkrun schema
--
-- Design principles:
--   • Service role (used server-side in Next.js API routes) bypasses
--     RLS by default, so "service role only" tables simply have RLS
--     enabled with no permissive policies for anon/authenticated roles.
--   • Public-facing registration flow runs entirely through the
--     service role; end-users never query guardians/participants/
--     registrations/consents directly.
--   • Organizers authenticate via Supabase Auth; their user_id is
--     checked against the organizers table via is_organizer().
-- =============================================================

-- =============================================================
-- Enable RLS on every table
-- =============================================================
ALTER TABLE registration_counters  ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizers             ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizer_roles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions               ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardians              ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants           ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations          ENABLE ROW LEVEL SECURITY;
ALTER TABLE consents               ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbound_messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_deliveries     ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_events      ENABLE ROW LEVEL SECURITY;

-- =============================================================
-- Helper: returns true if the current auth user has a row in
-- organizers. SECURITY DEFINER bypasses the organizers RLS
-- policy so the function can see all rows regardless of caller.
-- =============================================================
CREATE OR REPLACE FUNCTION is_organizer()
RETURNS bool
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM   organizers
    WHERE  user_id = auth.uid()
  );
$$;

-- =============================================================
-- registration_counters
-- Accessible only via generate_registration_number() (SECURITY
-- DEFINER). No direct public or organizer access needed.
-- =============================================================
-- No policies added → all direct access is denied for non-service roles.

-- =============================================================
-- organizers
-- Each organizer can read only their own row.
-- Inserts and updates are performed by the service role.
-- =============================================================
DROP POLICY IF EXISTS "organizers_select_own" ON organizers;
CREATE POLICY "organizers_select_own"
  ON organizers
  FOR SELECT
  USING (auth.uid() = user_id);

-- =============================================================
-- organizer_roles
-- Organizers can read their own role assignments.
-- =============================================================
DROP POLICY IF EXISTS "organizer_roles_select_own" ON organizer_roles;
CREATE POLICY "organizer_roles_select_own"
  ON organizer_roles
  FOR SELECT
  USING (
    organizer_id IN (
      SELECT id FROM organizers WHERE user_id = auth.uid()
    )
  );

-- =============================================================
-- sessions
-- Public: anyone (including anon) can read published sessions.
-- Organizers: can read ALL sessions (incl. drafts) and write.
-- =============================================================
DROP POLICY IF EXISTS "sessions_select_public_or_organizer" ON sessions;
CREATE POLICY "sessions_select_public_or_organizer"
  ON sessions
  FOR SELECT
  USING (status = 'published' OR is_organizer());

DROP POLICY IF EXISTS "sessions_insert_organizers" ON sessions;
CREATE POLICY "sessions_insert_organizers"
  ON sessions
  FOR INSERT
  WITH CHECK (is_organizer());

DROP POLICY IF EXISTS "sessions_update_organizers" ON sessions;
CREATE POLICY "sessions_update_organizers"
  ON sessions
  FOR UPDATE
  USING (is_organizer());

DROP POLICY IF EXISTS "sessions_delete_organizers" ON sessions;
CREATE POLICY "sessions_delete_organizers"
  ON sessions
  FOR DELETE
  USING (is_organizer());

-- =============================================================
-- guardians — service role only
-- No policies → all direct access denied for non-service roles.
-- All registration writes happen server-side via the service role.
-- =============================================================

-- =============================================================
-- participants — service role only
-- =============================================================

-- =============================================================
-- registrations — service role only
-- =============================================================

-- =============================================================
-- consents — service role only
-- Consent records must never be readable or writable by end-users
-- directly; only accessible via server-side API routes.
-- =============================================================

-- =============================================================
-- outbound_messages
-- Only authenticated organizers can read and write.
-- =============================================================
DROP POLICY IF EXISTS "outbound_messages_select_organizers" ON outbound_messages;
CREATE POLICY "outbound_messages_select_organizers"
  ON outbound_messages
  FOR SELECT
  USING (is_organizer());

DROP POLICY IF EXISTS "outbound_messages_insert_organizers" ON outbound_messages;
CREATE POLICY "outbound_messages_insert_organizers"
  ON outbound_messages
  FOR INSERT
  WITH CHECK (is_organizer());

DROP POLICY IF EXISTS "outbound_messages_update_organizers" ON outbound_messages;
CREATE POLICY "outbound_messages_update_organizers"
  ON outbound_messages
  FOR UPDATE
  USING (is_organizer());

-- =============================================================
-- message_deliveries
-- Organizers can read delivery records (e.g. to show send status).
-- All writes happen via the service role (send job).
-- =============================================================
DROP POLICY IF EXISTS "message_deliveries_select_organizers" ON message_deliveries;
CREATE POLICY "message_deliveries_select_organizers"
  ON message_deliveries
  FOR SELECT
  USING (is_organizer());

-- =============================================================
-- rate_limit_events — service role only
-- Written and read exclusively by server-side middleware.
-- =============================================================
