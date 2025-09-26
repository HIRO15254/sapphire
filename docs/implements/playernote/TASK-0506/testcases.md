# TASK-0506: プレイヤー詳細取得API - テストケース洗い出し

## 生成情報
- **生成日**: 2025-09-26
- **生成者**: TDD テスト設計担当者
- **タスクID**: TASK-0506
- **機能名**: プレイヤー詳細取得API（get_player_detail）
- **実装対象**: get_player_detail コマンド

## 開発言語・フレームワーク

🔵 **青信号**: TASK-0504/0505実装実績と技術スタック定義書に基づく確実な選択

- **プログラミング言語**: Rust
  - **言語選択の理由**: Tauri バックエンドの実装言語として既に採用済み、TASK-0504で12テスト、TASK-0505で18テスト成功実績あり
  - **テストに適した機能**: cargo test標準フレームワーク、Result型によるエラーハンドリング、型安全性、データベース接続
- **テストフレームワーク**: cargo test + tokio-test
  - **フレームワーク選択の理由**: 既存プロジェクトで30+テストが正常動作、非同期処理対応、SQLite読み取り対応
  - **テスト実行環境**: インメモリSQLite、Database::new_test()ヘルパー関数活用、v_player_detail ビュー活用

## テストケース一覧（29テストケース）

### 1. 正常系テストケース（基本的な動作）

#### Test Case 1-1: get_player_detail - 完全なプレイヤー詳細取得
🔵 **青信号**: REQ-001, REQ-003, REQ-004 完全準拠

- **テスト名**: プレイヤー詳細取得（完全データ）
  - **何をテストするか**: プレイヤー、プレイヤータイプ、タグ、メモが全て存在する場合の取得動作
  - **期待される動作**: 全ての関連データが正確に統合されて返却される
- **入力値**:
  ```rust
  GetPlayerDetailRequest {
      player_id: "complete_player_id"
  }
  ```
  - **入力データの意味**: 全種類のデータが設定済みのテスト用プレイヤー
- **期待される結果**:
  ```rust
  Ok(GetPlayerDetailResponse {
      success: true,
      data: Some(PlayerDetail {
          player: Player { /* 基本情報 */ },
          player_type: Some(PlayerType { /* タイプ情報 */ }),
          tags: vec![TagWithLevel { /* レベル付きタグ */ }],
          notes: vec![PlayerNote { /* メモ情報 */ }],
      }),
      error: None,
  })
  ```
  - **期待結果の理由**: REQ-001,003,004の全機能要件を満たす統合データ取得
- **テストの目的**: 基本機能の完全動作確認
  - **確認ポイント**: v_player_detail ビューからの正確なJOIN結果、色計算、データ統合

#### Test Case 1-2: get_player_detail - 基本データのみプレイヤー
🔵 **青信号**: EDGE-002対応（部分データ）

- **テスト名**: プレイヤー詳細取得（基本データのみ）
  - **何をテストするか**: プレイヤー情報のみ存在し、タグ・メモ・タイプが無い場合
  - **期待される動作**: 基本情報のみ返却、関連データは適切な空値
- **入力値**:
  ```rust
  GetPlayerDetailRequest {
      player_id: "basic_only_player_id"
  }
  ```
- **期待される結果**:
  ```rust
  Ok(GetPlayerDetailResponse {
      success: true,
      data: Some(PlayerDetail {
          player: Player { /* 基本情報のみ */ },
          player_type: None,
          tags: vec![],
          notes: vec![],
      }),
      error: None,
  })
  ```
- **テストの目的**: 部分データ対応の確認
  - **確認ポイント**: 空配列・None値の適切な処理

#### Test Case 1-3: get_player_detail - パフォーマンス要件確認
🔵 **青信号**: NFR-104（≤200ms）準拠

- **テスト名**: プレイヤー詳細取得パフォーマンス
  - **何をテストするか**: 大量データ存在下での応答時間
  - **期待される動作**: 200ms以内での応答完了
- **入力値**:
  ```rust
  GetPlayerDetailRequest {
      player_id: "heavy_data_player_id"
  }
  ```
  - **入力データの意味**: 20個のタグと10個のメモを持つプレイヤー
- **期待される結果**:
  - **応答時間**: ≤ 200ms
  - **データ完全性**: 全てのタグ・メモが正確に返却
- **テストの目的**: NFR-104パフォーマンス要件の確認

### 2. 異常系テストケース（エラーハンドリング）

#### Test Case 2-1: get_player_detail - 存在しないプレイヤーID
🔵 **青信号**: EDGE-001対応

