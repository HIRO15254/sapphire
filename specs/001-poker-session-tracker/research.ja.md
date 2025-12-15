# 技術調査: ライブポーカーセッショントラッカー

**作成日**: 2025-12-12（更新: 2025-12-15）
**フィーチャーブランチ**: `001-poker-session-tracker`

本ドキュメントは実装計画の技術決定を解決するための調査結果をまとめたものです。

---

## 1. 認証: NextAuth.js + Drizzle ORM

### 決定
NextAuth.js v5 + `@auth/drizzle-adapter`、**データベースセッション**（JWTではない）を使用

### 理由
- マルチデバイス同期要件（ユーザーは施設でスマホ、自宅でデスクトップからアクセス）
- 即時セッション無効化機能（全デバイスからログアウト）
- ユーザーデータ変更（通貨残高、セッション結果）がトークン更新なしで最新状態を維持
- 1,000同時ユーザーはデータベースセッションで十分対応可能

### 検討した代替案
- **JWTセッション**: データの陳腐化問題と即時無効化不可のため却下
- **カスタム認証**: 複雑性とセキュリティ懸念のため却下

### 主要な設定
```typescript
// データベースセッション戦略
session: {
  strategy: "database",
  maxAge: 30 * 24 * 60 * 60, // 30日
  updateAge: 24 * 60 * 60,   // 24時間ごとに更新
}

// プロバイダー: Google, Discord, Credentials（メール/パスワード）
// パスワードハッシュ: bcrypt 10ラウンド
```

### 必要なスキーマ
- `users`: id, name, email, emailVerified, image, passwordHash
- `accounts`: userId, type, provider, providerAccountId, トークン類
- `sessions`: sessionToken, userId, expires
- `verificationTokens`: identifier, token, expires

### 注意点
- OAuthには`allowDangerousEmailAccountLinking: true`を使用（プロバイダーがメール検証済み）
- Credentialsプロバイダーは手動セッション作成が必要
- コールバックでsession.user.idをtRPCコンテキスト用に追加

---

## 2. PWA実装（更新）

### 決定
**Next.js公式アプローチ**を使用：手動サービスワーカーと組み込みマニフェストサポート

### 理由
- Next.jsがPWA構築ブロックのネイティブサポートを提供
- 廃止される可能性のあるサードパーティパッケージへの依存なし
- 公式ドキュメント: `/docs/app/building-your-application/guides/progressive-web-apps`
- キャッシュ戦略と更新動作の完全な制御

### 検討した代替案
- **@ducanh2912/next-pwa**: サードパーティ、互換性問題の可能性
- **next-pwa（オリジナル）**: 非推奨、App Router非対応
- **Serwist**: コミュニティソリューション、非公式

### Webアプリマニフェスト設定
```typescript
// app/manifest.ts
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ポーカーセッショントラッカー',
    short_name: 'PokerTracker',
    description: 'ライブポーカーセッション・ハンド記録アプリ',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
```

### サービスワーカー設定
```javascript
// public/sw.js
const CACHE_NAME = 'poker-tracker-v1';
const OFFLINE_URLS = ['/offline'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // APIはネットワークファースト、アセットはキャッシュファースト
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
  } else {
    event.respondWith(
      caches.match(event.request).then((response) => response || fetch(event.request))
    );
  }
});
```

### サービスワーカーヘッダー用Next.js設定
```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
        ],
      },
    ]
  },
}
```

### サービスワーカー登録
```tsx
// app/components/ServiceWorkerRegistration.tsx
'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      })
    }
  }, [])
  return null
}
```

### オフライン同期戦略
1. tRPC React Queryによる**楽観的更新**
2. 失敗したミューテーション用**ローカルキュー**（localStorageまたはIndexedDB）
3. `online`イベントリスナーで接続回復時に**バックグラウンド同期**

---

## 3. Mantine v8 UIパターン

### 決定
Mantine v8 + `ColorSchemeScript`、Noto Sans JPフォント、`@mantine/form` + Zodバリデーション

### テーマセットアップ
```typescript
// SSR安全なカラースキームのためColorSchemeScriptをルートレイアウトに配置
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

### ダークモード
- `localStorage`による組み込み永続化（`mantine-color-scheme-value`）
- トグルには`useMantineColorScheme`フック
- テーマ切替100ms以内（SC-006達成）

### 日本語フォント設定
```typescript
// 最適な読み込みのためnext/font/googleを使用
import { Noto_Sans_JP } from 'next/font/google';

