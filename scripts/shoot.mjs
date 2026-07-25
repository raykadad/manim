import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const OUT = process.argv[2] ?? '/tmp/shots'
const URL = process.env.SITE ?? 'http://127.0.0.1:5173/'
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({
  args: [
    '--enable-unsafe-swiftshader',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--ignore-gpu-blocklist',
    '--disable-gpu-sandbox',
  ],
})
const page = await browser.newPage({
  viewport: { width: 1600, height: 1000 },
  deviceScaleFactor: 1,
})

const errors = []
page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${m.type()}] ${m.text()}`)
})
page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`))

console.log('loading', URL)
await page.goto(URL, { waitUntil: 'load', timeout: 120000 })
await page.waitForTimeout(25000)

await page.screenshot({ path: `${OUT}/01-hero.png` })

// let the camera swing round
await page.waitForTimeout(9000)
await page.screenshot({ path: `${OUT}/02-hero-later.png` })

await page.evaluate(() => document.querySelector('#house')?.scrollIntoView())
await page.waitForTimeout(3500)
await page.screenshot({ path: `${OUT}/03-about.png` })

await page.evaluate(() => window.scrollBy(0, 900))
await page.waitForTimeout(3000)
await page.screenshot({ path: `${OUT}/04-materials.png` })

await page.evaluate(() => document.querySelector('#solstice')?.scrollIntoView())
await page.waitForTimeout(18000)
await page.screenshot({ path: `${OUT}/05-solstice.png` })

await page.evaluate(() => document.querySelector('#meridian')?.scrollIntoView())
await page.waitForTimeout(20000)
await page.screenshot({ path: `${OUT}/06-meridian.png` })

await page.evaluate(() => document.querySelector('#visit')?.scrollIntoView())
await page.waitForTimeout(2500)
await page.screenshot({ path: `${OUT}/07-visit.png` })

await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
await page.waitForTimeout(2000)
await page.screenshot({ path: `${OUT}/08-footer.png` })

console.log('--- console ---')
console.log([...new Set(errors)].slice(0, 40).join('\n') || 'clean')
await browser.close()