- **テスト名**: 存在しないプレイヤーID指定
- **入力値**:
  ```rust
  GetPlayerDetailRequest {
      player_id: "non_existent_player_id"
  }
  ```
- **期待される結果**:
  ```rust
  Ok(GetPlayerDetailResponse {
      success: false,
      data: None,
      error: Some(ApiError {
          code: "PLAYER_NOT_FOUND",
          message: "指定されたプレイヤーが見つかりません",
          details: Some(/* player_id情報 */),
      }),
  })
  ```

#### Test Case 2-2: get_player_detail - 空文字列プレイヤーID
- **テスト名**: 不正な入力値（空文字列）
- **入力値**:
  ```rust
  GetPlayerDetailRequest {
      player_id: ""
  }
  ```
- **期待される結果**:
  ```rust
  Ok(GetPlayerDetailResponse {
      success: false,
      data: None,
      error: Some(ApiError {
          code: "INVALID_INPUT",
          message: "プレイヤーIDが指定されていません",
      }),
  })
  ```

#### Test Case 2-3: get_player_detail - データベース接続エラー
- **テスト名**: データベース接続失敗
- **テスト設定**: データベース接続を意図的に切断
- **期待される結果**:
  ```rust
  Ok(GetPlayerDetailResponse {
      success: false,
      data: None,
      error: Some(ApiError {
          code: "DB_CONNECTION_ERROR",
          message: "データベースに接続できません",
      }),
  })
  ```

### 3. 境界値テストケース

#### Test Case 3-1: get_player_detail - 最大長データ
- **テスト名**: 最大長データでの動作確認
- **入力データ**: 最大文字数のプレイヤー名、メモ
- **期待される動作**: データの切り捨て無し、完全取得

#### Test Case 3-2: get_player_detail - Unicode文字対応
- **テスト名**: 多言語文字の取得
- **入力データ**: 日本語、絵文字を含むデータ
- **期待される動作**: 文字化けなしの完全取得

### 4. 統合テストケース

#### Test Case 4-1: get_player_detail - 同時リクエスト処理
- **テスト名**: 並行アクセス対応
- **テスト内容**: 同じプレイヤーIDに対する同時リクエスト
- **期待される動作**: データ競合なし、同じ結果の返却

#### Test Case 4-2: get_player_detail - タグレベル色計算
- **テスト名**: computed_color フィールド計算
- **テスト内容**: タグレベルに基づく色の動的計算
- **期待される動作**: レベル1-5に対応する色の正確な計算

### 5. エッジケーステストケース

#### Test Case 5-1: get_player_detail - 削除済みプレイヤー参照
- **テスト名**: 削除処理と取得処理の競合状態
- **テスト設定**: プレイヤー削除後の詳細取得
- **期待される動作**: PLAYER_NOT_FOUNDエラーの適切な返却

#### Test Case 5-2: get_player_detail - 大容量メモデータ
- **テスト名**: 大容量リッチテキストメモの取得
- **入力データ**: 10MB以上のメモコンテンツ
- **期待される動作**: メモリ効率的な取得、タイムアウトなし

## テスト実行順序

### Phase 1: 基本機能確認（10テスト）
1. 正常系テストケース 1-1 ～ 1-3
2. 異常系基本テスト 2-1 ～ 2-3

### Phase 2: 境界値・エッジケース（15テスト）
3. 境界値テスト 3-1 ～ 3-2
4. エッジケース 5-1 ～ 5-2

### Phase 3: 統合・パフォーマンステスト（4テスト）
5. 統合テスト 4-1 ～ 4-2
6. パフォーマンステスト（NFR-104確認）

## パフォーマンステスト詳細

### NFR-104 準拠テスト
- **目標**: 200ms以内の応答時間
- **測定方法**: tokio::time::Instant使用
- **テストケース**: 軽量データ、標準データ、重量データの3パターン
- **合格基準**: 全パターンで200ms以内

## 成功条件

### 全テスト成功の定義
- **29テストケース全て成功**: エラー・パニック無し
- **NFR-104達成**: パフォーマンステスト200ms以内
- **型安全性確保**: コンパイルエラー無し、警告無し
- **データ整合性**: 取得データと期待値の完全一致

### 品質基準
- **カバレッジ**: 全ての関数・分岐をテスト
- **エラーハンドリング**: 全ての異常系に対応
- **パフォーマンス**: NFR-104要件完全準拠
- **保守性**: テストコードの可読性・拡張性確保

---

**次のステップ**: `/tdd-red` でfailing testの実装を開始します。
**成功確信度**: 🔵 **青信号** - 既存実装パターン活用により高確率で成功