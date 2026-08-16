import { readdirSync, readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const SRC = fileURLToPath(new URL('../', import.meta.url))
const BANNED = /\b(bad|cheat|guilty|earned|naughty|sinful|damage)\b|burn it off/i

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const path = `${dir}/${name}`
    if (statSync(path).isDirectory()) return sourceFiles(path)
    if (!/\.tsx?$/.test(name) || name.endsWith('.test.ts') || name.endsWith('.test.tsx')) return []
    return [path]
  })
}

function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1')
}

describe('user-facing copy policy', () => {
  it('keeps moralizing vocabulary out of product source', () => {
    for (const path of sourceFiles(SRC)) {
      expect(stripComments(readFileSync(path, 'utf8')), path).not.toMatch(BANNED)
    }
  })
})
