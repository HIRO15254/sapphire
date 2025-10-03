# Kairoコマンド群 GitHub連携ルール

## 重要な変更点

### ドキュメント管理の移行

**旧**: ローカルファイルシステム（`docs/spec/`, `docs/design/`, `docs/tasks/`, `docs/implements/`）
**新**: GitHub Issues + Comments

### GitHub MCP Serverの活用

すべてのkairoコマンドでGitHub MCP Serverを使用してIssue/Milestone/Commentsを管理します。

## 共通設定

### リポジトリ情報
- Owner: `HIRO15254`
- Repo: `sapphire`
- Default Assignee: `HIRO15254`
- Reviewer: `HIRO15254`

### 必須Labels
- `kairo` - kairoワークフロー関連
- `TDD` / `DIRECT` - タスクタイプ
- `status: todo` / `status: in-progress` / `status: in-review` / `status: done` - ステータス
- `P0: critical` / `P1: high` / `P2: medium` / `P3: low` - 優先度

## コマンド引数の変更

### 旧形式（Linear）
```bash
/kairo-requirements SAP-PROJECT-1
/kairo-design SAP-123
/kairo-tasks SAP-PROJECT-1
/kairo-implement SAP-123
```

### 新形式（GitHub）
```bash
/kairo-requirements              # 新規親Issue作成
/kairo-design 123                # 親Issue番号
/kairo-tasks 123                 # 親Issue番号
/kairo-implement 125             # Sub-Issue番号
```

## ドキュメント保存先マッピング

| 旧保存先 | 新保存先 | アクセス方法 |
|---------|---------|------------|
| `docs/spec/{要件名}-requirements.md` | 親Issue Description | `mcp__github__get_issue` |
| `docs/spec/{要件名}-user-stories.md` | 親Issue Description | `mcp__github__get_issue` |
| `docs/spec/{要件名}-acceptance-criteria.md` | 親Issue Description | `mcp__github__get_issue` |
| `docs/design/{要件名}/` | 親Issue Comments | `mcp__github__add_issue_comment` |
| `docs/tasks/{要件名}-phase*.md` | Sub-Issues | `mcp__github__create_issue` |
| `docs/implements/{要件名}/` | Sub-Issue Comments | `mcp__github__add_issue_comment` |

## GitHub API呼び出しパターン

### Issue作成
```typescript
const issue = await mcp__github__create_issue({
  owner: "HIRO15254",
  repo: "sapphire",
  title: "タイトル",
  body: "本文（Markdown）",
  labels: ["kairo", "feature"],
  assignee: "HIRO15254",
  milestone: milestoneNumber // オプション
});
```

### Issue取得
```typescript
const issue = await mcp__github__get_issue({
  owner: "HIRO15254",
  repo: "sapphire",
  issue_number: 123
});
```

### コメント追加
```typescript
await mcp__github__add_issue_comment({
  owner: "HIRO15254",
  repo: "sapphire",
  issue_number: 123,
  body: "コメント内容（Markdown）"
});
```

### Sub-Issue追加
```typescript
await mcp__github__add_sub_issue({
  owner: "HIRO15254",
  repo: "sapphire",
  issue_number: parentIssueNumber,
  sub_issue_id: subIssue.id // GitHub内部ID（numberではない）
});
```

### Milestone作成
```typescript
const milestone = await mcp__github__create_milestone({
  owner: "HIRO15254",
  repo: "sapphire",
  title: "{要件名}-M1",
  description: "説明",
  due_on: "2025-11-01T00:00:00Z" // ISO 8601形式
});
```

### Labelによるステータス更新
```typescript
// 既存ラベル取得
const issue = await mcp__github__get_issue({
  owner: "HIRO15254",
  repo: "sapphire",
  issue_number: 123
});

// status:プレフィックスのラベルを除外して新しいステータスを追加
const currentLabels = issue.labels.map(l => l.name).filter(l => !l.startsWith('status:'));
await mcp__github__update_issue({
  owner: "HIRO15254",
  repo: "sapphire",
  issue_number: 123,
  labels: [...currentLabels, "status: in-progress"]
});
```

## 実装時の注意点

1. **必ずGitHub Issue番号を引数で受け取る**
   - 新規作成の場合を除き、全コマンドでIssue番号が必須

2. **Markdown形式でドキュメント作成**
   - Issue Description/Commentsは全てMarkdown
   - コードブロック、テーブル、Mermaid図も使用可能

3. **ステータスラベルは1つのみ**
   - 更新時は古い`status:`ラベルを削除してから新しいものを追加

4. **Sub-Issueは必ず親Issueに紐付け**
   - `mcp__github__add_sub_issue`を使用

5. **コメントで進捗を記録**
   - 各フェーズ完了時にコメント追加
   - タイムスタンプを含める

6. **Milestoneは実装単位で作成**
   - 1-2週間程度の期間
   - 完了条件を明確に記載
