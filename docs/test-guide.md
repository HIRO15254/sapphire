# Sapphire テスト作成ガイド

このドキュメントでは、SapphireプロジェクトでTDD（テスト駆動開発）を実践するための包括的なテスト戦略とその実装方法について説明します。

## 概要

Sapphireは以下の技術スタックを使用したTauriアプリケーションです：

- **フロントエンド**: React + TypeScript + Mantine UI
- **バックエンド**: Rust + Tauri v2
- **ビルドツール**: Vite
- **パッケージマネージャー**: Bun

## テスト戦略

### 1. ユニットテスト（単体テスト）

#### フロントエンド（React/TypeScript）
- **フレームワーク**: Vitest + React Testing Library
- **対象**: コンポーネント、フック、ユーティリティ関数
- **モック**: Tauri APIのモック化

#### バックエンド（Rust）
- **フレームワーク**: Rustの標準テストフレームワーク
- **対象**: Tauriコマンド、ビジネスロジック
- **場所**: `src-tauri/src/lib.rs` 内の `#[cfg(test)]` モジュール

### 2. 統合テスト（E2E）
- **予定**: 将来的にWebDriverIO + Tauri WebDriverで実装予定
- **対象**: アプリケーション全体の動作
- **環境**: 実際のアプリケーションウィンドウでの操作

## セットアップ

### 必要な依存関係

```json
{
  "devDependencies": {
    "vitest": "^2.1.8",
    "@vitest/ui": "^2.1.8",
    "jsdom": "^25.0.1",
    "@testing-library/react": "^16.1.0",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/user-event": "^14.5.2",
  }
}
```


## テストコマンド

```bash
# フロントエンドテスト（開発時：watch mode）
bun run test

# フロントエンドテスト（CI/単発実行）
bun run test:run

# フロントエンドテスト（UI付き）
bun run test:ui

# Rustユニットテスト
bun run test:rust

# 全てのテスト実行（フロントエンド + Rust）
bun run test:all
```

## フロントエンドテストの書き方

### 基本的なコンポーネントテスト

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import App from '../App';
import { mockTauriCommand, clearTauriMocks } from './mocks/tauri';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>{children}</MantineProvider>
);

describe('App Component', () => {
  beforeEach(() => {
    clearTauriMocks();
  });

  test('renders welcome title', () => {
    render(<App />, { wrapper: Wrapper });
    expect(screen.getByText('Welcome to Tauri + React')).toBeInTheDocument();
  });

  test('calls greet command when form is submitted', async () => {
    const user = userEvent.setup();
    const mockGreeting = 'Hello, John! You\'ve been greeted from Rust!';
    mockTauriCommand('greet', mockGreeting);
    
    render(<App />, { wrapper: Wrapper });
    
    const input = screen.getByPlaceholderText('Enter a name...');
    const button = screen.getByRole('button', { name: 'Greet' });
    
    await user.type(input, 'John');
    await user.click(button);
    
    await waitFor(() => {
      expect(screen.getByText(mockGreeting)).toBeInTheDocument();
    });
  });
});
```

### Tauri APIのモック化

```typescript
// src/test/mocks/tauri.ts
import { vi } from 'vitest';

export const mockInvoke = vi.fn();

vi.mock('@tauri-apps/api/core', () => ({
  invoke: mockInvoke,
}));

export function mockTauriCommand(command: string, returnValue: any) {
  mockInvoke.mockImplementation((cmd: string, args: any) => {
    if (cmd === command) {
      return Promise.resolve(returnValue);
    }
    return Promise.reject(`Unknown command: ${cmd}`);
  });
}

export function clearTauriMocks() {
  mockInvoke.mockClear();
}
```

## Rustテストの書き方

### 基本的なコマンドテスト

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_greet_command() {
        let result = greet("World");
        assert_eq!(result, "Hello, World! You've been greeted from Rust!");
    }

    #[test]
    fn test_greet_empty_name() {
        let result = greet("");
        assert_eq!(result, "Hello, ! You've been greeted from Rust!");
    }

    #[test]
    fn test_greet_with_unicode() {
        let result = greet("世界");
        assert_eq!(result, "Hello, 世界! You've been greeted from Rust!");
    }
}
```

### Tauri統合テスト（高度）

```rust
#[cfg(test)]
mod integration_tests {
    use tauri::test::{mock_context, noop_assets, MockRuntime};
    
    #[tokio::test]
    async fn test_app_initialization() {
        let app = tauri::test::mock_builder()
            .invoke_handler(tauri::generate_handler![super::greet])
            .build(mock_context(noop_assets()))
            .expect("failed to build app");
        
        // アプリケーションの初期化テスト
        let windows = app.webview_windows();
        assert!(!windows.is_empty());
    }
}
```

## E2Eテストの書き方

