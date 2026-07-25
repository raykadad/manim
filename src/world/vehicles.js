/**
 * Vehicles and traffic.
 *
 * One parametric shell covers most road cars: a body, a cabin, wheel arches,
 * bumpers and lamps whose proportions are pushed around per era — high and
 * round in 1945, long and finned in 1965, folded flat in 1985, tall in 2005,
 * smooth in 2025, wheel-less in 2055. Trams, buses, bikes, robots and hover
 * pods get purpose-built geometry.
 */

import * as THREE from 'three';
import { BLOCK } from './layout.js';
import { box, plane, cyl, cone, sphere, meshOf, tag, extrude, mergeStatic } from './kit.js';
import { makeStandard, makeGlass, makeEmissive, makeGlow, makeChrome, makeCarPaint } from '../gfx/materials.js';
import { glowTexture, blobShadowTexture, plateTexture, signTexture, metalPanelTexture, screenTexture } from '../gfx/textures.js';
import { makeRng } from '../util/rng.js';
import { wrapAround, damp } from '../util/math.js';

/* ------------------------------------------------------------------ */
/*  Silhouettes                                                        */
/* ------------------------------------------------------------------ */

const SPECS = {
  /* ---- 1945 ---- */
  sedan45: { L: 4.9, W: 1.86, H: 0.92, y: 0.52, roofL: 2.5, roofH: 0.86, roofX: -0.25, wheelR: 0.44, arch: 'round', running: true, bumper: 'chrome', grille: 'vertical', lamp: 'pod', visor: true, trunk: 'hump' },
  coupe45: { L: 4.5, W: 1.8, H: 0.9, y: 0.5, roofL: 1.9, roofH: 0.8, roofX: -0.1, wheelR: 0.43, arch: 'round', running: true, bumper: 'chrome', grille: 'vertical', lamp: 'pod', trunk: 'hump' },
  pickup45: { L: 4.7, W: 1.82, H: 0.88, y: 0.5, roofL: 1.5, roofH: 0.82, roofX: 0.5, wheelR: 0.45, arch: 'round', running: true, bumper: 'chrome', grille: 'vertical', lamp: 'pod', bed: true },
  panelTruck: { L: 5.4, W: 2, H: 1.9, y: 0.62, roofL: 3.4, roofH: 0.1, roofX: -0.6, wheelR: 0.48, arch: 'round', bumper: 'chrome', grille: 'vertical', lamp: 'pod', vanBody: true, signPanel: true },
  cab45: { L: 4.9, W: 1.86, H: 0.94, y: 0.52, roofL: 2.6, roofH: 0.9, roofX: -0.2, wheelR: 0.44, arch: 'round', running: true, bumper: 'chrome', grille: 'vertical', lamp: 'pod', taxi: 'dome', trunk: 'hump' },

  /* ---- 1965 ---- */
  finned: { L: 5.6, W: 2.02, H: 0.78, y: 0.44, roofL: 2.6, roofH: 0.62, roofX: -0.2, wheelR: 0.4, arch: 'skirt', bumper: 'chrome-big', grille: 'wide', lamp: 'quad', fins: 0.55, twoTone: true, chromeStrip: true },
  muscle: { L: 5.1, W: 1.98, H: 0.8, y: 0.42, roofL: 2.1, roofH: 0.58, roofX: -0.35, wheelR: 0.42, arch: 'flare', bumper: 'chrome', grille: 'wide', lamp: 'quad', hoodScoop: true, chromeStrip: true },
  beetle: { L: 4.0, W: 1.6, H: 0.85, y: 0.42, roofL: 2.1, roofH: 0.72, roofX: -0.1, wheelR: 0.38, arch: 'round', bumper: 'chrome', grille: 'none', lamp: 'pod', bug: true },
  wagon65: { L: 5.5, W: 2, H: 0.82, y: 0.44, roofL: 3.6, roofH: 0.72, roofX: -0.5, wheelR: 0.4, arch: 'skirt', bumper: 'chrome-big', grille: 'wide', lamp: 'quad', wood: true, chromeStrip: true },
  cab65: { L: 5.4, W: 2, H: 0.8, y: 0.44, roofL: 2.8, roofH: 0.66, roofX: -0.2, wheelR: 0.4, arch: 'skirt', bumper: 'chrome-big', grille: 'wide', lamp: 'quad', taxi: 'roofsign', chromeStrip: true },

  /* ---- 1985 ---- */
  boxy: { L: 4.9, W: 1.8, H: 0.78, y: 0.4, roofL: 2.6, roofH: 0.68, roofX: -0.2, wheelR: 0.36, arch: 'square', bumper: 'rubber', grille: 'slim', lamp: 'rect', squareLines: true },
  hatch80: { L: 3.9, W: 1.66, H: 0.72, y: 0.38, roofL: 2.2, roofH: 0.66, roofX: -0.3, wheelR: 0.32, arch: 'square', bumper: 'rubber', grille: 'slim', lamp: 'rect', hatch: true, squareLines: true },
  wagon80: { L: 5.1, W: 1.84, H: 0.76, y: 0.4, roofL: 3.4, roofH: 0.68, roofX: -0.45, wheelR: 0.36, arch: 'square', bumper: 'rubber', grille: 'slim', lamp: 'rect', wood: true, squareLines: true },
  cab80: { L: 5.2, W: 1.9, H: 0.8, y: 0.4, roofL: 2.8, roofH: 0.7, roofX: -0.2, wheelR: 0.37, arch: 'square', bumper: 'rubber', grille: 'slim', lamp: 'rect', taxi: 'roofsign', squareLines: true },
  police80: { L: 5.3, W: 1.94, H: 0.8, y: 0.4, roofL: 2.8, roofH: 0.7, roofX: -0.2, wheelR: 0.38, arch: 'square', bumper: 'rubber', grille: 'slim', lamp: 'rect', police: true, squareLines: true },
  van80: { L: 5.2, W: 1.94, H: 1.85, y: 0.5, roofL: 3.2, roofH: 0.12, roofX: -0.5, wheelR: 0.38, arch: 'square', bumper: 'rubber', grille: 'slim', lamp: 'rect', vanBody: true, signPanel: true },

  /* ---- 2005 ---- */
  suv05: { L: 5.0, W: 1.96, H: 1.35, y: 0.55, roofL: 3.2, roofH: 0.78, roofX: -0.3, wheelR: 0.42, arch: 'plastic', bumper: 'body', grille: 'chrome-slat', lamp: 'lens', roofRails: true },
  sedan05: { L: 4.8, W: 1.82, H: 0.76, y: 0.4, roofL: 2.7, roofH: 0.62, roofX: -0.2, wheelR: 0.36, arch: 'smooth', bumper: 'body', grille: 'chrome-slat', lamp: 'lens' },
  minivan: { L: 5.1, W: 1.94, H: 1.2, y: 0.48, roofL: 3.6, roofH: 0.72, roofX: -0.35, wheelR: 0.38, arch: 'smooth', bumper: 'body', grille: 'chrome-slat', lamp: 'lens' },
  cab05: { L: 5.1, W: 1.9, H: 0.8, y: 0.42, roofL: 2.8, roofH: 0.66, roofX: -0.2, wheelR: 0.37, arch: 'smooth', bumper: 'body', grille: 'chrome-slat', lamp: 'lens', taxi: 'roofsign' },
  van05: { L: 5.4, W: 1.98, H: 1.95, y: 0.5, roofL: 3.4, roofH: 0.12, roofX: -0.5, wheelR: 0.38, arch: 'smooth', bumper: 'body', grille: 'chrome-slat', lamp: 'lens', vanBody: true, signPanel: true },
  hybrid05: { L: 4.4, W: 1.72, H: 0.8, y: 0.4, roofL: 2.6, roofH: 0.64, roofX: -0.25, wheelR: 0.33, arch: 'smooth', bumper: 'body', grille: 'slim', lamp: 'lens', hatch: true },

  /* ---- 2025 ---- */
  ev25: { L: 4.8, W: 1.9, H: 0.82, y: 0.4, roofL: 3.2, roofH: 0.58, roofX: -0.1, wheelR: 0.37, arch: 'smooth', bumper: 'body', grille: 'closed', lamp: 'bar', glassRoof: true, aero: true },
  crossover25: { L: 4.7, W: 1.92, H: 1.15, y: 0.48, roofL: 3.0, roofH: 0.72, roofX: -0.2, wheelR: 0.4, arch: 'plastic', bumper: 'body', grille: 'closed', lamp: 'bar', roofRails: true, aero: true },
  pickupEV: { L: 5.7, W: 2.1, H: 1.1, y: 0.5, roofL: 2.4, roofH: 0.72, roofX: 0.2, wheelR: 0.45, arch: 'angular', bumper: 'body', grille: 'closed', lamp: 'bar', bed: true, wedge: true },
  rideshare: { L: 4.8, W: 1.86, H: 0.84, y: 0.4, roofL: 3.0, roofH: 0.6, roofX: -0.15, wheelR: 0.37, arch: 'smooth', bumper: 'body', grille: 'closed', lamp: 'bar', rideshareSign: true },
  deliveryVan25: { L: 5.3, W: 1.98, H: 2.0, y: 0.48, roofL: 3.4, roofH: 0.12, roofX: -0.5, wheelR: 0.38, arch: 'plastic', bumper: 'body', grille: 'closed', lamp: 'bar', vanBody: true, signPanel: true },

  /* ---- 2055 ---- */
  pod: { L: 4.2, W: 1.9, H: 1.25, y: 1.15, roofL: 3.4, roofH: 0.0, roofX: 0, wheelR: 0, hover: true, capsule: true, lamp: 'strip' },
  freightpod: { L: 5.6, W: 2.1, H: 1.9, y: 1.1, roofL: 4.2, roofH: 0.0, roofX: 0, wheelR: 0, hover: true, capsule: true, lamp: 'strip', signPanel: true }
};

