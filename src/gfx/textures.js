/**
 * Procedural texture factory.
 *
 * Every surface in the block is painted at runtime into a canvas and uploaded
 * as a texture. Results are memoised by key so the six eras can share masonry
 * while still owning their own signage.
 */

import * as THREE from 'three';
import { makeRng, hashSeed } from '../util/rng.js';
import {
  createCanvas,
  fill,
  linearGradient,
  radialGradient,
  roundRect,
  grain,
  blotches,
  streaks,
  cracks,
  drawText,
  fitFont,
  measureTracked,
  distress,
  weather,
  rgba,
  mixHex,
  shade
} from './canvas2d.js';

const cache = new Map();
let maxAniso = 8;

export function setMaxAnisotropy(v) {
  maxAniso = Math.max(1, v);
}

function toTexture(canvas, { repeat = [1, 1], srgb = true, aniso = true, wrap = THREE.RepeatWrapping } = {}) {
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = wrap;
  t.repeat.set(repeat[0], repeat[1]);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = aniso ? maxAniso : 1;
  t.needsUpdate = true;
  return t;
}

/** Memoised texture builder. */
function memo(key, build) {
  if (cache.has(key)) return cache.get(key);
  const t = build();
  cache.set(key, t);
  return t;
}

export function disposeTextures() {
  for (const t of cache.values()) t.dispose?.();
  cache.clear();
}

export function textureCount() {
  return cache.size;
}

/* ============================================================ MASONRY == */

/**
 * Brick with per-course colour jitter, mortar, efflorescence and grime.
 * `style` nudges the bond pattern: running (default), header, or painted.
 */
export function brickTexture({
  color = '#8d4a37',
  mortar = '#b6ada0',
  grime = 0.3,
  seed = 1,
  rows = 16,
  painted = null,
  tint = null
} = {}) {
  const key = `brick|${color}|${mortar}|${grime}|${seed}|${rows}|${painted}|${tint}`;
  return memo(key, () => {
    const S = 512;
    const { canvas, ctx } = createCanvas(S, S);
    fill(ctx, S, S, mortar);
    const rng = makeRng(seed);
    const bh = S / rows;
    const bw = bh * 2.35;
    for (let r = 0; r < rows; r++) {
      const off = (r % 2) * bw * 0.5;
      for (let c = -1; c < S / bw + 1; c++) {
        const x = c * bw + off;
        const y = r * bh;
        const j = rng.range(-0.09, 0.09);
        let bc = mixHex(color, j > 0 ? '#ffffff' : '#1a1014', Math.abs(j) * 2.2);
        if (rng.chance(0.05)) bc = mixHex(bc, '#3a2018', 0.45);
        if (rng.chance(0.03)) bc = mixHex(bc, '#c9b294', 0.4);
        ctx.fillStyle = bc;
        const pad = 1.6;
        ctx.fillRect(x + pad, y + pad, bw - pad * 2, bh - pad * 2);
        // chipped top edge catches light
        ctx.fillStyle = rgba('#ffffff', 0.05);
        ctx.fillRect(x + pad, y + pad, bw - pad * 2, 1.2);
        ctx.fillStyle = rgba('#000000', 0.12);
        ctx.fillRect(x + pad, y + bh - pad - 1.4, bw - pad * 2, 1.4);
        if (rng.chance(0.12)) {
          ctx.fillStyle = rgba('#000000', rng.range(0.05, 0.16));
          ctx.fillRect(x + pad + rng() * bw * 0.5, y + pad, rng.range(3, 14), bh - pad * 2);
        }
      }
    }
    if (painted) {
      ctx.fillStyle = rgba(painted, 0.86);
      ctx.fillRect(0, 0, S, S);
      distress(ctx, S, S, 0.35, seed + 9);
      ctx.globalCompositeOperation = 'source-over';
    }
    if (tint) {
      ctx.fillStyle = rgba(tint, 0.22);
      ctx.fillRect(0, 0, S, S);
    }
    weather(ctx, S, S, grime, seed + 4);
    return toTexture(canvas, { repeat: [1, 1] });
  });
}

export function stoneTexture({ color = '#c8bfae', grime = 0.25, seed = 2, courses = 6 } = {}) {
  return memo(`stone|${color}|${grime}|${seed}|${courses}`, () => {
    const S = 512;
    const { canvas, ctx } = createCanvas(S, S);
    fill(ctx, S, S, shade(color, -0.25));
    const rng = makeRng(seed);
    const bh = S / courses;
    for (let r = 0; r < courses; r++) {
      const cols = 3 + (r % 2);
      const bw = S / cols;
      for (let c = -1; c <= cols; c++) {
        const x = c * bw + (r % 2) * bw * 0.5;
        const y = r * bh;
        ctx.fillStyle = mixHex(color, rng.chance(0.5) ? '#ffffff' : '#5a5044', rng.range(0, 0.14));
        ctx.fillRect(x + 2, y + 2, bw - 4, bh - 4);
        ctx.strokeStyle = rgba('#ffffff', 0.08);
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 2.5, y + 2.5, bw - 5, bh - 5);
        blotches(ctx, S, S, { count: 0 });
      }
    }
    blotches(ctx, S, S, { count: 40, color: rgba(shade(color, -0.4), 0.1), min: 10, max: 70, seed: seed + 3 });
    weather(ctx, S, S, grime, seed + 5);
    return toTexture(canvas);
  });
}

export function plasterTexture({ color = '#d8d2c4', grime = 0.25, seed = 3, crackLevel = 0.3 } = {}) {
  return memo(`plaster|${color}|${grime}|${seed}|${crackLevel}`, () => {
    const S = 512;
    const { canvas, ctx } = createCanvas(S, S);
    fill(ctx, S, S, color);
    blotches(ctx, S, S, { count: 60, color: rgba(shade(color, -0.35), 0.14), min: 14, max: 120, seed });
    blotches(ctx, S, S, { count: 40, color: rgba(shade(color, 0.3), 0.12), min: 10, max: 90, seed: seed + 1 });
    if (crackLevel > 0) cracks(ctx, S, S, { count: Math.floor(crackLevel * 10), seed: seed + 2, color: rgba('#000', 0.16 * crackLevel + 0.05) });
    weather(ctx, S, S, grime, seed + 6);
    return toTexture(canvas);
  });
}

export function concreteTexture({ color = '#9b9b98', grime = 0.3, seed = 4, stains = true } = {}) {
  return memo(`concrete|${color}|${grime}|${seed}|${stains}`, () => {
    const S = 512;
    const { canvas, ctx } = createCanvas(S, S);
    fill(ctx, S, S, color);
    const rng = makeRng(seed);
    for (let i = 0; i < 500; i++) {
      ctx.fillStyle = rgba(rng.chance(0.5) ? '#ffffff' : '#000000', rng.range(0.02, 0.09));
      const r = rng.range(1, 7);
      ctx.beginPath();
      ctx.arc(rng() * S, rng() * S, r, 0, Math.PI * 2);
      ctx.fill();
    }
    // form-work seams
    ctx.strokeStyle = rgba('#000', 0.12);
    ctx.lineWidth = 2;
    for (let i = 1; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(0, (S / 3) * i);
      ctx.lineTo(S, (S / 3) * i);
      ctx.stroke();
    }
    if (stains) streaks(ctx, S, S, { count: 24, color: rgba('#2a2620', 0.16), seed: seed + 2 });
    cracks(ctx, S, S, { count: 5, seed: seed + 3, color: rgba('#000', 0.18) });
    weather(ctx, S, S, grime, seed + 4);
    return toTexture(canvas);
  });
}

