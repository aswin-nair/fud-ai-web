import { test, expect } from '@playwright/test'
import { logManualMeal, signUpAndOnboard } from './helpers'

test.describe('Home & food logging', () => {
  test.beforeEach(async ({ page }) => {
    await signUpAndOnboard(page)
  })

  test('shows calorie ring and macro progress group', async ({ page }) => {
    await expect(page.locator('.calorie-ring')).toBeVisible()
    await expect(page.locator('.home-ring-sub')).toContainText('of')
    await expect(page.getByRole('progressbar', { name: 'Protein' })).toBeVisible()
    await expect(page.getByRole('progressbar', { name: 'Carbs' })).toBeVisible()
    await expect(page.getByRole('progressbar', { name: 'Fat' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Breakfast' })).toBeVisible()

    // The pinned action must stay inside the 480px app shell on wide screens.
    const dockBox = await page.locator('.home-log-dock').boundingBox()
    expect(dockBox?.width).toBeLessThanOrEqual(480)
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

    await expect(page.locator('.home-ring-sub')).toContainText('560 of')

    // The strip runs Sunday to Saturday, so yesterday is off-screen whenever
    // today is a Sunday. Step the whole week rather than assuming a given day
    // cell is rendered.
    await page.getByRole('button', { name: 'Previous week' }).click()
    await expect(page.locator('.home-ring-sub')).toContainText('0 of')

    await page.getByRole('button', { name: 'Next week' }).click()
    await expect(page.locator('.home-ring-sub')).toContainText('560 of')
    await expect(page.getByText('Oatmeal')).toBeVisible()
  })

  test('week strip day cells switch the selected day', async ({ page }) => {
    // The previous week is entirely in the past, so every cell is enabled no
    // matter which weekday the suite runs on.
    await page.getByRole('button', { name: 'Previous week' }).click()

    const days = page.locator('.week-day')
    await expect(days).toHaveCount(7)

    await days.first().click()
    await expect(days.first().locator('.week-day-circle.selected')).toBeVisible()

    await days.last().click()
    await expect(days.last().locator('.week-day-circle.selected')).toBeVisible()
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

  test('shows the exact post-log celebration after manual entry', async ({ page }) => {
    await logManualMeal(page, {
      name: 'Toast Test Meal',
      calories: '420',
      protein: '22',
      carbs: '45',
      fat: '10',
    }, { dismissCelebration: false })

    const celebration = page.getByRole('dialog', { name: 'Meal logged' })
    await expect(celebration).toContainText('Toast Test Meal')
    await expect(celebration).toContainText('XP added')
  })
})
