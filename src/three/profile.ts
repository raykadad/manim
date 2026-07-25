import { MathUtils, Vector2 } from 'three'

/**
 * Pure 2D profile maths. Deliberately free of geometry/renderer imports so the
 * page can draw technical sections without pulling in the 3D stack.
 */

export const V2 = (x: number, y: number) => new Vector2(x, y)

/**
 * Rounds the interior corners of a polyline — how the tight, light-catching
 * chamfers of a machined case are described.
 */
export function fillet(points: Vector2[], radii: number[], seg = 5) {
  const out: Vector2[] = [points[0].clone()]
  for (let i = 1; i < points.length - 1; i++) {
    const r = radii[i] ?? 0
    const p = points[i]
    const a = points[i - 1]
    const b = points[i + 1]
    const v1 = a.clone().sub(p)
    const v2 = b.clone().sub(p)
    const l1 = v1.length()
    const l2 = v2.length()
    if (r <= 0 || l1 < 1e-6 || l2 < 1e-6) {
      out.push(p.clone())
      continue
    }
    v1.divideScalar(l1)
    v2.divideScalar(l2)
    const angle = Math.acos(MathUtils.clamp(v1.dot(v2), -1, 1))
    if (angle < 1e-3 || Math.PI - angle < 1e-3) {
      out.push(p.clone())
      continue
    }
    const half = angle / 2
    const t = Math.min(r / Math.tan(half), l1 * 0.49, l2 * 0.49)
    const rr = t * Math.tan(half)
    const t1 = p.clone().addScaledVector(v1, t)
    const t2 = p.clone().addScaledVector(v2, t)
    const bis = v1.clone().add(v2)
    if (bis.lengthSq() < 1e-9) {
      out.push(p.clone())
      continue
    }
    bis.normalize()
    const centre = p.clone().addScaledVector(bis, rr / Math.sin(half))
    const a1 = Math.atan2(t1.y - centre.y, t1.x - centre.x)
    const a2 = Math.atan2(t2.y - centre.y, t2.x - centre.x)
    let d = a2 - a1
    while (d > Math.PI) d -= Math.PI * 2
    while (d < -Math.PI) d += Math.PI * 2
    for (let s = 0; s <= seg; s++) {
      const ang = a1 + d * (s / seg)
      out.push(V2(centre.x + Math.cos(ang) * rr, centre.y + Math.sin(ang) * rr))
    }
  }
  out.push(points[points.length - 1].clone())
  return out
}

export function roundedRect(hw: number, hh: number, r: number, seg = 4) {
  const rr = Math.min(r, hw * 0.999, hh * 0.999)
  const pts: Vector2[] = []
  const corners: [number, number, number][] = [
    [hw - rr, hh - rr, 0],
    [-hw + rr, hh - rr, Math.PI / 2],
    [-hw + rr, -hh + rr, Math.PI],
    [hw - rr, -hh + rr, -Math.PI / 2],
  ]
  for (const [cx, cy, a0] of corners) {
    for (let i = 0; i <= seg; i++) {
      const a = a0 + (i / seg) * (Math.PI / 2)
      pts.push(V2(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr))
    }
  }
  return pts
}

export function signedArea(pts: Vector2[]) {
  let a = 0
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i]
    const q = pts[(i + 1) % pts.length]
    a += p.x * q.y - q.x * p.y
  }
  return a / 2
}

/** Mitre-offsets a polygon inwards by `d`. */
export function insetPolygon(pts: Vector2[], d: number) {
  const n = pts.length
  const out: Vector2[] = []
  for (let i = 0; i < n; i++) {
    const prev = pts[(i - 1 + n) % n]
    const cur = pts[i]
    const next = pts[(i + 1) % n]
    const e1 = cur.clone().sub(prev).normalize()
    const e2 = next.clone().sub(cur).normalize()
    const n1 = V2(-e1.y, e1.x)
    const n2 = V2(-e2.y, e2.x)
    const denom = 1 + n1.dot(n2)
    if (denom < 1e-3) {
      out.push(cur.clone().addScaledVector(n1, d))
      continue
    }
    const m = n1.clone().add(n2).multiplyScalar(1 / denom)
    if (m.length() > 4) m.setLength(4)
    out.push(cur.clone().addScaledVector(m, d))
  }
  return out
}

/** v coordinates of the two stitch lines for a swept strap section. */
export function stitchRowsFor(section: Vector2[], inset: number) {
  const n = section.length
  let total = 0
  const cum: number[] = [0]
  for (let i = 1; i <= n; i++) {
    total += section[i % n].distanceTo(section[i - 1])
    cum.push(total)
  }
  const top = section.map((p, i) => ({ p, i })).filter(({ p }) => p.y > 0)
  const left = top.reduce((a, b) => (b.p.x < a.p.x ? b : a))
  const right = top.reduce((a, b) => (b.p.x > a.p.x ? b : a))
  const f = inset / (right.p.x - left.p.x || 1)
  const vl = cum[left.i] / total
  const vr = cum[right.i] / total
  return [vl + (vr - vl) * f, vr - (vr - vl) * f].sort((a, b) => a - b) as [number, number]
}

/** Cross-section of a strap for a case of radius `R`. */
export const strapSection = (R: number) =>
  roundedRect(0.5 * R, 0.082 * R, 0.082 * R * 0.85, 3)

/** Where the saddle stitching lands in strap UV space (scale independent). */
export const strapStitchRows = () => stitchRowsFor(strapSection(1), 0.5 * 0.15)
