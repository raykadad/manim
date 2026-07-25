/**
 * Buildings: mass, facade, fenestration, cornice, fire escape, roofscape.
 *
 * Each lot keeps its footprint across all six eras — what changes is the
 * cladding, the windows, what is bolted to the roof and what has been painted
 * on the side wall. That continuity is what makes the transition read as one
 * place ageing rather than six unrelated streets.
 */

import * as THREE from 'three';
import { BLOCK } from './layout.js';
import { box, plane, cyl, cone, sphere, tiledBox, tiledPlane, meshOf, tag, extrude } from './kit.js';
import { makeStandard, makeGlass, makeEmissive, makeGlow, makeFoliage, makeChrome, makeHologram } from '../gfx/materials.js';
import {
  brickTexture,
  stoneTexture,
  plasterTexture,
  concreteTexture,
  metalPanelTexture,
  windowSheetTexture,
  curtainWallTexture,
  ghostSignTexture,
  graffitiTexture,
  muralTexture,
  adTexture,
  leafTexture,
  glowTexture,
  screenTexture
} from '../gfx/textures.js';
import { makeRng } from '../util/rng.js';

/* ------------------------------------------------------------------ */
/*  Shared per-era material pool                                       */
/* ------------------------------------------------------------------ */

/**
 * Height of the shopfront storey. Single-storey buildings get a taller,
 * more generous ground floor; taller buildings keep a normal one.
 */
export function groundFloorHeight(spec) {
  if (spec.kind === 'parking') return 0;
  if ((spec.floors || 1) <= 1) return Math.min(4.8, spec.h * 0.68);
  return Math.min(4.4, Math.max(3.5, spec.h * 0.42));
}

export function makePool(field) {
  const map = new Map();
  return {
    get(key, factory) {
      if (!map.has(key)) map.set(key, factory());
      return map.get(key);
    },
    field,
    size: () => map.size,
    dispose() {
      for (const m of map.values()) m.dispose?.();
      map.clear();
    }
  };
}

function wallMaterial(pool, wall, year) {
  const key = `wall|${JSON.stringify(wall)}|${year}`;
  return pool.get(key, () => {
    let map;
    const seed = year + (wall.color?.length || 0) * 7;
    switch (wall.type) {
      case 'stone':
        map = stoneTexture({ color: wall.color, grime: wall.grime, seed });
        break;
      case 'plaster':
        map = plasterTexture({ color: wall.color, grime: wall.grime, seed, crackLevel: wall.crackLevel ?? 0.3 });
        break;
      case 'concrete':
        map = concreteTexture({ color: wall.color, grime: wall.grime, seed });
        break;
      case 'panel':
        map = metalPanelTexture({ color: wall.color, grime: wall.grime, seed, ribs: 0 });
        break;
      case 'metal':
        map = metalPanelTexture({ color: wall.color, grime: wall.grime, seed, ribs: 8 });
        break;
      default:
        map = brickTexture({ color: wall.color, grime: wall.grime, seed, painted: wall.painted || null });
    }
    return makeStandard(pool.field, {
      map,
      roughness: wall.type === 'metal' || wall.type === 'panel' ? 0.45 : 0.94,
      metalness: wall.type === 'metal' ? 0.55 : wall.type === 'panel' ? 0.2 : 0
    });
  });
}

function flat(pool, color, opts = {}) {
  return pool.get(`flat|${color}|${JSON.stringify(opts)}`, () =>
    makeStandard(pool.field, { color: new THREE.Color(color), roughness: 0.85, ...opts })
  );
}

function glassMat(pool, color, opts = {}) {
  return pool.get(`glass|${color}|${JSON.stringify(opts)}`, () =>
    makeGlass(pool.field, { color: new THREE.Color(color), roughness: 0.08, opacity: 0.55, transparent: true, ...opts })
  );
}

function emissiveMat(pool, color, intensity = 1.4) {
  return pool.get(`emis|${color}|${intensity}`, () => makeEmissive(pool.field, { color, intensity }));
}

/* ------------------------------------------------------------------ */
/*  Windows                                                            */
/* ------------------------------------------------------------------ */

