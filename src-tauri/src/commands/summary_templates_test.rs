// ============================================
// 総合メモテンプレート管理テスト
// ============================================
// 【テストファイル概要】:
// プロジェクト共通の総合メモテンプレートの取得・更新機能をテスト
// シングルトンパターン（id=1固定）のテンプレート管理を検証
//
// 【テスト対象】:
// - get_summary_template_internal() - テンプレート取得
// - update_summary_template_internal() - テンプレート更新
//
// 【参照要件】:
// - REQ-311: プロジェクト共通テンプレート設定
// - REQ-303: サイズ制限（1MB）
//
// 🔵 信頼性レベル: GitHub Issue #18のテストケース定義に基づく

#[cfg(test)]
mod tests {
    use crate::commands::summary_templates::{
        get_summary_template_internal, update_summary_template_internal,
    };
    use crate::database::PlayerDatabase;
    use rusqlite::Connection;
    use std::sync::Mutex;

    // ============================================
    // テストヘルパー関数
    // ============================================

    /// 【テスト用DB初期化】: インメモリDBでテスト環境をセットアップ
    /// 【初期化内容】: スキーマ作成 + 初期データ投入（id=1のテンプレート）
    /// 🔵 信頼性レベル: player_summaries_test.rsパターンに基づく
    fn setup_test_db() -> PlayerDatabase {
        let conn = Connection::open_in_memory().expect("Failed to create in-memory database");

        // 【スキーマ作成】: summary_templatesテーブル作成
        conn.execute(
            "CREATE TABLE IF NOT EXISTS summary_templates (
                id INTEGER PRIMARY KEY CHECK(id = 1),
                content TEXT NOT NULL DEFAULT '',
                updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )
        .expect("Failed to create summary_templates table");

        // 【初期データ投入】: id=1の空テンプレートを作成
        // 【シングルトン保証】: INSERT OR IGNOREで重複防止
        conn.execute(
            "INSERT OR IGNORE INTO summary_templates (id, content) VALUES (1, '')",
            [],
        )
        .expect("Failed to insert initial template");

        PlayerDatabase(Mutex::new(conn))
    }

    // ============================================
    // 正常系テストケース
    // ============================================

    #[test]
    fn tc_get_template_001_default_template() {
        // 【テスト目的】: シングルトンパターンのテンプレート（id=1固定）が正常に取得できることを確認
        // 【テスト内容】: 初期状態で空文字列のテンプレートを取得
        // 【期待される動作】: エラーなく取得成功、id=1、content=""、updated_atがISO 8601形式
        // 🔵 信頼性レベル: GitHub Issue #18 TC-GET-TEMPLATE-001に基づく

        // 【Given: 初期状態のDB】
        // 【テストデータ準備】: id=1の空テンプレートが存在する状態
        let db = setup_test_db();

        // 【When: テンプレート取得を実行】
        // 【処理内容】: get_summary_template_internal()を呼び出し
        let result = get_summary_template_internal(&db);

        // 【Then: 取得成功を確認】
        // 【結果検証】: Ok(SummaryTemplate)が返されることを確認
        assert!(result.is_ok(), "テンプレート取得が失敗しました"); // 【確認内容】: エラーなく取得できる 🔵

        let template = result.unwrap();

        // 【期待値確認1】: id=1（シングルトンパターン）
        assert_eq!(template.id, 1, "テンプレートIDが1ではありません"); // 【確認内容】: シングルトンとしてid=1固定 🔵

        // 【期待値確認2】: 初期状態で空文字列
        assert_eq!(
            template.content, "",
            "初期テンプレートが空文字列ではありません"
        ); // 【確認内容】: デフォルト値が空文字列 🔵

        // 【期待値確認3】: updated_atが存在（ISO 8601形式の検証は省略）
        assert!(!template.updated_at.is_empty(), "updated_atが空です"); // 【確認内容】: タイムスタンプが設定されている 🔵
    }

    #[test]
    fn tc_update_template_001_first_update() {
        // 【テスト目的】: 空文字列から実際のHTMLコンテンツへの更新が正常に動作することを確認
        // 【テスト内容】: テンプレート初回更新とupdated_at自動更新の検証
        // 【期待される動作】: contentが更新され、updated_atが自動更新される
        // 🔵 信頼性レベル: GitHub Issue #18 TC-UPDATE-TEMPLATE-001に基づく

        // 【Given: 初期状態のテンプレート】
        // 【テストデータ準備】: 空のテンプレートが存在
        let db = setup_test_db();
        let new_content = "## プレイスタイル\n\n## 特徴";

        // 【When: テンプレート更新を実行】
        // 【処理内容】: update_summary_template_internal()でcontentを更新
        let result = update_summary_template_internal(new_content, &db);

        // 【Then: 更新成功を確認】
        // 【結果検証】: Ok(SummaryTemplate)が返されることを確認
        assert!(result.is_ok(), "テンプレート更新が失敗しました"); // 【確認内容】: エラーなく更新できる 🔵

        let updated_template = result.unwrap();

        // 【期待値確認1】: contentが新しい値に更新されている
        assert_eq!(
            updated_template.content, new_content,
            "テンプレートコンテンツが更新されていません"
        ); // 【確認内容】: 指定したHTMLコンテンツに更新される 🔵

        // 【期待値確認2】: id=1のまま変わらない
        assert_eq!(updated_template.id, 1, "テンプレートIDが変更されています"); // 【確認内容】: シングルトンとしてid=1固定 🔵

        // 【期待値確認3】: updated_atが更新されている（空でないことを確認）
        assert!(
            !updated_template.updated_at.is_empty(),
            "updated_atが更新されていません"
        ); // 【確認内容】: CURRENT_TIMESTAMPで自動更新される 🔵
    }

