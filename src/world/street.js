/**
 * The ground plane: roadway, kerbs, sidewalks, markings, rail, drains.
 *
 * Rebuilt per era because the surface tells as much of the story as the
 * buildings — granite kerbs and streetcar rail in 1945, tar snakes and worn
 * ladder crossings in 1985, a green bike lane in 2025, no kerb at all in 2055.
 */

import * as THREE from 'three';
import { BLOCK } from './layout.js';
import { box, plane, cyl, tiledPlane, meshOf } from './kit.js';
import { makeStandard, makeEmissive, makeGlow, makePhysical } from '../gfx/materials.js';
import { asphaltTexture, sidewalkTexture, concreteTexture, glowTexture, metalPanelTexture } from '../gfx/textures.js';
import { makeRng } from '../util/rng.js';

const HALF = BLOCK.halfLength;

export function buildStreet(era, field, rngSeed = 1) {
  const g = new THREE.Group();
  g.name = 'street';
  const rng = makeRng(rngSeed + era.year);
  const s = era.street;
  const wet = era.weather?.wetness ?? 0;

  /* ---------------------------------------------------------------- road */
  const roadTex = asphaltTexture({ color: s.asphalt, grime: s.asphaltGrime, seed: era.year, wet });
  const roadMat = makeStandard(field, {
    map: roadTex,
    roughness: THREE.MathUtils.lerp(0.96, 0.24, wet),
    metalness: wet * 0.28,
    color: 0xffffff
  });

  const road = meshOf(tiledPlane(HALF * 2, BLOCK.kerb * 2, 9), roadMat, 0, 0.01, 0);
  road.rotation.x = -Math.PI / 2;
  road.receiveShadow = true;
  g.add(road);

  // cross streets
  for (const cx of BLOCK.crossX) {
    const cross = meshOf(tiledPlane(BLOCK.crossHalfWidth * 2, 150, 9), roadMat, cx, 0.011, 0);
    cross.rotation.x = -Math.PI / 2;
    cross.receiveShadow = true;
    g.add(cross);
  }

  /* ------------------------------------------------------------ sidewalk */
  const walkTex = sidewalkTexture({ color: s.sidewalk, grime: s.sidewalkGrime, seed: era.year + 5 });
  const walkMat = makeStandard(field, {
    map: walkTex,
    roughness: THREE.MathUtils.lerp(0.95, 0.45, wet * 0.7),
    metalness: 0
  });
  const kerbMat = makeStandard(field, {
    map: concreteTexture({ color: s.kerb, grime: s.sidewalkGrime + 0.1, seed: era.year + 9 }),
    roughness: 0.9
  });

  const walkDepth = BLOCK.frontage - BLOCK.kerb + 1.6;
  const walkCenter = (BLOCK.frontage + BLOCK.kerb) / 2 + 0.4;
  const noKerb = s.markings === 'lightstrip';

  for (const sign of [-1, 1]) {
    const walkGeo = tiledPlane(HALF * 2, walkDepth, 4);
    const walk = meshOf(walkGeo, walkMat, 0, BLOCK.sidewalkHeight, sign * walkCenter);
    walk.rotation.x = -Math.PI / 2;
    walk.receiveShadow = true;
    g.add(walk);

    // the vertical face of the sidewalk slab
    const face = box(kerbMat, HALF * 2, BLOCK.sidewalkHeight, 0.35, 0, BLOCK.sidewalkHeight / 2, sign * BLOCK.kerb);
    face.receiveShadow = true;
    face.castShadow = false;
    g.add(face);

    if (!noKerb) {
      // granite kerb stones with visible joints
      const stone = makeStandard(field, {
        map: concreteTexture({ color: s.kerb, grime: 0.5, seed: era.year + 11 }),
        roughness: 0.85
      });
      for (let x = -HALF; x < HALF; x += 3.2) {
        const k = box(stone, 3.05, BLOCK.sidewalkHeight + 0.06, 0.42, x + 1.6, BLOCK.sidewalkHeight / 2 + 0.02, sign * (BLOCK.kerb - 0.02));
        k.receiveShadow = true;
        g.add(k);
      }
    } else {
      // 2055: a flush light strip instead of a kerb
      const strip = new THREE.Mesh(
        tiledPlane(HALF * 2, 0.42, 4),
        makeEmissive(field, { color: s.markingColor, intensity: 1.2 })
      );
      strip.rotation.x = -Math.PI / 2;
      strip.position.set(0, BLOCK.sidewalkHeight + 0.005, sign * BLOCK.kerb);
      g.add(strip);
      const glowStrip = new THREE.Mesh(
        tiledPlane(HALF * 2, 2.2, 4),
        makeGlow({ color: s.markingColor, map: glowTexture(s.markingColor, 0.4), opacity: 0.1 })
      );
      glowStrip.rotation.x = -Math.PI / 2;
      glowStrip.position.set(0, BLOCK.sidewalkHeight + 0.02, sign * BLOCK.kerb);
      g.add(glowStrip);
    }
  }

  /* --------------------------------------------------------- lane paint */
  const paintMat = makeStandard(field, {
    color: new THREE.Color(s.markingColor),
    roughness: 0.7,
    metalness: 0,
    polygonOffset: true,
    polygonOffsetFactor: -2
  });

  const addPaint = (w, d, x, z, mat = paintMat) => {
    const m = plane(mat, w, d, x, 0.028, z);
    m.rotation.x = -Math.PI / 2;
    g.add(m);
    return m;
  };

  if (s.markings === 'dashed-white' || s.markings === 'dashed-yellow') {
    const isDouble = s.markings === 'dashed-yellow';
    for (let x = -HALF; x < HALF; x += 6) {
      if (BLOCK.crossX.some((c) => Math.abs(x - c) < 9)) continue;
      if (isDouble) {
        addPaint(3.4, 0.16, x, -0.22);
        addPaint(3.4, 0.16, x, 0.22);
      } else addPaint(3.2, 0.16, x, 0);
    }
    // kerb-side parking lane edge
    for (const sign of [-1, 1]) {
      for (let x = -HALF; x < HALF; x += 4) {
        if (BLOCK.crossX.some((c) => Math.abs(x - c) < 10)) continue;
        if (rng.chance(0.9)) addPaint(2.4, 0.12, x, sign * (BLOCK.kerb - 2.7));
      }
    }
  } else if (s.markings === 'lightstrip') {
    const lane = makeEmissive(field, { color: s.markingColor, intensity: 1.1 });
    for (let x = -HALF; x < HALF; x += 5) {
      if (BLOCK.crossX.some((c) => Math.abs(x - c) < 9)) continue;
      addPaint(3.0, 0.1, x, 0, lane);
    }
  }

  /* bike lane (2025+) */
  if (s.bikeLane) {
    const bikeMat = makeStandard(field, { color: new THREE.Color(s.bikeLane), roughness: 0.85 });
    for (const sign of [-1, 1]) {
      const lane = plane(bikeMat, HALF * 2, 1.7, 0, 0.024, sign * (BLOCK.kerb - 1.15));
      lane.rotation.x = -Math.PI / 2;
      g.add(lane);
    }
  }

  /* --------------------------------------------------------- crosswalks */
  const crossMat = makeStandard(field, {
    color: new THREE.Color(s.crosswalk === 'projected' ? s.markingColor : '#e2ddce'),
    roughness: 0.75,
    transparent: s.crosswalk.includes('worn') || s.crosswalk.includes('faded'),
    opacity: s.crosswalk.includes('worn') ? 0.55 : s.crosswalk.includes('faded') ? 0.42 : 1
  });
  const crossEmissive = makeEmissive(field, { color: s.markingColor, intensity: 1.0 });

  for (const cx of BLOCK.crossX) {
    const dir = cx > 0 ? -1 : 1;
    const zoneX = cx + dir * (BLOCK.crossHalfWidth + 1.4);
    const bars = s.crosswalk === 'continental' ? 7 : 9;
    for (let i = 0; i < bars; i++) {
      const z = -BLOCK.kerb + 0.6 + (i * (BLOCK.kerb * 2 - 1.2)) / (bars - 1);
      const m = plane(s.crosswalk === 'projected' ? crossEmissive : crossMat, 2.6, s.crosswalk === 'continental' ? 0.6 : 0.42, zoneX, 0.03, z);
      m.rotation.x = -Math.PI / 2;
      if (s.crosswalk.includes('worn') && rng.chance(0.3)) continue;
      g.add(m);
    }
    // stop bar
    const stop = plane(s.crosswalk === 'projected' ? crossEmissive : crossMat, 0.5, BLOCK.kerb - 0.3, cx + dir * (BLOCK.crossHalfWidth + 3.4), 0.03, dir * -(BLOCK.kerb / 2));
    stop.rotation.x = -Math.PI / 2;
    g.add(stop);
  }

  /* mid-block crossing at the theatre */
  if (s.crosswalk !== 'projected') {
    for (let i = 0; i < 8; i++) {
      const z = -BLOCK.kerb + 0.7 + (i * (BLOCK.kerb * 2 - 1.4)) / 7;
      if (s.crosswalk.includes('worn') && rng.chance(0.35)) continue;
      const m = plane(crossMat, 2.2, 0.4, -26, 0.03, z);
      m.rotation.x = -Math.PI / 2;
      g.add(m);
    }
  }

  /* ------------------------------------------------------ streetcar rail */
  if (s.tracks) {
    const railMat = makeStandard(field, { color: '#5c564c', metalness: 0.85, roughness: 0.42 });
    for (const off of [-0.72, 0.72]) {
      const rail = box(railMat, HALF * 2, 0.06, 0.09, 0, 0.045, off);
      rail.receiveShadow = true;
      g.add(rail);
      // the setted stone strip either side of the rail
      const setts = plane(
        makeStandard(field, { map: concreteTexture({ color: '#6b6459', grime: 0.6, seed: 31 }), roughness: 0.95 }),
        HALF * 2,
        0.46,
        0,
        0.02,
        off
      );
      setts.rotation.x = -Math.PI / 2;
      g.add(setts);
    }
  }

  /* ------------------------------------------------ manholes and drains */
  if (s.manholes) {
    const ironMat = makeStandard(field, {
      map: metalPanelTexture({ color: '#4a4741', grime: 0.7, seed: 44, brushed: false }),
      roughness: 0.82,
      metalness: 0.4
    });
    const spots = [
      [-38, 2.4],
      [-6, -2.8],
      [17, 3.1],
      [41, -2.2]
    ];
    for (const [x, z] of spots) {
      const cover = cyl(ironMat, 0.44, 0.05, x, 0.03, z, 16);
      cover.receiveShadow = true;
      g.add(cover);
    }
    for (const sign of [-1, 1]) {
      for (let x = -44; x <= 44; x += 22) {
        const grate = box(ironMat, 1.1, 0.06, 0.42, x, 0.05, sign * (BLOCK.kerb - 0.35));
        g.add(grate);
      }
    }
  }

  /* ------------------------------------------------------ asphalt patches */
  if (s.cobblePatch) {
    const patchMat = makeStandard(field, {
      map: concreteTexture({ color: '#4a453e', grime: 0.7, seed: 61 }),
      roughness: 0.98
    });
    for (let i = 0; i < 7; i++) {
      const p = plane(patchMat, rng.range(2.4, 6), rng.range(1.2, 3), rng.range(-HALF * 0.5, HALF * 0.5), 0.022, rng.range(-5, 5));
      p.rotation.x = -Math.PI / 2;
      p.rotation.z = rng.range(0, Math.PI);
      g.add(p);
    }
  }

  /* ------------------------------------------------------------ puddles */
  if (wet > 0.4) {
    const puddleMat = makePhysical(field, {
      color: '#141821',
      roughness: 0.04,
      metalness: 0.1,
      transparent: true,
      opacity: 0.55,
      clearcoat: 1
    });
    for (let i = 0; i < 12; i++) {
      const w = rng.range(1.6, 5.4);
      const p = plane(puddleMat, w, w * rng.range(0.4, 0.8), rng.range(-56, 56), 0.026, rng.range(-BLOCK.kerb + 1, BLOCK.kerb - 1));
      p.rotation.x = -Math.PI / 2;
      p.rotation.z = rng.range(0, Math.PI);
      g.add(p);
    }
  }

  return g;
}

/** The permanent ground far beyond the block — never dissolves. */
export function buildGround(scene) {
  const mat = new THREE.MeshStandardMaterial({ color: '#2b2b2c', roughness: 1, metalness: 0 });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), mat);
  m.rotation.x = -Math.PI / 2;
  m.position.y = -0.04;
  m.receiveShadow = true;
  m.name = 'ground';
  scene.add(m);
  return { mesh: m, material: mat };
}
