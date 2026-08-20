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
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
