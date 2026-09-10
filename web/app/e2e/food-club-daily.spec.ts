import { expect, test } from '@playwright/test'
import { settlePageLayout, signUpAndOnboard } from './helpers'

for (const width of [320, 390, 1280]) {
  test(`food club daily pages work at ${width}px in both themes`, async ({ page }, testInfo) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    // Test data remains in this isolated browser, never a cloud account.
    await page.route('**/api/**', route => route.abort('blockedbyclient'))
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await signUpAndOnboard(page)
    for (const colorScheme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme })
      await page.goto('/')
      await expect(page.getByRole('heading', { name: 'Today', exact: true })).toBeVisible()
      await expect(page.locator('html')).toHaveAttribute('data-theme', colorScheme)
      await settlePageLayout(page)
      await expect(page.locator('.today-momo-note')).toHaveCSS('background-color', 'rgb(248, 230, 106)')
      await expect(page.locator('.today-momo-note strong')).toHaveCSS('color', 'rgb(35, 34, 31)')
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      await page.screenshot({ path: testInfo.outputPath(`today-${colorScheme}.png`), fullPage: true, animations: 'disabled' })
      await page.getByRole('button', { name: 'Log a meal', exact: true }).click()
      await expect(page.getByRole('heading', { name: 'Log a meal', exact: true })).toBeVisible()
      await expect(page.getByRole('link', { name: /Snap a photo/ })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Adjust portion for Onboarding yogurt bowl' })).toBeVisible()
      await settlePageLayout(page)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      await page.screenshot({ path: testInfo.outputPath(`log-${colorScheme}.png`), fullPage: true, animations: 'disabled' })
      await page.getByLabel('Search your foods, or type calories').fill('350')
      await expect(page.getByRole('button', { name: /Quick add 350 kcal/ })).toBeVisible()
      await page.getByRole('button', { name: 'Clear search' }).click()
      await page.getByRole('button', { name: 'Adjust portion for Onboarding yogurt bowl' }).click()
      await expect(page.getByRole('dialog')).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(page.getByRole('dialog')).toHaveCount(0)
    }
    expect(errors).toEqual([])
  })
}
