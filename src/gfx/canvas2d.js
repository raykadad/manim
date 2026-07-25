/**
 * Low-level 2D drawing helpers used by the procedural texture factory.
 *
 * Everything the block wears — brick, plaster, hand-painted signage, neon,
 * peeling posters, holograms — is painted here into offscreen canvases.
 */

import { makeRng } from '../util/rng.js';

export function createCanvas(w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: false });
  ctx.imageSmoothingQuality = 'high';
  return { canvas, ctx, w, h };
}

export function fill(ctx, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);
}

export function linearGradient(ctx, x0, y0, x1, y1, stops) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const [at, color] of stops) g.addColorStop(at, color);
  return g;
}

export function radialGradient(ctx, x, y, r0, r1, stops) {
  const g = ctx.createRadialGradient(x, y, r0, x, y, r1);
  for (const [at, color] of stops) g.addColorStop(at, color);
  return g;
}

export function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/** Fine-grained monochrome noise, multiplied over whatever is underneath. */
export function grain(ctx, w, h, amount = 0.08, seed = 7, mono = true) {
  const rng = makeRng(seed);
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    if (mono) {
      const n = (rng() - 0.5) * 255 * amount;
      d[i] += n;
      d[i + 1] += n;
      d[i + 2] += n;
    } else {
      d[i] += (rng() - 0.5) * 255 * amount;
      d[i + 1] += (rng() - 0.5) * 255 * amount;
      d[i + 2] += (rng() - 0.5) * 255 * amount;
    }
  }
  ctx.putImageData(img, 0, 0);
}

