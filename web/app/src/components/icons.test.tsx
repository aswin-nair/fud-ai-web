import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import * as icons from './icons'
import { HabitMilestones } from './HabitMilestones'

describe('library icons', () => {
  it('preserves the shared icon contract without leaking active to the DOM', () => {
    for (const [name, Icon] of Object.entries(icons)) {
      if (!name.startsWith('Icon')) continue
      const html = renderToStaticMarkup(<Icon size={28} active />)
      expect(html, name).toContain('lucide')
      expect(html, name).toContain('width="28"')
      expect(html, name).toContain('aria-hidden="true"')
      expect(html, name).not.toContain(' active=')
    }
  })
  it('uses a neutral library fallback for unknown or missing food art', () => {
    expect(renderToStaticMarkup(<icons.FoodIcon emoji="unknown" />)).toContain('lucide-utensils')
    expect(renderToStaticMarkup(<icons.FoodIcon />)).toContain('lucide-utensils')
    expect(renderToStaticMarkup(<icons.FoodIcon emoji="🍕" />)).toContain('lucide-pizza')
  })
  it('retains the notification indicator', () => {
    expect(renderToStaticMarkup(<icons.IconBell dot dotColor="#ff0000" />)).toContain('fill="#ff0000"')
  })
  it('gates motion by accessibility preference and interaction, with no loops', () => {
    const css = readFileSync(new URL('../styles/icon-motion.css', import.meta.url), 'utf8')
    expect(css).toContain('prefers-reduced-motion: no-preference')
    expect(css).toContain(':focus-visible')
    expect(css).toContain(':active')
    expect(css).not.toContain('infinite')
  })
})

describe('logging milestones', () => {
  it('starts without claiming any achievements', () => {
    const html = renderToStaticMarkup(<HabitMilestones loggedDays={0} />)
    expect(html).toContain('next milestone: 1')
    expect(html).not.toContain('class="is-achieved"')
  })
  it('celebrates accumulated logged days without a consecutive-day requirement', () => {
    const html = renderToStaticMarkup(<HabitMilestones loggedDays={7} />)
    expect(html.match(/class="is-achieved"/g)).toHaveLength(3)
    expect(html).toContain('next milestone: 14')
    expect(html).toContain('Breaks don’t reset')
  })
  it('handles all milestones complete', () => {
    const html = renderToStaticMarkup(<HabitMilestones loggedDays={42} />)
    expect(html.match(/class="is-achieved"/g)).toHaveLength(5)
    expect(html).not.toContain('next milestone')
  })
})
