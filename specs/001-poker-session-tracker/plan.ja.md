# 実装計画: ライブポーカーセッショントラッカー

**ブランチ**: `001-poker-session-tracker` | **作成日**: 2025-12-12 | **仕様書**: [spec.md](./spec.md)
**入力**: `/specs/001-poker-session-tracker/spec.md` の機能仕様書

---

## 概要

日本のアミューズメントポーカー施設向けのセッション・ハンド記録アプリケーション。ユーザーはセッション（アーカイブまたはリアルタイム）の記録、施設固有の仮想通貨の管理、対戦相手情報の追跡、パフォーマンス分析が可能。T3スタックとPostgreSQLを使用し、NextAuth.jsによる認証（メール/パスワード + Google/Discord OAuth）を実装。日本語UIのPWAとしてレスポンシブデザインで提供。

---

## 技術コンテキスト

| 項目 | 内容 |
|------|------|
| **言語/バージョン** | TypeScript (strict mode) |
| **フレームワーク** | T3スタック (Next.js, tRPC, Drizzle ORM, NextAuth.js) |
| **UIライブラリ** | Mantine v8 |
| **ストレージ** | Drizzle ORM + PostgreSQL（クラウド永続化） |
| **テスト** | Vitest（単体/統合）、Playwright（E2E） |
| **ターゲット** | Web (Next.js App Router) + PWA |
| **パフォーマンス目標** | 3Gで2秒以内のページ読み込み、100ms以内のテーマ切替、1,000同時ユーザー対応 |
| **制約** | 日本語UIのみ、NLHEゲームのみ、初期リリースではデータエクスポート無し |
| **規模** | 12以上のエンティティ、3つのOAuthプロバイダー、PWA対応、オフライン機能 |

---

## 憲章チェック

### 事前チェック（Phase 0前）

| 原則 | ゲート | 状態 |
|------|--------|------|
| 技術スタック | T3スタック (Next.js, tRPC, Drizzle, NextAuth) + Mantine v8を使用 | ✅ |
| アーキテクチャ | 3層構造（プレゼンテーション→アプリケーション→インフラ） | ✅ |
| 依存方向 | 上位層は下位層にのみ依存、逆依存なし | ✅ |
| tRPC通信 | プレゼンテーション層はtRPCのみでアプリケーション層と通信 | ✅ |
| モジュール独立性 | 機能は自己完結、外部サービス障害は分離 | ✅ |
| TDD準拠 | テスト先行、Red-Green-Refactorサイクル計画済み | ✅ |
| 言語ルール | UI文字は日本語、識別子は英語 | ✅ |
| データ永続化 | ユーザーデータはクラウドに永続化、マルチデバイス同期対応 | ✅ |
| UI/UX | Mantineデフォルトに従う、カスタムデザイントークンなし | ✅ |
| Gitワークフロー | devからフィーチャーブランチ作成、PR必須、レビュー必須 | ✅ |

### 事後チェック（Phase 1設計完了後）

| 原則 | 検証内容 | 状態 |
|------|----------|------|
| 技術スタック | Next.js 15, tRPC v11, Drizzle ORM, NextAuth.js v5, Mantine v8を使用 | ✅ |
| アーキテクチャ | データモデルは3層構造: UIコンポーネント→tRPCルーター→Drizzleスキーマ | ✅ |
| 依存方向 | tRPCルーターはDrizzleスキーマに依存、逆依存なし | ✅ |
| tRPC通信 | 全APIコントラクトはtRPCプロシージャとして定義、生のRESTエンドポイントなし | ✅ |
| モジュール独立性 | 各エンティティルーターは自己完結、オフラインキューがネットワーク障害を分離 | ✅ |
| TDD準拠 | quickstart.mdにテスト構造を定義、テストファイルはソース構造と並行 | ✅ |
| 言語ルール | UI文字は日本語（仕様書）、全スキーマ/API識別子は英語 | ✅ |
| データ永続化 | PostgreSQL + Drizzle、論理削除パターンでデータ保持、クラウドホスティング | ✅ |
| UI/UX | Mantineデフォルト使用、カスタムデザイントークンなし、createTheme()でテーマ設定 | ✅ |
| Gitワークフロー | フィーチャーブランチ001-poker-session-tracker、devへのPR必須 | ✅ |

---

## プロジェクト構造

### ドキュメント

