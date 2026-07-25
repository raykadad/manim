/**
 * Ground-floor shopfronts.
 *
 * The storefront is where an era is legible from three metres away: the
 * lettering, the awning, the glass, the junk on the pavement outside. Each one
 * is assembled from a common kit — bulkhead, display glass, transom, fascia —
 * dressed according to the tenant's period.
 */

import * as THREE from 'three';
import { box, plane, cyl, cone, sphere, tiledPlane, tiledBox, meshOf, tag, extrude } from './kit.js';
import { makeStandard, makeGlass, makeEmissive, makeGlow, makeChrome, makeFoliage, makeHologram } from '../gfx/materials.js';
import {
  signTexture,
  bladeSignTexture,
  marqueeTexture,
  shopInteriorTexture,
  stripeTexture,
  screenTexture,
  posterWallTexture,
  glowTexture,
  plateTexture,
  adTexture,
  leafTexture,
  metalPanelTexture,
  concreteTexture
} from '../gfx/textures.js';
import { makeRng } from '../util/rng.js';
import { groundFloorHeight } from './buildings.js';

const SIGN_BASE = 1.15;
const BULK_H = 0.72;

function flat(pool, color, opts = {}) {
  return pool.get(`flat|${color}|${JSON.stringify(opts)}`, () =>
    makeStandard(pool.field, { color: new THREE.Color(color), roughness: 0.85, ...opts })
  );
}
function emis(pool, color, intensity = 2) {
  return pool.get(`emis|${color}|${intensity}`, () => makeEmissive(pool.field, { color, intensity }));
}
function glassOf(pool, tintKey = 'shop') {
  return pool.get(`shopglass|${tintKey}`, () =>
    makeGlass(pool.field, { color: '#cfe0e8', roughness: 0.03, opacity: 0.24, transparent: true, metalness: 0.05 })
  );
}

/* ------------------------------------------------------------------ */
/*  Signs                                                              */
/* ------------------------------------------------------------------ */

function fasciaSign(pool, era, t, w, y, seed, SIGN_H = SIGN_BASE) {
  const g = new THREE.Group();
  const emissive = t.style === 'neon' || t.style === 'holo';
  const map = signTexture({
    text: t.name,
    sub: t.sub,
    style: t.style,
    bg: t.bg,
    ink: t.ink,
    accent: t.accent,
    font: t.font,
    seed,
    wear: era.props.awningWear,
    w: 1024,
    h: 256
  });

  if (t.style === 'holo') {
    const holoMap = signTexture({
      text: t.name,
      sub: t.sub,
      style: 'holo',
      bg: t.bg,
      ink: t.ink,
      accent: t.accent,
      font: t.font,
      seed,
      emissive: true,
      w: 1024,
      h: 256
    });
    const panel = plane(
      pool.get(`holosign|${t.name}`, () => makeHologram({ map: holoMap, color: '#ffffff', opacity: 0.95 })),
      w * 0.9,
      SIGN_H * 0.95,
      0,
      y,
      0.72
    );
    panel.userData.holo = { base: 0.95, speed: 3.1, phase: seed };
    g.add(panel);
    const halo = plane(
      pool.get(`holohalo|${t.ink}`, () => makeGlow({ color: t.ink, map: glowTexture(t.ink, 0.55), opacity: 0.2 })),
      w * 1.1,
      SIGN_H * 2.4,
      0,
      y,
      0.6
    );
    g.add(halo);
    // emitter bar under the projection
    g.add(box(flat(pool, '#1a2028', { metalness: 0.6, roughness: 0.4 }), w * 0.9, 0.12, 0.3, 0, y - SIGN_H * 0.6, 0.6));
    g.add(box(emis(pool, t.ink, 2.4), w * 0.85, 0.03, 0.05, 0, y - SIGN_H * 0.54, 0.74));
    return g;
  }

  const mat = pool.get(`sign|${t.name}|${t.style}`, () => {
    if (emissive) {
      const em = signTexture({
        text: t.name,
        sub: t.sub,
        style: t.style,
        bg: t.bg,
        ink: t.ink,
        accent: t.accent,
        font: t.font,
        seed,
        emissive: true,
        w: 1024,
        h: 256
      });
      return makeStandard(pool.field, {
        map,
        emissive: new THREE.Color('#ffffff'),
        emissiveMap: em,
        emissiveIntensity: 2.6,
        roughness: 0.6
      });
    }
    if (t.style === 'plastic' || t.style === 'corporate') {
      const em = signTexture({
        text: t.name,
        sub: t.sub,
        style: t.style,
        bg: t.bg,
        ink: t.ink,
        accent: t.accent,
        font: t.font,
        seed,
        emissive: true,
        w: 1024,
        h: 256
      });
      return makeStandard(pool.field, {
        map,
        emissive: new THREE.Color('#ffffff'),
        emissiveMap: em,
        emissiveIntensity: 0.55,
        roughness: 0.45
      });
    }
    return makeStandard(pool.field, { map, roughness: 0.82 });
  });

  const board = plane(mat, w * 0.94, SIGN_H * 0.86, 0, y, 0.58);
  g.add(board);
  // sign box carcass
  g.add(box(flat(pool, t.bg, { roughness: 0.7 }), w * 0.96, SIGN_H * 0.92, 0.22, 0, y, 0.47));

  if (emissive) {
    const halo = plane(
      pool.get(`neonhalo|${t.ink}`, () => makeGlow({ color: t.ink, map: glowTexture(t.ink, 0.55), opacity: 0.3 })),
      w * 1.25,
      SIGN_H * 2.6,
      0,
      y,
      0.5
    );
    g.add(halo);
    g.userData.flicker = { mat, base: 1.9, chance: era.year === 1985 ? 0.02 : 0.004 };
  } else if (era.year <= 1965) {
    // gooseneck lamps washing a painted board
    for (let i = 0; i < 3; i++) {
      const x = -w * 0.3 + i * w * 0.3;
      const arm = new THREE.Group();
      arm.add(cyl(flat(pool, '#3a3630', { metalness: 0.5 }), 0.035, 0.55, 0, 0.3, 0.15, 6));
      const shade = cone(flat(pool, '#4a4640', { metalness: 0.4 }), 0.22, 0.24, 0, 0.52, 0.42, 10);
      shade.rotation.x = Math.PI;
      arm.add(shade);
      arm.add(sphere(emis(pool, '#ffe0a8', 2.2), 0.07, 0, 0.42, 0.42, 6));
      arm.position.set(x, y + SIGN_H * 0.55, 0.6);
      g.add(arm);
    }
  }
  return g;
}

function bladeSign(pool, era, blade, w, y, seed) {
  const g = new THREE.Group();
  const map = bladeSignTexture({ text: blade.text, ink: blade.ink, bg: blade.bg, style: blade.style });
  const em = bladeSignTexture({ text: blade.text, ink: blade.ink, bg: blade.bg, style: blade.style, emissive: true });
  const mat = pool.get(`blade|${blade.text}|${blade.style}`, () =>
    makeStandard(pool.field, {
      map,
      emissive: new THREE.Color('#ffffff'),
      emissiveMap: em,
      emissiveIntensity: blade.style === 'neon' ? 2.1 : 1.2,
      roughness: 0.6,
      side: THREE.DoubleSide
    })
  );
  const bh = Math.min(7.5, y * 1.3);
  const bw = bh * 0.26;
  const panel = plane(mat, bw, bh, 0, 0, 0);
  panel.rotation.y = Math.PI / 2;
  const holder = new THREE.Group();
  holder.add(panel);
  holder.add(box(flat(pool, '#2b2b28', { metalness: 0.6 }), 0.1, bh, 0.1, 0, 0, -bw * 0.55));
  holder.add(box(flat(pool, '#2b2b28', { metalness: 0.6 }), 0.1, 0.1, 1.6, 0, bh / 2 - 0.2, -bw * 0.9));
  holder.add(box(flat(pool, '#2b2b28', { metalness: 0.6 }), 0.1, 0.1, 1.6, 0, -bh / 2 + 0.6, -bw * 0.9));
  holder.position.set(-w * 0.34, y, 1.35);
  const halo = plane(
    pool.get(`bladehalo|${blade.ink}`, () => makeGlow({ color: blade.ink, map: glowTexture(blade.ink, 0.5), opacity: 0.42 })),
    bw * 3.2,
    bh * 1.25,
    0,
    0,
    0
  );
  halo.rotation.y = Math.PI / 2;
  holder.add(halo);
  g.add(holder);
  g.userData.flicker = blade.broken ? { mat, base: 2.1, chance: 0.05 } : null;
  tag(g, era.year, `${blade.text} blade sign`, 'Projecting vertical sign, read from a moving car. Banned by most modern sign codes.');
  return g;
}

