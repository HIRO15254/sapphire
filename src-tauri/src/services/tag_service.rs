use crate::database::connection::DatabaseConnection;
use crate::utils::{AppError, AppResult};
use crate::commands::tags::Tag;
use rusqlite::params;

pub struct TagService<'a> {
    db: &'a DatabaseConnection,
}

impl<'a> TagService<'a> {
    pub fn new(db: &'a DatabaseConnection) -> Self {
        Self { db }
    }

    pub async fn get_all_tags(&self) -> AppResult<Vec<Tag>> {
        self.db.execute(|conn| {
            let mut stmt = conn.prepare(
                "SELECT id, name, color, is_deleted, created_at, updated_at
                 FROM tags
                 WHERE is_deleted = 0
                 ORDER BY name"
            )?;

            let tags_iter = stmt.query_map([], |row| {
                Ok(Tag {
                    id: Some(row.get(0)?),
                    name: row.get(1)?,
                    color: row.get(2)?,
                    is_deleted: row.get(3)?,
                    created_at: row.get(4)?,
                    updated_at: row.get(5)?,
                })
            })?;

            let mut tags = Vec::new();
            for tag in tags_iter {
                tags.push(tag?);
            }

            Ok(tags)
        })
    }

    pub async fn create_tag(&self, name: String, color: Option<String>) -> AppResult<Tag> {
        if name.is_empty() {
            return Err(AppError::Validation {
                message: "Tag name cannot be empty".to_string(),
            });
        }

        self.db.execute(|conn| {
            conn.execute(
                "INSERT INTO tags (name, color) VALUES (?1, ?2)",
                params![name, color],
            )?;

            let id = conn.last_insert_rowid();

            let mut stmt = conn.prepare(
                "SELECT id, name, color, is_deleted, created_at, updated_at
                 FROM tags
                 WHERE id = ?1"
            )?;

            let tag = stmt.query_row(params![id], |row| {
                Ok(Tag {
                    id: Some(row.get(0)?),
                    name: row.get(1)?,
                    color: row.get(2)?,
                    is_deleted: row.get(3)?,
                    created_at: row.get(4)?,
                    updated_at: row.get(5)?,
                })
            })?;

            Ok(tag)
        })
    }

    pub async fn update_tag(&self, id: i64, name: String, color: Option<String>) -> AppResult<Tag> {
        if name.is_empty() {
            return Err(AppError::Validation {
                message: "Tag name cannot be empty".to_string(),
            });
        }

        self.db.execute(|conn| {
            let rows_affected = conn.execute(
                "UPDATE tags
                 SET name = ?1, color = ?2, updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?3 AND is_deleted = 0",
                params![name, color, id],
            )?;

            if rows_affected == 0 {
                return Err(rusqlite::Error::QueryReturnedNoRows.into());
            }

            let mut stmt = conn.prepare(
                "SELECT id, name, color, is_deleted, created_at, updated_at
                 FROM tags
                 WHERE id = ?1"
            )?;

            let tag = stmt.query_row(params![id], |row| {
                Ok(Tag {
                    id: Some(row.get(0)?),
                    name: row.get(1)?,
                    color: row.get(2)?,
                    is_deleted: row.get(3)?,
                    created_at: row.get(4)?,
                    updated_at: row.get(5)?,
                })
            })?;

            Ok(tag)
        })
    }

    pub async fn delete_tag(&self, id: i64) -> AppResult<()> {
        self.db.execute(|conn| {
            let rows_affected = conn.execute(
                "UPDATE tags SET is_deleted = 1 WHERE id = ?1",
                params![id],
            )?;

            if rows_affected == 0 {
                return Err(rusqlite::Error::QueryReturnedNoRows.into());
            }

            Ok(())
        })
    }
}