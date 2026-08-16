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

    await nav(page).getByRole('link', { name: 'Discover' }).click()
    await expect(page).toHaveURL('/discover')
    await expect(page.getByRole('heading', { name: 'Discover' })).toBeVisible()

    await nav(page).getByRole('link', { name: 'Settings' }).click()
    await expect(page).toHaveURL('/settings')
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible()

    await page.getByRole('link', { name: 'About Fud AI' }).click()
    await expect(page).toHaveURL('/about')
    await expect(page.getByRole('heading', { name: 'About' })).toBeVisible()

    await nav(page).getByRole('link', { name: 'Home' }).click()
    await expect(page).toHaveURL('/')
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  })

  test('journey card and coach FAB reach their full pages', async ({ page }) => {
    // Journey moved out of the persistent nav onto a tappable Home summary card.
    await page.locator('a[href="/journey"]').first().click()
    await expect(page).toHaveURL('/journey')

    await page.goBack()
    await expect(page).toHaveURL('/')

    // Coach moved onto a floating chat FAB.
    await page.getByLabel('Chat with your coach').click()
    await expect(page).toHaveURL('/coach')
    await expect(page.getByText('AI Coach')).toBeVisible()
  })

  test('log dropdown opens from the nav and reaches every option', async ({ page }) => {
    await page.getByRole('button', { name: 'Log food' }).click()
    await expect(page.getByRole('menuitem', { name: 'Manual Entry' })).toBeVisible()

    await page.getByRole('menuitem', { name: 'Manual Entry' }).click()
    await expect(page).toHaveURL(/\/log\/manual/)
  })

  test('sign out returns to login', async ({ page }) => {
    await nav(page).getByRole('link', { name: 'Settings' }).click()
    await page.getByRole('button', { name: 'Sign out' }).click()
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByRole('heading', { name: 'Fud AI' })).toBeVisible()
  })
})
