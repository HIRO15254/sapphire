// Player Note Data Types
// 🔵 青信号: EARS要件定義書とTypeScript型定義に基づく

use serde::{Deserialize, Serialize};

// プレイヤー構造体 (REQ-001: プレイヤー管理)
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Player {
    pub id: String,
    pub name: String,
    pub player_type_id: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

// プレイヤー作成リクエスト
#[derive(Debug, Serialize, Deserialize)]
pub struct CreatePlayerRequest {
    pub name: String,
    pub player_type_id: Option<String>,
}

// プレイヤー更新リクエスト
#[derive(Debug, Serialize, Deserialize)]
pub struct UpdatePlayerRequest {
    pub id: String,
    pub name: Option<String>,
    pub player_type_id: Option<String>,
}

// プレイヤータイプ構造体 (REQ-002, REQ-101, REQ-102: カスタマイズ可能なプレイヤー分類)
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PlayerType {
    pub id: String,
    pub name: String,
    pub color: String, // HEX color code
    pub created_at: String,
    pub updated_at: String,
}

// プレイヤータイプ作成リクエスト
#[derive(Debug, Serialize, Deserialize)]
pub struct CreatePlayerTypeRequest {
    pub name: String,
    pub color: String,
}

// プレイヤータイプ更新リクエスト
#[derive(Debug, Serialize, Deserialize)]
pub struct UpdatePlayerTypeRequest {
    pub id: String,
    pub name: Option<String>,
    pub color: Option<String>,
}

// プレイヤータイプ削除リクエスト
#[derive(Debug, Serialize, Deserialize)]
pub struct DeletePlayerTypeRequest {
    pub id: String,
}

// タグ構造体 (REQ-003, REQ-104: 多重タグシステム)
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Tag {
    pub id: String,
    pub name: String,
    pub color: String, // Base HEX color for level calculations
    pub created_at: String,
    pub updated_at: String,
}

// タグ作成リクエスト
#[derive(Debug, Serialize, Deserialize)]
pub struct CreateTagRequest {
    pub name: String,
    pub color: String,
}

// タグ更新リクエスト
#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateTagRequest {
    pub id: String,
    pub name: Option<String>,
    pub color: Option<String>,
}

// プレイヤータグ構造体 (REQ-003, REQ-105: レベル付き多重タグ)
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PlayerTag {
    pub id: String,
    pub player_id: String,
    pub tag_id: String,
    pub level: i32, // REQ-105: レベル1-10
    pub created_at: String,
    pub updated_at: String,
}

// タグ割り当てリクエスト
#[derive(Debug, Serialize, Deserialize)]
pub struct AssignTagsRequest {
    pub player_id: String,
    pub tag_assignments: Vec<TagAssignment>,
}

// タグ割り当て詳細
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TagAssignment {
    pub tag_id: String,
    pub level: i32,
}

// プレイヤーメモ構造体 (REQ-004, REQ-106: リッチテキストメモ)
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PlayerNote {
    pub id: String,
    pub player_id: String,
    pub content: String, // TipTap rich text content
    pub created_at: String,
    pub updated_at: String,
}

// プレイヤーメモ保存リクエスト (UPSERT) - Updated for TASK-0511
#[derive(Debug, Serialize, Deserialize)]
pub struct SavePlayerNoteRequest {
    pub player_id: String,
    pub content: String,
    pub content_type: Option<String>, // Optional, will be auto-detected if not provided
}

// プレイヤー詳細ビューレスポンス（結合データ）
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PlayerDetailResponse {
    pub id: String,
    pub name: String,
    pub created_at: String,
    pub updated_at: String,
    pub player_type: Option<PlayerType>,
    pub tags: Vec<PlayerTagWithInfo>,
    pub note: Option<PlayerNote>,
}

// タグ情報付きプレイヤータグ
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PlayerTagWithInfo {
    pub tag: Tag,
    pub level: i32,
    pub assigned_at: String,
}

// プレイヤー一覧レスポンス
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PlayerListResponse {
    pub id: String,
    pub name: String,
    pub created_at: String,
    pub updated_at: String,
    pub player_type_name: Option<String>,
    pub player_type_color: Option<String>,
    pub tag_count: i32,
    pub last_note_updated: Option<String>,
}

// TASK-0510: Player Search API - Enhanced search types
#[derive(Debug, Serialize, Deserialize)]
pub struct SearchPlayersRequest {
    pub query: String,
    pub page: Option<u32>,
    pub limit: Option<u32>,
    pub sort: Option<String>,
}