export function metalPanelTexture({ color = '#9aa3ac', grime = 0.2, seed = 5, ribs = 0, brushed = true } = {}) {
  return memo(`metal|${color}|${grime}|${seed}|${ribs}|${brushed}`, () => {
    const S = 512;
    const { canvas, ctx } = createCanvas(S, S);
    fill(ctx, S, S, color);
    const rng = makeRng(seed);
    if (brushed) {
      for (let i = 0; i < 2200; i++) {
        ctx.strokeStyle = rgba(rng.chance(0.5) ? '#ffffff' : '#000000', rng.range(0.01, 0.05));
        ctx.lineWidth = rng.range(0.4, 1.6);
        const y = rng() * S;
        ctx.beginPath();
        ctx.moveTo(rng() * S, y);
        ctx.lineTo(rng() * S, y + rng.range(-1, 1));
        ctx.stroke();
      }
    }
    if (ribs > 0) {
      const step = S / ribs;
      for (let i = 0; i < ribs; i++) {
        const x = i * step;
        ctx.fillStyle = rgba('#ffffff', 0.1);
        ctx.fillRect(x, 0, step * 0.16, S);
        ctx.fillStyle = rgba('#000000', 0.18);
        ctx.fillRect(x + step * 0.5, 0, step * 0.16, S);
      }
    }
    // panel joints + rivets
    ctx.strokeStyle = rgba('#000', 0.22);
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, S - 2, S - 2);
    for (let i = 0; i < 12; i++) {
      const t = (i + 0.5) / 12;
      ctx.fillStyle = rgba('#000', 0.18);
      ctx.beginPath();
      ctx.arc(t * S, 8, 2.5, 0, Math.PI * 2);
      ctx.arc(t * S, S - 8, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    weather(ctx, S, S, grime, seed + 7);
    return toTexture(canvas);
  });
}

/* ========================================================== GROUNDS ==== */

export function asphaltTexture({ color = '#2f3033', grime = 0.35, seed = 6, patches = 4, wet = 0 } = {}) {
  return memo(`asphalt|${color}|${grime}|${seed}|${patches}|${wet}`, () => {
    const S = 512;
    const { canvas, ctx } = createCanvas(S, S);
    fill(ctx, S, S, color);
    const rng = makeRng(seed);
    for (let i = 0; i < 5200; i++) {
      ctx.fillStyle = rgba(rng.chance(0.55) ? '#ffffff' : '#000000', rng.range(0.015, 0.07));
      ctx.fillRect(rng() * S, rng() * S, rng.range(1, 3.4), rng.range(1, 3.4));
    }
    for (let p = 0; p < patches; p++) {
      const x = rng() * S;
      const y = rng() * S;
      const w = rng.range(60, 190);
      const h = rng.range(40, 130);
      ctx.fillStyle = rgba(rng.chance(0.5) ? '#1c1d20' : '#3b3c3f', 0.55);
      ctx.beginPath();
      ctx.ellipse(x, y, w / 2, h / 2, rng() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    cracks(ctx, S, S, { count: 7, seed: seed + 2, color: rgba('#111', 0.5), width: 1.6 });
    // tar snakes filling the cracks
    cracks(ctx, S, S, { count: 3, seed: seed + 2, color: rgba('#151517', 0.85), width: 3.4 });
    blotches(ctx, S, S, { count: 22, color: rgba('#0b0b0c', 0.2), min: 20, max: 90, seed: seed + 5 });
    if (wet > 0) {
      ctx.fillStyle = rgba('#0a0d12', 0.25 * wet);
      ctx.fillRect(0, 0, S, S);
    }
    grain(ctx, S, S, 0.1 + grime * 0.1, seed + 8);
    return toTexture(canvas);
  });
}

export function sidewalkTexture({ color = '#b3aea4', grime = 0.3, seed = 7, slabs = 4, gum = true } = {}) {
  return memo(`walk|${color}|${grime}|${seed}|${slabs}|${gum}`, () => {
    const S = 512;
    const { canvas, ctx } = createCanvas(S, S);
    fill(ctx, S, S, color);
    const rng = makeRng(seed);
    const step = S / slabs;
    for (let x = 0; x < slabs; x++) {
      for (let y = 0; y < slabs; y++) {
        ctx.fillStyle = mixHex(color, rng.chance(0.5) ? '#ffffff' : '#6d675e', rng.range(0.01, 0.1));
        ctx.fillRect(x * step + 2, y * step + 2, step - 4, step - 4);
      }
    }
    ctx.strokeStyle = rgba('#5c574e', 0.5);
    ctx.lineWidth = 3;
    for (let i = 0; i <= slabs; i++) {
      ctx.beginPath();
      ctx.moveTo(i * step, 0);
      ctx.lineTo(i * step, S);
      ctx.moveTo(0, i * step);
      ctx.lineTo(S, i * step);
      ctx.stroke();
    }
    for (let i = 0; i < 2600; i++) {
      ctx.fillStyle = rgba(rng.chance(0.5) ? '#ffffff' : '#000000', rng.range(0.01, 0.05));
      ctx.fillRect(rng() * S, rng() * S, rng.range(1, 3), rng.range(1, 3));
    }
    cracks(ctx, S, S, { count: 6, seed: seed + 1, color: rgba('#3a352e', 0.4) });
    if (gum) {
      for (let i = 0; i < 26; i++) {
        ctx.fillStyle = rgba('#2b2721', rng.range(0.1, 0.32));
        ctx.beginPath();
        ctx.arc(rng() * S, rng() * S, rng.range(2, 6), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    weather(ctx, S, S, grime, seed + 3);
    return toTexture(canvas);
  });
}

/* ========================================================== FACADES ==== */

/**
 * A sheet of windows for the flanks of a building: cheap detail where the
 * camera rarely goes, but it stops the sides reading as flat colour.
 */
export function windowSheetTexture({
  wall = '#7d5a49',
  frame = '#2a2723',
  glass = '#1d2a33',
  lit = '#ffd9a0',
  litChance = 0.18,
  cols = 4,
  rows = 5,
  seed = 8,
  grime = 0.3,
  blinds = true,
  emissive = false
} = {}) {
  const key = `winsheet|${wall}|${frame}|${glass}|${lit}|${litChance}|${cols}|${rows}|${seed}|${grime}|${blinds}|${emissive}`;
  return memo(key, () => {
    const S = 512;
    const { canvas, ctx } = createCanvas(S, S);
    fill(ctx, S, S, emissive ? '#000000' : wall);
    const rng = makeRng(seed);
    const cw = S / cols;
    const ch = S / rows;
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const x = c * cw + cw * 0.22;
        const y = r * ch + ch * 0.18;
        const w = cw * 0.56;
        const h = ch * 0.6;
        const isLit = rng.chance(litChance);
        if (emissive) {
          if (isLit) {
            ctx.fillStyle = radialGradient(ctx, x + w / 2, y + h / 2, 0, w, [
              [0, lit],
              [0.7, rgba(lit, 0.55)],
              [1, 'rgba(0,0,0,0)']
            ]);
            ctx.fillRect(x - w * 0.3, y - h * 0.3, w * 1.6, h * 1.6);
          }
          continue;
        }
        ctx.fillStyle = frame;
        ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
        ctx.fillStyle = isLit ? lit : glass;
        ctx.fillRect(x, y, w, h);
        if (!isLit) {
          ctx.fillStyle = linearGradient(ctx, x, y, x + w, y + h, [
            [0, rgba('#ffffff', 0.16)],
            [0.45, rgba('#ffffff', 0.03)],
            [1, rgba('#000000', 0.2)]
          ]);
          ctx.fillRect(x, y, w, h);
        }
        if (blinds && rng.chance(0.5)) {
          const bh = h * rng.range(0.15, 0.6);
          ctx.fillStyle = rgba(isLit ? '#c9b48d' : '#8f8b80', 0.75);
          ctx.fillRect(x, y, w, bh);
          ctx.fillStyle = rgba('#000', 0.12);
          for (let s = 0; s < bh; s += 3) ctx.fillRect(x, y + s, w, 1);
        }
        // muntin bar
        ctx.fillStyle = rgba(frame, 0.9);
        ctx.fillRect(x + w / 2 - 1, y, 2, h);
        // sill
        ctx.fillStyle = rgba('#ffffff', 0.1);
        ctx.fillRect(x - 5, y + h + 3, w + 10, 4);
        ctx.fillStyle = rgba('#000', 0.18);
        ctx.fillRect(x - 5, y + h + 7, w + 10, 2);
      }
    }
    if (!emissive) {
      streaks(ctx, S, S, { count: 30, color: rgba('#000', 0.1), seed: seed + 1 });
      weather(ctx, S, S, grime, seed + 2);
    }
    return toTexture(canvas, { srgb: !emissive ? true : true });
  });
}

/** A curtain-wall / glass-tower panel. */
export function curtainWallTexture({
  mullion = '#2b3238',
  glass = '#33484f',
  sky = '#8fb6c8',
  litChance = 0.25,
  lit = '#ffedc8',
  cols = 5,
  rows = 6,
  seed = 9,
  emissive = false,
  tintShift = 0
} = {}) {
  const key = `curtain|${mullion}|${glass}|${sky}|${litChance}|${lit}|${cols}|${rows}|${seed}|${emissive}|${tintShift}`;
  return memo(key, () => {
    const S = 512;
    const { canvas, ctx } = createCanvas(S, S);
    fill(ctx, S, S, emissive ? '#000' : mullion);
    const rng = makeRng(seed);
    const cw = S / cols;
    const ch = S / rows;
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const x = c * cw + 3;
        const y = r * ch + 3;
        const w = cw - 6;
        const h = ch - 6;
        const isLit = rng.chance(litChance);
        if (emissive) {
          if (isLit) {
            ctx.fillStyle = rgba(lit, rng.range(0.5, 1));
            ctx.fillRect(x, y, w, h);
          }
          continue;
        }
        const g = linearGradient(ctx, x, y, x, y + h, [
          [0, mixHex(sky, glass, 0.15 + tintShift * 0.1)],
          [0.52, glass],
          [1, shade(glass, -0.3)]
        ]);
        ctx.fillStyle = isLit ? mixHex(glass, lit, 0.65) : g;
        ctx.fillRect(x, y, w, h);
        // reflected skyline sliver
        ctx.fillStyle = rgba('#ffffff', 0.07);
        ctx.beginPath();
        ctx.moveTo(x, y + h * 0.62);
        ctx.lineTo(x + w * 0.35, y + h * 0.38);
        ctx.lineTo(x + w * 0.6, y + h * 0.55);
        ctx.lineTo(x + w, y + h * 0.3);
        ctx.lineTo(x + w, y);
        ctx.lineTo(x, y);
        ctx.closePath();
        ctx.fill();
        if (rng.chance(0.25)) {
          ctx.fillStyle = rgba('#0d1418', 0.35);
          ctx.fillRect(x, y + h * rng.range(0.3, 0.7), w, h * 0.16);
        }
      }
    }
    if (!emissive) grain(ctx, S, S, 0.03, seed);
    return toTexture(canvas);
  });
}

/* ============================================================ SIGNS ==== */

const FONTS = {
  serif: 'Georgia, "Times New Roman", serif',
  slab: '"Rockwell", "Courier New", Georgia, serif',
  script: '"Brush Script MT", "Segoe Script", cursive',
  deco: '"Copperplate", "Trajan Pro", Georgia, serif',
  grotesk: '"Barlow Condensed", "Arial Narrow", Impact, sans-serif',
  impact: 'Impact, "Arial Black", "Haettenschweiler", sans-serif',
  mono: '"JetBrains Mono", "Courier New", monospace',
  helvetica: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  futura: '"Century Gothic", "Futura", "Trebuchet MS", sans-serif'
};

export function fontFor(name) {
  return FONTS[name] || FONTS.grotesk;
}

/**
 * The storefront fascia sign. Six visual languages, one per era:
 *   painted  – hand-lettered gold-leaf on dark board (1945)
 *   neon     – glass tube on a plastic ground (1965 / 1985)
 *   plastic  – internally-lit acrylic box (1985 / 2005)
 *   corporate– glossy pill logo (2005)
 *   minimal  – flat sans on plaster (2025)
 *   holo     – volumetric glyph field (2055)
 */
export function signTexture({
  text = 'SHOP',
  sub = '',
  style = 'painted',
  bg = '#1c1a18',
  ink = '#e8c979',
  accent = '#c9483a',
  font = 'serif',
  seed = 10,
  wear = 0.25,
  emissive = false,
  w = 1024,
  h = 256
} = {}) {
  const key = `sign|${text}|${sub}|${style}|${bg}|${ink}|${accent}|${font}|${seed}|${wear}|${emissive}|${w}x${h}`;
  return memo(key, () => {
    const { canvas, ctx } = createCanvas(w, h);
    const rng = makeRng(hashSeed(key));
    const family = fontFor(font);
    const cx = w / 2;
    const cy = h / 2 - (sub ? h * 0.07 : 0);
    const E = emissive;

    const base = () => {
      if (E) {
        fill(ctx, w, h, '#000000');
        return;
      }
      fill(ctx, w, h, bg);
    };

    if (style === 'painted') {
      base();
      if (!E) {
        ctx.fillStyle = linearGradient(ctx, 0, 0, 0, h, [
          [0, rgba('#ffffff', 0.09)],
          [0.5, rgba('#000000', 0)],
          [1, rgba('#000000', 0.25)]
        ]);
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = rgba(ink, 0.55);
        ctx.lineWidth = 4;
        ctx.strokeRect(11, 11, w - 22, h - 22);
        ctx.strokeStyle = rgba(ink, 0.28);
        ctx.lineWidth = 1.5;
        ctx.strokeRect(20, 20, w - 40, h - 40);
      }
      const size = fitFont(ctx, text, w * 0.8, h * 0.5, family, '700');
      drawText(ctx, text, cx, cy, {
        font: `700 ${size}px ${family}`,
        fill: E ? '#000' : ink,
        stroke: E ? null : rgba('#2a1c10', 0.75),
        strokeWidth: 3,
        tracking: size * 0.05,
        shadow: E ? null : rgba('#000', 0.5),
        shadowOffset: 4
      });
      if (sub && !E) {
        const ss = fitFont(ctx, sub, w * 0.62, h * 0.15, family, '400');
        drawText(ctx, sub, cx, cy + h * 0.28, {
          font: `400 ${ss}px ${family}`,
          fill: rgba(ink, 0.72),
          tracking: ss * 0.24
        });
      }
      if (!E) {
        distress(ctx, w, h, wear * 0.9, seed);
        weather(ctx, w, h, wear, seed + 1);
      }
    } else if (style === 'neon') {
      base();
      if (!E) {
        ctx.fillStyle = linearGradient(ctx, 0, 0, 0, h, [
          [0, shade(bg, 0.08)],
          [1, shade(bg, -0.25)]
        ]);
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = rgba('#000', 0.5);
        ctx.lineWidth = 8;
        ctx.strokeRect(4, 4, w - 8, h - 8);
      }
      const size = fitFont(ctx, text, w * 0.78, h * 0.52, family, '700');
      // outer bloom
      drawText(ctx, text, cx, cy, {
        font: `700 ${size}px ${family}`,
        fill: rgba(ink, E ? 0.85 : 0.55),
        glow: ink,
        glowBlur: 42,
        tracking: size * 0.06
      });
      // hot core of the tube
      drawText(ctx, text, cx, cy, {
        font: `700 ${size}px ${family}`,
        fill: E ? '#ffffff' : mixHex(ink, '#ffffff', 0.65),
        glow: ink,
        glowBlur: 14,
        tracking: size * 0.06
      });
      if (sub) {
        const ss = fitFont(ctx, sub, w * 0.6, h * 0.16, family, '500');
        drawText(ctx, sub, cx, cy + h * 0.3, {
          font: `500 ${ss}px ${family}`,
          fill: E ? '#fff' : mixHex(accent, '#ffffff', 0.4),
          glow: accent,
          glowBlur: 20,
          tracking: ss * 0.3
        });
      }
      // mounting hardware only shows on the diffuse map
      if (!E) {
        ctx.fillStyle = rgba('#000', 0.4);
        for (let i = 0; i < 6; i++) ctx.fillRect((i + 0.5) * (w / 6) - 2, h * 0.1, 4, h * 0.8);
        grain(ctx, w, h, 0.05, seed);
      }
    } else if (style === 'plastic') {
      if (E) {
        fill(ctx, w, h, mixHex(bg, '#000000', 0.35));
      } else {
        fill(ctx, w, h, bg);
        ctx.fillStyle = radialGradient(ctx, cx, cy, h * 0.1, w * 0.62, [
          [0, rgba('#ffffff', 0.22)],
          [1, rgba('#000000', 0.16)]
        ]);
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = rgba('#000', 0.35);
        ctx.fillRect(0, 0, w, 10);
        ctx.fillRect(0, h - 10, w, 10);
      }
      const size = fitFont(ctx, text, w * 0.82, h * 0.55, family, '800');
      drawText(ctx, text, cx, cy, {
        font: `800 ${size}px ${family}`,
        fill: E ? '#fff' : ink,
        stroke: E ? null : rgba('#000', 0.35),
        strokeWidth: 2,
        tracking: size * 0.02
      });
      if (sub) {
        const ss = fitFont(ctx, sub, w * 0.7, h * 0.17, family, '600');
        drawText(ctx, sub, cx, cy + h * 0.3, {
          font: `600 ${ss}px ${family}`,
          fill: E ? '#ddd' : accent,
          tracking: ss * 0.16
        });
      }
      if (!E) weather(ctx, w, h, wear * 0.7, seed);
    } else if (style === 'corporate') {
      if (E) fill(ctx, w, h, '#000');
      else {
        fill(ctx, w, h, bg);
        ctx.fillStyle = linearGradient(ctx, 0, 0, 0, h, [
          [0, rgba('#ffffff', 0.3)],
          [0.5, rgba('#ffffff', 0.04)],
          [0.51, rgba('#000000', 0.06)],
          [1, rgba('#000000', 0.22)]
        ]);
        ctx.fillRect(0, 0, w, h);
      }
      // logo mark
      const r = h * 0.3;
      ctx.save();
      ctx.translate(w * 0.14, cy);
      ctx.fillStyle = E ? rgba(accent, 0.9) : accent;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = E ? '#fff' : rgba('#ffffff', 0.92);
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.52, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      const size = fitFont(ctx, text, w * 0.62, h * 0.42, family, '700');
      drawText(ctx, text, w * 0.28, cy, {
        font: `700 ${size}px ${family}`,
        fill: E ? '#fff' : ink,
        align: 'left',
        tracking: size * 0.01
      });
      if (sub) {
        const ss = fitFont(ctx, sub, w * 0.6, h * 0.14, family, '400');
        drawText(ctx, sub, w * 0.28, cy + h * 0.26, {
          font: `400 ${ss}px ${family}`,
          fill: E ? '#999' : rgba(ink, 0.6),
          align: 'left',
          tracking: ss * 0.2
        });
      }
    } else if (style === 'minimal') {
      if (E) fill(ctx, w, h, '#000');
      else {
        fill(ctx, w, h, bg);
        grain(ctx, w, h, 0.035, seed);
      }
      const size = fitFont(ctx, text, w * 0.7, h * 0.3, family, '500');
      drawText(ctx, text, cx, cy, {
        font: `500 ${size}px ${family}`,
        fill: E ? rgba(ink, 0.55) : ink,
        tracking: size * 0.26
      });
      if (sub) {
        const ss = fitFont(ctx, sub, w * 0.5, h * 0.11, family, '400');
        drawText(ctx, sub, cx, cy + h * 0.26, {
          font: `400 ${ss}px ${family}`,
          fill: E ? rgba(accent, 0.5) : rgba(ink, 0.5),
          tracking: ss * 0.42
        });
      }
      if (!E) {
        ctx.fillStyle = rgba(accent, 0.85);
        ctx.fillRect(w * 0.5 - 26, h * 0.82, 52, 2);
      }
    } else if (style === 'holo') {
      fill(ctx, w, h, '#000');
      // scan field
      for (let y = 0; y < h; y += 3) {
        ctx.fillStyle = rgba(accent, 0.05 + 0.05 * Math.sin(y * 0.09));
        ctx.fillRect(0, y, w, 1.4);
      }
      const size = fitFont(ctx, text, w * 0.74, h * 0.46, family, '300');
      drawText(ctx, text, cx, cy, {
        font: `300 ${size}px ${family}`,
        fill: rgba(ink, 0.35),
        glow: ink,
        glowBlur: 46,
        tracking: size * 0.2
      });
      drawText(ctx, text, cx, cy, {
        font: `300 ${size}px ${family}`,
        fill: '#ffffff',
        glow: ink,
        glowBlur: 12,
        tracking: size * 0.2
      });
      // chromatic ghosts
      ctx.globalCompositeOperation = 'lighter';
      drawText(ctx, text, cx - 3, cy, {
        font: `300 ${size}px ${family}`,
        fill: rgba(accent, 0.4),
        tracking: size * 0.2
      });
      drawText(ctx, text, cx + 3, cy, {
        font: `300 ${size}px ${family}`,
        fill: rgba(ink, 0.35),
        tracking: size * 0.2
      });
      ctx.globalCompositeOperation = 'source-over';
      if (sub) {
        const ss = fitFont(ctx, sub, w * 0.55, h * 0.12, family, '400');
        drawText(ctx, sub, cx, cy + h * 0.3, {
          font: `400 ${ss}px ${family}`,
          fill: rgba(accent, 0.9),
          glow: accent,
          glowBlur: 18,
          tracking: ss * 0.5
        });
      }
      // data ticks
      ctx.fillStyle = rgba(accent, 0.5);
      for (let i = 0; i < 22; i++) {
        if (rng.chance(0.55)) ctx.fillRect(w * 0.06 + i * (w * 0.04), h * 0.87, w * 0.022, 3);
      }
    }
    return toTexture(canvas, { srgb: true, wrap: THREE.ClampToEdgeWrapping });
  });
}

/** Vertical blade sign (reads top-to-bottom), a 1930s–60s staple. */
export function bladeSignTexture({ text = 'HOTEL', ink = '#ffd9a0', bg = '#8c1f1f', style = 'neon', emissive = false, seed = 12 } = {}) {
  const key = `blade|${text}|${ink}|${bg}|${style}|${emissive}`;
  return memo(key, () => {
    const w = 256;
    const h = 1024;
    const { canvas, ctx } = createCanvas(w, h);
    const family = fontFor(style === 'neon' ? 'grotesk' : 'serif');
    fill(ctx, w, h, emissive ? '#000' : bg);
    if (!emissive) {
      ctx.strokeStyle = rgba('#000', 0.4);
      ctx.lineWidth = 10;
      ctx.strokeRect(5, 5, w - 10, h - 10);
      ctx.fillStyle = linearGradient(ctx, 0, 0, w, 0, [
        [0, rgba('#ffffff', 0.14)],
        [0.5, rgba('#000000', 0.05)],
        [1, rgba('#000000', 0.28)]
      ]);
      ctx.fillRect(0, 0, w, h);
    }
    const chars = [...text];
    const cell = Math.min(h / (chars.length + 0.6), w * 1.05);
    const size = cell * 0.78;
    chars.forEach((c, i) => {
      const y = h * 0.06 + cell * (i + 0.55);
      if (style === 'neon') {
        drawText(ctx, c, w / 2, y, { font: `700 ${size}px ${family}`, fill: rgba(ink, emissive ? 0.9 : 0.6), glow: ink, glowBlur: 34 });
        drawText(ctx, c, w / 2, y, { font: `700 ${size}px ${family}`, fill: emissive ? '#fff' : mixHex(ink, '#fff', 0.7), glow: ink, glowBlur: 10 });
      } else {
        drawText(ctx, c, w / 2, y, {
          font: `700 ${size}px ${family}`,
          fill: emissive ? '#000' : ink,
          stroke: rgba('#000', 0.4),
          strokeWidth: 3
        });
      }
    });
    // chase bulbs down the edges
    const bulbs = Math.floor(h / 34);
    for (let i = 0; i < bulbs; i++) {
      const y = (i + 0.5) * (h / bulbs);
      for (const x of [11, w - 11]) {
        ctx.fillStyle = emissive ? '#fff2cf' : '#f6e3b6';
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (!emissive) weather(ctx, w, h, 0.3, seed);
    return toTexture(canvas, { wrap: THREE.ClampToEdgeWrapping });
  });
}

/** Cinema marquee face: title text on a light-bulb board. */
export function marqueeTexture({ line1 = 'NOW SHOWING', line2 = 'CASABLANCA', bg = '#f2ead6', ink = '#161412', accent = '#b8232a', emissive = false, seed = 14, bulbs = true } = {}) {
  const key = `marquee|${line1}|${line2}|${bg}|${ink}|${accent}|${emissive}|${bulbs}`;
  return memo(key, () => {
    const w = 1024;
    const h = 420;
    const { canvas, ctx } = createCanvas(w, h);
    fill(ctx, w, h, emissive ? '#000' : bg);
    if (!emissive) {
      blotches(ctx, w, h, { count: 30, color: rgba('#a9a08a', 0.18), min: 20, max: 120, seed });
      ctx.strokeStyle = rgba(accent, 0.9);
      ctx.lineWidth = 9;
      ctx.strokeRect(4.5, 4.5, w - 9, h - 9);
    }
    const pad = bulbs ? 42 : 20;
    const f1 = fitFont(ctx, line1, w - pad * 2, h * 0.2, fontFor('grotesk'), '600');
    drawText(ctx, line1, w / 2, h * 0.28, {
      font: `600 ${f1}px ${fontFor('grotesk')}`,
      fill: emissive ? rgba(accent, 0.8) : accent,
      tracking: f1 * 0.3,
      glow: emissive ? accent : null
    });
    const f2 = fitFont(ctx, line2, w - pad * 2, h * 0.42, fontFor('impact'), '700');
    drawText(ctx, line2, w / 2, h * 0.62, {
      font: `700 ${f2}px ${fontFor('impact')}`,
      fill: emissive ? '#fff' : ink,
      tracking: f2 * 0.03,
      glow: emissive ? '#ffe9bd' : null,
      glowBlur: 18
    });
    if (bulbs) {
      const n = 26;
      for (let i = 0; i < n; i++) {
        const x = 20 + (i / (n - 1)) * (w - 40);
        for (const y of [20, h - 20]) {
          const on = emissive ? (i % 3 !== 0 ? 1 : 0.35) : 1;
          ctx.fillStyle = emissive ? rgba('#fff3d0', on) : '#f7e6bd';
          ctx.beginPath();
          ctx.arc(x, y, 7, 0, Math.PI * 2);
          ctx.fill();
          if (!emissive) {
            ctx.strokeStyle = rgba('#8a7a58', 0.6);
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        }
      }
    }
    if (!emissive) weather(ctx, w, h, 0.22, seed + 1);
    return toTexture(canvas, { wrap: THREE.ClampToEdgeWrapping });
  });
}

/** Big-format advertising: billboards, wall wraps, bus-shelter panels. */
export function adTexture({
  headline = 'DRINK COLA',
  sub = 'ICE COLD · 5¢',
  brand = '',
  scheme = ['#c8202a', '#f4ecd8', '#1c1a18'],
  style = 'painted',
  seed = 15,
  wear = 0.3,
  emissive = false,
  w = 1024,
  h = 512
} = {}) {
  const key = `ad|${headline}|${sub}|${brand}|${scheme.join()}|${style}|${seed}|${wear}|${emissive}|${w}x${h}`;
  return memo(key, () => {
    const { canvas, ctx } = createCanvas(w, h);
    const [c1, c2, c3] = scheme;
    const rng = makeRng(hashSeed(key));
    if (emissive) fill(ctx, w, h, '#000');

    const paintBg = () => {
      if (emissive) return;
      fill(ctx, w, h, c1);
      if (style === 'painted' || style === 'litho') {
        ctx.fillStyle = radialGradient(ctx, w * 0.5, h * 0.42, h * 0.1, w * 0.7, [
          [0, rgba(c2, 0.28)],
          [1, rgba('#000000', 0.18)]
        ]);
        ctx.fillRect(0, 0, w, h);
        // sunburst rays
        ctx.save();
        ctx.translate(w * 0.5, h * 0.45);
        for (let i = 0; i < 22; i++) {
          ctx.rotate((Math.PI * 2) / 22);
          ctx.fillStyle = rgba(c2, 0.05);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(w, -h * 0.06);
          ctx.lineTo(w, h * 0.06);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      } else if (style === 'photo') {
        ctx.fillStyle = linearGradient(ctx, 0, 0, w, h, [
          [0, c1],
          [0.55, mixHex(c1, c3, 0.5)],
          [1, c3]
        ]);
        ctx.fillRect(0, 0, w, h);
        // abstract "product photography" shapes
        ctx.fillStyle = rgba(c2, 0.18);
        ctx.beginPath();
        ctx.ellipse(w * 0.74, h * 0.55, w * 0.22, h * 0.42, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = rgba('#ffffff', 0.1);
        roundRect(ctx, w * 0.62, h * 0.22, w * 0.2, h * 0.6, 26);
        ctx.fill();
      } else if (style === 'digital' || style === 'holo') {
        ctx.fillStyle = linearGradient(ctx, 0, 0, w, h, [
          [0, c3],
          [1, mixHex(c3, c1, 0.6)]
        ]);
        ctx.fillRect(0, 0, w, h);
      }
    };

    paintBg();

    if (style === 'digital' || style === 'holo') {
      // glowing geometry
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 6; i++) {
        const y = h * (0.12 + i * 0.14);
        ctx.fillStyle = rgba(c1, emissive ? 0.5 : 0.22);
        ctx.fillRect(0, y, w * rng.range(0.3, 1), 3);
      }
      ctx.fillStyle = radialGradient(ctx, w * 0.78, h * 0.5, 0, w * 0.3, [
        [0, rgba(c1, emissive ? 0.75 : 0.4)],
        [1, 'rgba(0,0,0,0)']
      ]);
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';
    }

    const family =
      style === 'painted' ? fontFor('impact') : style === 'litho' ? fontFor('deco') : style === 'photo' ? fontFor('helvetica') : fontFor('grotesk');
    const hs = fitFont(ctx, headline, w * 0.84, h * 0.3, family, '800');
    const glow = style === 'digital' || style === 'holo';
    drawText(ctx, headline, w * 0.5, h * 0.4, {
      font: `800 ${hs}px ${family}`,
      fill: emissive ? (glow ? '#fff' : '#0a0a0a') : c2,
      stroke: emissive ? null : rgba(c3, 0.8),
      strokeWidth: Math.max(2, hs * 0.05),
      tracking: hs * 0.02,
      glow: glow ? c1 : null,
      glowBlur: 34,
      shadow: emissive || glow ? null : rgba('#000', 0.35),
      shadowOffset: 6
    });
    if (sub) {
      const ss = fitFont(ctx, sub, w * 0.7, h * 0.14, family, '500');
      drawText(ctx, sub, w * 0.5, h * 0.62, {
        font: `500 ${ss}px ${family}`,
        fill: emissive ? (glow ? rgba(c1, 0.9) : '#000') : mixHex(c2, c3, 0.25),
        tracking: ss * 0.2,
        glow: glow ? c1 : null,
        glowBlur: 16
      });
    }
    if (brand) {
      const bs = fitFont(ctx, brand, w * 0.4, h * 0.1, fontFor('mono'), '700');
      drawText(ctx, brand, w * 0.5, h * 0.82, {
        font: `700 ${bs}px ${fontFor('mono')}`,
        fill: emissive ? rgba(c1, 0.8) : rgba(c2, 0.75),
        tracking: bs * 0.36,
        glow: glow ? c1 : null
      });
    }
    if (!emissive) {
      if (style === 'painted' || style === 'litho') {
        distress(ctx, w, h, wear, seed);
        // paper seams on a pasted bill
        ctx.fillStyle = rgba('#000', 0.08);
        for (let i = 1; i < 4; i++) ctx.fillRect((w / 4) * i, 0, 2, h);
      }
      if (style === 'digital') {
        for (let y = 0; y < h; y += 4) {
          ctx.fillStyle = rgba('#000', 0.14);
          ctx.fillRect(0, y, w, 1.6);
        }
      }
      weather(ctx, w, h, wear * 0.8, seed + 3);
    }
    return toTexture(canvas, { wrap: THREE.ClampToEdgeWrapping });
  });
}

/** Faded painted-brick advertisement ("ghost sign"). */
export function ghostSignTexture({ text = 'KESSLER & SONS', sub = 'DRY GOODS', ink = '#efe3cf', seed = 16 } = {}) {
  return memo(`ghost|${text}|${sub}|${ink}`, () => {
    const w = 512;
    const h = 512;
    const { canvas, ctx } = createCanvas(w, h);
    ctx.clearRect(0, 0, w, h);
    const family = fontFor('deco');
    const s1 = fitFont(ctx, text, w * 0.86, h * 0.2, family, '700');
    drawText(ctx, text, w / 2, h * 0.34, { font: `700 ${s1}px ${family}`, fill: rgba(ink, 0.9), tracking: s1 * 0.06 });
    const s2 = fitFont(ctx, sub, w * 0.7, h * 0.13, family, '400');
    drawText(ctx, sub, w / 2, h * 0.53, { font: `400 ${s2}px ${family}`, fill: rgba(ink, 0.78), tracking: s2 * 0.3 });
    ctx.strokeStyle = rgba(ink, 0.5);
    ctx.lineWidth = 4;
    ctx.strokeRect(w * 0.08, h * 0.14, w * 0.84, h * 0.56);
    const s3 = fitFont(ctx, 'EST. 1898', w * 0.4, h * 0.08, family, '400');
    drawText(ctx, 'EST. 1898', w / 2, h * 0.78, { font: `400 ${s3}px ${family}`, fill: rgba(ink, 0.6), tracking: s3 * 0.4 });
    distress(ctx, w, h, 1.35, seed);
    distress(ctx, w, h, 0.9, seed + 3);
    return toTexture(canvas, { wrap: THREE.ClampToEdgeWrapping });
  });
}

/** Spray-can wildstyle tag, alpha-transparent so it lays over brick. */
export function graffitiTexture({ words = ['ZEKE', 'RUSH'], seed = 17, palette = ['#f0364a', '#37c6f0', '#f7d449', '#8be04e', '#ffffff'] } = {}) {
  return memo(`graf|${words.join()}|${seed}`, () => {
    const w = 512;
    const h = 256;
    const { canvas, ctx } = createCanvas(w, h);
    const rng = makeRng(seed);
    ctx.clearRect(0, 0, w, h);
    words.forEach((word, i) => {
      const x = w * (0.28 + i * 0.42) + rng.range(-30, 30);
      const y = h * (0.42 + (i % 2) * 0.22);
      const col = palette[i % palette.length];
      const size = rng.range(58, 92);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rng.range(-0.16, 0.16));
      drawText(ctx, word, 0, 0, {
        font: `800 ${size}px ${fontFor('impact')}`,
        fill: col,
        stroke: '#0d0d0f',
        strokeWidth: size * 0.14,
        tracking: -size * 0.04
      });
      drawText(ctx, word, 0, 0, {
        font: `800 ${size}px ${fontFor('impact')}`,
        fill: mixHex(col, '#ffffff', 0.35),
        tracking: -size * 0.04
      });
      ctx.restore();
      // drips
      ctx.fillStyle = col;
      for (let d = 0; d < 6; d++) {
        const dx = x + rng.range(-size, size);
        const dy = y + size * 0.32;
        ctx.fillRect(dx, dy, rng.range(1.5, 3.6), rng.range(6, 30));
      }
    });
    // overspray
    for (let i = 0; i < 420; i++) {
      ctx.fillStyle = rgba(rng.pick(palette), rng.range(0.03, 0.16));
      ctx.beginPath();
      ctx.arc(rng() * w, rng() * h, rng.range(0.6, 2.4), 0, Math.PI * 2);
      ctx.fill();
    }
    distress(ctx, w, h, 0.35, seed + 2);
    return toTexture(canvas, { wrap: THREE.ClampToEdgeWrapping });
  });
}

/** Modern commissioned wall mural — big flat shapes, high chroma. */
export function muralTexture({ seed = 18, palette = ['#ff6b57', '#ffd166', '#06d6a0', '#118ab2', '#f6f2e8'] } = {}) {
  return memo(`mural|${seed}|${palette.join()}`, () => {
    const w = 512;
    const h = 512;
    const { canvas, ctx } = createCanvas(w, h);
    const rng = makeRng(seed);
    fill(ctx, w, h, palette[4]);
    for (let i = 0; i < 16; i++) {
      ctx.fillStyle = rgba(rng.pick(palette), rng.range(0.5, 0.95));
      const kind = rng.int(0, 2);
      if (kind === 0) {
        ctx.beginPath();
        ctx.arc(rng() * w, rng() * h, rng.range(30, 150), 0, Math.PI * 2);
        ctx.fill();
      } else if (kind === 1) {
        ctx.save();
        ctx.translate(rng() * w, rng() * h);
        ctx.rotate(rng() * Math.PI);
        ctx.fillRect(-rng.range(30, 160), -rng.range(10, 70), rng.range(60, 320), rng.range(20, 140));
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.moveTo(rng() * w, rng() * h);
        ctx.lineTo(rng() * w, rng() * h);
        ctx.lineTo(rng() * w, rng() * h);
        ctx.closePath();
        ctx.fill();
      }
    }
    // leafy motif — the 2020s civic mural default
    ctx.strokeStyle = rgba('#0b3b30', 0.7);
    ctx.lineWidth = 6;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      const x0 = rng() * w;
      ctx.moveTo(x0, h);
      ctx.bezierCurveTo(x0 + rng.range(-90, 90), h * 0.6, x0 + rng.range(-120, 120), h * 0.35, x0 + rng.range(-60, 60), h * 0.08);
      ctx.stroke();
    }
    grain(ctx, w, h, 0.05, seed);
    weather(ctx, w, h, 0.15, seed + 1);
    return toTexture(canvas);
  });
}

/** Paper bills pasted on plywood: posters, war bonds, gig flyers. */
export function posterWallTexture({ seed = 19, era = 1945, palette = ['#c8202a', '#1b3a6b', '#e8dfc8', '#2a2622'] } = {}) {
  return memo(`posters|${seed}|${era}`, () => {
    const w = 512;
    const h = 512;
    const { canvas, ctx } = createCanvas(w, h);
    const rng = makeRng(seed);
    fill(ctx, w, h, '#3b342c');
    const slogans = {
      1945: ['BUY WAR BONDS', 'WE CAN DO IT', 'LOOSE LIPS', 'VICTORY GARDEN', 'RATION BOOK 4'],
      1965: ['GO GO GO', 'THE MOD SET', 'LIVE ON STAGE', 'DANCE PARTY', 'NEW! COLOR TV'],
      1985: ['LIVE! FRIDAY', 'NEW WAVE NITE', 'DEMO TAPE', 'ARCADE OPEN 24H', 'RENT 3 GET 1'],
      2005: ['DOWNLOAD NOW', 'RINGTONES 99¢', 'DSL SPEEDS', 'OPEN MIC', 'BUY 1 GET 1'],
      2025: ['POP-UP MARKET', 'DJ SET SAT', 'NOW HIRING', 'ZERO WASTE', 'SCAN TO ORDER'],
      2055: ['NEURO-LINK EXPO', 'ORBIT SHUTTLE', 'GRAFT CLINIC', 'RENT-A-BODY', 'CARBON REBATE']
    }[era] || ['NOTICE'];
    for (let i = 0; i < 12; i++) {
      const pw = rng.range(90, 190);
      const ph = pw * rng.range(1.2, 1.6);
      const x = rng() * (w - pw * 0.4) - pw * 0.2;
      const y = rng() * (h - ph * 0.4) - ph * 0.2;
      ctx.save();
      ctx.translate(x + pw / 2, y + ph / 2);
      ctx.rotate(rng.range(-0.08, 0.08));
      ctx.fillStyle = rng.pick(palette);
      ctx.fillRect(-pw / 2, -ph / 2, pw, ph);
      ctx.fillStyle = rgba('#000', 0.15);
      ctx.fillRect(-pw / 2, -ph / 2, pw, ph * 0.14);
      const word = rng.pick(slogans);
      const fs = fitFont(ctx, word, pw * 0.86, ph * 0.16, fontFor('impact'), '800');
      drawText(ctx, word, 0, -ph * 0.16, { font: `800 ${fs}px ${fontFor('impact')}`, fill: '#f7f2e6', stroke: rgba('#000', 0.4), strokeWidth: 2 });
      ctx.fillStyle = rgba('#f7f2e6', 0.65);
      for (let l = 0; l < 4; l++) ctx.fillRect(-pw * 0.34, ph * (0.02 + l * 0.09), pw * rng.range(0.3, 0.68), 4);
      ctx.restore();
    }
    distress(ctx, w, h, 0.5, seed + 1);
    weather(ctx, w, h, 0.5, seed + 2);
    return toTexture(canvas);
  });
}

/* ========================================================== SCREENS ==== */

/** Interior glimpse behind shop glass: shelving, silhouettes, glow. */
export function shopInteriorTexture({ base = '#2a2018', warm = '#f0c07a', shelves = 3, seed = 20, era = 1945, emissive = false } = {}) {
  return memo(`interior|${base}|${warm}|${shelves}|${seed}|${era}|${emissive}`, () => {
    const w = 512;
    const h = 256;
    const { canvas, ctx } = createCanvas(w, h);
    const rng = makeRng(seed);
    if (emissive) {
      fill(ctx, w, h, '#000');
      ctx.fillStyle = linearGradient(ctx, 0, 0, 0, h, [
        [0, rgba(warm, 0.85)],
        [0.55, rgba(warm, 0.35)],
        [1, rgba(warm, 0.08)]
      ]);
      ctx.fillRect(0, 0, w, h);
      // ceiling fixtures read as hot spots
      for (let i = 0; i < 4; i++) {
        const x = (i + 0.5) * (w / 4);
        ctx.fillStyle = radialGradient(ctx, x, h * 0.12, 0, w * 0.14, [
          [0, rgba('#ffffff', 0.95)],
          [1, 'rgba(0,0,0,0)']
        ]);
        ctx.fillRect(x - w * 0.15, 0, w * 0.3, h * 0.4);
      }
      return toTexture(canvas, { wrap: THREE.ClampToEdgeWrapping });
    }
    fill(ctx, w, h, base);
    ctx.fillStyle = linearGradient(ctx, 0, 0, 0, h, [
      [0, rgba(warm, 0.5)],
      [0.6, rgba(warm, 0.12)],
      [1, rgba('#000', 0.4)]
    ]);
    ctx.fillRect(0, 0, w, h);
    // back wall shelving stacked with goods
    for (let s = 0; s < shelves; s++) {
      const y = h * (0.28 + s * 0.22);
      ctx.fillStyle = rgba('#000', 0.35);
      ctx.fillRect(0, y, w, 5);
      for (let i = 0; i < 26; i++) {
        const bw = rng.range(6, 18);
        const bh = rng.range(10, 30);
        ctx.fillStyle = rgba(
          rng.pick(['#c14a35', '#d9b45c', '#3f6f8c', '#8a9a5b', '#efe6d2', '#7b4a86']),
          rng.range(0.4, 0.85)
        );
        ctx.fillRect(rng() * w, y - bh, bw, bh);
      }
    }
    // counter + a silhouetted attendant
    ctx.fillStyle = rgba('#100c08', 0.75);
    ctx.fillRect(0, h * 0.8, w, h * 0.2);
    ctx.fillStyle = rgba('#0a0806', 0.8);
    const px = w * rng.range(0.2, 0.8);
    ctx.beginPath();
    ctx.arc(px, h * 0.66, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(px - 15, h * 0.72, 30, h * 0.16);
    grain(ctx, w, h, 0.06, seed);
    return toTexture(canvas, { wrap: THREE.ClampToEdgeWrapping });
  });
}

/** A luminous display: CRT, LED board, departure screen, hologram. */
export function screenTexture({ mode = 'crt', seed = 21, tint = '#7fe3ff', text = '', emissive = true } = {}) {
  return memo(`screen|${mode}|${seed}|${tint}|${text}|${emissive}`, () => {
    const w = 512;
    const h = 256;
    const { canvas, ctx } = createCanvas(w, h);
    const rng = makeRng(seed);
    fill(ctx, w, h, '#05070a');
    if (mode === 'crt') {
      ctx.fillStyle = radialGradient(ctx, w / 2, h / 2, 0, w * 0.62, [
        [0, rgba(tint, 0.9)],
        [1, rgba('#04121a', 0.9)]
      ]);
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 9; i++) {
        ctx.fillStyle = rgba(rng.pick(['#ffffff', tint, '#ffd166', '#ff6b6b']), rng.range(0.15, 0.5));
        ctx.fillRect(rng() * w, rng() * h, rng.range(20, 160), rng.range(6, 40));
      }
      for (let y = 0; y < h; y += 3) {
        ctx.fillStyle = rgba('#000', 0.26);
        ctx.fillRect(0, y, w, 1.4);
      }
    } else if (mode === 'led') {
      fill(ctx, w, h, '#050505');
      const cell = 8;
      for (let x = 0; x < w; x += cell) {
        for (let y = 0; y < h; y += cell) {
          const on = rng.chance(0.34);
          ctx.fillStyle = on ? rgba(tint, rng.range(0.5, 1)) : rgba('#0f1418', 0.9);
          ctx.beginPath();
          ctx.arc(x + cell / 2, y + cell / 2, cell * 0.34, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      if (text) drawText(ctx, text, w / 2, h / 2, { font: `700 ${h * 0.4}px ${fontFor('mono')}`, fill: '#fff', glow: tint, glowBlur: 26 });
    } else if (mode === 'ui') {
      fill(ctx, w, h, '#070b10');
      ctx.strokeStyle = rgba(tint, 0.35);
      ctx.lineWidth = 1.5;
      for (let i = 1; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(0, (h / 6) * i);
        ctx.lineTo(w, (h / 6) * i);
        ctx.stroke();
      }
      ctx.fillStyle = rgba(tint, 0.75);
      for (let i = 0; i < 14; i++) {
        const bh = rng.range(8, h * 0.55);
        ctx.fillRect(w * 0.06 + i * (w * 0.062), h * 0.82 - bh, w * 0.038, bh);
      }
      if (text) drawText(ctx, text, w * 0.06, h * 0.16, { font: `500 ${h * 0.14}px ${fontFor('mono')}`, fill: '#fff', align: 'left', glow: tint, glowBlur: 14, tracking: 3 });
      ctx.fillStyle = rgba('#ff5d7a', 0.9);
      ctx.beginPath();
      ctx.arc(w * 0.93, h * 0.14, 6, 0, Math.PI * 2);
      ctx.fill();
    } else if (mode === 'menu') {
      fill(ctx, w, h, '#0b0d0c');
      ctx.fillStyle = rgba('#f6efe2', 0.92);
      const items = ['ESPRESSO', 'CORTADO', 'OAT LATTE', 'COLD BREW', 'FILTER'];
      items.forEach((it, i) => {
        drawText(ctx, it, w * 0.1, h * (0.2 + i * 0.16), { font: `500 ${h * 0.1}px ${fontFor('grotesk')}`, fill: '#f6efe2', align: 'left', tracking: 3 });
        drawText(ctx, `${4 + i}.${(i * 25) % 100 || '00'}`, w * 0.88, h * (0.2 + i * 0.16), {
          font: `400 ${h * 0.09}px ${fontFor('mono')}`,
          fill: rgba('#f6efe2', 0.6),
          align: 'right'
        });
      });
    }
    return toTexture(canvas, { wrap: THREE.ClampToEdgeWrapping });
  });
}

/* ========================================================== FABRIC ===== */

export function stripeTexture({ a = '#b8232a', b = '#f0e7d4', count = 8, seed = 22, wear = 0.2, vertical = true } = {}) {
  return memo(`stripe|${a}|${b}|${count}|${seed}|${wear}|${vertical}`, () => {
    const S = 256;
    const { canvas, ctx } = createCanvas(S, S);
    fill(ctx, S, S, b);
    const step = S / count;
    for (let i = 0; i < count; i += 2) {
      ctx.fillStyle = a;
      if (vertical) ctx.fillRect(i * step, 0, step, S);
      else ctx.fillRect(0, i * step, S, step);
    }
    // canvas weave
    const rng = makeRng(seed);
    for (let i = 0; i < 1400; i++) {
      ctx.fillStyle = rgba(rng.chance(0.5) ? '#fff' : '#000', rng.range(0.015, 0.05));
      ctx.fillRect(rng() * S, rng() * S, rng.range(1, 4), 1);
    }
    weather(ctx, S, S, wear, seed + 1);
    return toTexture(canvas);
  });
}

export function tarpTexture({ color = '#3c4a5a', seed = 23, wear = 0.4 } = {}) {
  return memo(`tarp|${color}|${seed}|${wear}`, () => {
    const S = 256;
    const { canvas, ctx } = createCanvas(S, S);
    fill(ctx, S, S, color);
    const rng = makeRng(seed);
    for (let i = 0; i < 900; i++) {
      ctx.fillStyle = rgba(rng.chance(0.5) ? '#fff' : '#000', rng.range(0.01, 0.06));
      ctx.fillRect(rng() * S, rng() * S, rng.range(2, 10), 1);
    }
    weather(ctx, S, S, wear, seed);
    return toTexture(canvas);
  });
}

/* ======================================================= DECAL/UTIL ==== */

/** Soft round shadow blob dropped under vehicles and people. */
export function blobShadowTexture() {
  return memo('blobshadow', () => {
    const S = 128;
    const { canvas, ctx } = createCanvas(S, S);
    ctx.fillStyle = radialGradient(ctx, S / 2, S / 2, 0, S / 2, [
      [0, 'rgba(0,0,0,0.55)'],
      [0.55, 'rgba(0,0,0,0.28)'],
      [1, 'rgba(0,0,0,0)']
    ]);
    ctx.fillRect(0, 0, S, S);
    return toTexture(canvas, { wrap: THREE.ClampToEdgeWrapping, srgb: false });
  });
}

/** Radial falloff used for light pools, glows and headlight cones. */
export function glowTexture(color = '#ffffff', power = 1) {
  return memo(`glow|${color}|${power}`, () => {
    const S = 256;
    const { canvas, ctx } = createCanvas(S, S);
    const stops = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      stops.push([t, rgba(color, Math.pow(1 - t, 2.2) * power)]);
    }
    ctx.fillStyle = radialGradient(ctx, S / 2, S / 2, 0, S / 2, stops);
    ctx.fillRect(0, 0, S, S);
    return toTexture(canvas, { wrap: THREE.ClampToEdgeWrapping });
  });
}

/** A single soft particle (rain streak, snowflake, spark, dust mote). */
export function particleTexture(kind = 'dot') {
  return memo(`particle|${kind}`, () => {
    const S = 64;
    const { canvas, ctx } = createCanvas(S, S);
    if (kind === 'streak') {
      ctx.fillStyle = linearGradient(ctx, 0, 0, 0, S, [
        [0, 'rgba(255,255,255,0)'],
        [0.4, 'rgba(255,255,255,0.55)'],
        [0.85, 'rgba(255,255,255,0.9)'],
        [1, 'rgba(255,255,255,0)']
      ]);
      ctx.fillRect(S * 0.44, 0, S * 0.12, S);
    } else if (kind === 'flake') {
      ctx.fillStyle = radialGradient(ctx, S / 2, S / 2, 0, S / 2, [
        [0, 'rgba(255,255,255,1)'],
        [0.4, 'rgba(255,255,255,0.7)'],
        [1, 'rgba(255,255,255,0)']
      ]);
      ctx.fillRect(0, 0, S, S);
    } else {
      ctx.fillStyle = radialGradient(ctx, S / 2, S / 2, 0, S / 2, [
        [0, 'rgba(255,255,255,0.95)'],
        [0.35, 'rgba(255,255,255,0.4)'],
        [1, 'rgba(255,255,255,0)']
      ]);
      ctx.fillRect(0, 0, S, S);
    }
    return toTexture(canvas, { wrap: THREE.ClampToEdgeWrapping });
  });
}

/** Leaf cluster billboard for street trees. */
export function leafTexture({ color = '#4a7a35', seed = 24, autumn = 0 } = {}) {
  return memo(`leaf|${color}|${seed}|${autumn}`, () => {
    const S = 256;
    const { canvas, ctx } = createCanvas(S, S);
    ctx.clearRect(0, 0, S, S);
    const rng = makeRng(seed);
    const auburn = ['#c9772e', '#b3502a', '#d9a441'];
    for (let i = 0; i < 150; i++) {
      const x = S / 2 + rng.gauss(0, S * 0.16);
      const y = S / 2 + rng.gauss(0, S * 0.16);
      const r = rng.range(6, 20);
      const c = rng.chance(autumn) ? rng.pick(auburn) : mixHex(color, rng.chance(0.5) ? '#0c2410' : '#a8d06a', rng.range(0, 0.45));
      ctx.fillStyle = rgba(c, rng.range(0.55, 1));
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rng() * Math.PI);
      ctx.beginPath();
      ctx.ellipse(0, 0, r, r * 0.62, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    return toTexture(canvas, { wrap: THREE.ClampToEdgeWrapping });
  });
}

/** Simple flat colour texture — handy for keeping every material uniform. */
export function flatTexture(color) {
  return memo(`flat|${color}`, () => {
    const { canvas, ctx } = createCanvas(4, 4);
    fill(ctx, 4, 4, color);
    return toTexture(canvas);
  });
}

/** Number plate / door number / route board. */
export function plateTexture({ text = '4102', bg = '#e8e4d8', ink = '#20242c', seed = 25, w = 256, h = 128, font = 'mono' } = {}) {
  return memo(`plate|${text}|${bg}|${ink}|${w}|${h}|${font}`, () => {
    const { canvas, ctx } = createCanvas(w, h);
    fill(ctx, w, h, bg);
    ctx.strokeStyle = rgba(ink, 0.7);
    ctx.lineWidth = 5;
    ctx.strokeRect(7, 7, w - 14, h - 14);
    const fs = fitFont(ctx, text, w * 0.78, h * 0.58, fontFor(font), '700');
    drawText(ctx, text, w / 2, h / 2, { font: `700 ${fs}px ${fontFor(font)}`, fill: ink, tracking: fs * 0.08 });
    weather(ctx, w, h, 0.3, seed);
    return toTexture(canvas, { wrap: THREE.ClampToEdgeWrapping });
  });
}

export { rgba, mixHex, shade, measureTracked };
