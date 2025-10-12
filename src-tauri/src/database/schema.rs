use rusqlite::{Connection, Result as SqliteResult};

/// Initialize database schema with all tables, indices, triggers, and initial data
pub fn initialize_schema(conn: &Connection) -> SqliteResult<()> {
    conn.execute_batch(
        r#"
        -- ============================================
        -- プレイヤーメモ機能 データベーススキーマ
        -- ============================================

        -- プレイヤーテーブル
        CREATE TABLE IF NOT EXISTS players (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL CHECK(length(name) >= 1 AND length(name) <= 100),
          category_id INTEGER,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (category_id) REFERENCES player_categories(id) ON DELETE SET NULL
        );

        -- プレイヤー種別テーブル
        CREATE TABLE IF NOT EXISTS player_categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE CHECK(length(name) >= 1 AND length(name) <= 50),
          color TEXT NOT NULL CHECK(color GLOB '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]'),
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        -- タグテーブル
        CREATE TABLE IF NOT EXISTS tags (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE CHECK(length(name) >= 1 AND length(name) <= 50),
          color TEXT NOT NULL CHECK(color GLOB '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]'),
          has_intensity BOOLEAN NOT NULL DEFAULT 0 CHECK(has_intensity IN (0, 1)),
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        -- プレイヤー-タグ関連テーブル
        CREATE TABLE IF NOT EXISTS player_tags (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          player_id INTEGER NOT NULL,
          tag_id INTEGER NOT NULL,
          intensity INTEGER CHECK(intensity IS NULL OR (intensity >= 1 AND intensity <= 5)),
          display_order INTEGER NOT NULL DEFAULT 0,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
          FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
          UNIQUE(player_id, tag_id, intensity)
        );

        -- 簡易メモテーブル
        CREATE TABLE IF NOT EXISTS player_notes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          player_id INTEGER NOT NULL,
          content TEXT NOT NULL CHECK(length(content) <= 1048576),
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
        );

        -- プレイヤー総合メモテーブル
        CREATE TABLE IF NOT EXISTS player_summaries (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          player_id INTEGER NOT NULL UNIQUE,
          content TEXT NOT NULL CHECK(length(content) <= 1048576),
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
        );

        -- 総合メモテンプレートテーブル
        CREATE TABLE IF NOT EXISTS summary_templates (
          id INTEGER PRIMARY KEY CHECK(id = 1),
          content TEXT NOT NULL DEFAULT '',
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        -- ============================================
        -- インデックス
        -- ============================================

        -- プレイヤー検索用インデックス
        CREATE INDEX IF NOT EXISTS idx_players_name ON players(name COLLATE NOCASE);
        CREATE INDEX IF NOT EXISTS idx_players_updated_at ON players(updated_at DESC);
        CREATE INDEX IF NOT EXISTS idx_players_category_id ON players(category_id);

        -- タグ関連インデックス
        CREATE INDEX IF NOT EXISTS idx_player_tags_player_id ON player_tags(player_id);
        CREATE INDEX IF NOT EXISTS idx_player_tags_tag_id ON player_tags(tag_id);
        CREATE INDEX IF NOT EXISTS idx_player_tags_display_order ON player_tags(player_id, display_order);

        -- メモ関連インデックス
        CREATE INDEX IF NOT EXISTS idx_player_notes_player_id ON player_notes(player_id);
        CREATE INDEX IF NOT EXISTS idx_player_notes_updated_at ON player_notes(updated_at DESC);

        -- ============================================
        -- FTS5全文検索仮想テーブル
        -- ============================================

        -- 簡易メモ全文検索用
        CREATE VIRTUAL TABLE IF NOT EXISTS player_notes_fts USING fts5(
          note_id UNINDEXED,
          content,
          tokenize = 'trigram'
        );

        -- 総合メモ全文検索用
        CREATE VIRTUAL TABLE IF NOT EXISTS player_summaries_fts USING fts5(
          summary_id UNINDEXED,
          content,
          tokenize = 'trigram'
        );

        -- ============================================
        -- トリガー: player_notes (簡易メモ) FTS同期
        -- ============================================

        -- INSERT時: FTSテーブルにエントリ追加
        CREATE TRIGGER IF NOT EXISTS player_notes_ai AFTER INSERT ON player_notes
        BEGIN
          INSERT INTO player_notes_fts(note_id, content) VALUES (new.id, new.content);
        END;

        -- UPDATE時: FTSテーブルのエントリ更新
        CREATE TRIGGER IF NOT EXISTS player_notes_au AFTER UPDATE ON player_notes
        BEGIN
          UPDATE player_notes_fts SET content = new.content WHERE note_id = old.id;
        END;

        -- DELETE時: FTSテーブルのエントリ削除
        CREATE TRIGGER IF NOT EXISTS player_notes_ad AFTER DELETE ON player_notes
        BEGIN
          DELETE FROM player_notes_fts WHERE note_id = old.id;
        END;

        -- ============================================
        -- トリガー: player_summaries (総合メモ) FTS同期
        -- ============================================

        -- INSERT時: FTSテーブルにエントリ追加
        CREATE TRIGGER IF NOT EXISTS player_summaries_ai AFTER INSERT ON player_summaries
        BEGIN
          INSERT INTO player_summaries_fts(summary_id, content) VALUES (new.id, new.content);
        END;

        -- UPDATE時: FTSテーブルのエントリ更新
        CREATE TRIGGER IF NOT EXISTS player_summaries_au AFTER UPDATE ON player_summaries
        BEGIN
          UPDATE player_summaries_fts SET content = new.content WHERE summary_id = old.id;
        END;

        -- DELETE時: FTSテーブルのエントリ削除
        CREATE TRIGGER IF NOT EXISTS player_summaries_ad AFTER DELETE ON player_summaries
        BEGIN
          DELETE FROM player_summaries_fts WHERE summary_id = old.id;
        END;

        -- ============================================
        -- 初期データ
        -- ============================================

        -- テンプレートのデフォルト値を挿入
        INSERT OR IGNORE INTO summary_templates (id, content) VALUES (1, '');
        "#,
    )?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;

    #[test]
    fn test_initialize_schema() {
        let conn = Connection::open_in_memory().unwrap();
        let result = initialize_schema(&conn);
        assert!(result.is_ok());

        // Verify tables exist
        let table_count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name IN
                ('players', 'player_categories', 'tags', 'player_tags', 'player_notes', 'player_summaries', 'summary_templates')",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(table_count, 7);

        // Verify FTS5 tables exist
        let fts_table_count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name IN
                ('player_notes_fts', 'player_summaries_fts')",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(fts_table_count, 2);

        // Verify triggers exist
        let trigger_count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM sqlite_master WHERE type='trigger' AND name IN
                ('player_notes_ai', 'player_notes_au', 'player_notes_ad',
                 'player_summaries_ai', 'player_summaries_au', 'player_summaries_ad')",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(trigger_count, 6);

        // Verify template default value
        let template_content: String = conn
            .query_row(
                "SELECT content FROM summary_templates WHERE id = 1",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(template_content, "");
    }

    #[test]
    fn test_schema_idempotency() {
        let conn = Connection::open_in_memory().unwrap();

        // Initialize twice
        initialize_schema(&conn).unwrap();
        let result = initialize_schema(&conn);

        // Should succeed (idempotent)
        assert!(result.is_ok());
    }
}