function marquee(pool, era, cfg, w, y, seed) {
  const SIGN_H = SIGN_BASE;
  const g = new THREE.Group();
  const depth = 3.2;
  const map = marqueeTexture({ ...cfg, seed });
  const em = marqueeTexture({ ...cfg, seed, emissive: true });
  const mat = pool.get(`marquee|${cfg.line2}`, () =>
    makeStandard(pool.field, {
      map,
      emissive: new THREE.Color('#ffffff'),
      emissiveMap: em,
      emissiveIntensity: cfg.holo ? 2.6 : 1.5,
      roughness: 0.6
    })
  );
  const soffitMat = flat(pool, '#e8dfc4', { roughness: 0.8 });

  // the box: front face + two angled returns + underside full of bulbs
  const front = plane(mat, w * 0.92, 1.7, 0, y, depth);
  g.add(front);
  const sideL = plane(mat, depth * 0.9, 1.7, -w * 0.46, y, depth * 0.55);
  sideL.rotation.y = Math.PI / 2;
  g.add(sideL);
  const sideR = plane(mat, depth * 0.9, 1.7, w * 0.46, y, depth * 0.55);
  sideR.rotation.y = -Math.PI / 2;
  g.add(sideR);
  g.add(box(flat(pool, cfg.accent, { roughness: 0.6 }), w * 0.94, 0.22, depth + 0.12, 0, y + 0.92, depth / 2));
  g.add(box(flat(pool, cfg.accent, { roughness: 0.6 }), w * 0.94, 0.2, depth + 0.12, 0, y - 0.92, depth / 2));

  // glowing underside
  const soffit = plane(emis(pool, '#ffeec8', 1.5), w * 0.9, depth, 0, y - 0.95, depth / 2);
  soffit.rotation.x = Math.PI / 2;
  g.add(soffit);
  const bulbMat = emis(pool, '#fff0cc', 3);
  const bulbs = [];
  for (let i = 0; i < 14; i++) {
    for (let j = 0; j < 3; j++) {
      const b = sphere(bulbMat, 0.075, -w * 0.42 + i * (w * 0.065), y - 0.99, 0.5 + j * (depth / 3), 6);
      b.userData.noMerge = true;
      bulbs.push(b);
      g.add(b);
    }
  }
  g.userData.chaseBulbs = bulbs;

  // hangers
  for (const sx of [-1, 1]) {
    const rod = cyl(flat(pool, '#2f2c28', { metalness: 0.6 }), 0.05, 2.6, sx * w * 0.38, y + 2.1, depth * 0.75, 6);
    rod.rotation.x = 0.5;
    g.add(rod);
  }
  tag(g, era.year, 'Cinema marquee', `${cfg.line1} — ${cfg.line2}. Changeable letters, ${cfg.bulbs ? 'chasing bulbs' : 'internally lit'}.`);
  return g;
}

/* ------------------------------------------------------------------ */
/*  Pavement dressing                                                  */
/* ------------------------------------------------------------------ */

