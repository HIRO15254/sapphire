use crate::database::models::{validate_tag_intensity, PlayerTag, PlayerTagWithTag};
use crate::database::PlayerDatabase;
use rusqlite::{params, Connection};

// ============================================
// ヘルパー関数（DRY原則による共通化）
// ============================================

/// 【ヘルパー関数】: プレイヤー存在確認 🔵
/// 【再利用性】: assign_tag_to_player, get_player_tagsで共通利用 🔵
/// 【単一責任】: プレイヤーIDの存在チェックのみを担当 🔵
/// 【実装方針】: players.rsの check_player_exists パターンを踏襲 🔵
/// 【テスト対応】: TC-ASSIGN-ERR-001, TC-GET-ERR-001 🔵
fn check_player_exists(conn: &Connection, player_id: i64) -> Result<(), String> {
    // 【プレイヤー数カウント】: 指定IDのプレイヤーが存在するか確認 🔵
    let exists: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM players WHERE id = ?1",
            params![player_id],
            |row| row.get(0),
        )
        .map_err(|e| format!("Database error: {}", e))?;

    // 【存在チェック】: 0件ならエラー返却 🔵
    if exists == 0 {
        return Err("Player not found".to_string());
    }
    Ok(())
}

/// 【ヘルパー関数】: タグ存在確認と情報取得 🔵
/// 【再利用性】: assign_tag_to_playerで使用 🔵
/// 【単一責任】: タグIDの存在チェックとhas_intensity取得 🔵
/// 【実装方針】: タグ存在確認とhas_intensityの取得を同時に行う 🔵
/// 【テスト対応】: TC-ASSIGN-ERR-002, TC-ASSIGN-ERR-003, TC-ASSIGN-ERR-004 🔵
fn get_tag_info(conn: &Connection, tag_id: i64) -> Result<(bool,), String> {
    // 【タグ情報取得】: has_intensityを取得（存在しない場合はエラー） 🔵
    let has_intensity: bool = conn
        .query_row(
            "SELECT has_intensity FROM tags WHERE id = ?1",
            params![tag_id],
            |row| row.get(0),
        )
        .map_err(|_| "Tag not found".to_string())?;

    // 【戻り値構築】: タプルで has_intensity を返す 🔵
    Ok((has_intensity,))
}

/// 【ヘルパー関数】: player_tag存在確認 🔵
/// 【再利用性】: remove_tag_from_playerで使用 🔵
/// 【単一責任】: player_tag_idの存在チェックのみを担当 🔵
/// 【実装方針】: players.rsの check_player_exists パターンを踏襲 🔵
/// 【テスト対応】: TC-REMOVE-ERR-001 🔵
fn check_player_tag_exists(conn: &Connection, player_tag_id: i64) -> Result<(), String> {
    // 【player_tag数カウント】: 指定IDのplayer_tagが存在するか確認 🔵
    let exists: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM player_tags WHERE id = ?1",
            params![player_tag_id],
            |row| row.get(0),
        )
        .map_err(|e| format!("Database error: {}", e))?;

    // 【存在チェック】: 0件ならエラー返却 🔵
    if exists == 0 {
        return Err("Player tag not found".to_string());
    }
    Ok(())
}

// ============================================
// 内部関数（テスト用）
// ============================================