```
specs/001-poker-session-tracker/
├── plan.md              # 実装計画（このファイルの英語版）
├── plan.ja.md           # 実装計画（日本語版）
├── research.md          # Phase 0: 技術調査結果
├── data-model.md        # Phase 1: データモデル定義
├── quickstart.md        # Phase 1: 開発セットアップガイド
├── contracts/           # Phase 1: APIコントラクト
│   └── trpc-api.md
└── tasks.md             # Phase 2: タスクリスト（/speckit.tasksで生成）
```

### ソースコード

```
src/
├── app/                    # Next.js App Router（プレゼンテーション層）
│   ├── (auth)/             # 認証必須ルート
│   │   ├── dashboard/      # ダッシュボード
│   │   ├── sessions/       # セッション管理
│   │   ├── currencies/     # 通貨管理
│   │   ├── stores/         # 店舗管理
│   │   └── players/        # プレイヤー管理
│   ├── api/                # APIルート
│   │   ├── auth/           # NextAuthハンドラー
│   │   └── trpc/           # tRPCハンドラー
│   ├── auth/               # 認証ページ（公開）
│   └── layout.tsx          # ルートレイアウト
├── components/             # 共有Reactコンポーネント
├── server/                 # サーバーサイドコード
│   ├── api/
│   │   ├── routers/        # tRPCルーター（アプリケーション層）
│   │   ├── schemas/        # Zodスキーマ
│   │   └── root.ts         # ルートルーター
│   ├── auth.ts             # NextAuth設定
│   └── db/
│       ├── schema/         # Drizzleスキーマ（インフラ層）
│       └── index.ts        # Drizzleクライアント
├── lib/                    # 共有ユーティリティ
└── trpc/                   # tRPCクライアント設定

tests/
├── unit/                   # Vitest単体テスト
├── integration/            # Vitest統合テスト
└── e2e/                    # Playwright E2Eテスト
```

---

## 技術決定事項

### 1. 認証: NextAuth.js + Drizzle ORM

**決定**: NextAuth.js v5 + `@auth/drizzle-adapter`、**データベースセッション**（JWTではない）

**理由**:
- マルチデバイス同期要件（施設でスマホ、自宅でデスクトップ）
- 即時セッション無効化（全デバイスからログアウト）
- ユーザーデータ変更（通貨残高、セッション結果）がトークン更新なしで反映
- 1,000同時ユーザーはデータベースセッションで十分対応可能

**設定**:
```typescript
session: {
  strategy: "database",
  maxAge: 30 * 24 * 60 * 60, // 30日
  updateAge: 24 * 60 * 60,   // 24時間ごとに更新
}
// プロバイダー: Google, Discord, Credentials（メール/パスワード）
// パスワードハッシュ: bcrypt（10ラウンド）
```

---

### 2. PWA実装

**決定**: `@ducanh2912/next-pwa` (v10+)

**理由**:
- Next.js 15 + App Router完全対応
- Workbox 7+による最新キャッシュ戦略
- アクティブにメンテナンス（オリジナルの`next-pwa`は非推奨）

**キャッシュ戦略**:

| コンテンツ種別 | 戦略 | キャッシュ期間 |
|----------------|------|----------------|
| 静的アセット（JS/CSS） | CacheFirst | 30日 |
| APIデータ（tRPC） | NetworkFirst（3秒タイムアウト） | 5分 |
| 画像 | StaleWhileRevalidate | 7日 |

**オフライン同期**:
1. tRPC React Queryによる楽観的更新
2. 失敗したミューテーションのローカルキュー（localStorage）
3. `online`イベントリスナーで接続回復時にバックグラウンド同期

---

### 3. Mantine v8 UIパターン

**決定**: Mantine v8 + `ColorSchemeScript`、Noto Sans JPフォント、`@mantine/form` + Zodバリデーション

**テーマ設定**:
```typescript
// SSR対応のColorSchemeScriptをルートレイアウトに配置
<html lang="ja">
  <head>
    <ColorSchemeScript defaultColorScheme="auto" />
  </head>
  <body>
    <MantineProvider defaultColorScheme="auto" theme={theme}>
      {children}
    </MantineProvider>
  </body>
</html>
```

**ダークモード**:
- `localStorage`による組み込み永続化（`mantine-color-scheme-value`）
- `useMantineColorScheme`フックでトグル
- テーマ切替100ms以内（SC-006達成）

**日本語フォント**:
```typescript
import { Noto_Sans_JP } from 'next/font/google';

const theme = createTheme({
  fontFamily: 'var(--font-noto-sans-jp), sans-serif',
  lineHeight: 1.75, // 日本語テキストに最適
});
```

**フォームバリデーション**:
- `@mantine/form` + `zodResolver`
- `mode: 'uncontrolled'`でパフォーマンス向上（v8推奨）
- Zodスキーマに日本語エラーメッセージ