const theme = createTheme({
  fontFamily: 'var(--font-noto-sans-jp), sans-serif',
  lineHeight: 1.75, // 日本語テキストに最適
});
```

### フォームバリデーション
- `@mantine/form` + `zodResolver`
- パフォーマンスのため`mode: 'uncontrolled'`（v8推奨）
- Zodスキーマに日本語エラーメッセージ

### リッチテキストエディタ
- 完全機能には`@mantine/tiptap`（Tiptapラッパー）
- コンテンツはHTMLとして保存
- シンプルなメモには`<Textarea autosize />`

### レスポンシブブレークポイント
- `xs`: 576px, `sm`: 768px, `md`: 992px, `lg`: 1200px, `xl`: 1408px
- スタイルプロップを使用: `w={{ base: '100%', sm: '50%' }}`
- 条件付きレンダリングには`visibleFrom`/`hiddenFrom`

---

## 4. Drizzle ORMパターン

### 決定
Drizzle ORM + PostgreSQL、アプリケーションレベルのユーザー分離、論理削除パターン、計算フィールド用データベースビュー

### スキーマ設計パターン

**リレーション**: 型安全なジョインには`relations()`ヘルパーを使用
```typescript
export const currenciesRelations = relations(currencies, ({ one, many }) => ({
  user: one(users, { fields: [currencies.userId], references: [users.id] }),
  bonusTransactions: many(bonusTransactions),
}));
```

**多対多**: 複合ユニーク制約付きジャンクションテーブル
```typescript
export const handReviewFlagAssignments = pgTable('hand_review_flag_assignments', {
  handId: uuid('hand_id').references(() => hands.id, { onDelete: 'cascade' }),
  flagId: uuid('flag_id').references(() => handReviewFlags.id, { onDelete: 'cascade' }),
}, (t) => ({
  uniqueHandFlag: unique().on(t.handId, t.flagId),
}));
```

### 論理削除パターン
```typescript
// 全エンティティにdeletedAtを追加
deletedAt: timestamp('deleted_at'), // NULL = アクティブ

// クエリヘルパー
export function isNotDeleted(column: PgColumn): SQL {
  return sql`${column} IS NULL`;
}

// クエリでは常にフィルター
where: and(eq(sessions.userId, userId), isNotDeleted(sessions.deletedAt))
```

### 計算フィールド（通貨残高）
パフォーマンスのためデータベースVIEWを使用:
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

### タイムスタンプパターン
```typescript
// updatedAtにはデータベーストリガーを使用
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ language 'plpgsql';

// 全テーブルに適用
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### ユーザー分離パターン
- WHERE句で**常に**`userId`でフィルター
- クライアント入力からのuserIdを**絶対に**信用しない - `ctx.session.user.id`を使用
- 更新/削除前に所有権を確認
- PostgreSQL RLSなし（Drizzleはネイティブサポートしていない）

### マイグレーション戦略
- SQLマイグレーション生成にDrizzle Kitを使用
- 本番前にステージング（Neonブランチ）でテスト
- 後方互換性のある変更: nullable追加 → バックフィル → NOT NULL化
- 外部キーと論理削除クエリ用のインデックスを作成

---

## 5. tRPCパターン

### 決定
tRPC v11、ドメインベースルーター、Zodスキーマ、カーソルベースページネーション

### ルーター構成
```
src/server/api/
├── root.ts              # 全ルーターをマージ
├── trpc.ts              # 初期化、プロシージャ、ミドルウェア
├── schemas/             # 共有Zodスキーマ
│   ├── session.schema.ts
│   └── common.schema.ts
└── routers/             # エンティティごとに1ルーター
    ├── session.ts
    ├── currency.ts
    └── ...
```

### 保護プロシージャパターン
```typescript
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({ ctx: { session: ctx.session } });
});
```

### エラーハンドリング
- `NOT_FOUND`: リソースが存在しない
- `FORBIDDEN`: ユーザーがリソースを所有していない
- `CONFLICT`: ビジネスルール違反（例: アクティブセッションの削除）
- `BAD_REQUEST`: 無効な参照

### 楽観的更新パターン
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

### ページネーションパターン
- `useInfiniteQuery`による**カーソルベース**（推奨）
- 次ページ存在判定のため`limit + 1`件取得
- クエリから`{ items, nextCursor }`を返却

### リアルタイム更新
- アクティブセッションには**ポーリング**（3-5秒間隔）
- WebSocketサブスクリプションは将来の必要に応じて
- ポーカートラッキングにはポーリングがシンプルで十分

---

## 6. ポーカーハンドヒストリーフォーマット（更新）

