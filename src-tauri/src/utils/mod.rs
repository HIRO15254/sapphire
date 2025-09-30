pub mod error;
pub mod logger;

pub use error::{AppError, AppResult};
pub use logger::init_logger;