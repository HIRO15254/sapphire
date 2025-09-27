# TDD Test Cases - TASK-0511: リッチテキストメモAPI実装

## 概要

リッチテキストメモAPI (`get_player_note`, `save_player_note`) の全機能に対する包括的なテストケースを定義する。TipTap JSON/HTML処理、UPSERT操作、バリデーション、セキュリティ、パフォーマンステストを含む。

## テストカテゴリ構成

### 📊 テスト分類
- **Unit Tests (UT)**: 基本機能の単体テスト
- **Integration Tests (IT)**: データベース統合テスト
- **Performance Tests (PT)**: パフォーマンス要件テスト
- **Security Tests (ST)**: セキュリティ・XSS対策テスト
- **Error Handling Tests (EH)**: エラー処理テスト
- **Edge Case Tests (EC)**: 境界値・特殊ケーステスト

### 🎯 対象機能
1. プレイヤーメモ取得機能 (`get_player_note`)
2. プレイヤーメモ保存機能 (`save_player_note`)
3. TipTap JSON処理機能
4. HTML処理・サニタイゼーション機能
5. UPSERT操作機能
6. バリデーション機能

## 🧪 Unit Tests (UT) - 基本機能テスト

### UT-01: メモ取得機能 (get_player_note)
```typescript
describe('Note Retrieval Functionality', () => {
  test('UT-01-01: 既存メモの正常取得', async () => {
    // Given: player_id="player123" に既存メモ
    // When: get_player_note を実行
    // Then: PlayerNote オブジェクトが返される
  });

  test('UT-01-02: 存在しないメモの取得', async () => {
    // Given: player_id="nonexistent" にメモ無し
    // When: get_player_note を実行
    // Then: success=true, data=null が返される
  });

  test('UT-01-03: TipTap JSON形式メモ取得', async () => {
    // Given: JSON形式で保存されたメモ
    // When: get_player_note を実行
    // Then: content_type="json", 正常なJSONコンテンツ
  });

  test('UT-01-04: HTML形式メモ取得', async () => {
    // Given: HTML形式で保存されたメモ
    // When: get_player_note を実行
    // Then: content_type="html", 正常なHTMLコンテンツ
  });

  test('UT-01-05: タイムスタンプ情報取得', async () => {
    // Given: 作成・更新日時付きメモ
    // When: get_player_note を実行
    // Then: created_at, updated_at が ISO 8601 形式
  });
});
```

### UT-02: メモ保存機能 (save_player_note)
```typescript
describe('Note Saving Functionality', () => {
  test('UT-02-01: 新規メモ作成 (INSERT)', async () => {
    // Given: 新規プレイヤーID, TipTap JSONコンテンツ
    // When: save_player_note を実行
    // Then: 新しいPlayerNote作成, created_at設定
  });

  test('UT-02-02: 既存メモ更新 (UPDATE)', async () => {
    // Given: 既存プレイヤーID, 更新コンテンツ
    // When: save_player_note を実行
    // Then: 既存メモ更新, updated_at更新
  });

  test('UT-02-03: TipTap JSON保存', async () => {
    // Given: 有効なTipTap JSON形式コンテンツ
    // When: save_player_note を実行
    // Then: content_type="json", JSON検証成功
  });

  test('UT-02-04: HTML形式保存', async () => {
    // Given: HTML形式コンテンツ
    // When: save_player_note を実行
    // Then: content_type="html", サニタイゼーション実行
  });

  test('UT-02-05: UPSERT操作確認', async () => {
    // Given: 同一player_idで複数回保存
    // When: save_player_note を繰り返し実行
    // Then: レコード数は1のまま, updated_at更新
  });

  test('UT-02-06: コンテンツハッシュ生成', async () => {
    // Given: 同一コンテンツ
    // When: save_player_note を実行
    // Then: 同一content_hash生成
  });
});
```

### UT-03: TipTap JSON処理
```typescript
describe('TipTap JSON Processing', () => {
  test('UT-03-01: 基本TipTap構造検証', async () => {
    // Given: {type: "doc", content: [...]}
    // When: TipTap JSON検証実行
    // Then: 妥当性確認成功
  });

  test('UT-03-02: 複雑なTipTap構造', async () => {
    // Given: 入れ子構造のTipTap JSON
    // When: 検証・保存実行
    // Then: 構造維持して保存
  });

  test('UT-03-03: TipTapマーク処理', async () => {
    // Given: 太字・斜体・リンクマーク付きJSON
    // When: 保存・取得実行
    // Then: マーク情報完全保持
  });

  test('UT-03-04: TipTap属性処理', async () => {
    // Given: カスタム属性付きノード
    // When: 保存・取得実行
    // Then: 属性情報完全保持
  });

  test('UT-03-05: 空TipTap文書', async () => {
    // Given: {type: "doc", content: []}
    // When: 保存・取得実行
    // Then: 空文書として正常処理
  });
});
```