### 決定
ハンドヒストリーは**PHHフォーマットのみ**で保存。全データ（ポジション、スタック、カード、アクション）は生のPHHテキストに含まれる。

### 理由
- PHHフォーマットは包括的で自己完結
- 生テキストとインデックス化フィールド間のデータ重複を回避
- フィルタリング/統計のための解析はオンデマンドで実行可能
- メンテナンスオーバーヘッドの少ないシンプルなスキーマ

### PHH（Poker Hand History）フォーマット
PHHはポーカーハンドヒストリーのオープン標準:

```
# ハンド #42 - 2025-12-15 14:30:00 JST
# ゲーム: NLHE (1/2)
# テーブル: ABC Poker - Table 3

[席1] Hero (200) BTN
[席2] Player2 (150) SB
[席3] Player3 (300) BB

*** プリフロップ ***
Hero [Ah Ks]
Player2 posts 1
Player3 posts 2
Hero raises to 6
Player2 folds
Player3 calls 4

*** フロップ *** [Ad Kc 5h]
Player3 checks
Hero bets 10
Player3 calls 10

*** ターン *** [Ad Kc 5h 8s]
Player3 checks
Hero bets 25
Player3 raises to 75
Hero calls 50

*** リバー *** [Ad Kc 5h 8s 2c]
Player3 bets 100
Hero calls 100

*** ショーダウン ***
Player3 shows [8h 8d] (スリーカード)
Hero shows [Ah Ks] (ツーペア)
Player3 wins 387

# 結果: -117
```

### 必要なデータ（すべてPHHに含まれる）
- ゲームバリアントとベッティング構造
- ブラインド/アンティ構造
- プレイヤーの席とスタックサイズ
- ホールカード（既知のプレイヤー用）
- ストリートごとのアクションシーケンス
- ボードカード
- ショーダウン結果
- ハンド結果とチップ移動

### ストレージスキーマ（簡素化）
```typescript
// hands テーブル - PHHのみ、インデックス化フィールドなし
handHistoryRaw: text('hand_history_raw'),  // 完全なPHHフォーマット（唯一サポートされるフォーマット）
notes: text('notes'),                       // 追加メモ（HTML）
```

### ハンドシートテーブル（簡素化）
プレイヤーとシートのリンクのみ - スタック/カードデータはPHHに含まれる:
```typescript
handSeats: {
  handId, seatNumber, position,
  playerId (nullable - 既知プレイヤー用),
  playerName (フォールバック)
  // startingStack, endingStack, holeCards なし - PHHに含まれる
}
```

---

## 7. Google Maps連携（新規）

### 決定
**座標 + Place ID**を保存し、Google Mapsリンクを動的に生成。基本的なリンクにはAPIキー不要。

### 理由
- シンプルな「Google Mapsで見る」リンクにはAPIキー不要
- Place IDが名前/住所が変わっても安定した参照を提供
- 座標がプログラマティックな地図表示に最も信頼性が高い
- 必要に応じて後から埋め込み地図に拡張可能

### データ保存
```typescript
stores: {
  name: varchar('name', { length: 255 }),
  address: text('address'),
  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 11, scale: 8 }),
  placeId: varchar('place_id', { length: 255 }), // Google Place ID（任意）
}
```

