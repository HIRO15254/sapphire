// Player Note Error Handling System
// 🔵 青信号: 技術スタック要件に基づく包括的エラーハンドリング

use serde::{Deserialize, Serialize};
use std::fmt;

/// Player Note 統一エラー型
#[derive(Debug, Serialize, Deserialize)]
pub enum PlayerNoteError {
    /// データベース関連エラー
    Database {
        message: String,
        code: String,
        context: Option<String>,
    },

    /// バリデーションエラー
    Validation {
        field: String,
        message: String,
        value: Option<String>,
    },

    /// リソースが見つからない
    NotFound {
        resource: String,
        id: String,
    },

    /// 重複エラー
    Duplicate {
        resource: String,
        field: String,
        value: String,
    },

    /// 権限エラー
    Permission {
        action: String,
        resource: String,
        reason: String,
    },

    /// 外部システムエラー
    External {
        system: String,
        message: String,
        status_code: Option<u16>,
    },

    /// 内部システムエラー
    Internal {
        message: String,
        source: Option<String>,
    },

    /// 設定エラー
    Configuration {
        parameter: String,
        message: String,
        expected: Option<String>,
    },

    /// ネットワークエラー
    Network {
        operation: String,
        message: String,
    },

    /// タイムアウトエラー
    Timeout {
        operation: String,
        duration_ms: u64,
    },
}

impl PlayerNoteError {
    /// エラーコードを取得
    pub fn code(&self) -> &str {
        match self {
            PlayerNoteError::Database { .. } => "DATABASE_ERROR",
            PlayerNoteError::Validation { .. } => "VALIDATION_ERROR",
            PlayerNoteError::NotFound { .. } => "NOT_FOUND",
            PlayerNoteError::Duplicate { .. } => "DUPLICATE_ERROR",
            PlayerNoteError::Permission { .. } => "PERMISSION_ERROR",
            PlayerNoteError::External { .. } => "EXTERNAL_ERROR",
            PlayerNoteError::Internal { .. } => "INTERNAL_ERROR",
            PlayerNoteError::Configuration { .. } => "CONFIGURATION_ERROR",
            PlayerNoteError::Network { .. } => "NETWORK_ERROR",
            PlayerNoteError::Timeout { .. } => "TIMEOUT_ERROR",
        }
    }

    /// エラーレベルを取得
    pub fn level(&self) -> ErrorLevel {
        match self {
            PlayerNoteError::Database { .. } => ErrorLevel::Error,
            PlayerNoteError::Validation { .. } => ErrorLevel::Warning,
            PlayerNoteError::NotFound { .. } => ErrorLevel::Info,
            PlayerNoteError::Duplicate { .. } => ErrorLevel::Warning,
            PlayerNoteError::Permission { .. } => ErrorLevel::Error,
            PlayerNoteError::External { .. } => ErrorLevel::Error,
            PlayerNoteError::Internal { .. } => ErrorLevel::Critical,
            PlayerNoteError::Configuration { .. } => ErrorLevel::Error,
            PlayerNoteError::Network { .. } => ErrorLevel::Error,
            PlayerNoteError::Timeout { .. } => ErrorLevel::Warning,
        }
    }

    /// ユーザー向けメッセージを取得
    pub fn user_message(&self) -> String {
        match self {
            PlayerNoteError::Database { .. } =>
                "データベースエラーが発生しました。しばらくしてから再試行してください。".to_string(),
            PlayerNoteError::Validation { field, message, .. } =>
                format!("{}: {}", field, message),
            PlayerNoteError::NotFound { resource, .. } =>
                format!("{}が見つかりません。", resource),
            PlayerNoteError::Duplicate { resource, field, value } =>
                format!("{}の{}「{}」は既に存在します。", resource, field, value),
            PlayerNoteError::Permission { action, resource, .. } =>
                format!("{}に対する{}の権限がありません。", resource, action),
            PlayerNoteError::External { system, .. } =>
                format!("{}との通信でエラーが発生しました。", system),
            PlayerNoteError::Internal { .. } =>
                "内部エラーが発生しました。管理者に連絡してください。".to_string(),
            PlayerNoteError::Configuration { parameter, .. } =>
                format!("設定「{}」に問題があります。", parameter),
            PlayerNoteError::Network { operation, .. } =>
                format!("{}でネットワークエラーが発生しました。", operation),
            PlayerNoteError::Timeout { operation, .. } =>
                format!("{}がタイムアウトしました。", operation),
        }
    }

    /// 開発者向け詳細メッセージを取得
    pub fn developer_message(&self) -> String {
        format!("{:?}", self)
    }
}

/// エラーレベル
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub enum ErrorLevel {
    Critical,
    Error,
    Warning,
    Info,
}

impl fmt::Display for PlayerNoteError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.user_message())
    }
}

impl std::error::Error for PlayerNoteError {}

/// PlayerNoteResult型エイリアス
pub type PlayerNoteResult<T> = Result<T, PlayerNoteError>;

