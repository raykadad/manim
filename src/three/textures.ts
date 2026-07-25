import * as THREE from 'three'
import { clamp01, fbm, makeNoise2D, makeRandom, smoothstep } from './noise'

/* ------------------------------------------------------------------ */
/* canvas helpers                                                      */
/* ------------------------------------------------------------------ */

type Ctx = CanvasRenderingContext2D

function canvas2d(w: number, h = w) {
  const el = document.createElement('canvas')
  el.width = w
  el.height = h
  const ctx = el.getContext('2d')!
  return { el, ctx }
}

function finish(el: HTMLCanvasElement, srgb: boolean, repeat = 1) {
  const tex = new THREE.CanvasTexture(el)
  tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.anisotropy = 8
  tex.repeat.setScalar(repeat)
  tex.needsUpdate = true
  return tex
}

/** Converts a tileable height field into an RGB tangent-space normal map. */
function normalFromHeight(height: Float32Array, w: number, h: number, strength: number) {
  const { el, ctx } = canvas2d(w, h)
  const img = ctx.createImageData(w, h)
  const at = (x: number, y: number) =>
    height[(((y % h) + h) % h) * w + (((x % w) + w) % w)]

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength
      const len = Math.hypot(dx, dy, 1)
      const i = (y * w + x) * 4
      img.data[i] = ((-dx / len) * 0.5 + 0.5) * 255
      img.data[i + 1] = ((-dy / len) * 0.5 + 0.5) * 255
      img.data[i + 2] = (1 / len) * 0.5 * 255 + 127.5
      img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  return el
}

function grayscale(values: Float32Array, w: number, h: number) {
  const { el, ctx } = canvas2d(w, h)
  const img = ctx.createImageData(w, h)
  for (let i = 0; i < w * h; i++) {
    const v = clamp01(values[i]) * 255
    img.data[i * 4] = v
    img.data[i * 4 + 1] = v
    img.data[i * 4 + 2] = v
    img.data[i * 4 + 3] = 255
  }
  ctx.putImageData(img, 0, 0)
  return el
}

/** Draws letter-spaced text without relying on `ctx.letterSpacing`. */
function trackedText(
  ctx: Ctx,
  text: string,
  cx: number,
  y: number,
  tracking: number,
) {
  const chars = [...text]
  const widths = chars.map((c) => ctx.measureText(c).width)
  const total = widths.reduce((a, b) => a + b, 0) + tracking * (chars.length - 1)
  let x = cx - total / 2
  const align = ctx.textAlign
  ctx.textAlign = 'left'
  chars.forEach((c, i) => {
    ctx.fillText(c, x, y)
    x += widths[i] + tracking
  })
  ctx.textAlign = align
}

/* ------------------------------------------------------------------ */
/* wood — walnut slab for the hero table                               */
/* ------------------------------------------------------------------ */

export type SurfaceMaps = {
  map?: THREE.Texture
  normalMap?: THREE.Texture
  roughnessMap?: THREE.Texture
}

export function createWoodMaps(): SurfaceMaps & { map: THREE.Texture } {
  const W = 1536
  const H = 768
  const warp = makeNoise2D(11, 32)
  const detail = makeNoise2D(23, 64)
  const fibre = makeNoise2D(37, 128)
  const pores = makeNoise2D(53, 256)

  const { el, ctx } = canvas2d(W, H)
  const img = ctx.createImageData(W, H)
  const rough = new Float32Array(W * H)
  const height = new Float32Array(W * H)

  // Walnut palette: deep coffee lows, warm caramel highs.
  const dark = [0.03, 0.015, 0.009]
  const mid = [0.083, 0.041, 0.022]
  const light = [0.172, 0.098, 0.053]

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const u = x / W
      const v = y / H
      const i = y * W + x

      // flat-sawn plank: long parallel growth lines with a lazy wander
      const wander =
        (fbm(warp, u * 1.5, v * 1.5, 4) - 0.5) * 0.075 +
        0.012 * Math.sin(u * Math.PI * 2 + 0.7)
      let rings = (v + wander) * 24 + fbm(detail, u * 4, v * 9, 3) * 0.45
      rings -= Math.floor(rings)
      const ringLine = Math.pow(1 - rings, 5)

      // fibres and pores run *along* the grain, not across it
      const fibres = fbm(fibre, u * 12, v * 300, 3)
      const pore =
        smoothstep(0.82, 0.93, fbm(pores, u * 34, v * 420, 2)) *
        smoothstep(0.4, 0.62, fibres)

      // glue line between planks, once per tile
      const edge = Math.min(v, 1 - v)
      const seam = 1 - smoothstep(0.0, 0.006, edge)

      // tonal blend
      const t = clamp01(
        0.44 + (fibres - 0.5) * 0.66 - ringLine * 0.4 - pore * 0.38 - seam * 0.55,
      )
      const base = t < 0.5 ? mixArr(dark, mid, t * 2) : mixArr(mid, light, (t - 0.5) * 2)

      // broad colour drift so the slab is not uniform
      const drift = (fbm(warp, u * 1.5 + 4, v * 1.5, 3) - 0.5) * 0.06
      const o = i * 4
      img.data[o] = clamp01(base[0] + drift * 1.2) ** (1 / 2.2) * 255
      img.data[o + 1] = clamp01(base[1] + drift) ** (1 / 2.2) * 255
      img.data[o + 2] = clamp01(base[2] + drift * 0.7) ** (1 / 2.2) * 255
      img.data[o + 3] = 255

      rough[i] = 0.3 + ringLine * 0.12 + pore * 0.24 + (fibres - 0.5) * 0.06 + seam * 0.28
      height[i] = -ringLine * 0.3 - pore * 0.8 + fibres * 0.22 - seam * 2.4
    }
  }
  ctx.putImageData(img, 0, 0)

  return {
    map: finish(el, true),
    roughnessMap: finish(grayscale(rough, W, H), false),
    normalMap: finish(normalFromHeight(height, W, H, 1.1), false),
  }
}

