import { eq } from 'drizzle-orm'

import { db } from '@/db/client'
import {
  foods,
  mealEntries,
  onboardingDrafts,
  pointsLedger,
  productEvents,
  profile,
  quests,
  streakFreezes,
  type Food,
  type MealEntry,
  type PointsEntry,
  type Profile,
  type Quest,
  type StreakFreeze,
} from '@/db/schema'
import { FIRST_LOG_EVENT, shouldRecordNamedEvent } from '@/privacy/productEvents'

export async function loadExportSource(): Promise<{
  profile: Profile | null
  foods: Food[]
  meals: MealEntry[]
  points: PointsEntry[]
  quests: Quest[]
  freezes: StreakFreeze[]
}> {
  const [profileRows, foodRows, mealRows, pointRows, questRows, freezeRows] = await Promise.all([
    db.select().from(profile).limit(1),
    db.select().from(foods),
    db.select().from(mealEntries),
    db.select().from(pointsLedger),
    db.select().from(quests),
    db.select().from(streakFreezes),
  ])

  return {
    profile: profileRows[0] ?? null,
    foods: foodRows,
    meals: mealRows,
    points: pointRows,
    quests: questRows,
    freezes: freezeRows,
  }
}

export async function deleteMealEntries(): Promise<void> {
  await db.delete(mealEntries)
}

export async function deletePoints(): Promise<void> {
  await db.delete(pointsLedger)
}

export async function deleteFreezes(): Promise<void> {
  await db.delete(streakFreezes)
}

export async function deleteQuests(): Promise<void> {
  await db.delete(quests)
}

export async function deleteFoods(): Promise<void> {
  await db.delete(foods)
}

export async function deleteProfileRows(): Promise<void> {
  await db.delete(profile)
}

export async function deleteOnboardingDrafts(): Promise<void> {
  await db.delete(onboardingDrafts)
}

export async function deleteProductEvents(): Promise<void> {
  await db.delete(productEvents)
}

export async function loadOnboardingDraftRow(): Promise<{
  payload: string
  quarantined: boolean
} | null> {
  const rows = await db.select().from(onboardingDrafts).limit(1)
  const row = rows[0]
  return row ? { payload: row.payload, quarantined: row.quarantined } : null
}

export async function saveOnboardingDraftRow(input: {
  schemaVersion: number
  step: string
  payload: string
  updatedAt: string
  quarantined: boolean
}): Promise<void> {
  const existing = await db.select().from(onboardingDrafts).limit(1)
  if (existing[0]) {
    await db
      .update(onboardingDrafts)
      .set(input)
      .where(eq(onboardingDrafts.id, existing[0].id))
    return
  }

  await db.insert(onboardingDrafts).values(input)
}

export async function hasFirstLogEvent(): Promise<boolean> {
  const rows = await db.select().from(productEvents)
  return !shouldRecordNamedEvent(
    rows.map((row) => row.name),
    FIRST_LOG_EVENT,
  )
}

export async function recordFirstLogEvent(): Promise<boolean> {
  if (await hasFirstLogEvent()) return false
  await db.insert(productEvents).values({
    name: FIRST_LOG_EVENT,
    recordedAt: new Date().toISOString(),
  })
  return true
}
