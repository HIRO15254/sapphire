# kairo-tasks GitHub連携ルール

## コマンド実行時の動作

### 1. 親Issue取得

引数として親Issue番号を受け取ります：

```bash
/kairo-tasks 123
```

```typescript
const parentIssue = await mcp__github__get_issue({
  owner: "HIRO15254",
  repo: "sapphire",
  issue_number: 123
});
```

### 2. Milestone取得

```typescript
const milestones = await mcp__github__list_milestones({
  owner: "HIRO15254",
  repo: "sapphire",
  state: "open"
});

// 要件名に一致するMilestoneを検索
const targetMilestone = milestones.find(m => m.title.includes(要件名));
```

### 3. Sub-Issues作成（タスク単位）

各タスクをSub-Issueとして作成：

```typescript
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
**タスクID**: ${task.id}
**タスクタイプ**: ${task.type}`,
    labels: [task.type, task.priority, "kairo", "status: todo"],
    milestone: targetMilestone?.number,
    assignee: "HIRO15254"
  });

  // 親Issueに紐付け
  await mcp__github__add_sub_issue({
    owner: "HIRO15254",
    repo: "sapphire",
    issue_number: parentIssue.number,
    sub_issue_id: subIssue.id // 注意: numberではなくid（GitHub内部ID）
  });

  createdIssues.push({
    taskId: task.id,
    taskName: task.name,
    issueNumber: subIssue.number,
    type: task.type
  });
}
```

### 4. 親Issueに進捗トラッカー追加

```typescript
await mcp__github__add_issue_comment({
  owner: "HIRO15254",
  repo: "sapphire",
  issue_number: parentIssue.number,
  body: `## 📋 タスク進捗トラッカー

### Phase 1
${phase1Tasks.map(t => `- [ ] #${t.issueNumber} - ${t.taskId}: ${t.taskName}`).join('\n')}

### Phase 2
${phase2Tasks.map(t => `- [ ] #${t.issueNumber} - ${t.taskId}: ${t.taskName}`).join('\n')}

---
**総タスク数**: ${createdIssues.length}件
**TDDタスク**: ${tddCount}件
**DIRECTタスク**: ${directCount}件

作成日時: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}`
});
```

### 5. 出力情報

コマンド完了時に以下を表示：

```
✅ タスク分割を完了しました

📋 作成したSub-Issues
${createdIssues.map((t, i) => `${i + 1}. #${t.issueNumber} - ${t.taskId}: ${t.taskName} [${t.type}]`).join('\n')}

📊 統計
- 総タスク数: ${createdIssues.length}件
- TDDタスク: ${tddCount}件
- DIRECTタスク: ${directCount}件

📝 次のステップ
最初のタスクから実装を開始してください：
/kairo-implement ${createdIssues[0].issueNumber}
```

## ドキュメント構造

### Sub-Issue Description（各タスク）
- タスク詳細（要件、実装詳細、完了条件）
- 推定工数
- 依存タスク
- 関連要件
- 親Issue参照
- タスクID、タスクタイプ

### Sub-Issueのラベル構成
- **タスクタイプ**: `TDD` or `DIRECT`
- **優先度**: `P0: critical`, `P1: high`, `P2: medium`, `P3: low`
- **カテゴリ**: `kairo`
- **ステータス**: `status: todo`（初期状態）

### 旧ファイル構造との対応

| 旧ファイル | 新保存先 |
|-----------|---------|
| `docs/tasks/{要件名}-overview.md` | 親Issue Comment（進捗トラッカー） |
| `docs/tasks/{要件名}-phase1.md` | Sub-Issues（Phase 1タスク群） |
| `docs/tasks/{要件名}-phase2.md` | Sub-Issues（Phase 2タスク群） |

## 重要な注意点

1. **親Issueへの紐付けは必須**
   - **すべてのSub-Issue作成後に`add_sub_issue`を実行すること**
   - `add_sub_issue`は`sub_issue_id`（GitHub内部ID）を使用
   - `subIssue.number`ではなく`subIssue.id`を渡す
   - 親Issue上でSub-Issuesが自動追跡され、進捗が可視化される

2. **Milestoneの設定は必須**
   - **すべてのSub-IssueにMilestoneを設定すること**
   - 親IssueのMilestoneと同じMilestoneを設定
   - `create_issue`の`milestone`パラメータで設定（`milestone: targetMilestone?.number`）
   - 実装フェーズ単位の進捗管理に利用

3. **依存タスクはIssue番号で参照**
   - `#123`形式で記載するとGitHubが自動リンク

4. **進捗トラッカーのチェックボックス**
   - `- [ ]`形式で記載すると対話的に更新可能

5. **タスクID（TASK-0001）を含める**
   - Issue TitleとDescriptionの両方に記載
   - ブランチ名にも使用（`task/TASK-0001`）
