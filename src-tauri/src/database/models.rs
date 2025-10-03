use serde::{Deserialize, Serialize};

// ============================================
// エンティティ型定義
// ============================================

/// プレイヤーエンティティ
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Player {
    pub id: i64,
    pub name: String,
    pub category_id: Option<i64>,
    pub created_at: String, // ISO 8601
    pub updated_at: String, // ISO 8601
}

/// プレイヤー種別エンティティ
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PlayerCategory {
    pub id: i64,
    pub name: String,
    pub color: String, // HEX color code (#RRGGBB)
    pub created_at: String,
    pub updated_at: String,
}

/// タグエンティティ
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Tag {
    pub id: i64,
    pub name: String,
    pub color: String,       // HEX color code
    pub has_intensity: bool, // 強度設定あり/なし
    pub created_at: String,
    pub updated_at: String,
}

/// プレイヤー-タグ関連エンティティ
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PlayerTag {
    pub id: i64,
    pub player_id: i64,
    pub tag_id: i64,
    pub intensity: Option<i32>, // 1-5 (I-V), null if has_intensity = false
    pub display_order: i32,     // ドラッグ&ドロップ順序
    pub created_at: String,
}

/// 簡易メモエンティティ
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PlayerNote {
    pub id: i64,
    pub player_id: i64,
    pub content: String, // HTML
    pub created_at: String,
    pub updated_at: String,
}

/// プレイヤー総合メモエンティティ
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PlayerSummary {
    pub id: i64,
    pub player_id: i64,
    pub content: String, // HTML
    pub created_at: String,
    pub updated_at: String,
}

/// 総合メモテンプレートエンティティ
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SummaryTemplate {
    pub id: i64,         // 常に1（シングルトン）
    pub content: String, // HTML
    pub updated_at: String,
}

// ============================================
// リクエスト型定義
// ============================================

/// プレイヤー作成リクエスト
#[derive(Debug, Serialize, Deserialize)]
pub struct CreatePlayerRequest {
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub category_id: Option<i64>,
}

/// プレイヤー更新リクエスト
#[derive(Debug, Serialize, Deserialize)]
pub struct UpdatePlayerRequest {
    pub id: i64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub category_id: Option<Option<i64>>,
}

/// 種別作成リクエスト
#[derive(Debug, Serialize, Deserialize)]
pub struct CreateCategoryRequest {
    pub name: String,
    pub color: String,
}

/// 種別更新リクエスト
#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateCategoryRequest {
    pub id: i64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub color: Option<String>,
}

/// タグ作成リクエスト
#[derive(Debug, Serialize, Deserialize)]
pub struct CreateTagRequest {
    pub name: String,
    pub color: String,
    pub has_intensity: bool,
}

/// タグ更新リクエスト
#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateTagRequest {
    pub id: i64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub color: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub has_intensity: Option<bool>,
}

/// プレイヤータグ割り当てリクエスト
#[derive(Debug, Serialize, Deserialize)]
pub struct AssignTagRequest {
    pub player_id: i64,
    pub tag_id: i64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub intensity: Option<i32>, // 1-5
}

/// タグ並び替えリクエスト
#[derive(Debug, Serialize, Deserialize)]
pub struct ReorderTagsRequest {
    pub player_id: i64,
    pub tag_orders: Vec<TagOrder>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TagOrder {
    pub player_tag_id: i64,
    pub display_order: i32,
}

/// メモ作成リクエスト
#[derive(Debug, Serialize, Deserialize)]
pub struct CreateNoteRequest {
    pub player_id: i64,
    pub content: String, // HTML
}

/// メモ更新リクエスト
#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateNoteRequest {
    pub id: i64,
    pub content: String, // HTML
}

/// 総合メモ更新リクエスト
#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateSummaryRequest {
    pub player_id: i64,
    pub content: String, // HTML
}

/// テンプレート更新リクエスト
#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateTemplateRequest {
    pub content: String, // HTML
}

