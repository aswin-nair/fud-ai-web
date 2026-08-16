import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import * as schema from '@/db/schema';

export const DATABASE_NAME = 'calorie-tracker.db';

/**
 * Opened synchronously at module load so the migrator and every query share
 * one connection. `enableChangeListener` powers drizzle's live queries, which
 * is what lets Home update the ring without a manual refetch after a write.
 */
export const sqlite = openDatabaseSync(DATABASE_NAME, { enableChangeListener: true });

export const db = drizzle(sqlite, { schema });

export type Database = typeof db;
