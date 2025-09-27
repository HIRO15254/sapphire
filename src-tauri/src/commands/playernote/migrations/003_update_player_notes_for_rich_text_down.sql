-- Migration 003 Down: Remove Rich Text Support from Player Notes
-- TASK-0511: リッチテキストメモAPI実装 - Rollback

-- Remove the index
DROP INDEX IF EXISTS idx_player_notes_content_hash;

-- Note: SQLite doesn't support DROP COLUMN, so we can't remove the added columns
-- In a production environment, this would require creating a new table and migrating data