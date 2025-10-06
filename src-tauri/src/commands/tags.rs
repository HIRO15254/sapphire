use crate::database::models::{CreateTagRequest, Tag, UpdateTagRequest};
use crate::database::PlayerDatabase;

// ============================================
// 内部関数（テスト用）
// ============================================

/// タグ作成（内部関数）
pub(super) fn create_tag_internal(
    name: &str,
    color: &str,
    has_intensity: bool,
    _db: &PlayerDatabase,
) -> Result<Tag, String> {
    // 未実装: テスト失敗を確認するためのスタブ
    Err(format!(
        "Not implemented: create_tag({}, {}, {})",
        name, color, has_intensity
    ))
}

/// タグ更新（内部関数）
pub(super) fn update_tag_internal(
    id: i64,
    name: Option<&str>,
    color: Option<&str>,
    has_intensity: Option<bool>,
    _db: &PlayerDatabase,
) -> Result<Tag, String> {
    // 未実装: テスト失敗を確認するためのスタブ
    Err(format!(
        "Not implemented: update_tag({}, {:?}, {:?}, {:?})",
        id, name, color, has_intensity
    ))
}

/// タグ削除（内部関数）
pub(super) fn delete_tag_internal(id: i64, _db: &PlayerDatabase) -> Result<(), String> {
    // 未実装: テスト失敗を確認するためのスタブ
    Err(format!("Not implemented: delete_tag({})", id))
}

/// 全タグ取得（内部関数）
pub(super) fn get_all_tags_internal(_db: &PlayerDatabase) -> Result<Vec<Tag>, String> {
    // 未実装: テスト失敗を確認するためのスタブ
    Err("Not implemented: get_all_tags".to_string())
}

// ============================================
// Tauri コマンド（外部公開）
// ============================================

/// タグを作成
#[tauri::command]
pub fn create_tag(
    request: CreateTagRequest,
    state: tauri::State<PlayerDatabase>,
) -> Result<Tag, String> {
    create_tag_internal(&request.name, &request.color, request.has_intensity, &state)
}

/// タグを更新
#[tauri::command]
pub fn update_tag(
    request: UpdateTagRequest,
    state: tauri::State<PlayerDatabase>,
) -> Result<Tag, String> {
    update_tag_internal(
        request.id,
        request.name.as_deref(),
        request.color.as_deref(),
        request.has_intensity,
        &state,
    )
}

/// タグを削除
#[tauri::command]
pub fn delete_tag(id: i64, state: tauri::State<PlayerDatabase>) -> Result<(), String> {
    delete_tag_internal(id, &state)
}

/// 全タグを取得
#[tauri::command]
pub fn get_all_tags(state: tauri::State<PlayerDatabase>) -> Result<Vec<Tag>, String> {
    get_all_tags_internal(&state)
}
