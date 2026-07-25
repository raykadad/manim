import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const OUT = process.env.OUT ?? '/tmp/sec'
const URL = process.env.SITE ?? 'http://127.0.0.1:5173/'
const TARGET = process.argv[2] ?? '#meridian'
const WAIT = Number(process.argv[3] ?? 26000)
const NAME = process.argv[4] ?? TARGET.replace('#', '')
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({
  args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader'],
})
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
page.on('pageerror', (e) => console.log('[pageerror]', e.message.slice(0, 300)))
page.on('console', (m) => {
  if (m.type() === 'error') console.log('[error]', m.text().slice(0, 240))
})

await page.goto(URL, { waitUntil: 'load', timeout: 120000 })
await page.waitForTimeout(3000)
await page.evaluate((t) => {
  const el = document.querySelector(t)
  if (el) window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top, behavior: 'instant' })
}, TARGET)
await page.waitForTimeout(WAIT)
await page.screenshot({ path: `${OUT}/${NAME}.png`, timeout: 240000 })
console.log('shot', NAME)
await browser.close()
