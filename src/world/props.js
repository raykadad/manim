/**
 * Street furniture.
 *
 * The kit list in each era decides what stands at the kerb. A 1945 pavement is
 * cast iron, timber and enamel; by 2055 it is glowing bollards, misting arches
 * and sorting bins. Lamp posts double as the era's night lighting.
 */

import * as THREE from 'three';
import { BLOCK } from './layout.js';
import { box, plane, cyl, cone, sphere, tiledPlane, meshOf, tag, extrude } from './kit.js';
import { makeStandard, makeGlass, makeEmissive, makeGlow, makeChrome, makeFoliage } from '../gfx/materials.js';
import { glowTexture, leafTexture, plateTexture, metalPanelTexture, adTexture, screenTexture, signTexture } from '../gfx/textures.js';
import { makeRng } from '../util/rng.js';

const KERB = BLOCK.kerb;
const FURNITURE_Z = KERB + 0.85;
const WALK_Y = BLOCK.sidewalkHeight;

function flat(pool, color, opts = {}) {
  return pool.get(`flat|${color}|${JSON.stringify(opts)}`, () =>
    makeStandard(pool.field, { color: new THREE.Color(color), roughness: 0.85, ...opts })
  );
}
function emis(pool, color, intensity = 2) {
  return pool.get(`emis|${color}|${intensity}`, () => makeEmissive(pool.field, { color, intensity }));
}

/* ------------------------------------------------------------------ */
/*  Lamp posts                                                         */
/* ------------------------------------------------------------------ */

function lampPost(pool, era, cfg) {
  const g = new THREE.Group();
  const mat = flat(pool, cfg.color, { metalness: 0.45, roughness: 0.55 });
  const bulb = emis(pool, cfg.glow, 3.2);
  const h = cfg.height;
  const lights = [];

  if (cfg.kind === 'castiron') {
    g.add(cyl(mat, 0.22, 0.5, 0, 0.25, 0, 12));
    g.add(cyl(mat, 0.13, h * 0.55, 0, h * 0.3, 0, 12));
    g.add(cyl(mat, 0.1, h * 0.45, 0, h * 0.72, 0, 12));
    // fluted collar
    for (let i = 0; i < 3; i++) g.add(cyl(mat, 0.17 - i * 0.02, 0.09, 0, 0.6 + i * 0.14, 0, 12));
    const lantern = new THREE.Group();
    const glassMat = pool.get('lampglass', () => makeGlass(pool.field, { color: '#fff0d0', opacity: 0.3, roughness: 0.3 }));
    lantern.add(cyl(glassMat, 0.3, 0.7, 0, 0, 0, 10));
    lantern.add(sphere(bulb, 0.16, 0, 0, 0, 8));
    lantern.add(cone(mat, 0.36, 0.28, 0, 0.46, 0, 10));
    lantern.add(cyl(mat, 0.05, 0.2, 0, 0.66, 0, 8));
    lantern.position.y = h;
    g.add(lantern);
    lights.push({ pos: new THREE.Vector3(0, h, 0), color: cfg.glow, radius: 7 });
    // ladder rest arm
    g.add(box(mat, 0.6, 0.05, 0.05, 0, h - 0.7, 0));
  } else if (cfg.kind === 'streamline') {
    g.add(cyl(mat, 0.18, 0.3, 0, 0.15, 0, 12));
    g.add(cyl(mat, 0.11, h, 0, h / 2, 0, 12));
    const head = new THREE.Group();
    const shell = new THREE.Mesh(new THREE.SphereGeometry(0.42, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), makeChrome(pool.field));
    head.add(shell);
    head.add(cyl(bulb, 0.34, 0.12, 0, -0.06, 0, 14));
    head.position.set(0.9, h, 0);
    g.add(head);
    const arm = box(mat, 1.8, 0.1, 0.1, 0.45, h + 0.05, 0);
    g.add(arm);
    lights.push({ pos: new THREE.Vector3(0.9, h, 0), color: cfg.glow, radius: 8 });
  } else if (cfg.kind === 'cobra') {
    g.add(cyl(mat, 0.16, 0.3, 0, 0.15, 0, 10));
    g.add(cyl(mat, 0.1, h, 0, h / 2, 0, 10));
    const armPts = [];
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      armPts.push(new THREE.Vector3(t * 2.4, h + Math.sin(t * 1.5) * 0.5, 0));
    }
    const armGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(armPts), 10, 0.07, 6, false);
    g.add(new THREE.Mesh(armGeo, mat));
    const head = new THREE.Group();
    const shell = box(mat, 1.1, 0.22, 0.5);
    head.add(shell);
    head.add(box(bulb, 0.95, 0.08, 0.4, 0, -0.14, 0));
    head.position.set(2.5, h + 0.5, 0);
    head.rotation.z = -0.1;
    g.add(head);
    lights.push({ pos: new THREE.Vector3(2.5, h + 0.4, 0), color: cfg.glow, radius: 10 });
  } else if (cfg.kind === 'shepherd') {
    g.add(cyl(mat, 0.17, 0.5, 0, 0.25, 0, 12));
    g.add(cyl(mat, 0.09, h, 0, h / 2, 0, 12));
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, h, 0),
      new THREE.Vector3(0.5, h + 0.6, 0),
      new THREE.Vector3(1.3, h + 0.5, 0)
    ]);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 10, 0.07, 6, false), mat));
    const lantern = new THREE.Group();
    lantern.add(cone(mat, 0.3, 0.34, 0, 0.1, 0, 10));
    lantern.add(sphere(bulb, 0.18, 0, -0.1, 0, 8));
    lantern.position.set(1.3, h + 0.3, 0);
    g.add(lantern);
    lights.push({ pos: new THREE.Vector3(1.3, h + 0.2, 0), color: cfg.glow, radius: 8 });
  } else if (cfg.kind === 'led') {
    g.add(cyl(mat, 0.16, 0.4, 0, 0.2, 0, 12));
    g.add(cyl(mat, 0.085, h, 0, h / 2, 0, 12));
    g.add(box(mat, 1.7, 0.09, 0.09, 0.85, h, 0));
    const head = box(mat, 0.75, 0.12, 0.32, 1.6, h - 0.06, 0);
    g.add(head);
    g.add(box(bulb, 0.66, 0.05, 0.26, 1.6, h - 0.13, 0));
    lights.push({ pos: new THREE.Vector3(1.6, h - 0.2, 0), color: cfg.glow, radius: 9 });
    // banner arm
    g.add(box(mat, 0.06, 0.06, 0.5, 0, h - 1.6, 0.25));
  } else {
    // 2055 floating luminaire on a slim mast
    g.add(cyl(mat, 0.13, 0.3, 0, 0.15, 0, 12));
    g.add(cyl(mat, 0.06, h * 0.8, 0, h * 0.4, 0, 10));
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.06, 8, 28), emis(pool, cfg.glow, 2.2));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = h;
    ring.userData.hover = { base: h, amp: 0.14, speed: 0.5 };
    g.add(ring);
    const disc = plane(pool.get(`lampglow|${cfg.glow}`, () => makeGlow({ color: cfg.glow, map: glowTexture(cfg.glow, 0.5), opacity: 0.14 })), 3.4, 3.4, 0, h, 0);
    disc.rotation.x = -Math.PI / 2;
    g.add(disc);
    lights.push({ pos: new THREE.Vector3(0, h, 0), color: cfg.glow, radius: 8 });
  }

  g.userData.lights = lights;
  tag(g, era.year, 'Street lamp', {
    castiron: 'Cast-iron standard with an incandescent lantern — 2,000 lumens of warm, wasteful light.',
    streamline: 'Aluminium mast, mercury-vapour globe. The colour of an optimistic decade.',
    cobra: 'High-pressure sodium cobra head. Everything it touches turns amber.',
    shepherd: 'Metal-halide shepherd’s crook, chosen from a catalogue by a committee.',
    led: 'Full cut-off LED at 3000K, dimmed after midnight by the pole’s own controller.',
    floating: 'Magnetically suspended luminaire. No pole above two metres, no glare above the horizontal.'
  }[cfg.kind]);
  return g;
}

