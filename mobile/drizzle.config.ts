import type { Config } from 'drizzle-kit';

/**
 * The expo driver emits a bundled `drizzle/migrations.js` alongside the raw
 * SQL, which is what the runtime migrator imports. Regenerate with
 * `npm run db:generate` after any change to schema.ts.
 */
export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  driver: 'expo',
} satisfies Config;
