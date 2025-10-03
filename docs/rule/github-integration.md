# GitHub統合ルール

## 概要

このドキュメントは、Tsumikiワークフロー（kairo/TDDコマンド）とGitHubの統合ルールを定義します。
Issue + Labels + Milestonesを中心に、実装タスクの管理、進捗追跡、コードレビューのプロセスを統一し、効率的な開発フローを実現します。

## GitHub階層構造

### Issues（大機能）+ Sub-Issues（タスク）
- **作成タイミング**: `kairo-requirements`実行時に親Issue作成
- **単位**: 大きな機能単位（例：認証システム、決済機能、管理画面）
- **命名規則**: `[Feature] {要件名}-{機能概要}`
- **Sub-Issues**: `kairo-tasks`で子タスクとして作成
- **ステータス管理**: Labels（`status: todo`、`status: in-progress`、`status: in-review`、`status: done`）

### Milestones（実装単位）
- **作成タイミング**: `kairo-requirements`実行時
- **単位**: 1ブランチで完結する実装単位
- **完了条件**:
  - バックエンドAPIの実装が完了
  - フロントエンドUIの実装が完了
  - アプリケーション上で変更が観測可能
  - E2Eテストが通過
- **命名規則**: `{要件名}-M{番号}`
- **期間**: 1〜2週間程度

### Labels（タスク分類・ステータス管理）

#### タスクタイプ
- `TDD` - コード実装タスク
- `DIRECT` - 設定・環境構築タスク

#### ステータス（必ず1つのみ設定）
- `status: todo` - 未着手
- `status: in-progress` - 作業中
- `status: in-review` - レビュー待ち
- `status: done` - 完了（Issueはクローズ）

#### 優先度
- `P0: critical` - 緊急
- `P1: high` - 高
- `P2: medium` - 中
- `P3: low` - 低

#### カテゴリ
- `kairo` - kairoワークフロー関連
- `tdd-cycle` - TDDサイクル実行中
- `feature` - 新機能
- `bug` - バグ修正
- `refactor` - リファクタリング

## Git運用フロー

### ブランチ戦略

```
dev（メインブランチ）
├── milestone/{milestone-name}
│   ├── task/TASK-0001
│   ├── task/TASK-0002
│   └── ...
└── ...
```

### ブランチ作成ルール

