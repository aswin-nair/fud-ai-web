import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const SRC = join(process.cwd(), 'src');

function source(...parts: string[]): string {
  return readFileSync(join(SRC, ...parts), 'utf8');
}

function functionBody(contents: string, start: string, next: string): string {
  const from = contents.indexOf(start);
  const to = contents.indexOf(next, from + start.length);
  if (from < 0 || to < 0) throw new Error(`Could not isolate ${start}`);
  return contents.slice(from, to);
}

describe('engagement reward ownership', () => {
  it('keeps point writes out of quest synchronization', () => {
    const questStore = source('stores', 'questStore.ts');

    expect(questStore).not.toContain('awardPoints');
    expect(questStore).not.toContain('hasAwarded');
    expect(questStore).toContain('commitCompletion = false');
  });

  it('allows recordLog, but not edit/delete sync, to award quest completion', () => {
    const progression = source('stores', 'progression.ts');
    const recordLog = functionBody(
      progression,
      'export async function recordLog',
      'async function awardStreakMilestone',
    );
    const recordChange = progression.slice(progression.indexOf('export async function recordChange'));

    expect(recordLog).toContain("awardPoints('quest_completed'");
    expect(recordLog).toContain('syncQuest(timezone, true)');
    expect(recordChange).not.toContain('awardPoints');
    expect(recordChange).not.toContain('hasAwarded');
    expect(recordChange).toContain('syncQuest(timezone)');
    expect(recordChange).not.toContain('syncQuest(timezone, true)');
  });

  it('preserves completed rows while gating new completion persistence', () => {
    const questQueries = source('db', 'queries', 'quests.ts');

    expect(questQueries).toContain(
      'const newlyCompleted = !wasComplete && completed && commitCompletion',
    );
    expect(questQueries).toContain(
      'completedAt: row.completedAt ?? (newlyCompleted ? new Date().toISOString() : null)',
    );
  });

  it('does not reimplement local-hour streak policy in StreakBadge', () => {
    const badge = source('components', 'domain', 'StreakBadge.tsx');

    expect(badge).toContain('atRisk: boolean');
    expect(badge).not.toContain('AT_RISK_HOUR');
    expect(badge).not.toContain('getHours()');
    expect(badge).not.toContain('new Date()');
  });
});
