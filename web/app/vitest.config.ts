import { defineConfig } from 'vitest/config'

/**
 * Unit tests live beside the source in src/. The e2e/ directory holds
 * Playwright specs, which need the Playwright runner — without this include
 * vitest picks them up and fails on the import.
 */
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', '../../packages/product/src/**/*.test.ts'],
    /*
     * Pinned to a zone that actually observes DST. The streak walks calendar
     * days, so running these in UTC would make the DST cases vacuous — they
     * would pass without ever crossing a transition.
     */
    env: {
      TZ: 'America/New_York',
      VITE_DATA_BACKEND: 'local',
    },
  },
})
