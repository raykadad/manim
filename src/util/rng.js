/**
 * Deterministic pseudo-randomness.
 *
 * Every generated element in CHRONOBLOCK draws from a seeded stream so the
 * block looks identical on every reload — the 1985 graffiti tag stays in the
 * same place, the cracked kerb stays cracked.
 */

/** mulberry32 — small, fast, good enough distribution for scenery. */
export function makeRng(seed = 1) {
  let a = seed >>> 0;
  const fn = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  fn.range = (min, max) => min + fn() * (max - min);
  fn.int = (min, max) => Math.floor(min + fn() * (max - min + 1));
  fn.pick = (arr) => arr[Math.floor(fn() * arr.length) % arr.length];
  fn.chance = (p) => fn() < p;
  fn.sign = () => (fn() < 0.5 ? -1 : 1);
  /** Pick `n` distinct entries (or as many as exist). */
  fn.sample = (arr, n) => {
    const copy = arr.slice();
    const out = [];
    while (out.length < n && copy.length) out.push(copy.splice(Math.floor(fn() * copy.length), 1)[0]);
    return out;
  };
  /** Gaussian-ish via the central limit theorem. */
  fn.gauss = (mean = 0, dev = 1) => {
    let s = 0;
    for (let i = 0; i < 4; i++) s += fn();
    return mean + ((s - 2) / 0.816) * dev;
  };
  return fn;
}

/** Turn any string into a stable 32-bit seed. */
export function hashSeed(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
