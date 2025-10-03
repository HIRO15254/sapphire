# kairo-design GitHub連携ルール

## コマンド実行時の動作

### 1. 親Issue取得

引数として親Issue番号を受け取ります：

```bash
/kairo-design 123
```

```typescript
const parentIssue = await mcp__github__get_issue({
  owner: "HIRO15254",
  repo: "sapphire",
  issue_number: 123
});
```

### 2. 設計書をコメント追加

```typescript
await mcp__github__add_issue_comment({
  owner: "HIRO15254",
  repo: "sapphire",
  issue_number: parentIssue.number,
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

${apiEndpoints}

---
設計完了日時: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}`
});
```

### 3. 出力情報

コマンド完了時に以下を表示：

```
✅ 設計書を作成しました

📋 追加した情報
- 親Issue: #${parentIssue.number}
- コメント追加: 設計書

📝 次のステップ
/kairo-tasks ${parentIssue.number}
```

## ドキュメント構造

### Issue Comment（設計書）
- アーキテクチャ概要
- データフロー図（Mermaid）
- TypeScript型定義
- データベーススキーマ（SQL）
- APIエンドポイント仕様

### 旧ファイル構造との対応

| 旧ファイル | 新保存先 |
|-----------|---------|
| `docs/design/{要件名}/architecture.md` | Issue Comment（アーキテクチャセクション） |
| `docs/design/{要件名}/dataflow.md` | Issue Comment（データフローセクション） |
| `docs/design/{要件名}/interfaces.ts` | Issue Comment（型定義セクション） |
| `docs/design/{要件名}/database-schema.sql` | Issue Comment（DBスキーマセクション） |
| `docs/design/{要件名}/api-endpoints.md` | Issue Comment（APIセクション） |

## 重要な注意点

1. **親Issue番号が必須**
   - kairo-requirementsで作成したIssue番号を引数で受け取る

2. **Mermaid図を活用**
   - データフロー図、シーケンス図など視覚化

3. **コードブロックで見やすく**
   - TypeScript、SQL、JSONなど適切にハイライト

4. **タイムスタンプを含める**
   - 設計完了日時を記録
