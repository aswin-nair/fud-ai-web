import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const SRC = fileURLToPath(new URL('../', import.meta.url));
const BANNED = /\b(bad|cheat|guilty|earned|naughty|sinful|damage)\b|burn it off/i;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = `${dir}/${name}`;
    if (statSync(path).isDirectory()) return sourceFiles(path);
    if (!/\.tsx?$/.test(name) || name.endsWith('.test.ts') || name.endsWith('.test.tsx')) {
      return [];
    }
    return [path];
  });
}

function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

describe('mobile product language and color policy', () => {
  it('keeps moralizing vocabulary out of product source', () => {
    for (const path of sourceFiles(SRC)) {
      expect(stripComments(readFileSync(path, 'utf8')), path).not.toMatch(BANNED);
    }
  });

  it('keeps nutrition progress away from danger colors', () => {
    for (const relativePath of [
      'components/domain/CalorieRing.tsx',
      'components/domain/MacroBar.tsx',
      'components/primitives/ProgressBar.tsx',
    ]) {
      const source = stripComments(readFileSync(`${SRC}/${relativePath}`, 'utf8'));
      expect(source, relativePath).not.toMatch(/danger(?:Deep)?/);
    }
  });

  it('uses destructive button variants only in files with delete actions', () => {
    const destructiveFiles = sourceFiles(SRC).filter((path) => {
      const source = stripComments(readFileSync(path, 'utf8'));
      return /variant="destructive"|style:\s*'destructive'/.test(source);
    });

    expect(destructiveFiles.length).toBeGreaterThan(0);
    for (const path of destructiveFiles) {
      expect(stripComments(readFileSync(path, 'utf8')), path).toMatch(/delete/i);
    }
  });
});
