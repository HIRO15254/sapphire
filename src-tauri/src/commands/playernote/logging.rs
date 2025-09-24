// Player Note Logging System using tracing
// 🔵 青信号: 技術スタック要件のtracingログ設定に基づく

use tracing::Level;
use tracing_subscriber::{
    fmt::{self, time::ChronoUtc, writer::MakeWriterExt},
    layer::SubscriberExt,
    util::SubscriberInitExt,
    Layer, EnvFilter, Registry,
};
use std::fs::OpenOptions;
use std::path::Path;

/// ログ設定
#[derive(Debug, Clone)]
pub struct LogConfig {
    pub level: Level,
    pub file_path: Option<String>,
    pub console_enabled: bool,
    pub structured: bool,
    pub filter: Option<String>,
}

impl Default for LogConfig {
    fn default() -> Self {
        Self {
            level: Level::INFO,
            file_path: None,
            console_enabled: true,
            structured: false,
            filter: None,
        }
    }
}

/// ロギングシステムの初期化
pub struct LoggingSystem;

impl LoggingSystem {
    /// 開発環境用ログ設定
    pub fn init_development() -> Result<(), Box<dyn std::error::Error>> {
        let config = LogConfig {
            level: Level::DEBUG,
            console_enabled: true,
            structured: false,
            filter: Some("sapphire=debug,playernote=debug".to_string()),
            ..Default::default()
        };

        Self::init_with_config(config)
    }

    /// 本番環境用ログ設定
    pub fn init_production(log_dir: &str) -> Result<(), Box<dyn std::error::Error>> {
        let log_file = format!("{}/sapphire.log", log_dir);

        // ログディレクトリが存在することを確認
        if let Some(parent) = Path::new(&log_file).parent() {
            std::fs::create_dir_all(parent)?;
        }

        let config = LogConfig {
            level: Level::INFO,
            file_path: Some(log_file),
            console_enabled: false,
            structured: true,
            filter: Some("sapphire=info,playernote=info".to_string()),
        };

        Self::init_with_config(config)
    }

    /// テスト環境用ログ設定
    pub fn init_test() -> Result<(), Box<dyn std::error::Error>> {
        let config = LogConfig {
            level: Level::WARN,
            console_enabled: true,
            structured: false,
            filter: Some("sapphire=warn,playernote=warn".to_string()),
            ..Default::default()
        };

        Self::init_with_config(config)
    }

    /// カスタム設定でログシステムを初期化
    pub fn init_with_config(config: LogConfig) -> Result<(), Box<dyn std::error::Error>> {
        // 環境フィルターの設定
        let env_filter = match config.filter {
            Some(filter) => EnvFilter::try_new(filter)?,
            None => EnvFilter::from_default_env()
                .add_directive(config.level.into()),
        };

        let registry = Registry::default().with(env_filter);

        // コンソール出力レイヤー
        let registry = if config.console_enabled {
            let console_layer = if config.structured {
                fmt::layer()
                    .with_target(true)
                    .with_thread_ids(true)
                    .with_thread_names(true)
                    .with_timer(ChronoUtc::rfc_3339())
                    .json()
                    .boxed()
            } else {
                fmt::layer()
                    .with_target(true)
                    .with_timer(ChronoUtc::rfc_3339())
                    .pretty()
                    .boxed()
            };

            registry.with(console_layer)
        } else {
            registry
        };

        // ファイル出力レイヤー
        let registry = if let Some(file_path) = config.file_path {
            let file = OpenOptions::new()
                .create(true)
                .append(true)
                .open(&file_path)?;

            let file_layer = fmt::layer()
                .with_writer(file.with_max_level(config.level))
                .with_target(true)
                .with_thread_ids(true)
                .with_thread_names(true)
                .with_timer(ChronoUtc::rfc_3339())
                .json();

            registry.with(file_layer)
        } else {
            registry
        };

        // グローバル設定
        registry.try_init()?;

        tracing::info!(
            level = ?config.level,
            console = config.console_enabled,
            structured = config.structured,
            "Logging system initialized"
        );

        Ok(())
    }

    /// 環境に応じた自動初期化
    pub fn init_auto(app_data_dir: Option<String>) -> Result<(), Box<dyn std::error::Error>> {
        // 既に初期化されている場合はスキップ（簡略化）
        // Note: 実際のアプリケーションでは適切な初期化チェックを実装

        match std::env::var("NODE_ENV").as_deref() {
            Ok("production") => {
                let log_dir = app_data_dir
                    .map(|dir| format!("{}/logs", dir))
                    .unwrap_or_else(|| "logs".to_string());
                Self::init_production(&log_dir)
            },
            Ok("test") => Self::init_test(),
            _ => Self::init_development(),
        }
    }

    /// ログレベルの動的変更
    pub fn set_max_level(level: Level) {
        tracing::subscriber::set_global_default(
            tracing_subscriber::registry()
                .with(EnvFilter::from_default_env().add_directive(level.into()))
        ).expect("Failed to set global subscriber");
    }
}

/// 構造化ログマクロ
#[macro_export]
macro_rules! log_operation {
    ($level:ident, $operation:expr, $result:expr) => {
        tracing::$level!(
            operation = $operation,
            result = ?$result,
            "Operation completed"
        );
    };
    ($level:ident, $operation:expr, $result:expr, $($field:ident = $value:expr),+ $(,)?) => {
        tracing::$level!(
            operation = $operation,
            result = ?$result,
            $($field = $value,)+
            "Operation completed"
        );
    };
}

/// パフォーマンス測定マクロ
#[macro_export]
macro_rules! log_performance {
    ($operation:expr, $block:block) => {
        {
            let start = std::time::Instant::now();
            let result = $block;
            let duration = start.elapsed();

            tracing::info!(
                operation = $operation,
                duration_ms = duration.as_millis() as u64,
                success = result.is_ok(),
                "Performance measurement"
            );

            result
        }
    };
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

/// ログコンテキスト用構造体
#[derive(Debug)]
pub struct LogContext {
    pub operation_id: String,
    pub user_context: Option<String>,
    pub session_id: Option<String>,
}

impl LogContext {
    pub fn new(operation: &str) -> Self {
        use uuid::Uuid;

        Self {
            operation_id: format!("{}_{}", operation, Uuid::new_v4()),
            user_context: None,
            session_id: None,
        }
    }

    pub fn with_user(mut self, user_id: &str) -> Self {
        self.user_context = Some(user_id.to_string());
        self
    }

    pub fn with_session(mut self, session_id: &str) -> Self {
        self.session_id = Some(session_id.to_string());
        self
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