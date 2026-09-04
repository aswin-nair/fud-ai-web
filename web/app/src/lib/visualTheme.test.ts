import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const tokens = readFileSync(new URL('../styles/tokens.css', import.meta.url), 'utf8')
const styles = readFileSync(new URL('../styles/product-ui.css', import.meta.url), 'utf8')
const imports = readFileSync(new URL('../index.css', import.meta.url), 'utf8')

function color(name: string) {
  const value = tokens.match(new RegExp(`${name}:\\s*#([0-9a-f]{6});`, 'i'))?.[1]
  if (!value) throw new Error(`Missing explicit theme color: ${name}`)
  return value
}

function luminance(hex: string) {
  const channels = [0, 2, 4].map(start => {
    const value = parseInt(hex.slice(start, start + 2), 16) / 255
    return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4
  })
  return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722
}

function contrast(text: string, background: string) {
  const a = luminance(color(text))
  const b = luminance(color(background))
  return (Math.max(a, b) + .05) / (Math.min(a, b) + .05)
}

describe('shared visual theme', () => {
  it('keeps dark-panel text and coral actions readable', () => {
    for (const text of ['--product-on-dark', '--product-dark-muted', '--product-dark-accent']) {
      for (const background of ['--product-dark', '--product-dark-surface']) {
        expect(contrast(text, background), `${text} on ${background}`).toBeGreaterThanOrEqual(4.5)
      }
    }
    expect(contrast('--ink', '--coral-hue')).toBeGreaterThanOrEqual(4.5)
  })

  it('keeps regular labels readable against both neutral light surfaces', () => {
    for (const text of ['--ink', '--ink-soft', '--ink-mute', '--coral-text']) {
      for (const background of ['--paper', '--paper-card']) {
        expect(contrast(text, background), `${text} on ${background}`).toBeGreaterThanOrEqual(4.5)
      }
    }
  })

  it('leaves accessibility rules last and pairs the dark heatmap with its legend', () => {
    expect(imports.trim().endsWith("@import './styles/a11y.css';")).toBe(true)
    expect(imports.indexOf('product-ui.css')).toBeGreaterThan(imports.indexOf('you-ui.css'))
    expect(styles).toContain('.insights-refresh .consistency-card .insights-heat-cell.is-logged { background: var(--product-dark-accent); }')
    expect(styles).toContain('.insights-refresh .consistency-card .insights-legend .is-logged { background: var(--product-dark-accent); }')
    expect(styles).toContain('.insights-heat-cell.is-future, .insights-legend .is-future')
  })
})