function mixArr(a: number[], b: number[], t: number) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
}

/* ------------------------------------------------------------------ */
/* brushed / polished metal micro-surface                              */
/* ------------------------------------------------------------------ */

export function createBrushedMaps(
  base = 0.26,
  contrast = 0.09,
  seed = 7,
): Required<Pick<SurfaceMaps, 'normalMap' | 'roughnessMap'>> {
  const W = 1024
  const H = 512
  const streak = makeNoise2D(seed, 128)
  const fine = makeNoise2D(seed + 1, 256)
  const rough = new Float32Array(W * H)
  const height = new Float32Array(W * H)

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const u = x / W
      const v = y / H
      const i = y * W + x
      const s =
        fbm(streak, u * 2.5, v * 220, 3) * 0.6 + fbm(fine, u * 9, v * 460, 2) * 0.4
      rough[i] = base + (s - 0.5) * contrast * 2
      height[i] = (s - 0.5) * 0.6
    }
  }
  return {
    roughnessMap: finish(grayscale(rough, W, H), false),
    normalMap: finish(normalFromHeight(height, W, H, 0.5), false),
  }
}

/* ------------------------------------------------------------------ */
/* dial                                                                */
/* ------------------------------------------------------------------ */

export type DialFinish = 'sunray' | 'guilloche' | 'lacquer'

export type DialSpec = {
  finish: DialFinish
  /** sRGB hex of the dial lacquer */
  color: string
  /** printed text + minute-track colour */
  print: string
  /** accent used for the seconds track flourishes */
  accent: string
  brand: string
  line1: string
  line2: string
  date?: string
  dateAngle?: number
}

const SIZE = 2048

type FurniturePalette = {
  print: string
  accent: string
  window: string
  windowText: string
  frame: string
}

/**
 * Draws the minute track, printing and date aperture. Called three times with
 * different palettes so albedo, metalness and roughness stay in register —
 * printed paint has to read as matte on top of a metallic lacquer.
 */
