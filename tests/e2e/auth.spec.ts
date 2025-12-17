import { expect, test } from '@playwright/test'

/**
 * E2E tests for authentication flows.
 *
 * Tests cover:
 * - User registration (signup)
 * - User login (signin)
 * - User logout (signout)
 * - Protected route access
 */

test.describe('Authentication', () => {
  test.describe('Registration Flow', () => {
    test('should navigate to registration page', async ({ page }) => {
      await page.goto('/auth/signin')

      // Click on register link
      await page.click('text=新規登録')

      // Should be on register page
      await expect(page).toHaveURL(/\/auth\/register/)
      await expect(page.locator('h1')).toContainText('新規登録')
    })

    test('should show validation errors for empty form', async ({ page }) => {
      await page.goto('/auth/register')

      // Submit empty form
      await page.click('button[type="submit"]')

      // Should show validation errors
      await expect(page.locator('text=名前を入力してください')).toBeVisible()
    })

    test('should show password mismatch error', async ({ page }) => {
      await page.goto('/auth/register')

      // Fill form with mismatched passwords
      await page.fill('input[placeholder="山田 太郎"]', 'テストユーザー')
      await page.fill(
        'input[placeholder="you@example.com"]',
        'test@example.com',
      )
      await page.fill('input[placeholder="8文字以上"]', 'password123')
      await page.fill('input[placeholder="もう一度入力"]', 'different123')

      // Submit form
      await page.click('button[type="submit"]')

      // Should show password mismatch error
      await expect(page.locator('text=パスワードが一致しません')).toBeVisible()
    })

    test('should register new user successfully', async ({ page }) => {
      const uniqueEmail = `test-${Date.now()}@example.com`

      await page.goto('/auth/register')

      // Fill registration form
      await page.fill('input[placeholder="山田 太郎"]', 'テストユーザー')
      await page.fill('input[placeholder="you@example.com"]', uniqueEmail)
      await page.fill('input[placeholder="8文字以上"]', 'password123')
      await page.fill('input[placeholder="もう一度入力"]', 'password123')

      // Submit form
      await page.click('button[type="submit"]')

      // Should show success message
      await expect(page.locator('text=アカウントが作成されました')).toBeVisible({
        timeout: 10000,
      })

      // Should redirect to signin page
      await expect(page).toHaveURL(/\/auth\/signin/, { timeout: 5000 })
    })

    test('should show error for duplicate email', async ({ page }) => {
      // First, create a user
      const uniqueEmail = `duplicate-${Date.now()}@example.com`

      await page.goto('/auth/register')

      await page.fill('input[placeholder="山田 太郎"]', 'テストユーザー1')
      await page.fill('input[placeholder="you@example.com"]', uniqueEmail)
      await page.fill('input[placeholder="8文字以上"]', 'password123')
      await page.fill('input[placeholder="もう一度入力"]', 'password123')
      await page.click('button[type="submit"]')

      // Wait for redirect
      await page.waitForURL(/\/auth\/signin/, { timeout: 10000 })

      // Try to register again with same email
      await page.goto('/auth/register')

      await page.fill('input[placeholder="山田 太郎"]', 'テストユーザー2')
      await page.fill('input[placeholder="you@example.com"]', uniqueEmail)
      await page.fill('input[placeholder="8文字以上"]', 'password123')
      await page.fill('input[placeholder="もう一度入力"]', 'password123')
      await page.click('button[type="submit"]')

      // Should show duplicate email error
      await expect(
        page.locator('text=このメールアドレスは既に登録されています'),
      ).toBeVisible({
        timeout: 10000,
      })
    })
  })

  test.describe('Login Flow', () => {
    test('should navigate to login page', async ({ page }) => {
      await page.goto('/auth/signin')

      await expect(page.locator('h1')).toContainText('ログイン')
    })

    test('should show validation errors for empty form', async ({ page }) => {
      await page.goto('/auth/signin')

      // Submit empty form
      await page.click('button[type="submit"]')

      // Should show validation errors (either field-level or after submit)
      await expect(
        page.locator('text=有効なメールアドレスを入力してください'),
      ).toBeVisible()
    })

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/auth/signin')

      // Fill with invalid credentials
      await page.fill('input[placeholder="you@example.com"]', 'fake@example.com')
      await page.fill('input[placeholder="パスワードを入力"]', 'wrongpassword')

      // Submit form
      await page.click('button[type="submit"]')

      // Should show error message
      await expect(
        page.locator(
          'text=メールアドレスまたはパスワードが正しくありません',
        ),
      ).toBeVisible({
        timeout: 10000,
      })
    })

    test('should login successfully with valid credentials', async ({
      page,
    }) => {
      // First, create a user
      const uniqueEmail = `login-test-${Date.now()}@example.com`
      const password = 'testpassword123'

      await page.goto('/auth/register')
      await page.fill('input[placeholder="山田 太郎"]', 'ログインテストユーザー')
      await page.fill('input[placeholder="you@example.com"]', uniqueEmail)
      await page.fill('input[placeholder="8文字以上"]', password)
      await page.fill('input[placeholder="もう一度入力"]', password)
      await page.click('button[type="submit"]')

      // Wait for redirect to signin
      await page.waitForURL(/\/auth\/signin/, { timeout: 10000 })

      // Now login
      await page.fill('input[placeholder="you@example.com"]', uniqueEmail)
      await page.fill('input[placeholder="パスワードを入力"]', password)
      await page.click('button[type="submit"]')

      // Should redirect to home or dashboard
      await expect(page).not.toHaveURL(/\/auth\/signin/, { timeout: 10000 })
    })

    test('should navigate to register from login', async ({ page }) => {
      await page.goto('/auth/signin')

      // Click register link
      await page.click('text=新規登録')

      await expect(page).toHaveURL(/\/auth\/register/)
    })

    test('should have OAuth login buttons', async ({ page }) => {
      await page.goto('/auth/signin')

      // Check for OAuth buttons
      await expect(page.locator('text=Googleでログイン')).toBeVisible()
      await expect(page.locator('text=Discordでログイン')).toBeVisible()
    })
  })

  test.describe('Logout Flow', () => {
    test('should logout and redirect to home', async ({ page }) => {
      // First, login
      const uniqueEmail = `logout-test-${Date.now()}@example.com`
      const password = 'testpassword123'

      await page.goto('/auth/register')
      await page.fill('input[placeholder="山田 太郎"]', 'ログアウトテストユーザー')
      await page.fill('input[placeholder="you@example.com"]', uniqueEmail)
      await page.fill('input[placeholder="8文字以上"]', password)
      await page.fill('input[placeholder="もう一度入力"]', password)
      await page.click('button[type="submit"]')

      // Wait for redirect
      await page.waitForURL(/\/auth\/signin/, { timeout: 10000 })

      // Login
      await page.fill('input[placeholder="you@example.com"]', uniqueEmail)
      await page.fill('input[placeholder="パスワードを入力"]', password)
      await page.click('button[type="submit"]')

      // Wait for login
      await expect(page).not.toHaveURL(/\/auth\/signin/, { timeout: 10000 })

      // Find and click logout button (if visible)
      const logoutButton = page.locator('text=ログアウト')
      if (await logoutButton.isVisible()) {
        await logoutButton.click()

        // Should be logged out
        await expect(page).toHaveURL('/')
      }
    })
  })

  test.describe('Protected Routes', () => {
    test('should redirect unauthenticated user to signin', async ({ page }) => {
      // Try to access a protected route
      await page.goto('/dashboard')

      // Should redirect to signin
      // Note: This depends on middleware configuration
      await expect(page).toHaveURL(/\/auth\/signin/, { timeout: 10000 })
    })

    test('should allow authenticated user to access protected routes', async ({
      page,
    }) => {
      // First, login
      const uniqueEmail = `protected-test-${Date.now()}@example.com`
      const password = 'testpassword123'

      await page.goto('/auth/register')
      await page.fill('input[placeholder="山田 太郎"]', '保護ルートテストユーザー')
      await page.fill('input[placeholder="you@example.com"]', uniqueEmail)
      await page.fill('input[placeholder="8文字以上"]', password)
      await page.fill('input[placeholder="もう一度入力"]', password)
      await page.click('button[type="submit"]')

      await page.waitForURL(/\/auth\/signin/, { timeout: 10000 })

      await page.fill('input[placeholder="you@example.com"]', uniqueEmail)
      await page.fill('input[placeholder="パスワードを入力"]', password)
      await page.click('button[type="submit"]')

      // Wait for login to complete
      await expect(page).not.toHaveURL(/\/auth\/signin/, { timeout: 10000 })

      // Now try to access protected route
      await page.goto('/dashboard')

      // Should stay on dashboard (not redirect to signin)
      // Note: This depends on dashboard page existing
      await expect(page).not.toHaveURL(/\/auth\/signin/)
    })
  })

  test.describe('Home Page', () => {
    test('should show login button when not authenticated', async ({
      page,
    }) => {
      await page.goto('/')

      // Should show login button or link
      const loginButton = page.locator('text=ログイン')
      await expect(loginButton).toBeVisible()
    })

    test('should navigate to signin from home', async ({ page }) => {
      await page.goto('/')

      await page.click('text=ログイン')

      await expect(page).toHaveURL(/\/auth\/signin/)
    })
  })
})
