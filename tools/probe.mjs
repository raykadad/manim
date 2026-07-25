/**
 * Ad-hoc probe: point the camera wherever the argv says and shoot it.
 * Usage: node tools/probe.mjs <eraIndex> <px,py,pz> <tx,ty,tz> <out.png>
 */

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const eraIndex = Number(process.argv[2] ?? 1);
const pos = (process.argv[3] ?? '48,11.5,4.2').split(',').map(Number);
const target = (process.argv[4] ?? '-30,7.5,-7.5').split(',').map(Number);
const out = process.argv[5] ?? 'shots/probe.png';
const night = process.argv.includes('--night');
mkdirSync(dirname(out), { recursive: true });

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage']
});
const page = await browser.newPage({ viewport: { width: 1400, height: 800 } });
await page.goto('http://localhost:5173/', { waitUntil: 'load', timeout: 120000 });
await page.waitForFunction(() => window.chronoblock?.current?.built, { timeout: 180000 });
await page.click('#boot-enter');
await page.waitForTimeout(2000);

if (eraIndex !== 0) {
  await page.evaluate((n) => window.chronoblock.ui.select(n, { force: true }), eraIndex);
  await page.waitForTimeout(5000);
}

await page.evaluate(([p, t]) => {
  const rig = window.chronoblock.rig;
  if (rig.mode !== 'orbit') rig.setMode('orbit');
  rig.target.set(...t);
  rig.smoothTarget.copy(rig.target);
  rig.smoothPos.set(...p);
  rig.sphericalTarget.setFromVector3(rig.smoothPos.clone().sub(rig.target));
  rig.spherical.copy(rig.sphericalTarget);
  rig.camera.position.copy(rig.smoothPos);
  rig.camera.lookAt(rig.target);
}, [pos, target]);
if (night) {
  await page.keyboard.press('N');
  await page.waitForTimeout(4000);
}
await page.waitForTimeout(3000);
await page.screenshot({ path: out });
console.log('wrote', out);
await browser.close();
