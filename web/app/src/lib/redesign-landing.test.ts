import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const SRC = fileURLToPath(new URL('../', import.meta.url))

function collectCss(dir: string): string {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return collectCss(path)
    return entry.name.endsWith('.css') ? [readFileSync(path, 'utf8')] : []
  }).join('\n')
}

const css = collectCss(join(SRC, 'styles'))

describe('redesign landing audit', () => {
  it('keeps 44px touch targets on path nodes, counters, and nav faces', () => {
    const pathNode = css.match(/\.path-node \{([^}]+)\}/)?.[1]
    const counter = css.match(/\.counter \{([^}]+)\}/)?.[1]
    const navInner = css.match(/\.nav-item-inner \{([^}]+)\}/)?.[1]
    const pressable = css.match(/\.pressable-face \{([^}]+)\}/)?.[1]

    expect(pathNode).toMatch(/min-width:\s*44px/)
    expect(pathNode).toMatch(/min-height:\s*44px/)
    expect(counter).toMatch(/min-height:\s*44px/)
    expect(navInner).toMatch(/min-height:\s*44px/)
    expect(pressable).toMatch(/min-height:\s*5[4-9]px/)
  })

  it('keeps over-budget copy on the ink-soft token', () => {
    const over = css.match(/\.home-kcal-left\.is-over\s*\{([^}]*)\}/)?.[1]
    expect(over).toContain('var(--ink-soft)')
    expect(over).not.toMatch(/danger/)
  })

  it('ships app-wide press, stagger, and path travel', () => {
    expect(css).toContain('.motion-stagger > *')
    expect(css).toContain('.motion-list > *')
    expect(css).toContain('.meal-path-progress')
    expect(css).toContain('node-pop')
    expect(css).toContain('node-breathe')
    expect(css).toMatch(/prefers-reduced-motion:\s*reduce/)
  })

  it('documents Expo as web-first, no shared token extract', () => {
    const design = readFileSync(join(SRC, '../DESIGN.md'), 'utf8')
    expect(design).toMatch(/Expo/)
    expect(design).toMatch(/private alpha/)
    expect(design).toMatch(/does \*\*not\*\* extract shared tokens/)
  })
})