/* ------------------------------------------------------------------ */

function matPaint(pool, color) {
  return pool.get(`paint|${color}`, () => makeCarPaint(pool.field, color));
}
function matGlass(pool) {
  return pool.get('carglass', () =>
    makeGlass(pool.field, { color: '#12181e', roughness: 0.06, opacity: 0.72, metalness: 0.2, transparent: true })
  );
}
function matChrome(pool) {
  return pool.get('carchrome', () => makeChrome(pool.field, { color: '#e2e8ee', rough: 0.1 }));
}
function matTyre(pool) {
  return pool.get('tyre', () => makeStandard(pool.field, { color: '#15161a', roughness: 0.92 }));
}
function matEmis(pool, color, i = 2.4) {
  return pool.get(`vemis|${color}|${i}`, () => makeEmissive(pool.field, { color, intensity: i }));
}
function matFlat(pool, color, o = {}) {
  return pool.get(`vflat|${color}|${JSON.stringify(o)}`, () => makeStandard(pool.field, { color: new THREE.Color(color), roughness: 0.8, ...o }));
}

function wheel(pool, r, width, spokes = true) {
  const g = new THREE.Group();
  g.userData.noMerge = true;
  const t = cyl(matTyre(pool), r, width, 0, 0, 0, 14);
  t.rotation.x = Math.PI / 2;
  g.add(t);
  const hub = cyl(matChrome(pool), r * 0.58, width + 0.03, 0, 0, 0, 12);
  hub.rotation.x = Math.PI / 2;
  g.add(hub);
  if (spokes) {
    for (let i = 0; i < 5; i++) {
      const s = box(matChrome(pool), r * 0.9, 0.05, width * 0.4);
      s.rotation.z = (i / 5) * Math.PI;
      g.add(s);
    }
  }
  return g;
}

/**
 * Build one road vehicle. Returns `{ group, wheels, headlights, taillights }`.
 */
