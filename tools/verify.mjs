/**
 * Final check: camera modes, the dissolve shader mid-wipe, keyboard shortcuts,
 * and a capture set at a fixed viewpoint for comparison across eras.
 */

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const OUT = process.argv[2] || 'shots/final';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage']
});
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(`[console] ${m.text()}`);
});

await page.goto('http://localhost:5173/', { waitUntil: 'load', timeout: 120000 });
await page.waitForFunction(() => window.chronoblock?.current?.built, { timeout: 180000 });
await page.click('#boot-enter');
await page.waitForTimeout(2500);

const YEARS = [1945, 1965, 1985, 2005, 2025, 2055];

// hold the dissolve halfway so the chrono wipe can be seen
await page.evaluate(() => {
  const app = window.chronoblock;
  app.ui.select(1);
});
await page.waitForTimeout(200);
await page.evaluate(() => {
  const app = window.chronoblock;
  app._freeze = true;
  const orig = app._updateTransition.bind(app);
  app._updateTransition = () => {
    if (!app.transition) return;
    app.transition.from.field.reveal = 0.45;
    app.transition.to.field.reveal = 0.5;
    app.transition.from.show();
    app.transition.to.show();
  };
});
await page.waitForTimeout(5000);
await page.screenshot({ path: `${OUT}/dissolve.png` });
console.log('  dissolve frame captured');
await page.reload({ waitUntil: 'load' });
await page.waitForFunction(() => window.chronoblock?.current?.built, { timeout: 180000 });
await page.click('#boot-enter');
await page.waitForTimeout(2500);

// camera modes must not throw
for (const mode of ['walk', 'drone', 'cinema', 'orbit']) {
  await page.evaluate((m) => window.chronoblock.rig.setMode(m), mode);
  await page.waitForTimeout(1200);
  const pos = await page.evaluate(() => {
    const p = window.chronoblock.camera.position;
    return [+p.x.toFixed(1), +p.y.toFixed(1), +p.z.toFixed(1)];
  });
  console.log(`  mode ${mode}: camera ${pos}`);
}
await page.evaluate(() => window.chronoblock.rig.setMode('orbit'));

// keyboard shortcuts
for (const key of ['KeyN', 'KeyN', 'KeyG', 'KeyG', 'KeyQ', 'KeyQ', 'KeyQ', 'KeyH', 'Escape']) {
  await page.keyboard.press(key.startsWith('Key') ? key.slice(3) : 'Escape');
  await page.waitForTimeout(220);
}
console.log('  shortcuts ok, quality =', await page.evaluate(() => window.chronoblock.quality));

// era capture set
for (const [i, year] of YEARS.entries()) {
  await page.evaluate((n) => window.chronoblock.ui.select(n, { force: true }), i);
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.chronoblock.rig.applyPreset(0, true));
  await page.waitForTimeout(6500);
  await page.screenshot({ path: `${OUT}/${year}.png` });
  const s = await page.evaluate(() => ({
    calls: window.chronoblock.renderer.info.render.calls,
    tris: window.chronoblock.renderer.info.render.triangles
  }));
  console.log(`  ${year}: ${s.calls} draws / ${(s.tris / 1000) | 0}k tris`);
}

await browser.close();
if (errors.length) {
  console.log(`\n=== ${errors.length} problems ===`);
  for (const e of [...new Set(errors)].slice(0, 25)) console.log(e);
  process.exitCode = 1;
} else console.log('\nno console errors');
