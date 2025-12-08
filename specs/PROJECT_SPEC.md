# Sapphire プロジェクト仕様書

**Version**: 1.0.0
**Last Updated**: 2025-12-07
**Status**: Active Development

---

## 1. プロジェクト概要

### 1.1 プロジェクト名
**Sapphire** - ポーカーセッショントラッカー

### 1.2 プロジェクト説明
Sapphireは、ポーカープレイヤーのためのセッション記録・分析アプリケーションです。プレイしたセッションを記録し、統計を分析することで、パフォーマンスの向上をサポートします。

特に日本のアミューズメントポーカー市場をターゲットとしており、独自の通貨システム（チップ、ポイント）に対応しています。

### 1.3 ターゲットユーザー
- **主要**: 日本のポーカープレイヤー（アミューズメントポーカー店舗利用者）
- **副次**: オンラインポーカープレイヤー、海外カジノ利用者

### 1.4 プロジェクト沿革

| Version | Branch | 概要 | Status |
|---------|--------|------|--------|
| 001 | `001-todo-app` | 初期テンプレート（Todoアプリ） | 削除済み |
| 002 | `002-poker-session-tracker` | ポーカーセッショントラッカー基盤 | 完了 |
| 003 | `003-session-enhancements` | セッション機能強化 | 完了 |
| 004 | `004-rebrand-to-sapphire` | Sapphireへのリブランディング | 完了 |
| 005 | `005-refactor-auth-testing` | 認証とテスト基盤 | 完了 |
| 006 | `006-page-structure-refactor` | ページ構造リファクタリング | 完了 |
| 007 | `007-store-currency-games` | 通貨・ゲーム登録機能 | 開発中 |

---

## 2. 技術スタック

### 2.1 コアテクノロジー

| レイヤー | 技術 | バージョン |
|---------|------|-----------|
| **言語** | TypeScript | 5.9 |
| **フレームワーク** | Next.js (App Router) | 15 |
| **UIライブラリ** | Mantine | 8 |
| **バックエンドAPI** | tRPC | 11 |
| **ORM** | Drizzle ORM | 0.41 |
| **データベース** | PostgreSQL | 16 |
| **認証** | NextAuth.js | 5 |
| **ランタイム** | Bun | 1.0+ |

### 2.2 フロントエンド

| カテゴリ | 技術 |
|---------|------|
| **UIフレームワーク** | React 19 |
| **状態管理** | TanStack Query v5 |
| **アイコン** | @tabler/icons-react |
| **リッチテキスト** | TipTap |

### 2.3 テスト

| カテゴリ | 技術 |
|---------|------|
| **単体・契約テスト** | Vitest v2 |
| **コンポーネントテスト** | React Testing Library |
| **E2Eテスト** | Playwright v1 |

### 2.4 開発ツール

| カテゴリ | 技術 |
|---------|------|
| **リント・フォーマット** | Biome |
| **コンテナ** | Docker Compose |
| **バリデーション** | Zod v3 |
| **パスワードハッシュ** | bcryptjs |

---

## 3. アーキテクチャ

### 3.1 全体構成

```
┌─────────────────────────────────────────────────────────────┐
│                     Client (Browser)                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Next.js App Router                      │   │
│  │  ┌──────────────┐  ┌───────────────────────────┐   │   │
│  │  │ Presentation │  │       Container           │   │   │
│  │  │   (UI)       │◄─│ (State + API Calls)       │   │   │
│  │  └──────────────┘  └───────────────────────────┘   │   │
│  │                              │                      │   │
│  │                    TanStack Query                   │   │
│  │                              │                      │   │
│  └──────────────────────────────┼──────────────────────┘   │
│                                 │ tRPC Client               │
└─────────────────────────────────┼───────────────────────────┘
                                  │
                                  │ HTTP (JSON-RPC)
                                  │
┌─────────────────────────────────┼───────────────────────────┐
│                     Server (Next.js API)                    │
│  ┌──────────────────────────────┼──────────────────────┐   │
│  │                    tRPC Router                       │   │
│  │  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ │   │
│  │  │sessions │ │locations │ │ tags     │ │ auth    │ │   │
│  │  └────┬────┘ └────┬─────┘ └────┬─────┘ └────┬────┘ │   │
│  │       │           │            │            │       │   │
│  │       └───────────┴────────────┴────────────┘       │   │
│  │                         │                            │   │
│  │                   Drizzle ORM                        │   │
│  │                         │                            │   │
│  └─────────────────────────┼────────────────────────────┘   │
│                            │                                │
└────────────────────────────┼────────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    │   PostgreSQL    │
                    │   (Docker)      │
                    └─────────────────┘
```

