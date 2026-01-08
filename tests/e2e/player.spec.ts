import { expect, test } from '@playwright/test'

/**
 * E2E tests for player management flows.
 *
 * Tests cover:
 * - Player CRUD operations (create, read, update, delete)
 * - Tag management (create, assign, remove)
 * - Date-specific note management
 * - Search and filter functionality
 * - Data isolation between users
 *
 * NOTE: Uses getByRole and getByLabel for stable selectors.
 */

test.describe('Player Management', () => {
  // Helper to login before each test
  async function loginUser(
    page: import('@playwright/test').Page,
    email: string,
    password: string,
  ) {
    await page.goto('/auth/signin')
    await page.getByLabel('メールアドレス').fill(email)
    await page.getByPlaceholder('パスワードを入力').fill(password)
    await page.getByRole('button', { name: 'ログイン', exact: true }).click()
    await expect(page).not.toHaveURL(/\/auth\/signin/, { timeout: 10000 })
  }

  // Helper to create a test user
  async function createTestUser(page: import('@playwright/test').Page) {
    const uniqueEmail = `player-test-${Date.now()}@example.com`
    const password = 'testpassword123'

    await page.goto('/auth/register')
    await page.getByLabel('名前').fill('プレイヤーテストユーザー')
    await page.getByLabel('メールアドレス').fill(uniqueEmail)
    await page.getByPlaceholder('8文字以上').fill(password)
    await page.getByPlaceholder('もう一度入力').fill(password)
    await page.getByRole('button', { name: '登録' }).click()

    await page.waitForURL(/\/auth\/signin/, { timeout: 10000 })

    return { email: uniqueEmail, password }
  }

  test.describe('Player List Page', () => {
    test('should show empty state when no players exist', async ({ page }) => {
      const { email, password } = await createTestUser(page)
      await loginUser(page, email, password)

      await page.goto('/players')

      // Wait for title to appear (page loaded)
      await expect(
        page.getByRole('heading', { name: 'プレイヤー管理' }),
      ).toBeVisible({
        timeout: 15000,
      })

      // Should show empty state message
      await expect(
        page.getByText('プレイヤーが登録されていません'),
      ).toBeVisible({
        timeout: 15000,
      })

      // Should show create button
      await expect(
        page.getByRole('link', { name: '新しいプレイヤーを追加' }),
      ).toBeVisible()
    })

    test('should navigate to create player page', async ({ page }) => {
      const { email, password } = await createTestUser(page)
      await loginUser(page, email, password)

      await page.goto('/players')

      // Wait for page content to load
      await expect(
        page.getByRole('heading', { name: 'プレイヤー管理' }),
      ).toBeVisible({
        timeout: 15000,
      })

      // Click create button
      await page
        .getByRole('link', { name: '新しいプレイヤーを追加' })
        .first()
        .click()

      // Should be on create page
      await expect(page).toHaveURL(/\/players\/new/)
    })
  })

  test.describe('Create Player', () => {
    test('should create a new player with name only', async ({ page }) => {
      const { email, password } = await createTestUser(page)
      await loginUser(page, email, password)

      await page.goto('/players/new')

      // Fill form
      await page.getByLabel('プレイヤー名').fill('田中太郎')

      // Submit form
      await page.getByRole('button', { name: '作成' }).click()

      // Should show success and redirect
      await expect(page.getByText('プレイヤーを作成しました')).toBeVisible({
        timeout: 10000,
      })

      // Should redirect to player detail or list
      await expect(page).not.toHaveURL(/\/players\/new/)
    })

    test('should create a new player with notes', async ({ page }) => {
      const { email, password } = await createTestUser(page)
      await loginUser(page, email, password)

      await page.goto('/players/new')

      // Fill form
      await page.getByLabel('プレイヤー名').fill('鈴木一郎')
      // Note: generalNotes uses rich text editor, fill with simple text
      const notesField = page.getByLabel('メモ')
      if (await notesField.isVisible()) {
        await notesField.fill('アグレッシブなプレイスタイル')
      }

      // Submit form
      await page.getByRole('button', { name: '作成' }).click()

      // Should show success
      await expect(page.getByText('プレイヤーを作成しました')).toBeVisible({
        timeout: 10000,
      })
    })

    test('should show validation error for empty name', async ({ page }) => {
      const { email, password } = await createTestUser(page)
      await loginUser(page, email, password)

      await page.goto('/players/new')

      // Submit empty form
      await page.getByRole('button', { name: '作成' }).click()

      // Should show validation error
      await expect(
        page.getByText('プレイヤー名を入力してください'),
      ).toBeVisible()
    })
  })

  test.describe('Player Detail Page', () => {
    test('should display player details', async ({ page }) => {
      const { email, password } = await createTestUser(page)
      await loginUser(page, email, password)

      // Create a player first
      await page.goto('/players/new')
      await page.getByLabel('プレイヤー名').fill('詳細テストプレイヤー')
      await page.getByRole('button', { name: '作成' }).click()

      // Wait for success notification
      await expect(page.getByText('プレイヤーを作成しました')).toBeVisible({
        timeout: 10000,
      })

      // Wait for redirect to detail page
      await page.waitForURL(/\/players\/[^/]+$/, { timeout: 10000 })

      // Should show player name
      await expect(
        page.getByRole('heading', { name: '詳細テストプレイヤー' }),
      ).toBeVisible({ timeout: 15000 })
    })
  })

  test.describe('Update Player', () => {
    test('should update player name', async ({ page }) => {
      const { email, password } = await createTestUser(page)
      await loginUser(page, email, password)

      // Create player
      await page.goto('/players/new')
      await page.getByLabel('プレイヤー名').fill('更新前のプレイヤー')
      await page.getByRole('button', { name: '作成' }).click()

      await page.waitForURL(/\/players\/[^/]+$/, { timeout: 10000 })

      // Wait for page to load
      await expect(page.getByText('更新前のプレイヤー').first()).toBeVisible({
        timeout: 15000,
      })

      // Click edit button
      await page.getByRole('button', { name: '編集' }).click()

      // Wait for edit form to appear
      await expect(page.getByRole('button', { name: '保存' })).toBeVisible({
        timeout: 5000,
      })

      // Update name
      const nameInput = page.locator('form').getByLabel('プレイヤー名')
      await nameInput.clear()
      await nameInput.fill('更新後のプレイヤー')

      // Save
      await page.getByRole('button', { name: '保存' }).click()

      // Should show success
      await expect(page.getByText('プレイヤーを更新しました')).toBeVisible({
        timeout: 10000,
      })
    })
  })

  test.describe('Delete Player', () => {
    test('should delete a player (soft delete)', async ({ page }) => {
      const { email, password } = await createTestUser(page)
      await loginUser(page, email, password)

      // Create player
      await page.goto('/players/new')
      await page.getByLabel('プレイヤー名').fill('削除テストプレイヤー')
      await page.getByRole('button', { name: '作成' }).click()

      await page.waitForURL(/\/players\/[^/]+$/, { timeout: 10000 })

      // Delete
      await page.getByRole('button', { name: '削除' }).click()

      // Confirm
      await page.getByRole('button', { name: '削除を確認' }).click()

      // Should show success and redirect
      await expect(page.getByText('プレイヤーを削除しました')).toBeVisible({
        timeout: 10000,
      })
      await expect(page).toHaveURL(/\/players$/)
    })
  })

  test.describe('Tag Management', () => {
    test('should create a new tag', async ({ page }) => {
      const { email, password } = await createTestUser(page)
      await loginUser(page, email, password)

      // Navigate to tag management page or section
      await page.goto('/players')

      // Open tag management
      await page.getByRole('button', { name: 'タグ管理' }).click()

      // Wait for modal to appear
      await expect(page.locator('.mantine-Modal-content')).toBeVisible()

      // Add new tag
      await page.locator('.mantine-Modal-content').getByLabel('タグ名').fill('アグレッシブ')

      // Submit
      await page
        .locator('.mantine-Modal-content')
        .getByRole('button', { name: '追加' })
        .click()

      // Should show success
      await expect(page.getByText('タグを作成しました')).toBeVisible({
        timeout: 10000,
      })
    })

    test('should create a tag with color', async ({ page }) => {
      const { email, password } = await createTestUser(page)
      await loginUser(page, email, password)

      await page.goto('/players')
      await page.getByRole('button', { name: 'タグ管理' }).click()

      await expect(page.locator('.mantine-Modal-content')).toBeVisible()

      await page.locator('.mantine-Modal-content').getByLabel('タグ名').fill('タイト')

      // Select color if color picker is available
      const colorInput = page.locator('.mantine-Modal-content').getByLabel('カラー')
      if (await colorInput.isVisible()) {
        await colorInput.fill('#FF5733')
      }

      await page
        .locator('.mantine-Modal-content')
        .getByRole('button', { name: '追加' })
        .click()

      await expect(page.getByText('タグを作成しました')).toBeVisible({
        timeout: 10000,
      })
    })

    test('should assign tag to player', async ({ page }) => {
      const { email, password } = await createTestUser(page)
      await loginUser(page, email, password)

      // First create a tag
      await page.goto('/players')
      await page.getByRole('button', { name: 'タグ管理' }).click()
      await expect(page.locator('.mantine-Modal-content')).toBeVisible()
      await page.locator('.mantine-Modal-content').getByLabel('タグ名').fill('テストタグ')
      await page
        .locator('.mantine-Modal-content')
        .getByRole('button', { name: '追加' })
        .click()
      await expect(page.getByText('タグを作成しました')).toBeVisible({
        timeout: 10000,
      })

      // Close modal
      await page.keyboard.press('Escape')

      // Create a player
      await page.goto('/players/new')
      await page.getByLabel('プレイヤー名').fill('タグ割り当てテスト')
      await page.getByRole('button', { name: '作成' }).click()
      await page.waitForURL(/\/players\/[^/]+$/, { timeout: 10000 })

      // Assign tag to player
      await page.getByRole('button', { name: 'タグを追加' }).click()

      // Select the tag
      await page.getByRole('option', { name: 'テストタグ' }).click()

      // Should show the tag on player detail
      await expect(page.getByText('テストタグ')).toBeVisible({
        timeout: 10000,
      })
    })

    test('should remove tag from player', async ({ page }) => {
      const { email, password } = await createTestUser(page)
      await loginUser(page, email, password)

      // Create tag
      await page.goto('/players')
      await page.getByRole('button', { name: 'タグ管理' }).click()
      await expect(page.locator('.mantine-Modal-content')).toBeVisible()
      await page.locator('.mantine-Modal-content').getByLabel('タグ名').fill('削除テストタグ')
      await page
        .locator('.mantine-Modal-content')
        .getByRole('button', { name: '追加' })
        .click()
      await page.keyboard.press('Escape')

      // Create player and assign tag
      await page.goto('/players/new')
      await page.getByLabel('プレイヤー名').fill('タグ削除テスト')
      await page.getByRole('button', { name: '作成' }).click()
      await page.waitForURL(/\/players\/[^/]+$/, { timeout: 10000 })

      await page.getByRole('button', { name: 'タグを追加' }).click()
      await page.getByRole('option', { name: '削除テストタグ' }).click()
      await expect(page.getByText('削除テストタグ')).toBeVisible()

      // Remove tag (click on tag badge's remove button)
      await page.getByRole('button', { name: '削除テストタグ を削除' }).click()

      // Tag should be removed
      await expect(page.getByText('削除テストタグ')).not.toBeVisible()
    })
  })

  test.describe('Player Notes', () => {
    test('should add date-specific note to player', async ({ page }) => {
      const { email, password } = await createTestUser(page)
      await loginUser(page, email, password)

      // Create player
      await page.goto('/players/new')
      await page.getByLabel('プレイヤー名').fill('ノートテストプレイヤー')
      await page.getByRole('button', { name: '作成' }).click()
      await page.waitForURL(/\/players\/[^/]+$/, { timeout: 10000 })

      // Add note
      await page.getByRole('button', { name: 'ノートを追加' }).click()

      // Wait for modal/form to appear
      await expect(page.getByLabel('日付')).toBeVisible({ timeout: 5000 })

      // Fill note form
      await page.getByLabel('日付').fill('2025-12-15')
      await page.getByLabel('内容').fill('今日はタイトにプレイしていた')

      // Submit
      await page.getByRole('button', { name: '保存' }).click()

      // Should show success
      await expect(page.getByText('ノートを追加しました')).toBeVisible({
        timeout: 10000,
      })

      // Note should appear in list
      await expect(page.getByText('今日はタイトにプレイしていた')).toBeVisible({
        timeout: 10000,
      })
    })

    test('should update player note', async ({ page }) => {
      const { email, password } = await createTestUser(page)
      await loginUser(page, email, password)

      // Create player
      await page.goto('/players/new')
      await page.getByLabel('プレイヤー名').fill('ノート更新テスト')
      await page.getByRole('button', { name: '作成' }).click()
      await page.waitForURL(/\/players\/[^/]+$/, { timeout: 10000 })

      // Add note first
      await page.getByRole('button', { name: 'ノートを追加' }).click()
      await page.getByLabel('日付').fill('2025-12-15')
      await page.getByLabel('内容').fill('元のノート')
      await page.getByRole('button', { name: '保存' }).click()
      await expect(page.getByText('元のノート')).toBeVisible()

      // Edit note
      await page.getByRole('button', { name: 'ノートを編集' }).first().click()

      const contentInput = page.getByLabel('内容')
      await contentInput.clear()
      await contentInput.fill('更新されたノート')
      await page.getByRole('button', { name: '保存' }).click()

      // Should show updated content
      await expect(page.getByText('更新されたノート')).toBeVisible({
        timeout: 10000,
      })
    })

    test('should delete player note', async ({ page }) => {
      const { email, password } = await createTestUser(page)
      await loginUser(page, email, password)

      // Create player
      await page.goto('/players/new')
      await page.getByLabel('プレイヤー名').fill('ノート削除テスト')
      await page.getByRole('button', { name: '作成' }).click()
      await page.waitForURL(/\/players\/[^/]+$/, { timeout: 10000 })

      // Add note
      await page.getByRole('button', { name: 'ノートを追加' }).click()
      await page.getByLabel('日付').fill('2025-12-15')
      await page.getByLabel('内容').fill('削除されるノート')
      await page.getByRole('button', { name: '保存' }).click()
      await expect(page.getByText('削除されるノート')).toBeVisible()

      // Delete note
      await page.getByRole('button', { name: 'ノートを削除' }).first().click()
      await page.getByRole('button', { name: '削除を確認' }).click()

      // Note should be removed
      await expect(page.getByText('削除されるノート')).not.toBeVisible()
    })
  })

  test.describe('Search and Filter', () => {
    test('should filter players by search term', async ({ page }) => {
      const { email, password } = await createTestUser(page)
      await loginUser(page, email, password)

      // Create multiple players
      await page.goto('/players/new')
      await page.getByLabel('プレイヤー名').fill('田中太郎')
      await page.getByRole('button', { name: '作成' }).click()
      await page.waitForURL(/\/players\/[^/]+$/, { timeout: 10000 })

      await page.goto('/players/new')
      await page.getByLabel('プレイヤー名').fill('鈴木花子')
      await page.getByRole('button', { name: '作成' }).click()
      await page.waitForURL(/\/players\/[^/]+$/, { timeout: 10000 })

      // Go to list and search
      await page.goto('/players')
      await page.getByPlaceholder('プレイヤーを検索').fill('田中')

      // Wait for filter to apply
      await page.waitForTimeout(500)

      // Should show only matching player
      await expect(page.getByText('田中太郎')).toBeVisible()
      await expect(page.getByText('鈴木花子')).not.toBeVisible()
    })

    test('should filter players by tag', async ({ page }) => {
      const { email, password } = await createTestUser(page)
      await loginUser(page, email, password)

      // Create tag
      await page.goto('/players')
      await page.getByRole('button', { name: 'タグ管理' }).click()
      await page.locator('.mantine-Modal-content').getByLabel('タグ名').fill('フィルターテスト')
      await page
        .locator('.mantine-Modal-content')
        .getByRole('button', { name: '追加' })
        .click()
      await page.keyboard.press('Escape')

      // Create player with tag
      await page.goto('/players/new')
      await page.getByLabel('プレイヤー名').fill('タグ付きプレイヤー')
      await page.getByRole('button', { name: '作成' }).click()
      await page.waitForURL(/\/players\/[^/]+$/, { timeout: 10000 })
      await page.getByRole('button', { name: 'タグを追加' }).click()
      await page.getByRole('option', { name: 'フィルターテスト' }).click()

      // Create player without tag
      await page.goto('/players/new')
      await page.getByLabel('プレイヤー名').fill('タグなしプレイヤー')
      await page.getByRole('button', { name: '作成' }).click()
      await page.waitForURL(/\/players\/[^/]+$/, { timeout: 10000 })

      // Go to list and filter by tag
      await page.goto('/players')
      await page.getByRole('button', { name: 'タグでフィルター' }).click()
      await page.getByRole('option', { name: 'フィルターテスト' }).click()

      // Wait for filter to apply
      await page.waitForTimeout(500)

      // Should show only tagged player
      await expect(page.getByText('タグ付きプレイヤー')).toBeVisible()
      await expect(page.getByText('タグなしプレイヤー')).not.toBeVisible()
    })
  })

  test.describe('Data Isolation', () => {
    test('should not show other users players', async ({ page }) => {
      // Create first user and add player
      const user1 = await createTestUser(page)
      await loginUser(page, user1.email, user1.password)

      await page.goto('/players/new')
      await page.getByLabel('プレイヤー名').fill('ユーザー1のプレイヤー')
      await page.getByRole('button', { name: '作成' }).click()

      await expect(page.getByText('プレイヤーを作成しました')).toBeVisible({
        timeout: 10000,
      })

      // On mobile, open hamburger menu first
      const menuButton = page.getByRole('button', { name: 'メニューを開く' })
      if (await menuButton.isVisible()) {
        await menuButton.click()
      }

      await page.getByRole('button', { name: 'ログアウト' }).click()

      // Wait for redirect to signin
      await page.waitForURL(/\/auth\/signin/, { timeout: 10000 })

      // Navigate to register page
      await page.goto('/auth/register')

      const user2 = await createTestUser(page)
      await loginUser(page, user2.email, user2.password)

      // Go to player list
      await page.goto('/players')

      // Wait for page to load
      await expect(
        page.getByRole('heading', { name: 'プレイヤー管理' }),
      ).toBeVisible({
        timeout: 15000,
      })

      // Should not see user1's player
      await expect(page.getByText('ユーザー1のプレイヤー')).not.toBeVisible()

      // Should show empty state
      await expect(
        page.getByText('プレイヤーが登録されていません'),
      ).toBeVisible({
        timeout: 10000,
      })
    })
  })
})
