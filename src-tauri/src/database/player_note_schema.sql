-- SQLite Database Schema for Player Note Feature
-- Generated for SAP-44: SQLiteデータベースとスキーマ設計

-- プレイヤー種別テーブル
CREATE TABLE IF NOT EXISTS player_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,                   -- 種別名（強さレベル分類）
    color TEXT NOT NULL,                  -- HEXカラーコード
    is_deleted BOOLEAN NOT NULL DEFAULT 0, -- 論理削除フラグ
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- プレイヤーテーブル
CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,                   -- プレイヤー名
    identifier TEXT,                      -- 識別子（同名区別用）
    player_type_id INTEGER,               -- プレイヤー種別ID（nullable）
    is_deleted BOOLEAN NOT NULL DEFAULT 0, -- 論理削除フラグ
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_type_id) REFERENCES player_types(id)
);

-- タグマスタテーブル
CREATE TABLE IF NOT EXISTS tag_masters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,                   -- タグ名
    color TEXT NOT NULL,                  -- HEXカラーコード
    has_level BOOLEAN NOT NULL DEFAULT 1, -- レベル設定有無
    is_deleted BOOLEAN NOT NULL DEFAULT 0, -- 論理削除フラグ
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- プレイヤータグ関連テーブル
CREATE TABLE IF NOT EXISTS player_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,           -- プレイヤーID
    tag_master_id INTEGER NOT NULL,       -- タグマスタID
    level INTEGER CHECK (level >= 1 AND level <= 5), -- 1-5 (I-V)、has_level=falseの場合null
    is_deleted BOOLEAN NOT NULL DEFAULT 0, -- 論理削除フラグ
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_master_id) REFERENCES tag_masters(id)
);

-- プレイヤーノートテーブル（簡易メモ・総合メモ統合）
CREATE TABLE IF NOT EXISTS player_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,           -- プレイヤーID
    title TEXT,                          -- タイトル（簡易メモ用、総合メモではnull）
    content TEXT NOT NULL,               -- HTML形式のコンテンツ
    note_type TEXT NOT NULL CHECK (note_type IN ('simple', 'comprehensive')), -- メモ種別
    is_deleted BOOLEAN NOT NULL DEFAULT 0, -- 論理削除フラグ
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

-- パフォーマンス最適化のためのインデックス
CREATE INDEX IF NOT EXISTS idx_players_name ON players(name) WHERE is_deleted = 0;
CREATE INDEX IF NOT EXISTS idx_players_identifier ON players(identifier) WHERE is_deleted = 0;
CREATE INDEX IF NOT EXISTS idx_players_type ON players(player_type_id) WHERE is_deleted = 0;
CREATE INDEX IF NOT EXISTS idx_player_tags_player_id ON player_tags(player_id) WHERE is_deleted = 0;
CREATE INDEX IF NOT EXISTS idx_player_tags_tag_id ON player_tags(tag_master_id) WHERE is_deleted = 0;
CREATE INDEX IF NOT EXISTS idx_player_notes_player_id ON player_notes(player_id) WHERE is_deleted = 0;
CREATE INDEX IF NOT EXISTS idx_player_notes_type ON player_notes(note_type) WHERE is_deleted = 0;
CREATE INDEX IF NOT EXISTS idx_player_types_name ON player_types(name) WHERE is_deleted = 0;
CREATE INDEX IF NOT EXISTS idx_tag_masters_name ON tag_masters(name) WHERE is_deleted = 0;

-- 初期データ: デフォルトプレイヤー種別
INSERT OR IGNORE INTO player_types (id, name, color, is_deleted, created_at, updated_at)
VALUES (1, '未分類', '#6b7280', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 更新トリガー（updated_at自動更新）
CREATE TRIGGER IF NOT EXISTS update_players_updated_at
    AFTER UPDATE ON players
    FOR EACH ROW
    BEGIN
        UPDATE players SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_player_types_updated_at
    AFTER UPDATE ON player_types
    FOR EACH ROW
    BEGIN
        UPDATE player_types SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_tag_masters_updated_at
    AFTER UPDATE ON tag_masters
    FOR EACH ROW
    BEGIN
        UPDATE tag_masters SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_player_tags_updated_at
    AFTER UPDATE ON player_tags
    FOR EACH ROW
    BEGIN
        UPDATE player_tags SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_player_notes_updated_at
    AFTER UPDATE ON player_notes
    FOR EACH ROW
    BEGIN
        UPDATE player_notes SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

-- 総合メモ自動作成トリガー（REQ-202対応）
CREATE TRIGGER IF NOT EXISTS create_comprehensive_memo_on_player_insert
    AFTER INSERT ON players
    FOR EACH ROW
    BEGIN
        INSERT INTO player_notes (player_id, title, content, note_type, created_at, updated_at)
        VALUES (NEW.id, NULL, '', 'comprehensive', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
    END;