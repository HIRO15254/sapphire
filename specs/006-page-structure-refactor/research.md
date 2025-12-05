# Research: ページ構造リファクタリング

**Feature**: 006-page-structure-refactor
**Date**: 2025-12-05

## 調査事項

### 1. Mantine AppShellの実装パターン

**Decision**: Mantine AppShellを使用し、Navbarを折りたたみ可能なサイドバーとして実装する

**Rationale**:
- AppShellはレスポンシブ対応のシェルレイアウトを提供
- `useDisclosure`フックでデスクトップ/モバイル別の折りたたみ状態を管理可能
- `breakpoint`設定でモバイル/デスクトップの表示切り替えが自動化

**実装パターン**:

```tsx
// AppLayoutContainer.tsx
const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);

<AppShell
  navbar={{
    width: 250,
    breakpoint: 'sm',
    collapsed: { mobile: !mobileOpened, desktop: !desktopOpened }
  }}
>
  <AppShell.Header>
    <Burger opened={mobileOpened} onClick={toggleMobile} hiddenFrom="sm" />
  </AppShell.Header>
  <AppShell.Navbar>
    {/* ナビゲーションリンク */}
  </AppShell.Navbar>
  <AppShell.Main>
    {children}
  </AppShell.Main>
</AppShell>
```

**Alternatives considered**:
- カスタムサイドバー実装 → MantineのAppShellで十分な機能が提供されるため不採用
- ヘッダーのみ（サイドバーなし）→ ユーザーの要望によりサイドバーを採用

---

### 2. 認証状態に基づくレイアウト切り替え

**Decision**: サーバーコンポーネントで認証状態を取得し、条件分岐でAppShellを表示/非表示にする

**Rationale**:
- Next.js 15のApp Routerでは、サーバーコンポーネントで`auth()`を使用して認証状態を取得可能
- 認証ページ（/auth/*）ではサイドバーを表示しないことが仕様要件

**実装パターン**:

```tsx
// src/app/layout.tsx
export default async function RootLayout({ children }) {
  const session = await auth();
  const pathname = headers().get('x-pathname') || '';
  const isAuthPage = pathname.startsWith('/auth');

  return (
    <html>
      <body>
        {session && !isAuthPage ? (
          <AppLayoutContainer session={session}>
            {children}
          </AppLayoutContainer>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
```

**Alternatives considered**:
- ミドルウェアでのリダイレクト → 既存のNextAuth.jsミドルウェアと競合するため不採用
- クライアントサイドでの認証チェック → サーバーサイドで行う方がパフォーマンスが良い

---

### 3. ダッシュボード統計データの取得

**Decision**: 既存の`sessions.getStats`と`sessions.getAll`APIを活用してダッシュボードデータを取得

**Rationale**:
- 既存のtRPC APIで必要なデータがすでに提供されている
- 新しいAPIエンドポイントの追加は不要
- TanStack Queryのキャッシュを活用して効率的なデータ取得が可能

**実装パターン**:

```tsx
// DashboardContainer.tsx
const { data: stats } = api.sessions.getStats.useQuery();
const { data: sessions } = api.sessions.getAll.useQuery();

// 最近のセッション（最大5件）
const recentSessions = sessions?.slice(0, 5);
```

**Alternatives considered**:
- 新しい`dashboard.getSummary` API → 既存APIで十分なため不採用
- SSRでのデータフェッチ → TanStack Queryのキャッシュを活用するためクライアントサイドフェッチを採用

---

### 4. ナビゲーションリンクのアクティブ状態

**Decision**: `usePathname`フックで現在のパスを取得し、NavLinkコンポーネントでアクティブ状態を管理

**Rationale**:
- Next.jsの`usePathname`はApp Routerで現在のパスを取得する標準的な方法
- MantineのNavLinkコンポーネントはアクティブ状態のスタイリングを内蔵

**実装パターン**:

```tsx
// Navbar.tsx
import { usePathname } from 'next/navigation';
import { NavLink } from '@mantine/core';

const pathname = usePathname();

const links = [
  { href: '/', label: 'ダッシュボード', icon: IconDashboard },
  { href: '/poker-sessions', label: 'セッション一覧', icon: IconList },
  { href: '/poker-sessions/new', label: '新規作成', icon: IconPlus },
];

{links.map((link) => (
  <NavLink
    key={link.href}
    href={link.href}
    label={link.label}
    leftSection={<link.icon size={16} />}
    active={pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))}
  />
))}
```

**Alternatives considered**:
- useSelectedLayoutSegment → より複雑になるため不採用
- カスタムコンテキスト → 標準のusePathnameで十分

---

### 5. モーダルからページへの移行戦略

**Decision**: 段階的にモーダルを削除し、専用ページに移行

**Rationale**:
- 既存のSessionFormコンポーネントは再利用可能
- URLベースのナビゲーションにより、ブックマーク・共有・ブラウザ履歴が正常に機能
- E2Eテストが容易になる

**移行手順**:
1. 新規作成ページ（/poker-sessions/new）を有効化
2. 詳細ページ（/poker-sessions/[id]）を新規作成
3. 編集ページ（/poker-sessions/[id]/edit）のリダイレクト先を修正
4. セッション一覧ページからモーダル呼び出しを削除
5. 未使用のモーダルコンポーネントを削除

**Alternatives considered**:
- モーダルを維持しつつページも提供 → UXの一貫性が損なわれるため不採用
- 一括削除 → リスクが高いため段階的移行を採用

---

### 6. セッション詳細ページの設計

**Decision**: セッション詳細ページは読み取り専用のビューとして実装し、編集・削除へのリンクを提供

**Rationale**:
- 詳細表示と編集を分離することで、誤操作を防止
- URLベースでセッション情報を共有可能に
- 既存の統計・場所別情報も含めて表示

**表示内容**:
- 基本情報: 日時、場所、バイイン、キャッシュアウト、収支
- プレイ時間
- タグ
- メモ（リッチテキスト）
- アクション: 編集ボタン、削除ボタン

**Alternatives considered**:
- 編集可能な詳細ページ → 誤操作リスクがあるため読み取り専用を採用
- モーダルで詳細表示 → URLベースのナビゲーションが要件のため不採用

---

## 技術的リスクと対策

| リスク | 影響度 | 対策 |
|--------|--------|------|
| AppShellとNextAuth.jsの統合 | 中 | サーバーコンポーネントで認証状態を取得してからクライアントコンポーネントに渡す |
| レスポンシブ対応の不具合 | 低 | Mantine AppShellの組み込みブレークポイントを活用 |
| 既存E2Eテストの失敗 | 中 | ナビゲーション変更に伴うセレクタ更新 |
| パフォーマンス劣化 | 低 | TanStack Queryのキャッシュを活用、必要に応じてSSRを検討 |

---

## 参考リンク

- [Mantine AppShell](https://mantine.dev/core/app-shell/)
- [Next.js App Router - Layouts](https://nextjs.org/docs/app/building-your-application/routing/layouts-and-templates)
- [NextAuth.js v5 - Server Components](https://authjs.dev/getting-started/session-management/get-session)
