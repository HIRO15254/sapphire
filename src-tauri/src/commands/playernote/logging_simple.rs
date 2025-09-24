// Player Note Simple Logging System using tracing
// 🔵 青信号: 技術スタック要件のtracingログ設定に基づく

use tracing::Level;
use tracing_subscriber::EnvFilter;

/// ログ設定
#[derive(Debug, Clone)]
pub struct LogConfig {
    pub level: Level,
    pub console_enabled: bool,
}

impl Default for LogConfig {
    fn default() -> Self {
        Self {
            level: Level::INFO,
            console_enabled: true,
        }
    }
}

/// ロギングシステムの初期化
pub struct LoggingSystem;

impl LoggingSystem {
    /// 開発環境用ログ設定
    pub fn init_development() -> Result<(), String> {
        let filter = EnvFilter::new("sapphire=debug,playernote=debug");

        tracing_subscriber::fmt()
            .with_env_filter(filter)
            .with_target(true)
            .pretty()
            .try_init()
            .map_err(|e| e.to_string())?;

        tracing::info!("Development logging initialized");
        Ok(())
    }

    /// 本番環境用ログ設定
    pub fn init_production() -> Result<(), String> {
        let filter = EnvFilter::new("sapphire=info,playernote=info");

        tracing_subscriber::fmt()
            .with_env_filter(filter)
            .with_target(true)
            .json()
            .try_init()
            .map_err(|e| e.to_string())?;

        tracing::info!("Production logging initialized");
        Ok(())
    }

    /// テスト環境用ログ設定
    pub fn init_test() -> Result<(), String> {
        let filter = EnvFilter::new("sapphire=warn,playernote=warn");

        tracing_subscriber::fmt()
            .with_env_filter(filter)
            .with_target(false)
            .try_init()
            .map_err(|e| e.to_string())?;

        Ok(())
    }

    /// 環境に応じた自動初期化
    pub fn init_auto(_app_data_dir: Option<String>) -> Result<(), Box<dyn std::error::Error>> {
        // 重複初期化防止のために、エラーを無視して続行
        let result: Result<(), Box<dyn std::error::Error>> = match std::env::var("NODE_ENV").as_deref() {
            Ok("production") => Self::init_production().map_err(|e| e.into()),
            Ok("test") => Self::init_test().map_err(|e| e.into()),
            _ => Self::init_development().map_err(|e| e.into()),
        };

        // 既に初期化済みの場合はエラーを無視
        match result {
            Ok(_) => Ok(()),
            Err(_) => {
                // 既に初期化されている場合は成功として処理
                Ok(())
            }
        }
    }
}

/// Player Note専用ログイングユーティリティ
pub struct PlayerNoteLogger;

impl PlayerNoteLogger {
    /// プレイヤー操作ログ
    pub fn log_player_operation(operation: &str, player_id: &str, success: bool, duration_ms: Option<u64>) {
        if success {
            tracing::info!(
                operation = operation,
                player_id = player_id,
                duration_ms = duration_ms,
                "Player operation completed successfully"
            );
        } else {
            tracing::error!(
                operation = operation,
                player_id = player_id,
                duration_ms = duration_ms,
                "Player operation failed"
            );
        }
    }

    /// データベース操作ログ
    pub fn log_database_operation(operation: &str, table: &str, affected_rows: Option<usize>, duration_ms: Option<u64>) {
        tracing::debug!(
            operation = operation,
            table = table,
            affected_rows = affected_rows,
            duration_ms = duration_ms,
            "Database operation"
        );
    }

    /// セキュリティイベントログ
    pub fn log_security_event(event: &str, details: Option<&str>) {
        tracing::warn!(
            event = event,
            details = details,
            "Security event"
        );
    }

    /// パフォーマンス警告ログ
    pub fn log_performance_warning(operation: &str, duration_ms: u64, threshold_ms: u64) {
        if duration_ms > threshold_ms {
            tracing::warn!(
                operation = operation,
                duration_ms = duration_ms,
                threshold_ms = threshold_ms,
                "Performance threshold exceeded"
            );
        }
    }

    /// バリデーション失敗ログ
    pub fn log_validation_error(field: &str, value: Option<&str>, reason: &str) {
        tracing::warn!(
            field = field,
            value = value,
            reason = reason,
            "Validation failed"
        );
    }
}

/// トレーシングスパン用ヘルパー
pub fn create_operation_span(operation: &str) -> tracing::Span {
    tracing::info_span!(
        "player_note_operation",
        operation = operation,
        start_time = ?std::time::Instant::now()
    )
}