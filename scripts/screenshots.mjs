/**
 * Visual QA: walks the page and writes a screenshot per section.
 *
 *   node scripts/screenshots.mjs [outDir] [--mobile]
 *
 * WebGL runs under SwiftShader here, so each frame takes seconds — the waits
 * are generous on purpose.
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const out = process.argv[2] ?? '.screenshots'
const mobile = process.argv.includes('--mobile')
const url = process.env.SITE ?? 'http://127.0.0.1:5173/'
const viewport = mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 }

mkdirSync(out, { recursive: true })

const browser = await chromium.launch({
  args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader'],
})
const page = await browser.newPage({ viewport })

const problems = new Set()
page.on('console', (m) => m.type() === 'error' && problems.add(m.text().slice(0, 240)))
page.on('pageerror', (e) => problems.add(e.message.slice(0, 240)))

const goto = (selector) =>
  page.evaluate((s) => {
    const el = document.querySelector(s)
    if (el)
      window.scrollTo({
        top: window.scrollY + el.getBoundingClientRect().top,
        behavior: 'instant',
      })
  }, selector)

const shot = async (name, wait) => {
  await page.waitForTimeout(wait)
  await page.screenshot({ path: `${out}/${name}.png`, timeout: 240000 })
  console.log('→', name)
}

await page.goto(url, { waitUntil: 'load', timeout: 120000 })
await shot('01-hero', 16000)

for (const [selector, name, wait] of [
  ['#house', '02-house', 4000],
  ['#collection', '03-collection', 4000],
  ['#solstice', '04-solstice', 28000],
  ['#meridian', '05-meridian', 32000],
  ['#visit', '06-visit', 3000],
]) {
  await goto(selector)
  await shot(name, wait)
}

console.log(problems.size ? [...problems].join('\n') : 'no console errors')
await browser.close()