### 基本的なE2Eテスト

```typescript
import { browser } from '@wdio/globals'

describe('Sapphire App E2E Tests', () => {
  beforeEach(async () => {
    await browser.pause(2000) // アプリの完全読み込み待機
  })

  it('should display the welcome title', async () => {
    const title = await $('h1')
    await expect(title).toHaveText('Welcome to Tauri + React')
  })

  it('should greet the user when name is entered', async () => {
    const input = await $('input[placeholder=\"Enter a name...\"]')
    const button = await $('button*=Greet')

    await input.setValue('World')
    await button.click()

    const greeting = await $('*=Hello, World!')
    await expect(greeting).toBeDisplayed()
  })
})
```

## TDD実践のワークフロー

### 1. レッド（Red）- 失敗するテストを書く

```typescript
// まず失敗するテストを書く
test('should calculate area of rectangle', () => {
  const result = calculateArea(5, 10);
  expect(result).toBe(50);
});
```

### 2. グリーン（Green）- 最小限の実装でテストを通す

```typescript
// 最小限の実装
function calculateArea(width: number, height: number): number {
  return width * height;
}
```

### 3. リファクタ（Refactor）- コードを改善する

```typescript
// より良い実装に改善
function calculateArea(width: number, height: number): number {
  if (width < 0 || height < 0) {
    throw new Error('Width and height must be positive numbers');
  }
  return width * height;
}
```

## ベストプラクティス

### テストの命名規則

```typescript
// ❌ 悪い例
test('test1', () => { });

// ✅ 良い例
test('should display error message when name is empty', () => { });
```

### テストの独立性

```typescript
// ❌ 悪い例 - テスト間で状態を共有
let globalState = {};

// ✅ 良い例 - 各テストで初期化
beforeEach(() => {
  clearMocks();
  resetGlobalState();
});
```

### アサーションの明確性

```typescript
// ❌ 悪い例
expect(result).toBeTruthy();

// ✅ 良い例
expect(result).toBe('Hello, World! You\'ve been greeted from Rust!');
```

## トラブルシューティング

### フロントエンドテスト

**問題**: Mantineコンポーネントがレンダリングされない
**解決策**: MantineProviderでコンポーネントをラップする

**問題**: Tauri API呼び出しでエラーが発生
**解決策**: `src/test/setup.ts`でモック化が正しく設定されているか確認

### Rustテスト

**問題**: テストがコンパイルエラーになる
**解決策**: `#[cfg(test)]` アトリビュートが正しく設定されているか確認

### E2Eテスト

**問題**: WebDriver接続エラー
**解決策**: 
1. `tauri-driver`がインストールされているか確認
2. 適切なWebDriverがインストールされているか確認
3. ポート9515が使用可能か確認

**問題**: 要素が見つからない
**解決策**: `waitforTimeout`を増やすか、明示的な待機を追加

## ファイル構造

```
sapphire/
├── src/
│   ├── test/
│   │   ├── setup.ts           # テスト設定
│   │   ├── mocks/
│   │   │   └── tauri.ts       # Tauriモック
│   │   └── App.test.tsx       # コンポーネントテスト
│   └── App.tsx
├── src-tauri/
│   └── src/
│       └── lib.rs             # Rustテスト
├── test/
│   └── e2e/
│       ├── app.spec.ts        # E2Eテスト
│       └── README.md
├── vitest.config.ts           # Vitestの設定
├── wdio.conf.ts              # WebDriverIOの設定
└── package.json
```

## 継続的インテグレーション（CI）

プロジェクトには3つのGitHub Actionsワークフローが設定されています：

### 1. `.github/workflows/test.yml` - 基本テスト

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - uses: actions-rs/toolchain@v1
      - run: bun install
      - run: bun run test:run      # フロントエンドテスト
      - run: cd src-tauri && cargo test  # Rustテスト
      - run: bun run build         # ビルドテスト
```

### 2. `.github/workflows/ci.yml` - 完全なCI/CDパイプライン

- **マルチプラットフォーム**: Ubuntu, Windows, macOS
- **テストスイート**: フロントエンド + Rust
- **リント**: Rustfmt, Clippy
- **ビルド**: Tauriアプリケーション生成
- **アーティファクト**: ビルド成果物の保存

### 3. `.github/workflows/e2e.yml` - E2Eテスト

- **プラットフォーム**: Ubuntu（WebKit）, Windows（Edge）
- **WebDriver**: 自動セットアップ
- **スクリーンショット**: 失敗時の証跡保存

### 使用方法

```bash
# ローカルでCIと同等のテストを実行
bun run test:all

# E2Eテストを実行
bun run test:e2e
```

このガイドに従って、堅牢で保守しやすいテストスイートを構築し、TDDを効果的に実践してください。
