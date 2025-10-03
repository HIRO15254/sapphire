# kairo-requirements GitHub連携ルール

## コマンド実行時の動作

### 1. 親Issue作成（大機能）

```typescript
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

### 状態要件
${状態要件リスト}

### オプション要件
${オプション要件リスト}

### 制約要件
${制約要件リスト}

## 非機能要件

### パフォーマンス
${パフォーマンス要件}

### セキュリティ
${セキュリティ要件}

### ユーザビリティ
${ユーザビリティ要件}

## Edgeケース

### エラー処理
${エラー処理要件}

### 境界値
${境界値要件}

## ユーザーストーリー
${userStoriesContent}

## 受け入れ基準
${acceptanceCriteriaContent}`,
  labels: ["kairo", "feature"],
  assignee: "HIRO15254"
});
```

### 2. Milestone作成（実装単位）

```typescript
const milestone = await mcp__github__create_milestone({
  owner: "HIRO15254",
  repo: "sapphire",
  title: `${要件名}-M1`,
  description: `Phase 1実装範囲

## 成果物
- ${成果物1}
- ${成果物2}

## 完了条件
- バックエンドAPIの実装完了
- フロントエンドUIの実装完了
- E2Eテスト通過

## 期間
${開始日} 〜 ${終了日}`,
  due_on: "${終了日}T00:00:00Z" // ISO 8601形式
});
```

### 3. 出力情報

コマンド完了時に以下を表示：

```
✅ 要件定義書を作成しました

📋 作成した情報
- 親Issue: #${parentIssue.number}
  URL: ${parentIssue.html_url}
- Milestone: ${milestone.title}
  URL: ${milestone.html_url}

📝 次のステップ
/kairo-design ${parentIssue.number}
```

## ドキュメント構造

### Issue Description（メイン）
- 要件定義書本体
- EARS記法による機能要件
- 非機能要件
- Edgeケース
- ユーザーストーリー
- 受け入れ基準

すべてをIssue Descriptionに1つのMarkdownドキュメントとして記載します。

### 旧ファイル構造との対応

| 旧ファイル | 新保存先 |
|-----------|---------|
| `docs/spec/{要件名}-requirements.md` | Issue Description（全体） |
| `docs/spec/{要件名}-user-stories.md` | Issue Description（ユーザーストーリーセクション） |
| `docs/spec/{要件名}-acceptance-criteria.md` | Issue Description（受け入れ基準セクション） |

## 重要な注意点

1. **Issue番号を記録**
   - 作成したIssue番号を次のコマンド（kairo-design）に渡す

2. **Milestoneを必ず作成**
   - 実装単位の管理に必須

3. **ラベル必須**
   - `kairo`, `feature`は必ず付与

4. **Markdown形式**
   - 見出し、リスト、テーブル、コードブロックを活用
   - Mermaid図も使用可能
