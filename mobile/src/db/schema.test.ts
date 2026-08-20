import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import { describe, expect, it } from 'vitest';

/**
 * Applies the generated migrations to a throwaway SQLite database. This is the
 * same SQL expo-sqlite executes on device, so a syntax error or a missing
 * index fails here rather than on a user's first launch.
 */
const MIGRATIONS_DIR = join(process.cwd(), 'drizzle');

function migrationFiles(): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith('.sql'))
    .sort();
}

function applyAll(db: DatabaseSync): void {
  for (const file of migrationFiles()) {
    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf8');

    for (const statement of sql.split('--> statement-breakpoint')) {
      const trimmed = statement.trim();
      if (trimmed) db.exec(trimmed);
    }
  }
}

function names(db: DatabaseSync, type: 'table' | 'index'): string[] {
  return db
    .prepare(`select name from sqlite_master where type = ?`)
    .all(type)
    .map((row) => String(row.name));
}

describe('migrations', () => {
  it('run on a fresh install', () => {
    const db = new DatabaseSync(':memory:');
    expect(() => applyAll(db)).not.toThrow();

    const tables = names(db, 'table');
    for (const table of [
      'profile',
      'foods',
      'meal_entries',
      'points_ledger',
      'streak_freezes',
      'quests',
      'onboarding_drafts',
      'product_events',
    ]) {
      expect(tables).toContain(table);
    }

    db.close();
  });

  it('index meal_entries on local_date and logged_at_utc', () => {
    const db = new DatabaseSync(':memory:');
    applyAll(db);

    const indexes = names(db, 'index');
    expect(indexes).toContain('meal_entries_local_date_idx');
    expect(indexes).toContain('meal_entries_logged_at_utc_idx');

    db.close();
  });

  it('emit at least one migration for drizzle to apply', () => {
    expect(migrationFiles().length).toBeGreaterThan(0);
  });

  it('leave a journal entry per migration so upgrades apply only new files', () => {
    const journal = JSON.parse(
      readFileSync(join(MIGRATIONS_DIR, 'meta', '_journal.json'), 'utf8'),
    ) as { entries: { idx: number; tag: string }[] };

    expect(journal.entries.length).toBe(migrationFiles().length);
  });

  it('accept a meal entry carrying its own local_date', () => {
    const db = new DatabaseSync(':memory:');
    applyAll(db);

    db.prepare(
      `insert into meal_entries
         (servings, kcal, protein_g, carbs_g, fat_g, meal_slot, logged_at_utc, local_date)
       values (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(1, 320, 12, 54, 6, 'breakfast', '2026-07-08T06:30:00Z', '2026-07-07');

    const row = db.prepare(`select local_date, kcal from meal_entries`).get() as {
      local_date: string;
      kcal: number;
    };

    // The stored day is the one passed in, not one re-derived from the UTC
    // timestamp, which would have said 2026-07-08.
    expect(row.local_date).toBe('2026-07-07');
    expect(row.kcal).toBe(320);

    db.close();
  });

  it('reject a meal entry with no local_date', () => {
    const db = new DatabaseSync(':memory:');
    applyAll(db);

    expect(() =>
      db
        .prepare(
          `insert into meal_entries
             (servings, kcal, protein_g, carbs_g, fat_g, meal_slot, logged_at_utc)
           values (?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(1, 320, 12, 54, 6, 'breakfast', '2026-07-08T06:30:00Z'),
    ).toThrow();

    db.close();
  });
});