/* ------------------------------------------------------------------ */
/*  Individual kit items                                               */
/* ------------------------------------------------------------------ */

function kitItem(name, pool, era, rng) {
  const g = new THREE.Group();
  const year = era.year;
  const metal = flat(pool, '#6f6d66', { metalness: 0.5, roughness: 0.5 });
  const dark = flat(pool, '#33352f', { metalness: 0.4, roughness: 0.6 });

  switch (name) {
    case 'hydrant': {
      const m = flat(pool, era.street.hydrantColor, { metalness: 0.3, roughness: 0.6 });
      g.add(cyl(m, 0.24, 0.16, 0, 0.08, 0, 12));
      g.add(cyl(m, 0.16, 0.62, 0, 0.4, 0, 12));
      g.add(sphere(m, 0.18, 0, 0.76, 0, 10));
      const nozzle = cyl(m, 0.08, 0.2, 0.2, 0.5, 0, 8);
      nozzle.rotation.z = Math.PI / 2;
      g.add(nozzle);
      g.add(cyl(m, 0.05, 0.12, 0, 0.9, 0, 8));
      tag(g, year, 'Fire hydrant', 'Dry-barrel pattern, 100 mm outlet, painted whatever colour the city bought in bulk.');
      break;
    }
    case 'mailbox_olive':
    case 'mailbox_blue': {
      const col = name === 'mailbox_olive' ? '#4a5540' : '#1b4a8a';
      const m = flat(pool, col, { roughness: 0.65 });
      if (year <= 1955) {
        g.add(cyl(m, 0.3, 1.1, 0, 0.55, 0, 14));
        g.add(cone(m, 0.34, 0.24, 0, 1.2, 0, 14));
        g.add(cyl(metal, 0.06, 0.4, 0, 0.2, 0, 8));
      } else {
        g.add(box(m, 0.75, 0.95, 0.6, 0, 0.72, 0));
        const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.75, 14, 1, false, 0, Math.PI), m);
        lid.rotation.z = Math.PI / 2;
        lid.position.set(0, 1.2, 0);
        g.add(lid);
        g.add(box(metal, 0.1, 0.25, 0.1, -0.3, 0.12, 0.2));
        g.add(box(metal, 0.1, 0.25, 0.1, 0.3, 0.12, 0.2));
        g.add(box(flat(pool, '#e8e2d0'), 0.3, 0.14, 0.02, 0, 0.95, 0.31));
      }
      tag(g, year, 'Mail box', year <= 1955 ? 'Olive-drab wartime paint, twice-daily collection.' : 'Two collections a day, then one, then a sticker saying the box is being removed.');
      break;
    }
    case 'ashcan':
    case 'trashcan_metal': {
      g.add(cyl(flat(pool, '#5f5c54', { metalness: 0.35, roughness: 0.7 }), 0.32, 0.85, 0, 0.42, 0, 14));
      for (let i = 0; i < 3; i++) g.add(cyl(dark, 0.34, 0.05, 0, 0.2 + i * 0.28, 0, 14));
      g.add(cyl(dark, 0.34, 0.06, 0, 0.87, 0, 14));
      break;
    }
    case 'trashcan_wire': {
      const mat = pool.get('wirebin', () =>
        makeStandard(pool.field, {
          map: metalPanelTexture({ color: '#4a4a44', grime: 0.6, seed: 71, ribs: 18 }),
          transparent: true,
          opacity: 0.75,
          roughness: 0.7,
          metalness: 0.5,
          side: THREE.DoubleSide
        })
      );
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.28, 0.9, 14, 1, true), mat);
      c.position.y = 0.45;
      g.add(c);
      g.add(cyl(dark, 0.34, 0.05, 0, 0.9, 0, 14));
      g.add(box(flat(pool, '#3f3a32'), 0.5, 0.1, 0.5, 0, 0.03, 0));
      break;
    }
    case 'trashcan_mesh':
    case 'trashcan_solar':
    case 'trashcan_sorter': {
      const body = flat(pool, name === 'trashcan_solar' ? '#2f6b4a' : name === 'trashcan_sorter' ? '#2b3238' : '#3f4348', { roughness: 0.6 });
      g.add(box(body, 0.62, 1.1, 0.62, 0, 0.55, 0));
      g.add(box(dark, 0.66, 0.1, 0.66, 0, 1.12, 0));
      if (name === 'trashcan_solar') {
        g.add(box(flat(pool, '#16233a', { metalness: 0.6, roughness: 0.25 }), 0.6, 0.05, 0.6, 0, 1.2, 0));
        g.add(plane(emis(pool, '#5fd6a4', 1.6), 0.2, 0.1, 0, 0.85, 0.32));
      }
      if (name === 'trashcan_sorter') {
        for (let i = 0; i < 3; i++) g.add(box(emis(pool, ['#63f5ff', '#7dffb0', '#ff5dc8'][i], 2), 0.16, 0.03, 0.02, -0.2 + i * 0.2, 1.16, 0.32));
      }
      break;
    }
    case 'newsstand': {
      const wood = flat(pool, '#5f4a34', { roughness: 1 });
      g.add(box(wood, 2.4, 2.1, 1.3, 0, 1.05, 0));
      g.add(box(flat(pool, '#3a4a3f'), 2.7, 0.12, 1.7, 0, 2.15, 0.1));
      g.add(box(flat(pool, '#14161a'), 1.6, 0.9, 0.1, 0, 1.5, 0.66));
      // stacked papers
      for (let i = 0; i < 4; i++) {
        g.add(box(flat(pool, '#d8d2c0'), 0.42, 0.12, 0.32, -0.8 + i * 0.5, 1.02, 0.78));
      }
      g.add(box(flat(pool, '#c8452f'), 1.5, 0.32, 0.05, 0, 2.02, 0.7));
      tag(g, year, 'News stand', 'Four dailies, two evening editions, cigars, and every result before the radio has it.');
      break;
    }
    case 'newsbox':
    case 'newsbox_free': {
      for (let i = 0; i < 2; i++) {
        const col = name === 'newsbox_free' ? ['#c8452f', '#2f6b8c'][i] : ['#1b3a6b', '#8a2f2a'][i];
        const b = new THREE.Group();
        b.add(box(flat(pool, col), 0.44, 0.95, 0.4, 0, 0.62, 0));
        b.add(box(dark, 0.46, 0.1, 0.42, 0, 0.12, 0));
        b.add(plane(flat(pool, '#d8d2c0'), 0.3, 0.32, 0, 0.85, 0.21));
        b.position.x = i * 0.5;
        g.add(b);
      }
      break;
    }
    case 'phonebooth_wood':
    case 'phonebooth_alum': {
      const isWood = name === 'phonebooth_wood';
      const frame = flat(pool, isWood ? '#4a3524' : '#b8bcc0', { metalness: isWood ? 0 : 0.6, roughness: isWood ? 0.8 : 0.35 });
      const glass = pool.get('boothglass', () => makeGlass(pool.field, { color: '#cfe0e8', opacity: 0.22, roughness: 0.05 }));
      g.add(box(frame, 1.05, 0.14, 1.05, 0, 0.07, 0));
      for (const [x, z] of [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]]) g.add(box(frame, 0.1, 2.4, 0.1, x, 1.2, z));
      g.add(box(frame, 1.1, 0.3, 1.1, 0, 2.4, 0));
      for (const [x, z, ry] of [[0, -0.5, 0], [-0.5, 0, Math.PI / 2], [0.5, 0, Math.PI / 2]]) {
        const p = box(glass, 0.9, 2, 0.04, x, 1.3, z);
        p.rotation.y = ry;
        g.add(p);
      }
      g.add(box(flat(pool, '#22242a'), 0.4, 0.6, 0.14, 0, 1.5, 0.42));
      g.add(box(emis(pool, isWood ? '#ffe0a8' : '#e8f0ff', 1.6), 0.7, 0.16, 0.7, 0, 2.28, 0));
      tag(g, year, 'Telephone box', isWood ? 'Folding timber door, a directory on a chain, and a seat.' : 'Aluminium and glass, no seat, and a shelf for the phone book that is always missing.');
      break;
    }
    case 'payphone': {
      g.add(box(flat(pool, '#8d8b84', { metalness: 0.5, roughness: 0.5 }), 0.5, 1.2, 0.28, 0, 1.4, 0));
      g.add(box(flat(pool, '#22242a'), 0.34, 0.5, 0.1, 0, 1.6, 0.16));
      g.add(box(flat(pool, '#1c1e22'), 0.12, 0.3, 0.1, -0.2, 1.4, 0.16));
      g.add(cyl(metal, 0.06, 1.4, 0, 0.7, 0, 8));
      g.add(box(flat(pool, '#1b4a8a'), 0.55, 0.3, 0.06, 0, 2.15, 0));
      tag(g, year, 'Payphone', 'A quarter for three minutes. The receiver cord has been replaced four times.');
      break;
    }
    case 'parkingmeter': {
      g.add(cyl(metal, 0.05, 1.15, 0, 0.58, 0, 8));
      const head = box(flat(pool, year <= 1975 ? '#4a5540' : '#5f6266', { metalness: 0.4 }), 0.24, 0.34, 0.16, 0, 1.3, 0);
      g.add(head);
      g.add(plane(flat(pool, '#e8e2d0'), 0.16, 0.16, 0, 1.34, 0.085));
      g.add(box(flat(pool, '#c8452f'), 0.1, 0.05, 0.02, 0, 1.28, 0.09));
      tag(g, year, 'Parking meter', 'Twelve minutes for a nickel. The city discovered its most reliable revenue in 1935.');
      break;
    }
    case 'bench_wood':
    case 'bench_slat':
    case 'bench_modern':
    case 'bench_glow': {
      const seat = flat(
        pool,
        name === 'bench_wood' ? '#6b563c' : name === 'bench_slat' ? '#5a6b52' : name === 'bench_modern' ? '#3f4348' : '#2b3a44',
        { roughness: 0.8 }
      );
      const slats = name === 'bench_modern' || name === 'bench_glow' ? 1 : 4;
      for (let i = 0; i < slats; i++) {
        g.add(box(seat, 1.9, 0.07, slats === 1 ? 0.55 : 0.1, 0, 0.45, -0.2 + i * 0.13));
      }
      if (name !== 'bench_modern' && name !== 'bench_glow') {
        for (let i = 0; i < 3; i++) g.add(box(seat, 1.9, 0.1, 0.07, 0, 0.62 + i * 0.15, -0.24));
      } else {
        g.add(box(seat, 1.9, 0.4, 0.07, 0, 0.68, -0.26));
      }
      g.add(box(flat(pool, '#3a3630', { metalness: 0.4 }), 0.1, 0.45, 0.5, -0.85, 0.22, 0));
      g.add(box(flat(pool, '#3a3630', { metalness: 0.4 }), 0.1, 0.45, 0.5, 0.85, 0.22, 0));
      if (name === 'bench_glow') g.add(box(emis(pool, era.accent, 2.2), 1.9, 0.03, 0.05, 0, 0.4, 0.27));
      break;
    }
    case 'busshelter':
    case 'busshelter_led':
    case 'busshelter_holo': {
      const frame = flat(pool, year <= 1985 ? '#7d8288' : '#2f3540', { metalness: 0.55, roughness: 0.4 });
      const glass = pool.get('shelterglass', () => makeGlass(pool.field, { color: '#cfe0e8', opacity: 0.18, roughness: 0.04 }));
      g.add(box(frame, 3.6, 0.14, 1.5, 0, 2.5, 0));
      for (const x of [-1.7, 1.7]) {
        g.add(box(frame, 0.1, 2.5, 0.1, x, 1.25, -0.7));
        g.add(box(frame, 0.1, 2.5, 0.1, x, 1.25, 0.7));
        const side = box(glass, 1.4, 2.1, 0.04, x, 1.3, 0);
        side.rotation.y = Math.PI / 2;
        g.add(side);
      }
      g.add(box(glass, 3.4, 2.1, 0.04, 0, 1.3, -0.7));
      g.add(box(frame, 3, 0.08, 0.4, 0, 0.55, -0.45));
      // ad panel
      const adMat = pool.get(`shelterad|${year}`, () =>
        makeStandard(pool.field, {
          map: adTexture({
            headline: era.billboards[1].headline,
            sub: era.billboards[1].sub,
            scheme: era.billboards[1].scheme,
            style: era.billboards[1].style,
            seed: 8,
            w: 512,
            h: 1024
          }),
          emissive: new THREE.Color('#ffffff'),
          emissiveIntensity: year >= 1985 ? 0.55 : 0,
          roughness: 0.6
        })
      );
      const ad = plane(adMat, 1.2, 2, 1.7, 1.3, 0.001);
      ad.rotation.y = Math.PI / 2;
      g.add(ad);
      if (name !== 'busshelter') {
        const scr = pool.get('sheltertimes', () =>
          makeEmissive(pool.field, { color: '#ffffff', intensity: 1.5, map: screenTexture({ mode: 'led', tint: name === 'busshelter_holo' ? '#63f5ff' : '#ffb35c', text: '4 MIN', seed: 9 }) })
        );
        g.add(plane(scr, 1, 0.4, -0.9, 2.15, -0.66));
      }
      g.add(box(emis(pool, '#f0ecd8', 1.2), 3.2, 0.06, 1.2, 0, 2.4, 0));
      tag(g, year, 'Bus shelter', 'Three sides of glass, one advertisement, and a bench angled to discourage sleeping.');
      break;
    }
    case 'bikerack': {
      const m = flat(pool, '#8d8b84', { metalness: 0.6, roughness: 0.4 });
      for (let i = 0; i < 3; i++) {
        const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.035, 6, 14, Math.PI), m);
        hoop.position.set(i * 0.8 - 0.8, 0.35, 0);
        g.add(hoop);
      }
      break;
    }
    case 'bikeshare': {
      const m = flat(pool, '#2f3a3f', { metalness: 0.4, roughness: 0.5 });
      g.add(box(m, 4.4, 0.2, 0.5, 0, 0.1, 0));
      for (let i = 0; i < 5; i++) {
        const dock = new THREE.Group();
        dock.add(box(m, 0.14, 0.7, 0.4, 0, 0.35, 0));
        dock.add(box(emis(pool, '#5fd6a4', 1.8), 0.06, 0.06, 0.06, 0, 0.62, 0.21));
        if (i < 3) {
          const bike = new THREE.Group();
          const frame = flat(pool, '#ffb35c', { metalness: 0.3 });
          for (const wx of [-0.42, 0.42]) {
            const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.04, 6, 14), flat(pool, '#1c1e20'));
            wheel.position.set(wx, 0.28, 0);
            bike.add(wheel);
          }
          bike.add(box(frame, 0.85, 0.06, 0.05, 0, 0.5, 0));
          bike.add(box(frame, 0.06, 0.35, 0.05, 0.36, 0.65, 0));
          bike.add(box(flat(pool, '#2b3238'), 0.24, 0.07, 0.12, -0.14, 0.7, 0));
          bike.position.set(0, 0, 0.6);
          dock.add(bike);
        }
        dock.position.x = -1.8 + i * 0.9;
        g.add(dock);
      }
      const kiosk = new THREE.Group();
      kiosk.add(box(m, 0.5, 1.6, 0.3, 0, 0.8, 0));
      kiosk.add(plane(emis(pool, '#8fd0ff', 1.4), 0.34, 0.34, 0, 1.2, 0.16));
      kiosk.position.set(2.6, 0, 0);
      g.add(kiosk);
      tag(g, year, 'Bike-share dock', 'Five docks, three bikes, and one that has been reported broken for a month.');
      break;
    }
    case 'scooters': {
      for (let i = 0; i < 3; i++) {
        const s = new THREE.Group();
        const col = ['#5fd6a4', '#ffb35c', '#e8e4dc'][i];
        s.add(box(flat(pool, col, { metalness: 0.3 }), 0.9, 0.07, 0.2, 0, 0.14, 0));
        s.add(cyl(flat(pool, '#2b3238'), 0.03, 1, 0.42, 0.6, 0, 8));
        s.add(box(flat(pool, '#2b3238'), 0.06, 0.05, 0.42, 0.42, 1.05, 0));
        for (const wx of [-0.4, 0.42]) {
          const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.05, 6, 12), flat(pool, '#1c1e20'));
          wheel.position.set(wx, 0.12, 0);
          s.add(wheel);
        }
        if (i === 2) {
          s.rotation.z = Math.PI * 0.42;
          s.position.y = 0.2;
        }
        s.position.x = i * 1.1 - 1;
        s.rotation.y = (i - 1) * 0.5;
        g.add(s);
      }
      tag(g, year, 'Shared e-scooters', 'Three left where the last rider stopped caring.');
      break;
    }
    case 'dumpster': {
      const m = pool.get('dumpster', () =>
        makeStandard(pool.field, { map: metalPanelTexture({ color: '#3f5f4a', grime: 0.8, seed: 33, ribs: 6 }), roughness: 0.7, metalness: 0.4 })
      );
      g.add(box(m, 2.6, 1.4, 1.4, 0, 0.75, 0));
      const lid = box(m, 2.65, 0.12, 1.5, 0, 1.5, -0.1);
      lid.rotation.x = -0.25;
      g.add(lid);
      for (const x of [-1.1, 1.1]) g.add(cyl(flat(pool, '#22242a'), 0.14, 0.16, x, 0.14, 0.5, 8));
      for (let i = 0; i < 4; i++) {
        g.add(sphere(flat(pool, '#22242a'), 0.28, -0.9 + i * 0.6, 1.55, 0.2, 6));
      }
      tag(g, year, 'Dumpster', 'Collected Tuesdays. Full by Wednesday, climbed into by Thursday.');
      break;
    }
    case 'trashbags': {
      for (let i = 0; i < 6; i++) {
        const b = sphere(flat(pool, '#22242a', { roughness: 0.75 }), 0.34, rng.range(-0.8, 0.8), 0.3, rng.range(-0.4, 0.4), 8);
        b.scale.y = 0.85;
        g.add(b);
      }
      break;
    }
    case 'crates': {
      const wood = flat(pool, '#7d6244', { roughness: 1 });
      for (let i = 0; i < 4; i++) {
        const c = box(wood, 0.6, 0.34, 0.44, rng.range(-0.15, 0.15), 0.18 + i * 0.35, 0);
        c.rotation.y = rng.range(-0.25, 0.25);
        g.add(c);
      }
      break;
    }
    case 'firealarm': {
      g.add(cyl(flat(pool, '#8a2f2a', { metalness: 0.3 }), 0.09, 2.2, 0, 1.1, 0, 10));
      g.add(box(flat(pool, '#8a2f2a'), 0.3, 0.42, 0.24, 0, 2.35, 0));
      g.add(sphere(emis(pool, '#ff5d3a', 2), 0.09, 0, 2.62, 0, 8));
      break;
    }
    case 'coalchute': {
      g.add(box(flat(pool, '#3a3630', { metalness: 0.4 }), 0.7, 0.12, 0.7, 0, 0.06, 0));
      g.add(cyl(flat(pool, '#22242a'), 0.28, 0.1, 0, 0.13, 0, 12));
      break;
    }
    case 'steamvent': {
      g.add(cyl(flat(pool, '#5f5c54', { metalness: 0.4 }), 0.42, 0.18, 0, 0.09, 0, 14));
      g.add(cyl(flat(pool, '#33352f'), 0.36, 0.06, 0, 0.2, 0, 14));
      g.userData.steam = true;
      break;
    }
    case 'chainlink': {
      const mat = pool.get('chainlinkfence', () =>
        makeStandard(pool.field, {
          map: metalPanelTexture({ color: '#9c9a92', grime: 0.5, seed: 17, ribs: 26 }),
          transparent: true,
          opacity: 0.38,
          roughness: 0.6,
          metalness: 0.5,
          side: THREE.DoubleSide
        })
      );
      g.add(plane(mat, 5, 2.2, 0, 1.1, 0));
      for (let i = 0; i <= 2; i++) g.add(cyl(flat(pool, '#8d8b84', { metalness: 0.5 }), 0.05, 2.3, -2.5 + i * 2.5, 1.15, 0, 8));
      break;
    }
    case 'construction_fence': {
      const mat = pool.get('constfence', () => makeStandard(pool.field, { color: '#e8722a', roughness: 0.8, side: THREE.DoubleSide }));
      for (let i = 0; i < 3; i++) {
        const p = plane(mat, 2, 1.1, -2 + i * 2, 0.6, 0);
        g.add(p);
        g.add(box(flat(pool, '#2b3238'), 0.6, 0.1, 0.4, -2 + i * 2, 0.05, 0));
      }
      break;
    }
    case 'planter':
    case 'planter_big': {
      const big = name === 'planter_big';
      g.add(box(flat(pool, big ? '#4a5450' : '#8a8272', { roughness: 0.95 }), big ? 1.8 : 1.1, 0.6, big ? 1.1 : 0.7, 0, 0.3, 0));
      g.add(box(flat(pool, '#3f3227'), big ? 1.65 : 0.98, 0.1, big ? 0.98 : 0.6, 0, 0.62, 0));
      const leaf = pool.get('kitleaf', () => makeFoliage(pool.field, { map: leafTexture({ color: '#4f8a3c', seed: 44 }), color: '#8fc06a' }));
      for (let i = 0; i < (big ? 3 : 2); i++) {
        const b = plane(leaf, big ? 1.2 : 0.9, big ? 1.3 : 0.85, -0.4 + i * 0.5, big ? 1.3 : 1.05, 0);
        b.userData.billboard = true;
        g.add(b);
      }
      break;
    }
    case 'raingarden': {
      g.add(box(flat(pool, '#6b6459'), 3.2, 0.3, 1.4, 0, 0.15, 0));
      g.add(box(flat(pool, '#3f4a35'), 3, 0.14, 1.2, 0, 0.28, 0));
      const leaf = pool.get('grassleaf', () => makeFoliage(pool.field, { map: leafTexture({ color: '#6b8a3a', seed: 51 }), color: '#9cb56a' }));
      for (let i = 0; i < 5; i++) {
        const b = plane(leaf, 0.7, 0.8, -1.2 + i * 0.6, 0.65, 0);
        b.userData.billboard = true;
        g.add(b);
      }
      tag(g, year, 'Rain garden', 'A kerbside sponge. Takes the first 20 mm of a storm out of the sewer.');
      break;
    }
    case 'holobollard': {
      g.add(cyl(flat(pool, '#252b33', { metalness: 0.5 }), 0.13, 0.95, 0, 0.48, 0, 10));
      g.add(sphere(emis(pool, era.accent, 3), 0.1, 0, 1, 0, 8));
      const beam = cyl(pool.get('bollardBeam2', () => makeGlow({ color: era.accent, opacity: 0.24 })), 0.1, 2.6, 0, 2.3, 0, 8);
      g.add(beam);
      break;
    }
    case 'lightstrip': {
      const strip = box(emis(pool, era.accent, 2.4), 5, 0.05, 0.14, 0, 0.03, 0);
      g.add(strip);
      break;
    }
    case 'chargepad': {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.05, 6, 26), emis(pool, era.accent2 || '#7dffb0', 2.4));
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.04;
      ring.userData.pulse = { base: 2.4, amp: 1.1, speed: 1.2 };
      g.add(ring);
      break;
    }
    case 'mister': {
      const arch = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.07, 8, 20, Math.PI), flat(pool, '#39424f', { metalness: 0.6, roughness: 0.35 }));
      arch.position.y = 0.1;
      g.add(arch);
      for (let i = 0; i < 5; i++) {
        const a = (i / 4) * Math.PI;
        g.add(sphere(emis(pool, '#9fe8ff', 1.6), 0.05, Math.cos(a) * 2.4, 0.1 + Math.sin(a) * 2.4, 0, 6));
      }
      g.userData.mister = true;
      tag(g, year, 'Misting arch', 'Evaporative cooling. Drops the pavement three degrees for eight litres an hour.');
      break;
    }
    case 'dronepad': {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.05, 6, 22), emis(pool, era.accent2 || '#7dffb0', 2.4));
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.05;
      g.add(ring);
      g.add(cyl(flat(pool, '#1c222a'), 1, 0.06, 0, 0.02, 0, 20));
      break;
    }
    case 'sensorpole': {
      g.add(cyl(flat(pool, '#39424f', { metalness: 0.5 }), 0.08, 4.4, 0, 2.2, 0, 10));
      g.add(box(flat(pool, '#2b3238'), 0.3, 0.3, 0.3, 0, 4.5, 0));
      for (let i = 0; i < 3; i++) g.add(sphere(emis(pool, ['#63f5ff', '#ff5dc8', '#7dffb0'][i], 2.4), 0.05, 0, 4.5, 0.16 - i * 0.16, 6));
      break;
    }
    case 'vertifarm_pod': {
      g.add(cyl(flat(pool, '#2b3a44', { metalness: 0.4 }), 0.5, 3, 0, 1.5, 0, 12));
      for (let j = 0; j < 4; j++) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.1, 6, 14), flat(pool, '#4f8a5c'));
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.7 + j * 0.7;
        g.add(ring);
      }
      g.add(cyl(emis(pool, '#ff8fd0', 2), 0.05, 3, 0.55, 1.5, 0, 6));
      break;
    }
    case 'atm': {
      g.add(box(flat(pool, '#3a4048', { metalness: 0.5, roughness: 0.4 }), 0.8, 1.9, 0.5, 0, 0.95, 0));
      g.add(plane(emis(pool, '#8fd0ff', 1.4), 0.44, 0.34, 0, 1.35, 0.26));
      break;
    }
    case 'securitycam': {
      g.add(cyl(flat(pool, '#8d8b84', { metalness: 0.5 }), 0.05, 3, 0, 1.5, 0, 8));
      g.add(box(flat(pool, '#d8d4c8'), 0.1, 0.1, 0.4, 0, 3, 0.16));
      break;
    }
    case 'sandwichboard': {
      const bm = flat(pool, '#3a3128');
      const a = box(bm, 0.62, 0.95, 0.04, 0, 0.5, -0.16);
      a.rotation.x = 0.16;
      const b = box(bm, 0.62, 0.95, 0.04, 0, 0.5, 0.16);
      b.rotation.x = -0.16;
      g.add(a, b);
      g.add(plane(flat(pool, '#e0d8c0'), 0.5, 0.8, 0, 0.52, 0.2));
      break;
    }
    case 'stringlights': {
      const bulb = emis(pool, '#ffd9a0', 3);
      for (let i = 0; i < 10; i++) g.add(sphere(bulb, 0.06, -2 + i * 0.45, 3.4 - Math.sin((i / 9) * Math.PI) * 0.4, 0, 6));
      break;
    }
    case 'graffitiwall':
    case 'boombox':
    default:
      return null;
  }
  return g;
}

