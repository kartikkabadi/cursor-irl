export const DITHERPRINT_EVENT_ID = 'cursor-roadshow-bangalore-2026';
export const DITHERPRINT_ALGORITHM_VERSION = 'ditherprint-v1';
export const DITHERPRINT_GRID_SIZE = 16;
export const DITHERPRINT_CANDIDATE_COUNT = 6;
export const FINGERPRINT_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const CURSOR_COLORS = [
  '#F08A69',
  '#6FB7A4',
  '#7CA6D8',
  '#B7A1D9',
  '#E5B95F',
  '#E0785A',
  '#77A7A8',
  '#D792B1',
] as const;

export type SymmetryMode = 'none' | 'vertical' | 'horizontal' | 'radial';

export type DitherprintIdentity = {
  profile_id: string;
  variant: number;
  algorithm_version: string;
  primary: string;
  secondary: string;
  background: string;
  cursor_color: string;
  fingerprint: string;
  symmetry: SymmetryMode;
  border: number;
  grid: number[];
};

type Palette = { primary: string; secondary: string; background: string };

const PALETTES: Palette[] = [
  { primary: '#F54E00', secondary: '#26251E', background: '#F7F7F4' },
  { primary: '#2F7D64', secondary: '#26251E', background: '#EEF3EE' },
  { primary: '#2E5F8A', secondary: '#26251E', background: '#EEF2F6' },
  { primary: '#A86A0C', secondary: '#26251E', background: '#F7F1E4' },
  { primary: '#74408C', secondary: '#26251E', background: '#F4EFF5' },
  { primary: '#B13E5E', secondary: '#26251E', background: '#F7EFF1' },
  { primary: '#1F6F6F', secondary: '#26251E', background: '#EDF4F2' },
  { primary: '#6B5B8E', secondary: '#26251E', background: '#F2F0F6' },
];

const CURSOR_GLYPHS: Array<Array<[number, number]>> = [
  [[0, 0], [0, -1], [0, -2], [0, -3], [0, -4], [1, -2], [2, -2]],
  [[0, 0], [1, 0], [0, 1], [1, 1], [-1, -1], [-2, -2], [-3, -3]],
  [[0, 0], [0, 1], [0, 2], [0, 3], [1, 1], [-1, 1]],
  [[0, 0], [1, -1], [2, -2], [-1, 1], [-2, 2], [0, 1], [1, 0]],
];

const GRID_CELLS = DITHERPRINT_GRID_SIZE * DITHERPRINT_GRID_SIZE;
const GRID = DITHERPRINT_GRID_SIZE;
const EDGE = GRID - 1;

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function pickFingerprint(digest: string): string {
  let fingerprint = '';
  for (let index = 0; index < 4; index += 1) {
    const byte = parseInt(digest.slice(8 + index * 2, 10 + index * 2), 16);
    fingerprint += FINGERPRINT_ALPHABET[byte % FINGERPRINT_ALPHABET.length];
  }
  return fingerprint;
}

function indexAt(x: number, y: number): number {
  return y * GRID + x;
}

function setCell(grid: number[], x: number, y: number, value: number): void {
  if (x >= 0 && x < GRID && y >= 0 && y < GRID) grid[indexAt(x, y)] = value;
}

function applySymmetry(grid: number[], symmetry: SymmetryMode): void {
  if (symmetry === 'none') return;
  for (let y = 0; y < GRID; y += 1) {
    for (let x = 0; x < GRID; x += 1) {
      if (symmetry === 'vertical') setCell(grid, EDGE - x, y, grid[indexAt(x, y)]);
      if (symmetry === 'horizontal') setCell(grid, x, EDGE - y, grid[indexAt(x, y)]);
      if (symmetry === 'radial') setCell(grid, EDGE - x, EDGE - y, grid[indexAt(x, y)]);
    }
  }
}

