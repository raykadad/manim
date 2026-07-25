/**
 * Headless capture harness.
 *
 * Boots CHRONOBLOCK in Chromium (SwiftShader), steps through the requested
 * years and writes a PNG for each, reporting any console or page errors.
 *
 *   node tools/shoot.mjs [--url=...] [--years=1945,1985] [--out=shots]
 *                        [--preset=0] [--night] [--wait=9000]
 */

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  })
);

const url = args.url || 'http://localhost:5173/';
const years = String(args.years || '1945,1965,1985,2005,2025,2055')
  .split(',')
  .map((y) => parseInt(y, 10));
const outDir = path.resolve(args.out || 'shots');
const preset = args.preset !== undefined ? Number(args.preset) : null;
const settle = Number(args.wait || 9000);

mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  args: [
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
    '--enable-webgl',
    '--disable-dev-shm-usage'
  ]
});
const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });

const errors = [];
page.on('console', (m) => {
  const t = m.type();
  if (t === 'error' || t === 'warning') errors.push(`[${t}] ${m.text()}`);
});
page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}\n${e.stack || ''}`));

console.log(`→ ${url}`);
await page.goto(url, { waitUntil: 'load', timeout: 120000 });

// wait for the app to declare itself booted
await page
  .waitForFunction(() => window.chronoblock && window.chronoblock.current && window.chronoblock.current.built, {
    timeout: 180000
  })
  .catch(() => console.log('!! boot wait timed out'));

await page.evaluate(() => document.getElementById('boot')?.classList.add('is-gone'));
await page.evaluate(() => {
  const app = window.chronoblock;
  app.started = true;
  document.getElementById('timeline')?.classList.add('is-live');
  document.getElementById('dossier')?.classList.add('is-live');
  document.getElementById('hud')?.classList.add('is-live');
  document.getElementById('stats')?.classList.add('is-live');
});

if (args.night) await page.evaluate(() => window.chronoblock.setNight(true));

for (const year of years) {
  const idx = [1945, 1965, 1985, 2005, 2025, 2055].indexOf(year);
  await page.evaluate((i) => window.chronoblock.ui.select(i, { force: true }), idx);
  if (preset !== null) await page.evaluate((p) => window.chronoblock.rig.applyPreset(p, true), preset);
  await page.waitForTimeout(settle);
  const file = path.join(outDir, `${year}${preset !== null ? `-v${preset}` : ''}${args.night ? '-night' : ''}.png`);
  await page.screenshot({ path: file });
  const stats = await page.evaluate(() => ({
    fps: Math.round(window.chronoblock.fps),
    calls: window.chronoblock.renderer.info.render.calls,
    tris: window.chronoblock.renderer.info.render.triangles,
    built: [...window.chronoblock.worlds.keys()]
  }));
  console.log(`  ${year}: ${file}  ${stats.fps}fps  ${stats.calls} draws  ${(stats.tris / 1000) | 0}k tris  built=[${stats.built}]`);
}

await browser.close();

if (errors.length) {
  console.log(`\n=== ${errors.length} console problem(s) ===`);
  for (const e of [...new Set(errors)].slice(0, 40)) console.log(e);
  process.exitCode = 1;
} else {
  console.log('\nno console errors');
}