/* ------------------------------------------------------------------ */
/*  Poles + overhead wires                                             */
/* ------------------------------------------------------------------ */

function utilityPole(pool, era, cfg) {
  const g = new THREE.Group();
  if (cfg.kind === 'maglev') {
    const m = flat(pool, cfg.color, { metalness: 0.6, roughness: 0.35 });
    g.add(cyl(m, 0.42, 14, 0, 7, 0, 12));
    const arm = box(m, 5, 0.6, 1.1, 2.4, 14.2, 0);
    g.add(arm);
    g.add(box(flat(pool, '#2b3238', { metalness: 0.5 }), 3.4, 0.3, 1.4, 4.2, 13.7, 0));
    for (let i = 0; i < 4; i++) g.add(sphere(emis(pool, era.accent, 2.4), 0.09, 0.6 + i * 1.3, 13.5, 0.6, 6));
    tag(g, era.year, 'Maglev pylon', 'Carries the Kessler spur. 90-second headway, 40 dB at the kerb.');
    return g;
  }
  const woodMat = flat(pool, cfg.color, { roughness: 1 });
  const h = cfg.kind === 'wood' ? 11 : 9;
  g.add(cyl(woodMat, cfg.kind === 'wood' ? 0.19 : 0.14, h, 0, h / 2, 0, cfg.kind === 'wood' ? 10 : 12));
  const armMat = flat(pool, cfg.kind === 'wood' ? '#5a4636' : '#5c605f', { roughness: 0.9 });
  const arms = cfg.kind === 'wood' ? 3 : 1;
  for (let i = 0; i < arms; i++) {
    const y = h - 0.7 - i * 1.1;
    g.add(box(armMat, 2.6 - i * 0.4, 0.13, 0.13, 0, y, 0));
    const n = cfg.kind === 'wood' ? 5 : 3;
    for (let j = 0; j < n; j++) {
      const x = -1.1 + j * (2.2 / (n - 1));
      g.add(cyl(pool.get('insulator', () => makeGlass(pool.field, { color: '#8fb8a0', opacity: 0.6, roughness: 0.3 })), 0.06, 0.16, x, y + 0.14, 0, 8));
    }
  }
  if (cfg.kind === 'wood') {
    // transformer can
    g.add(cyl(flat(pool, '#8d8b84', { metalness: 0.4 }), 0.3, 0.8, 0.3, h - 3, 0, 12));
  }
  if (cfg.kind === 'smart') {
    g.add(box(flat(pool, '#2b3238'), 0.3, 0.5, 0.3, 0, h + 0.3, 0));
    g.add(sphere(emis(pool, '#8fd0ff', 2), 0.07, 0, h + 0.6, 0, 6));
  }
  return g;
}

