/** Small deterministic noise toolkit used by every procedural texture. */

export function makeRandom(seed: number) {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

const fade = (t: number) => t * t * (3 - 2 * t)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export type Noise2D = (x: number, y: number) => number

/** Tileable value noise on a `period x period` lattice. */
export function makeNoise2D(seed: number, period = 64): Noise2D {
  const rand = makeRandom(seed)
  const grid = new Float32Array(period * period)
  for (let i = 0; i < grid.length; i++) grid[i] = rand()
  const at = (i: number, j: number) =>
    grid[(((j % period) + period) % period) * period + (((i % period) + period) % period)]

  return (x, y) => {
    const xi = Math.floor(x)
    const yi = Math.floor(y)
    const u = fade(x - xi)
    const v = fade(y - yi)
    return lerp(
      lerp(at(xi, yi), at(xi + 1, yi), u),
      lerp(at(xi, yi + 1), at(xi + 1, yi + 1), u),
      v,
    )
  }
}

export function fbm(
  noise: Noise2D,
  x: number,
  y: number,
  octaves = 4,
  lacunarity = 2,
  gain = 0.5,
) {
  let sum = 0
  let amp = 1
  let norm = 0
  let freq = 1
  for (let i = 0; i < octaves; i++) {
    sum += noise(x * freq, y * freq) * amp
    norm += amp
    amp *= gain
    freq *= lacunarity
  }
  return sum / norm
}

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

export function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp01((x - edge0) / (edge1 - edge0))
  return t * t * (3 - 2 * t)
}
