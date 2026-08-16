import { useMigrations as useDrizzleMigrations } from 'drizzle-orm/expo-sqlite/migrator';

import migrations from '../../drizzle/migrations';
import { db } from '@/db/client';

/**
 * Drizzle records applied migrations in its own table, so this is a no-op on
 * every launch after the first and applies only the new files on upgrade.
 */
export function useMigrations(): { success: boolean; error?: Error } {
  return useDrizzleMigrations(db, migrations);
}
