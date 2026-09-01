import type { AISettings } from './aiConfig'
import { completeChat } from './aiClient'

export const MASCOT_AI_EVENTS = [
  'ambient',
  'poke',
  'log_success',
  'milestone',
  'form_fumble',
  'ai_fumble',
  'empty_search',
  'comeback',
  'ring_complete',
] as const

export type MascotAIEvent = (typeof MASCOT_AI_EVENTS)[number]
export type MascotPersonality = 'warm' | 'witty' | 'sassy'

export interface MascotAIContext {
  event: MascotAIEvent
  screen: 'today' | 'log' | 'insights' | 'you'
  mood: 'neutral' | 'sleepy' | 'excited' | 'proud' | 'curious' | 'cozy'
  dayPart: 'small_hours' | 'morning' | 'afternoon' | 'evening'
  streakStage: 'new' | 'building' | 'steady' | 'legendary'
  presence: 'nothing_logged' | 'showed_up' | 'day_complete'
  personality: MascotPersonality
  pokeStage?: 'hello' | 'again' | 'relentless'
}

const BANNED = [
  /\b(?:\x62\x61\x64|\x63\x68\x65\x61\x74|\x67\x75\x69\x6c\x74\x79|\x65\x61\x72\x6e\x65\x64|\x6e\x61\x75\x67\x68\x74\x79|\x73\x69\x6e\x66\x75\x6c|\x64\x61\x6d\x61\x67\x65|\x62\x75\x72\x6e\x20\x69\x74\x20\x6f\x66\x66)\b/i,
  /\b(?:calorie|kcal|macro|weight|fat|fatty|skinny|diet|deficit|body|bmi)\b/i,
  /\b(?:overeat|undereat|too much|too little|greedy|lazy)\b/i,
  /\b(?:stupid|idiot|useless|pathetic|failure|loser|shame|disgusting|hopeless)\b/i,
  /\b(?:kill yourself|self[- ]?harm|starve|purge)\b/i,
]

const MAX_LINE_LENGTH = 110
const BATCH_SIZE = 6

/**
 * Runtime output guard for Momo's live model voice.
 *
 * Generated text is discarded, never partially sanitised: rewriting one banned
 * word can leave the judgement around it intact. The model also never receives
 * food names or nutrition fields, so this filter is a second boundary rather
 * than the only one.
 */
export function safeMascotLine(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const line = value
    .trim()
    .replace(/^[-*\s]+/, '')
    .replace(/^["'“”‘’]+|["'“”‘’]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (!line || line.length > MAX_LINE_LENGTH) return null
  if (/\d/.test(line)) return null
  if (/[\r\n<>`]/.test(line)) return null
  if (BANNED.some(pattern => pattern.test(line))) return null
  return line
}

function eventDirection(event: MascotAIEvent): string {
  switch (event) {
    case 'poke':
      return 'React to being tapped. Escalate from amused to mock-offended, but make the tapping the joke.'
    case 'log_success':
      return 'Celebrate that the person showed up and completed an action. Warm, specific to the moment, never about quantity.'
    case 'milestone':
      return 'Give a delighted, proud congratulations for a consistency milestone.'
    case 'form_fumble':
      return 'A form was rejected. Gently roast the tiny interface fumble, then make retrying feel easy. Never insult ability.'
    case 'ai_fumble':
      return 'The AI request failed. Make fun of the technology or yourself, never the person, then encourage another try.'
    case 'empty_search':
      return 'A saved-item search had no result. Tease the empty search result, not what was searched for.'
    case 'comeback':
      return 'Welcome the person back without guilt, debt, pressure, or mentioning how long they were away.'
    case 'ring_complete':
      return 'Celebrate that today\'s logging routine is complete, without referring to food amounts or numbers.'
    case 'ambient':
      return 'Make a short observational aside that suits the current screen and mood. Do not nag.'
  }
}

/** Prompt inputs are deliberately categorical. There is no place to pass food,
 * calories, macros, targets, weight, free text, or provider error details. */
export function buildMascotPrompt(context: MascotAIContext, recent: readonly string[] = []): string {
  const sass = context.personality === 'warm'
    ? 'Kind and gently playful; almost no roasting.'
    : context.personality === 'witty'
      ? 'Dry, clever and affectionate; a light roast is welcome when the event is a harmless fumble.'
      : 'Bold, mischievous and cheeky; roast harmless app fumbles, but remain unmistakably on the person\'s side.'

  return [
    'You are Momo, Fud AI\'s tiny animated dumpling companion.',
    'Write as a perceptive friend, not a coach, clinician, parent or productivity app.',
    sass,
    eventDirection(context.event),
    'Hard boundaries: never discuss food, eating, nutrition, calories, macros, weight, bodies, dieting, exercise totals or appearance.',
    'Never shame, diagnose, moralise, command, threaten, compare people, or imply the person owes progress.',
    'You may tease only a harmless interaction or the software. Never insult the person, their ability, or their character.',
    'Each line must be one sentence, under one hundred characters, with no digits, emoji, hashtags, quotation marks or exclamation spam.',
    `Context: event=${context.event}; screen=${context.screen}; mood=${context.mood}; day_part=${context.dayPart}; streak_stage=${context.streakStage}; presence=${context.presence}; poke_stage=${context.pokeStage ?? 'none'}.`,
    recent.length > 0 ? `Do not repeat these recent lines: ${JSON.stringify(recent.slice(0, 8))}` : '',
    `Return only a JSON array of exactly ${BATCH_SIZE} different strings. No markdown and no object wrapper.`,
  ].filter(Boolean).join('\n')
}

function parseLines(raw: string): string[] {
  const start = raw.indexOf('[')
  const end = raw.lastIndexOf(']')
  if (start < 0 || end <= start) return []
  try {
    const parsed: unknown = JSON.parse(raw.slice(start, end + 1))
    if (!Array.isArray(parsed)) return []
    return [...new Set(parsed.map(safeMascotLine).filter((line): line is string => Boolean(line)))]
  } catch {
    return []
  }
}

export async function generateMascotLines(
  settings: AISettings,
  context: MascotAIContext,
  recent: readonly string[] = [],
  signal?: AbortSignal,
): Promise<string[]> {
  const raw = await completeChat(
    settings,
    [
      {
        role: 'system',
        content: 'Follow the character and safety contract exactly. Output valid JSON only.',
      },
      { role: 'user', content: buildMascotPrompt(context, recent) },
    ],
    240,
    1.05,
    { signal, timeoutMs: 12_000 },
  )
  return parseLines(raw)
}

export function mascotDayPart(hour: number): MascotAIContext['dayPart'] {
  if (hour < 5) return 'small_hours'
  if (hour < 12) return 'morning'
  if (hour < 18) return 'afternoon'
  return 'evening'
}

export function mascotStreakStage(streak: number): MascotAIContext['streakStage'] {
  if (streak >= 30) return 'legendary'
  if (streak >= 7) return 'steady'
  if (streak >= 2) return 'building'
  return 'new'
}
