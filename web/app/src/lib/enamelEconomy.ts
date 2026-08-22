/**
 * Web-local enamel kitchen economy.
 *
 * Guardrail: XP and gems attach to the act of logging, never intake numbers.
 * This file must not read calories, macros, or targets.
 */

import type {
  EnamelQuestKey,
  EnamelQuestProgress,
  EnamelQuestState,
  FoodEntry,
  GamificationState,
  GemEvent,
  XpEvent,
} from '../types'
import { localDayKey } from './dates'
import { levelFromXp } from './xp'

export const ENAMEL_XP = {
  PHOTO: 15,
  MANUAL: 10,
  FIRST_OF_DAY: 5,
  THREE_MAINS: 20,
  WATER: 2,
  NOTE: 5,
} as const

export const ENAMEL_CAPS = {
  WATER: 8,
  NOTES: 3,
  FREEZES: 2,
} as const

export const ENAMEL_COSTS = {
  FREEZE: 100,
  REPAIR: 200,
} as const

export const DAILY_XP_GOAL = 80
export const REPAIR_WINDOW_DAYS = 2
export const FREE_FREEZE_STREAK = 7

export type LogMethod = 'manual' | 'photo' | 'repeat' | 'other'

const MAIN_SLOTS = ['breakfast', 'lunch', 'dinner'] as const

export const COSMETICS = [
  { id: 'chef-hat', name: 'Chef hat', price: 80, unlockStreak: 0 },
  { id: 'apron', name: 'Apron', price: 120, unlockStreak: 0 },
  { id: 'scarf', name: 'Scarf', price: 60, unlockStreak: 0 },
  { id: 'bow', name: 'Bow', price: 40, unlockStreak: 0 },
  { id: 'specs', name: 'Specs', price: 100, unlockStreak: 7 },
  { id: 'medal', name: 'Logging medal', price: 160, unlockStreak: 14 },
] as const

export type CosmeticId = (typeof COSMETICS)[number]['id']

const DAILY_CATALOG: Array<Omit<EnamelQuestProgress, 'progress' | 'completedAt' | 'claimedAt'>> = [
  { key: 'breakfast', period: 'daily', label: 'Log breakfast', target: 1, xpReward: 10, gemReward: 5 },
  { key: 'photo_log', period: 'daily', label: 'Log a photo', target: 1, xpReward: 15, gemReward: 5 },
  { key: 'three_mains', period: 'daily', label: 'Log breakfast, lunch, and dinner', target: 3, xpReward: 20, gemReward: 8 },
  { key: 'water', period: 'daily', label: 'Fill eight glasses', target: 8, xpReward: 10, gemReward: 5 },
  { key: 'note', period: 'daily', label: 'Add a kitchen note', target: 1, xpReward: 5, gemReward: 3 },
  { key: 'new_food', period: 'daily', label: 'Log a new food', target: 1, xpReward: 10, gemReward: 5 },
  { key: 'homemade', period: 'daily', label: 'Log a homemade meal', target: 1, xpReward: 10, gemReward: 5 },
  { key: 'log_within_30m', period: 'daily', label: 'Log within 30 minutes of opening', target: 1, xpReward: 10, gemReward: 5 },
]

const WEEKLY_CATALOG: Array<Omit<EnamelQuestProgress, 'progress' | 'completedAt' | 'claimedAt'>> = [
  { key: 'week_log_days', period: 'weekly', label: 'Log on five days this week', target: 5, xpReward: 40, gemReward: 20 },
  { key: 'week_log_meals', period: 'weekly', label: 'Log twelve meals this week', target: 12, xpReward: 40, gemReward: 20 },
  { key: 'week_photos', period: 'weekly', label: 'Log three photos this week', target: 3, xpReward: 35, gemReward: 18 },
]

export const ENAMEL_QUEST_KEYS = [
  ...DAILY_CATALOG.map(q => q.key),
  ...WEEKLY_CATALOG.map(q => q.key),
] as const

