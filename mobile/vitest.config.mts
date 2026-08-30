import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

/**
 * Pure logic and account/sync policy tests. Files that import React Native
 * stay out of this suite.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@fud-ai/contracts': fileURLToPath(
        new URL('../packages/contracts/src/index.ts', import.meta.url),
      ),
      '@fud-ai/domain/notifications': fileURLToPath(
        new URL('../packages/domain/src/notifications.ts', import.meta.url),
      ),
      '@fud-ai/domain/streak': fileURLToPath(
        new URL('../packages/domain/src/streak.ts', import.meta.url),
      ),
      '@fud-ai/domain/xp': fileURLToPath(
        new URL('../packages/domain/src/xp.ts', import.meta.url),
      ),
      '@fud-ai/product': fileURLToPath(
        new URL('../packages/product/src/index.ts', import.meta.url),
      ),
      '@fud-ai/product/dayRing': fileURLToPath(
        new URL('../packages/product/src/dayRing.ts', import.meta.url),
      ),
      '@fud-ai/product/enamelAwards': fileURLToPath(
        new URL('../packages/product/src/enamelAwards.ts', import.meta.url),
      ),
      '@fud-ai/product/guestClaim': fileURLToPath(
        new URL('../packages/product/src/guestClaim.ts', import.meta.url),
      ),
      '@fud-ai/product/localDate': fileURLToPath(
        new URL('../packages/product/src/localDate.ts', import.meta.url),
      ),
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
