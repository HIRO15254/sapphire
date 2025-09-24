-- Migration 002: パフォーマンス向上のための追加インデックス
-- 🔵 青信号: NFR-101, NFR-102, NFR-104 パフォーマンス要件対応

-- プレイヤー検索・ソート用インデックス
CREATE INDEX IF NOT EXISTS idx_players_created_at ON players(created_at);
CREATE INDEX IF NOT EXISTS idx_players_updated_at ON players(updated_at);

-- タグ検索用インデックス
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);

-- プレイヤータグ レベル検索用
CREATE INDEX IF NOT EXISTS idx_player_tags_level ON player_tags(level);

-- 複合インデックス（検索パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_player_tags_player_level ON player_tags(player_id, level);
CREATE INDEX IF NOT EXISTS idx_player_tags_tag_level ON player_tags(tag_id, level);

-- プレイヤー一覧ビュー (NFR-101: 1秒以内表示)
CREATE VIEW IF NOT EXISTS v_player_list AS
SELECT
    p.id,
    p.name,
    p.created_at,
    p.updated_at,
    pt.name as player_type_name,
    pt.color as player_type_color,
    COUNT(ptags.id) as tag_count,
    MAX(pn.updated_at) as last_note_updated
FROM players p
LEFT JOIN player_types pt ON p.player_type_id = pt.id
LEFT JOIN player_tags ptags ON p.id = ptags.player_id
LEFT JOIN player_notes pn ON p.id = pn.player_id
GROUP BY p.id, p.name, p.created_at, p.updated_at, pt.name, pt.color;

-- プレイヤー詳細ビュー
CREATE VIEW IF NOT EXISTS v_player_detail AS
SELECT
    p.id,
    p.name,
    p.created_at,
    p.updated_at,
    pt.id as player_type_id,
    pt.name as player_type_name,
    pt.color as player_type_color,
    json_group_array(
        json_object(
            'tag_id', t.id,
            'tag_name', t.name,
            'tag_color', t.color,
            'level', ptags.level
        )
    ) FILTER (WHERE t.id IS NOT NULL) as tags,
    pn.content as note_content,
    pn.updated_at as note_updated_at
FROM players p
LEFT JOIN player_types pt ON p.player_type_id = pt.id
LEFT JOIN player_tags ptags ON p.id = ptags.player_id
LEFT JOIN tags t ON ptags.tag_id = t.id
LEFT JOIN player_notes pn ON p.id = pn.player_id
GROUP BY p.id, p.name, p.created_at, p.updated_at, pt.id, pt.name, pt.color, pn.content, pn.updated_at;