import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { insetPolygon, signedArea } from './profile'

export { V2, fillet, roundedRect, insetPolygon, signedArea, stitchRowsFor, strapSection, strapStitchRows } from './profile'

/* ------------------------------------------------------------------ */
/* chamfered prism — indices, hands, bracelet links, buckle            */
/* ------------------------------------------------------------------ */

type Ring = { pts: THREE.Vector2[]; z: number }

/**
 * Extrudes a closed polygon along +Z with chamfered ends. Bands are built
 * with their own vertex rings so the shading stays smooth around the
 * silhouette but breaks crisply at every chamfer — the reason machined
 * parts read as metal.
 */
export type PrismOptions = {
  height: number
  chamferTop?: number
  chamferBottom?: number
  chamferRise?: number
  /** Overrides the mitre inset — used for hands, whose knife tips cannot be offset. */
  insetTop?: (pts: THREE.Vector2[]) => THREE.Vector2[]
  insetBottom?: (pts: THREE.Vector2[]) => THREE.Vector2[]
}

export function chamferedPrism(
  polygon: THREE.Vector2[],
  {
    height,
    chamferTop = 0,
    chamferBottom = 0,
    chamferRise,
    insetTop,
    insetBottom,
  }: PrismOptions,
) {
  let pts = polygon.map((p) => p.clone())
  if (signedArea(pts) < 0) pts = pts.reverse()

  const riseTop = chamferRise ?? chamferTop
  const riseBottom = chamferRise ?? chamferBottom

  const rings: Ring[] = []
  if (chamferBottom > 0 || insetBottom) {
    rings.push({ pts: insetBottom ? insetBottom(pts) : insetPolygon(pts, chamferBottom), z: 0 })
    rings.push({ pts, z: riseBottom })
  } else {
    rings.push({ pts, z: 0 })
  }
  if (chamferTop > 0 || insetTop) {
    rings.push({ pts, z: height - riseTop })
    rings.push({ pts: insetTop ? insetTop(pts) : insetPolygon(pts, chamferTop), z: height })
  } else {
    rings.push({ pts, z: height })
  }

  const position: number[] = []
  const uv: number[] = []
  const index: number[] = []

  const box = new THREE.Box2()
  pts.forEach((p) => box.expandByPoint(p))
  const size = box.getSize(new THREE.Vector2())
  const uvOf = (p: THREE.Vector2) => [
    (p.x - box.min.x) / (size.x || 1),
    (p.y - box.min.y) / (size.y || 1),
  ]

  const n = pts.length
  // side bands
  for (let b = 0; b < rings.length - 1; b++) {
    const lo = rings[b]
    const hi = rings[b + 1]
    const base = position.length / 3
    for (const ring of [lo, hi]) {
      for (let i = 0; i < n; i++) {
        const p = ring.pts[i]
        position.push(p.x, p.y, ring.z)
        uv.push(i / n, ring === lo ? 0 : 1)
      }
    }
    for (let i = 0; i < n; i++) {
      const a = base + i
      const bIdx = base + ((i + 1) % n)
      const c = base + n + i
      const d = base + n + ((i + 1) % n)
      index.push(a, bIdx, d, a, d, c)
    }
  }

  // caps
  const capRings: [Ring, boolean][] = [
    [rings[0], false],
    [rings[rings.length - 1], true],
  ]
  for (const [ring, up] of capRings) {
    const base = position.length / 3
    const faces = THREE.ShapeUtils.triangulateShape(ring.pts, [])
    for (const p of ring.pts) {
      position.push(p.x, p.y, ring.z)
      const [u, v] = uvOf(p)
      uv.push(u, v)
    }
    for (const f of faces) {
      if (up) index.push(base + f[0], base + f[1], base + f[2])
      else index.push(base + f[2], base + f[1], base + f[0])
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(position, 3))
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  geo.setIndex(index)
  geo.computeVertexNormals()
  return geo
}

/* ------------------------------------------------------------------ */
/* swept ribbon — leather straps                                       */
/* ------------------------------------------------------------------ */

export function sweepGeometry(
  curve: THREE.Curve<THREE.Vector3>,
  section: THREE.Vector2[],
  segments: number,
  scaleAt: (t: number) => THREE.Vector2 = () => new THREE.Vector2(1, 1),
) {
  const n = section.length
  const perim: number[] = [0]
  for (let i = 1; i <= n; i++) {
    perim.push(perim[i - 1] + section[i % n].distanceTo(section[i - 1]))
  }
  const total = perim[n]

  const position: number[] = []
  const uv: number[] = []
  const index: number[] = []
  const up = new THREE.Vector3(0, 1, 0)
  const side = new THREE.Vector3()
  const normalUp = new THREE.Vector3()

  for (let s = 0; s <= segments; s++) {
    const t = s / segments
    const p = curve.getPointAt(t)
    const tan = curve.getTangentAt(t).normalize()
    side.crossVectors(up, tan).normalize()
    if (side.lengthSq() < 1e-6) side.set(1, 0, 0)
    normalUp.crossVectors(tan, side).normalize()
    const sc = scaleAt(t)
    for (let i = 0; i < n; i++) {
      const c = section[i]
      position.push(
        p.x + side.x * c.x * sc.x + normalUp.x * c.y * sc.y,
        p.y + side.y * c.x * sc.x + normalUp.y * c.y * sc.y,
        p.z + side.z * c.x * sc.x + normalUp.z * c.y * sc.y,
      )
      uv.push(t, perim[i] / total)
    }
  }
  for (let s = 0; s < segments; s++) {
    for (let i = 0; i < n; i++) {
      const a = s * n + i
      const b = s * n + ((i + 1) % n)
      const c = (s + 1) * n + i
      const d = (s + 1) * n + ((i + 1) % n)
      index.push(a, c, d, a, d, b)
    }
  }

  // end caps
  const faces = THREE.ShapeUtils.triangulateShape(section, [])
  for (const [end, flip] of [
    [0, true],
    [segments, false],
  ] as [number, boolean][]) {
    const base = position.length / 3
    for (let i = 0; i < n; i++) {
      const src = (end * n + i) * 3
      position.push(position[src], position[src + 1], position[src + 2])
      uv.push(0, perim[i] / total)
    }
    for (const f of faces) {
      if (flip) index.push(base + f[0], base + f[1], base + f[2])
      else index.push(base + f[2], base + f[1], base + f[0])
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(position, 3))
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  geo.setIndex(index)
  geo.computeVertexNormals()
  return geo
}

/* ------------------------------------------------------------------ */
/* misc                                                                */
/* ------------------------------------------------------------------ */

export function mergeAll(geos: THREE.BufferGeometry[]) {
  const merged = mergeGeometries(geos, false)
  geos.forEach((g) => g.dispose())
  if (!merged) throw new Error('mergeGeometries failed')
  return merged
}

export function transformed(geo: THREE.BufferGeometry, m: THREE.Matrix4) {
  return geo.clone().applyMatrix4(m)
}

/** Adds circumferential fluting to a cylinder, as on a watch crown. */
export function fluteCylinder(geo: THREE.BufferGeometry, flutes: number, depth: number) {
  const pos = geo.attributes.position as THREE.BufferAttribute
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const r = Math.hypot(v.x, v.z)
    if (r < 1e-4) continue
    const a = Math.atan2(v.z, v.x)
    const k = 1 + Math.pow(Math.abs(Math.sin(a * flutes * 0.5)), 0.7) * depth
    pos.setXYZ(i, v.x * k, v.y, v.z * k)
  }
  pos.needsUpdate = true
  geo.computeVertexNormals()
  return geo
}
