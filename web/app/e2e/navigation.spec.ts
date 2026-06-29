import { test, expect } from '@playwright/test'
import { nav, signUpAndOnboard } from './helpers'

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await signUpAndOnboard(page)
  })

  test('bottom nav visits all tabs', async ({ page }) => {
    await nav(page).getByRole('link', { name: 'Progress' }).click()
    await expect(page).toHaveURL('/progress')
    await expect(page.getByRole('heading', { name: 'Weight' })).toBeVisible()

    await nav(page).getByRole('link', { name: 'Coach' }).click()
    await expect(page).toHaveURL('/coach')

    await nav(page).getByRole('link', { name: 'Settings' }).click()
    await expect(page).toHaveURL('/settings')
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible()

    await nav(page).getByRole('link', { name: 'About' }).click()
    await expect(page).toHaveURL('/about')
    await expect(page.getByRole('heading', { name: 'About' })).toBeVisible()

    await nav(page).getByRole('link', { name: 'Home' }).click()
    await expect(page).toHaveURL('/')
    await expect(page.getByText("Today's Food")).toBeVisible()
  })

  test('sign out returns to login', async ({ page }) => {
    await nav(page).getByRole('link', { name: 'Settings' }).click()
    await page.getByRole('button', { name: 'Sign out' }).click()
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByRole('heading', { name: 'Fud AI' })).toBeVisible()
  })
})