export function buildVehicle(kind, color, pool, era, rng) {
  const s = SPECS[kind];
  const g = new THREE.Group();
  const wheels = [];
  const heads = [];
  const tails = [];
  const paint = matPaint(pool, color);
  const glass = matGlass(pool);
  const chrome = matChrome(pool);

  if (!s) {
    // non-car kinds
    switch (kind) {
      case 'streetcar':
        return buildStreetcar(pool, era, color);
      case 'bus65':
      case 'bus80':
      case 'bus05':
      case 'busEV':
        return buildBus(pool, era, color, kind);
      case 'bicycle':
        return buildBicycle(pool, color, false);
      case 'vespa':
        return buildScooterVehicle(pool, color, 'vespa');
      case 'moto':
        return buildScooterVehicle(pool, color, 'moto');
      case 'escooter':
        return buildScooterVehicle(pool, color, 'escooter');
      case 'cargobike':
        return buildBicycle(pool, color, true);
      case 'sidewalkbot':
        return buildSidewalkBot(pool, color, era);
      case 'shuttle55':
        return buildShuttle(pool, era, color);
      case 'hoverbike':
        return buildHoverbike(pool, era, color);
      default:
        return { group: g, wheels, heads, tails };
    }
  }

  const { L, W, H, y, roofL, roofH, roofX, wheelR } = s;

  /* ---- body ---- */
  if (s.capsule) {
    const shell = new THREE.Mesh(new THREE.CapsuleGeometry(W / 2, L - W, 8, 16), paint);
    shell.rotation.z = Math.PI / 2;
    shell.scale.set(1, 1, H / (W / 2) / 2 + 0.4);
    shell.position.y = y;
    g.add(shell);
    const canopy = new THREE.Mesh(new THREE.CapsuleGeometry(W / 2 - 0.08, L - W - 0.9, 6, 14), glass);
    canopy.rotation.z = Math.PI / 2;
    canopy.scale.set(1, 1, 0.72);
    canopy.position.set(-0.1, y + H * 0.28, 0);
    g.add(canopy);
    // skirt light
    const skirt = box(matEmis(pool, era.accent, 2), L * 0.9, 0.06, W * 0.82, 0, y - H * 0.42, 0);
    g.add(skirt);
  } else {
    const body = box(paint, L, H, W, 0, y + H / 2, 0);
    body.castShadow = true;
    g.add(body);

    if (s.wedge) {
      const nose = extrude(
        [
          [0, 0],
          [1.6, 0],
          [1.6, H],
          [0, H * 0.35]
        ],
        W * 0.98,
        paint
      );
      nose.rotation.y = Math.PI / 2;
      nose.position.set(L / 2 + 0.05, y, 0);
      g.add(nose);
    }

    if (s.vanBody) {
      const cargo = box(paint, L * 0.62, H, W, -L * 0.18, y + H / 2, 0);
      cargo.castShadow = true;
      g.add(cargo);
      const cab = box(paint, L * 0.4, H * 0.55, W * 0.98, L * 0.3, y + H * 0.72, 0);
      g.add(cab);
      g.add(box(glass, L * 0.06, H * 0.4, W * 0.86, L * 0.49, y + H * 0.78, 0));
      for (const sz of [-1, 1]) g.add(box(glass, L * 0.24, H * 0.34, 0.04, L * 0.32, y + H * 0.78, (sz * W) / 2));
      if (s.signPanel) {
        const sm = pool.get(`vansign|${era.year}`, () =>
          makeStandard(pool.field, {
            map: signTexture({
              text: era.year <= 1945 ? 'CITY DAIRY' : era.year <= 1985 ? 'PLUMBING & HEAT' : era.year <= 2005 ? 'EXPRESS PARCEL' : 'SAME-DAY',
              sub: era.year <= 1945 ? 'MILK · CREAM' : era.year <= 2005 ? 'CALL 555-0110' : 'SCAN TO TRACK',
              style: era.year <= 1965 ? 'painted' : era.year <= 2005 ? 'corporate' : 'minimal',
              bg: era.year <= 1965 ? '#2f4739' : era.year <= 2005 ? '#1e4d8a' : '#f2efe8',
              ink: era.year <= 1965 ? '#e8d9a8' : era.year <= 2005 ? '#f4f2ea' : '#26313a',
              accent: era.accent,
              font: era.year <= 1965 ? 'deco' : 'helvetica',
              w: 512,
              h: 256
            }),
            roughness: 0.7
          })
        );
        for (const sz of [-1, 1]) {
          const p = plane(sm, L * 0.5, H * 0.6, -L * 0.18, y + H * 0.55, (sz * W) / 2 + sz * 0.01);
          p.rotation.y = sz > 0 ? 0 : Math.PI;
          g.add(p);
        }
      }
    } else if (s.bed) {
      const cab = box(paint, roofL, roofH, W * 0.96, roofX, y + H + roofH / 2, 0);
      g.add(cab);
      g.add(box(glass, roofL * 0.28, roofH * 0.72, W * 0.9, roofX + roofL * 0.36, y + H + roofH * 0.55, 0));
      for (const sz of [-1, 1]) g.add(box(glass, roofL * 0.5, roofH * 0.62, 0.04, roofX, y + H + roofH * 0.52, (sz * W) / 2 * 0.94));
      // load bed
      const bedL = L / 2 - (roofX + roofL / 2);
      g.add(box(paint, bedL, 0.42, W, roofX + roofL / 2 + bedL / 2 - L / 2 + L / 2, y + H + 0.21, 0));
      g.add(box(matFlat(pool, '#2b2b2b'), bedL * 0.94, 0.06, W * 0.92, -(L / 2) + bedL / 2 + 0.05, y + H + 0.05, 0));
    } else if (s.bug) {
      const dome = new THREE.Mesh(new THREE.SphereGeometry(W * 0.52, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), paint);
      dome.scale.set(1.5, 1.35, 1);
      dome.position.set(-0.15, y + H * 0.75, 0);
      g.add(dome);
      const win = new THREE.Mesh(new THREE.SphereGeometry(W * 0.47, 14, 9, 0, Math.PI * 2, 0, Math.PI / 2.4), glass);
      win.scale.set(1.45, 1.2, 1);
      win.position.set(-0.15, y + H * 0.8, 0);
      g.add(win);
    } else if (roofH > 0.2) {
      const cabin = box(paint, roofL, roofH, W * 0.94, roofX, y + H + roofH / 2, 0);
      cabin.castShadow = true;
      g.add(cabin);
      // glazing: windscreen, side lights, backlight
      const gl = s.squareLines ? 0.9 : 0.86;
      g.add(box(glass, roofL * gl, roofH * 0.66, W * 0.9, roofX, y + H + roofH * 0.56, 0));
      const wsX = roofX + roofL / 2;
      const ws = box(glass, 0.1, roofH * 0.8, W * 0.86, wsX + 0.04, y + H + roofH * 0.5, 0);
      ws.rotation.z = s.squareLines ? -0.28 : -0.42;
      g.add(ws);
      const bl = box(glass, 0.1, roofH * 0.78, W * 0.84, roofX - roofL / 2 - 0.03, y + H + roofH * 0.5, 0);
      bl.rotation.z = s.hatch ? 0.55 : 0.34;
      g.add(bl);
      if (s.glassRoof) g.add(box(glass, roofL * 0.8, 0.05, W * 0.8, roofX, y + H + roofH + 0.01, 0));
      // roof pillars in body colour
      g.add(box(paint, roofL * 0.98, 0.09, W * 0.95, roofX, y + H + roofH, 0));
    }

    if (s.trunk === 'hump') {
      const hump = new THREE.Mesh(new THREE.SphereGeometry(W * 0.42, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), paint);
      hump.scale.set(1.5, 0.85, 1.05);
      hump.position.set(-L / 2 + 0.55, y + H, 0);
      g.add(hump);
    }
    if (s.fins) {
      for (const sz of [-1, 1]) {
        const fin = extrude(
          [
            [0, 0],
            [1.5, 0],
            [1.5, s.fins],
            [0.9, s.fins * 0.6]
          ],
          0.09,
          paint
        );
        fin.rotation.y = Math.PI / 2;
        fin.position.set(-L / 2 + 0.9, y + H, (sz * W) / 2 - sz * 0.06);
        g.add(fin);
        const chromeTip = box(chrome, 1.4, 0.06, 0.12, -L / 2 + 1.55, y + H + s.fins, (sz * W) / 2 - sz * 0.06);
        g.add(chromeTip);
      }
    }
    if (s.hoodScoop) g.add(box(paint, 0.9, 0.14, 0.7, L * 0.26, y + H + 0.07, 0));
    if (s.chromeStrip) {
      for (const sz of [-1, 1]) g.add(box(chrome, L * 0.9, 0.05, 0.04, 0, y + H * 0.55, (sz * W) / 2 + sz * 0.01));
    }
    if (s.wood) {
      const woodMat = matFlat(pool, '#8a6a3a', { roughness: 0.9 });
      for (const sz of [-1, 1]) {
        const p = plane(woodMat, L * 0.5, H * 0.5, -L * 0.12, y + H * 0.5, (sz * W) / 2 + sz * 0.012);
        p.rotation.y = sz > 0 ? 0 : Math.PI;
        g.add(p);
      }
    }
    if (s.twoTone) {
      const top = matPaint(pool, '#f0ece0');
      g.add(box(top, roofL * 1.01, roofH * 0.3, W * 0.95, roofX, y + H + roofH * 0.86, 0));
    }
    if (s.roofRails) {
      const railMat = matFlat(pool, '#2b2f33', { metalness: 0.4 });
      for (const sz of [-1, 1]) g.add(box(railMat, roofL * 0.8, 0.06, 0.06, roofX, y + H + roofH + 0.05, (sz * W) / 2 * 0.7));
    }
    if (s.aero) {
      // flush handles + slim mirror caps
      for (const sz of [-1, 1]) g.add(box(matFlat(pool, '#1c1f22'), 0.24, 0.05, 0.05, roofX + roofL * 0.1, y + H * 0.8, (sz * W) / 2 + sz * 0.02));
    }
    for (const sz of [-1, 1]) {
      const mirror = box(s.aero ? paint : chrome, 0.16, 0.12, 0.26, roofX + roofL / 2 - 0.15, y + H + roofH * 0.5, (sz * (W + 0.22)) / 2);
      g.add(mirror);
    }

    /* ---- wheels + arches ---- */
    const wb = L * 0.31;
    const wz = W / 2 - 0.06;
    for (const wx of [wb, -wb]) {
      for (const sz of [-1, 1]) {
        const wl = wheel(pool, wheelR, 0.26, era.year <= 1985);
        wl.position.set(wx, wheelR, sz * wz);
        wl.castShadow = true;
        g.add(wl);
        wheels.push(wl);
        if (s.arch === 'round') {
          const arch = new THREE.Mesh(new THREE.TorusGeometry(wheelR + 0.12, 0.12, 6, 12, Math.PI), paint);
          arch.rotation.y = Math.PI / 2;
          arch.position.set(wx, wheelR + 0.02, sz * (wz + 0.05));
          g.add(arch);
        } else if (s.arch === 'flare' || s.arch === 'plastic' || s.arch === 'angular') {
          const arch = new THREE.Mesh(new THREE.TorusGeometry(wheelR + 0.1, 0.09, 4, s.arch === 'angular' ? 5 : 10, Math.PI), s.arch === 'plastic' ? matFlat(pool, '#22242a') : paint);
          arch.rotation.y = Math.PI / 2;
          arch.position.set(wx, wheelR + 0.04, sz * (wz + 0.03));
          g.add(arch);
        } else if (s.arch === 'skirt') {
          g.add(box(paint, wheelR * 2.4, wheelR * 0.9, 0.06, wx, wheelR * 0.75, sz * (wz + 0.04)));
        }
      }
    }
    if (s.running) {
      for (const sz of [-1, 1]) g.add(box(matFlat(pool, '#2b2b2b'), L * 0.42, 0.09, 0.32, 0, wheelR * 0.62, (sz * W) / 2 + sz * 0.06));
    }

    /* ---- bumpers, grille, lamps ---- */
    const bumperMat = s.bumper === 'rubber' ? matFlat(pool, '#2b2d30', { roughness: 0.85 }) : s.bumper === 'body' ? paint : chrome;
    const bh = s.bumper === 'chrome-big' ? 0.22 : 0.16;
    for (const dir of [1, -1]) {
      g.add(box(bumperMat, 0.22, bh, W * (s.bumper === 'chrome-big' ? 1.02 : 0.96), (dir * L) / 2 + dir * 0.06, y + bh * 0.7, 0));
      if (s.bumper === 'chrome-big') {
        for (const sz of [-1, 1]) g.add(cone(chrome, 0.1, 0.3, (dir * L) / 2 + dir * 0.16, y + bh * 0.7, (sz * W) / 3, 8));
      }
    }
    if (s.grille !== 'none') {
      const gm = s.grille === 'closed' ? paint : chrome;
      const gw = s.grille === 'vertical' ? W * 0.5 : W * 0.86;
      g.add(box(gm, 0.1, H * 0.5, gw, L / 2 + 0.02, y + H * 0.5, 0));
      if (s.grille === 'vertical') {
        for (let i = 0; i < 7; i++) g.add(box(chrome, 0.06, H * 0.46, 0.03, L / 2 + 0.06, y + H * 0.5, -gw / 2 + (i * gw) / 6));
      } else if (s.grille === 'wide' || s.grille === 'chrome-slat') {
        for (let i = 0; i < 4; i++) g.add(box(chrome, 0.05, 0.04, gw * 0.96, L / 2 + 0.06, y + H * 0.32 + i * 0.12, 0));
      }
    }
    // lamps
    const headMat = matEmis(pool, '#fff4d8', 1.1);
    const tailMat = matEmis(pool, '#ff2b1f', 2.2);
    if (s.lamp === 'pod') {
      for (const sz of [-1, 1]) {
        const pod = new THREE.Group();
        pod.add(sphere(chrome, 0.17, 0, 0, 0, 10));
        pod.add(cyl(headMat, 0.14, 0.05, 0.16, 0, 0, 10));
        pod.children[1].rotation.z = Math.PI / 2;
        pod.position.set(L / 2 - 0.12, y + H * 0.78, (sz * W) / 2 - 0.22);
        g.add(pod);
        heads.push(pod);
      }
    } else if (s.lamp === 'quad') {
      for (const sz of [-1, 1]) {
        for (let i = 0; i < 2; i++) {
          const l = cyl(headMat, 0.1, 0.06, L / 2 + 0.06, y + H * 0.62, sz * (W / 2 - 0.22 - i * 0.24), 10);
          l.rotation.z = Math.PI / 2;
          g.add(l);
          heads.push(l);
        }
      }
    } else if (s.lamp === 'rect') {
      for (const sz of [-1, 1]) {
        const l = box(headMat, 0.05, 0.16, 0.42, L / 2 + 0.06, y + H * 0.6, sz * (W / 2 - 0.3));
        g.add(l);
        heads.push(l);
      }
    } else if (s.lamp === 'lens') {
      for (const sz of [-1, 1]) {
        const l = box(headMat, 0.06, 0.14, 0.5, L / 2 + 0.05, y + H * 0.62, sz * (W / 2 - 0.32));
        g.add(l);
        heads.push(l);
      }
    } else if (s.lamp === 'bar' || s.lamp === 'strip') {
      const l = box(headMat, 0.05, 0.08, W * 0.82, L / 2 + 0.04, y + H * 0.66, 0);
      g.add(l);
      heads.push(l);
      const t = box(tailMat, 0.05, 0.08, W * 0.82, -L / 2 - 0.04, y + H * 0.66, 0);
      g.add(t);
      tails.push(t);
    }
    if (s.lamp !== 'bar' && s.lamp !== 'strip') {
      for (const sz of [-1, 1]) {
        const t = box(tailMat, 0.05, s.squareLines ? 0.18 : 0.12, 0.3, -L / 2 - 0.05, y + H * 0.6, sz * (W / 2 - 0.28));
        g.add(t);
        tails.push(t);
      }
    }
    // number plate
    const plateMat = pool.get(`plate|${era.year}`, () =>
      makeStandard(pool.field, {
        map: plateTexture({
          text: era.year <= 1965 ? '4K-2018' : era.year <= 2005 ? 'KSL 041' : 'K5-4102',
          bg: era.year <= 1965 ? '#e8e2c8' : '#f2f2ec',
          ink: era.year <= 1965 ? '#2b3a2b' : '#20242c'
        }),
        roughness: 0.7
      })
    );
    const rearPlate = plane(plateMat, 0.5, 0.24, -L / 2 - 0.1, y + H * 0.34, 0);
    rearPlate.rotation.y = Math.PI;
    g.add(rearPlate);
    g.add(plane(plateMat, 0.5, 0.24, L / 2 + 0.1, y + H * 0.3, 0));

    /* ---- era set dressing ---- */
    if (s.visor) g.add(box(matFlat(pool, '#3a3a35'), 0.3, 0.04, W * 0.86, roofX + roofL / 2 + 0.12, y + H + roofH * 0.92, 0));
    if (s.taxi === 'dome') {
      g.add(sphere(matEmis(pool, '#ffdd77', 2.2), 0.16, roofX + roofL * 0.3, y + H + roofH + 0.1, 0, 10));
      const bandMat = pool.get('taxiband', () => makeStandard(pool.field, { color: '#1c1c1e', roughness: 0.7 }));
      for (const sz of [-1, 1]) {
        const p = plane(bandMat, L * 0.4, 0.22, -L * 0.05, y + H * 0.32, (sz * W) / 2 + sz * 0.012);
        p.rotation.y = sz > 0 ? 0 : Math.PI;
        g.add(p);
      }
    } else if (s.taxi === 'roofsign') {
      const sign = box(matEmis(pool, '#f2c14e', 1.8), 0.7, 0.22, 0.24, roofX + roofL * 0.1, y + H + roofH + 0.13, 0);
      g.add(sign);
      const tm = pool.get('taxidoor', () =>
        makeStandard(pool.field, {
          map: signTexture({ text: 'TAXI', sub: '555-1234', style: 'plastic', bg: '#f2c14e', ink: '#1c1c1e', accent: '#1c1c1e', font: 'helvetica', w: 512, h: 256 }),
          roughness: 0.6
        })
      );
      for (const sz of [-1, 1]) {
        const p = plane(tm, L * 0.34, 0.34, -L * 0.02, y + H * 0.4, (sz * W) / 2 + sz * 0.013);
        p.rotation.y = sz > 0 ? 0 : Math.PI;
        g.add(p);
      }
    }
    if (s.police) {
      const bar = new THREE.Group();
      bar.add(box(matFlat(pool, '#1c1e22'), 1.1, 0.1, 0.3, 0, 0, 0));
      const red = box(matEmis(pool, '#ff2b1f', 3), 0.4, 0.16, 0.26, -0.3, 0.1, 0);
      const blue = box(matEmis(pool, '#2b6bff', 3), 0.4, 0.16, 0.26, 0.3, 0.1, 0);
      bar.add(red, blue);
      bar.position.set(roofX, y + H + roofH + 0.16, 0);
      bar.userData.police = { red, blue };
      bar.userData.noMerge = true;
      g.add(bar);
      g.userData.police = bar.userData.police;
      const dm = pool.get('policedoor', () =>
        makeStandard(pool.field, {
          map: signTexture({ text: 'POLICE', sub: 'CITY OF KESSLER', style: 'plastic', bg: '#1c2430', ink: '#f2f2ea', accent: '#c8452f', font: 'helvetica', w: 512, h: 256 }),
          roughness: 0.6
        })
      );
      for (const sz of [-1, 1]) {
        const p = plane(dm, L * 0.4, 0.34, -L * 0.02, y + H * 0.44, (sz * W) / 2 + sz * 0.013);
        p.rotation.y = sz > 0 ? 0 : Math.PI;
        g.add(p);
      }
    }
    if (s.rideshareSign) {
      g.add(box(matEmis(pool, '#e8e4dc', 1.6), 0.26, 0.16, 0.14, roofX + roofL * 0.42, y + H + roofH * 0.9, W * 0.3));
    }
  }

  /* hover glow */
  if (s.hover) {
    const glow = plane(
      pool.get(`hoverglow|${era.accent}`, () => makeGlow({ color: era.accent, map: glowTexture(era.accent, 0.8), opacity: 0.5 })),
      L * 1.4,
      W * 2.2,
      0,
      0.06,
      0
    );
    glow.rotation.x = -Math.PI / 2;
    g.add(glow);
    for (let i = 0; i < 4; i++) {
      const pad = cyl(matEmis(pool, era.accent, 2.6), 0.22, 0.06, (i < 2 ? 1 : -1) * L * 0.3, y - H * 0.5, (i % 2 ? 1 : -1) * W * 0.32, 10);
      g.add(pad);
    }
    g.userData.hover = { base: y, amp: 0.09, speed: 1.6 + rng() };
  }

  /* contact shadow */
  const shadow = plane(
    pool.get('vshadow', () => makeGlow({ color: '#000000', map: blobShadowTexture(), opacity: 0.5, depthWrite: false })),
    L * 1.15,
    W * 1.5,
    0,
    0.03,
    0
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.material.blending = THREE.NormalBlending;
  g.add(shadow);

  return { group: g, wheels, heads, tails, spec: s };
}

/* ------------------------------------------------------------------ */
/*  Purpose-built vehicles                                             */
/* ------------------------------------------------------------------ */

function buildStreetcar(pool, era, color) {
  const g = new THREE.Group();
  const paint = matPaint(pool, color);
  const cream = matPaint(pool, '#e8dcbc');
  const glass = matGlass(pool);
  const L = 12.5;
  const W = 2.4;
  const body = box(paint, L, 1.6, W, 0, 1.5, 0);
  body.castShadow = true;
  g.add(body);
  g.add(box(cream, L, 0.9, W + 0.02, 0, 2.75, 0));
  g.add(box(paint, L * 0.99, 0.18, W + 0.06, 0, 3.28, 0));
  // rounded ends
  for (const dir of [1, -1]) {
    const nose = new THREE.Mesh(new THREE.CylinderGeometry(W / 2, W / 2, 2.5, 14, 1, false, 0, Math.PI), paint);
    nose.rotation.set(0, dir > 0 ? 0 : Math.PI, Math.PI / 2);
    nose.position.set((dir * L) / 2, 2.0, 0);
    g.add(nose);
  }
  // windows
  for (let i = 0; i < 9; i++) {
    const x = -L / 2 + 1.1 + i * 1.3;
    for (const sz of [-1, 1]) {
      const win = box(glass, 0.95, 0.85, 0.06, x, 2.75, (sz * W) / 2 + sz * 0.02);
      g.add(win);
    }
  }
  // destination sign + headlamp
  const dm = pool.get('tramsign', () =>
    makeStandard(pool.field, {
      map: signTexture({ text: 'KESSLER ST', sub: '14 · CROSSTOWN', style: 'painted', bg: '#241f18', ink: '#e8d9a8', accent: '#8c2f2a', font: 'grotesk', w: 512, h: 128 }),
      emissive: new THREE.Color('#ffffff'),
      emissiveIntensity: 0.7,
      roughness: 0.6
    })
  );
  for (const dir of [1, -1]) {
    const p = plane(dm, 1.8, 0.45, (dir * L) / 2 + dir * 0.03, 3.15, 0);
    p.rotation.y = dir > 0 ? 0 : Math.PI;
    g.add(p);
    g.add(sphere(matEmis(pool, '#fff0c8', 2.4), 0.18, (dir * L) / 2 + dir * 0.05, 2.1, 0, 10));
  }
  // trolley pole + interior glow
  const pole = cyl(matFlat(pool, '#3a3a35', { metalness: 0.6 }), 0.05, 4.4, -L * 0.2, 4.6, 0, 8);
  pole.rotation.z = -0.45;
  g.add(pole);
  g.add(box(matFlat(pool, '#3a3a35'), 0.5, 0.1, 0.5, -L * 0.32, 3.35, 0));
  g.add(box(matEmis(pool, '#ffe6b0', 1), L * 0.9, 0.08, W * 0.85, 0, 3.15, 0));
  // trucks
  for (const wx of [-L * 0.3, L * 0.3]) {
    for (const sz of [-1, 1]) {
      const w = wheel(pool, 0.36, 0.2, false);
      w.position.set(wx, 0.36, (sz * W) / 2 - 0.25);
      g.add(w);
    }
    g.add(box(matFlat(pool, '#2b2b2b'), 2.2, 0.35, W * 0.8, wx, 0.55, 0));
  }
  tag(g, era.year, 'Streetcar', 'Double-truck city car on 1,435 mm gauge. The rails outlived the service by forty years.');
  return { group: g, wheels: [], heads: [], tails: [], spec: { L, W, tall: true } };
}

function buildBus(pool, era, color, kind) {
  const g = new THREE.Group();
  const paint = matPaint(pool, color);
  const glass = matGlass(pool);
  const L = kind === 'bus65' ? 10.5 : 11.5;
  const W = 2.5;
  const H = kind === 'bus65' ? 2.5 : 2.7;
  const yb = 0.62;
  const body = box(paint, L, H, W, 0, yb + H / 2, 0);
  body.castShadow = true;
  g.add(body);
  if (kind === 'bus65') {
    // fishbowl windscreen
    const ws = new THREE.Mesh(new THREE.CylinderGeometry(W / 2, W / 2, H * 0.62, 14, 1, false, 0, Math.PI), glass);
    ws.rotation.set(0, 0, Math.PI / 2);
    ws.position.set(L / 2 - 0.3, yb + H * 0.66, 0);
    g.add(ws);
  } else {
    g.add(box(glass, 0.1, H * 0.5, W * 0.9, L / 2 + 0.02, yb + H * 0.68, 0));
  }
  for (let i = 0; i < 8; i++) {
    const x = -L / 2 + 1.2 + i * 1.25;
    for (const sz of [-1, 1]) g.add(box(glass, 1.0, H * 0.42, 0.06, x, yb + H * 0.68, (sz * W) / 2 + sz * 0.02));
  }
  // livery stripe / route board
  const stripe = matPaint(pool, kind === 'busEV' ? '#5fd6a4' : kind === 'bus80' ? '#c8452f' : '#2f6b8c');
  for (const sz of [-1, 1]) g.add(box(stripe, L, 0.24, 0.04, 0, yb + H * 0.32, (sz * W) / 2 + sz * 0.03));
  const rm = pool.get(`busroute|${era.year}`, () =>
    makeEmissive(pool.field, { color: '#ffffff', intensity: 1.6, map: screenTexture({ mode: 'led', tint: era.year >= 2025 ? '#ffffff' : '#f2c14e', text: '14', seed: 3 }) })
  );
  g.add(plane(rm, 1.4, 0.4, L / 2 + 0.03, yb + H * 0.95, 0));
  // doors
  for (const dx of [L * 0.28, -L * 0.16]) g.add(box(glass, 1.1, H * 0.8, 0.05, dx, yb + H * 0.45, W / 2 + 0.02));
  // wheels
  for (const wx of [L * 0.3, -L * 0.26]) {
    for (const sz of [-1, 1]) {
      const w = wheel(pool, 0.5, 0.32, false);
      w.position.set(wx, 0.5, (sz * W) / 2 - 0.14);
      g.add(w);
      wheelsPush(g, w);
    }
  }
  g.add(box(matEmis(pool, '#fff4d8', 2.4), 0.05, 0.2, W * 0.7, L / 2 + 0.05, yb + 0.3, 0));
  g.add(box(matEmis(pool, '#ff2b1f', 2), 0.05, 0.2, W * 0.7, -L / 2 - 0.05, yb + 0.3, 0));
  if (kind === 'busEV') {
    g.add(box(matFlat(pool, '#39424f'), L * 0.7, 0.3, W * 0.8, 0, yb + H + 0.15, 0));
    g.add(box(matEmis(pool, '#5fd6a4', 1.8), L * 0.5, 0.04, 0.06, 0, yb + H * 0.2, W / 2 + 0.04));
  }
  tag(g, era.year, 'City bus', kind === 'busEV' ? 'Battery-electric, 480 kWh, silent except for the door chime.' : 'Diesel, air-suspension, and a farebox that only takes exact change.');
  return { group: g, wheels: g.userData._wheels || [], heads: [], tails: [], spec: { L, W, tall: true } };
}

function wheelsPush(g, w) {
  g.userData._wheels = g.userData._wheels || [];
  g.userData._wheels.push(w);
}

function buildBicycle(pool, color, cargo) {
  const g = new THREE.Group();
  const frame = matPaint(pool, color);
  const wheels = [];
  const positions = cargo ? [-0.85, 0.75] : [-0.55, 0.55];
  for (const wx of positions) {
    const w = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.04, 6, 18), matTyre(pool));
    w.rotation.y = Math.PI / 2;
    w.position.set(wx, 0.34, 0);
    w.userData.noMerge = true;
    g.add(w);
    wheels.push(w);
    for (let i = 0; i < 4; i++) {
      const sp = box(matChrome(pool), 0.66, 0.012, 0.012, wx, 0.34, 0);
      sp.rotation.x = (i / 4) * Math.PI;
      g.add(sp);
    }
  }
  g.add(box(frame, 1.0, 0.05, 0.04, 0, 0.62, 0));
  g.add(box(frame, 0.05, 0.42, 0.04, 0.4, 0.72, 0));
  g.add(box(frame, 0.05, 0.34, 0.04, -0.35, 0.55, 0));
  g.add(box(matFlat(pool, '#1c1e20'), 0.22, 0.06, 0.12, -0.3, 0.82, 0));
  g.add(box(matChrome(pool), 0.04, 0.04, 0.42, 0.48, 0.95, 0));
  if (cargo) {
    g.add(box(matFlat(pool, '#3f4a52'), 0.8, 0.5, 0.7, -0.55, 0.75, 0));
    g.add(box(matEmis(pool, '#ff8f5d', 1.6), 0.04, 0.1, 0.3, -1.0, 0.75, 0));
  }
  const rider = simpleRider(pool, cargo ? '#2f6b4a' : '#3a3f4b');
  rider.position.set(-0.05, 0.62, 0);
  g.add(rider);
  return { group: g, wheels, heads: [], tails: [], spec: { L: 1.9, W: 0.6, slim: true } };
}