### Google Maps URL生成
```typescript
function getGoogleMapsUrl(store: Store): string {
  // Place IDが利用可能な場合を優先
  if (store.placeId) {
    return `https://www.google.com/maps/search/?api=1&query_place_id=${store.placeId}`;
  }

  // 座標にフォールバック
  if (store.latitude && store.longitude) {
    return `https://www.google.com/maps/search/?api=1&query=${store.latitude},${store.longitude}`;
  }

  // 最後の手段：名前と住所で検索
  const query = encodeURIComponent(`${store.name} ${store.address}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}
```

### 将来の拡張オプション
- **フェーズ1（MVP）**: Google Mapsにリンクアウト（APIキー不要）
- **フェーズ2**: 安定した参照のためPlace IDを追加
- **フェーズ3**: 必要に応じてAPIキーで地図埋め込み

---

## 8. セッションイベントシステム（新規）

### 決定
アクティブセッション記録に**拡張可能なイベントベースアーキテクチャ**を使用。全イベントを判別共用体パターンで単一テーブルに保存。

### 理由
- スキーマ変更なしでイベントを追加可能
- セッションアクティビティの完全な監査証跡
- 正確なセッション再構築を可能に
- リプレイ機能のための時間順イベント

### イベントタイプ
| イベントタイプ | 説明 | データ |
|------------|------|------|
| `session_start` | セッション開始/再開 | - |
| `session_pause` | セッション一時停止 | - |
| `session_end` | セッション完了 | cashOut |
| `player_seated` | プレイヤー着席 | playerId, seatNumber |
| `hand_recorded` | 詳細ハンド記録 | handId |
| `hands_passed` | 詳細なしでパスしたハンド | count |
| `stack_update` | スタック金額変更 | amount |
| `rebuy` | リバイ実行 | amount |
| `addon` | アドオン実行 | amount |

### ストレージスキーマ
```typescript
sessionEvents: {
  id: uuid,
  sessionId: uuid,
  userId: uuid,
  eventType: varchar,     // 判別子
  eventData: jsonb,       // タイプ固有ペイロード
  recordedAt: timestamp,
  sequence: integer,      // セッション内の順序
}
```

### イベントデータ例
```typescript
// player_seated
{ playerId: "uuid", seatNumber: 3, playerName: "John" }

// hand_recorded
{ handId: "uuid" }

// hands_passed
{ count: 5 }

// stack_update
{ amount: 15000 }

// rebuy / addon
{ amount: 5000 }
```

---

## 9. その他の決定事項

### オールインEV計算
```typescript
// 勝率には小数点以下2桁のdecimalを使用（0.00 - 100.00）
winProbability: decimal('win_probability', { precision: 5, scale: 2 })

// FR-043: (ポット額 × 勝率 / 100)の合計
const allInEV = allInRecords.reduce((sum, record) => {
  return sum + (record.potAmount * Number(record.winProbability) / 100);
}, 0);
```

### ゲームタイプの分離（更新）
明示的なフィールドを持つ別テーブルに分割:

**CashGame**: 明示的なブラインド/アンティフィールド
```typescript
cashGames: {
  smallBlind: integer,      // SB金額
  bigBlind: integer,        // BB金額
  straddle1: integer,       // UTGストラドル（任意）
  straddle2: integer,       // UTG+1ストラドル（任意）
  ante: integer,            // アンティ金額（任意）
  anteType: varchar,        // 'all_ante' または 'bb_ante'
  currencyId: uuid,
  notes: text,              // リッチテキストメモ
  isArchived: boolean,
}
```

**Tournament**: 別テーブルの構造
```typescript
tournaments: {
  name: varchar,
  buyIn: integer,
  startingStack: integer,
  currencyId: uuid,
  notes: text,
  isArchived: boolean,
}

tournamentPrizeLevels: {
  tournamentId, position, percentage?, fixedAmount?
}

tournamentBlindLevels: {
  tournamentId, level, smallBlind, bigBlind, ante?, durationMinutes
}
```

### アーカイブ vs 論理削除
- **isArchived**: アクティブリストから非表示、データは完全にアクセス可能
- **deletedAt**: 論理削除、実質的に削除されるが復旧可能
- 適用対象: Currency, Store, CashGame, Tournament

### ハンドレビューフラグ（複数）
```typescript
handReviewFlags: {
  id: uuid,
  userId: uuid,
  name: varchar,         // 例: "要復習", "ミスプレイ", "良いプレイ"
  color: varchar,        // 16進カラー
}

handReviewFlagAssignments: {
  handId: uuid,
  flagId: uuid,
}
```

### 日付/時刻の扱い
- 全タイムスタンプをタイムゾーン付きUTCで保存（`timestamptz`）
- クライアントではユーザーのローカルタイムゾーンで表示
- 日本語ロケールでのフォーマットには`date-fns`または`dayjs`を使用

---

## 依存関係まとめ

```json
{
  "dependencies": {
    "@auth/drizzle-adapter": "^1.x",
    "@mantine/core": "^8.x",
    "@mantine/form": "^8.x",
    "@mantine/hooks": "^8.x",
    "@mantine/tiptap": "^8.x",
    "@tabler/icons-react": "^3.x",
    "@tanstack/react-query": "^5.x",
    "@tiptap/react": "^2.x",
    "@tiptap/starter-kit": "^2.x",
    "@trpc/client": "^11.x",
    "@trpc/react-query": "^11.x",
    "@trpc/server": "^11.x",
    "bcrypt": "^5.x",
    "drizzle-orm": "^0.x",
    "next": "^15.x",
    "next-auth": "^5.x",
    "postgres": "^3.x",
    "superjson": "^2.x",
    "zod": "^3.x"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.x",
    "drizzle-kit": "^0.x",
    "playwright": "^1.x",
    "vitest": "^2.x"
  }
}
```

**注意**: パッケージマネージャーは**bun**（pnpmやnpmではない）。
