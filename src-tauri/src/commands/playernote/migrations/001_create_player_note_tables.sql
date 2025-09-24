-- Migration 001: Player Note初期スキーマ
-- 🔵 青信号: EARS要件定義書のエンティティ要件とデータ整合性要件に基づく

-- プレイヤーテーブル (REQ-001: プレイヤー管理)
CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    player_type_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    -- 制約
    FOREIGN KEY (player_type_id) REFERENCES player_types(id) ON DELETE SET NULL,
    UNIQUE(name) -- 同名プレイヤーの重複防止
);

-- プレイヤータイプテーブル (REQ-002, REQ-101, REQ-102: カスタマイズ可能なプレイヤー分類)
CREATE TABLE IF NOT EXISTS player_types (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL, -- HEX color code (#RRGGBB)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    -- バリデーション制約
    CHECK (color GLOB '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]')
);

-- タグテーブル (REQ-003, REQ-104: 多重タグシステム)
CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL, -- Base HEX color for level calculations
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    -- バリデーション制約
    CHECK (color GLOB '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]')
);

-- プレイヤー-タグ関連テーブル (REQ-003, REQ-105: レベル付き多重タグ)
CREATE TABLE IF NOT EXISTS player_tags (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    player_id TEXT NOT NULL,
    tag_id TEXT NOT NULL,
    level INTEGER NOT NULL DEFAULT 5, -- REQ-105: レベル1-10
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    -- 制約
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE, -- REQ-401: カスケード削除
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
    UNIQUE(player_id, tag_id), -- 同じプレイヤーに同じタグは1つまで
    CHECK (level >= 1 AND level <= 10) -- レベル範囲制約
);

-- プレイヤーメモテーブル (REQ-004, REQ-106: リッチテキストメモ)
CREATE TABLE IF NOT EXISTS player_notes (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    player_id TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '', -- TipTap rich text content
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    -- 制約
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE, -- REQ-401: カスケード削除
    UNIQUE(player_id) -- 1プレイヤーにつき1メモ
);

-- 基本インデックス
CREATE INDEX IF NOT EXISTS idx_players_name ON players(name);
CREATE INDEX IF NOT EXISTS idx_players_type ON players(player_type_id);
CREATE INDEX IF NOT EXISTS idx_player_tags_player ON player_tags(player_id);
CREATE INDEX IF NOT EXISTS idx_player_tags_tag ON player_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_player_notes_player ON player_notes(player_id);

-- 基本トリガー
CREATE TRIGGER IF NOT EXISTS trg_players_updated_at
    AFTER UPDATE ON players
    FOR EACH ROW
    WHEN OLD.updated_at = NEW.updated_at OR OLD.updated_at IS NULL
BEGIN
    UPDATE players SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_player_types_updated_at
    AFTER UPDATE ON player_types
    FOR EACH ROW
    WHEN OLD.updated_at = NEW.updated_at OR OLD.updated_at IS NULL
BEGIN
    UPDATE player_types SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_tags_updated_at
    AFTER UPDATE ON tags
    FOR EACH ROW
    WHEN OLD.updated_at = NEW.updated_at OR OLD.updated_at IS NULL
BEGIN
    UPDATE tags SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_player_tags_updated_at
    AFTER UPDATE ON player_tags
    FOR EACH ROW
    WHEN OLD.updated_at = NEW.updated_at OR OLD.updated_at IS NULL
BEGIN
    UPDATE player_tags SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_player_notes_updated_at
    AFTER UPDATE ON player_notes
    FOR EACH ROW
    WHEN OLD.updated_at = NEW.updated_at OR OLD.updated_at IS NULL
BEGIN
    UPDATE player_notes SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- 初期データ投入
INSERT OR IGNORE INTO player_types (name, color) VALUES
('アグレッシブ', '#FF4444'),
('コンサバティブ', '#4444FF'),
('ルース', '#44FF44'),
('タイト', '#FFAA44'),
('未分類', '#888888');

INSERT OR IGNORE INTO tags (name, color) VALUES
('ブラフ好き', '#FF6B6B'),
('コール頻度高', '#4ECDC4'),
('レイズ頻度高', '#45B7D1'),
('フォールド多め', '#96CEB4'),
('リード下手', '#FECA57'),
('ポジション意識', '#FF9FF3'),
('テル有り', '#54A0FF'),
('数学的', '#5F27CD'),
('感情的', '#FF3838'),
('観察力高', '#10AC84');