function simpleRider(pool, color) {
  const g = new THREE.Group();
  const cloth = matFlat(pool, color, { roughness: 0.9 });
  const skin = matFlat(pool, '#d8a97e', { roughness: 0.85 });
  g.add(box(cloth, 0.3, 0.5, 0.34, 0, 0.42, 0));
  g.add(sphere(skin, 0.13, 0, 0.78, 0, 10));
  g.add(box(cloth, 0.14, 0.42, 0.14, 0.06, 0.1, -0.12));
  g.add(box(cloth, 0.14, 0.42, 0.14, 0.06, 0.1, 0.12));
  g.add(box(cloth, 0.34, 0.1, 0.1, 0.24, 0.55, -0.14));
  g.add(box(cloth, 0.34, 0.1, 0.1, 0.24, 0.55, 0.14));
  return g;
}

function buildScooterVehicle(pool, color, kind) {
  const g = new THREE.Group();
  const paint = matPaint(pool, color);
  const wheels = [];
  const r = kind === 'moto' ? 0.32 : 0.22;
  for (const wx of [-0.6, 0.6]) {
    const w = new THREE.Mesh(new THREE.TorusGeometry(r, kind === 'escooter' ? 0.05 : 0.09, 6, 14), matTyre(pool));
    w.rotation.y = Math.PI / 2;
    w.position.set(wx, r, 0);
    w.userData.noMerge = true;
    g.add(w);
    wheels.push(w);
  }
  if (kind === 'vespa') {
    g.add(box(paint, 0.9, 0.3, 0.4, -0.1, 0.5, 0));
    const shield = box(paint, 0.1, 0.6, 0.5, 0.55, 0.75, 0);
    shield.rotation.z = -0.2;
    g.add(shield);
    g.add(box(matFlat(pool, '#2b2723'), 0.4, 0.12, 0.3, -0.3, 0.72, 0));
    g.add(sphere(matEmis(pool, '#fff4d8', 2), 0.1, 0.62, 0.85, 0, 8));
  } else if (kind === 'moto') {
    g.add(box(paint, 1.1, 0.28, 0.32, 0, 0.66, 0));
    g.add(box(matFlat(pool, '#1c1e20'), 0.5, 0.16, 0.3, -0.25, 0.85, 0));
    const exhaust = cyl(matChrome(pool), 0.09, 0.5, 0.1, 0.5, 0.16, 8);
    exhaust.rotation.z = Math.PI / 2;
    g.add(exhaust);
    g.add(sphere(matEmis(pool, '#fff4d8', 2.6), 0.13, 0.66, 0.8, 0, 8));
  } else {
    g.add(box(paint, 1.0, 0.07, 0.22, 0, 0.2, 0));
    g.add(cyl(matFlat(pool, '#2b3238'), 0.03, 1.0, 0.55, 0.7, 0, 8));
    g.add(box(matFlat(pool, '#2b3238'), 0.06, 0.05, 0.45, 0.55, 1.16, 0));
    g.add(box(matEmis(pool, '#ffffff', 2), 0.06, 0.06, 0.1, 0.6, 1.05, 0));
  }
  const rider = simpleRider(pool, kind === 'moto' ? '#22242a' : '#3a4a6b');
  rider.position.set(-0.1, kind === 'escooter' ? 0.24 : 0.62, 0);
  rider.scale.setScalar(kind === 'escooter' ? 1.15 : 1);
  g.add(rider);
  return { group: g, wheels, heads: [], tails: [], spec: { L: 1.7, W: 0.5, slim: true } };
}

