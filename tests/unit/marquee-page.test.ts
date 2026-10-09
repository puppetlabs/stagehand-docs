import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const astroBin = join(process.cwd(), 'node_modules/astro/bin/astro.mjs');
const roots: string[] = [];

// Builds the real site into a throwaway directory so the production dist/ is never touched.
const buildMarqueePage = (fixture: string | undefined): string => {
  const root = mkdtempSync(join(tmpdir(), 'stagehand-marquee-build-'));
  roots.push(root);
  const env: NodeJS.ProcessEnv = { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' };
  delete env.STAGEHAND_E2E_FIXTURES;
  delete env.STAGEHAND_SCALE_FIXTURES;
  delete env.STAGEHAND_MARQUEE_FIXTURE;
  if (fixture !== undefined) env.STAGEHAND_MARQUEE_FIXTURE = fixture;

  const result = spawnSync(process.execPath, [astroBin, 'build', '--outDir', root], {
    cwd: process.cwd(),
    env,
    encoding: 'utf8',
  });
  expect(result.status, result.stderr || result.stdout).toBe(0);
  return readFileSync(join(root, 'marquee/index.html'), 'utf8');
};

// Assert on a boolean so a failure prints one short line rather than the whole built page.
const expectIncludes = (html: string, text: string) =>
  expect(html.includes(text), `page should contain ${text}`).toBe(true);
const expectExcludes = (html: string, text: string) =>
  expect(html.includes(text), `page should not contain ${text}`).toBe(false);

afterAll(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('Marquee page with packs and a paid listing', () => {
  let html = '';
  beforeAll(() => {
    html = buildMarqueePage('hostile');
  }, 120_000);

  it('renders one table row per free pack with its tier word, version date and digest in code', () => {
    expect((html.match(/<tr[^>]*data-pack-id="hostile-pack"/g) ?? []).length).toBe(1);
    expectIncludes(html, '2026-10-01');
    expectIncludes(
      html,
      '<code>sha256:3333333333333333333333333333333333333333333333333333333333333333</code>',
    );
    expectIncludes(html, 'Core');
  });

  it('lists a paid add-on with the spelled-out label and no digest, image or registry host', () => {
    const paid = /<li[^>]*data-paid-id="hostile-paid"[\s\S]*?<\/li>/.exec(html)?.[0] ?? '';

    expect(paid.length, 'paid listing element found').toBeGreaterThan(0);
    expectIncludes(paid, 'Perforce add-on, licence required');
    expectIncludes(paid, 'Advanced');
    expectIncludes(paid, '2026-09-15');
    expect(/sha256|ghcr\.io|@sha|<code/.test(paid)).toBe(false);
  });

  it('renders hostile index text as literal escaped text and adds no element from the data', () => {
    expectIncludes(html, '&lt;script');
    expectExcludes(html, 'id="injected');
    expect(/<script[^>]*injected/.test(html)).toBe(false);
    expect(/<img[^>]*onerror/.test(html)).toBe(false);
  });

  it('shows the publisher key heading and fingerprint', () => {
    expectIncludes(html, 'Publisher key fingerprint');
    expectIncludes(html, 'sha256:48ba24e6f91da7ced7540b1512d0eac37b7fa070d474d28b9f8a89a0c5955242');
    expectIncludes(html, 'How to add Marquee to a console');
    expectIncludes(html, 'oci://ghcr.io/puppet-stagehand/catalog');
  });
});

describe('Marquee page with nothing published', () => {
  let html = '';
  beforeAll(() => {
    html = buildMarqueePage(undefined);
  }, 120_000);

  it('shows the empty state and no table', () => {
    expectIncludes(html, 'No Expansion Packs are published on Marquee yet.');
    expectExcludes(html, '<table');
  });
});