function overheadWires(pool, era, xs, z, sag = 0.7) {
  const g = new THREE.Group();
  const mat = pool.get('wire', () => new THREE.LineBasicMaterial({ color: 0x1c1e22, transparent: true, opacity: 0.7 }));
  const n = era.props.poles.wires;
  for (let i = 0; i < xs.length - 1; i++) {
    const x0 = xs[i];
    const x1 = xs[i + 1];
    for (let w = 0; w < n; w++) {
      const y0 = 10.3 - (w % 3) * 1.1;
      const off = -1.1 + (w % 5) * 0.55;
      const pts = [];
      for (let s = 0; s <= 8; s++) {
        const t = s / 8;
        const x = x0 + (x1 - x0) * t;
        const y = y0 - Math.sin(t * Math.PI) * sag;
        pts.push(new THREE.Vector3(x, y, z + off));
      }
      g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat));
    }
  }
  return g;
}

/* ------------------------------------------------------------------ */
/*  Traffic signals + signs                                            */
/* ------------------------------------------------------------------ */

function trafficSignal(pool, era, cfg) {
  const g = new THREE.Group();
  const mat = flat(pool, cfg.color, { metalness: 0.4, roughness: 0.6 });
  const year = era.year;

  if (cfg.kind === 'holo') {
    g.add(cyl(flat(pool, '#39424f', { metalness: 0.6 }), 0.16, 4.4, 0, 2.2, 0, 12));
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.06, 8, 24), emis(pool, '#7dffb0', 3));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 4.6;
    ring.userData.hover = { base: 4.6, amp: 0.12, speed: 0.8 };
    g.add(ring);
    const beam = cyl(pool.get('signalBeam', () => makeGlow({ color: '#7dffb0', opacity: 0.2 })), 0.5, 4.4, 0, 2.3, 0, 10);
    g.add(beam);
    tag(g, year, 'Adaptive signal', 'No lamps. The intersection negotiates directly with each vehicle and pedestrian.');
    return g;
  }

  const head = (x, y, z, ry = 0) => {
    const hg = new THREE.Group();
    hg.add(box(mat, 0.38, 1.15, 0.32, 0, 0, 0));
    hg.add(box(mat, 0.44, 0.1, 0.36, 0, 0.62, 0));
    const colors = ['#ff3b30', '#f2c14e', '#3ad46b'];
    for (let i = 0; i < 3; i++) {
      const on = i === 2;
      const lens = cyl(on ? emis(pool, colors[i], 3) : flat(pool, colors[i], { roughness: 0.4 }), 0.11, 0.06, 0, 0.36 - i * 0.36, 0.17, 12);
      lens.rotation.x = Math.PI / 2;
      hg.add(lens);
      const visor = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.16, 10, 1, true, 0, Math.PI), mat);
      visor.rotation.set(Math.PI / 2, 0, 0);
      visor.position.set(0, 0.36 - i * 0.36, 0.24);
      hg.add(visor);
      if (on) {
        const glow = plane(pool.get(`sigglow|${colors[i]}`, () => makeGlow({ color: colors[i], map: glowTexture(colors[i], 0.6), opacity: 0.5 })), 1.1, 1.1, 0, 0.36 - i * 0.36, 0.3);
        hg.add(glow);
      }
    }
    hg.position.set(x, y, z);
    hg.rotation.y = ry;
    return hg;
  };

  if (cfg.kind === 'pedestal') {
    g.add(cyl(mat, 0.22, 0.4, 0, 0.2, 0, 12));
    g.add(cyl(mat, 0.14, 2.8, 0, 1.4, 0, 12));
    g.add(head(0, 3.4, 0));
    g.add(head(0, 3.4, 0, Math.PI));
  } else {
    g.add(cyl(mat, 0.24, 0.5, 0, 0.25, 0, 12));
    g.add(cyl(mat, 0.15, 6, 0, 3, 0, 12));
    const armCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 5.4, 0),
      new THREE.Vector3(1.2, 6.1, 0),
      new THREE.Vector3(4.6, 6.2, 0)
    ]);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(armCurve, 12, 0.09, 6, false), mat));
    g.add(head(3.2, 5.5, 0));
    g.add(head(4.4, 5.5, 0));
    // pedestrian head + push button
    const ped = new THREE.Group();
    ped.add(box(mat, 0.42, 0.5, 0.3, 0, 0, 0));
    ped.add(plane(emis(pool, year >= 2025 ? '#ff8f5d' : '#ff6a3d', 2.2), 0.28, 0.34, 0, 0, 0.16));
    ped.position.set(0, 3, 0.2);
    g.add(ped);
    if (cfg.kind === 'mast_countdown') {
      const scr = pool.get('countdown', () => makeEmissive(pool.field, { color: '#ff9f5d', intensity: 2, map: screenTexture({ mode: 'led', tint: '#ff9f5d', text: '12', seed: 2 }) }));
      g.add(plane(scr, 0.24, 0.2, 0.12, 2.86, 0.17));
    }
    g.add(box(mat, 0.2, 0.3, 0.16, 0, 1.4, 0.18));
    g.add(cyl(emis(pool, '#ffe0a8', 1.4), 0.04, 0.04, 0, 1.44, 0.27, 8));
  }
  tag(g, year, 'Traffic signal', year <= 1945 ? 'Four-way pedestal signal in the middle of the junction, hand-timed by the box on the pole.' : 'Mast-arm signal, vehicle-actuated, with a walk phase nobody waits for.');
  return g;
}

