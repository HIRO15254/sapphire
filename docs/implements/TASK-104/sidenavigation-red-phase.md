# TDD Redフェーズ設計書 - TASK-104 SideNavigation

## フェーズ概要

- **対象機能**: SideNavigation Component（デスクトップサイドバーナビゲーション）
- **フェーズ**: Red（失敗するテスト作成）
- **作成日**: 2025-09-22
- **総テストケース数**: 17件
- **信頼性レベル**: 🟢 高（EARS要件定義書・設計文書完全準拠）

## テスト設計方針

### 使用技術スタック

- **プログラミング言語**: TypeScript 5.0+
- **テストフレームワーク**: Vitest + React Testing Library
- **UIライブラリ**: Mantine 7.x
- **ルーティング**: React Router（統合テスト）
- **品質管理**: WCAG 2.1 AA準拠

### テストケース分類

#### 1. 正常系テストケース (5件)
| ID | テスト名 | 検証内容 | EARS要件 |
|---|---|---|---|
| TC-104-N001 | デスクトップサイドナビゲーション基本表示 | 768px以上での基本表示 | REQ-005 |
| TC-104-N002 | グループ化されたナビゲーション項目表示 | NavLink.Groupでのグループ表示 | 設計仕様 |
| TC-104-N003 | 折りたたみ状態での表示 | collapsed=true時の80px幅表示 | 設計仕様 |
| TC-104-N004 | アクティブ状態の表示 | React Router連携アクティブ状態 | REQ-106 |
| TC-104-N005 | バッジ表示機能 | NavigationItem.badge表示 | インターフェース仕様 |

#### 2. 異常系テストケース (3件)
| ID | テスト名 | 検証内容 | 想定シナリオ |
|---|---|---|---|
| TC-104-E001 | 空のナビゲーション項目配列 | 空データでの安定動作 | 初期化エラー、権限なし |
| TC-104-E002 | 不正なナビゲーション項目データ | 必須フィールド欠損対応 | API応答不整合、変換バグ |
| TC-104-E003 | アイコンコンポーネントの読み込み失敗 | アイコン依存関係エラー対応 | ライブラリ更新、import失敗 |

#### 3. 境界値テストケース (3件)
| ID | テスト名 | 検証内容 | 境界値 |
|---|---|---|---|
| TC-104-B001 | 画面幅境界値でのレスポンシブ表示 | 768px境界での表示制御 | 767px/768px/769px |
| TC-104-B002 | 最大項目数でのスクロール動作 | ScrollArea対応大量データ | 50項目（画面高さ超過） |
| TC-104-B003 | 折りたたみ状態切り替えの境界動作 | 高速切り替え時の安定性 | 連続10回切り替え |

#### 4. アクセシビリティテストケース (2件)
| ID | テスト名 | 検証内容 | WCAG準拠 |
|---|---|---|---|
| TC-104-A001 | キーボードナビゲーション操作 | キーボードのみでの操作 | REQ-402, WCAG 2.1 |
| TC-104-A002 | スクリーンリーダー対応 | ARIA属性とセマンティック構造 | REQ-401, WCAG 2.1 AA |

#### 5. パフォーマンステストケース (1件)
| ID | テスト名 | 検証内容 | パフォーマンス要件 |
|---|---|---|---|
| TC-104-P001 | レイアウト切り替えパフォーマンス | 折りたたみ/展開速度測定 | NFR-001: 200ms, NFR-002: 300ms |

#### 6. 統合テストケース (3件)
| ID | テスト名 | 検証内容 | 統合対象 |
|---|---|---|---|
| TC-104-I001 | ResponsiveLayoutとの統合 | AppShell.Navbar内配置 | TASK-101 |
| TC-104-I002 | ルーティングシステムとの統合 | React Router連携 | REQ-106 |
| TC-104-I003 | テーマシステムとの統合 | Mantineテーマ継承 | Mantine 7.x |

## 実装期待値

### 現在の実装状況

```typescript
// 現在のSideNavigation.tsx（簡易実装）
export const SideNavigation = memo<SideNavigationProps>(({ groupedItems }) => {
  return (
    <Stack h="100%" gap={0} role="navigation" aria-label="サイドナビゲーション">
      {/* 基本的なグループ表示のみ */}
    </Stack>
  );
});
```

### 失敗が期待される機能

1. **Navbar統合**: Mantine Navbarコンポーネント未使用
2. **折りたたみ機能**: `collapsed` prop未対応
3. **幅制御**: 280px/80px幅切り替え未実装
4. **ScrollArea**: スクロール機能未統合
5. **バッジ表示**: badge prop処理未実装
6. **アクティブ状態**: Router連携未実装
7. **ツールチップ**: 折りたたみ時ツールチップ未対応
8. **ブレークポイント**: レスポンシブ制御未実装
9. **アクセシビリティ**: ARIA属性不完全
10. **パフォーマンス**: React.memo最適化不十分

## テストコード品質指標

### 日本語コメント要件

- ✅ テスト目的、内容、期待動作の明記
- ✅ 信頼性レベル（🟢🟡🔴）の表示
- ✅ Given-When-Then構造
- ✅ 各expectステートメントの説明
- ✅ セットアップ・クリーンアップの理由明記

### コード品質

- ✅ TypeScript型安全性
- ✅ React Testing Library推奨パターン
- ✅ Vitestテストフレームワーク活用
- ✅ 既存FooterNavigationテストパターン準拠
- ✅ モックデータの適切な設計

## 次フェーズへの移行条件

### テスト実行結果

すべてのテストが意図的に失敗することを確認：

```bash
bun run test:unit -- SideNavigation.test.tsx
```

### 期待される失敗パターン

1. **コンポーネント構造**: Navbar要素が見つからない
2. **Props対応**: collapsed, onToggleCollapse未対応
3. **スタイル設定**: 幅制御、ブレークポイント未設定
4. **機能統合**: ScrollArea, Badge, Tooltip未統合
5. **ルーティング**: React Router Link未統合
6. **アクセシビリティ**: ARIA属性不足

### Greenフェーズ要件

17のテストケースをすべて通すための最小実装：

1. **Mantine Navbar統合**
2. **collapsed状態管理**
3. **レスポンシブ幅制御**
4. **ScrollArea統合**
5. **NavLink機能拡張**
6. **React Router統合**
7. **ARIA属性完全対応**
8. **パフォーマンス最適化**

## 品質保証

### テストカバレッジ目標

- **行カバレッジ**: 85%以上
- **分岐カバレッジ**: 80%以上
- **機能カバレッジ**: 100%（全17テストケース）

### コンプライアンス確認

- ✅ EARS要件完全準拠
- ✅ WCAG 2.1 AA対応
- ✅ TypeScript型安全性
- ✅ React Testing Library推奨パターン
- ✅ 既存プロジェクト品質基準

## 実行コマンド

### テスト実行

```bash
# 単体テスト実行
bun run test:unit -- SideNavigation.test.tsx

# 詳細結果表示
bun run test:unit -- SideNavigation.test.tsx --reporter=verbose

# カバレッジ測定
bun run test:unit -- SideNavigation.test.tsx --coverage
```

### 期待されるエラーメッセージ例

```
FAIL src/components/layout/ResponsiveLayout/components/SideNavigation.test.tsx
✗ TC-104-N003: 折りたたみ状態での表示
  Expected element to have style { width: "80px" }
  Received: { width: undefined }
```

Redフェーズが完了し、すべてのテストが意図的に失敗することを確認後、Greenフェーズ（最小実装）に進む。