/// エラーコンバーター
impl From<rusqlite::Error> for PlayerNoteError {
    fn from(error: rusqlite::Error) -> Self {
        match error {
            rusqlite::Error::SqliteFailure(ffi_error, ref message) => {
                match ffi_error.extended_code {
                    rusqlite::ffi::SQLITE_CONSTRAINT_UNIQUE => {
                        PlayerNoteError::Duplicate {
                            resource: "リソース".to_string(),
                            field: "フィールド".to_string(),
                            value: message.clone().unwrap_or("不明".to_string()),
                        }
                    },
                    rusqlite::ffi::SQLITE_CONSTRAINT_FOREIGNKEY => {
                        PlayerNoteError::Validation {
                            field: "外部キー".to_string(),
                            message: "参照先が存在しません".to_string(),
                            value: message.clone(),
                        }
                    },
                    _ => PlayerNoteError::Database {
                        message: error.to_string(),
                        code: format!("SQLITE_{:?}", ffi_error.code),
                        context: message.clone(),
                    }
                }
            },
            _ => PlayerNoteError::Database {
                message: error.to_string(),
                code: "SQLITE_ERROR".to_string(),
                context: None,
            }
        }
    }
}

impl From<serde_json::Error> for PlayerNoteError {
    fn from(error: serde_json::Error) -> Self {
        PlayerNoteError::Internal {
            message: format!("JSON serialization error: {}", error),
            source: Some("serde_json".to_string()),
        }
    }
}

/// エラービルダーパターン
pub struct PlayerNoteErrorBuilder {
    error: PlayerNoteError,
}

impl PlayerNoteErrorBuilder {
    /// データベースエラーを作成
    pub fn database(message: impl Into<String>) -> Self {
        Self {
            error: PlayerNoteError::Database {
                message: message.into(),
                code: "DB_ERROR".to_string(),
                context: None,
            }
        }
    }

    /// バリデーションエラーを作成
    pub fn validation(field: impl Into<String>, message: impl Into<String>) -> Self {
        Self {
            error: PlayerNoteError::Validation {
                field: field.into(),
                message: message.into(),
                value: None,
            }
        }
    }

    /// NotFoundエラーを作成
    pub fn not_found(resource: impl Into<String>, id: impl Into<String>) -> Self {
        Self {
            error: PlayerNoteError::NotFound {
                resource: resource.into(),
                id: id.into(),
            }
        }
    }

    /// 重複エラーを作成
    pub fn duplicate(resource: impl Into<String>, field: impl Into<String>, value: impl Into<String>) -> Self {
        Self {
            error: PlayerNoteError::Duplicate {
                resource: resource.into(),
                field: field.into(),
                value: value.into(),
            }
        }
    }

    /// 内部エラーを作成
    pub fn internal(message: impl Into<String>) -> Self {
        Self {
            error: PlayerNoteError::Internal {
                message: message.into(),
                source: None,
            }
        }
    }

    /// タイムアウトエラーを作成
    pub fn timeout(operation: impl Into<String>, duration_ms: u64) -> Self {
        Self {
            error: PlayerNoteError::Timeout {
                operation: operation.into(),
                duration_ms,
            }
        }
    }

    /// コンテキストを追加
    pub fn with_context(mut self, context: impl Into<String>) -> Self {
        match &mut self.error {
            PlayerNoteError::Database { context: ctx, .. } => {
                *ctx = Some(context.into());
            },
            PlayerNoteError::Validation { value, .. } => {
                *value = Some(context.into());
            },
            PlayerNoteError::Internal { source, .. } => {
                *source = Some(context.into());
            },
            _ => {}
        }
        self
    }

    /// エラーを構築
    pub fn build(self) -> PlayerNoteError {
        self.error
    }
}

/// エラーハンドリングマクロ
#[macro_export]
macro_rules! playernote_error {
    (database, $msg:expr) => {
        PlayerNoteErrorBuilder::database($msg).build()
    };
    (database, $msg:expr, context = $ctx:expr) => {
        PlayerNoteErrorBuilder::database($msg).with_context($ctx).build()
    };
    (validation, $field:expr, $msg:expr) => {
        PlayerNoteErrorBuilder::validation($field, $msg).build()
    };
    (validation, $field:expr, $msg:expr, value = $val:expr) => {
        PlayerNoteErrorBuilder::validation($field, $msg).with_context($val).build()
    };
    (not_found, $resource:expr, $id:expr) => {
        PlayerNoteErrorBuilder::not_found($resource, $id).build()
    };
    (duplicate, $resource:expr, $field:expr, $value:expr) => {
        PlayerNoteErrorBuilder::duplicate($resource, $field, $value).build()
    };
    (internal, $msg:expr) => {
        PlayerNoteErrorBuilder::internal($msg).build()
    };
    (timeout, $op:expr, $duration:expr) => {
        PlayerNoteErrorBuilder::timeout($op, $duration).build()
    };
}

/// エラーハンドリングユーティリティ
pub struct ErrorHandler;

impl ErrorHandler {
    /// エラーをログに記録
    pub fn log_error(error: &PlayerNoteError) {
        match error.level() {
            ErrorLevel::Critical => tracing::error!(
                code = error.code(),
                message = %error,
                details = %error.developer_message(),
                "Critical error occurred"
            ),
            ErrorLevel::Error => tracing::error!(
                code = error.code(),
                message = %error,
                "Error occurred"
            ),
            ErrorLevel::Warning => tracing::warn!(
                code = error.code(),
                message = %error,
                "Warning occurred"
            ),
            ErrorLevel::Info => tracing::info!(
                code = error.code(),
                message = %error,
                "Info message"
            ),
        }
    }

    /// エラーを記録して返す
    pub fn log_and_return<T>(error: PlayerNoteError) -> PlayerNoteResult<T> {
        Self::log_error(&error);
        Err(error)
    }
}