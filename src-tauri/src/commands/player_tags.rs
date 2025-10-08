use crate::database::models::{validate_tag_intensity, PlayerTag, PlayerTagWithTag};
use crate::database::PlayerDatabase;
use rusqlite::{params, Connection};

// ============================================
// ヘルパー関数（DRY原則による共通化）
// ============================================

/// 【ヘルパー関数】: プレイヤー存在確認 🔵
/// 【再利用性】: assign_tag_to_player, get_player_tagsで共通利用 🔵
/// 【単一責任】: プレイヤーIDの存在チェックのみを担当 🔵
/// 【実装方針】: players.rsの check_player_exists パターンを踏襲 🔵
/// 【テスト対応】: TC-ASSIGN-ERR-001, TC-GET-ERR-001 🔵
fn check_player_exists(conn: &Connection, player_id: i64) -> Result<(), String> {
    // 【プレイヤー数カウント】: 指定IDのプレイヤーが存在するか確認 🔵
    let exists: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM players WHERE id = ?1",
            params![player_id],
            |row| row.get(0),
        )
        .map_err(|e| format!("Database error: {}", e))?;

    // 【存在チェック】: 0件ならエラー返却 🔵
    if exists == 0 {
        return Err("Player not found".to_string());
    }
    Ok(())
}

/// 【ヘルパー関数】: タグ存在確認と情報取得 🔵
/// 【再利用性】: assign_tag_to_playerで使用 🔵
/// 【単一責任】: タグIDの存在チェックとhas_intensity取得 🔵
/// 【実装方針】: タグ存在確認とhas_intensityの取得を同時に行う 🔵
/// 【テスト対応】: TC-ASSIGN-ERR-002, TC-ASSIGN-ERR-003, TC-ASSIGN-ERR-004 🔵
fn get_tag_info(conn: &Connection, tag_id: i64) -> Result<(bool,), String> {
    // 【タグ情報取得】: has_intensityを取得（存在しない場合はエラー） 🔵
    let has_intensity: bool = conn
        .query_row(
            "SELECT has_intensity FROM tags WHERE id = ?1",
            params![tag_id],
            |row| row.get(0),
        )
        .map_err(|_| "Tag not found".to_string())?;

    // 【戻り値構築】: タプルで has_intensity を返す 🔵
    Ok((has_intensity,))
}

/// 【ヘルパー関数】: player_tag存在確認 🔵
/// 【再利用性】: remove_tag_from_playerで使用 🔵
/// 【単一責任】: player_tag_idの存在チェックのみを担当 🔵
/// 【実装方針】: players.rsの check_player_exists パターンを踏襲 🔵
/// 【テスト対応】: TC-REMOVE-ERR-001 🔵
fn check_player_tag_exists(conn: &Connection, player_tag_id: i64) -> Result<(), String> {
    // 【player_tag数カウント】: 指定IDのplayer_tagが存在するか確認 🔵
    let exists: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM player_tags WHERE id = ?1",
            params![player_tag_id],
            |row| row.get(0),
        )
        .map_err(|e| format!("Database error: {}", e))?;

    // 【存在チェック】: 0件ならエラー返却 🔵
    if exists == 0 {
        return Err("Player tag not found".to_string());
    }
    Ok(())
}

// ============================================
// 内部関数（テスト用）
// ============================================

