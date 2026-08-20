import { sql } from 'drizzle-orm';
import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * Local-first schema. Streak and points are never stored as mutable counters —
 * they are derived from these tables by the pure functions in src/logic, so the
 * same code can run server-side unchanged if a backend is ever added.
 */

export const profile = sqliteTable('profile', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  dateOfBirth: text('date_of_birth').notNull(), // 'YYYY-MM-DD'
  sex: text('sex', { enum: ['female', 'male'] }).notNull(),
  heightCm: real('height_cm').notNull(),
  weightKg: real('weight_kg').notNull(),
  activityLevel: text('activity_level', {
    enum: ['sedentary', 'light', 'moderate', 'active', 'veryActive'],
  }).notNull(),
  goal: text('goal', { enum: ['lose', 'maintain', 'gain'] }).notNull(),
  weeklyRatePct: real('weekly_rate_pct').notNull(),
  timezone: text('timezone').notNull(),
  dailyKcalTarget: integer('daily_kcal_target').notNull(),
  proteinGTarget: integer('protein_g_target').notNull(),
  carbsGTarget: integer('carbs_g_target').notNull(),
  fatGTarget: integer('fat_g_target').notNull(),
  soundEnabled: integer('sound_enabled', { mode: 'boolean' }).notNull().default(true),
  hapticsEnabled: integer('haptics_enabled', { mode: 'boolean' }).notNull().default(true),
  trackingPaused: integer('tracking_paused', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const foods = sqliteTable('foods', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  brand: text('brand'),
  servingLabel: text('serving_label').notNull(),
  servingGrams: real('serving_grams'),
  kcal: real('kcal').notNull(),
  proteinG: real('protein_g').notNull(),
  carbsG: real('carbs_g').notNull(),
  fatG: real('fat_g').notNull(),
  source: text('source', { enum: ['custom', 'builtin'] }).notNull(),
  isFavorite: integer('is_favorite', { mode: 'boolean' }).notNull().default(false),
  lastUsedAt: text('last_used_at'),
});

export const mealEntries = sqliteTable(
  'meal_entries',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    foodId: integer('food_id').references(() => foods.id, { onDelete: 'set null' }),
    customName: text('custom_name'),
    servings: real('servings').notNull(),
    kcal: real('kcal').notNull(),
    proteinG: real('protein_g').notNull(),
    carbsG: real('carbs_g').notNull(),
    fatG: real('fat_g').notNull(),
    mealSlot: text('meal_slot', {
      enum: ['breakfast', 'lunch', 'dinner', 'snack'],
    }).notNull(),
    loggedAtUtc: text('logged_at_utc').notNull(),
    /**
     * Written at insert time in the profile's timezone, never recomputed on
     * read. This is what keeps a streak intact when the user travels.
     */
    localDate: text('local_date').notNull(),
  },
  (table) => [
    index('meal_entries_local_date_idx').on(table.localDate),
    index('meal_entries_logged_at_utc_idx').on(table.loggedAtUtc),
  ],
);

/** Append-only. Rows are never updated or deleted, so the total is auditable. */
export const pointsLedger = sqliteTable('points_ledger', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  delta: integer('delta').notNull(),
  reason: text('reason').notNull(),
  localDate: text('local_date').notNull(),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const streakFreezes = sqliteTable('streak_freezes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  grantedLocalDate: text('granted_local_date').notNull(),
  consumedLocalDate: text('consumed_local_date'),
});

export const quests = sqliteTable('quests', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  localDate: text('local_date').notNull(),
  type: text('type').notNull(),
  target: integer('target').notNull(),
  progress: integer('progress').notNull().default(0),
  completedAt: text('completed_at'),
});

/** Schema-versioned onboarding progress. Cleared after the first accepted log. */
export const onboardingDrafts = sqliteTable('onboarding_drafts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  schemaVersion: integer('schema_version').notNull(),
  step: text('step').notNull(),
  payload: text('payload').notNull(),
  updatedAt: text('updated_at').notNull(),
  quarantined: integer('quarantined', { mode: 'boolean' }).notNull().default(false),
});

/**
 * Device-local product events. Payloads stay out of this table; the name
 * alone is enough for once-only markers such as first_log.
 */
export const productEvents = sqliteTable('product_events', {
  name: text('name').primaryKey(),
  recordedAt: text('recorded_at').notNull(),
});

/**
 * Ordered entity mutations. Tokens never belong in this table — only the
 * secret-free contract envelope and retry metadata.
 */
export const syncOutbox = sqliteTable(
  'sync_outbox',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    mutationId: text('mutation_id').notNull().unique(),
    userId: text('user_id').notNull(),
    deviceId: text('device_id').notNull(),
    kind: text('kind', { enum: ['upsert', 'delete'] }).notNull(),
    entityJson: text('entity_json').notNull(),
    baseCursor: integer('base_cursor').notNull().default(0),
    queuedAt: text('queued_at').notNull(),
    attemptCount: integer('attempt_count').notNull().default(0),
    nextAttemptAt: text('next_attempt_at').notNull(),
    lastError: text('last_error'),
    ackedCursor: integer('acked_cursor'),
    status: text('status', {
      enum: ['pending', 'inflight', 'acked', 'conflict', 'auth_failed'],
    }).notNull(),
  },
  (table) => [index('sync_outbox_user_queued_idx').on(table.userId, table.queuedAt)],
);

export const syncState = sqliteTable('sync_state', {
  userId: text('user_id').primaryKey(),
  deviceId: text('device_id').notNull(),
  cursor: integer('cursor').notNull().default(0),
  lastAckAt: text('last_ack_at'),
  lastError: text('last_error'),
});

export type Profile = typeof profile.$inferSelect;
export type NewProfile = typeof profile.$inferInsert;
export type Food = typeof foods.$inferSelect;
export type NewFood = typeof foods.$inferInsert;
export type MealEntry = typeof mealEntries.$inferSelect;
export type NewMealEntry = typeof mealEntries.$inferInsert;
export type PointsEntry = typeof pointsLedger.$inferSelect;
export type StreakFreeze = typeof streakFreezes.$inferSelect;
export type Quest = typeof quests.$inferSelect;
export type OnboardingDraftRow = typeof onboardingDrafts.$inferSelect;
export type ProductEvent = typeof productEvents.$inferSelect;
export type SyncOutboxRow = typeof syncOutbox.$inferSelect;
export type SyncStateRow = typeof syncState.$inferSelect;

export type Sex = Profile['sex'];
export type ActivityLevel = Profile['activityLevel'];
export type Goal = Profile['goal'];
export type MealSlot = MealEntry['mealSlot'];