function drawFurniture(ctx: Ctx, spec: DialSpec, pal: FurniturePalette, size: number) {
  const R = size / 2
  ctx.save()
  ctx.translate(R, R)

  const trackR = R * 0.9
  ctx.strokeStyle = pal.print
  ctx.lineCap = 'butt'
  for (let m = 0; m < 240; m++) {
    const a = (m / 240) * Math.PI * 2 - Math.PI / 2
    const major = m % 20 === 0
    const half = m % 4 === 0
    const len = major ? R * 0.05 : half ? R * 0.032 : R * 0.017
    ctx.globalAlpha = major ? 1 : half ? 0.85 : 0.55
    ctx.lineWidth = major ? R * 0.011 : half ? R * 0.0062 : R * 0.0034
    ctx.beginPath()
    ctx.moveTo(Math.cos(a) * trackR, Math.sin(a) * trackR)
    ctx.lineTo(Math.cos(a) * (trackR - len), Math.sin(a) * (trackR - len))
    ctx.stroke()
  }
  ctx.globalAlpha = 1

  ctx.fillStyle = pal.print
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  ctx.font = `600 ${R * 0.135}px "Cormorant Garamond Variable", Georgia, serif`
  trackedText(ctx, spec.brand, 0, -R * 0.44, R * 0.034)

  ctx.font = `500 ${R * 0.045}px "Inter Variable", Helvetica, Arial, sans-serif`
  trackedText(ctx, spec.line1, 0, -R * 0.32, R * 0.034)

  ctx.font = `400 ${R * 0.038}px "Inter Variable", Helvetica, Arial, sans-serif`
  trackedText(ctx, spec.line2, 0, R * 0.49, R * 0.028)
  ctx.globalAlpha = 0.9
  trackedText(ctx, 'SWISS MADE', 0, R * 0.585, R * 0.03)
  ctx.globalAlpha = 1

  ctx.strokeStyle = pal.accent
  ctx.globalAlpha = 0.55
  ctx.lineWidth = R * 0.0035
  ctx.beginPath()
  ctx.arc(0, 0, R * 0.845, 0, Math.PI * 2)
  ctx.stroke()
  ctx.globalAlpha = 1

  if (spec.date) {
    const a = ((spec.dateAngle ?? 90) * Math.PI) / 180 - Math.PI / 2
    const w = R * 0.15
    const h = R * 0.108
    ctx.save()
    // sits where the index it replaces would have been
    ctx.translate(Math.cos(a) * R * 0.655, Math.sin(a) * R * 0.655)
    roundRect(ctx, -w / 2, -h / 2, w, h, R * 0.012)
    ctx.fillStyle = pal.window
    ctx.fill()
    roundRect(
      ctx,
      -w / 2 - R * 0.009,
      -h / 2 - R * 0.009,
      w + R * 0.018,
      h + R * 0.018,
      R * 0.016,
    )
    ctx.strokeStyle = pal.frame
    ctx.lineWidth = R * 0.008
    ctx.stroke()
    ctx.fillStyle = pal.windowText
    ctx.font = `500 ${R * 0.07}px "Inter Variable", Helvetica, Arial, sans-serif`
    ctx.fillText(spec.date, 0, R * 0.004)
    ctx.restore()
  }

  ctx.restore()
}

export type DialMaps = {
  map: THREE.Texture
  metalnessMap: THREE.Texture
  roughnessMap: THREE.Texture
  anisotropyMap?: THREE.Texture
  normalMap?: THREE.Texture
}