/// プレイヤーにタグを割り当てる（内部関数）
///
/// 【機能概要】: プレイヤーにタグを割り当て、player_tagsテーブルに登録 🔵
/// 【実装方針】: バリデーション → display_order計算 → INSERT → 結果返却 🔵
/// 【テスト対応】: TC-ASSIGN-001～004, TC-ASSIGN-ERR-001～007, TC-BOUND-001～003 🔵
#[allow(dead_code)]
pub(crate) fn assign_tag_to_player_internal(
    player_id: i64,
    tag_id: i64,
    intensity: Option<i32>,
    db: &PlayerDatabase,
) -> Result<PlayerTag, String> {
    let conn = db.0.lock().unwrap();

    // 【プレイヤー存在確認】: ヘルパー関数を使用 🔵
    check_player_exists(&conn, player_id)?;

    // 【タグ情報取得】: タグの存在確認とhas_intensity取得 🔵
    let (has_intensity,) = get_tag_info(&conn, tag_id)?;

    // 【強度バリデーション】: has_intensityとintensityの整合性チェック 🔵
    if has_intensity && intensity.is_none() {
        return Err("Tag requires intensity value (1-5)".to_string());
    }
    if !has_intensity && intensity.is_some() {
        return Err("Tag does not support intensity".to_string());
    }

    // 【強度範囲バリデーション】: intensityが1-5の範囲内かチェック 🔵
    if let Some(val) = intensity {
        validate_tag_intensity(val)?;
    }

    // 【display_order計算】: このプレイヤーの最大display_order + 1 🔵
    let display_order: i32 = conn
        .query_row(
            "SELECT COALESCE(MAX(display_order), -1) + 1 FROM player_tags WHERE player_id = ?1",
            params![player_id],
            |row| row.get(0),
        )
        .map_err(|e| format!("Failed to calculate display_order: {}", e))?;

    // 【player_tag作成】: player_tagsテーブルにINSERT 🔵
    // UNIQUE制約(player_id, tag_id, intensity)により重複エラーが自動検出される 🔵
    conn.execute(
        "INSERT INTO player_tags (player_id, tag_id, intensity, display_order) VALUES (?1, ?2, ?3, ?4)",
        params![player_id, tag_id, intensity, display_order],
    )
    .map_err(|e| {
        // 【UNIQUE制約エラー検出】: SQLiteのUNIQUE制約エラーを判定 🔵
        if e.to_string().contains("UNIQUE constraint failed") {
            return "This tag with the same intensity is already assigned to this player".to_string();
        }
        format!("Failed to insert player_tag: {}", e)
    })?;

    let player_tag_id = conn.last_insert_rowid();

    // 【作成されたplayer_tag取得】: IDから PlayerTag エンティティを取得 🔵
    let player_tag = conn
        .query_row(
            "SELECT id, player_id, tag_id, intensity, display_order, created_at FROM player_tags WHERE id = ?1",
            params![player_tag_id],
            |row| {
                Ok(PlayerTag {
                    id: row.get(0)?,
                    player_id: row.get(1)?,
                    tag_id: row.get(2)?,
                    intensity: row.get(3)?,
                    display_order: row.get(4)?,
                    created_at: row.get(5)?,
                })
            },
        )
        .map_err(|e| format!("Failed to retrieve created player_tag: {}", e))?;

    Ok(player_tag)
}

/// プレイヤーからタグ割り当てを解除する（内部関数）
///
/// 【機能概要】: プレイヤーからタグ割り当てを解除（player_tagsレコード削除） 🔵
/// 【実装方針】: 存在確認 → DELETE実行 🔵
/// 【テスト対応】: TC-REMOVE-001, TC-REMOVE-ERR-001 🔵
#[allow(dead_code)]
pub(crate) fn remove_tag_from_player_internal(
    player_tag_id: i64,
    db: &PlayerDatabase,
) -> Result<(), String> {
    let conn = db.0.lock().unwrap();

    // 【player_tag存在確認】: ヘルパー関数を使用 🔵
    check_player_tag_exists(&conn, player_tag_id)?;

    // 【player_tag削除】: DELETE実行 🔵
    conn.execute(
        "DELETE FROM player_tags WHERE id = ?1",
        params![player_tag_id],
    )
    .map_err(|e| format!("Failed to delete player_tag: {}", e))?;

    Ok(())
}

/// プレイヤーのタグ一覧を取得する（内部関数）
///
/// 【機能概要】: プレイヤーに割り当てられたタグ一覧を取得（タグ情報含む） 🔵
/// 【実装方針】: プレイヤー存在確認 → JOIN クエリ → display_order順でソート 🔵
/// 【テスト対応】: TC-GET-001, TC-GET-002, TC-GET-ERR-001 🔵
#[allow(dead_code)]
pub(crate) fn get_player_tags_internal(
    player_id: i64,
    db: &PlayerDatabase,
) -> Result<Vec<PlayerTagWithTag>, String> {
    let conn = db.0.lock().unwrap();

    // 【プレイヤー存在確認】: ヘルパー関数を使用 🔵
    check_player_exists(&conn, player_id)?;

    // 【タグ一覧取得】: player_tags と tags を JOIN して取得 🔵
    // 【ソート】: display_order 昇順でソート 🔵
    let mut stmt = conn
        .prepare(
            "SELECT
                pt.id, pt.player_id, pt.tag_id, pt.intensity, pt.display_order, pt.created_at,
                t.name, t.color, t.has_intensity
             FROM player_tags pt
             INNER JOIN tags t ON pt.tag_id = t.id
             WHERE pt.player_id = ?1
             ORDER BY pt.display_order ASC",
        )
        .map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let player_tags = stmt
        .query_map(params![player_id], |row| {
            Ok(PlayerTagWithTag {
                id: row.get(0)?,
                player_id: row.get(1)?,
                tag_id: row.get(2)?,
                intensity: row.get(3)?,
                display_order: row.get(4)?,
                created_at: row.get(5)?,
                tag_name: row.get(6)?,
                tag_color: row.get(7)?,
                tag_has_intensity: row.get(8)?,
            })
        })
        .map_err(|e| format!("Failed to query player_tags: {}", e))?
        .collect::<Result<Vec<PlayerTagWithTag>, _>>()
        .map_err(|e| format!("Failed to collect player_tags: {}", e))?;

    // 【結果返却】: Vec<PlayerTagWithTag> を返す（空の場合もある） 🔵
    Ok(player_tags)
}