    #[test]
    fn tc_update_template_002_multiple_updates() {
        // 【テスト目的】: テンプレートが何度でも上書き更新できることを確認
        // 【テスト内容】: 複数回の更新でcontent・updated_atが正しく変わることを検証
        // 【期待される動作】: 常に最新のcontentが取得でき、updated_atが更新される
        // 🔵 信頼性レベル: GitHub Issue #18 TC-UPDATE-TEMPLATE-002に基づく

        // 【Given: 1回目の更新済みテンプレート】
        // 【テストデータ準備】: 既に1回更新されたテンプレート
        let db = setup_test_db();
        let first_content = "旧テンプレート";
        update_summary_template_internal(first_content, &db).expect("1回目の更新が失敗しました");

        // 【When: 2回目の更新を実行】
        // 【処理内容】: 異なるcontentで再度更新
        let second_content = "新テンプレート";
        let result = update_summary_template_internal(second_content, &db);

        // 【Then: 2回目の更新成功を確認】
        // 【結果検証】: Ok(SummaryTemplate)が返され、contentが上書きされる
        assert!(result.is_ok(), "2回目の更新が失敗しました"); // 【確認内容】: 複数回更新可能 🔵

        let updated_template = result.unwrap();

        // 【期待値確認1】: 最新のcontent（2回目）が反映されている
        assert_eq!(
            updated_template.content, second_content,
            "2回目のコンテンツが反映されていません"
        ); // 【確認内容】: 上書き更新が成功している 🔵

        // 【期待値確認2】: updated_atが2回目の更新時刻に変わっている
        // （タイムスタンプの比較は省略し、存在確認のみ）
        assert!(
            !updated_template.updated_at.is_empty(),
            "updated_atが更新されていません"
        ); // 【確認内容】: 更新毎にタイムスタンプが変わる 🔵
    }

    // ============================================
    // 異常系テストケース
    // ============================================

    #[test]
    fn tc_update_template_err_001_size_exceeded() {
        // 【テスト目的】: 1MB超過のcontentがバリデーションで拒否されることを確認
        // 【テスト内容】: 1MB + 1バイト（1048577バイト）のデータでエラーが返されることを検証
        // 【期待される動作】: Err("Summary content exceeds 1MB limit")が返される
        // 🔵 信頼性レベル: GitHub Issue #18 TC-UPDATE-TEMPLATE-ERR-001に基づく

        // 【Given: 1MB + 1バイトのコンテンツ】
        // 【テストデータ準備】: サイズ制限を1バイト超過するデータを作成
        let db = setup_test_db();
        let oversized_content = "x".repeat(1048577); // 1048577バイト（1MB + 1）

        // 【When: サイズ超過データで更新を試行】
        // 【処理内容】: update_summary_template_internal()を呼び出し
        let result = update_summary_template_internal(&oversized_content, &db);

        // 【Then: エラーが返されることを確認】
        // 【結果検証】: Err(String)が返されることを確認
        assert!(result.is_err(), "サイズ超過がエラーになりませんでした"); // 【確認内容】: バリデーションエラーが発生する 🔵

        // 【期待値確認】: エラーメッセージが正しい
        let error_message = result.unwrap_err();
        assert_eq!(
            error_message, "Summary content exceeds 1MB limit",
            "エラーメッセージが期待と異なります"
        ); // 【確認内容】: 明確なエラーメッセージが返される 🔵
    }

    // ============================================
    // 境界値テストケース
    // ============================================

    #[test]
    fn tc_update_template_bound_001_exactly_1mb() {
        // 【テスト目的】: ちょうど1MB（1048576バイト）のcontentが許可されることを確認
        // 【テスト内容】: 境界値での正常動作を検証
        // 【期待される動作】: エラーなく更新成功する
        // 🔵 信頼性レベル: GitHub Issue #18 TC-UPDATE-TEMPLATE-BOUND-001に基づく

        // 【Given: ちょうど1MBのコンテンツ】
        // 【テストデータ準備】: 1048576バイトのデータを作成
        let db = setup_test_db();
        let content_1mb = "x".repeat(1048576); // ちょうど1MB

        // 【When: 1MBちょうどのデータで更新】
        // 【処理内容】: update_summary_template_internal()を呼び出し
        let result = update_summary_template_internal(&content_1mb, &db);

        // 【Then: 更新成功を確認】
        // 【結果検証】: Ok(SummaryTemplate)が返されることを確認
        assert!(result.is_ok(), "1MBちょうどの更新が失敗しました"); // 【確認内容】: 境界値で許可される 🔵

        let updated_template = result.unwrap();

        // 【期待値確認】: contentが1MBちょうどで保存されている
        assert_eq!(
            updated_template.content.len(),
            1048576,
            "保存されたコンテンツサイズが1MBではありません"
        ); // 【確認内容】: サイズ制限ギリギリまで保存可能 🔵
    }

