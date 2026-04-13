-- =============================================================
-- 003_functions.sql
-- Helper functions for session capacity management
--
-- All functions are SECURITY DEFINER so they can query the
-- registrations and sessions tables (which have RLS enabled
-- with no public SELECT policies) and be safely called from
-- client-side code or Edge Functions without exposing raw data.
-- =============================================================

-- =============================================================
-- get_session_confirmed_count(session_id)
-- Returns the number of confirmed registrations for a session.
-- =============================================================
CREATE OR REPLACE FUNCTION get_session_confirmed_count(p_session_id uuid)
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COUNT(*)
  FROM   registrations
  WHERE  session_id = p_session_id
    AND  status = 'confirmed';
$$;

-- =============================================================
-- get_session_waitlist_count(session_id)
-- Returns the number of waitlisted registrations for a session.
-- =============================================================
CREATE OR REPLACE FUNCTION get_session_waitlist_count(p_session_id uuid)
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COUNT(*)
  FROM   registrations
  WHERE  session_id = p_session_id
    AND  status = 'waitlisted';
$$;

-- =============================================================
-- is_session_full(session_id)
-- Returns true when confirmed registrations >= session capacity.
-- Returns NULL if the session does not exist.
-- =============================================================
CREATE OR REPLACE FUNCTION is_session_full(p_session_id uuid)
RETURNS bool
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT get_session_confirmed_count(p_session_id) >= s.capacity
  FROM   sessions s
  WHERE  s.id = p_session_id;
$$;

-- =============================================================
-- get_next_waitlist_position(session_id)
-- Returns the next available waitlist position (max + 1, or 1
-- if the waitlist is currently empty).
-- =============================================================
CREATE OR REPLACE FUNCTION get_next_waitlist_position(p_session_id uuid)
RETURNS int
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(MAX(waitlist_position), 0) + 1
  FROM   registrations
  WHERE  session_id = p_session_id
    AND  status = 'waitlisted';
$$;