**リッチテキストエディタ**:
- `@mantine/tiptap`（Tiptapラッパー）
- HTMLとしてコンテンツ保存
- シンプルなメモには`<Textarea autosize />`

---

### 4. Drizzle ORMパターン

**決定**: Drizzle ORM + PostgreSQL、アプリケーションレベルのユーザー分離、論理削除パターン、計算フィールド用データベースビュー

**リレーション設計**:
```typescript
export const currenciesRelations = relations(currencies, ({ one, many }) => ({
  user: one(users, { fields: [currencies.userId], references: [users.id] }),
  bonusTransactions: many(bonusTransactions),
}));
```

**論理削除パターン**:
```typescript
// 全エンティティにdeletedAtを追加
deletedAt: timestamp('deleted_at', { withTimezone: true }), // NULL = アクティブ

// クエリヘルパー
export function isNotDeleted(column: PgColumn): SQL {
  return sql`${column} IS NULL`;
}

// クエリでは常にフィルター
where: and(eq(sessions.userId, userId), isNotDeleted(sessions.deletedAt))
```

**計算フィールド（通貨残高）**:
```sql
CREATE VIEW currency_balances AS
SELECT
  c.id AS currency_id,
  c.initial_balance
    + COALESCE(SUM(bt.amount), 0)       -- ボーナス
    + COALESCE(SUM(pt.amount), 0)       -- 購入
    - COALESCE(SUM(s.buy_in), 0)        -- バイイン
    + COALESCE(SUM(s.cash_out), 0)      -- キャッシュアウト
  AS current_balance
FROM currencies c
LEFT JOIN bonus_transactions bt ON ...
LEFT JOIN purchase_transactions pt ON ...
LEFT JOIN sessions s ON ...
WHERE c.deleted_at IS NULL
GROUP BY c.id;
```

**ユーザー分離パターン**:
- WHERE句で**常に**`userId`でフィルター
- クライアント入力からのuserIdを**絶対に**信用しない - `ctx.session.user.id`を使用
- 更新/削除前に所有権を確認

---

### 5. tRPCパターン

**決定**: tRPC v11、ドメインベースルーター、Zodスキーマ、カーソルベースページネーション

**ルーター構成**:
```
appRouter
├── auth           # 認証（公開 + 保護）
├── currency       # 通貨管理
├── store          # 店舗管理
├── game           # ゲーム設定
├── session        # ポーカーセッション
├── allIn          # オールイン記録
├── player         # プレイヤープロファイル
├── playerTag      # プレイヤータグ
├── hand           # ハンド記録
└── activeSession  # アクティブセッション操作
```

**エラーハンドリング**:
- `NOT_FOUND`: リソースが存在しない
- `FORBIDDEN`: ユーザーがリソースを所有していない
- `CONFLICT`: ビジネスルール違反（例: アクティブセッションの削除）
- `BAD_REQUEST`: 無効な参照

**楽観的更新パターン**:
```typescript
const mutation = api.session.update.useMutation({
  onMutate: async (newData) => {
    await utils.session.getById.cancel();
    const previous = utils.session.getById.getData();
    utils.session.getById.setData((old) => ({ ...old, ...newData }));
    return { previous };
  },
  onError: (err, newData, context) => {
    utils.session.getById.setData(context?.previous);
  },
  onSettled: () => {
    utils.session.getById.invalidate();
  },
});
```

**ページネーション**:
- `useInfiniteQuery`による**カーソルベース**（推奨）
- `limit + 1`件取得で次ページの存在を判定
- クエリから`{ items, nextCursor }`を返却

---

## データモデル概要

### エンティティ一覧（21テーブル）

| カテゴリ | エンティティ | 説明 |
|----------|--------------|------|
| **認証** | User | ユーザーアカウント |
| | Account | OAuthプロバイダーリンク |
| | Session (Auth) | データベースセッション |
| | VerificationToken | メール認証トークン |
| **通貨** | Currency | 仮想通貨 |
| | BonusTransaction | ボーナス受取記録 |
| | PurchaseTransaction | 通貨購入記録 |
| **店舗** | Store | ポーカー施設 |
| | Game | ゲーム設定（キャッシュ/トーナメント） |
| **セッション** | PokerSession | プレイセッション |
| | AllInRecord | オールイン記録 |
| | StackUpdate | スタック更新（アクティブセッション） |
| | RebuyAddon | リバイ/アドオン記録 |
| **プレイヤー** | Player | 対戦相手プロファイル |
| | PlayerTag | プレイヤータグ |
| | PlayerTagAssignment | タグ割り当て（多対多） |
| | PlayerNote | 日付別メモ |
| | SessionPlayer | セッション参加者（多対多） |
| **ハンド** | Hand | ハンド記録 |
| | HandAction | ストリート別アクション |
| | HandPlayer | ハンド関連プレイヤー（ピン留め用） |