    #[test]
    fn tc_update_template_bound_002_1mb_minus_1() {
        // 【テスト目的】: 1MB - 1バイト（1048575バイト）のcontentが正常に保存されることを確認
        // 【テスト内容】: 制限内ギリギリでの動作検証
        // 【期待される動作】: エラーなく更新成功する
        // 🔵 信頼性レベル: GitHub Issue #18 TC-UPDATE-TEMPLATE-BOUND-002に基づく

        // 【Given: 1MB - 1バイトのコンテンツ】
        // 【テストデータ準備】: 1048575バイトのデータを作成
        let db = setup_test_db();
        let content = "x".repeat(1048575); // 1MB - 1バイト

        // 【When: 制限内ギリギリのデータで更新】
        // 【処理内容】: update_summary_template_internal()を呼び出し
        let result = update_summary_template_internal(&content, &db);

        // 【Then: 更新成功を確認】
        // 【結果検証】: Ok(SummaryTemplate)が返されることを確認
        assert!(result.is_ok(), "1MB-1バイトの更新が失敗しました"); // 【確認内容】: 制限内なら確実に保存される 🔵

        let updated_template = result.unwrap();

        // 【期待値確認】: contentサイズが1048575バイト
        assert_eq!(
            updated_template.content.len(),
            1048575,
            "保存されたコンテンツサイズが期待と異なります"
        ); // 【確認内容】: 正確なサイズで保存される 🔵
    }

    #[test]
    fn tc_update_template_bound_003_1mb_plus_1_error() {
        // 【テスト目的】: 1MB + 1バイトでエラーになることを確認（境界値の厳格な判定）
        // 【テスト内容】: 制限を1バイトでも超えるとエラーになることを検証
        // 【期待される動作】: Err("Summary content exceeds 1MB limit")が返される
        // 🔵 信頼性レベル: GitHub Issue #18 TC-UPDATE-TEMPLATE-BOUND-003に基づく

        // 【Given: 1MB + 1バイトのコンテンツ】
        // 【テストデータ準備】: 1048577バイトのデータを作成
        let db = setup_test_db();
        let content = "x".repeat(1048577); // 1MB + 1バイト

        // 【When: 制限超過データで更新を試行】
        // 【処理内容】: update_summary_template_internal()を呼び出し
        let result = update_summary_template_internal(&content, &db);

        // 【Then: エラーが返されることを確認】
        // 【結果検証】: Err(String)が返されることを確認
        assert!(result.is_err(), "1MB+1バイトがエラーになりませんでした"); // 【確認内容】: 1バイト超過でもエラー 🔵

        // 【期待値確認】: エラーメッセージが正しい
        assert_eq!(
            result.unwrap_err(),
            "Summary content exceeds 1MB limit",
            "エラーメッセージが期待と異なります"
        ); // 【確認内容】: 厳格なサイズチェックが動作している 🔵
    }

    #[test]
    fn tc_update_template_bound_004_empty_string() {
        // 【テスト目的】: 空文字列（0バイト）のcontentが許可されることを確認
        // 【テスト内容】: テンプレートを空にできることを検証（初期状態への戻し）
        // 【期待される動作】: エラーなく更新成功し、content=""になる
        // 🔵 信頼性レベル: GitHub Issue #18 TC-UPDATE-TEMPLATE-BOUND-004に基づく

        // 【Given: 既存のテンプレート内容】
        // 【テストデータ準備】: まず非空のテンプレートに更新
        let db = setup_test_db();
        update_summary_template_internal("既存コンテンツ", &db).expect("初回更新が失敗しました");

        // 【When: 空文字列で更新】
        // 【処理内容】: 空文字列を渡してテンプレートをリセット
        let result = update_summary_template_internal("", &db);

        // 【Then: 更新成功を確認】
        // 【結果検証】: Ok(SummaryTemplate)が返されることを確認
        assert!(result.is_ok(), "空文字列での更新が失敗しました"); // 【確認内容】: 空文字列でもエラーにならない 🔵

        let updated_template = result.unwrap();

        // 【期待値確認1】: contentが空文字列
        assert_eq!(updated_template.content, "", "空文字列に更新されていません"); // 【確認内容】: テンプレートを空にできる 🔵

        // 【期待値確認2】: updated_atは更新されている
        assert!(
            !updated_template.updated_at.is_empty(),
            "updated_atが更新されていません"
        ); // 【確認内容】: 空文字列更新でもタイムスタンプ更新される 🔵
    }
}
