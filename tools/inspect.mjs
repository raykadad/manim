/**
 * Broader smoke test: starts audio, walks the presets, toggles night, and
 * grabs a frame mid-transition so the chrono wipe can be eyeballed.
 */

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

mkdirSync('shots', { recursive: true });

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--autoplay-policy=no-user-gesture-required']
});
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(`[console] ${m.text()}`);
});

await page.goto('http://localhost:5173/', { waitUntil: 'load', timeout: 120000 });
await page.waitForFunction(() => window.chronoblock?.current?.built, { timeout: 180000 });

// press the real Enter button so the audio graph actually spins up
await page.click('#boot-enter');
await page.waitForTimeout(3000);
console.log(
  'audio:',
  await page.evaluate(() => ({
    ready: window.chronoblock.audio.ready,
    state: window.chronoblock.audio.ctx?.state,
    emitters: window.chronoblock.audio.emitters.length,
    music: window.chronoblock.audio.music?.bpm
  }))
);

const shot = async (name) => {
  await page.screenshot({ path: `shots/${name}.png` });
  console.log('  wrote', name);
};

// mid-transition
await page.evaluate(() => window.chronoblock.ui.select(1));
await page.waitForTimeout(950);
await shot('transition-1965');
await page.waitForTimeout(7000);

// preset tour on 1965
for (const [i, name] of [
  [1, 'aerial'],
  [4, 'marquee'],
  [7, 'forecourt']
]) {
  await page.evaluate((p) => window.chronoblock.rig.applyPreset(p, true), i);
  await page.waitForTimeout(3500);
  await shot(`1965-${name}`);
}

// night on 1985
await page.evaluate(() => window.chronoblock.ui.select(2));
await page.waitForTimeout(8000);
await page.evaluate(() => window.chronoblock.setNight(true));
await page.evaluate(() => window.chronoblock.rig.applyPreset(0, true));
await page.waitForTimeout(6000);
await shot('1985-night');
await page.evaluate(() => window.chronoblock.rig.applyPreset(6, true));
await page.waitForTimeout(4000);
await shot('1985-night-kerb');

// night 2055
await page.evaluate(() => window.chronoblock.ui.select(5));
await page.waitForTimeout(9000);
await page.evaluate(() => window.chronoblock.rig.applyPreset(0, true));
await page.waitForTimeout(4000);
await shot('2055-night');

// inspector
await page.evaluate(() => window.chronoblock.setNight(false));
await page.evaluate(() => window.chronoblock.ui.select(0));
await page.waitForTimeout(9000);
await page.evaluate(() => window.chronoblock.rig.applyPreset(4, true));
await page.waitForTimeout(3500);
await page.mouse.click(700, 430);
await page.waitForTimeout(700);
await shot('1945-inspect');
console.log('inspector visible:', await page.evaluate(() => document.getElementById('inspector').classList.contains('is-live')));
console.log('inspector text:', await page.evaluate(() => document.getElementById('inspector-name').textContent));

await browser.close();
if (errors.length) {
  console.log(`\n=== ${errors.length} problems ===`);
  for (const e of [...new Set(errors)].slice(0, 30)) console.log(e);
  process.exitCode = 1;
} else console.log('\nno console errors');
