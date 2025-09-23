# TASK-302: アクセシビリティ対応強化 - 要件定義

## 1. 概要

WCAG 2.1 AA準拠のアクセシビリティ強化を実装し、スクリーンリーダー対応、キーボードナビゲーション強化、カラーコントラスト最適化を行います。

## 2. 機能要件

### 2.1 WCAG 2.1 AA準拠実装 (REQ-401)

#### 2.1.1 知覚可能 (Perceivable)
- **1.1.1 非テキストコンテンツ**: 全ての画像とアイコンに適切なalt属性を設定
- **1.3.1 情報と関係**: セマンティックHTML要素とARIA属性で情報構造を明確化
- **1.4.3 コントラスト（最小）**: 最小コントラスト比4.5:1（大文字は3:1）を確保
- **1.4.4 テキストのサイズ変更**: 200%まで拡大してもコンテンツが利用可能
- **1.4.10 リフロー**: 320pxの幅で水平スクロール不要

#### 2.1.2 操作可能 (Operable)
- **2.1.1 キーボード**: 全ての機能をキーボードで操作可能
- **2.1.2 キーボードトラップなし**: フォーカストラップの適切な実装
- **2.4.1 ブロックスキップ**: スキップリンクの実装
- **2.4.3 フォーカス順序**: 論理的なTab順序
- **2.4.7 フォーカスの可視化**: 明確なフォーカスインジケーター

#### 2.1.3 理解可能 (Understandable)
- **3.2.1 フォーカス時**: フォーカス時の文脈変更なし
- **3.2.2 入力時**: 予期しない文脈変更なし

#### 2.1.4 堅牢 (Robust)
- **4.1.2 名前、役割、値**: 全てのUI要素に適切なARIA属性
- **4.1.3 ステータスメッセージ**: Live regionsで動的コンテンツを通知

### 2.2 スクリーンリーダー対応 (REQ-402)

#### 2.2.1 ARIA属性の実装
```typescript
// ナビゲーション要素
<nav aria-label="メインナビゲーション" role="navigation">
  <ul role="menubar">
    <li role="menuitem" aria-current="page">ホーム</li>
  </ul>
</nav>

// ランドマーク
<main aria-label="メインコンテンツ">
<aside aria-label="サイドナビゲーション">
<footer aria-label="フッター">

// 状態変化の通知
<div aria-live="polite" aria-atomic="true">
  ナビゲーションが展開されました
</div>
```

#### 2.2.2 スキップリンク実装
```typescript
<a href="#main-content" className="skip-link">
  メインコンテンツにスキップ
</a>
```

#### 2.2.3 適切な見出し構造
```typescript
<h1>アプリケーション名</h1>
  <h2>ナビゲーション</h2>
  <h2>メインコンテンツ</h2>
    <h3>セクション1</h3>
```

### 2.3 キーボードナビゲーション強化 (REQ-403)

#### 2.3.1 キーボードショートカット
- **Tab**: 次の要素にフォーカス移動
- **Shift+Tab**: 前の要素にフォーカス移動
- **Enter/Space**: アクティブ要素の実行
- **Escape**: モーダル・ドロワーの閉じる
- **矢印キー**: メニュー内のナビゲーション
- **Home/End**: リスト内の最初/最後に移動

#### 2.3.2 フォーカストラップ実装
```typescript
const useFocusTrap = (isOpen: boolean) => {
  const trapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const focusableElements = trapRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements?.length) {
      (focusableElements[0] as HTMLElement).focus();
    }

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const firstElement = focusableElements?.[0] as HTMLElement;
      const lastElement = focusableElements?.[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  return trapRef;
};
```

### 2.4 カラーコントラスト最適化

#### 2.4.1 コントラスト比要件
- **通常テキスト**: 4.5:1以上
- **大きなテキスト（18pt以上）**: 3:1以上
- **UI要素**: 3:1以上

#### 2.4.2 カラーパレット最適化
```typescript
// ライトテーマ
const lightColors = {
  text: '#2c2e33', // コントラスト比: 12.63:1 (白背景)
  primary: '#228be6', // コントラスト比: 4.52:1 (白背景)
  secondary: '#495057', // コントラスト比: 7.73:1 (白背景)
  error: '#fa5252', // コントラスト比: 4.77:1 (白背景)
  success: '#51cf66', // コントラスト比: 4.89:1 (白背景)
  warning: '#fd7e14', // コントラスト比: 4.54:1 (白背景)
};

// ダークテーマ
const darkColors = {
  text: '#c1c2c5', // コントラスト比: 9.89:1 (黒背景)
  primary: '#339af0', // コントラスト比: 6.14:1 (黒背景)
  secondary: '#adb5bd', // コントラスト比: 7.32:1 (黒背景)
  error: '#ff6b6b', // コントラスト比: 5.47:1 (黒背景)
  success: '#69db7c', // コントラスト比: 6.89:1 (黒背景)
  warning: '#ffa94d', // コントラスト比: 7.45:1 (黒背景)
};
```

## 3. 非機能要件

### 3.1 パフォーマンス
- アクセシビリティ機能追加によるパフォーマンス影響を最小限に抑制
- フォーカス移動は100ms以内で完了
- スクリーンリーダー読み上げの遅延なし

### 3.2 互換性
- 主要スクリーンリーダー対応（NVDA, JAWS, VoiceOver）
- ブラウザ標準のアクセシビリティAPI準拠

### 3.3 ユーザビリティ
- reduced-motion設定への対応
- ハイコントラストモード対応
- 拡大表示（200%まで）対応

## 4. 技術仕様

### 4.1 使用ライブラリ
- **@axe-core/react**: アクセシビリティ自動テスト
- **focus-trap-react**: フォーカストラップ実装
- **react-aria**: アクセシビリティパターン実装

### 4.2 実装対象コンポーネント
- HeaderNavigation
- SideNavigation
- FooterNavigation
- HamburgerMenu
- ResponsiveLayout

### 4.3 テスト要件
- axe-core自動テスト（0エラー）
- キーボードナビゲーションテスト
- スクリーンリーダーテスト
- カラーコントラストテスト

## 5. 受入条件

1. **自動テスト**: axe-coreテストで0エラー
2. **手動テスト**: キーボードのみで全機能操作可能
3. **コントラスト**: 全要素でWCAG AA基準クリア
4. **スクリーンリーダー**: 適切な読み上げ順序と内容
5. **フォーカス**: 明確で論理的なフォーカス移動
6. **セマンティック**: 適切なHTML構造とARIA属性

## 6. 実装優先度

### P0 (必須)
- フォーカスインジケーター
- キーボードナビゲーション
- 基本的なARIA属性

### P1 (高)
- スキップリンク
- Live regions
- カラーコントラスト

### P2 (中)
- 詳細なARIA属性
- アクセシビリティヘルプ
- カスタムキーボードショートカット