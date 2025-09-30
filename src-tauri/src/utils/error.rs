use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] rusqlite::Error),

    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Player not found: {id}")]
    PlayerNotFound { id: i64 },

    #[error("Tag not found: {id}")]
    TagNotFound { id: i64 },

    #[error("Memo not found: {id}")]
    MemoNotFound { id: i64 },

    #[error("Validation error: {message}")]
    Validation { message: String },

    #[error("Migration error: {message}")]
    Migration { message: String },
}

pub type AppResult<T> = Result<T, AppError>;

impl From<AppError> for String {
    fn from(err: AppError) -> Self {
        err.to_string()
    }
}