function sidewalkProps(pool, era, t, w, seed, out) {
  const rng = makeRng(seed * 31 + era.year);
  const props = t.props || [];
  const add = (o) => out.add(o);
  const wood = flat(pool, '#7d6244', { roughness: 1 });
  const metal = flat(pool, '#6f6d66', { metalness: 0.5, roughness: 0.5 });

  for (const p of props) {
    switch (p) {
      case 'crates':
      case 'cratestack': {
        const g = new THREE.Group();
        for (let i = 0; i < 5; i++) {
          const c = box(wood, 0.62, 0.34, 0.44, rng.range(-0.1, 0.1), 0.18 + i * 0.35, rng.range(-0.05, 0.05));
          c.rotation.y = rng.range(-0.2, 0.2);
          c.castShadow = true;
          g.add(c);
        }
        const produce = ['#c8452f', '#e8b93f', '#6b8f3a'];
        for (let i = 0; i < 8; i++) {
          g.add(sphere(flat(pool, produce[i % 3]), 0.09, rng.range(-0.22, 0.22), 1.85, rng.range(-0.14, 0.14), 6));
        }
        g.position.set(-w * 0.3, 0, 1.5);
        tag(g, era.year, 'Produce crates', 'Stacked on the pavement because the shop is 4 metres deep and the rent is per frontage foot.');
        add(g);
        break;
      }
      case 'produce': {
        const g = new THREE.Group();
        g.add(box(flat(pool, '#3a4a3f'), 2.2, 0.08, 0.9, 0, 0.85, 0));
        for (let i = 0; i < 4; i++) g.add(box(flat(pool, '#6b5a44'), 0.06, 0.85, 0.06, -1 + i * 0.66, 0.42, 0.35));
        const produce = ['#c8452f', '#e8b93f', '#6b8f3a', '#8a4a8f'];
        for (let i = 0; i < 16; i++) {
          g.add(sphere(flat(pool, produce[i % 4]), 0.08, -1 + rng() * 2, 0.95, rng.range(-0.35, 0.35), 6));
        }
        g.position.set(-w * 0.22, 0, 1.6);
        add(g);
        break;
      }
      case 'stools': {
        for (let i = 0; i < 3; i++) {
          const g = new THREE.Group();
          g.add(cyl(makeChrome(pool.field), 0.05, 0.72, 0, 0.36, 0, 8));
          g.add(cyl(flat(pool, era.year <= 1955 ? '#8c2f2a' : '#c8452f'), 0.16, 0.1, 0, 0.75, 0, 12));
          g.position.set(-w * 0.2 + i * 0.7, 0, 0.85);
          add(g);
        }
        break;
      }
      case 'barberpole':
      case 'barberpole_broken': {
        const g = new THREE.Group();
        g.add(cyl(metal, 0.11, 0.22, 0, 0.11, 0, 10));
        const poleMat = pool.get('barberpole', () =>
          makeStandard(pool.field, {
            map: stripeTexture({ a: '#c8202a', b: '#f2ead6', count: 6, vertical: false, seed: 5 }),
            roughness: 0.4,
            emissive: new THREE.Color(p === 'barberpole' ? '#3a2a2a' : '#000000'),
            emissiveIntensity: 0.6
          })
        );
        const pole = cyl(poleMat, 0.1, 0.95, 0, 0.62, 0, 12);
        pole.userData.spinTex = p === 'barberpole' ? 0.35 : 0;
        g.add(pole);
        g.add(cyl(metal, 0.12, 0.1, 0, 1.14, 0, 10));
        g.position.set(w * 0.36, 1.1, 0.7);
        tag(g, era.year, 'Barber pole', 'Red for blood, white for bandages. A medieval trade sign still turning on a 20th-century street.');
        add(g);
        break;
      }
      case 'menuboard': {
        const g = new THREE.Group();
        g.add(box(flat(pool, '#2b2620'), 0.7, 0.95, 0.06, 0, 1.35, 0));
        g.add(box(flat(pool, '#d8cfb4'), 0.62, 0.85, 0.02, 0, 1.35, 0.04));
        for (let i = 0; i < 5; i++) g.add(box(flat(pool, '#4a4238'), 0.42, 0.03, 0.01, -0.06, 1.62 - i * 0.14, 0.06));
        g.position.set(w * 0.3, 0, 0.65);
        add(g);
        break;
      }
      case 'menuboard_digital':
      case 'holomenu': {
        const scr = pool.get(`menuscreen|${era.year}`, () =>
          makeEmissive(pool.field, { color: '#ffffff', intensity: 1.6, map: screenTexture({ mode: 'menu', seed: 4 }) })
        );
        const g = new THREE.Group();
        g.add(box(flat(pool, '#16191c', { metalness: 0.5, roughness: 0.4 }), 0.9, 1.3, 0.07, 0, 1.6, 0));
        g.add(plane(scr, 0.82, 1.18, 0, 1.6, 0.045));
        g.add(cyl(metal, 0.05, 1, 0, 0.5, 0, 8));
        g.position.set(w * 0.3, 0, 0.85);
        tag(g, era.year, 'Digital menu board', 'A 43-inch screen doing the job of a chalkboard, at 90 watts.');
        add(g);
        break;
      }
      case 'sandwichboard': {
        const g = new THREE.Group();
        const bm = flat(pool, '#3a3128');
        const a = box(bm, 0.62, 0.95, 0.04, 0, 0.5, -0.16);
        a.rotation.x = 0.16;
        const b = box(bm, 0.62, 0.95, 0.04, 0, 0.5, 0.16);
        b.rotation.x = -0.16;
        g.add(a, b);
        g.add(plane(flat(pool, '#e0d8c0'), 0.5, 0.8, 0, 0.52, 0.2));
        g.position.set(w * 0.14, 0, 1.9);
        g.rotation.y = rng.range(-0.4, 0.4);
        add(g);
        break;
      }
      case 'mannequin':
      case 'mannequin_mod': {
        const g = new THREE.Group();
        const skin = flat(pool, p === 'mannequin' ? '#d8c8a8' : '#e8e2d8');
        g.add(cyl(skin, 0.1, 0.8, 0, 0.4, 0, 8));
        g.add(box(flat(pool, p === 'mannequin' ? '#3f4450' : '#f2c14e'), 0.34, 0.55, 0.2, 0, 1.05, 0));
        g.add(sphere(skin, 0.11, 0, 1.44, 0, 8));
        g.add(cyl(flat(pool, '#2b2b2b'), 0.22, 0.05, 0, 0.02, 0, 10));
        g.position.set(-w * 0.24, 0.9, 0.14);
        g.scale.setScalar(0.95);
        add(g);
        break;
      }
      case 'patiotables': {
        for (let i = 0; i < 3; i++) {
          const g = new THREE.Group();
          const topMat = flat(pool, era.year >= 2025 ? '#3f4348' : '#c8c2b0', { metalness: 0.3 });
          g.add(cyl(topMat, 0.36, 0.05, 0, 0.74, 0, 14));
          g.add(cyl(topMat, 0.05, 0.72, 0, 0.36, 0, 8));
          g.add(cyl(topMat, 0.28, 0.04, 0, 0.03, 0, 12));
          for (let c = 0; c < 2; c++) {
            const ch = new THREE.Group();
            const chairMat = flat(pool, era.year >= 2025 ? '#2f3a3f' : '#8a9a5b');
            ch.add(box(chairMat, 0.36, 0.05, 0.36, 0, 0.44, 0));
            ch.add(box(chairMat, 0.36, 0.42, 0.05, 0, 0.65, -0.16));
            for (let l = 0; l < 4; l++)
              ch.add(box(chairMat, 0.04, 0.44, 0.04, -0.14 + (l % 2) * 0.28, 0.22, -0.14 + Math.floor(l / 2) * 0.28));
            ch.position.set(c ? 0.62 : -0.62, 0, 0);
            ch.rotation.y = c ? -Math.PI / 2 : Math.PI / 2;
            g.add(ch);
          }
          g.position.set(-w * 0.28 + i * (w * 0.28), 0, 2.1);
          add(g);
        }
        break;
      }
      case 'parklet': {
        const g = new THREE.Group();
        const deck = box(flat(pool, '#8a7355', { roughness: 1 }), w * 0.8, 0.18, 4.4, 0, 0.09, 4.4);
        g.add(deck);
        const rail = flat(pool, '#2f3a3f', { metalness: 0.4 });
        g.add(box(rail, w * 0.8, 0.08, 0.08, 0, 0.95, 6.6));
        for (let i = 0; i <= 6; i++) g.add(box(rail, 0.05, 0.9, 0.05, -w * 0.4 + i * (w * 0.8) / 6, 0.5, 6.6));
        const leaf = pool.get('parkletLeaf', () => makeFoliage(pool.field, { map: leafTexture({ color: '#4f8a3c', seed: 71 }), color: '#8fc06a' }));
        for (let i = 0; i < 3; i++) {
          g.add(box(flat(pool, '#6b5a44'), 0.7, 0.6, 0.7, -w * 0.3 + i * (w * 0.3), 0.48, 6.2));
          const b = plane(leaf, 1, 1, -w * 0.3 + i * (w * 0.3), 1.2, 6.2);
          b.userData.billboard = true;
          g.add(b);
        }
        tag(g, era.year, 'Parklet', 'Two parking spaces converted to seating. The single most contested six metres on the block.');
        add(g);
        break;
      }
      case 'stringlights': {
        const bulb = emis(pool, '#ffd9a0', 3.2);
        for (let i = 0; i < 14; i++) {
          const t2 = i / 13;
          const x = -w * 0.4 + t2 * w * 0.8;
          const y = 3.2 - Math.sin(t2 * Math.PI) * 0.55;
          add(sphere(bulb, 0.06, x, y, 3.4, 6));
        }
        break;
      }
      case 'gumball': {
        const g = new THREE.Group();
        g.add(cyl(flat(pool, '#c8202a'), 0.12, 0.45, 0, 0.22, 0, 10));
        g.add(sphere(makeGlass(pool.field, { color: '#ffffff', opacity: 0.4 }), 0.16, 0, 0.56, 0, 10));
        g.position.set(w * 0.3, 0.9, 0.5);
        add(g);
        break;
      }
      case 'arcadecabs': {
        for (let i = 0; i < 3; i++) {
          const g = new THREE.Group();
          const cabMat = flat(pool, ['#1a1030', '#2a1040', '#101a30'][i]);
          g.add(box(cabMat, 0.62, 1.6, 0.7, 0, 0.8, 0));
          g.add(plane(emis(pool, ['#39e6ff', '#ff2e88', '#f2c14e'][i], 2.2), 0.5, 0.42, 0, 1.16, 0.36));
          g.add(box(flat(pool, '#12121a'), 0.56, 0.1, 0.3, 0, 0.86, 0.32));
          g.add(sphere(emis(pool, '#ff2e88', 2), 0.05, -0.12, 0.92, 0.42, 6));
          g.position.set(-w * 0.26 + i * 0.78, 0, 0.28);
          add(g);
        }
        break;
      }
      case 'vhswall': {
        const g = new THREE.Group();
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 12; c++) {
            g.add(box(flat(pool, ['#c8202a', '#1b3a6b', '#2b2b30', '#e8b93f'][(r + c) % 4]), 0.13, 0.26, 0.05, -0.9 + c * 0.16, 0.9 + r * 0.32, 0));
          }
        }
        g.position.set(0, 0, 0.12);
        add(g);
        break;
      }
      case 'ebikes':
      case 'deliverybikes': {
        for (let i = 0; i < 3; i++) {
          const g = new THREE.Group();
          const frame = flat(pool, ['#2f3a3f', '#5fd6a4', '#ffb35c'][i], { metalness: 0.4, roughness: 0.4 });
          const wheelMat = flat(pool, '#1a1c1e');
          for (const wx of [-0.5, 0.5]) {
            const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.045, 6, 18), wheelMat);
            wheel.position.set(wx, 0.32, 0);
            g.add(wheel);
          }
          g.add(box(frame, 0.95, 0.07, 0.06, 0, 0.55, 0));
          g.add(box(frame, 0.07, 0.4, 0.06, 0.42, 0.7, 0));
          g.add(box(flat(pool, '#1c1e20'), 0.3, 0.08, 0.14, -0.15, 0.78, 0));
          g.add(box(frame, 0.06, 0.06, 0.42, 0.5, 0.92, 0));
          g.position.set(-w * 0.3 + i * 0.85, 0, 1.4);
          g.rotation.y = rng.range(-0.3, 0.3);
          add(g);
        }
        break;
      }
      case 'chargers':
      case 'chargepost': {
        for (let i = 0; i < 2; i++) {
          const g = new THREE.Group();
          g.add(box(flat(pool, '#e8e6e0', { roughness: 0.4 }), 0.42, 1.5, 0.3, 0, 0.75, 0));
          g.add(plane(emis(pool, '#5fd6a4', 1.8), 0.3, 0.34, 0, 1.15, 0.16));
          g.add(box(flat(pool, '#2f3a3f'), 0.5, 0.12, 0.4, 0, 0.06, 0));
          g.add(cyl(flat(pool, '#22262a'), 0.04, 0.5, 0.24, 0.7, 0.1, 6));
          g.position.set(-w * 0.2 + i * 1.6, 0, 1.6);
          tag(g, era.year, 'DC fast charger', '350 kW, liquid-cooled cable, and a queue at 6pm.');
          add(g);
        }
        break;
      }
      case 'chargepad': {
        const g = new THREE.Group();
        const pad = cyl(flat(pool, '#1c222a'), 1.5, 0.06, 0, 0.03, 0, 20);
        g.add(pad);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.05, 6, 30), emis(pool, era.accent, 2.6));
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.08;
        ring.userData.pulse = { base: 2.6, amp: 1.2, speed: 1.4 };
        g.add(ring);
        g.position.set(0, 0, 3);
        add(g);
        break;
      }
      case 'holobollard': {
        for (let i = 0; i < 3; i++) {
          const g = new THREE.Group();
          g.add(cyl(flat(pool, '#252b33', { metalness: 0.5 }), 0.12, 0.9, 0, 0.45, 0, 10));
          const beam = cyl(pool.get('bollardBeam', () => makeGlow({ color: era.accent, opacity: 0.28 })), 0.1, 2.4, 0, 2.1, 0, 8);
          g.add(beam);
          g.add(sphere(emis(pool, era.accent, 3), 0.1, 0, 0.95, 0, 8));
          g.position.set(-w * 0.32 + i * (w * 0.32), 0, 1.9);
          add(g);
        }
        break;
      }
      case 'planter': {
        for (let i = 0; i < 2; i++) {
          const g = new THREE.Group();
          g.add(box(flat(pool, era.year >= 2025 ? '#6b6459' : '#8a8272', { roughness: 0.95 }), 1, 0.55, 0.7, 0, 0.28, 0));
          g.add(box(flat(pool, '#3f3227'), 0.9, 0.1, 0.6, 0, 0.56, 0));
          const leaf = pool.get('planterLeaf', () => makeFoliage(pool.field, { map: leafTexture({ color: '#4f8a3c', seed: 81 }), color: '#8fc06a' }));
          const b = plane(leaf, 0.95, 0.9, 0, 1.05, 0);
          b.userData.billboard = true;
          g.add(b);
          g.position.set(-w * 0.34 + i * (w * 0.68), 0, 1.35);
          add(g);
        }
        break;
      }
      case 'atm': {
        const g = new THREE.Group();
        g.add(box(flat(pool, '#3a4048', { metalness: 0.5, roughness: 0.4 }), 0.8, 1.9, 0.4, 0, 0.95, 0));
        g.add(plane(emis(pool, '#8fd0ff', 1.4), 0.44, 0.34, 0, 1.35, 0.21));
        g.add(box(flat(pool, '#1c2024'), 0.5, 0.1, 0.06, 0, 1.05, 0.21));
        g.position.set(w * 0.32, 0, 0.35);
        tag(g, era.year, 'Through-the-wall ATM', 'The branch shrank to a slot in the granite.');
        add(g);
        break;
      }
      case 'securitycam': {
        const g = new THREE.Group();
        g.add(box(flat(pool, '#d8d4c8'), 0.1, 0.1, 0.42, 0, 0, 0));
        g.add(cyl(flat(pool, '#2b2b2b'), 0.05, 0.1, 0, 0, 0.24, 8));
        g.add(box(flat(pool, '#d8d4c8'), 0.06, 0.3, 0.06, 0, 0.16, -0.16));
        g.position.set(w * 0.4, 3.4, 0.5);
        g.rotation.y = -0.5;
        add(g);
        break;
      }
      case 'flyers': {
        const mat = pool.get('flyers', () =>
          makeStandard(pool.field, { map: posterWallTexture({ era: era.year, seed: 9 }), roughness: 1 })
        );
        const p = plane(mat, 1.6, 2.2, -w * 0.42, 1.6, 0.52);
        add(p);
        break;
      }
      case 'graffiti':
        break;
      case 'newsbox':
      case 'newsbox_free': {
        for (let i = 0; i < 2; i++) {
          const g = new THREE.Group();
          const col = p === 'newsbox_free' ? ['#c8452f', '#2f6b8c'][i] : ['#1b3a6b', '#8a2f2a'][i];
          g.add(box(flat(pool, col), 0.44, 0.95, 0.4, 0, 0.62, 0));
          g.add(box(flat(pool, '#2b2b2b'), 0.46, 0.1, 0.42, 0, 0.12, 0));
          g.add(plane(flat(pool, '#d8d2c0'), 0.3, 0.32, 0, 0.85, 0.21));
          g.position.set(w * 0.36 - i * 0.55, 0, 1.9);
          add(g);
        }
        break;
      }
      case 'icechest': {
        const g = new THREE.Group();
        g.add(box(flat(pool, '#d8d8d0'), 1.4, 1, 0.7, 0, 0.5, 0));
        g.add(box(flat(pool, '#2f6b8c'), 1.42, 0.3, 0.72, 0, 0.85, 0));
        g.position.set(w * 0.28, 0, 0.7);
        add(g);
        break;
      }
      case 'milkcrates': {
        for (let i = 0; i < 3; i++) {
          const c = box(flat(pool, ['#8a2f2a', '#2f5d3f', '#3a4a6b'][i]), 0.4, 0.3, 0.4, w * 0.36, 0.16 + i * 0.31, 1.2);
          c.rotation.y = rng.range(-0.3, 0.3);
          add(c);
        }
        break;
      }
      case 'qrcode': {
        const g = new THREE.Group();
        g.add(plane(flat(pool, '#f4f2ec'), 0.32, 0.32, 0, 1.5, 0.5));
        const rngq = makeRng(seed + 5);
        for (let i = 0; i < 8; i++)
          for (let j = 0; j < 8; j++)
            if (rngq.chance(0.5)) g.add(plane(flat(pool, '#12141a'), 0.03, 0.03, -0.13 + i * 0.037, 1.37 + j * 0.037, 0.51));
        g.position.set(w * 0.42, 0, 0);
        add(g);
        break;
      }
      case 'scanbooth': {
        const g = new THREE.Group();
        g.add(cyl(makeGlass(pool.field, { color: '#8fe8ff', opacity: 0.16 }), 0.7, 2.4, 0, 1.2, 0, 14));
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.05, 6, 24), emis(pool, era.accent, 3));
        ring.rotation.x = Math.PI / 2;
        ring.userData.scan = { min: 0.2, max: 2.2, speed: 0.8 };
        g.add(ring);
        g.position.set(w * 0.28, 0, 1.6);
        add(g);
        break;
      }
      case 'printer': {
        const g = new THREE.Group();
        g.add(box(flat(pool, '#2b3038', { metalness: 0.5 }), 1.2, 1.6, 1, 0, 0.8, 0));
        g.add(plane(emis(pool, era.accent2 || '#7dffb0', 2), 0.8, 0.5, 0, 1.1, 0.51));
        g.position.set(-w * 0.2, 0, 1.5);
        add(g);
        break;
      }
      case 'mister': {
        out.userData.misters = out.userData.misters || [];
        out.userData.misters.push(new THREE.Vector3(0, 3.6, 1.4));
        const bar = cyl(flat(pool, '#39424f', { metalness: 0.6 }), 0.05, w * 0.8, 0, 3.6, 1.4, 8);
        bar.rotation.z = Math.PI / 2;
        add(bar);
        break;
      }
      case 'dronepad': {
        const g = new THREE.Group();
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.05, 6, 24), emis(pool, era.accent2 || '#7dffb0', 2.4));
        ring.rotation.x = Math.PI / 2;
        g.add(ring);
        g.add(cyl(flat(pool, '#1c222a'), 0.9, 0.08, 0, -0.04, 0, 18));
        g.position.set(w * 0.3, 0.05, 2.6);
        add(g);
        break;
      }
      case 'buzzer': {
        const g = new THREE.Group();
        g.add(box(flat(pool, '#8d8b84', { metalness: 0.4 }), 0.22, 0.4, 0.05, 0, 1.4, 0.5));
        for (let i = 0; i < 6; i++) g.add(box(flat(pool, '#2b2b2b'), 0.05, 0.04, 0.02, -0.05, 1.55 - i * 0.06, 0.53));
        g.position.set(w * 0.44, 0, 0);
        add(g);
        break;
      }
      case 'nightdeposit': {
        const g = new THREE.Group();
        g.add(box(makeChrome(pool.field), 0.5, 0.65, 0.12, 0, 1.3, 0.5));
        g.add(box(flat(pool, '#22242a'), 0.36, 0.1, 0.06, 0, 1.42, 0.57));
        g.position.set(w * 0.36, 0, 0);
        add(g);
        break;
      }
      case 'clockpost': {
        const g = new THREE.Group();
        const post = cyl(flat(pool, '#2f3a33', { metalness: 0.4 }), 0.09, 3.2, 0, 1.6, 0, 10);
        g.add(post);
        const face = flat(pool, '#f2ead6');
        for (const s of [-1, 1]) {
          const c = cyl(face, 0.42, 0.12, 0, 3.5, s * 0.06, 18);
          c.rotation.x = Math.PI / 2;
          g.add(c);
          g.add(box(flat(pool, '#2b2b2b'), 0.03, 0.28, 0.02, 0, 3.58, s * 0.13));
          g.add(box(flat(pool, '#2b2b2b'), 0.2, 0.03, 0.02, 0.08, 3.5, s * 0.13));
        }
        g.add(cyl(flat(pool, '#2f3a33'), 0.22, 0.24, 0, 0.12, 0, 10));
        g.position.set(-w * 0.42, 0, 2.6);
        tag(g, era.year, 'Sidewalk clock', 'Installed by the bank as advertising. Wound weekly, wrong since 1968.');
        add(g);
        break;
      }
      case 'standee': {
        const g = new THREE.Group();
        g.add(plane(flat(pool, '#c8452f', { side: THREE.DoubleSide }), 0.8, 1.7, 0, 0.85, 0));
        g.add(box(flat(pool, '#8a2f2a'), 0.5, 0.05, 0.5, 0, 0.03, 0.2));
        g.position.set(w * 0.24, 0, 1.2);
        g.rotation.y = rng.range(-0.5, 0.5);
        add(g);
        break;
      }
      case 'banner': {
        const mat = pool.get(`banner|${t.name}`, () =>
          makeStandard(pool.field, {
            map: adTexture({ headline: t.name, sub: t.sub, scheme: [t.bg, t.ink, t.accent], style: 'photo', seed: 3, w: 512, h: 256 }),
            roughness: 0.9,
            side: THREE.DoubleSide
          })
        );
        const b = plane(mat, w * 0.5, 1.1, 0, 4.6, 0.62);
        b.userData.flutter = { base: 0, amp: 0.03, speed: 1.2 };
        out.userData.flutterers = out.userData.flutterers || [];
        out.userData.flutterers.push(b);
        add(b);
        break;
      }
      default:
        break;
    }
  }
}

