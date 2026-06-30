import { test, expect } from '@playwright/test'
import { signUpAndOnboard } from './helpers'

test.describe('Progress', () => {
  test.beforeEach(async ({ page }) => {
    await signUpAndOnboard(page)
    await page.getByLabel('Main').getByRole('link', { name: 'Progress' }).click()
  })

  test('shows time range chips and weight card', async ({ page }) => {
    await expect(page.getByRole('button', { name: '1W' })).toBeVisible()
    await expect(page.getByRole('button', { name: '1M' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Weight' })).toBeVisible()
    await expect(page.getByText('Current', { exact: true }).first()).toBeVisible()
    await expect(page.locator('.progress-stat-grid').first().getByText('Goal', { exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Calories' })).toBeVisible()
  })

  test('logs weight via modal', async ({ page }) => {
    await page.getByRole('button', { name: '+ Log weight' }).click()
    await expect(page.getByRole('heading', { name: 'Log weight' })).toBeVisible()

    await page.getByLabel('Weight (kg)').fill('72.5')
    await page.getByRole('button', { name: 'Save' }).click()

    await expect(page.getByText('Weight history')).toBeVisible()
    await expect(page.getByText('1 entry')).toBeVisible()
    await expect(page.locator('.progress-stat-value').first()).toContainText('72.5')
  })

  test('switches time range', async ({ page }) => {
    await page.getByRole('button', { name: '1M' }).click()
    await expect(page.getByRole('button', { name: '1M' })).toHaveClass(/active/)
  })
})
