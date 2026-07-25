import * as THREE from 'three'
import {
  chamferedPrism,
  fillet,
  fluteCylinder,
  insetPolygon,
  mergeAll,
  roundedRect,
  strapSection,
  strapStitchRows,
  sweepGeometry,
  transformed,
  V2,
} from './geometry'
import {
  getCaseBrushed,
  getDial,
  getGuilloche,
  getLeather,
  getLinkBrushed,
  getSunrayAnisotropy,
} from './assets'
import {
  bezelProfile,
  caseHeightFor,
  caseProfile,
  crystalProfile,
  DIAL_RADIUS,
  DIAL_Y,
} from './caseProfile'
import { METALS, type WatchSpec } from './watchSpecs'

/** Dial-plane direction: 0 turns = 12 o'clock, increasing clockwise. */
const dirAt = (turns: number) => {
  const a = turns * Math.PI * 2
  return { x: Math.sin(a), z: -Math.cos(a), a }
}

function repeated(tex: THREE.Texture, x: number, y: number) {
  const t = tex.clone()
  t.repeat.set(x, y)
  t.needsUpdate = true
  return t
}

type Ctx = {
  R: number
  H: number
  spec: WatchSpec
  track: <T extends THREE.BufferGeometry | THREE.Material | THREE.Texture>(x: T) => T
  add: (
    geo: THREE.BufferGeometry,
    mat: THREE.Material,
    setup?: (m: THREE.Mesh) => void,
  ) => THREE.Mesh
  polished: THREE.Material
  caseMat: THREE.Material
}

/**
 * Builds a complete wristwatch out of primitives — case, bezel, sapphire,
 * dial, applied indices, hands, crown and band. Units are centimetres and
 * the caseback rests on y = 0.
 */
