import { test, expect } from '@playwright/test'

/**
 * Smoke tests against the production build (base path /app/).
 * Runs in the "production" project defined in playwright.config.ts.
 */
test.describe('Production build', () => {
  test('app loads at /app/ and starts first-time guests in onboarding', async ({ page }) => {
    await page.goto('/app/')
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 15_000 })
    await expect(page.getByRole('heading', { name: 'Food tracking, at your pace.' })).toBeVisible({ timeout: 15_000 })
  })

  test('client router works under /app/', async ({ page }) => {
    await page.goto('/app/login')
    await expect(page).toHaveURL(/\/app\/login/)
    await expect(page.getByRole('heading', { name: 'Fud AI' })).toBeVisible({ timeout: 15_000 })
  })
})