function buildSidewalkBot(pool, color, era) {
  const g = new THREE.Group();
  const shell = matPaint(pool, color);
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.5, 6, 12), shell);
  body.rotation.z = Math.PI / 2;
  body.scale.set(1, 1, 0.8);
  body.position.y = 0.5;
  g.add(body);
  g.add(box(matFlat(pool, '#2b3238'), 0.5, 0.1, 0.5, 0, 0.82, 0));
  g.add(box(matEmis(pool, era.accent, 2.4), 0.5, 0.05, 0.06, 0, 0.62, 0.28));
  for (const wx of [-0.28, 0.28]) {
    for (const sz of [-1, 1]) {
      const w = cyl(matTyre(pool), 0.15, 0.09, wx, 0.15, sz * 0.3, 10);
      w.rotation.x = Math.PI / 2;
      g.add(w);
    }
  }
  const flag = box(matEmis(pool, '#ff8f5d', 2), 0.03, 0.5, 0.03, -0.2, 1.1, 0);
  g.add(flag);
  tag(g, era.year, 'Delivery robot', 'Six wheels, 40 litres, a top speed of 6 km/h and absolutely no sense of urgency.');
  return { group: g, wheels: [], heads: [], tails: [], spec: { L: 1.2, W: 0.8, slim: true } };
}