export function buildWatch(spec: WatchSpec) {
  const R = spec.diameter / 20
  const H = caseHeightFor(R)
  const group = new THREE.Group()
  const disposables: { dispose(): void }[] = []

  const track = <T extends THREE.BufferGeometry | THREE.Material | THREE.Texture>(x: T) => {
    disposables.push(x)
    return x
  }

  const add: Ctx['add'] = (geo, mat, setup) => {
    const mesh = new THREE.Mesh(track(geo), mat)
    mesh.castShadow = true
    mesh.receiveShadow = true
    setup?.(mesh)
    group.add(mesh)
    return mesh
  }

  /* ---------------- materials ---------------- */

  const metal = METALS[spec.metal]
  const brushed = getCaseBrushed()

  const caseMat = track(
    new THREE.MeshPhysicalMaterial({
      color: metal.color,
      metalness: 1,
      roughness: metal.roughness,
      roughnessMap: track(repeated(brushed.roughnessMap, 6, 1)),
      normalMap: track(repeated(brushed.normalMap, 6, 1)),
      normalScale: new THREE.Vector2(0.22, 0.22),
      envMapIntensity: 1.1,
    }),
  )

  const polished = track(
    new THREE.MeshPhysicalMaterial({
      color: metal.color,
      metalness: 1,
      roughness: 0.1,
      envMapIntensity: 1.15,
    }),
  )

  const handColor = spec.handMetal === 'blued' ? '#3a5aa6' : METALS[spec.handMetal].color
  const handMat = track(
    new THREE.MeshPhysicalMaterial({
      color: handColor,
      metalness: 1,
      roughness: spec.handMetal === 'blued' ? 0.15 : 0.07,
      envMapIntensity: 1.35,
    }),
  )

  const secondsMat = track(
    new THREE.MeshPhysicalMaterial({
      color: spec.secondsAccent,
      metalness: 0.3,
      roughness: 0.2,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      envMapIntensity: 1.1,
    }),
  )

  const lumeMat = spec.lume
    ? track(
        new THREE.MeshPhysicalMaterial({
          color: spec.lume,
          metalness: 0,
          roughness: 0.6,
          emissive: new THREE.Color(spec.lume),
          emissiveIntensity: 0.06,
          clearcoat: 0.55,
          clearcoatRoughness: 0.3,
        }),
      )
    : null

  const crystalMat = track(
    new THREE.MeshPhysicalMaterial({
      color: '#ffffff',
      metalness: 0,
      roughness: 0.02,
      transmission: 1,
      thickness: R * 0.3,
      ior: 1.76,
      attenuationColor: new THREE.Color('#d9ecf5'),
      attenuationDistance: 6,
      // anti-reflective coating on both faces: very little bounces back
      specularIntensity: 0.42,
      specularColor: new THREE.Color('#cfe4ff'),
      envMapIntensity: 0.85,
      transparent: true,
    }),
  )

  const dialMaps = getDial(spec.dial)
  const dialMat = track(
    new THREE.MeshPhysicalMaterial({
      map: dialMaps.map,
      metalnessMap: dialMaps.metalnessMap,
      roughnessMap: dialMaps.roughnessMap,
      metalness: 1,
      roughness: 1,
      clearcoat: spec.dial.finish === 'lacquer' ? 1 : 0.3,
      clearcoatRoughness: spec.dial.finish === 'lacquer' ? 0.03 : 0.3,
      envMapIntensity: 1.05,
    }),
  )
  if (spec.dial.finish === 'sunray') {
    dialMat.anisotropy = 0.9
    dialMat.anisotropyMap = getSunrayAnisotropy()
  }
  if (spec.dial.finish === 'guilloche') {
    dialMat.normalMap = getGuilloche()
    dialMat.normalScale = new THREE.Vector2(1.7, 1.7)
  }

  const ctx: Ctx = { R, H, spec, track, add, polished, caseMat }

  /* ---------------- case & bezel ---------------- */

  add(new THREE.LatheGeometry(caseProfile(R, H), 168), caseMat)
  add(new THREE.LatheGeometry(bezelProfile(R, H), 168), polished)

  /* ---------------- sapphire ---------------- */

  add(new THREE.LatheGeometry(crystalProfile(R, H), 168), crystalMat, (m) => {
    m.castShadow = false
    m.receiveShadow = false
    m.renderOrder = 2
  })

  /* ---------------- dial ---------------- */

  const dialY = DIAL_Y(H)
  const dialGeo = new THREE.CircleGeometry(DIAL_RADIUS(R), 168)
  dialGeo.rotateX(-Math.PI / 2)
  dialGeo.translate(0, dialY, 0)
  add(dialGeo, dialMat, (m) => {
    m.castShadow = false
  })

  /* ---------------- applied indices ---------------- */

  const idxOuter = 0.655 * R
  const idxLen = 0.3 * R
  const idxHalfW = 0.038 * R
  const idxH = 0.05 * R
  const idxChamfer = idxHalfW * 0.28

  const indexPoly = roundedRect(idxLen / 2, idxHalfW, idxHalfW * 0.4, 3)
  const baseIndex = chamferedPrism(indexPoly, {
    height: idxH,
    chamferTop: idxChamfer,
    chamferRise: idxH * 0.42,
  })
  const baseLume = chamferedPrism(insetPolygon(indexPoly, idxChamfer * 1.2), {
    height: idxH * 0.05,
  })

  const indexGeos: THREE.BufferGeometry[] = []
  const lumeGeos: THREE.BufferGeometry[] = []
  const lay = new THREE.Matrix4().makeRotationX(-Math.PI / 2)

  const placeIndex = (turns: number, lateral: number, scale = 1) => {
    const { x, z, a } = dirAt(turns)
    const r = idxOuter - (idxLen * scale) / 2
    const m = new THREE.Matrix4().makeTranslation(
      x * r - Math.cos(a) * lateral,
      dialY,
      z * r - Math.sin(a) * lateral,
    )
    m.multiply(new THREE.Matrix4().makeRotationY(Math.PI / 2 - a))
    m.multiply(lay)
    if (scale !== 1) m.multiply(new THREE.Matrix4().makeScale(scale, 1, 1))
    indexGeos.push(transformed(baseIndex, m))
    if (lumeMat) {
      lumeGeos.push(
        transformed(
          baseLume,
          m.clone().multiply(new THREE.Matrix4().makeTranslation(0, 0, idxH * 0.98)),
        ),
      )
    }
  }

  // the date aperture takes the place of the three o'clock index
  const dateHour = spec.dial.date ? Math.round(((spec.dial.dateAngle ?? 90) / 360) * 12) : -1
  for (let h = 1; h < 12; h++) {
    if (h === dateHour) continue
    placeIndex(h / 12, 0)
  }
  placeIndex(0, idxHalfW * 1.4, 0.85)
  placeIndex(0, -idxHalfW * 1.4, 0.85)
  baseIndex.dispose()
  baseLume.dispose()

  // Applied indices are mirror-polished but tiny, so a touch of roughness keeps
  // them reading as gold rather than as black cut-outs on a pale dial.
  const indexMat = track(
    new THREE.MeshPhysicalMaterial({
      color: metal.color,
      metalness: 1,
      roughness: 0.16,
      envMapIntensity: 1.35,
    }),
  )
  add(mergeAll(indexGeos), indexMat)

  /* ---------------- hands ---------------- */

  const handOutline = (
    length: number,
    halfW: number,
    tail: number,
    style: 'dauphine' | 'baton',
  ): THREE.Vector2[] =>
    style === 'dauphine'
      ? [
          V2(-tail, halfW * 0.34),
          V2(0.04 * length, halfW),
          V2(0.62 * length, halfW * 0.56),
          V2(length, halfW * 0.14),
          V2(length + halfW * 0.55, 0),
          V2(length, -halfW * 0.14),
          V2(0.62 * length, -halfW * 0.56),
          V2(0.04 * length, -halfW),
          V2(-tail, -halfW * 0.34),
        ]
      : [
          V2(-tail, halfW * 0.5),
          V2(0.02 * length, halfW * 0.84),
          V2(0.88 * length, halfW * 0.84),
          V2(length, halfW * 0.4),
          V2(length, -halfW * 0.4),
          V2(0.88 * length, -halfW * 0.84),
          V2(0.02 * length, -halfW * 0.84),
          V2(-tail, -halfW * 0.5),
        ]

  const handGeo = (length: number, halfW: number, tail: number, thickness: number) =>
    chamferedPrism(handOutline(length, halfW, tail, spec.hands), {
      height: thickness,
      insetTop: (ps) => ps.map((p) => V2(p.x * 0.985, p.y * 0.52)),
      chamferRise: thickness * 0.62,
    })

  /** Luminous inlay sunk into the top facet — what makes a hand readable. */
  const handLume = (length: number, halfW: number) => {
    const w = halfW * 0.36
    const pts =
      spec.hands === 'dauphine'
        ? [
            V2(0.1 * length, w),
            V2(0.62 * length, w * 0.62),
            V2(0.92 * length, w * 0.2),
            V2(0.92 * length, -w * 0.2),
            V2(0.62 * length, -w * 0.62),
            V2(0.1 * length, -w),
          ]
        : [
            V2(0.08 * length, w),
            V2(0.88 * length, w),
            V2(0.94 * length, w * 0.45),
            V2(0.94 * length, -w * 0.45),
            V2(0.88 * length, -w),
            V2(0.08 * length, -w),
          ]
    return chamferedPrism(pts, { height: halfW * 0.06 })
  }

  const orient = (turns: number, y: number) => {
    const a = turns * Math.PI * 2
    const m = new THREE.Matrix4().makeTranslation(0, y, 0)
    m.multiply(new THREE.Matrix4().makeRotationY(Math.PI / 2 - a))
    m.multiply(lay)
    return m
  }

  const HOUR = 10
  const MINUTE = 9
  const SECOND = 36
  const hourTurns = ((HOUR % 12) + MINUTE / 60) / 12
  const minuteTurns = (MINUTE + SECOND / 60) / 60
  const secondTurns = SECOND / 60

  const hands: [number, number, number, number][] = [
    [0.465 * R, 0.053 * R, 0.1 * R, dialY + 0.02 * R],
    [0.7 * R, 0.042 * R, 0.11 * R, dialY + 0.048 * R],
  ]
  const handTurns = [hourTurns, minuteTurns]
  const lumeParts: THREE.BufferGeometry[] = []
  hands.forEach(([length, halfW, tail, y], i) => {
    const thickness = halfW * 0.5
    const body = handGeo(length, halfW, tail, thickness)
    add(transformed(body, orient(handTurns[i], y)), handMat)
    body.dispose()
    if (lumeMat) {
      const inlay = handLume(length, halfW)
      lumeParts.push(transformed(inlay, orient(handTurns[i], y + thickness * 0.96)))
      inlay.dispose()
    }
  })

  const secDir = dirAt(secondTurns)
  const secBar = chamferedPrism(
    [
      V2(-0.185 * R, 0.012 * R),
      V2(0.7 * R, 0.005 * R),
      V2(0.7 * R, -0.005 * R),
      V2(-0.185 * R, -0.012 * R),
    ],
    { height: 0.014 * R },
  )
  const weight = new THREE.CylinderGeometry(0.042 * R, 0.042 * R, 0.014 * R, 40)
  const secGeos = [
    transformed(secBar, orient(secondTurns, dialY + 0.074 * R)),
    transformed(
      weight,
      new THREE.Matrix4().makeTranslation(
        secDir.x * -0.112 * R,
        dialY + 0.081 * R,
        secDir.z * -0.112 * R,
      ),
    ),
  ]
  secBar.dispose()
  weight.dispose()
  add(mergeAll(secGeos), secondsMat)

  const hub = new THREE.CylinderGeometry(0.036 * R, 0.044 * R, 0.036 * R, 56)
  hub.translate(0, dialY + 0.078 * R, 0)
  add(hub, polished)

  if (lumeMat && lumeGeos.length + lumeParts.length > 0) {
    add(mergeAll([...lumeGeos, ...lumeParts]), lumeMat, (m) => {
      m.castShadow = false
    })
  }

  /* ---------------- crown ---------------- */

  const crownLen = 0.13 * R
  const crownR = 0.115 * R
  const crownPts = fillet(
    [
      V2(0, 0),
      V2(crownR * 0.8, 0),
      V2(crownR, crownLen * 0.24),
      V2(crownR, crownLen * 0.76),
      V2(crownR * 0.76, crownLen),
      V2(0, crownLen),
    ],
    [0, crownR * 0.24, crownR * 0.2, crownR * 0.2, crownR * 0.26, 0],
    4,
  )
  const crown = new THREE.LatheGeometry(crownPts, 112)
  fluteCylinder(crown, 24, 0.08)
  crown.rotateZ(-Math.PI / 2)
  crown.translate(R * 0.99, 0.4 * H, 0)
  add(crown, caseMat)

  const tube = new THREE.CylinderGeometry(crownR * 0.6, crownR * 0.66, 0.07 * R, 44)
  tube.rotateZ(-Math.PI / 2)
  tube.translate(R * 0.975, 0.4 * H, 0)
  add(tube, polished)

  /* ---------------- band ---------------- */

  if (spec.band.kind === 'bracelet') buildBracelet(ctx, spec.band.metal)
  else buildLugsAndStrap(ctx, spec.band.color, spec.band.stitch)

  return {
    group,
    radius: R,
    height: H,
    dispose: () => disposables.forEach((d) => d.dispose()),
  }
}

