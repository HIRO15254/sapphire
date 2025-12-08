# Claude Code Context: Poker Session Tracker

**Last Updated**: 2025-12-05 (auto-generated via /speckit.plan)
**Feature**: 007-store-currency-games

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
- NextAuth.js v5 (認証: OAuth + Credentials)
- bcryptjs (パスワードハッシュ化)
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
│   ├── settings/
│   │   └── currencies/         # 通貨管理ページ (新規追加予定)
│   │       └── page.tsx
│   └── api/trpc/[trpc]/route.ts
│
├── server/                     # バックエンド(API層)
│   ├── api/
│   │   ├── routers/
│   │   │   ├── sessions.ts     # ポーカーセッションAPI
│   │   │   ├── currencies.ts   # 通貨API (新規追加予定)
│   │   │   └── games.ts        # ゲームAPI (新規追加予定)
│   │   ├── root.ts
│   │   └── trpc.ts
│   └── db/
│       ├── schema.ts           # currencies, games テーブル追加予定
│       └── index.ts
│
├── features/                   # フロントエンド機能
│   ├── poker-sessions/
│   │   ├── components/         # Presentationコンポーネント
│   │   ├── containers/         # Containerコンポーネント
│   │   └── hooks/
│   ├── currencies/             # 通貨機能 (新規追加予定)
│   │   ├── components/
│   │   ├── containers/
│   │   └── hooks/
│   └── games/                  # ゲーム機能 (新規追加予定)
│       ├── components/
│       ├── containers/
│       └── hooks/
│
└── lib/
    └── utils/
        ├── currency.ts
        └── game.ts             # ゲーム表示ヘルパー (新規追加予定)

tests/
├── contract/              # API契約テスト
│   ├── sessions.test.ts
│   ├── locations.test.ts
│   ├── tags.test.ts
│   ├── currencies.test.ts      # (新規追加予定)
│   └── games.test.ts           # (新規追加予定)
└── e2e/                   # E2Eテスト
    ├── currencies.spec.ts      # (新規追加予定)
    └── games.spec.ts           # (新規追加予定)
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

### Testing Strategy

**テスト方針（プロジェクト全体）**:

このプロジェクトでは、以下の3種類のテストを実施します：

1. **API契約テスト** (Vitest): tRPC proceduresの入出力検証
   - ファイル: `tests/contract/*.test.ts`
   - 対象: バックエンドAPI層（`src/server/api/routers/`）
   - 目的: APIの仕様が正しく実装されているか検証

2. **フロントエンドコンポーネントテスト** (Vitest + React Testing Library)
   - ファイル: `tests/components/*.test.tsx`
   - 対象: Presentationコンポーネント（`src/features/*/components/`）
   - 目的: UIコンポーネントが正しく表示・動作するか検証
   - Containerコンポーネントはモック化したAPI応答を使用してテスト

3. **E2Eテスト** (Playwright)
   - ファイル: `tests/e2e/*.spec.ts`
   - 対象: アプリケーション全体のユーザーフロー
   - 目的: 実際のブラウザで主要機能が正しく動作するか検証
   - メール/パスワード認証を使用してテストユーザーでログイン

**実施しないテスト**:

- ❌ **統合テスト**: APIとフロントエンドを繋ぐテスト（E2Eテストでカバー）

**理由**: API層とフロントエンド層を分離してテストしつつ、E2Eテストでエンドツーエンドの動作を保証します。

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

### 既存テーブル

| Table | Description |
|-------|-------------|
| users | ユーザー情報 |
| locations | 店舗情報 |
| tags | タグ情報 |
| poker_sessions | セッション情報 |
| session_tags | セッション-タグ中間テーブル |

### 新規テーブル (007-store-currency-games)

#### currencies テーブル

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | 主キー (自動採番) |
| userId | VARCHAR(255) | ユーザーID (外部キー → users.id) |
| name | VARCHAR(100) | 通貨名 |
| createdAt | TIMESTAMP | 作成日時 |
| updatedAt | TIMESTAMP | 更新日時 |

**リレーション**: User → Currency (1対多、店舗から独立)

#### games テーブル

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | 主キー (自動採番) |
| locationId | INTEGER | 店舗ID (外部キー → locations.id) |
| currencyId | INTEGER | 通貨ID (外部キー → currencies.id) |
| name | VARCHAR(100) | ゲーム名 |
| smallBlind | INTEGER | スモールブラインド |
| bigBlind | INTEGER | ビッグブラインド |
| ante | INTEGER | アンティ (0=なし) |
| minBuyIn | INTEGER | 最小バイイン (BB単位) |
| maxBuyIn | INTEGER | 最大バイイン (BB単位) |
| rules | TEXT | その他のルール (HTML) |
| isArchived | BOOLEAN | アーカイブ状態 |
| createdAt | TIMESTAMP | 作成日時 |
| updatedAt | TIMESTAMP | 更新日時 |