function streetSign(pool, era) {
  const g = new THREE.Group();
  const post = cyl(flat(pool, '#4a5450', { metalness: 0.4 }), 0.06, 3.4, 0, 1.7, 0, 8);
  g.add(post);
  const bladeMat = pool.get(`streetname|${era.year}`, () =>
    makeStandard(pool.field, {
      map: plateTexture({
        text: 'KESSLER',
        bg: era.year <= 1965 ? '#1e5a3a' : era.year <= 2005 ? '#1e5a8a' : '#2b3238',
        ink: '#f2f0e6',
        w: 512,
        h: 128,
        font: 'grotesk'
      }),
      roughness: 0.7,
      side: THREE.DoubleSide
    })
  );
  const bladeMat2 = pool.get(`streetname2|${era.year}`, () =>
    makeStandard(pool.field, {
      map: plateTexture({
        text: '14 ST',
        bg: era.year <= 1965 ? '#1e5a3a' : era.year <= 2005 ? '#1e5a8a' : '#2b3238',
        ink: '#f2f0e6',
        w: 512,
        h: 128,
        font: 'grotesk'
      }),
      roughness: 0.7,
      side: THREE.DoubleSide
    })
  );
  const a = plane(bladeMat, 1.5, 0.36, 0.55, 3.3, 0);
  g.add(a);
  const b = plane(bladeMat2, 1.5, 0.36, 0, 2.9, 0.55);
  b.rotation.y = Math.PI / 2;
  g.add(b);
  // no-parking blade
  g.add(plane(flat(pool, '#e8e4d8', { side: THREE.DoubleSide }), 0.4, 0.6, 0, 2.2, 0.02));
  return g;
}

