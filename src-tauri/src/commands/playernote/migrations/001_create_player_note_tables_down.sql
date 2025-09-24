-- Migration 001 Down: Player Noteテーブルの削除
-- 🔵 青信号: データ整合性要件に基づくロールバック

-- 外部キー制約の順序を考慮してテーブルを削除
DROP TABLE IF EXISTS player_notes;
DROP TABLE IF EXISTS player_tags;
DROP TABLE IF EXISTS players;
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS player_types;

-- インデックスの削除（テーブル削除で自動削除されるが明示的に記載）
DROP INDEX IF EXISTS idx_players_name;
DROP INDEX IF EXISTS idx_players_type;
DROP INDEX IF EXISTS idx_player_tags_player;
DROP INDEX IF EXISTS idx_player_tags_tag;
DROP INDEX IF EXISTS idx_player_notes_player;

-- トリガーの削除（テーブル削除で自動削除されるが明示的に記載）
DROP TRIGGER IF EXISTS trg_players_updated_at;
DROP TRIGGER IF EXISTS trg_player_types_updated_at;
DROP TRIGGER IF EXISTS trg_tags_updated_at;
DROP TRIGGER IF EXISTS trg_player_tags_updated_at;
DROP TRIGGER IF EXISTS trg_player_notes_updated_at;