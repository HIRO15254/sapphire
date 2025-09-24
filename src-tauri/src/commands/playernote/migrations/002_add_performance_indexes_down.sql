-- Migration 002 Down: パフォーマンスインデックスとビューの削除

-- ビューの削除
DROP VIEW IF EXISTS v_player_detail;
DROP VIEW IF EXISTS v_player_list;

-- 複合インデックスの削除
DROP INDEX IF EXISTS idx_player_tags_tag_level;
DROP INDEX IF EXISTS idx_player_tags_player_level;

-- 単純インデックスの削除
DROP INDEX IF EXISTS idx_player_tags_level;
DROP INDEX IF EXISTS idx_tags_name;
DROP INDEX IF EXISTS idx_players_updated_at;
DROP INDEX IF EXISTS idx_players_created_at;