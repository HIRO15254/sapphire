# TDD実装例とベストプラクティス

このドキュメントでは、Sapphireプロジェクトで実装されているTDD（テスト駆動開発）の具体的な例とベストプラクティスを示します。

## 目次

1. [TDDサイクルの実践](#tddサイクルの実践)
2. [Rustデータベーステストの例](#rustデータベーステストの例)
3. [フロントエンド統合テストの例](#フロントエンド統合テストの例)
4. [E2Eテストの例](#e2eテストの例)
5. [テストヘルパーとユーティリティ](#テストヘルパーとユーティリティ)
6. [モックとテストデータ](#モックとテストデータ)
7. [CI/CDでのテスト実行](#cicdでのテスト実行)

## TDDサイクルの実践

### Red-Green-Refactorサイクル

#### 1. Red: 失敗するテストを書く

```rust
// src-tauri/src/lib.rs
#[tokio::test]
async fn test_create_user_with_validation() {
    let db = create_test_database();

    // まだ実装されていないバリデーション機能をテスト
    let result = create_user_with_validation(&db, CreateUser {
        name: "", // 空の名前はエラーになるべき
        email: "test@example.com".to_string(),
    }).await;

    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Name cannot be empty"));
}
```

#### 2. Green: 最小限の実装でテストを通す

```rust
// src-tauri/src/lib.rs
#[tauri::command]
async fn create_user_with_validation(
    db: State<'_, Database>,
    user: CreateUser
) -> Result<(), String> {
    // 最小限のバリデーション実装
    if user.name.trim().is_empty() {
        return Err("Name cannot be empty".to_string());
    }

    // 既存のcreate_user呼び出し
    create_user(db, user).await
}
```

#### 3. Refactor: コードを改善する

```rust
// src-tauri/src/lib.rs
impl CreateUser {
    fn validate(&self) -> Result<(), String> {
        if self.name.trim().is_empty() {
            return Err("Name cannot be empty".to_string());
        }

        if !self.email.contains('@') {
            return Err("Invalid email format".to_string());
        }

        Ok(())
    }
}

#[tauri::command]
async fn create_user_with_validation(
    db: State<'_, Database>,
    user: CreateUser
) -> Result<(), String> {
    user.validate()?;
    create_user(db, user).await
}
```

## Rustデータベーステストの例

### テスト用データベースセットアップ

```rust
// src-tauri/src/lib.rs
#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;
    use tempfile::NamedTempFile;

    fn create_test_database() -> Database {
        let temp_file = NamedTempFile::new().expect("Failed to create temp file");
        let conn = Connection::open(temp_file.path()).expect("Failed to open test database");

        // テーブル作成
        conn.execute(
            "CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        ).expect("Failed to create users table");

        Database(Mutex::new(conn))
    }
}
```

### データベース操作テスト

```rust
#[tokio::test]
async fn test_user_crud_operations() {
    let db = create_test_database();

    // CREATE: ユーザー作成
    {
        let conn = db.0.lock().unwrap();
        let result = conn.execute(
            "INSERT INTO users (name, email) VALUES (?1, ?2)",
            params!["John Doe", "john@example.com"],
        );
        assert!(result.is_ok());
    }

    // READ: ユーザー取得
    let user = {
        let conn = db.0.lock().unwrap();
        let mut stmt = conn.prepare("SELECT id, name, email FROM users WHERE email = ?1").unwrap();
        stmt.query_row(params!["john@example.com"], |row| {
            Ok(User {
                id: row.get(0)?,
                name: row.get(1)?,
                email: row.get(2)?,
                created_at: None,
            })
        }).unwrap()
    };

    assert_eq!(user.name, "John Doe");
    assert_eq!(user.email, "john@example.com");

    // UPDATE: ユーザー更新
    {
        let conn = db.0.lock().unwrap();
        let result = conn.execute(
            "UPDATE users SET name = ?1 WHERE id = ?2",
            params!["Jane Doe", user.id.unwrap()],
        );
        assert!(result.is_ok());
    }

    // DELETE: ユーザー削除
    {
        let conn = db.0.lock().unwrap();
        let result = conn.execute(
            "DELETE FROM users WHERE id = ?1",
            params![user.id.unwrap()],
        );
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), 1); // 1行削除されたことを確認
    }
}
```

### エラーハンドリングテスト

```rust
#[tokio::test]
async fn test_duplicate_email_constraint() {
    let db = create_test_database();

    // 最初のユーザーは成功
    {
        let conn = db.0.lock().unwrap();
        let result = conn.execute(
            "INSERT INTO users (name, email) VALUES (?1, ?2)",
            params!["User 1", "duplicate@example.com"],
        );
        assert!(result.is_ok());
    }

    // 同じメールアドレスでの2回目の挿入は失敗
    {
        let conn = db.0.lock().unwrap();
        let result = conn.execute(
            "INSERT INTO users (name, email) VALUES (?1, ?2)",
            params!["User 2", "duplicate@example.com"],
        );
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("UNIQUE constraint failed"));
    }
}
```

## フロントエンド統合テストの例

### カスタムレンダーヘルパー

```tsx
// src/test/helpers/renderWithProviders.tsx
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { render, RenderOptions } from "@testing-library/react";
import type React from "react";

const AllTheProviders = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>
    <Notifications />
    {children}
  </MantineProvider>
);

const renderWithProviders = (ui: React.ReactElement, options?: RenderOptions) =>
  render(ui, { wrapper: AllTheProviders, ...options });

export * from "@testing-library/react";
export { renderWithProviders as render };
```

### 統合ワークフローテスト

```tsx
// src/test/integration/UserWorkflow.test.tsx
import { beforeEach, describe, expect, test, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { waitFor } from "@testing-library/react";

describe("User Management Workflow", () => {
  beforeEach(() => {
    // モックの初期化
    mockInvoke.mockClear();
    mockInvoke.mockImplementation((command: string, args?: any) => {
      switch (command) {
        case "get_users":
          return Promise.resolve([]);
        case "create_user":
          return Promise.resolve();
        default:
          return Promise.resolve([]);
      }
    });
  });

  test("should create user with complete workflow", async () => {
    const user = userEvent.setup();
    render(<App />);

    // 1. Usersタブに移動
    await user.click(screen.getByText("Users"));

    // 2. フォームが表示されることを確認
    await waitFor(() => {
      expect(screen.getByText("Add New User")).toBeInTheDocument();
    });

    // 3. フォームに入力
    await user.type(screen.getByPlaceholderText("Name"), "John Doe");
    await user.type(screen.getByPlaceholderText("Email"), "john@example.com");

    // 4. ユーザー作成後のモック設定
    mockInvoke.mockImplementation((command: string) => {
      if (command === "create_user") return Promise.resolve();
      if (command === "get_users") {
        return Promise.resolve([
          { id: 1, name: "John Doe", email: "john@example.com" }
        ]);
      }
      return Promise.resolve([]);
    });

    // 5. フォーム送信
    await user.click(screen.getByRole("button", { name: /add user/i }));

    // 6. APIが正しく呼ばれることを確認
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith("create_user", {
        name: "John Doe",
        email: "john@example.com",
      });
    });
  });
});
```

### エラーハンドリングテスト

```tsx
test("should handle API errors gracefully", async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByText("Users"));

  // APIエラーをモック
  mockInvoke.mockImplementation((command: string) => {
    if (command === "create_user") {
      return Promise.reject(new Error("Database connection failed"));
    }
    return Promise.resolve([]);
  });

  await user.type(screen.getByPlaceholderText("Name"), "John Doe");
  await user.type(screen.getByPlaceholderText("Email"), "john@example.com");
  await user.click(screen.getByRole("button", { name: /add user/i }));

  // エラーハンドリングの確認
  await waitFor(() => {
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });
});
```

## E2Eテストの例

### 基本的なE2Eテスト

```typescript
// tests/e2e/app.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Sapphire App E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('h1:has-text("Sapphire - SQLite Database Demo")');
  });

  test('complete user and note creation workflow', async ({ page }) => {
    // ユーザー作成
    await page.click('text=Users');
    await page.fill('input[placeholder="Name"]', 'E2E User');
    await page.fill('input[placeholder="Email"]', 'e2e@example.com');
    await page.click('button:has-text("Add User")');

    await expect(page.locator('text=User created successfully')).toBeVisible({
      timeout: 10000
    });

    // ノート作成
    await page.click('text=Notes');
    await page.fill('input[placeholder="Note title"]', 'E2E Test Note');
    await page.fill('textarea[placeholder*="note content"]', 'Content from E2E test');

    // ユーザー選択
    await page.click('[data-testid="user-select"]');
    await page.click('text=E2E User');

    await page.click('button:has-text("Add Note")');

    await expect(page.locator('text=Note created successfully')).toBeVisible({
      timeout: 10000
    });

    // データの永続化確認
    await page.reload();
    await page.click('text=Notes');
    await expect(page.locator('text=E2E Test Note')).toBeVisible();
  });
});
```

### エラー状態のテスト

```typescript
test('should show validation errors for empty forms', async ({ page }) => {
  await page.click('text=Users');

  // 空のフォームを送信
  await page.click('button:has-text("Add User")');

  // バリデーションエラーの確認
  await expect(page.locator('text=Please fill in all fields')).toBeVisible({
    timeout: 5000
  });

  // フォームが送信されていないことを確認
  await expect(page.locator('text=User created successfully')).not.toBeVisible();
});
```

## テストヘルパーとユーティリティ

### テストデータファクトリー

```typescript
// src/test/helpers/testData.ts
export interface TestUser {
  id?: number;
  name: string;
  email: string;
  created_at?: string;
}

export const createTestUser = (overrides: Partial<TestUser> = {}): TestUser => ({
  name: "John Doe",
  email: "john@example.com",
  created_at: new Date().toISOString(),
  ...overrides,
});

export const createTestUsers = (count: number): TestUser[] =>
  Array.from({ length: count }, (_, index) =>
    createTestUser({
      id: index + 1,
      name: `User ${index + 1}`,
      email: `user${index + 1}@example.com`,
    })
  );

// 使用例
const testUsers = createTestUsers(5);
const specialUser = createTestUser({
  name: "Admin User",
  email: "admin@example.com"
});
```

### モックレスポンスヘルパー

```typescript
// src/test/helpers/testData.ts
export const mockResponses = {
  greet: (name: string) => `Hello, ${name}! You've been greeted from Rust!`,
  getUsers: (users: TestUser[] = []) => users,
  getNotes: (notes: TestNote[] = []) => notes,
  createUser: () => undefined,
  createNote: () => undefined,
  deleteUser: () => undefined,
  deleteNote: () => undefined,
};

// 使用例
mockInvoke.mockImplementation((command: string, args?: any) => {
  switch (command) {
    case "greet":
      return Promise.resolve(mockResponses.greet(args?.name || ""));
    case "get_users":
      return Promise.resolve(mockResponses.getUsers(testUsers));
    default:
      return Promise.resolve(null);
  }
});
```

## モックとテストデータ

### Tauri APIのモック

```typescript
// src/test/setup.ts
import { vi } from "vitest";

// Tauri APIのグローバルモック
Object.defineProperty(window, "__TAURI_INTERNALS__", {
  value: {},
});

Object.defineProperty(window, "__TAURI_IPC__", {
  value: {
    invoke: vi.fn(),
  },
});

// ResizeObserverのモック（Mantineで必要）
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
```

### カスタムモックフック

```typescript
// src/test/helpers/useMockTauri.ts
import { vi } from "vitest";
import { invoke } from "@tauri-apps/api/core";

export function useMockTauri() {
  const mockInvoke = vi.mocked(invoke);

  const mockCommand = (command: string, response: any) => {
    mockInvoke.mockImplementation((cmd: string) => {
      if (cmd === command) {
        return Promise.resolve(response);
      }
      return Promise.reject(`Unknown command: ${cmd}`);
    });
  };

  const mockError = (command: string, error: Error) => {
    mockInvoke.mockImplementation((cmd: string) => {
      if (cmd === command) {
        return Promise.reject(error);
      }
      return Promise.resolve(null);
    });
  };

  const clearMocks = () => {
    mockInvoke.mockClear();
    mockInvoke.mockReset();
  };

  return { mockCommand, mockError, clearMocks, mockInvoke };
}
```

## CI/CDでのテスト実行

### GitHub Actionsワークフロー

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [ main, master, develop ]
  pull_request:
    branches: [ main, master, develop ]

jobs:
  test-frontend:
    name: Frontend Tests
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - name: Setup Bun
      uses: oven-sh/setup-bun@v1
    - name: Install dependencies
      run: bun install
    - name: Run tests with coverage
      run: bun run test:coverage
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info

  test-rust:
    name: Rust Tests
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - name: Setup Rust
      uses: actions-rs/toolchain@v1
      with:
        toolchain: stable
    - name: Run Rust tests
      run: cd src-tauri && cargo test -- --test-threads=1
```

### 並列テスト実行

```bash
# package.json
{
  "scripts": {
    "test:parallel": "concurrently \"bun run test:run\" \"bun run test:rust\"",
    "test:full": "bun run test:coverage && bun run test:rust && bun run test:e2e"
  }
}
```

## パフォーマンステスト例

### Rustパフォーマンステスト

```rust
#[tokio::test]
async fn test_bulk_user_creation_performance() {
    let db = create_test_database();
    let start = std::time::Instant::now();

    // 1000ユーザーの一括作成
    {
        let conn = db.0.lock().unwrap();
        let tx = conn.transaction().unwrap();

        for i in 0..1000 {
            tx.execute(
                "INSERT INTO users (name, email) VALUES (?1, ?2)",
                params![format!("User {}", i), format!("user{}@example.com", i)],
            ).unwrap();
        }

        tx.commit().unwrap();
    }

    let duration = start.elapsed();

    // 1秒以内で完了することを確認
    assert!(duration < std::time::Duration::from_secs(1));

    // データが正しく挿入されたことを確認
    {
        let conn = db.0.lock().unwrap();
        let mut stmt = conn.prepare("SELECT COUNT(*) FROM users").unwrap();
        let count: i64 = stmt.query_row([], |row| row.get(0)).unwrap();
        assert_eq!(count, 1000);
    }
}
```

### フロントエンドパフォーマンステスト

```tsx
test("should render large user list efficiently", async () => {
  const largeUserList = createTestUsers(1000);

  mockInvoke.mockImplementation((command: string) => {
    if (command === "get_users") {
      return Promise.resolve(largeUserList);
    }
    return Promise.resolve([]);
  });

  const startTime = performance.now();
  render(<App />);

  await user.click(screen.getByText("Users"));

  // すべてのユーザーが表示されるまで待機
  await waitFor(() => {
    expect(screen.getByText("User 1")).toBeInTheDocument();
    expect(screen.getByText("User 1000")).toBeInTheDocument();
  }, { timeout: 5000 });

  const endTime = performance.now();
  const renderTime = endTime - startTime;

  // 3秒以内でレンダリング完了
  expect(renderTime).toBeLessThan(3000);
});
```

## まとめ

この実装例では以下のTDDベストプラクティスを実践しています：

1. **テストファースト**: 機能実装前にテストを書く
2. **小さなステップ**: 最小限の実装でテストを通す
3. **継続的リファクタリング**: テストで安全性を保ちながらコード改善
4. **包括的テスト**: ユニット、統合、E2Eテストの組み合わせ
5. **自動化**: CI/CDでの継続的テスト実行
6. **ドキュメント化**: テストをドキュメントとして活用

これらの例を参考に、プロジェクトの要件に合わせてテストを実装してください。