// Legacy search query for compatibility (REQ-005: 部分一致検索)
#[derive(Debug, Serialize, Deserialize)]
pub struct LegacySearchPlayersRequest {
    pub query: Option<String>,          // 部分一致検索文字列
    pub player_type_id: Option<String>, // プレイヤータイプでフィルタ
    pub tag_ids: Option<Vec<String>>,   // タグでフィルタ
    pub min_level: Option<i32>,         // 最小タグレベル
    pub max_level: Option<i32>,         // 最大タグレベル
    pub limit: Option<i32>,             // ページネーション: 取得件数
    pub offset: Option<i32>,            // ページネーション: オフセット
}

// 検索結果レスポンス (legacy)
#[derive(Debug, Serialize, Deserialize)]
pub struct SearchPlayersResponse {
    pub players: Vec<PlayerListResponse>,
    pub total_count: i32,
    pub has_more: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PlayerSearchResult {
    pub id: String,
    pub name: String,
    pub player_type_id: Option<String>,
    pub player_type: Option<PlayerTypeInfo>,
    pub tag_count: i32,
    pub has_notes: bool,
    pub created_at: String,
    pub updated_at: String,
    pub relevance_score: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PlayerTypeInfo {
    pub id: String,
    pub name: String,
    pub color: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchPagination {
    pub current_page: u32,
    pub per_page: u32,
    pub total_items: u32,
    pub total_pages: u32,
    pub has_next: bool,
    pub has_prev: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchInfo {
    pub query: String,
    pub sort: String,
    pub execution_time_ms: u32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchPlayersApiResponse {
    pub players: Vec<PlayerSearchResult>,
    pub pagination: SearchPagination,
    pub search_info: SearchInfo,
}

// get_playersコマンド用リクエスト型 (TASK-0504)
#[derive(Debug, Serialize, Deserialize)]
pub struct GetPlayersRequest {
    pub limit: Option<i32>,         // デフォルト50, 範囲1-1000
    pub offset: Option<i32>,        // デフォルト0, 範囲0以上
    pub sort_by: Option<String>,    // "name", "created_at", "updated_at"
    pub sort_order: Option<String>, // "asc", "desc", デフォルト"asc"
}

// get_playersコマンド用レスポンス型 (TASK-0504)
// SearchPlayersResponseと同じ構造だが、意図を明確にするため別型として定義
pub type GetPlayersResponse = SearchPlayersResponse;

// カスケード削除結果 (REQ-401: カスケード削除)
#[derive(Debug, Serialize, Deserialize)]
pub struct DeletePlayerResponse {
    pub deleted_player_id: String,
    pub deleted_tags_count: i32,
    pub deleted_note: bool,
}

// Note: PlayerNoteError is defined in error.rs

// バリデーションヘルパー関数
pub fn validate_hex_color(color: &str) -> bool {
    if color.len() != 7 || !color.starts_with('#') {
        return false;
    }

    color.chars().skip(1).all(|c| c.is_ascii_hexdigit())
}

pub fn validate_tag_level(level: i32) -> bool {
    (1..=10).contains(&level)
}

pub fn validate_player_name(name: &str) -> bool {
    !name.trim().is_empty() && name.len() <= 255
}

// REFACTOR PHASE: Helper functions for common validation and error creation
// 🔵 青信号: Code quality improvement while maintaining test compliance

/// Generic name validation that can be used for both player types and tags
pub fn validate_entity_name(name: &str, entity_type: &str) -> Result<(), (String, String)> {
    if name.trim().is_empty() {
        return Err((
            format!("{}_NAME_EMPTY", entity_type.to_uppercase()).to_string(),
            match entity_type {
                "player_type" => "プレイヤータイプ名が空です".to_string(),
                "tag" => "タグ名が空です".to_string(),
                _ => format!("{}名が空です", entity_type),
            }
        ));
    }

    if name.len() > 100 {
        return Err((
            format!("{}_NAME_TOO_LONG", entity_type.to_uppercase()).to_string(),
            match entity_type {
                "player_type" => "プレイヤータイプ名が長すぎます（最大100文字）".to_string(),
                "tag" => "タグ名が長すぎます（最大100文字）".to_string(),
                _ => format!("{}名が長すぎます（最大100文字）", entity_type),
            }
        ));
    }

    Ok(())
}

/// Validates player type name with detailed error information (wrapper for backward compatibility)
pub fn validate_player_type_name(name: &str) -> Result<(), (String, String)> {
    validate_entity_name(name, "player_type")
}

/// Creates detailed HEX color validation error message
pub fn get_hex_color_validation_error(color: &str) -> String {
    if !color.starts_with('#') {
        "色は # で始まるHEXカラーコードで入力してください"
    } else if color.len() != 7 {
        "色は #RRGGBB 形式の6桁で入力してください"
    } else {
        "色には0-9とA-Fの文字のみ使用できます"
    }.to_string()
}

/// Creates a standardized API error
pub fn create_api_error(code: &str, message: &str, details: Option<serde_json::Value>) -> ApiError {
    ApiError {
        code: code.to_string(),
        message: message.to_string(),
        details,
    }
}

/// Creates a standardized database connection error
pub fn create_db_connection_error<T>(e: T) -> String
where
    T: std::fmt::Display,
{
    format!("データベース接続エラー: {}", e)
}

/// 【機能概要】: 名前バリデーションエラー詳細情報生成
/// 【リファクタリング目的】: エラーレスポンス生成処理の統一化と重複削除
/// 【エラー詳細強化】: 文字数制限エラーに対する詳細情報の自動生成
/// 【条件分岐最適化】: エラーコード判定による適切な詳細情報提供
/// 🔵 青信号: REFACTOR Phase - エラーハンドリングの一貫性向上
pub fn create_name_validation_details(name: &str, error_code: &str) -> Option<serde_json::Value> {
    if error_code.ends_with("TOO_LONG") {
        Some(serde_json::json!({
            "length": name.len(),
            "max_length": 100
        }))
    } else {
        None
    }
}

/// 【機能概要】: カラーバリデーションエラー詳細情報生成
/// 【リファクタリング目的】: HEXカラーエラーレスポンスの統一化
/// 【デバッグ支援】: 無効なカラー値をエラーレスポンスに含めてデバッグ効率向上
/// 【一貫性保証】: 全てのカラーバリデーションエラーで同じ形式の詳細情報提供
/// 🔵 青信号: REFACTOR Phase - エラーハンドリングの標準化
pub fn create_color_validation_details(color: &str) -> Option<serde_json::Value> {
    Some(serde_json::json!({
        "provided_color": color
    }))
}

/// Database helper functions for Player Type operations
use rusqlite::Connection;

/// 【機能概要】: 汎用エンティティ取得関数
/// 【リファクタリング目的】: get_tag_by_id と get_player_type_by_id の重複コード削除
/// 【パフォーマンス向上】: 単一クエリでエンティティを効率的に取得
/// 【型安全性】: ジェネリクスを使用してコンパイル時型チェック実現
/// 【エラーハンドリング】: テーブル種別に応じた適切なエラーメッセージ生成
/// 🔵 青信号: REFACTOR Phase - コード品質向上とテスト互換性維持
fn get_entity_by_id<T>(
    conn: &Connection,
    table_name: &str,
    id: &str,
    mapper: impl FnOnce(&rusqlite::Row) -> Result<T, rusqlite::Error>
) -> Result<T, String> {
    let query = format!(
        "SELECT id, name, color, created_at, updated_at FROM {} WHERE id = ?1",
        table_name
    );

    conn.query_row(&query, [id], mapper)
        .map_err(|e| format!("{}取得エラー: {}",
            match table_name {
                "player_types" => "プレイヤータイプ",
                "tags" => "タグ",
                _ => "エンティティ"
            },
            e
        ))
}

/// Checks if a player type exists by ID
pub fn player_type_exists(conn: &Connection, id: &str) -> Result<bool, String> {
    conn.query_row(
        "SELECT EXISTS(SELECT 1 FROM player_types WHERE id = ?1)",
        [id],
        |row| row.get(0),
    )
    .map_err(|e| format!("存在確認エラー: {}", e))
}

/// Checks if a player type name is duplicated (excluding a specific ID for updates)
pub fn player_type_name_exists(conn: &Connection, name: &str, exclude_id: Option<&str>) -> Result<bool, String> {
    let query = match exclude_id {
        Some(_) => "SELECT EXISTS(SELECT 1 FROM player_types WHERE name = ?1 AND id != ?2)",
        None => "SELECT EXISTS(SELECT 1 FROM player_types WHERE name = ?1)",
    };

    let result = match exclude_id {
        Some(id) => conn.query_row(query, [name, id], |row| row.get(0)),
        None => conn.query_row(query, [name], |row| row.get(0)),
    };

    result.map_err(|e| format!("重複チェックエラー: {}", e))
}

/// Gets a player type by ID (refactored to use generic function)
pub fn get_player_type_by_id(conn: &Connection, id: &str) -> Result<PlayerType, String> {
    get_entity_by_id(conn, "player_types", id, |row| {
        Ok(PlayerType {
            id: row.get(0)?,
            name: row.get(1)?,
            color: row.get(2)?,
            created_at: row.get(3)?,
            updated_at: row.get(4)?,
        })
    })
}

/// 【機能概要】: 汎用影響レコード数カウント関数
/// 【リファクタリング目的】: count_affected_players と count_affected_player_tags の重複削除
/// 【CASCADE削除対応】: エンティティ削除前の影響範囲確認に使用
/// 【パフォーマンス向上】: COUNT(*)クエリによる効率的な集計処理
/// 【テーブル汎用化】: 任意のテーブルと外部キー列に対応可能
/// 🔵 青信号: REFACTOR Phase - データベース操作の共通化
fn count_affected_records(
    conn: &Connection,
    table_name: &str,
    foreign_key_column: &str,
    id: &str,
    error_context: &str
) -> Result<i32, String> {
    let query = format!(
        "SELECT COUNT(*) FROM {} WHERE {} = ?1",
        table_name, foreign_key_column
    );

    conn.query_row(&query, [id], |row| row.get(0))
        .map_err(|e| format!("{}: {}", error_context, e))
}

/// Counts affected players when deleting a player type
pub fn count_affected_players(conn: &Connection, player_type_id: &str) -> Result<i32, String> {
    count_affected_records(
        conn,
        "players",
        "player_type_id",
        player_type_id,
        "影響数カウントエラー"
    )
}

// TASK-0508: Tag Management Helper Functions
// 🔵 青信号: TASK-0507パターンを継承したタグ管理ヘルパー関数

/// Validates tag name with detailed error information (wrapper using common validation)
pub fn validate_tag_name(name: &str) -> Result<(), (String, String)> {
    validate_entity_name(name, "tag")
}

/// Checks if a tag exists by ID
pub fn tag_exists(conn: &Connection, id: &str) -> Result<bool, String> {
    conn.query_row(
        "SELECT EXISTS(SELECT 1 FROM tags WHERE id = ?1)",
        [id],
        |row| row.get(0),
    )
    .map_err(|e| format!("存在確認エラー: {}", e))
}

/// Checks if a tag name is duplicated (excluding a specific ID for updates)
pub fn tag_name_exists(conn: &Connection, name: &str, exclude_id: Option<&str>) -> Result<bool, String> {
    let query = match exclude_id {
        Some(_) => "SELECT EXISTS(SELECT 1 FROM tags WHERE name = ?1 AND id != ?2)",
        None => "SELECT EXISTS(SELECT 1 FROM tags WHERE name = ?1)",
    };

    let result = match exclude_id {
        Some(id) => conn.query_row(query, [name, id], |row| row.get(0)),
        None => conn.query_row(query, [name], |row| row.get(0)),
    };

    result.map_err(|e| format!("重複チェックエラー: {}", e))
}

/// Gets a tag by ID (refactored to use generic function)
pub fn get_tag_by_id(conn: &Connection, id: &str) -> Result<Tag, String> {
    get_entity_by_id(conn, "tags", id, |row| {
        Ok(Tag {
            id: row.get(0)?,
            name: row.get(1)?,
            color: row.get(2)?,
            created_at: row.get(3)?,
            updated_at: row.get(4)?,
        })
    })
}

/// Counts affected player_tags when deleting a tag
pub fn count_affected_player_tags(conn: &Connection, tag_id: &str) -> Result<i32, String> {
    count_affected_records(
        conn,
        "player_tags",
        "tag_id",
        tag_id,
        "影響数カウントエラー"
    )
}

// TASK-0506: プレイヤー詳細取得API用型定義
// 🔵 青信号: 要件定義書とapi-endpoints.mdに完全準拠

// プレイヤー詳細取得リクエスト
#[derive(Debug, Serialize, Deserialize)]
pub struct GetPlayerDetailRequest {
    pub player_id: String,
}

// プレイヤー詳細レスポンス
#[derive(Debug, Serialize, Deserialize)]
pub struct GetPlayerDetailResponse {
    pub success: bool,
    pub data: Option<PlayerDetail>,
    pub error: Option<ApiError>,
}

// プレイヤー詳細データ
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PlayerDetail {
    pub player: Player,
    pub player_type: Option<PlayerType>,
    pub tags: Vec<TagWithLevel>,
    pub note: Option<PlayerNote>, // スキーマ制約：1プレイヤー1メモ
}

// レベル付きタグ情報
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TagWithLevel {
    pub tag: Tag,
    pub level: i32,
    pub computed_color: String, // レベルに基づいて計算された色
    pub assigned_at: String,
}

// API エラー情報
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ApiError {
    pub code: String,
    pub message: String,
    pub details: Option<serde_json::Value>,
}

// TASK-0507: Player Type Management API Response Types
// 🔵 青信号: TypeScript型定義とのマッピング用レスポンス構造体

// プレイヤータイプ作成レスポンス
#[derive(Debug, Serialize, Deserialize)]
pub struct CreatePlayerTypeResponse {
    pub success: bool,
    pub data: Option<PlayerType>,
    pub error: Option<ApiError>,
}

// プレイヤータイプ一覧取得レスポンス
#[derive(Debug, Serialize, Deserialize)]
pub struct GetPlayerTypesResponse {
    pub success: bool,
    pub data: Option<Vec<PlayerType>>,
    pub error: Option<ApiError>,
}

// プレイヤータイプ更新レスポンス
#[derive(Debug, Serialize, Deserialize)]
pub struct UpdatePlayerTypeResponse {
    pub success: bool,
    pub data: Option<PlayerType>,
    pub error: Option<ApiError>,
}

// プレイヤータイプ削除レスポンス
#[derive(Debug, Serialize, Deserialize)]
pub struct DeletePlayerTypeResponse {
    pub success: bool,
    pub affected_players_count: Option<i32>,
    pub error: Option<ApiError>,
}

// TASK-0508: Tag Management API Response Types
// 🔵 青信号: TypeScript型定義とのマッピング用レスポンス構造体

// タグ作成レスポンス
#[derive(Debug, Serialize, Deserialize)]
pub struct CreateTagResponse {
    pub success: bool,
    pub data: Option<Tag>,
    pub error: Option<ApiError>,
}

// タグ一覧取得レスポンス
#[derive(Debug, Serialize, Deserialize)]
pub struct GetTagsResponse {
    pub success: bool,
    pub data: Option<Vec<Tag>>,
    pub error: Option<ApiError>,
}

// タグ更新レスポンス
#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateTagResponse {
    pub success: bool,
    pub data: Option<Tag>,
    pub error: Option<ApiError>,
}

// タグ削除リクエスト
#[derive(Debug, Serialize, Deserialize)]
pub struct DeleteTagRequest {
    pub id: String,
}

// タグ削除レスポンス
#[derive(Debug, Serialize, Deserialize)]
pub struct DeleteTagResponse {
    pub success: bool,
    pub affected_player_tags_count: Option<i32>,
    pub error: Option<ApiError>,
}

// TASK-0509: Multi-Tag Assignment and Level Management API Types
// 🔵 青信号: TypeScript型定義とのマッピング用レスポンス構造体

// タグ削除リクエスト (TASK-0509 個別削除用)
#[derive(Debug, Serialize, Deserialize)]
pub struct RemoveTagRequest {
    pub player_id: String,
    pub tag_id: String,
}

// 多重タグ割り当てレスポンス
#[derive(Debug, Serialize, Deserialize)]
pub struct AssignTagsResponse {
    pub success: bool,
    pub data: Option<AssignTagsResult>,
    pub error: Option<ApiError>,
}

// タグ割り当て処理結果
#[derive(Debug, Serialize, Deserialize)]
pub struct AssignTagsResult {
    pub player_id: String,
    pub assigned_tags: Vec<PlayerTag>,
    pub created_count: i32,
    pub updated_count: i32,
}

// タグ削除レスポンス (TASK-0509 個別削除用)
#[derive(Debug, Serialize, Deserialize)]
pub struct RemoveTagResponse {
    pub success: bool,
    pub data: Option<RemoveTagResult>,
    pub error: Option<ApiError>,
}

// タグ削除処理結果
#[derive(Debug, Serialize, Deserialize)]
pub struct RemoveTagResult {
    pub player_id: String,
    pub tag_id: String,
    pub removed: bool,
}

// TASK-0509 specific helper functions

/// Validates tag assignment array for bulk operations
pub fn validate_tag_assignments(assignments: &[TagAssignment]) -> Result<(), (String, String, Option<serde_json::Value>)> {
    // Check if empty
    if assignments.is_empty() {
        return Err((
            "EMPTY_TAG_ASSIGNMENTS".to_string(),
            "タグ割り当てが指定されていません".to_string(),
            None
        ));
    }

    // Check if too many
    if assignments.len() > 50 {
        return Err((
            "TOO_MANY_TAG_ASSIGNMENTS".to_string(),
            "一度に割り当て可能なタグ数は50個までです".to_string(),
            Some(serde_json::json!({
                "provided_count": assignments.len(),
                "max_allowed": 50
            }))
        ));
    }

    // Check for duplicates
    for (i, assignment) in assignments.iter().enumerate() {
        for (j, other) in assignments.iter().enumerate() {
            if i != j && assignment.tag_id == other.tag_id {
                return Err((
                    "DUPLICATE_TAG_IN_REQUEST".to_string(),
                    "同一リクエスト内で重複するタグIDが指定されています".to_string(),
                    Some(serde_json::json!({
                        "duplicate_tag_id": assignment.tag_id,
                        "indices": [i, j]
                    }))
                ));
            }
        }
    }

    // Validate levels
    for (i, assignment) in assignments.iter().enumerate() {
        if !validate_tag_level(assignment.level) {
            return Err((
                "INVALID_LEVEL_RANGE".to_string(),
                format!("レベルは1-10の範囲で指定してください（位置: {}）", i),
                Some(serde_json::json!({
                    "provided_level": assignment.level,
                    "valid_range": "1-10",
                    "tag_index": i
                }))
            ));
        }
    }

    Ok(())
}

/// Checks if a player exists by ID
pub fn player_exists(conn: &Connection, id: &str) -> Result<bool, String> {
    conn.query_row(
        "SELECT EXISTS(SELECT 1 FROM players WHERE id = ?1)",
        [id],
        |row| row.get(0),
    )
    .map_err(|e| format!("存在確認エラー: {}", e))
}

/// Gets all player tags for a player
pub fn get_player_tags_for_player(conn: &Connection, player_id: &str) -> Result<Vec<PlayerTag>, String> {
    let mut stmt = conn.prepare(
        "SELECT id, player_id, tag_id, level, created_at, updated_at FROM player_tags WHERE player_id = ?1"
    ).map_err(|e| format!("プレイヤータグ取得準備エラー: {}", e))?;

    let player_tag_iter = stmt.query_map([player_id], |row| {
        Ok(PlayerTag {
            id: row.get(0)?,
            player_id: row.get(1)?,
            tag_id: row.get(2)?,
            level: row.get(3)?,
            created_at: row.get(4)?,
            updated_at: row.get(5)?,
        })
    }).map_err(|e| format!("プレイヤータグ取得エラー: {}", e))?;

    let mut player_tags = Vec::new();
    for player_tag in player_tag_iter {
        player_tags.push(player_tag.map_err(|e| format!("プレイヤータグ行処理エラー: {}", e))?);
    }

    Ok(player_tags)
}

/// Gets existing player tag assignment for a specific player-tag combination
pub fn get_existing_player_tag(conn: &Connection, player_id: &str, tag_id: &str) -> Result<Option<PlayerTag>, String> {
    let result = conn.query_row(
        "SELECT id, player_id, tag_id, level, created_at, updated_at FROM player_tags WHERE player_id = ?1 AND tag_id = ?2",
        [player_id, tag_id],
        |row| {
            Ok(PlayerTag {
                id: row.get(0)?,
                player_id: row.get(1)?,
                tag_id: row.get(2)?,
                level: row.get(3)?,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
            })
        }
    );

    match result {
        Ok(player_tag) => Ok(Some(player_tag)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(format!("既存プレイヤータグ取得エラー: {}", e))
    }
}

// TASK-0511: Rich Text Player Note API Types
// 🔵 青信号: TypeScript型定義との完全同期

/// Player Note with rich text content (TASK-0511)
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RichPlayerNote {
    pub id: String,
    pub player_id: String,
    pub content: String,           // TipTap JSON or HTML content
    pub content_type: String,      // 'json' or 'html'
    pub content_hash: String,      // SHA256 hash for deduplication
    pub created_at: String,        // ISO 8601 format
    pub updated_at: String,        // ISO 8601 format
}

/// Get Player Note Request (TASK-0511)
#[derive(Debug, Serialize, Deserialize)]
pub struct GetPlayerNoteRequest {
    pub player_id: String,
}


/// Get Player Note Response (TASK-0511)
#[derive(Debug, Serialize, Deserialize)]
pub struct GetPlayerNoteResponse {
    pub success: bool,
    pub data: Option<RichPlayerNote>,
    pub error: Option<NoteApiError>,
}

/// Save Player Note Response (TASK-0511)
#[derive(Debug, Serialize, Deserialize)]
pub struct SavePlayerNoteResponse {
    pub success: bool,
    pub data: Option<RichPlayerNote>,
    pub error: Option<NoteApiError>,
}

/// Note API Error (TASK-0511)
#[derive(Debug, Serialize, Deserialize)]
pub struct NoteApiError {
    pub code: String,
    pub message: String,
    pub details: Option<serde_json::Value>,
}

/// Note Error Codes (TASK-0511)
pub mod note_error_codes {
    pub const PLAYER_NOT_FOUND: &str = "NOTE_PLAYER_NOT_FOUND";
    pub const INVALID_PLAYER_ID: &str = "NOTE_INVALID_PLAYER_ID";
    pub const INVALID_CONTENT: &str = "NOTE_INVALID_CONTENT";
    pub const INVALID_JSON: &str = "NOTE_INVALID_JSON";
    pub const CONTENT_TOO_LARGE: &str = "NOTE_CONTENT_TOO_LARGE";
    pub const SANITIZATION_FAILED: &str = "NOTE_SANITIZATION_FAILED";
    pub const DATABASE_ERROR: &str = "NOTE_DATABASE_ERROR";
    pub const TIMEOUT_ERROR: &str = "NOTE_TIMEOUT_ERROR";
    pub const PERMISSION_DENIED: &str = "NOTE_PERMISSION_DENIED";
    pub const DISK_FULL: &str = "NOTE_DISK_FULL";
    pub const FOREIGN_KEY_VIOLATION: &str = "NOTE_FOREIGN_KEY_VIOLATION";
}

/// Player Note validation and helper functions (TASK-0511)
impl RichPlayerNote {
    /// Creates a new player note with current timestamp
    pub fn new(player_id: String, content: String, content_type: String, content_hash: String) -> Self {
        let now = chrono::Utc::now().to_rfc3339();
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            player_id,
            content,
            content_type,
            content_hash,
            created_at: now.clone(),
            updated_at: now,
        }
    }

    /// Updates the content and sets updated_at to current time
    pub fn update_content(&mut self, content: String, content_type: String, content_hash: String) {
        self.content = content;
        self.content_type = content_type;
        self.content_hash = content_hash;
        self.updated_at = chrono::Utc::now().to_rfc3339();
    }
}

/// Validation helpers for Player Note API (TASK-0511)
pub fn validate_player_note_request(request: &SavePlayerNoteRequest) -> Result<(), NoteApiError> {
    // Validate player_id
    if request.player_id.trim().is_empty() {
        return Err(NoteApiError {
            code: note_error_codes::INVALID_PLAYER_ID.to_string(),
            message: "Player ID cannot be empty".to_string(),
            details: Some(serde_json::json!({
                "player_id": request.player_id
            })),
        });
    }

    // Validate content size (10MB limit)
    const MAX_CONTENT_SIZE: usize = 10 * 1024 * 1024; // 10MB
    if request.content.len() > MAX_CONTENT_SIZE {
        return Err(NoteApiError {
            code: note_error_codes::CONTENT_TOO_LARGE.to_string(),
            message: format!("Content size {} exceeds maximum allowed size of {} bytes",
                request.content.len(), MAX_CONTENT_SIZE),
            details: Some(serde_json::json!({
                "content_size": request.content.len(),
                "max_size": MAX_CONTENT_SIZE
            })),
        });
    }

    Ok(())
}

/// Detects content type (JSON vs HTML) (TASK-0511)
pub fn detect_content_type(content: &str) -> String {
    let trimmed = content.trim();
    if trimmed.starts_with('{') && trimmed.ends_with('}') {
        // Try to parse as JSON
        if serde_json::from_str::<serde_json::Value>(trimmed).is_ok() {
            return "json".to_string();
        }
    }
    "html".to_string()
}

/// Validates TipTap JSON structure (TASK-0511)
pub fn validate_tiptap_json(content: &str) -> Result<(), NoteApiError> {
    let parsed: serde_json::Value = serde_json::from_str(content)
        .map_err(|e| NoteApiError {
            code: note_error_codes::INVALID_JSON.to_string(),
            message: format!("Invalid JSON format: {}", e),
            details: Some(serde_json::json!({
                "json_error": e.to_string()
            })),
        })?;

    // Check for TipTap document structure
    if !parsed.is_object() {
        return Err(NoteApiError {
            code: note_error_codes::INVALID_JSON.to_string(),
            message: "TipTap JSON must be an object".to_string(),
            details: None,
        });
    }

    let obj = parsed.as_object().unwrap();

    // Check required fields
    if !obj.contains_key("type") || !obj.contains_key("content") {
        return Err(NoteApiError {
            code: note_error_codes::INVALID_JSON.to_string(),
            message: "TipTap JSON must contain 'type' and 'content' fields".to_string(),
            details: Some(serde_json::json!({
                "missing_fields": ["type", "content"]
            })),
        });
    }

    // Check document type
    if obj.get("type").and_then(|v| v.as_str()) != Some("doc") {
        return Err(NoteApiError {
            code: note_error_codes::INVALID_JSON.to_string(),
            message: "TipTap JSON root must have type 'doc'".to_string(),
            details: Some(serde_json::json!({
                "expected_type": "doc",
                "actual_type": obj.get("type")
            })),
        });
    }

    Ok(())
}

/// Generates SHA256 hash for content deduplication (TASK-0511)
/// Generates a hash for content (TASK-0511)
/// Optimized for memory efficiency with large content
pub fn generate_content_hash(content: &str) -> String {
    use sha2::{Sha256, Digest};

    // For very large content, process in chunks to reduce memory usage
    let mut hasher = Sha256::new();

    if content.len() > 1024 * 1024 { // 1MB threshold
        // Process in 64KB chunks for memory efficiency
        let chunk_size = 64 * 1024;
        let bytes = content.as_bytes();

        for chunk in bytes.chunks(chunk_size) {
            hasher.update(chunk);
        }
    } else {
        // Small content, process all at once
        hasher.update(content.as_bytes());
    }

    format!("{:x}", hasher.finalize())
}

/// Sanitizes HTML content (TASK-0511)
/// Enhanced implementation using ammonia crate for robust XSS protection
pub fn sanitize_html_content(content: &str) -> Result<String, NoteApiError> {
    use ammonia::Builder;
    use std::collections::HashSet;

    // Create sets for URL schemes and generic attributes
    let mut url_schemes = HashSet::new();
    url_schemes.insert("http");
    url_schemes.insert("https");
    url_schemes.insert("mailto");

    let mut generic_attrs = HashSet::new();
    generic_attrs.insert("class");
    generic_attrs.insert("id");

    // Create a custom sanitizer for player notes
    let mut builder = Builder::default();
    builder
        // Allow common formatting tags
        .add_tags(&[
            "p", "br", "strong", "b", "em", "i", "u", "s", "del", "ins",
            "ul", "ol", "li", "h1", "h2", "h3", "h4", "h5", "h6",
            "blockquote", "pre", "code", "span", "div", "a"
        ])
        // Allow safe attributes
        .add_tag_attributes("a", &["href", "title"])
        .add_tag_attributes("span", &["style"])
        .add_tag_attributes("div", &["style"])
        // Allow common CSS properties for basic formatting
        .add_allowed_classes("span", &["highlight", "underline", "strikethrough"])
        .add_allowed_classes("div", &["text-center", "text-left", "text-right"])
        // Set URL schemes for links
        .url_schemes(url_schemes)
        // Remove comments and unknown tags
        .strip_comments(true)
        .generic_attributes(generic_attrs);

    // Apply sanitization
    let sanitized = builder.clean(content).to_string();

    // Verify the result is not empty if original wasn't empty
    if !content.trim().is_empty() && sanitized.trim().is_empty() {
        return Err(NoteApiError {
            code: note_error_codes::SANITIZATION_FAILED.to_string(),
            message: "Content was completely removed during sanitization".to_string(),
            details: Some(serde_json::json!({
                "original_length": content.len(),
                "sanitized_length": sanitized.len()
            })),
        });
    }

    Ok(sanitized)
}
