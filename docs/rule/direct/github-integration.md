# DIRECTコマンド群 GitHub連携ルール

## コマンド引数

DIRECTコマンドはSub-Issue番号を引数として受け取ります：

```bash
/direct-setup 125
/direct-verify 125
```

## 各コマンドでのGitHub連携

### 1. direct-setup（セットアップ作業）

#### コメント追加

```typescript
await mcp__github__add_issue_comment({
  owner: "HIRO15254",
  repo: "sapphire",
  issue_number: issueNumber,
  body: `## 🔧 セットアップ作業完了

### 実施内容
${setupDetails}

### 作成ファイル
${createdFiles.map(f => \`- \${f}\`).join('\\n')}

### 設定更新
${updatedConfigs.map(c => \`- \${c}\`).join('\\n')}

---
完了時刻: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}`
});
```

#### 自動コミット

```bash
git commit -m "chore(#${issueNumber}): セットアップ作業完了

${setupDetails}

- 作成ファイル: ${createdFiles.length}件
- 設定更新: ${updatedConfigs.length}件

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### 2. direct-verify（動作確認）

#### コメント追加

```typescript
await mcp__github__add_issue_comment({
  owner: "HIRO15254",
  repo: "sapphire",
  issue_number: issueNumber,
  body: `## ✅ 動作確認完了

### 確認項目
${verificationItems.map(v => \`- [\${v.passed ? 'x' : ' '}] \${v.name}\`).join('\\n')}

### 環境確認
- ビルド: ${buildStatus}
- テスト: ${testStatus}
- 起動確認: ${launchStatus}

### 次のステップ
PR作成の準備が整いました。

---
完了時刻: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}`
});
```

#### 自動コミット

```bash
git commit -m "chore(#${issueNumber}): 動作確認完了

- ビルド: ${buildStatus}
- テスト: ${testStatus}
- 起動確認: ${launchStatus}

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

## 重要な注意点

1. **Sub-Issue番号が必須**
   - kairo-implementから渡されるSub-Issue番号を使用

2. **各ステップでコメント追加**
   - セットアップ内容の可視化
   - 動作確認結果の記録

3. **自動コミットメッセージ**
   - `chore(#issue)`: 設定・準備作業

4. **direct-verify完了時**
   - PR作成の準備完了をコメントに明記
   - kairo-implementがPR作成を担当