/** Soft, blotchy grime — layered translucent blobs. */
export function blotches(ctx, w, h, { count = 40, color = 'rgba(0,0,0,0.16)', min = 20, max = 120, seed = 3 } = {}) {
  const rng = makeRng(seed);
  ctx.save();
  for (let i = 0; i < count; i++) {
    const x = rng() * w;
    const y = rng() * h;
    const r = rng.range(min, max);
    ctx.fillStyle = radialGradient(ctx, x, y, 0, r, [
      [0, color],
      [1, 'rgba(0,0,0,0)']
    ]);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Vertical streaks — rain-washed dirt running down a facade. */
export function streaks(ctx, w, h, { count = 30, color = 'rgba(0,0,0,0.1)', seed = 11, from = 0, len = 1 } = {}) {
  const rng = makeRng(seed);
  ctx.save();
  for (let i = 0; i < count; i++) {
    const x = rng() * w;
    const sw = rng.range(1, 7);
    const y0 = from * h + rng() * h * 0.15;
    const y1 = y0 + h * len * rng.range(0.3, 1);
    ctx.fillStyle = linearGradient(ctx, 0, y0, 0, y1, [
      [0, color],
      [0.6, color],
      [1, 'rgba(0,0,0,0)']
    ]);
    ctx.globalAlpha = rng.range(0.25, 0.9);
    ctx.fillRect(x, y0, sw, y1 - y0);
  }
  ctx.restore();
}

/** Hairline cracks that fork as they travel. */
export function cracks(ctx, w, h, { count = 8, color = 'rgba(0,0,0,0.35)', seed = 5, width = 1.2, life = 90 } = {}) {
  const rng = makeRng(seed);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  const walk = (x, y, ang, steps, wdt) => {
    ctx.lineWidth = wdt;
    ctx.beginPath();
    ctx.moveTo(x, y);
    let a = ang;
    for (let i = 0; i < steps; i++) {
      a += rng.range(-0.5, 0.5);
      x += Math.cos(a) * rng.range(2, 7);
      y += Math.sin(a) * rng.range(2, 7);
      ctx.lineTo(x, y);
      if (rng.chance(0.04) && wdt > 0.5) walk(x, y, a + rng.sign() * 0.9, steps * 0.4, wdt * 0.6);
    }
    ctx.stroke();
  };
  for (let i = 0; i < count; i++) walk(rng() * w, rng() * h, rng() * Math.PI * 2, life, width);
  ctx.restore();
}

/** Scale a font down until the string fits the given width. */
export function fitFont(ctx, text, maxWidth, startPx, family, weight = '700', maxHeightPx = Infinity) {
  let size = Math.min(startPx, maxHeightPx);
  for (let i = 0; i < 90; i++) {
    ctx.font = `${weight} ${size}px ${family}`;
    if (ctx.measureText(text).width <= maxWidth || size <= 5) break;
    size -= Math.max(1, size * 0.045);
  }
  return size;
}

/**
 * Centre a line of text with optional stroke, glow and letter spacing.
 * Canvas letterSpacing is not universal, so it is emulated per glyph.
 */
export function drawText(ctx, text, x, y, opts = {}) {
  const {
    font = '700 40px Georgia',
    fill: fillStyle = '#fff',
    stroke = null,
    strokeWidth = 2,
    align = 'center',
    baseline = 'middle',
    tracking = 0,
    glow = null,
    glowBlur = 22,
    shadow = null,
    shadowOffset = 3
  } = opts;

  ctx.save();
  ctx.font = font;
  ctx.textAlign = tracking ? 'left' : align;
  ctx.textBaseline = baseline;

  const chars = [...text];
  const widths = chars.map((c) => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0) + tracking * Math.max(0, chars.length - 1);
  let cursor = x;
  if (tracking) {
    if (align === 'center') cursor = x - total / 2;
    else if (align === 'right') cursor = x - total;
  }

  const paint = (mode, style, extra = 0, dx = 0, dy = 0) => {
    if (mode === 'stroke') {
      ctx.strokeStyle = style;
      ctx.lineWidth = strokeWidth + extra;
      ctx.lineJoin = 'round';
    } else {
      ctx.fillStyle = style;
    }
    if (tracking) {
      let cx = cursor;
      chars.forEach((c, i) => {
        if (mode === 'stroke') ctx.strokeText(c, cx + dx, y + dy);
        else ctx.fillText(c, cx + dx, y + dy);
        cx += widths[i] + tracking;
      });
    } else if (mode === 'stroke') ctx.strokeText(text, x + dx, y + dy);
    else ctx.fillText(text, x + dx, y + dy);
  };

  if (shadow) paint('fill', shadow, 0, shadowOffset, shadowOffset);
  if (glow) {
    ctx.shadowColor = glow;
    ctx.shadowBlur = glowBlur;
    paint('fill', fillStyle);
    paint('fill', fillStyle);
    ctx.shadowBlur = 0;
  }
  if (stroke) paint('stroke', stroke);
  paint('fill', fillStyle);
  ctx.restore();
  return total;
}

/** Measure with the same tracking rules `drawText` uses. */
export function measureTracked(ctx, text, font, tracking = 0) {
  ctx.save();
  ctx.font = font;
  const chars = [...text];
  const w = chars.reduce((a, c) => a + ctx.measureText(c).width, 0) + tracking * Math.max(0, chars.length - 1);
  ctx.restore();
  return w;
}

/** Wear an image down: scratches, missing paint, sun bleaching. */
export function distress(ctx, w, h, amount = 0.5, seed = 13) {
  const rng = makeRng(seed);
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  const n = Math.floor(amount * 260);
  for (let i = 0; i < n; i++) {
    const x = rng() * w;
    const y = rng() * h;
    const r = rng.range(0.6, 4.5) * (0.5 + amount);
    ctx.globalAlpha = rng.range(0.15, 0.85);
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * rng.range(0.3, 1.6), rng() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < n * 0.15; i++) {
    ctx.globalAlpha = rng.range(0.2, 0.7);
    ctx.lineWidth = rng.range(0.5, 2);
    ctx.beginPath();
    const x = rng() * w;
    const y = rng() * h;
    ctx.moveTo(x, y);
    ctx.lineTo(x + rng.range(-40, 40), y + rng.range(-12, 12));
    ctx.stroke();
  }
  ctx.restore();
}

/** Ordinary dust/scuffing pass that keeps things from looking CG-clean. */
export function weather(ctx, w, h, level = 0.3, seed = 21, tint = '0,0,0') {
  if (level <= 0) return;
  blotches(ctx, w, h, {
    count: Math.floor(24 * level) + 8,
    color: `rgba(${tint},${0.1 * level + 0.03})`,
    min: w * 0.05,
    max: w * 0.4,
    seed
  });
  streaks(ctx, w, h, {
    count: Math.floor(38 * level),
    color: `rgba(${tint},${0.09 * level})`,
    seed: seed + 1
  });
  grain(ctx, w, h, 0.05 + level * 0.06, seed + 2);
}

/** Convert hex + alpha into an rgba() string. */
export function rgba(hex, a = 1) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/** Mix two hex colours; returns a hex string. */
export function mixHex(a, b, t) {
  const pa = parseInt(a.replace('#', ''), 16);
  const pb = parseInt(b.replace('#', ''), 16);
  const r = Math.round(((pa >> 16) & 255) * (1 - t) + ((pb >> 16) & 255) * t);
  const g = Math.round(((pa >> 8) & 255) * (1 - t) + ((pb >> 8) & 255) * t);
  const bl = Math.round((pa & 255) * (1 - t) + (pb & 255) * t);
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | bl).toString(16).slice(1);
}

export function shade(hex, amt) {
  return mixHex(hex, amt > 0 ? '#ffffff' : '#000000', Math.abs(amt));
}