function buildShuttle(pool, era, color) {
  const g = new THREE.Group();
  const paint = matPaint(pool, color);
  const glass = matGlass(pool);
  const L = 7.5;
  const W = 2.3;
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(W / 2, L - W, 8, 16), paint);
  body.rotation.z = Math.PI / 2;
  body.scale.set(1, 1, 1.15);
  body.position.y = 1.5;
  g.add(body);
  for (let i = 0; i < 5; i++) {
    const x = -L / 2 + 1.1 + i * 1.35;
    for (const sz of [-1, 1]) {
      const win = box(glass, 1.05, 0.9, 0.06, x, 1.75, (sz * W) / 2 + sz * 0.02);
      g.add(win);
    }
  }
  g.add(box(matEmis(pool, era.accent, 2.4), L * 0.86, 0.06, 0.06, 0, 1.05, W / 2 + 0.02));
  g.add(box(matEmis(pool, era.accent, 2.4), L * 0.86, 0.06, 0.06, 0, 1.05, -W / 2 - 0.02));
  const rm = pool.get('shuttlescreen', () =>
    makeEmissive(pool.field, { color: '#ffffff', intensity: 2, map: screenTexture({ mode: 'led', tint: era.accent, text: 'LOOP 4', seed: 7 }) })
  );
  g.add(plane(rm, 1.4, 0.4, L / 2 + 0.02, 2.05, 0));
  const glow = plane(
    pool.get(`hoverglow|${era.accent}`, () => makeGlow({ color: era.accent, map: glowTexture(era.accent, 0.8), opacity: 0.5 })),
    L * 1.3,
    W * 2.2,
    0,
    0.06,
    0
  );
  glow.rotation.x = -Math.PI / 2;
  g.add(glow);
  g.userData.hover = { base: 1.5, amp: 0.07, speed: 1.2 };
  tag(g, era.year, 'Autonomous shuttle', 'No driver, no steering wheel, and a route that changes with demand.');
  return { group: g, wheels: [], heads: [], tails: [], spec: { L, W, tall: true, hover: true } };
}

