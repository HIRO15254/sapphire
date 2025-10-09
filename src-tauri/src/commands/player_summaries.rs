use crate::database::models::PlayerSummary;
use crate::database::PlayerDatabase;
use rusqlite::params;

// ============================================
// ヘルパー関数（内部関数）
// ============================================

/// プレイヤー存在確認
fn check_player_exists(conn: &rusqlite::Connection, player_id: i64) -> Result<(), String> {
    let exists: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM players WHERE id = ?1",
            params![player_id],
            |row| row.get(0),
        )
        .map_err(|_| "Failed to check player existence".to_string())?;

    if exists == 0 {
        return Err("Player not found".to_string());
    }
    Ok(())
}


/// 総合メモコンテンツサイズ検証
fn validate_summary_content_size(content: &str) -> Result<(), String> {
    const SUMMARY_CONTENT_MAX_BYTES: usize = 1048576; // 1MB
    if content.len() > SUMMARY_CONTENT_MAX_BYTES {
        return Err("Summary content exceeds 1MB limit".to_string());
    }
    Ok(())
}

/// 総合メモ取得（内部関数）
fn get_summary_by_player_id(
    conn: &rusqlite::Connection,
    player_id: i64,
) -> Result<PlayerSummary, String> {
    let summary = conn
        .query_row(
            "SELECT id, player_id, content, created_at, updated_at FROM player_summaries WHERE player_id = ?1",
            params![player_id],
            |row| {
                Ok(PlayerSummary {
                    id: row.get(0)?,
                    player_id: row.get(1)?,
                    content: row.get(2)?,
                    created_at: row.get(3)?,
                    updated_at: row.get(4)?,
                })
            },
        )
        .map_err(|_| "Summary not found".to_string())?;

    Ok(summary)
}

// ============================================
// テスト用内部関数（State不要）
// ============================================

/// 総合メモ更新（内部関数 - テスト用）
pub fn update_player_summary_internal(
    player_id: i64,
    content: &str,
    db: &PlayerDatabase,
) -> Result<PlayerSummary, String> {
    let conn = db.0.lock().unwrap();

    // 1. サイズ検証
    validate_summary_content_size(content)?;

    // 2. プレイヤー存在確認
    check_player_exists(&conn, player_id)?;

    // 3. 既存の総合メモを取得（存在確認も兼ねる）
    let existing_summary = get_summary_by_player_id(&conn, player_id)?;

    // 4. 総合メモ更新（idを使用）
    conn.execute(
        "UPDATE player_summaries SET content = ?1, updated_at = CURRENT_TIMESTAMP WHERE id = ?2",
        params![content, existing_summary.id],
    )
    .map_err(|e| format!("Failed to update summary: {}", e))?;

    // 5. 更新後のPlayerSummaryを取得して返す
    get_summary_by_player_id(&conn, player_id)
}

/// 総合メモ取得（内部関数 - テスト用）
pub fn get_player_summary_internal(
    player_id: i64,
    db: &PlayerDatabase,
) -> Result<PlayerSummary, String> {
    let conn = db.0.lock().unwrap();

    // 1. プレイヤー存在確認
    check_player_exists(&conn, player_id)?;

    // 2. PlayerSummaryを取得して返す
    get_summary_by_player_id(&conn, player_id)
}

// ============================================
// Tauriコマンド（Greenフェーズで実装予定）
// ============================================

// #[tauri::command]
// pub async fn update_player_summary(
//     state: tauri::State<'_, PlayerDatabase>,
//     request: UpdateSummaryRequest,
// ) -> Result<PlayerSummary, String> {
//     update_player_summary_internal(request.player_id, &request.content, &state)
// }

// #[tauri::command]
// pub async fn get_player_summary(
//     state: tauri::State<'_, PlayerDatabase>,
//     player_id: i64,
// ) -> Result<PlayerSummary, String> {
//     get_player_summary_internal(player_id, &state)
// }

