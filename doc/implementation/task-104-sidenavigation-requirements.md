# TDD要件定義・機能仕様の整理

**【機能名】**: TASK-104 SideNavigation Component - Desktop Side Navigation

## 1. 機能の概要（EARS要件定義書・設計文書ベース）

- 🟢 **何をする機能か**: デスクトップ表示時（768px以上）に画面左側に配置されるサイドナビゲーション機能
- 🟢 **解決する問題**: デスクトップユーザーが広い画面スペースを効率的に活用して補助機能へアクセスできるようにする
- 🟢 **想定ユーザー**: デスクトップ環境でアプリケーションを使用するユーザー（Story 4より）
- 🟢 **システム内位置づけ**: ResponsiveLayoutコンポーネント内のAppShell.Navbar要素として実装
- **参照したEARS要件**: REQ-005, REQ-106, REQ-401, REQ-402
- **参照した設計文書**: architecture.md ResponsiveLayout設計セクション

## 2. 入力・出力の仕様（EARS機能要件・TypeScript型定義ベース）

- 🟢 **入力パラメータ**:
  ```typescript
  interface SideNavigationProps {
    items: NavigationItem[];
    groupedItems: Record<string, NavigationItem[]>;
    collapsed?: boolean;
    onToggleCollapse?: () => void;
  }

  interface NavigationItem {
    readonly id: string;
    readonly label: string;
    readonly path: string;
    readonly icon?: React.ComponentType<{ size?: string | number; stroke?: number }>;
    readonly group?: string;
    readonly badge?: string | number;
    readonly hasNotification?: boolean;
    readonly description?: string;
  }
  ```

- 🟢 **出力値**:
  - JSX.Element（Mantine NavbarベースのReactコンポーネント）
  - 幅状態: collapsed時80px、expanded時280px
  - グループ化されたナビゲーション項目の表示
  - アクティブ状態の視覚的フィードバック

- 🟢 **入出力関係性**: NavigationItemsをグループ化し、デスクトップレイアウトに適したサイドバーUIとして出力
- 🟢 **データフロー**: ResponsiveLayout → SideNavigation → NavLink components
- **参照したEARS要件**: REQ-005, REQ-106
- **参照した設計文書**: interfaces.ts NavigationItem定義

## 3. 制約条件（EARS非機能要件・アーキテクチャ設計ベース）

- 🟢 **パフォーマンス要件**:
  - レイアウト切り替え200ms以内（NFR-001）
  - アニメーション完了300ms以内（NFR-002）
  - React.memo最適化必須

- 🟢 **セキュリティ要件**:
  - XSS防止のための入力値検証
  - Navigation pathの検証

- 🟢 **互換性要件**:
  - デスクトップのみ表示（768px以上）（REQ-005 MUST）
  - Mantine 7.x NavBar/NavLink components使用必須

- 🟢 **アーキテクチャ制約**:
  - AppShell.Navbar内での実装
  - Tauri 2.0+ + React 18 + TypeScript 5.0+環境
  - Vitest + React Testing Library でのテスト必須

- 🟢 **アクセシビリティ制約**:
  - WCAG 2.1 AA準拠必須（REQ-401）
  - キーボードナビゲーション対応必須（REQ-402）
  - 44px以上のタップターゲット
  - 適切なARIA属性

- **参照したEARS要件**: NFR-001, NFR-002, REQ-401, REQ-402, REQ-005
- **参照した設計文書**: architecture.md アクセシビリティ要件セクション

## 4. 想定される使用例（EARSEdgeケース・データフローベース）

- 🟢 **基本的な使用パターン**:
  - デスクトップ画面での通常ナビゲーション使用
  - サイドバーの折りたたみ/展開操作
  - グループ化された項目からの選択
  - アクティブページの視覚的表示

- 🟢 **データフロー**:
  - User click → SideNavigation state update → NavLink active state → Router navigation

- 🟡 **エッジケース**:
  - 非常に多くのナビゲーション項目（ScrollArea対応）
  - 画面幅がブレークポイント境界での動作
  - 長いラベル名での表示
  - バッジ付きアイテムの表示

- 🟡 **エラーケース**:
  - 不正なnavigation pathの処理
  - アイコンコンポーネントの読み込み失敗
  - 空のナビゲーション項目配列
  - undefined/null props の処理

- **参照したEARS要件**: REQ-005, REQ-106基本フロー
- **参照した設計文書**: dataflow.md ナビゲーションフロー図

## 5. EARS要件・設計文書との対応関係

- **参照したユーザストーリー**: Story 4 - デスクトップユーザーの補助機能アクセス
- **参照した機能要件**:
  - REQ-005: System must display side menu in desktop view
  - REQ-106: Desktop layout must provide navigation to other screens via side menu
  - REQ-401: WCAG 2.1 AA compliance required
  - REQ-402: Keyboard navigation support required
- **参照した非機能要件**:
  - NFR-001: Layout switching within 200ms
  - NFR-002: Animation completion within 300ms
- **参照したEdgeケース**: 画面幅境界値、大量データ表示
- **参照した受け入れ基準**: 17パターンテストケース（Normal 5, Error 3, Boundary 3, Accessibility 2, Performance 1, Integration 3）
- **参照した設計文書**:
  - **アーキテクチャ**: architecture.md ResponsiveLayoutコンポーネント設計
  - **データフロー**: dataflow.md ナビゲーション操作フロー
  - **型定義**: interfaces.ts NavigationItem, SideNavigationProps
  - **データベース**: 該当なし（クライアントサイドコンポーネント）
  - **API仕様**: 該当なし（プレゼンテーション層コンポーネント）

## 実装仕様詳細

### コンポーネント構造
```typescript
// SideNavigation Component
const SideNavigation: React.FC<SideNavigationProps> = ({
  items,
  groupedItems,
  collapsed = false,
  onToggleCollapse
}) => {
  return (
    <Navbar width={{ base: 0, md: collapsed ? 80 : 280 }}>
      <Navbar.Section grow component={ScrollArea}>
        {Object.entries(groupedItems).map(([group, groupItems]) => (
          <NavLink.Group label={group} key={group}>
            {groupItems.map(item => (
              <NavLink
                key={item.id}
                label={item.label}
                icon={item.icon}
                component={Link}
                to={item.path}
                rightSection={item.badge && <Badge>{item.badge}</Badge>}
              />
            ))}
          </NavLink.Group>
        ))}
      </Navbar.Section>
    </Navbar>
  );
};
```

### ブレークポイント制御
- 768px未満: display: none (mobile)
- 768px以上: display: block (desktop)

### 状態管理
- collapsed状態による幅制御 (80px ↔ 280px)
- アクティブページのハイライト
- ツールチップ表示（collapsed時）