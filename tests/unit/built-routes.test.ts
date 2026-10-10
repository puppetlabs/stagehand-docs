import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const requiredOutputs = [
  'index.html',
  'tiers/index.html',
  'compatibility/index.html',
  'marquee/index.html',
  'docs/index.html',
  'docs/getting-started/index.html',
  'docs/security/index.html',
  'support/index.html',
  'data/compatibility.json',
  'data/marquee.json',
  '404.html',
] as const;

const temporaryRoots: string[] = [];

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('built route gate', () => {
  it('rejects a directory at an expected file path', () => {
    const root = mkdtempSync(join(tmpdir(), 'stagehand-routes-'));
    temporaryRoots.push(root);

    for (const output of requiredOutputs) {
      const target = join(root, 'dist', output);
      mkdirSync(dirname(target), { recursive: true });
      if (output === 'data/compatibility.json') mkdirSync(target);
      else writeFileSync(target, 'fixture');
    }

    const result = spawnSync(
      process.execPath,
      ['--import', 'tsx', resolve('scripts/check-built-routes.ts'), join(root, 'dist')],
      { cwd: process.cwd(), encoding: 'utf8' },
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('data/compatibility.json');
  });

  it.each(['marquee/index.html', 'data/marquee.json'])(
    'rejects a build that lacks the Marquee output %s',
    (missingOutput) => {
      const root = mkdtempSync(join(tmpdir(), 'stagehand-routes-'));
      temporaryRoots.push(root);

      for (const output of requiredOutputs) {
        if (output === missingOutput) continue;
        const target = join(root, 'dist', output);
        mkdirSync(dirname(target), { recursive: true });
        writeFileSync(target, 'fixture');
      }

      const result = spawnSync(
        process.execPath,
        ['--import', 'tsx', resolve('scripts/check-built-routes.ts'), join(root, 'dist')],
        { cwd: process.cwd(), encoding: 'utf8' },
      );

      expect(result.status).toBe(1);
      expect(result.stderr).toContain(missingOutput);
    },
  );
});
