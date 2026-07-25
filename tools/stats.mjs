/**
 * Draw call / triangle budget per era from a fixed viewpoint.
 */

import { chromium } from 'playwright';

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage']
});
const page = await browser.newPage({ viewport: { width: 1400, height: 800 } });
await page.goto('http://localhost:5173/', { waitUntil: 'load', timeout: 120000 });
await page.waitForFunction(() => window.chronoblock?.current?.built, { timeout: 180000 });
await page.click('#boot-enter');
await page.waitForTimeout(2000);

for (const [i, year] of [1945, 1965, 1985, 2005, 2025, 2055].entries()) {
  await page.evaluate((n) => window.chronoblock.ui.select(n, { force: true }), i);
  await page.waitForTimeout(4500);
  await page.evaluate(() => window.chronoblock.rig.applyPreset(0, true));
  await page.waitForTimeout(1500);
  const s = await page.evaluate(() => {
    const r = window.chronoblock.renderer.info;
    let meshes = 0;
    window.chronoblock.current.group.traverse((o) => {
      if (o.isMesh) meshes++;
    });
    return { calls: r.render.calls, tris: r.render.triangles, meshes, progs: r.programs.length };
  });
  console.log(`${year}: ${s.calls} draws, ${(s.tris / 1000) | 0}k tris, ${s.meshes} meshes in world, ${s.progs} programs`);
}
await browser.close();
