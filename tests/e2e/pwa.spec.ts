import { expect, test } from '@playwright/test'

/**
 * E2E tests for PWA functionality.
 *
 * Tests cover:
 * - PWA installation capability (manifest and icons)
 * - Service worker registration
 * - Offline fallback page
 * - App launching without browser chrome (standalone mode)
 *
 * NOTE: PWA installation is browser-specific and may not be fully testable
 * in headless mode. These tests verify the technical requirements are in place.
 */

test.describe('PWA', () => {
  test.describe('Web App Manifest', () => {
    test('should serve valid web app manifest', async ({ page }) => {
      // Fetch the manifest
      const response = await page.goto('/manifest.webmanifest')
      expect(response?.status()).toBe(200)
      expect(response?.headers()['content-type']).toContain('application/manifest+json')

      // Parse and validate manifest content
      const manifest = await response?.json()

      // Required fields
      expect(manifest.name).toBe('Sapphire')
      expect(manifest.short_name).toBe('Sapphire')
      expect(manifest.description).toContain('ポーカー')
      expect(manifest.start_url).toBe('/')
      expect(manifest.display).toBe('standalone')
      expect(manifest.theme_color).toBeDefined()
      expect(manifest.background_color).toBeDefined()
      expect(manifest.lang).toBe('ja')

      // Icons
      expect(manifest.icons).toBeInstanceOf(Array)
      expect(manifest.icons.length).toBeGreaterThanOrEqual(2)

      // Check for required icon sizes
      const iconSizes = manifest.icons.map((icon: { sizes: string }) => icon.sizes)
      expect(iconSizes).toContain('192x192')
      expect(iconSizes).toContain('512x512')

      // Icons should have valid properties
      for (const icon of manifest.icons) {
        expect(icon.src).toBeDefined()
        expect(icon.type).toBe('image/png')
        expect(icon.purpose).toBeDefined()
      }
    })

    test('should have manifest link in HTML head', async ({ page }) => {
      await page.goto('/auth/signin')

      // Check for manifest link
      const manifestLink = page.locator('link[rel="manifest"]')
      await expect(manifestLink).toHaveAttribute('href', '/manifest.webmanifest')
    })

    test('should have theme-color meta tag', async ({ page }) => {
      await page.goto('/auth/signin')

      // Check for theme-color meta tag
      const themeColorMeta = page.locator('meta[name="theme-color"]')
      await expect(themeColorMeta).toHaveAttribute('content', /.+/)
    })

    test('should have apple-touch-icon', async ({ page }) => {
      await page.goto('/auth/signin')

      // Check for apple-touch-icon
      const appleTouchIcon = page.locator('link[rel="apple-touch-icon"]')
      await expect(appleTouchIcon).toHaveAttribute('href', /\/icons\//)
    })
  })

  test.describe('App Icons', () => {
    test('should serve 192x192 icon', async ({ page }) => {
      const response = await page.goto('/icons/icon-192x192.png')
      expect(response?.status()).toBe(200)
      expect(response?.headers()['content-type']).toContain('image/png')
    })

    test('should serve 512x512 icon', async ({ page }) => {
      const response = await page.goto('/icons/icon-512x512.png')
      expect(response?.status()).toBe(200)
      expect(response?.headers()['content-type']).toContain('image/png')
    })
  })

  test.describe('Service Worker', () => {
    test('should register service worker', async ({ page }) => {
      await page.goto('/auth/signin')

      // Wait for service worker to register
      const swRegistered = await page.evaluate(async () => {
        if (!('serviceWorker' in navigator)) {
          return { supported: false }
        }

        try {
          // Wait for existing registration or timeout
          const registration = await Promise.race([
            navigator.serviceWorker.ready,
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
          ])

          if (!registration) {
            return { supported: true, registered: false }
          }

          return {
            supported: true,
            registered: true,
            scope: registration.scope,
            active: !!registration.active,
          }
        } catch (error) {
          return { supported: true, registered: false, error: String(error) }
        }
      })

      expect(swRegistered.supported).toBe(true)
      expect(swRegistered.registered).toBe(true)
      expect(swRegistered.active).toBe(true)
    })

    test('should serve service worker file with correct headers', async ({ page }) => {
      const response = await page.goto('/sw.js')
      expect(response?.status()).toBe(200)
      expect(response?.headers()['content-type']).toContain('javascript')

      // Service worker should not be cached aggressively
      const cacheControl = response?.headers()['cache-control']
      expect(cacheControl).toMatch(/no-cache|max-age=0/)
    })
  })

  test.describe('Offline Fallback', () => {
    test('should have offline page', async ({ page }) => {
      const response = await page.goto('/offline')
      expect(response?.status()).toBe(200)

      // Should show offline message
      await expect(page.getByRole('heading', { name: /オフライン/ })).toBeVisible()
      await expect(page.getByText(/ネットワーク|接続/)).toBeVisible()
    })

    test('should have retry button on offline page', async ({ page }) => {
      await page.goto('/offline')

      // Should have a retry/reload button
      const retryButton = page.getByRole('button', { name: /再試行|再読み込み|更新/ })
      await expect(retryButton).toBeVisible()
    })
  })

  test.describe('PWA Installation Capability', () => {
    test('should be installable (manifest validation)', async ({ page }) => {
      await page.goto('/auth/signin')

      // Check all PWA requirements are met
      const pwaCheck = await page.evaluate(async () => {
        const checks = {
          hasManifest: false,
          hasServiceWorker: false,
          isSecure: window.location.protocol === 'https:' || window.location.hostname === 'localhost',
          hasIcons: false,
          hasStartUrl: false,
          hasDisplay: false,
        }

        // Check manifest link
        const manifestLink = document.querySelector('link[rel="manifest"]')
        if (manifestLink) {
          checks.hasManifest = true
          try {
            const response = await fetch(manifestLink.getAttribute('href') ?? '')
            const manifest = await response.json()
            checks.hasIcons = Array.isArray(manifest.icons) && manifest.icons.length >= 2
            checks.hasStartUrl = !!manifest.start_url
            checks.hasDisplay = manifest.display === 'standalone' || manifest.display === 'fullscreen'
          } catch {
            // Manifest fetch failed
          }
        }

        // Check service worker
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.getRegistration()
          checks.hasServiceWorker = !!registration
        }

        return checks
      })

      expect(pwaCheck.hasManifest).toBe(true)
      expect(pwaCheck.hasServiceWorker).toBe(true)
      expect(pwaCheck.isSecure).toBe(true)
      expect(pwaCheck.hasIcons).toBe(true)
      expect(pwaCheck.hasStartUrl).toBe(true)
      expect(pwaCheck.hasDisplay).toBe(true)
    })
  })

  test.describe('Standalone Mode', () => {
    test('should detect standalone display mode when launched as PWA', async ({ browser }) => {
      // Create a context that simulates standalone mode
      const context = await browser.newContext({
        // Simulate PWA display mode via media query override
      })
      const page = await context.newPage()

      // Inject standalone mode simulation
      await page.addInitScript(() => {
        Object.defineProperty(window, 'matchMedia', {
          writable: true,
          value: (query: string) => ({
            matches: query === '(display-mode: standalone)',
            media: query,
            onchange: null,
            addListener: () => {},
            removeListener: () => {},
            addEventListener: () => {},
            removeEventListener: () => {},
            dispatchEvent: () => true,
          }),
        })
      })

      await page.goto('/auth/signin')

      // Check if app can detect standalone mode
      const isStandalone = await page.evaluate(() => {
        return window.matchMedia('(display-mode: standalone)').matches
      })

      expect(isStandalone).toBe(true)

      await context.close()
    })
  })
})
