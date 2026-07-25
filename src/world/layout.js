/**
 * The physical footprint of the block.
 *
 * The street runs along +X. North lots sit at negative Z and face the camera's
 * default position; south lots sit at positive Z. Every era reuses these lot
 * boundaries — what changes is what gets built on them.
 */

export const BLOCK = {
  /** Kerb line: the road occupies |z| < KERB. */
  kerb: 7.2,
  /** Sidewalk runs from the kerb out to the building line. */
  frontage: 11.6,
  kerbHeight: 0.16,
  sidewalkHeight: 0.18,
  /** How far the visible street extends each way before fog takes over. */
  halfLength: 120,
  /** Cross-streets cut the block at these X positions. */
  crossX: [-52, 52],
  crossHalfWidth: 7.2,
  /** Lane geometry used by the traffic simulation. */
  lanes: {
    eastbound: 3.4,
    westbound: -3.4,
    parkNorth: -5.9,
    parkSouth: 5.9
  }
};

/** North side (z < 0) — the hero row the camera looks at by default. */
export const NORTH_LOTS = [
  { id: 'bank', x0: -46, x1: -33, depth: 20 },
  { id: 'theater', x0: -33, x1: -21, depth: 22 },
  { id: 'diner', x0: -21, x1: -12, depth: 15 },
  { id: 'market', x0: -12, x1: -2, depth: 18 },
  { id: 'tower', x0: -2, x1: 12, depth: 22 },
  { id: 'music', x0: 12, x1: 22, depth: 17 },
  { id: 'service', x0: 22, x1: 38, depth: 18 }
];

/** South side (z > 0) — read mostly in profile, but never left bare. */
export const SOUTH_LOTS = [
  { id: 'hotel', x0: -44, x1: -30, depth: 20 },
  { id: 'laundry', x0: -30, x1: -20, depth: 15 },
  { id: 'bar', x0: -20, x1: -9, depth: 16 },
  { id: 'vacant', x0: -9, x1: 4, depth: 18 },
  { id: 'pharmacy', x0: 4, x1: 16, depth: 16 },
  { id: 'garage', x0: 16, x1: 34, depth: 20 }
];

export const ALL_LOTS = [
  ...NORTH_LOTS.map((l) => ({ ...l, side: 'north' })),
  ...SOUTH_LOTS.map((l) => ({ ...l, side: 'south' }))
];

export function lotById(id) {
  return ALL_LOTS.find((l) => l.id === id);
}

/** Centre point + facing for a lot's storefront. */
export function lotFront(lot) {
  const cx = (lot.x0 + lot.x1) / 2;
  const z = lot.side === 'north' ? -BLOCK.frontage : BLOCK.frontage;
  return { cx, z, width: lot.x1 - lot.x0, facing: lot.side === 'north' ? 1 : -1 };
}

/** Distant filler blocks that close off the view down the avenue. */
export const BACKDROP_BLOCKS = [
  { x: -78, z: -30, w: 26, d: 24, h: 26, seed: 1 },
  { x: -80, z: 34, w: 28, d: 22, h: 20, seed: 2 },
  { x: 74, z: -32, w: 30, d: 26, h: 30, seed: 3 },
  { x: 80, z: 32, w: 26, d: 22, h: 22, seed: 4 },
  { x: -110, z: -44, w: 34, d: 30, h: 38, seed: 5 },
  { x: 112, z: -46, w: 32, d: 28, h: 42, seed: 6 },
  { x: -8, z: -74, w: 40, d: 26, h: 34, seed: 7 },
  { x: 40, z: -78, w: 34, d: 24, h: 44, seed: 8 },
  { x: -46, z: -80, w: 30, d: 22, h: 28, seed: 9 },
  { x: 4, z: 70, w: 44, d: 26, h: 30, seed: 10 },
  { x: -56, z: 74, w: 32, d: 24, h: 24, seed: 11 },
  { x: 62, z: 72, w: 36, d: 26, h: 36, seed: 12 }
];