/// プレイヤーにタグを割り当てる（内部関数）
///
/// 【機能概要】: プレイヤーにタグを割り当て、player_tagsテーブルに登録 🔵
/// 【実装方針】: バリデーション → display_order計算 → INSERT → 結果返却 🔵
/// 【テスト対応】: TC-ASSIGN-001～004, TC-ASSIGN-ERR-001～007, TC-BOUND-001～003 🔵
#[allow(dead_code)]
pub(crate) fn assign_tag_to_player_internal(
    player_id: i64,
    tag_id: i64,
    intensity: Option<i32>,
    db: &PlayerDatabase,
) -> Result<PlayerTag, String> {
    let conn = db.0.lock().unwrap();

    // 【プレイヤー存在確認】: ヘルパー関数を使用 🔵
    check_player_exists(&conn, player_id)?;

    // 【タグ情報取得】: タグの存在確認とhas_intensity取得 🔵
    let (has_intensity,) = get_tag_info(&conn, tag_id)?;

    // 【強度バリデーション】: has_intensityとintensityの整合性チェック 🔵
    if has_intensity && intensity.is_none() {
        return Err("Tag requires intensity value (1-5)".to_string());
    }
    if !has_intensity && intensity.is_some() {
        return Err("Tag does not support intensity".to_string());
    }

    // 【強度範囲バリデーション】: intensityが1-5の範囲内かチェック 🔵
    if let Some(val) = intensity {
        validate_tag_intensity(val)?;
    }

    // 【display_order計算】: このプレイヤーの最大display_order + 1 🔵
    let display_order: i32 = conn
        .query_row(
            "SELECT COALESCE(MAX(display_order), -1) + 1 FROM player_tags WHERE player_id = ?1",
            params![player_id],
            |row| row.get(0),
        )
        .map_err(|e| format!("Failed to calculate display_order: {}", e))?;

    // 【player_tag作成】: player_tagsテーブルにINSERT 🔵
    // UNIQUE制約(player_id, tag_id, intensity)により重複エラーが自動検出される 🔵
    conn.execute(
        "INSERT INTO player_tags (player_id, tag_id, intensity, display_order) VALUES (?1, ?2, ?3, ?4)",
        params![player_id, tag_id, intensity, display_order],
    )
    .map_err(|e| {
        // 【UNIQUE制約エラー検出】: SQLiteのUNIQUE制約エラーを判定 🔵
        if e.to_string().contains("UNIQUE constraint failed") {
            return "This tag with the same intensity is already assigned to this player".to_string();
        }
        format!("Failed to insert player_tag: {}", e)
    })?;

    let player_tag_id = conn.last_insert_rowid();

    // 【作成されたplayer_tag取得】: IDから PlayerTag エンティティを取得 🔵
    let player_tag = conn
        .query_row(
            "SELECT id, player_id, tag_id, intensity, display_order, created_at FROM player_tags WHERE id = ?1",
            params![player_tag_id],
            |row| {
                Ok(PlayerTag {
                    id: row.get(0)?,
                    player_id: row.get(1)?,
                    tag_id: row.get(2)?,
                    intensity: row.get(3)?,
                    display_order: row.get(4)?,
                    created_at: row.get(5)?,
                })
            },
        )
        .map_err(|e| format!("Failed to retrieve created player_tag: {}", e))?;

    Ok(player_tag)
}

/// プレイヤーからタグ割り当てを解除する（内部関数）
///
/// 【機能概要】: プレイヤーからタグ割り当てを解除（player_tagsレコード削除） 🔵
/// 【実装方針】: 存在確認 → DELETE実行 🔵
/// 【テスト対応】: TC-REMOVE-001, TC-REMOVE-ERR-001 🔵
#[allow(dead_code)]
pub(crate) fn remove_tag_from_player_internal(
    player_tag_id: i64,
    db: &PlayerDatabase,
) -> Result<(), String> {
    let conn = db.0.lock().unwrap();

    // 【player_tag存在確認】: ヘルパー関数を使用 🔵
    check_player_tag_exists(&conn, player_tag_id)?;

    // 【player_tag削除】: DELETE実行 🔵
    conn.execute(
        "DELETE FROM player_tags WHERE id = ?1",
        params![player_tag_id],
    )
    .map_err(|e| format!("Failed to delete player_tag: {}", e))?;

    Ok(())
}

/// プレイヤーのタグ一覧を取得する（内部関数）
///
/// 【機能概要】: プレイヤーに割り当てられたタグ一覧を取得（タグ情報含む） 🔵
/// 【実装方針】: プレイヤー存在確認 → JOIN クエリ → display_order順でソート 🔵
/// 【テスト対応】: TC-GET-001, TC-GET-002, TC-GET-ERR-001 🔵
#[allow(dead_code)]
pub(crate) fn get_player_tags_internal(
    player_id: i64,
    db: &PlayerDatabase,
) -> Result<Vec<PlayerTagWithTag>, String> {
    let conn = db.0.lock().unwrap();

    // 【プレイヤー存在確認】: ヘルパー関数を使用 🔵
    check_player_exists(&conn, player_id)?;

    // 【タグ一覧取得】: player_tags と tags を JOIN して取得 🔵
    // 【ソート】: display_order 昇順でソート 🔵
    let mut stmt = conn
        .prepare(
            "SELECT
                pt.id, pt.player_id, pt.tag_id, pt.intensity, pt.display_order, pt.created_at,
                t.name, t.color, t.has_intensity
             FROM player_tags pt
             INNER JOIN tags t ON pt.tag_id = t.id
             WHERE pt.player_id = ?1
             ORDER BY pt.display_order ASC",
        )
        .map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let player_tags = stmt
        .query_map(params![player_id], |row| {
            Ok(PlayerTagWithTag {
                id: row.get(0)?,
                player_id: row.get(1)?,
                tag_id: row.get(2)?,
                intensity: row.get(3)?,
                display_order: row.get(4)?,
                created_at: row.get(5)?,
                tag_name: row.get(6)?,
                tag_color: row.get(7)?,
                tag_has_intensity: row.get(8)?,
            })
        })
        .map_err(|e| format!("Failed to query player_tags: {}", e))?
        .collect::<Result<Vec<PlayerTagWithTag>, _>>()
        .map_err(|e| format!("Failed to collect player_tags: {}", e))?;

    // 【結果返却】: Vec<PlayerTagWithTag> を返す（空の場合もある） 🔵
    Ok(player_tags)
}
