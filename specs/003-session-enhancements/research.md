# Technical Research: ポーカーセッション記録機能の改善

**Feature Branch**: `003-session-enhancements`
**Date**: 2025-10-26
**Spec**: [spec.md](./spec.md)

## Overview

本ドキュメントは、セッション記録機能の改善に必要な技術的判断とベストプラクティスを記録する。

## Research Items

### 1. Mantine Modal Component for Session Forms

**Context**: セッション追加・編集フォームをモーダルウィンドウに変更する必要がある（P1）。

**Decision**: Mantine v8の`Modal`コンポーネントを使用

**Rationale**:
- プロジェクトで既にMantine v8を使用しており、一貫性が保たれる
- `Modal`コンポーネントはアクセシビリティ（ARIA属性、キーボードナビゲーション）をデフォルトでサポート
- `closeOnClickOutside`、`closeOnEscape`などの設定で要件（FR-003）を容易に実装可能
- モバイルレスポンシブ対応がビルトイン
- スタイリングがMantineのテーマシステムと統合されている

**Implementation Notes**:
- `Modal`コンポーネントを`opened`プロパティで制御
- フォームの状態管理は`@mantine/form`を使用
- バリデーションエラーはモーダル内に表示し、モーダルを閉じない（FR-019）
- 保存成功後のみモーダルをクローズ

**Alternatives Considered**:
- **Headless UI + カスタムスタイル**: より柔軟だが、Mantineとの統合が煩雑
- **Native `<dialog>`要素**: ブラウザサポートは改善しているが、Mantineとの一貫性がない