// ============================================
// タグ影響カウント機能
// ============================================

/// タグに紐づくプレイヤー数をカウントする（内部関数）
///
/// 【機能概要】: 指定タグが割り当てられているプレイヤー数をカウント 🔵
/// 【実装方針】: タグ存在確認 → DISTINCT player_idでカウント 🔵
/// 【テスト対応】: TC-COUNT-001～008 🔵
#[allow(dead_code)]
pub(crate) fn get_affected_players_count_by_tag_internal(
    tag_id: i64,
    db: &PlayerDatabase,
) -> Result<usize, String> {
    let conn = db.0.lock().unwrap();

    // 【タグ存在確認】: tags.rsのcheck_tag_existsヘルパー関数を再利用 🔵
    // 【テスト対応】: TC-COUNT-ERR-001, TC-COUNT-EDGE-001 🔵
    use crate::commands::tags::check_tag_exists;
    check_tag_exists(&conn, tag_id)?;

    // 【カウント取得】: DISTINCT player_idで重複を除外してカウント 🔵
    // 【SQL仕様】: REQ-507により同一プレイヤー・異なる強度は1人としてカウント 🔵
    // 【インデックス活用】: idx_player_tags_tag_idにより高速化 🔵
    // 【テスト対応】: TC-COUNT-001～004, TC-COUNT-EDGE-002, TC-COUNT-INT-001 🔵
    let count: i64 = conn
        .query_row(
            "SELECT COUNT(DISTINCT player_id) FROM player_tags WHERE tag_id = ?1",
            params![tag_id],
            |row| row.get(0),
        )
        .map_err(|e| format!("Failed to count affected players: {}", e))?;

    // 【型変換】: i64 → usize 🔵
    Ok(count as usize)
}

// ============================================
// タグ並び替え機能
// ============================================

