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

// プレイヤーメモ保存リクエスト (UPSERT)
#[derive(Debug, Serialize, Deserialize)]
pub struct SavePlayerNoteRequest {
    pub player_id: String,
    pub content: String,
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

// 検索クエリ (REQ-005: 部分一致検索)
#[derive(Debug, Serialize, Deserialize)]
pub struct SearchPlayersRequest {
    pub query: Option<String>, // 部分一致検索文字列
    pub player_type_id: Option<String>, // プレイヤータイプでフィルタ
    pub tag_ids: Option<Vec<String>>, // タグでフィルタ
    pub min_level: Option<i32>, // 最小タグレベル
    pub max_level: Option<i32>, // 最大タグレベル
    pub limit: Option<i32>, // ページネーション: 取得件数
    pub offset: Option<i32>, // ページネーション: オフセット
}

// 検索結果レスポンス
#[derive(Debug, Serialize, Deserialize)]
pub struct SearchPlayersResponse {
    pub players: Vec<PlayerListResponse>,
    pub total_count: i32,
    pub has_more: bool,
}

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
    level >= 1 && level <= 10
}

pub fn validate_player_name(name: &str) -> bool {
    !name.trim().is_empty() && name.len() <= 255
}