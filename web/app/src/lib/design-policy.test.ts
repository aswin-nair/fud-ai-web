import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const SRC = fileURLToPath(new URL('../', import.meta.url))
const css = readFileSync(`${SRC}/index.css`, 'utf8')

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
      expect(selector).toMatch(/destructive|\.danger/)
    }
  })

  it('keeps over-target calorie feedback on neutral wellness tokens', () => {
    const overValueRule = css.match(/\.calorie-ring-value\.is-over\s*\{([^}]*)\}/)?.[1]
    const overStatusRule = css.match(/\.ring-over\s+\.calorie-hero-status\s*\{([^}]*)\}/)?.[1]

    expect(overValueRule).toContain('var(--ink-soft)')
    expect(overStatusRule).toContain('var(--ink-soft)')
    expect(`${overValueRule}${overStatusRule}`).not.toMatch(/danger|green-goal/)
  })

  it('uses danger—not the brand accent—for the delete-data control', () => {
    const rule = css.match(/\.settings-data-btn\.danger\s*\{([^}]*)\}/)?.[1]
    expect(rule).toContain('var(--danger)')
    expect(rule).not.toContain('var(--coral')
  })
})
