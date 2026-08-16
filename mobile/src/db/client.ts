import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import * as schema from '@/db/schema';

export const DATABASE_NAME = 'calorie-tracker.db';

/**
 * Native uses the synchronous SQLite API, which is what drizzle's expo-sqlite
 * driver is built on. Web cannot — see client.web.ts, which Metro substitutes
 * automatically for that platform.
 */
export const sqlite = openDatabaseSync(DATABASE_NAME);

export const db = drizzle(sqlite, { schema });

export type Database = typeof db;
