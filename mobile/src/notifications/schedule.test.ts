import { describe, expect, it } from 'vitest'
import { plannedNotifications } from './schedule'
import { freshState } from '@/state/defaults'

describe('notification plan', () => {
  it('stays quiet while tracking is paused', () => {
    const state = freshState()
    state.profile.trackingPaused = true
    expect(plannedNotifications(state, new Date('2026-08-30T20:30:00'))).toEqual([])
  })

  it('never mentions calories in the adapter source', async () => {
    const source = await import('node:fs').then(fs => (
      fs.readFileSync(new URL('./schedule.ts', import.meta.url), 'utf8')
    ))
    expect(source).not.toMatch(/\b(calorie|kcal|weight)\b/i)
  })
})