export function createDialMaps(spec: DialSpec): DialMaps {
  const { el, ctx } = canvas2d(SIZE)
  const c = SIZE / 2
  const R = SIZE / 2

  const col = new THREE.Color(spec.color)
  const hsl = { h: 0, s: 0, l: 0 }
  col.getHSL(hsl)
  const centre = new THREE.Color().setHSL(
    hsl.h,
    Math.min(1, hsl.s * 1.04),
    Math.min(1, hsl.l * 1.24 + 0.03),
  )
  const rim = new THREE.Color().setHSL(hsl.h, hsl.s * 0.94, hsl.l * 0.56)

  const grad = ctx.createRadialGradient(c, c, 0, c, c, R)
  grad.addColorStop(0, `#${centre.getHexString()}`)
  grad.addColorStop(0.5, `#${col.getHexString()}`)
  grad.addColorStop(1, `#${rim.getHexString()}`)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, SIZE, SIZE)

  if (spec.finish === 'sunray') {
    ctx.save()
    ctx.translate(c, c)
    ctx.globalCompositeOperation = 'overlay'
    const rand = makeRandom(91)
    for (let i = 0; i < 1500; i++) {
      const a = (i / 1500) * Math.PI * 2 + rand() * 0.003
      const w = 0.0008 + rand() * 0.0022
      const bright = rand()
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.arc(0, 0, R, a, a + w)
      ctx.closePath()
      ctx.fillStyle =
        bright > 0.5
          ? `rgba(255,255,255,${(bright - 0.5) * 0.3})`
          : `rgba(0,0,0,${(0.5 - bright) * 0.26})`
      ctx.fill()
    }
    ctx.restore()
  }

  drawFurniture(
    ctx,
    spec,
    {
      print: spec.print,
      accent: spec.accent,
      window: '#0a0b0d',
      windowText: '#ece7dc',
      frame: spec.accent,
    },
    SIZE,
  )

  // ---- metalness: lacquer is metallic, printed paint is not ----
  const MSIZE = 1024
  const metal = canvas2d(MSIZE)
  metal.ctx.fillStyle =
    spec.finish === 'sunray' ? '#d0d0d0' : spec.finish === 'lacquer' ? '#4a4a4a' : '#2e2e2e'
  metal.ctx.fillRect(0, 0, MSIZE, MSIZE)
  drawFurniture(
    metal.ctx,
    spec,
    {
      print: '#0d0d0d',
      accent: '#f2f2f2',
      window: '#000000',
      windowText: '#000000',
      frame: '#ffffff',
    },
    MSIZE,
  )

  // ---- roughness ----
  const RSIZE = 640
  const rough = canvas2d(RSIZE)
  if (spec.finish === 'sunray') {
    const streak = makeNoise2D(19, 256)
    const img = rough.ctx.createImageData(RSIZE, RSIZE)
    for (let y = 0; y < RSIZE; y++) {
      for (let x = 0; x < RSIZE; x++) {
        const u = (x + 0.5) / RSIZE - 0.5
        const v = (y + 0.5) / RSIZE - 0.5
        const r = Math.hypot(u, v)
        const a = Math.atan2(v, u) / (Math.PI * 2)
        const s = fbm(streak, a * 320, r * 6, 3)
        const val = clamp01(0.3 + (s - 0.5) * 0.16) * 255
        const i = (y * RSIZE + x) * 4
        img.data[i] = img.data[i + 1] = img.data[i + 2] = val
        img.data[i + 3] = 255
      }
    }
    rough.ctx.putImageData(img, 0, 0)
  } else {
    rough.ctx.fillStyle = spec.finish === 'lacquer' ? '#1c1c1c' : '#4f4f4f'
    rough.ctx.fillRect(0, 0, RSIZE, RSIZE)
  }
  drawFurniture(
    rough.ctx,
    spec,
    {
      print: '#8f8f8f',
      accent: '#5a5a5a',
      window: '#2b2b2b',
      windowText: '#9c9c9c',
      frame: '#141414',
    },
    RSIZE,
  )

  const clamp = (t: THREE.Texture) => {
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping
    return t
  }

  return {
    map: clamp(finish(el, true)),
    metalnessMap: clamp(finish(metal.el, false)),
    roughnessMap: clamp(finish(rough.el, false)),
  }
}

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/**
 * Anisotropy direction map for a sunray brushed dial.
 * R/G encode the tangent direction (radial), B the strength.
 */
export function createSunrayAnisotropyMap() {
  const N = 1024
  const { el, ctx } = canvas2d(N)
  const img = ctx.createImageData(N, N)
  const jitter = makeNoise2D(5, 256)

  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const u = (x + 0.5) / N - 0.5
      const v = (y + 0.5) / N - 0.5
      const r = Math.hypot(u, v)
      const a = Math.atan2(v, u)
      // wobble the sweep slightly so the burst is not mathematically perfect
      const wob = (fbm(jitter, (a / (Math.PI * 2)) * 240, r * 6, 2) - 0.5) * 0.14
      const dir = a + wob
      const strength = smoothstep(0.0, 0.06, r) * (0.55 + 0.45 * smoothstep(0.5, 0.05, r))
      const i = (y * N + x) * 4
      img.data[i] = (Math.cos(dir) * 0.5 + 0.5) * 255
      img.data[i + 1] = (Math.sin(dir) * 0.5 + 0.5) * 255
      img.data[i + 2] = clamp01(strength) * 255
      img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  const tex = finish(el, false)
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping
  return tex
}

/** Concentric guilloché engraving (normal map only). */
export function createGuillocheNormalMap() {
  const N = 1024
  const height = new Float32Array(N * N)
  const wob = makeNoise2D(71, 128)
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const u = (x + 0.5) / N - 0.5
      const v = (y + 0.5) / N - 0.5
      const r = Math.hypot(u, v)
      const a = Math.atan2(v, u)
      const rings = Math.sin(r * 250 + (fbm(wob, u * 4, v * 4, 2) - 0.5) * 0.9)
      const ripple = Math.sin(a * 150) * 0.45
      // engraving lives in the central medallion only
      const mask = smoothstep(0.45, 0.34, r) * smoothstep(0.025, 0.07, r)
      height[y * N + x] = (rings * 0.85 + ripple) * mask
    }
  }
  const tex = finish(normalFromHeight(height, N, N, 0.6), false)
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping
  return tex
}

/* ------------------------------------------------------------------ */
/* studio backdrop glow                                                */
/* ------------------------------------------------------------------ */