function hashSeed(value: string): number {
  let n = 0
  for (let i = 0; i < value.length; i++) n = (n * 31 + value.charCodeAt(i)) >>> 0
  return n
}

function pickDaily(date: string): Array<typeof DAILY_CATALOG[number]> {
  const seed = hashSeed(`enamel-daily-${date}`)
  const pool = [...DAILY_CATALOG]
  const picked: Array<typeof DAILY_CATALOG[number]> = []
  for (let i = 0; i < 3 && pool.length > 0; i++) {
    const index = (seed + i * 17) % pool.length
    picked.push(pool.splice(index, 1)[0]!)
  }
  return picked
}

function pickWeekly(weekStart: string): typeof WEEKLY_CATALOG[number] {
  return WEEKLY_CATALOG[hashSeed(`enamel-weekly-${weekStart}`) % WEEKLY_CATALOG.length]!
}

export function weekStartOf(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  const utc = new Date(Date.UTC(y, m - 1, d))
  const weekday = utc.getUTCDay()
  const delta = weekday === 0 ? -6 : 1 - weekday
  utc.setUTCDate(utc.getUTCDate() + delta)
  return utc.toISOString().slice(0, 10)
}

export function civilDaysBetween(from: string, to: string): number {
  const [fy, fm, fd] = from.split('-').map(Number)
  const [ty, tm, td] = to.split('-').map(Number)
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86_400_000)
}

export function addCivilDays(date: string, n: number): string {
  const [y, m, d] = date.split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1, d + n))
  return t.toISOString().slice(0, 10)
}

export function methodOf(entry: Pick<FoodEntry, 'source'>): LogMethod {
  if (entry.source === 'snapFood') return 'photo'
  if (entry.source === 'recent' || entry.source === 'quickAdd') return 'repeat'
  if (entry.source === 'manual' || entry.source === 'textInput') return 'manual'
  return 'other'
}

export function ticketNumber(entries: FoodEntry[]): number {
  return new Set(entries.map(entry => localDayKey(entry.timestamp))).size
}

export function dailyXpTowardGoal(gamification: GamificationState, date: string): number {
  return gamification.xpEvents
    .filter(event => localDayKey(event.timestamp) === date)
    .reduce((sum, event) => sum + event.xp, 0)
}

function pushXp(
  events: XpEvent[],
  awarded: Set<string>,
  key: string,
  xp: number,
  label: string,
  timestamp: string,
): number {
  if (awarded.has(key) || xp <= 0) return 0
  awarded.add(key)
  events.unshift({
    id: crypto.randomUUID(),
    key,
    xp,
    label,
    timestamp,
  })
  return xp
}

function pushGem(gamification: GamificationState, amount: number, reason: string, refId?: string): GamificationState {
  if (amount === 0) return gamification
  const event: GemEvent = {
    id: crypto.randomUUID(),
    amount,
    reason,
    timestamp: new Date().toISOString(),
    ...(refId ? { refId } : {}),
  }
  return {
    ...gamification,
    gems: Math.max(0, gamification.gems + amount),
    gemEvents: [event, ...gamification.gemEvents].slice(0, 80),
  }
}