### UT-04: HTML処理・サニタイゼーション
```typescript
describe('HTML Processing & Sanitization', () => {
  test('UT-04-01: 基本HTML保存', async () => {
    // Given: <p>Hello <strong>World</strong></p>
    // When: save_player_note を実行
    // Then: HTMLタグ保持して保存
  });

  test('UT-04-02: XSS攻撃防御', async () => {
    // Given: <script>alert('xss')</script>
    // When: save_player_note を実行
    // Then: スクリプトタグ除去
  });

  test('UT-04-03: 許可タグ保持', async () => {
    // Given: <p><h1><strong><em><ul><li><a>
    // When: サニタイゼーション実行
    // Then: 許可タグのみ保持
  });

  test('UT-04-04: 危険属性除去', async () => {
    // Given: <a href="javascript:alert('xss')">
    // When: サニタイゼーション実行
    // Then: javascript: プロトコル除去
  });

  test('UT-04-05: Unicode文字処理', async () => {
    // Given: Unicode特殊文字含有HTML
    // When: 保存・取得実行
    // Then: 文字エンコーディング保持
  });
});
```

### UT-05: コンテンツ形式検出
```typescript
describe('Content Type Detection', () => {
  test('UT-05-01: JSON形式検出', async () => {
    // Given: "{\"type\":\"doc\"...}" で開始
    // When: コンテンツ形式検出
    // Then: content_type="json"
  });

  test('UT-05-02: HTML形式検出', async () => {
    // Given: "<p>..." で開始
    // When: コンテンツ形式検出
    // Then: content_type="html"
  });

  test('UT-05-03: プレーンテキスト検出', async () => {
    // Given: タグ無しテキスト
    // When: コンテンツ形式検出
    // Then: content_type="html" (デフォルト)
  });

  test('UT-05-04: 空白付きJSON検出', async () => {
    // Given: "  \n  {\"type\":..." (前置空白)
    // When: コンテンツ形式検出
    // Then: 正しくJSON認識
  });
});
```

## 🔄 Integration Tests (IT) - 統合テスト

### IT-01: データベース統合
```typescript
describe('Database Integration', () => {
  test('IT-01-01: UPSERT操作データベース動作', async () => {
    // Given: SQLiteデータベース, 同一player_id
    // When: 新規→更新→更新の順で実行
    // Then: レコード数1, 正しいupdated_at
  });

  test('IT-01-02: インデックス活用確認', async () => {
    // Given: player_id インデックス
    // When: get_player_note を実行
    // Then: EXPLAIN QUERY PLAN でインデックス使用確認
  });

  test('IT-01-03: 外部キー制約動作', async () => {
    // Given: players テーブルとの外部キー関係
    // When: 無効なplayer_id で保存
    // Then: 外部キー制約エラー
  });

  test('IT-01-04: カスケード削除確認', async () => {
    // Given: プレイヤー削除
    // When: プレイヤー削除実行
    // Then: 関連メモも自動削除
  });

  test('IT-01-05: トランザクション分離', async () => {
    // Given: 同時メモ更新
    // When: 並行save_player_note実行
    // Then: データ一貫性保持
  });

  test('IT-01-06: UNIQUE制約動作', async () => {
    // Given: 1プレイヤー1メモ制約
    // When: 複数メモ保存試行
    // Then: UPSERT動作, 複数レコード作成されない
  });
});
```

### IT-02: API統合テスト
```typescript
describe('API Integration', () => {
  test('IT-02-01: Tauriコマンド呼び出し', async () => {
    // Given: フロントエンドからのAPI呼び出し
    // When: invoke('get_player_note') 実行
    // Then: 正常なレスポンス返却
  });

  test('IT-02-02: プレイヤーAPI連携', async () => {
    // Given: TASK-0507で作成されたプレイヤー
    // When: メモ保存・取得実行
    // Then: プレイヤー情報と整合性保持
  });

  test('IT-02-03: リアルタイムデータ反映', async () => {
    // Given: メモ保存直後
    // When: 即座にget_player_note実行
    // Then: 保存データが即座に取得可能
  });

  test('IT-02-04: エラー状態の連携', async () => {
    // Given: データベース接続エラー
    // When: API呼び出し実行
    // Then: 一貫したエラーレスポンス
  });
});
```

