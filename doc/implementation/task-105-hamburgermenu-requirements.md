# TDD要件定義・機能仕様の整理

**【機能名】**: TASK-105 HamburgerMenu Component - Mobile Drawer Navigation

## 1. 機能の概要（EARS要件定義書・設計文書ベース）

- 🟢 **何をする機能か**: モバイル表示時（768px未満）に表示されるドロワー式ナビゲーション機能
- 🟢 **解決する問題**: モバイルユーザーが限られた画面スペースでナビゲーション項目に効率的にアクセスできるようにする
- 🟢 **想定ユーザー**: モバイル環境でアプリケーションを使用するユーザー（Story 3より）
- 🟢 **システム内位置づけ**: ResponsiveLayoutコンポーネント内でのDrawer要素として実装、HeaderNavigationのトリガーボタンと連携
- **参照したEARS要件**: REQ-003, REQ-104, REQ-201
- **参照した設計文書**: architecture.md ResponsiveLayout設計セクション

## 2. 入力・出力の仕様（EARS機能要件・TypeScript型定義ベース）

- 🟢 **入力パラメータ**:
  ```typescript
  interface HamburgerMenuProps {
    items: NavigationItem[];
    groupedItems: Record<string, NavigationItem[]>;
    isOpen: boolean;
    onClose: () => void;
    onToggle: () => void;
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
  - JSX.Element（Mantine DrawerベースのReactコンポーネント）
  - ドロワー状態: 開閉状態の管理とアニメーション
  - モバイル専用表示: 768px未満でのみアクティブ
  - フォーカス管理: Drawer開閉時の適切なフォーカス制御

- 🟢 **入出力関係性**: NavigationItemsをモバイル用ドロワーUIとして表示し、タッチ操作に最適化
- 🟢 **データフロー**: HeaderNavigation trigger → HamburgerMenu state → Drawer display → NavLink navigation
- **参照したEARS要件**: REQ-003, REQ-104
- **参照した設計文書**: interfaces.ts NavigationItem定義

## 3. 制約条件（EARS非機能要件・アーキテクチャ設計ベース）

- 🟢 **パフォーマンス要件**:
  - ドロワー開閉アニメーション300ms以内（NFR-002）
  - タッチ操作レスポンス16ms以内（60FPS維持）
  - React.memo最適化必須

- 🟢 **セキュリティ要件**:
  - XSS防止のための入力値検証
  - Navigation pathの検証
  - フォーカストラップによるセキュアな操作制限

- 🟢 **互換性要件**:
  - モバイルのみ表示（768px未満）（REQ-003 MUST）
  - Mantine 8.x Drawer component使用必須
  - タッチデバイス最適化

- 🟢 **アーキテクチャ制約**:
  - Drawer portalでの実装
  - Tauri 2.0+ + React 18 + TypeScript 5.0+環境
  - Vitest + React Testing Library でのテスト必須

- 🟢 **アクセシビリティ制約**:
  - WCAG 2.1 AA準拠必須（REQ-401）
  - フォーカストラップ対応必須
  - Escキーで閉じる機能必須
  - 44px以上のタッチターゲット
  - 適切なARIA属性（role="dialog"）

- 🟢 **UX制約**:
  - スライドインアニメーション
  - オーバーレイ背景でのタッチクローズ
  - スクロール可能な長いナビゲーション項目
  - テーマシステム連携

- **参照したEARS要件**: NFR-002, REQ-401, REQ-003
- **参照した設計文書**: architecture.md アクセシビリティ要件セクション

## 4. 想定される使用例（EARSEdgeケース・データフローベース）

- 🟢 **基本的な使用パターン**:
  - モバイル画面でのハンバーガーボタンタップ
  - ドロワー表示とナビゲーション項目選択
  - 項目選択後のドロワー自動クローズ
  - オーバーレイタッチまたはEscキーでの手動クローズ

- 🟢 **データフロー**:
  - User tap hamburger → HamburgerMenu open → User tap nav item → Router navigation → Drawer auto-close

- 🟡 **エッジケース**:
  - 非常に多くのナビゲーション項目（スクロール対応）
  - 画面幅がブレークポイント境界での動作
  - 画面回転時のDrawer状態管理
  - 長時間開いたままの状態での背景スクロール制御

- 🟡 **エラーケース**:
  - Navigation item読み込み失敗
  - アイコンコンポーネントの読み込み失敗
  - 空のナビゲーション項目配列
  - ドロワー開閉中の連続操作

- **参照したEARS要件**: REQ-003, REQ-104基本フロー
- **参照した設計文書**: dataflow.md モバイルナビゲーションフロー図

## 5. EARS要件・設計文書との対応関係

- **参照したユーザストーリー**: Story 3 - モバイルユーザーの効率的ナビゲーション
- **参照した機能要件**:
  - REQ-003: System must provide hamburger menu for mobile navigation
  - REQ-104: Mobile layout must show hamburger menu instead of side menu
  - REQ-201: Navigation system integration with responsive layout
  - REQ-401: WCAG 2.1 AA compliance required
  - REQ-402: Keyboard navigation support required
- **参照した非機能要件**:
  - NFR-002: Animation completion within 300ms
  - NFR-003: Touch response within 16ms (60FPS)
- **参照したEdgeケース**: 画面幅境界値、画面回転、大量データ表示
- **参照した受け入れ基準**: モバイル専用表示、フォーカストラップ、Escキー対応、アニメーション性能
- **参照した設計文書**:
  - **アーキテクチャ**: architecture.md ResponsiveLayoutコンポーネント設計
  - **データフロー**: dataflow.md モバイルナビゲーション操作フロー
  - **型定義**: interfaces.ts NavigationItem, HamburgerMenuProps
  - **データベース**: 該当なし（クライアントサイドコンポーネント）
  - **API仕様**: 該当なし（プレゼンテーション層コンポーネント）

## 実装仕様詳細

### コンポーネント構造
```typescript
// HamburgerMenu Component
const HamburgerMenu: React.FC<HamburgerMenuProps> = ({
  items,
  groupedItems,
  isOpen,
  onClose,
  onToggle
}) => {
  return (
    <Drawer
      opened={isOpen}
      onClose={onClose}
      position="left"
      size="300px"
      withOverlay
      trapFocus
      closeOnEscape
      closeOnClickOutside
    >
      <Stack gap={0}>
        <DrawerHeader>
          <Title order={4}>メニュー</Title>
          <ActionIcon onClick={onClose}>
            <IconX />
          </ActionIcon>
        </DrawerHeader>
        <ScrollArea style={{ height: 'calc(100vh - 80px)' }}>
          {Object.entries(groupedItems).map(([group, groupItems]) => (
            <Stack key={group} gap="xs">
              {group !== 'default' && (
                <Text size="xs" weight={600} color="dimmed">
                  {group}
                </Text>
              )}
              {groupItems.map(item => (
                <NavLink
                  key={item.id}
                  label={item.label}
                  icon={item.icon}
                  component={Link}
                  to={item.path}
                  onClick={onClose}
                  rightSection={item.badge && <Badge>{item.badge}</Badge>}
                />
              ))}
            </Stack>
          ))}
        </ScrollArea>
      </Stack>
    </Drawer>
  );
};
```

### ブレークポイント制御
- 768px以上: display: none (desktop - SideNavigation使用)
- 768px未満: display: block (mobile - HamburgerMenu使用)

### 状態管理
- isOpen状態による開閉制御
- HeaderNavigationのハンバーガーボタンと連携
- 項目選択時の自動クローズ
- フォーカストラップと適切なARIA属性

### アニメーション仕様
- スライドイン: left → right (300ms ease-out)
- オーバーレイフェード: opacity 0 → 1 (200ms ease)
- 背景スクロール無効化: body scroll-lock

### アクセシビリティ対応
- role="dialog", aria-modal="true"
- フォーカストラップ: Drawer内要素への制限
- Escキー: onClose呼び出し
- 適切なaria-label, aria-describedby
- 44px以上のタッチターゲット確保