/* ------------------------------------------------------------------ */
/*  The storefront itself                                              */
/* ------------------------------------------------------------------ */

export function buildStorefront(era, lot, spec, pool, seed = 1) {
  const g = new THREE.Group();
  const t = spec.tenant;
  if (!t) return g;
  const w = lot.x1 - lot.x0;
  const rng = makeRng(seed * 613 + era.year);
  const fh = groundFloorHeight(spec);
  const SIGN_H = Math.min(1.55, Math.max(1.0, fh * 0.32));
  const year = era.year;

  const trimColor = spec.base?.color || t.bg;
  const trim = flat(pool, trimColor, {
    roughness: spec.base?.refaced === 'aluminium' ? 0.3 : 0.7,
    metalness: spec.base?.refaced === 'aluminium' ? 0.7 : 0
  });

  /* ---- pilasters + soffit: the frame around the glass ---- */
  const pilW = 0.45;
  for (const s of [-1, 1]) {
    const p = box(trim, pilW, fh, 0.6, (s * (w - pilW)) / 2, fh / 2, 0.3);
    p.castShadow = true;
    g.add(p);
    // decorative capital
    if (year <= 1965) g.add(box(flat(pool, spec.cornice?.color || '#9b8a70'), pilW + 0.16, 0.22, 0.7, (s * (w - pilW)) / 2, fh - 0.1, 0.34));
  }
  const soffit = box(trim, w, 0.24, 0.62, 0, fh - 0.12, 0.31);
  g.add(soffit);

  /* ---- fascia sign band ---- */
  const signY = fh - SIGN_H / 2 - 0.3;
  g.add(box(flat(pool, t.bg, { roughness: 0.75 }), w - pilW * 2, SIGN_H + 0.2, 0.5, 0, signY, 0.25));
  const sign = fasciaSign(pool, era, t, w - pilW * 2 - 0.2, signY, seed, SIGN_H);
  g.add(sign);
  if (sign.userData.flicker) {
    g.userData.flickers = g.userData.flickers || [];
    g.userData.flickers.push(sign.userData.flicker);
  }

  /* ---- glazing ---- */
  const glassBottom = BULK_H;
  const glassTop = fh - SIGN_H - 0.55;
  const glassH = glassTop - glassBottom;
  const style = t.window || 'display';
  const openW = w - pilW * 2 - 0.3;
  const doorW = 1.15;
  const bayW = (openW - doorW) / 2;

  const bulkMat = flat(pool, year <= 1965 ? '#3f3a32' : year <= 2005 ? '#5a5f66' : '#2b3238', { roughness: 0.7 });
  const frameMat = flat(pool, year <= 1955 ? '#3a3128' : year <= 1985 ? '#8f9398' : '#3f4348', {
    metalness: year >= 1965 ? 0.6 : 0.1,
    roughness: year >= 1965 ? 0.35 : 0.7
  });

  const interiorMat = pool.get(`int|${t.name}`, () => {
    const map = shopInteriorTexture({
      base: t.interior?.base || '#2a2018',
      warm: t.interior?.warm || '#f0c07a',
      era: year,
      seed: seed + 2
    });
    const em = shopInteriorTexture({
      base: t.interior?.base || '#2a2018',
      warm: t.interior?.warm || '#f0c07a',
      era: year,
      seed: seed + 2,
      emissive: true
    });
    return makeStandard(pool.field, {
      map,
      emissive: new THREE.Color('#ffffff'),
      emissiveMap: em,
      emissiveIntensity: 0.85,
      roughness: 0.9
    });
  });

  const addBay = (cx, bw) => {
    if (bw < 0.4) return;
    // interior diorama sits at the back of a shallow reveal
    const inner = plane(interiorMat, bw, glassH, cx, glassBottom + glassH / 2, 0.04);
    g.add(inner);
    // reveal sides
    g.add(box(bulkMat, 0.08, glassH, 0.38, cx - bw / 2, glassBottom + glassH / 2, 0.2));
    g.add(box(bulkMat, 0.08, glassH, 0.38, cx + bw / 2, glassBottom + glassH / 2, 0.2));

    if (style === 'grille') {
      const bar = flat(pool, '#2b2b2b', { metalness: 0.7, roughness: 0.5 });
      const n = Math.max(4, Math.floor(bw / 0.22));
      for (let i = 0; i <= n; i++) g.add(box(bar, 0.035, glassH, 0.035, cx - bw / 2 + (i * bw) / n, glassBottom + glassH / 2, 0.42));
      for (let i = 0; i < 5; i++) g.add(box(bar, bw, 0.035, 0.035, cx, glassBottom + (i * glassH) / 4, 0.42));
    } else if (style === 'glassblock') {
      const blockMat = pool.get('glassblock', () =>
        makeGlass(pool.field, { color: '#bcd4d8', roughness: 0.5, opacity: 0.55, transmission: 0 })
      );
      const cols = Math.max(3, Math.floor(bw / 0.34));
      const rows = Math.max(3, Math.floor(glassH / 0.34));
      for (let i = 0; i < cols; i++)
        for (let j = 0; j < rows; j++)
          g.add(box(blockMat, bw / cols - 0.02, glassH / rows - 0.02, 0.2, cx - bw / 2 + (bw / cols) * (i + 0.5), glassBottom + (glassH / rows) * (j + 0.5), 0.4));
    } else if (style === 'board') {
      g.add(box(flat(pool, '#6b5a44', { roughness: 1 }), bw, glassH, 0.1, cx, glassBottom + glassH / 2, 0.4));
    } else if (style === 'poster') {
      const pm = pool.get(`posters|${year}`, () =>
        makeStandard(pool.field, { map: posterWallTexture({ era: year, seed: seed + 4 }), roughness: 0.95 })
      );
      g.add(plane(pm, bw * 0.94, glassH * 0.94, cx, glassBottom + glassH / 2, 0.42));
      g.add(box(frameMat, bw, glassH, 0.1, cx, glassBottom + glassH / 2, 0.36));
    } else if (style === 'smart') {
      const sm = pool.get(`smartglass|${t.name}`, () =>
        makeEmissive(pool.field, {
          color: '#ffffff',
          intensity: 1.15,
          map: screenTexture({ mode: 'ui', tint: t.ink, text: t.name, seed: seed + 6 }),
          transparent: true,
          opacity: 0.9
        })
      );
      g.add(plane(sm, bw, glassH, cx, glassBottom + glassH / 2, 0.42));
    } else {
      g.add(box(glassOf(pool), bw, glassH, 0.05, cx, glassBottom + glassH / 2, 0.42));
      // mullion + reflection streak
      g.add(box(frameMat, 0.07, glassH, 0.1, cx, glassBottom + glassH / 2, 0.44));
      const sheen = plane(
        pool.get('sheen', () => makeGlow({ color: '#ffffff', opacity: 0.06 })),
        bw * 0.9,
        glassH * 0.9,
        cx,
        glassBottom + glassH / 2,
        0.46
      );
      g.add(sheen);
    }
    // window frame
    g.add(box(frameMat, bw + 0.12, 0.1, 0.46, cx, glassTop + 0.05, 0.24));
    g.add(box(frameMat, bw + 0.12, 0.1, 0.46, cx, glassBottom - 0.05, 0.24));
  };

  if (style !== 'open' && style !== 'bay') {
    addBay(-(doorW / 2 + bayW / 2), bayW);
    addBay(doorW / 2 + bayW / 2, bayW);
  }

  /* bulkhead below the glass */
  if (style !== 'open' && style !== 'bay') {
    g.add(box(bulkMat, openW, BULK_H, 0.5, 0, BULK_H / 2, 0.25));
    g.add(box(flat(pool, trimColor), openW, 0.08, 0.56, 0, BULK_H, 0.28));
    // tiled entry step
    g.add(box(flat(pool, '#9c9689', { roughness: 0.9 }), doorW + 0.7, 0.1, 0.9, 0, 0.05, 0.75));
  }

  /* ---- door ---- */
  if (style !== 'open' && style !== 'bay') {
    const doorH = glassTop - 0.05;
    const doorGroup = new THREE.Group();
    const doorMat = year <= 1965 ? flat(pool, '#4a3a28', { roughness: 0.7 }) : frameMat;
    doorGroup.add(box(doorMat, doorW, doorH, 0.09, 0, doorH / 2, 0));
    doorGroup.add(box(glassOf(pool), doorW * 0.72, doorH * 0.6, 0.04, 0, doorH * 0.62, 0.03));
    doorGroup.add(box(makeChrome(pool.field), 0.05, 0.75, 0.05, doorW * 0.36, doorH * 0.45, 0.09));
    // hours decal
    doorGroup.add(plane(flat(pool, '#e8e2d0'), 0.24, 0.16, -doorW * 0.28, doorH * 0.34, 0.05));
    doorGroup.position.set(0, 0, 0.18);
    g.add(doorGroup);
    // transom
    g.add(box(glassOf(pool), doorW, glassTop - doorH + 0.02, 0.05, 0, (glassTop + doorH) / 2, 0.4));
  }

  /* ---- awning ---- */
  if (t.awning) {
    const aw = t.awning;
    const isModern = year >= 2025;
    const stripeMat = pool.get(`awning|${aw.a}|${aw.b}|${aw.count}`, () =>
      makeStandard(pool.field, {
        map: stripeTexture({ a: aw.a, b: aw.b, count: aw.count, wear: era.props.awningWear, seed: seed + 8 }),
        roughness: 0.95,
        side: THREE.DoubleSide
      })
    );
    const awW = w - pilW * 2;
    const depth = isModern ? 1.5 : 1.9;
    const topY = glassTop + 1.0;
    const outY = glassTop + 0.34;
    const rise = topY - outY;
    // a plane starts vertical, so tilt it back from horizontal by the slope angle
    const front = plane(stripeMat, awW, Math.hypot(depth, rise), 0, (topY + outY) / 2, 0.5 + depth / 2);
    front.rotation.x = -(Math.PI / 2 - Math.atan2(rise, depth));
    g.add(front);
    // valance hanging off the outer edge
    g.add(plane(stripeMat, awW, 0.34, 0, outY - 0.17, 0.5 + depth));
    // closed side panels
    for (const s of [-1, 1]) {
      const tri = extrude(
        [
          [0, 0],
          [depth, -rise],
          [depth, -rise - 0.34],
          [0, -0.34]
        ],
        0.03,
        stripeMat
      );
      tri.rotation.y = -Math.PI / 2;
      tri.position.set((s * awW) / 2, topY, 0.5);
      g.add(tri);
    }
    const barMat = flat(pool, '#4a4640', { metalness: 0.5 });
    g.add(box(barMat, awW, 0.06, 0.06, 0, topY, 0.5));
    for (const s of [-1, 1]) {
      const stay = box(barMat, 0.05, 0.05, depth, (s * awW) / 2 * 0.86, outY + rise * 0.5, 0.5 + depth / 2);
      stay.rotation.x = Math.atan2(rise, depth);
      g.add(stay);
    }
    tag(front, year, 'Canvas awning', 'Retractable, sun-faded on the south side, and the only shade on the block.');
  }

  /* ---- blade / marquee / neon window signs ---- */
  if (t.blade) {
    const b = bladeSign(pool, era, t.blade, w, fh + 2.6, seed);
    g.add(b);
    if (b.userData.flicker) {
      g.userData.flickers = g.userData.flickers || [];
      g.userData.flickers.push(b.userData.flicker);
    }
  }
  if (t.marquee) {
    g.add(marquee(pool, era, t.marquee, w, fh + 1.5, seed));
  }
  if (t.neon) {
    const nm = pool.get(`neonword|${t.neon.text}|${t.neon.color}`, () => {
      const map = signTexture({
        text: t.neon.text,
        style: 'neon',
        bg: '#0b0c10',
        ink: t.neon.color,
        accent: t.neon.color,
        font: 'script',
        w: 512,
        h: 256
      });
      const em = signTexture({
        text: t.neon.text,
        style: 'neon',
        bg: '#0b0c10',
        ink: t.neon.color,
        accent: t.neon.color,
        font: 'script',
        emissive: true,
        w: 512,
        h: 256
      });
      return makeStandard(pool.field, {
        map,
        emissive: new THREE.Color('#ffffff'),
        emissiveMap: em,
        emissiveIntensity: 2.4,
        transparent: true,
        roughness: 0.5
      });
    });
    const n = plane(nm, 1.5, 0.75, w * 0.26, glassTop - 0.6, 0.47);
    g.add(n);
    g.userData.flickers = g.userData.flickers || [];
    g.userData.flickers.push({ mat: nm, base: 2.4, chance: year === 1985 ? 0.04 : 0.006 });
    const halo = plane(
      pool.get(`neonwordhalo|${t.neon.color}`, () => makeGlow({ color: t.neon.color, map: glowTexture(t.neon.color, 0.6), opacity: 0.45 })),
      3,
      2,
      w * 0.26,
      glassTop - 0.6,
      0.46
    );
    g.add(halo);
  }

  /* ---- open frontages: garage bays, station forecourts ---- */
  if (style === 'bay') {
    const bays = 2;
    const bw = (w - pilW * 2 - 0.6) / bays;
    for (let i = 0; i < bays; i++) {
      const cx = -w / 2 + pilW + 0.3 + bw * (i + 0.5);
      g.add(box(flat(pool, '#14161a'), bw - 0.2, fh - SIGN_H - 0.5, 0.3, cx, (fh - SIGN_H - 0.5) / 2, 0.16));
      // roller shutter, half open
      const shut = pool.get('shutter', () =>
        makeStandard(pool.field, {
          map: metalPanelTexture({ color: '#8d8b84', grime: 0.6, seed: 12, ribs: 22 }),
          roughness: 0.55,
          metalness: 0.5
        })
      );
      const sh = (fh - SIGN_H - 0.5) * (i === 0 ? 0.28 : 0.85);
      g.add(box(shut, bw - 0.2, sh, 0.08, cx, fh - SIGN_H - 0.5 - sh / 2, 0.3));
    }
  }

  /* ---- pavement dressing ---- */
  sidewalkProps(pool, era, t, w, seed, g);

  /* ---- interior light spill onto the pavement ---- */
  const spill = plane(
    pool.get(`spill|${t.interior?.warm || '#ffd9a0'}`, () =>
      makeGlow({ color: t.interior?.warm || '#ffd9a0', map: glowTexture(t.interior?.warm || '#ffd9a0', 0.45), opacity: 0.1 })
    ),
    w * 0.9,
    3.4,
    0,
    0.05,
    2
  );
  spill.rotation.x = -Math.PI / 2;
  spill.userData.noMerge = true;
  g.userData.spill = spill;
  g.add(spill);

  tag(g, year, t.name, `${t.sub}. ${storefrontNote(t, era)}`);
  return g;
}

