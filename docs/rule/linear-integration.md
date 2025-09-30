# Linear統合ルール

## 概要

このドキュメントは、Tsumikiワークフロー（kairo/TDDコマンド）とLinearプロジェクト管理ツールの統合ルールを定義します。
実装タスクの管理、進捗追跡、コードレビューのプロセスを統一し、効率的な開発フローを実現します。

## Linear階層構造

### Projects（大機能）
- **作成タイミング**: `kairo-requirements`実行時
- **単位**: 大きな機能単位で分離（例：認証システム、決済機能、管理画面）
- **命名規則**: `{要件名}-{機能概要}`
- **ステータス**: Backlog → In Progress → In Review → Completed

### Milestones（実装単位）
- **作成タイミング**: `kairo-requirements`実行時
- **単位**: 1ブランチで完結する実装単位
- **完了条件**:
  - バックエンドAPIの実装が完了
  - フロントエンドUIの実装が完了
  - アプリケーション上で変更が観測可能
  - E2Eテストが通過
- **命名規則**: `{project-name}/M{番号}-{milestone-name}`
- **期間**: 1〜2週間程度
- **MCP制限対応**: Linear MCPサーバーでMilestone作成機能が利用できない場合、ユーザーに手動でのMilestone作成を依頼する

### Issues（タスク）
- **作成タイミング**: `kairo-tasks`実行時
- **単位**: 1日以内で完了する具体的なタスク
- **ID管理**: Linear Issue ID（例：`SAP-123`）を使用
- **ラベル**:
  - タイプ: `TDD`（コード実装）、`DIRECT`（設定・準備）
  - 優先度: `P0`（緊急）、`P1`（高）、`P2`（中）、`P3`（低）
  - ステータス: `Todo`、`In Progress`、`In Review`、`Done`

## Git運用フロー

### ブランチ戦略

```
dev（メインブランチ）
├── milestone/{milestone-name}
│   ├── task/{linear-issue-id}
│   ├── task/{linear-issue-id}
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
   git checkout -b task/{linear-issue-id}
   ```

### PR作成とレビューフロー

1. **タスク完了時**
   - タスクブランチからMilestoneブランチへPR作成
   - タイトル: `[{linear-issue-id}] {タスク名}`
   - レビュアー: `@HIRO15254`を自動指定
   - Linear IssueにPRリンクを自動追加

2. **依存関係の確認**
   - タスク開始前に依存タスクのPRがマージ済みであることを確認
   - Linear APIで依存関係を自動チェック
   - 未マージの場合は警告を表示

3. **Milestone完了時**
   - MilestoneブランチからdevブランチへPR作成
   - 全関連Issueが「Done」であることを確認
   - マージ後、Milestoneを「Completed」に更新

## TDDコマンドの自動コミット

各TDDコマンド終了時に以下の規約で自動コミットを作成：

### コミットメッセージ規約

| コマンド                  | コミットメッセージ                       | 説明             |
|-----------------------|---------------------------------|----------------|
| `tdd-requirements`    | `feat({issue-id}): 要件定義を完了`     | 機能要件の定義        |
| `tdd-testcases`       | `test({issue-id}): テストケースを作成`   | テストケースの設計      |
| `tdd-red`             | `test({issue-id}): 失敗するテストを実装`  | Red phase      |
| `tdd-green`           | `feat({issue-id}): テストを通る最小実装`  | Green phase    |
| `tdd-refactor`        | `refactor({issue-id}): コード品質改善` | Refactor phase |
| `tdd-verify-complete` | `chore({issue-id}): 品質確認完了`     | 完了確認           |

### コミット作成例

```bash
# tdd-green終了時の自動コミット
git add .
git commit -m "feat(SAP-123): テストを通る最小実装

- UserServiceのcreateUser機能を実装
- 入力検証とエラーハンドリングを追加
- 単体テスト5件が全て通過

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

## Linear API連携

### 各コマンドでのLinear更新

#### kairo-requirements（要件定義）
```typescript
// Linear Project作成
const project = await mcp__linear_server__create_project({
  name: "{要件名}",
  description: "要件定義書の概要",
  team: TEAM_NAME,
  state: "Backlog"
});

