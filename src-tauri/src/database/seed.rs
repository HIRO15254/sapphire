use rusqlite::{Connection, Result as SqliteResult};

/// Player name templates for random generation
const FIRST_NAMES: &[&str] = &[
    "Player",
    "Ace",
    "King",
    "Queen",
    "Jack",
    "Dealer",
    "Shark",
    "Fish",
    "Pro",
    "Rookie",
    "Veteran",
    "Novice",
    "Expert",
    "Master",
    "Champion",
    "Contender",
    "Challenger",
    "Warrior",
    "Hero",
    "Legend",
];

const LAST_NAMES: &[&str] = &[
    "Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta", "Eta", "Theta", "Iota", "Kappa",
    "Lambda", "Mu", "Nu", "Xi", "Omicron", "Pi", "Rho", "Sigma", "Tau", "Upsilon",
];

/// Seed the database with test data
/// This function is intended for development and testing purposes only
pub fn seed_database(conn: &Connection, player_count: usize) -> SqliteResult<()> {
    // Only allow in test mode or development
    #[cfg(not(debug_assertions))]
    {
        return Err(rusqlite::Error::InvalidParameterName(
            "Seeding is only allowed in debug builds".to_string(),
        ));
    }

    // Start transaction
    let tx = conn.unchecked_transaction()?;

    // 1. Create player categories (10 types)
    let categories = vec![
        ("Tight-Aggressive", "#FF6B6B"),
        ("Tight-Passive", "#4ECDC4"),
        ("Loose-Aggressive", "#45B7D1"),
        ("Loose-Passive", "#FFA07A"),
        ("Rock", "#98D8C8"),
        ("Calling Station", "#F7DC6F"),
        ("Maniac", "#BB8FCE"),
        ("Nit", "#85C1E2"),
        ("TAG Regular", "#F8B4D9"),
        ("LAG Professional", "#A5D6A7"),
    ];

    let mut category_ids = Vec::new();
    for (name, color) in categories {
        conn.execute(
            "INSERT INTO player_categories (name, color) VALUES (?1, ?2)",
            [name, color],
        )?;
        category_ids.push(conn.last_insert_rowid());
    }

    // 2. Create tags (20 types: 10 with intensity, 10 without)
    let tags_with_intensity = vec![
        ("Bluff Frequency", "#FFD93D"),
        ("3-Bet Range", "#95E1D3"),
        ("Post-Flop Aggression", "#F38181"),
        ("Tilt Tendency", "#AA96DA"),
        ("Hand Reading Skill", "#FCBAD3"),
        ("C-Bet Frequency", "#6C5CE7"),
        ("Value Betting", "#00B894"),
        ("Fold to 3-Bet", "#FDCB6E"),
        ("Continuation", "#E17055"),
        ("Check-Raise", "#74B9FF"),
    ];

    let tags_without_intensity = vec![
        ("Recreational", "#FF6B6B"),
        ("Professional", "#4ECDC4"),
        ("Regular", "#45B7D1"),
        ("Weekend Player", "#FFA07A"),
        ("High Stakes", "#98D8C8"),
        ("Low Stakes", "#F7DC6F"),
        ("Tournament Player", "#BB8FCE"),
        ("Cash Game Specialist", "#85C1E2"),
        ("Online Player", "#F8B4D9"),
        ("Live Player", "#A5D6A7"),
    ];

    let mut tag_ids_with_intensity = Vec::new();
    for (name, color) in tags_with_intensity {
        conn.execute(
            "INSERT INTO tags (name, color, has_intensity) VALUES (?1, ?2, 1)",
            [name, color],
        )?;
        tag_ids_with_intensity.push(conn.last_insert_rowid());
    }

    let mut tag_ids_without_intensity = Vec::new();
    for (name, color) in tags_without_intensity {
        conn.execute(
            "INSERT INTO tags (name, color, has_intensity) VALUES (?1, ?2, 0)",
            [name, color],
        )?;
        tag_ids_without_intensity.push(conn.last_insert_rowid());
    }

    // 3. Create players with random data
    use std::collections::HashSet;
    let mut used_names = HashSet::new();

    for i in 0..player_count {
        // Generate unique name
        let name = loop {
            let first = FIRST_NAMES[i % FIRST_NAMES.len()];
            let last = LAST_NAMES[(i / FIRST_NAMES.len()) % LAST_NAMES.len()];
            let suffix = if i >= FIRST_NAMES.len() * LAST_NAMES.len() {
                format!(" #{}", i / (FIRST_NAMES.len() * LAST_NAMES.len()) + 1)
            } else {
                String::new()
            };
            let candidate = format!("{} {}{}", first, last, suffix);
            if !used_names.contains(&candidate) {
                used_names.insert(candidate.clone());
                break candidate;
            }
        };

        // Randomly assign category (70% have category, 30% null)
        let category_id = if (i * 7) % 10 < 7 {
            Some(category_ids[i % category_ids.len()])
        } else {
            None
        };

        // Insert player
        match category_id {
            Some(cat_id) => {
                conn.execute(
                    "INSERT INTO players (name, category_id) VALUES (?1, ?2)",
                    [&name as &dyn rusqlite::ToSql, &cat_id],
                )?;
            }
            None => {
                conn.execute(
                    "INSERT INTO players (name, category_id) VALUES (?1, NULL)",
                    [&name],
                )?;
            }
        }
        let player_id = conn.last_insert_rowid();

        // Assign 1-5 random tags
        let tag_count = (i % 5) + 1;
        let mut assigned_tags = HashSet::new();

        for j in 0..tag_count {
            // Mix tags with and without intensity
            let (tag_id, has_intensity) = if j % 2 == 0 && !tag_ids_with_intensity.is_empty() {
                (
                    tag_ids_with_intensity[(i + j) % tag_ids_with_intensity.len()],
                    true,
                )
            } else if !tag_ids_without_intensity.is_empty() {
                (
                    tag_ids_without_intensity[(i + j) % tag_ids_without_intensity.len()],
                    false,
                )
            } else {
                continue;
            };

            // Skip if already assigned
            if assigned_tags.contains(&tag_id) {
                continue;
            }
            assigned_tags.insert(tag_id);

            let intensity = if has_intensity {
                Some(((i + j) % 5) + 1)
            } else {
                None
            };

            match intensity {
                Some(int) => {
                    conn.execute(
                        "INSERT INTO player_tags (player_id, tag_id, intensity, display_order) VALUES (?1, ?2, ?3, ?4)",
                        [&player_id as &dyn rusqlite::ToSql, &tag_id, &(int as i64), &(j as i64)],
                    )?;
                }
                None => {
                    conn.execute(
                        "INSERT INTO player_tags (player_id, tag_id, intensity, display_order) VALUES (?1, ?2, NULL, ?3)",
                        [&player_id, &tag_id, &(j as i64)],
                    )?;
                }
            }
        }

        // Create 0-10 simple notes
        let note_count = i % 11;
        for j in 0..note_count {
            let content = format!(
                "<p>Note #{} for {}: Observed behavior in game session.</p>",
                j + 1,
                name
            );
            conn.execute(
                "INSERT INTO player_notes (player_id, content) VALUES (?1, ?2)",
                [
                    &player_id as &dyn rusqlite::ToSql,
                    &content as &dyn rusqlite::ToSql,
                ],
            )?;
        }

        // Create summary with template
        let summary_content = format!(
            "<h2>Summary for {}</h2><p>Overall impression and playing style analysis.</p>",
            name
        );
        conn.execute(
            "INSERT INTO player_summaries (player_id, content) VALUES (?1, ?2)",
            [&player_id, &summary_content as &dyn rusqlite::ToSql],
        )?;
    }

    // 4. Create default template
    let template_content = r#"<h1>Player Summary Template</h1>
<h2>Playing Style</h2>
<p>Describe the player's overall style...</p>
<h2>Key Observations</h2>
<ul>
<li>Observation 1</li>
<li>Observation 2</li>
</ul>
<h2>Strategy Notes</h2>
<p>How to play against this player...</p>"#;

    conn.execute(
        "UPDATE summary_templates SET content = ?1 WHERE id = 1",
        [template_content],
    )?;

    // Commit transaction
    tx.commit()?;

    Ok(())
}