/// 【内部関数】: プレイヤーのタグ表示順序を一括更新 ♻️
///
/// 【機能概要】: ドラッグ&ドロップによるタグ並び替えの実装 🟢
///
/// 【引数】: player_id, tag_orders (Vec<(player_tag_id, display_order)>)
///
/// 【戻り値】: Result<(), String> - 成功時は空、失敗時はエラーメッセージ
///
/// 【実装方針】: トランザクション内で全バリデーション→全UPDATE実行 🔵
///
/// 【改善内容】: 所有権確認をループ内個別SELECTから一括SELECTに最適化 🟢
///
/// 【パフォーマンス】: DB往復回数 N回→1回に削減（O(n)からO(1)のDB通信） 🟢
///
/// 【セキュリティ】: SQLインジェクション対策、入力値検証、トランザクション管理 🔵
///
/// 【バリデーション】:
///   - player_id存在確認 🔵
///   - tag_ordersが空でないこと 🔵
///   - display_orderが非負整数であること 🔵
///   - display_orderに重複がないこと 🔵
///   - 全player_tag_idが同一player_idに属すること 🔵
///
/// 【トランザクション】: ACID保証（全UPDATE成功または全失敗） 🔵
///
/// 【テスト対応】: TC-REORDER-001～012 🟢
///
/// ♻️ Refactor Phase: パフォーマンス最適化・コメント品質向上
#[allow(dead_code)]
pub(crate) fn reorder_player_tags_internal(
    player_id: i64,
    tag_orders: Vec<(i64, i32)>,
    db: &PlayerDatabase,
) -> Result<(), String> {
    let mut conn = db.0.lock().unwrap();

    // 【プレイヤー存在確認】: トランザクション前に早期チェック 🔵
    // 【実装方針】: 既存のcheck_player_existsヘルパー関数を再利用 🔵
    check_player_exists(&conn, player_id)?;

    // 【空配列チェック】: tag_ordersが空の場合はエラー 🔵
    // 【テスト対応】: TC-REORDER-ERR-005 🔵
    if tag_orders.is_empty() {
        return Err("Tag orders cannot be empty".to_string());
    }

    // 【非負整数チェック】: display_orderが0以上であることを確認 🔵
    // 【テスト対応】: TC-REORDER-ERR-006, TC-REORDER-EDGE-001 🔵
    for (_, display_order) in &tag_orders {
        if *display_order < 0 {
            return Err("Display order must be non-negative".to_string());
        }
    }

    // 【重複チェック】: display_orderに重複がないことを確認 🔵
    // 【実装方針】: HashSetで重複検出（O(n)の効率） 🔵
    // 【テスト対応】: TC-REORDER-ERR-004 🔵
    let mut seen_orders = std::collections::HashSet::new();
    for (_, display_order) in &tag_orders {
        if !seen_orders.insert(display_order) {
            return Err("Duplicate display_order values".to_string());
        }
    }

    // 【トランザクション開始】: ACID保証のため明示的トランザクション使用 🔵
    // 【実装方針】: rusqliteのtransaction()メソッドでロールバック可能にする 🔵
    // 【テスト対応】: TC-REORDER-TXN-001（トランザクションロールバック）🔵
    let tx = conn
        .transaction()
        .map_err(|e| format!("Failed to start transaction: {}", e))?;

    // 【所有権確認（改善版）】: 全player_tag_idが同一player_idに属することを一括検証 🔵
    // 【パフォーマンス改善】: ループ内個別SELECTからWHERE IN句による一括SELECTに変更 🟢
    // 【DB往復回数削減】: N回 → 1回に削減（タグ数が多い場合に効果大） 🟢
    // 【セキュリティ】: SQLインジェクション対策としてプレースホルダーを使用 🔵
    // 【テスト対応】: TC-REORDER-ERR-002, TC-REORDER-ERR-003 🔵

    // 【プレースホルダー生成】: WHERE IN句用の動的プレースホルダー作成 🔵
    // 【実装方針】: player_tag_id数に応じた可変長プレースホルダー（?1, ?2, ...） 🔵
    let placeholders = (1..=tag_orders.len())
        .map(|i| format!("?{}", i))
        .collect::<Vec<_>>()
        .join(", ");

    // 【動的クエリ構築】: WHERE IN句を含むSELECTクエリを生成 🔵
    // 【可読性】: フォーマット文字列で構造を明確化 🔵
    let query = format!(
        "SELECT id, player_id FROM player_tags WHERE id IN ({})",
        placeholders
    );

    // 【パラメータ準備】: player_tag_idリストをVecに変換してクエリに渡す 🔵
    let player_tag_ids: Vec<i64> = tag_orders.iter().map(|(id, _)| *id).collect();

    // 【一括存在確認】: 全player_tag_idを一度のクエリで取得 🔵
    // 【効率化】: トランザクション内での複数SELECT回避 🟢
    let mut stmt = tx
        .prepare(&query)
        .map_err(|e| format!("Failed to prepare ownership check query: {}", e))?;

    // 【動的パラメータバインド】: player_tag_id配列を展開してバインド 🔵
    let mut rows = stmt
        .query(rusqlite::params_from_iter(player_tag_ids.iter()))
        .map_err(|e| format!("Failed to execute ownership check: {}", e))?;

    // 【検証用HashSet構築】: 取得したplayer_tag_idとplayer_idをマッピング 🔵
    // 【目的】: 存在確認と所有者確認を効率的に実施 🔵
    let mut found_tags = std::collections::HashMap::new();
    while let Some(row) = rows
        .next()
        .map_err(|e| format!("Failed to read row: {}", e))?
    {
        let id: i64 = row.get(0).map_err(|e| format!("Failed to get id: {}", e))?;
        let owner: i64 = row
            .get(1)
            .map_err(|e| format!("Failed to get player_id: {}", e))?;
        found_tags.insert(id, owner);
    }
    drop(rows);
    drop(stmt);

    // 【存在確認・所有者確認】: 全player_tag_idが存在し、正しいplayer_idに属するか検証 🔵
    // 【早期エラー検出】: 最初の不正データで即座にエラー返却 🔵
    for (player_tag_id, _) in &tag_orders {
        match found_tags.get(player_tag_id) {
            // 【player_tag不存在】: player_tag_idがDB上に存在しない 🔵
            None => return Err("Player tag not found".to_string()),
            // 【所有者不一致】: 異なるplayer_idに属するplayer_tag_idが含まれている 🔵
            Some(&owner_player_id) if owner_player_id != player_id => {
                return Err("All player tags must belong to the same player".to_string());
            }
            // 【検証成功】: player_tag_idが存在し、正しいplayer_idに属している 🔵
            Some(_) => {}
        }
    }

    // 【一括UPDATE実行】: 各player_tagのdisplay_orderを更新 🔵
    // 【実装方針】: トランザクション内で全UPDATE実行（エラー時は自動ロールバック） 🔵
    // 【テスト対応】: TC-REORDER-001, TC-REORDER-002, TC-REORDER-003 🔵
    for (player_tag_id, display_order) in &tag_orders {
        tx.execute(
            "UPDATE player_tags SET display_order = ?1 WHERE id = ?2",
            params![display_order, player_tag_id],
        )
        .map_err(|e| format!("Failed to update display_order: {}", e))?;
    }

    // 【トランザクションコミット】: 全UPDATE成功時のみコミット 🔵
    // 【ACID保証】: コミット失敗時はロールバック、エラー時は自動ロールバック 🔵
    tx.commit()
        .map_err(|e| format!("Failed to commit transaction: {}", e))?;

    Ok(())
}