// Milestone同時作成（実装単位の計画）
for (const milestone of plannedMilestones) {
  await mcp__linear_server__create_milestone({
    name: milestone.name,
    projectId: project.id,
    description: milestone.scope,
    targetDate: milestone.targetDate
  });
}

// Project Documentとして要件定義書を作成
await mcp__linear_server__create_document({
  title: "要件定義書 - {要件名}",
  content: requirementsDocument,
  projectId: project.id
});

// 大機能ごとにProjectを分離
if (isLargeFeature(requirements)) {
  await splitIntoMultipleProjects(requirements);
}
```

#### kairo-design（設計）
```typescript
// Issue IDから情報取得（MCP Server経由）
const issue = await mcp__linear_server__get_issue(issueId);
const milestone = issue.milestone;

// Milestone Documentとして設計書を作成
await mcp__linear_server__create_document({
  title: "設計書 - {milestone.name}",
  content: designDocument,
  projectId: issue.project.id
});

// 関連IssueのDescriptionを更新
await mcp__linear_server__update_issue({
  id: issueId,
  description: detailedDesignSpec
});
```

#### kairo-tasks（タスク分割）
```typescript
// プロジェクト情報取得
const project = await mcp__linear_server__get_project(projectName);
const milestones = await mcp__linear_server__list_milestones(project.id);

// Linear Issues一括作成
const createdIssues = [];
for (const task of tasks) {
  const issue = await mcp__linear_server__create_issue({
    title: task.name,
    description: task.details,
    project: project.name,
    milestone: task.milestone,
    assignee: "HIRO15254",
    labels: [task.type], // "TDD" or "DIRECT"
    estimate: task.hours,
    priority: task.priority
  });

  createdIssues.push({
    taskName: task.name,
    issueId: issue.identifier // e.g., "SAP-123"
  });
}

// 作成したIssue IDリストを返す（後続コマンドで使用）
return createdIssues;
```

#### kairo-implement（実装）
```typescript
// コマンド実行時にIssue IDを受け取る
const issueId = process.argv[2]; // e.g., "SAP-123"

// Issue状態更新（MCP Server経由）
await mcp__linear_server__update_issue({
  id: issueId,
  state: "In Progress"
});

// 進捗コメント追加
await mcp__linear_server__create_comment({
  issueId: issueId,
  body: "TDD Red phaseを完了しました。テストが期待通り失敗することを確認。"
});

// PR作成時（GitHub連携）
const prUrl = await createPullRequest({
  title: `[${issueId}] ${taskName}`,
  reviewers: ["HIRO15254"]
});

await mcp__linear_server__update_issue({
  id: issueId,
  state: "In Review",
  links: [{ url: prUrl, title: "Pull Request" }]
});
```

#### TDDコマンド群
```typescript
// コマンド実行時にIssue IDを受け取る
const issueId = process.argv[2]; // e.g., "SAP-123"

// 各フェーズ完了時にコメント追加（MCP Server経由）
const phaseComments = {
  "tdd-requirements": "✅ 要件定義を完了\n\n要件定義書をLinear Documentに保存しました。",
  "tdd-testcases": "✅ テストケースを作成（{count}件）\n\n詳細はコードコメントを参照。",
  "tdd-red": "🔴 失敗するテストを実装\n\n全テストが期待通り失敗することを確認。",
  "tdd-green": "🟢 テストが通る最小実装を完了\n\n全テスト通過を確認。",
  "tdd-refactor": "♻️ リファクタリング完了\n\nコード品質を改善し、テスト通過を維持。",
  "tdd-verify-complete": "✅ 品質確認完了\n\nカバレッジ: {coverage}%\nLint: Pass\nType Check: Pass"
};

await mcp__linear_server__create_comment({
  issueId: issueId,
  body: phaseComments[command]
});

// 要件定義の場合はDocumentも作成
if (command === "tdd-requirements") {
  const issue = await mcp__linear_server__get_issue(issueId);
  await mcp__linear_server__create_document({
    title: `要件定義 - ${issue.title}`,
    content: requirementsContent,
    projectId: issue.project.id
  });
}
```

## コマンド実行インターフェース

### Issue IDベースの実行

すべてのコマンドは Linear Issue ID を引数として受け取ります：

```bash
# 要件定義（Project ID）
$ /kairo-requirements SAP-PROJECT-1

