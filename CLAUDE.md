# Claude Code Context: Poker Session Tracker

**Last Updated**: 2025-10-26 (auto-generated via /speckit.plan)
**Feature**: 002-poker-session-tracker

## Technology Stack

**Language**: TypeScript 5.9 + React 19 + Next.js 15 (App Router)
**Runtime**: Bun v1.0以上
**Database**: PostgreSQL 16 (Docker Compose経由)
**Project Type**: Web (フロントエンド+バックエンド統合型Next.jsアプリ)

### Key Dependencies

**Frontend**:
- Mantine v8 (UIライブラリ)
- TanStack Query v5 (サーバー状態管理)
- @tabler/icons-react (アイコン)

**Backend**:
- tRPC v11 (型安全なAPI)
- Drizzle ORM v0.41 (データベースORM)
- NextAuth.js v5 (認証、将来対応)
- Zod v3 (バリデーション)

**Testing**:
- Vitest v2 (単体・契約テスト)
- @testing-library/react (Reactテスト)
- Playwright v1 (E2Eテスト)

**Tools**:
- Biome (リント・フォーマット)
- Docker Compose (PostgreSQL環境)

## Project Structure

```
src/
├── app/                        # Next.js App Router
│   ├── poker-sessions/         # ポーカーセッション管理ページ
│   │   ├── page.tsx
│   │   ├── new/page.tsx
│   │   └── [id]/
│   │       ├── page.tsx
│   │       └── edit/page.tsx
│   └── api/trpc/[trpc]/route.ts
│
├── server/                     # バックエンド(API層)
│   ├── api/
│   │   ├── routers/
│   │   │   └── sessions.ts    # ポーカーセッションAPI
│   │   ├── root.ts
│   │   └── trpc.ts
│   └── db/
│       ├── schema.ts           # sessions追加
│       └── index.ts
│
├── features/                   # フロントエンド機能
│   └── poker-sessions/
│       ├── components/         # Presentationコンポーネント
│       ├── containers/         # Containerコンポーネント
│       └── hooks/
│
└── lib/
    └── utils/
        └── currency.ts

tests/
├── contract/
│   └── sessions.test.ts
├── integration/
│   ├── create-session.test.tsx
│   ├── view-sessions.test.tsx
│   ├── edit-session.test.tsx
│   └── filter-sessions.test.tsx
└── e2e/
    ├── poker-sessions.spec.ts
    └── poker-sessions-filters.spec.ts
```

## Development Workflow

### Commands

```bash
# 開発サーバー起動
bun run dev

# テスト実行
bun run test           # Vitest
bun run test:e2e       # Playwright

# データベース操作
bun run db:push        # 本番DB
bun run db:push:test   # テスト用DB
bun run db:push:all    # 両方
bun run db:studio      # Drizzle Studio

# リント・フォーマット
bun run check
bun run check:write
```

### Testing Strategy (TDD Required)

**憲法原則 I: テスト駆動開発の徹底**

1. **契約テスト** (Vitest): tRPC API proceduresの入出力検証
2. **統合テスト** (Vitest + React Testing Library): ユーザーストーリー単位のフロー
3. **E2Eテスト** (Playwright): 実際のブラウザ動作

**Red-Green-Refactorサイクル**:
- テストを先に作成し、ユーザーの承認を得る
- テストが失敗することを確認(Red)
- 実装してテストを通す(Green)
- リファクタリング(Refactor)

## Architecture Patterns

### Presentation/Container分離 (憲法原則 IV)

**API層** (`src/server/`):
- ビジネスロジック
- データアクセス
- バリデーション(Zod)

**Container層** (`src/features/*/containers/`):
- 状態管理
- API呼び出し(tRPC)
- ロジック調整

**Presentation層** (`src/features/*/components/`):
- UIコンポーネント
- 表示のみ
- propsのみに依存

### Example

```typescript
// Presentation
export function SessionCard({ session, onDelete }: Props) {
  return <Card>...</Card>;
}

// Container
export function SessionCardContainer({ sessionId }: Props) {
  const { data } = api.sessions.getById.useQuery({ id: sessionId });
  const { mutate } = api.sessions.delete.useMutation({ ... });
  return <SessionCard session={data} onDelete={mutate} />;
}
```

## Data Model

### poker_sessions Table

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PRIMARY KEY | セッションID |
| date | TIMESTAMP NOT NULL | セッション開始日時 |
| location | TEXT NOT NULL | プレイ場所 |
| buy_in | NUMERIC(10,2) NOT NULL | バイイン額 |
| cash_out | NUMERIC(10,2) NOT NULL | キャッシュアウト額 |
| duration_minutes | INTEGER NOT NULL | プレイ時間(分) |
| notes | TEXT | メモ(任意) |
| created_at | TIMESTAMP NOT NULL | 作成日時 |
| updated_at | TIMESTAMP NOT NULL | 更新日時 |

