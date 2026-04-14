-- =============================================================
-- 004_promotion_rank.sql
-- Adds a promotion_rank column to sessions.
-- Rank 1 = featured in the hero section on the home page.
-- NULL means the session is not promoted.
-- =============================================================

ALTER TABLE sessions ADD COLUMN IF NOT EXISTS promotion_rank int;

ALTER TABLE sessions ADD CONSTRAINT chk_session_promotion_rank
  CHECK (promotion_rank IS NULL OR promotion_rank >= 1);

CREATE INDEX IF NOT EXISTS idx_sessions_promotion_rank ON sessions(promotion_rank);