/* ------------------------------------------------------------------ */
/* bands                                                               */
/* ------------------------------------------------------------------ */

function bandCurve(points: number[][]) {
  return new THREE.CatmullRomCurve3(
    points.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
    false,
    'centripetal',
    0.5,
  )
}

function frameAt(curve: THREE.Curve<THREE.Vector3>, t: number) {
  const p = curve.getPointAt(t)
  const T = curve.getTangentAt(t).normalize()
  const S = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), T).normalize()
  if (S.lengthSq() < 1e-6) S.set(1, 0, 0)
  const U = new THREE.Vector3().crossVectors(T, S).normalize()
  return { p, T, S, U }
}

function buildBracelet({ R, H, add, track, polished }: Ctx, metalId: keyof typeof METALS) {
  const metal = METALS[metalId]
  const brushed = getLinkBrushed()
  const linkMat = track(
    new THREE.MeshPhysicalMaterial({
      color: metal.color,
      metalness: 1,
      roughness: 0.3,
      roughnessMap: brushed.roughnessMap,
      normalMap: brushed.normalMap,
      normalScale: new THREE.Vector2(0.3, 0.3),
      envMapIntensity: 1.3,
    }),
  )

  const thickness = 0.12 * R
  const curve = bandCurve([
    [0, 0.4 * H, -0.96 * R],
    [0, 0.385 * H, -1.3 * R],
    [0, 0.315 * H, -1.66 * R],
    [0, 0.215 * H, -2.02 * R],
    [0, 0.13 * H, -2.44 * R],
    [0, thickness / 2, -2.98 * R],
    [0, thickness / 2, -3.7 * R],
    [0, thickness / 2, -4.6 * R],
  ])

  const COUNT = 16
  const linkPitch = curve.getLength() / COUNT
  const centres: THREE.BufferGeometry[] = []
  const outers: THREE.BufferGeometry[] = []

  for (let i = 0; i < COUNT; i++) {
    const t = (i + 0.5) / COUNT
    const { p, T, S, U } = frameAt(curve, t)
    const taper = 1 - 0.24 * t
    const halfW = 0.52 * R * taper
    const halfL = linkPitch * 0.485
    const th = thickness * (1 - 0.16 * t)

    const basis = new THREE.Matrix4().makeBasis(T, S, U)
    basis.setPosition(p.x - U.x * th * 0.5, p.y - U.y * th * 0.5, p.z - U.z * th * 0.5)

    centres.push(
      transformed(
        chamferedPrism(roundedRect(halfL, halfW * 0.44, halfL * 0.25, 3), {
          height: th,
          chamferTop: th * 0.18,
          chamferBottom: th * 0.16,
        }),
        basis,
      ),
    )

    for (const sign of [-1, 1]) {
      const poly = roundedRect(halfL, halfW * 0.26, halfL * 0.25, 3).map((q) =>
        V2(q.x, q.y + sign * halfW * 0.735),
      )
      outers.push(
        transformed(
          chamferedPrism(poly, {
            height: th,
            chamferTop: th * 0.17,
            chamferBottom: th * 0.15,
          }),
          basis,
        ),
      )
    }
  }

  const mirror = new THREE.Matrix4().makeRotationY(Math.PI)
  const bothSides = (geos: THREE.BufferGeometry[]) =>
    mergeAll([...geos, ...geos.map((g) => transformed(g, mirror))])

  add(bothSides(centres), polished)
  add(bothSides(outers), linkMat)
}