export function createGlowTexture(inner: string, outer: string) {
  const N = 512
  const { el, ctx } = canvas2d(N)
  const g = ctx.createRadialGradient(N / 2, N / 2, 0, N / 2, N / 2, N / 2)
  g.addColorStop(0, inner)
  g.addColorStop(0.35, inner)
  g.addColorStop(1, outer)
  ctx.fillStyle = outer
  ctx.fillRect(0, 0, N, N)
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(N / 2, N / 2, N / 2, 0, Math.PI * 2)
  ctx.fill()
  const tex = finish(el, true)
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping
  return tex
}

/* ------------------------------------------------------------------ */
/* leather strap                                                       */
/* ------------------------------------------------------------------ */

export function createLeatherMaps(
  color: string,
  stitch: string,
  stitchRows: [number, number] = [0.085, 0.915],
) {
  const W = 768
  const H = 768
  const { el, ctx } = canvas2d(W, H)
  const img = ctx.createImageData(W, H)
  const height = new Float32Array(W * H)
  const rough = new Float32Array(W * H)

  // Worley cells shaped like alligator scales — wider along the strap than across
  const rand = makeRandom(313)
  const CU = 20
  const CV = 12
  const pts: [number, number][] = []
  for (let j = 0; j < CV; j++) {
    for (let i = 0; i < CU; i++) {
      pts.push([(i + 0.2 + rand() * 0.6) / CU, (j + 0.2 + rand() * 0.6) / CV])
    }
  }
  const cellAt = (u: number, v: number) => {
    const gx = Math.floor(u * CU)
    const gy = Math.floor(v * CV)
    let d1 = 9
    let d2 = 9
    for (let j = -1; j <= 1; j++) {
      for (let i = -1; i <= 1; i++) {
        const cx = (gx + i + CU) % CU
        const cy = (gy + j + CV) % CV
        const p = pts[cy * CU + cx]
        let dx = p[0] - u
        let dy = p[1] - v
        if (dx > 0.5) dx -= 1
        if (dx < -0.5) dx += 1
        if (dy > 0.5) dy -= 1
        if (dy < -0.5) dy += 1
        const d = Math.hypot(dx * 1.1, dy * 1.7)
        if (d < d1) {
          d2 = d1
          d1 = d
        } else if (d < d2) d2 = d
      }
    }
    return d2 - d1
  }

  const fine = makeNoise2D(97, 256)
  const base = new THREE.Color(color)

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const u = x / W
      const v = y / H
      const i = y * W + x
      const crease = 1 - smoothstep(0.0, 0.05, cellAt(u, v))
      const grain = fbm(fine, u * 260, v * 260, 3)
      const shade = 1 - crease * 0.62 + (grain - 0.5) * 0.18
      const o = i * 4
      img.data[o] = clamp01(base.r * shade) ** (1 / 2.2) * 255
      img.data[o + 1] = clamp01(base.g * shade) ** (1 / 2.2) * 255
      img.data[o + 2] = clamp01(base.b * shade) ** (1 / 2.2) * 255
      img.data[o + 3] = 255
      height[i] = -crease * 1.3 + (grain - 0.5) * 0.3
      rough[i] = 0.5 + crease * 0.22 + (grain - 0.5) * 0.1
    }
  }
  ctx.putImageData(img, 0, 0)

  // Saddle stitching along both edges. Canvas rows run opposite to texture v,
  // which is flipped on upload.
  ctx.lineCap = 'round'
  for (const row of stitchRows) {
    const yy = (1 - row) * H
    for (let s = 0; s < 56; s++) {
      const cx = ((s + 0.5) / 56) * W
      ctx.save()
      ctx.translate(cx, yy)
      ctx.rotate(-0.3)
      ctx.strokeStyle = stitch
      ctx.lineWidth = H * 0.016
      ctx.globalAlpha = 1
      ctx.beginPath()
      ctx.moveTo(-W * 0.0062, 0)
      ctx.lineTo(W * 0.0062, 0)
      ctx.stroke()
      ctx.restore()
      // matching relief in the height field
      const px = Math.floor(cx)
      const py = Math.floor(yy)
      for (let dy = -6; dy <= 6; dy++) {
        for (let dx = -10; dx <= 10; dx++) {
          const nx = (px + dx + W) % W
          const ny = (py + dy + H) % H
          const f = Math.max(0, 1 - Math.hypot(dx / 10, dy / 5))
          height[ny * W + nx] += f * 1.6
          rough[ny * W + nx] += f * 0.12
        }
      }
    }
  }

  return {
    map: finish(el, true),
    normalMap: finish(normalFromHeight(height, W, H, 0.9), false),
    roughnessMap: finish(grayscale(rough, W, H), false),
  }
}