/// 検索リクエスト
#[derive(Debug, Serialize, Deserialize)]
pub struct SearchRequest {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub keyword: Option<String>, // 名前検索
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tag_ids: Option<Vec<i64>>, // タグフィルタ
    #[serde(skip_serializing_if = "Option::is_none")]
    pub note_keyword: Option<String>, // メモ全文検索
    #[serde(skip_serializing_if = "Option::is_none")]
    pub page: Option<usize>, // ページ番号（1から開始）
    #[serde(skip_serializing_if = "Option::is_none")]
    pub per_page: Option<usize>, // 1ページあたりの件数（20/50/100）
}

// ============================================
// レスポンス型定義
// ============================================

/// ページネーション付きレスポンス
#[derive(Debug, Serialize, Deserialize)]
pub struct PaginatedResponse<T> {
    pub data: Vec<T>,
    pub total: usize,
    pub page: usize,
    pub per_page: usize,
    pub total_pages: usize,
}

/// 影響を受けるプレイヤー数レスポンス
#[derive(Debug, Serialize, Deserialize)]
pub struct AffectedPlayersCountResponse {
    pub count: usize,
}

// ============================================
// バリデーション定数
// ============================================

pub const PLAYER_NAME_MIN_LENGTH: usize = 1;
pub const PLAYER_NAME_MAX_LENGTH: usize = 100;
pub const NAME_MIN_LENGTH: usize = 1;
pub const NAME_MAX_LENGTH: usize = 50;
pub const NOTE_CONTENT_MAX_BYTES: usize = 1048576; // 1MB
pub const TAG_INTENSITY_MIN: i32 = 1;
pub const TAG_INTENSITY_MAX: i32 = 5;

// ============================================
// ユーティリティ関数
// ============================================

/// HEXカラーコードをバリデーション
pub fn validate_hex_color(color: &str) -> Result<(), String> {
    if !color.starts_with('#') || color.len() != 7 {
        return Err(format!("Invalid HEX color format: {}", color));
    }

    if !color[1..].chars().all(|c| c.is_ascii_hexdigit()) {
        return Err(format!("Invalid HEX color characters: {}", color));
    }

    Ok(())
}

/// タグ強度をバリデーション
pub fn validate_tag_intensity(intensity: i32) -> Result<(), String> {
    if !(TAG_INTENSITY_MIN..=TAG_INTENSITY_MAX).contains(&intensity) {
        return Err(format!(
            "Tag intensity must be between {} and {}, got: {}",
            TAG_INTENSITY_MIN, TAG_INTENSITY_MAX, intensity
        ));
    }
    Ok(())
}

/// ローマ数字変換
pub fn to_roman_numeral(n: i32) -> Option<&'static str> {
    match n {
        1 => Some("Ⅰ"),
        2 => Some("Ⅱ"),
        3 => Some("Ⅲ"),
        4 => Some("Ⅳ"),
        5 => Some("Ⅴ"),
        _ => None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_hex_color() {
        assert!(validate_hex_color("#FF0000").is_ok());
        assert!(validate_hex_color("#123ABC").is_ok());
        assert!(validate_hex_color("#ffffff").is_ok());

        assert!(validate_hex_color("FF0000").is_err()); // No #
        assert!(validate_hex_color("#FF00").is_err()); // Too short
        assert!(validate_hex_color("#GGGGGG").is_err()); // Invalid characters
    }

    #[test]
    fn test_validate_tag_intensity() {
        assert!(validate_tag_intensity(1).is_ok());
        assert!(validate_tag_intensity(3).is_ok());
        assert!(validate_tag_intensity(5).is_ok());

        assert!(validate_tag_intensity(0).is_err());
        assert!(validate_tag_intensity(6).is_err());
    }

    #[test]
    fn test_to_roman_numeral() {
        assert_eq!(to_roman_numeral(1), Some("Ⅰ"));
        assert_eq!(to_roman_numeral(2), Some("Ⅱ"));
        assert_eq!(to_roman_numeral(3), Some("Ⅲ"));
        assert_eq!(to_roman_numeral(4), Some("Ⅳ"));
        assert_eq!(to_roman_numeral(5), Some("Ⅴ"));
        assert_eq!(to_roman_numeral(6), None);
    }
}