### 3.2 レイヤー構成 (Presentation/Container分離パターン)

#### API層 (`src/server/`)
- ビジネスロジック
- データアクセス（Drizzle ORM）
- バリデーション（Zod）
- 認証・認可

#### Container層 (`src/features/*/containers/`)
- 状態管理
- API呼び出し（tRPC hooks）
- ビジネスロジックの調整

#### Presentation層 (`src/features/*/components/`)
- UIコンポーネント
- 表示のみ
- propsのみに依存

### 3.3 ディレクトリ構造

```
sapphire/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── layout.tsx             # ルートレイアウト
│   │   ├── page.tsx               # ダッシュボード
│   │   ├── manifest.ts            # PWA manifest
│   │   ├── auth/                  # 認証ページ
│   │   │   ├── signin/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── poker-sessions/        # セッション管理
│   │   │   ├── page.tsx           # 一覧
│   │   │   ├── new/page.tsx       # 新規作成
│   │   │   └── [id]/
│   │   │       ├── page.tsx       # 詳細
│   │   │       └── edit/page.tsx  # 編集
│   │   ├── locations/             # 店舗管理
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── settings/              # 設定
│   │   │   └── currencies/page.tsx
│   │   └── api/trpc/[trpc]/route.ts
│   │
│   ├── server/                     # バックエンド
│   │   ├── api/
│   │   │   ├── routers/
│   │   │   │   ├── sessions.ts
│   │   │   │   ├── locations.ts
│   │   │   │   ├── tags.ts
│   │   │   │   ├── currencies.ts  # 007で追加
│   │   │   │   └── games.ts       # 007で追加
│   │   │   ├── root.ts
│   │   │   └── trpc.ts
│   │   └── db/
│   │       ├── schema.ts
│   │       └── index.ts
│   │
│   ├── features/                   # フロントエンド機能
│   │   ├── layout/                # AppShellレイアウト
│   │   ├── dashboard/             # ダッシュボード
│   │   ├── poker-sessions/        # セッション機能
│   │   │   ├── components/
│   │   │   ├── containers/
│   │   │   └── hooks/
│   │   ├── locations/             # 店舗機能
│   │   ├── currencies/            # 通貨機能 (007)
│   │   └── games/                 # ゲーム機能 (007)
│   │
│   └── lib/
│       ├── trpc/                  # tRPCクライアント
│       └── utils/
│           ├── currency.ts
│           └── game.ts
│
├── tests/
│   ├── contract/                  # API契約テスト
│   ├── components/                # コンポーネントテスト
│   └── e2e/                       # E2Eテスト
│
├── specs/                         # 機能仕様書
│   ├── 001-todo-app/             # (歴史的参照)
│   ├── 002-poker-session-tracker/
│   ├── 003-session-enhancements/
│   ├── 004-rebrand-to-sapphire/
│   ├── 005-refactor-auth-testing/
│   ├── 006-page-structure-refactor/
│   └── 007-store-currency-games/
│
└── .specify/
    └── memory/
        └── constitution.md        # プロジェクト憲法
```

---

## 4. データモデル

### 4.1 エンティティ関係図 (ERD)

