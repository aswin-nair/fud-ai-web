import { describe, expect, it, vi } from 'vitest'

import { defaultAISettings } from './aiConfig'
import {
  buildMascotPrompt,
  generateMascotLines,
  mascotDayPart,
  mascotStreakStage,
  safeMascotLine,
  type MascotAIContext,
} from './mascotAI'

vi.mock('./aiClient', () => ({
  completeChat: vi.fn().mockResolvedValue('["Tiny fumble. Dramatic recovery pending.","The button wins this round.","A brave attempt met a very picky form."]'),
}))

const context: MascotAIContext = {
  event: 'form_fumble',
  screen: 'log',
  mood: 'curious',
  dayPart: 'afternoon',
  streakStage: 'building',
  presence: 'showed_up',
  personality: 'sassy',
}

describe('mascot AI safety', () => {
  it('accepts playful lines and rejects judgement, nutrition, markup and digits', () => {
    expect(safeMascotLine('  “The button wins this round.”  ')).toBe('The button wins this round.')
    expect(safeMascotLine('That was a bad meal.')).toBeNull()
    expect(safeMascotLine('Only 2 calories left.')).toBeNull()
    expect(safeMascotLine('Those macros look tidy.')).toBeNull()
    expect(safeMascotLine('You should eat now.')).toBeNull()
    expect(safeMascotLine('Work it off later.')).toBeNull()
    expect(safeMascotLine('Your body approves.')).toBeNull()
    expect(safeMascotLine('<b>Try again</b>')).toBeNull()
    expect(safeMascotLine('You are stupid.')).toBeNull()
  })

  it('builds from categorical interaction context, not health or free-text data', () => {
    const prompt = buildMascotPrompt(context, ['Already said.'])
    expect(prompt).toContain('event=form_fumble')
    expect(prompt).toContain('Already said.')
    expect(prompt).not.toMatch(/food_name|target=|weight=|calories=|user_message|error_detail/i)
  })

  it('parses and filters a live model batch', async () => {
    const lines = await generateMascotLines({ ...defaultAISettings(), apiKey: 'test' }, context)
    expect(lines).toEqual([
      'Tiny fumble. Dramatic recovery pending.',
      'The button wins this round.',
      'A brave attempt met a very picky form.',
    ])
  })

  it('maps raw time and streak numbers to non-sensitive labels', () => {
    expect(mascotDayPart(2)).toBe('small_hours')
    expect(mascotDayPart(14)).toBe('afternoon')
    expect(mascotStreakStage(1)).toBe('new')
    expect(mascotStreakStage(40)).toBe('legendary')
  })
})