**Computed Field**: `profit = cash_out - buy_in`

## API Contract (tRPC)

### sessions Router

```typescript
// src/server/api/routers/sessions.ts
export const sessionsRouter = createTRPCRouter({
  create: protectedProcedure.input(createSessionSchema).mutation(...),
  getAll: protectedProcedure.query(...),
  getFiltered: protectedProcedure.input(filterSessionsSchema).query(...),
  getStats: protectedProcedure.query(...),
  getById: protectedProcedure.input(getByIdSchema).query(...),
  update: protectedProcedure.input(updateSessionSchema).mutation(...),
  delete: protectedProcedure.input(deleteSessionSchema).mutation(...),
});
```

### Client Usage

```typescript
// Query
const { data: sessions } = api.sessions.getAll.useQuery();

// Mutation with cache invalidation
const { mutate: createSession } = api.sessions.create.useMutation({
  onSuccess: () => {
    void ctx.sessions.getAll.invalidate();
    void ctx.sessions.getStats.invalidate();
  },
});
```

## UI/UX Guidelines

### Mantine Components

- **Forms**: `TextInput`, `NumberInput`, `DateTimePicker`, `Textarea`
- **Display**: `Card`, `Badge`, `Table`, `Stack`
- **Actions**: `Button`, `Modal` (削除確認)
- **Layout**: `Grid`, `Container`

### Responsive Design

- デスクトップ: Grid layout
- タブレット: 2カラム
- モバイル: 1カラム + Stack

### Accessibility (WCAG 2.1 AA)

- すべてのフォーム入力にlabel
- エラーメッセージはaria-live
- カラーコントラスト比 >= 4.5:1
- キーボードナビゲーション対応

## Internationalization

**憲法原則 III: 日本語ファースト**

- すべてのUIテキスト: 日本語
- エラーメッセージ: 日本語で具体的な解決策を提示
- コミットメッセージ: 日本語
- ドキュメント: 日本語

### Currency Format

```typescript
// src/lib/utils/currency.ts
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
  }).format(amount);
}
```

## Performance Requirements

**Success Criteria**:
- SC-001: セッション記録 < 60秒
- SC-003: 履歴・統計表示 < 2秒
- SC-007: 1000セッション対応
- SC-008: フィルタリング < 1秒

**Strategies**:
- Pagination: デフォルト50件表示
- Debouncing: フィルター入力300ms
- Memoization: 統計計算結果キャッシュ
- Indexes: date, location, date+location

## Code Review Process (憲法原則 V)

**こまめなレビューとコミット承認**:

1. 機能単位(P1→P2→P3→P4)で段階的にコミット
2. 各段階でテスト合格確認
3. レビュー依頼
4. 承認後にGitコミット

## Documentation (憲法原則 VII)

**潤沢なドキュメンテーション**:

- **quickstart.md**: ユーザー向け操作ガイド(日本語)
- **data-model.md**: データモデル仕様
- **sessions-api.md**: API契約定義
- **research.md**: 技術的判断の根拠

**コンテキストヘルプ**:
- フォーム入力欄にツールチップ
- エラーメッセージに解決策

## Common Pitfalls

### ❌ Avoid

1. **Presentationコンポーネントでの直接API呼び出し** → Containerを使用
2. **バリデーションの重複** → Zodスキーマを共有
3. **計算フィールドの保存** → `profit`は常に計算
4. **テスト後に実装** → TDD(テストファースト)必須
5. **英語UI** → 日本語ファーストを遵守

### ✅ Best Practices

1. **Presentation/Container分離**を厳密に守る
2. **Zodスキーマ**をフロントエンド・バックエンドで共有
3. **楽観的更新**でUXを向上
4. **統計計算**はPostgreSQL集計関数を活用
5. **TDD**でRed-Green-Refactorサイクルを遵守

## Feature Status

**Current Branch**: `002-poker-session-tracker`

**Implementation Phase**: Planning complete, implementation not started

**Priority Order**:
1. P1: セッション記録(MVP)
2. P2: 履歴・統計表示
3. P3: メモ機能
4. P4: フィルタリング

## Related Documentation

- **Spec**: `specs/002-poker-session-tracker/spec.md`
- **Plan**: `specs/002-poker-session-tracker/plan.md`
- **Research**: `specs/002-poker-session-tracker/research.md`
- **Data Model**: `specs/002-poker-session-tracker/data-model.md`
- **API Contract**: `specs/002-poker-session-tracker/contracts/sessions-api.md`
- **Quickstart**: `specs/002-poker-session-tracker/quickstart.md`

---

**Note**: This context file is auto-generated by the `/speckit.plan` command and should be updated when new features are added or technologies change.