```
┌─────────────┐
│    User     │
├─────────────┤
│ id (PK)     │
│ name        │
│ email       │
│ password    │◄─ nullable (OAuth users)
│ createdAt   │
└──────┬──────┘
       │
       │ 1:N
       ▼
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │  Location   │    │  Currency   │    │    Tag      │  │
│  ├─────────────┤    ├─────────────┤    ├─────────────┤  │
│  │ id (PK)     │    │ id (PK)     │    │ id (PK)     │  │
│  │ userId (FK) │    │ userId (FK) │    │ userId (FK) │  │
│  │ name        │    │ name        │    │ name        │  │
│  │ createdAt   │    │ createdAt   │    │ createdAt   │  │
│  │ updatedAt   │    │ updatedAt   │    │ updatedAt   │  │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘  │
│         │                  │                   │         │
│         │ 1:N              │ 1:N               │ N:M     │
│         ▼                  │                   │         │
│  ┌─────────────┐           │                   │         │
│  │    Game     │◄──────────┘                   │         │
│  ├─────────────┤                               │         │
│  │ id (PK)     │                               │         │
│  │ locationId  │                               │         │
│  │ currencyId  │                               │         │
│  │ name        │                               │         │
│  │ smallBlind  │                               │         │
│  │ bigBlind    │                               │         │
│  │ ante        │                               │         │
│  │ minBuyIn    │                               │         │
│  │ maxBuyIn    │                               │         │
│  │ rules       │◄─ HTML                        │         │
│  │ isArchived  │                               │         │
│  │ createdAt   │                               │         │
│  │ updatedAt   │                               │         │
│  └──────┬──────┘                               │         │
│         │                                      │         │
│         │ 1:N                                  │         │
│         ▼                                      ▼         │
│  ┌─────────────┐                        ┌────────────┐  │
│  │PokerSession │◄───────────────────────│SessionTag  │  │
│  ├─────────────┤                        ├────────────┤  │
│  │ id (PK)     │                        │ sessionId  │  │
│  │ userId (FK) │                        │ tagId      │  │
│  │ locationId  │                        └────────────┘  │
│  │ gameId      │◄─ nullable                             │
│  │ playedAt    │                                        │
│  │ duration    │                                        │
│  │ buyIn       │                                        │
│  │ cashOut     │                                        │
│  │ notes       │◄─ HTML                                 │
│  │ createdAt   │                                        │
│  │ updatedAt   │                                        │
│  └─────────────┘                                        │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 4.2 テーブル定義

#### users
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR(255) | PK | ユーザーID |
| name | VARCHAR(255) | | 表示名 |
| email | VARCHAR(255) | UNIQUE | メールアドレス |
| emailVerified | TIMESTAMP | | メール確認日時 |
| password | VARCHAR(255) | | ハッシュ化パスワード (OAuth時null) |
| image | TEXT | | プロフィール画像URL |
| createdAt | TIMESTAMP | NOT NULL | 作成日時 |
| updatedAt | TIMESTAMP | NOT NULL | 更新日時 |

#### locations
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PK | 店舗ID |
| userId | VARCHAR(255) | FK → users.id | 所有者 |
| name | VARCHAR(100) | NOT NULL | 店舗名 |
| createdAt | TIMESTAMP | NOT NULL | 作成日時 |
| updatedAt | TIMESTAMP | NOT NULL | 更新日時 |

#### tags
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PK | タグID |
| userId | VARCHAR(255) | FK → users.id | 所有者 |
| name | VARCHAR(50) | NOT NULL | タグ名 |
| createdAt | TIMESTAMP | NOT NULL | 作成日時 |
| updatedAt | TIMESTAMP | NOT NULL | 更新日時 |

#### currencies (007で追加)
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PK | 通貨ID |
| userId | VARCHAR(255) | FK → users.id | 所有者 |
| name | VARCHAR(100) | NOT NULL, UNIQUE per user | 通貨名 |
| createdAt | TIMESTAMP | NOT NULL | 作成日時 |
| updatedAt | TIMESTAMP | NOT NULL | 更新日時 |

#### games (007で追加)
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PK | ゲームID |
| locationId | INTEGER | FK → locations.id | 店舗 |
| currencyId | INTEGER | FK → currencies.id | 通貨 |
| name | VARCHAR(100) | NOT NULL | ゲーム名 |
| smallBlind | INTEGER | NOT NULL | SB |
| bigBlind | INTEGER | NOT NULL | BB |
| ante | INTEGER | DEFAULT 0 | アンティ |
| minBuyIn | INTEGER | NOT NULL | 最小バイイン (BB単位) |
| maxBuyIn | INTEGER | NOT NULL | 最大バイイン (BB単位) |
| rules | TEXT | | その他ルール (HTML) |
| isArchived | BOOLEAN | DEFAULT FALSE | アーカイブ状態 |
| createdAt | TIMESTAMP | NOT NULL | 作成日時 |
| updatedAt | TIMESTAMP | NOT NULL | 更新日時 |

#### poker_sessions
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PK | セッションID |
| userId | VARCHAR(255) | FK → users.id | 所有者 |
| locationId | INTEGER | FK → locations.id | 店舗 |
| gameId | INTEGER | FK → games.id, NULL | ゲーム (007で追加) |
| playedAt | TIMESTAMP | NOT NULL | プレイ日時 |
| duration | INTEGER | NOT NULL | プレイ時間 (分) |
| buyIn | INTEGER | NOT NULL | バイイン |
| cashOut | INTEGER | NOT NULL | キャッシュアウト |
| notes | TEXT | | メモ (HTML) |
| createdAt | TIMESTAMP | NOT NULL | 作成日時 |
| updatedAt | TIMESTAMP | NOT NULL | 更新日時 |

#### session_tags
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| sessionId | INTEGER | PK, FK → poker_sessions.id | セッション |
| tagId | INTEGER | PK, FK → tags.id | タグ |

---

## 5. 機能仕様

### 5.1 認証機能

#### 対応認証方式
1. **Google OAuth 2.0**
2. **GitHub OAuth**
3. **メールアドレス/パスワード認証 (Credentials)**

#### アカウントリンク
- 同一メールアドレスでの登録は単一ユーザーとして扱う
- 複数の認証方法をリンク可能

#### 機能要件
| ID | 要件 |
|----|------|
| AUTH-001 | OAuth2プロバイダー（Google/GitHub）でのサインイン |
| AUTH-002 | 初回OAuth2サインイン時の自動アカウント作成 |
| AUTH-003 | メールアドレス/パスワードでの登録・ログイン |
| AUTH-004 | パスワード強度要件（8文字以上） |
| AUTH-005 | パスワードのbcryptハッシュ化 |
| AUTH-006 | セッション状態の維持（ページリフレッシュ対応） |
| AUTH-007 | ログアウト機能 |
| AUTH-008 | 認証エラーメッセージの表示（セキュリティ配慮） |

### 5.2 セッション管理機能

#### 基本機能
| ID | 要件 |
|----|------|
| SESSION-001 | セッションの作成（日時、店舗、バイイン、キャッシュアウト、プレイ時間） |
| SESSION-002 | セッション一覧の表示（日付順ソート） |
| SESSION-003 | セッション詳細の表示 |
| SESSION-004 | セッションの編集 |
| SESSION-005 | セッションの削除（確認ダイアログ付き） |
| SESSION-006 | 収支の自動計算（キャッシュアウト - バイイン） |
| SESSION-007 | リッチテキストメモ（TipTapエディタ、HTML保存） |
| SESSION-008 | タグの複数設定 |
| SESSION-009 | ゲームの選択（007で追加、任意） |

#### フィルタリング
| ID | 要件 |
|----|------|
| FILTER-001 | 日付範囲によるフィルター |
| FILTER-002 | 店舗によるフィルター |
| FILTER-003 | タグによるフィルター（AND条件） |
| FILTER-004 | ゲームによるフィルター（007で追加） |
| FILTER-005 | 通貨によるフィルター（007で追加） |

### 5.3 統計・分析機能

| ID | 要件 |
|----|------|
| STATS-001 | 総収支の表示 |
| STATS-002 | 総セッション数の表示 |
| STATS-003 | 平均収支の表示 |
| STATS-004 | 勝率の表示 |
| STATS-005 | 店舗別統計 |
| STATS-006 | ゲーム別統計（007で追加） |
| STATS-007 | 通貨別統計（007で追加） |
| STATS-008 | BB単位での収支表示（007で追加） |

### 5.4 店舗管理機能

| ID | 要件 |
|----|------|
| LOCATION-001 | 店舗の作成 |
| LOCATION-002 | 店舗一覧の表示（ゲーム数、セッション数付き） |
| LOCATION-003 | 店舗詳細の表示（ゲーム一覧付き） |
| LOCATION-004 | 店舗名の編集 |
| LOCATION-005 | 店舗の削除（セッション紐付き時は防止） |
| LOCATION-006 | 店舗オートコンプリート |

### 5.5 タグ管理機能

| ID | 要件 |
|----|------|
| TAG-001 | タグの作成 |
| TAG-002 | タグ一覧の表示 |
| TAG-003 | タグの削除 |
| TAG-004 | タグオートコンプリート |
| TAG-005 | 大文字小文字を区別しない重複防止 |

### 5.6 通貨管理機能 (007)

| ID | 要件 |
|----|------|
| CURRENCY-001 | 通貨の作成 |
| CURRENCY-002 | 通貨一覧の表示 |
| CURRENCY-003 | 通貨名の編集 |
| CURRENCY-004 | 通貨の削除（ゲーム紐付き時は防止） |
| CURRENCY-005 | ユーザー内での一意性保証 |
| CURRENCY-006 | 複数店舗での共有利用 |

### 5.7 ゲーム管理機能 (007)

| ID | 要件 |
|----|------|
| GAME-001 | ゲームの作成（店舗詳細ページから） |
| GAME-002 | ゲーム情報の登録（名前、通貨、SB/BB/Ante、min/max buy-in、ルール） |
| GAME-003 | ゲーム一覧の表示（店舗別） |
| GAME-004 | ゲームの編集 |
| GAME-005 | ゲームのアーカイブ |
| GAME-006 | アーカイブ解除 |
| GAME-007 | ゲームの削除（セッション紐付き時は防止） |
| GAME-008 | バリデーション（SB ≤ BB、min ≤ max） |

### 5.8 ナビゲーション・レイアウト

| ID | 要件 |
|----|------|
| NAV-001 | Mantine AppShellによるサイドバーナビゲーション |
| NAV-002 | デスクトップ: 常時展開サイドバー |
| NAV-003 | モバイル: ハンバーガーメニュー |
| NAV-004 | 現在ページのハイライト表示 |
| NAV-005 | 認証ページはサイドバーなし |
| NAV-006 | ダッシュボードへのクイックアクセス |

---

## 6. API仕様 (tRPC)

### 6.1 ルーター一覧

| Router | 概要 |
|--------|------|
| `sessions` | セッションCRUD |
| `locations` | 店舗CRUD |
| `tags` | タグCRUD |
| `currencies` | 通貨CRUD (007) |
| `games` | ゲームCRUD (007) |

### 6.2 sessions Router

```typescript
sessions.create       // セッション作成
sessions.getAll       // 全セッション取得
sessions.getById      // ID指定取得
sessions.getFiltered  // フィルタリング取得
sessions.getStats     // 統計取得
sessions.update       // 更新
sessions.delete       // 削除
```

### 6.3 locations Router

```typescript
locations.create      // 店舗作成
locations.getAll      // 全店舗取得
locations.getById     // ID指定取得
locations.update      // 更新
locations.delete      // 削除
locations.checkUsage  // 使用状況確認
```

### 6.4 tags Router

```typescript
tags.create           // タグ作成
tags.getAll           // 全タグ取得
tags.delete           // 削除
```

### 6.5 currencies Router (007)

```typescript
currencies.create     // 通貨作成
currencies.getAll     // 全通貨取得
currencies.getById    // ID指定取得
currencies.update     // 更新
currencies.delete     // 削除
currencies.checkUsage // 使用状況確認
```

### 6.6 games Router (007)

```typescript
games.create               // ゲーム作成
games.getAll               // 全ゲーム取得
games.getByLocation        // 店舗別取得
games.getActiveByLocation  // アクティブゲーム取得
games.getById              // ID指定取得
games.update               // 更新
games.archive              // アーカイブ
games.unarchive            // アーカイブ解除
games.delete               // 削除
games.checkUsage           // 使用状況確認
```

---

## 7. UI/UXガイドライン

### 7.1 デザインシステム

- **UIライブラリ**: Mantine v8
- **アイコン**: @tabler/icons-react
- **リッチテキスト**: TipTap

### 7.2 コンポーネント使用規則

| 用途 | コンポーネント |
|------|---------------|
| **フォーム** | TextInput, NumberInput, DateTimePicker, Textarea, Select |
| **表示** | Card, Badge, Table, Stack, Tabs |
| **アクション** | Button, Modal (削除確認のみ) |
| **レイアウト** | Grid, Container, AppShell |

### 7.3 レスポンシブデザイン

| 画面サイズ | レイアウト |
|-----------|-----------|
| デスクトップ (1024px+) | Gridレイアウト、サイドバー常時展開 |
| タブレット (768-1023px) | 2カラム |
| モバイル (375-767px) | 1カラム + Stack、ハンバーガーメニュー |

### 7.4 アクセシビリティ

- **基準**: WCAG 2.1 AA準拠
- **カラーコントラスト**: 4.5:1以上
- **フォーム**: 全入力にlabel付与
- **エラー**: aria-live使用
- **キーボード**: 完全ナビゲーション対応

---

## 8. テスト戦略

### 8.1 テスト種別

| 種別 | ツール | 対象 | ファイル |
|------|--------|------|----------|
| **API契約テスト** | Vitest | tRPC procedures | `tests/contract/*.test.ts` |
| **コンポーネントテスト** | Vitest + RTL | Presentationコンポーネント | `tests/components/*.test.tsx` |
| **E2Eテスト** | Playwright | ユーザーフロー全体 | `tests/e2e/*.spec.ts` |

### 8.2 テスト方針

- **TDD必須**: Red → Green → Refactor サイクルを厳守
- **テストファースト**: 実装前にテストを作成
- **カバレッジ目標**: 主要コンポーネント80%以上

### 8.3 E2Eテスト認証

- メール/パスワード認証を使用
- テストユーザーを使用してログイン
- 認証状態をPlaywright storageで維持

---

## 9. 開発ワークフロー

### 9.1 コマンド一覧

```bash
# 開発
bun run dev              # 開発サーバー起動
bun run build            # プロダクションビルド
bun run preview          # プロダクションプレビュー

# テスト
bun run test             # Vitest実行
bun run test:e2e         # Playwright実行
bun run test:e2e:ui      # Playwright UI

# データベース
bun run db:push          # 本番DBスキーマ適用
bun run db:push:test     # テストDBスキーマ適用
bun run db:push:all      # 両方適用
bun run db:studio        # Drizzle Studio

# コード品質
bun run check            # リント・フォーマットチェック
bun run check:write      # 自動修正
bun run typecheck        # 型チェック
```

### 9.2 仕様策定ワークフロー (spec-kit)

```bash
/speckit.specify         # 仕様作成・更新
/speckit.clarify         # 不明点の明確化
/speckit.plan            # 実装計画策定
/speckit.analyze         # 成果物の一貫性分析
/speckit.tasks           # タスクリスト生成
/speckit.implement       # 実装実行
```

---

## 10. プロジェクト憲法 (抜粋)

### 10.1 コア原則

| # | 原則 | 概要 |
|---|------|------|
| I | **テスト駆動開発の徹底** | TDD必須、Red-Green-Refactorサイクル厳守 |
| II | **仕様の明確化** | 不明確な要件は実装前に明確化 |
| III | **日本語ファースト** | UI、ドキュメント、エラーメッセージは日本語 |
| IV | **レイヤーの責務分離** | API/Container/Presentation分離 |
| V | **コードレビュー** | こまめなレビューと承認後コミット |
| VI | **ユーザー体験の一貫性** | デザインシステム活用、アクセシビリティ遵守 |
| VII | **潤沢なドキュメンテーション** | ユーザーガイド、クイックスタート、FAQ整備 |

### 10.2 NON-NEGOTIABLE項目

- **TDD**: テストファーストは絶対条件
- **日本語**: UIとドキュメントは必ず日本語

---

## 11. 成功基準

### 11.1 パフォーマンス

| ID | 基準 |
|----|------|
| PERF-001 | ダッシュボード初期表示 < 2秒 |
| PERF-002 | ページ間遷移 < 500ms |
| PERF-003 | セッション記録完了 < 60秒 |
| PERF-004 | 店舗選択後ゲーム一覧表示 < 1秒 |
| PERF-005 | フィルタリング結果表示 < 1秒 (1000件) |

### 11.2 スケーラビリティ

| ID | 基準 |
|----|------|
| SCALE-001 | 1000セッション/ユーザーでも性能劣化なし |
| SCALE-002 | 100通貨、100店舗、50ゲーム/店舗で性能劣化なし |

### 11.3 品質

| ID | 基準 |
|----|------|
| QUALITY-001 | E2Eテストカバレッジ 80%以上 |
| QUALITY-002 | コンポーネントテストカバレッジ 80%以上 |
| QUALITY-003 | XSS攻撃成功率 0% |
| QUALITY-004 | データ不整合率 0% |

---

## 12. 関連ドキュメント

| ドキュメント | パス | 概要 |
|-------------|------|------|
| CLAUDE.md | `/CLAUDE.md` | 開発コンテキスト |
| README.md | `/README.md` | クイックスタート |
| 憲法 | `/.specify/memory/constitution.md` | プロジェクト原則 |
| 002-spec | `/specs/002-poker-session-tracker/spec.md` | 基本機能仕様 |
| 003-spec | `/specs/003-session-enhancements/spec.md` | 機能強化仕様 |
| 005-spec | `/specs/005-refactor-auth-testing/spec.md` | 認証・テスト仕様 |
| 006-spec | `/specs/006-page-structure-refactor/spec.md` | ページ構造仕様 |
| 007-spec | `/specs/007-store-currency-games/spec.md` | 通貨・ゲーム仕様 |

---

## 付録A: 用語集

| 用語 | 説明 |
|------|------|
| **セッション** | 1回のポーカープレイ記録 |
| **バイイン** | セッション開始時の持ち込み額 |
| **キャッシュアウト** | セッション終了時の持ち帰り額 |
| **収支** | キャッシュアウト - バイイン |
| **BB** | ビッグブラインド（ステークスの単位） |
| **SB** | スモールブラインド |
| **Ante** | 強制ベット（BBとは別） |
| **アーカイブ** | 削除せずに非表示化 |
| **通貨** | 店舗で使用されるチップ/ポイント単位 |
| **ゲーム** | 特定のブラインド構造を持つポーカーゲーム |

---

## 付録B: 変更履歴

| 日付 | バージョン | 変更内容 |
|------|-----------|----------|
| 2025-12-07 | 1.0.0 | 初版作成（001-007の統合） |

---

**Document End**
