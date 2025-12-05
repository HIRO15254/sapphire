# Routing Contract: ページ構造リファクタリング

**Feature**: 006-page-structure-refactor
**Date**: 2025-12-05

## ルーティング構造

### 公開ルート（認証不要）

| Path | Component | Description |
|------|-----------|-------------|
| `/auth/signin` | SignInPage | ログインページ（サイドバーなし） |
| `/auth/signup` | SignUpPage | 登録ページ（サイドバーなし） |
| `/offline` | OfflinePage | オフラインフォールバック |

### 保護ルート（認証必要、サイドバーあり）

| Path | Component | Description |
|------|-----------|-------------|
| `/` | DashboardPage | ダッシュボード（統計、最近のセッション、クイックアクション） |
| `/poker-sessions` | SessionsListPage | セッション一覧（フィルター機能付き） |
| `/poker-sessions/new` | NewSessionPage | 新規セッション作成 |
| `/poker-sessions/[id]` | SessionDetailPage | セッション詳細表示 |
| `/poker-sessions/[id]/edit` | EditSessionPage | セッション編集 |

## ナビゲーションフロー

### サイドバーリンク

```
ダッシュボード (/)
├── セッション一覧 (/poker-sessions)
└── 新規作成 (/poker-sessions/new)
```

### ページ間遷移

```
ダッシュボード (/)
├── [クイックアクション] → 新規作成 (/poker-sessions/new)
├── [最近のセッション] → 詳細 (/poker-sessions/[id])
└── [セッション一覧へ] → 一覧 (/poker-sessions)

セッション一覧 (/poker-sessions)
├── [新規作成ボタン] → 新規作成 (/poker-sessions/new)
└── [セッションカード] → 詳細 (/poker-sessions/[id])

セッション詳細 (/poker-sessions/[id])
├── [編集ボタン] → 編集 (/poker-sessions/[id]/edit)
├── [削除ボタン] → 確認モーダル → 一覧 (/poker-sessions)
└── [戻るボタン] → 一覧 (/poker-sessions)

新規作成 (/poker-sessions/new)
├── [保存] → 詳細 (/poker-sessions/[id])
└── [キャンセル] → 一覧 (/poker-sessions)

編集 (/poker-sessions/[id]/edit)
├── [保存] → 詳細 (/poker-sessions/[id])
└── [キャンセル] → 詳細 (/poker-sessions/[id])
```

## リダイレクト規則

| 条件 | From | To |
|------|------|-----|
| 未認証ユーザーが保護ルートにアクセス | /poker-sessions/* | /auth/signin |
| 認証成功後 | /auth/signin | / (ダッシュボード) |
| ログアウト後 | 任意のページ | /auth/signin |
| セッション作成成功 | /poker-sessions/new | /poker-sessions/[新ID] |
| セッション編集成功 | /poker-sessions/[id]/edit | /poker-sessions/[id] |
| セッション削除成功 | /poker-sessions/[id] | /poker-sessions |
| 存在しないセッションID | /poker-sessions/[invalid] | /poker-sessions (404リダイレクト) |

## レスポンスコード

| Code | Condition |
|------|-----------|
| 200 | ページ正常表示 |
| 302 | 認証リダイレクト |
| 404 | 存在しないセッションID |
| 403 | 他ユーザーのセッションへのアクセス |

## API依存関係

### ダッシュボードページ

```typescript
// 使用するAPI
api.sessions.getStats.useQuery()  // 統計情報
api.sessions.getAll.useQuery()    // 最近のセッション（最大5件）
```

### セッション詳細ページ

```typescript
// 使用するAPI
api.sessions.getById.useQuery({ id })  // セッション詳細
api.sessions.delete.useMutation()      // 削除
```

### 新規作成・編集ページ

```typescript
// 使用するAPI
api.sessions.create.useMutation()      // 新規作成
api.sessions.update.useMutation()      // 更新
api.locations.getAll.useQuery()        // 場所一覧
api.tags.getAll.useQuery()             // タグ一覧
```
