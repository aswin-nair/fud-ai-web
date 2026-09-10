import { expect, test } from '@playwright/test'
import { settlePageLayout, signUpAndOnboard } from './helpers'

for (const width of [320, 390, 1280]) {
  test(`You page stays useful and expressive at ${width}px`, async ({ page }, testInfo) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await page.route('**/api/**', route => route.abort('blockedbyclient'))
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await signUpAndOnboard(page)
    await page.goto('/settings')
    await expect(page.getByRole('heading', { name: 'You', exact: true })).toBeVisible()
    for (const colorScheme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme })
      await page.reload()
      await expect(page.locator('html')).toHaveAttribute('data-theme', colorScheme)
      await expect(page.getByText('NO GUILT. JUST GOOD DATA.')).toBeVisible()
      await expect(page.getByRole('link', { name: 'Momo' })).toBeVisible()
      await page.getByRole('link', { name: 'Momo' }).click()
      await expect(page.getByRole('heading', { name: 'Your kitchen companion' })).toBeVisible()
      await page.getByRole('checkbox', { name: 'Mute Momo' }).check()
      await page.getByRole('checkbox', { name: 'Reduce Momo motion' }).check()
      await page.getByRole('button', { name: 'Save settings' }).click()
      await expect(page.getByRole('status')).toContainText('Settings saved')
      await settlePageLayout(page)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      await page.screenshot({ path: testInfo.outputPath(`you-${colorScheme}.png`), fullPage: true, animations: 'disabled' })
    }
    expect(errors).toEqual([])
  })
}