## ⚡ Performance Tests (PT) - パフォーマンステスト

### PT-01: レスポンス時間要件
```typescript
describe('Response Time Requirements', () => {
  test('PT-01-01: NFR-103準拠（300ms以内）', async () => {
    // Given: 中程度サイズ（10KB）のリッチテキスト
    // When: save_player_note を実行
    // Then: 300ms以内でレスポンス
  });

  test('PT-01-02: メモ取得性能', async () => {
    // Given: 既存メモ
    // When: get_player_note を実行
    // Then: 100ms以内でレスポンス
  });

  test('PT-01-03: 大容量メモ処理', async () => {
    // Given: 5MBのリッチテキストコンテンツ
    // When: save_player_note を実行
    // Then: 1000ms以内でレスポンス
  });

  test('PT-01-04: TipTap JSON解析性能', async () => {
    // Given: 複雑なTipTap JSON構造
    // When: JSON検証・保存実行
    // Then: 200ms以内で処理完了
  });

  test('PT-01-05: HTMLサニタイゼーション性能', async () => {
    // Given: 大量HTMLタグ含有コンテンツ
    // When: サニタイゼーション実行
    // Then: 500ms以内で処理完了
  });
});
```

### PT-02: スループット・メモリ効率
```typescript
describe('Throughput & Memory Efficiency', () => {
  test('PT-02-01: 同時リクエスト処理', async () => {
    // Given: 5並行メモ保存リクエスト
    // When: 同時にsave_player_note実行
    // Then: 全て正常完了, レスポンス時間劣化なし
  });

  test('PT-02-02: メモリ使用量監視', async () => {
    // Given: 大容量メモ処理
    // When: save_player_note を実行
    // Then: メモリ使用量≤10MB
  });

  test('PT-02-03: ガベージコレクション効率', async () => {
    // Given: 連続メモ保存処理
    // When: 100回のsave_player_note実行
    // Then: メモリリークなし
  });

  test('PT-02-04: コンテンツハッシュ計算性能', async () => {
    // Given: 大容量コンテンツ
    // When: SHA256ハッシュ計算
    // Then: 50ms以内で計算完了
  });
});
```

## 🔒 Security Tests (ST) - セキュリティテスト

### ST-01: XSS攻撃対策
```typescript
describe('XSS Attack Protection', () => {
  test('ST-01-01: スクリプトタグ除去', async () => {
    // Given: <script>alert('xss')</script>
    // When: save_player_note を実行
    // Then: スクリプトタグ完全除去
  });

  test('ST-01-02: イベントハンドラ除去', async () => {
    // Given: <p onclick="alert('xss')">Text</p>
    // When: サニタイゼーション実行
    // Then: onclickイベント除去
  });

  test('ST-01-03: データURL攻撃防御', async () => {
    // Given: <img src="data:text/html,<script>...">
    // When: サニタイゼーション実行
    // Then: 危険なdata URLスキーム除去
  });

  test('ST-01-04: CSS式攻撃防御', async () => {
    // Given: <div style="expression(alert('xss'))">
    // When: サニタイゼーション実行
    // Then: CSSエクスプレッション除去
  });

  test('ST-01-05: エンコード攻撃対策', async () => {
    // Given: &#60;script&#62; (HTMLエンティティ)
    // When: サニタイゼーション実行
    // Then: エンコード解除後も安全性確保
  });
});
```

### ST-02: インジェクション攻撃対策
```typescript
describe('Injection Attack Protection', () => {
  test('ST-02-01: SQLインジェクション対策', async () => {
    // Given: player_id="'; DROP TABLE players; --"
    // When: get_player_note を実行
    // Then: パラメータ化クエリで安全に処理
  });

  test('ST-02-02: NoSQLインジェクション対策', async () => {
    // Given: 特殊JSON構造の攻撃
    // When: save_player_note を実行
    // Then: JSON検証で安全性確保
  });

  test('ST-02-03: ファイルパス攻撃対策', async () => {
    // Given: "../../../etc/passwd" 含有コンテンツ
    // When: 保存・取得実行
    // Then: ファイルシステムアクセス無し
  });
});
```

