import { test, expect } from '@playwright/test'
import { logManualMeal, signUpAndOnboard } from './helpers'

test.describe('Home & food logging', () => {
  test.beforeEach(async ({ page }) => {
    await signUpAndOnboard(page)
  })

  test('shows calorie hero and macro cards', async ({ page }) => {
    await expect(page.getByText('kcal eaten')).toBeVisible()
    await expect(page.getByText('left').first()).toBeVisible()
    await expect(page.getByText('Protein')).toBeVisible()
    await expect(page.getByText('Carbs')).toBeVisible()
    await expect(page.getByText('Fat')).toBeVisible()
    await expect(page.getByText("Today's Food")).toBeVisible()
  })

  test('logs food via manual entry', async ({ page }) => {
    await logManualMeal(page, {
      name: 'Greek Yogurt',
      calories: '150',
      protein: '15',
      carbs: '8',
      fat: '4',
    })

    await expect(page.getByText('Greek Yogurt')).toBeVisible()
    await expect(page.locator('.food-card-cals', { hasText: '150 kcal' })).toBeVisible()
  })

  test('week strip keeps today calories after switching dates', async ({ page }) => {
    await logManualMeal(page, {
      name: 'Oatmeal',
      calories: '320',
      protein: '12',
      carbs: '54',
      fat: '6',
    })

    await expect(page.locator('.calorie-hero-value')).toHaveText('320')

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayLabel = String(yesterday.getDate())

    await page.locator('.week-day').filter({ hasText: yesterdayLabel }).first().click()
    await expect(page.locator('.calorie-hero-value')).toHaveText('0')

    const todayLabel = String(new Date().getDate())
    await page.locator('.week-day').filter({ hasText: todayLabel }).first().click()
    await expect(page.locator('.calorie-hero-value')).toHaveText('320')
    await expect(page.getByText('Oatmeal')).toBeVisible()
  })

  test('week strip is visible', async ({ page }) => {
    await expect(page.locator('.week-strip')).toBeVisible()
    await expect(page.locator('.week-day').first()).toBeVisible()
  })

  test('add menu opens log options', async ({ page }) => {
    await page.getByRole('button', { name: 'Log food' }).click()
    await expect(page.getByRole('menuitem', { name: 'Text Entry' })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: 'Photo' })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: 'Saved Meals' })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: 'Manual Entry' })).toBeVisible()
  })
})