**References**:
- [Mantine Modal Documentation](https://mantine.dev/core/modal/)
- [Mantine Form Documentation](https://mantine.dev/form/use-form/)

---

### 2. Location Management with Select Component

**Context**: 場所を文字列ではなくDB上のエントリとして管理し、オートコンプリート機能を提供する必要がある（P2、FR-004〜FR-007）。

**Decision**: Mantine `Select`コンポーネント（searchable、creatable）+ 新規`locations`テーブル

**Rationale**:
- Mantine `Select`は`searchable`プロパティで部分一致検索をサポート（FR-007）
- `creatable`プロパティで新規場所の追加が可能（FR-006）
- データの正規化により、場所名のタイポを防ぎ、統計分析の精度が向上
- ユニーク制約により重複を防止（FR-004）

**Data Model**:
```typescript
// locations table
{
  id: serial (primary key)
  userId: varchar (foreign key to users.id)
  name: varchar (unique per user)
  createdAt: timestamp
  updatedAt: timestamp
}

// poker_sessions.location
// varchar → integer (foreign key to locations.id)
```

**Implementation Notes**:
- 場所の取得は`locations`テーブルから`userId`でフィルタリング
- `Select`の`data`プロパティに`{ value: id, label: name }`形式で渡す
- 新規場所の作成は、セッション保存時にトランザクション内で実行
- 場所名の正規化（トリム、小文字化）を適用して重複を防止

**Performance Considerations**:
- 場所数は通常10〜50程度と想定されるため、ページネーション不要
- インデックス: `(userId, name)` でユニーク制約 + 検索最適化

**Alternatives Considered**:
- **Autocomplete コンポーネント**: `Select`の方がドロップダウンUIに適している
- **Combobox コンポーネント**: Mantine v8では`Select`が推奨

**References**:
- [Mantine Select Documentation](https://mantine.dev/core/select/)

---

### 3. Rich Text Editor with Tiptap

**Context**: メモをHTML形式で保存し、リッチテキストエディタを提供する必要がある（P3、FR-008〜FR-011）。

**Decision**: Tiptap v2 + `@mantine/tiptap`拡張

**Rationale**:
- Tiptapはヘッドレスエディタで、Mantineとの統合が容易
- `@mantine/tiptap`はMantine v8に対応した公式拡張
- 拡張機能が豊富（Bold、Italic、List、Link、Heading等）
- HTMLとしてシリアライズ・デシリアライズが標準でサポート
- XSS対策のためのサニタイゼーションライブラリ（DOMPurify）との統合が容易

**Dependencies**:
```json
{
  "@tiptap/react": "^2.10.4",
  "@tiptap/starter-kit": "^2.10.4",
  "@tiptap/extension-link": "^2.10.4",
  "@mantine/tiptap": "^8.3.5",
  "dompurify": "^3.2.5",
  "@types/dompurify": "^3.2.0"
}
```

**Extensions to Include**:
- StarterKit (Bold, Italic, Paragraph, Heading, BulletList, OrderedList, Code, Blockquote)
- Link (リンク挿入)

**HTML Sanitization Strategy**:
- フロントエンド: DOMPurifyで表示前にサニタイズ（FR-011）
- バックエンド: 保存前にもDOMPurifyでサニタイズ（二重防御）
- 許可タグ: `<p>, <strong>, <em>, <ul>, <ol>, <li>, <h1>-<h6>, <a>, <code>, <blockquote>`
- 許可属性: `href` (リンク用)、`rel`, `target` (安全な値のみ)

**Data Model**:
```typescript
// poker_sessions.notes
// text → text (HTML文字列を保存)
```

**Implementation Notes**:
- `RichTextEditor`コンポーネントはContainerとして実装
- `useEditor` hookでTiptapエディタを初期化
- 保存時: `editor.getHTML()`でHTML取得 → DOMPurifyサニタイズ → API送信
- 表示時: サニタイズされたHTMLを`dangerouslySetInnerHTML`で表示（すでにサニタイズ済み）

**Performance Considerations**:
- メモの最大長: 50,000文字（エッジケース対応）
- 長文の場合でも、Tiptapの仮想DOMにより編集は快適

**Alternatives Considered**:
- **Quill**: Reactとの統合がやや古い
- **Slate**: より低レベルで実装コストが高い
- **Draft.js**: Facebookが開発を停止

**References**:
- [Mantine Tiptap Documentation](https://mantine.dev/x/tiptap/)
- [Tiptap Documentation](https://tiptap.dev/)
- [DOMPurify](https://github.com/cure53/DOMPurify)

---

### 4. Tagging System with Many-to-Many Relationship

**Context**: セッションに複数のタグを設定し、タグでフィルタリングできる必要がある（P4、FR-012〜FR-017）。

**Decision**: `tags`テーブル + `session_tags`中間テーブル + Mantine `MultiSelect`コンポーネント

**Rationale**:
- 多対多関係はタグの再利用とデータの正規化に最適
- タグの重複を防ぎ、オートコンプリート候補として提供可能
- `MultiSelect`はタグ入力・削除のUXに最適

**Data Model**:
```typescript
// tags table
{
  id: serial (primary key)
  userId: varchar (foreign key to users.id)
  name: varchar (unique per user, case-insensitive)
  createdAt: timestamp
  updatedAt: timestamp
}

// session_tags table (many-to-many junction)
{
  sessionId: integer (foreign key to poker_sessions.id)
  tagId: integer (foreign key to tags.id)
  primary key: (sessionId, tagId)
}
```

**Case-Insensitive Uniqueness**:
- PostgreSQLの`LOWER(name)`を使った部分インデックスまたはトリガー
- Drizzle ORMでの実装: `name`フィールドに対して`LOWER()`を適用してクエリ

**Implementation Notes**:
- `MultiSelect`の`data`に既存タグのリスト（`{ value: id, label: name }`）を提供
- `searchable`プロパティでオートコンプリート（FR-014）
- `creatable`プロパティで新規タグ作成
- 新規タグは保存時にトランザクション内で作成

**Filtering Logic** (FR-015、FR-016):
- AND条件: セッションが選択されたすべてのタグを持つ場合のみ表示
- SQL: `HAVING COUNT(DISTINCT tag_id) = {選択されたタグ数}`を使用

**Tag Limit**:
- 実用上の制限: 1セッションあたり最大20タグ（バリデーション）
- UI: 20タグを超える場合、警告メッセージを表示

**Performance Considerations**:
- インデックス: `session_tags(sessionId)`, `session_tags(tagId)`
- タグフィルタリング時のクエリ最適化: JOINとGROUP BYを使用
- 1000セッション、100タグ程度であれば十分高速

**Alternatives Considered**:
- **配列型フィールド**: PostgreSQLの配列型は使えるが、正規化されず、オートコンプリートが困難
- **JSON型**: 同様に検索・フィルタリングが非効率

**References**:
- [Mantine MultiSelect Documentation](https://mantine.dev/core/multi-select/)
- [Many-to-Many Relationships in Drizzle ORM](https://orm.drizzle.team/docs/rqb#many-to-many)

---

### 5. tRPC Router Updates

**Context**: 新しいエンティティ（locations、tags）を管理し、セッションのCRUD操作を拡張する必要がある。

**Decision**:
- 既存の`sessions` routerを拡張
- 新規に`locations` routerと`tags` routerを作成

**Router Structure**:

```typescript
// sessions router (拡張)
sessions.create         // location_id, tag_ids[]を受け取る
sessions.update         // location_id, tag_ids[]を受け取る
sessions.getAll         // tags情報を含める
sessions.getById        // tags情報を含める
sessions.getFiltered    // tagIds[]パラメータを追加

// locations router (新規)
locations.getAll        // ユーザーの全場所取得
locations.create        // 新規場所作成（内部使用またはUI用）

// tags router (新規)
tags.getAll             // ユーザーの全タグ取得
tags.create             // 新規タグ作成（内部使用またはUI用）
```

**Input Validation** (Zod):
```typescript
// セッション作成・更新スキーマに追加
locationId: z.number().int().positive()
tagIds: z.array(z.number().int().positive()).max(20)

// 場所作成
name: z.string().min(1).max(255).trim()

// タグ作成
name: z.string().min(1).max(50).trim()
```

**Transaction Handling**:
- セッション作成/更新時に、新規場所・タグを作成する場合はトランザクション内で処理
- 既存の場所・タグを参照する場合は単純なINSERT/UPDATE

**Error Handling**:
- 重複場所/タグ名: ユニーク制約違反をキャッチし、既存のIDを返す
- 存在しないlocationId/tagId: Foreign key制約違反をキャッチし、適切なエラーメッセージを返す

**References**:
- [tRPC Procedures](https://trpc.io/docs/server/procedures)
- [Drizzle Transactions](https://orm.drizzle.team/docs/transactions)

---

### 6. Frontend Component Architecture

**Context**: Presentation/Container分離原則（憲法原則IV）を遵守しつつ、モーダルベースのUIを実装する。

**Decision**: Container/Presentationパターンを継続

**Component Structure**:

```
src/features/poker-sessions/
├── components/                    # Presentation層
│   ├── SessionModal.tsx           # モーダルフォーム（Presentation）
│   ├── SessionForm.tsx            # フォーム本体（Presentation）
│   ├── LocationSelect.tsx         # 場所選択（Presentation）
│   ├── TagMultiSelect.tsx         # タグ選択（Presentation）
│   ├── RichTextEditor.tsx         # リッチテキストエディタ（Presentation）
│   ├── SessionCard.tsx            # セッションカード（既存）
│   └── SessionList.tsx            # セッション一覧（既存）
│
├── containers/                    # Container層
│   ├── SessionModalContainer.tsx  # モーダル状態管理
│   ├── SessionFormContainer.tsx   # フォーム状態・API呼び出し
│   ├── LocationSelectContainer.tsx# 場所データ取得・作成
│   ├── TagMultiSelectContainer.tsx# タグデータ取得・作成
│   └── SessionListContainer.tsx   # フィルター状態管理
│
└── hooks/
    ├── useSessionModal.ts         # モーダル開閉状態
    ├── useSessionForm.ts          # フォーム状態（@mantine/form）
    ├── useLocations.ts            # 場所データ取得
    └── useTags.ts                 # タグデータ取得
```

**Rationale**:
- Presentation層はpropsのみに依存し、UIのみを担当
- Container層はロジック、状態管理、API呼び出しを担当
- hooksで共通ロジックを再利用
- テスト容易性: Presentationは単純なpropsテスト、ContainerはAPIモックテスト

**Modal State Management**:
- モーダルの開閉状態: `useState`または`useDisclosure` hook（Mantine）
- フォームの初期値: 新規作成時は空、編集時は既存データ

**Form State**:
- `@mantine/form`の`useForm` hookを使用
- バリデーション: Zodスキーマを`zodResolver`で統合

**References**:
- [Mantine useForm](https://mantine.dev/form/use-form/)
- [Mantine useDisclosure](https://mantine.dev/hooks/use-disclosure/)

---

### 7. Migration Strategy

**Context**: 既存の`poker_sessions`テーブルと新規テーブル（`locations`, `tags`, `session_tags`）の移行戦略。

**Decision**: 段階的マイグレーション

**Migration Steps**:

1. **新規テーブルの作成**:
   - `locations`テーブルを作成
   - `tags`テーブルを作成
   - `session_tags`中間テーブルを作成

2. **既存データの移行**:
   - `poker_sessions.location` (varchar)の既存値を抽出
   - 重複を排除して`locations`テーブルにINSERT
   - `poker_sessions.location`を`location_id` (integer)に変更
   - 外部キー制約を追加

3. **メモフィールドの更新**:
   - `poker_sessions.notes`は既存のtext型を維持（HTML文字列を保存）
   - 既存のプレーンテキストメモはそのまま保持（HTMLとして表示可能）

**Backwards Compatibility**:
- 既存のセッションは`location_id`に変換後、タグなしで保持
- 既存のメモはプレーンテキストとして表示（HTML対応エディタでも閲覧可能）

**Rollback Plan**:
- マイグレーション失敗時は、`locations`テーブルから`location_id`を逆引きして`location` varchar値に戻す

**Testing**:
- マイグレーションスクリプトをテスト環境で実行
- 既存データの整合性を検証

**References**:
- [Drizzle Kit Migrations](https://orm.drizzle.team/docs/migrations)

---

## Summary of Technology Decisions

| Area | Technology | Rationale |
|------|-----------|-----------|
| Modal UI | Mantine Modal | プロジェクト標準、アクセシビリティ対応 |
| Location Input | Mantine Select (searchable, creatable) | オートコンプリート、新規追加対応 |
| Rich Text Editor | Tiptap v2 + @mantine/tiptap | Mantine統合、拡張性、XSS対策 |
| HTML Sanitization | DOMPurify | 業界標準、XSS防御 |
| Tag Input | Mantine MultiSelect | 複数タグ選択、オートコンプリート |
| Data Model | PostgreSQL + Drizzle ORM | 既存スタック、正規化、型安全性 |
| API | tRPC v11 | 既存スタック、型安全性 |
| State Management | @mantine/form + TanStack Query | フォーム状態、サーバー状態管理 |

---

## Performance Targets

Based on Success Criteria:

| Metric | Target | Implementation Strategy |
|--------|--------|------------------------|
| SC-001: セッション記録時間 | < 60秒 | モーダルで画面遷移を削減 |
| SC-002: 場所入力時間削減 | 80%削減 | Selectのオートコンプリート |
| SC-005: タグフィルタリング | < 1秒 | インデックス最適化、効率的なJOIN |
| SC-006: オートコンプリート表示 | < 300ms | データ量が少ないため最適化不要 |
| SC-007: モーダル開閉 | < 200ms | Mantineのデフォルトアニメーション |
| SC-009: XSS攻撃成功率 | 0% | DOMPurifyによる二重サニタイズ |

---

## Security Considerations

1. **XSS Prevention**:
   - DOMPurifyでHTMLサニタイズ（フロントエンド + バックエンド）
   - 許可タグと属性のホワイトリスト

2. **SQL Injection Prevention**:
   - Drizzle ORMのパラメータ化クエリ（すでに対応済み）

3. **CSRF Protection**:
   - Next.jsとNextAuth.jsのデフォルト保護（すでに対応済み）

4. **User Data Isolation**:
   - すべてのクエリで`userId`フィルタを適用
   - locations、tagsもユーザーごとに分離

---

## Dependencies to Add

```json
{
  "dependencies": {
    "@tiptap/react": "^2.10.4",
    "@tiptap/starter-kit": "^2.10.4",
    "@tiptap/extension-link": "^2.10.4",
    "@mantine/tiptap": "^8.3.5",
    "dompurify": "^3.2.5"
  },
  "devDependencies": {
    "@types/dompurify": "^3.2.0"
  }
}
```

---

## Open Questions / Assumptions

### Assumptions

1. **タグの最大数**: 1セッションあたり最大20タグで十分
2. **メモの最大長**: 50,000文字で十分
3. **場所数**: ユーザーあたり通常10〜50箇所程度
4. **タグ数**: システム全体で100〜500程度

### Resolved Questions

すべての技術的不明点は上記のリサーチで解決済み。

---

**Version**: 1.0
**Last Updated**: 2025-10-26
