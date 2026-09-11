import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const root = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ command }) => {
  if (command === 'build') {
    const backend = (process.env.VITE_DATA_BACKEND ?? '').trim().toLowerCase()
    if (backend !== 'local' && backend !== 'neon') {
      throw new Error('VITE_DATA_BACKEND must be local or neon for a production build')
    }
  }

  return {
    plugins: [react()],
    build: {
      sourcemap: process.env.VITE_SOURCEMAP === 'true' ? 'hidden' : false,
    },
    // The same build serves both surfaces: the public landing page at `/` and
    // the product at `/app`. Assets stay root-relative so both URLs work.
    base: '/',
    resolve: {
      alias: {
        '@assets': path.resolve(root, '../assets'),
      },
    },
    server: {
      port: 5173,
      strictPort: true,
      host: 'localhost',
      open: '/',
    },
    preview: {
      port: 4173,
      strictPort: true,
      host: 'localhost',
    },
  }
})