function storefrontNote(t, era) {
  const notes = {
    painted: 'Hand-lettered in enamel by a signwriter who charged by the letter.',
    neon: 'Bent glass tube, argon and mercury, buzzing at 9,000 volts.',
    plastic: 'Vacuum-formed acrylic over fluorescent tubes — cheap, bright, everywhere.',
    corporate: 'A brand standards manual, applied at 1:1 scale.',
    minimal: 'Sans-serif, generous tracking, and a lot of unpainted wall.',
    holo: 'A projected sign: no substrate, no permit, no maintenance.'
  };
  return notes[t.style] || '';
}

/* ------------------------------------------------------------------ */
/*  Special lots                                                       */
/* ------------------------------------------------------------------ */

/** Petrol station / charge hub / skyport forecourt. */
export function buildStation(era, lot, spec, pool, seed = 1) {
  const g = new THREE.Group();
  const w = lot.x1 - lot.x0;
  const d = lot.depth;
  const rng = makeRng(seed * 71 + era.year);
  const t = spec.tenant;
  const year = era.year;
  const props = t.props || [];

  /* forecourt slab */
  const slab = meshOf(
    tiledPlane(w, d * 0.9, 5),
    pool.get('forecourt', () =>
      makeStandard(pool.field, { map: concreteTexture({ color: year >= 2025 ? '#8f8f8a' : '#a5a396', grime: 0.5, seed: 21 }), roughness: 0.92 })
    ),
    0,
    0.02,
    -d * 0.45
  );
  slab.rotation.x = -Math.PI / 2;
  slab.receiveShadow = true;
  g.add(slab);

  /* kiosk */
  const kiosk = buildStorefront(era, { x0: -w / 2 + 1, x1: w / 2 - 5.5, depth: 6 }, { ...spec, tenant: { ...t, props: [] } }, pool, seed);
  kiosk.position.set(-2.4, 0, -d * 0.72);
  g.add(kiosk);

  const metal = flat(pool, '#8d8b84', { metalness: 0.5, roughness: 0.45 });

  /* canopy */
  if (props.includes('canopy') || props.includes('canopy_solar') || year >= 2055) {
    const cw = w * 0.72;
    const cd = 7.5;
    const cy = year <= 1965 ? 4.2 : 4.8;
    const fascia = flat(pool, t.bg, { roughness: 0.5 });
    g.add(box(fascia, cw, 0.75, cd, w * 0.1, cy, -d * 0.34));
    g.add(box(flat(pool, '#e8e6dc'), cw - 0.3, 0.2, cd - 0.3, w * 0.1, cy - 0.42, -d * 0.34));
    const under = plane(emis(pool, '#fff4d8', 1.1), cw - 0.6, cd - 0.6, w * 0.1, cy - 0.53, -d * 0.34);
    under.rotation.x = Math.PI / 2;
    g.add(under);
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        g.add(cyl(metal, 0.19, cy, w * 0.1 + sx * (cw / 2 - 1), cy / 2, -d * 0.34 + sz * (cd / 2 - 1), 12));
      }
    }
    if (props.includes('canopy_solar')) {
      const panelMat = pool.get('solarpanel', () => makeStandard(pool.field, { color: '#16233a', metalness: 0.65, roughness: 0.22 }));
      for (let i = 0; i < 4; i++) g.add(box(panelMat, cw * 0.9, 0.1, cd / 5, w * 0.1, cy + 0.5, -d * 0.34 - cd / 2 + (i + 1) * (cd / 5)));
    }
    // brand band
    const bandMat = pool.get(`stationband|${t.name}`, () =>
      makeStandard(pool.field, {
        map: signTexture({ text: t.name, sub: '', style: t.style, bg: t.bg, ink: t.ink, accent: t.accent, font: t.font, w: 1024, h: 256 }),
        emissive: new THREE.Color('#ffffff'),
        emissiveMap: signTexture({
          text: t.name,
          sub: '',
          style: t.style,
          bg: t.bg,
          ink: t.ink,
          accent: t.accent,
          font: t.font,
          emissive: true,
          w: 1024,
          h: 256
        }),
        emissiveIntensity: 1.4,
        roughness: 0.5
      })
    );
    g.add(plane(bandMat, cw * 0.8, 0.6, w * 0.1, cy, -d * 0.34 + cd / 2 + 0.02));
  }

  /* pumps / chargers / pads */
  const pumpKind = props.find((p) => p.startsWith('pumps')) || (props.includes('chargers') ? 'chargers' : props.includes('chargepad') ? 'chargepad' : null);
  if (pumpKind) {
    for (let i = 0; i < 2; i++) {
      const p = new THREE.Group();
      const px = w * 0.1 + (i === 0 ? -3.2 : 3.2);
      const pz = -d * 0.34;
      if (pumpKind === 'pumps_round') {
        p.add(box(flat(pool, '#e8e2d0'), 0.55, 1.9, 0.5, 0, 0.95, 0));
        p.add(sphere(pool.get('pumpglobe', () => makeEmissive(pool.field, { color: '#ffe9b0', intensity: 1.6 })), 0.28, 0, 2.15, 0, 12));
        p.add(box(flat(pool, '#c8452f'), 0.4, 0.3, 0.06, 0, 1.4, 0.27));
        p.add(cyl(flat(pool, '#2b2b2b'), 0.03, 1.2, 0.34, 1.1, 0.1, 6));
      } else if (pumpKind === 'chargers' || pumpKind === 'chargepad') {
        p.add(box(flat(pool, '#f0eee8', { roughness: 0.35 }), 0.5, 1.7, 0.36, 0, 0.85, 0));
        p.add(plane(emis(pool, era.accent, 1.8), 0.34, 0.46, 0, 1.25, 0.19));
        p.add(box(flat(pool, '#2b3238'), 0.6, 0.14, 0.5, 0, 0.07, 0));
        p.add(cyl(flat(pool, '#1c2024'), 0.035, 0.9, 0.28, 0.7, 0.16, 6));
      } else {
        const boxy = pumpKind === 'pumps_80s' || pumpKind === 'pumps_00s';
        p.add(box(flat(pool, boxy ? '#d8d4c4' : '#f0ece0'), 0.62, boxy ? 1.7 : 1.5, 0.55, 0, boxy ? 0.85 : 0.75, 0));
        p.add(box(flat(pool, t.bg), 0.66, 0.4, 0.58, 0, boxy ? 1.55 : 1.35, 0));
        p.add(plane(emis(pool, pumpKind === 'pumps_00s' ? '#8fd0ff' : '#f2e8b0', 1.4), 0.34, 0.24, 0, 1.1, 0.29));
        p.add(cyl(flat(pool, '#2b2b2b'), 0.03, 1.1, 0.34, 0.9, 0.12, 6));
        if (pumpKind === 'pumps_00s') p.add(plane(emis(pool, '#9fd8ff', 1.2), 0.3, 0.22, 0, 1.5, 0.3));
      }
      p.position.set(px, 0, pz);
      // pump island
      g.add(box(flat(pool, '#b8b4a8'), 2.6, 0.16, 1.2, px, 0.08, pz));
      tag(p, year, pumpKind.startsWith('pumps') ? 'Fuel dispenser' : 'Charge post', pumpKind.startsWith('pumps') ? `${t.sub}` : 'Cable, screen, contactless reader. Fifteen minutes of standing about.');
      g.add(p);
    }
  }

  /* price / brand pylon */
  if (props.includes('canopy') || props.includes('canopy_solar') || year <= 1945 || year >= 2055) {
    const py = new THREE.Group();
    const ph = year <= 1945 ? 5.5 : 8;
    py.add(cyl(metal, 0.18, ph, 0, ph / 2, 0, 10));
    const signMat = pool.get(`pylon|${t.name}`, () =>
      makeStandard(pool.field, {
        map: signTexture({ text: t.name, sub: t.sub, style: t.style, bg: t.bg, ink: t.ink, accent: t.accent, font: t.font, w: 512, h: 512 }),
        emissive: new THREE.Color('#ffffff'),
        emissiveMap: signTexture({
          text: t.name,
          sub: t.sub,
          style: t.style,
          bg: t.bg,
          ink: t.ink,
          accent: t.accent,
          font: t.font,
          emissive: true,
          w: 512,
          h: 512
        }),
        emissiveIntensity: 1.6,
        roughness: 0.5,
        side: THREE.DoubleSide
      })
    );
    py.add(plane(signMat, 2.6, 2.6, 0, ph + 1.1, 0));
    py.position.set(w * 0.38, 0, -3.5);
    tag(py, year, 'Forecourt pylon', 'Priced to be read at 50 km/h.');
    g.add(py);
  }

  /* air hose, oil rack, bins */
  if (props.includes('airhose')) {
    const a = new THREE.Group();
    a.add(cyl(flat(pool, '#c8452f'), 0.22, 1.1, 0, 0.55, 0, 10));
    a.add(box(flat(pool, '#2b2b2b'), 0.1, 0.1, 0.6, 0, 0.9, 0.3));
    a.position.set(-w * 0.36, 0, -d * 0.2);
    g.add(a);
  }
  if (props.includes('oilrack')) {
    const r = new THREE.Group();
    r.add(box(flat(pool, '#2f4739'), 1.1, 1.2, 0.4, 0, 0.6, 0));
    for (let i = 0; i < 8; i++)
      r.add(cyl(flat(pool, i % 2 ? '#c8452f' : '#e8b93f'), 0.07, 0.24, -0.42 + (i % 4) * 0.28, 0.35 + Math.floor(i / 4) * 0.4, 0.22, 8));
    r.position.set(w * 0.24, 0, -d * 0.72);
    g.add(r);
  }
  if (props.includes('liftbay')) {
    const b = new THREE.Group();
    b.add(box(flat(pool, '#14161a'), 3.4, 3.2, 0.3, 0, 1.6, 0));
    b.add(box(flat(pool, '#8d8b84', { metalness: 0.4 }), 3.6, 0.3, 0.4, 0, 3.3, 0));
    b.position.set(w * 0.3, 0, -d * 0.88);
    g.add(b);
  }
  if (props.includes('dronepad') || props.includes('chargepad')) {
    for (let i = 0; i < 2; i++) {
      const pad = new THREE.Group();
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.06, 6, 28), emis(pool, era.accent2 || '#7dffb0', 2.6));
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.06;
      ring.userData.pulse = { base: 2.6, amp: 1.4, speed: 1.1 + i * 0.3 };
      pad.add(ring);
      pad.add(cyl(flat(pool, '#1a2028'), 1.7, 0.06, 0, 0.03, 0, 22));
      pad.position.set(w * 0.05 + i * 4.4, 0, -d * 0.2);
      g.add(pad);
    }
  }

  tag(g, year, t.name, `${t.sub}. The corner lot has sold motion since 1919 — first petrol, then convenience, then electrons.`);
  return g;
}

