import { readdirSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

export const HOBBY_SERVERLESS_FUNCTION_LIMIT = 12

const defaultApiRoot = join(dirname(fileURLToPath(import.meta.url)), '../api')

export function listVercelServerlessFunctions(apiRoot = defaultApiRoot) {
  const files = []

  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('_')) continue
      const full = join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(full)
        continue
      }
      if (!/\.(js|ts)$/.test(entry.name) || entry.name.endsWith('.d.ts')) continue
      files.push(relative(apiRoot, full).replaceAll('\\', '/'))
    }
  }

  walk(apiRoot)
  return files.sort()
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const files = listVercelServerlessFunctions()
  const headroom = HOBBY_SERVERLESS_FUNCTION_LIMIT - files.length
  console.log(`Vercel serverless functions: ${files.length} / ${HOBBY_SERVERLESS_FUNCTION_LIMIT} (headroom ${headroom})`)
  for (const file of files) console.log(`  ${file}`)
  if (files.length > HOBBY_SERVERLESS_FUNCTION_LIMIT) {
    console.error('Hobby deployments fail after a green build past 12 functions.')
    process.exit(1)
  }
}
