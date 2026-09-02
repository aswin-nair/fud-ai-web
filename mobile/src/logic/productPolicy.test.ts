import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { palette } from '@/theme/tokens';

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

function luminance(hex: string): number {
  const channels = [0, 2, 4].map((offset) => Number.parseInt(hex.slice(1 + offset, 3 + offset), 16) / 255)
    .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(foreground: string, background: string): number {
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
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

  it('keeps essential text and action labels at WCAG AA contrast', () => {
    for (const colors of Object.values(palette)) {
      expect(contrast(colors.textPrimary, colors.background)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(colors.textSecondary, colors.background)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(colors.textMuted, colors.surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(colors.textOnPrimary, colors.onTrack)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(colors.textOnDanger, colors.danger)).toBeGreaterThanOrEqual(4.5);
    }
  });
});