function buildHoverbike(pool, era, color) {
  const g = new THREE.Group();
  const paint = matPaint(pool, color);
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 1.5, 6, 12), paint);
  body.rotation.z = Math.PI / 2;
  body.position.y = 0.9;
  g.add(body);
  g.add(box(matEmis(pool, era.accent, 2.6), 1.6, 0.05, 0.06, 0, 0.68, 0));
  for (const dx of [-0.7, 0.7]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.07, 6, 16), paint);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(dx, 0.62, 0);
    g.add(ring);
    g.add(cyl(matEmis(pool, era.accent2 || '#7dffb0', 2.4), 0.26, 0.05, dx, 0.58, 0, 12));
  }
  const rider = simpleRider(pool, '#1c2434');
  rider.position.set(-0.05, 0.95, 0);
  g.add(rider);
  g.userData.hover = { base: 0.9, amp: 0.11, speed: 2.1 };
  return { group: g, wheels: [], heads: [], tails: [], spec: { L: 2.2, W: 0.7, slim: true, hover: true } };
}

/* ------------------------------------------------------------------ */
/*  Traffic                                                            */
/* ------------------------------------------------------------------ */

const HALF = BLOCK.halfLength;

function pickWeighted(types, rng) {
  const total = types.reduce((a, t) => a + t.weight, 0);
  let r = rng() * total;
  for (const t of types) {
    r -= t.weight;
    if (r <= 0) return t;
  }
  return types[types.length - 1];
}

export class Traffic {
  constructor(era, pool, seed = 1) {
    this.era = era;
    this.group = new THREE.Group();
    this.group.name = 'traffic';
    this.agents = [];
    this.night = false;
    const rng = makeRng(seed * 7919 + era.year);
    const cfg = era.vehicles;

    const lanes = [
      { z: 3.4, dir: 1 },
      { z: -3.4, dir: -1 }
    ];
    if (era.street.tracks) {
      lanes.push({ z: 0.72, dir: 1, rail: true });
      lanes.push({ z: -0.72, dir: -1, rail: true });
    }

    const count = Math.round(16 * cfg.density);
    for (let i = 0; i < count; i++) {
      let type = pickWeighted(cfg.types, rng);
      const railOnly = type.kind === 'streetcar';
      const lane = railOnly
        ? lanes.find((l) => l.rail && l.dir === (rng.chance(0.5) ? 1 : -1)) || lanes[0]
        : lanes.filter((l) => !l.rail)[i % 2];
      if (lane.rail && !railOnly) continue;
      if (railOnly && !lane.rail) type = pickWeighted(cfg.types.filter((t) => t.kind !== 'streetcar'), rng);

      const built = buildVehicle(type.kind, rng.pick(type.colors), pool, era, rng);
      if (!built.group.children.length) continue;
      mergeStatic(built.group);
      const slim = built.spec?.slim;
      const zOff = slim && !cfg.hover ? lane.dir * 2.1 : 0;
      const g = built.group;
      g.position.set(rng.range(-HALF, HALF), 0, lane.z + zOff);
      g.rotation.y = lane.dir > 0 ? 0 : Math.PI;
      g.traverse((o) => {
        if (o.isMesh && o.geometry?.type !== 'PlaneGeometry') o.castShadow = true;
      });
      this.group.add(g);
      this.agents.push({
        obj: g,
        kind: type.kind,
        dir: lane.dir,
        laneZ: lane.z + zOff,
        speed: cfg.speed * rng.range(0.8, 1.2) * (slim ? 0.6 : 1) * (built.spec?.tall ? 0.75 : 1),
        baseSpeed: cfg.speed * rng.range(0.8, 1.2),
        wheels: built.wheels.length ? built.wheels : g.userData._wheels || [],
        heads: built.heads,
        tails: built.tails,
        len: built.spec?.L || 4.5,
        hover: built.group.userData.hover,
        police: built.group.userData.police,
        phase: rng.range(0, 100),
        stopped: 0
      });
    }

    /* ---- parked ---- */
    const parkZ = [-(BLOCK.kerb - 1.5), BLOCK.kerb - 1.5];
    for (let i = 0; i < (cfg.hover ? 6 : 14); i++) {
      const kindName = cfg.parked[i % cfg.parked.length];
      const type = cfg.types.find((t) => t.kind === kindName) || cfg.types[0];
      const built = buildVehicle(kindName, rng.pick(type.colors), pool, era, rng);
      if (!built.group.children.length) continue;
      mergeStatic(built.group);
      const sz = i % 2 ? 1 : -1;
      const g = built.group;
      const x = -50 + i * 7.4 + rng.range(-1.4, 1.4);
      if (BLOCK.crossX.some((c) => Math.abs(x - c) < 12)) continue;
      g.position.set(x, 0, parkZ[sz > 0 ? 1 : 0]);
      g.rotation.y = (sz > 0 ? 0 : Math.PI) + rng.range(-0.03, 0.03);
      g.traverse((o) => {
        if (o.isMesh && o.geometry?.type !== 'PlaneGeometry') o.castShadow = true;
      });
      this.group.add(g);
      if (built.group.userData.hover) {
        this.agents.push({ obj: g, parked: true, hover: built.group.userData.hover, phase: rng.range(0, 100), wheels: [], heads: [], tails: [] });
      }
    }

    /* ---- air traffic + maglev ---- */
    this.air = [];
    if (cfg.airTraffic) {
      const at = cfg.airTraffic;
      for (let i = 0; i < at.drones; i++) {
        const d = buildDrone(pool, era, rng);
        d.position.set(rng.range(-HALF, HALF), rng.range(16, 34), rng.range(-40, 40));
        this.group.add(d);
        this.air.push({ obj: d, dir: rng.chance(0.5) ? 1 : -1, speed: rng.range(7, 16), y: d.position.y, phase: rng.range(0, 10), kind: 'drone' });
      }
      for (let i = 0; i < at.taxis; i++) {
        const t = buildAirTaxi(pool, era, rng);
        t.position.set(rng.range(-HALF, HALF), rng.range(42, 62), rng.range(-70, 70));
        this.group.add(t);
        this.air.push({ obj: t, dir: rng.chance(0.5) ? 1 : -1, speed: rng.range(14, 22), y: t.position.y, phase: rng.range(0, 10), kind: 'taxi' });
      }
      if (at.maglev) {
        const m = buildMaglev(pool, era);
        m.position.set(-HALF, 15.2, 0);
        this.group.add(m);
        this.maglev = { obj: m, x: -HALF, speed: 26, wait: 6 };
      }
    }

    /* also fly a couple of drones in 2025 */
    if (era.year === 2025) {
      for (let i = 0; i < 3; i++) {
        const d = buildDrone(pool, era, rng);
        d.position.set(rng.range(-60, 60), rng.range(14, 22), rng.range(-30, 30));
        this.group.add(d);
        this.air.push({ obj: d, dir: rng.chance(0.5) ? 1 : -1, speed: rng.range(6, 11), y: d.position.y, phase: rng.range(0, 10), kind: 'drone' });
      }
    }
  }

