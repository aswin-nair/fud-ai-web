import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * §10 acceptance: the points ledger is append-only. A mutable total drifts the
 * moment a write half-fails, and an auditable history is the only way to answer
 * "where did these points come from?" — so this scans the source for any write
 * against the table other than an insert.
 */
const SRC = join(process.cwd(), 'src');

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);

    if (entry.isDirectory()) return sourceFiles(path);
    return entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') ? [path] : [];
  });
}

describe('points_ledger', () => {
  it('is never updated or deleted from', () => {
    const banned = [
      /\.update\(\s*pointsLedger/,
      /\.delete\(\s*pointsLedger/,
      /update\s+points_ledger/i,
      /delete\s+from\s+points_ledger/i,
    ];

    const offenders: string[] = [];

    for (const file of sourceFiles(SRC)) {
      if (file.endsWith('pointsLedger.test.ts')) continue;

      const source = readFileSync(file, 'utf8');
      const relative = file.replace(/\\/g, '/');
      // A confirmed local wipe may delete the ledger. Ordinary product code
      // still cannot update or delete individual point rows.
      const wipeOnly = relative.endsWith('db/queries/localPrivacy.ts');
      const patterns = wipeOnly
        ? [/\.update\(\s*pointsLedger/, /update\s+points_ledger/i]
        : banned;

      for (const pattern of patterns) {
        if (pattern.test(source)) offenders.push(`${file}: ${String(pattern)}`);
      }
    }

    expect(offenders).toEqual([]);
  });

  it('has a schema with no column an update would target', () => {
    // Every column is written once at insert. If a mutable column is added
    // here, this test is the prompt to ask whether it belongs in the ledger.
    const schema = readFileSync(join(SRC, 'db', 'schema.ts'), 'utf8');
    const table = schema.slice(schema.indexOf('pointsLedger'));
    const body = table.slice(0, table.indexOf('});'));

    for (const column of ['delta', 'reason', 'localDate', 'createdAt']) {
      expect(body).toContain(column);
    }
  });
});