function buildWindow(pool, era, spec, w, h, rng, floorIdx) {
  const g = new THREE.Group();
  const win = spec.windows;
  const frameMat = flat(pool, win.frame || '#3a332a', { roughness: 0.7 });
  const isLit = rng.chance(win.litChance ?? 0.2);
  const glass = isLit
    ? emissiveMat(pool, spec.tenant?.interior?.warm || '#ffd9a0', win.smart ? 1.5 : 0.85)
    : glassMat(pool, win.glass || '#2a323c', { opacity: win.smart ? 0.75 : 0.62, roughness: win.smart ? 0.05 : 0.12 });

  if (win.style === 'arched') {
    const shape = [
      [-w / 2, -h / 2],
      [w / 2, -h / 2],
      [w / 2, h * 0.16],
      [0, h / 2],
      [-w / 2, h * 0.16]
    ];
    const frame = extrude(shape, 0.16, frameMat, 0);
    g.add(frame);
    const inner = extrude(shape.map(([x, y]) => [x * 0.82, y * 0.85]), 0.1, glass);
    inner.position.z = 0.06;
    g.add(inner);
  } else if (win.style === 'strip') {
    g.add(box(frameMat, w, h, 0.14));
    g.add(box(glass, w * 0.94, h * 0.82, 0.1, 0, 0, 0.05));
    g.add(box(frameMat, w, 0.05, 0.16, 0, 0, 0.03));
  } else if (win.style === 'industrial') {
    g.add(box(frameMat, w, h, 0.12));
    g.add(box(glass, w * 0.95, h * 0.92, 0.08, 0, 0, 0.04));
    for (let i = 1; i < 4; i++) g.add(box(frameMat, 0.045, h * 0.92, 0.11, -w / 2 + (w / 4) * i, 0, 0.06));
    for (let i = 1; i < 3; i++) g.add(box(frameMat, w * 0.95, 0.045, 0.11, 0, -h / 2 + (h / 3) * i, 0.06));
  } else {
    // classic double-hung sash
    g.add(box(frameMat, w + 0.14, h + 0.14, 0.12));
    g.add(box(glass, w, h, 0.08, 0, 0, 0.04));
    g.add(box(frameMat, w + 0.06, 0.07, 0.13, 0, 0, 0.05));
    g.add(box(frameMat, 0.06, h, 0.13, 0, 0, 0.05));
    // stone sill + lintel
    g.add(box(flat(pool, spec.cornice?.color || '#9b8a70'), w + 0.5, 0.12, 0.3, 0, -h / 2 - 0.12, 0.08));
    g.add(box(flat(pool, spec.cornice?.color || '#9b8a70'), w + 0.4, 0.16, 0.22, 0, h / 2 + 0.14, 0.05));
  }

  // era-specific window furniture
  if (win.boarded && rng.chance(win.boarded)) {
    const ply = flat(pool, '#6b5a44', { roughness: 1 });
    g.add(box(ply, w * 1.02, h * 1.02, 0.06, 0, 0, 0.09));
    for (let i = 0; i < 3; i++) {
      const s = box(flat(pool, '#4f4234'), w * 1.05, 0.09, 0.02, 0, -h / 3 + (i * h) / 3, 0.13);
      s.rotation.z = rng.range(-0.03, 0.03);
      g.add(s);
    }
  } else if (win.bars) {
    const bar = flat(pool, '#2b2b2b', { metalness: 0.6, roughness: 0.6 });
    for (let i = 0; i <= 4; i++) g.add(box(bar, 0.045, h, 0.045, -w / 2 + (w / 4) * i, 0, 0.14));
    g.add(box(bar, w, 0.045, 0.045, 0, 0, 0.14));
  }
  if (win.acUnits && rng.chance(win.acUnits) && floorIdx > 0) {
    const ac = box(flat(pool, '#b8b4a8', { metalness: 0.3, roughness: 0.6 }), w * 0.52, 0.34, 0.42, 0, -h / 2 + 0.2, 0.22);
    ac.castShadow = true;
    g.add(ac);
    g.add(box(flat(pool, '#6f6d66'), w * 0.5, 0.26, 0.03, 0, -h / 2 + 0.2, 0.44));
  }
  if (win.farm) {
    const foliage = pool.get('farmleaf', () => makeFoliage(pool.field, { map: leafTexture({ color: '#4f9c5c', seed: 3 }), color: '#8ad89a' }));
    for (let i = 0; i < 3; i++) {
      const l = plane(foliage, w * 0.36, h * 0.36, -w / 4 + (i * w) / 4, -h * 0.18, 0.14);
      g.add(l);
    }
    g.add(box(emissiveMat(pool, '#ff8fd0', 1.8), w * 0.9, 0.05, 0.05, 0, h * 0.3, 0.12));
  }

  return { group: g, lit: isLit };
}

/* ------------------------------------------------------------------ */
/*  Roofscape                                                          */
/* ------------------------------------------------------------------ */

