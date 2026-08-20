import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const root = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ command, mode }) => {
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
    // Dev: http://localhost:5173/  |  Production build + preview: /app/
    base: mode === 'production' ? '/app/' : '/',
    resolve: {
      alias: {
        '@assets': path.resolve(root, '../assets'),
      },
    },
    server: {
      port: 5173,
      strictPort: true,
      host: 'localhost',
      open: '/login',
    },
    preview: {
      port: 4173,
      strictPort: true,
      host: 'localhost',
    },
  }
})