# 設計（Issue ID）
$ /kairo-design SAP-123

# タスク分割（Project or Milestone ID）
$ /kairo-tasks SAP-PROJECT-1

# 実装（Issue ID）
$ /kairo-implement SAP-123

# TDDコマンド群（Issue ID）
$ /tdd-requirements SAP-123
$ /tdd-testcases SAP-123
$ /tdd-red SAP-123
$ /tdd-green SAP-123
$ /tdd-refactor SAP-123
$ /tdd-verify-complete SAP-123
```

### 自動情報取得

MCP Server経由で必要な情報を自動取得：
- プロジェクト情報
- マイルストーン情報
- 依存タスク状態
- 既存ドキュメント
- コメント履歴

## タスクステータス管理

### ステータス遷移ルール

1. **タスク開始時**:
   - ステータスを「Backlog」から「Todo」に変更
   - 実際に作業開始したら「In Progress」に変更

2. **タスク完了時**:
   - 完了したタスクを「Done」に変更
   - 依存関係を確認し、次に着手可能なタスクを特定
   - 着手可能なタスクのステータスを「Todo」に変更

3. **自動ステータス更新対象**:
   - 完了したタスクの直接の後続タスク
   - 依存関係が全て解決されたタスク
   - 同一フェーズ内の次のタスク

### コマンド別ステータス更新

| コマンド | 実行時 | 完了時 | 次タスク |
|---------|--------|--------|----------|
| kairo-requirements | → Todo → In Progress | → Done | 設計タスクを Todo に |
| kairo-design | → In Progress | → Done | 実装タスクを Todo に |
| kairo-tasks | → In Progress | → Done | 作成したタスクを Todo に |
| kairo-implement | → In Progress | → Done | 次の実装タスクを Todo に |
| TDDコマンド群 | → In Progress | (維持) | - |
| tdd-verify-complete | (維持) | → Done | 次のタスクを Todo に |
| direct-setup | → In Progress | (維持) | - |
| direct-verify | (維持) | → Done | 依存タスクを Todo に |

## 実行時の確認事項

### タスク開始前チェックリスト

1. **Linear Issue確認**
   - [ ] IssueがAssignされている
   - [ ] Milestoneが設定されている
   - [ ] 依存タスクがDone状態

2. **Git状態確認**
   - [ ] 最新のmilestoneブランチを取得
   - [ ] 依存タスクのPRがマージ済み
   - [ ] コンフリクトがない

3. **開発環境確認**
   - [ ] 必要なパッケージがインストール済み
   - [ ] テストが実行可能
   - [ ] 開発サーバーが起動可能

### タスク完了時チェックリスト

1. **実装確認**
   - [ ] 全テストが通過
   - [ ] Lintエラーなし
   - [ ] 型チェック通過

2. **Linear更新**
   - [ ] IssueステータスをIn Reviewに更新
   - [ ] PRリンクを追加
   - [ ] 実装時間を記録

3. **PR作成**
   - [ ] 適切なタイトルとDescription
   - [ ] レビュアーにHIRO15254を指定
   - [ ] Linear Issue IDを含める

## エラーハンドリング

### Linear API エラー
- API制限に達した場合: 手動でLinearを更新し、継続
- 認証エラー: トークンを再設定
- ネットワークエラー: リトライまたはスキップ

### Git競合
- Milestoneブランチとの競合: レビュアーと相談
- 依存タスクとの競合: 依存タスクの作者と調整

### 依存関係エラー
- 未マージの依存タスク: 警告を表示し、確認を求める
- 循環依存: エラーを表示し、タスク構造の見直しを提案

## 設定ファイル

### `.claude/linear-config.json`

```json
{
  "teamId": "YOUR_TEAM_ID",
  "projectPrefix": "SAP",
  "defaultAssignee": "HIRO15254",
  "reviewer": "HIRO15254",
  "labels": {
    "tdd": "TDD",
    "direct": "DIRECT",
    "bug": "Bug",
    "feature": "Feature",
    "refactor": "Refactor"
  },
  "priorities": {
    "urgent": 1,
    "high": 2,
    "medium": 3,
    "low": 4
  }
}
```

## ドキュメント管理

### Linear Documentsへの完全移行

すべてのドキュメントはLinear上で作成・管理します。ローカルの`docs/`ディレクトリは使用せず、Linear Documents、Issue Description、Issue Commentsを活用します。

#### ドキュメントの配置

| ドキュメント種別 | Linear上の保存場所 | アクセス方法 |
|------------|---------------|----------|
| 要件定義書 | Project Document | `mcp__linear-server__get_document` |
| 設計書 | Milestone Document | `mcp__linear-server__get_document` |
| タスク詳細 | Issue Description | `mcp__linear-server__get_issue` |
| 実装メモ | Issue Comments | `mcp__linear-server__list_comments` |
| テスト結果 | Issue Comments | `mcp__linear-server__list_comments` |
| 進捗報告 | Issue Comments | `mcp__linear-server__list_comments` |

### MCP Server経由でのアクセス

Linear Issue IDのみで全情報にアクセス可能です。URLの記載は不要です。

```typescript
// Issue IDのみで操作
const issue = await mcp__linear_server__get_issue("SAP-123");
const comments = await mcp__linear_server__list_comments("SAP-123");

