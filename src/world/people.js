/**
 * Pedestrians.
 *
 * Low-poly figures assembled from era outfit recipes: hats and long coats in
 * 1945, bright mod shapes in 1965, leather and volume in 1985, hoodies and
 * cargo in 2005, puffers and phones in 2025, glowing techwear in 2055. A shared
 * walk cycle drives limbs, plus idlers, sitters, dogs and prams.
 */

import * as THREE from 'three';
import { BLOCK } from './layout.js';
import { box, plane, cyl, cone, sphere, tag } from './kit.js';
import { makeStandard, makeEmissive, makeGlow } from '../gfx/materials.js';
import { blobShadowTexture, glowTexture } from '../gfx/textures.js';
import { makeRng } from '../util/rng.js';
import { wrapAround, damp } from '../util/math.js';

const HALF = 62;
const WALK_Y = BLOCK.sidewalkHeight;

function mat(pool, color, opts = {}) {
  return pool.get(`pmat|${color}|${JSON.stringify(opts)}`, () =>
    makeStandard(pool.field, { color: new THREE.Color(color), roughness: 0.88, ...opts })
  );
}
function emis(pool, color, i = 2) {
  return pool.get(`pemis|${color}|${i}`, () => makeEmissive(pool.field, { color, intensity: i }));
}

function pickWeighted(list, rng) {
  const total = list.reduce((a, t) => a + (t.weight || 1), 0);
  let r = rng() * total;
  for (const t of list) {
    r -= t.weight || 1;
    if (r <= 0) return t;
  }
  return list[list.length - 1];
}

/* ------------------------------------------------------------------ */

