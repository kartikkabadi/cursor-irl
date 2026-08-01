import { beforeEach, describe, expect, it } from 'vitest';
import { DITHERPRINT_CANDIDATE_COUNT, FINGERPRINT_ALPHABET, ditherprintSvg, generateDitherprintCandidates, generateDitherprintIdentity } from './ditherprint';

const PROFILE_ID = '11111111-2222-4333-8444-555555555555';
const EVENT_ID = 'cursor-roadshow-bangalore-2026';

describe('ditherprint determinism', () => {
  it('produces identical output for the same seed', async () => {
    const first = await generateDitherprintIdentity(PROFILE_ID, 2, EVENT_ID);
    const second = await generateDitherprintIdentity(PROFILE_ID, 2, EVENT_ID);
    expect(first).toEqual(second);
  });

  it('differs across variants of the same profile', async () => {
    const seen = new Set<string>();
    const identities = await generateDitherprintCandidates(PROFILE_ID, EVENT_ID);
    expect(identities).toHaveLength(DITHERPRINT_CANDIDATE_COUNT);
    for (const identity of identities) {
      expect(identity.variant).toBeGreaterThanOrEqual(0);
      expect(identity.variant).toBeLessThan(DITHERPRINT_CANDIDATE_COUNT);
      seen.add(identity.grid.join(','));
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it('differs across profiles with the same variant', async () => {
    const otherId = '99999999-8888-4777-8666-555555555555';
    const first = await generateDitherprintIdentity(PROFILE_ID, 1, EVENT_ID);
    const second = await generateDitherprintIdentity(otherId, 1, EVENT_ID);
    expect(first.grid).not.toEqual(second.grid);
  });

  it('uses a 4-char fingerprint from the safe alphabet', async () => {
    const identity = await generateDitherprintIdentity(PROFILE_ID, 4, EVENT_ID);
    expect(identity.fingerprint).toHaveLength(4);
    for (const char of identity.fingerprint) {
      expect(FINGERPRINT_ALPHABET).toContain(char);
    }
  });

  it('does not leak the profile id into the fingerprint alphabet', async () => {
    const identity = await generateDitherprintIdentity(PROFILE_ID, 0, EVENT_ID);
    expect(identity.fingerprint).not.toMatch(/[01IO]/);
  });

  it('renders a crisp integer-aligned SVG', async () => {
    const identity = await generateDitherprintIdentity(PROFILE_ID, 3, EVENT_ID);
    const svg = ditherprintSvg(identity, 160);
    expect(svg).toContain('<svg');
    expect(svg).toContain('shape-rendering="crispEdges"');
    const coordinates = svg.match(/(\d+\.\d+)/g) ?? [];
    expect(coordinates).toHaveLength(0);
  });

  it('keeps the grid at 16x16 cells', async () => {
    const identity = await generateDitherprintIdentity(PROFILE_ID, 5, EVENT_ID);
    expect(identity.grid).toHaveLength(16 * 16);
  });
});