function applyBorder(grid: number[], border: number, rng: () => number): void {
  if (border === 0) {
    const size = 3;
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        if (rng() < 0.5) {
          setCell(grid, x, y, 1);
          setCell(grid, EDGE - x, y, 1);
          setCell(grid, x, EDGE - y, 1);
          setCell(grid, EDGE - x, EDGE - y, 1);
        }
      }
    }
  } else if (border === 1) {
    for (let i = 0; i < GRID; i += 1) {
      grid[indexAt(i, 0)] = 1;
      grid[indexAt(i, EDGE)] = 1;
      grid[indexAt(0, i)] = 1;
      grid[indexAt(EDGE, i)] = 1;
    }
  } else if (border === 2) {
    for (let i = 0; i < GRID; i += 1) {
      if (i % 2 === 0) {
        setCell(grid, i, 0, 1);
        setCell(grid, i, EDGE, 1);
        setCell(grid, 0, i, 1);
        setCell(grid, EDGE, i, 1);
      }
    }
  }
}

export function ditherprintSeed(eventId: string, profileId: string, variant: number): string {
  return `cursor-irl:v1|${eventId}|${profileId}|${variant}`;
}

export async function generateDitherprintIdentity(
  profileId: string,
  variant: number,
  eventId = DITHERPRINT_EVENT_ID,
): Promise<DitherprintIdentity> {
  const digest = await sha256Hex(ditherprintSeed(eventId, profileId, variant));
  const rng = mulberry32(parseInt(digest.slice(0, 8), 16));

  const palette = PALETTES[parseInt(digest.slice(8, 12), 16) % PALETTES.length];
  const cursor_color = CURSOR_COLORS[parseInt(digest.slice(12, 16), 16) % CURSOR_COLORS.length];
  const symmetryModes: SymmetryMode[] = ['none', 'vertical', 'horizontal', 'radial'];
  const symmetry = symmetryModes[parseInt(digest.slice(16, 18), 16) % symmetryModes.length];
  const border = parseInt(digest.slice(18, 20), 16) % 3;
  const glyphIndex = parseInt(digest.slice(20, 22), 16) % CURSOR_GLYPHS.length;
  const glyph = CURSOR_GLYPHS[glyphIndex];
  const anchorX = 4 + (parseInt(digest.slice(22, 24), 16) % 8);
  const anchorY = 5 + (parseInt(digest.slice(24, 26), 16) % 7);
  const occupied = 0.42 + rng() * 0.16;
  const secondaryRatio = 0.28;

  const grid = new Array<number>(GRID_CELLS).fill(0);
  for (let y = 0; y < GRID; y += 1) {
    for (let x = 0; x < GRID; x += 1) {
      const roll = rng();
      if (roll < occupied) grid[indexAt(x, y)] = roll < occupied * secondaryRatio ? 2 : 1;
    }
  }

  applySymmetry(grid, symmetry);
  applyBorder(grid, border, rng);

  for (const [offsetX, offsetY] of glyph) {
    setCell(grid, anchorX + offsetX, anchorY + offsetY, 0);
  }

  return {
    profile_id: profileId,
    variant,
    algorithm_version: DITHERPRINT_ALGORITHM_VERSION,
    primary: palette.primary,
    secondary: palette.secondary,
    background: palette.background,
    cursor_color,
    fingerprint: pickFingerprint(digest),
    symmetry,
    border,
    grid,
  };
}

export function ditherprintSvg(identity: DitherprintIdentity, size = 160): string {
  const cell = size / GRID;
  const cells: string[] = [];
  for (let y = 0; y < GRID; y += 1) {
    for (let x = 0; x < GRID; x += 1) {
      const value = identity.grid[indexAt(x, y)];
      if (value === 0) continue;
      const fill = value === 1 ? identity.primary : identity.secondary;
      cells.push(`<rect x="${x * cell}" y="${y * cell}" width="${cell}" height="${cell}" fill="${fill}"/>`);
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges">${cells.join('')}</svg>`;
}

export async function generateDitherprintCandidates(
  profileId: string,
  eventId = DITHERPRINT_EVENT_ID,
): Promise<DitherprintIdentity[]> {
  const candidates: DitherprintIdentity[] = [];
  for (let variant = 0; variant < DITHERPRINT_CANDIDATE_COUNT; variant += 1) {
    candidates.push(await generateDitherprintIdentity(profileId, variant, eventId));
  }
  return candidates;
}
