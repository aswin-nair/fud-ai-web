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

function cssRulesUsing(token: string): string[] {
  return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter(match => match[2].includes(`var(${token})`))
    .map(match => match[1].replace(/\/\*[\s\S]*?\*\//g, '').trim())
}

describe('outcome and destructive color policy', () => {
  it('reserves danger tokens for explicitly destructive controls', () => {
    const selectors = [
      ...cssRulesUsing('--danger'),
      ...cssRulesUsing('--danger-deep'),
    ]

    expect(selectors.length).toBeGreaterThan(0)
    for (const selector of selectors) {
      if (selector.includes(':root')) continue
      expect(selector).toMatch(/destructive|\.danger|edge-danger/)
    }
  })

  it('keeps over-target calorie feedback on neutral wellness tokens', () => {
    const overValueRule = css.match(/\.calorie-ring-value\.is-over\s*\{([^}]*)\}/)?.[1]

    expect(overValueRule).toContain('var(--ink-soft)')
    expect(overValueRule).not.toMatch(/danger|green-goal/)
  })

  it('uses danger—not the brand accent—for the delete-data control', () => {
    const rule = css.match(/\.settings-data-btn\.danger\s*\{([^}]*)\}/)?.[1]
    // Either the fill or its AA-contrast text variant is fine; both are the
    // danger hue. What §2.4 forbids is the brand accent on a destructive
    // control, which is what the second assertion actually guards.
    expect(rule).toMatch(/var\(--danger(-text)?\)/)
    expect(rule).not.toContain('var(--coral')
  })

  it('does not keep dead calorie-hero or arc-gauge selectors', () => {
    expect(css).not.toMatch(/\.calorie-hero\b/)
    expect(css).not.toMatch(/\.arc-gauge\b/)
    expect(css).not.toMatch(/\.home-add-pill\b/)
  })
})
