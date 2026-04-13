-- =============================================================
-- seed.sql
-- Sample data for local development and testing
--
-- Note: No organizer rows are seeded here because organizers
-- must be linked to real auth.users IDs, which are created
-- through Supabase Auth sign-up flows.
-- =============================================================

-- Two sample sessions: one upcoming (published), one full.
INSERT INTO sessions (
  id,
  slug,
  title,
  description,
  location,
  event_date,
  registration_opens_at,
  registration_closes_at,
  capacity,
  waitlist_enabled,
  status,
  pricing_info,
  notes
) VALUES
(
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'parkrun-spring-2025',
  'Spring Parkrun 2025',
  'Join us for our spring 5K run through the park. Suitable for all ages and abilities — walkers, joggers and runners all welcome.',
  'Central Park, Main Entrance (meet at the bandstand)',
  NOW() + INTERVAL '30 days',
  NOW() - INTERVAL '1 day',
  NOW() + INTERVAL '28 days',
  50,
  true,
  'published',
  'Free to participate. Voluntary donations welcome on the day.',
  'Please wear appropriate footwear. Water stations at 1 km and 3 km. Dogs on leads welcome.'
),
(
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'parkrun-summer-2025',
  'Summer Parkrun 2025',
  'Our most popular summer event — this session has reached full capacity. Add yourself to the waitlist and we will contact you if a place becomes available.',
  'Riverside Trail, East Gate Car Park',
  NOW() + INTERVAL '60 days',
  NOW() - INTERVAL '7 days',
  NOW() + INTERVAL '55 days',
  30,
  true,
  'full',
  'Free to participate.',
  'Waitlist is open. Participants will be notified by email 48 hours before the event if a place becomes available.'
)
ON CONFLICT (id) DO NOTHING;
