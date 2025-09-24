# TDD要件定義・機能仕様の整理

**【機能名】**: TASK-102 HeaderNavigationコンポーネント

## 1. 機能の概要（EARS要件定義書・設計文書ベース）

- 🟢 **主要機能**: デスクトップ/モバイルレイアウトに応じてヘッダーナビゲーションの表示を動的に切り替えるコンポーネント
- 🟢 **問題解決**: REQ-004「デスクトップ表示時にヘッダーメニューを表示」とREQ-105「主要画面への遷移をヘッダーメニューで提供」の実現
- 🟢 **想定ユーザー**:
  - デスクトップユーザー（水平ナビゲーションでの効率的なページ遷移）
  - モバイルユーザー（ハンバーガーメニューボタンによるメニューアクセス）
  - 視覚障害ユーザー（適切なARIA属性による支援技術対応）
- 🟢 **システム内位置づけ**: TASK-101 ResponsiveLayoutのAppShell.Headerに配置される最上位ナビゲーションコンポーネント
- **参照したEARS要件**: REQ-004, REQ-105, REQ-401, REQ-402, NFR-001, NFR-002
- **参照した設計文書**: responsive-layout-tasks.md「TASK-102実装詳細」、responsive-layout-requirements.md「機能要件・制約要件」

## 2. 入力・出力の仕様（EARS機能要件・TypeScript型定義ベース）

### 入力パラメータ
- 🟢 **items**: `NavigationItem[]` - ナビゲーション項目配列（TASK-101のsafeNavigationConfig.primaryから取得）
  - `NavigationItem.id`: 一意識別子（キーとして使用）
  - `NavigationItem.label`: 表示ラベル
  - `NavigationItem.path`: 遷移先パス（将来のルーティング統合用）
  - `NavigationItem.icon`: Tabler Iconsコンポーネント（オプション）
- 🟢 **isMobile**: `boolean` - モバイルレイアウト判定フラグ（useResponsiveLayoutから取得）
- 🟢 **hamburgerOpened**: `boolean` - ハンバーガーメニューの開閉状態
- 🟢 **onHamburgerToggle**: `() => void` - ハンバーガーメニュー開閉トリガー関数

### 出力値
- 🟢 **デスクトップモード** (isMobile=false):
  - ブランドロゴ（左）+ 水平ナビゲーション（中央）+ テーマ切り替えボタン（右）
  - ハンバーガーメニューボタン非表示
- 🟢 **モバイルモード** (isMobile=true):
  - ハンバーガーメニューボタン + ブランドロゴ（左）+ テーマ切り替えボタン（右）
  - 水平ナビゲーション非表示
- 🟢 **アクセシビリティ対応**: 適切なARIA属性、44px+タップ領域、role="navigation"設定
- **参照したEARS要件**: REQ-004, REQ-105, REQ-401
- **参照した設計文書**: NavigationTypes.ts「NavigationItem型定義」、ComponentTypes.ts「HeaderNavigationProps型定義」

## 3. 制約条件（EARS非機能要件・アーキテクチャ設計ベース）

### パフォーマンス要件
- 🟢 **NFR-001**: レイアウト切り替えは200ms以内で完了すること
- 🟢 **NFR-002**: UI操作（クリック・タップ）のレスポンスは300ms以内
- 🟡 **React.memo最適化**: 不要な再レンダリング防止による性能向上

### アクセシビリティ要件
- 🟢 **REQ-401**: WCAG 2.1 AA準拠（色コントラスト、キーボード操作、支援技術対応）
- 🟢 **REQ-402**: キーボードナビゲーション完全対応
- 🟢 **タップ領域**: 44px以上のミニマムタップ領域確保（iOS/Android HIG準拠）

### 技術制約
- 🟢 **Mantine依存**: Header, Group, NavLink, Burger, ActionIconコンポーネント使用
- 🟢 **アイコン**: Tabler Icons（IconSun, IconMoon）の使用
- 🟢 **ブレークポイント**: 768px(48em)固定境界値での動作
- 🟢 **テーマシステム**: useMantineColorSchemeとの統合

- **参照したEARS要件**: NFR-001, NFR-002, REQ-401, REQ-402
- **参照した設計文書**: responsive-layout-requirements.md「非機能要件・制約要件」

## 4. 想定される使用例（EARSEdgeケース・データフローベース）

### 基本的な使用パターン
- 🟢 **デスクトップナビゲーション**: ナビゲーション項目クリック→ページ遷移（将来実装）
- 🟢 **モバイルハンバーガー**: ハンバーガーボタンタップ→onHamburgerToggle実行→親コンポーネントでDrawer開閉
- 🟢 **テーマ切り替え**: テーマボタンクリック→useMantineColorScheme.toggleColorScheme()実行→ライト/ダーク切り替え

### エラーケース・エッジケース
- 🟡 **空ナビゲーション項目**: items=[]の場合でも安全に動作（ブランドロゴとテーマボタンのみ表示）
- 🟡 **不正ナビゲーション項目**: NavigationItemのlabelやidが不正な場合の表示スキップ
- 🟡 **長いラベル**: ナビゲーション項目のラベルが長い場合のテキスト省略

### データフロー
- 🟢 **TASK-101統合**: ResponsiveLayout → HeaderNavigation → Mantineコンポーネント
- 🟢 **状態管理**: useResponsiveLayout()のisMobile → 表示切り替え
- 🟢 **イベント伝播**: onHamburgerToggle → 親コンポーネントのhamburgerOpened状態更新

- **参照したEARS要件**: REQ-004, REQ-105
- **参照した設計文書**: responsive-layout-tasks.md「TASK-102実装詳細・UI/UX要件」

## 5. EARS要件・設計文書との対応関係

### 参照したユーザストーリー
- **ストーリー**: 「デスクトップユーザーがヘッダーから主要ページに効率的にアクセスできる」

### 参照した機能要件
- **REQ-004**: システムはデスクトップ表示時にヘッダーメニューを表示しなければならない
- **REQ-105**: デスクトップレイアウトの場合、システムは主要画面への遷移をヘッダーメニューで提供しなければならない
- **REQ-401**: システムはアクセシビリティガイドライン（WCAG 2.1 AA）に準拠しなければならない
- **REQ-402**: システムはキーボードナビゲーションをサポートしなければならない

### 参照した非機能要件
- **NFR-001**: レイアウト切り替えは200ms以内で完了すること
- **NFR-002**: メニューの開閉アニメーションは300ms以内で完了すること

### 参照したEdgeケース
- **EDGE-201**: 空ナビゲーション設定での安全な動作
- **EDGE-202**: 不正NavigationItem設定時のフォールバック処理

### 参照した受け入れ基準
- **デスクトップでナビゲーション項目が水平表示**
- **モバイルでハンバーガーメニューボタン表示**
- **テーマ切り替えボタンが動作**

### 参照した設計文書
- **アーキテクチャ**: responsive-layout-tasks.md「TASK-102実装詳細・テスト要件」
- **型定義**: NavigationTypes.ts「NavigationItem」、ComponentTypes.ts「HeaderNavigationProps」
- **要件定義**: responsive-layout-requirements.md「機能要件・非機能要件」
- **統合設計**: ResponsiveLayout.tsx「HeaderNavigation統合実装」