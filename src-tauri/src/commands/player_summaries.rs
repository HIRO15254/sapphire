use crate::database::models::{PlayerSummary, UpdateSummaryRequest};
use crate::database::PlayerDatabase;
use rusqlite::params;

// ============================================
// ヘルパー関数（内部関数）
// ============================================

/// プレイヤー存在確認
fn check_player_exists(conn: &rusqlite::Connection, player_id: i64) -> Result<(), String> {
    // 🔴 未実装: Redフェーズ - 失敗するスタブ
    Err("Not implemented: check_player_exists".to_string())
}

/// 総合メモ存在確認
fn check_summary_exists(conn: &rusqlite::Connection, player_id: i64) -> Result<(), String> {
    // 🔴 未実装: Redフェーズ - 失敗するスタブ
    Err("Not implemented: check_summary_exists".to_string())
}

/// 総合メモコンテンツサイズ検証
fn validate_summary_content_size(content: &str) -> Result<(), String> {
    // 🔴 未実装: Redフェーズ - 失敗するスタブ
    Err("Not implemented: validate_summary_content_size".to_string())
}

/// 総合メモ取得（内部関数）
fn get_summary_by_player_id(
    conn: &rusqlite::Connection,
    player_id: i64,
) -> Result<PlayerSummary, String> {
    // 🔴 未実装: Redフェーズ - 失敗するスタブ
    Err("Not implemented: get_summary_by_player_id".to_string())
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
    // 🔴 未実装: Redフェーズ - 失敗するスタブ
    Err("Not implemented: update_player_summary_internal".to_string())
}

/// 総合メモ取得（内部関数 - テスト用）
pub fn get_player_summary_internal(
    player_id: i64,
    db: &PlayerDatabase,
) -> Result<PlayerSummary, String> {
    // 🔴 未実装: Redフェーズ - 失敗するスタブ
    Err("Not implemented: get_player_summary_internal".to_string())
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

