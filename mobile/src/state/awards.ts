import {
  applyEnamelLogAwards,
  applyNote,
  applyWaterChange,
  grantFreeFreezeAtStreak,
  stampLocalDate,
} from '@fud-ai/product'
import { withLevel } from './defaults'
import type { FoodEntry, GamificationState } from './types'

function clock() {
  return { uuid: () => crypto.randomUUID(), now: () => new Date().toISOString() }
}

export function stampEntry(entry: FoodEntry): FoodEntry {
  return { ...entry, localDate: entry.localDate ?? stampLocalDate(entry.timestamp) }
}

export function awardLog(gamification: GamificationState, entry: FoodEntry, existing: FoodEntry[]): GamificationState {
  return withLevel(applyEnamelLogAwards(gamification, entry, existing, clock()))
}

export function awardWater(gamification: GamificationState, date: string, glasses: number): GamificationState {
  return withLevel(applyWaterChange(gamification, date, glasses, clock()))
}

export function awardNote(gamification: GamificationState, date: string): GamificationState {
  return withLevel(applyNote(gamification, date, clock()))
}

export function awardFreeze(gamification: GamificationState, streak: number): GamificationState {
  return grantFreeFreezeAtStreak(gamification, streak)
}