export function applyEnamelLogAwards(
  gamification: GamificationState,
  entry: FoodEntry,
  existing: FoodEntry[],
  options: { sessionOpenedAt?: number } = {},
): GamificationState {
  const date = localDayKey(entry.timestamp)
  const timestamp = new Date().toISOString()
  const awarded = new Set(gamification.awardedKeys)
  const events = [...gamification.xpEvents]
  let xp = 0
  const method = methodOf(entry)

  if (method === 'photo') {
    xp += pushXp(events, awarded, `enamel-photo-${entry.id}`, ENAMEL_XP.PHOTO, 'Photo log', timestamp)
  } else if (method === 'manual') {
    xp += pushXp(events, awarded, `enamel-manual-${entry.id}`, ENAMEL_XP.MANUAL, 'Logged a meal', timestamp)
  }

  const sameDayBefore = existing.filter(item => localDayKey(item.timestamp) === date)
  if (sameDayBefore.length === 0) {
    xp += pushXp(events, awarded, `enamel-first-${date}`, ENAMEL_XP.FIRST_OF_DAY, 'First log of the day', timestamp)
  }

  const slots = new Set([...sameDayBefore, entry].map(item => item.mealType))
  if (MAIN_SLOTS.every(slot => slots.has(slot))) {
    xp += pushXp(events, awarded, `enamel-mains-${date}`, ENAMEL_XP.THREE_MAINS, 'Three mains logged', timestamp)
  }

  let next = {
    ...gamification,
    xp: gamification.xp + xp,
    xpEvents: events.slice(0, 50),
    awardedKeys: [...awarded],
  }
  next.level = levelFromXp(next.xp)

  const dayXp = dailyXpTowardGoal(next, date)
  if (dayXp >= DAILY_XP_GOAL && !awarded.has(`enamel-chest-${date}`)) {
    awarded.add(`enamel-chest-${date}`)
    next = pushGem({ ...next, awardedKeys: [...awarded] }, 5, 'daily_chest', date)
  }

  return next
}

export function applyWaterChange(
  gamification: GamificationState,
  date: string,
  glasses: number,
): GamificationState {
  const nextCount = Math.max(0, Math.min(ENAMEL_CAPS.WATER, Math.round(glasses)))
  const prev = Math.max(0, Math.min(ENAMEL_CAPS.WATER, gamification.waterByDate[date] ?? 0))
  const awarded = new Set(gamification.awardedKeys)
  const events = [...gamification.xpEvents]
  const timestamp = new Date().toISOString()
  let xp = 0

  if (nextCount > prev) {
    for (let i = prev + 1; i <= nextCount; i++) {
      xp += pushXp(events, awarded, `enamel-water-${date}-${i}`, ENAMEL_XP.WATER, 'Water logged', timestamp)
    }
  }

  return {
    ...gamification,
    waterByDate: { ...gamification.waterByDate, [date]: nextCount },
    xp: gamification.xp + xp,
    level: levelFromXp(gamification.xp + xp),
    xpEvents: events.slice(0, 50),
    awardedKeys: [...awarded],
  }
}

export function applyNote(
  gamification: GamificationState,
  date: string,
): GamificationState {
  const prev = gamification.notesByDate[date] ?? 0
  if (prev >= ENAMEL_CAPS.NOTES) return gamification
  const nextCount = prev + 1
  const awarded = new Set(gamification.awardedKeys)
  const events = [...gamification.xpEvents]
  const timestamp = new Date().toISOString()
  const xp = pushXp(events, awarded, `enamel-note-${date}-${nextCount}`, ENAMEL_XP.NOTE, 'Kitchen note', timestamp)
  return {
    ...gamification,
    notesByDate: { ...gamification.notesByDate, [date]: nextCount },
    xp: gamification.xp + xp,
    level: levelFromXp(gamification.xp + xp),
    xpEvents: events.slice(0, 50),
    awardedKeys: [...awarded],
  }
}

export function grantFreeFreezeAtStreak(
  gamification: GamificationState,
  streak: number,
): GamificationState {
  if (streak < FREE_FREEZE_STREAK) return gamification
  if (gamification.awardedKeys.includes('enamel-free-freeze-7')) return gamification
  return {
    ...gamification,
    streakFreezes: Math.min(ENAMEL_CAPS.FREEZES, gamification.streakFreezes + 1),
    awardedKeys: [...gamification.awardedKeys, 'enamel-free-freeze-7'],
  }
}

export function buyFreeze(gamification: GamificationState): GamificationState | null {
  if (gamification.gems < ENAMEL_COSTS.FREEZE) return null
  if (gamification.streakFreezes >= ENAMEL_CAPS.FREEZES) return null
  return pushGem(
    { ...gamification, streakFreezes: gamification.streakFreezes + 1 },
    -ENAMEL_COSTS.FREEZE,
    'buy_freeze',
  )
}