export function buildPerson(era, outfit, pool, rng) {
  const g = new THREE.Group();
  const skinCol = rng.pick(era.pedestrians.skin);
  const skin = mat(pool, skinCol);
  const top = mat(pool, outfit.top);
  const bottom = mat(pool, outfit.bottom);
  const shoe = mat(pool, '#22242a');
  const isChild = outfit.kind === 'child';
  const scale = isChild ? 0.64 : rng.range(0.94, 1.06);

  const hipY = 0.86;
  const shoulderY = 1.42;

  /* legs */
  const legs = [];
  for (const sz of [-1, 1]) {
    const leg = new THREE.Group();
    const isSkirt = outfit.kind === 'dress' && !isChild;
    if (isSkirt) {
      leg.add(box(skin, 0.13, 0.5, 0.13, 0, -0.25, 0));
    } else {
      leg.add(box(bottom, 0.17, 0.8, 0.19, 0, -0.4, 0));
    }
    leg.add(box(shoe, 0.16, 0.09, 0.3, 0, isSkirt ? -0.54 : -0.84, 0.05));
    leg.position.set(0, hipY, sz * 0.13);
    g.add(leg);
    legs.push(leg);
  }

  /* torso */
  const torso = new THREE.Group();
  const chest = box(top, 0.34, 0.6, 0.24, 0, 0.3, 0);
  torso.add(chest);
  if (outfit.kind === 'dress' && !isChild) {
    const skirt = cone(top, 0.3, 0.5, 0, -0.2, 0, 10);
    skirt.rotation.x = Math.PI;
    torso.add(skirt);
  }
  if (rng.chance(outfit.coat)) {
    const coatCol = era.year <= 1965 ? '#4a4438' : era.year <= 1985 ? '#2b2b30' : era.year <= 2005 ? '#3a4452' : '#1f262b';
    const coat = box(mat(pool, coatCol), 0.39, outfit.kind === 'leather' ? 0.62 : 0.92, 0.29, 0, 0.16, 0);
    torso.add(coat);
    if (outfit.kind === 'puffer') {
      for (let i = 0; i < 4; i++) torso.add(box(mat(pool, outfit.top), 0.4, 0.13, 0.3, 0, 0.5 - i * 0.16, 0));
    }
  }
  if (outfit.kind === 'uniform') {
    torso.add(box(mat(pool, '#c8a24a'), 0.36, 0.06, 0.26, 0, 0.5, 0));
    torso.add(box(mat(pool, '#c8a24a'), 0.06, 0.06, 0.26, -0.12, 0.42, 0));
  }
  if (outfit.kind === 'suit' || outfit.kind === 'business') {
    torso.add(box(mat(pool, era.year <= 1965 ? '#8c2f2a' : '#2b3a52'), 0.06, 0.3, 0.03, 0, 0.36, 0.13));
    torso.add(box(mat(pool, '#f0ece2'), 0.13, 0.3, 0.02, 0, 0.36, 0.125));
  }
  if (outfit.kind === 'techwear' || outfit.kind === 'exosuit') {
    torso.add(box(emis(pool, outfit.glow || era.accent, 2.4), 0.36, 0.03, 0.26, 0, 0.42, 0.01));
    torso.add(box(emis(pool, outfit.glow || era.accent, 2.4), 0.03, 0.5, 0.26, 0.18, 0.3, 0.01));
  }
  if (outfit.kind === 'robot') {
    torso.add(box(mat(pool, '#c8ced4', { metalness: 0.6, roughness: 0.3 }), 0.38, 0.62, 0.28, 0, 0.3, 0));
    torso.add(box(emis(pool, era.accent, 2.6), 0.2, 0.06, 0.03, 0, 0.42, 0.15));
  }
  if (outfit.kind === 'courier') {
    const bag = box(mat(pool, era.year >= 2055 ? '#1f3a34' : '#2f3a3f'), 0.36, 0.44, 0.24, 0, 0.22, -0.22);
    torso.add(bag);
    torso.add(box(emis(pool, era.accent, 1.8), 0.2, 0.14, 0.02, 0, 0.28, -0.35));
  }
  torso.position.y = hipY;
  g.add(torso);

  /* arms */
  const arms = [];
  for (const sz of [-1, 1]) {
    const arm = new THREE.Group();
    const sleeve = box(top, 0.11, 0.56, 0.13, 0, -0.28, 0);
    arm.add(sleeve);
    arm.add(sphere(skin, 0.06, 0, -0.58, 0, 6));
    arm.position.set(0, shoulderY, sz * 0.22);
    g.add(arm);
    arms.push(arm);
  }

  /* head */
  const head = new THREE.Group();
  head.add(box(skin, 0.15, 0.11, 0.15, 0, -0.06, 0));
  const skull = sphere(skin, 0.115, 0, 0.08, 0, 10);
  skull.scale.set(1, 1.14, 1);
  head.add(skull);
  const hairCol = rng.pick(['#2b1f18', '#4a3222', '#6b5236', '#8a7a52', '#1a1a1c', '#a8a29a']);
  const hair = sphere(mat(pool, hairCol), 0.12, 0, 0.1, -0.01, 10);
  hair.scale.set(1.02, outfit.kind === 'bighair' ? 1.5 : 1.05, 1.02);
  head.add(hair);
  if (outfit.kind === 'bighair') {
    hair.scale.set(1.5, 1.5, 1.5);
  }
  if (outfit.hat === 'fedora') {
    head.add(cyl(mat(pool, outfit.hatColor), 0.19, 0.02, 0, 0.16, 0, 12));
    head.add(cyl(mat(pool, outfit.hatColor), 0.115, 0.13, 0, 0.23, 0, 12));
    head.add(cyl(mat(pool, '#2b2320'), 0.118, 0.03, 0, 0.18, 0, 12));
  } else if (outfit.hat === 'trilby') {
    head.add(cyl(mat(pool, outfit.hatColor), 0.16, 0.02, 0, 0.16, 0, 12));
    head.add(cyl(mat(pool, outfit.hatColor), 0.11, 0.11, 0, 0.22, 0, 12));
  } else if (outfit.hat === 'pillbox') {
    head.add(cyl(mat(pool, outfit.hatColor), 0.1, 0.09, 0.01, 0.2, 0, 12));
    head.add(plane(mat(pool, '#2b2320', { transparent: true, opacity: 0.5, side: THREE.DoubleSide }), 0.2, 0.12, 0, 0.12, 0.08));
  } else if (outfit.hat === 'newsboy' || outfit.hat === 'cap' || outfit.hat === 'trucker' || outfit.hat === 'beanie') {
    head.add(sphere(mat(pool, outfit.hatColor), 0.12, 0, 0.11, 0, 10));
    if (outfit.hat !== 'beanie') head.add(box(mat(pool, outfit.hatColor), 0.16, 0.02, 0.12, 0, 0.09, 0.13));
    if (outfit.hat === 'trucker') head.add(box(mat(pool, '#f0ece2'), 0.16, 0.09, 0.02, 0, 0.13, 0.11));
  } else if (outfit.hat === 'visor') {
    const v = box(emis(pool, outfit.hatColor, 2.2), 0.2, 0.05, 0.05, 0, 0.06, 0.11);
    head.add(v);
    head.add(box(mat(pool, '#1c2028', { metalness: 0.5 }), 0.22, 0.09, 0.04, 0, 0.06, 0.1));
  } else if (outfit.hat === 'hood') {
    const hood = sphere(mat(pool, outfit.hatColor), 0.15, 0, 0.08, -0.03, 10);
    hood.scale.set(1, 1.1, 1.15);
    head.add(hood);
  }
  head.position.y = shoulderY + 0.16;
  g.add(head);

  /* accessory */
  const acc = rng.pick(era.pedestrians.accessories);
  const accGroup = new THREE.Group();
  switch (acc) {
    case 'briefcase':
      accGroup.add(box(mat(pool, '#4a3524'), 0.1, 0.3, 0.4, 0, -0.62, 0));
      break;
    case 'newspaper':
      accGroup.add(box(mat(pool, '#d8d2c0'), 0.04, 0.28, 0.22, 0.06, -0.5, 0));
      break;
    case 'shoppingbag':
    case 'totebag':
      accGroup.add(box(mat(pool, acc === 'totebag' ? '#c8bca4' : '#8a6a4a'), 0.16, 0.3, 0.28, 0, -0.66, 0));
      break;
    case 'umbrella':
    case 'umbrella-light': {
      const u = new THREE.Group();
      u.add(cyl(mat(pool, '#2b2b2b'), 0.02, 0.9, 0, 0, 0, 6));
      const canopy = cone(acc === 'umbrella-light' ? emis(pool, era.accent, 1.4) : mat(pool, '#22262e', { side: THREE.DoubleSide }), 0.55, 0.32, 0, 0.5, 0, 12);
      u.add(canopy);
      u.position.set(0, -0.1, 0);
      accGroup.add(u);
      break;
    }
    case 'boombox':
      accGroup.add(box(mat(pool, '#2b2b30'), 0.18, 0.28, 0.55, 0, -0.5, 0));
      accGroup.add(cyl(mat(pool, '#1a1a1c'), 0.09, 0.03, 0.1, -0.5, 0.16, 10));
      accGroup.add(cyl(mat(pool, '#1a1a1c'), 0.09, 0.03, 0.1, -0.5, -0.16, 10));
      break;
    case 'walkman':
    case 'ipod':
    case 'earbuds':
      accGroup.add(box(mat(pool, acc === 'ipod' ? '#f2f2ee' : '#c8c2b0'), 0.07, 0.11, 0.04, 0.1, -0.3, 0));
      break;
    case 'flipphone':
    case 'phone':
    case 'holopad': {
      const p = box(acc === 'holopad' ? emis(pool, era.accent, 1.8) : mat(pool, '#22242a'), 0.05, 0.13, 0.08, 0.12, -0.34, 0.08);
      accGroup.add(p);
      if (acc === 'holopad') {
        const halo = plane(pool.get('holopadglow', () => makeGlow({ color: era.accent, map: glowTexture(era.accent, 0.6), opacity: 0.45 })), 0.5, 0.5, 0.14, -0.24, 0.1);
        accGroup.add(halo);
      }
      break;
    }
    case 'coffeecup':
      accGroup.add(cyl(mat(pool, '#e8e2d0'), 0.045, 0.13, 0.1, -0.36, 0.06, 10));
      accGroup.add(cyl(mat(pool, '#8a6a4a'), 0.048, 0.02, 0.1, -0.29, 0.06, 10));
      break;
    case 'transistor':
      accGroup.add(box(mat(pool, '#c8452f'), 0.06, 0.12, 0.08, 0.1, -0.32, 0.06));
      break;
    case 'deliverybag':
      accGroup.add(box(mat(pool, era.year >= 2055 ? '#1f3a34' : '#2f6b4a'), 0.34, 0.4, 0.3, 0, 0.2, -0.26));
      break;
    case 'skateboard':
      accGroup.add(box(mat(pool, '#6b4a2a'), 0.18, 0.04, 0.7, 0, -0.6, 0));
      break;
    case 'yogamat':
      accGroup.add(cyl(mat(pool, '#5fd6a4'), 0.07, 0.5, 0, -0.5, -0.18, 10));
      break;
    case 'balloon': {
      const b = new THREE.Group();
      b.add(sphere(mat(pool, '#c8452f'), 0.13, 0, 0.9, 0, 10));
      b.add(cyl(mat(pool, '#e8e2d0'), 0.005, 0.8, 0, 0.45, 0, 4));
      accGroup.add(b);
      break;
    }
    default:
      break;
  }
  if (accGroup.children.length) {
    accGroup.position.copy(arms[1].position);
    g.add(accGroup);
  }

  /* contact shadow */
  const sh = plane(
    pool.get('pshadow', () => makeGlow({ color: '#000000', map: blobShadowTexture(), opacity: 0.45, depthWrite: false })),
    0.9,
    0.9,
    0,
    0.02,
    0
  );
  sh.rotation.x = -Math.PI / 2;
  sh.material.blending = THREE.NormalBlending;
  g.add(sh);

  if (outfit.glow) {
    const rim = plane(
      pool.get(`pglow|${outfit.glow}`, () => makeGlow({ color: outfit.glow, map: glowTexture(outfit.glow, 0.4), opacity: 0.2 })),
      1.6,
      2.4,
      0,
      1,
      0
    );
    rim.userData.billboard = true;
    g.add(rim);
  }

  g.scale.setScalar(scale);
  g.traverse((o) => {
    if (o.isMesh && o.geometry?.type !== 'PlaneGeometry') o.castShadow = true;
  });
  tag(g, era.year, describeOutfit(outfit, era), outfitNote(outfit, era, acc));
  return { group: g, legs, arms, head, torso, acc: accGroup };
}

