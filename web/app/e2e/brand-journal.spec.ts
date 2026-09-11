import { test, expect } from '@playwright/test'
import { settlePageLayout, signUpAndOnboard } from './helpers'

test('Poiem journal signature fits alongside streak controls and About keeps the identity', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await signUpAndOnboard(page)
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const colorScheme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme })
      await settlePageLayout(page)
      await expect(page.getByRole('img', { name: 'Poiem', exact: true })).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
      const signature = await page.locator('.poiem-journal-signature').boundingBox()
      const badges = await page.locator('.today-badges').boundingBox()
      // The poster masthead stacks the chips under the title. Beside or below are
      // both fine; what must never happen is the signature running into them.
      const clear = signature!.x + signature!.width <= badges!.x || signature!.y + signature!.height <= badges!.y
      expect(clear, `signature overlaps streak controls at ${width}px ${colorScheme}`).toBe(true)
      if (width === 320) await page.screenshot({ path: testInfo.outputPath(`journal-${colorScheme}.png`), fullPage: true })
    }
  }
  await page.goto('/about')
  await expect(page.getByRole('img', { name: 'Poiem', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Poiem brand kit' })).toHaveAttribute('href', '/brand/index.html')
})
