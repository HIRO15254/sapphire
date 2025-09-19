# Sapphire テストアーキテクチャ設計

このドキュメントでは、Sapphireプロジェクトにおけるテストアーキテクチャの設計思想と実装について詳しく説明します。

## アーキテクチャ概要

```
┌─────────────────────────────────────────────────────────────┐
│                    Sapphire Test Architecture                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │  E2E Tests    │  │ Integration  │  │   Unit Tests    │   │
│  │  (Playwright) │  │    Tests     │  │    (Vitest)     │   │
│  └───────────────┘  │   (Vitest)   │  └─────────────────┘   │
│         │            └──────────────┘           │           │
│         │                   │                   │           │
│         └───────────────────┼───────────────────┘           │
│                             │                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              Frontend (React + TypeScript)              │ │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐ │ │
│  │  │ Components  │  │   Hooks      │  │   Utilities     │ │ │
│  │  └─────────────┘  └──────────────┘  └─────────────────┘ │ │
│  └─────────────────────────────────────────────────────────┘ │
│                             │                               │
│                      Tauri IPC Bridge                       │
│                             │                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │               Backend (Rust + SQLite)                   │ │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐ │ │
│  │  │ Commands    │  │  Database    │  │  Business Logic │ │ │
│  │  └─────────────┘  └──────────────┘  └─────────────────┘ │ │
│  └─────────────────────────────────────────────────────────┘ │
│                             │                               │
│         ┌───────────────────┼───────────────────┐           │
│         │                   │                   │           │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐     │
│  │ Unit Tests  │  │ Integration  │  │ Database Tests  │     │
│  │   (Cargo)   │  │    Tests     │  │     (Cargo)     │     │
│  └─────────────┘  │   (Cargo)    │  └─────────────────┘     │
│                   └──────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

## レイヤー別テスト戦略

### 1. E2Eテストレイヤー (Playwright)

**目的**: エンドユーザーの視点からアプリケーション全体をテスト

**特徴**:
- 実際のTauriアプリケーションを起動
- 複数ブラウザエンジンでのテスト
- ユーザーシナリオベースのテスト

**テスト対象**:
```typescript
// 完全なワークフローテスト
test('complete user journey', async ({ page }) => {
  // 1. アプリケーション起動
  await page.goto('/');

  // 2. ユーザー作成
  await page.click('text=Users');
  await page.fill('input[placeholder="Name"]', 'Test User');
  await page.fill('input[placeholder="Email"]', 'test@example.com');
  await page.click('button:has-text("Add User")');

  // 3. ノート作成
  await page.click('text=Notes');
  await page.fill('input[placeholder="Note title"]', 'Test Note');
  await page.click('button:has-text("Add Note")');

  // 4. データ永続化確認
  await page.reload();
  await expect(page.locator('text=Test User')).toBeVisible();
});
```

### 2. 統合テストレイヤー (Frontend)

**目的**: フロントエンドコンポーネント間の連携をテスト

**特徴**:
- React Testing Libraryによる実際のDOMテスト
- Tauri APIのモック化
- ユーザーインタラクションのシミュレーション

**実装アーキテクチャ**:
```typescript
// テストプロバイダーパターン
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>
    <Notifications />
    {children}
  </MantineProvider>
);

// 統合テスト例
describe("User Management Workflow", () => {
  test("should handle complete user creation flow", async () => {
    // モックセットアップ
    mockTauriAPI({
      get_users: () => [],
      create_user: () => undefined,
    });

    // レンダリングとユーザーインタラクション
    render(<App />, { wrapper: TestWrapper });

    const user = userEvent.setup();
    await user.click(screen.getByText("Users"));
    await user.type(screen.getByPlaceholderText("Name"), "John Doe");
    await user.click(screen.getByRole("button", { name: /add user/i }));

    // アサーション
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith("create_user", {
        name: "John Doe",
        email: expect.any(String)
      });
    });
  });
});
```

### 3. ユニットテストレイヤー (Frontend)

**目的**: 個別コンポーネントの単体動作をテスト

**特徴**:
- 分離されたコンポーネントテスト
- プロップスとステートのテスト
- イベントハンドリングのテスト

**例**:
```typescript
// 純粋なコンポーネントテスト
describe("UserCard Component", () => {
  test("renders user information correctly", () => {
    const testUser = createTestUser({
      name: "John Doe",
      email: "john@example.com"
    });

    render(<UserCard user={testUser} onDelete={vi.fn()} />);

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
  });

  test("calls onDelete when delete button is clicked", async () => {
    const mockOnDelete = vi.fn();
    const testUser = createTestUser({ id: 1 });

    render(<UserCard user={testUser} onDelete={mockOnDelete} />);

    await userEvent.click(screen.getByRole("button", { name: /delete/i }));

    expect(mockOnDelete).toHaveBeenCalledWith(1);
  });
});
```

### 4. バックエンドテストレイヤー (Rust)

**目的**: Rustコードの機能とデータベース操作をテスト

**アーキテクチャ**:
```rust
// テスト用データベースマネージャー
pub struct TestDatabase {
    pub connection: Database,
    _temp_file: NamedTempFile, // ライフタイム管理
}

