import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { loadMarquee } from '../../src/lib/data/marquee';

const fixture = (name: string) => new URL(`../fixtures/data/${name}`, import.meta.url).pathname;

const fingerprint = 'sha256:48ba24e6f91da7ced7540b1512d0eac37b7fa070d474d28b9f8a89a0c5955242';
const temporaryRoots: string[] = [];

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) rmSync(root, { recursive: true, force: true });
});

// Writes a mutated copy of the valid fixture so each invalid case is one deliberate change.
const mutatedFixture = (mutate: (document: Record<string, any>) => void): string => {
  const root = mkdtempSync(join(tmpdir(), 'stagehand-marquee-'));
  temporaryRoots.push(root);
  const document = JSON.parse(readFileSync(fixture('marquee-valid.json'), 'utf8'));
  mutate(document);
  const path = join(root, 'marquee.json');
  writeFileSync(path, JSON.stringify(document));
  return path;
};

describe('loadMarquee', () => {
  it('returns one free pack and one paid listing from the valid fixture', () => {
    const document = loadMarquee({ path: fixture('marquee-valid.json') });

    expect(document.packs).toHaveLength(1);
    expect(document.packs[0].name).toBe('Example Hello');
    expect(document.packs[0].versions[0].digest).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(document.paid_listings).toHaveLength(1);
    expect(document.paid_listings[0].label).toBe('Perforce add-on, licence required');
  });

  it('seeds the committed document with nothing published, the pinned fingerprint and the feed address', () => {
    const document = loadMarquee();

    expect(document.packs).toEqual([]);
    expect(document.paid_listings).toEqual([]);
    expect(document.publisher_key.fingerprint).toBe(fingerprint);
    expect(document.feed).toBe('oci://ghcr.io/puppet-stagehand/catalog');
  });

  it('names the file and the JSON path when a top-level field is unknown', () => {
    const path = mutatedFixture((document) => {
      document.surprise = true;
    });

    expect(() => loadMarquee({ path })).toThrow(path);
    expect(() => loadMarquee({ path })).toThrow('must NOT have additional properties');
  });

  it('names the file and the JSON path when the fingerprint is not sha256 plus 64 hex digits', () => {
    const path = mutatedFixture((document) => {
      document.publisher_key.fingerprint = 'sha256:abc';
    });

    expect(() => loadMarquee({ path })).toThrow(path);
    expect(() => loadMarquee({ path })).toThrow('/publisher_key/fingerprint');
  });

  it('rejects a paid listing that carries an image reference', () => {
    const path = mutatedFixture((document) => {
      document.paid_listings[0].image = 'ghcr.io/perforce/paid@sha256:' + 'a'.repeat(64);
    });

    expect(() => loadMarquee({ path })).toThrow(path);
    expect(() => loadMarquee({ path })).toThrow('/paid_listings/0');
  });
});