function describeOutfit(outfit, era) {
  const names = {
    suit: 'Man in a suit',
    uniform: 'Serviceman',
    dress: 'Woman in a day dress',
    worker: 'Working man',
    child: 'Child',
    mod: 'Mod',
    leather: 'Leather jacket',
    bighair: 'Big hair',
    tracksuit: 'Tracksuit',
    boombox: 'Boombox carrier',
    business: 'Office worker',
    hoodie: 'Hoodie',
    cargo: 'Cargo pants',
    casual: 'Passer-by',
    athleisure: 'Athleisure',
    puffer: 'Puffer jacket',
    courier: 'Delivery courier',
    techwear: 'Techwear',
    clean: 'Commuter',
    robot: 'Service android',
    exosuit: 'Exosuit'
  };
  return names[outfit.kind] || 'Pedestrian';
}

function outfitNote(outfit, era, acc) {
  const byYear = {
    1945: 'Wool, felt and leather. Nothing is synthetic and nothing is casual — a hat is still not optional.',
    1965: 'Bright, flat colour in new synthetics. Hemlines up, hats gone in a single decade.',
    1985: 'Volume everywhere: shoulders, hair, denim. Everything is either black leather or fluorescent.',
    2005: 'Layers, logos and low waists. The phone is a flip and lives in a belt clip.',
    2025: 'Technical fabric worn to buy coffee. Hands full, ears full, eyes down.',
    2055: 'Adaptive textile with charge trim. The garment logs the wearer’s day and negotiates the crossing for them.'
  };
  return `${byYear[era.year]} Carrying: ${acc.replace('-', ' ')}.`;
}