function roofProps(pool, era, spec, tags, w, d, h, rng, out) {
  const year = era.year;
  const add = (o) => out.add(o);
  const metal = flat(pool, '#7d7a72', { metalness: 0.6, roughness: 0.55 });
  const darkMetal = flat(pool, '#3c3f42', { metalness: 0.5, roughness: 0.65 });
  const wood = flat(pool, '#6b543c', { roughness: 1 });

  for (const t of tags) {
    switch (t) {
      case 'watertank': {
        const g = new THREE.Group();
        const r = Math.min(1.5, w * 0.16);
        const legH = 1.9;
        for (let i = 0; i < 4; i++) {
          const a = (i / 4) * Math.PI * 2 + 0.6;
          g.add(box(wood, 0.14, legH, 0.14, Math.cos(a) * r * 0.75, legH / 2, Math.sin(a) * r * 0.75));
        }
        const tank = cyl(wood, r, 2.5, 0, legH + 1.25, 0, 14);
        tank.castShadow = true;
        g.add(tank);
        g.add(cone(flat(pool, '#4f4235'), r * 1.05, 0.7, 0, legH + 2.85, 0, 14));
        for (let i = 0; i < 3; i++) g.add(cyl(darkMetal, r * 1.02, 0.07, 0, legH + 0.5 + i * 0.85, 0, 14));
        g.position.set(w * 0.22, h, -d * 0.2);
        tag(g, year, 'Rooftop water tank', 'Gravity tank on a timber cradle — the reason pre-war blocks have plumbing above the fifth floor.');
        add(g);
        break;
      }
      case 'chimney': {
        const brick = pool.get('chimbrick', () =>
          makeStandard(pool.field, { map: brickTexture({ color: '#6f4335', grime: 0.6, seed: 88, rows: 10 }), roughness: 0.95 })
        );
        const c = meshOf(tiledBox(0.9, 2.4, 0.9, 1.4), brick, -w * 0.3, h + 1.2, -d * 0.3);
        c.castShadow = true;
        add(c);
        add(box(flat(pool, '#3a3833'), 1.05, 0.14, 1.05, -w * 0.3, h + 2.45, -d * 0.3));
        break;
      }
      case 'ac_units': {
        for (let i = 0; i < 3; i++) {
          const g = new THREE.Group();
          const bw = rng.range(1.1, 1.9);
          const bx = box(flat(pool, '#9c9a92', { metalness: 0.35, roughness: 0.6 }), bw, 0.9, bw * 0.8);
          bx.castShadow = true;
          g.add(bx);
          const fan = cyl(darkMetal, bw * 0.3, 0.08, 0, 0.48, 0, 12);
          g.add(fan);
          g.position.set(rng.range(-w * 0.35, w * 0.35), h + 0.45, rng.range(-d * 0.35, d * 0.1));
          g.rotation.y = rng.range(0, Math.PI);
          add(g);
        }
        break;
      }
      case 'hvac': {
        const g = new THREE.Group();
        const unit = box(flat(pool, '#b0aea6', { metalness: 0.4, roughness: 0.5 }), 3.4, 1.5, 2.2, 0, 0.75, 0);
        unit.castShadow = true;
        g.add(unit);
        for (let i = 0; i < 2; i++) {
          g.add(cyl(darkMetal, 0.45, 0.24, -0.8 + i * 1.6, 1.6, 0, 14));
          g.add(cyl(flat(pool, '#5f6266'), 0.4, 0.06, -0.8 + i * 1.6, 1.74, 0, 10));
        }
        g.add(box(metal, 0.7, 1.1, 0.7, 1.9, 0.55, 0.9));
        g.position.set(-w * 0.15, h, d * 0.05);
        tag(g, year, 'Packaged rooftop unit', 'Sheet-metal air handling — the machine that replaced the operable window.');
        add(g);
        break;
      }
      case 'sat_dish': {
        const g = new THREE.Group();
        g.add(cyl(darkMetal, 0.07, 1.2, 0, 0.6, 0, 8));
        const dish = new THREE.Mesh(new THREE.SphereGeometry(0.85, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2.6), flat(pool, '#d8d4c8'));
        dish.rotation.x = Math.PI * 0.72;
        dish.position.y = 1.25;
        dish.castShadow = true;
        g.add(dish);
        g.add(cyl(darkMetal, 0.05, 0.7, 0, 1.5, 0.5, 6));
        g.position.set(rng.range(-w * 0.3, w * 0.3), h, -d * 0.3);
        g.rotation.y = rng.range(-0.8, 0.8);
        tag(g, year, 'Satellite dish', 'Two metres of C-band conviction, bolted to a parapet in a hurry.');
        add(g);
        break;
      }
      case 'cell': {
        const g = new THREE.Group();
        const mast = cyl(darkMetal, 0.11, 3.6, 0, 1.8, 0, 8);
        g.add(mast);
        for (let i = 0; i < 3; i++) {
          const a = (i / 3) * Math.PI * 2;
          const panel = box(flat(pool, '#d8d6d0'), 0.16, 1.3, 0.34, Math.cos(a) * 0.55, 3.0, Math.sin(a) * 0.55);
          panel.rotation.y = -a;
          g.add(panel);
        }
        g.add(box(flat(pool, '#8d8b84'), 1.2, 0.9, 0.8, 1.2, 0.45, 0.4));
        g.position.set(w * 0.3, h, -d * 0.34);
        tag(g, year, 'Cellular sector antennas', 'Three panels at 120° — the roofline rent nobody notices.');
        add(g);
        break;
      }
      case 'antenna_tv': {
        for (let i = 0; i < 4; i++) {
          const g = new THREE.Group();
          g.add(cyl(metal, 0.035, 2.4, 0, 1.2, 0, 6));
          for (let j = 0; j < 6; j++) {
            const len = 1.5 - j * 0.14;
            g.add(box(metal, 0.025, 0.025, len, 0, 1.5 + j * 0.16, 0));
          }
          g.position.set(rng.range(-w * 0.4, w * 0.4), h, rng.range(-d * 0.4, d * 0.2));
          g.rotation.y = rng.range(0, Math.PI);
          add(g);
        }
        break;
      }
      case 'antenna_wire': {
        const g = new THREE.Group();
        g.add(cyl(wood, 0.06, 3, 0, 1.5, 0, 6));
        g.position.set(w * 0.35, h, -d * 0.3);
        add(g);
        break;
      }
      case 'antenna_laser': {
        const g = new THREE.Group();
        g.add(cyl(darkMetal, 0.09, 2.6, 0, 1.3, 0, 8));
        g.add(sphere(emissiveMat(pool, era.accent2, 3), 0.22, 0, 2.7, 0, 10));
        const beam = cyl(pool.get('beamMat', () => makeGlow({ color: era.accent2, opacity: 0.16 })), 0.05, 40, 0, 22, 0, 6);
        g.add(beam);
        g.position.set(-w * 0.28, h, -d * 0.3);
        add(g);
        break;
      }
      case 'solar': {
        const panelMat = pool.get('solarpanel', () =>
          makeStandard(pool.field, { color: '#16233a', metalness: 0.65, roughness: 0.22 })
        );
        const rows = Math.max(2, Math.floor(w / 3));
        for (let i = 0; i < rows; i++) {
          const g = new THREE.Group();
          const p = box(panelMat, 2.4, 0.08, 1.3);
          p.rotation.x = -0.42;
          p.castShadow = true;
          g.add(p);
          g.add(box(darkMetal, 0.08, 0.5, 0.08, -1, -0.25, 0.4));
          g.add(box(darkMetal, 0.08, 0.5, 0.08, 1, -0.25, 0.4));
          g.position.set(-w / 2 + 1.6 + i * 2.7, h + 0.55, -d * 0.25);
          add(g);
        }
        tag(out, year, 'Rooftop photovoltaics', 'Retrofit array — the cheapest thing you can bolt to a 120-year-old parapet.');
        break;
      }
      case 'garden': {
        const soil = flat(pool, '#3f3227', { roughness: 1 });
        const foliage = pool.get('roofleaf', () => makeFoliage(pool.field, { map: leafTexture({ color: '#4f8a3c', seed: 12 }), color: '#8fc06a' }));
        for (let i = 0; i < 5; i++) {
          const g = new THREE.Group();
          g.add(box(flat(pool, '#7d6a52'), 2.2, 0.5, 1, 0, 0.25, 0));
          g.add(box(soil, 2.05, 0.12, 0.86, 0, 0.5, 0));
          for (let j = 0; j < 3; j++) {
            const bush = plane(foliage, 0.9, 0.9, -0.7 + j * 0.7, 0.9, 0);
            bush.userData.billboard = true;
            g.add(bush);
          }
          g.position.set(rng.range(-w * 0.36, w * 0.36), h, rng.range(-d * 0.36, d * 0.1));
          g.rotation.y = rng.range(-0.4, 0.4);
          add(g);
        }
        break;
      }
      case 'planter_roof': {
        const foliage = pool.get('roofleaf2', () => makeFoliage(pool.field, { map: leafTexture({ color: '#548f45', seed: 22 }), color: '#9ccf78' }));
        for (let i = 0; i < 4; i++) {
          const g = new THREE.Group();
          g.add(box(flat(pool, '#8a7f6a'), 1.4, 0.45, 0.8, 0, 0.22, 0));
          const bush = plane(foliage, 1.1, 1, 0, 0.8, 0);
          bush.userData.billboard = true;
          g.add(bush);
          g.position.set(-w / 2 + 1.4 + i * (w / 4), h, -d * 0.1);
          add(g);
        }
        break;
      }
      case 'turbine': {
        const g = new THREE.Group();
        g.add(cyl(metal, 0.12, 3.2, 0, 1.6, 0, 8));
        const rotor = new THREE.Group();
        for (let i = 0; i < 3; i++) {
          const bladeShape = [
            [0, 0],
            [0.1, 1.6],
            [-0.1, 1.6]
          ];
          const b = extrude(bladeShape, 0.06, flat(pool, '#d8dce0', { metalness: 0.4, roughness: 0.35 }));
          b.rotation.z = (i / 3) * Math.PI * 2;
          rotor.add(b);
        }
        rotor.position.y = 3.3;
        rotor.userData.spin = 2.4;
        g.add(rotor);
        g.position.set(w * 0.3, h, -d * 0.3);
        out.userData.spinners = out.userData.spinners || [];
        out.userData.spinners.push(rotor);
        tag(g, year, 'Vertical-axis turbine', 'Roof-mounted micro wind. Loud in a gale, invisible in the accounts.');
        add(g);
        break;
      }
      case 'holo_ring': {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(Math.min(w, d) * 0.28, 0.07, 8, 40),
          emissiveMat(pool, era.accent, 2.2)
        );
        ring.rotation.x = Math.PI / 2;
        ring.position.set(0, h + 1.6, -d * 0.12);
        ring.userData.hover = { base: h + 1.6, amp: 0.28, speed: 0.7 };
        out.userData.hoverers = out.userData.hoverers || [];
        out.userData.hoverers.push(ring);
        add(ring);
        const glow = plane(makeGlow({ color: era.accent, map: glowTexture(era.accent, 0.6), opacity: 0.16 }), 7, 7, 0, h + 1.6, -d * 0.12);
        glow.userData.billboard = true;
        add(glow);
        break;
      }
      case 'drone_pad':
      case 'vertipad': {
        const g = new THREE.Group();
        const pad = cyl(flat(pool, '#22282f', { roughness: 0.7 }), 2.4, 0.16, 0, 0.08, 0, 20);
        g.add(pad);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.06, 6, 32), emissiveMat(pool, era.accent2 || '#7dffb0', 2.6));
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.2;
        g.add(ring);
        for (let i = 0; i < 4; i++) {
          const a = (i / 4) * Math.PI * 2;
          g.add(box(emissiveMat(pool, '#ff5dc8', 2.2), 0.5, 0.05, 0.12, Math.cos(a) * 1.5, 0.2, Math.sin(a) * 1.5));
        }
        g.position.set(0, h + 0.1, -d * 0.15);
        tag(g, year, 'Vertipad', 'Charge ring, beacon lamps and a painted circle. The whole of aviation, domesticated.');
        add(g);
        break;
      }
      case 'skybridge': {
        const g = new THREE.Group();
        const deck = box(flat(pool, '#8d939a', { metalness: 0.5, roughness: 0.4 }), 3, 0.3, 14, 0, 0, -7);
        g.add(deck);
        const tube = new THREE.Mesh(
          new THREE.CylinderGeometry(1.5, 1.5, 14, 12, 1, true),
          glassMat(pool, '#8fd8e8', { opacity: 0.28, side: THREE.DoubleSide })
        );
        tube.rotation.x = Math.PI / 2;
        tube.position.set(0, 1.4, -7);
        g.add(tube);
        g.position.set(0, h - 4, -d / 2);
        add(g);
        break;
      }
      case 'clothesline': {
        const lineMat = pool.get('lineMat', () => new THREE.LineBasicMaterial({ color: 0x9a9384 }));
        const pts = [new THREE.Vector3(-w * 0.35, h + 1.4, -d * 0.2), new THREE.Vector3(w * 0.35, h + 1.2, -d * 0.2)];
        const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat);
        add(line);
        for (let i = 0; i < 5; i++) {
          const t = (i + 0.5) / 5;
          const c = plane(
            flat(pool, ['#d8d2c0', '#c8a2a2', '#a2b8c8', '#e0d4a8'][i % 4], { side: THREE.DoubleSide }),
            0.5,
            0.8,
            -w * 0.35 + t * w * 0.7,
            h + 0.9,
            -d * 0.2
          );
          c.userData.flutter = { base: c.rotation.z, amp: 0.12, speed: 1.4 + i * 0.3 };
          out.userData.flutterers = out.userData.flutterers || [];
          out.userData.flutterers.push(c);
          add(c);
        }
        add(cyl(metal, 0.04, 1.6, -w * 0.35, h + 0.8, -d * 0.2, 6));
        add(cyl(metal, 0.04, 1.6, w * 0.35, h + 0.7, -d * 0.2, 6));
        break;
      }
      case 'pigeons': {
        const bird = flat(pool, '#5f5c58');
        for (let i = 0; i < 7; i++) {
          const b = new THREE.Group();
          b.add(sphere(bird, 0.09, 0, 0, 0, 6));
          b.add(sphere(bird, 0.055, 0, 0.07, 0.08, 6));
          b.position.set(rng.range(-w / 2 + 0.4, w / 2 - 0.4), h + (spec.cornice?.h || 0.5) + 0.1, -d / 2 + 0.12);
          b.rotation.y = rng.range(-0.6, 0.6);
          b.userData.bob = { phase: rng.range(0, 6.28) };
          out.userData.bobbers = out.userData.bobbers || [];
          out.userData.bobbers.push(b);
          add(b);
        }
        break;
      }
      case 'flagpole': {
        add(cyl(flat(pool, '#c8c4b8'), 0.06, 5, 0, h + 2.5, -d * 0.1, 8));
        const flag = plane(flat(pool, '#b8323a', { side: THREE.DoubleSide }), 1.6, 0.9, 0.8, h + 4.4, -d * 0.1);
        flag.userData.flutter = { base: 0, amp: 0.1, speed: 2.1 };
        out.userData.flutterers = out.userData.flutterers || [];
        out.userData.flutterers.push(flag);
        add(flag);
        break;
      }
      case 'skylight': {
        for (let i = 0; i < 3; i++) {
          const g = new THREE.Group();
          const gl = box(glassMat(pool, '#a8c8d8', { opacity: 0.35 }), 2.2, 0.3, 1.6);
          g.add(gl);
          g.add(box(flat(pool, '#6b6860'), 2.4, 0.14, 1.8, 0, -0.15, 0));
          g.position.set(-w / 3 + i * (w / 3), h + 0.2, -d * 0.15);
          add(g);
        }
        break;
      }
      case 'vent': {
        for (let i = 0; i < 3; i++) {
          const g = new THREE.Group();
          g.add(cyl(metal, 0.24, 0.9, 0, 0.45, 0, 10));
          g.add(cyl(metal, 0.34, 0.16, 0, 0.98, 0, 10));
          g.position.set(rng.range(-w * 0.35, w * 0.35), h, rng.range(-d * 0.3, d * 0.2));
          add(g);
        }
        break;
      }
      case 'steam': {
        out.userData.steamVents = out.userData.steamVents || [];
        out.userData.steamVents.push(new THREE.Vector3(rng.range(-w * 0.3, w * 0.3), h + 1, -d * 0.2));
        break;
      }
      case 'deck':
      case 'rooftopbar': {
        const g = new THREE.Group();
        g.add(box(flat(pool, '#8a7355', { roughness: 1 }), w * 0.6, 0.1, d * 0.4, 0, 0.05, 0));
        for (let i = 0; i < 4; i++) {
          const t = new THREE.Group();
          t.add(cyl(flat(pool, '#3f4348'), 0.05, 0.7, 0, 0.35, 0, 8));
          t.add(cyl(flat(pool, '#d8d2c0'), 0.42, 0.06, 0, 0.7, 0, 12));
          t.position.set(-w * 0.22 + i * (w * 0.15), 0.1, rng.range(-d * 0.12, d * 0.12));
          g.add(t);
        }
        if (t === 'rooftopbar') {
          const lights = pool.get('stringlight', () => makeEmissive(pool.field, { color: '#ffd9a0', intensity: 3 }));
          for (let i = 0; i < 12; i++) {
            g.add(sphere(lights, 0.07, -w * 0.28 + i * (w * 0.05), 1.9 + Math.sin(i * 0.7) * 0.2, -d * 0.18, 6));
          }
        }
        g.position.set(0, h + 0.05, d * 0.1);
        add(g);
        break;
      }
      case 'parked_cars':
        out.userData.roofParking = { y: h + 0.1, w, d };
        break;
      case 'lightpole': {
        for (let i = 0; i < 3; i++) {
          const g = new THREE.Group();
          g.add(cyl(darkMetal, 0.07, 3, 0, 1.5, 0, 8));
          g.add(box(emissiveMat(pool, '#e8eef0', 2), 0.7, 0.12, 0.3, 0, 3, 0));
          g.position.set(-w / 3 + i * (w / 3), h, 0);
          add(g);
        }
        break;
      }
      case 'mister': {
        out.userData.misters = out.userData.misters || [];
        out.userData.misters.push(new THREE.Vector3(0, h + 0.4, -d * 0.3));
        break;
      }
      case 'googie_spire': {
        const g = new THREE.Group();
        const pole = cyl(makeChrome(pool.field), 0.14, 6, 0, 3, 0, 10);
        g.add(pole);
        const star = new THREE.Mesh(new THREE.OctahedronGeometry(1.1, 0), emissiveMat(pool, era.accent, 2.4));
        star.position.y = 6.4;
        star.userData.spin = 0.7;
        out.userData.spinners = out.userData.spinners || [];
        out.userData.spinners.push(star);
        g.add(star);
        for (let i = 0; i < 3; i++) {
          const ring = new THREE.Mesh(new THREE.TorusGeometry(1.5 + i * 0.4, 0.05, 6, 24), emissiveMat(pool, era.accent2, 2));
          ring.rotation.x = Math.PI / 2 + i * 0.3;
          ring.position.y = 6.4;
          g.add(ring);
        }
        g.position.set(-w * 0.3, h, -d * 0.1);
        tag(g, year, 'Googie spire', 'Sputnik on a stick. Pure 1958 confidence, still legal in 1965.');
        add(g);
        break;
      }
      case 'starburst': {
        const g = new THREE.Group();
        const c = sphere(emissiveMat(pool, era.accent, 3), 0.3, 0, 0, 0, 10);
        g.add(c);
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2;
          const len = i % 2 ? 0.8 : 1.5;
          const spike = box(emissiveMat(pool, era.accent2, 2.4), 0.06, len, 0.06, (Math.cos(a) * len) / 2, (Math.sin(a) * len) / 2, 0);
          spike.rotation.z = a - Math.PI / 2;
          g.add(spike);
        }
        g.position.set(w * 0.3, h + 1.6, -d / 2 - 0.2);
        add(g);
        break;
      }
      case 'martini': {
        const g = new THREE.Group();
        const glassShape = [
          [-0.7, 0],
          [0.7, 0],
          [0.06, -1],
          [-0.06, -1]
        ];
        const cupMat = emissiveMat(pool, '#5d9dff', 2.6);
        g.add(extrude(glassShape, 0.08, cupMat));
        g.add(box(cupMat, 0.06, 0.6, 0.08, 0, -1.3, 0));
        g.add(box(cupMat, 0.8, 0.07, 0.08, 0, -1.6, 0));
        g.add(sphere(emissiveMat(pool, '#8ef07a', 3), 0.12, 0.25, -0.25, 0.04, 8));
        g.position.set(0, h + 2.2, -d / 2 - 0.3);
        add(g);
        break;
      }
      default:
        break;
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Main builder                                                       */
/* ------------------------------------------------------------------ */

