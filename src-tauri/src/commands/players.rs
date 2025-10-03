use crate::database::models::{PaginatedResponse, Player};
use crate::database::PlayerDatabase;
use rusqlite::params;
use tauri::State;

/// プレイヤーを作成し、総合メモを自動生成する
///
/// # Arguments
/// * `name` - プレイヤー名（1～100文字）
/// * `category_id` - 種別ID（オプション）
/// * `db` - データベース接続
///
/// # Returns
/// * `Result<Player, String>` - 作成されたプレイヤーまたはエラーメッセージ
/// 内部関数: プレイヤーを作成（テスト可能）
pub(crate) fn create_player_internal(
    name: &str,
    category_id: Option<i64>,
    db: &PlayerDatabase,
) -> Result<Player, String> {
    // TODO: Greenフェーズで実装
    Err("Not implemented yet".to_string())
}

#[tauri::command]
pub async fn create_player(
    name: String,
    category_id: Option<i64>,
    db: State<'_, PlayerDatabase>,
) -> Result<Player, String> {
    create_player_internal(&name, category_id, &db)
}

/// プレイヤー一覧を取得（ページネーション付き）
///
/// # Arguments
/// * `page` - ページ番号（デフォルト: 1）
/// * `per_page` - 1ページあたりの件数（デフォルト: 20、最大: 100）
/// * `db` - データベース接続
///
/// # Returns
/// * `Result<PaginatedResponse<Player>, String>` - ページネーション付きプレイヤー一覧
/// 内部関数: プレイヤー一覧を取得（テスト可能）
pub(crate) fn get_players_internal(
    page: Option<usize>,
    per_page: Option<usize>,
    db: &PlayerDatabase,
) -> Result<PaginatedResponse<Player>, String> {
    // TODO: Greenフェーズで実装
    Err("Not implemented yet".to_string())
}

#[tauri::command]
pub async fn get_players(
    page: Option<usize>,
    per_page: Option<usize>,
    db: State<'_, PlayerDatabase>,
) -> Result<PaginatedResponse<Player>, String> {
    get_players_internal(page, per_page, &db)
}

/// プレイヤー情報を更新
///
/// # Arguments
/// * `id` - プレイヤーID
/// * `name` - 新しい名前（オプション）
/// * `category_id` - 新しい種別ID（オプション、NULLに設定する場合は Some(None)）
/// * `db` - データベース接続
///
/// # Returns
/// * `Result<Player, String>` - 更新されたプレイヤーまたはエラーメッセージ
/// 内部関数: プレイヤー情報を更新（テスト可能）
pub(crate) fn update_player_internal(
    id: i64,
    name: Option<&str>,
    category_id: Option<Option<i64>>,
    db: &PlayerDatabase,
) -> Result<Player, String> {
    // TODO: Greenフェーズで実装
    Err("Not implemented yet".to_string())
}

#[tauri::command]
pub async fn update_player(
    id: i64,
    name: Option<String>,
    category_id: Option<Option<i64>>,
    db: State<'_, PlayerDatabase>,
) -> Result<Player, String> {
    update_player_internal(id, name.as_deref(), category_id, &db)
}

/// プレイヤーを削除（CASCADE削除）
///
/// # Arguments
/// * `id` - プレイヤーID
/// * `db` - データベース接続
///
/// # Returns
/// * `Result<(), String>` - 成功またはエラーメッセージ
/// 内部関数: プレイヤーを削除（テスト可能）
pub(crate) fn delete_player_internal(id: i64, db: &PlayerDatabase) -> Result<(), String> {
    // TODO: Greenフェーズで実装
    Err("Not implemented yet".to_string())
}

#[tauri::command]
pub async fn delete_player(id: i64, db: State<'_, PlayerDatabase>) -> Result<(), String> {
    delete_player_internal(id, &db)
}

/// プレイヤー詳細を取得（種別・タグ・メモ含む）
///
/// # Arguments
/// * `id` - プレイヤーID
/// * `db` - データベース接続
///
/// # Returns
/// * `Result<PlayerDetail, String>` - プレイヤー詳細またはエラーメッセージ
/// 内部関数: プレイヤー詳細を取得（テスト可能）
pub(crate) fn get_player_detail_internal(
    id: i64,
    db: &PlayerDatabase,
) -> Result<serde_json::Value, String> {
    // TODO: Greenフェーズで実装
    // 注: PlayerDetail型はGreenフェーズで定義予定
    Err("Not implemented yet".to_string())
}

#[tauri::command]
pub async fn get_player_detail(
    id: i64,
    db: State<'_, PlayerDatabase>,
) -> Result<serde_json::Value, String> {
    get_player_detail_internal(id, &db)
}