/* ------------------------------------------------------------------ */

function buildDog(pool, era, rng) {
  const g = new THREE.Group();
  const fur = mat(pool, rng.pick(['#6b5236', '#2b2320', '#c8bca4', '#8a7a52']));
  g.add(box(fur, 0.52, 0.24, 0.2, 0, 0.4, 0));
  g.add(box(fur, 0.16, 0.18, 0.16, 0.3, 0.48, 0));
  g.add(box(fur, 0.1, 0.08, 0.06, 0.4, 0.44, 0));
  for (const dx of [-0.18, 0.18]) for (const dz of [-0.07, 0.07]) g.add(box(fur, 0.06, 0.3, 0.06, dx, 0.15, dz));
  const tail = box(fur, 0.16, 0.05, 0.05, -0.32, 0.48, 0);
  tail.rotation.z = 0.5;
  g.add(tail);
  g.userData.tail = tail;
  g.scale.setScalar(rng.range(0.7, 1.1));
  return g;
}

function buildPram(pool, era) {
  const g = new THREE.Group();
  const body = mat(pool, era.year <= 1965 ? '#2b3a52' : '#3a4048');
  g.add(box(body, 0.6, 0.36, 0.42, 0, 0.62, 0));
  g.add(box(body, 0.06, 0.4, 0.06, -0.3, 0.85, 0));
  g.add(box(body, 0.06, 0.06, 0.4, -0.3, 1.05, 0));
  for (const dx of [-0.22, 0.22]) {
    for (const dz of [-0.2, 0.2]) {
      const w = cyl(mat(pool, '#1c1e20'), era.year <= 1965 ? 0.16 : 0.1, 0.05, dx, era.year <= 1965 ? 0.16 : 0.1, dz, 10);
      w.rotation.x = Math.PI / 2;
      g.add(w);
    }
  }
  return g;
}

