import { describe, expect, it, vi } from 'vitest'

import { defaultAISettings } from './aiConfig'
import { completeChat } from './aiClient'
import {
  allLocalMascotLines,
  buildMascotPrompt,
  generateMascotLines,
  localMascotLine,
  localMascotLines,
  mascotAIContextKey,
  mascotDayPart,
  mascotStreakStage,
  safeMascotLine,
  selectMascotLines,
  MASCOT_AI_EVENTS,
  type MascotAIContext,
} from './mascotAI'

vi.mock('./aiClient', () => ({
  completeChat: vi.fn().mockResolvedValue('["Tiny fumble. Dramatic recovery pending.","The button wins this round.","A brave attempt met a very picky form."]'),
}))

const mockedCompleteChat = vi.mocked(completeChat)

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
    expect(lines).toHaveLength(6)
    expect(lines.slice(0, 3)).toEqual([
      'Tiny fumble. Dramatic recovery pending.',
      'The button wins this round.',
      'A brave attempt met a very picky form.',
    ])
  })

  it('falls back to reviewed local dialogue when the provider fails', async () => {
    mockedCompleteChat.mockRejectedValueOnce(new Error('provider detail that must not become dialogue'))

    const lines = await generateMascotLines({ ...defaultAISettings(), apiKey: 'test' }, context)

    expect(lines).toEqual(localMascotLines(context))
    expect(lines.join(' ')).not.toContain('provider detail')
  })

  it('does not turn an aborted request into delayed speech', async () => {
    const controller = new AbortController()
    controller.abort()
    mockedCompleteChat.mockRejectedValueOnce(new DOMException('Aborted', 'AbortError'))

    await expect(generateMascotLines(
      { ...defaultAISettings(), apiKey: 'test' },
      context,
      [],
      controller.signal,
    )).rejects.toMatchObject({ name: 'AbortError' })
  })

  it('maps raw time and streak numbers to non-sensitive labels', () => {
    expect(mascotDayPart(2)).toBe('small_hours')
    expect(mascotDayPart(14)).toBe('afternoon')
    expect(mascotStreakStage(1)).toBe('new')
    expect(mascotStreakStage(40)).toBe('legendary')
  })
})

describe('reviewed context-aware dialogue', () => {
  it('keeps the complete offline corpus inside the runtime safety contract', () => {
    const lines = allLocalMascotLines()

    expect(lines.length).toBeGreaterThanOrEqual(100)
    expect(new Set(lines).size).toBe(lines.length)
    for (const line of lines) expect(safeMascotLine(line), line).toBe(line)
  })

  it('provides a deep, unique batch for every event', () => {
    for (const event of MASCOT_AI_EVENTS) {
      const lines = localMascotLines({ ...context, event })

      expect(lines, event).toHaveLength(6)
      expect(new Set(lines).size, event).toBe(lines.length)
    }
  })

  it('uses categorical milestone, return, screen and poke context', () => {
    const building = localMascotLines({ ...context, event: 'milestone', streakStage: 'building' }, [], 20)
    const legendary = localMascotLines({ ...context, event: 'milestone', streakStage: 'legendary' }, [], 20)
    const returning = localMascotLines({ ...context, event: 'comeback', dayPart: 'small_hours' }, [], 20)
    const ambient = localMascotLines({ ...context, event: 'ambient', screen: 'insights' }, [], 30)
    const poked = localMascotLines({ ...context, event: 'poke', pokeStage: 'relentless' }, [], 20)

    expect(building).toContain('The streak is finding its stride. I am pretending to be calm.')
    expect(legendary).toContain('The streak has become office folklore.')
    expect(returning).toContain('Quiet hours. I will keep the commentary soft.')
    expect(ambient).toContain('The charts and I are having a quiet intellectual moment.')
    expect(poked).toContain('The tapping campaign continues. My lawyers are imaginary.')
  })

  it('is deterministic, while an explicit session seed can rotate the wording', () => {
    expect(localMascotLines(context, [], 6, 4)).toEqual(localMascotLines(context, [], 6, 4))
    expect(localMascotLine(context, [], 4)).not.toBe(localMascotLine(context, [], 5))
    expect(mascotAIContextKey(context)).toBe(mascotAIContextKey({ ...context }))
  })

  it('never immediately repeats, even after the context pool is exhausted', () => {
    const pool = localMascotLines(context, [], 100)
    const first = pool[0]!
    const exhausted = [first, ...pool.filter(line => line !== first)]

    expect(localMascotLine(context, exhausted)).not.toBe(first)
  })

  it('filters model echoes and unsafe suggestions before filling the batch locally', () => {
    const recent = ['Already said.']
    const lines = selectMascotLines([
      'Already said.',
      'Only 2 calories left.',
      'The button wins this round.',
      'The button wins this round.',
    ], context, recent)

    expect(lines).toHaveLength(6)
    expect(lines[0]).toBe('The button wins this round.')
    expect(lines).not.toContain('Already said.')
    expect(lines).not.toContain('Only 2 calories left.')
    expect(new Set(lines).size).toBe(lines.length)
  })
})