// ドキュメント作成
await mcp__linear_server__create_document({
  title: "要件定義書",
  content: requirementsContent,
  projectId: issue.project.id
});

// 進捗コメント追加
await mcp__linear_server__create_comment({
  issueId: "SAP-123",
  body: "TDD Red phase完了\n\nテストが期待通り失敗することを確認しました。"
});
```

### コード内での参照

コード内では Linear Issue ID のみをコメントで記載：

```typescript
// Related to: SAP-123
function implementFeature() {
  // Implementation
}
```

## 各コマンドでのドキュメント作成

### kairo-requirements
- Project Document として要件定義書を作成
- Milestone を同時に作成し、実装単位を計画
- Issue ID: プロジェクト全体のトラッキングID

### kairo-design
- Milestone Document として設計書を作成
- 関連する全 Issue の Description を更新
- Issue ID を引数として受け取る

### kairo-tasks
- 各タスクを Linear Issue として作成
- Issue Description にタスク詳細を記載
- Issue ID を自動取得してコマンドに渡す

### kairo-implement / TDDコマンド群
- Issue ID を引数として受け取る
- 各フェーズ完了時に Issue Comment を自動追加
- テスト結果、実装詳細、リファクタリング内容を記録

### DIRECTタスク（direct-setup/direct-verify）
- Issue ID を引数として受け取る
- **direct-setup完了時**: Issue Comment に設定作業内容を追加
- **direct-verify完了時**:
  - Issue Comment に検証結果を追加
  - Issue Status を「Done」に更新
  - 成果物リスト、テスト結果、品質メトリクスを記載
  - **次タスクの準備**: 依存関係にある次のタスクのステータスを「Todo」に更新
- 完了報告フォーマット:
  - 実装完了内容（箇条書き）
  - 成果物テーブル（ファイル名、パス、状態）
  - 要件対応状況
  - 品質メトリクス（テスト成功率、実行速度等）

## ローカルファイル管理

### 廃止されたディレクトリ（Linear移行済み）
- `docs/spec/` → Linear Project Documents
- `docs/design/` → Linear Milestone Documents
- `docs/tasks/` → Linear Issues
- `docs/implements/` → Linear Issue Comments

### 残るファイル
- `docs/rule/` - コマンド実行ルール（このファイル含む）
- `docs/tech-stack.md` - 技術スタック定義
- `docs/patterns/` - 実装パターン蓄積（今後追加予定）
- `docs/architecture/` - プロジェクト詳細ドキュメント（今後追加予定）
- ソースコード
- テストコード
- 設定ファイル（package.json, tsconfig.json など）

## 注意事項

- MCP Server の Linear 統合が有効であることが前提
- Linear Issue ID は全コマンドの必須パラメータ
- PRの自動作成は必ず確認画面を表示
- 大規模な変更は事前にレビュアーと相談
- Milestoneの期間は2週間を超えない
- 1つのPRは500行以下を目安とする
