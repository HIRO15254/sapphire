# kairo-implement GitHub連携ルール

## コマンド実行時の動作

### 1. Sub-Issue取得

引数としてSub-Issue番号を受け取ります：

```bash
/kairo-implement 125
```

```typescript
const issue = await mcp__github__get_issue({
  owner: "HIRO15254",
  repo: "sapphire",
  issue_number: 125
});
```

### 2. タスクタイプの判定

Issue Descriptionから`**タスクタイプ**`を取得してTDD/DIRECTを判定：

```typescript
const taskType = issue.labels.find(l => l.name === 'TDD' || l.name === 'DIRECT')?.name;

if (taskType === 'TDD') {
  // TDDプロセス実行
  // /tdd-requirements, /tdd-testcases, /tdd-red, /tdd-green, /tdd-refactor, /tdd-verify-complete
} else if (taskType === 'DIRECT') {
  // DIRECTプロセス実行
  // /direct-setup, /direct-verify
}
```

### 3. ステータス更新（作業開始）

```typescript
// 既存ラベル取得（status:を除く）
const currentLabels = issue.labels.map(l => l.name).filter(l => !l.startsWith('status:'));

// In Progressに更新
await mcp__github__update_issue({
  owner: "HIRO15254",
  repo: "sapphire",
  issue_number: issue.number,
  labels: [...currentLabels, "status: in-progress", "tdd-cycle"]
});
```

### 4. 実装開始コメント

```typescript
await mcp__github__add_issue_comment({
  owner: "HIRO15254",
  repo: "sapphire",
  issue_number: issue.number,
  body: `## 🚀 実装開始

${taskType === 'TDD' ? 'TDD開発サイクル' : 'DIRECT作業'}を開始します。

### 実装プロセス
${taskType === 'TDD' ? `
1. ⏳ 要件定義
2. ⏳ テストケース作成
3. ⏳ Red phase
4. ⏳ Green phase
5. ⏳ Refactor phase
6. ⏳ 品質確認
` : `
1. ⏳ セットアップ作業
2. ⏳ 動作確認
`}

---
開始時刻: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}`
});
```

### 5. TDDコマンド実行（TDDタスクの場合）

各TDDコマンドにIssue番号を渡して順次実行：

```bash
/tdd-requirements 125
/tdd-testcases 125
/tdd-red 125
/tdd-green 125
/tdd-refactor 125
/tdd-verify-complete 125
```

### 6. DIRECTコマンド実行（DIRECTタスクの場合）

```bash
/direct-setup 125
/direct-verify 125
```

### 7. PR作成（完了時）

tdd-verify-complete または direct-verify 完了時にPR作成：

```typescript
// タスクIDとMilestone名を取得
const taskId = issue.title.match(/\[(TASK-\d+)\]/)?.[1];
const milestone = issue.milestone;

const pr = await mcp__github__create_pull_request({
  owner: "HIRO15254",
  repo: "sapphire",
  title: `[#${issue.number}] ${issue.title}`,
  head: `task/${taskId}`,
  base: `milestone/${milestone.title}`,
  body: `Closes #${issue.number}

## 📝 実装内容
${implementationSummary}

## ✅ テスト結果
- テスト数: ${testCount}件
- カバレッジ: ${coverage}%
- Lint: Pass
- Type Check: Pass

## 🔍 変更ファイル
${changedFiles.map(f => \`- \${f}\`).join('\\n')}

---
🤖 Generated with [Claude Code](https://claude.com/claude-code)`,
  reviewers: ["HIRO15254"]
});
```

### 8. ステータス更新（レビュー待ち）

```typescript
const reviewLabels = currentLabels.filter(l => !l.startsWith('status:') && l !== 'tdd-cycle');
await mcp__github__update_issue({
  owner: "HIRO15254",
  repo: "sapphire",
  issue_number: issue.number,
  labels: [...reviewLabels, "status: in-review"]
});
```

### 9. PRリンクをコメント追加

```typescript
await mcp__github__add_issue_comment({
  owner: "HIRO15254",
  repo: "sapphire",
  issue_number: issue.number,
  body: `## 🔗 Pull Request作成

PR: ${pr.html_url}

レビュアー: @HIRO15254

---
PR作成時刻: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}`
});
```

## 出力情報

コマンド完了時に以下を表示：

```
✅ 実装完了しました

📋 実装情報
- Issue: #${issue.number}
- タスクID: ${taskId}
- タスクタイプ: ${taskType}
- PR: ${pr.html_url}

📊 テスト結果
- テスト数: ${testCount}件
- カバレッジ: ${coverage}%

📝 次のステップ
PRのレビュー完了後、次のタスクに進んでください。
```

## 重要な注意点

1. **Sub-Issue番号が必須**
   - kairo-tasksで作成したSub-Issue番号を引数で受け取る

2. **タスクタイプの自動判定**
   - Labelから`TDD`/`DIRECT`を判定して適切なプロセスを実行

3. **ステータスラベルの更新**
   - `status: todo` → `status: in-progress` → `status: in-review`
   - 必ず1つのみ設定（古いステータスは削除）

4. **tdd-cycleラベルの管理**
   - TDDプロセス中のみ付与
   - PR作成時に削除

5. **PR作成時の情報**
   - `Closes #${issueNumber}`でIssueを自動クローズ
   - レビュアーは必ず`HIRO15254`を指定

6. **コメントでプロセスを可視化**
   - 開始、各フェーズ完了、PR作成時にコメント追加
   - タイムスタンプを含める
