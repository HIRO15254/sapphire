# TDDコマンド群 GitHub連携ルール

## 重要な変更点

### ドキュメント管理の移行

**旧**: ローカルファイルシステム（`docs/implements/{要件名}/{{task_id}}/`）
**新**: GitHub Sub-Issue Comments

## コマンド引数

すべてのTDDコマンドはSub-Issue番号を引数として受け取ります：

```bash
/tdd-requirements 125
/tdd-testcases 125
/tdd-red 125
/tdd-green 125
/tdd-refactor 125
/tdd-verify-complete 125
```

## 各コマンドでのGitHub連携

### 1. tdd-requirements（要件定義）

#### コメント追加

```typescript
await mcp__github__add_issue_comment({
  owner: "HIRO15254",
  repo: "sapphire",
  issue_number: issueNumber,
  body: `## ✅ 要件定義完了

### 機能概要
${機能概要}

### 入力・出力仕様
${入出力仕様}

### 制約条件
${制約条件}

### 使用例
${使用例}

---
完了時刻: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}`
});
```

#### 自動コミット

```bash
git commit -m "feat(#${issueNumber}): 要件定義を完了

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### 2. tdd-testcases（テストケース作成）

#### コメント追加

```typescript
await mcp__github__add_issue_comment({
  owner: "HIRO15254",
  repo: "sapphire",
  issue_number: issueNumber,
  body: `## ✅ テストケース作成完了

### テスト分類
- 正常系: ${normalCount}件
- 異常系: ${errorCount}件
- エッジケース: ${edgeCount}件

### テストケース一覧
${testCases.map((tc, i) => \`\${i + 1}. \${tc.name}\`).join('\\n')}

---
完了時刻: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}`
});
```

#### 自動コミット

```bash
git commit -m "test(#${issueNumber}): テストケースを作成

- 正常系: ${normalCount}件
- 異常系: ${errorCount}件
- エッジケース: ${edgeCount}件

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### 3. tdd-red（Red Phase）

#### コメント追加

```typescript
await mcp__github__add_issue_comment({
  owner: "HIRO15254",
  repo: "sapphire",
  issue_number: issueNumber,
  body: `## 🔴 Red Phase完了

失敗するテストを実装しました。

### テスト状態
- 全テストが期待通り失敗することを確認
- テストケース数: ${testCount}件

---
完了時刻: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}`
});
```

#### 自動コミット

```bash
git commit -m "test(#${issueNumber}): 失敗するテストを実装

- テストケース数: ${testCount}件
- 全テストが期待通り失敗

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### 4. tdd-green（Green Phase）

#### コメント追加

```typescript
await mcp__github__add_issue_comment({
  owner: "HIRO15254",
  repo: "sapphire",
  issue_number: issueNumber,
  body: `## 🟢 Green Phase完了

テストが通る最小実装を完了しました。

### 実装内容
${implementationSummary}

### テスト結果
- テスト数: ${testStats.total}件
- 成功: ${testStats.passed}件
- 失敗: ${testStats.failed}件
- カバレッジ: ${testStats.coverage}%

---
完了時刻: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}`
});
```

#### 自動コミット

```bash
git commit -m "feat(#${issueNumber}): テストを通る最小実装

${implementationSummary}

- テスト: ${testStats.passed}/${testStats.total}件通過
- カバレッジ: ${testStats.coverage}%

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### 5. tdd-refactor（Refactor Phase）

#### コメント追加

```typescript
await mcp__github__add_issue_comment({
  owner: "HIRO15254",
  repo: "sapphire",
  issue_number: issueNumber,
  body: `## ♻️ Refactor Phase完了

リファクタリングを完了しました。

### 改善内容
${refactoringDetails}

### テスト状態
- 全テスト通過を維持
- コード品質向上を確認

---
完了時刻: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}`
});
```

#### 自動コミット

```bash
git commit -m "refactor(#${issueNumber}): コード品質改善

${refactoringDetails}

- 全テスト通過を維持

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### 6. tdd-verify-complete（品質確認）

#### コメント追加

```typescript
await mcp__github__add_issue_comment({
  owner: "HIRO15254",
  repo: "sapphire",
  issue_number: issueNumber,
  body: `## ✅ 品質確認完了

品質確認を完了しました。

### 品質メトリクス
- テストカバレッジ: ${quality.coverage}%
- Lint: ${quality.lint}
- Type Check: ${quality.typeCheck}
- テスト成功率: ${quality.testSuccessRate}%

### 次のステップ
PR作成の準備が整いました。

---
完了時刻: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}`
});
```

#### 自動コミット

```bash
git commit -m "chore(#${issueNumber}): 品質確認完了

- カバレッジ: ${quality.coverage}%
- Lint: ${quality.lint}
- Type Check: ${quality.typeCheck}

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

## PR作成前の必須チェック

**重要**: tdd-verify-complete完了後、PR作成前に必ず以下のコマンドを実行すること：

```bash
# Lint修正とフォーマット
bun run lint:fix
bun run format

# Lint/formatチェック（警告・エラーが0であることを確認）
bun run lint
bun run format:check
```

これらのチェックが通らない場合、PRはマージできません。

### 実行タイミング
1. tdd-verify-complete完了後
2. PR作成前（git push前）
3. すべてのlint/formatエラーを修正
4. 修正内容をコミット（`chore(#issue): lint/format修正`）

## ドキュメント保存先マッピング

| 旧保存先 | 新保存先 | アクセス方法 |
|---------|---------|------------|
| `docs/implements/{要件名}/{{task_id}}/{feature_name}-requirements.md` | Sub-Issue Comments | `mcp__github__add_issue_comment` |
| `docs/implements/{要件名}/{{task_id}}/{feature_name}-testcases.md` | Sub-Issue Comments | `mcp__github__add_issue_comment` |
| `docs/implements/{要件名}/{{task_id}}/{feature_name}-memo.md` | Sub-Issue Comments | `mcp__github__add_issue_comment` |
| `docs/implements/{要件名}/{{task_id}}/{feature_name}-refactor-phase.md` | Sub-Issue Comments | `mcp__github__add_issue_comment` |

## 重要な注意点

1. **Sub-Issue番号が必須**
   - すべてのTDDコマンドで引数として受け取る

2. **各フェーズでコメント追加**
   - プロセスの透明性確保
   - タイムスタンプを含める

3. **自動コミットメッセージ規約**
   - `feat(#issue)`: 機能実装
   - `test(#issue)`: テスト追加
   - `refactor(#issue)`: リファクタリング
   - `chore(#issue)`: その他作業

4. **コメントにテスト結果を含める**
   - テスト数、成功率、カバレッジ
   - 実装内容のサマリー

5. **Markdown形式で記載**
   - 見出し、リスト、コードブロックを活用
   - 視認性を重視

6. **tdd-verify-complete完了時**
   - PR作成の準備完了をコメントに明記
   - kairo-implementがPR作成を担当

7. **lint/format必須実行**
   - PR作成前に必ず `lint:fix` と `format` を実行
   - CIでlint/formatチェックが失敗するとマージ不可