/** Open lots: coal yard, parking, rubble, construction site, park. */
export function buildOpenLot(era, lot, spec, pool, seed = 1) {
  const g = new THREE.Group();
  const w = lot.x1 - lot.x0;
  const d = lot.depth;
  const rng = makeRng(seed * 137 + era.year);
  const year = era.year;
  const kind = spec.yard;

  const ground = meshOf(
    tiledPlane(w, d, 5),
    pool.get(`lotground|${kind}`, () =>
      makeStandard(pool.field, {
        map: concreteTexture({
          color: kind === 'park' || kind === 'garden2055' ? '#5f7a4a' : kind === 'rubble' ? '#6b665c' : kind === 'coal' ? '#3f3a33' : '#8a8578',
          grime: 0.6,
          seed: 33
        }),
        roughness: 1
      })
    ),
    0,
    0.02,
    -d / 2
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  g.add(ground);

  // party walls of the neighbours, exposed by the gap
  const partyMat = pool.get(`party|${spec.wall.color}`, () =>
    makeStandard(pool.field, { color: new THREE.Color(spec.wall.color), roughness: 0.95 })
  );
  for (const s of [-1, 1]) {
    const pw = box(partyMat, 0.5, 9, d, (s * w) / 2, 4.5, -d / 2);
    pw.receiveShadow = true;
    pw.castShadow = true;
    g.add(pw);
  }

  const fenceMat = pool.get('chainlink', () =>
    makeStandard(pool.field, {
      map: metalPanelTexture({ color: '#8d8b84', grime: 0.5, seed: 15, ribs: 30 }),
      transparent: true,
      opacity: 0.42,
      roughness: 0.6,
      metalness: 0.5,
      side: THREE.DoubleSide
    })
  );

  if (kind === 'coal') {
    const woodMat = pool.get('yardwood', () => makeStandard(pool.field, { color: '#6b563c', roughness: 1 }));
    for (let i = 0; i < 3; i++) {
      const stack = new THREE.Group();
      for (let j = 0; j < 6; j++) stack.add(box(woodMat, 4.4, 0.22, 0.24 + rng.range(0, 0.05), 0, 0.12 + j * 0.24, j * 0.02));
      for (let j = 0; j < 6; j++) stack.add(box(woodMat, 4.4, 0.22, 0.24, 0, 0.12 + j * 0.24, 0.4));
      stack.position.set(-w * 0.28 + i * 3.4, 0, -d * 0.45);
      stack.rotation.y = rng.range(-0.1, 0.1);
      g.add(stack);
    }
    const coal = new THREE.Mesh(new THREE.ConeGeometry(2.6, 2, 12), pool.get('coal', () => makeStandard(pool.field, { color: '#1a1a1c', roughness: 0.95 })));
    coal.position.set(w * 0.26, 1, -d * 0.6);
    coal.castShadow = true;
    g.add(coal);
    // hopper + chute
    g.add(box(pool.get('yardsteel', () => makeStandard(pool.field, { color: '#4a4438', metalness: 0.5, roughness: 0.6 })), 2, 2.4, 2, w * 0.3, 3.2, -d * 0.85));
    // gate
    for (let i = 0; i < 2; i++) {
      const f = plane(fenceMat, w / 2 - 0.6, 2.4, -w / 4 + i * (w / 2), 1.2, -0.4);
      g.add(f);
    }
  } else if (kind === 'parking') {
    const paintMat = pool.get('lotpaint', () => makeStandard(pool.field, { color: '#d8cfae', roughness: 0.8 }));
    for (let i = 0; i < 6; i++) {
      const p = plane(paintMat, 0.1, 4.6, -w / 2 + 1 + i * (w / 6), 0.03, -d * 0.4);
      p.rotation.x = -Math.PI / 2;
      g.add(p);
    }
    // attendant shack
    const shack = new THREE.Group();
    shack.add(box(pool.get('shack', () => makeStandard(pool.field, { color: '#e8dfc4', roughness: 0.9 })), 2, 2.4, 2, 0, 1.2, 0));
    shack.add(box(pool.get('shackroof', () => makeStandard(pool.field, { color: '#3a4a3f' })), 2.4, 0.16, 2.4, 0, 2.5, 0));
    shack.add(plane(pool.get('shackglass', () => makeGlass(pool.field, { color: '#bcd4d8', opacity: 0.4 })), 1.2, 0.9, 0, 1.6, 1.01));
    shack.position.set(-w * 0.34, 0, -2.4);
    g.add(shack);
    g.userData.parkingLot = { w: w - 2, d: d - 4, z: -d * 0.45, rows: 2 };
  } else if (kind === 'rubble') {
    const rubbleMat = pool.get('rubble', () => makeStandard(pool.field, { color: '#6f6a60', roughness: 1 }));
    for (let i = 0; i < 40; i++) {
      const r = box(rubbleMat, rng.range(0.2, 0.8), rng.range(0.15, 0.5), rng.range(0.2, 0.7), rng.range(-w / 2 + 1, w / 2 - 1), 0.15, rng.range(-d + 2, -1));
      r.rotation.set(rng() * 3, rng() * 3, rng() * 3);
      g.add(r);
    }
    const weedMat = pool.get('weeds', () => makeFoliage(pool.field, { map: leafTexture({ color: '#6b7a3a', seed: 91, autumn: 0.5 }), color: '#8a9a5b' }));
    for (let i = 0; i < 22; i++) {
      const b = plane(weedMat, rng.range(0.5, 1.3), rng.range(0.5, 1.1), rng.range(-w / 2 + 1, w / 2 - 1), 0.4, rng.range(-d + 1.5, -1));
      b.userData.billboard = true;
      g.add(b);
    }
    for (let i = 0; i < 2; i++) g.add(plane(fenceMat, w / 2 - 0.6, 2.4, -w / 4 + i * (w / 2), 1.2, -0.3));
    // burnt-out shell of a car
    const wreck = new THREE.Group();
    wreck.add(box(pool.get('wreck', () => makeStandard(pool.field, { color: '#2b2723', roughness: 1 })), 4.2, 0.9, 1.8, 0, 0.55, 0));
    wreck.add(box(pool.get('wreck', () => makeStandard(pool.field, { color: '#2b2723', roughness: 1 })), 2.2, 0.7, 1.7, -0.3, 1.2, 0));
    wreck.position.set(w * 0.22, 0, -d * 0.62);
    wreck.rotation.y = 0.5;
    tag(wreck, year, 'Stripped car', 'Wheels first, then the battery, then the seats. Reported, logged, never collected.');
    g.add(wreck);
  } else if (kind === 'construction') {
    const hoardMat = pool.get('hoarding', () =>
      makeStandard(pool.field, {
        map: adTexture({
          headline: spec.tenant.name,
          sub: spec.tenant.sub,
          brand: 'OCCUPANCY 2007',
          scheme: ['#2f4d6b', '#f2f2ea', '#8ecf4a'],
          style: 'photo',
          seed: 12,
          w: 1024,
          h: 512
        }),
        roughness: 0.9,
        side: THREE.DoubleSide
      })
    );
    g.add(plane(hoardMat, w - 0.4, 3, 0, 1.5, -0.3));
    const scaffMat = pool.get('scaffpipe', () => makeStandard(pool.field, { color: '#a8a08a', metalness: 0.4, roughness: 0.6 }));
    for (let i = 0; i < 5; i++) g.add(box(scaffMat, 0.1, 3.4, 0.1, -w / 2 + 0.5 + i * (w / 5), 1.7, -0.5));
    // excavation + crane base
    g.add(box(pool.get('dirt', () => makeStandard(pool.field, { color: '#4a3f30', roughness: 1 })), w - 2, 0.6, d - 3, 0, -0.2, -d / 2));
    const crane = new THREE.Group();
    const cm = pool.get('cranemetal', () => makeStandard(pool.field, { color: '#e8b93f', metalness: 0.4, roughness: 0.5 }));
    crane.add(box(cm, 0.9, 22, 0.9, 0, 11, 0));
    crane.add(box(cm, 20, 0.7, 0.7, 5, 22, 0));
    crane.add(box(cm, 0.6, 1.4, 1.4, -4, 22.4, 0));
    const cable = box(pool.get('cable', () => makeStandard(pool.field, { color: '#2b2b2b' })), 0.06, 8, 0.06, 8, 18, 0);
    crane.add(cable);
    crane.position.set(w * 0.2, 0, -d * 0.75);
    crane.rotation.y = -0.6;
    tag(crane, year, 'Tower crane', 'Erected in April; the neighbours were promised it would be down by August.');
    g.add(crane);
  } else if (kind === 'park' || kind === 'garden2055') {
    const futuristic = kind === 'garden2055';
    const grassMat = pool.get('grass', () =>
      makeStandard(pool.field, { color: futuristic ? '#3d7a52' : '#4f7a3f', roughness: 1 })
    );
    const lawn = meshOf(tiledPlane(w - 1.5, d - 2, 4), grassMat, 0, 0.06, -d / 2);
    lawn.rotation.x = -Math.PI / 2;
    lawn.receiveShadow = true;
    g.add(lawn);
    // path
    const pathMat = pool.get('parkpath', () =>
      makeStandard(pool.field, { map: concreteTexture({ color: '#b0aa9c', grime: 0.35, seed: 41 }), roughness: 0.95 })
    );
    const path = meshOf(tiledPlane(2.2, d - 2, 3), pathMat, -w * 0.18, 0.07, -d / 2);
    path.rotation.x = -Math.PI / 2;
    g.add(path);
    // trees
    const leafMat = pool.get('parkleaf', () =>
      makeFoliage(pool.field, { map: leafTexture({ color: futuristic ? '#3f9c6a' : '#4f8a3c', seed: 101 }), color: '#8fc06a' })
    );
    const barkMat = pool.get('bark', () => makeStandard(pool.field, { color: '#4a3a2c', roughness: 1 }));
    for (let i = 0; i < 5; i++) {
      const tr = new THREE.Group();
      const th = rng.range(3.4, 5.4);
      tr.add(cyl(barkMat, 0.16, th, 0, th / 2, 0, 8));
      for (let j = 0; j < 3; j++) {
        const c = plane(leafMat, rng.range(2.4, 3.6), rng.range(2.2, 3.2), rng.range(-0.5, 0.5), th * 0.85 + rng.range(-0.3, 0.5), rng.range(-0.4, 0.4));
        c.userData.billboard = true;
        tr.add(c);
      }
      tr.position.set(rng.range(-w / 2 + 2, w / 2 - 2), 0, rng.range(-d + 2, -2.5));
      g.add(tr);
    }
    // benches
    for (let i = 0; i < 3; i++) {
      const b = new THREE.Group();
      const bm = pool.get('parkbench', () =>
        makeStandard(pool.field, { color: futuristic ? '#2b3a44' : '#6b563c', roughness: 0.8 })
      );
      b.add(box(bm, 1.8, 0.09, 0.5, 0, 0.45, 0));
      b.add(box(bm, 1.8, 0.5, 0.08, 0, 0.7, -0.22));
      b.add(box(bm, 0.1, 0.45, 0.5, -0.8, 0.22, 0));
      b.add(box(bm, 0.1, 0.45, 0.5, 0.8, 0.22, 0));
      if (futuristic) b.add(box(emis(pool, era.accent, 2), 1.8, 0.03, 0.05, 0, 0.38, 0.24));
      b.position.set(-w * 0.18 + (i - 1) * 0.1, 0, -3 - i * 4);
      b.rotation.y = i % 2 ? 0.1 : -0.1;
      g.add(b);
    }
    if (futuristic) {
      // hydroponic towers + mist
      for (let i = 0; i < 4; i++) {
        const tw = new THREE.Group();
        tw.add(cyl(pool.get('hydro', () => makeStandard(pool.field, { color: '#2b3a44', metalness: 0.4, roughness: 0.4 })), 0.4, 5, 0, 2.5, 0, 10));
        for (let j = 0; j < 5; j++) {
          const ring = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.09, 6, 16), pool.get('hydroring', () => makeStandard(pool.field, { color: '#4f8a5c' })));
          ring.rotation.x = Math.PI / 2;
          ring.position.y = 0.8 + j * 0.9;
          tw.add(ring);
        }
        tw.add(cyl(emis(pool, '#ff8fd0', 2), 0.06, 5, 0.5, 2.5, 0, 6));
        tw.position.set(-w / 2 + 2.5 + i * ((w - 5) / 3), 0, -d * 0.8);
        g.add(tw);
      }
      g.userData.misters = [new THREE.Vector3(0, 2.4, -d * 0.5)];
    }
    // park sign
    const signMat = pool.get(`parksign|${year}`, () =>
      makeStandard(pool.field, {
        map: signTexture({
          text: spec.tenant.name,
          sub: spec.tenant.sub,
          style: spec.tenant.style,
          bg: spec.tenant.bg,
          ink: spec.tenant.ink,
          accent: spec.tenant.accent,
          font: spec.tenant.font,
          w: 512,
          h: 256
        }),
        roughness: 0.8,
        side: THREE.DoubleSide
      })
    );
    const ps = plane(signMat, 3, 1.5, 0, 1.6, -0.6);
    g.add(ps);
    g.add(box(pool.get('signpost', () => makeStandard(pool.field, { color: '#3f4a3f' })), 0.12, 1.7, 0.12, -1.3, 0.85, -0.6));
    g.add(box(pool.get('signpost', () => makeStandard(pool.field, { color: '#3f4a3f' })), 0.12, 1.7, 0.12, 1.3, 0.85, -0.6));
  }

  tag(g, year, spec.tenant?.name || 'Vacant lot', spec.tenant?.sub || 'A gap in the street wall.');
  return g;
}
