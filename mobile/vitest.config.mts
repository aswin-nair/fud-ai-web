import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

/**
 * Only the pure logic in src/logic is unit tested here. It has no React Native
 * imports, so it runs in plain Node without a native mock layer.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