function buildLugsAndStrap({ R, H, add, track, caseMat }: Ctx, color: string, stitch: string) {
  const strapHalf = 0.5 * R
  const lugWidth = 0.3 * R
  const lugOffset = strapHalf + lugWidth / 2

  // Side profile of a lug: swept outward from the case flank, curling down.
  const lugGeo = chamferedPrism(
    [
      V2(0.56 * R, 0.63 * H),
      V2(0.92 * R, 0.55 * H),
      V2(1.11 * R, 0.39 * H),
      V2(1.185 * R, 0.19 * H),
      V2(1.17 * R, 0.085 * H),
      V2(1.085 * R, 0.105 * H),
      V2(1.045 * R, 0.23 * H),
      V2(0.9 * R, 0.33 * H),
      V2(0.56 * R, 0.35 * H),
    ],
    { height: lugWidth, chamferTop: lugWidth * 0.13, chamferBottom: lugWidth * 0.13 },
  )
  lugGeo.translate(0, 0, -lugWidth / 2)
  lugGeo.rotateY(Math.PI / 2)

  const flip = new THREE.Matrix4().makeRotationY(Math.PI)
  const lugs: THREE.BufferGeometry[] = []
  for (const sx of [-1, 1]) {
    const t = new THREE.Matrix4().makeTranslation(sx * lugOffset, 0, 0)
    lugs.push(transformed(lugGeo, t))
    lugs.push(transformed(lugGeo, flip.clone().multiply(t)))
  }
  lugGeo.dispose()
  add(mergeAll(lugs), caseMat)

  const halfThick = 0.082 * R
  const section = strapSection(R)
  const leather = getLeather(color, stitch, strapStitchRows())
  const strapMat = track(
    new THREE.MeshPhysicalMaterial({
      map: leather.map,
      normalMap: leather.normalMap,
      roughnessMap: leather.roughnessMap,
      normalScale: new THREE.Vector2(1.15, 1.15),
      roughness: 1,
      metalness: 0,
      clearcoat: 0.3,
      clearcoatRoughness: 0.42,
      sheen: 0.4,
      sheenRoughness: 0.55,
      sheenColor: new THREE.Color('#9a7550'),
    }),
  )

  const curve = bandCurve([
    [0, 0.33 * H, -0.7 * R],
    [0, 0.3 * H, -1.12 * R],
    [0, 0.255 * H, -1.56 * R],
    [0, 0.195 * H, -2.0 * R],
    [0, 0.13 * H, -2.46 * R],
    [0, halfThick, -3.05 * R],
    [0, halfThick, -3.85 * R],
    [0, halfThick, -4.8 * R],
  ])

  const strap = sweepGeometry(
    curve,
    section,
    140,
    (t) => new THREE.Vector2(1 - 0.2 * t, 1 - 0.28 * t),
  )
  add(strap, strapMat)
  add(transformed(strap, flip), strapMat)
}
