use rusqlite::{Connection, Result};
use std::sync::{Arc, Mutex};
use std::path::Path;
use crate::utils::AppResult;

pub struct DatabaseConnection {
    conn: Arc<Mutex<Connection>>,
}

impl DatabaseConnection {
    pub fn new(db_path: &str) -> AppResult<Self> {
        let path = Path::new(db_path);

        // Create parent directories if they don't exist
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)?;
        }

        let conn = Connection::open(db_path)?;

        // Enable foreign keys
        conn.execute("PRAGMA foreign_keys = ON", [])?;

        tracing::info!("Database connection established at: {}", db_path);

        Ok(Self {
            conn: Arc::new(Mutex::new(conn)),
        })
    }

    pub fn execute<F, R>(&self, f: F) -> AppResult<R>
    where
        F: FnOnce(&Connection) -> Result<R>,
    {
        let conn = self.conn.lock().unwrap();
        f(&*conn).map_err(|e| e.into())
    }

    pub fn get_connection(&self) -> Arc<Mutex<Connection>> {
        self.conn.clone()
    }
}

unsafe impl Send for DatabaseConnection {}
unsafe impl Sync for DatabaseConnection {}