export function canRepairStreak(
  gamification: GamificationState,
  lastLoggedDate: string | null,
  today: string,
): boolean {
  const month = today.slice(0, 7)
  if (gamification.repairsUsedMonth === month) return false
  if (gamification.brokenOn) {
    const since = civilDaysBetween(gamification.brokenOn, today)
    return since >= 0 && since <= REPAIR_WINDOW_DAYS && gamification.brokenFrom > 0
  }
  if (!lastLoggedDate) return false
  const gap = civilDaysBetween(lastLoggedDate, today)
  return gap >= 2 && gap <= REPAIR_WINDOW_DAYS + 1
}

export function repairStreak(
  gamification: GamificationState,
  lastLoggedDate: string | null,
  today: string,
): GamificationState | null {
  if (!canRepairStreak(gamification, lastLoggedDate, today)) return null
  if (gamification.gems < ENAMEL_COSTS.REPAIR) return null
  const start = lastLoggedDate ?? addCivilDays(today, -REPAIR_WINDOW_DAYS)
  const missed: string[] = []
  const gap = civilDaysBetween(start, today)
  for (let i = 1; i < gap; i++) missed.push(addCivilDays(start, i))
  return pushGem({
    ...gamification,
    freezeUsedDates: [...new Set([...gamification.freezeUsedDates, ...missed])],
    repairsUsedMonth: today.slice(0, 7),
    brokenOn: null,
    brokenFrom: 0,
  }, -ENAMEL_COSTS.REPAIR, 'repair_streak')
}

export function markBrokenIfNeeded(
  gamification: GamificationState,
  previousStreak: number,
  nextStreak: number,
  today: string,
): GamificationState {
  if (nextStreak === 0 && previousStreak > 0 && !gamification.brokenOn) {
    return { ...gamification, brokenOn: today, brokenFrom: previousStreak }
  }
  if (nextStreak > 0) {
    return { ...gamification, brokenOn: null, brokenFrom: 0 }
  }
  return gamification
}

export function buyCosmetic(
  gamification: GamificationState,
  id: string,
  streak: number,
): GamificationState | null {
  const item = COSMETICS.find(cosmetic => cosmetic.id === id)
  if (!item) return null
  if (gamification.ownedCosmeticIds.includes(id)) return gamification
  if (streak < item.unlockStreak) return null
  if (gamification.gems < item.price) return null
  return pushGem({
    ...gamification,
    ownedCosmeticIds: [...gamification.ownedCosmeticIds, id],
    equippedCosmeticId: id,
  }, -item.price, `buy_${id}`)
}

function emptyProgress(spec: Omit<EnamelQuestProgress, 'progress' | 'completedAt' | 'claimedAt'>): EnamelQuestProgress {
  return { ...spec, progress: 0, completedAt: null, claimedAt: null }
}

export function rollEnamelQuests(date: string, existing?: EnamelQuestState): EnamelQuestState {
  const weekStart = weekStartOf(date)
  const daily = existing?.date === date
    ? existing.daily
    : pickDaily(date).map(emptyProgress)
  const weekly = existing?.weekStart === weekStart
    ? existing.weekly
    : emptyProgress(pickWeekly(weekStart))
  return { date, weekStart, daily, weekly }
}

export interface QuestInput {
  entries: FoodEntry[]
  water: number
  notes: number
  sessionOpenedAt?: number
  now?: number
}