### ST-03: データ保護・プライバシー
```typescript
describe('Data Protection & Privacy', () => {
  test('ST-03-01: 機密情報ログ出力防止', async () => {
    // Given: メモ保存処理
    // When: エラー発生時
    // Then: ログにコンテンツ含まれない
  });

  test('ST-03-02: エラーメッセージ情報漏洩防止', async () => {
    // Given: データベースエラー
    // When: save_player_note を実行
    // Then: 内部情報漏洩しないエラーメッセージ
  });

  test('ST-03-03: 権限制御', async () => {
    // Given: 他プレイヤーのメモアクセス試行
    // When: get_player_note を実行
    // Then: 適切な権限チェック
  });
});
```

## 🚨 Error Handling Tests (EH) - エラーハンドリングテスト

### EH-01: 入力バリデーションエラー
```typescript
describe('Input Validation Errors', () => {
  test('EH-01-01: 無効プレイヤーID', async () => {
    // Given: 存在しないplayer_id
    // When: get_player_note を実行
    // Then: NOTE_PLAYER_NOT_FOUND エラー
  });

  test('EH-01-02: 空プレイヤーID', async () => {
    // Given: player_id=""
    // When: save_player_note を実行
    // Then: バリデーションエラー
  });

  test('EH-01-03: コンテンツサイズ超過', async () => {
    // Given: 10MB超過のコンテンツ
    // When: save_player_note を実行
    // Then: NOTE_CONTENT_TOO_LARGE エラー
  });

  test('EH-01-04: 無効JSON形式', async () => {
    // Given: 不正なJSON構造
    // When: save_player_note を実行
    // Then: NOTE_INVALID_JSON エラー
  });

  test('EH-01-05: 無効TipTap構造', async () => {
    // Given: type/contentフィールド欠如JSON
    // When: TipTap検証実行
    // Then: NOTE_INVALID_JSON エラー
  });

  test('EH-01-06: NULL/undefined入力', async () => {
    // Given: content=null
    // When: save_player_note を実行
    // Then: 適切なバリデーションエラー
  });
});
```

### EH-02: システムエラー
```typescript
describe('System Errors', () => {
  test('EH-02-01: データベース接続エラー', async () => {
    // Given: DB接続不可状態
    // When: get_player_note を実行
    // Then: NOTE_DATABASE_ERROR エラー
  });

  test('EH-02-02: サニタイゼーション失敗', async () => {
    // Given: サニタイゼーションライブラリエラー
    // When: save_player_note を実行
    // Then: NOTE_SANITIZATION_FAILED エラー
  });

  test('EH-02-03: ディスク容量不足', async () => {
    // Given: ストレージ満杯状態
    // When: save_player_note を実行
    // Then: 適切なディスクエラー処理
  });

  test('EH-02-04: 権限不足エラー', async () => {
    // Given: データベースファイル書き込み権限なし
    // When: save_player_note を実行
    // Then: 権限エラー適切処理
  });

  test('EH-02-05: タイムアウトエラー', async () => {
    // Given: 極端に重い処理
    // When: save_player_note を実行
    // Then: タイムアウト適切処理
  });
});
```

### EH-03: 回復・フォールバック処理
```typescript
describe('Recovery & Fallback Processing', () => {
  test('EH-03-01: 部分的HTMLサニタイゼーション', async () => {
    // Given: 一部不正HTMLタグ
    // When: サニタイゼーション実行
    // Then: 有効部分は保持、無効部分のみ除去
  });

  test('EH-03-02: JSON解析エラー時フォールバック', async () => {
    // Given: JSON解析失敗コンテンツ
    // When: save_player_note を実行
    // Then: HTML形式として保存
  });

  test('EH-03-03: データベース復旧処理', async () => {
    // Given: 一時的DB接続エラー
    // When: リトライ機構動作
    // Then: 自動復旧成功
  });
});
```

## 🎯 Edge Case Tests (EC) - 境界値・特殊ケーステスト