impl TestDatabase {
    pub fn new() -> Self {
        let temp_file = NamedTempFile::new().expect("Failed to create temp file");
        let conn = Connection::open(temp_file.path()).expect("Failed to open DB");

        // スキーマセットアップ
        setup_test_schema(&conn);

        Self {
            connection: Database(Mutex::new(conn)),
            _temp_file: temp_file,
        }
    }
}

// データベース操作テスト
#[tokio::test]
async fn test_user_repository_operations() {
    let test_db = TestDatabase::new();
    let user_repo = UserRepository::new(&test_db.connection);

    // CREATE
    let user_id = user_repo.create(CreateUser {
        name: "John Doe".to_string(),
        email: "john@example.com".to_string(),
    }).await.unwrap();

    // READ
    let user = user_repo.get_by_id(user_id).await.unwrap();
    assert_eq!(user.name, "John Doe");

    // UPDATE
    user_repo.update(user_id, UpdateUser {
        name: Some("Jane Doe".to_string()),
        email: None,
    }).await.unwrap();

    // DELETE
    user_repo.delete(user_id).await.unwrap();
    assert!(user_repo.get_by_id(user_id).await.is_err());
}
```

## テストデータ管理

### テストデータファクトリーパターン

```typescript
// src/test/helpers/factories.ts
export class UserFactory {
  static create(overrides: Partial<User> = {}): User {
    return {
      id: Math.floor(Math.random() * 1000),
      name: "Test User",
      email: `test${Date.now()}@example.com`,
      created_at: new Date().toISOString(),
      ...overrides,
    };
  }

  static createMany(count: number, overrides: Partial<User> = {}): User[] {
    return Array.from({ length: count }, (_, index) =>
      this.create({
        name: `User ${index + 1}`,
        email: `user${index + 1}@example.com`,
        ...overrides,
      })
    );
  }

  static createWithNotes(noteCount: number = 3): User & { notes: Note[] } {
    const user = this.create();
    const notes = NoteFactory.createMany(noteCount, { user_id: user.id });
    return { ...user, notes };
  }
}

export class NoteFactory {
  static create(overrides: Partial<Note> = {}): Note {
    return {
      id: Math.floor(Math.random() * 1000),
      title: "Test Note",
      content: "This is a test note content",
      user_id: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...overrides,
    };
  }

  static createMany(count: number, overrides: Partial<Note> = {}): Note[] {
    return Array.from({ length: count }, (_, index) =>
      this.create({
        title: `Note ${index + 1}`,
        content: `Content for note ${index + 1}`,
        ...overrides,
      })
    );
  }
}
```

### Rustテストデータビルダー

```rust
// src-tauri/src/test_helpers.rs
pub struct UserBuilder {
    name: Option<String>,
    email: Option<String>,
}

impl UserBuilder {
    pub fn new() -> Self {
        Self {
            name: None,
            email: None,
        }
    }

    pub fn with_name(mut self, name: &str) -> Self {
        self.name = Some(name.to_string());
        self
    }

    pub fn with_email(mut self, email: &str) -> Self {
        self.email = Some(email.to_string());
        self
    }

    pub fn build(self) -> CreateUser {
        CreateUser {
            name: self.name.unwrap_or_else(|| "Test User".to_string()),
            email: self.email.unwrap_or_else(|| format!("test{}@example.com", uuid::Uuid::new_v4())),
        }
    }
}

// 使用例
#[tokio::test]
async fn test_user_creation_with_builder() {
    let db = create_test_database();

    let user = UserBuilder::new()
        .with_name("John Doe")
        .with_email("john@example.com")
        .build();

    let result = create_user_in_db(&db, user).await;
    assert!(result.is_ok());
}
```

## モックシステム設計

### レイヤード・モックアーキテクチャ

```typescript
// src/test/mocks/index.ts
export interface MockLayer {
  setup(): void;
  teardown(): void;
}

class TauriMockLayer implements MockLayer {
  setup() {
    vi.mock("@tauri-apps/api/core", () => ({
      invoke: vi.fn(),
    }));
  }

  teardown() {
    vi.restoreAllMocks();
  }
}

class APIMockLayer implements MockLayer {
  private scenarios: Map<string, any> = new Map();

  setup() {
    const mockInvoke = vi.mocked(invoke);
    mockInvoke.mockImplementation((command: string, args?: any) => {
      const scenario = this.scenarios.get(command);
      if (scenario) {
        return typeof scenario === 'function' ? scenario(args) : Promise.resolve(scenario);
      }
      return Promise.reject(`Unknown command: ${command}`);
    });
  }

  addScenario(command: string, response: any) {
    this.scenarios.set(command, response);
  }

  teardown() {
    this.scenarios.clear();
  }
}

export class MockManager {
  private layers: MockLayer[] = [];

  constructor() {
    this.layers = [
      new TauriMockLayer(),
      new APIMockLayer(),
    ];
  }

  setup() {
    this.layers.forEach(layer => layer.setup());
  }