/* ------------------------------------------------------------------ */
/*  Trees                                                              */
/* ------------------------------------------------------------------ */

function streetTree(pool, era, rng) {
  const cfg = era.street.trees;
  const g = new THREE.Group();
  const barkMat = pool.get('streetbark', () => makeStandard(pool.field, { color: '#4a3a2c', roughness: 1 }));
  const leafMat = pool.get(`streetleaf|${cfg.leaf}|${cfg.autumn}`, () =>
    makeFoliage(pool.field, { map: leafTexture({ color: cfg.leaf, seed: 121, autumn: cfg.autumn }), color: '#a8d06a' })
  );
  const scale = { young: 0.62, mid: 0.85, scraggly: 0.7, mature: 1.15, canopy: 1.35 }[cfg.kind] || 1;
  const h = rng.range(4.2, 6) * scale;
  const trunk = cyl(barkMat, 0.15 * scale, h, 0, h / 2, 0, 8);
  trunk.castShadow = true;
  g.add(trunk);
  for (let i = 0; i < 3; i++) {
    const br = box(barkMat, 0.08, 1.4, 0.08, rng.range(-0.3, 0.3), h * 0.72 + i * 0.3, rng.range(-0.3, 0.3));
    br.rotation.z = rng.range(-0.7, 0.7);
    g.add(br);
  }
  const clumps = cfg.kind === 'scraggly' ? 2 : cfg.kind === 'canopy' ? 5 : 3;
  for (let i = 0; i < clumps; i++) {
    const size = rng.range(2.2, 3.6) * scale;
    const c = plane(leafMat, size, size * 0.85, rng.range(-0.7, 0.7), h * 0.9 + rng.range(-0.3, 0.7), rng.range(-0.7, 0.7));
    c.userData.billboard = true;
    c.castShadow = true;
    g.add(c);
  }
  // tree pit
  g.add(box(pool.get('treepit', () => makeStandard(pool.field, { color: '#3f3227', roughness: 1 })), 1.5, 0.06, 1.5, 0, 0.02, 0));
  if (era.props.treeGuards) {
    const guardMat = flat(pool, '#3a3f3a', { metalness: 0.5, roughness: 0.5 });
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.4;
      g.add(cyl(guardMat, 0.03, 1.5, Math.cos(a) * 0.5, 0.75, Math.sin(a) * 0.5, 6));
    }
    const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.025, 5, 14), guardMat);
    hoop.rotation.x = Math.PI / 2;
    hoop.position.y = 1.4;
    g.add(hoop);
  }
  tag(g, era.year, 'Street tree', `${cfg.kind === 'young' ? 'Newly planted' : cfg.kind === 'scraggly' ? 'Struggling' : cfg.kind === 'canopy' ? 'Mature canopy' : 'Established'} — ${cfg.count} on the block this year.`);
  return g;
}

