-- Migration: 002_add_performance_indexes.sql
-- Description: Add performance optimization indexes for Player Note feature
-- Related to: SAP-44: SQLiteデータベースとスキーマ設計
-- Performance Requirements: NFR-001 (1000件以下で100ms以内), NFR-002 (検索500ms以内)

-- パフォーマンス最適化のためのインデックス

-- Players table indexes
CREATE INDEX IF NOT EXISTS idx_players_name ON players(name) WHERE is_deleted = 0;
CREATE INDEX IF NOT EXISTS idx_players_identifier ON players(identifier) WHERE is_deleted = 0;
CREATE INDEX IF NOT EXISTS idx_players_type ON players(player_type_id) WHERE is_deleted = 0;
CREATE INDEX IF NOT EXISTS idx_players_created_at ON players(created_at) WHERE is_deleted = 0;

-- Player tags indexes
CREATE INDEX IF NOT EXISTS idx_player_tags_player_id ON player_tags(player_id) WHERE is_deleted = 0;
CREATE INDEX IF NOT EXISTS idx_player_tags_tag_id ON player_tags(tag_master_id) WHERE is_deleted = 0;
CREATE INDEX IF NOT EXISTS idx_player_tags_level ON player_tags(level) WHERE is_deleted = 0;

-- Player notes indexes
CREATE INDEX IF NOT EXISTS idx_player_notes_player_id ON player_notes(player_id) WHERE is_deleted = 0;
CREATE INDEX IF NOT EXISTS idx_player_notes_type ON player_notes(note_type) WHERE is_deleted = 0;
CREATE INDEX IF NOT EXISTS idx_player_notes_created_at ON player_notes(created_at) WHERE is_deleted = 0;

-- Player types indexes
CREATE INDEX IF NOT EXISTS idx_player_types_name ON player_types(name) WHERE is_deleted = 0;

-- Tag masters indexes
CREATE INDEX IF NOT EXISTS idx_tag_masters_name ON tag_masters(name) WHERE is_deleted = 0;
CREATE INDEX IF NOT EXISTS idx_tag_masters_has_level ON tag_masters(has_level) WHERE is_deleted = 0;

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_players_name_type ON players(name, player_type_id) WHERE is_deleted = 0;
CREATE INDEX IF NOT EXISTS idx_player_tags_player_tag ON player_tags(player_id, tag_master_id) WHERE is_deleted = 0;
CREATE INDEX IF NOT EXISTS idx_player_notes_player_type ON player_notes(player_id, note_type) WHERE is_deleted = 0;