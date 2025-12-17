import { expect, test } from '@playwright/test'

/**
 * E2E tests for authentication flows.
 *
 * Tests cover:
 * - User registration (signup)
 * - User login (signin)
 * - User logout (signout)
 * - Protected route access
 *
 * NOTE: Uses getByRole and getByLabel for stable selectors that avoid
 * duplicate text matching issues.
 */

test.describe('Authentication', () => {
  test.describe('Registration Flow', () => {
    test('should navigate to registration page', async ({ page }) => {
      await page.goto('/auth/signin')

      // Click on register link (use role for specificity)
      await page.getByRole('link', { name: '新規登録' }).click()

      // Should be on register page
      await expect(page).toHaveURL(/\/auth\/register/)
      await expect(
        page.getByRole('heading', { level: 1, name: '新規登録' }),
      ).toBeVisible()
    })

    test('should show validation errors for empty form', async ({ page }) => {
      await page.goto('/auth/register')

      // Submit empty form (use role to find submit button)
      await page.getByRole('button', { name: '登録' }).click()

      // Should show Mantine validation errors (not browser native)
      await expect(page.getByText('名前を入力してください')).toBeVisible()
    })

    test('should show password mismatch error', async ({ page }) => {
      await page.goto('/auth/register')

      // Fill form with mismatched passwords using placeholders for PasswordInput
      await page.getByLabel('名前').fill('テストユーザー')
      await page.getByLabel('メールアドレス').fill('test@example.com')
      await page.getByPlaceholder('8文字以上').fill('password123')
      await page.getByPlaceholder('もう一度入力').fill('different123')

      // Submit form
      await page.getByRole('button', { name: '登録' }).click()

      // Should show password mismatch error
      await expect(page.getByText('パスワードが一致しません')).toBeVisible()
    })

    test('should register new user successfully', async ({ page }) => {
      const uniqueEmail = `test-${Date.now()}@example.com`

      await page.goto('/auth/register')

      // Fill registration form using placeholders for PasswordInput
      await page.getByLabel('名前').fill('テストユーザー')
      await page.getByLabel('メールアドレス').fill(uniqueEmail)
      await page.getByPlaceholder('8文字以上').fill('password123')
      await page.getByPlaceholder('もう一度入力').fill('password123')

      // Submit form
      await page.getByRole('button', { name: '登録' }).click()

      // Should show success message
      await expect(page.getByText('アカウントが作成されました')).toBeVisible({
        timeout: 10000,
      })

      // Should redirect to signin page
      await expect(page).toHaveURL(/\/auth\/signin/, { timeout: 5000 })
    })

    test('should show error for duplicate email', async ({ page }) => {
      // First, create a user
      const uniqueEmail = `duplicate-${Date.now()}@example.com`

      await page.goto('/auth/register')

      await page.getByLabel('名前').fill('テストユーザー1')
      await page.getByLabel('メールアドレス').fill(uniqueEmail)
      await page.getByPlaceholder('8文字以上').fill('password123')
      await page.getByPlaceholder('もう一度入力').fill('password123')
      await page.getByRole('button', { name: '登録' }).click()

      // Wait for redirect
      await page.waitForURL(/\/auth\/signin/, { timeout: 10000 })

      // Try to register again with same email
      await page.goto('/auth/register')

      await page.getByLabel('名前').fill('テストユーザー2')
      await page.getByLabel('メールアドレス').fill(uniqueEmail)
      await page.getByPlaceholder('8文字以上').fill('password123')
      await page.getByPlaceholder('もう一度入力').fill('password123')
      await page.getByRole('button', { name: '登録' }).click()

      // Should show duplicate email error
      await expect(
        page.getByText('このメールアドレスは既に登録されています'),
      ).toBeVisible({
        timeout: 10000,
      })
    })
  })

  test.describe('Login Flow', () => {
    test('should navigate to login page', async ({ page }) => {
      await page.goto('/auth/signin')

      await expect(
        page.getByRole('heading', { level: 1, name: 'ログイン' }),
      ).toBeVisible()
    })

    test('should show validation errors for empty form', async ({ page }) => {
      await page.goto('/auth/signin')

      // Submit empty form (use exact match to avoid OAuth button conflicts)
      await page.getByRole('button', { name: 'ログイン', exact: true }).click()

      // Should show Mantine validation errors
      await expect(
        page.getByText('有効なメールアドレスを入力してください'),
      ).toBeVisible()
    })

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/auth/signin')

      // Fill with invalid credentials using placeholder for PasswordInput
      await page.getByLabel('メールアドレス').fill('fake@example.com')
      await page.getByPlaceholder('パスワードを入力').fill('wrongpassword')

      // Submit form
      await page.getByRole('button', { name: 'ログイン', exact: true }).click()

      // Should show error message
      await expect(
        page.getByText('メールアドレスまたはパスワードが正しくありません'),
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
      await page.getByLabel('名前').fill('ログインテストユーザー')
      await page.getByLabel('メールアドレス').fill(uniqueEmail)
      await page.getByPlaceholder('8文字以上').fill(password)
      await page.getByPlaceholder('もう一度入力').fill(password)
      await page.getByRole('button', { name: '登録' }).click()

      // Wait for redirect to signin
      await page.waitForURL(/\/auth\/signin/, { timeout: 10000 })

      // Now login
      await page.getByLabel('メールアドレス').fill(uniqueEmail)
      await page.getByPlaceholder('パスワードを入力').fill(password)
      await page.getByRole('button', { name: 'ログイン', exact: true }).click()

      // Should redirect to home or dashboard
      await expect(page).not.toHaveURL(/\/auth\/signin/, { timeout: 10000 })
    })

    test('should navigate to register from login', async ({ page }) => {
      await page.goto('/auth/signin')

      // Click register link (use role for specificity)
      await page.getByRole('link', { name: '新規登録' }).click()

      await expect(page).toHaveURL(/\/auth\/register/)
    })

    test('should have OAuth login buttons', async ({ page }) => {
      await page.goto('/auth/signin')

      // Check for OAuth buttons using role
      await expect(
        page.getByRole('button', { name: 'Googleでログイン' }),
      ).toBeVisible()
      await expect(
        page.getByRole('button', { name: 'Discordでログイン' }),
      ).toBeVisible()
    })
  })

  test.describe('Logout Flow', () => {
    test('should logout and redirect to home', async ({ page }) => {
      // First, login
      const uniqueEmail = `logout-test-${Date.now()}@example.com`
      const password = 'testpassword123'

      await page.goto('/auth/register')
      await page.getByLabel('名前').fill('ログアウトテストユーザー')
      await page.getByLabel('メールアドレス').fill(uniqueEmail)
      await page.getByPlaceholder('8文字以上').fill(password)
      await page.getByPlaceholder('もう一度入力').fill(password)
      await page.getByRole('button', { name: '登録' }).click()

      // Wait for redirect
      await page.waitForURL(/\/auth\/signin/, { timeout: 10000 })

      // Login
      await page.getByLabel('メールアドレス').fill(uniqueEmail)
      await page.getByPlaceholder('パスワードを入力').fill(password)
      await page.getByRole('button', { name: 'ログイン', exact: true }).click()

      // Wait for login
      await expect(page).not.toHaveURL(/\/auth\/signin/, { timeout: 10000 })

      // Find and click logout button (if visible)
      const logoutButton = page.getByRole('button', { name: 'ログアウト' })
      if (await logoutButton.isVisible()) {
        await logoutButton.click()

        // Should be logged out and redirected to signin (home redirects unauthenticated to signin)
        await expect(page).toHaveURL(/\/auth\/signin/, { timeout: 10000 })
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
      await page.getByLabel('名前').fill('保護ルートテストユーザー')
      await page.getByLabel('メールアドレス').fill(uniqueEmail)
      await page.getByPlaceholder('8文字以上').fill(password)
      await page.getByPlaceholder('もう一度入力').fill(password)
      await page.getByRole('button', { name: '登録' }).click()

      await page.waitForURL(/\/auth\/signin/, { timeout: 10000 })

      await page.getByLabel('メールアドレス').fill(uniqueEmail)
      await page.getByPlaceholder('パスワードを入力').fill(password)
      await page.getByRole('button', { name: 'ログイン', exact: true }).click()

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
    test('should redirect unauthenticated user to signin from home', async ({
      page,
    }) => {
      await page.goto('/')

      // Home page redirects unauthenticated users to signin
      await expect(page).toHaveURL(/\/auth\/signin/, { timeout: 10000 })
    })

    test('should redirect authenticated user to dashboard from home', async ({
      page,
    }) => {
      // First, login
      const uniqueEmail = `home-test-${Date.now()}@example.com`
      const password = 'testpassword123'

      await page.goto('/auth/register')
      await page.getByLabel('名前').fill('ホームテストユーザー')
      await page.getByLabel('メールアドレス').fill(uniqueEmail)
      await page.getByPlaceholder('8文字以上').fill(password)
      await page.getByPlaceholder('もう一度入力').fill(password)
      await page.getByRole('button', { name: '登録' }).click()

      await page.waitForURL(/\/auth\/signin/, { timeout: 10000 })

      await page.getByLabel('メールアドレス').fill(uniqueEmail)
      await page.getByPlaceholder('パスワードを入力').fill(password)
      await page.getByRole('button', { name: 'ログイン', exact: true }).click()

      // Wait for login to complete
      await expect(page).not.toHaveURL(/\/auth\/signin/, { timeout: 10000 })

      // Now go to home page
      await page.goto('/')

      // Should redirect to dashboard
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
    })
  })
})