/// Quick seed with 50 players (small scale)
pub fn seed_small(conn: &Connection) -> SqliteResult<()> {
    seed_database(conn, 50)
}

/// Standard seed with 200 players (medium scale)
pub fn seed_medium(conn: &Connection) -> SqliteResult<()> {
    seed_database(conn, 200)
}

/// Full seed with 500 players (large scale)
pub fn seed_large(conn: &Connection) -> SqliteResult<()> {
    seed_database(conn, 500)
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;

    #[test]
    fn test_seed_small() {
        let conn = Connection::open_in_memory().unwrap();
        crate::database::schema::initialize_schema(&conn).unwrap();

        let result = seed_small(&conn);
        assert!(result.is_ok());

        // Verify player count
        let count: i64 = conn
            .query_row("SELECT COUNT(*) FROM players", [], |row| row.get(0))
            .unwrap();
        assert_eq!(count, 50);

        // Verify categories exist
        let category_count: i64 = conn
            .query_row("SELECT COUNT(*) FROM player_categories", [], |row| {
                row.get(0)
            })
            .unwrap();
        assert_eq!(category_count, 10);

        // Verify tags exist
        let tag_count: i64 = conn
            .query_row("SELECT COUNT(*) FROM tags", [], |row| row.get(0))
            .unwrap();
        assert_eq!(tag_count, 20);
    }

    #[test]
    fn test_seed_medium() {
        let conn = Connection::open_in_memory().unwrap();
        crate::database::schema::initialize_schema(&conn).unwrap();

        let result = seed_medium(&conn);
        assert!(result.is_ok());

        let count: i64 = conn
            .query_row("SELECT COUNT(*) FROM players", [], |row| row.get(0))
            .unwrap();
        assert_eq!(count, 200);
    }

    #[test]
    fn test_seed_large() {
        let conn = Connection::open_in_memory().unwrap();
        crate::database::schema::initialize_schema(&conn).unwrap();

        let result = seed_large(&conn);
        assert!(result.is_ok());

        let count: i64 = conn
            .query_row("SELECT COUNT(*) FROM players", [], |row| row.get(0))
            .unwrap();
        assert_eq!(count, 500);
    }

    #[test]
    fn test_seed_data_integrity() {
        let conn = Connection::open_in_memory().unwrap();
        crate::database::schema::initialize_schema(&conn).unwrap();
        seed_small(&conn).unwrap();

        // Check foreign key violations
        let fk_violations: i64 = conn
            .query_row("PRAGMA foreign_key_check", [], |row| row.get(0))
            .unwrap_or(0);
        assert_eq!(fk_violations, 0);

        // Verify all players have summaries
        let summary_count: i64 = conn
            .query_row("SELECT COUNT(*) FROM player_summaries", [], |row| {
                row.get(0)
            })
            .unwrap();
        assert_eq!(summary_count, 50);

        // Verify FTS is populated
        let fts_summary_count: i64 = conn
            .query_row("SELECT COUNT(*) FROM player_summaries_fts", [], |row| {
                row.get(0)
            })
            .unwrap();
        assert_eq!(fts_summary_count, 50);
    }

    #[test]
    fn test_unique_player_names() {
        let conn = Connection::open_in_memory().unwrap();
        crate::database::schema::initialize_schema(&conn).unwrap();
        seed_medium(&conn).unwrap();

        // Check for duplicate names
        let duplicate_count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM (SELECT name FROM players GROUP BY name HAVING COUNT(*) > 1)",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(duplicate_count, 0);
    }

    #[test]
    fn test_seed_performance() {
        use std::time::Instant;

        let conn = Connection::open_in_memory().unwrap();
        crate::database::schema::initialize_schema(&conn).unwrap();

        let start = Instant::now();
        seed_large(&conn).unwrap();
        let duration = start.elapsed();

        // Should complete within 30 seconds
        assert!(
            duration.as_secs() < 30,
            "Seed took too long: {:?}",
            duration
        );
    }
}
