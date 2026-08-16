import { useEffect, useState } from 'react';

import migrations from '../../drizzle/migrations';
import { connect } from '@/db/client.web';

const APPLIED_TABLE = '__drizzle_migrations';

/**
 * Web counterpart to migrate.ts. Drizzle's expo-sqlite migrator drives the
 * synchronous API, which web does not support, so this applies the same
 * generated files through the async one and tracks them the same way.
 */
export function useMigrations(): { success: boolean; error?: Error } {
  const [state, setState] = useState<{ success: boolean; error?: Error }>({
    success: false,
  });

  useEffect(() => {
    let cancelled = false;

    void applyMigrations()
      .then(() => {
        if (!cancelled) setState({ success: true });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            success: false,
            error: error instanceof Error ? error : new Error(String(error)),
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

async function applyMigrations(): Promise<void> {
  const conn = await connect();

  await conn.execAsync(
    `create table if not exists ${APPLIED_TABLE} (tag text primary key not null, applied_at integer not null)`,
  );

  for (const entry of migrations.journal.entries) {
    const key = `m${String(entry.idx).padStart(4, '0')}`;
    const sql = migrations.migrations[key];
    if (!sql) continue;

    const done = await conn.getFirstAsync<{ tag: string }>(
      `select tag from ${APPLIED_TABLE} where tag = ?`,
      [entry.tag],
    );
    if (done) continue;

    for (const statement of sql.split('--> statement-breakpoint')) {
      const trimmed = statement.trim();
      if (trimmed) await conn.execAsync(trimmed);
    }

    await conn.runAsync(`insert into ${APPLIED_TABLE} (tag, applied_at) values (?, ?)`, [
      entry.tag,
      Date.now(),
    ]);
  }
}