/* ------------------------------------------------------------------ */

export class People {
  constructor(era, pool, seed = 1) {
    this.era = era;
    this.group = new THREE.Group();
    this.group.name = 'people';
    this.agents = [];
    const rng = makeRng(seed * 5039 + era.year);
    const cfg = era.pedestrians;

    const lanes = [
      -(BLOCK.kerb + 1.9),
      -(BLOCK.frontage - 1.5),
      BLOCK.kerb + 1.9,
      BLOCK.frontage - 1.5
    ];

    for (let i = 0; i < cfg.count; i++) {
      const outfit = pickWeighted(cfg.outfits, rng);
      const built = buildPerson(era, outfit, pool, rng);
      const g = built.group;
      const roll = rng();
      const mode = roll < 0.62 ? 'walk' : roll < 0.84 ? 'idle' : roll < 0.92 ? 'cross' : 'sit';
      const laneZ = rng.pick(lanes);
      const dir = rng.chance(0.5) ? 1 : -1;

      if (mode === 'cross') {
        const crossX = rng.pick([-26, BLOCK.crossX[0] + 8.6, BLOCK.crossX[1] - 8.6]);
        g.position.set(crossX + rng.range(-0.8, 0.8), WALK_Y, rng.range(-BLOCK.kerb, BLOCK.kerb));
        g.rotation.y = 0;
      } else {
        g.position.set(rng.range(-HALF, HALF), WALK_Y, laneZ + rng.range(-0.5, 0.5));
        g.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
      }
      if (mode === 'sit') {
        g.position.y = WALK_Y + 0.02;
      }

      this.group.add(g);
      const agent = {
        obj: g,
        parts: built,
        mode,
        dir,
        laneZ,
        crossDir: rng.chance(0.5) ? 1 : -1,
        speed: cfg.speed * rng.range(0.75, 1.3),
        phase: rng.range(0, Math.PI * 2),
        gestureAt: rng.range(3, 20),
        idleTurn: rng.range(-0.4, 0.4)
      };
      this.agents.push(agent);

      // companions
      if (mode === 'walk' && rng.chance(0.12) && cfg.accessories.includes('dog')) {
        const dog = buildDog(pool, era, rng);
        dog.position.set(g.position.x + dir * 0.9, WALK_Y, g.position.z + 0.5);
        dog.rotation.y = g.rotation.y;
        this.group.add(dog);
        agent.dog = dog;
      }
      if (mode === 'walk' && rng.chance(0.08) && cfg.accessories.includes('stroller')) {
        const pram = buildPram(pool, era);
        pram.position.set(g.position.x + dir * 0.7, WALK_Y, g.position.z);
        pram.rotation.y = g.rotation.y;
        this.group.add(pram);
        agent.pram = pram;
      }
    }
  }

