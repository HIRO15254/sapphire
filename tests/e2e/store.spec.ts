import { expect, test } from '@playwright/test'

/**
 * E2E tests for store and game management flows.
 *
 * Tests cover:
 * - Store CRUD operations (create, read, update, delete)
 * - Cash game management within stores
 * - Tournament management within stores
 * - Archive functionality
 * - Google Maps link generation
 *
 * NOTE: Uses getByRole and getByLabel for stable selectors.
 */

test.describe('Store Management', () => {
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
    const uniqueEmail = `store-test-${Date.now()}@example.com`
    const password = 'testpassword123'

    await page.goto('/auth/register')
    await page.getByLabel('名前').fill('店舗テストユーザー')
    await page.getByLabel('メールアドレス').fill(uniqueEmail)
    await page.getByPlaceholder('8文字以上').fill(password)
    await page.getByPlaceholder('もう一度入力').fill(password)
    await page.getByRole('button', { name: '登録' }).click()

    await page.waitForURL(/\/auth\/signin/, { timeout: 10000 })

    return { email: uniqueEmail, password }
  }

  test.describe('Store List Page', () => {
    test('should show empty state when no stores exist', async ({ page }) => {
      const { email, password } = await createTestUser(page)
      await loginUser(page, email, password)

      await page.goto('/stores')

      // Wait for title to appear (page loaded)
      await expect(page.getByRole('heading', { name: '店舗管理' })).toBeVisible(
        {
          timeout: 15000,
        },
      )

      // Should show empty state message
      await expect(page.getByText('店舗が登録されていません')).toBeVisible({
        timeout: 15000,
      })

      // Should show create button
      await expect(
        page.getByRole('link', { name: '新しい店舗を追加' }),
      ).toBeVisible()
    })

    test('should navigate to create store page', async ({ page }) => {
      const { email, password } = await createTestUser(page)
      await loginUser(page, email, password)

      await page.goto('/stores')

      // Wait for page content to load
      await expect(page.getByRole('heading', { name: '店舗管理' })).toBeVisible(
        {
          timeout: 15000,
        },
      )

      // Click create button
      await page.getByRole('link', { name: '新しい店舗を追加' }).first().click()

      // Should be on create page
      await expect(page).toHaveURL(/\/stores\/new/)
    })
  })

  test.describe('Create Store', () => {
    test('should create a new store with name only', async ({ page }) => {
      const { email, password } = await createTestUser(page)
      await loginUser(page, email, password)

      await page.goto('/stores/new')

      // Fill form
      await page.getByLabel('店舗名').fill('ABCポーカー渋谷店')

      // Submit form
      await page.getByRole('button', { name: '作成' }).click()

      // Should show success and redirect
      await expect(page.getByText('店舗を作成しました')).toBeVisible({
        timeout: 10000,
      })

      // Should redirect to store detail or list
      await expect(page).not.toHaveURL(/\/stores\/new/)
    })

    test('should create a new store with address', async ({ page }) => {
      const { email, password } = await createTestUser(page)
      await loginUser(page, email, password)

      await page.goto('/stores/new')

      // Fill form
      await page.getByLabel('店舗名').fill('XYZポーカー新宿店')
      await page.getByLabel('住所').fill('東京都新宿区新宿3-1-1')

      // Submit form
      await page.getByRole('button', { name: '作成' }).click()

      // Should show success
      await expect(page.getByText('店舗を作成しました')).toBeVisible({
        timeout: 10000,
      })
    })

    test('should show validation error for empty name', async ({ page }) => {
      const { email, password } = await createTestUser(page)
      await loginUser(page, email, password)

      await page.goto('/stores/new')

      // Submit empty form
      await page.getByRole('button', { name: '作成' }).click()

      // Should show validation error
      await expect(page.getByText('店舗名を入力してください')).toBeVisible()
    })
  })

  test.describe('Store Detail Page', () => {
    test('should display store details', async ({ page }) => {
      const { email, password } = await createTestUser(page)
      await loginUser(page, email, password)

      // Create a store first
      await page.goto('/stores/new')
      await page.getByLabel('店舗名').fill('詳細テスト店舗')
      await page.getByLabel('住所').fill('東京都渋谷区渋谷1-1-1')
      await page.getByRole('button', { name: '作成' }).click()

      // Wait for success notification
      await expect(page.getByText('店舗を作成しました')).toBeVisible({
        timeout: 10000,
      })

      // Wait for redirect to detail page
      await page.waitForURL(/\/stores\/[^/]+$/, { timeout: 10000 })

      // Should show store name
      await expect(
        page.getByRole('heading', { name: '詳細テスト店舗' }),
      ).toBeVisible({ timeout: 15000 })
    })

    test('should display Google Maps link when address exists', async ({
      page,
    }) => {
      const { email, password } = await createTestUser(page)
      await loginUser(page, email, password)

      // Create a store with address
      await page.goto('/stores/new')
      await page.getByLabel('店舗名').fill('地図リンクテスト店舗')
      await page.getByLabel('住所').fill('東京都渋谷区道玄坂2-1-1')
      await page.getByRole('button', { name: '作成' }).click()

      await page.waitForURL(/\/stores\/[^/]+$/, { timeout: 10000 })

      // Should show Google Maps link
      await expect(
        page.getByRole('link', { name: /Google.*Maps|地図を開く/i }),
      ).toBeVisible({ timeout: 10000 })
    })
  })

  test.describe('Update Store', () => {
    test('should update store name', async ({ page }) => {
      const { email, password } = await createTestUser(page)
      await loginUser(page, email, password)

      // Create store
      await page.goto('/stores/new')
      await page.getByLabel('店舗名').fill('更新前の店舗')
      await page.getByRole('button', { name: '作成' }).click()

      await page.waitForURL(/\/stores\/[^/]+$/, { timeout: 10000 })

      // Wait for page to load
      await expect(page.getByText('更新前の店舗').first()).toBeVisible({
        timeout: 15000,
      })

      // Click edit button
      await page.getByRole('button', { name: '編集' }).click()

      // Wait for edit form to appear
      await expect(page.getByRole('button', { name: '保存' })).toBeVisible({
        timeout: 5000,
      })

      // Update name
      const nameInput = page.locator('form').getByLabel('店舗名')
      await nameInput.clear()
      await nameInput.fill('更新後の店舗')

      // Save
      await page.getByRole('button', { name: '保存' }).click()

      // Should show success
      await expect(page.getByText('店舗を更新しました')).toBeVisible({
        timeout: 10000,
      })
    })
  })

  test.describe('Archive Store', () => {
    test('should hide archived store from default list', async ({ page }) => {
      const { email, password } = await createTestUser(page)
      await loginUser(page, email, password)

      // Create and archive store
      await page.goto('/stores/new')
      await page.getByLabel('店舗名').fill('非表示テスト店舗')
      await page.getByRole('button', { name: '作成' }).click()

      await page.waitForURL(/\/stores\/[^/]+$/, { timeout: 10000 })

      await page.getByRole('button', { name: 'アーカイブ' }).click()

      // Go to list
      await page.goto('/stores')

      await page.waitForTimeout(500)

      // Should not show archived store
      await expect(page.getByText('非表示テスト店舗')).not.toBeVisible()
    })
  })

  test.describe('Delete Store', () => {
    test('should delete a store (soft delete)', async ({ page }) => {
      const { email, password } = await createTestUser(page)
      await loginUser(page, email, password)

      // Create store
      await page.goto('/stores/new')
      await page.getByLabel('店舗名').fill('削除テスト店舗')
      await page.getByRole('button', { name: '作成' }).click()

      await page.waitForURL(/\/stores\/[^/]+$/, { timeout: 10000 })

      // Delete
      await page.getByRole('button', { name: '削除' }).click()

      // Confirm
      await page.getByRole('button', { name: '削除を確認' }).click()

      // Should show success and redirect
      await expect(page.getByText('店舗を削除しました')).toBeVisible({
        timeout: 10000,
      })
      await expect(page).toHaveURL(/\/stores$/)
    })
  })

  test.describe('Cash Game Management', () => {
    test('should add a cash game to store', async ({ page }) => {
      const { email, password } = await createTestUser(page)
      await loginUser(page, email, password)

      // Create store
      await page.goto('/stores/new')
      await page.getByLabel('店舗名').fill('キャッシュゲームテスト店舗')
      await page.getByRole('button', { name: '作成' }).click()

      await page.waitForURL(/\/stores\/[^/]+$/, { timeout: 10000 })

      // Add cash game
      await page.getByRole('button', { name: 'キャッシュゲームを追加' }).click()

      // Wait for modal to appear
      await expect(page.locator('.mantine-Modal-content')).toBeVisible()

      // Fill form in modal
      await page.locator('.mantine-Modal-content').getByLabel('SB').fill('100')
      await page.locator('.mantine-Modal-content').getByLabel('BB').fill('200')

      // Click submit button in modal
      await page
        .locator('.mantine-Modal-content')
        .getByRole('button', { name: '追加' })
        .click()

      // Should show success
      await expect(
        page.getByText('キャッシュゲームを追加しました'),
      ).toBeVisible({
        timeout: 10000,
      })

      // Should show the cash game in the list
      await expect(page.getByText('100/200')).toBeVisible({ timeout: 10000 })
    })

    test('should add a cash game with straddles', async ({ page }) => {
      const { email, password } = await createTestUser(page)
      await loginUser(page, email, password)

      // Create store
      await page.goto('/stores/new')
      await page.getByLabel('店舗名').fill('ストラドルテスト店舗')
      await page.getByRole('button', { name: '作成' }).click()

      await page.waitForURL(/\/stores\/[^/]+$/, { timeout: 10000 })

      // Add cash game with straddles
      await page.getByRole('button', { name: 'キャッシュゲームを追加' }).click()

      await expect(page.locator('.mantine-Modal-content')).toBeVisible()

      await page.locator('.mantine-Modal-content').getByLabel('SB').fill('100')
      await page.locator('.mantine-Modal-content').getByLabel('BB').fill('200')
      await page
        .locator('.mantine-Modal-content')
        .getByLabel('ストラドル1')
        .fill('400')
      await page
        .locator('.mantine-Modal-content')
        .getByLabel('ストラドル2')
        .fill('800')

      await page
        .locator('.mantine-Modal-content')
        .getByRole('button', { name: '追加' })
        .click()

      // Should show success
      await expect(
        page.getByText('キャッシュゲームを追加しました'),
      ).toBeVisible({
        timeout: 10000,
      })

      // Should show the cash game with straddles
      await expect(page.getByText('100/200/400/800')).toBeVisible({
        timeout: 10000,
      })
    })
  })

  test.describe('Tournament Management', () => {
    test('should add a tournament to store', async ({ page }) => {
      const { email, password } = await createTestUser(page)
      await loginUser(page, email, password)

      // Create store
      await page.goto('/stores/new')
      await page.getByLabel('店舗名').fill('トーナメントテスト店舗')
      await page.getByRole('button', { name: '作成' }).click()

      await page.waitForURL(/\/stores\/[^/]+$/, { timeout: 10000 })

      // Add tournament
      await page.getByRole('button', { name: 'トーナメントを追加' }).click()

      // Wait for modal to appear
      await expect(page.locator('.mantine-Modal-content')).toBeVisible()

      // Fill form in modal
      await page
        .locator('.mantine-Modal-content')
        .getByLabel('トーナメント名')
        .fill('サンデートーナメント')
      await page
        .locator('.mantine-Modal-content')
        .getByLabel('バイイン')
        .fill('10000')
      await page
        .locator('.mantine-Modal-content')
        .getByLabel('スターティングスタック')
        .fill('50000')

      // Click submit button in modal
      await page
        .locator('.mantine-Modal-content')
        .getByRole('button', { name: '追加' })
        .click()

      // Should show success
      await expect(page.getByText('トーナメントを追加しました')).toBeVisible({
        timeout: 10000,
      })

      // Should show the tournament in the list
      await expect(page.getByText('サンデートーナメント')).toBeVisible({
        timeout: 10000,
      })
    })
  })

  test.describe('Data Isolation', () => {
    test('should not show other users stores', async ({ page, context }) => {
      // Create first user and add store
      const user1 = await createTestUser(page)
      await loginUser(page, user1.email, user1.password)

      await page.goto('/stores/new')
      await page.getByLabel('店舗名').fill('ユーザー1の店舗')
      await page.getByRole('button', { name: '作成' }).click()

      await expect(page.getByText('店舗を作成しました')).toBeVisible({
        timeout: 10000,
      })

      // Clear all cookies to logout completely
      await context.clearCookies()

      // Create second user
      const uniqueEmail2 = `store-test-user2-${Date.now()}@example.com`
      const password2 = 'testpassword123'

      await page.goto('/auth/register')
      await expect(page.getByRole('heading', { name: '新規登録' })).toBeVisible(
        { timeout: 10000 },
      )

      await page.getByLabel('名前').fill('店舗テストユーザー2')
      await page.getByLabel('メールアドレス').fill(uniqueEmail2)
      await page.getByPlaceholder('8文字以上').fill(password2)
      await page.getByPlaceholder('もう一度入力').fill(password2)
      await page.getByRole('button', { name: '登録' }).click()

      await page.waitForURL(/\/auth\/signin/, { timeout: 10000 })

      // Login as second user
      await loginUser(page, uniqueEmail2, password2)

      // Go to store list
      await page.goto('/stores')

      // Wait for page to load
      await expect(page.getByRole('heading', { name: '店舗管理' })).toBeVisible(
        {
          timeout: 15000,
        },
      )

      // Should not see user1's store
      await expect(page.getByText('ユーザー1の店舗')).not.toBeVisible()

      // Should show empty state
      await expect(page.getByText('店舗が登録されていません')).toBeVisible({
        timeout: 10000,
      })
    })
  })
})
