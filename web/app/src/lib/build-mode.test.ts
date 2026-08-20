import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const appRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))))

describe('explicit build modes', () => {
  it('refuses a production build with no backend', () => {
    const result = spawnSync(process.execPath, [join(appRoot, 'scripts/build.mjs')], {
      cwd: appRoot,
      env: { ...process.env, VITE_DATA_BACKEND: '' },
      encoding: 'utf8',
    })
    expect(result.status).not.toBe(0)
    expect(`${result.stdout}${result.stderr}`).toMatch(/build:local|build:cloud|build:release/)
  })

  it('refuses a release-candidate build without a release identifier', () => {
    const result = spawnSync(process.execPath, [join(appRoot, 'scripts/build.mjs'), 'neon', '--release'], {
      cwd: appRoot,
      env: {
        ...process.env,
        VITE_DATA_BACKEND: 'neon',
        VITE_RELEASE_ID: '',
        RELEASE_ID: '',
        VERCEL_GIT_COMMIT_SHA: '',
      },
      encoding: 'utf8',
    })
    expect(result.status).not.toBe(0)
    expect(`${result.stdout}${result.stderr}`).toMatch(/RELEASE_ID/)
  })
})
