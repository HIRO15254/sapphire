-- Rename location_id to locationId to match Drizzle naming convention
ALTER TABLE sapphire_poker_session RENAME COLUMN location_id TO "locationId";

-- Drop and recreate indexes with correct column name
DROP INDEX IF EXISTS session_user_location_idx;
DROP INDEX IF EXISTS session_user_date_location_idx;

CREATE INDEX session_user_location_idx ON sapphire_poker_session ("userId", "locationId");
CREATE INDEX session_user_date_location_idx ON sapphire_poker_session ("userId", date, "locationId");