/* ------------------------------------------------------------------ */
/*  Assembly                                                           */
/* ------------------------------------------------------------------ */

export function buildProps(era, pool, seed = 1) {
  const g = new THREE.Group();
  g.name = 'props';
  const rng = makeRng(seed * 31 + era.year);
  const lampLights = [];

  /* lamp posts, alternating sides */
  const lampCfg = era.props.lamps;
  let side = -1;
  for (let x = -56; x <= 56; x += lampCfg.spacing) {
    const lamp = lampPost(pool, era, lampCfg);
    lamp.position.set(x, WALK_Y, side * (KERB + 0.55));
    lamp.rotation.y = side < 0 ? 0 : Math.PI;
    lamp.traverse((o) => {
      if (o.isMesh) o.castShadow = true;
    });
    for (const L of lamp.userData.lights) {
      const p = L.pos.clone();
      p.applyEuler(lamp.rotation);
      p.add(lamp.position);
      lampLights.push({ ...L, pos: p });
    }
    g.add(lamp);
    side *= -1;
  }

  /* utility poles + wires */
  const poleCfg = era.props.poles;
  const poleXs = [];
  for (let x = -60; x <= 60; x += poleCfg.spacing) poleXs.push(x);
  for (const x of poleXs) {
    const p = utilityPole(pool, era, poleCfg);
    p.position.set(x, WALK_Y, KERB + 0.6);
    p.traverse((o) => {
      if (o.isMesh) o.castShadow = true;
    });
    g.add(p);
  }
  if (poleCfg.wires > 0) g.add(overheadWires(pool, era, poleXs, KERB + 0.6));
  // trolley span wires
  if (era.street.tracks) {
    const mat = pool.get('trolleywire', () => new THREE.LineBasicMaterial({ color: 0x22242a }));
    for (const off of [-0.72, 0.72]) {
      const pts = [];
      for (let x = -60; x <= 60; x += 6) pts.push(new THREE.Vector3(x, 6.4 - Math.sin(((x + 60) / 6) * Math.PI) * 0.06, off));
      g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat));
    }
    for (let x = -60; x <= 60; x += 24) {
      const pts = [new THREE.Vector3(x, 8.4, -KERB - 0.4), new THREE.Vector3(x, 6.6, 0), new THREE.Vector3(x, 8.4, KERB + 0.4)];
      g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat));
    }
  }

  /* traffic signals + street names at the cross streets */
  for (const cx of BLOCK.crossX) {
    for (const sz of [-1, 1]) {
      const sig = trafficSignal(pool, era, era.props.signals);
      const dir = cx > 0 ? -1 : 1;
      sig.position.set(cx + dir * (BLOCK.crossHalfWidth + 1.2), WALK_Y, sz * (KERB + 0.7));
      sig.rotation.y = sz < 0 ? (cx > 0 ? Math.PI * 0.5 : -Math.PI * 0.5) : cx > 0 ? Math.PI * 0.5 : -Math.PI * 0.5;
      sig.rotation.y = sz < 0 ? 0 : Math.PI;
      sig.traverse((o) => {
        if (o.isMesh) o.castShadow = true;
      });
      g.add(sig);
      const sn = streetSign(pool, era);
      sn.position.set(cx + dir * (BLOCK.crossHalfWidth + 2.6), WALK_Y, sz * (KERB + 1.4));
      g.add(sn);
    }
  }

  /* the rest of the kit, scattered but deterministic */
  const kit = era.props.kit.filter((k) => k !== 'graffitiwall' && k !== 'boombox');
  let slot = 0;
  const slots = [];
  for (let x = -50; x <= 50; x += 5.5) {
    for (const sz of [-1, 1]) slots.push([x + rng.range(-1, 1), sz]);
  }
  // shuffle deterministically
  for (let i = slots.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [slots[i], slots[j]] = [slots[j], slots[i]];
  }
  const counts = {};
  for (const [x, sz] of slots) {
    const name = kit[slot % kit.length];
    slot++;
    counts[name] = (counts[name] || 0) + 1;
    const cap = { hydrant: 4, busshelter: 2, busshelter_led: 2, busshelter_holo: 2, newsstand: 1, bikeshare: 1, dumpster: 3, mister: 3, phonebooth_wood: 2, phonebooth_alum: 2, atm: 2 }[name] || 6;
    if (counts[name] > cap) continue;
    const item = kitItem(name, pool, era, rng);
    if (!item) continue;
    const nearSignal = BLOCK.crossX.some((c) => Math.abs(x - c) < 12);
    if (nearSignal && (name.startsWith('bus') || name === 'newsstand')) continue;
    const zOff = name.startsWith('bus') || name === 'newsstand' || name === 'dumpster' ? 1.9 : 0.9;
    item.position.set(x, WALK_Y, sz * (KERB + zOff));
    item.rotation.y = sz < 0 ? rng.range(-0.15, 0.15) : Math.PI + rng.range(-0.15, 0.15);
    item.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    if (item.userData.steam || item.userData.mister) {
      g.userData.vents = g.userData.vents || [];
      g.userData.vents.push({ pos: item.position.clone().add(new THREE.Vector3(0, 0.2, 0)), kind: item.userData.mister ? 'mist' : 'steam' });
    }
    g.add(item);
  }

  /* trees */
  const treeCfg = era.street.trees;
  for (let i = 0; i < treeCfg.count; i++) {
    const t = streetTree(pool, era, rng);
    const x = -46 + (i * 92) / Math.max(1, treeCfg.count - 1) + rng.range(-2, 2);
    const sz = i % 2 ? -1 : 1;
    t.position.set(x, WALK_Y, sz * (KERB + 1.1));
    g.add(t);
  }

  /* litter */
  if (era.props.litter > 0.15) {
    const litterMat = pool.get('litter', () => makeStandard(pool.field, { color: '#c8c2b0', roughness: 1, side: THREE.DoubleSide }));
    const n = Math.floor(era.props.litter * 40);
    for (let i = 0; i < n; i++) {
      const l = plane(litterMat, rng.range(0.1, 0.3), rng.range(0.1, 0.24), rng.range(-56, 56), WALK_Y + 0.01, rng.sign() * rng.range(KERB + 0.3, BLOCK.frontage - 0.5));
      l.rotation.set(-Math.PI / 2, 0, rng.range(0, Math.PI));
      g.add(l);
    }
  }

  g.userData.lampLights = lampLights;
  return g;
}