### EC-01: コンテンツ境界値テスト
```typescript
describe('Content Boundary Value Tests', () => {
  test('EC-01-01: 空コンテンツ保存', async () => {
    // Given: content=""
    // When: save_player_note を実行
    // Then: 空メモとして正常保存
  });

  test('EC-01-02: 1文字コンテンツ', async () => {
    // Given: content="a"
    // When: save_player_note を実行
    // Then: 正常保存
  });

  test('EC-01-03: 最大サイズ境界値', async () => {
    // Given: content=10MB-1byte
    // When: save_player_note を実行
    // Then: 正常保存
  });

  test('EC-01-04: 最大サイズ超過', async () => {
    // Given: content=10MB+1byte
    // When: save_player_note を実行
    // Then: NOTE_CONTENT_TOO_LARGE エラー
  });

  test('EC-01-05: 極長JSON構造', async () => {
    // Given: 深い入れ子のTipTap JSON
    // When: 保存・取得実行
    // Then: パフォーマンス劣化なし
  });
});
```

### EC-02: 特殊文字・エンコーディング
```typescript
describe('Special Characters & Encoding', () => {
  test('EC-02-01: Unicode絵文字処理', async () => {
    // Given: "🎯📝✨" 含有コンテンツ
    // When: 保存・取得実行
    // Then: 絵文字完全保持
  });

  test('EC-02-02: 多バイト文字処理', async () => {
    // Given: 日本語・中国語・韓国語文字
    // When: 保存・取得実行
    // Then: 文字化けなし
  });

  test('EC-02-03: 制御文字処理', async () => {
    // Given: タブ・改行・NULL文字
    // When: 保存・取得実行
    // Then: 適切なエスケープ処理
  });

  test('EC-02-04: 特殊HTML文字', async () => {
    // Given: "&lt;&gt;&amp;&quot;&#39;"
    // When: 保存・取得実行
    // Then: HTMLエンティティ適切処理
  });

  test('EC-02-05: バイナリデータ混入', async () => {
    // Given: バイナリ文字含有コンテンツ
    // When: save_player_note を実行
    // Then: 適切なエラーまたはサニタイゼーション
  });
});
```

### EC-03: TipTap特殊ケース
```typescript
describe('TipTap Special Cases', () => {
  test('EC-03-01: 空ドキュメント', async () => {
    // Given: {type: "doc", content: []}
    // When: 保存・取得実行
    // Then: 空文書として正常処理
  });

  test('EC-03-02: 単一段落', async () => {
    // Given: {type: "doc", content: [{type: "paragraph", content: [{type: "text", text: "test"}]}]}
    // When: 保存・取得実行
    // Then: 構造完全保持
  });

  test('EC-03-03: ネストした構造', async () => {
    // Given: リスト内リスト、表内要素など
    // When: 保存・取得実行
    // Then: 深い入れ子構造保持
  });

  test('EC-03-04: カスタムノード', async () => {
    // Given: 独自拡張ノードタイプ
    // When: 保存・取得実行
    // Then: 未知ノードも適切処理
  });

  test('EC-03-05: マーク組み合わせ', async () => {
    // Given: 太字+斜体+下線+リンク
    // When: 保存・取得実行
    // Then: 全マーク情報保持
  });
});
```

### EC-04: データ状態・整合性テスト
```typescript
describe('Data State & Consistency Tests', () => {
  test('EC-04-01: 同一コンテンツ重複保存', async () => {
    // Given: 同じコンテンツで複数回保存
    // When: save_player_note を繰り返し実行
    // Then: 同一content_hash、updated_at更新
  });

  test('EC-04-02: 削除されたプレイヤー参照', async () => {
    // Given: 削除済みプレイヤーID
    // When: get_player_note を実行
    // Then: NOTE_PLAYER_NOT_FOUND エラー
  });

  test('EC-04-03: データベース不整合状態', async () => {
    // Given: 手動DB操作による不整合
    // When: API実行
    // Then: 適切なエラーハンドリング
  });

  test('EC-04-04: タイムスタンプ整合性', async () => {
    // Given: 連続メモ更新
    // When: save_player_note を時間差実行
    // Then: updated_at が常に増加
  });

  test('EC-04-05: 外部キー制約違反', async () => {
    // Given: 無効なplayer_id
    // When: save_player_note を実行
    // Then: 外部キー制約エラー適切処理
  });
});
```

## 📝 テスト実装ファイル構成

