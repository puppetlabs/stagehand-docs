import { describe, expect, it } from 'vitest';
import { loadCompatibility } from '../../src/lib/data/compatibility';
import { loadMarquee } from '../../src/lib/data/marquee';
import { GET as getCompatibility } from '../../src/pages/data/compatibility.json';
import { GET as getMarquee } from '../../src/pages/data/marquee.json';

describe('GET /data/compatibility.json', () => {
  it('returns the real compatibility registry in the deterministic download contract', async () => {
    // Catches a wrapper response, a build timestamp, or a mismatch between the JSON endpoint and
    // loadCompatibility()'s own output — not just the register being empty.
    const expectedRecords = loadCompatibility();
    const response = getCompatibility();
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/json; charset=utf-8');
    expect(text.endsWith('\n')).toBe(true);
    expect(text).toBe(
      `${JSON.stringify({ schema_version: 1, generated_at: null, records: expectedRecords }, null, 2)}\n`,
    );
  });
});

describe('GET /data/marquee.json', () => {
  it('serves the same validated document the Marquee page renders, as pretty JSON', async () => {
    // Catches an endpoint that bypasses loadMarquee() validation or reshapes the document.
    const response = getMarquee();
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/json; charset=utf-8');
    expect(text.endsWith('\n')).toBe(true);
    expect(text).toBe(`${JSON.stringify(loadMarquee(), null, 2)}\n`);
  });
});