1. **Milestoneブランチ**
   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b milestone/{milestone-name}
   ```

2. **タスクブランチ**
   ```bash
   git checkout milestone/{milestone-name}
   git pull origin milestone/{milestone-name}
   git checkout -b task/TASK-{id}
   ```

### PR作成とレビューフロー

1. **タスク完了時**
   - タスクブランチからMilestoneブランチへPR作成
   - タイトル: `[#{issue-number}] {タスク名}`
   - レビュアー: `@HIRO15254`を自動指定
   - GitHub IssueにPRリンクを自動追加（`Closes #123`）

2. **依存関係の確認**
   - タスク開始前に依存タスク（Sub-Issues）がクローズ済みであることを確認
   - GitHub APIで依存関係を自動チェック
   - 未クローズの場合は警告を表示

3. **Milestone完了時**
   - MilestoneブランチからdevブランチへPR作成
   - 全関連IssueがClosedであることを確認
   - マージ後、MilestoneをClosedに更新

## TDDコマンドの自動コミット

各TDDコマンド終了時に以下の規約で自動コミットを作成：

### コミットメッセージ規約

| コマンド                  | コミットメッセージ                       | 説明             |
|-----------------------|---------------------------------|----------------|
| `tdd-requirements`    | `feat(#{issue-number}): 要件定義を完了`     | 機能要件の定義        |
| `tdd-testcases`       | `test(#{issue-number}): テストケースを作成`   | テストケースの設計      |
| `tdd-red`             | `test(#{issue-number}): 失敗するテストを実装`  | Red phase      |
| `tdd-green`           | `feat(#{issue-number}): テストを通る最小実装`  | Green phase    |
| `tdd-refactor`        | `refactor(#{issue-number}): コード品質改善` | Refactor phase |
| `tdd-verify-complete` | `chore(#{issue-number}): 品質確認完了`     | 完了確認           |

### コミット作成例

```bash
# tdd-green終了時の自動コミット
git add .
git commit -m "feat(#123): テストを通る最小実装

- UserServiceのcreateUser機能を実装
- 入力検証とエラーハンドリングを追加
- 単体テスト5件が全て通過

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

## GitHub API連携

### 各コマンドでのGitHub更新

#### kairo-requirements（要件定義）
```typescript
// 親Issue作成（大機能）
const parentIssue = await mcp__github__create_issue({
  owner: "HIRO15254",
  repo: "sapphire",
  title: `[Feature] ${要件名}`,
  body: `# ${要件名} 要件定義書

## 概要
${要件概要}

## 機能要件（EARS記法）

### 通常要件
${通常要件リスト}

### 条件付き要件
${条件付き要件リスト}

### 非機能要件
${非機能要件リスト}

## ユーザーストーリー
${userStoriesContent}

## 受け入れ基準
${acceptanceCriteriaContent}`,
  labels: ["kairo", "feature"],
  assignee: "HIRO15254"
});

// Milestone作成（実装単位）
const milestone = await mcp__github__create_milestone({
  owner: "HIRO15254",
  repo: "sapphire",
  title: `${要件名}-M1`,
  description: `Phase 1実装範囲

## 成果物
${成果物リスト}

## 期間
${開始日} 〜 ${終了日}`,
  due_on: "2025-11-01T00:00:00Z"
});
```

#### kairo-design（設計）
```typescript
// 親Issue取得
const parentIssue = await mcp__github__get_issue({
  owner: "HIRO15254",
  repo: "sapphire",
  issue_number: parentIssueNumber
});

// 設計書をコメント追加
await mcp__github__add_issue_comment({
  owner: "HIRO15254",
  repo: "sapphire",
  issue_number: parentIssueNumber,
  body: `## 📐 設計書

### アーキテクチャ
${architectureContent}

### データフロー
\`\`\`mermaid
${dataflowDiagram}
\`\`\`

### 型定義
\`\`\`typescript
${interfacesContent}
\`\`\`

### データベーススキーマ
\`\`\`sql
${databaseSchema}
\`\`\`

### APIエンドポイント
${apiEndpoints}`
});
```

#### kairo-tasks（タスク分割）
```typescript
// 親Issue取得
const parentIssue = await mcp__github__get_issue({
  owner: "HIRO15254",
  repo: "sapphire",
  issue_number: parentIssueNumber
});

// Milestone取得
const milestones = await mcp__github__list_milestones({
  owner: "HIRO15254",
  repo: "sapphire"
});

const targetMilestone = milestones.find(m => m.title.includes(要件名));

const createdIssues = [];

for (const task of tasks) {
  // Sub-Issue作成
  const subIssue = await mcp__github__create_issue({
    owner: "HIRO15254",
    repo: "sapphire",
    title: `[${task.id}] ${task.name}`,
    body: `## タスク詳細

### 📋 要件
${task.requirements}

### 🔧 実装詳細
${task.implementation}

### ✅ 完了条件
${task.acceptance}

### 📊 推定工数
${task.hours}時間

### 🔗 依存タスク
${task.dependencies.map(d => `- #${d}`).join('\n') || 'なし'}

### 📎 関連要件
${task.relatedRequirements.map(r => `- ${r}`).join('\n')}

---
**親Issue**: #${parentIssue.number}
**タスクID**: ${task.id}`,
    labels: [task.type, task.priority, "kairo", "status: todo"],
    milestone: targetMilestone?.number,
    assignee: "HIRO15254"
  });

  // 親Issueに紐付け
  await mcp__github__add_sub_issue({
    owner: "HIRO15254",
    repo: "sapphire",
    issue_number: parentIssue.number,
    sub_issue_id: subIssue.id
  });

  createdIssues.push({
    taskId: task.id,
    taskName: task.name,
    issueNumber: subIssue.number
  });
}

// 親Issueに進捗トラッカー追加
await mcp__github__add_issue_comment({
  owner: "HIRO15254",
  repo: "sapphire",
  issue_number: parentIssue.number,
  body: `## 📋 タスク進捗

${createdIssues.map(t => `- [ ] #${t.issueNumber} - ${t.taskId}: ${t.taskName}`).join('\n')}

---
総タスク数: ${createdIssues.length}件`
});
```

#### kairo-implement + TDDコマンド（実装）
```typescript
// コマンド実行時にIssue番号を受け取る
const issueNumber = process.argv[2]; // e.g., "123"

// Issue取得
const issue = await mcp__github__get_issue({
  owner: "HIRO15254",
  repo: "sapphire",
  issue_number: issueNumber
});

// ステータスラベル更新（古いstatusラベル削除 + 新しいstatusラベル追加）
const currentLabels = issue.labels.map(l => l.name).filter(l => !l.startsWith('status:'));
await mcp__github__update_issue({
  owner: "HIRO15254",
  repo: "sapphire",
  issue_number: issueNumber,
  labels: [...currentLabels, "status: in-progress", "tdd-cycle"]
});

// 実装開始コメント
await mcp__github__add_issue_comment({
  owner: "HIRO15254",
  repo: "sapphire",
  issue_number: issueNumber,
  body: `## 🚀 実装開始

TDD開発サイクルを開始します。

### 実装プロセス
1. ⏳ 要件定義
2. ⏳ テストケース作成
3. ⏳ Red phase
4. ⏳ Green phase
5. ⏳ Refactor phase
6. ⏳ 品質確認

---
開始時刻: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}`
});

// 各TDDフェーズでのコメント追加例
const phaseComments = {
  "tdd-requirements": "✅ 要件定義完了",
  "tdd-testcases": "✅ テストケース作成完了（{count}件）",
  "tdd-red": "🔴 Red Phase完了 - テストが期待通り失敗",
  "tdd-green": "🟢 Green Phase完了 - 全テスト通過",
  "tdd-refactor": "♻️ Refactor Phase完了",
  "tdd-verify-complete": "✅ 品質確認完了 - カバレッジ: {coverage}%"
};

// PR作成（tdd-verify-complete時）
if (command === "tdd-verify-complete") {
  const pr = await mcp__github__create_pull_request({
    owner: "HIRO15254",
    repo: "sapphire",
    title: `[#${issueNumber}] ${issue.title}`,
    head: `task/${taskId}`,
    base: `milestone/${milestoneName}`,
    body: `Closes #${issueNumber}

## 📝 実装内容
${implementationSummary}

## ✅ テスト結果
- テスト数: ${testCount}件
- カバレッジ: ${coverage}%
- Lint: Pass
- Type Check: Pass

---
🤖 Generated with [Claude Code](https://claude.com/claude-code)`,
    reviewers: ["HIRO15254"]
  });

  // ステータスをIn Reviewに更新
  const reviewLabels = currentLabels.filter(l => !l.startsWith('status:'));
  await mcp__github__update_issue({
    owner: "HIRO15254",
    repo: "sapphire",
    issue_number: issueNumber,
    labels: [...reviewLabels, "status: in-review"]
  });
}
```

## コマンド実行インターフェース

### Issue番号ベースの実行

```bash
# 要件定義（新規作成）
$ /kairo-requirements

# 設計（親Issue番号）
$ /kairo-design 123

# タスク分割（親Issue番号）
$ /kairo-tasks 123

# 実装（Sub-Issue番号）
$ /kairo-implement 125

# TDDコマンド群（Sub-Issue番号）
$ /tdd-requirements 125
$ /tdd-testcases 125
$ /tdd-red 125
$ /tdd-green 125
$ /tdd-refactor 125
$ /tdd-verify-complete 125
```

## ドキュメント管理

### GitHub Issues/Commentsでの完全管理

| ドキュメント種別 | GitHub上の保存場所 | アクセス方法 |
|------------|---------------|----------|
| 要件定義書 | 親Issue Description | `mcp__github__get_issue` |
| ユーザーストーリー | 親Issue Description | `mcp__github__get_issue` |
| 受け入れ基準 | 親Issue Description | `mcp__github__get_issue` |
| 設計書 | 親Issue Comments | `mcp__github__get_issue_comments` |
| タスク詳細 | Sub-Issue Description | `mcp__github__get_issue` |
| 実装メモ | Sub-Issue Comments | `mcp__github__get_issue_comments` |
| テスト結果 | Sub-Issue Comments | `mcp__github__get_issue_comments` |
| 進捗報告 | Sub-Issue Comments | `mcp__github__get_issue_comments` |

### ローカルファイル管理（廃止）

GitHub移行により以下は使用しない：
- `docs/spec/` → GitHub Issue Description
- `docs/design/` → GitHub Issue Comments
- `docs/tasks/` → GitHub Sub-Issues
- `docs/implements/` → GitHub Issue Comments

残るファイル：
- `docs/rule/` - コマンド実行ルール
- `docs/tech-stack.md` - 技術スタック定義
- ソースコード・テストコード
- 設定ファイル

## 設定ファイル

### `.claude/github-config.json`

```json
{
  "owner": "HIRO15254",
  "repo": "sapphire",
  "defaultAssignee": "HIRO15254",
  "reviewer": "HIRO15254",
  "labels": {
    "tdd": "TDD",
    "direct": "DIRECT",
    "kairo": "kairo",
    "tddCycle": "tdd-cycle",
    "feature": "feature",
    "bug": "bug",
    "refactor": "refactor"
  },
  "statusLabels": {
    "todo": "status: todo",
    "inProgress": "status: in-progress",
    "inReview": "status: in-review",
    "done": "status: done"
  },
  "priorities": {
    "critical": "P0: critical",
    "high": "P1: high",
    "medium": "P2: medium",
    "low": "P3: low"
  }
}
```

## 注意事項

- GitHub MCP Serverの統合が有効であることが前提
- GitHub Issue番号は全コマンドの必須パラメータ
- ステータスラベルは必ず1つのみ設定
- PRの自動作成は必ず確認画面を表示
- Milestoneの期間は2週間を超えない
- 1つのPRは500行以下を目安とする
- Sub-Issuesは親Issueに必ず紐付ける
