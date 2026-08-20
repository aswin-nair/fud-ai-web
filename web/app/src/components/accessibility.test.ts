import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { BottomNav } from './BottomNav'
import { CalorieRing } from './CalorieRing'
import { DatePickerModal } from './DatePickerModal'
import { MacroProgressGroup } from './MacroGrid'
import { PressableButton } from './PressableButton'
import { WeekStrip } from './WeekStrip'

function count(haystack: string, needle: RegExp): number {
  return [...haystack.matchAll(needle)].length
}

afterEach(() => vi.useRealTimers())

describe('primary component accessibility contracts', () => {
  it('announces calorie progress factually, including an over-target value', () => {
    const html = renderToStaticMarkup(createElement(CalorieRing, {
      consumed: 2400,
      target: 2000,
    }))

    expect(html).toContain('role="progressbar"')
    expect(html).toContain('aria-label="Calories consumed"')
    expect(html).toContain('aria-valuemin="0"')
    expect(html).toContain('aria-valuemax="2000"')
    expect(html).toContain('aria-valuenow="2000"')
    expect(html).toContain('aria-valuetext="2400 of 2000 kilocalories, 400 over"')
  })

  it('gives every macro progress bar a distinct accessible name', () => {
    const html = renderToStaticMarkup(createElement(MacroProgressGroup, {
      protein: { current: 20, goal: 100 },
      carbs: { current: 30, goal: 200 },
      fat: { current: 10, goal: 60 },
    }))

    expect(count(html, /role="progressbar"/g)).toBe(3)
    expect(html).toContain('aria-label="Protein"')
    expect(html).toContain('aria-label="Carbs"')
    expect(html).toContain('aria-label="Fat"')
  })

  it('exposes the selected and current day in the week strip', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 20, 12, 0, 0))
    const selectedDate = new Date(2026, 7, 20)
    const html = renderToStaticMarkup(createElement(WeekStrip, {
      selectedDate,
      onSelect: () => undefined,
      loggedDays: new Set(['2026-08-20']),
    }))

    expect(count(html, /class="week-day"/g)).toBe(7)
    expect(html).toContain('aria-pressed="true"')
    expect(html).toContain('aria-current="date"')
    const dayLabel = selectedDate.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })
    expect(html).toContain(`aria-label="${dayLabel}, logged"`)
  })

  it('labels the date dialog, navigation and individual calendar days', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 20, 12, 0, 0))
    const selectedDate = new Date(2026, 7, 20)
    const html = renderToStaticMarkup(createElement(DatePickerModal, {
      selectedDate,
      onSelect: () => undefined,
      onClose: () => undefined,
    }))

    expect(html).toContain('role="dialog"')
    expect(html).toContain('aria-modal="true"')
    expect(html).toContain('aria-label="Choose a date"')
    expect(html).toContain('aria-label="Previous month"')
    expect(html).toContain('aria-label="Next month"')
    const dayLabel = selectedDate.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
    expect(html).toContain(`aria-label="${dayLabel}" aria-pressed="true"`)
  })

  it('keeps the main navigation and log trigger named', () => {
    const html = renderToStaticMarkup(createElement(
      MemoryRouter,
      { initialEntries: ['/'] },
      createElement(BottomNav),
    ))

    expect(html).toContain('<nav class="bottom-nav-wrap" aria-label="Main"')
    expect(html).toContain('aria-label="Log food"')
    expect(html).toContain('aria-expanded="false"')
    expect(html).toContain('aria-haspopup="menu"')
  })

  it('uses a native disabled button contract for primary actions', () => {
    const html = renderToStaticMarkup(createElement(PressableButton, {
      label: 'Save settings',
      disabled: true,
      type: 'submit',
    }))

    expect(html).toMatch(/^<button type="submit" disabled=""/)
    expect(html).toContain('Save settings')
    expect(html).toContain('aria-hidden="true"')
  })
})