/** Rooftop billboards + big wall advertising, placed from the era's ad list. */
export function buildBillboards(era, pool, lotMap, seed = 1) {
  const g = new THREE.Group();
  g.name = 'billboards';
  const rng = makeRng(seed + era.year);

  for (const ad of era.billboards) {
    const [where, lotId] = ad.at.split('-');
    const info = lotMap[lotId];
    if (!info) continue;
    const isDigital = ad.style === 'digital' || ad.style === 'holo';
    const map = adTexture({ headline: ad.headline, sub: ad.sub, brand: ad.brand, scheme: ad.scheme, style: ad.style, seed: seed + 3, w: 1024, h: 512 });
    const em = adTexture({
      headline: ad.headline,
      sub: ad.sub,
      brand: ad.brand,
      scheme: ad.scheme,
      style: ad.style,
      seed: seed + 3,
      emissive: true,
      w: 1024,
      h: 512
    });
    const mat = pool.get(`bb|${ad.headline}`, () =>
      makeStandard(pool.field, {
        map,
        emissive: new THREE.Color('#ffffff'),
        emissiveMap: em,
        emissiveIntensity: isDigital ? 2.2 : era.year >= 1965 ? 0.5 : 0.12,
        roughness: 0.8,
        side: THREE.DoubleSide
      })
    );

    const bw = Math.min(info.w * 1.1, 15);
    const bh = bw * 0.5;
    const holder = new THREE.Group();
    holder.add(plane(mat, bw, bh, 0, 0, 0.12));
    // hoarding frame
    const frameMat = pool.get('bbframe', () => makeStandard(pool.field, { color: '#5f5c54', metalness: 0.4, roughness: 0.6 }));
    holder.add(box(frameMat, bw + 0.4, 0.24, 0.3, 0, bh / 2 + 0.1, 0));
    holder.add(box(frameMat, bw + 0.4, 0.24, 0.3, 0, -bh / 2 - 0.1, 0));
    holder.add(box(frameMat, 0.24, bh + 0.5, 0.3, -bw / 2 - 0.1, 0, 0));
    holder.add(box(frameMat, 0.24, bh + 0.5, 0.3, bw / 2 + 0.1, 0, 0));
    // catwalk + lamps
    holder.add(box(frameMat, bw, 0.08, 0.7, 0, -bh / 2 - 0.35, 0.4));
    for (let i = 0; i < 4; i++) {
      const lampX = -bw / 2 + (i + 0.5) * (bw / 4);
      holder.add(box(frameMat, 0.3, 0.16, 0.5, lampX, -bh / 2 - 0.55, 0.7));
      holder.add(
        plane(
          pool.get(`bblamp|${era.accent}`, () => makeGlow({ color: '#fff0cc', map: glowTexture('#fff0cc', 0.5), opacity: 0.4 })),
          1.6,
          1.6,
          lampX,
          -bh / 2 + 0.4,
          0.8
        )
      );
    }

    // north lots run into -Z, south lots into +Z: everything mirrors
    const into = info.side === 'north' ? -1 : 1;
    if (where === 'roof') {
      const legs = pool.get('bblegs', () => makeStandard(pool.field, { color: '#4a4740', metalness: 0.4, roughness: 0.7 }));
      const legH = 2.2;
      const zFront = info.frontZ + into * 5.2;
      holder.position.set(info.cx, info.h + legH + bh / 2, zFront);
      if (info.side === 'south') holder.rotation.y = Math.PI;
      for (const sx of [-1, 1]) {
        const leg = box(legs, 0.22, legH + bh, 0.22, info.cx + sx * (bw / 2 - 0.6), info.h + (legH + bh) / 2, zFront + into * 0.3);
        g.add(leg);
        const brace = box(legs, 0.16, Math.hypot(legH, 2.4), 0.16, info.cx + sx * (bw / 2 - 0.6), info.h + legH / 2, zFront + into * 1.4);
        brace.rotation.x = into * 0.6;
        g.add(brace);
      }
    } else {
      holder.position.set(info.cx + (info.side === 'north' ? info.w / 2 + 0.2 : -info.w / 2 - 0.2), info.h * 0.62, info.frontZ + into * (info.d / 2));
      holder.rotation.y = info.side === 'north' ? Math.PI / 2 : -Math.PI / 2;
    }

    tag(
      holder,
      era.year,
      isDigital ? 'Digital billboard' : 'Billboard',
      `${ad.headline} — ${ad.sub}. ${isDigital ? 'Sold in six-second slots, changed by the minute.' : 'Twenty-four sheets of paper, pasted by two men on a plank.'}`
    );
    g.add(holder);
  }
  return g;
}
