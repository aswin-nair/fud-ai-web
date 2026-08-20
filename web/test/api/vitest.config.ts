import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@fud-ai/contracts': fileURLToPath(new URL('../../../packages/contracts/src/index.ts', import.meta.url)),
      '@fud-ai/domain': fileURLToPath(new URL('../../../packages/domain/src/index.ts', import.meta.url)),
    },
  },
  test: {
    include: ['test/api/**/*.test.ts'],
  },
})
