use crate::database::connection::DatabaseConnection;
use crate::utils::{AppError, AppResult};
use crate::commands::memos::Memo;
use rusqlite::params;

pub struct MemoService<'a> {
    db: &'a DatabaseConnection,
}

impl<'a> MemoService<'a> {
    pub fn new(db: &'a DatabaseConnection) -> Self {
        Self { db }
    }

    pub async fn get_player_memos(&self, player_id: i64) -> AppResult<Vec<Memo>> {
        self.db.execute(|conn| {
            let mut stmt = conn.prepare(
                "SELECT id, player_id, content, is_deleted, created_at, updated_at
                 FROM memos
                 WHERE player_id = ?1 AND is_deleted = 0
                 ORDER BY created_at DESC"
            )?;

            let memos_iter = stmt.query_map(params![player_id], |row| {
                Ok(Memo {
                    id: Some(row.get(0)?),
                    player_id: row.get(1)?,
                    content: row.get(2)?,
                    is_deleted: row.get(3)?,
                    created_at: row.get(4)?,
                    updated_at: row.get(5)?,
                })
            })?;

            let mut memos = Vec::new();
            for memo in memos_iter {
                memos.push(memo?);
            }

            Ok(memos)
        })
    }

    pub async fn create_memo(&self, player_id: i64, content: String) -> AppResult<Memo> {
        if content.is_empty() {
            return Err(AppError::Validation {
                message: "Memo content cannot be empty".to_string(),
            });
        }

        self.db.execute(|conn| {
            conn.execute(
                "INSERT INTO memos (player_id, content) VALUES (?1, ?2)",
                params![player_id, content],
            )?;

            let id = conn.last_insert_rowid();

            let mut stmt = conn.prepare(
                "SELECT id, player_id, content, is_deleted, created_at, updated_at
                 FROM memos
                 WHERE id = ?1"
            )?;

            let memo = stmt.query_row(params![id], |row| {
                Ok(Memo {
                    id: Some(row.get(0)?),
                    player_id: row.get(1)?,
                    content: row.get(2)?,
                    is_deleted: row.get(3)?,
                    created_at: row.get(4)?,
                    updated_at: row.get(5)?,
                })
            })?;

            Ok(memo)
        })
    }

    pub async fn update_memo(&self, id: i64, content: String) -> AppResult<Memo> {
        if content.is_empty() {
            return Err(AppError::Validation {
                message: "Memo content cannot be empty".to_string(),
            });
        }

        self.db.execute(|conn| {
            let rows_affected = conn.execute(
                "UPDATE memos
                 SET content = ?1, updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?2 AND is_deleted = 0",
                params![content, id],
            )?;

            if rows_affected == 0 {
                return Err(rusqlite::Error::QueryReturnedNoRows.into());
            }

            let mut stmt = conn.prepare(
                "SELECT id, player_id, content, is_deleted, created_at, updated_at
                 FROM memos
                 WHERE id = ?1"
            )?;

            let memo = stmt.query_row(params![id], |row| {
                Ok(Memo {
                    id: Some(row.get(0)?),
                    player_id: row.get(1)?,
                    content: row.get(2)?,
                    is_deleted: row.get(3)?,
                    created_at: row.get(4)?,
                    updated_at: row.get(5)?,
                })
            })?;

            Ok(memo)
        })
    }

    pub async fn delete_memo(&self, id: i64) -> AppResult<()> {
        self.db.execute(|conn| {
            let rows_affected = conn.execute(
                "UPDATE memos SET is_deleted = 1 WHERE id = ?1",
                params![id],
            )?;

            if rows_affected == 0 {
                return Err(rusqlite::Error::QueryReturnedNoRows.into());
            }

            Ok(())
        })
    }
}