### 主要な計算フィールド

| フィールド | 計算式 |
|------------|--------|
| 通貨残高 | `初期残高 + Σボーナス + Σ購入 - Σバイイン + Σキャッシュアウト` |
| セッション損益 | `キャッシュアウト - バイイン` |
| オールインEV | `Σ(ポット額 × 勝率 / 100)` |

---

## APIコントラクト概要

### ルーター別プロシージャ数

| ルーター | プロシージャ数 | 主要操作 |
|----------|----------------|----------|
| auth | 1 | ユーザー登録 |
| currency | 7 | CRUD + ボーナス/購入追加 |
| store | 5 | CRUD |
| game | 5 | キャッシュゲーム/トーナメント作成 |
| session | 5 | アーカイブセッションCRUD |
| allIn | 4 | オールイン記録CRUD |
| player | 7 | CRUD + メモ/タグ管理 |
| playerTag | 4 | CRUD |
| activeSession | 7 | 開始/終了/スタック/リバイ/プレイヤー管理 |
| hand | 8 | CRUD + アクション/ピン留め |

**合計**: 約53プロシージャ

---

## 開発ワークフロー

### TDDサイクル（憲章必須）

1. **テスト作成**（Red）
   ```bash
   touch tests/unit/server/api/routers/currency.test.ts
   pnpm test tests/unit/server/api/routers/currency.test.ts  # 失敗確認
   ```

2. **最小実装**（Green）
   ```typescript
   // テストを通すのに必要な最小限のコード
   ```

3. **リファクタリング**（Refactor）
   ```bash
   pnpm test  # テストが引き続き通ることを確認
   ```

### Gitワークフロー

```bash
# devからフィーチャーブランチ作成
git checkout dev
git pull
git checkout -b feature/add-session-notes

# 変更をコミット
git add .
git commit -m "feat(session): セッションフォームにメモフィールドを追加"

# プッシュしてPR作成
git push -u origin feature/add-session-notes
# devブランチ向けにPR作成
```

### コミットメッセージ形式

```
<type>(<scope>): <description>

タイプ: feat, fix, docs, style, refactor, test, chore
スコープ: session, currency, store, player, auth, ui, db
```

---

## 依存関係

### 本番依存

| パッケージ | バージョン | 用途 |
|------------|------------|------|
| next | ^15.x | Reactフレームワーク |
| @trpc/server, @trpc/client, @trpc/react-query | ^11.x | 型安全API |
| drizzle-orm | ^0.x | データベースORM |
| next-auth | ^5.x | 認証 |
| @auth/drizzle-adapter | ^1.x | NextAuth Drizzleアダプター |
| @mantine/core, @mantine/form, @mantine/hooks | ^8.x | UIコンポーネント |
| @mantine/tiptap | ^8.x | リッチテキストエディタ |
| @ducanh2912/next-pwa | ^10.x | PWA対応 |
| zod | ^3.x | スキーマバリデーション |
| bcrypt | ^5.x | パスワードハッシュ |

### 開発依存

| パッケージ | バージョン | 用途 |
|------------|------------|------|
| vitest | ^2.x | 単体/統合テスト |
| playwright | ^1.x | E2Eテスト |
| drizzle-kit | ^0.x | マイグレーション生成 |
| @types/bcrypt | ^5.x | 型定義 |

---

## 生成成果物一覧

| 成果物 | パス | 説明 |
|--------|------|------|
| 実装計画（英語） | `specs/001-poker-session-tracker/plan.md` | メイン実装計画 |
| 実装計画（日本語） | `specs/001-poker-session-tracker/plan.ja.md` | 本ドキュメント |
| 技術調査 | `specs/001-poker-session-tracker/research.md` | 技術決定と根拠 |
| データモデル | `specs/001-poker-session-tracker/data-model.md` | 21エンティティ、ERD、バリデーションルール |
| APIコントラクト | `specs/001-poker-session-tracker/contracts/trpc-api.md` | 10ルーター、53+プロシージャ |
| クイックスタート | `specs/001-poker-session-tracker/quickstart.md` | 開発環境セットアップガイド |

---

## 次のステップ

`/speckit.tasks` を実行して、この計画に基づく実装タスクリストを生成してください。
