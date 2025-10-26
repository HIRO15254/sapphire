-- Migration: Add locations, tags, and session_tags tables
-- Phase 1: Create new tables
-- Phase 2: Migrate existing data
-- Phase 3: Update poker_sessions table
-- Phase 4: Create indexes

-- ============================================
-- Phase 1: Create new tables
-- ============================================

-- Location table (for poker session locations)
CREATE TABLE IF NOT EXISTS sapphire_location (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES sapphire_user(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS location_user_id_idx ON sapphire_location(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS location_user_name_unique ON sapphire_location(user_id, LOWER(name));

-- Tag table (for poker session tags)
CREATE TABLE IF NOT EXISTS sapphire_tag (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES sapphire_user(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS tag_user_id_idx ON sapphire_tag(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS tag_user_name_unique ON sapphire_tag(user_id, LOWER(name));

-- Session-Tag junction table (many-to-many)
CREATE TABLE IF NOT EXISTS sapphire_session_tag (
  session_id INTEGER NOT NULL REFERENCES sapphire_poker_session(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES sapphire_tag(id) ON DELETE CASCADE,
  PRIMARY KEY (session_id, tag_id)
);

CREATE INDEX IF NOT EXISTS session_tag_tag_id_idx ON sapphire_session_tag(tag_id);

-- ============================================
-- Phase 2: Migrate existing data
-- ============================================

-- Create default "削除された場所" location for all existing users
-- This is required for FR-020 (location deletion behavior)
INSERT INTO sapphire_location (user_id, name, created_at, updated_at)
SELECT DISTINCT "userId", '削除された場所', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM sapphire_poker_session
ON CONFLICT DO NOTHING;

-- Migrate existing location strings from poker_sessions to locations table
INSERT INTO sapphire_location (user_id, name, created_at, updated_at)
SELECT DISTINCT "userId", location, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM sapphire_poker_session
WHERE location IS NOT NULL
  AND location != '削除された場所'  -- Skip default location (already created)
ON CONFLICT (user_id, LOWER(name)) DO NOTHING;

-- ============================================
-- Phase 3: Update poker_sessions table
-- ============================================

-- Add location_id column (nullable initially)
ALTER TABLE sapphire_poker_session
ADD COLUMN IF NOT EXISTS location_id INTEGER;

-- Populate location_id from existing location strings
UPDATE sapphire_poker_session ps
SET location_id = l.id
FROM sapphire_location l
WHERE ps."userId" = l.user_id AND ps.location = l.name;

-- Make location_id NOT NULL
ALTER TABLE sapphire_poker_session
ALTER COLUMN location_id SET NOT NULL;

-- Add foreign key constraint (PostgreSQL doesn't support IF NOT EXISTS for constraints)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_poker_session_location'
  ) THEN
    ALTER TABLE sapphire_poker_session
    ADD CONSTRAINT fk_poker_session_location
    FOREIGN KEY (location_id) REFERENCES sapphire_location(id);
  END IF;
END
$$;

-- ============================================
-- Phase 4: Update indexes and drop old column
-- ============================================

-- Drop old location-based indexes
DROP INDEX IF EXISTS session_user_location_idx;
DROP INDEX IF EXISTS session_user_date_location_idx;

-- Create new location_id-based indexes
CREATE INDEX IF NOT EXISTS session_user_location_idx ON sapphire_poker_session("userId", location_id);
CREATE INDEX IF NOT EXISTS session_user_date_location_idx ON sapphire_poker_session("userId", date, location_id);

-- Drop old location column (after verification)
-- IMPORTANT: Only run this after confirming data migration was successful
ALTER TABLE sapphire_poker_session DROP COLUMN IF EXISTS location;

-- ============================================
-- Verification queries (for manual testing)
-- ============================================

-- Uncomment these to verify migration:
-- SELECT COUNT(*) AS total_sessions FROM sapphire_poker_session;
-- SELECT COUNT(*) AS total_locations FROM sapphire_location;
-- SELECT COUNT(*) AS sessions_with_location_id FROM sapphire_poker_session WHERE location_id IS NOT NULL;
-- SELECT user_id, name FROM sapphire_location WHERE name = '削除された場所';
