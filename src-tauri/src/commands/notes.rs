use crate::database::models::{PlayerNote, NOTE_CONTENT_MAX_BYTES};
use crate::database::PlayerDatabase;
use tauri::State;

// ============================================
// ヘルパー関数
// ============================================

/// メモ内容のサイズバリデーション
fn validate_note_content_size(content: &str) -> Result<(), String> {
    if content.len() > NOTE_CONTENT_MAX_BYTES {
        return Err("Note content exceeds 1MB limit".to_string());
    }
    Ok(())
}

/// プレイヤーのメモ個数チェック（最大100個）
fn check_player_note_count(_player_id: i64, _db: &PlayerDatabase) -> Result<(), String> {
    // TODO: Green Phaseで実装
    Err("Not implemented".to_string())
}

/// メモが存在するかチェック
fn check_note_exists(_id: i64, _db: &PlayerDatabase) -> Result<(), String> {
    // TODO: Green Phaseで実装
    Err("Not implemented".to_string())
}

/// プレイヤーが存在するかチェック
fn check_player_exists(_player_id: i64, _db: &PlayerDatabase) -> Result<(), String> {
    // TODO: Green Phaseで実装
    Err("Not implemented".to_string())
}

// ============================================
// CRUD内部関数（テスタビリティ）
// ============================================

/// メモ作成内部関数
pub(crate) fn create_note_internal(
    _player_id: i64,
    _content: &str,
    _db: &PlayerDatabase,
) -> Result<PlayerNote, String> {
    // TODO: Green Phaseで実装
    Err("Not implemented".to_string())
}

/// メモ更新内部関数
pub(crate) fn update_note_internal(
    _id: i64,
    _content: &str,
    _db: &PlayerDatabase,
) -> Result<PlayerNote, String> {
    // TODO: Green Phaseで実装
    Err("Not implemented".to_string())
}

/// メモ削除内部関数
pub(crate) fn delete_note_internal(_id: i64, _db: &PlayerDatabase) -> Result<(), String> {
    // TODO: Green Phaseで実装
    Err("Not implemented".to_string())
}

/// プレイヤーのメモ一覧取得内部関数
pub(crate) fn get_player_notes_internal(
    _player_id: i64,
    _db: &PlayerDatabase,
) -> Result<Vec<PlayerNote>, String> {
    // TODO: Green Phaseで実装
    Err("Not implemented".to_string())
}

// ============================================
// Tauri コマンド
// ============================================

/// メモ作成
#[tauri::command]
pub async fn create_player_note(
    player_id: i64,
    content: String,
    db: State<'_, PlayerDatabase>,
) -> Result<PlayerNote, String> {
    create_note_internal(player_id, &content, &db)
}

/// メモ更新
#[tauri::command]
pub async fn update_player_note(
    id: i64,
    content: String,
    db: State<'_, PlayerDatabase>,
) -> Result<PlayerNote, String> {
    update_note_internal(id, &content, &db)
}

/// メモ削除
#[tauri::command]
pub async fn delete_player_note(id: i64, db: State<'_, PlayerDatabase>) -> Result<(), String> {
    delete_note_internal(id, &db)
}

/// プレイヤーのメモ一覧取得
#[tauri::command]
pub async fn get_player_notes(
    player_id: i64,
    db: State<'_, PlayerDatabase>,
) -> Result<Vec<PlayerNote>, String> {
    get_player_notes_internal(player_id, &db)
}
