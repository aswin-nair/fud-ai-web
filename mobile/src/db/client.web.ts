import { drizzle } from 'drizzle-orm/sqlite-proxy';
import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

import * as schema from '@/db/schema';

export const DATABASE_NAME = 'calorie-tracker.db';

/**
 * On web, SQLite runs as WebAssembly in a worker and only the async API works;
 * the synchronous one that drizzle's expo-sqlite driver needs times out. This
 * routes the same queries through drizzle's async proxy driver instead.
 *
 * Metro picks this file over client.ts on web automatically.
 */
let connection: Promise<SQLiteDatabase> | null = null;

export function connect(): Promise<SQLiteDatabase> {
  connection ??= openDatabaseAsync(DATABASE_NAME);
  return connection;
}

export const db = drizzle(
  async (sql, params, method) => {
    const conn = await connect();

    if (method === 'run') {
      await conn.runAsync(sql, params);
      return { rows: [] };
    }

    // The proxy driver wants positional values, not column-keyed objects.
    const rows = await conn.getAllAsync<Record<string, unknown>>(sql, params);
    const values = rows.map((row) => Object.values(row));

    return { rows: method === 'get' ? (values[0] ?? []) : values };
  },
  { schema },
);

export type Database = typeof db;