export function buildBuilding(era, lot, spec, pool, { neighborL = 0, neighborR = 0, seed = 1 } = {}) {
  const rng = makeRng(seed * 977 + era.year);
  const g = new THREE.Group();
  const w = lot.x1 - lot.x0;
  const d = lot.depth;
  const h = spec.h;
  const year = era.year;
  const isPark = spec.kind === 'park' || spec.kind === 'lot' || spec.kind === 'yard';

  if (isPark) {
    g.userData.openLot = true;
    return { group: g, w, d, h: spec.h, open: true };
  }

  const wallMat = wallMaterial(pool, spec.wall, year);

  /* --------------------------------------------------------- main mass */
  const body = meshOf(tiledBox(w, h, d, 3.4), wallMat, 0, h / 2, -d / 2);
  body.castShadow = true;
  body.receiveShadow = true;
  g.add(body);

  /* base course / plinth */
  if (spec.base) {
    const baseH = spec.kind === 'parking' ? 0.8 : 1.05;
    const bm = flat(pool, spec.base.color, { roughness: 0.8, metalness: spec.base.refaced === 'aluminium' ? 0.6 : 0 });
    const plinth = meshOf(tiledBox(w + 0.16, baseH, d + 0.08, 2), bm, 0, baseH / 2, -d / 2);
    plinth.castShadow = true;
    plinth.receiveShadow = true;
    g.add(plinth);
  }

  /* --------------------------------------------------------- cornice */
  const corn = spec.cornice;
  if (corn && corn.style !== 'none') {
    const cm = flat(pool, corn.color, { roughness: 0.85 });
    if (corn.style === 'classical') {
      g.add(meshOf(tiledBox(w + 0.7, corn.h * 0.55, d + 0.35, 2), cm, 0, h + corn.h * 0.28, -d / 2));
      g.add(meshOf(tiledBox(w + 0.35, corn.h * 0.45, d + 0.18, 2), cm, 0, h + corn.h * 0.78, -d / 2));
      // dentils under the crown
      const dm = flat(pool, corn.color, { roughness: 0.9 });
      const n = Math.floor(w / 0.55);
      for (let i = 0; i < n; i++) {
        g.add(box(dm, 0.26, 0.22, 0.2, -w / 2 + 0.28 + i * 0.55, h - 0.16, -0.06));
      }
    } else if (corn.style === 'dentil') {
      g.add(meshOf(tiledBox(w + 0.45, corn.h, d + 0.22, 2), cm, 0, h + corn.h / 2, -d / 2));
      const n = Math.floor(w / 0.6);
      for (let i = 0; i < n; i++) g.add(box(cm, 0.28, 0.2, 0.24, -w / 2 + 0.3 + i * 0.6, h - 0.12, -0.02));
    } else if (corn.style === 'swoop') {
      const swoop = extrude(
        [
          [-w / 2, 0],
          [w / 2, 0],
          [w / 2, corn.h * 0.5],
          [w * 0.1, corn.h],
          [-w / 2, corn.h * 0.62]
        ],
        d * 0.35,
        cm
      );
      swoop.position.set(0, h, -d * 0.16);
      g.add(swoop);
    } else {
      g.add(meshOf(tiledBox(w + 0.3, corn.h, d + 0.15, 2), cm, 0, h + corn.h / 2, -d / 2));
    }
    // parapet behind the cornice
    g.add(meshOf(tiledBox(w, 0.7, d, 2), wallMat, 0, h + corn.h + 0.35, -d / 2));
  }

  /* ------------------------------------------------------ fenestration */
  const win = spec.windows || {};
  const floors = spec.floors || 1;
  const groundH = groundFloorHeight(spec);
  const upperH = h - groundH;
  const litWindows = [];

  if (win.style && win.style !== 'none' && floors > 1) {
    const cols = win.cols || 4;
    const fh = upperH / (floors - (spec.kind === 'parking' ? 0 : 1));
    const ww = Math.min((w / cols) * 0.52, 1.5);
    const wh = Math.min(fh * 0.56, 2.1);
    const startFloor = spec.kind === 'parking' ? 0 : 1;

    for (let f = startFloor; f < floors; f++) {
      const y = groundH + (f - startFloor) * fh + fh * 0.52;
      for (let c = 0; c < cols; c++) {
        const x = -w / 2 + (w / cols) * (c + 0.5);
        if (win.style === 'openramp') {
          // parking deck: a long slot rather than punched windows
          if (c === 0) {
            const slot = box(flat(pool, '#14171a'), w - 1.6, fh * 0.5, 0.4, 0, y, 0.02);
            g.add(slot);
            const railing = box(flat(pool, '#8d8b84', { metalness: 0.4 }), w - 1.6, 0.1, 0.14, 0, y - fh * 0.24, 0.16);
            g.add(railing);
            if (rng.chance(win.litChance)) {
              const lamp = box(emissiveMat(pool, '#e8eec8', 1.6), 0.5, 0.08, 0.1, rng.range(-w / 3, w / 3), y + fh * 0.2, 0.1);
              g.add(lamp);
            }
          }
          continue;
        }
        const { group: wg, lit } = buildWindow(pool, era, spec, ww, wh, rng, f);
        wg.position.set(x, y, 0.06);
        g.add(wg);
        if (lit) litWindows.push(wg);

        // 2025 juliet balconies
        if (win.balcony && rng.chance(win.balcony) && f > 1) {
          const bal = new THREE.Group();
          const rail = flat(pool, '#3f4348', { metalness: 0.6, roughness: 0.45 });
          bal.add(box(rail, ww + 0.5, 0.06, 0.06, 0, 0.5, 0.5));
          bal.add(box(rail, ww + 0.5, 0.06, 0.06, 0, 0.05, 0.5));
          for (let b = 0; b <= 5; b++) bal.add(box(rail, 0.04, 0.5, 0.04, -(ww + 0.5) / 2 + b * ((ww + 0.5) / 5), 0.28, 0.5));
          bal.add(box(flat(pool, '#9c9a92'), ww + 0.6, 0.08, 0.55, 0, 0, 0.28));
          bal.position.set(x, y - wh / 2, 0.1);
          g.add(bal);
        }
      }
      // string course between floors
      if (spec.wall.type !== 'panel' && f < floors - 1 && rng.chance(0.5)) {
        g.add(box(flat(pool, corn?.color || '#93825f'), w + 0.16, 0.1, 0.14, 0, groundH + (f - startFloor + 1) * fh, 0.04));
      }
    }
  }

  /* side walls: cheap painted windows where a flank is exposed */
  const sheet = (litChance, seed2) =>
    pool.get(`sheet|${spec.wall.color}|${litChance}|${seed2}`, () =>
      makeStandard(pool.field, {
        map: windowSheetTexture({
          wall: spec.wall.painted || spec.wall.color,
          frame: win.frame || '#33291f',
          glass: win.glass || '#26303a',
          lit: spec.tenant?.interior?.warm || '#ffd9a0',
          litChance,
          cols: 3,
          rows: 4,
          seed: seed2,
          grime: spec.wall.grime
        }),
        roughness: 0.92
      })
    );

  for (const side of [-1, 1]) {
    const nb = side < 0 ? neighborL : neighborR;
    const exposed = h - nb;
    if (exposed > 2.5 && spec.kind !== 'station') {
      const sh = exposed;
      const p = meshOf(tiledPlane(d * 0.92, sh, 4.5), sheet(win.litChance ?? 0.18, seed + side), (side * w) / 2 + side * 0.02, nb + sh / 2, -d / 2);
      p.rotation.y = (side * Math.PI) / 2;
      p.receiveShadow = true;
      g.add(p);
    }
  }

  /* ---------------------------------------------------------- wall art */
  if (spec.wallArt) {
    const art = spec.wallArt;
    const side = lot.x1 > 20 || lot.x0 > -6 ? 1 : -1;
    const nb = side < 0 ? neighborL : neighborR;
    const artH = art.h || 8;
    const artY = Math.max(nb + artH / 2 + 0.5, h * (art.y ?? 0.5));
    let mat = null;
    let aw = Math.min(d * 0.7, artH * 1.1);
    if (art.type === 'ghost') {
      mat = pool.get(`ghost|${art.text}`, () =>
        makeStandard(pool.field, {
          map: ghostSignTexture({ text: art.text, sub: art.sub, ink: art.ink }),
          transparent: true,
          roughness: 1,
          depthWrite: false
        })
      );
    } else if (art.type === 'graffiti') {
      mat = pool.get(`graf|${art.words.join()}`, () =>
        makeStandard(pool.field, {
          map: graffitiTexture({ words: art.words, seed: seed + 3 }),
          transparent: true,
          roughness: 1,
          depthWrite: false
        })
      );
      aw = artH * 2;
    } else if (art.type === 'mural') {
      mat = pool.get(`mural|${seed}`, () =>
        makeStandard(pool.field, { map: muralTexture({ seed: seed + 7 }), roughness: 0.95 })
      );
    } else if (art.type === 'ad') {
      mat = pool.get(`wallad|${art.headline}`, () =>
        makeStandard(pool.field, {
          map: adTexture({ headline: art.headline, sub: art.sub, scheme: art.scheme, style: art.style, seed: seed + 11, w: 512, h: 512 }),
          roughness: 0.95
        })
      );
    } else if (art.type === 'holo') {
      mat = pool.get(`holoart|${seed}`, () =>
        makeHologram({
          map: adTexture({ headline: 'KESSLER', sub: 'GREEN', scheme: [era.accent, '#06121a', era.accent2], style: 'holo', emissive: true, w: 512, h: 512 }),
          color: era.accent,
          opacity: 0.8
        })
      );
    }
    if (mat) {
      const art3 = plane(mat, aw, artH, (side * w) / 2 + side * 0.06, artY, -d / 2);
      art3.rotation.y = (side * Math.PI) / 2;
      tag(
        art3,
        year,
        art.type === 'ghost' ? 'Ghost sign' : art.type === 'graffiti' ? 'Wildstyle piece' : art.type === 'mural' ? 'Commissioned mural' : 'Wall advertisement',
        art.type === 'ghost'
          ? 'Lead-based paint on brick, thirty years faded. Nobody has sold dry goods here since 1931.'
          : art.type === 'graffiti'
            ? 'Two crews, one wall, one night. Buffed grey by the landlord within the month.'
            : art.type === 'mural'
              ? 'Arts-council funded, community-consulted, and undeniably good for the rents.'
              : 'Hand-pasted 24-sheet bill. The paste outlives the product.'
      );
      g.add(art3);
    }
  }

  /* ------------------------------------------------------- fire escape */
  if (spec.fireEscape) {
    const fe = new THREE.Group();
    const steel = flat(pool, year <= 1965 ? '#3a3f36' : year <= 2005 ? '#2f322c' : '#454b52', { metalness: 0.55, roughness: 0.6 });
    const floorsFE = Math.max(2, (spec.floors || 3) - 1);
    const fh = (h - groundH) / floorsFE;
    const fw = Math.min(w * 0.42, 4.2);
    for (let f = 0; f < floorsFE; f++) {
      const y = groundH + f * fh + 0.2;
      const deck = box(steel, fw, 0.08, 1.15, 0, y, 0.62);
      deck.castShadow = true;
      fe.add(deck);
      for (let b = 0; b <= 7; b++) fe.add(box(steel, 0.04, 0.9, 0.04, -fw / 2 + b * (fw / 7), y + 0.45, 1.16));
      fe.add(box(steel, fw, 0.05, 0.05, 0, y + 0.9, 1.16));
      fe.add(box(steel, 0.05, 0.9, 0.05, -fw / 2, y + 0.45, 0.08));
      fe.add(box(steel, 0.05, 0.9, 0.05, fw / 2, y + 0.45, 0.08));
      // diagonal stair to the deck above
      if (f < floorsFE - 1) {
        const stair = box(steel, 0.75, 0.06, fh * 1.06, fw * 0.28, y + fh / 2, 0.62);
        stair.rotation.x = Math.PI / 2 - Math.atan2(fh, 1.1) + 0.02;
        stair.rotation.x = -Math.atan2(fh, 1.4);
        fe.add(stair);
      }
      if (rng.chance(0.4)) {
        const junk = box(flat(pool, ['#7d5a3a', '#4a5f6b', '#8a8272'][f % 3]), 0.4, 0.4, 0.4, rng.range(-fw / 3, fw / 3), y + 0.28, 0.6);
        fe.add(junk);
      }
      if (rng.chance(0.3)) {
        const pot = cyl(flat(pool, '#a2634c'), 0.16, 0.24, rng.range(-fw / 3, fw / 3), y + 0.14, 0.9, 8);
        fe.add(pot);
        const leaf = pool.get('feLeaf', () => makeFoliage(pool.field, { map: leafTexture({ color: '#4f7a3c', seed: 44 }), color: '#87b56a' }));
        const b = plane(leaf, 0.5, 0.5, 0, 0.38, 0);
        b.position.copy(pot.position).add(new THREE.Vector3(0, 0.3, 0));
        b.userData.billboard = true;
        fe.add(b);
      }
    }
    // drop ladder
    fe.add(box(steel, 0.5, groundH * 0.55, 0.05, -fw * 0.3, groundH * 0.7, 1.1));
    fe.position.set(w * 0.06, 0, 0.02);
    tag(fe, year, 'Fire escape', 'Mandated after 1911, hated by every landlord since, and the only balcony most tenants will ever get.');
    g.add(fe);
  }

  /* --------------------------------------------------------- green wall */
  if (spec.greenWall) {
    const leafMat = pool.get('greenwall', () =>
      makeFoliage(pool.field, { map: leafTexture({ color: '#3f7a3a', seed: 55 }), color: '#7dc06a' })
    );
    const side = 1;
    const nb = neighborR;
    const gh = Math.max(3, h - nb - 1);
    for (let i = 0; i < 4; i++) {
      const p = plane(leafMat, d * 0.22, gh, (side * w) / 2 + 0.08, nb + gh / 2, -d * 0.15 - i * d * 0.2);
      p.rotation.y = Math.PI / 2;
      g.add(p);
    }
    // vines down the street frontage too
    for (let i = 0; i < 5; i++) {
      const p = plane(leafMat, w * 0.16, h * 0.32, -w / 2 + 0.6 + i * (w / 5), h * 0.66, 0.12);
      g.add(p);
    }
  }

  /* ------------------------------------------------------ farm terraces */
  if (spec.farmTerraces) {
    const leafMat = pool.get('farmwall', () =>
      makeFoliage(pool.field, { map: leafTexture({ color: '#4f9c5c', seed: 66 }), color: '#9ae08a' })
    );
    const trayMat = flat(pool, '#39424f', { metalness: 0.4, roughness: 0.5 });
    const growLight = emissiveMat(pool, '#ff7fd0', 2.6);
    for (let f = 1; f < (spec.floors || 6); f++) {
      const y = (h / spec.floors) * f + 0.4;
      g.add(box(trayMat, w + 0.5, 0.16, 1.2, 0, y, 0.6));
      g.add(box(growLight, w * 0.9, 0.06, 0.08, 0, y + 0.9, 0.95));
      for (let i = 0; i < 5; i++) {
        const p = plane(leafMat, w * 0.18, 0.8, -w / 2 + 0.7 + i * (w / 5), y + 0.5, 0.62);
        g.add(p);
      }
    }
  }

  /* ---------------------------------------------------------- scaffold */
  if (spec.scaffold) {
    const sc = new THREE.Group();
    const pipe = flat(pool, '#a8a08a', { metalness: 0.4, roughness: 0.6 });
    const boards = flat(pool, '#b09668', { roughness: 1 });
    const levels = 3;
    for (let l = 0; l < levels; l++) {
      const y = 2.4 + l * 2.4;
      sc.add(box(boards, w, 0.1, 1.4, 0, y, 0.9));
      sc.add(box(pipe, w, 0.06, 0.06, 0, y + 1, 1.5));
      sc.add(box(pipe, w, 0.06, 0.06, 0, y + 0.5, 1.5));
    }
    for (let i = 0; i <= 4; i++) {
      const x = -w / 2 + i * (w / 4);
      sc.add(box(pipe, 0.08, levels * 2.4 + 1.2, 0.08, x, (levels * 2.4) / 2 + 1.4, 1.5));
      sc.add(box(pipe, 0.08, levels * 2.4 + 1.2, 0.08, x, (levels * 2.4) / 2 + 1.4, 0.25));
    }
    // netting
    sc.add(
      plane(
        pool.get('scaffnet', () =>
          makeStandard(pool.field, { color: '#5a7f4a', transparent: true, opacity: 0.32, side: THREE.DoubleSide, roughness: 1 })
        ),
        w,
        levels * 2.4,
        0,
        (levels * 2.4) / 2 + 1.4,
        1.62
      )
    );
    tag(sc, year, 'Sidewalk scaffold', 'Erected for a facade survey in March. Still here at Christmas.');
    g.add(sc);
  }

  /* ------------------------------------------------------------ roofs */
  if (spec.roof?.length) roofProps(pool, era, spec, spec.roof, w, d, h + (corn?.h || 0) + 0.7, rng, g);

  tag(
    g,
    year,
    spec.tenant?.name || 'Building',
    spec.tenant?.sub ? `${spec.tenant.sub}. ${describeBuilding(spec, era)}` : describeBuilding(spec, era)
  );

  return { group: g, w, d, h, litWindows };
}

function describeBuilding(spec, era) {
  const mat = { brick: 'load-bearing brick', stone: 'limestone', plaster: 'stucco over brick', concrete: 'poured concrete', panel: 'porcelain-enamel panel', metal: 'composite panel' }[
    spec.wall.type
  ];
  const floors = spec.floors || 1;
  return `${floors} ${floors === 1 ? 'storey' : 'storeys'} of ${mat}, ${era.year}.`;
}
