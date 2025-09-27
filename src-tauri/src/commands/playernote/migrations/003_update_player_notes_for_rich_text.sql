-- Migration 003: Player Notes Rich Text Support
-- TASK-0511: リッチテキストメモAPI実装
-- 🔵 青信号: Rich text content support for TipTap and HTML

-- Add new columns for rich text support
ALTER TABLE player_notes ADD COLUMN content_type TEXT NOT NULL DEFAULT 'html';
ALTER TABLE player_notes ADD COLUMN content_hash TEXT;

-- Create index for content_hash (for deduplication)
CREATE INDEX IF NOT EXISTS idx_player_notes_content_hash ON player_notes(content_hash);