  teardown() {
    this.layers.reverse().forEach(layer => layer.teardown());
  }
}
```

## テストパフォーマンス最適化

### 並列実行戦略

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    // ワーカープロセス数の最適化
    maxWorkers: process.env.CI ? 2 : 4,

    // テストファイルの並列実行
    fileParallelism: true,

    // テスト内の並列実行
    sequence: {
      concurrent: true,
    },

    // テストタイムアウト設定
    testTimeout: 10000,
    hookTimeout: 5000,

    // セットアップファイルの最適化
    setupFiles: ['./src/test/setup.ts'],

    // 不要なファイルの除外
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      '**/tests/e2e/**',
    ],
  },
});
```

### データベーステストの最適化

```rust
// src-tauri/src/lib.rs
#[cfg(test)]
mod tests {
    use std::sync::Once;

    static INIT: Once = Once::new();

    fn setup_test_environment() {
        INIT.call_once(|| {
            // グローバルテスト設定
            env_logger::init();
        });
    }

    // テスト用データベースプール
    lazy_static! {
        static ref TEST_DB_POOL: Mutex<Vec<Database>> = Mutex::new(Vec::new());
    }

    fn get_test_database() -> Database {
        setup_test_environment();

        let mut pool = TEST_DB_POOL.lock().unwrap();
        if let Some(db) = pool.pop() {
            // 既存のデータベースを再利用
            clear_database(&db);
            db
        } else {
            // 新しいデータベースを作成
            create_test_database()
        }
    }

    fn return_test_database(db: Database) {
        let mut pool = TEST_DB_POOL.lock().unwrap();
        pool.push(db);
    }
}
```

## エラーハンドリングとデバッグ

### テストエラーレポーティング

```typescript
// src/test/helpers/errorReporting.ts
export class TestErrorReporter {
  static logTestContext(testName: string, context: any) {
    console.log(`\n=== Test Context: ${testName} ===`);
    console.log(JSON.stringify(context, null, 2));
    console.log('=====================================\n');
  }

  static async captureScreenshot(page: Page, testName: string) {
    const screenshotPath = `./test-results/screenshots/${testName}-${Date.now()}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`Screenshot saved: ${screenshotPath}`);
  }

  static logAPICall(command: string, args: any, result: any) {
    console.log(`API Call: ${command}`);
    console.log(`Args:`, args);
    console.log(`Result:`, result);
  }
}

// 使用例
test("user creation with detailed logging", async ({ page }) => {
  try {
    TestErrorReporter.logTestContext("User Creation", {
      timestamp: new Date().toISOString(),
      browser: page.context().browser()?.browserType().name(),
    });

    await page.goto('/');
    // テスト実行...

  } catch (error) {
    await TestErrorReporter.captureScreenshot(page, "user-creation-failed");
    throw error;
  }
});
```

## メトリクスと監視

### テストメトリクス収集

```typescript
// src/test/helpers/metrics.ts
export class TestMetrics {
  private static metrics: Map<string, number> = new Map();

  static startTimer(name: string) {
    this.metrics.set(`${name}_start`, performance.now());
  }

  static endTimer(name: string): number {
    const start = this.metrics.get(`${name}_start`);
    if (!start) return 0;

    const duration = performance.now() - start;
    this.metrics.set(`${name}_duration`, duration);
    return duration;
  }

  static getMetric(name: string): number {
    return this.metrics.get(name) || 0;
  }

  static reportMetrics() {
    console.log('\n=== Test Metrics ===');
    for (const [name, value] of this.metrics.entries()) {
      if (name.endsWith('_duration')) {
        console.log(`${name}: ${value.toFixed(2)}ms`);
      }
    }
    console.log('==================\n');
  }
}

// 使用例
afterEach(() => {
  TestMetrics.reportMetrics();
});
```

## CI/CD統合

### GitHub Actions最適化

```yaml
# .github/workflows/test-optimized.yml
name: Optimized Tests

on:
  push:
  pull_request:

jobs:
  test-matrix:
    name: Test Matrix
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        test-suite: [frontend, rust, e2e]
        exclude:
          # E2Eテストは Ubuntu のみで実行
          - os: windows-latest
            test-suite: e2e
          - os: macos-latest
            test-suite: e2e

    steps:
    - uses: actions/checkout@v4

    - name: Setup Test Environment
      uses: ./.github/actions/setup-test-env
      with:
        test-suite: ${{ matrix.test-suite }}

    - name: Run Tests
      run: |
        case "${{ matrix.test-suite }}" in
          "frontend")
            bun run test:coverage
            ;;
          "rust")
            cd src-tauri && cargo test -- --test-threads=1
            ;;
          "e2e")
            bun run test:e2e
            ;;
        esac

    - name: Upload Results
      uses: actions/upload-artifact@v4
      with:
        name: test-results-${{ matrix.os }}-${{ matrix.test-suite }}
        path: |
          coverage/
          test-results/
          playwright-report/
```

このアーキテクチャにより、スケーラブルで保守しやすいテストスイートが実現されています。各レイヤーが独立性を保ちながら、全体として包括的なテストカバレッジを提供します。