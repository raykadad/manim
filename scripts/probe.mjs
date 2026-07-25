import { chromium } from 'playwright'

const URL = process.env.SITE ?? 'http://127.0.0.1:5173/'
const OUT = process.env.OUT ?? '/tmp'
const browser = await chromium.launch({
  args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader'],
})
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
const seen = new Set()
page.on('console', (m) => {
  const t = `[${m.type()}] ${m.text().slice(0, 240)}`
  if ((m.type() === 'error' || m.type() === 'warning') && !seen.has(t)) {
    seen.add(t)
    console.log(t)
  }
})
page.on('pageerror', (e) => console.log('[pageerror]', e.message.slice(0, 500)))

await page.goto(URL, { waitUntil: 'load', timeout: 120000 })
await page.waitForTimeout(14000)
await page.screenshot({ path: `${OUT}/probe-hero.png`, timeout: 180000 })
console.log('hero shot')

if (process.env.CARD !== '0') {
  await page.evaluate(() => document.querySelector('#solstice')?.scrollIntoView())
  await page.waitForTimeout(22000)
  await page.screenshot({ path: `${OUT}/probe-card.png`, timeout: 180000 })
  console.log('card shot')
}
await browser.close()