### メインテストファイル
```typescript
// src/api/playerNote/playerNote.test.ts
// - 基本機能テスト (UT-01 ~ UT-05)
// - メモ取得・保存基本動作

// src/api/playerNote/richTextProcessing.test.ts
// - TipTap JSON処理テスト
// - HTML処理・サニタイゼーションテスト

// src/api/playerNote/noteIntegration.test.ts
// - データベース統合テスト (IT-01, IT-02)
// - UPSERT操作テスト

// src/api/playerNote/notePerformance.test.ts
// - パフォーマンステスト (PT-01, PT-02)
// - 大容量コンテンツ処理テスト

// src/api/playerNote/noteSecurity.test.ts
// - セキュリティテスト (ST-01 ~ ST-03)
// - XSS・インジェクション対策テスト

// src/api/playerNote/noteErrorHandling.test.ts
// - エラーハンドリングテスト (EH-01 ~ EH-03)
// - バリデーション・システムエラーテスト

// src/api/playerNote/noteEdgeCases.test.ts
// - 境界値テスト (EC-01 ~ EC-04)
// - 特殊ケーステスト
```

### 共通テストユーティリティ
```typescript
// src/api/playerNote/testUtils.ts
// - テストデータファクトリー
// - TipTap JSONジェネレータ
// - パフォーマンス測定ユーティリティ
// - モック作成ヘルパー
// - データベースセットアップ・クリーンアップ

// src/api/playerNote/mockData.ts
// - サンプルTipTap JSON構造
// - 攻撃的HTMLサンプル
// - 大容量テストデータ生成
// - エラーケース用データ
```

### セキュリティテスト用データ
```typescript
// src/api/playerNote/securityTestData.ts
// - XSS攻撃パターンセット
// - HTMLサニタイゼーションテストケース
// - インジェクション攻撃パターン
// - エンコーディングテストケース
```

## 🎯 テスト実行計画

### Phase 1: 基本機能テスト (1-2時間)
- UT-01 ~ UT-05 (メモ取得・保存・TipTap処理・HTML処理・形式検出)
- 目標: 基本動作確認・コア機能動作保証

### Phase 2: 統合・パフォーマンステスト (2-3時間)
- IT-01 ~ IT-02 (データベース・API統合)
- PT-01 ~ PT-02 (レスポンス時間・スループット)
- 目標: NFR-103達成・統合動作確認

### Phase 3: セキュリティテスト (2-3時間)
- ST-01 ~ ST-03 (XSS対策・インジェクション対策・データ保護)
- 目標: セキュリティ要件達成・脆弱性対策確認

### Phase 4: エラー・エッジケーステスト (2-3時間)
- EH-01 ~ EH-03 (バリデーション・システムエラー・回復処理)
- EC-01 ~ EC-04 (境界値・特殊文字・TipTap特殊ケース・データ整合性)
- 目標: 堅牢性確保・例外処理完璧化

## 📊 成功基準

### 量的基準
- **総テスト数**: 98個のテストケース
- **成功率**: 100% (98/98 テスト成功)
- **カバレッジ**: 90%以上
- **パフォーマンス**: NFR-103達成 (≤300ms)
- **セキュリティ**: XSS攻撃0件成功

### 質的基準
- **機能完全性**: 全要件（REQ-004, REQ-106, NFR-103）テスト済み
- **セキュリティ強化**: XSS・インジェクション攻撃完全防御
- **エラー耐性**: 全エラーケース適切処理
- **保守性**: テストコード可読性・再利用性・拡張性

### パフォーマンス基準
- **メモ取得**: ≤100ms
- **メモ保存**: ≤300ms (10KB中程度サイズ)
- **大容量処理**: ≤1000ms (5MB)
- **サニタイゼーション**: ≤500ms
- **同時処理**: 5req/sec 以上

### セキュリティ基準
- **XSS防御**: 全攻撃パターン無効化
- **インジェクション対策**: SQL/NoSQL攻撃防御
- **データ保護**: 機密情報漏洩0件
- **入力検証**: 全不正入力適切処理

## 🔍 テスト品質保証

### テストコード品質
- **可読性**: 明確なテストケース名・説明
- **保守性**: DRY原則・共通化・モジュール化
- **信頼性**: フラキーテスト0件・決定的結果
- **効率性**: 高速実行・並列化対応

### テストデータ管理
- **独立性**: テスト間データ干渉なし
- **現実性**: 実際の使用パターン反映
- **網羅性**: 正常・異常・境界値ケース完備
- **安全性**: 機密情報含まないテストデータ

---

**📝 作成者**: Claude Code
**📅 作成日時**: 2025-09-27
**🎯 テスト戦略**: 包括的品質・セキュリティ・パフォーマンス保証
**📊 テスト総数**: 98個のテストケース
**🔒 セキュリティ重点**: XSS・インジェクション攻撃対策
**⚡ パフォーマンス目標**: NFR-103準拠 (≤300ms)