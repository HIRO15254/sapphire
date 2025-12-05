# Data Model: ページ構造リファクタリング

**Feature**: 006-page-structure-refactor
**Date**: 2025-12-05

## 概要

このフィーチャーではデータモデルの変更は不要です。既存のセッションデータモデルをそのまま使用します。

## 既存データモデルの参照

### poker_sessions テーブル

既存の定義（`src/server/db/schema.ts`）:

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PRIMARY KEY | セッションID |
| date | TIMESTAMP NOT NULL | セッション開始日時 |
| location_id | INTEGER NOT NULL | 場所ID（FK） |
| buy_in | NUMERIC(10,2) NOT NULL | バイイン額 |
| cash_out | NUMERIC(10,2) NOT NULL | キャッシュアウト額 |
| duration_minutes | INTEGER NOT NULL | プレイ時間(分) |
| notes | TEXT | メモ(任意) |
| user_id | VARCHAR NOT NULL | ユーザーID（FK） |
| created_at | TIMESTAMP NOT NULL | 作成日時 |
| updated_at | TIMESTAMP NOT NULL | 更新日時 |

### 関連テーブル

- **locations**: 場所マスタ
- **tags**: タグマスタ
- **session_tags**: セッションとタグの中間テーブル
- **users**: ユーザーマスタ（NextAuth.js管理）

## UIコンポーネントの状態モデル

### AppLayout状態

```typescript
interface AppLayoutState {
  // モバイル用サイドバーの開閉状態
  mobileOpened: boolean;
  // デスクトップ用サイドバーの開閉状態
  desktopOpened: boolean;
}
```

### ナビゲーションリンク

```typescript
interface NavLink {
  href: string;
  label: string;
  icon: React.ComponentType;
}

const navigationLinks: NavLink[] = [
  { href: '/', label: 'ダッシュボード', icon: IconDashboard },
  { href: '/poker-sessions', label: 'セッション一覧', icon: IconList },
  { href: '/poker-sessions/new', label: '新規作成', icon: IconPlus },
];
```

## 変更なし

このフィーチャーはUIリファクタリングのため、データベーススキーマやAPIレスポンスの変更は不要です。