  setNight(on) {
    this.night = on;
    for (const a of this.agents) {
      for (const h of a.heads) if (h.material?.emissiveIntensity !== undefined) h.material.emissiveIntensity = on ? 3.6 : 1.1;
    }
  }

  update(dt, time) {
    // simple car-following per lane so traffic bunches instead of overlapping
    const byLane = new Map();
    for (const a of this.agents) {
      if (a.parked) continue;
      const key = `${a.laneZ.toFixed(1)}`;
      if (!byLane.has(key)) byLane.set(key, []);
      byLane.get(key).push(a);
    }
    for (const list of byLane.values()) {
      list.sort((p, q) => (p.dir > 0 ? p.obj.position.x - q.obj.position.x : q.obj.position.x - p.obj.position.x));
      for (let i = 0; i < list.length; i++) {
        const a = list[i];
        const ahead = list[(i + 1) % list.length];
        let gap = ahead === a ? 999 : (ahead.obj.position.x - a.obj.position.x) * a.dir;
        if (gap < 0) gap += HALF * 2;
        const want = gap < a.len + 3.5 ? 0 : gap < a.len + 9 ? a.baseSpeed * 0.45 : a.baseSpeed;
        a.speed = damp(a.speed, want, 2.2, dt);
      }
    }

    for (const a of this.agents) {
      if (!a.parked) {
        a.obj.position.x = wrapAround(a.obj.position.x + a.speed * a.dir * dt, HALF);
        for (const w of a.wheels) w.rotation.z -= (a.speed / 0.4) * dt * a.dir;
        // gentle body roll on the move
        a.obj.rotation.z = Math.sin(time * 1.7 + a.phase) * 0.004 * (a.speed / 8);
      }
      if (a.hover) a.obj.position.y = Math.sin(time * a.hover.speed + a.phase) * a.hover.amp;
      if (a.police) {
        const f = Math.sin(time * 9 + a.phase) > 0;
        a.police.red.material.emissiveIntensity = f ? 4 : 0.2;
        a.police.blue.material.emissiveIntensity = f ? 0.2 : 4;
      }
    }

    for (const a of this.air) {
      a.obj.position.x = wrapAround(a.obj.position.x + a.speed * a.dir * dt, HALF + 40);
      a.obj.position.y = a.y + Math.sin(time * 1.3 + a.phase) * (a.kind === 'drone' ? 0.5 : 1.2);
      a.obj.rotation.y = a.dir > 0 ? 0 : Math.PI;
      a.obj.rotation.z = Math.sin(time * 2 + a.phase) * 0.06;
      if (a.obj.userData.rotors) for (const r of a.obj.userData.rotors) r.rotation.y += dt * 40;
    }

    if (this.maglev) {
      const m = this.maglev;
      m.wait -= dt;
      if (m.wait <= 0) {
        m.x += m.speed * dt;
        m.obj.visible = true;
        m.obj.position.x = m.x;
        if (m.x > HALF + 60) {
          m.x = -HALF - 60;
          m.wait = 12 + Math.random() * 8;
          m.obj.visible = false;
        }
      } else {
        m.obj.visible = false;
      }
    }
  }

  dispose() {
    this.group.removeFromParent();
  }
}

/* ------------------------------------------------------------------ */
/*  Aircraft                                                           */
/* ------------------------------------------------------------------ */

function buildDrone(pool, era, rng) {
  const g = new THREE.Group();
  const shell = matFlat(pool, '#e8eef2', { metalness: 0.3, roughness: 0.4 });
  g.add(box(shell, 0.7, 0.2, 0.5, 0, 0, 0));
  g.add(box(matFlat(pool, '#39424f'), 0.4, 0.28, 0.36, 0, -0.2, 0));
  const rotors = [];
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const armX = Math.cos(a) * 0.5;
    const armZ = Math.sin(a) * 0.5;
    const arm = box(shell, 0.5, 0.05, 0.05, armX / 2, 0.05, armZ / 2);
    arm.rotation.y = -a;
    g.add(arm);
    const r = new THREE.Group();
    for (let b = 0; b < 2; b++) {
      const blade = box(matFlat(pool, '#2b3238', { transparent: true, opacity: 0.55 }), 0.42, 0.01, 0.06);
      blade.rotation.y = (b / 2) * Math.PI;
      r.add(blade);
    }
    r.position.set(armX, 0.12, armZ);
    r.userData.noMerge = true;
    g.add(r);
    rotors.push(r);
    g.add(sphere(matEmis(pool, i % 2 ? era.accent : '#ff5d5d', 3), 0.04, armX, 0.02, armZ, 6));
  }
  g.userData.rotors = rotors;
  g.scale.setScalar(rng.range(0.9, 1.4));
  tag(g, era.year, 'Delivery drone', era.year >= 2055 ? 'Lane-managed, 4 kg payload, 300 flights a day over this block.' : 'Line-of-sight permit, 2 kg payload, and a very unhappy dog below.');
  return g;
}

function buildAirTaxi(pool, era, rng) {
  const g = new THREE.Group();
  const shell = matPaint(pool, '#e8f0f6');
  const cabin = new THREE.Mesh(new THREE.CapsuleGeometry(0.9, 2.2, 8, 14), shell);
  cabin.rotation.z = Math.PI / 2;
  g.add(cabin);
  g.add(box(matGlass(pool), 1.6, 0.7, 1.5, 0.5, 0.25, 0));
  const rotors = [];
  for (let i = 0; i < 4; i++) {
    const x = i < 2 ? 1.6 : -1.6;
    const z = i % 2 ? 1.7 : -1.7;
    g.add(box(shell, 0.3, 0.12, 1.8, x, 0.1, z / 2));
    const r = new THREE.Group();
    for (let b = 0; b < 4; b++) {
      const blade = box(matFlat(pool, '#39424f', { transparent: true, opacity: 0.45 }), 1.5, 0.02, 0.12);
      blade.rotation.y = (b / 4) * Math.PI * 2;
      r.add(blade);
    }
    r.position.set(x, 0.28, z);
    r.userData.noMerge = true;
    g.add(r);
    rotors.push(r);
    g.add(sphere(matEmis(pool, i % 2 ? '#7dffb0' : '#ff5dc8', 3), 0.08, x, 0.1, z, 6));
  }
  g.userData.rotors = rotors;
  g.scale.setScalar(rng.range(0.9, 1.2));
  tag(g, era.year, 'Air taxi', 'Eight rotors, two passengers, and a corridor 60 metres above the street.');
  return g;
}

function buildMaglev(pool, era) {
  const g = new THREE.Group();
  const shell = matPaint(pool, '#dfeaf2');
  const L = 26;
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(1.35, L - 2.7, 8, 18), shell);
  body.rotation.z = Math.PI / 2;
  g.add(body);
  for (let i = 0; i < 14; i++) {
    const x = -L / 2 + 1.6 + i * 1.65;
    for (const sz of [-1, 1]) g.add(box(matGlass(pool), 1.2, 0.8, 0.06, x, 0.3, sz * 1.36));
  }
  g.add(box(matEmis(pool, era.accent, 2.6), L * 0.95, 0.08, 0.08, 0, -0.5, 1.38));
  g.add(box(matEmis(pool, era.accent, 2.6), L * 0.95, 0.08, 0.08, 0, -0.5, -1.38));
  g.add(box(matEmis(pool, '#ffffff', 3), 0.1, 0.2, 1.6, L / 2 + 0.1, 0.2, 0));
  const glow = plane(
    pool.get(`maglevglow|${era.accent}`, () => makeGlow({ color: era.accent, map: glowTexture(era.accent, 0.8), opacity: 0.4 })),
    L * 1.2,
    6,
    0,
    -1.6,
    0
  );
  glow.rotation.x = -Math.PI / 2;
  g.add(glow);
  tag(g, era.year, 'Maglev spur', 'Four cars, 90-second headway, and a hum you feel in the shop windows.');
  return g;
}