**リレーション**:
- Location → Game (1対多)
- Currency → Game (1対多)

#### poker_sessions テーブル変更

| Column | Type | Description |
|--------|------|-------------|
| gameId | INTEGER (nullable) | ゲームID (外部キー → games.id) **新規追加** |

## API Contract (tRPC)

### 既存ルーター

- `sessions`: セッション管理
- `locations`: 店舗管理
- `tags`: タグ管理

### 新規ルーター (007-store-currency-games)

#### currencies Router

```typescript
export const currenciesRouter = createTRPCRouter({
  create: protectedProcedure.input(createCurrencySchema).mutation(...),
  getAll: protectedProcedure.query(...),
  getById: protectedProcedure.input(getByIdSchema).query(...),
  update: protectedProcedure.input(updateCurrencySchema).mutation(...),
  delete: protectedProcedure.input(deleteCurrencySchema).mutation(...),
  checkUsage: protectedProcedure.input(checkUsageSchema).query(...),
});
```

#### games Router

```typescript
export const gamesRouter = createTRPCRouter({
  create: protectedProcedure.input(createGameSchema).mutation(...),
  getAll: protectedProcedure.input(getAllGamesSchema).query(...),
  getByLocation: protectedProcedure.input(getByLocationSchema).query(...),
  getActiveByLocation: protectedProcedure.input(getActiveByLocationSchema).query(...),
  getById: protectedProcedure.input(getByIdSchema).query(...),
  update: protectedProcedure.input(updateGameSchema).mutation(...),
  archive: protectedProcedure.input(archiveGameSchema).mutation(...),
  unarchive: protectedProcedure.input(unarchiveGameSchema).mutation(...),
  delete: protectedProcedure.input(deleteGameSchema).mutation(...),
  checkUsage: protectedProcedure.input(checkUsageSchema).query(...),
});
```

#### sessions Router 拡張

- `create`: `gameId` パラメータ追加 (nullable)
- `update`: `gameId` パラメータ追加 (nullable)
- `getFiltered`: `gameIds`, `currencyIds` フィルター追加
- `getStats`: ゲーム別・通貨別統計追加

## UI/UX Guidelines

### Mantine Components

- **Forms**: `TextInput`, `NumberInput`, `DateTimePicker`, `Textarea`, `Select`
- **Display**: `Card`, `Badge`, `Table`, `Stack`, `Tabs`
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

## Performance Requirements

**Success Criteria**:
- SC-001: 通貨登録 < 60秒
- SC-002: ゲーム登録 < 120秒
- SC-003: 店舗選択後、ゲーム一覧表示 < 1秒
- SC-005: 100通貨、100店舗、各店舗50ゲームで性能劣化なし

**Strategies**:
- インデックス: userId, locationId, currencyId
- キャッシュ: TanStack Query でキャッシュ管理
- 遅延読み込み: ゲーム一覧は店舗選択時に取得

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
- **contracts/**: API契約定義
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
6. **通貨を店舗の子エンティティにする** → 通貨は店舗から独立

### ✅ Best Practices

1. **Presentation/Container分離**を厳密に守る
2. **Zodスキーマ**をフロントエンド・バックエンドで共有
3. **楽観的更新**でUXを向上
4. **統計計算**はPostgreSQL集計関数を活用
5. **TDD**でRed-Green-Refactorサイクルを遵守
6. **アーカイブ > 削除**: 使用中のゲームは削除ではなくアーカイブ

## Feature Status

**Current Branch**: `007-store-currency-games`

**Implementation Phase**: Planning complete, implementation not started

**Priority Order**:
1. P1: 通貨管理機能 (currencies テーブル、API、UI)
2. P2: ゲーム管理機能 (games テーブル、API、UI)
3. P3: セッション記録拡張 (gameId 追加、フォーム変更)
4. P4: 統計機能拡張 (ゲーム別・通貨別統計)

## Related Documentation

- **Spec**: `specs/007-store-currency-games/spec.md`
- **Plan**: `specs/007-store-currency-games/plan.md`
- **Research**: `specs/007-store-currency-games/research.md`
- **Data Model**: `specs/007-store-currency-games/data-model.md`
- **API Contracts**: `specs/007-store-currency-games/contracts/`
- **Quickstart**: `specs/007-store-currency-games/quickstart.md`

---

**Note**: This context file is auto-generated by the `/speckit.plan` command and should be updated when new features are added or technologies change.