  update(dt, time) {
    for (const a of this.agents) {
      const p = a.parts;
      if (a.mode === 'walk' || a.mode === 'cross') {
        const step = a.speed * dt;
        if (a.mode === 'walk') {
          a.obj.position.x = wrapAround(a.obj.position.x + step * a.dir, HALF);
        } else {
          a.obj.position.z += step * a.crossDir * 0.9;
          if (Math.abs(a.obj.position.z) > BLOCK.kerb + 2.4) a.crossDir *= -1;
          a.obj.rotation.y = a.crossDir > 0 ? 0 : Math.PI;
          a.obj.position.y = WALK_Y * (Math.abs(a.obj.position.z) > BLOCK.kerb ? 1 : 0.02);
        }
        const cycle = time * a.speed * 4.4 + a.phase;
        const swing = Math.sin(cycle) * 0.55;
        p.legs[0].rotation.z = swing;
        p.legs[1].rotation.z = -swing;
        p.arms[0].rotation.z = -swing * 0.7;
        p.arms[1].rotation.z = swing * 0.7;
        a.obj.position.y += 0;
        p.torso.position.y = 0.86 + Math.abs(Math.sin(cycle)) * 0.035;
        p.head.rotation.y = Math.sin(cycle * 0.5) * 0.12;
        if (a.dog) {
          a.dog.position.x = damp(a.dog.position.x, a.obj.position.x + a.dir * 1.1, 3, dt);
          a.dog.position.z = damp(a.dog.position.z, a.obj.position.z + 0.55, 3, dt);
          a.dog.rotation.y = a.obj.rotation.y;
          a.dog.userData.tail.rotation.y = Math.sin(time * 9 + a.phase) * 0.5;
        }
        if (a.pram) {
          a.pram.position.x = a.obj.position.x + a.dir * 0.75;
          a.pram.position.z = a.obj.position.z;
          a.pram.rotation.y = a.obj.rotation.y;
        }
      } else if (a.mode === 'idle') {
        const sway = Math.sin(time * 1.1 + a.phase) * 0.03;
        p.torso.rotation.z = sway;
        p.head.rotation.y = Math.sin(time * 0.4 + a.phase) * 0.35 + a.idleTurn;
        p.legs[0].rotation.z = 0.02;
        p.legs[1].rotation.z = -0.02;
        // occasional gesture
        const g = Math.max(0, Math.sin(time * 0.7 + a.phase * 3) - 0.86) * 7;
        p.arms[0].rotation.z = -g * 0.9;
        p.arms[0].rotation.x = -g * 0.5;
      } else {
        // sitting
        p.legs[0].rotation.z = 1.45;
        p.legs[1].rotation.z = 1.45;
        p.torso.position.y = 0.44;
        p.head.position.y = 1.0;
        p.arms[0].position.y = 1.0;
        p.arms[1].position.y = 1.0;
        p.arms[0].rotation.z = 0.5;
        p.arms[1].rotation.z = 0.5;
        p.head.rotation.y = Math.sin(time * 0.5 + a.phase) * 0.3;
        a.obj.position.y = WALK_Y + 0.02;
      }
    }
  }

  dispose() {
    this.group.removeFromParent();
  }
}