function progressFor(key: EnamelQuestKey, date: string, weekStart: string, input: QuestInput): number {
  const todayEntries = input.entries.filter(entry => localDayKey(entry.timestamp) === date)
  const weekEntries = input.entries.filter((entry) => {
    const day = localDayKey(entry.timestamp)
    return day >= weekStart && day <= addCivilDays(weekStart, 6)
  })
  const recentNames = new Set(
    input.entries
      .filter(entry => localDayKey(entry.timestamp) !== date)
      .filter(entry => Date.now() - new Date(entry.timestamp).getTime() < 14 * 86400_000)
      .map(entry => entry.name.toLowerCase().trim()),
  )

  switch (key) {
    case 'breakfast':
      return todayEntries.some(entry => entry.mealType === 'breakfast') ? 1 : 0
    case 'photo_log':
      return todayEntries.some(entry => entry.source === 'snapFood') ? 1 : 0
    case 'three_mains':
      return MAIN_SLOTS.filter(slot => todayEntries.some(entry => entry.mealType === slot)).length
    case 'water':
      return Math.min(ENAMEL_CAPS.WATER, input.water)
    case 'note':
      return input.notes > 0 ? 1 : 0
    case 'new_food':
      return todayEntries.some(entry => !recentNames.has(entry.name.toLowerCase().trim())) ? 1 : 0
    case 'homemade':
      return todayEntries.some(entry => entry.source === 'manual') ? 1 : 0
    case 'log_within_30m': {
      if (!input.sessionOpenedAt || todayEntries.length === 0) return 0
      const first = Math.min(...todayEntries.map(entry => new Date(entry.timestamp).getTime()))
      return first - input.sessionOpenedAt <= 30 * 60_000 ? 1 : 0
    }
    case 'week_log_days':
      return new Set(weekEntries.map(entry => localDayKey(entry.timestamp))).size
    case 'week_log_meals':
      return weekEntries.length
    case 'week_photos':
      return weekEntries.filter(entry => entry.source === 'snapFood').length
    default:
      return 0
  }
}

export function syncEnamelQuests(
  gamification: GamificationState,
  date: string,
  input: QuestInput,
  commitCompletion: boolean,
): EnamelQuestState {
  const rolled = rollEnamelQuests(date, gamification.enamelQuests)
  const apply = (quest: EnamelQuestProgress): EnamelQuestProgress => {
    const progress = progressFor(quest.key, rolled.date, rolled.weekStart, input)
    const complete = progress >= quest.target
    return {
      ...quest,
      progress,
      completedAt: quest.completedAt ?? (complete && commitCompletion ? new Date().toISOString() : null),
    }
  }
  return {
    ...rolled,
    daily: rolled.daily.map(apply),
    weekly: apply(rolled.weekly),
  }
}

export function claimEnamelQuest(
  gamification: GamificationState,
  key: EnamelQuestKey,
): GamificationState | null {
  const quests = gamification.enamelQuests
  if (!quests) return null
  const all = [...quests.daily, quests.weekly]
  const quest = all.find(item => item.key === key)
  if (!quest || !quest.completedAt || quest.claimedAt) return null
  const claimKey = `enamel-quest-${quest.period}-${quests.date}-${key}`
  if (gamification.awardedKeys.includes(claimKey)) return null

  const timestamp = new Date().toISOString()
  const events = [...gamification.xpEvents]
  const awarded = new Set(gamification.awardedKeys)
  const xp = pushXp(events, awarded, claimKey, quest.xpReward, quest.label, timestamp)
  let next: GamificationState = {
    ...gamification,
    xp: gamification.xp + xp,
    level: levelFromXp(gamification.xp + xp),
    xpEvents: events.slice(0, 50),
    awardedKeys: [...awarded],
    enamelQuests: {
      ...quests,
      daily: quests.daily.map(item => item.key === key ? { ...item, claimedAt: timestamp } : item),
      weekly: quests.weekly.key === key ? { ...quests.weekly, claimedAt: timestamp } : quests.weekly,
    },
  }
  if (quest.gemReward > 0) next = pushGem(next, quest.gemReward, `quest_${key}`, key)
  return next
}

export const SUBTRACTIVE_QUEST_PATTERN = /\b(under|limit|avoid|less than|no more than|restrict|cut|fast|protein[- ]hit|stay under)\b/i
